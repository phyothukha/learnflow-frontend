"use client";

import { useState } from "react";
import { Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { createId } from "@/store/client/planner-store";
import type { GoalTaskStep } from "@/store/server/goals/interface";

export interface GoalStepChecklistProps {
  steps: GoalTaskStep[];
  onChange: (steps: GoalTaskStep[]) => void;
  className?: string;
}

export function GoalStepChecklist({
  steps,
  onChange,
  className,
}: GoalStepChecklistProps) {
  const [draft, setDraft] = useState("");

  const add = () => {
    const title = draft.trim();
    if (!title) return;
    onChange([...steps, { Id: createId("st"), Title: title, Done: false }]);
    setDraft("");
  };

  return (
    <div className={cn("space-y-1", className)}>
      {steps.map((step) => (
        <div
          key={step.Id}
          className="group flex items-center gap-2 rounded-md px-1.5 py-1 hover:bg-muted/60"
        >
          <Checkbox
            checked={step.Done}
            aria-label={`Mark ${step.Title} done`}
            onCheckedChange={(checked) =>
              onChange(
                steps.map((item) =>
                  item.Id === step.Id
                    ? { ...item, Done: checked === true }
                    : item,
                ),
              )
            }
          />
          <span
            className={cn(
              "min-w-0 flex-1 truncate text-sm",
              step.Done && "text-muted-foreground line-through",
            )}
          >
            {step.Title}
          </span>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            className="size-6 text-muted-foreground opacity-0 group-hover:opacity-100 hover:text-destructive focus-visible:opacity-100"
            aria-label={`Remove ${step.Title}`}
            onClick={() =>
              onChange(steps.filter((item) => item.Id !== step.Id))
            }
          >
            <X />
          </Button>
        </div>
      ))}
      <div className="flex items-center gap-2 pt-1">
        <Input
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => {
            if (event.key !== "Enter") return;
            event.preventDefault();
            add();
          }}
          placeholder="Add a step"
          className="h-8"
        />
        <Button
          type="button"
          variant="subtle"
          size="icon-sm"
          aria-label="Add step"
          disabled={!draft.trim()}
          onClick={add}
        >
          <Plus />
        </Button>
      </div>
    </div>
  );
}
