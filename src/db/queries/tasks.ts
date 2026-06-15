import { db } from "@/db";
import {
  tasks,
  taskTags,
  subtasks,
  type Task,
  type TaskWithRelations,
  type TASK_STATUS,
  type TASK_PRIORITY,
} from "@/db/schema";
import { eq, desc, asc, and, like, lte, gte, inArray, sql } from "drizzle-orm";

export type TaskFilters = {
  status?: (typeof TASK_STATUS)[number][];
  priority?: (typeof TASK_PRIORITY)[number][];
  tagIds?: number[];
  search?: string;
  due?: "today" | "this_week" | "overdue";
  sortBy?: "createdAt" | "dueDate" | "priority" | "position";
  sortDir?: "asc" | "desc";
};

export async function getTasks(
  filters: TaskFilters = {}
): Promise<TaskWithRelations[]> {
  const {
    status,
    priority,
    tagIds,
    search,
    due,
    sortBy = "position",
    sortDir = "asc",
  } = filters;

  const conditions = [];

  if (status?.length) conditions.push(inArray(tasks.status, status));
  if (priority?.length) conditions.push(inArray(tasks.priority, priority));
  if (search) conditions.push(like(tasks.title, `%${search}%`));

  if (tagIds?.length) {
    const taggedTaskIds = db
      .select({ taskId: taskTags.taskId })
      .from(taskTags)
      .where(inArray(taskTags.tagId, tagIds));
    conditions.push(inArray(tasks.id, taggedTaskIds));
  }

  if (due === "today") {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const end = new Date();
    end.setHours(23, 59, 59, 999);
    conditions.push(gte(tasks.dueDate, start), lte(tasks.dueDate, end));
  }

  if (due === "this_week") {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const end = new Date();
    end.setDate(end.getDate() + 7);
    end.setHours(23, 59, 59, 999);
    conditions.push(gte(tasks.dueDate, start), lte(tasks.dueDate, end));
  }

  if (due === "overdue") {
    const now = new Date();
    conditions.push(
      lte(tasks.dueDate, now),
      inArray(tasks.status, ["todo", "in_progress", "in_review"])
    );
  }

  const orderCol =
    sortBy === "createdAt"
      ? tasks.createdAt
      : sortBy === "dueDate"
        ? tasks.dueDate
        : sortBy === "priority"
          ? tasks.priority
          : tasks.position;

  const rows = await db.query.tasks.findMany({
    where: conditions.length ? and(...conditions) : undefined,
    orderBy: sortDir === "asc" ? asc(orderCol) : desc(orderCol),
    with: {
      taskTags: { with: { tag: true } },
      subtasks: { orderBy: asc(subtasks.position) },
    },
  });

  return rows.map((r) => ({
    ...r,
    tags: r.taskTags.map((tt) => tt.tag),
  }));
}

export async function getTaskById(
  id: number
): Promise<TaskWithRelations | null> {
  const row = await db.query.tasks.findFirst({
    where: eq(tasks.id, id),
    with: {
      taskTags: { with: { tag: true } },
      subtasks: { orderBy: asc(subtasks.position) },
    },
  });

  if (!row) return null;
  return { ...row, tags: row.taskTags.map((tt) => tt.tag) };
}

export async function createTask(
  data: Omit<typeof tasks.$inferInsert, "id" | "createdAt" | "updatedAt">
): Promise<Task> {
  const [maxPos] = await db
    .select({ max: sql<number>`max(${tasks.position})` })
    .from(tasks);

  const [task] = await db
    .insert(tasks)
    .values({ ...data, position: (maxPos.max ?? -1) + 1 })
    .returning();

  return task;
}

export async function updateTask(
  id: number,
  data: Partial<typeof tasks.$inferInsert>
): Promise<Task> {
  const [task] = await db
    .update(tasks)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(tasks.id, id))
    .returning();

  return task;
}

export async function deleteTask(id: number): Promise<void> {
  await db.delete(tasks).where(eq(tasks.id, id));
}

export async function duplicateTask(id: number): Promise<Task> {
  const source = await getTaskById(id);
  if (!source) throw new Error("Task not found");

  const { id: _id, createdAt: _c, updatedAt: _u, subtasks: subs, tags: tgs, taskTags: _tt, ...rest } = source as TaskWithRelations & { taskTags: unknown[] };

  const newTask = await createTask({ ...rest, title: `${rest.title} (cópia)` });

  if (subs.length) {
    await db.insert(subtasks).values(
      subs.map((s) => ({ taskId: newTask.id, title: s.title, position: s.position }))
    );
  }

  if (tgs.length) {
    await db.insert(taskTags).values(
      tgs.map((t) => ({ taskId: newTask.id, tagId: t.id }))
    );
  }

  return newTask;
}

export async function reorderTasks(orderedIds: number[]): Promise<void> {
  await db.transaction(async (tx) => {
    for (let i = 0; i < orderedIds.length; i++) {
      await tx
        .update(tasks)
        .set({ position: i })
        .where(eq(tasks.id, orderedIds[i]));
    }
  });
}
