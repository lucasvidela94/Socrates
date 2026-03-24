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
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar";

export function AppSidebar(): React.ReactElement {
  const location = useLocation();
  const path = location.pathname;
  const isExact = (route: string) => path === route;
  const isUnder = (prefix: string) => path === prefix || path.startsWith(`${prefix}/`);

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <div className="flex items-center gap-2 px-2 py-1">
          <GraduationCap className="h-8 w-8 text-sidebar-foreground" aria-hidden />
          <span className="font-semibold text-sidebar-foreground group-data-[collapsible=icon]:hidden">
            Sócrates
          </span>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Menú</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={isExact(ROUTES.HOME)} tooltip="Inicio">
                  <NavLink to={ROUTES.HOME}>
                    <LayoutDashboard className="h-4 w-4" />
                    <span>Inicio</span>
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={isExact(ROUTES.CHAT)} tooltip="Asistentes">
                  <NavLink to={ROUTES.CHAT}>
                    <MessageSquare className="h-4 w-4" />
                    <span>Asistentes</span>
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={isUnder(ROUTES.CLASSROOMS)} tooltip="Mis aulas">
                  <NavLink to={ROUTES.CLASSROOMS}>
                    <School className="h-4 w-4" />
                    <span>Mis aulas</span>
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={isExact(ROUTES.FEEDBACK)} tooltip="Devoluciones">
                  <NavLink to={ROUTES.FEEDBACK}>
                    <ClipboardCheck className="h-4 w-4" />
                    <span>Devoluciones</span>
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={isExact(ROUTES.DOCUMENTS)} tooltip="Documentos">
                  <NavLink to={ROUTES.DOCUMENTS}>
                    <FileText className="h-4 w-4" />
                    <span>Documentos</span>
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={isExact(ROUTES.SETTINGS)}
                  tooltip="Conexión de IA"
                >
                  <NavLink to={ROUTES.SETTINGS}>
                    <Settings className="h-4 w-4" />
                    <span>Conexión de IA</span>
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  );
}
