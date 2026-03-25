import { ipcMain, dialog, type IpcMainInvokeEvent } from "electron";
import { eq } from "drizzle-orm";
import { IPC_CHANNELS } from "../../../shared/channels";
import { getDatabase, schema } from "../../db";
import { processMaterial, deleteMaterialFile } from "../../materials/material-processor";

const ALLOWED_EXTENSIONS = ["pdf", "docx", "doc", "txt", "md"];
const MIME_MAP: Record<string, string> = {
  pdf: "application/pdf",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  doc: "application/msword",
  txt: "text/plain",
  md: "text/markdown",
};

function getMimeType(filePath: string): string {
  const ext = filePath.split(".").pop()?.toLowerCase() ?? "";
  return MIME_MAP[ext] ?? "application/octet-stream";
}

const ensureTeacher = async (): Promise<string> => {
  const db = getDatabase();
  const existing = await db.select().from(schema.teachers).limit(1);
  if (existing.length > 0) return existing[0].id;
  const [t] = await db.insert(schema.teachers).values({ name: "Docente" }).returning();
  return t.id;
};

export const registerMaterialsHandlers = (): void => {
  ipcMain.handle(
    IPC_CHANNELS.MATERIALS_UPLOAD,
    async (_event: IpcMainInvokeEvent, classroomId: string, title?: string, subject?: string) => {
      const result = await dialog.showOpenDialog({
        title: "Seleccionar material de referencia",
        filters: [
          { name: "Documentos", extensions: ALLOWED_EXTENSIONS },
        ],
        properties: ["openFile"],
      });

      if (result.canceled || result.filePaths.length === 0) {
        return { cancelled: true };
      }

      const filePath = result.filePaths[0];
      const fileName = filePath.split(/[\\/]/).pop() ?? "archivo";
      const mimeType = getMimeType(filePath);
      const teacherId = await ensureTeacher();

      const material = await processMaterial({
        classroomId,
        teacherId,
        title: title ?? fileName,
        subject,
        sourceFilePath: filePath,
        fileName,
        mimeType,
      });

      return { cancelled: false, material };
    }
  );

  ipcMain.handle(
    IPC_CHANNELS.MATERIALS_LIST,
    async (_event: IpcMainInvokeEvent, classroomId: string) => {
      const db = getDatabase();
      return db
        .select()
        .from(schema.materials)
        .where(eq(schema.materials.classroomId, classroomId))
        .orderBy(schema.materials.createdAt);
    }
  );

  ipcMain.handle(
    IPC_CHANNELS.MATERIAL_GET,
    async (_event: IpcMainInvokeEvent, materialId: string) => {
      const db = getDatabase();
      const rows = await db
        .select()
        .from(schema.materials)
        .where(eq(schema.materials.id, materialId))
        .limit(1);
      return rows[0] ?? null;
    }
  );

  ipcMain.handle(
    IPC_CHANNELS.MATERIAL_DELETE,
    async (_event: IpcMainInvokeEvent, materialId: string) => {
      const db = getDatabase();
      const rows = await db
        .select()
        .from(schema.materials)
        .where(eq(schema.materials.id, materialId))
        .limit(1);
      const material = rows[0];
      if (!material) return;

      await db.delete(schema.materials).where(eq(schema.materials.id, materialId));
      if (material.filePath) {
        await deleteMaterialFile(material.filePath);
      }
    }
  );

  ipcMain.handle(
    IPC_CHANNELS.MATERIAL_CHUNKS,
    async (_event: IpcMainInvokeEvent, materialId: string) => {
      const db = getDatabase();
      return db
        .select()
        .from(schema.materialChunks)
        .where(eq(schema.materialChunks.materialId, materialId))
        .orderBy(schema.materialChunks.chunkIndex);
    }
  );
};
