import { type TaskPriority } from "@/db/schema";
import { cn } from "@/lib/utils";

const PRIORITY_CONFIG: Record<
  TaskPriority,
  { label: string; className: string }
> = {
  low: {
    label: "Baixa",
    className:
      "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400",
  },
  medium: {
    label: "Média",
    className:
      "bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400",
  },
  high: {
    label: "Alta",
    className:
      "bg-orange-50 text-orange-700 dark:bg-orange-950/60 dark:text-orange-400",
  },
  urgent: {
    label: "Urgente",
    className: "bg-red-50 text-red-700 dark:bg-red-950/60 dark:text-red-400",
  },
};

export function PriorityBadge({ priority }: { priority: TaskPriority }) {
  const { label, className } = PRIORITY_CONFIG[priority];
  return (
    <span
      className={cn(
        "inline-flex h-5 items-center rounded-sm px-1.5 text-[10px] font-medium",
        className
      )}
    >
      {label}
    </span>
  );
}
