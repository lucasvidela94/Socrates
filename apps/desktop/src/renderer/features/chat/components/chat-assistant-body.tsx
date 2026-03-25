import { Fragment, useState, type ReactElement, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import type { MessageRow, MessageVerification } from "@shared/types";
import { isStructuredBlocks, parseAssistantPayload } from "../lib/assistant-payload";
import { AlertCircle, AlertTriangle, CheckCircle2, ChevronDown, ChevronUp, Loader2, ShieldCheck } from "lucide-react";

interface ChatAssistantBodyProps {
  message: MessageRow;
  conversationId: string | null;
  chatContext: Record<string, unknown> | undefined;
  onMessageReplace: (row: MessageRow) => void;
}

function renderWithBold(text: string, keyPrefix: string): ReactNode {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    const m = /^\*\*([^*]+)\*\*$/.exec(part);
    if (m) return <strong key={`${keyPrefix}-b-${i}`}>{m[1]}</strong>;
    return (
      <Fragment key={`${keyPrefix}-t-${i}`}>
        {part}
      </Fragment>
    );
  });
}

function readVerification(meta: Record<string, unknown> | null): MessageVerification | null {
  if (meta === null) return null;
  const v = meta.verification;
  if (v === null || typeof v !== "object" || Array.isArray(v)) return null;
  return v as MessageVerification;
}

export const ChatAssistantBody = ({
  message,
  conversationId,
  chatContext,
  onMessageReplace,
}: ChatAssistantBodyProps): ReactElement => {
  const { parsed, cleanText, truncated } = parseAssistantPayload(message.content);
  const verification = readVerification(message.metadata);
  const [verifying, setVerifying] = useState(false);
  const [applying, setApplying] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const handleVerify = async () => {
    if (conversationId === null) return;
    setVerifying(true);
    try {
      const updated = await window.electronAPI.chatVerify({
        messageId: message.id,
        conversationId,
        content: message.content,
        context: chatContext,
      });
      onMessageReplace(updated);
      setExpanded(true);
    } catch (e) {
      window.alert(e instanceof Error ? e.message : "Error al verificar");
    } finally {
      setVerifying(false);
    }
  };

  const handleApply = async () => {
    if (conversationId === null || verification === null) return;
    const next = verification.corrected_content?.trim();
    if (next === undefined || next === "") return;
    setApplying(true);
    try {
      const updated = await window.electronAPI.chatApplyCorrections({
        messageId: message.id,
        conversationId,
        content: next,
      });
      onMessageReplace(updated);
    } catch (e) {
      window.alert(e instanceof Error ? e.message : "No se pudieron aplicar las correcciones");
    } finally {
      setApplying(false);
    }
  };

  const canVerify = conversationId !== null && !verifying;
  const hasCorrections = (verification?.corrections?.length ?? 0) > 0;
  const canApply =
    verification !== null &&
    verification.error === undefined &&
    verification.corrected_content !== undefined &&
    verification.corrected_content.trim() !== "" &&
    verification.applied !== true;

  let badge: ReactElement | null = null;
  if (verification !== null) {
    if (verification.error !== undefined) {
      badge = (
        <span className="inline-flex items-center gap-1 text-xs text-red-700 bg-red-100 px-2 py-0.5 rounded-full">
          <AlertCircle className="w-3 h-3" />
          Error al verificar
        </span>
      );
    } else if (verification.applied === true) {
      badge = (
        <span className="inline-flex items-center gap-1 text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
          <CheckCircle2 className="w-3 h-3" />
          Correcciones aplicadas
        </span>
      );
    } else if (verification.approved === true && !hasCorrections) {
      badge = (
        <span className="inline-flex items-center gap-1 text-xs text-green-800 bg-green-100 px-2 py-0.5 rounded-full">
          <ShieldCheck className="w-3 h-3" />
          Verificado
        </span>
      );
    } else if (hasCorrections) {
      badge = (
        <span className="inline-flex items-center gap-1 text-xs text-amber-900 bg-amber-100 px-2 py-0.5 rounded-full">
          <AlertCircle className="w-3 h-3" />
          {verification.corrections.length}{" "}
          {verification.corrections.length === 1 ? "corrección" : "correcciones"}
        </span>
      );
    } else {
      badge = (
        <span className="inline-flex items-center gap-1 text-xs text-amber-900 bg-amber-100 px-2 py-0.5 rounded-full">
          <AlertCircle className="w-3 h-3" />
          Revisar borrador
        </span>
      );
    }
  }

  const body =
    isStructuredBlocks(parsed) ? (
      <div className="space-y-2 text-sm">
        {typeof parsed.title === "string" && parsed.title.trim() !== "" && (
          <h3 className="text-base font-semibold text-foreground leading-snug">
            {renderWithBold(parsed.title, `${message.id}-title`)}
          </h3>
        )}
        {typeof parsed.summary === "string" && parsed.summary.trim() !== "" && (
          <p className="font-medium text-foreground/90 border-b pb-2 text-sm leading-relaxed">
            {renderWithBold(parsed.summary, `${message.id}-summary`)}
          </p>
        )}
        {parsed.blocks.map((b, i) => {
          const t = String(b.text ?? "");
          const key = `${message.id}-block-${i}-${b.type ?? "p"}`;
          if (b.type === "heading") {
            return (
              <h4 key={key} className="font-semibold pt-2 text-sm">
                {renderWithBold(t, key)}
              </h4>
            );
          }
          return (
            <p key={key} className="whitespace-pre-wrap leading-relaxed">
              {renderWithBold(t, key)}
            </p>
          );
        })}
      </div>
    ) : (
      <div className="space-y-1 text-sm">
        {cleanText.split("\n").map((line, i) => {
          const trimmed = line.trim();
          if (trimmed === "") return <div key={`${message.id}-fl-${i}`} className="h-2" />;
          const isUpper = trimmed === trimmed.toUpperCase() && trimmed.length > 3 && /[A-ZÁÉÍÓÚÑ]/.test(trimmed);
          if (isUpper) {
            return (
              <h4 key={`${message.id}-fl-${i}`} className="font-semibold pt-2 text-sm">
                {renderWithBold(line, `${message.id}-fl-${i}`)}
              </h4>
            );
          }
          return (
            <p key={`${message.id}-fl-${i}`} className="whitespace-pre-wrap leading-relaxed">
              {renderWithBold(line, `${message.id}-fl-${i}`)}
            </p>
          );
        })}
      </div>
    );

  const truncationNotice = truncated ? (
    <div className="flex items-start gap-2 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
      <AlertTriangle className="mt-0.5 h-3.5 w-3.5 flex-shrink-0" />
      <span>La respuesta se cortó por límite de longitud. Podés pedir al asistente que continúe o que resuma el contenido restante.</span>
    </div>
  ) : null;

  return (
    <div className="space-y-2">
      {body}
      {truncationNotice}
      <div className="flex flex-wrap items-center gap-2 pt-1">
        {badge}
        <Button
          type="button"
          variant={verification === null ? "secondary" : "ghost"}
          size="sm"
          className="h-7 text-xs"
          disabled={!canVerify}
          onClick={() => void handleVerify()}
        >
          {verifying ? (
            <>
              <Loader2 className="h-3 w-3 mr-1 animate-spin" />
              Verificando…
            </>
          ) : verification === null ? (
            <>
              <ShieldCheck className="h-3 w-3 mr-1" />
              Verificar
            </>
          ) : (
            "Verificar de nuevo"
          )}
        </Button>
        {verification !== null && hasCorrections && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-7 text-xs"
            onClick={() => setExpanded((e) => !e)}
          >
            {expanded ? (
              <>
                <ChevronUp className="h-3 w-3 mr-1" />
                Ocultar
              </>
            ) : (
              <>
                <ChevronDown className="h-3 w-3 mr-1" />
                Ver detalle
              </>
            )}
          </Button>
        )}
        {canApply && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-7 text-xs"
            disabled={applying}
            onClick={() => void handleApply()}
          >
            {applying ? <Loader2 className="h-3 w-3 animate-spin" /> : "Aplicar correcciones"}
          </Button>
        )}
      </div>
      {expanded && verification !== null && hasCorrections && (
        <ul className="text-xs space-y-2 border-t pt-2 mt-1">
          {verification.corrections.map((c, i) => (
            <li key={`${message.id}-corr-${i}`} className="rounded-md bg-background/80 p-2 border">
              <p className="font-medium text-muted-foreground">{c.type}</p>
              {c.reason.trim() !== "" && <p className="mt-0.5">{c.reason}</p>}
              {c.original.trim() !== "" && (
                <p className="mt-1 line-through opacity-70 whitespace-pre-wrap">{c.original}</p>
              )}
              {c.corrected.trim() !== "" && (
                <p className="mt-1 whitespace-pre-wrap text-foreground">{c.corrected}</p>
              )}
            </li>
          ))}
        </ul>
      )}
      {verification?.error !== undefined && (
        <p className="text-xs text-destructive">{verification.error}</p>
      )}
    </div>
  );
};
