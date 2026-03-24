import { HashRouter, Routes, Route, Navigate } from "react-router-dom";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "sonner";
import { Layout } from "@/components/layout";
import { HomePage } from "@/features/dashboard/pages/home-page";
import { ChatPage } from "@/features/chat/pages/chat-page";
import { SettingsPage } from "@/features/settings/pages/settings-page";
import { ClassroomsPage } from "@/features/classrooms/pages/classrooms-page";
import { ClassroomDetailPage } from "@/features/classrooms/pages/classroom-detail-page";
import { StudentDetailPage } from "@/features/classrooms/pages/student-detail-page";
import { FeedbackPage } from "@/features/feedback/pages/feedback-page";
import { DocumentsPage } from "@/features/documents/pages/documents-page";
import { ErrorBoundary } from "@/shared/components/error-boundary";

import type { ReactElement } from "react";

export const App = (): ReactElement => {
  return (
    <ErrorBoundary>
      <TooltipProvider delayDuration={0}>
        <Toaster position="top-center" richColors closeButton />
        <HashRouter>
          <Routes>
            <Route path="/" element={<Layout />}>
              <Route index element={<HomePage />} />
              <Route path="chat" element={<ChatPage />} />
              <Route path="settings" element={<SettingsPage />} />
              <Route path="classrooms" element={<ClassroomsPage />} />
              <Route path="classrooms/:classroomId" element={<ClassroomDetailPage />} />
              <Route
                path="classrooms/:classroomId/students/:studentId"
                element={<StudentDetailPage />}
              />
              <Route path="feedback" element={<FeedbackPage />} />
              <Route path="documents" element={<DocumentsPage />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Route>
          </Routes>
        </HashRouter>
      </TooltipProvider>
    </ErrorBoundary>
  );
};
