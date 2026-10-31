"use client";

import { use } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PERMISSIONS } from "@/lib/permissions";
import { useRequirePermission } from "@/hooks/use-require-permission";
import {
  MemberStatus,
  useMembersStore,
} from "@/store/client/mock/members-store";
import { EditMemberForm } from "../../components/edit-member-form";

interface EditMemberPageProps {
  params: Promise<{ memberId: string }>;
}

export default function EditMemberPage({ params }: EditMemberPageProps) {
  const { memberId } = use(params);
  const canUpdate = useRequirePermission(PERMISSIONS.MEMBERS_UPDATE);
  const member = useMembersStore((state) =>
    state.members.find((item) => item.Id === memberId),
  );

  if (!canUpdate) return null;

  if (!member) {
    return (
      <div className="flex flex-col items-center gap-3 py-20 text-center">
        <p className="text-sm font-medium">Member not found</p>
        <Button variant="subtle" asChild>
          <Link href="/members">Back to members</Link>
        </Button>
      </div>
    );
  }

  const label =
    member.Status === MemberStatus.Invited ? member.Email : member.Name;

  return (
    <div className="flex h-full min-h-0 flex-col gap-6 overflow-hidden">
      <div className="flex shrink-0 items-start gap-3">
        <Button
          variant="subtle"
          size="icon"
          className="size-9 shrink-0"
          asChild
        >
          <Link href={`/members/${member.Id}`}>
            <ArrowLeft className="size-4" />
          </Link>
        </Button>
        <div className="min-w-0">
          <h1 className="text-xl font-semibold tracking-tight">Edit member</h1>
          <p className="mt-1 max-w-xl truncate text-sm text-muted-foreground">
            {label} · role and portal access
          </p>
        </div>
      </div>

      <div className="min-h-0 flex-1">
        <EditMemberForm member={member} />
      </div>
    </div>
  );
}
