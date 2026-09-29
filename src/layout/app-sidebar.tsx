"use client";

import * as React from "react";
import { GraduationCap } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarSeparator,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { NavMain } from "./nav-main";
import { NavUser } from "./nav-user";
import { navLinks } from "@/assets/nav-links";
import { usePermission } from "@/hooks/use-permission";

function BrandHeader() {
  return (
    <div className="flex items-center justify-between gap-2">
      <div className="flex min-w-0 items-center gap-2 text-sidebar-foreground group-data-[collapsible=icon]:hidden">
        <GraduationCap className="size-5 shrink-0" />
        <span className="truncate font-poppins text-lg font-bold tracking-tight">
          LearnFlow
        </span>
      </div>
      <SidebarTrigger className="size-10 shrink-0 bg-transparent text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground group-data-[collapsible=icon]:mx-auto" />
    </div>
  );
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { hasAnyPermission } = usePermission();

  const visibleGroups = navLinks
    .map((group) => ({
      ...group,
      items: group.items.filter((item) =>
        hasAnyPermission(item.requiredPermissions),
      ),
    }))
    .filter((group) => group.items.length > 0);

  return (
    <Sidebar
      collapsible="icon"
      {...props}
      className="inset-y-3 left-3 h-auto overflow-hidden rounded-xl border-r-0"
    >
      <SidebarHeader className="p-3">
        <BrandHeader />
      </SidebarHeader>
      <SidebarSeparator className="mx-3 my-0" />
      <SidebarContent className="px-3 py-2 group-data-[collapsible=icon]:px-0">
        {visibleGroups.map((group, index) => (
          <NavMain items={group.items} title={group.title} key={index} />
        ))}
      </SidebarContent>
      <SidebarSeparator className="mx-3 my-0" />
      <SidebarFooter className="gap-3 p-3">
        <NavUser />
      </SidebarFooter>
    </Sidebar>
  );
}
