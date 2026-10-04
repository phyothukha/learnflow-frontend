"use client";

import Link from "next/link";
import { ArrowLeft, UserCog } from "lucide-react";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";

interface NavAccountToggleProps {
  isAccountMode: boolean;
}

export function NavAccountToggle({ isAccountMode }: NavAccountToggleProps) {
  const { setOpenMobile } = useSidebar();

  const href = isAccountMode ? "/dashboard" : "/account/profile";
  const label = isAccountMode ? "Back to app" : "Account";
  const Icon = isAccountMode ? ArrowLeft : UserCog;

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <SidebarMenuButton
          asChild
          tooltip={label}
          className="border border-sidebar-border bg-sidebar-accent/40 hover:bg-sidebar-accent"
        >
          <Link href={href} onClick={() => setOpenMobile(false)}>
            <Icon />
            <span className="font-poppins group-data-[collapsible=icon]:opacity-0">
              {label}
            </span>
          </Link>
        </SidebarMenuButton>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
