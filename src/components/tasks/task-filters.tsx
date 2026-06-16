"use client";

import { useCallback, useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { SearchIcon, XIcon } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { TASK_STATUS, TASK_PRIORITY } from "@/db/schema";
import { cn } from "@/lib/utils";

const STATUS_LABELS: Record<(typeof TASK_STATUS)[number], string> = {
  todo: "A Fazer",
  in_progress: "Em Progresso",
  in_review: "Em Revisão",
  done: "Concluído",
  cancelled: "Cancelado",
};

const STATUS_DOTS: Record<(typeof TASK_STATUS)[number], string> = {
  todo: "bg-slate-400",
  in_progress: "bg-amber-400",
  in_review: "bg-violet-400",
  done: "bg-emerald-500",
  cancelled: "bg-rose-400",
};

const PRIORITY_LABELS: Record<(typeof TASK_PRIORITY)[number], string> = {
  low: "Baixa",
  medium: "Média",
  high: "Alta",
  urgent: "Urgente",
};

const DUE_OPTIONS = [
  { value: "today", label: "Hoje" },
  { value: "this_week", label: "Esta semana" },
  { value: "overdue", label: "Atrasadas" },
] as const;

function FilterChip({
  label,
  active,
  dot,
  onClick,
}: {
  label: string;
  active: boolean;
  dot?: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex h-7 items-center gap-1.5 rounded-md border px-2.5 text-[11px] font-medium transition-all",
        active
          ? "border-primary/30 bg-primary/10 text-primary"
          : "border-border bg-background text-muted-foreground hover:border-border/80 hover:bg-accent hover:text-foreground"
      )}
    >
      {dot && (
        <span className={cn("size-1.5 rounded-full", dot)} />
      )}
      {label}
    </button>
  );
}

function FilterBarInner() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const currentStatus =
    searchParams.get("status")?.split(",").filter(Boolean) ?? [];
  const currentPriority =
    searchParams.get("priority")?.split(",").filter(Boolean) ?? [];
  const currentDue = searchParams.get("due") ?? "";
  const currentSearch = searchParams.get("search") ?? "";

  const [searchValue, setSearchValue] = useState(currentSearch);

  useEffect(() => {
    const timer = setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString());
      if (searchValue) {
        params.set("search", searchValue);
      } else {
        params.delete("search");
      }
      if (params.toString() !== searchParams.toString()) {
        router.replace(`${pathname}?${params.toString()}`);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchValue, pathname, router, searchParams]);

  const toggleMulti = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      const current = params.get(key)?.split(",").filter(Boolean) ?? [];
      const next = current.includes(value)
        ? current.filter((v) => v !== value)
        : [...current, value];
      if (next.length === 0) {
        params.delete(key);
      } else {
        params.set(key, next.join(","));
      }
      router.replace(`${pathname}?${params.toString()}`);
    },
    [pathname, router, searchParams]
  );

  const toggleSingle = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (params.get(key) === value) {
        params.delete(key);
      } else {
        params.set(key, value);
      }
      router.replace(`${pathname}?${params.toString()}`);
    },
    [pathname, router, searchParams]
  );

  const clearAll = useCallback(() => {
    setSearchValue("");
    router.replace(pathname);
  }, [pathname, router]);

  const hasFilters =
    currentStatus.length > 0 ||
    currentPriority.length > 0 ||
    !!currentDue ||
    !!currentSearch;

  return (
    <div className="flex flex-wrap items-center gap-2">
      {/* Busca */}
      <div className="relative">
        <SearchIcon className="absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground pointer-events-none" />
        <Input
          placeholder="Buscar tarefas..."
          value={searchValue}
          onChange={(e) => setSearchValue((e.target as HTMLInputElement).value)}
          className="h-7 pl-8 text-[11px] w-44"
        />
      </div>

      {/* Divisor */}
      <div className="h-5 w-px bg-border" />

      {/* Status */}
      {TASK_STATUS.map((s) => (
        <FilterChip
          key={s}
          label={STATUS_LABELS[s]}
          active={currentStatus.includes(s)}
          dot={STATUS_DOTS[s]}
          onClick={() => toggleMulti("status", s)}
        />
      ))}

      {/* Divisor */}
      <div className="h-5 w-px bg-border" />

      {/* Prioridade */}
      {TASK_PRIORITY.map((p) => (
        <FilterChip
          key={p}
          label={PRIORITY_LABELS[p]}
          active={currentPriority.includes(p)}
          onClick={() => toggleMulti("priority", p)}
        />
      ))}

      {/* Divisor */}
      <div className="h-5 w-px bg-border" />

      {/* Prazo */}
      {DUE_OPTIONS.map(({ value, label }) => (
        <FilterChip
          key={value}
          label={label}
          active={currentDue === value}
          onClick={() => toggleSingle("due", value)}
        />
      ))}

      {/* Limpar filtros */}
      {hasFilters && (
        <Button
          variant="ghost"
          size="sm"
          onClick={clearAll}
          className="h-7 gap-1 px-2 text-[11px] text-muted-foreground hover:text-foreground"
        >
          <XIcon className="size-3" />
          Limpar
        </Button>
      )}
    </div>
  );
}

export function TaskFilters() {
  return (
    <Suspense fallback={<div className="h-7" />}>
      <FilterBarInner />
    </Suspense>
  );
}
