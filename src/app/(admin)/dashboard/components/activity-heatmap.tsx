"use client";

import Link from "next/link";
import dayjs from "dayjs";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useFetchStudyBlocks } from "@/store/server/study-blocks/queries";
import { TOPIC_COLORS } from "@/lib/topic-colors";
import { cn } from "@/lib/utils";
import { blockMinutes } from "./dashboard-utils";

const HEATMAP_WEEKS = 26;
// Sequential single-hue ramp (indigo, light→dark via alpha over the surface).
const HEATMAP_STEPS = [0.18, 0.4, 0.65, 0.9];
const HEATMAP_HUE = TOPIC_COLORS[0];

function heatmapCellStyle(minutes: number): React.CSSProperties {
  if (minutes <= 0) return { backgroundColor: "var(--muted)" };
  const step = minutes >= 120 ? 3 : minutes >= 60 ? 2 : minutes >= 30 ? 1 : 0;
  return { backgroundColor: HEATMAP_HUE, opacity: HEATMAP_STEPS[step] };
}

export function ActivityHeatmap({ className }: { className?: string }) {
  const start = dayjs()
    .startOf("week")
    .subtract(HEATMAP_WEEKS - 1, "week");

  // Up to 200 blocks over the window (server pages are capped at 100).
  const { data: page0 } = useFetchStudyBlocks({
    from: start.toISOString(),
    limit: 100,
    page: 0,
    orderby: "StartAt desc",
  });
  const { data: page1 } = useFetchStudyBlocks({
    from: start.toISOString(),
    limit: 100,
    page: 1,
    orderby: "StartAt desc",
  });
  const blocks = [...(page0?.value ?? []), ...(page1?.value ?? [])];

  const perDay = new Map<string, { minutes: number; count: number }>();
  for (const block of blocks) {
    if (block.Status !== "Done") continue;
    const key = dayjs(block.StartAt).format("YYYY-MM-DD");
    const entry = perDay.get(key) ?? { minutes: 0, count: 0 };
    entry.minutes += blockMinutes(block);
    entry.count += 1;
    perDay.set(key, entry);
  }

  const today = dayjs().endOf("day");
  const totalActive = [...perDay.values()].filter((d) => d.minutes > 0).length;

  const weeks = Array.from({ length: HEATMAP_WEEKS }, (_, w) =>
    Array.from({ length: 7 }, (_, d) => {
      const date = start.add(w, "week").add(d, "day");
      const entry = perDay.get(date.format("YYYY-MM-DD"));
      return {
        date,
        isFuture: date.isAfter(today),
        minutes: entry?.minutes ?? 0,
        count: entry?.count ?? 0,
      };
    }),
  );

  const weekdayLabels = ["", "Mon", "", "Wed", "", "Fri", ""];

  return (
    <Card className={cn("shadow-sm", className)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
        <div>
          <CardTitle className="text-sm font-medium">Daily activity</CardTitle>
          <p className="text-xs text-muted-foreground">
            {totalActive} active day{totalActive === 1 ? "" : "s"} in the last{" "}
            {HEATMAP_WEEKS} weeks
          </p>
        </div>
        <Button variant="ghost" size="sm" className="h-7 text-xs" asChild>
          <Link href="/timeline">
            Open timeline
            <ArrowRight className="size-3" />
          </Link>
        </Button>
      </CardHeader>
      <CardContent>
        <div
          className="grid w-full gap-[3px]"
          style={{
            gridTemplateColumns: `32px repeat(${HEATMAP_WEEKS}, minmax(0, 1fr))`,
          }}
        >
          {/* month labels */}
          <div />
          {weeks.map((week, w) => {
            const first = week[0].date;
            const prev = w > 0 ? weeks[w - 1][0].date : null;
            const label =
              !prev || first.month() !== prev.month()
                ? first.format("MMM")
                : "";
            return (
              <div
                key={`m${w}`}
                className="h-4 overflow-visible whitespace-nowrap text-[10px] text-muted-foreground"
              >
                {label}
              </div>
            );
          })}

          {/* weekday gutter + cells, row by row */}
          {Array.from({ length: 7 }, (_, d) => (
            <div key={`row${d}`} className="contents">
              <div className="flex items-center text-[10px] text-muted-foreground">
                {weekdayLabels[d]}
              </div>
              {weeks.map((week) => {
                const day = week[d];
                return (
                  <div
                    key={day.date.format("YYYY-MM-DD")}
                    className={cn(
                      "aspect-square w-full rounded-[4px]",
                      day.isFuture && "opacity-0",
                    )}
                    style={
                      day.isFuture ? undefined : heatmapCellStyle(day.minutes)
                    }
                    title={`${day.date.format("MMM D, YYYY")} — ${
                      day.minutes > 0
                        ? `${day.minutes} min · ${day.count} block${day.count === 1 ? "" : "s"}`
                        : "no activity"
                    }`}
                  />
                );
              })}
            </div>
          ))}
        </div>

        <div className="mt-3 flex items-center justify-end gap-1 text-[10px] text-muted-foreground">
          <span>Less</span>
          <div className="size-3 rounded-[3px]" style={heatmapCellStyle(0)} />
          {HEATMAP_STEPS.map((_, i) => (
            <div
              key={i}
              className="size-3 rounded-[3px]"
              style={heatmapCellStyle([15, 45, 90, 150][i])}
            />
          ))}
          <span>More</span>
        </div>
      </CardContent>
    </Card>
  );
}
