"use client";

import { useDroppable } from "@dnd-kit/core";
import { type TaskStatus, type TaskWithRelations } from "@/db/schema";
import { KanbanCard } from "./kanban-card";
import { cn } from "@/lib/utils";

type KanbanColumnProps = {
  status: TaskStatus;
  label: string;
  tasks: TaskWithRelations[];
  onOpen: (task: TaskWithRelations) => void;
  isPending: boolean;
};

export function KanbanColumn({
  status,
  label,
  tasks,
  onOpen,
  isPending,
}: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id: status });

  return (
    <div className="flex w-64 shrink-0 flex-col">
      {/* Cabeçalho da coluna */}
      <div className="mb-3 flex items-center gap-2 px-1">
        <span className="text-sm font-medium text-foreground">{label}</span>
        <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-muted px-1.5 text-xs text-muted-foreground">
          {tasks.length}
        </span>
      </div>

      {/* Área droppable */}
      <div
        ref={setNodeRef}
        className={cn(
          "flex min-h-24 flex-col gap-2 rounded-xl p-2 transition-colors",
          isOver ? "bg-primary/10 ring-1 ring-primary/30" : "bg-muted/20",
          isPending && "pointer-events-none"
        )}
      >
        {tasks.map((task) => (
          <KanbanCard key={task.id} task={task} onOpen={onOpen} />
        ))}

        {tasks.length === 0 && (
          <div className="flex flex-1 items-center justify-center py-6">
            <p className="text-xs text-muted-foreground">Sem tarefas</p>
          </div>
        )}
      </div>
    </div>
  );
}
