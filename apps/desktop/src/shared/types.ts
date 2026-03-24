export interface AppInfo {
  name: string;
  version: string;
}

export interface LlmConfigInput {
  provider: string;
  model: string;
  apiKey?: string;
  baseUrl?: string;
  settings?: Record<string, unknown>;
}

export interface LlmConfigRow {
  id: string;
  teacherId: string;
  provider: string;
  model: string;
  apiKey: string | null;
  baseUrl: string | null;
  settings: Record<string, unknown> | null;
  isDefault: boolean | null;
  updatedAt: Date;
}

export interface SidecarStatus {
  connected: boolean;
  port: number | null;
}

export interface ConversationRow {
  id: string;
  teacherId: string;
  agentType: string;
  context: Record<string, unknown> | null;
  createdAt: Date;
}

export interface MessageRow {
  id: string;
  conversationId: string;
  role: string;
  content: string;
  metadata: Record<string, unknown> | null;
  createdAt: Date;
}

export interface ChatSendInput {
  conversationId: string;
  agentType: string;
  message: string;
  context?: Record<string, unknown>;
}

export interface ChatResponse {
  conversationId: string;
  agentType: string;
  userMessage: MessageRow;
  assistantMessage: MessageRow;
}

export interface ClassroomInput {
  name: string;
  grade: string;
  shift: string;
}

export interface ClassroomRow {
  id: string;
  name: string;
  grade: string;
  shift: string;
  teacherId: string;
  createdAt: Date;
}

export interface StudentInput {
  name: string;
  birthDate?: string | null;
  classroomId: string;
  notes?: string | null;
}

export interface StudentRow {
  id: string;
  name: string;
  birthDate: string | null;
  classroomId: string;
  notes: string | null;
  createdAt: Date;
}

export interface StudentProfileInput {
  learningStyle?: string | null;
  strengths?: string | null;
  challenges?: string | null;
  accommodations?: string | null;
}

export interface StudentProfileRow {
  id: string;
  studentId: string;
  learningStyle: string | null;
  strengths: string | null;
  challenges: string | null;
  accommodations: string | null;
  updatedAt: Date;
}

export interface LearningNoteInput {
  observation: string;
  category: string;
}

export interface LearningNoteRow {
  id: string;
  studentProfileId: string;
  observation: string;
  category: string;
  createdAt: Date;
}

export interface StudentWithProfile {
  student: StudentRow;
  profile: StudentProfileRow;
}

export interface WeeklyFeedbackInput {
  studentId: string;
  classroomId: string;
  weekStart: string;
  indicators?: Record<string, unknown> | null;
  observations?: string | null;
  aiSummary?: string | null;
  teacherApproved?: boolean;
}

export interface WeeklyFeedbackRow {
  id: string;
  studentId: string;
  classroomId: string;
  weekStart: string;
  indicators: Record<string, unknown> | null;
  observations: string | null;
  aiSummary: string | null;
  teacherApproved: boolean | null;
  createdAt: Date;
}

export interface FeedbackGenerateSummaryPayload {
  studentId: string;
  classroomId: string;
  weekStart: string;
  studentName: string;
  priorWeeksJson: string;
  currentIndicators: Record<string, unknown>;
  currentObservations: string;
}

export interface DocumentRow {
  id: string;
  type: string;
  title: string;
  content: Record<string, unknown> | null;
  classroomId: string | null;
  teacherId: string;
  createdAt: Date;
}

export interface DocumentSaveApprovedInput {
  messageContent: string;
  title: string;
  agentType: string;
  classroomId?: string;
  studentId?: string;
  recordLearningNote?: boolean;
}

export interface DocumentExportResult {
  ok: boolean;
  path?: string;
  error?: string;
}

export interface OAuthResult {
  ok: boolean;
  error?: string;
}

export interface ElectronAPI {
  getAppInfo: () => Promise<AppInfo>;
  getLlmConfig: () => Promise<LlmConfigRow | null>;
  saveLlmConfig: (input: LlmConfigInput) => Promise<LlmConfigRow>;
  deleteLlmConfig: (id: string) => Promise<void>;
  testLlmConnection: (input: LlmConfigInput) => Promise<{ ok: boolean; error?: string }>;
  sidecarStatus: () => Promise<SidecarStatus>;
  chatCreateConversation: (agentType: string) => Promise<ConversationRow>;
  chatGetConversations: () => Promise<ConversationRow[]>;
  chatGetMessages: (conversationId: string) => Promise<MessageRow[]>;
  chatSend: (input: ChatSendInput) => Promise<ChatResponse>;
  classroomsList: () => Promise<ClassroomRow[]>;
  classroomCreate: (input: ClassroomInput) => Promise<ClassroomRow>;
  classroomUpdate: (id: string, input: ClassroomInput) => Promise<ClassroomRow>;
  classroomDelete: (id: string) => Promise<void>;
  studentsListByClassroom: (classroomId: string) => Promise<StudentRow[]>;
  studentGet: (studentId: string) => Promise<StudentWithProfile | null>;
  studentCreate: (input: StudentInput) => Promise<StudentRow>;
  studentUpdate: (id: string, input: StudentInput) => Promise<StudentRow>;
  studentDelete: (id: string) => Promise<void>;
  profileUpsert: (studentId: string, input: StudentProfileInput) => Promise<StudentProfileRow>;
  learningNotesListByStudent: (studentId: string) => Promise<LearningNoteRow[]>;
  learningNoteAdd: (studentId: string, input: LearningNoteInput) => Promise<LearningNoteRow>;
  feedbackListByWeek: (classroomId: string, weekStart: string) => Promise<WeeklyFeedbackRow[]>;
  feedbackListByStudent: (classroomId: string, studentId: string) => Promise<WeeklyFeedbackRow[]>;
  feedbackUpsert: (input: WeeklyFeedbackInput) => Promise<WeeklyFeedbackRow>;
  feedbackGenerateSummary: (
    payload: FeedbackGenerateSummaryPayload
  ) => Promise<{ ok: true; summary: string } | { ok: false; error: string }>;
  documentsList: () => Promise<DocumentRow[]>;
  documentGet: (id: string) => Promise<DocumentRow | null>;
  documentSaveApproved: (input: DocumentSaveApprovedInput) => Promise<DocumentRow>;
  documentExportDocx: (documentId: string) => Promise<DocumentExportResult>;
  oauthStartOpenRouter: () => Promise<OAuthResult>;
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}
