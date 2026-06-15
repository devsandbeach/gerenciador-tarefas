import { integer, sqliteTable, text, primaryKey } from "drizzle-orm/sqlite-core";
import { relations } from "drizzle-orm";

// ── Enums ──────────────────────────────────────────────────────────────────

export const TASK_STATUS = [
  "todo",
  "in_progress",
  "in_review",
  "done",
  "cancelled",
] as const;

export const TASK_PRIORITY = ["low", "medium", "high", "urgent"] as const;

export type TaskStatus = (typeof TASK_STATUS)[number];
export type TaskPriority = (typeof TASK_PRIORITY)[number];

// ── Tasks ──────────────────────────────────────────────────────────────────

export const tasks = sqliteTable("tasks", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  title: text("title").notNull(),
  description: text("description"),
  status: text("status", { enum: TASK_STATUS }).notNull().default("todo"),
  priority: text("priority", { enum: TASK_PRIORITY }).notNull().default("medium"),
  dueDate: integer("due_date", { mode: "timestamp" }),
  position: integer("position").notNull().default(0),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

// ── Tags ───────────────────────────────────────────────────────────────────

export const tags = sqliteTable("tags", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  color: text("color").notNull(),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

// ── Task ↔ Tag (N:N) ───────────────────────────────────────────────────────

export const taskTags = sqliteTable(
  "task_tags",
  {
    taskId: integer("task_id")
      .notNull()
      .references(() => tasks.id, { onDelete: "cascade" }),
    tagId: integer("tag_id")
      .notNull()
      .references(() => tags.id, { onDelete: "cascade" }),
  },
  (t) => [primaryKey({ columns: [t.taskId, t.tagId] })]
);

// ── Subtasks ───────────────────────────────────────────────────────────────

export const subtasks = sqliteTable("subtasks", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  taskId: integer("task_id")
    .notNull()
    .references(() => tasks.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  completedAt: integer("completed_at", { mode: "timestamp" }),
  position: integer("position").notNull().default(0),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

// ── Relations ──────────────────────────────────────────────────────────────

export const tasksRelations = relations(tasks, ({ many }) => ({
  taskTags: many(taskTags),
  subtasks: many(subtasks),
}));

export const tagsRelations = relations(tags, ({ many }) => ({
  taskTags: many(taskTags),
}));

export const taskTagsRelations = relations(taskTags, ({ one }) => ({
  task: one(tasks, { fields: [taskTags.taskId], references: [tasks.id] }),
  tag: one(tags, { fields: [taskTags.tagId], references: [tags.id] }),
}));

export const subtasksRelations = relations(subtasks, ({ one }) => ({
  task: one(tasks, { fields: [subtasks.taskId], references: [tasks.id] }),
}));

// ── Tipos inferidos ────────────────────────────────────────────────────────

export type Task = typeof tasks.$inferSelect;
export type NewTask = typeof tasks.$inferInsert;
export type Tag = typeof tags.$inferSelect;
export type NewTag = typeof tags.$inferInsert;
export type Subtask = typeof subtasks.$inferSelect;
export type NewSubtask = typeof subtasks.$inferInsert;
export type TaskTag = typeof taskTags.$inferSelect;

export type TaskWithRelations = Task & {
  subtasks: Subtask[];
  tags: Tag[];
};
