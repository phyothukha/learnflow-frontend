import { redirect } from "next/navigation";

export default function AccountPermissionsRedirectPage() {
  redirect("/account/roles-and-permissions");
}
