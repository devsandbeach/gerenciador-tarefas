"use client";

import { useState, useEffect } from "react";
import { LayoutListIcon, KanbanIcon, PlusIcon } from "lucide-react";
import { type TaskWithRelations, type Tag } from "@/db/schema";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { TaskList } from "./task-list";
import { TaskSheet } from "./task-sheet";
import { TaskFilters } from "./task-filters";
import { KanbanBoard } from "./kanban-board";

type View = "list" | "kanban";

type TasksViewProps = {
  tasks: TaskWithRelations[];
  tags: Tag[];
  defaultView: View;
};

export function TasksView({ tasks, tags, defaultView }: TasksViewProps) {
  const [openTask, setOpenTask] = useState<TaskWithRelations | "new" | null>(
    null
  );
  const [view, setView] = useState<View>(defaultView);

  // Quando o servidor revalida, mantém o sheet aberto com dados frescos
  useEffect(() => {
    if (openTask === null || openTask === "new") return;
    const fresh = tasks.find((t) => t.id === (openTask as TaskWithRelations).id);
    if (fresh) setOpenTask(fresh);
  }, [tasks]);

  const sheetOpen = openTask !== null;
  const sheetMode = openTask === "new" ? "create" : "edit";
  const sheetTask =
    openTask !== null && openTask !== "new" ? openTask : null;

  const openCount = tasks.filter(
    (t) => t.status !== "done" && t.status !== "cancelled"
  ).length;

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-5xl px-4 py-10">
        {/* Cabeçalho */}
        <div className="mb-6 flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              Minhas Tarefas
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {openCount === 0
                ? "Tudo em dia!"
                : `${openCount} tarefa${openCount !== 1 ? "s" : ""} em aberto`}
            </p>
          </div>

          <div className="flex items-center gap-2">
            {/* Toggle de visualização */}
            <div className="flex items-center rounded-lg border border-border p-0.5">
              <button
                type="button"
                onClick={() => setView("list")}
                className={cn(
                  "flex size-7 items-center justify-center rounded-md transition-colors",
                  view === "list"
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground"
                )}
                aria-label="Visualização em lista"
              >
                <LayoutListIcon className="size-4" />
              </button>
              <button
                type="button"
                onClick={() => setView("kanban")}
                className={cn(
                  "flex size-7 items-center justify-center rounded-md transition-colors",
                  view === "kanban"
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground"
                )}
                aria-label="Visualização kanban"
              >
                <KanbanIcon className="size-4" />
              </button>
            </div>

            <Button
              size="sm"
              onClick={() => setOpenTask("new")}
              className="gap-1.5"
            >
              <PlusIcon />
              Nova tarefa
            </Button>
          </div>
        </div>

        {/* Filtros */}
        <div className="mb-5">
          <TaskFilters />
        </div>

        {/* Conteúdo: lista ou kanban */}
        {view === "list" ? (
          <TaskList tasks={tasks} onOpen={setOpenTask} />
        ) : (
          <KanbanBoard tasks={tasks} onOpen={setOpenTask} />
        )}
      </div>

      {/* Sheet de criação / edição */}
      <TaskSheet
        open={sheetOpen}
        mode={sheetMode}
        task={sheetTask}
        allTags={tags}
        onClose={() => setOpenTask(null)}
      />
    </div>
  );
}
