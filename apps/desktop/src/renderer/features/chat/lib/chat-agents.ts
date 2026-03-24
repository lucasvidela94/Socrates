import { ClipboardList, CalendarDays, Users, FileText } from "lucide-react";

export const CHAT_AGENTS = [
  { id: "criteria", label: "Criterios de evaluación", icon: ClipboardList },
  { id: "planner", label: "Planificador semanal", icon: CalendarDays },
  { id: "adaptation", label: "Adecuación curricular", icon: Users },
  { id: "tasks", label: "Consignas y tareas", icon: FileText },
] as const;

export type ChatAgentId = (typeof CHAT_AGENTS)[number]["id"];
