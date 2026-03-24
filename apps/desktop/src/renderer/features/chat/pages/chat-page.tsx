import { useCallback, type ReactElement } from "react";
import { Breadcrumb } from "@/shared/components/breadcrumb";
import { PageContainer } from "@/shared/components/page-container";
import { PageHeader } from "@/shared/components/page-header";
import { Card } from "@/components/ui/card";
import { BREADCRUMB_MAP, ROUTES } from "@shared/lib/routes";
import type { ChatAgentId } from "../lib/chat-agents";
import { useChatClassroomContext } from "../hooks/use-chat-classroom-context";
import { useChatSession } from "../hooks/use-chat-session";
import { useChatDocumentApproval } from "../hooks/use-chat-document-approval";
import { ChatAgentSelector } from "../components/chat-agent-selector";
import { ChatContextCard } from "../components/chat-context-card";
import { ChatMessageThread } from "../components/chat-message-thread";
import { ChatComposer } from "../components/chat-composer";
import { ChatApprovalPanel } from "../components/chat-approval-panel";
import { ChatSavedDocumentActions } from "../components/chat-saved-document-actions";

export const ChatPage = (): ReactElement => {
  const classroomCtx = useChatClassroomContext();
  const {
    state,
    setInput,
    changeAgent,
    send,
    reportError,
    clearError,
  } = useChatSession();

  const {
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
  } = useChatDocumentApproval(classroomCtx.students, reportError);

  const handleAgentChange = useCallback(
    (id: ChatAgentId) => {
      changeAgent(id);
      clearError();
      close();
      clearLastSaved();
    },
    [changeAgent, clearError, close, clearLastSaved]
  );

  const handleSend = useCallback(() => {
    clearLastSaved();
    void send(classroomCtx.chatContext);
  }, [clearLastSaved, send, classroomCtx.chatContext]);

  const handleComposerKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    },
    [handleSend]
  );

  const handleSaveApproved = useCallback(() => {
    void save({
      agentType: state.agentType,
      classroomId: classroomCtx.classroomId,
    });
  }, [save, state.agentType, classroomCtx.classroomId]);

  return (
    <PageContainer>
      <Breadcrumb items={BREADCRUMB_MAP[ROUTES.CHAT]} />
      <PageHeader
        title="Asistentes"
        description="Borradores con contexto de tus aulas. Vos aprobás y guardás lo que sirve."
      />

      <ChatContextCard
        classrooms={classroomCtx.classrooms}
        classroomId={classroomCtx.classroomId}
        onClassroomIdChange={classroomCtx.setClassroomId}
        noneSentinel={classroomCtx.noneSentinel}
        students={classroomCtx.students}
        omitStudents={classroomCtx.omitStudents}
        onOmitStudentsChange={classroomCtx.setOmitStudents}
        filterStudentsEnabled={classroomCtx.filterStudentsEnabled}
        onFilterStudentsEnabledChange={classroomCtx.setFilterStudentsEnabled}
        selectedStudentIds={classroomCtx.selectedStudentIds}
        onToggleStudent={classroomCtx.toggleStudent}
      />

      <ChatAgentSelector value={state.agentType} onChange={handleAgentChange} />

      <Card className="flex flex-col h-[calc(100vh-28rem)] min-h-[280px]">
        <ChatMessageThread
          messages={state.messages}
          sending={state.sending}
          agentType={state.agentType}
          onApproveMessage={openForMessage}
          error={state.error}
        />
        <ChatComposer
          value={state.input}
          onChange={setInput}
          onSend={handleSend}
          sending={state.sending}
          onKeyDown={handleComposerKeyDown}
        />
      </Card>

      {pending !== null && (
        <ChatApprovalPanel
          approveTitle={approveTitle}
          onApproveTitleChange={setApproveTitle}
          recordLearningNote={recordLearningNote}
          onRecordLearningNoteChange={setRecordLearningNote}
          students={classroomCtx.students}
          noteStudentId={noteStudentId}
          onNoteStudentIdChange={setNoteStudentId}
          savingDoc={savingDoc}
          onSave={handleSaveApproved}
          onCancel={close}
        />
      )}

      {lastSavedDoc !== null && (
        <ChatSavedDocumentActions
          savedDocument={lastSavedDoc}
          onExport={() => void exportLast()}
        />
      )}
    </PageContainer>
  );
};
