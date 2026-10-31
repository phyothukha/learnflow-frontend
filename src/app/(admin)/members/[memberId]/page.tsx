"use client";

import { use, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import dayjs from "dayjs";
import { formatRelative } from "@/utils/format";
import {
  ArrowLeft,
  Ban,
  BookPlus,
  CircleCheck,
  NotebookPen,
  Pencil,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { PermissionSummary } from "@/components/permission-checklist";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { usePermission } from "@/hooks/use-permission";
import { useWorkspaceNotesHydration } from "@/hooks/use-workspace-notes-hydration";
import { ENROLLMENT_STATUS_VARIANT } from "@/lib/enrollment-status";
import { MEMBER_PORTAL_PERMISSION_GROUPS } from "@/lib/permission-groups";
import { MEMBER_STATUS_VARIANT } from "@/lib/member-status";
import { PERMISSIONS } from "@/lib/permissions";
import { useRequirePermission } from "@/hooks/use-require-permission";
import {
  MemberStatus,
  useMembersStore,
} from "@/store/client/mock/members-store";
import { useRolesStore } from "@/store/client/mock/roles-store";
import { useTeamsStore } from "@/store/client/teams-store";
import { taskPercent } from "@/utils/member";
import { getInitials } from "@/utils/string";
import {
  portalAccessLabel,
  portalCodesFrom,
} from "../components/portal-access-fields";
import { EnrollDialog } from "../components/enroll-dialog";
import MembersProvider, {
  MembersDialogType,
  useMembers,
} from "../context/members-context";

interface MemberDetailPageProps {
  params: Promise<{ memberId: string }>;
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-lg border p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-lg font-semibold tabular-nums">{value}</p>
    </div>
  );
}

function MemberTeamsSection({ memberId }: { memberId: string }) {
  const ready = useWorkspaceNotesHydration();
  const allTeams = useTeamsStore((state) => state.teams);
  const teams = useMemo(
    () =>
      allTeams.filter((team) =>
        team.Members.some((member) => member.MemberId === memberId),
      ),
    [allTeams, memberId],
  );

  return (
    <section className="space-y-3">
      <h2 className="text-sm font-semibold">
        Teams {ready ? `(${teams.length})` : ""}
      </h2>
      {!ready ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : teams.length === 0 ? (
        <p className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
          Not in any team yet.
        </p>
      ) : (
        <ul className="grid gap-2 sm:grid-cols-2">
          {teams.map((team) => {
            const member = team.Members.find((m) => m.MemberId === memberId);
            return (
              <li key={team.Id}>
                <Link
                  href={`/teams/${team.Id}`}
                  className="flex items-center gap-3 rounded-lg border px-3 py-2.5 transition-colors hover:bg-muted/40"
                >
                  <span
                    className="size-2.5 shrink-0 rounded-full"
                    style={{ backgroundColor: team.Color }}
                  />
                  <span className="min-w-0 flex-1 truncate text-sm font-medium">
                    {team.Name}
                  </span>
                  {member?.CanAccessNotes ? (
                    <Badge variant="status-green" className="gap-1">
                      <NotebookPen className="size-3" />
                      Notes
                    </Badge>
                  ) : (
                    <Badge variant="outline">No notes</Badge>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

function MemberDetailContent({ memberId }: { memberId: string }) {
  const router = useRouter();
  const { openDialog } = useMembers();
  const { hasPermission } = usePermission();
  const member = useMembersStore((state) =>
    state.members.find((item) => item.Id === memberId),
  );
  const setStatus = useMembersStore((state) => state.setStatus);
  const unenroll = useMembersStore((state) => state.unenroll);
  const role = useRolesStore((state) =>
    state.roles.find((item) => item.Id === member?.RoleId),
  );
  const roleName = role?.Name;
  const permissions = member?.CustomPermissions ?? role?.Permissions ?? [];

  const canUpdate = hasPermission(PERMISSIONS.MEMBERS_UPDATE);
  const canEnroll = hasPermission(PERMISSIONS.ENROLLMENTS_CREATE);
  const canUnenroll = hasPermission(PERMISSIONS.ENROLLMENTS_DELETE);
  const isDisabled = member?.Status === MemberStatus.Disabled;

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

  const title =
    member.Status === MemberStatus.Invited ? member.Email : member.Name;
  const subtitle =
    member.Status === MemberStatus.Invited
      ? "Invite pending — name set on accept"
      : member.Email;

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex min-w-0 items-start gap-3">
          <Button
            variant="subtle"
            size="icon"
            className="size-9 shrink-0"
            asChild
          >
            <Link href="/members">
              <ArrowLeft className="size-4" />
            </Link>
          </Button>
          <div className="flex min-w-0 items-center gap-3">
            <Avatar className="size-12 shrink-0">
              <AvatarFallback>
                {getInitials(
                  member.Status === MemberStatus.Invited
                    ? member.Email
                    : member.Name,
                )}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <h1 className="truncate text-xl font-semibold tracking-tight">
                {title}
              </h1>
              <p className="truncate text-sm text-muted-foreground">
                {subtitle}
              </p>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <Badge
                  variant={
                    MEMBER_STATUS_VARIANT.get(member.Status) ?? "status-slate"
                  }
                >
                  {member.Status}
                </Badge>
                <Badge variant="outline">{roleName ?? "No role"}</Badge>
                <span className="text-xs text-muted-foreground">
                  Joined {dayjs(member.JoinedAt).format("DD MMM YYYY")}
                </span>
              </div>
            </div>
          </div>
        </div>
        {canUpdate && (
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" asChild>
              <Link href={`/members/${member.Id}/edit`}>
                <Pencil />
                Edit member
              </Link>
            </Button>
            <Button
              variant={isDisabled ? "default" : "outline"}
              onClick={() => {
                setStatus(
                  member.Id,
                  isDisabled ? MemberStatus.Active : MemberStatus.Disabled,
                );
                toast.success(
                  isDisabled ? "Member enabled." : "Member disabled.",
                );
              }}
            >
              {isDisabled ? <CircleCheck /> : <Ban />}
              {isDisabled ? "Enable member" : "Disable member"}
            </Button>
          </div>
        )}
      </div>

      <div className="grid gap-8 lg:grid-cols-[1.2fr_1fr]">
        <div className="space-y-8">
          <MemberTeamsSection memberId={member.Id} />

          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold">
                Enrollments ({member.Enrollments.length})
              </h2>
              {canEnroll && (
                <Button
                  size="sm"
                  variant="outline"
                  disabled={isDisabled}
                  onClick={() =>
                    openDialog(MembersDialogType.Enroll, member.Id)
                  }
                >
                  <BookPlus />
                  Enroll
                </Button>
              )}
            </div>
            {member.Enrollments.length === 0 ? (
              <p className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
                Not enrolled in any course yet.
              </p>
            ) : (
              <ul className="space-y-2">
                {member.Enrollments.map((item) => (
                  <li key={item.Id} className="space-y-2 rounded-lg border p-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">
                          {item.CourseTitle}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Enrolled{" "}
                          {dayjs(item.EnrolledAt).format("DD MMM YYYY")}
                        </p>
                      </div>
                      <div className="flex shrink-0 items-center gap-1">
                        <Badge
                          variant={
                            ENROLLMENT_STATUS_VARIANT.get(item.Status) ??
                            "status-slate"
                          }
                        >
                          {item.Status}
                        </Badge>
                        {canUnenroll && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-6"
                            title="Remove enrollment"
                            onClick={() => {
                              unenroll(member.Id, item.Id);
                              toast.success("Enrollment removed.");
                            }}
                          >
                            <X className="size-3.5" />
                          </Button>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                        <div
                          className="h-full rounded-full bg-primary"
                          style={{ width: `${item.ProgressPercent}%` }}
                        />
                      </div>
                      <span className="text-xs text-muted-foreground tabular-nums">
                        {item.ProgressPercent}%
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>

        <div className="space-y-8">
          <section className="space-y-3">
            <h2 className="text-sm font-semibold">Learning activity</h2>
            <div className="grid grid-cols-2 gap-3">
              <Stat label="Active goals" value={member.ActiveGoals} />
              <Stat label="Day streak" value={member.StreakDays} />
              <Stat
                label="Tasks done"
                value={`${member.TasksDone}/${member.TasksTotal}`}
              />
              <Stat label="Task completion" value={`${taskPercent(member)}%`} />
            </div>
            <p className="text-xs text-muted-foreground">
              {member.LastLoginAt
                ? `Last active ${formatRelative(member.LastLoginAt)}`
                : "Has not signed in yet"}
            </p>
          </section>

          <section className="space-y-3">
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-sm font-semibold">Portal access</h2>
              <Badge variant="outline">
                {portalAccessLabel(portalCodesFrom(permissions), {
                  isCustom: member.CustomPermissions !== null,
                  roleName: roleName ?? "role",
                })}
              </Badge>
            </div>
            <PermissionSummary
              permissions={portalCodesFrom(permissions)}
              groups={MEMBER_PORTAL_PERMISSION_GROUPS}
              emptyLabel="No member-portal tabs granted."
            />
            {canUpdate && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push(`/members/${member.Id}/edit`)}
              >
                Change access
              </Button>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}

export default function MemberDetailPage({ params }: MemberDetailPageProps) {
  const { memberId } = use(params);
  const canView = useRequirePermission(PERMISSIONS.MEMBERS_VIEW);

  if (!canView) return null;

  return (
    <MembersProvider>
      <MemberDetailContent memberId={memberId} />
      <EnrollDialog />
    </MembersProvider>
  );
}
