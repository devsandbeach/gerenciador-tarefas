"use client";

import { useEffect, useTransition } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  createTaskAction,
  updateTaskAction,
  deleteTaskAction,
} from "@/app/actions/tasks";
import {
  TASK_STATUS,
  TASK_PRIORITY,
  type TaskWithRelations,
  type Tag,
} from "@/db/schema";
import { SubtaskList } from "./subtask-list";
import { TagPicker } from "./tag-picker";

const STATUS_LABELS: Record<(typeof TASK_STATUS)[number], string> = {
  todo: "A Fazer",
  in_progress: "Em Progresso",
  in_review: "Em Revisão",
  done: "Concluído",
  cancelled: "Cancelado",
};

const PRIORITY_LABELS: Record<(typeof TASK_PRIORITY)[number], string> = {
  low: "Baixa",
  medium: "Média",
  high: "Alta",
  urgent: "Urgente",
};

const formSchema = z.object({
  title: z.string().min(1, "Título obrigatório").max(255),
  description: z.string().optional(),
  status: z.enum(TASK_STATUS),
  priority: z.enum(TASK_PRIORITY),
  dueDate: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

type TaskSheetProps = {
  open: boolean;
  mode: "create" | "edit";
  task: TaskWithRelations | null;
  allTags: Tag[];
  onClose: () => void;
};

export function TaskSheet({
  open,
  mode,
  task,
  allTags,
  onClose,
}: TaskSheetProps) {
  const [isPending, startTransition] = useTransition();
  const isEditing = mode === "edit" && task !== null;

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      description: "",
      status: "todo",
      priority: "medium",
      dueDate: "",
    },
  });

  useEffect(() => {
    if (!open) return;
    if (isEditing && task) {
      form.reset({
        title: task.title,
        description: task.description ?? "",
        status: task.status,
        priority: task.priority,
        dueDate: task.dueDate
          ? [
              task.dueDate.getFullYear(),
              String(task.dueDate.getMonth() + 1).padStart(2, "0"),
              String(task.dueDate.getDate()).padStart(2, "0"),
            ].join("-")
          : "",
      });
    } else {
      form.reset({
        title: "",
        description: "",
        status: "todo",
        priority: "medium",
        dueDate: "",
      });
    }
  }, [open, task, isEditing, form]);

  function onSubmit(values: FormValues) {
    startTransition(async () => {
      const payload = {
        ...values,
        dueDate: values.dueDate ? new Date(values.dueDate + "T00:00:00") : undefined,
      };

      if (isEditing) {
        await updateTaskAction(task!.id, payload);
        toast.success("Tarefa atualizada");
      } else {
        await createTaskAction(payload);
        toast.success("Tarefa criada");
      }
      onClose();
    });
  }

  function handleDelete() {
    if (!task) return;
    startTransition(async () => {
      await deleteTaskAction(task.id);
      toast.success("Tarefa excluída");
      onClose();
    });
  }

  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent
        side="right"
        className="flex flex-col gap-0 overflow-hidden p-0 sm:max-w-md"
      >
        <SheetHeader className="px-6 py-4">
          <SheetTitle>
            {isEditing ? "Editar tarefa" : "Nova tarefa"}
          </SheetTitle>
        </SheetHeader>

        <Separator />

        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="flex flex-1 flex-col overflow-hidden"
        >
          <div className="flex-1 space-y-5 overflow-y-auto px-6 py-5">
            {/* Título */}
            <div className="space-y-1.5">
              <Label htmlFor="task-title">Título *</Label>
              <Input
                id="task-title"
                placeholder="Nome da tarefa"
                {...form.register("title")}
              />
              {form.formState.errors.title && (
                <p className="text-xs text-destructive">
                  {form.formState.errors.title.message}
                </p>
              )}
            </div>

            {/* Descrição */}
            <div className="space-y-1.5">
              <Label htmlFor="task-description">Descrição</Label>
              <Textarea
                id="task-description"
                placeholder="Adicione uma descrição..."
                rows={4}
                className="resize-none"
                {...form.register("description")}
              />
            </div>

            {/* Status + Prioridade */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Status</Label>
                <Controller
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <Select
                      value={field.value}
                      onValueChange={field.onChange}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue>
                          {(v: string) => STATUS_LABELS[v as (typeof TASK_STATUS)[number]] ?? v}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        {TASK_STATUS.map((s) => (
                          <SelectItem key={s} value={s}>
                            {STATUS_LABELS[s]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>

              <div className="space-y-1.5">
                <Label>Prioridade</Label>
                <Controller
                  control={form.control}
                  name="priority"
                  render={({ field }) => (
                    <Select
                      value={field.value}
                      onValueChange={field.onChange}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue>
                          {(v: string) => PRIORITY_LABELS[v as (typeof TASK_PRIORITY)[number]] ?? v}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        {TASK_PRIORITY.map((p) => (
                          <SelectItem key={p} value={p}>
                            {PRIORITY_LABELS[p]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
            </div>

            {/* Data de vencimento */}
            <div className="space-y-1.5">
              <Label htmlFor="task-due-date">Data de vencimento</Label>
              <Input
                id="task-due-date"
                type="date"
                lang="pt-BR"
                {...form.register("dueDate")}
              />
            </div>

            {/* Subtarefas e etiquetas — apenas no modo edição */}
            {isEditing && task && (
              <>
                <Separator />

                <TagPicker
                  taskId={task.id}
                  allTags={allTags}
                  taskTags={task.tags}
                />

                <SubtaskList
                  taskId={task.id}
                  subtasks={task.subtasks}
                />
              </>
            )}
          </div>

          <Separator />

          {/* Rodapé */}
          <div className="flex items-center justify-between px-6 py-4">
            {isEditing ? (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    disabled={isPending}
                  >
                    Excluir
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Excluir tarefa?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Esta ação não pode ser desfeita. A tarefa e todas as suas
                      subtarefas serão removidas permanentemente.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleDelete}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      Confirmar exclusão
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            ) : (
              <span />
            )}

            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={onClose}
                disabled={isPending}
              >
                Cancelar
              </Button>
              <Button type="submit" size="sm" disabled={isPending}>
                {isPending
                  ? "Salvando..."
                  : isEditing
                    ? "Salvar alterações"
                    : "Criar tarefa"}
              </Button>
            </div>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}
