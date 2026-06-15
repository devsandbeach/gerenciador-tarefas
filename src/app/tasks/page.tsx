import { getTasks, type TaskFilters } from "@/db/queries/tasks";
import { getTags } from "@/db/queries/tags";
import { TasksView } from "@/components/tasks/tasks-view";

type SearchParams = {
  status?: string;
  priority?: string;
  tags?: string;
  search?: string;
  due?: string;
  view?: string;
};

export default async function TasksPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;

  const filters: TaskFilters = {
    status: params.status
      ? (params.status.split(",") as TaskFilters["status"])
      : undefined,
    priority: params.priority
      ? (params.priority.split(",") as TaskFilters["priority"])
      : undefined,
    tagIds: params.tags
      ? params.tags.split(",").map(Number)
      : undefined,
    search: params.search,
    due: params.due as TaskFilters["due"],
  };

  const [allTasks, allTags] = await Promise.all([
    getTasks(filters),
    getTags(),
  ]);

  return (
    <TasksView
      tasks={allTasks}
      tags={allTags}
      defaultView={(params.view as "list" | "kanban") ?? "list"}
    />
  );
}
