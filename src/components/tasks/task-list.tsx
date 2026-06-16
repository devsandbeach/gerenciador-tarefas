import { type TaskWithRelations, type TaskStatus } from "@/db/schema";
import { TaskCard } from "./task-card";

type TaskListProps = {
  tasks: TaskWithRelations[];
  onOpen: (task: TaskWithRelations) => void;
};

const STATUS_ORDER: TaskStatus[] = [
  "todo",
  "in_progress",
  "in_review",
  "done",
  "cancelled",
];

const STATUS_LABELS: Record<TaskStatus, string> = {
  todo: "A Fazer",
  in_progress: "Em Progresso",
  in_review: "Em Revisão",
  done: "Concluídas",
  cancelled: "Canceladas",
};

const STATUS_DOTS: Record<TaskStatus, string> = {
  todo: "bg-slate-400",
  in_progress: "bg-amber-400",
  in_review: "bg-violet-400",
  done: "bg-emerald-500",
  cancelled: "bg-rose-400",
};

export function TaskList({ tasks, onOpen }: TaskListProps) {
  if (tasks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="mb-3 flex size-12 items-center justify-center rounded-full bg-muted">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="size-6 text-muted-foreground"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
            />
          </svg>
        </div>
        <h3 className="text-sm font-medium text-foreground">
          Nenhuma tarefa encontrada
        </h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Crie uma nova tarefa para começar.
        </p>
      </div>
    );
  }

  const grouped = STATUS_ORDER.reduce<Record<TaskStatus, TaskWithRelations[]>>(
    (acc, status) => {
      acc[status] = tasks.filter((t) => t.status === status);
      return acc;
    },
    {} as Record<TaskStatus, TaskWithRelations[]>
  );

  const visibleGroups = STATUS_ORDER.filter(
    (s) => grouped[s].length > 0
  );

  return (
    <div className="flex flex-col gap-6">
      {visibleGroups.map((status) => (
        <div key={status}>
          {/* Group header */}
          <div className="mb-2 flex items-center gap-2 px-1">
            <span className={`size-2 rounded-full ${STATUS_DOTS[status]}`} />
            <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
              {STATUS_LABELS[status]}
            </span>
            <span className="text-[10px] font-semibold text-muted-foreground/60">
              · {grouped[status].length}
            </span>
          </div>

          {/* Cards */}
          <div className="flex flex-col gap-1.5">
            {grouped[status].map((task) => (
              <TaskCard key={task.id} task={task} onOpen={onOpen} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
