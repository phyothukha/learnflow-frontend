import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import type { TaskAssignee } from "@/store/server/tasks/interface";

export interface TaskAssigneeAvatarProps {
  assignee: TaskAssignee;
  size?: "default" | "sm" | "lg";
  className?: string;
}

export function TaskAssigneeAvatar({
  assignee,
  size = "sm",
  className,
}: TaskAssigneeAvatarProps) {
  const initials = assignee.Name.split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <Avatar size={size} className={cn("ring-2 ring-card", className)}>
      <AvatarFallback className="bg-primary/15 font-medium text-primary">
        {initials}
      </AvatarFallback>
    </Avatar>
  );
}
