import type React from "react";
import { createFileRoute, Outlet } from "@tanstack/react-router";
import { AppSidebar } from "../../components/app-sidebar";
import { SidebarInset, SidebarProvider } from "ui/sidebar";
import { AppHeader } from "../../components/app-header";

export const Route = createFileRoute("/app")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <div className="h-dvh">
      <SidebarProvider
        style={
          {
            "--header-height": "calc(var(--spacing) * 12)",
          } as React.CSSProperties
        }
      >
        <AppSidebar />
        <SidebarInset>
          <AppHeader />
          <main className="flex flex-1 flex-col">
            <Outlet />
          </main>
        </SidebarInset>
      </SidebarProvider>
    </div>
  );
}
