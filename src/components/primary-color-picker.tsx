"use client";

import { useEffect, useState } from "react";
import { Check, Palette } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  DEFAULT_PRIMARY_COLOR,
  PRIMARY_COLORS,
  PRIMARY_COLOR_STORAGE_KEY,
  applyPrimaryColor,
  isPrimaryColorId,
  type PrimaryColorId,
} from "@/config/primary-colors";

export function PrimaryColorPicker() {
  const [current, setCurrent] = useState<PrimaryColorId>(DEFAULT_PRIMARY_COLOR);

  useEffect(() => {
    const saved = document.documentElement.dataset.primary;
    if (isPrimaryColorId(saved)) setCurrent(saved);
  }, []);

  const select = (id: PrimaryColorId) => {
    setCurrent(id);
    applyPrimaryColor(id);
    try {
      localStorage.setItem(PRIMARY_COLOR_STORAGE_KEY, id);
    } catch {}
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="size-8 rounded-full text-muted-foreground"
          aria-label="Change primary color"
          title="Primary color"
        >
          <Palette className="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44">
        <DropdownMenuLabel>Primary color</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {PRIMARY_COLORS.map((color) => (
          <DropdownMenuItem key={color.id} onSelect={() => select(color.id)}>
            <span
              className="size-4 shrink-0 rounded-full ring-1 ring-black/10 ring-inset"
              style={{ backgroundColor: color.value }}
            />
            {color.label}
            {current === color.id && <Check className="ml-auto size-4" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
