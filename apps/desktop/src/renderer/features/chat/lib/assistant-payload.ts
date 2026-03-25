export interface ParsedAssistantPayload {
  title: string;
  parsed: Record<string, unknown> | null;
  cleanText: string;
  truncated: boolean;
}

function stripCodeFences(s: string): string {
  let t = s.trim();
  if (t.startsWith("```")) {
    t = t.replace(/^```(?:json)?\s*/i, "");
    t = t.replace(/\s*```\s*$/m, "");
    t = t.trim();
  }
  return t;
}

function extractFirstJsonObject(s: string): string | null {
  const start = s.indexOf("{");
  if (start === -1) return null;
  let depth = 0;
  let inString = false;
  let escape = false;
  for (let i = start; i < s.length; i++) {
    const c = s[i]!;
    if (escape) {
      escape = false;
      continue;
    }
    if (c === "\\" && inString) {
      escape = true;
      continue;
    }
    if (c === '"') {
      inString = !inString;
      continue;
    }
    if (inString) continue;
    if (c === "{") depth++;
    else if (c === "}") {
      depth--;
      if (depth === 0) return s.slice(start, i + 1);
    }
  }
  return null;
}

function tryParseRecord(s: string): Record<string, unknown> | null {
  try {
    const o = JSON.parse(s) as unknown;
    if (o !== null && typeof o === "object" && !Array.isArray(o)) {
      return o as Record<string, unknown>;
    }
  } catch {
    // ignore
  }
  return null;
}

function extractJsonStringValue(s: string, key: string): string | null {
  const re = new RegExp(`"${key}"\\s*:\\s*"`);
  const m = re.exec(s);
  if (m === null) return null;
  const start = m.index! + m[0].length;
  let result = "";
  let escape = false;
  for (let i = start; i < s.length; i++) {
    const c = s[i]!;
    if (escape) {
      if (c === "n") result += "\n";
      else if (c === "t") result += "\t";
      else if (c === '"') result += '"';
      else if (c === "\\") result += "\\";
      else result += c;
      escape = false;
      continue;
    }
    if (c === "\\") {
      escape = true;
      continue;
    }
    if (c === '"') return result;
    result += c;
  }
  return result;
}

function extractCompleteBlocks(
  s: string
): Array<{ type?: string; text?: string }> {
  const blocks: Array<{ type?: string; text?: string }> = [];
  const re = /\{\s*"type"\s*:\s*"(heading|paragraph)"\s*,\s*"text"\s*:\s*"/g;
  let match: RegExpExecArray | null;
  while ((match = re.exec(s)) !== null) {
    const objStart = match.index!;
    const jsonObj = extractFirstJsonObject(s.slice(objStart));
    if (jsonObj !== null) {
      const parsed = tryParseRecord(jsonObj);
      if (parsed !== null && typeof parsed.text === "string") {
        blocks.push({
          type: typeof parsed.type === "string" ? parsed.type : "paragraph",
          text: parsed.text,
        });
      }
    }
  }
  return blocks;
}

function tryParsePartial(
  raw: string
): { parsed: Record<string, unknown>; truncated: boolean } | null {
  const title = extractJsonStringValue(raw, "title");
  const summary = extractJsonStringValue(raw, "summary");
  const blocks = extractCompleteBlocks(raw);

  if (title === null && blocks.length === 0) return null;

  const fullJsonObj = extractFirstJsonObject(raw);
  const isTruncated = fullJsonObj === null;

  const result: Record<string, unknown> = {};
  if (title !== null) result.title = title;
  if (summary !== null) result.summary = summary;
  result.blocks = blocks;

  return { parsed: result, truncated: isTruncated };
}

function looksLikeJson(s: string): boolean {
  const t = s.trimStart();
  if (t.startsWith("{") || t.startsWith("```json") || t.startsWith("```JSON")) return true;
  if (/```json/i.test(s)) return true;
  if (/"blocks"\s*:\s*\[/.test(s)) return true;
  return false;
}

export function parseMarkdownToBlocks(
  md: string
): Record<string, unknown> | null {
  const lines = md.split("\n");
  if (lines.length < 2) return null;

  let hasHeading = false;
  for (const l of lines) {
    if (/^#{1,3}\s/.test(l)) {
      hasHeading = true;
      break;
    }
  }
  if (!hasHeading) return null;

  let title: string | null = null;
  let summary: string | null = null;
  const blocks: Array<{ type: string; text: string }> = [];
  let pendingParagraph = "";
  let titleConsumed = false;
  let firstParagraphConsumed = false;

  const flushParagraph = () => {
    const text = pendingParagraph.trim();
    if (text === "") return;
    if (!titleConsumed) {
      titleConsumed = true;
      return;
    }
    if (!firstParagraphConsumed && title !== null) {
      summary = text;
      firstParagraphConsumed = true;
    } else {
      blocks.push({ type: "paragraph", text });
    }
    pendingParagraph = "";
  };

  for (const raw of lines) {
    const line = raw;

    const h1 = /^#\s+(.+)/.exec(line);
    if (h1) {
      flushParagraph();
      if (title === null) {
        title = h1[1]!.trim();
        titleConsumed = true;
      } else {
        blocks.push({ type: "heading", text: h1[1]!.trim() });
      }
      continue;
    }

    const h23 = /^#{2,3}\s+(.+)/.exec(line);
    if (h23) {
      flushParagraph();
      blocks.push({ type: "heading", text: h23[1]!.trim() });
      continue;
    }

    const listItem = /^[\-\*]\s+(.+)/.exec(line);
    if (listItem) {
      pendingParagraph += (pendingParagraph ? "\n" : "") + "- " + listItem[1]!.trim();
      continue;
    }

    if (line.trim() === "") {
      flushParagraph();
      pendingParagraph = "";
      continue;
    }

    pendingParagraph += (pendingParagraph ? "\n" : "") + line;
  }

  flushParagraph();

  if (title === null) return null;

  const result: Record<string, unknown> = { title };
  if (summary !== null) result.summary = summary;
  result.blocks = blocks;
  return result;
}

function blocksToText(parsed: Record<string, unknown>): string {
  const parts: string[] = [];

  if (typeof parsed.title === "string" && parsed.title.trim() !== "") {
    parts.push(parsed.title.trim());
    parts.push("");
  }
  if (typeof parsed.summary === "string" && parsed.summary.trim() !== "") {
    parts.push(parsed.summary.trim());
    parts.push("");
  }

  const blocks = (parsed.blocks ?? []) as Array<{
    type?: string;
    text?: string;
  }>;
  for (const b of blocks) {
    const text = String(b.text ?? "").trim();
    if (text === "") continue;
    if (b.type === "heading") {
      parts.push("");
      parts.push(text.toUpperCase());
      parts.push("");
    } else {
      parts.push(text);
    }
  }
  return parts
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export function cleanJsonToReadableText(raw: string): string {
  let t = raw.trim();
  t = t.replace(/^```(?:json)?\s*/i, "");
  t = t.replace(/\s*```\s*$/m, "");
  t = t.trim();

  const inner = extractFirstJsonObject(t);
  const jsonToParse = inner ?? t;

  const parsed = tryParseRecord(jsonToParse);
  if (parsed !== null && Array.isArray(parsed.blocks)) {
    return blocksToText(parsed);
  }

  const partial = tryParsePartial(t);
  if (partial !== null) {
    return blocksToText(partial.parsed);
  }

  let cleaned = jsonToParse;
  cleaned = cleaned.replace(/^\s*\{/m, "").replace(/\}\s*$/m, "");
  cleaned = cleaned.replace(/"blocks"\s*:\s*\[/g, "");
  cleaned = cleaned.replace(/\]\s*,?\s*$/gm, "");
  cleaned = cleaned.replace(
    /\{\s*"type"\s*:\s*"(heading|paragraph)"\s*,\s*"text"\s*:\s*/g,
    ""
  );
  cleaned = cleaned.replace(/\}\s*,?\s*/g, "\n");
  cleaned = cleaned.replace(/"title"\s*:\s*"([^"]*)"\s*,?/g, "$1\n\n");
  cleaned = cleaned.replace(/"summary"\s*:\s*"([^"]*)"\s*,?/g, "$1\n\n");
  cleaned = cleaned.replace(/\\n/g, "\n");
  cleaned = cleaned.replace(/\\"/g, '"');
  cleaned = cleaned.replace(/^"(.*)"$/gm, "$1");
  cleaned = cleaned.replace(/^"\s*/gm, "");
  cleaned = cleaned.replace(/\s*"$/gm, "");
  cleaned = cleaned.replace(/\n{3,}/g, "\n\n");
  return cleaned.trim();
}

export const parseAssistantPayload = (
  content: string
): ParsedAssistantPayload => {
  const stripped = stripCodeFences(content);

  if (looksLikeJson(content)) {
    let parsed = tryParseRecord(stripped);
    if (parsed === null) {
      const extracted = extractFirstJsonObject(stripped);
      if (extracted !== null) {
        parsed = tryParseRecord(extracted);
      }
    }
    if (parsed === null) {
      const rawWithoutFences = content.replace(/```(?:json)?\s*/gi, "").replace(/```/g, "");
      const extracted = extractFirstJsonObject(rawWithoutFences);
      if (extracted !== null) {
        parsed = tryParseRecord(extracted);
      }
    }

    if (parsed !== null) {
      const title =
        typeof parsed.title === "string" ? parsed.title : "Borrador";
      return {
        title,
        parsed,
        cleanText: blocksToText(parsed),
        truncated: false,
      };
    }

    const rawClean = content.replace(/```(?:json)?\s*/gi, "").replace(/```/g, "");
    const partial = tryParsePartial(stripped) ?? tryParsePartial(rawClean);
    if (partial !== null && isStructuredBlocks(partial.parsed)) {
      const title =
        typeof partial.parsed.title === "string"
          ? partial.parsed.title
          : "Borrador";
      return {
        title,
        parsed: partial.parsed,
        cleanText: blocksToText(partial.parsed),
        truncated: partial.truncated,
      };
    }

    const cleanText = cleanJsonToReadableText(content);
    const endsClean =
      cleanText.length > 0 && /[.!?)\]"»]$/.test(cleanText.trimEnd());
    return {
      title: "Borrador",
      parsed: null,
      cleanText,
      truncated: !endsClean,
    };
  }

  const mdParsed = parseMarkdownToBlocks(stripped);
  if (mdParsed !== null && isStructuredBlocks(mdParsed)) {
    const title =
      typeof mdParsed.title === "string" ? mdParsed.title : "Borrador";
    return {
      title,
      parsed: mdParsed,
      cleanText: blocksToText(mdParsed),
      truncated: false,
    };
  }

  return {
    title: "Borrador",
    parsed: null,
    cleanText: stripped || content,
    truncated: false,
  };
};

export const isStructuredBlocks = (
  parsed: Record<string, unknown> | null
): parsed is Record<string, unknown> & {
  blocks: Array<{ type?: string; text?: string }>;
} => {
  if (parsed === null || !Array.isArray(parsed.blocks)) return false;
  return parsed.blocks.every((b) => typeof b === "object" && b !== null);
};
