"use client";

import { useState } from "react";
import dayjs from "dayjs";
import { toast } from "sonner";
import { Plus, Trash2 } from "lucide-react";
import { TimePicker } from "@/components/date-picker";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Switch } from "@/components/ui/switch";
import { PREFERRED_TIMES, WEEK_ORDER, WEEKDAY_LABELS } from "@/lib/goal-meta";
import { cn } from "@/lib/utils";
import { createId, usePlannerStore } from "@/store/client/planner-store";
import type {
  AvailabilityWindow,
  PlannerSettings,
  PreferredTime,
} from "@/store/server/goals/interface";
import { startOfWeek } from "@/utils/calendar";
import { formatHours } from "@/utils/format";
import { dailyLimit, dayCapacity, toMinutes, toTime } from "@/utils/scheduler";

const DAILY_LIMIT_OPTIONS = [30, 45, 60, 90, 120, 150, 180, 240, 300];

/** Window ids that end before they start or overlap another window that day. */
function invalidWindows(windows: AvailabilityWindow[]) {
  const invalid = new Set<string>();
  for (const window of windows) {
    const start = toMinutes(window.StartTime);
    const end = toMinutes(window.EndTime);
    if (end <= start) invalid.add(window.Id);
    for (const other of windows)
      if (
        other.Id !== window.Id &&
        other.DayOfWeek === window.DayOfWeek &&
        start < toMinutes(other.EndTime) &&
        toMinutes(other.StartTime) < end
      )
        invalid.add(window.Id);
  }
  return invalid;
}

export interface PlannerAvailabilitySheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PlannerAvailabilitySheet({
  open,
  onOpenChange,
}: PlannerAvailabilitySheetProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full gap-0 sm:max-w-xl">
        {open && <AvailabilityForm onDone={() => onOpenChange(false)} />}
      </SheetContent>
    </Sheet>
  );
}

interface AvailabilityFormProps {
  onDone: () => void;
}

function AvailabilityForm({ onDone }: AvailabilityFormProps) {
  const saved = usePlannerStore((state) => state.availability);
  const savedSettings = usePlannerStore((state) => state.settings);
  const saveAvailability = usePlannerStore((state) => state.saveAvailability);
  const [windows, setWindows] = useState(saved);
  const [settings, setSettings] = useState(savedSettings);

  const invalid = invalidWindows(windows);
  const monday = startOfWeek(dayjs());
  const weeklyCapacity = WEEK_ORDER.reduce(
    (sum, _, index) =>
      sum + dayCapacity(monday.add(index, "day"), windows, settings),
    0,
  );

  const patchSettings = (patch: Partial<PlannerSettings>) =>
    setSettings((current) => ({ ...current, ...patch }));

  const updateWindow = (id: string, patch: Partial<AvailabilityWindow>) =>
    setWindows((current) =>
      current.map((window) =>
        window.Id === id ? { ...window, ...patch } : window,
      ),
    );

  const addWindow = (day: number) => {
    const last = windows
      .filter((window) => window.DayOfWeek === day)
      .sort((a, b) => a.EndTime.localeCompare(b.EndTime))
      .at(-1);
    const start = last
      ? Math.min(toMinutes(last.EndTime) + 30, 22 * 60)
      : 20 * 60;
    setWindows((current) => [
      ...current,
      {
        Id: createId("w"),
        DayOfWeek: day,
        StartTime: toTime(start),
        EndTime: toTime(Math.min(start + 60, 23 * 60 + 45)),
      },
    ]);
  };

  const toggleRestDay = (day: number, rest: boolean) =>
    patchSettings({
      RestDays: rest
        ? [...settings.RestDays, day]
        : settings.RestDays.filter((d) => d !== day),
    });

  const togglePreferred = (time: PreferredTime) =>
    patchSettings({
      PreferredTimes: settings.PreferredTimes.includes(time)
        ? settings.PreferredTimes.filter((t) => t !== time)
        : [...settings.PreferredTimes, time],
    });

  const save = () => {
    saveAvailability(windows, settings);
    toast.success("Availability saved. Regenerate your plan to use it.");
    onDone();
  };

  return (
    <>
      <SheetHeader className="border-b">
        <SheetTitle>Availability</SheetTitle>
        <SheetDescription>
          {formatHours(weeklyCapacity)} per week · daily limit{" "}
          {formatHours(dailyLimit(settings))}. The planner only uses these
          slots.
        </SheetDescription>
      </SheetHeader>

      <div className="flex-1 space-y-6 overflow-y-auto p-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="daily-limit">Max study time per day</Label>
            <Select
              value={String(settings.MaxDailyMinutes)}
              onValueChange={(value) =>
                patchSettings({ MaxDailyMinutes: Number(value) })
              }
            >
              <SelectTrigger id="daily-limit" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {DAILY_LIMIT_OPTIONS.map((minutes) => (
                  <SelectItem key={minutes} value={String(minutes)}>
                    {formatHours(minutes)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Workload after reviews</Label>
            <div className="flex h-9 items-center justify-between gap-3 rounded-md bg-muted/60 px-3 text-sm">
              <span className="tabular-nums">{settings.WorkloadPercent}%</span>
              <Button
                variant="ghost"
                size="xs"
                disabled={settings.WorkloadPercent === 100}
                onClick={() => patchSettings({ WorkloadPercent: 100 })}
              >
                Reset
              </Button>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <Label>Preferred study time</Label>
          <div className="flex flex-wrap gap-2">
            {Array.from(PREFERRED_TIMES, ([value, meta]) => {
              const selected = settings.PreferredTimes.includes(value);
              return (
                <button
                  key={value}
                  type="button"
                  aria-pressed={selected}
                  onClick={() => togglePreferred(value)}
                  className={cn(
                    "dashboard-chip",
                    selected &&
                      "border-primary/40 bg-primary/10 text-primary hover:text-primary",
                  )}
                >
                  {meta.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="divide-y rounded-lg border">
          {WEEK_ORDER.map((day) => {
            const rest = settings.RestDays.includes(day);
            const dayWindows = windows
              .filter((window) => window.DayOfWeek === day)
              .sort((a, b) => a.StartTime.localeCompare(b.StartTime));
            return (
              <div key={day} className="space-y-2 p-3">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-medium">{WEEKDAY_LABELS[day]}</p>
                  <label className="flex items-center gap-2 text-xs text-muted-foreground">
                    Study day
                    <Switch
                      checked={!rest}
                      onCheckedChange={(on) => toggleRestDay(day, !on)}
                      aria-label={`${WEEKDAY_LABELS[day]} is a study day`}
                    />
                  </label>
                </div>
                <div
                  className={cn(
                    "space-y-2",
                    rest && "pointer-events-none opacity-50",
                  )}
                >
                  {dayWindows.map((window) => (
                    <div key={window.Id} className="space-y-1">
                      <div className="flex items-center gap-2">
                        <TimePicker
                          value={window.StartTime}
                          onChange={(StartTime) =>
                            updateWindow(window.Id, { StartTime })
                          }
                          aria-invalid={invalid.has(window.Id)}
                          aria-label="Start time"
                        />
                        <span className="text-sm text-muted-foreground">
                          to
                        </span>
                        <TimePicker
                          value={window.EndTime}
                          onChange={(EndTime) =>
                            updateWindow(window.Id, { EndTime })
                          }
                          aria-invalid={invalid.has(window.Id)}
                          aria-label="End time"
                        />
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          className="shrink-0 text-muted-foreground hover:text-destructive"
                          aria-label="Remove time slot"
                          onClick={() =>
                            setWindows((current) =>
                              current.filter((w) => w.Id !== window.Id),
                            )
                          }
                        >
                          <Trash2 />
                        </Button>
                      </div>
                      {invalid.has(window.Id) && (
                        <p className="text-xs text-destructive">
                          End must be after start, and slots can&apos;t overlap.
                        </p>
                      )}
                    </div>
                  ))}
                  <Button
                    variant="ghost"
                    size="xs"
                    onClick={() => addWindow(day)}
                  >
                    <Plus /> Add time
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <SheetFooter className="flex-row justify-end border-t">
        <Button variant="subtle" onClick={onDone}>
          Cancel
        </Button>
        <Button disabled={invalid.size > 0} onClick={save}>
          Save availability
        </Button>
      </SheetFooter>
    </>
  );
}
