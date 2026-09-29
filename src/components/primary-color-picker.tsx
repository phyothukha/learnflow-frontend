"use client";

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
import { PRIMARY_COLORS } from "@/lib/primary-colors";
import { usePrimaryColorStore } from "@/store/client/use-store";

export function PrimaryColorPicker() {
  const { primaryColor: current, setPrimaryColor } = usePrimaryColorStore();

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
        {Array.from(PRIMARY_COLORS, ([id, color]) => (
          <DropdownMenuItem key={id} onSelect={() => setPrimaryColor(id)}>
            <span
              className="size-4 shrink-0 rounded-full ring-1 ring-black/10 ring-inset"
              style={{ backgroundColor: color.value }}
            />
            {color.label}
            {current === id && <Check className="ml-auto size-4" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
