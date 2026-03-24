import { useCallback, useReducer, useRef } from "react";
import type { ConversationRow } from "@shared/types";
import type { ChatAgentId } from "../lib/chat-agents";
import {
  chatSessionInitialState,
  chatSessionReducer,
  type ChatSessionState,
} from "./chat-session-reducer";

export interface UseChatSessionResult {
  state: ChatSessionState;
  setInput: (v: string) => void;
  changeAgent: (id: ChatAgentId) => void;
  send: (chatContext: Record<string, unknown> | undefined) => Promise<void>;
  reportError: (message: string) => void;
  clearError: () => void;
}

export const useChatSession = (): UseChatSessionResult => {
  const [state, dispatch] = useReducer(chatSessionReducer, chatSessionInitialState);
  const agentRef = useRef(state.agentType);
  agentRef.current = state.agentType;

  const setInput = useCallback((v: string) => {
    dispatch({ type: "SET_INPUT", payload: v });
  }, []);

  const changeAgent = useCallback((id: ChatAgentId) => {
    dispatch({ type: "AGENT_CHANGE", payload: id });
  }, []);

  const send = useCallback(
    async (chatContext: Record<string, unknown> | undefined) => {
      const text = state.input.trim();
      if (text === "" || state.sending) return;

      dispatch({ type: "SEND_START" });

      try {
        let conv: ConversationRow | null = state.conversation;
        if (conv === null || conv.agentType !== state.agentType) {
          conv = await window.electronAPI.chatCreateConversation(state.agentType);
          dispatch({ type: "CONVERSATION_SET", payload: conv });
        }

        if (agentRef.current !== state.agentType) {
          dispatch({ type: "SEND_DONE" });
          return;
        }

        const result = await window.electronAPI.chatSend({
          conversationId: conv.id,
          agentType: state.agentType,
          message: text,
          context: chatContext,
        });

        if (agentRef.current !== state.agentType) {
          dispatch({ type: "SEND_DONE" });
          return;
        }

        dispatch({
          type: "MESSAGES_APPEND_PAIR",
          payload: {
            user: result.userMessage,
            assistant: result.assistantMessage,
          },
        });
      } catch (err) {
        dispatch({
          type: "ERROR",
          payload: err instanceof Error ? err.message : "Error al enviar",
        });
        return;
      }

      dispatch({ type: "SEND_DONE" });
    },
    [state.conversation, state.agentType, state.input, state.sending]
  );

  const reportError = useCallback((message: string) => {
    dispatch({ type: "ERROR", payload: message });
  }, []);

  const clearError = useCallback(() => {
    dispatch({ type: "CLEAR_ERROR" });
  }, []);

  return { state, setInput, changeAgent, send, reportError, clearError };
};
