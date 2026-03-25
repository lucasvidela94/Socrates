import * as fs from "fs/promises";

export interface ExtractedPage {
  text: string;
  pageNumber: number;
}

export interface ExtractionResult {
  text: string;
  pages: ExtractedPage[];
}

export async function extractText(mimeType: string, filePath: string): Promise<ExtractionResult> {
  if (mimeType === "application/pdf") {
    return extractPdf(filePath);
  } else if (
    mimeType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    mimeType === "application/msword"
  ) {
    return extractDocx(filePath);
  } else if (mimeType === "text/plain" || mimeType === "text/markdown") {
    return extractPlainText(filePath);
  } else {
    throw new Error(`Tipo de archivo no soportado: ${mimeType}`);
  }
}

async function extractPdf(filePath: string): Promise<ExtractionResult> {
  const pdfParseModule = await import("pdf-parse");
  const pdfParse = (pdfParseModule as unknown as { default: (buffer: Buffer) => Promise<{ text?: string }> }).default;
  const buffer = await fs.readFile(filePath);
  const data = await pdfParse(buffer);
  const text = data.text || "";
  const pages: ExtractedPage[] = [{ text, pageNumber: 1 }];
  return { text, pages };
}

async function extractDocx(filePath: string): Promise<ExtractionResult> {
  const mammoth = await import("mammoth");
  const buffer = await fs.readFile(filePath);
  const result = await mammoth.extractRawText({ buffer });
  const text = result.value || "";
  return { text, pages: [{ text, pageNumber: 1 }] };
}

async function extractPlainText(filePath: string): Promise<ExtractionResult> {
  const text = await fs.readFile(filePath, "utf-8");
  return { text, pages: [{ text, pageNumber: 1 }] };
}
