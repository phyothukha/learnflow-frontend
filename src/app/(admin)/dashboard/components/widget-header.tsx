"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CardHeader, CardTitle } from "@/components/ui/card";

export function WidgetHeader({
  title,
  href,
  linkLabel,
}: {
  title: string;
  href: string;
  linkLabel: string;
}) {
  return (
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
      <CardTitle className="text-sm font-medium">{title}</CardTitle>
      <Button variant="ghost" size="sm" className="h-7 text-xs" asChild>
        <Link href={href}>
          {linkLabel}
          <ArrowRight className="size-3" />
        </Link>
      </Button>
    </CardHeader>
  );
}
