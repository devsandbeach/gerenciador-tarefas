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
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex h-7 items-center rounded-full border px-3 text-xs font-medium transition-colors",
        active
          ? "border-primary bg-primary text-primary-foreground"
          : "border-border bg-background text-muted-foreground hover:border-foreground/30 hover:text-foreground"
      )}
    >
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

  // Debounce da busca → atualiza URL após 300ms
  useEffect(() => {
    const timer = setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString());
      if (searchValue) {
        params.set("search", searchValue);
      } else {
        params.delete("search");
      }
      // Só navega se a URL vai realmente mudar — evita loop infinito
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
    <div className="space-y-3">
      {/* Busca */}
      <div className="relative">
        <SearchIcon className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
        <Input
          placeholder="Buscar tarefas..."
          value={searchValue}
          onChange={(e) => setSearchValue((e.target as HTMLInputElement).value)}
          className="pl-8"
        />
      </div>

      {/* Linha de filtros */}
      <div className="flex flex-wrap items-center gap-1.5">
        {/* Status */}
        {TASK_STATUS.map((s) => (
          <FilterChip
            key={s}
            label={STATUS_LABELS[s]}
            active={currentStatus.includes(s)}
            onClick={() => toggleMulti("status", s)}
          />
        ))}

        <div className="h-5 w-px bg-border mx-0.5" />

        {/* Prioridade */}
        {TASK_PRIORITY.map((p) => (
          <FilterChip
            key={p}
            label={PRIORITY_LABELS[p]}
            active={currentPriority.includes(p)}
            onClick={() => toggleMulti("priority", p)}
          />
        ))}

        <div className="h-5 w-px bg-border mx-0.5" />

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
            className="ml-1 h-7 gap-1 px-2 text-xs text-muted-foreground"
          >
            <XIcon className="size-3" />
            Limpar
          </Button>
        )}
      </div>
    </div>
  );
}

// Suspense necessário por useSearchParams no App Router
export function TaskFilters() {
  return (
    <Suspense fallback={<div className="h-[72px]" />}>
      <FilterBarInner />
    </Suspense>
  );
}
