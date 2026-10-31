"use client";

import { toast } from "sonner";
import {
  MISSED_OUTCOME_META,
  type MissedOutcomeCount,
} from "../data/fake-activity";
import { CardLinkAction, SectionCard } from "./dashboard-card";

export interface MissedOutcomesCardProps {
  outcomes: MissedOutcomeCount[];
  className?: string;
}

export function MissedOutcomesCard({
  outcomes,
  className,
}: MissedOutcomesCardProps) {
  const max = Math.max(...outcomes.map((item) => item.Count), 1);

  return (
    <SectionCard
      title="Missed-task outcomes"
      className={className}
      action={
        <CardLinkAction
          label="Rules"
          onClick={() => toast.info("Missed-task rules are coming soon.")}
        />
      }
    >
      <ul className="mt-5 space-y-4">
        {outcomes.map((item) => {
          const meta = MISSED_OUTCOME_META.get(item.Outcome);
          return (
            <li
              key={item.Outcome}
              className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)_2rem] items-center gap-3 text-sm"
            >
              <span className="truncate">{meta?.label ?? item.Outcome}</span>
              <span className="h-2 overflow-hidden rounded-full bg-muted">
                <span
                  className={`block h-full rounded-full ${meta?.barClass ?? "bg-primary"}`}
                  style={{ width: `${(item.Count / max) * 100}%` }}
                />
              </span>
              <span className="text-right font-medium tabular-nums">
                {item.Count}
              </span>
            </li>
          );
        })}
      </ul>
    </SectionCard>
  );
}
