"use client";

import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { PriorityBadge } from "@/components/shared/priority-badge";
import { DueDateBadge } from "@/components/shared/due-date-badge";
import { type TaskWithRelations } from "@/db/schema";
import { cn } from "@/lib/utils";

type KanbanCardProps = {
  task: TaskWithRelations;
  onOpen: (task: TaskWithRelations) => void;
};

export function KanbanCard({ task, onOpen }: KanbanCardProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({ id: task.id });

  const style = transform
    ? { transform: CSS.Translate.toString(transform) }
    : undefined;

  const isDimmed = task.status === "done" || task.status === "cancelled";
  const completedSubtasks = task.subtasks.filter(
    (s) => s.completedAt !== null
  ).length;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={() => onOpen(task)}
      className={cn(
        "touch-none rounded-lg border border-border bg-card p-3",
        "cursor-grab active:cursor-grabbing select-none",
        "shadow-sm transition-all hover:border-primary/30 hover:shadow-md",
        isDragging && "opacity-40 shadow-lg"
      )}
    >
      {/* Título */}
      <p
        className={cn(
          "mb-2.5 text-[13px] font-medium leading-snug",
          isDimmed && "text-muted-foreground/60 line-through"
        )}
      >
        {task.title}
      </p>

      {/* Rodapé do card */}
      <div className="flex flex-wrap items-center gap-1.5">
        {task.tags.slice(0, 2).map((tag) => (
          <span
            key={tag.id}
            className="inline-flex h-4 items-center rounded-full px-1.5 text-[10px] font-medium"
            style={{
              backgroundColor: `${tag.color}18`,
              color: tag.color,
            }}
          >
            {tag.name}
          </span>
        ))}

        {task.subtasks.length > 0 && (
          <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
            {completedSubtasks}/{task.subtasks.length}
          </span>
        )}

        <div className="ml-auto flex items-center gap-1.5">
          <DueDateBadge dueDate={task.dueDate} status={task.status} />
          <PriorityBadge priority={task.priority} />
        </div>
      </div>
    </div>
  );
}
