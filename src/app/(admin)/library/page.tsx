"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { ExternalLink, FileText, FolderOpen, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { usePermission } from "@/hooks/use-permission";
import { PERMISSIONS } from "@/lib/permissions";
import { cn } from "@/lib/utils";
import { useWorkspaceStore } from "@/store/client/workspace";
import { useFetchTopics } from "@/store/server/topics/queries";
import {
  useCreateTopic,
  useDeleteTopic,
} from "@/store/server/topics/mutations";
import { useFetchDocuments } from "@/store/server/documents/queries";
import {
  useCreateDocument,
  useDeleteDocument,
  useUpdateDocument,
} from "@/store/server/documents/mutations";
import type { DocumentStatus } from "@/store/server/documents/interface";
import {
  FALLBACK_TOPIC_COLOR as FALLBACK_COLOR,
  TOPIC_COLORS,
} from "@/lib/topic-colors";

export default function LibraryPage() {
  const router = useRouter();
  const { status } = useSession();
  const { hasPermission } = usePermission();
  const canView = hasPermission(PERMISSIONS.DOCUMENTS_VIEW);

  const activeTopicId = useWorkspaceStore((s) => s.activeTopicId);
  const setActiveTopic = useWorkspaceStore((s) => s.setActiveTopic);

  const { data: topicsData } = useFetchTopics({
    limit: 100,
    orderby: "Title asc",
  });
  const { data: documentsData, isLoading: documentsLoading } =
    useFetchDocuments({
      limit: 100,
      topicId: activeTopicId ?? undefined,
      expand: "Topic",
    });
  const deleteTopic = useDeleteTopic();
  const updateDocument = useUpdateDocument();
  const deleteDocument = useDeleteDocument();

  useEffect(() => {
    if (status === "authenticated" && !canView) router.replace("/forbidden");
  }, [status, canView, router]);

  if (status !== "authenticated" || !canView) return null;

  const topics = topicsData?.value ?? [];
  const documents = documentsData?.value ?? [];
  const activeTopic = topics.find((t) => t.Id === activeTopicId) ?? null;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">Library</h1>
        <div className="flex gap-2">
          <CreateTopicDialog />
          <CreateDocumentDialog
            topics={topics}
            defaultTopicId={activeTopicId}
          />
        </div>
      </div>

      <section className="space-y-3">
        <h2 className="text-sm font-medium text-muted-foreground">Topics</h2>
        {topics.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-sm text-muted-foreground">
              No topics yet — create one to start organizing materials.
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {topics.map((topic) => (
              <Card
                key={topic.Id}
                className={cn(
                  "cursor-pointer shadow-sm transition-colors",
                  activeTopicId === topic.Id && "border-primary",
                )}
                onClick={() =>
                  setActiveTopic(activeTopicId === topic.Id ? null : topic.Id)
                }
              >
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="flex items-center gap-2 text-sm font-medium">
                    <span
                      className="size-2.5 rounded-full"
                      style={{ backgroundColor: topic.Color ?? FALLBACK_COLOR }}
                    />
                    {topic.Title}
                  </CardTitle>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-7 text-muted-foreground"
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteTopic.mutate(topic.Id, {
                        onSuccess: () => {
                          if (activeTopicId === topic.Id) setActiveTopic(null);
                          toast.success("Topic deleted");
                        },
                      });
                    }}
                  >
                    <Trash2 className="size-3.5" />
                  </Button>
                </CardHeader>
                <CardContent>
                  <p className="line-clamp-2 text-xs text-muted-foreground">
                    {topic.Description || "No description"}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-medium text-muted-foreground">
          Documents{activeTopic ? ` — ${activeTopic.Title}` : " — all topics"}
        </h2>
        {documentsLoading ? null : documents.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center gap-2 py-10 text-muted-foreground">
              <FolderOpen className="size-8" />
              <p className="text-sm">No documents in this context yet.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {documents.map((doc) => (
              <Card key={doc.Id} className="shadow-sm">
                <CardContent className="flex items-center gap-3 py-3">
                  <FileText className="size-4 shrink-0 text-muted-foreground" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{doc.Title}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {doc.Topic?.Title ?? ""}
                      {doc.FileType ? ` · ${doc.FileType}` : ""}
                    </p>
                  </div>
                  {doc.FileUrl && (
                    <a
                      href={doc.FileUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-muted-foreground hover:text-foreground"
                    >
                      <ExternalLink className="size-4" />
                    </a>
                  )}
                  <Select
                    value={doc.Status}
                    onValueChange={(value) =>
                      updateDocument.mutate({
                        id: doc.Id,
                        payload: { Status: value as DocumentStatus },
                      })
                    }
                  >
                    <SelectTrigger className="h-8 w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Unread">Unread</SelectItem>
                      <SelectItem value="InProgress">In progress</SelectItem>
                      <SelectItem value="Completed">Completed</SelectItem>
                    </SelectContent>
                  </Select>
                  <Badge
                    variant={
                      doc.Status === "Completed" ? "outline" : "secondary"
                    }
                    className="hidden sm:inline-flex"
                  >
                    {doc.TimeSpentMinutes} min
                  </Badge>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-8 text-muted-foreground"
                    onClick={() =>
                      deleteDocument.mutate(doc.Id, {
                        onSuccess: () => toast.success("Document deleted"),
                      })
                    }
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function CreateTopicDialog() {
  const createTopic = useCreateTopic();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [color, setColor] = useState<string>(TOPIC_COLORS[0]);

  const handleSubmit = () => {
    if (!title.trim()) {
      toast.error("Title is required");
      return;
    }
    createTopic.mutate(
      {
        Title: title.trim(),
        Description: description.trim() || undefined,
        Color: color,
      },
      {
        onSuccess: () => {
          toast.success("Topic created");
          setTitle("");
          setDescription("");
          setOpen(false);
        },
        onError: () => toast.error("Failed to create topic"),
      },
    );
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Plus className="size-4" />
          New topic
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New topic</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
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
            />
          </div>
          <div className="space-y-2">
            <Label>Accent color</Label>
            <div className="flex gap-2">
              {TOPIC_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  className={cn(
                    "size-6 rounded-full border-2",
                    color === c ? "border-foreground" : "border-transparent",
                  )}
                  style={{ backgroundColor: c }}
                  onClick={() => setColor(c)}
                />
              ))}
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button onClick={handleSubmit} disabled={createTopic.isPending}>
            Create
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function CreateDocumentDialog({
  topics,
  defaultTopicId,
}: {
  topics: { Id: string; Title: string }[];
  defaultTopicId: string | null;
}) {
  const createDocument = useCreateDocument();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [topicId, setTopicId] = useState<string>(defaultTopicId ?? "");
  const [fileUrl, setFileUrl] = useState("");
  const [fileType, setFileType] = useState("Link");

  useEffect(() => {
    if (open) setTopicId(defaultTopicId ?? "");
  }, [open, defaultTopicId]);

  const handleSubmit = () => {
    if (!title.trim() || !topicId) {
      toast.error("Title and topic are required");
      return;
    }
    createDocument.mutate(
      {
        TopicId: topicId,
        Title: title.trim(),
        FileUrl: fileUrl.trim() || undefined,
        FileType: fileType,
      },
      {
        onSuccess: () => {
          toast.success("Document added");
          setTitle("");
          setFileUrl("");
          setOpen(false);
        },
        onError: () => toast.error("Failed to add document"),
      },
    );
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus className="size-4" />
          Add document
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add document</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="doc-title">Title</Label>
            <Input
              id="doc-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>Topic</Label>
            <Select value={topicId} onValueChange={setTopicId}>
              <SelectTrigger>
                <SelectValue placeholder="Select topic" />
              </SelectTrigger>
              <SelectContent>
                {topics.map((t) => (
                  <SelectItem key={t.Id} value={t.Id}>
                    {t.Title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="doc-url">URL (optional)</Label>
            <Input
              id="doc-url"
              value={fileUrl}
              onChange={(e) => setFileUrl(e.target.value)}
              placeholder="https://…"
            />
          </div>
          <div className="space-y-2">
            <Label>Type</Label>
            <Select value={fileType} onValueChange={setFileType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {["Link", "PDF", "DOCX", "Markdown", "Image", "Video"].map(
                  (t) => (
                    <SelectItem key={t} value={t}>
                      {t}
                    </SelectItem>
                  ),
                )}
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button onClick={handleSubmit} disabled={createDocument.isPending}>
            Add
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
