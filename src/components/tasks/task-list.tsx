import { type TaskWithRelations } from "@/db/schema";
import { TaskCard } from "./task-card";

type TaskListProps = {
  tasks: TaskWithRelations[];
  onOpen: (task: TaskWithRelations) => void;
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

  return (
    <div className="flex flex-col gap-2">
      {tasks.map((task) => (
        <TaskCard key={task.id} task={task} onOpen={onOpen} />
      ))}
    </div>
  );
}
