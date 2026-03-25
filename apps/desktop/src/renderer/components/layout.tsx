import { Outlet } from "react-router-dom";
import { AppSidebar } from "./app-sidebar";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";

import type { ReactElement } from "react";

export const Layout = (): ReactElement => {
  return (
    <SidebarProvider defaultOpen={true}>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-14 shrink-0 items-center gap-2 border-b border-border/80 bg-background/95 px-4 backdrop-blur-sm supports-backdrop-filter:bg-background/80">
          <SidebarTrigger
            className="rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground"
            aria-label="Abrir o cerrar el menú lateral"
          />
          <Separator orientation="vertical" className="h-4 bg-border/80" />
        </header>
        <main className="flex-1 p-6">
          <Outlet />
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
};
