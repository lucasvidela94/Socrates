import { useCallback, useEffect, useState } from "react";
import type { ReactElement } from "react";
import { Link } from "react-router-dom";
import { Breadcrumb } from "@/shared/components/breadcrumb";
import { PageContainer } from "@/shared/components/page-container";
import { PageHeader } from "@/shared/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  BREADCRUMB_MAP,
  ROUTES,
  classroomFeedbackPath,
  classroomProgramAnnualPath,
} from "@shared/lib/routes";
import { useClassroomStore } from "@/stores/classroom-store";
import type { ClassroomInput } from "@shared/types";
import { Plus } from "lucide-react";
import { getMondayIso } from "@/features/feedback/lib/week-default";

export const ClassroomsPage = (): ReactElement => {
  const classrooms = useClassroomStore((s) => s.classrooms);
  const fetchClassrooms = useClassroomStore((s) => s.fetchClassrooms);
  const [weekStart] = useState(() => getMondayIso());
  const [statsByClassroom, setStatsByClassroom] = useState<
    Record<
      string,
      { total: number; lista: number; borrador: number; pendiente: number; progress: number }
    >
  >({});
  const [statsLoading, setStatsLoading] = useState(false);

  useEffect(() => {
    void fetchClassrooms();
  }, [fetchClassrooms]);

  useEffect(() => {
    let cancelled = false;
    const loadStats = async () => {
      if (classrooms.length === 0) {
        setStatsByClassroom({});
        return;
      }
      setStatsLoading(true);
      try {
        const entries = await Promise.all(
          classrooms.map(async (c) => {
            const [students, feedback] = await Promise.all([
              window.electronAPI.studentsListByClassroom(c.id),
              window.electronAPI.feedbackListByWeek(c.id, weekStart),
            ]);
            const total = students.length;
            const studentIds = new Set(students.map((s) => s.id));
            let lista = 0;
            let borrador = 0;
            for (const row of feedback) {
              if (!studentIds.has(row.studentId)) continue;
              if (row.teacherApproved === true) {
                lista++;
                continue;
              }
              const hasIndicators =
                row.indicators !== null && Object.values(row.indicators).some((v) => String(v ?? "").trim() !== "");
              const hasText = (row.observations ?? "").trim() !== "" || (row.aiSummary ?? "").trim() !== "";
              if (hasIndicators || hasText) borrador++;
            }
            const pending = Math.max(total - lista - borrador, 0);
            const progress = total === 0 ? 0 : Math.round((lista / total) * 100);
            return [c.id, { total, lista, borrador, pendiente: pending, progress }] as const;
          })
        );
        if (cancelled) return;
        setStatsByClassroom(Object.fromEntries(entries));
      } finally {
        if (!cancelled) setStatsLoading(false);
      }
    };
    void loadStats();
    return () => {
      cancelled = true;
    };
  }, [classrooms, weekStart]);

  const [name, setName] = useState("");
  const [grade, setGrade] = useState("");
  const [shift, setShift] = useState("");
  const [saving, setSaving] = useState(false);

  const handleCreate = useCallback(async () => {
    if (name.trim() === "" || grade.trim() === "" || shift.trim() === "") return;
    setSaving(true);
    try {
      const input: ClassroomInput = {
        name: name.trim(),
        grade: grade.trim(),
        shift: shift.trim(),
      };
      await window.electronAPI.classroomCreate(input);
      setName("");
      setGrade("");
      setShift("");
      await fetchClassrooms();
    } finally {
      setSaving(false);
    }
  }, [name, grade, shift, fetchClassrooms]);

  return (
    <PageContainer>
      <Breadcrumb items={BREADCRUMB_MAP[ROUTES.CLASSROOMS]} />
      <PageHeader title="Mis aulas" description="Aulas y seguimiento por curso." />

      <Card className="max-w-xl mb-8">
        <CardHeader>
          <CardTitle className="text-base">Nueva aula</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid gap-2 sm:grid-cols-3">
            <div className="space-y-1">
              <Label htmlFor="cname">Nombre</Label>
              <Input
                id="cname"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ej. 3º B"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="cgrade">Grado</Label>
              <Input
                id="cgrade"
                value={grade}
                onChange={(e) => setGrade(e.target.value)}
                placeholder="Ej. 3º"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="cshift">Turno</Label>
              <Input
                id="cshift"
                value={shift}
                onChange={(e) => setShift(e.target.value)}
                placeholder="Mañana / Tarde"
              />
            </div>
          </div>
          <Button onClick={() => void handleCreate()} disabled={saving}>
            <Plus className="h-4 w-4" />
            Agregar aula
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Aulas activas</CardTitle>
          <p className="text-xs text-muted-foreground">Semana: {weekStart}</p>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto rounded-lg border">
            <table className="w-full min-w-[780px] text-sm">
              <thead className="bg-muted/60">
                <tr>
                  <th className="px-4 py-2 text-left font-medium text-muted-foreground">Aula</th>
                  <th className="px-4 py-2 text-left font-medium text-muted-foreground">Grado / turno</th>
                  <th className="px-4 py-2 text-left font-medium text-muted-foreground">Alumnos</th>
                  <th className="px-4 py-2 text-left font-medium text-muted-foreground">Devoluciones</th>
                  <th className="px-4 py-2 text-right font-medium text-muted-foreground">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {classrooms.map((c) => {
                  const stats = statsByClassroom[c.id] ?? {
                    total: 0,
                    lista: 0,
                    borrador: 0,
                    pendiente: 0,
                    progress: 0,
                  };
                  return (
                    <tr key={c.id} className="border-t">
                      <td className="px-4 py-3 font-medium">{c.name}</td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {c.grade} · {c.shift}
                      </td>
                      <td className="px-4 py-3">{stats.total}</td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge variant="secondary">{stats.lista} listas</Badge>
                          <Badge variant="outline">{stats.borrador} borrador</Badge>
                          <Badge variant="outline">{stats.pendiente} pendiente</Badge>
                          <span className="text-xs text-muted-foreground">{stats.progress}%</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-2">
                          <Button asChild size="sm" variant="ghost">
                            <Link to={`${ROUTES.CLASSROOMS}/${c.id}`}>Ver aula</Link>
                          </Button>
                          <Button asChild size="sm" variant="outline">
                            <Link to={classroomFeedbackPath(c.id, { week: weekStart })}>Devoluciones</Link>
                          </Button>
                          <Button asChild size="sm" variant="ghost">
                            <Link to={classroomProgramAnnualPath(c.id)}>Programa</Link>
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {statsLoading && (
            <p className="pt-3 text-xs text-muted-foreground">Actualizando métricas de devoluciones…</p>
          )}
        </CardContent>
      </Card>

      {classrooms.length === 0 && (
        <p className="text-sm text-muted-foreground">No hay aulas todavía. Creá la primera arriba.</p>
      )}
    </PageContainer>
  );
};
