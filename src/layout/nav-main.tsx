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
import type { NavLinkItem } from "@/assets/nav-links";

type IndicatorRect = {
  top: number;
  left: number;
  width: number;
  height: number;
};

export function NavMain({
  items,
  title,
}: {
  items: NavLinkItem[];
  title?: string;
}) {
  const pathname = usePathname();
  const { setOpenMobile } = useSidebar();
  const menuRef = useRef<HTMLUListElement>(null);
  const [indicator, setIndicator] = useState<IndicatorRect | null>(null);

  const [pending, setPending] = useState<{ href: string; from: string } | null>(
    null,
  );

  const routeHref = items.find((item) => pathname.startsWith(item.href))?.href;
  const activeHref =
    pending && pending.from === pathname ? pending.href : routeHref;

  useLayoutEffect(() => {
    const menu = menuRef.current;
    if (!menu) return;

    const measure = () => {
      const active = activeHref
        ? menu.querySelector<HTMLElement>(`[data-nav-href="${activeHref}"]`)
        : null;
      if (!active) {
        setIndicator(null);
        return;
      }
      const menuBox = menu.getBoundingClientRect();
      const box = active.getBoundingClientRect();
      setIndicator({
        top: box.top - menuBox.top,
        left: box.left - menuBox.left,
        width: box.width,
        height: box.height,
      });
    };

    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(menu);
    return () => observer.disconnect();
  }, [activeHref]);

  return (
    <SidebarGroup className="p-0">
      {title && <SidebarGroupLabel>{title}</SidebarGroupLabel>}
      <SidebarMenu ref={menuRef} className="relative gap-1">
        <span
          aria-hidden
          className="pointer-events-none absolute top-0 left-0 rounded-md bg-sidebar-accent transition-[transform,width,height,opacity] duration-300 ease-in-out before:absolute before:inset-y-2.5 before:left-0 before:w-1 before:rounded-r-full before:bg-sidebar-primary before:content-['']"
          style={{
            opacity: indicator ? 1 : 0,
            transform: `translate(${indicator?.left ?? 0}px, ${indicator?.top ?? 0}px)`,
            width: indicator?.width ?? 0,
            height: indicator?.height ?? 0,
          }}
        />
        {items.map((item) => (
          <SidebarMenuItem key={item.href}>
            <SidebarMenuButton
              asChild
              isActive={item.href === activeHref}
              className="data-[active=true]:bg-transparent data-[active=true]:before:hidden data-[active=true]:hover:bg-transparent"
            >
              <Link
                href={item.href}
                data-nav-href={item.href}
                onClick={() => {
                  setOpenMobile(false);
                  if (item.href !== routeHref) {
                    setPending({ href: item.href, from: pathname });
                  }
                }}
              >
                <item.icon />
                <span className="font-poppins group-data-[collapsible=icon]:hidden">
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
