"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
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
import { FileDropzone } from "@/components/ui/file-dropzone";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useTopicMetaStore } from "@/store/client/topic-meta-store";
import { useCreateTopic } from "@/store/server/topics/mutations";
import { DEFAULT_TOPIC_COLOR } from "@/utils/colors";

const MAX_LOGO_BYTES = 200_000;

export function CreateTopicDialog() {
  const createTopic = useCreateTopic();
  const setLogoMeta = useTopicMetaStore((state) => state.setLogo);

  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [logo, setLogo] = useState<string | null>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);

  function reset() {
    setTitle("");
    setDescription("");
    setLogo(null);
    setLogoFile(null);
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
      if (typeof reader.result === "string") {
        setLogo(reader.result);
        setLogoFile(file);
      }
    };
    reader.readAsDataURL(file);
  }

  const handleSubmit = () => {
    if (!title.trim()) {
      toast.error("Title is required");
      return;
    }
    createTopic.mutate(
      {
        Title: title.trim(),
        Description: description.trim() || undefined,
        Color: DEFAULT_TOPIC_COLOR,
      },
      {
        onSuccess: (topic) => {
          if (logo) setLogoMeta(topic.Id, logo);
          toast.success("Topic created");
          setOpen(false);
          reset();
        },
        onError: () => toast.error("Failed to create topic"),
      },
    );
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
          <Plus />
          New topic
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>New topic</DialogTitle>
          <DialogDescription>
            Add a logo and name for this library topic.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="flex items-center gap-3 rounded-xl border bg-muted/30 p-3">
            <TeamLogo
              name={title || "T"}
              color={DEFAULT_TOPIC_COLOR}
              logo={logo}
              className="size-12 rounded-xl text-lg"
              textClassName="text-base"
            />
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">
                {title.trim() || "Topic preview"}
              </p>
              <p className="text-xs text-muted-foreground">
                Upload a logo, or we use the title initial.
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Logo</Label>
            <FileDropzone
              accept="image/png,image/jpeg,image/webp,image/gif"
              description="Optional. PNG, JPG, or WebP up to 200KB."
              files={logoFile ? [logoFile] : []}
              onFiles={(picked) => onPickFile(picked[0])}
              onRemove={() => {
                setLogo(null);
                setLogoFile(null);
              }}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="topic-title">Title</Label>
            <Input
              id="topic-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Machine Learning"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="topic-description">Description</Label>
            <Textarea
              id="topic-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              placeholder="Optional"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={createTopic.isPending}>
            Create
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
