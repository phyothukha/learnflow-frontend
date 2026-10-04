"use client";

import { type PropsWithChildren } from "react";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/layout/app-sidebar";
import { Header } from "@/layout/header";
import { AudioAlerts } from "@/hooks/use-audio-alerts";

export interface MainLayoutProps extends PropsWithChildren {
  sidebarOpen: boolean;
}

export function MainLayout({ sidebarOpen, children }: MainLayoutProps) {
  return (
    <SidebarProvider
      defaultOpen={sidebarOpen}
      className="flex h-dvh min-h-0 w-full flex-col gap-0 overflow-hidden p-0 md:flex-row md:gap-3 md:p-3"
      style={{ background: "var(--sidebar-wrapper)" }}
    >
      <AppSidebar />
      <SidebarInset className="min-h-0 overflow-hidden md:rounded-xl">
        <AudioAlerts />
        <Header />
        {/* Absolute fill so h-full children get a definite height; padding lives outside the scroll box */}
        <main className="relative min-h-0 min-w-0 flex-1">
          <div className="absolute inset-0 p-4 md:p-6">
            <div className="flex h-full min-h-0 min-w-0 flex-col overflow-y-auto overflow-x-hidden">
              {children}
            </div>
          </div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
