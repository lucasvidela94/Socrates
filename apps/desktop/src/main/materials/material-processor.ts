import * as fs from "fs/promises";
import * as path from "path";
import { app } from "electron";
import { eq } from "drizzle-orm";
import { getDatabase } from "../db";
import * as schema from "../db/schema";
import { extractText } from "./text-extractor";
import { chunkText } from "./chunker";

function getStorageDir(classroomId: string): string {
  return path.join(app.getPath("userData"), "materials", classroomId);
}

export async function processMaterial(params: {
  classroomId: string;
  teacherId: string;
  title: string;
  subject?: string;
  sourceFilePath: string;
  fileName: string;
  mimeType: string;
}): Promise<typeof schema.materials.$inferSelect> {
  const db = getDatabase();
  const storageDir = getStorageDir(params.classroomId);
  await fs.mkdir(storageDir, { recursive: true });

  // Insert material with pending status
  const [material] = await db
    .insert(schema.materials)
    .values({
      classroomId: params.classroomId,
      teacherId: params.teacherId,
      title: params.title,
      fileName: params.fileName,
      filePath: "",
      mimeType: params.mimeType,
      subject: params.subject ?? null,
      status: "pending",
    })
    .returning();

  const destFileName = `${material.id}-${params.fileName}`;
  const destPath = path.join(storageDir, destFileName);

  try {
    // Copy file to storage
    await fs.copyFile(params.sourceFilePath, destPath);

    // Get file size
    const stat = await fs.stat(destPath);

    // Update file path and status to processing
    await db
      .update(schema.materials)
      .set({ filePath: destPath, fileSizeBytes: stat.size, status: "processing" })
      .where(eq(schema.materials.id, material.id));

    // Extract text
    const extracted = await extractText(params.mimeType, destPath);

    const chunks = extracted.pages.length > 0
      ? extracted.pages.flatMap((page) => chunkText(page.text, page.pageNumber))
      : chunkText(extracted.text);

    // Insert chunks
    if (chunks.length > 0) {
      let runningChunkIndex = 0;
      await db.insert(schema.materialChunks).values(
        chunks.map((c) => ({
          materialId: material.id,
          chunkIndex: runningChunkIndex++,
          content: c.content,
          tokenEstimate: c.tokenEstimate,
          pageNumber: c.pageNumber,
        }))
      );
    }

    // Update status to ready
    const [updated] = await db
      .update(schema.materials)
      .set({ status: "ready" })
      .where(eq(schema.materials.id, material.id))
      .returning();

    return updated;
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    // Try to clean up destination file
    try {
      await fs.unlink(destPath);
    } catch {
      // ignore cleanup errors
    }
    const [failed] = await db
      .update(schema.materials)
      .set({ status: "error", errorMessage })
      .where(eq(schema.materials.id, material.id))
      .returning();
    return failed;
  }
}

export async function deleteMaterialFile(filePath: string): Promise<void> {
  try {
    await fs.unlink(filePath);
  } catch (err: unknown) {
    // If file doesn't exist, that's fine
    if ((err as NodeJS.ErrnoException).code !== "ENOENT") {
      throw err;
    }
  }
}
