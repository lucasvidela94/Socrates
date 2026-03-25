import { NavLink, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Settings,
  GraduationCap,
  MessageSquare,
  School,
  ClipboardCheck,
  FileText,
} from "lucide-react";
import { ROUTES } from "@shared/lib/routes";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  SidebarSeparator,
} from "@/components/ui/sidebar";

const navItemClass =
  "relative gap-3 overflow-hidden rounded-lg transition-[background-color,color,box-shadow] duration-150 before:pointer-events-none before:absolute before:inset-y-2 before:left-0 before:w-[3px] before:rounded-r-full before:bg-primary before:opacity-0 before:transition-opacity data-[active=true]:bg-sidebar-accent data-[active=true]:shadow-[inset_0_0_0_1px_oklch(0.88_0.01_95_/_0.6)] data-[active=true]:before:opacity-100 [&>svg]:opacity-80 data-[active=true]:[&>svg]:opacity-100";

export function AppSidebar(): React.ReactElement {
  const location = useLocation();
  const path = location.pathname;
  const isExact = (route: string) => path === route;
  const isUnder = (prefix: string) => path === prefix || path.startsWith(`${prefix}/`);

  return (
    <Sidebar collapsible="icon" variant="floating" className="z-20">
      <SidebarHeader className="gap-0 border-b border-sidebar-border/80 px-3 pb-4 pt-3">
        <div className="flex items-center gap-3 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:gap-0">
          <div
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-sidebar-primary text-sidebar-primary-foreground shadow-[0_1px_2px_oklch(0_0_0_/_0.06)] ring-1 ring-sidebar-border/50"
            aria-hidden
          >
            <GraduationCap className="h-5 w-5" strokeWidth={2} />
          </div>
          <div className="flex min-w-0 flex-col gap-0.5 leading-none group-data-[collapsible=icon]:hidden">
            <span className="truncate font-semibold tracking-tight text-sidebar-foreground">
              Sócrates
            </span>
            <span className="truncate text-[11px] font-medium uppercase tracking-[0.12em] text-sidebar-foreground/50">
              Para docentes
            </span>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent className="gap-0 px-2 pb-4 pt-3">
        <SidebarGroup className="p-0">
          <SidebarGroupLabel className="mb-1.5 px-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-sidebar-foreground/45">
            Principal
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="gap-0.5">
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={isExact(ROUTES.HOME)}
                  tooltip="Inicio"
                  className={navItemClass}
                >
                  <NavLink to={ROUTES.HOME}>
                    <LayoutDashboard className="h-4 w-4 shrink-0" />
                    <span>Inicio</span>
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={isExact(ROUTES.CHAT)}
                  tooltip="Asistentes"
                  className={navItemClass}
                >
                  <NavLink to={ROUTES.CHAT}>
                    <MessageSquare className="h-4 w-4 shrink-0" />
                    <span>Asistentes</span>
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarSeparator className="my-4 bg-sidebar-border/90" />

        <SidebarGroup className="p-0">
          <SidebarGroupLabel className="mb-1.5 px-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-sidebar-foreground/45">
            Aula y seguimiento
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="gap-0.5">
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={isUnder(ROUTES.CLASSROOMS)}
                  tooltip="Mis aulas"
                  className={navItemClass}
                >
                  <NavLink to={ROUTES.CLASSROOMS}>
                    <School className="h-4 w-4 shrink-0" />
                    <span>Mis aulas</span>
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={isExact(ROUTES.FEEDBACK)}
                  tooltip="Devoluciones"
                  className={navItemClass}
                >
                  <NavLink to={ROUTES.FEEDBACK}>
                    <ClipboardCheck className="h-4 w-4 shrink-0" />
                    <span>Devoluciones</span>
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={isExact(ROUTES.DOCUMENTS)}
                  tooltip="Documentos"
                  className={navItemClass}
                >
                  <NavLink to={ROUTES.DOCUMENTS}>
                    <FileText className="h-4 w-4 shrink-0" />
                    <span>Documentos</span>
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border/80 p-2 pt-3">
        <SidebarMenu className="gap-0.5">
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              isActive={isExact(ROUTES.SETTINGS)}
              tooltip="Conexión de IA"
              className={`${navItemClass} text-sidebar-foreground/90`}
            >
              <NavLink to={ROUTES.SETTINGS}>
                <Settings className="h-4 w-4 shrink-0" />
                <span>Conexión de IA</span>
              </NavLink>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}
