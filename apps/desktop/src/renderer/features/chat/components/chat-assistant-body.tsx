import type { ReactElement } from "react";
import { isStructuredBlocks, parseAssistantPayload } from "../lib/assistant-payload";

interface ChatAssistantBodyProps {
  content: string;
  messageId: string;
}

export const ChatAssistantBody = ({ content, messageId }: ChatAssistantBodyProps): ReactElement => {
  const { parsed } = parseAssistantPayload(content);

  if (isStructuredBlocks(parsed)) {
    const blocks = parsed.blocks;
    return (
      <div className="space-y-2 text-sm">
        {typeof parsed.summary === "string" && parsed.summary.trim() !== "" && (
          <p className="font-medium text-foreground/90 border-b pb-2">{parsed.summary}</p>
        )}
        {blocks.map((b, i) => {
          const t = String(b.text ?? "");
          const key = `${messageId}-block-${i}-${b.type ?? "p"}`;
          if (b.type === "heading") {
            return (
              <h4 key={key} className="font-semibold pt-2">
                {t}
              </h4>
            );
          }
          return (
            <p key={key} className="whitespace-pre-wrap">
              {t}
            </p>
          );
        })}
      </div>
    );
  }

  return <pre className="whitespace-pre-wrap text-sm font-sans">{content}</pre>;
};
