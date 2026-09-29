"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { useConfirmLogout } from "@/hooks/use-confirm-logout";
import { LogOut, Volume2, VolumeX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { ThemeToggle } from "@/components/theme-toggle";
import { PrimaryColorPicker } from "@/components/primary-color-picker";
import { TopicContextSwitcher } from "@/components/topic-context-switcher";
import { useWorkspaceStore } from "@/store/client/workspace";
import { Separator } from "@/components/ui/separator";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { navLinks } from "@/assets/nav-links";
import { useFetchTopic } from "@/store/server/topics/queries";
import { useFetchNote } from "@/store/server/notes/queries";
import { useFetchDocument } from "@/store/server/documents/queries";
import { Fragment } from "react";

const ROUTE_LABELS = new Map<string, string>(
  navLinks.flatMap((group) =>
    group.items.map((item) => [item.href.replace(/^\//, ""), item.title]),
  ),
);

interface HeaderCrumb {
  label: string;
  href?: string;
}

function useHeaderCrumbs(pathname: string) {
  const parts = pathname.split("/").filter(Boolean);
  const section = parts[0] ?? "dashboard";
  const sectionLabel =
    ROUTE_LABELS.get(section) ??
    section.charAt(0).toUpperCase() + section.slice(1);

  const topicId = section === "library" && parts[1] ? parts[1] : null;
  const documentId = section === "library" && parts[2] ? parts[2] : null;
  const noteId =
    section === "notes" && parts[1] && parts[1] !== "new" ? parts[1] : null;

  const { data: topic } = useFetchTopic(topicId);
  const { data: document } = useFetchDocument(documentId);
  const { data: note } = useFetchNote(noteId);

  const crumbs: HeaderCrumb[] = [
    {
      label: "Dashboard",
      href: section === "dashboard" ? undefined : "/dashboard",
    },
  ];

  if (section !== "dashboard") {
    crumbs.push({
      label: sectionLabel,
      href: parts.length > 1 ? `/${section}` : undefined,
    });
  }

  if (topicId) {
    crumbs.push({
      label: topic?.Title ?? "Topic",
      href: documentId ? `/library/${topicId}` : undefined,
    });
  }

  if (documentId) {
    crumbs.push({ label: document?.Title ?? "Document" });
  }

  if (section === "notes" && parts[1] === "new") {
    crumbs.push({ label: "New note" });
  } else if (noteId) {
    crumbs.push({ label: note?.Title ?? "Note" });
  }

  return crumbs;
}

export function Header() {
  const { confirmLogout, dialogProps } = useConfirmLogout();
  const pathname = usePathname();
  const { data: session } = useSession();
  const soundMuted = useWorkspaceStore((s) => s.soundMuted);
  const toggleSoundMuted = useWorkspaceStore((s) => s.toggleSoundMuted);
  const crumbs = useHeaderCrumbs(pathname);

  const showTopicSwitcher = pathname.startsWith("/notes");
  const initials = (session?.user?.name ?? "?")
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <>
      <header className="sticky top-0 z-10 flex h-14 shrink-0 items-center justify-between gap-2 border-b bg-background px-4">
        <div className="flex min-w-0 items-center gap-2">
          <SidebarTrigger className="-ml-1 shrink-0" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <Breadcrumb className="min-w-0">
            <BreadcrumbList className="flex-nowrap">
              {crumbs.map((crumb, index) => {
                const isLast = index === crumbs.length - 1;
                return (
                  <Fragment key={`${crumb.label}-${index}`}>
                    {index > 0 && <BreadcrumbSeparator />}
                    <BreadcrumbItem className="min-w-0">
                      {isLast || !crumb.href ? (
                        <BreadcrumbPage className="max-w-[10rem] truncate sm:max-w-[16rem]">
                          {crumb.label}
                        </BreadcrumbPage>
                      ) : (
                        <BreadcrumbLink asChild>
                          <Link
                            href={crumb.href}
                            className="max-w-[8rem] truncate sm:max-w-[12rem]"
                          >
                            {crumb.label}
                          </Link>
                        </BreadcrumbLink>
                      )}
                    </BreadcrumbItem>
                  </Fragment>
                );
              })}
            </BreadcrumbList>
          </Breadcrumb>
          {showTopicSwitcher && (
            <>
              <Separator
                orientation="vertical"
                className="hidden h-4 shrink-0 sm:block"
              />
              <div className="hidden min-w-0 max-w-56 sm:block">
                <TopicContextSwitcher />
              </div>
            </>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <PrimaryColorPicker />
          <ThemeToggle />
          <Button
            variant="ghost"
            size="icon"
            className="size-8"
            title={soundMuted ? "Unmute alert sounds" : "Mute alert sounds"}
            onClick={toggleSoundMuted}
          >
            {soundMuted ? (
              <VolumeX className="size-4 text-muted-foreground" />
            ) : (
              <Volume2 className="size-4" />
            )}
          </Button>
          <Separator orientation="vertical" className="mx-1 h-6" />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring">
                <Avatar className="size-8">
                  <AvatarFallback>{initials}</AvatarFallback>
                </Avatar>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>
                <div className="flex min-w-0 flex-col">
                  <span className="truncate">{session?.user?.name}</span>
                  <span className="truncate text-xs font-normal text-muted-foreground">
                    {session?.user?.email}
                  </span>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => void confirmLogout()}>
                <LogOut />
                Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>
      <ConfirmDialog {...dialogProps} />
    </>
  );
}
