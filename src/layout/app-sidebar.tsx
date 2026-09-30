"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarSeparator,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { NavMain } from "./nav-main";
import { NavUser } from "./nav-user";
import { navLinks } from "@/assets/nav-links";
import { usePermission } from "@/hooks/use-permission";

function BrandHeader() {
  const { setOpenMobile } = useSidebar();

  return (
    <div className="group/brand relative flex items-center justify-between gap-2 group-data-[collapsible=icon]:justify-center">
      <Link
        href="/dashboard"
        onClick={() => setOpenMobile(false)}
        className="flex min-w-0 items-center gap-2 rounded-md text-sidebar-foreground transition-opacity outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring group-data-[collapsible=icon]:group-hover/brand:opacity-0 group-data-[collapsible=icon]:group-has-[[data-sidebar=trigger]:focus-visible]/brand:opacity-0"
      >
        <Image
          src="/learnflow-logo.svg"
          alt="LearnFlow"
          width={28}
          height={28}
          priority
          className="size-7 shrink-0"
        />
        <span className="brand-wordmark truncate text-lg group-data-[collapsible=icon]:hidden">
          LearnFlow
        </span>
      </Link>
      <SidebarTrigger className="size-10 shrink-0 bg-transparent text-sidebar-foreground transition-opacity hover:bg-sidebar-accent hover:text-sidebar-accent-foreground group-data-[collapsible=icon]:absolute group-data-[collapsible=icon]:inset-0 group-data-[collapsible=icon]:m-auto group-data-[collapsible=icon]:opacity-0 group-data-[collapsible=icon]:focus-visible:opacity-100 group-data-[collapsible=icon]:group-hover/brand:opacity-100" />
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
      {/* 55px + 1px separator lines up with the app header's h-14 bottom border */}
      <SidebarHeader className="h-[55px] shrink-0 justify-center px-3 py-0">
        <BrandHeader />
      </SidebarHeader>
      <SidebarSeparator className="mx-3 my-0" />
      <SidebarContent className="px-[11px] py-2">
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
