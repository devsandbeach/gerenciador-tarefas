"use client";

import { useEffect, useState, useTransition } from "react";
import { PlusIcon, Trash2Icon } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  createSubtaskAction,
  toggleSubtaskAction,
  deleteSubtaskAction,
} from "@/app/actions/subtasks";
import { type Subtask } from "@/db/schema";
import { cn } from "@/lib/utils";

type SubtaskListProps = {
  taskId: number;
  subtasks: Subtask[];
};

export function SubtaskList({
  taskId,
  subtasks: initialSubtasks,
}: SubtaskListProps) {
  const [subtasks, setSubtasks] = useState(initialSubtasks);
  const [newTitle, setNewTitle] = useState("");
  const [isPending, startTransition] = useTransition();

  // Sincroniza quando os dados do servidor chegam atualizados
  useEffect(() => {
    setSubtasks(initialSubtasks);
  }, [initialSubtasks]);

  function handleToggle(id: number, completed: boolean) {
    setSubtasks((prev) =>
      prev.map((s) =>
        s.id === id ? { ...s, completedAt: completed ? new Date() : null } : s
      )
    );
    startTransition(async () => {
      await toggleSubtaskAction(id, completed);
    });
  }

  function handleDelete(id: number) {
    setSubtasks((prev) => prev.filter((s) => s.id !== id));
    startTransition(async () => {
      await deleteSubtaskAction(id);
    });
  }

  function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    const title = newTitle.trim();
    if (!title) return;

    // Adiciona com ID temporário negativo para diferenciar do real
    const tempId = -Date.now();
    setSubtasks((prev) => [
      ...prev,
      {
        id: tempId,
        taskId,
        title,
        completedAt: null,
        position: prev.length,
        createdAt: new Date(),
      },
    ]);
    setNewTitle("");

    startTransition(async () => {
      await createSubtaskAction(taskId, title);
    });
  }

  const completedCount = subtasks.filter((s) => s.completedAt !== null).length;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Subtarefas
        </span>
        {subtasks.length > 0 && (
          <span className="text-xs text-muted-foreground">
            {completedCount}/{subtasks.length}
          </span>
        )}
      </div>

      {subtasks.length > 0 && (
        <div className="space-y-0.5">
          {subtasks.map((sub) => (
            <div
              key={sub.id}
              className="group flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-muted/50"
            >
              <Checkbox
                checked={sub.completedAt !== null}
                onCheckedChange={(checked) =>
                  handleToggle(sub.id, checked === true)
                }
                disabled={isPending || sub.id < 0}
              />
              <span
                className={cn(
                  "flex-1 text-sm",
                  sub.completedAt !== null &&
                    "text-muted-foreground line-through"
                )}
              >
                {sub.title}
              </span>
              <button
                type="button"
                onClick={() => handleDelete(sub.id)}
                disabled={isPending || sub.id < 0}
                className="opacity-0 transition-opacity group-hover:opacity-100 text-muted-foreground hover:text-destructive disabled:pointer-events-none"
              >
                <Trash2Icon className="size-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Formulário para nova subtarefa */}
      <form onSubmit={handleAdd} className="flex items-center gap-2">
        <Input
          placeholder="Adicionar subtarefa..."
          value={newTitle}
          onChange={(e) =>
            setNewTitle((e.target as HTMLInputElement).value)
          }
          className="h-7 text-xs"
        />
        <Button
          type="submit"
          variant="outline"
          size="icon-sm"
          disabled={!newTitle.trim() || isPending}
        >
          <PlusIcon />
        </Button>
      </form>
    </div>
  );
}
