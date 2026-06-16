import { CalendarIcon, AlertCircleIcon } from "lucide-react";
import { type TaskStatus } from "@/db/schema";
import { cn } from "@/lib/utils";

type DueDateBadgeProps = {
  dueDate: Date | null | undefined;
  status: TaskStatus;
};

export function DueDateBadge({ dueDate, status }: DueDateBadgeProps) {
  if (!dueDate) return null;

  const isFinished = status === "done" || status === "cancelled";
  const isOverdue = !isFinished && dueDate < new Date();

  const formatted = new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
  }).format(dueDate);

  const Icon = isOverdue ? AlertCircleIcon : CalendarIcon;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 text-[10px] font-medium",
        isOverdue
          ? "text-red-600 dark:text-red-400"
          : "text-muted-foreground"
      )}
    >
      <Icon className="size-3 shrink-0" />
      {formatted}
    </span>
  );
}
