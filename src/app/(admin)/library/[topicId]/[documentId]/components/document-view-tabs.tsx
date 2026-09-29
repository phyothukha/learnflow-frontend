"use client";

import { Code2, Eye, PenLine, Table2, type LucideIcon } from "lucide-react";
import { AnimatedTabs, AnimatedTabsVariant } from "@/components/animated-tabs";
import { DocumentKind } from "@/lib/document-types";

export enum ViewMode {
  Preview = "preview",
  Normal = "normal",
}

interface ViewOption {
  value: ViewMode;
  label: string;
  icon: LucideIcon;
}

function getViewOptions(kind: DocumentKind): ViewOption[] {
  if (kind === DocumentKind.Csv) {
    return [
      { value: ViewMode.Preview, label: "Table", icon: Table2 },
      { value: ViewMode.Normal, label: "Normal", icon: Code2 },
    ];
  }
  if (kind === DocumentKind.Markdown) {
    return [
      { value: ViewMode.Preview, label: "Preview", icon: Eye },
      { value: ViewMode.Normal, label: "Normal", icon: Code2 },
    ];
  }
  return [{ value: ViewMode.Preview, label: "Preview", icon: Eye }];
}

interface DocumentViewTabsProps {
  kind: DocumentKind;
  view: ViewMode;
  editing: boolean;
  onViewChange: (view: ViewMode) => void;
}

export function DocumentViewTabs({
  kind,
  view,
  editing,
  onViewChange,
}: DocumentViewTabsProps) {
  return (
    <AnimatedTabs
      variant={AnimatedTabsVariant.Pill}
      value={editing ? null : view}
      onValueChange={onViewChange}
      disabled={editing}
      tabClassName="gap-1.5"
      tabs={getViewOptions(kind).map((option) => ({
        value: option.value,
        label: (
          <>
            <option.icon className="size-4" />
            {option.label}
          </>
        ),
      }))}
    >
      {editing && (
        <span className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3.5 py-1.5 text-sm font-medium text-primary-foreground">
          <PenLine className="size-4" />
          Editing
        </span>
      )}
    </AnimatedTabs>
  );
}
