"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { ArrowLeft, Lock, UsersRound } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MarkdownSplitEditor } from "@/components/markdown-split-editor";
import { usePermission } from "@/hooks/use-permission";
import { useWorkspaceNotesHydration } from "@/hooks/use-workspace-notes-hydration";
import { NOTE_VISIBILITY } from "@/lib/team-meta";
import { PERMISSIONS } from "@/lib/permissions";
import { useNotesStore } from "@/store/client/notes-store";
import {
  CURRENT_USER_ID,
  isTeamMember,
  useTeamsStore,
} from "@/store/client/teams-store";
import { NoteVisibility } from "@/store/server/notes/interface";

const PRIVATE = "private";

function NewNotePageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { status } = useSession();
  const { hasPermission } = usePermission();
  const canCreate = hasPermission(PERMISSIONS.NOTES_CREATE);
  const ready = useWorkspaceNotesHydration();
  const createNote = useNotesStore((state) => state.createNote);
  const teams = useTeamsStore((state) => state.teams);
  const joined = teams.filter((team) => isTeamMember(team));

  const initialTeam = searchParams.get("team");
  const [scope, setScope] = useState(
    initialTeam && joined.some((t) => t.Id === initialTeam)
      ? initialTeam
      : PRIVATE,
  );
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");

  useEffect(() => {
    if (status === "authenticated" && !canCreate) router.replace("/forbidden");
  }, [status, canCreate, router]);

  useEffect(() => {
    if (!ready) return;
    if (
      initialTeam &&
      teams.some((t) => t.Id === initialTeam && isTeamMember(t))
    )
      setScope(initialTeam);
  }, [ready, initialTeam, teams]);

  if (status !== "authenticated" || !canCreate || !ready) return null;

  const handleCreate = () => {
    if (!title.trim()) {
      toast.error("Title is required");
      return;
    }
    const teamId = scope === PRIVATE ? null : scope;
    const id = createNote({
      Title: title.trim(),
      Content: content.trim() || null,
      Visibility: teamId ? NoteVisibility.Team : NoteVisibility.Private,
      TeamId: teamId,
      OwnerId: CURRENT_USER_ID,
      OwnerName: "You",
    });
    toast.success(teamId ? "Team note created." : "Private note created.");
    router.push(`/notes/${id}`);
  };

  return (
    <div className="flex min-h-0 flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Button variant="secondary" size="icon" className="size-9" asChild>
            <Link href="/notes">
              <ArrowLeft className="size-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-xl font-semibold tracking-tight">New note</h1>
            <p className="text-sm text-muted-foreground">
              Markdown only. Team notes are visible to every member.
            </p>
          </div>
        </div>
        <Button onClick={handleCreate}>Create note</Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_220px]">
        <div className="space-y-2">
          <Label htmlFor="note-title">Title</Label>
          <Input
            id="note-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Note title"
          />
        </div>
        <div className="space-y-2">
          <Label>Visibility</Label>
          <Select value={scope} onValueChange={setScope}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={PRIVATE}>
                <span className="inline-flex items-center gap-2">
                  <Lock className="size-3.5" />
                  {NOTE_VISIBILITY.get(NoteVisibility.Private)?.label}
                </span>
              </SelectItem>
              {joined.map((team) => (
                <SelectItem key={team.Id} value={team.Id}>
                  <span className="inline-flex items-center gap-2">
                    <UsersRound
                      className="size-3.5"
                      style={{ color: team.Color }}
                    />
                    {team.Name}
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="library-card min-h-0 flex-1 overflow-hidden p-0">
        <MarkdownSplitEditor value={content} onChange={setContent} />
      </div>
    </div>
  );
}

export default function NewNotePage() {
  return (
    <Suspense fallback={null}>
      <NewNotePageInner />
    </Suspense>
  );
}
