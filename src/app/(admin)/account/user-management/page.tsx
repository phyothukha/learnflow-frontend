"use client";

import Link from "next/link";
import { UserPlus } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { UsersTable } from "./components/users-table";
import { Button } from "@/components/ui/button";

export default function UserManagementPage() {
  return (
    <div className="flex h-full min-h-0 min-w-0 flex-col gap-6">
      <PageHeader
        className="shrink-0"
        title="User Management"
        description="Manage admin and staff accounts — learners live under Learners"
        actions={
          <Button asChild>
            <Link href="/account/user-invitation">
              <UserPlus />
              Invite user
            </Link>
          </Button>
        }
      />
      <div className="min-h-0 min-w-0 flex-1 overflow-hidden">
        <UsersTable />
      </div>
    </div>
  );
}
