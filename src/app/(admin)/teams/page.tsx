"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { ArrowUpRight, NotebookPen, Plus, UsersRound } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { usePermission } from "@/hooks/use-permission";
import { useWorkspaceNotesHydration } from "@/hooks/use-workspace-notes-hydration";
import { TEAM_COLORS } from "@/lib/team-meta";
import { PERMISSIONS } from "@/lib/permissions";
import { cn } from "@/lib/utils";
import { useTeamsStore } from "@/store/client/teams-store";

export default function TeamsPage() {
  const router = useRouter();
  const { status } = useSession();
  const { hasPermission } = usePermission();
  const canView = hasPermission(PERMISSIONS.TEAMS_VIEW);
  const canCreate = hasPermission(PERMISSIONS.TEAMS_CREATE);
  const ready = useWorkspaceNotesHydration();
  const teams = useTeamsStore((state) => state.teams);

  useEffect(() => {
    if (status === "authenticated" && !canView) router.replace("/forbidden");
  }, [status, canView, router]);

  if (status !== "authenticated" || !canView || !ready) return null;

  return (
    <div className="flex h-full min-h-0 flex-col gap-6">
      <PageHeader
        title="Teams"
        description="Create teams and add learners. Learners share notes among themselves."
        badge={
          <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary tabular-nums">
            {teams.length} teams
          </span>
        }
        actions={canCreate ? <CreateTeamDialog /> : undefined}
      />

      {teams.length === 0 ? (
        <div className="library-card flex flex-col items-center gap-2 px-4 py-14 text-center">
          <div className="flex size-12 items-center justify-center rounded-2xl bg-muted">
            <UsersRound className="size-6 text-muted-foreground" />
          </div>
          <p className="text-sm font-medium">No teams yet</p>
          <p className="max-w-sm text-xs text-muted-foreground">
            Create a team to start adding learners by email.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {teams.map((team) => {
            const notesAccessCount = team.Members.filter(
              (m) => m.CanAccessNotes,
            ).length;
            return (
              <Link
                key={team.Id}
                href={`/teams/${team.Id}`}
                className={cn(
                  "group relative overflow-hidden rounded-2xl border bg-card p-5 shadow-xs transition-all",
                  "hover:border-primary/30 hover:shadow-md",
                )}
              >
                <div
                  className="absolute inset-x-0 top-0 h-1"
                  style={{ backgroundColor: team.Color }}
                />
                <div className="flex items-start gap-3">
                  <span
                    className="flex size-11 shrink-0 items-center justify-center rounded-xl text-sm font-semibold text-white shadow-sm"
                    style={{ backgroundColor: team.Color }}
                  >
                    {team.Name.slice(0, 1).toUpperCase()}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <p className="truncate font-semibold tracking-tight">
                        {team.Name}
                      </p>
                      <ArrowUpRight className="size-4 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
                    </div>
                    <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-muted-foreground">
                      {team.Description || "No description"}
                    </p>
                  </div>
                </div>
                <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-muted-foreground tabular-nums">
                  <span className="inline-flex items-center gap-1.5">
                    <UsersRound className="size-3.5" />
                    {team.Members.length}{" "}
                    {team.Members.length === 1 ? "learner" : "learners"}
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <NotebookPen className="size-3.5" />
                    {notesAccessCount} notes access
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

function CreateTeamDialog() {
  const createTeam = useTeamsStore((state) => state.createTeam);
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [color, setColor] = useState<string>(TEAM_COLORS[0]);

  const submit = () => {
    if (!name.trim()) {
      toast.error("Team name is required");
      return;
    }
    const id = createTeam({
      Name: name.trim(),
      Description: description.trim() || null,
      Color: color,
    });
    toast.success("Team created.");
    setOpen(false);
    setName("");
    setDescription("");
    router.push(`/teams/${id}`);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus /> New team
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create a team</DialogTitle>
          <DialogDescription>
            Learners share notes inside the team. You manage membership only.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="team-name">Name</Label>
            <Input
              id="team-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. JLPT Study Circle"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="team-desc">Description</Label>
            <Textarea
              id="team-desc"
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional"
            />
          </div>
          <div className="space-y-2">
            <Label>Color</Label>
            <div className="flex flex-wrap gap-2">
              {TEAM_COLORS.map((value) => (
                <button
                  key={value}
                  type="button"
                  aria-label={`Color ${value}`}
                  aria-pressed={color === value}
                  onClick={() => setColor(value)}
                  className={cn(
                    "size-7 rounded-full ring-offset-2 ring-offset-background",
                    color === value && "ring-2 ring-primary",
                  )}
                  style={{ backgroundColor: value }}
                />
              ))}
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={submit}>Create</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
