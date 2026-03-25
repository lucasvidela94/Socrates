import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { ReactElement } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { Breadcrumb } from "@/shared/components/breadcrumb";
import { PageContainer } from "@/shared/components/page-container";
import { PageHeader } from "@/shared/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { BREADCRUMB_MAP, ROUTES, classroomFeedbackPath } from "@shared/lib/routes";
import { useClassroomStore } from "@/stores/classroom-store";
import { Loader2 } from "lucide-react";
import { FeedbackStudentList } from "../components/feedback-student-list";
import { useWeeklyFeedbackDraft } from "../hooks/use-weekly-feedback-draft";
import { getMondayIso, parseWeekParam } from "../lib/week-default";

export const FeedbackPage = (): ReactElement => {
  const navigate = useNavigate();
  const { classroomId: classroomIdFromRoute } = useParams<{ classroomId: string }>();
  const classrooms = useClassroomStore((s) => s.classrooms);
  const classroomId = useClassroomStore((s) => s.classroomId);
  const students = useClassroomStore((s) => s.students);
  const storeSetClassroomId = useClassroomStore((s) => s.setClassroomId);
  const fetchClassrooms = useClassroomStore((s) => s.fetchClassrooms);

  const [searchParams, setSearchParams] = useSearchParams();
  const urlInitDone = useRef(false);

  const [weekStart, setWeekStart] = useState(() => {
    const w = parseWeekParam(searchParams.get("week"));
    return w ?? getMondayIso();
  });

  const syncListUrl = useCallback(
    (week: string, cid: string) => {
      setSearchParams(
        (prev) => {
          const n = new URLSearchParams(prev);
          n.set("week", week);
          if (classroomIdFromRoute === undefined) {
            if (cid !== "") n.set("classroom", cid);
            else n.delete("classroom");
          } else {
            n.delete("classroom");
          }
          return n;
        },
        { replace: true }
      );
    },
    [classroomIdFromRoute, setSearchParams]
  );

  useEffect(() => {
    void fetchClassrooms();
  }, [fetchClassrooms]);

  useEffect(() => {
    if (classrooms.length === 0 || classroomIdFromRoute !== undefined) return;
    const fromQuery = searchParams.get("classroom");
    const preferred =
      fromQuery !== null && fromQuery !== "" && classrooms.some((c) => c.id === fromQuery)
        ? fromQuery
        : classrooms[0]?.id;
    if (preferred === undefined || preferred === "") return;
    void navigate(classroomFeedbackPath(preferred, { week: weekStart }), { replace: true });
  }, [classroomIdFromRoute, classrooms, navigate, searchParams, weekStart]);

  useEffect(() => {
    if (urlInitDone.current) return;
    urlInitDone.current = true;
    const w = parseWeekParam(searchParams.get("week"));
    if (w !== null) setWeekStart(w);
    if (classroomIdFromRoute !== undefined && classroomIdFromRoute !== "") {
      void storeSetClassroomId(classroomIdFromRoute);
      return;
    }
    const c = searchParams.get("classroom");
    if (c !== null && c !== "") void storeSetClassroomId(c);
  }, [classroomIdFromRoute, searchParams, storeSetClassroomId]);

  const { draft, loading, loadWeek } = useWeeklyFeedbackDraft(
    classroomId,
    weekStart,
    students
  );

  useEffect(() => {
    void loadWeek();
  }, [loadWeek]);

  const handleWeekChange = (v: string) => {
    setWeekStart(v);
    syncListUrl(v, classroomId);
  };

  const handleClassroomChange = (nextId: string) => {
    void navigate(classroomFeedbackPath(nextId, { week: weekStart }), { replace: false });
  };

  const classroomLabel = useMemo(() => {
    return classrooms.find((c) => c.id === classroomId)?.name ?? "";
  }, [classrooms, classroomId]);

  const crumbs =
    classroomLabel !== ""
      ? [
          { label: "Inicio", href: `#${ROUTES.HOME}` },
          { label: "Mis aulas", href: `#${ROUTES.CLASSROOMS}` },
          { label: classroomLabel },
          { label: "Devoluciones" },
        ]
      : BREADCRUMB_MAP[ROUTES.FEEDBACK];

  return (
    <PageContainer>
      <Breadcrumb items={crumbs} />
      <PageHeader
        title="Devoluciones semanales"
        description="Elegí semana y aula; más abajo filtrás alumnos por estado."
      />

      <Card className="mb-6">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Semana y aula</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-6 items-end">
          <div className="space-y-1">
            <Label htmlFor="week">Inicio de semana</Label>
            <Input
              id="week"
              type="date"
              className="w-[min(100%,12rem)]"
              value={weekStart}
              onChange={(e) => handleWeekChange(e.target.value)}
            />
          </div>
          {classrooms.length > 1 && classroomId !== "" ? (
            <div className="space-y-1 min-w-[min(100%,14rem)]">
              <Label htmlFor="feedback-classroom">Aula</Label>
              <Select value={classroomId} onValueChange={handleClassroomChange}>
                <SelectTrigger id="feedback-classroom" className="h-9 w-full sm:w-[14rem]">
                  <SelectValue placeholder="Elegir aula" />
                </SelectTrigger>
                <SelectContent>
                  {classrooms.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ) : (
            classroomLabel !== "" && (
              <div className="space-y-1">
                <span className="text-xs text-muted-foreground">Aula</span>
                <p className="text-sm font-medium leading-9">{classroomLabel}</p>
              </div>
            )
          )}
          {loading && (
            <span className="text-sm text-muted-foreground flex items-center gap-1">
              <Loader2 className="h-4 w-4 animate-spin" />
              Cargando…
            </span>
          )}
        </CardContent>
      </Card>

      {classroomId === "" && (
        <p className="text-sm text-muted-foreground">Creá un aula en Mis aulas primero.</p>
      )}

      {classroomId !== "" && students.length === 0 && !loading && (
        <p className="text-sm text-muted-foreground">
          No hay alumnos en {classroomLabel}. Agregalos desde el detalle del aula.
        </p>
      )}

      {classroomId !== "" && students.length > 0 && (
        <FeedbackStudentList
          classroomId={classroomId}
          weekStart={weekStart}
          students={students}
          draft={draft}
          loading={loading}
        />
      )}
    </PageContainer>
  );
};
