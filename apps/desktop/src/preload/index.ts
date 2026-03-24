import { contextBridge, ipcRenderer } from "electron";
import { IPC_CHANNELS } from "../shared/channels";

import type {
  AppInfo,
  LlmConfigInput,
  LlmConfigRow,
  SidecarStatus,
  ConversationRow,
  MessageRow,
  ChatSendInput,
  ChatResponse,
  ClassroomInput,
  ClassroomRow,
  StudentInput,
  StudentRow,
  StudentProfileInput,
  StudentProfileRow,
  LearningNoteInput,
  LearningNoteRow,
  StudentWithProfile,
  WeeklyFeedbackInput,
  WeeklyFeedbackRow,
  FeedbackGenerateSummaryPayload,
  DocumentRow,
  DocumentSaveApprovedInput,
  DocumentExportResult,
  OAuthResult,
  ElectronAPI,
} from "../shared/types";

const api: ElectronAPI = {
  getAppInfo: (): Promise<AppInfo> =>
    ipcRenderer.invoke(IPC_CHANNELS.GET_APP_INFO),

  getLlmConfig: (): Promise<LlmConfigRow | null> =>
    ipcRenderer.invoke(IPC_CHANNELS.GET_LLM_CONFIG),

  saveLlmConfig: (input: LlmConfigInput): Promise<LlmConfigRow> =>
    ipcRenderer.invoke(IPC_CHANNELS.SAVE_LLM_CONFIG, input),

  deleteLlmConfig: (id: string): Promise<void> =>
    ipcRenderer.invoke(IPC_CHANNELS.DELETE_LLM_CONFIG, id),

  testLlmConnection: (input: LlmConfigInput): Promise<{ ok: boolean; error?: string }> =>
    ipcRenderer.invoke(IPC_CHANNELS.TEST_LLM_CONNECTION, input),

  sidecarStatus: (): Promise<SidecarStatus> =>
    ipcRenderer.invoke(IPC_CHANNELS.SIDECAR_STATUS),

  chatCreateConversation: (agentType: string): Promise<ConversationRow> =>
    ipcRenderer.invoke(IPC_CHANNELS.CHAT_CREATE_CONVERSATION, agentType),

  chatGetConversations: (): Promise<ConversationRow[]> =>
    ipcRenderer.invoke(IPC_CHANNELS.CHAT_GET_CONVERSATIONS),

  chatGetMessages: (conversationId: string): Promise<MessageRow[]> =>
    ipcRenderer.invoke(IPC_CHANNELS.CHAT_GET_MESSAGES, conversationId),

  chatSend: (input: ChatSendInput): Promise<ChatResponse> =>
    ipcRenderer.invoke(IPC_CHANNELS.CHAT_SEND, input),

  classroomsList: (): Promise<ClassroomRow[]> =>
    ipcRenderer.invoke(IPC_CHANNELS.CLASSROOMS_LIST),

  classroomCreate: (input: ClassroomInput): Promise<ClassroomRow> =>
    ipcRenderer.invoke(IPC_CHANNELS.CLASSROOM_CREATE, input),

  classroomUpdate: (id: string, input: ClassroomInput): Promise<ClassroomRow> =>
    ipcRenderer.invoke(IPC_CHANNELS.CLASSROOM_UPDATE, id, input),

  classroomDelete: (id: string): Promise<void> =>
    ipcRenderer.invoke(IPC_CHANNELS.CLASSROOM_DELETE, id),

  studentsListByClassroom: (classroomId: string): Promise<StudentRow[]> =>
    ipcRenderer.invoke(IPC_CHANNELS.STUDENTS_LIST_BY_CLASSROOM, classroomId),

  studentGet: (studentId: string): Promise<StudentWithProfile | null> =>
    ipcRenderer.invoke(IPC_CHANNELS.STUDENT_GET, studentId),

  studentCreate: (input: StudentInput): Promise<StudentRow> =>
    ipcRenderer.invoke(IPC_CHANNELS.STUDENT_CREATE, input),

  studentUpdate: (id: string, input: StudentInput): Promise<StudentRow> =>
    ipcRenderer.invoke(IPC_CHANNELS.STUDENT_UPDATE, id, input),

  studentDelete: (id: string): Promise<void> =>
    ipcRenderer.invoke(IPC_CHANNELS.STUDENT_DELETE, id),

  profileUpsert: (studentId: string, input: StudentProfileInput): Promise<StudentProfileRow> =>
    ipcRenderer.invoke(IPC_CHANNELS.PROFILE_UPSERT, studentId, input),

  learningNotesListByStudent: (studentId: string): Promise<LearningNoteRow[]> =>
    ipcRenderer.invoke(IPC_CHANNELS.LEARNING_NOTES_LIST_BY_STUDENT, studentId),

  learningNoteAdd: (studentId: string, input: LearningNoteInput): Promise<LearningNoteRow> =>
    ipcRenderer.invoke(IPC_CHANNELS.LEARNING_NOTE_ADD, studentId, input),

  feedbackListByWeek: (classroomId: string, weekStart: string): Promise<WeeklyFeedbackRow[]> =>
    ipcRenderer.invoke(IPC_CHANNELS.FEEDBACK_LIST_BY_WEEK, classroomId, weekStart),

  feedbackListByStudent: (classroomId: string, studentId: string): Promise<WeeklyFeedbackRow[]> =>
    ipcRenderer.invoke(IPC_CHANNELS.FEEDBACK_LIST_BY_STUDENT, classroomId, studentId),

  feedbackUpsert: (input: WeeklyFeedbackInput): Promise<WeeklyFeedbackRow> =>
    ipcRenderer.invoke(IPC_CHANNELS.FEEDBACK_UPSERT, input),

  feedbackGenerateSummary: (
    payload: FeedbackGenerateSummaryPayload
  ): Promise<{ ok: true; summary: string } | { ok: false; error: string }> =>
    ipcRenderer.invoke(IPC_CHANNELS.FEEDBACK_GENERATE_SUMMARY, payload),

  documentsList: (): Promise<DocumentRow[]> =>
    ipcRenderer.invoke(IPC_CHANNELS.DOCUMENTS_LIST),

  documentGet: (id: string): Promise<DocumentRow | null> =>
    ipcRenderer.invoke(IPC_CHANNELS.DOCUMENT_GET, id),

  documentSaveApproved: (input: DocumentSaveApprovedInput): Promise<DocumentRow> =>
    ipcRenderer.invoke(IPC_CHANNELS.DOCUMENT_SAVE_APPROVED, input),

  documentExportDocx: (documentId: string): Promise<DocumentExportResult> =>
    ipcRenderer.invoke(IPC_CHANNELS.DOCUMENT_EXPORT_DOCX, documentId),

  oauthStartOpenRouter: (): Promise<OAuthResult> =>
    ipcRenderer.invoke(IPC_CHANNELS.OAUTH_START_OPENROUTER),
};

contextBridge.exposeInMainWorld("electronAPI", api);
