export const ROUTES = {
  HOME: "/",
  CHAT: "/chat",
  SETTINGS: "/settings",
  CLASSROOMS: "/classrooms",
  FEEDBACK: "/feedback",
  DOCUMENTS: "/documents",
} as const;

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
