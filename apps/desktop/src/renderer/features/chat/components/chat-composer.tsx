import type { ReactElement } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Send } from "lucide-react";

interface ChatComposerProps {
  value: string;
  onChange: (v: string) => void;
  onSend: () => void;
  sending: boolean;
  onKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
}

export const ChatComposer = ({
  value,
  onChange,
  onSend,
  sending,
  onKeyDown,
}: ChatComposerProps): ReactElement => {
  return (
    <div className="border-t p-4">
      <div className="flex gap-2">
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder="Ej: Necesito una secuencia de matemática para 3º con adecuaciones"
          disabled={sending}
          className="flex-1"
        />
        <Button onClick={onSend} disabled={sending || value.trim() === ""} size="icon">
          {sending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
        </Button>
      </div>
    </div>
  );
};
