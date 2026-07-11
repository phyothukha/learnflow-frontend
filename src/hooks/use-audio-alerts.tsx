"use client";

import { useEffect, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useFetchStudyBlocks } from "@/store/server/study-blocks/queries";
import type { StudyBlock } from "@/store/server/study-blocks/interface";
import { useWorkspaceStore } from "@/store/client/workspace";
import { initAudio, playDueAlert, playReminderChime } from "@/lib/alert-sounds";

const CHECK_INTERVAL_MS = 30_000;
// Don't alert for blocks that were already due long before the app loaded.
const LATE_ALERT_GRACE_MS = 10 * 60 * 1000;

/**
 * Watches today's schedule and fires an audible + visual alert when a study
 * block hits its reminder offset and again when it becomes due.
 */
export function useAudioAlerts() {
  const router = useRouter();
  const soundMuted = useWorkspaceStore((s) => s.soundMuted);
  const setActiveTopic = useWorkspaceStore((s) => s.setActiveTopic);
  const alertedRef = useRef<Set<string>>(new Set());

  // Window from the start of the current hour to 24h out; stable per mount so
  // the query key doesn't churn — refetchInterval keeps the data fresh.
  const range = useMemo(() => {
    const from = new Date();
    from.setMinutes(0, 0, 0);
    const to = new Date(from.getTime() + 24 * 60 * 60 * 1000);
    return { from: from.toISOString(), to: to.toISOString() };
  }, []);

  const { data } = useFetchStudyBlocks({ ...range, limit: 100 });

  // Browsers require a user gesture before audio can play.
  useEffect(() => {
    const unlock = () => initAudio();
    window.addEventListener("click", unlock, { once: true });
    window.addEventListener("keydown", unlock, { once: true });
    return () => {
      window.removeEventListener("click", unlock);
      window.removeEventListener("keydown", unlock);
    };
  }, []);

  useEffect(() => {
    const fireToast = (block: StudyBlock, message: string) => {
      toast(block.Title, {
        description: message,
        action: {
          label: "Start now",
          onClick: () => {
            if (block.TopicId) setActiveTopic(block.TopicId);
            router.push("/notes");
          },
        },
      });
    };

    const check = () => {
      const now = Date.now();

      for (const block of data?.value ?? []) {
        if (block.Status !== "Upcoming" && block.Status !== "Active") continue;

        const startAt = new Date(block.StartAt).getTime();
        const reminderAt = startAt - block.ReminderMinutesBefore * 60_000;
        const dueKey = `${block.Id}:due`;
        const reminderKey = `${block.Id}:reminder`;

        if (
          now >= startAt &&
          now - startAt < LATE_ALERT_GRACE_MS &&
          !alertedRef.current.has(dueKey)
        ) {
          alertedRef.current.add(dueKey).add(reminderKey);
          if (!soundMuted) playDueAlert();
          fireToast(block, "Starting now");
        } else if (
          now >= reminderAt &&
          now < startAt &&
          !alertedRef.current.has(reminderKey)
        ) {
          alertedRef.current.add(reminderKey);
          if (!soundMuted) playReminderChime();
          fireToast(
            block,
            `Starts in ${Math.max(1, Math.round((startAt - now) / 60_000))} min`,
          );
        }
      }
    };

    check();
    const id = setInterval(check, CHECK_INTERVAL_MS);
    return () => clearInterval(id);
  }, [data, soundMuted, router, setActiveTopic]);
}

/** Mount once inside the authenticated layout to activate schedule alerts. */
export function AudioAlerts() {
  useAudioAlerts();
  return null;
}
