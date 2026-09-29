"use client";

import { useLayoutEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";
import type { NavLinkItem } from "@/assets/nav-links";

interface IndicatorPosition {
  top: number;
  height: number;
}

interface PendingNav {
  href: string;
  from: string;
}

export interface NavMainProps {
  items: NavLinkItem[];
  title?: string;
}

export function NavMain({ items, title }: NavMainProps) {
  const pathname = usePathname();
  const { setOpenMobile } = useSidebar();
  const menuRef = useRef<HTMLUListElement>(null);
  const [indicator, setIndicator] = useState<IndicatorPosition | null>(null);
  const [animate, setAnimate] = useState(false);

  const [pending, setPending] = useState<PendingNav | null>(null);

  const routeHref = items.find((item) => pathname.startsWith(item.href))?.href;
  const activeHref =
    pending && pending.from === pathname ? pending.href : routeHref;

  useLayoutEffect(() => {
    const menu = menuRef.current;
    if (!menu) return;

    // offsetTop/offsetHeight ignore the sidebar's width transition, so the
    // indicator stays pinned to its row while expanding or collapsing.
    const measure = () => {
      const item = activeHref
        ? menu.querySelector<HTMLElement>(`[data-nav-item="${activeHref}"]`)
        : null;
      setIndicator(
        item ? { top: item.offsetTop, height: item.offsetHeight } : null,
      );
    };

    measure();
    const frame = requestAnimationFrame(() => setAnimate(true));
    const observer = new ResizeObserver(measure);
    observer.observe(menu);
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
    };
  }, [activeHref]);

  return (
    <SidebarGroup className="p-0">
      {title && <SidebarGroupLabel>{title}</SidebarGroupLabel>}
      <SidebarMenu ref={menuRef} className="relative gap-1">
        <span
          aria-hidden
          className={cn(
            "pointer-events-none absolute inset-x-0 top-0 rounded-md bg-sidebar-accent before:absolute before:inset-y-2.5 before:left-0 before:w-1 before:rounded-r-full before:bg-sidebar-primary before:content-['']",
            animate &&
              "transition-[transform,opacity] duration-300 ease-in-out",
          )}
          style={{
            opacity: indicator ? 1 : 0,
            transform: `translateY(${indicator?.top ?? 0}px)`,
            height: indicator?.height ?? 0,
          }}
        />
        {items.map((item) => (
          <SidebarMenuItem key={item.href} data-nav-item={item.href}>
            <SidebarMenuButton
              asChild
              isActive={item.href === activeHref}
              className="data-[active=true]:bg-transparent data-[active=true]:before:hidden data-[active=true]:hover:bg-transparent"
            >
              <Link
                href={item.href}
                onClick={() => {
                  setOpenMobile(false);
                  if (item.href !== routeHref) {
                    setPending({ href: item.href, from: pathname });
                  }
                }}
              >
                <item.icon />
                <span className="shrink-0 font-poppins transition-opacity duration-200 ease-linear group-data-[collapsible=icon]:opacity-0">
                  {item.title}
                </span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        ))}
      </SidebarMenu>
    </SidebarGroup>
  );
}
