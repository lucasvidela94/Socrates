import { dialog } from "electron";
import { ipcMain, type IpcMainInvokeEvent } from "electron";
import { desc, eq } from "drizzle-orm";
import * as fs from "fs/promises";
import { IPC_CHANNELS } from "../../../shared/channels";
import { getDatabase, schema } from "../../db";
import { documentRowToBuffer } from "../../docx/docx-export";
import type { DocumentSaveApprovedInput } from "../../../shared/types";

const ensureTeacher = async (): Promise<string> => {
  const db = getDatabase();
  const existing = await db.select().from(schema.teachers).limit(1);
  if (existing.length > 0) return existing[0].id;
  const [t] = await db.insert(schema.teachers).values({ name: "Docente" }).returning();
  return t.id;
};

const ensureProfile = async (studentId: string) => {
  const db = getDatabase();
  const rows = await db
    .select()
    .from(schema.studentProfiles)
    .where(eq(schema.studentProfiles.studentId, studentId))
    .limit(1);
  if (rows.length > 0) return rows[0];
  const [p] = await db
    .insert(schema.studentProfiles)
    .values({ studentId })
    .returning();
  return p;
};

export const registerDocumentsHandlers = (): void => {
  ipcMain.handle(IPC_CHANNELS.DOCUMENTS_LIST, async (_event: IpcMainInvokeEvent) => {
    const db = getDatabase();
    return db
      .select()
      .from(schema.documents)
      .orderBy(desc(schema.documents.createdAt));
  });

  ipcMain.handle(IPC_CHANNELS.DOCUMENT_GET, async (_event: IpcMainInvokeEvent, id: string) => {
    const db = getDatabase();
    const rows = await db
      .select()
      .from(schema.documents)
      .where(eq(schema.documents.id, id))
      .limit(1);
    return rows[0] ?? null;
  });

  ipcMain.handle(
    IPC_CHANNELS.DOCUMENT_SAVE_APPROVED,
    async (_event: IpcMainInvokeEvent, input: DocumentSaveApprovedInput) => {
      const db = getDatabase();
      const teacherId = await ensureTeacher();

      let content: Record<string, unknown>;
      try {
        content = JSON.parse(input.messageContent) as Record<string, unknown>;
      } catch {
        content = { rawText: input.messageContent, _fallback: true };
      }

      const [doc] = await db
        .insert(schema.documents)
        .values({
          type: input.agentType,
          title: input.title,
          content,
          classroomId: input.classroomId ?? null,
          teacherId,
        })
        .returning();

      if (
        input.studentId !== undefined &&
        input.studentId !== "" &&
        input.recordLearningNote === true
      ) {
        const profile = await ensureProfile(input.studentId);
        const summary =
          typeof content.summary === "string"
            ? content.summary
            : `Documento aprobado y guardado: ${input.title}`;
        await db.insert(schema.learningNotes).values({
          studentProfileId: profile.id,
          observation: summary.slice(0, 4000),
          category: "aprobación asistente",
        });
      }

      return doc;
    }
  );

  ipcMain.handle(
    IPC_CHANNELS.DOCUMENT_EXPORT_DOCX,
    async (_event: IpcMainInvokeEvent, documentId: string) => {
      const db = getDatabase();
      const rows = await db
        .select()
        .from(schema.documents)
        .where(eq(schema.documents.id, documentId))
        .limit(1);
      const row = rows[0];
      if (row === undefined) {
        return { ok: false as const, error: "Documento no encontrado" };
      }

      const buffer = await documentRowToBuffer({
        title: row.title,
        type: row.type,
        content: row.content,
      });

      const safeName = row.title.replace(/[/\\?%*:|"<>]/g, "-").slice(0, 120);
      const { filePath, canceled } = await dialog.showSaveDialog({
        title: "Guardar documento",
        defaultPath: `${safeName || "documento"}.docx`,
        filters: [{ name: "Word", extensions: ["docx"] }],
      });

      if (canceled === true || filePath === undefined) {
        return { ok: false as const, error: "Cancelado" };
      }

      await fs.writeFile(filePath, buffer);
      return { ok: true as const, path: filePath };
    }
  );
};
