export interface ParsedAssistantPayload {
  title: string;
  parsed: Record<string, unknown> | null;
}

export const parseAssistantPayload = (content: string): ParsedAssistantPayload => {
  try {
    const parsed = JSON.parse(content) as Record<string, unknown>;
    const title = typeof parsed.title === "string" ? parsed.title : "Borrador";
    return { title, parsed };
  } catch {
    return { title: "Borrador", parsed: null };
  }
};

export const isStructuredBlocks = (
  parsed: Record<string, unknown> | null
): parsed is Record<string, unknown> & {
  blocks: Array<{ type?: string; text?: string }>;
} => {
  if (parsed === null || !Array.isArray(parsed.blocks)) return false;
  return parsed.blocks.every((b) => typeof b === "object" && b !== null);
};
