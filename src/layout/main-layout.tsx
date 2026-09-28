"use client";

import { type PropsWithChildren } from "react";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/layout/app-sidebar";
import { Header } from "@/layout/header";
import { AudioAlerts } from "@/hooks/use-audio-alerts";

export function MainLayout({ children }: PropsWithChildren) {
  return (
    <SidebarProvider
      defaultOpen={false}
      className="flex h-dvh min-h-0 w-full flex-col gap-0 overflow-hidden p-0 md:flex-row md:gap-3 md:p-3"
      style={{
        background:
          "linear-gradient(108deg, rgba(0,0,0,0.10) 1.74%, rgba(0,124,106,0.10) 100%), var(--Background-other-background-primary, #007C6A)",
      }}
    >
      <AppSidebar />
      <SidebarInset className="min-h-0 overflow-hidden md:rounded-xl">
        <AudioAlerts />
        <Header />
        {/* Absolute fill so h-full children (e.g. DataTable) get a definite height on mobile too */}
        <main className="relative min-h-0 flex-1">
          <div className="absolute inset-0 overflow-y-auto p-4 md:p-6">
            {children}
          </div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
