import dayjs from "dayjs";
import type { Note } from "@/store/server/notes/interface";

export enum NoteGroupLabel {
  Today = "Today",
  Previous7Days = "Previous 7 Days",
  Previous30Days = "Previous 30 Days",
  Older = "Older",
}

export interface NoteGroup {
  label: NoteGroupLabel;
  items: Note[];
}

export function previewText(content: string | null) {
  if (!content?.trim()) return "No content yet";
  return content
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/[#*_>`[\]()!~-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function searchNotes(notes: Note[], query: string) {
  const q = query.trim().toLowerCase();
  if (!q) return notes;
  return notes.filter(
    (n) =>
      n.Title.toLowerCase().includes(q) || n.Content?.toLowerCase().includes(q),
  );
}

function noteGroupLabel(note: Note, now: dayjs.Dayjs) {
  const updated = dayjs(note.UpdatedAt);
  if (updated.isSame(now, "day")) return NoteGroupLabel.Today;
  const days = now.diff(updated, "day");
  if (days <= 7) return NoteGroupLabel.Previous7Days;
  if (days <= 30) return NoteGroupLabel.Previous30Days;
  return NoteGroupLabel.Older;
}

/** Newest first, bucketed into Today / 7 days / 30 days / Older. */
export function groupNotes(notes: Note[]): NoteGroup[] {
  const now = dayjs();
  const sorted = [...notes].sort(
    (a, b) => dayjs(b.UpdatedAt).valueOf() - dayjs(a.UpdatedAt).valueOf(),
  );
  const byLabel = Map.groupBy(sorted, (note) => noteGroupLabel(note, now));
  return Object.values(NoteGroupLabel)
    .map((label) => ({ label, items: byLabel.get(label) ?? [] }))
    .filter((group) => group.items.length > 0);
}
