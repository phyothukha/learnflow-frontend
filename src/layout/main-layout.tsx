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
      className="flex min-h-dvh w-full flex-col gap-0 p-0 md:h-dvh md:flex-row md:gap-3 md:overflow-hidden md:p-3"
      style={{
        background:
          "linear-gradient(108deg, rgba(0,0,0,0.10) 1.74%, rgba(0,124,106,0.10) 100%), var(--Background-other-background-primary, #007C6A)",
      }}
    >
      <AppSidebar />
      <SidebarInset className="overflow-hidden md:rounded-xl">
        <AudioAlerts />
        <Header />
        <main className="flex-1 overflow-y-auto p-4 md:p-6">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}
