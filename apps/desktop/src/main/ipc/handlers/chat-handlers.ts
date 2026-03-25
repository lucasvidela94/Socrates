import { ipcMain, type IpcMainInvokeEvent } from "electron";
import { and, desc, eq } from "drizzle-orm";
import { IPC_CHANNELS } from "../../../shared/channels";
import { getDatabase, schema } from "../../db";
import { getSidecarClient } from "../../sidecar";
import { buildEnrichedAgentContext } from "../context-enrichment";
import type {
  ChatApplyCorrectionsInput,
  ChatSendInput,
  ChatVerifyInput,
  MessageVerification,
  VerificationCorrection,
} from "../../../shared/types";

function stripJsonFences(raw: string): string {
  let t = raw.trim();
  if (t.startsWith("```")) {
    t = t.replace(/^```(?:json)?\s*/i, "");
    t = t.replace(/\s*```$/, "");
  }
  return t.trim();
}

function parseVerificationResponse(text: string): MessageVerification {
  try {
    const raw = stripJsonFences(text);
    const o = JSON.parse(raw) as Record<string, unknown>;
    const approved = Boolean(o.approved);
    const correctionsRaw = Array.isArray(o.corrections) ? o.corrections : [];
    const corrections: VerificationCorrection[] = correctionsRaw.map((c) => {
      const r = c as Record<string, unknown>;
      return {
        type: typeof r.type === "string" ? r.type : "grammar",
        original: typeof r.original === "string" ? r.original : "",
        corrected: typeof r.corrected === "string" ? r.corrected : "",
        reason: typeof r.reason === "string" ? r.reason : "",
      };
    });
    const corrected_content =
      typeof o.corrected_content === "string" ? o.corrected_content : undefined;
    return {
      approved,
      corrections,
      corrected_content,
      verifiedAt: new Date().toISOString(),
    };
  } catch {
    return {
      approved: false,
      corrections: [],
      error: "No se pudo interpretar la respuesta del verificador",
      verifiedAt: new Date().toISOString(),
    };
  }
}

const ensureTeacher = async (): Promise<string> => {
  const db = getDatabase();
  const existing = await db.select().from(schema.teachers).limit(1);
  if (existing.length > 0) return existing[0].id;
  const [t] = await db.insert(schema.teachers).values({ name: "Docente" }).returning();
  return t.id;
};

export const registerChatHandlers = (): void => {
  ipcMain.handle(
    IPC_CHANNELS.CHAT_CREATE_CONVERSATION,
    async (_event: IpcMainInvokeEvent, agentType: string) => {
      const db = getDatabase();
      const teacherId = await ensureTeacher();
      const [conv] = await db
        .insert(schema.conversations)
        .values({ teacherId, agentType })
        .returning();
      return conv;
    }
  );

  ipcMain.handle(
    IPC_CHANNELS.CHAT_GET_CONVERSATIONS,
    async (_event: IpcMainInvokeEvent) => {
      const db = getDatabase();
      return db
        .select()
        .from(schema.conversations)
        .orderBy(desc(schema.conversations.createdAt));
    }
  );

  ipcMain.handle(
    IPC_CHANNELS.CHAT_GET_MESSAGES,
    async (_event: IpcMainInvokeEvent, conversationId: string) => {
      const db = getDatabase();
      return db
        .select()
        .from(schema.messages)
        .where(eq(schema.messages.conversationId, conversationId))
        .orderBy(schema.messages.createdAt);
    }
  );

  ipcMain.handle(
    IPC_CHANNELS.CHAT_SEND,
    async (_event: IpcMainInvokeEvent, input: ChatSendInput) => {
      const db = getDatabase();

      const [userMsg] = await db
        .insert(schema.messages)
        .values({
          conversationId: input.conversationId,
          role: "user",
          content: input.message,
        })
        .returning();

      const client = getSidecarClient();
      let assistantContent: string;

      if (client === null) {
        assistantContent = "El sidecar de agentes no está conectado. Verificá que Elixir esté corriendo.";
      } else {
        const llmConfig = await db
          .select()
          .from(schema.llmConfig)
          .where(eq(schema.llmConfig.isDefault, true))
          .limit(1);

        const config = llmConfig[0] ?? null;

        try {
          const rawCtx = input.context ?? {};
          const studentIdsArg = Array.isArray(rawCtx.studentIds)
            ? (rawCtx.studentIds as string[])
            : undefined;
          const enrichment = await buildEnrichedAgentContext(db, {
            classroomId:
              typeof rawCtx.classroomId === "string" ? rawCtx.classroomId : undefined,
            studentIds: studentIdsArg,
            omitStudents: rawCtx.omitStudents === true,
            userMessage: input.message,
          });
          const response = await client.sendRequestAndWait(
            input.agentType,
            input.message,
            {
              ...rawCtx,
              classroom: enrichment.classroom,
              students: enrichment.students,
              materials: enrichment.materials,
              curriculum: enrichment.curriculum,
              llm_config: config
                ? {
                    provider: config.provider,
                    model: config.model,
                    api_key: config.apiKey,
                    base_url: config.baseUrl,
                  }
                : null,
            }
          );
          assistantContent = response;
        } catch (err) {
          assistantContent =
            err instanceof Error
              ? `Error del agente: ${err.message}`
              : "Error desconocido del agente";
        }
      }

      const [assistantMsg] = await db
        .insert(schema.messages)
        .values({
          conversationId: input.conversationId,
          role: "assistant",
          content: assistantContent,
          metadata: { agentType: input.agentType },
        })
        .returning();

      return {
        conversationId: input.conversationId,
        agentType: input.agentType,
        userMessage: userMsg,
        assistantMessage: assistantMsg,
      };
    }
  );

  ipcMain.handle(
    IPC_CHANNELS.CHAT_VERIFY,
    async (_event: IpcMainInvokeEvent, input: ChatVerifyInput) => {
      const db = getDatabase();
      const rows = await db
        .select()
        .from(schema.messages)
        .where(
          and(
            eq(schema.messages.id, input.messageId),
            eq(schema.messages.conversationId, input.conversationId)
          )
        )
        .limit(1);
      const row = rows[0];
      if (row === undefined || row.role !== "assistant") {
        throw new Error("Mensaje no encontrado");
      }

      const client = getSidecarClient();
      if (client === null) {
        throw new Error("Sidecar no conectado");
      }

      const llmConfig = await db
        .select()
        .from(schema.llmConfig)
        .where(eq(schema.llmConfig.isDefault, true))
        .limit(1);
      const config = llmConfig[0] ?? null;
      if (config === null || config.apiKey === null) {
        throw new Error("Configurá el LLM en Ajustes");
      }

      const rawCtx = input.context ?? {};
      const studentIdsArg = Array.isArray(rawCtx.studentIds)
        ? (rawCtx.studentIds as string[])
        : undefined;
      const enrichment = await buildEnrichedAgentContext(db, {
        classroomId: typeof rawCtx.classroomId === "string" ? rawCtx.classroomId : undefined,
        studentIds: studentIdsArg,
        omitStudents: rawCtx.omitStudents === true,
        userMessage: input.content,
      });

      const contextPayload = {
        ...rawCtx,
        classroom: enrichment.classroom,
        students: enrichment.students,
        materials: enrichment.materials,
        curriculum: enrichment.curriculum,
        llm_config: {
          provider: config.provider,
          model: config.model,
          api_key: config.apiKey,
          base_url: config.baseUrl,
        },
      };

      let verification: MessageVerification;
      try {
        const llmText = await client.sendVerifyAndWait(input.content, contextPayload);
        verification = parseVerificationResponse(llmText);
      } catch (err) {
        verification = {
          approved: false,
          corrections: [],
          error: err instanceof Error ? err.message : "Error del verificador",
          verifiedAt: new Date().toISOString(),
        };
      }

      const existingMeta =
        row.metadata !== null && typeof row.metadata === "object" && !Array.isArray(row.metadata)
          ? { ...(row.metadata as Record<string, unknown>) }
          : {};
      const nextMeta = { ...existingMeta, verification };

      const updatedRows = await db
        .update(schema.messages)
        .set({ metadata: nextMeta })
        .where(
          and(
            eq(schema.messages.id, input.messageId),
            eq(schema.messages.conversationId, input.conversationId)
          )
        )
        .returning();

      const updated = updatedRows[0];
      if (updated === undefined) throw new Error("No se pudo actualizar el mensaje");
      return updated;
    }
  );

  ipcMain.handle(
    IPC_CHANNELS.CHAT_MESSAGE_APPLY_CORRECTIONS,
    async (_event: IpcMainInvokeEvent, input: ChatApplyCorrectionsInput) => {
      const db = getDatabase();
      const rows = await db
        .select()
        .from(schema.messages)
        .where(
          and(
            eq(schema.messages.id, input.messageId),
            eq(schema.messages.conversationId, input.conversationId)
          )
        )
        .limit(1);
      const row = rows[0];
      if (row === undefined || row.role !== "assistant") {
        throw new Error("Mensaje no encontrado");
      }

      const existingMeta =
        row.metadata !== null && typeof row.metadata === "object" && !Array.isArray(row.metadata)
          ? { ...(row.metadata as Record<string, unknown>) }
          : {};
      const prevVerification = existingMeta.verification;
      const nextVerification =
        prevVerification !== null &&
        typeof prevVerification === "object" &&
        !Array.isArray(prevVerification)
          ? { ...(prevVerification as Record<string, unknown>), applied: true }
          : { applied: true };

      const nextMeta = {
        ...existingMeta,
        verification: nextVerification,
      };

      const updatedRows = await db
        .update(schema.messages)
        .set({ content: input.content, metadata: nextMeta })
        .where(
          and(
            eq(schema.messages.id, input.messageId),
            eq(schema.messages.conversationId, input.conversationId)
          )
        )
        .returning();

      const updated = updatedRows[0];
      if (updated === undefined) throw new Error("No se pudo actualizar el mensaje");
      return updated;
    }
  );
};
