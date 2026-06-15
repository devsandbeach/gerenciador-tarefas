import { db } from "@/db";
import { subtasks, type Subtask } from "@/db/schema";
import { eq, sql } from "drizzle-orm";

export async function createSubtask(
  taskId: number,
  title: string
): Promise<Subtask> {
  const [max] = await db
    .select({ m: sql<number>`max(${subtasks.position})` })
    .from(subtasks)
    .where(eq(subtasks.taskId, taskId));

  const [sub] = await db
    .insert(subtasks)
    .values({ taskId, title, position: (max.m ?? -1) + 1 })
    .returning();

  return sub;
}

export async function toggleSubtask(
  id: number,
  completed: boolean
): Promise<Subtask> {
  const [sub] = await db
    .update(subtasks)
    .set({ completedAt: completed ? new Date() : null })
    .where(eq(subtasks.id, id))
    .returning();

  return sub;
}

export async function updateSubtask(
  id: number,
  title: string
): Promise<Subtask> {
  const [sub] = await db
    .update(subtasks)
    .set({ title })
    .where(eq(subtasks.id, id))
    .returning();

  return sub;
}

export async function deleteSubtask(id: number): Promise<void> {
  await db.delete(subtasks).where(eq(subtasks.id, id));
}
