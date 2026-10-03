"use client";

import { useSession } from "next-auth/react";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { useConfirmLogout } from "@/hooks/use-confirm-logout";
import { LogOut } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { SidebarMenu, SidebarMenuItem } from "@/components/ui/sidebar";
import { getInitials } from "@/utils/string";

export function NavUser() {
  const { confirmLogout, dialogProps } = useConfirmLogout();
  const { data: session } = useSession();
  const name = session?.user?.name ?? "?";
  const initials = getInitials(name);

  return (
    <>
      <SidebarMenu>
        <SidebarMenuItem className="flex items-center gap-2 px-[7px]">
          <Avatar className="size-8 shrink-0">
            <AvatarFallback className="bg-sidebar-accent text-sidebar-accent-foreground">
              {initials}
            </AvatarFallback>
          </Avatar>
          <span className="min-w-0 flex-1 truncate text-sm font-medium text-sidebar-foreground group-data-[collapsible=icon]:hidden">
            {name}
          </span>
          <Button
            variant="ghost"
            size="icon"
            className="size-8 shrink-0 text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground group-data-[collapsible=icon]:hidden"
            title="Log out"
            onClick={() => void confirmLogout()}
          >
            <LogOut className="size-5" />
          </Button>
        </SidebarMenuItem>
      </SidebarMenu>
      <ConfirmDialog {...dialogProps} />
    </>
  );
}
