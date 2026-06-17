"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import {
  createSubtask,
  toggleSubtask,
  updateSubtask,
  deleteSubtask,
} from "@/db/queries/subtasks";

const SubtaskTitleSchema = z.string().min(1, "Título obrigatório").max(255);

export async function createSubtaskAction(taskId: number, title: string) {
  const validatedTitle = SubtaskTitleSchema.parse(title);
  const sub = await createSubtask(taskId, validatedTitle);
  revalidatePath("/");
  return sub;
}

export async function toggleSubtaskAction(id: number, completed: boolean) {
  await toggleSubtask(id, completed);
  revalidatePath("/");
}

export async function updateSubtaskAction(id: number, title: string) {
  await updateSubtask(id, title);
  revalidatePath("/");
}

export async function deleteSubtaskAction(id: number) {
  await deleteSubtask(id);
  revalidatePath("/");
}
