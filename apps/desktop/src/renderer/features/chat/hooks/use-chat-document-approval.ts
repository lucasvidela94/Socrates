import { useCallback, useState } from "react";
import type { DocumentRow, MessageRow, StudentRow } from "@shared/types";
import { parseAssistantPayload } from "../lib/assistant-payload";
import type { ChatAgentId } from "../lib/chat-agents";

export interface UseChatDocumentApprovalResult {
  pending: MessageRow | null;
  approveTitle: string;
  setApproveTitle: (v: string) => void;
  recordLearningNote: boolean;
  setRecordLearningNote: (v: boolean) => void;
  noteStudentId: string;
  setNoteStudentId: (v: string) => void;
  savingDoc: boolean;
  lastSavedDoc: DocumentRow | null;
  clearLastSaved: () => void;
  openForMessage: (msg: MessageRow) => void;
  close: () => void;
  save: (params: {
    agentType: ChatAgentId;
    classroomId: string;
  }) => Promise<void>;
  exportLast: () => Promise<void>;
}

export const useChatDocumentApproval = (
  students: StudentRow[],
  onError: (msg: string) => void
): UseChatDocumentApprovalResult => {
  const [pending, setPending] = useState<MessageRow | null>(null);
  const [approveTitle, setApproveTitle] = useState("");
  const [recordLearningNote, setRecordLearningNote] = useState(false);
  const [noteStudentId, setNoteStudentId] = useState("");
  const [savingDoc, setSavingDoc] = useState(false);
  const [lastSavedDoc, setLastSavedDoc] = useState<DocumentRow | null>(null);

  const clearLastSaved = useCallback(() => {
    setLastSavedDoc(null);
  }, []);

  const openForMessage = useCallback(
    (msg: MessageRow) => {
      const { title } = parseAssistantPayload(msg.content);
      setApproveTitle(title);
      setPending(msg);
      setRecordLearningNote(false);
      setNoteStudentId(students[0]?.id ?? "");
    },
    [students]
  );

  const close = useCallback(() => {
    setPending(null);
  }, []);

  const save = useCallback(
    async (params: { agentType: ChatAgentId; classroomId: string }) => {
      if (pending === null) return;
      setSavingDoc(true);
      try {
        const doc = await window.electronAPI.documentSaveApproved({
          messageContent: pending.content,
          title: approveTitle.trim() || "Borrador aprobado",
          agentType: params.agentType,
          classroomId: params.classroomId || undefined,
          studentId: recordLearningNote ? noteStudentId || undefined : undefined,
          recordLearningNote,
        });
        setLastSavedDoc(doc);
        setPending(null);
      } catch (e) {
        onError(e instanceof Error ? e.message : "Error al guardar");
      } finally {
        setSavingDoc(false);
      }
    },
    [pending, approveTitle, recordLearningNote, noteStudentId, onError]
  );

  const exportLast = useCallback(async () => {
    if (lastSavedDoc === null) return;
    const res = await window.electronAPI.documentExportDocx(lastSavedDoc.id);
    if (!res.ok && res.error !== "Cancelado") {
      onError(res.error ?? "Exportación fallida");
    }
  }, [lastSavedDoc, onError]);

  return {
    pending,
    approveTitle,
    setApproveTitle,
    recordLearningNote,
    setRecordLearningNote,
    noteStudentId,
    setNoteStudentId,
    savingDoc,
    lastSavedDoc,
    clearLastSaved,
    openForMessage,
    close,
    save,
    exportLast,
  };
};
