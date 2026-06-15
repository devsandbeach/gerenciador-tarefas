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

  return (
    <span
      className={cn(
        "text-xs",
        isOverdue
          ? "font-medium text-red-600 dark:text-red-400"
          : "text-muted-foreground"
      )}
    >
      {formatted}
    </span>
  );
}
