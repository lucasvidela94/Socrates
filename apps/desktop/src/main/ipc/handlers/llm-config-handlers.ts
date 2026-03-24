import { ipcMain, type IpcMainInvokeEvent } from "electron";
import { eq } from "drizzle-orm";
import { IPC_CHANNELS } from "../../../shared/channels";
import { getDatabase, schema } from "../../db";
import type { LlmConfigInput } from "../../../shared/types";

const DEFAULT_TEACHER_NAME = "Docente";

const ensureDefaultTeacher = async (): Promise<string> => {
  const db = getDatabase();
  const existing = await db.select().from(schema.teachers).limit(1);
  if (existing.length > 0) return existing[0].id;

  const [teacher] = await db
    .insert(schema.teachers)
    .values({ name: DEFAULT_TEACHER_NAME })
    .returning();
  return teacher.id;
};

const DEFAULT_URLS: Record<string, string> = {
  openai: "https://api.openai.com/v1",
  openrouter: "https://openrouter.ai/api/v1",
  gemini: "https://generativelanguage.googleapis.com/v1beta/openai",
};

export const registerLlmConfigHandlers = (): void => {
  ipcMain.handle(
    IPC_CHANNELS.GET_LLM_CONFIG,
    async (_event: IpcMainInvokeEvent) => {
      const db = getDatabase();
      const rows = await db
        .select()
        .from(schema.llmConfig)
        .where(eq(schema.llmConfig.isDefault, true))
        .limit(1);
      return rows[0] ?? null;
    }
  );

  ipcMain.handle(
    IPC_CHANNELS.SAVE_LLM_CONFIG,
    async (_event: IpcMainInvokeEvent, input: LlmConfigInput) => {
      const db = getDatabase();
      const teacherId = await ensureDefaultTeacher();

      const existing = await db
        .select()
        .from(schema.llmConfig)
        .where(eq(schema.llmConfig.isDefault, true))
        .limit(1);

      if (existing.length > 0) {
        const [updated] = await db
          .update(schema.llmConfig)
          .set({
            provider: input.provider,
            model: input.model,
            apiKey: input.apiKey ?? null,
            baseUrl: input.baseUrl ?? null,
            settings: (input.settings as Record<string, unknown>) ?? null,
            updatedAt: new Date(),
          })
          .where(eq(schema.llmConfig.id, existing[0].id))
          .returning();
        return updated;
      }

      const [created] = await db
        .insert(schema.llmConfig)
        .values({
          teacherId,
          provider: input.provider,
          model: input.model,
          apiKey: input.apiKey ?? null,
          baseUrl: input.baseUrl ?? null,
          settings: (input.settings as Record<string, unknown>) ?? null,
          isDefault: true,
        })
        .returning();
      return created;
    }
  );

  ipcMain.handle(
    IPC_CHANNELS.DELETE_LLM_CONFIG,
    async (_event: IpcMainInvokeEvent, id: string) => {
      const db = getDatabase();
      await db.delete(schema.llmConfig).where(eq(schema.llmConfig.id, id));
    }
  );

  ipcMain.handle(
    IPC_CHANNELS.TEST_LLM_CONNECTION,
    async (_event: IpcMainInvokeEvent, input: LlmConfigInput) => {
      try {
        const baseUrl = input.baseUrl || DEFAULT_URLS[input.provider] || DEFAULT_URLS.openai;
        const url = `${baseUrl}/chat/completions`;

        const headers: Record<string, string> = {
          Authorization: `Bearer ${input.apiKey}`,
          "Content-Type": "application/json",
        };

        if (input.provider === "openrouter") {
          headers["X-Title"] = "Socrates";
          headers["HTTP-Referer"] = "https://socrates.local";
        }

        const response = await fetch(url, {
          method: "POST",
          headers,
          body: JSON.stringify({
            model: input.model,
            messages: [{ role: "user", content: "Responde solo: ok" }],
            max_tokens: 5,
          }),
          signal: AbortSignal.timeout(15000),
        });

        if (response.ok) {
          return { ok: true };
        }

        const body = await response.json().catch(() => ({}));
        const errorMsg =
          (body as Record<string, Record<string, string>>)?.error?.message ??
          `HTTP ${response.status}`;
        return { ok: false, error: errorMsg };
      } catch (err) {
        return {
          ok: false,
          error: err instanceof Error ? err.message : "Error de conexión",
        };
      }
    }
  );
};
