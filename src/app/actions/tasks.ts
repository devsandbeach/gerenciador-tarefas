"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import {
  createTask,
  updateTask,
  deleteTask,
  duplicateTask,
  reorderTasks,
} from "@/db/queries/tasks";
import { TASK_STATUS, TASK_PRIORITY } from "@/db/schema";

const CreateTaskSchema = z.object({
  title: z.string().min(1, "Título obrigatório").max(255),
  description: z.string().optional(),
  status: z.enum(TASK_STATUS).default("todo"),
  priority: z.enum(TASK_PRIORITY).default("medium"),
  dueDate: z.coerce.date().optional(),
});

const UpdateTaskSchema = CreateTaskSchema.partial();

export async function createTaskAction(
  input: z.infer<typeof CreateTaskSchema>
) {
  const data = CreateTaskSchema.parse(input);
  const task = await createTask(data);
  revalidatePath("/");
  return task;
}

export async function updateTaskAction(
  id: number,
  input: z.infer<typeof UpdateTaskSchema>
) {
  const data = UpdateTaskSchema.parse(input);
  const task = await updateTask(id, data);
  revalidatePath("/");
  return task;
}

export async function updateTaskStatusAction(
  id: number,
  status: (typeof TASK_STATUS)[number]
) {
  await updateTask(id, { status });
  revalidatePath("/");
}

export async function deleteTaskAction(id: number) {
  await deleteTask(id);
  revalidatePath("/");
}

export async function duplicateTaskAction(id: number) {
  const task = await duplicateTask(id);
  revalidatePath("/");
  return task;
}

export async function reorderTasksAction(orderedIds: number[]) {
  await reorderTasks(orderedIds);
  revalidatePath("/");
}
