import { useMemo, useState, type ReactElement } from "react";
import { Link } from "react-router-dom";
import { ChevronRight, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import type { StudentRow } from "@shared/types";
import { feedbackStudentPath } from "@shared/lib/routes";
import type { FeedbackDraftSlice } from "./feedback-student-form";
import { getFeedbackWeekStatus, type FeedbackWeekStatus } from "../lib/feedback-week-status";

function StatusBadge({ status }: { status: FeedbackWeekStatus }): ReactElement {
  if (status === "lista") {
    return (
      <Badge
        variant="secondary"
        className="border border-emerald-500/25 bg-emerald-500/10 font-medium text-emerald-800 dark:text-emerald-200"
      >
        Lista
      </Badge>
    );
  }
  if (status === "borrador") {
    return (
      <Badge variant="outline" className="font-medium text-amber-900 dark:text-amber-100">
        Borrador
      </Badge>
    );
  }
  return (
    <Badge variant="ghost" className="font-normal text-muted-foreground">
      Pendiente
    </Badge>
  );
}

interface FeedbackStudentListProps {
  classroomId: string;
  weekStart: string;
  students: StudentRow[];
  draft: Record<string, FeedbackDraftSlice>;
  loading: boolean;
}

export const FeedbackStudentList = ({
  classroomId,
  weekStart,
  students,
  draft,
  loading,
}: FeedbackStudentListProps): ReactElement => {
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"todos" | FeedbackWeekStatus>("todos");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return students.filter((s) => {
      if (q !== "" && !s.name.toLowerCase().includes(q)) return false;
      if (statusFilter === "todos") return true;
      return getFeedbackWeekStatus(draft[s.id]) === statusFilter;
    });
  }, [students, query, statusFilter, draft]);

  const emptyHint = useMemo(() => {
    if (students.length === 0) return "";
    const q = query.trim();
    if (filtered.length > 0) return "";
    if (q !== "") return "Ningún alumno coincide con la búsqueda.";
    if (statusFilter !== "todos")
      return "Ningún alumno en este estado. Probá “Todos” u otro filtro.";
    return "Ningún alumno coincide.";
  }, [students.length, filtered.length, query, statusFilter]);

  const doneCount = useMemo(() => {
    let lista = 0;
    let borrador = 0;
    for (const s of students) {
      const st = getFeedbackWeekStatus(draft[s.id]);
      if (st === "lista") lista++;
      else if (st === "borrador") borrador++;
    }
    return { lista, borrador, pendiente: students.length - lista - borrador };
  }, [students, draft]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
          <span className="rounded-md bg-muted/80 px-2 py-1 tabular-nums">
            Total: {students.length}
          </span>
          <span className="rounded-md bg-muted/80 px-2 py-1 tabular-nums">
            Lista: {doneCount.lista}
          </span>
          <span className="rounded-md bg-muted/80 px-2 py-1 tabular-nums">
            Borrador: {doneCount.borrador}
          </span>
          <span className="rounded-md bg-muted/80 px-2 py-1 tabular-nums">
            Pendiente: {doneCount.pendiente}
          </span>
          <span className="rounded-md bg-muted/80 px-2 py-1 tabular-nums">
            Avance: {students.length === 0 ? 0 : Math.round((doneCount.lista / students.length) * 100)}%
          </span>
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
        <div className="space-y-1 w-full min-w-[min(100%,12rem)] sm:max-w-[220px]">
          <Label htmlFor="fb-status-filter" className="text-xs text-muted-foreground">
            Filtrar por estado
          </Label>
          <Select
            value={statusFilter}
            onValueChange={(v) =>
              setStatusFilter(v as "todos" | FeedbackWeekStatus)
            }
          >
            <SelectTrigger id="fb-status-filter" className="h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos</SelectItem>
              <SelectItem value="pendiente">Pendiente</SelectItem>
              <SelectItem value="borrador">Borrador</SelectItem>
              <SelectItem value="lista">Lista</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="min-w-[min(100%,20rem)] flex-1 space-y-1">
          <Label htmlFor="fb-name-search" className="text-xs text-muted-foreground">
            Buscar
          </Label>
          <div className="relative">
            <Search
              className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden
            />
            <Input
              id="fb-name-search"
              type="search"
              placeholder="Nombre…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="h-9 pl-8"
            />
          </div>
        </div>
      </div>

      <div
        className={cn(
          "overflow-hidden rounded-xl border border-border/80 bg-card/30",
          "max-h-[min(62vh,560px)] overflow-y-auto overscroll-contain"
        )}
      >
        {loading ? (
          <p className="px-4 py-12 text-center text-sm text-muted-foreground">Cargando…</p>
        ) : filtered.length === 0 ? (
          <p className="px-4 py-12 text-center text-sm text-muted-foreground">
            {emptyHint || "Sin resultados."}
          </p>
        ) : (
          <table className="w-full text-sm">
            <thead className="sticky top-0 z-[1] border-b border-border/80 bg-muted/90 backdrop-blur-sm">
              <tr>
                <th
                  scope="col"
                  className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-wider text-muted-foreground"
                >
                  Alumno
                </th>
                <th
                  scope="col"
                  className="w-[1%] whitespace-nowrap px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-wider text-muted-foreground"
                >
                  Estado
                </th>
                <th scope="col" className="w-[1%] px-3 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {filtered.map((s) => {
                const status = getFeedbackWeekStatus(draft[s.id]);
                const to = feedbackStudentPath(classroomId, s.id, weekStart);
                return (
                  <tr key={s.id} className="transition-colors hover:bg-muted/35">
                    <td className="max-w-[1px] px-4 py-3">
                      <span className="block truncate font-medium">{s.name}</span>
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={status} />
                    </td>
                    <td className="px-2 py-3 text-right">
                      <Button variant="ghost" size="sm" className="gap-1 font-medium" asChild>
                        <Link to={to}>
                          Editar
                          <ChevronRight className="size-4 opacity-60" />
                        </Link>
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};
