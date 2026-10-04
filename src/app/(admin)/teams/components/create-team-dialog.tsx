"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ImagePlus, Plus, X } from "lucide-react";
import { toast } from "sonner";
import { TeamLogo } from "@/components/team-logo";
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
import { TEAM_COLORS } from "@/lib/team-meta";
import { useTeamsStore } from "@/store/client/teams-store";

const MAX_LOGO_BYTES = 200_000;
const DEFAULT_TEAM_COLOR = TEAM_COLORS[0];

export function CreateTeamDialog() {
  const createTeam = useTeamsStore((state) => state.createTeam);
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);

  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [logo, setLogo] = useState<string | null>(null);

  function reset() {
    setName("");
    setDescription("");
    setLogo(null);
    if (fileRef.current) fileRef.current.value = "";
  }

  function onPickFile(file: File | undefined) {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please choose an image file.");
      return;
    }
    if (file.size > MAX_LOGO_BYTES) {
      toast.error("Logo must be under 200KB.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") setLogo(reader.result);
    };
    reader.readAsDataURL(file);
  }

  const submit = () => {
    if (!name.trim()) {
      toast.error("Team name is required");
      return;
    }
    const id = createTeam({
      Name: name.trim(),
      Description: description.trim() || null,
      Logo: logo,
      Color: DEFAULT_TEAM_COLOR,
    });
    toast.success("Team created.");
    setOpen(false);
    reset();
    router.push(`/teams/${id}`);
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
          <Plus /> New team
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create a team</DialogTitle>
          <DialogDescription>
            Add a logo and name. Learners share notes inside the team.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="flex items-center gap-3 rounded-xl border bg-muted/30 p-3">
            <TeamLogo
              name={name || "T"}
              color={DEFAULT_TEAM_COLOR}
              logo={logo}
              className="size-12 rounded-xl text-lg"
              textClassName="text-base"
            />
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">
                {name.trim() || "Team preview"}
              </p>
              <p className="text-xs text-muted-foreground">
                Upload a logo, or we use the name initial.
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Logo</Label>
            <div className="flex flex-wrap items-center gap-2">
              <input
                ref={fileRef}
                type="file"
                accept="image/png,image/jpeg,image/webp,image/gif"
                className="hidden"
                onChange={(e) => onPickFile(e.target.files?.[0])}
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => fileRef.current?.click()}
              >
                <ImagePlus />
                Upload image
              </Button>
              {logo ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setLogo(null);
                    if (fileRef.current) fileRef.current.value = "";
                  }}
                >
                  <X />
                  Clear
                </Button>
              ) : null}
            </div>
            <p className="text-xs text-muted-foreground">
              Optional. PNG, JPG, or WebP up to 200KB.
            </p>
          </div>

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
