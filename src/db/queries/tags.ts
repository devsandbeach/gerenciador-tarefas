import { db } from "@/db";
import { tags, taskTags, type Tag } from "@/db/schema";
import { eq, and } from "drizzle-orm";

export async function getTags(): Promise<Tag[]> {
  return db.select().from(tags);
}

export async function createTag(
  data: Pick<Tag, "name" | "color">
): Promise<Tag> {
  const [tag] = await db.insert(tags).values(data).returning();
  return tag;
}

export async function updateTag(
  id: number,
  data: Partial<Pick<Tag, "name" | "color">>
): Promise<Tag> {
  const [tag] = await db.update(tags).set(data).where(eq(tags.id, id)).returning();
  return tag;
}

export async function deleteTag(id: number): Promise<void> {
  await db.delete(tags).where(eq(tags.id, id));
}

export async function addTagToTask(
  taskId: number,
  tagId: number
): Promise<void> {
  await db.insert(taskTags).values({ taskId, tagId }).onConflictDoNothing();
}

export async function removeTagFromTask(
  taskId: number,
  tagId: number
): Promise<void> {
  await db
    .delete(taskTags)
    .where(and(eq(taskTags.taskId, taskId), eq(taskTags.tagId, tagId)));
}
