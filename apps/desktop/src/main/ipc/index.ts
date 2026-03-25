import { registerAppHandlers } from "./handlers/app-handlers";
import { registerLlmConfigHandlers } from "./handlers/llm-config-handlers";
import { registerSidecarHandlers } from "./handlers/sidecar-handlers";
import { registerChatHandlers } from "./handlers/chat-handlers";
import { registerStudentsHandlers } from "./handlers/students-handlers";
import { registerFeedbackHandlers } from "./handlers/feedback-handlers";
import { registerDocumentsHandlers } from "./handlers/documents-handlers";
import { registerOAuthHandlers } from "./handlers/oauth-handlers";
import { registerMaterialsHandlers } from "./handlers/materials-handlers";
import { registerCurriculumHandlers } from "./handlers/curriculum-handlers";

export const registerIpcHandlers = (): void => {
  registerAppHandlers();
  registerLlmConfigHandlers();
  registerSidecarHandlers();
  registerChatHandlers();
  registerStudentsHandlers();
  registerFeedbackHandlers();
  registerDocumentsHandlers();
  registerOAuthHandlers();
  registerMaterialsHandlers();
  registerCurriculumHandlers();
};
