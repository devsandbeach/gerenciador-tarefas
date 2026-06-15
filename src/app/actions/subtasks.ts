"use server";

import { revalidatePath } from "next/cache";
import {
  createSubtask,
  toggleSubtask,
  updateSubtask,
  deleteSubtask,
} from "@/db/queries/subtasks";

export async function createSubtaskAction(taskId: number, title: string) {
  const sub = await createSubtask(taskId, title);
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
