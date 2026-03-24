import { ipcMain, type IpcMainInvokeEvent } from "electron";
import { eq } from "drizzle-orm";
import { IPC_CHANNELS } from "../../../shared/channels";
import { getDatabase, schema } from "../../db";
import { startOpenRouterOAuth } from "../../oauth/openrouter-oauth";

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

const DEFAULT_MODEL = "openai/gpt-4o-mini";

export const registerOAuthHandlers = (): void => {
  ipcMain.handle(
    IPC_CHANNELS.OAUTH_START_OPENROUTER,
    async (_event: IpcMainInvokeEvent) => {
      const result = await startOpenRouterOAuth();

      if (!result.ok) {
        return { ok: false, error: result.error };
      }

      const db = getDatabase();
      const teacherId = await ensureDefaultTeacher();

      const existing = await db
        .select()
        .from(schema.llmConfig)
        .where(eq(schema.llmConfig.isDefault, true))
        .limit(1);

      if (existing.length > 0) {
        await db
          .update(schema.llmConfig)
          .set({
            provider: "openrouter",
            model: DEFAULT_MODEL,
            apiKey: result.apiKey,
            baseUrl: "https://openrouter.ai/api/v1",
            updatedAt: new Date(),
          })
          .where(eq(schema.llmConfig.id, existing[0].id));
      } else {
        await db
          .insert(schema.llmConfig)
          .values({
            teacherId,
            provider: "openrouter",
            model: DEFAULT_MODEL,
            apiKey: result.apiKey,
            baseUrl: "https://openrouter.ai/api/v1",
            isDefault: true,
          });
      }

      return { ok: true };
    }
  );
};
