"use client";

import { useEffect, useRef, useState } from "react";
import { Pause, Play, RotateCcw, Square } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { usePlannerStore } from "@/store/client/planner-store";

const PRESETS = [25, 50];
const RING_RADIUS = 88;
const RING_LENGTH = 2 * Math.PI * RING_RADIUS;

export interface FocusTarget {
  taskId: string;
  entryId: string | null;
  title: string;
  minutes: number;
}

export interface FocusSessionDialogProps {
  target: FocusTarget | null;
  onOpenChange: (open: boolean) => void;
}

function formatClock(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export function FocusSessionDialog({
  target,
  onOpenChange,
}: FocusSessionDialogProps) {
  return (
    <Dialog open={!!target} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        {target && (
          <FocusTimer
            key={`${target.taskId}-${target.entryId}`}
            target={target}
            onDone={() => onOpenChange(false)}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

interface FocusTimerProps {
  target: FocusTarget;
  onDone: () => void;
}

function FocusTimer({ target, onDone }: FocusTimerProps) {
  const logFocusSession = usePlannerStore((state) => state.logFocusSession);
  const presets = [...new Set([...PRESETS, target.minutes])].sort(
    (a, b) => a - b,
  );
  const [length, setLength] = useState(target.minutes);
  const [elapsed, setElapsed] = useState(0);
  const [running, setRunning] = useState(false);
  const [complete, setComplete] = useState(true);
  const startedAt = useRef<Date | null>(null);

  const total = length * 60;
  const remaining = Math.max(0, total - elapsed);
  const finished = remaining === 0;

  useEffect(() => {
    if (!running) return;
    const timer = setInterval(() => setElapsed((value) => value + 1), 1000);
    return () => clearInterval(timer);
  }, [running]);

  useEffect(() => {
    if (!finished || !running) return;
    setRunning(false);
    toast.success("Time's up! Log the session when you're ready.");
  }, [finished, running]);

  const start = () => {
    startedAt.current ??= new Date();
    setRunning(true);
  };

  const finish = () => {
    const minutes = Math.max(1, Math.round(elapsed / 60));
    const started = startedAt.current ?? new Date();
    logFocusSession(
      {
        TaskId: target.taskId,
        EntryId: target.entryId,
        StartedAt: started.toISOString(),
        EndedAt: new Date().toISOString(),
        DurationMinutes: minutes,
      },
      complete,
    );
    toast.success(
      complete
        ? `Logged ${minutes} min and marked the session done.`
        : `Logged ${minutes} min of focus.`,
    );
    onDone();
  };

  return (
    <>
      <DialogHeader>
        <DialogTitle>Focus session</DialogTitle>
        <DialogDescription className="truncate">
          {target.title}
        </DialogDescription>
      </DialogHeader>

      <div className="flex justify-center gap-2">
        {presets.map((minutes) => (
          <button
            key={minutes}
            type="button"
            disabled={elapsed > 0}
            aria-pressed={length === minutes}
            onClick={() => setLength(minutes)}
            className={cn(
              "dashboard-chip h-8 disabled:opacity-50",
              length === minutes &&
                "border-primary/40 bg-primary/10 text-primary hover:text-primary",
            )}
          >
            {minutes} min
          </button>
        ))}
      </div>

      <div className="relative mx-auto size-52">
        <svg viewBox="0 0 200 200" className="size-full -rotate-90">
          <circle
            cx="100"
            cy="100"
            r={RING_RADIUS}
            className="fill-none stroke-muted"
            strokeWidth="10"
          />
          <circle
            cx="100"
            cy="100"
            r={RING_RADIUS}
            className="fill-none stroke-primary transition-[stroke-dashoffset] duration-1000 ease-linear"
            strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={RING_LENGTH}
            strokeDashoffset={RING_LENGTH * (1 - remaining / total)}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span
            className="text-4xl font-semibold tabular-nums"
            aria-live="polite"
          >
            {formatClock(remaining)}
          </span>
          <span className="text-xs text-muted-foreground">
            {finished
              ? "Done"
              : running
                ? "Focusing"
                : elapsed
                  ? "Paused"
                  : "Ready"}
          </span>
        </div>
      </div>

      <div className="flex justify-center gap-2">
        {running ? (
          <Button variant="subtle" onClick={() => setRunning(false)}>
            <Pause /> Pause
          </Button>
        ) : (
          <Button disabled={finished} onClick={start}>
            <Play /> {elapsed ? "Resume" : "Start"}
          </Button>
        )}
        <Button
          variant="subtle"
          size="icon"
          aria-label="Restart timer"
          disabled={elapsed === 0}
          onClick={() => {
            setRunning(false);
            setElapsed(0);
            startedAt.current = null;
          }}
        >
          <RotateCcw />
        </Button>
      </div>

      <DialogFooter className="flex-col gap-3 border-t pt-4 sm:flex-col">
        <label className="flex items-center gap-2 text-sm">
          <Checkbox
            checked={complete}
            onCheckedChange={(checked) => setComplete(checked === true)}
          />
          {target.entryId
            ? "Mark this session as done"
            : "Mark the task as done"}
        </label>
        <Button disabled={elapsed < 60} onClick={finish} className="w-full">
          <Square /> Finish &amp; log
        </Button>
      </DialogFooter>
    </>
  );
}
