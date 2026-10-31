import { Badge } from "@/components/ui/badge";
import { formatTimeAgo } from "@/utils/dashboard";
import { getInitials } from "@/utils/string";
import { MISSED_OUTCOME_META, type MissedEvent } from "../data/fake-activity";
import { SectionCard } from "./dashboard-card";

export interface MissedEventsCardProps {
  events: MissedEvent[];
  className?: string;
}

export function MissedEventsCard({ events, className }: MissedEventsCardProps) {
  return (
    <SectionCard title="Recent missed-task events" className={className}>
      <ul className="mt-4 divide-y">
        {events.map((event) => (
          <li key={event.Id} className="flex items-center gap-3 py-3">
            <span className="grid size-9 shrink-0 place-items-center rounded-full border bg-muted text-xs font-medium">
              {getInitials(event.MemberName)}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{event.MemberName}</p>
              <p className="truncate text-xs text-muted-foreground">
                {event.TaskTitle} · {formatTimeAgo(event.OccurredAt)}
              </p>
            </div>
            <Badge variant="outline">
              {MISSED_OUTCOME_META.get(event.Outcome)?.badge ?? event.Outcome}
            </Badge>
          </li>
        ))}
      </ul>
    </SectionCard>
  );
}
