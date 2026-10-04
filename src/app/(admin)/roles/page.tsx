import { redirect } from "next/navigation";

export default function RolesRedirectPage() {
  redirect("/account/roles-and-permissions");
}
