import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { MainLayout } from "@/layout/main-layout";

export default async function AdminLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const session = await auth();
  if (!session) redirect("/login");

  return <MainLayout>{children}</MainLayout>;
}
