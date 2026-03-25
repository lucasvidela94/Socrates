import { useMemo, useState, type ReactElement } from "react";
import { Link } from "react-router-dom";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import type { StudentRow } from "@shared/types";
import { ROUTES } from "@shared/lib/routes";
import { cn } from "@/lib/utils";

interface StudentRosterTableProps {
  classroomId: string;
  students: StudentRow[];
}

export const StudentRosterTable = ({
  classroomId,
  students,
}: StudentRosterTableProps): ReactElement => {
  const [query, setQuery] = useState("");
  const [sortDesc, setSortDesc] = useState(false);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = q === "" ? students : students.filter((s) => s.name.toLowerCase().includes(q));
    list = [...list].sort((a, b) => {
      const cmp = a.name.localeCompare(b.name, "es", { sensitivity: "base" });
      return sortDesc ? -cmp : cmp;
    });
    return list;
  }, [students, query, sortDesc]);

  if (students.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">No hay alumnos en esta aula.</p>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-[min(100%,16rem)] flex-1">
          <Search
            className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
          <Input
            type="search"
            placeholder="Buscar por nombre…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="h-9 pl-8"
            aria-label="Filtrar alumnos por nombre"
          />
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="shrink-0"
          onClick={() => setSortDesc((v) => !v)}
        >
          {sortDesc ? "Z → A" : "A → Z"}
        </Button>
        <span className="text-xs text-muted-foreground tabular-nums">
          {filtered.length}/{students.length}
        </span>
      </div>

      <div
        className={cn(
          "overflow-hidden rounded-lg border border-border/80 bg-card/40 shadow-[inset_0_1px_0_0_oklch(1_0_0_/_0.06)]",
          "max-h-[min(55vh,420px)] overflow-y-auto overscroll-contain"
        )}
      >
        {filtered.length === 0 ? (
          <p className="px-3 py-10 text-center text-sm text-muted-foreground">
            Ningún alumno coincide con la búsqueda.
          </p>
        ) : (
          <table className="w-full caption-bottom text-sm">
            <thead className="sticky top-0 z-[1] border-b border-border/80 bg-muted/80 backdrop-blur-sm">
              <tr>
                <th
                  scope="col"
                  className="w-10 px-3 py-2.5 text-left text-[10px] font-semibold uppercase tracking-wider text-muted-foreground"
                >
                  #
                </th>
                <th
                  scope="col"
                  className="px-3 py-2.5 text-left text-[10px] font-semibold uppercase tracking-wider text-muted-foreground"
                >
                  Alumno
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {filtered.map((s, i) => (
                <tr
                  key={s.id}
                  className="transition-colors hover:bg-muted/40 focus-within:bg-muted/40"
                >
                  <td className="px-3 py-2 tabular-nums text-muted-foreground">{i + 1}</td>
                  <td className="max-w-[1px] px-3 py-2">
                    <Link
                      to={`${ROUTES.CLASSROOMS}/${classroomId}/students/${s.id}`}
                      className="block truncate font-medium text-foreground underline-offset-4 hover:underline"
                    >
                      {s.name}
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};
