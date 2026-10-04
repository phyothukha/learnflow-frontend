"use client";

import { use, useEffect, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { format, formatDistanceToNow } from "date-fns";
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
import { LEARNER_PORTAL_PERMISSION_GROUPS } from "@/lib/permission-groups";
import { LEARNER_STATUS_VARIANT } from "@/lib/learner-status";
import { PERMISSIONS } from "@/lib/permissions";
import {
  LearnerStatus,
  useLearnersStore,
} from "@/store/client/mock/learners-store";
import { useRolesStore } from "@/store/client/mock/roles-store";
import { useTeamsStore } from "@/store/client/teams-store";
import { taskPercent } from "@/utils/learner";
import { getInitials } from "@/utils/string";
import {
  portalAccessLabel,
  portalCodesFrom,
} from "../components/portal-access-fields";
import { EnrollDialog } from "../components/enroll-dialog";
import LearnersProvider, {
  LearnersDialogType,
  useLearners,
} from "../context/learners-context";

interface LearnerDetailPageProps {
  params: Promise<{ learnerId: string }>;
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-lg border p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-lg font-semibold tabular-nums">{value}</p>
    </div>
  );
}

function LearnerTeamsSection({ learnerId }: { learnerId: string }) {
  const ready = useWorkspaceNotesHydration();
  const allTeams = useTeamsStore((state) => state.teams);
  const teams = useMemo(
    () =>
      allTeams.filter((team) =>
        team.Members.some((member) => member.LearnerId === learnerId),
      ),
    [allTeams, learnerId],
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
            const member = team.Members.find((m) => m.LearnerId === learnerId);
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

function LearnerDetailContent({ learnerId }: { learnerId: string }) {
  const router = useRouter();
  const { openDialog } = useLearners();
  const { hasPermission } = usePermission();
  const learner = useLearnersStore((state) =>
    state.learners.find((item) => item.Id === learnerId),
  );
  const setStatus = useLearnersStore((state) => state.setStatus);
  const unenroll = useLearnersStore((state) => state.unenroll);
  const role = useRolesStore((state) =>
    state.roles.find((item) => item.Id === learner?.RoleId),
  );
  const roleName = role?.Name;
  const permissions = learner?.CustomPermissions ?? role?.Permissions ?? [];

  const canUpdate = hasPermission(PERMISSIONS.LEARNERS_UPDATE);
  const canEnroll = hasPermission(PERMISSIONS.ENROLLMENTS_CREATE);
  const canUnenroll = hasPermission(PERMISSIONS.ENROLLMENTS_DELETE);
  const isDisabled = learner?.Status === LearnerStatus.Disabled;

  if (!learner) {
    return (
      <div className="flex flex-col items-center gap-3 py-20 text-center">
        <p className="text-sm font-medium">Learner not found</p>
        <Button variant="subtle" asChild>
          <Link href="/learners">Back to learners</Link>
        </Button>
      </div>
    );
  }

  const title =
    learner.Status === LearnerStatus.Invited ? learner.Email : learner.Name;
  const subtitle =
    learner.Status === LearnerStatus.Invited
      ? "Invite pending — name set on accept"
      : learner.Email;

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
            <Link href="/learners">
              <ArrowLeft className="size-4" />
            </Link>
          </Button>
          <div className="flex min-w-0 items-center gap-3">
            <Avatar className="size-12 shrink-0">
              <AvatarFallback>
                {getInitials(
                  learner.Status === LearnerStatus.Invited
                    ? learner.Email
                    : learner.Name,
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
                    LEARNER_STATUS_VARIANT.get(learner.Status) ?? "status-slate"
                  }
                >
                  {learner.Status}
                </Badge>
                <Badge variant="outline">{roleName ?? "No role"}</Badge>
                <span className="text-xs text-muted-foreground">
                  Joined {format(new Date(learner.JoinedAt), "dd MMM yyyy")}
                </span>
              </div>
            </div>
          </div>
        </div>
        {canUpdate && (
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" asChild>
              <Link href={`/learners/${learner.Id}/edit`}>
                <Pencil />
                Edit learner
              </Link>
            </Button>
            <Button
              variant={isDisabled ? "default" : "outline"}
              onClick={() => {
                setStatus(
                  learner.Id,
                  isDisabled ? LearnerStatus.Active : LearnerStatus.Disabled,
                );
                toast.success(
                  isDisabled ? "Learner enabled." : "Learner disabled.",
                );
              }}
            >
              {isDisabled ? <CircleCheck /> : <Ban />}
              {isDisabled ? "Enable learner" : "Disable learner"}
            </Button>
          </div>
        )}
      </div>

      <div className="grid gap-8 lg:grid-cols-[1.2fr_1fr]">
        <div className="space-y-8">
          <LearnerTeamsSection learnerId={learner.Id} />

          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold">
                Enrollments ({learner.Enrollments.length})
              </h2>
              {canEnroll && (
                <Button
                  size="sm"
                  variant="outline"
                  disabled={isDisabled}
                  onClick={() =>
                    openDialog(LearnersDialogType.Enroll, learner.Id)
                  }
                >
                  <BookPlus />
                  Enroll
                </Button>
              )}
            </div>
            {learner.Enrollments.length === 0 ? (
              <p className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
                Not enrolled in any course yet.
              </p>
            ) : (
              <ul className="space-y-2">
                {learner.Enrollments.map((item) => (
                  <li key={item.Id} className="space-y-2 rounded-lg border p-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">
                          {item.CourseTitle}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Enrolled{" "}
                          {format(new Date(item.EnrolledAt), "dd MMM yyyy")}
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
                              unenroll(learner.Id, item.Id);
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
              <Stat label="Active goals" value={learner.ActiveGoals} />
              <Stat label="Day streak" value={learner.StreakDays} />
              <Stat
                label="Tasks done"
                value={`${learner.TasksDone}/${learner.TasksTotal}`}
              />
              <Stat
                label="Task completion"
                value={`${taskPercent(learner)}%`}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              {learner.LastLoginAt
                ? `Last active ${formatDistanceToNow(new Date(learner.LastLoginAt), { addSuffix: true })}`
                : "Has not signed in yet"}
            </p>
          </section>

          <section className="space-y-3">
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-sm font-semibold">Portal access</h2>
              <Badge variant="outline">
                {portalAccessLabel(portalCodesFrom(permissions), {
                  isCustom: learner.CustomPermissions !== null,
                  roleName: roleName ?? "role",
                })}
              </Badge>
            </div>
            <PermissionSummary
              permissions={portalCodesFrom(permissions)}
              groups={LEARNER_PORTAL_PERMISSION_GROUPS}
              emptyLabel="No learner-portal tabs granted."
            />
            {canUpdate && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push(`/learners/${learner.Id}/edit`)}
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

export default function LearnerDetailPage({ params }: LearnerDetailPageProps) {
  const { learnerId } = use(params);
  const router = useRouter();
  const { status } = useSession();
  const { hasPermission } = usePermission();
  const canView = hasPermission(PERMISSIONS.LEARNERS_VIEW);

  useEffect(() => {
    if (status === "authenticated" && !canView) router.replace("/forbidden");
  }, [status, canView, router]);

  if (status !== "authenticated" || !canView) return null;

  return (
    <LearnersProvider>
      <LearnerDetailContent learnerId={learnerId} />
      <EnrollDialog />
    </LearnersProvider>
  );
}
