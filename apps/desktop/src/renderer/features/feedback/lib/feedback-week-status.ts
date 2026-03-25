import { FEEDBACK_AREAS } from "../components/feedback-student-form";
import type { FeedbackDraftSlice } from "../components/feedback-student-form";

export type FeedbackWeekStatus = "lista" | "borrador" | "pendiente";

export function getFeedbackWeekStatus(
  d: FeedbackDraftSlice | undefined
): FeedbackWeekStatus {
  if (d === undefined) return "pendiente";
  if (d.teacherApproved) return "lista";
  const hasIndicator = FEEDBACK_AREAS.some(
    (a) => (d.indicators[a] ?? "").trim() !== ""
  );
  const hasText =
    (d.observations?.trim() ?? "") !== "" || (d.aiSummary?.trim() ?? "") !== "";
  if (hasIndicator || hasText) return "borrador";
  return "pendiente";
}
