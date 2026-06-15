"use client";

import { useState, useTransition } from "react";
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { updateTaskStatusAction } from "@/app/actions/tasks";
import {
  TASK_STATUS,
  type TaskStatus,
  type TaskWithRelations,
} from "@/db/schema";
import { KanbanColumn } from "./kanban-column";

const STATUS_LABELS: Record<TaskStatus, string> = {
  todo: "A Fazer",
  in_progress: "Em Progresso",
  in_review: "Em Revisão",
  done: "Concluído",
  cancelled: "Cancelado",
};

type KanbanBoardProps = {
  tasks: TaskWithRelations[];
  onOpen: (task: TaskWithRelations) => void;
};

export function KanbanBoard({ tasks, onOpen }: KanbanBoardProps) {
  const [isPending, startTransition] = useTransition();
  const [activeId, setActiveId] = useState<number | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  const activeTask = tasks.find((t) => t.id === activeId) ?? null;

  function handleDragStart({ active }: DragStartEvent) {
    setActiveId(active.id as number);
  }

  function handleDragEnd({ active, over }: DragEndEvent) {
    setActiveId(null);
    if (!over) return;

    const taskId = active.id as number;
    const overId = over.id as string;

    // over.id é sempre o id de uma coluna (status string)
    if (!TASK_STATUS.includes(overId as TaskStatus)) return;

    const newStatus = overId as TaskStatus;
    const task = tasks.find((t) => t.id === taskId);

    if (task && task.status !== newStatus) {
      startTransition(async () => {
        await updateTaskStatusAction(taskId, newStatus);
      });
    }
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={() => setActiveId(null)}
    >
      {/* Scroll horizontal em telas pequenas */}
      <div className="-mx-4 overflow-x-auto px-4 pb-4">
        <div className="flex gap-3" style={{ minWidth: "max-content" }}>
          {TASK_STATUS.map((status) => (
            <KanbanColumn
              key={status}
              status={status}
              label={STATUS_LABELS[status]}
              tasks={tasks.filter((t) => t.status === status)}
              onOpen={onOpen}
              isPending={isPending}
            />
          ))}
        </div>
      </div>

      {/* Card fantasma durante o drag */}
      <DragOverlay dropAnimation={null}>
        {activeTask ? (
          <div className="w-64 rounded-xl border border-primary/30 bg-card px-3 py-2.5 shadow-xl ring-1 ring-primary/20">
            <p className="text-sm font-medium">{activeTask.title}</p>
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
