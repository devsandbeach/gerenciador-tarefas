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

const DATE_FORMAT = new Intl.DateTimeFormat("pt-BR", {
  weekday: "long",
  day: "numeric",
  month: "long",
});

export function TasksView({ tasks, tags, defaultView }: TasksViewProps) {
  const [openTask, setOpenTask] = useState<TaskWithRelations | "new" | null>(
    null
  );
  const [view, setView] = useState<View>(defaultView);

  useEffect(() => {
    if (openTask === null || openTask === "new") return;
    const fresh = tasks.find((t) => t.id === (openTask as TaskWithRelations).id);
    if (fresh) setOpenTask(fresh);
  }, [tasks, openTask]);

  const sheetOpen = openTask !== null;
  const sheetMode = openTask === "new" ? "create" : "edit";
  const sheetTask =
    openTask !== null && openTask !== "new" ? openTask : null;

  const openCount = tasks.filter(
    (t) => t.status !== "done" && t.status !== "cancelled"
  ).length;

  const todayLabel = DATE_FORMAT.format(new Date());

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-5xl px-4 py-10">
        {/* Cabeçalho */}
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <h1 className="text-xl font-semibold tracking-tight text-foreground">
              Minhas Tarefas
            </h1>
            <p className="mt-0.5 text-sm text-muted-foreground">
              {openCount === 0
                ? `Tudo em dia! · ${todayLabel}`
                : `${openCount} tarefa${openCount !== 1 ? "s" : ""} em aberto · ${todayLabel}`}
            </p>
          </div>

          <div className="flex items-center gap-2">
            {/* Toggle de visualização */}
            <div className="flex items-center rounded-lg border border-border bg-muted/40 p-0.5">
              <button
                type="button"
                onClick={() => setView("list")}
                className={cn(
                  "flex size-7 items-center justify-center rounded-md transition-all",
                  view === "list"
                    ? "bg-background text-primary shadow-sm ring-1 ring-border"
                    : "text-muted-foreground hover:text-foreground"
                )}
                aria-label="Visualização em lista"
              >
                <LayoutListIcon className="size-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setView("kanban")}
                className={cn(
                  "flex size-7 items-center justify-center rounded-md transition-all",
                  view === "kanban"
                    ? "bg-background text-primary shadow-sm ring-1 ring-border"
                    : "text-muted-foreground hover:text-foreground"
                )}
                aria-label="Visualização kanban"
              >
                <KanbanIcon className="size-3.5" />
              </button>
            </div>

            <Button size="sm" onClick={() => setOpenTask("new")} className="gap-1.5 shadow-sm">
              <PlusIcon className="size-3.5" />
              Nova tarefa
            </Button>
          </div>
        </div>

        {/* Filtros */}
        <div className="mb-5">
          <TaskFilters />
        </div>

        {/* Conteúdo */}
        {view === "list" ? (
          <TaskList tasks={tasks} onOpen={setOpenTask} />
        ) : (
          <KanbanBoard tasks={tasks} onOpen={setOpenTask} />
        )}
      </div>

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
