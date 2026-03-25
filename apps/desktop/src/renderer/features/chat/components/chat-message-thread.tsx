import { useLayoutEffect, useRef, type ReactElement } from "react";
import { Button } from "@/components/ui/button";
import { CardContent } from "@/components/ui/card";
import type { MessageRow } from "@shared/types";
import { AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
import { CHAT_AGENTS, type ChatAgentId } from "../lib/chat-agents";
import { ChatAssistantBody } from "./chat-assistant-body";

interface ChatMessageThreadProps {
  messages: MessageRow[];
  sending: boolean;
  agentType: ChatAgentId;
  onApproveMessage: (msg: MessageRow) => void;
  onMessageReplace: (msg: MessageRow) => void;
  conversationId: string | null;
  chatContext: Record<string, unknown> | undefined;
  error: string | null;
}

export const ChatMessageThread = ({
  messages,
  sending,
  agentType,
  onApproveMessage,
  onMessageReplace,
  conversationId,
  chatContext,
  error,
}: ChatMessageThreadProps): ReactElement => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const selectedAgent = CHAT_AGENTS.find((a) => a.id === agentType)!;
  const AgentIcon = selectedAgent.icon;

  useLayoutEffect(() => {
    const el = scrollRef.current;
    if (el === null) return;
    el.scrollTop = el.scrollHeight;
  }, [messages, sending]);

  return (
    <CardContent className="flex flex-col flex-1 p-0 overflow-hidden">
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && !sending && (
          <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground">
            <AgentIcon className="h-12 w-12 mb-4 opacity-30" />
            <p className="text-lg font-medium">{selectedAgent.label}</p>
            <p className="text-sm max-w-md mt-1">
              Contame qué querés preparar y te propongo un borrador listo para revisar.
            </p>
          </div>
        )}

        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex flex-col gap-1 ${msg.role === "user" ? "items-end" : "items-start"}`}
          >
            <div
              className={`max-w-[85%] rounded-xl px-4 py-3 text-sm ${
                msg.role === "user"
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted"
              }`}
            >
              {msg.role === "user" ? (
                <span className="whitespace-pre-wrap">{msg.content}</span>
              ) : (
                <ChatAssistantBody
                  message={msg}
                  conversationId={conversationId}
                  chatContext={chatContext}
                  onMessageReplace={onMessageReplace}
                />
              )}
            </div>
            {msg.role === "assistant" && (
              <Button variant="outline" size="sm" onClick={() => onApproveMessage(msg)}>
                <CheckCircle2 className="h-4 w-4" />
                Revisar y guardar documento
              </Button>
            )}
          </div>
        ))}

        {sending && (
          <div className="flex justify-start">
            <div className="bg-muted rounded-xl px-4 py-3 text-sm flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              El asistente está pensando...
            </div>
          </div>
        )}
      </div>

      {error !== null && (
        <div className="px-4 pb-2 text-sm text-destructive flex items-center gap-2">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}
    </CardContent>
  );
};
