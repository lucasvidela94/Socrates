import type { ConversationRow, MessageRow } from "@shared/types";
import type { ChatAgentId } from "../lib/chat-agents";

export interface ChatSessionState {
  agentType: ChatAgentId;
  conversation: ConversationRow | null;
  messages: MessageRow[];
  input: string;
  sending: boolean;
  error: string | null;
}

export type ChatSessionAction =
  | { type: "SET_INPUT"; payload: string }
  | { type: "AGENT_CHANGE"; payload: ChatAgentId }
  | { type: "CONVERSATION_SET"; payload: ConversationRow }
  | {
      type: "MESSAGES_APPEND_PAIR";
      payload: { user: MessageRow; assistant: MessageRow };
    }
  | { type: "SEND_START" }
  | { type: "SEND_DONE" }
  | { type: "MESSAGE_REPLACE"; payload: MessageRow }
  | { type: "ERROR"; payload: string }
  | { type: "CLEAR_ERROR" };

const initialAgent: ChatAgentId = "criteria";

export const chatSessionInitialState: ChatSessionState = {
  agentType: initialAgent,
  conversation: null,
  messages: [],
  input: "",
  sending: false,
  error: null,
};

export const chatSessionReducer = (
  state: ChatSessionState,
  action: ChatSessionAction
): ChatSessionState => {
  switch (action.type) {
    case "SET_INPUT":
      return { ...state, input: action.payload };
    case "AGENT_CHANGE":
      return {
        ...chatSessionInitialState,
        agentType: action.payload,
      };
    case "CONVERSATION_SET":
      return { ...state, conversation: action.payload, messages: [] };
    case "MESSAGES_APPEND_PAIR":
      return {
        ...state,
        messages: [...state.messages, action.payload.user, action.payload.assistant],
      };
    case "SEND_START":
      return {
        ...state,
        input: "",
        sending: true,
        error: null,
      };
    case "SEND_DONE":
      return { ...state, sending: false };
    case "MESSAGE_REPLACE":
      return {
        ...state,
        messages: state.messages.map((m) =>
          m.id === action.payload.id ? action.payload : m
        ),
      };
    case "ERROR":
      return { ...state, sending: false, error: action.payload };
    case "CLEAR_ERROR":
      return { ...state, error: null };
    default:
      return state;
  }
};
