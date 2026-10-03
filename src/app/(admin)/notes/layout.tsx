import { redirect } from "next/navigation";

/** Workspace notes belong to learners. Admins manage teams only. */
export default function NotesLayout() {
  redirect("/teams");
}
