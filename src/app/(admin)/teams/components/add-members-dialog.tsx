"use client";

import { useMemo, useRef, useState } from "react";
import { Mail, UserPlus, X } from "lucide-react";
import { toast } from "sonner";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { useTeamsStore } from "@/store/client/teams-store";
import {
  LearnerStatus,
  type Learner,
  useLearnersStore,
} from "@/store/client/mock/learners-store";
import type { Team } from "@/store/server/teams/interface";
import { getInitials } from "@/utils/string";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function splitEmails(raw: string) {
  return raw
    .split(/[,;\n\r\t]+/)
    .map((part) => part.trim())
    .filter(Boolean);
}

interface EmailEntry {
  email: string;
  learner: Learner | null;
  existing: boolean;
}

export function AddMembersDialog({ team }: { team: Team }) {
  const addMember = useTeamsStore((state) => state.addMember);
  const learners = useLearnersStore((state) => state.learners);
  const [open, setOpen] = useState(false);
  const [entries, setEntries] = useState<EmailEntry[]>([]);
  const [draft, setDraft] = useState("");
  const [canAccessNotes, setCanAccessNotes] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const memberEmails = useMemo(
    () => new Set(team.Members.map((m) => m.Email.trim().toLowerCase())),
    [team.Members],
  );
  const selectedEmails = useMemo(
    () => new Set(entries.map((e) => e.email.toLowerCase())),
    [entries],
  );

  const candidates = learners.filter(
    (learner) =>
      learner.Status !== LearnerStatus.Disabled &&
      !memberEmails.has(learner.Email.toLowerCase()) &&
      !selectedEmails.has(learner.Email.toLowerCase()),
  );

  const suggestions = useMemo(() => {
    const q = draft.trim().toLowerCase();
    if (!q) return [];
    return candidates
      .filter(
        (learner) =>
          learner.Email.toLowerCase().includes(q) ||
          learner.Name.toLowerCase().includes(q),
      )
      .slice(0, 6);
  }, [candidates, draft]);

  const validEntries = entries.filter((e) => e.learner && !e.existing);

  const resolveEmail = (raw: string): EmailEntry | null => {
    const email = raw.trim().toLowerCase();
    if (!email || !EMAIL_RE.test(email)) return null;
    if (selectedEmails.has(email)) return null;
    const learner =
      learners.find((item) => item.Email.toLowerCase() === email) ?? null;
    return {
      email,
      learner,
      existing: memberEmails.has(email),
    };
  };

  const addEmails = (rawParts: string[]) => {
    const next: EmailEntry[] = [];
    const seen = new Set(selectedEmails);
    for (const part of rawParts) {
      const entry = resolveEmail(part);
      if (!entry || seen.has(entry.email)) continue;
      seen.add(entry.email);
      next.push(entry);
    }
    if (next.length) setEntries((prev) => [...prev, ...next]);
    setDraft("");
  };

  const commitDraft = () => {
    if (!draft.trim()) return;
    addEmails(splitEmails(draft));
  };

  const removeEntry = (email: string) =>
    setEntries((prev) => prev.filter((e) => e.email !== email));

  const reset = () => {
    setEntries([]);
    setDraft("");
    setCanAccessNotes(false);
  };

  const submit = () => {
    if (validEntries.length === 0) {
      toast.error("Add at least one registered learner email.");
      return;
    }
    for (const entry of validEntries) {
      if (!entry.learner) continue;
      addMember(team.Id, {
        LearnerId: entry.learner.Id,
        Name: entry.learner.Name,
        Email: entry.learner.Email,
        CanAccessNotes: canAccessNotes,
      });
    }
    toast.success(
      `Added ${validEntries.length} learner${validEntries.length === 1 ? "" : "s"}${
        canAccessNotes ? " with notes access" : ""
      }.`,
    );
    setOpen(false);
    reset();
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) reset();
      }}
    >
      <DialogTrigger asChild>
        <Button>
          <UserPlus />
          Add learners
        </Button>
      </DialogTrigger>
      <DialogContent className="gap-0 overflow-visible p-0 sm:max-w-2xl">
        <DialogHeader className="space-y-0 px-6 pt-6 pb-2">
          <DialogTitle className="text-xl">Add Learners</DialogTitle>
        </DialogHeader>

        <div className="space-y-5 px-6 py-4">
          <div className="relative space-y-2">
            <Label htmlFor="team-emails" className="text-muted-foreground">
              Enter emails
            </Label>
            <div
              className={cn(
                "flex min-h-12 flex-wrap items-center gap-1.5 rounded-xl border bg-background px-3 py-2.5",
                "focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20",
              )}
              onClick={() => inputRef.current?.focus()}
            >
              {entries.map((entry) => (
                <span
                  key={entry.email}
                  className={cn(
                    "inline-flex max-w-full items-center gap-1.5 rounded-full border bg-muted/50 px-2 py-1 text-xs",
                    entry.existing &&
                      "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-400",
                    !entry.learner &&
                      !entry.existing &&
                      "border-destructive/30 bg-destructive/10 text-destructive",
                  )}
                >
                  {entry.learner ? (
                    <Avatar className="size-4">
                      <AvatarFallback className="text-[9px]">
                        {getInitials(entry.learner.Name)}
                      </AvatarFallback>
                    </Avatar>
                  ) : (
                    <Mail className="size-3 shrink-0 opacity-70" />
                  )}
                  <span className="truncate">{entry.email}</span>
                  <button
                    type="button"
                    aria-label={`Remove ${entry.email}`}
                    className="rounded-full p-0.5 hover:bg-background"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeEntry(entry.email);
                    }}
                  >
                    <X className="size-3" />
                  </button>
                </span>
              ))}
              <input
                ref={inputRef}
                id="team-emails"
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onPaste={(e) => {
                  const text = e.clipboardData.getData("text");
                  if (/[,;\n]/.test(text)) {
                    e.preventDefault();
                    addEmails(splitEmails(`${draft}${text}`));
                  }
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === "," || e.key === ";") {
                    e.preventDefault();
                    commitDraft();
                  } else if (
                    e.key === "Backspace" &&
                    !draft &&
                    entries.length
                  ) {
                    removeEntry(entries[entries.length - 1]!.email);
                  } else if (e.key === " " && draft.includes("@")) {
                    e.preventDefault();
                    commitDraft();
                  }
                }}
                onBlur={commitDraft}
                placeholder={
                  entries.length === 0
                    ? "name@email.com, name@email.com"
                    : undefined
                }
                className="min-w-[160px] flex-1 bg-transparent py-0.5 text-sm outline-none placeholder:text-muted-foreground"
                autoComplete="off"
              />
            </div>
            {suggestions.length > 0 && (
              <ul
                className={cn(
                  "absolute top-full right-0 left-0 z-50 mt-1",
                  "max-h-48 overflow-y-auto rounded-xl border bg-popover py-1 shadow-lg",
                )}
              >
                {suggestions.map((learner) => (
                  <li key={learner.Id}>
                    <button
                      type="button"
                      className="flex w-full items-center gap-3 px-3 py-2 text-left text-sm hover:bg-accent"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => addEmails([learner.Email])}
                    >
                      <Avatar className="size-7">
                        <AvatarFallback className="text-[10px]">
                          {getInitials(learner.Name)}
                        </AvatarFallback>
                      </Avatar>
                      <span className="min-w-0">
                        <span className="block truncate font-medium">
                          {learner.Name}
                        </span>
                        <span className="block truncate text-xs text-muted-foreground">
                          {learner.Email}
                        </span>
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div
            className={cn(
              "rounded-xl border bg-muted/20 p-3 transition-colors sm:p-4",
              canAccessNotes && "border-primary/25 bg-primary/[0.03]",
            )}
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex rounded-md border bg-background px-2.5 py-1 text-sm font-semibold shadow-xs">
                    Team notes
                  </span>
                  <span className="text-xs text-muted-foreground tabular-nums">
                    {canAccessNotes ? 1 : 0}/1
                  </span>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  Shared markdown notes in {team.Name}. Unchecked means
                  membership only.
                </p>
              </div>
            </div>
            <div className="mt-3">
              <Label
                htmlFor="add-members-notes"
                className={cn(
                  "flex cursor-pointer items-center gap-2 text-sm font-normal",
                  canAccessNotes ? "text-foreground" : "text-muted-foreground",
                )}
              >
                <Checkbox
                  id="add-members-notes"
                  checked={canAccessNotes}
                  onCheckedChange={(value) => setCanAccessNotes(value === true)}
                />
                <span className="min-w-0 leading-snug">Access team notes</span>
              </Label>
            </div>
          </div>
        </div>

        <DialogFooter className="mx-0 mb-0">
          <Button
            variant="ghost"
            onClick={() => {
              setOpen(false);
              reset();
            }}
          >
            Cancel
          </Button>
          <Button disabled={validEntries.length === 0} onClick={submit}>
            {validEntries.length === 0
              ? "Add Learners"
              : `Add ${validEntries.length} Learner${validEntries.length === 1 ? "" : "s"}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
