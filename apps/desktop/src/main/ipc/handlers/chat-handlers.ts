import { ipcMain, type IpcMainInvokeEvent } from "electron";
import { eq, desc } from "drizzle-orm";
import { IPC_CHANNELS } from "../../../shared/channels";
import { getDatabase, schema } from "../../db";
import { getSidecarClient } from "../../sidecar";
import { buildEnrichedAgentContext } from "../context-enrichment";
import type { ChatSendInput } from "../../../shared/types";

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
          });
          const response = await client.sendRequestAndWait(
            input.agentType,
            input.message,
            {
              ...rawCtx,
              classroom: enrichment.classroom,
              students: enrichment.students,
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
};
