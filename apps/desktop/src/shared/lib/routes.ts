export const ROUTES = {
  HOME: "/",
  CHAT: "/chat",
  SETTINGS: "/settings",
  CLASSROOMS: "/classrooms",
  FEEDBACK: "/feedback",
  DOCUMENTS: "/documents",
} as const;

export const classroomProgramAnnualPath = (classroomId: string): string =>
  `${ROUTES.CLASSROOMS}/${classroomId}/curriculum`;

export const classroomCurriculumPath = classroomProgramAnnualPath;

export const classroomFeedbackPath = (
  classroomId: string,
  opts?: { week?: string }
): string => {
  const q = new URLSearchParams();
  if (opts?.week !== undefined && opts.week !== "") q.set("week", opts.week);
  const s = q.toString();
  const base = `${ROUTES.CLASSROOMS}/${classroomId}/feedback`;
  return s !== "" ? `${base}?${s}` : base;
};

export const feedbackStudentPath = (
  classroomId: string,
  studentId: string,
  week: string
): string =>
  `${ROUTES.CLASSROOMS}/${classroomId}/feedback/students/${studentId}?week=${encodeURIComponent(week)}`;

export const ROUTE_LABELS: Record<string, string> = {
  [ROUTES.HOME]: "Inicio",
  [ROUTES.CHAT]: "Asistentes",
  [ROUTES.SETTINGS]: "Configuración",
  [ROUTES.CLASSROOMS]: "Mis aulas",
  [ROUTES.FEEDBACK]: "Devoluciones",
  [ROUTES.DOCUMENTS]: "Documentos",
};

export const BREADCRUMB_MAP: Record<
  string,
  Array<{ label: string; href?: string }>
> = {
  [ROUTES.HOME]: [{ label: "Inicio" }],
  [ROUTES.CHAT]: [
    { label: "Inicio", href: `#${ROUTES.HOME}` },
    { label: "Asistentes" },
  ],
  [ROUTES.SETTINGS]: [
    { label: "Inicio", href: `#${ROUTES.HOME}` },
    { label: "Configuración" },
  ],
  [ROUTES.CLASSROOMS]: [
    { label: "Inicio", href: `#${ROUTES.HOME}` },
    { label: "Mis aulas" },
  ],
  [ROUTES.FEEDBACK]: [
    { label: "Inicio", href: `#${ROUTES.HOME}` },
    { label: "Devoluciones" },
  ],
  [ROUTES.DOCUMENTS]: [
    { label: "Inicio", href: `#${ROUTES.HOME}` },
    { label: "Documentos" },
  ],
};
