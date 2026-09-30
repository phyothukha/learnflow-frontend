"use client";

import { Check, PlusCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

const MAX_INLINE_BADGES = 2;
const SEARCHABLE_MIN_OPTIONS = 6;
const NEUTRAL_BADGE =
  "rounded-sm border-transparent bg-foreground/10 px-1 font-normal text-foreground";

export interface FacetedFilterOption<T extends string> {
  value: T;
  label: string;
  /** Tailwind background class for a leading dot, e.g. "bg-emerald-500". */
  dotClass?: string;
}

export interface DataTableFacetedFilterProps<T extends string> {
  title: string;
  options: FacetedFilterOption<T>[];
  selected: T[];
  onChange: (values: T[]) => void;
  /** Only one value at a time, e.g. when the API filters by a single value. */
  single?: boolean;
}

export function DataTableFacetedFilter<T extends string>({
  title,
  options,
  selected,
  onChange,
  single = false,
}: DataTableFacetedFilterProps<T>) {
  const selectedSet = new Set(selected);
  const labels = new Map(options.map((option) => [option.value, option.label]));

  const toggle = (value: T) => {
    if (single) {
      onChange(selectedSet.has(value) ? [] : [value]);
      return;
    }
    onChange(
      selectedSet.has(value)
        ? selected.filter((item) => item !== value)
        : [...selected, value],
    );
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="subtle" size="sm" className="h-9">
          <PlusCircle className="size-4" />
          {title}
          {selected.length > 0 && (
            <>
              <Separator orientation="vertical" className="mx-1 h-4" />
              <Badge
                variant="secondary"
                className={cn(NEUTRAL_BADGE, "lg:hidden")}
              >
                {selected.length}
              </Badge>
              <span className="hidden gap-1 lg:flex">
                {selected.length > MAX_INLINE_BADGES ? (
                  <Badge variant="secondary" className={NEUTRAL_BADGE}>
                    {selected.length} selected
                  </Badge>
                ) : (
                  selected.map((value) => (
                    <Badge
                      key={value}
                      variant="secondary"
                      className={cn(NEUTRAL_BADGE, "max-w-32 truncate")}
                    >
                      {labels.get(value) ?? value}
                    </Badge>
                  ))
                )}
              </span>
            </>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-56 p-0" align="start">
        <Command>
          {options.length >= SEARCHABLE_MIN_OPTIONS && (
            <CommandInput placeholder={title} />
          )}
          <CommandList>
            <CommandEmpty>No results found.</CommandEmpty>
            <CommandGroup>
              {options.map((option) => {
                const isSelected = selectedSet.has(option.value);
                return (
                  <CommandItem
                    key={option.value}
                    value={option.label}
                    onSelect={() => toggle(option.value)}
                  >
                    <span
                      className={cn(
                        "flex size-4 items-center justify-center border border-primary",
                        single ? "rounded-full" : "rounded-sm",
                        isSelected
                          ? "bg-primary text-primary-foreground"
                          : "opacity-50 [&_svg]:invisible",
                      )}
                    >
                      <Check className="size-3 text-current" />
                    </span>
                    {option.dotClass && (
                      <span
                        className={cn("size-2 rounded-full", option.dotClass)}
                      />
                    )}
                    <span className="truncate">{option.label}</span>
                  </CommandItem>
                );
              })}
            </CommandGroup>
            {selected.length > 0 && (
              <>
                <CommandSeparator />
                <CommandGroup>
                  <CommandItem
                    onSelect={() => onChange([])}
                    className="justify-center text-center"
                  >
                    Clear filter
                  </CommandItem>
                </CommandGroup>
              </>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
