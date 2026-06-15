"use client";

import { useEffect, useState, useTransition } from "react";
import { CheckIcon, PlusIcon, XIcon } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  addTagToTaskAction,
  removeTagFromTaskAction,
  createTagAction,
} from "@/app/actions/tags";
import { type Tag } from "@/db/schema";
import { cn } from "@/lib/utils";

const PRESET_COLORS = [
  "#ef4444",
  "#f97316",
  "#eab308",
  "#22c55e",
  "#06b6d4",
  "#3b82f6",
  "#8b5cf6",
  "#ec4899",
  "#6b7280",
];

type TagPickerProps = {
  taskId: number;
  allTags: Tag[];
  taskTags: Tag[];
};

export function TagPicker({
  taskId,
  allTags,
  taskTags: initialTaskTags,
}: TagPickerProps) {
  const [taskTags, setTaskTags] = useState(initialTaskTags);
  const [newName, setNewName] = useState("");
  const [newColor, setNewColor] = useState(PRESET_COLORS[5]);
  const [isPending, startTransition] = useTransition();

  // Sincroniza quando o servidor revalida os dados
  useEffect(() => {
    setTaskTags(initialTaskTags);
  }, [initialTaskTags]);

  function toggleTag(tag: Tag) {
    const isActive = taskTags.some((t) => t.id === tag.id);

    if (isActive) {
      setTaskTags((prev) => prev.filter((t) => t.id !== tag.id));
      startTransition(async () => {
        await removeTagFromTaskAction(taskId, tag.id);
      });
    } else {
      setTaskTags((prev) => [...prev, tag]);
      startTransition(async () => {
        await addTagToTaskAction(taskId, tag.id);
      });
    }
  }

  function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    const name = newName.trim();
    if (!name) return;
    setNewName("");

    startTransition(async () => {
      const tag = await createTagAction({ name, color: newColor });
      if (tag) {
        setTaskTags((prev) => [...prev, tag]);
        await addTagToTaskAction(taskId, tag.id);
      }
    });
  }

  return (
    <div className="space-y-2">
      <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        Etiquetas
      </span>

      <div className="flex flex-wrap gap-1.5">
        {/* Chips das etiquetas ativas */}
        {taskTags.map((tag) => (
          <span
            key={tag.id}
            className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium"
            style={{ backgroundColor: `${tag.color}20`, color: tag.color }}
          >
            {tag.name}
            <button
              type="button"
              onClick={() => toggleTag(tag)}
              disabled={isPending}
              className="rounded-full transition-opacity hover:opacity-70 disabled:pointer-events-none"
            >
              <XIcon className="size-2.5" />
            </button>
          </span>
        ))}

        {/* Botão que abre o popover */}
        <Popover>
          <PopoverTrigger
            type="button"
            className="inline-flex h-6 cursor-pointer items-center gap-1 rounded-full border border-dashed border-border px-2 text-xs text-muted-foreground transition-colors hover:border-foreground/40 hover:text-foreground"
          >
            <PlusIcon className="size-3" />
            Etiqueta
          </PopoverTrigger>

          <PopoverContent
            side="bottom"
            align="start"
            className="w-60 gap-0 p-0"
          >
            {/* Lista de etiquetas existentes */}
            <div className="max-h-44 overflow-y-auto p-1.5">
              {allTags.length === 0 ? (
                <p className="px-2 py-3 text-center text-xs text-muted-foreground">
                  Nenhuma etiqueta ainda.
                </p>
              ) : (
                allTags.map((tag) => {
                  const isActive = taskTags.some((t) => t.id === tag.id);
                  return (
                    <button
                      key={tag.id}
                      type="button"
                      onClick={() => toggleTag(tag)}
                      className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-xs transition-colors hover:bg-muted/50"
                    >
                      <span
                        className="size-3 shrink-0 rounded-full"
                        style={{ backgroundColor: tag.color }}
                      />
                      <span className="flex-1 text-left">{tag.name}</span>
                      {isActive && (
                        <CheckIcon className="size-3 text-primary" />
                      )}
                    </button>
                  );
                })
              )}
            </div>

            {/* Formulário para criar nova etiqueta */}
            <div className="border-t border-border p-2.5 pt-2">
              <p className="mb-2 text-xs font-medium text-muted-foreground">
                Nova etiqueta
              </p>
              <form onSubmit={handleCreate} className="space-y-2">
                <Input
                  placeholder="Nome da etiqueta"
                  value={newName}
                  onChange={(e) =>
                    setNewName((e.target as HTMLInputElement).value)
                  }
                  className="h-7 text-xs"
                />

                {/* Swatches de cor */}
                <div className="flex flex-wrap gap-1.5">
                  {PRESET_COLORS.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setNewColor(color)}
                      className={cn(
                        "size-5 rounded-full transition-transform hover:scale-110",
                        newColor === color &&
                          "scale-110 ring-2 ring-foreground/40 ring-offset-1"
                      )}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>

                <Button
                  type="submit"
                  size="sm"
                  disabled={!newName.trim() || isPending}
                  className="w-full"
                >
                  Criar etiqueta
                </Button>
              </form>
            </div>
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
}
