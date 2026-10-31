"use client";

import { toast } from "sonner";
import type { GoalTemplateUsage } from "../data/fake-activity";
import { CardLinkAction, SectionCard } from "./dashboard-card";

export interface GoalTemplatesCardProps {
  templates: GoalTemplateUsage[];
  className?: string;
}

export function GoalTemplatesCard({
  templates,
  className,
}: GoalTemplatesCardProps) {
  return (
    <SectionCard
      title="Top goal templates"
      className={className}
      action={
        <CardLinkAction
          label="Manage"
          onClick={() => toast.info("Goal templates are coming soon.")}
        />
      }
    >
      <ul className="mt-4 divide-y">
        {templates.map((template) => (
          <li
            key={template.Id}
            className="flex items-center justify-between gap-3 py-3"
          >
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">{template.Name}</p>
              <p className="truncate text-xs text-muted-foreground">
                {template.Category} · {template.Plan}
                {template.IsDraft ? " · draft" : ""}
              </p>
            </div>
            <span className="text-sm font-semibold tabular-nums">
              {template.Uses.toLocaleString()}×
            </span>
          </li>
        ))}
      </ul>
    </SectionCard>
  );
}
