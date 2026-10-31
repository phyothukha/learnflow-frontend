import { redirect } from "next/navigation";

/** Workspace notes belong to members. Admins manage teams only. */
export default function NotesLayout() {
  redirect("/teams");
}
