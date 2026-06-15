"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import {
  createTag,
  updateTag,
  deleteTag,
  addTagToTask,
  removeTagFromTask,
} from "@/db/queries/tags";

const TagSchema = z.object({
  name: z.string().min(1).max(50),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/, "Cor inválida"),
});

export async function createTagAction(input: z.infer<typeof TagSchema>) {
  const tag = await createTag(TagSchema.parse(input));
  revalidatePath("/");
  return tag;
}

export async function updateTagAction(
  id: number,
  input: Partial<z.infer<typeof TagSchema>>
) {
  const tag = await updateTag(id, TagSchema.partial().parse(input));
  revalidatePath("/");
  return tag;
}

export async function deleteTagAction(id: number) {
  await deleteTag(id);
  revalidatePath("/");
}

export async function addTagToTaskAction(taskId: number, tagId: number) {
  await addTagToTask(taskId, tagId);
  revalidatePath("/");
}

export async function removeTagFromTaskAction(taskId: number, tagId: number) {
  await removeTagFromTask(taskId, tagId);
  revalidatePath("/");
}
