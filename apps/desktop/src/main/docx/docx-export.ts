import {
  Document,
  HeadingLevel,
  Packer,
  Paragraph,
  TextRun,
} from "docx";

interface DocumentRowLike {
  title: string;
  type: string;
  content: unknown;
}

const isRecord = (v: unknown): v is Record<string, unknown> =>
  v !== null && typeof v === "object" && !Array.isArray(v);

const blockFromUnknown = (b: unknown): Paragraph[] => {
  if (!isRecord(b)) return [];
  const type = String(b.type ?? "paragraph");
  const text = String(b.text ?? "");
  if (type === "heading") {
    return [
      new Paragraph({
        text,
        heading: HeadingLevel.HEADING_2,
      }),
    ];
  }
  return [new Paragraph({ children: [new TextRun(text)] })];
};

export const documentRowToBuffer = async (row: DocumentRowLike): Promise<Buffer> => {
  const children: Paragraph[] = [
    new Paragraph({
      text: row.title,
      heading: HeadingLevel.TITLE,
    }),
    new Paragraph({
      children: [new TextRun({ text: `Tipo: ${row.type}`, italics: true })],
    }),
  ];

  const content = row.content;

  if (isRecord(content) && content._fallback === true && typeof content.rawText === "string") {
    children.push(
      new Paragraph({
        children: [new TextRun(content.rawText)],
      })
    );
  } else if (isRecord(content) && Array.isArray(content.blocks)) {
    for (const b of content.blocks) {
      children.push(...blockFromUnknown(b));
    }
    if (typeof content.summary === "string" && content.summary.trim() !== "") {
      children.push(
        new Paragraph({
          text: "Resumen",
          heading: HeadingLevel.HEADING_2,
        }),
        new Paragraph({ children: [new TextRun(content.summary)] })
      );
    }
  } else if (isRecord(content)) {
    for (const [k, v] of Object.entries(content)) {
      if (k.startsWith("_")) continue;
      children.push(
        new Paragraph({
          text: k,
          heading: HeadingLevel.HEADING_2,
        }),
        new Paragraph({
          children: [
            new TextRun(typeof v === "string" ? v : JSON.stringify(v, null, 2)),
          ],
        })
      );
    }
  } else if (content !== null && content !== undefined) {
    children.push(
      new Paragraph({
        children: [new TextRun(String(content))],
      })
    );
  }

  const doc = new Document({
    sections: [
      {
        children,
      },
    ],
  });

  const buf = await Packer.toBuffer(doc);
  return Buffer.from(buf);
};
