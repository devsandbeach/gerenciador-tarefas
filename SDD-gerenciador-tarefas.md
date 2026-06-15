# SDD — Gerenciador de Tarefas

**Schema-Driven Development** | Next.js 15 · SQLite · Drizzle ORM · Tailwind v4 · shadcn/ui

> Fluxo obrigatório: **Schema → DAL → Server Actions → Server Components → Client Components**  
> Nada é escrito antes do schema existir.

---

## Fase 1 — Schema (sempre primeiro)

### Estrutura de arquivos

```
src/
  db/
    schema.ts        ← todas as definições de tabelas Drizzle
    index.ts         ← singleton db
    migrations/      ← gerado pelo drizzle-kit
  drizzle.config.ts  ← na raiz do projeto
```

### `src/db/schema.ts`

```ts
import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core'
import { relations } from 'drizzle-orm'

// ── Enums ──────────────────────────────────────────────────────────────────

export const TASK_STATUS = ['todo', 'in_progress', 'in_review', 'done', 'cancelled'] as const
export const TASK_PRIORITY = ['low', 'medium', 'high', 'urgent'] as const

export type TaskStatus = (typeof TASK_STATUS)[number]
export type TaskPriority = (typeof TASK_PRIORITY)[number]

// ── Tasks ──────────────────────────────────────────────────────────────────

export const tasks = sqliteTable('tasks', {
  id:          integer('id').primaryKey({ autoIncrement: true }),
  title:       text('title').notNull(),
  description: text('description'),                                   // markdown, nullable
  status:      text('status', { enum: TASK_STATUS }).notNull().default('todo'),
  priority:    text('priority', { enum: TASK_PRIORITY }).notNull().default('medium'),
  dueDate:     integer('due_date', { mode: 'timestamp' }),            // nullable
  position:    integer('position').notNull().default(0),              // ordenação manual
  createdAt:   integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
  updatedAt:   integer('updated_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
})

// ── Tags ───────────────────────────────────────────────────────────────────

export const tags = sqliteTable('tags', {
  id:        integer('id').primaryKey({ autoIncrement: true }),
  name:      text('name').notNull(),
  color:     text('color').notNull(),                                 // hex: '#6366f1'
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
})

// ── Task ↔ Tag (N:N) ───────────────────────────────────────────────────────

export const taskTags = sqliteTable('task_tags', {
  taskId: integer('task_id').notNull().references(() => tasks.id, { onDelete: 'cascade' }),
  tagId:  integer('tag_id').notNull().references(() => tags.id,  { onDelete: 'cascade' }),
})

// ── Subtasks ───────────────────────────────────────────────────────────────

export const subtasks = sqliteTable('subtasks', {
  id:          integer('id').primaryKey({ autoIncrement: true }),
  taskId:      integer('task_id').notNull().references(() => tasks.id, { onDelete: 'cascade' }),
  title:       text('title').notNull(),
  completedAt: integer('completed_at', { mode: 'timestamp' }),        // null = pendente
  position:    integer('position').notNull().default(0),
  createdAt:   integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
})

// ── Relations (para queries com joins tipados) ─────────────────────────────

export const tasksRelations = relations(tasks, ({ many }) => ({
  taskTags: many(taskTags),
  subtasks: many(subtasks),
}))

export const tagsRelations = relations(tags, ({ many }) => ({
  taskTags: many(taskTags),
}))

export const taskTagsRelations = relations(taskTags, ({ one }) => ({
  task: one(tasks, { fields: [taskTags.taskId], references: [tasks.id] }),
  tag:  one(tags,  { fields: [taskTags.tagId],  references: [tags.id]  }),
}))

export const subtasksRelations = relations(subtasks, ({ one }) => ({
  task: one(tasks, { fields: [subtasks.taskId], references: [tasks.id] }),
}))

// ── Tipos inferidos (nunca escrever à mão) ─────────────────────────────────

export type Task        = typeof tasks.$inferSelect
export type NewTask     = typeof tasks.$inferInsert
export type Tag         = typeof tags.$inferSelect
export type NewTag      = typeof tags.$inferInsert
export type Subtask     = typeof subtasks.$inferSelect
export type NewSubtask  = typeof subtasks.$inferInsert
export type TaskTag     = typeof taskTags.$inferSelect

// Tipo composto para tarefa com relações carregadas
export type TaskWithRelations = Task & {
  subtasks: Subtask[]
  tags: Tag[]
}
```

### `src/db/index.ts`

```ts
import { drizzle } from 'drizzle-orm/better-sqlite3'
import Database from 'better-sqlite3'
import * as schema from './schema'

const sqlite = new Database('sqlite.db')
export const db = drizzle(sqlite, { schema })
```

### `drizzle.config.ts` (raiz)

```ts
import { defineConfig } from 'drizzle-kit'

export default defineConfig({
  schema: './src/db/schema.ts',
  out:    './src/db/migrations',
  dialect: 'sqlite',
  dbCredentials: { url: 'sqlite.db' },
})
```

### Comandos de migração

```bash
npx drizzle-kit generate   # gera SQL a partir do schema
npx drizzle-kit migrate    # aplica no banco
npx drizzle-kit studio     # browser visual do banco
```

---

## Fase 2 — Data Access Layer (DAL)

Queries vivem em `src/db/queries/`. Usam apenas tipos inferidos do schema.

### `src/db/queries/tasks.ts`

```ts
import { db } from '@/db'
import { tasks, taskTags, subtasks, tags, type Task, type TaskWithRelations } from '@/db/schema'
import { eq, desc, asc, and, like, lte, gte, inArray, sql } from 'drizzle-orm'

export type TaskFilters = {
  status?:   Task['status'][]
  priority?: Task['priority'][]
  tagIds?:   number[]
  search?:   string
  due?:      'today' | 'this_week' | 'overdue'
  sortBy?:   'createdAt' | 'dueDate' | 'priority' | 'position'
  sortDir?:  'asc' | 'desc'
}

export async function getTasks(filters: TaskFilters = {}): Promise<TaskWithRelations[]> {
  const { status, priority, search, due, sortBy = 'position', sortDir = 'asc' } = filters

  const conditions = []

  if (status?.length)   conditions.push(inArray(tasks.status, status))
  if (priority?.length) conditions.push(inArray(tasks.priority, priority))
  if (search)           conditions.push(like(tasks.title, `%${search}%`))

  if (due === 'today') {
    const start = new Date(); start.setHours(0, 0, 0, 0)
    const end   = new Date(); end.setHours(23, 59, 59, 999)
    conditions.push(gte(tasks.dueDate, start), lte(tasks.dueDate, end))
  }
  if (due === 'overdue') {
    conditions.push(lte(tasks.dueDate, new Date()))
    conditions.push(inArray(tasks.status, ['todo', 'in_progress', 'in_review']))
  }

  const orderCol = {
    createdAt: tasks.createdAt,
    dueDate:   tasks.dueDate,
    position:  tasks.position,
    priority:  tasks.priority,
  }[sortBy]

  const rows = await db.query.tasks.findMany({
    where: conditions.length ? and(...conditions) : undefined,
    orderBy: sortDir === 'asc' ? asc(orderCol) : desc(orderCol),
    with: {
      taskTags: { with: { tag: true } },
      subtasks: { orderBy: asc(subtasks.position) },
    },
  })

  return rows.map(r => ({
    ...r,
    tags: r.taskTags.map(tt => tt.tag),
  }))
}

export async function getTaskById(id: number): Promise<TaskWithRelations | null> {
  const row = await db.query.tasks.findFirst({
    where: eq(tasks.id, id),
    with: {
      taskTags: { with: { tag: true } },
      subtasks: { orderBy: asc(subtasks.position) },
    },
  })
  if (!row) return null
  return { ...row, tags: row.taskTags.map(tt => tt.tag) }
}

export async function createTask(data: Omit<typeof tasks.$inferInsert, 'id' | 'createdAt' | 'updatedAt'>) {
  const [maxPos] = await db.select({ max: sql<number>`max(${tasks.position})` }).from(tasks)
  const [task] = await db.insert(tasks)
    .values({ ...data, position: (maxPos.max ?? -1) + 1 })
    .returning()
  return task
}

export async function updateTask(id: number, data: Partial<typeof tasks.$inferInsert>) {
  const [task] = await db.update(tasks)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(tasks.id, id))
    .returning()
  return task
}

export async function deleteTask(id: number) {
  await db.delete(tasks).where(eq(tasks.id, id))
}

export async function duplicateTask(id: number): Promise<Task> {
  const source = await getTaskById(id)
  if (!source) throw new Error('Task not found')
  const { id: _id, createdAt: _c, updatedAt: _u, subtasks: subs, tags: tgs, ...rest } = source
  const newTask = await createTask({ ...rest, title: `${rest.title} (cópia)` })
  // duplicar subtarefas
  for (const sub of subs) {
    await db.insert(subtasks).values({ taskId: newTask.id, title: sub.title, position: sub.position })
  }
  // duplicar tags
  for (const tag of tgs) {
    await db.insert(taskTags).values({ taskId: newTask.id, tagId: tag.id })
  }
  return newTask
}

export async function reorderTasks(orderedIds: number[]) {
  await db.transaction(async (tx) => {
    for (let i = 0; i < orderedIds.length; i++) {
      await tx.update(tasks).set({ position: i }).where(eq(tasks.id, orderedIds[i]))
    }
  })
}
```

### `src/db/queries/tags.ts`

```ts
import { db } from '@/db'
import { tags, taskTags, type Tag } from '@/db/schema'
import { eq } from 'drizzle-orm'

export async function getTags(): Promise<Tag[]> {
  return db.select().from(tags)
}

export async function createTag(data: Pick<Tag, 'name' | 'color'>) {
  const [tag] = await db.insert(tags).values(data).returning()
  return tag
}

export async function updateTag(id: number, data: Partial<Pick<Tag, 'name' | 'color'>>) {
  const [tag] = await db.update(tags).set(data).where(eq(tags.id, id)).returning()
  return tag
}

export async function deleteTag(id: number) {
  await db.delete(tags).where(eq(tags.id, id))
}

export async function addTagToTask(taskId: number, tagId: number) {
  await db.insert(taskTags).values({ taskId, tagId }).onConflictDoNothing()
}

export async function removeTagFromTask(taskId: number, tagId: number) {
  await db.delete(taskTags)
    .where(and(eq(taskTags.taskId, taskId), eq(taskTags.tagId, tagId)))
}
```

### `src/db/queries/subtasks.ts`

```ts
import { db } from '@/db'
import { subtasks, type Subtask } from '@/db/schema'
import { eq, asc, sql } from 'drizzle-orm'

export async function createSubtask(taskId: number, title: string): Promise<Subtask> {
  const [max] = await db.select({ m: sql<number>`max(${subtasks.position})` })
    .from(subtasks).where(eq(subtasks.taskId, taskId))
  const [sub] = await db.insert(subtasks)
    .values({ taskId, title, position: (max.m ?? -1) + 1 })
    .returning()
  return sub
}

export async function toggleSubtask(id: number, completed: boolean): Promise<Subtask> {
  const [sub] = await db.update(subtasks)
    .set({ completedAt: completed ? new Date() : null })
    .where(eq(subtasks.id, id))
    .returning()
  return sub
}

export async function updateSubtask(id: number, title: string): Promise<Subtask> {
  const [sub] = await db.update(subtasks).set({ title }).where(eq(subtasks.id, id)).returning()
  return sub
}

export async function deleteSubtask(id: number) {
  await db.delete(subtasks).where(eq(subtasks.id, id))
}
```

---

## Fase 3 — Server Actions

Uma Action por responsabilidade. Zod valida o input. `revalidatePath('/')` após toda mutação.

### `src/app/actions/tasks.ts`

```ts
'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { createTask, updateTask, deleteTask, duplicateTask, reorderTasks } from '@/db/queries/tasks'
import { TASK_STATUS, TASK_PRIORITY } from '@/db/schema'

const CreateTaskSchema = z.object({
  title:       z.string().min(1, 'Título obrigatório').max(255),
  description: z.string().optional(),
  status:      z.enum(TASK_STATUS).default('todo'),
  priority:    z.enum(TASK_PRIORITY).default('medium'),
  dueDate:     z.coerce.date().optional(),
})

const UpdateTaskSchema = CreateTaskSchema.partial()

export async function createTaskAction(input: z.infer<typeof CreateTaskSchema>) {
  const data = CreateTaskSchema.parse(input)
  const task = await createTask(data)
  revalidatePath('/')
  return task
}

export async function updateTaskAction(id: number, input: z.infer<typeof UpdateTaskSchema>) {
  const data = UpdateTaskSchema.parse(input)
  const task = await updateTask(id, data)
  revalidatePath('/')
  return task
}

export async function updateTaskStatusAction(id: number, status: (typeof TASK_STATUS)[number]) {
  await updateTask(id, { status })
  revalidatePath('/')
}

export async function deleteTaskAction(id: number) {
  await deleteTask(id)
  revalidatePath('/')
}

export async function duplicateTaskAction(id: number) {
  const task = await duplicateTask(id)
  revalidatePath('/')
  return task
}

export async function reorderTasksAction(orderedIds: number[]) {
  await reorderTasks(orderedIds)
  revalidatePath('/')
}
```

### `src/app/actions/tags.ts`

```ts
'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { createTag, updateTag, deleteTag, addTagToTask, removeTagFromTask } from '@/db/queries/tags'

const TagSchema = z.object({
  name:  z.string().min(1).max(50),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/),
})

export async function createTagAction(input: z.infer<typeof TagSchema>) {
  const tag = await createTag(TagSchema.parse(input))
  revalidatePath('/')
  return tag
}

export async function updateTagAction(id: number, input: Partial<z.infer<typeof TagSchema>>) {
  const tag = await updateTag(id, TagSchema.partial().parse(input))
  revalidatePath('/')
  return tag
}

export async function deleteTagAction(id: number) {
  await deleteTag(id)
  revalidatePath('/')
}

export async function addTagToTaskAction(taskId: number, tagId: number) {
  await addTagToTask(taskId, tagId)
  revalidatePath('/')
}

export async function removeTagFromTaskAction(taskId: number, tagId: number) {
  await removeTagFromTask(taskId, tagId)
  revalidatePath('/')
}
```

### `src/app/actions/subtasks.ts`

```ts
'use server'

import { revalidatePath } from 'next/cache'
import { createSubtask, toggleSubtask, updateSubtask, deleteSubtask } from '@/db/queries/subtasks'

export async function createSubtaskAction(taskId: number, title: string) {
  const sub = await createSubtask(taskId, title)
  revalidatePath('/')
  return sub
}

export async function toggleSubtaskAction(id: number, completed: boolean) {
  await toggleSubtask(id, completed)
  revalidatePath('/')
}

export async function updateSubtaskAction(id: number, title: string) {
  await updateSubtask(id, title)
  revalidatePath('/')
}

export async function deleteSubtaskAction(id: number) {
  await deleteSubtask(id)
  revalidatePath('/')
}
```

---

## Fase 4 — App Router (estrutura de arquivos)

```
src/
  app/
    layout.tsx          ← ThemeProvider, Toaster, fonte
    page.tsx            ← redirect('/tasks')
    tasks/
      page.tsx          ← Server Component: lê searchParams, busca dados, renderiza TasksView
      loading.tsx       ← skeleton de carregamento
    actions/
      tasks.ts
      tags.ts
      subtasks.ts
  components/
    ui/                 ← shadcn/ui gerados (nunca editar)
    tasks/
      tasks-view.tsx       ← 'use client' — alterna lista/kanban, gerencia sheet aberta
      task-list.tsx        ← lista de TaskCard
      task-card.tsx        ← card compacto com ações inline
      task-sheet.tsx       ← Sheet lateral de edição completa
      task-form.tsx        ← formulário dentro do sheet
      task-filters.tsx     ← barra de filtros + busca
      kanban-board.tsx     ← colunas @dnd-kit
      kanban-column.tsx    ← coluna individual
    subtasks/
      subtask-list.tsx
      subtask-item.tsx
    tags/
      tag-badge.tsx
      tag-picker.tsx       ← popover para selecionar/criar tags
    shared/
      priority-badge.tsx
      due-date-badge.tsx
  db/
    schema.ts
    index.ts
    queries/
      tasks.ts
      tags.ts
      subtasks.ts
  lib/
    utils.ts             ← cn() do shadcn
```

### `src/app/tasks/page.tsx` (Server Component)

```tsx
import { getTasks, type TaskFilters } from '@/db/queries/tasks'
import { getTags } from '@/db/queries/tags'
import { TasksView } from '@/components/tasks/tasks-view'

type SearchParams = {
  status?:   string
  priority?: string
  tags?:     string
  search?:   string
  due?:      string
  sort?:     string
  view?:     string
}

export default async function TasksPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const params = await searchParams

  const filters: TaskFilters = {
    status:   params.status   ? (params.status.split(',') as TaskFilters['status'])   : undefined,
    priority: params.priority ? (params.priority.split(',') as TaskFilters['priority']) : undefined,
    tagIds:   params.tags     ? params.tags.split(',').map(Number) : undefined,
    search:   params.search,
    due:      params.due as TaskFilters['due'],
  }

  const [allTasks, allTags] = await Promise.all([getTasks(filters), getTags()])

  return (
    <TasksView
      tasks={allTasks}
      tags={allTags}
      defaultView={(params.view as 'list' | 'kanban') ?? 'list'}
    />
  )
}
```

---

## Fase 5 — Componentes (contratos de props)

Todos os tipos derivam do schema. Nenhuma `interface` manual para dados do banco.

### `TaskCard` props

```ts
import type { TaskWithRelations } from '@/db/schema'

type TaskCardProps = {
  task:       TaskWithRelations
  onOpen:     (task: TaskWithRelations) => void  // abre TaskSheet
  onComplete: (task: TaskWithRelations) => void  // toggle done com 1 clique
}
```

### `TaskSheet` props

```ts
type TaskSheetProps = {
  task:   TaskWithRelations | null   // null = sheet fechada
  tags:   Tag[]                      // todas as tags disponíveis
  onClose: () => void
}
```

### `KanbanBoard` props

```ts
type KanbanBoardProps = {
  tasks:  TaskWithRelations[]
  tags:   Tag[]
  onOpen: (task: TaskWithRelations) => void
}
```

### `TaskFilters` props

```ts
type TaskFiltersProps = {
  tags:       Tag[]
  view:       'list' | 'kanban'
  onViewChange: (v: 'list' | 'kanban') => void
}
// filtros via URL searchParams — não como state local
```

---

## Fase 6 — shadcn/ui: componentes a instalar

```bash
npx shadcn@latest init
npx shadcn@latest add button
npx shadcn@latest add input
npx shadcn@latest add textarea
npx shadcn@latest add dialog
npx shadcn@latest add sheet
npx shadcn@latest add badge
npx shadcn@latest add popover
npx shadcn@latest add calendar
npx shadcn@latest add dropdown-menu
npx shadcn@latest add select
npx shadcn@latest add checkbox
npx shadcn@latest add separator
npx shadcn@latest add tooltip
npx shadcn@latest add label
npx shadcn@latest add sonner   # toasts
npx shadcn@latest add skeleton
npx shadcn@latest add scroll-area
```

---

## Fase 7 — Tailwind v4: tema

```css
/* src/app/globals.css */
@import "tailwindcss";

@theme {
  --font-sans: 'Inter', sans-serif;
  --radius:    0.5rem;

  /* Paleta de prioridade */
  --color-priority-low:    oklch(70% 0.12 150);   /* verde */
  --color-priority-medium: oklch(75% 0.15 80);    /* amarelo */
  --color-priority-high:   oklch(65% 0.18 40);    /* laranja */
  --color-priority-urgent: oklch(55% 0.22 25);    /* vermelho */

  /* Status */
  --color-status-todo:        oklch(60% 0.00 0);
  --color-status-in-progress: oklch(65% 0.16 250);
  --color-status-in-review:   oklch(70% 0.14 290);
  --color-status-done:        oklch(65% 0.15 150);
  --color-status-cancelled:   oklch(55% 0.05 0);
}
```

---

## Fase 8 — Dependências a instalar

```bash
# ORM e banco
npm install drizzle-orm better-sqlite3
npm install -D drizzle-kit @types/better-sqlite3

# Validação
npm install zod

# Drag and drop
npm install @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities

# Formulários
npm install react-hook-form @hookform/resolvers

# Markdown (preview na descrição)
npm install react-markdown

# Tema
npm install next-themes
```

---

## Ordem de implementação

| Passo | O que fazer                                                  |
|-------|--------------------------------------------------------------|
| 1     | Criar schema + rodar migration + conferir no drizzle studio  |
| 2     | Escrever DAL de tasks (sem tags/subtasks ainda)              |
| 3     | Escrever Server Actions de tasks                             |
| 4     | Page Server Component + TaskList + TaskCard básicos          |
| 5     | TaskSheet + TaskForm (criar e editar)                        |
| 6     | Filtros via searchParams + FilterBar                         |
| 7     | Kanban + drag and drop entre colunas                         |
| 8     | DAL + Actions de subtasks → SubtaskList no sheet             |
| 9     | DAL + Actions de tags → TagBadge + TagPicker                 |
| 10    | Polimento visual: animações, toasts, responsividade, tema    |

---

## Regras de ouro (não violar)

- Nunca escrever `type Task = { id: number; title: string }` manualmente — usar `typeof tasks.$inferSelect`
- Nunca buscar dados dentro de Client Components — passar via props de Server Component
- Nunca editar arquivos em `src/components/ui/` — estender com wrappers
- Nunca usar `tailwind.config.js` — configurar via `@theme` no CSS
- Nunca chamar o banco de dados de um Client Component — apenas Server Actions ou Server Components
- Sempre chamar `revalidatePath('/')` após mutações
