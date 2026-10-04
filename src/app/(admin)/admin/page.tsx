import { redirect } from "next/navigation";

/** Legacy /admin → account section */
export default function AdminLegacyRedirectPage() {
  redirect("/account/profile");
}
