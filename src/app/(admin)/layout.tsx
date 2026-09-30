import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { MainLayout } from "@/layout/main-layout";

// Must match SIDEBAR_COOKIE_NAME in components/ui/sidebar.tsx (a client module, so it can't be imported here).
const SIDEBAR_COOKIE_NAME = "sidebar_state";

export default async function AdminLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const session = await auth();
  if (!session) redirect("/login");

  const cookieStore = await cookies();
  const sidebarOpen = cookieStore.get(SIDEBAR_COOKIE_NAME)?.value === "true";

  return <MainLayout sidebarOpen={sidebarOpen}>{children}</MainLayout>;
}
