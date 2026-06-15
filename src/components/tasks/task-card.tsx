"use client";

import { useTransition } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { PriorityBadge } from "@/components/shared/priority-badge";
import { DueDateBadge } from "@/components/shared/due-date-badge";
import { updateTaskStatusAction } from "@/app/actions/tasks";
import { type TaskWithRelations } from "@/db/schema";
import { cn } from "@/lib/utils";

type TaskCardProps = {
  task: TaskWithRelations;
  onOpen: (task: TaskWithRelations) => void;
};

export function TaskCard({ task, onOpen }: TaskCardProps) {
  const [isPending, startTransition] = useTransition();

  const isCompleted = task.status === "done";
  const isCancelled = task.status === "cancelled";
  const isDimmed = isCompleted || isCancelled;

  const completedSubtasks = task.subtasks.filter(
    (s) => s.completedAt !== null
  ).length;

  function handleToggle() {
    startTransition(async () => {
      await updateTaskStatusAction(task.id, isCompleted ? "todo" : "done");
    });
  }

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onOpen(task)}
      onKeyDown={(e) => e.key === "Enter" && onOpen(task)}
      className={cn(
        "group flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-3",
        "cursor-pointer transition-colors hover:bg-muted/40",
        isPending && "pointer-events-none opacity-50"
      )}
    >
      {/* Checkbox — click isolado, não propaga para o card */}
      <div
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => e.stopPropagation()}
        className="flex shrink-0 items-center"
      >
        <Checkbox
          checked={isCompleted}
          onCheckedChange={handleToggle}
          disabled={isCancelled || isPending}
          aria-label={`Marcar "${task.title}" como ${isCompleted ? "pendente" : "concluída"}`}
        />
      </div>

      {/* Título */}
      <p
        className={cn(
          "flex-1 truncate text-sm font-medium leading-snug",
          isDimmed && "text-muted-foreground line-through"
        )}
      >
        {task.title}
      </p>

      {/* Metadados à direita */}
      <div className="flex shrink-0 items-center gap-2">
        {/* Contador de subtarefas */}
        {task.subtasks.length > 0 && (
          <span className="text-xs text-muted-foreground">
            {completedSubtasks}/{task.subtasks.length}
          </span>
        )}

        {/* Tags (máx 2 visíveis) */}
        {task.tags.slice(0, 2).map((tag) => (
          <span
            key={tag.id}
            className="inline-flex h-5 items-center rounded-full px-2 text-xs font-medium"
            style={{
              backgroundColor: `${tag.color}20`,
              color: tag.color,
            }}
          >
            {tag.name}
          </span>
        ))}
        {task.tags.length > 2 && (
          <span className="text-xs text-muted-foreground">
            +{task.tags.length - 2}
          </span>
        )}

        <DueDateBadge dueDate={task.dueDate} status={task.status} />
        <PriorityBadge priority={task.priority} />
      </div>
    </div>
  );
}
