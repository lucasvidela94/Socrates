import type { ReactElement } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CHAT_AGENTS, type ChatAgentId } from "../lib/chat-agents";

interface ChatAgentSelectorProps {
  value: ChatAgentId;
  onChange: (id: ChatAgentId) => void;
}

export const ChatAgentSelector = ({ value, onChange }: ChatAgentSelectorProps): ReactElement => {
  return (
    <div>
      <Select
        value={value}
        onValueChange={(v) => onChange(v as ChatAgentId)}
      >
        <SelectTrigger className="w-72">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {CHAT_AGENTS.map((a) => {
            const Icon = a.icon;
            return (
              <SelectItem key={a.id} value={a.id}>
                <div className="flex items-center gap-2">
                  <Icon className="h-4 w-4" />
                  {a.label}
                </div>
              </SelectItem>
            );
          })}
        </SelectContent>
      </Select>
    </div>
  );
};
