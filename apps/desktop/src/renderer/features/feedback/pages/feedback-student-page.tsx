import { useEffect, useMemo, type ReactElement } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Breadcrumb } from "@/shared/components/breadcrumb";
import { PageContainer } from "@/shared/components/page-container";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ROUTES, classroomFeedbackPath } from "@shared/lib/routes";
import { useClassroomStore } from "@/stores/classroom-store";
import { Loader2 } from "lucide-react";
import { FeedbackStudentForm } from "../components/feedback-student-form";
import { useWeeklyFeedbackDraft } from "../hooks/use-weekly-feedback-draft";
import { getMondayIso, parseWeekParam } from "../lib/week-default";

export const FeedbackStudentPage = (): ReactElement => {
  const { classroomId, studentId } = useParams<{
    classroomId: string;
    studentId: string;
  }>();
  const [searchParams] = useSearchParams();

  const classrooms = useClassroomStore((s) => s.classrooms);
  const students = useClassroomStore((s) => s.students);
  const storeSetClassroomId = useClassroomStore((s) => s.setClassroomId);
  const fetchClassrooms = useClassroomStore((s) => s.fetchClassrooms);

  const weekStart = useMemo(() => {
    return parseWeekParam(searchParams.get("week")) ?? getMondayIso();
  }, [searchParams]);

  useEffect(() => {
    void fetchClassrooms();
  }, [fetchClassrooms]);

  useEffect(() => {
    if (classroomId === undefined || classroomId === "") return;
    void storeSetClassroomId(classroomId);
  }, [classroomId, storeSetClassroomId]);

  const {
    draft,
    loading,
    loadWeek,
    setInd,
    setObs,
    setAi,
    setApproved,
    handleSave,
    handleGenerate,
    savingId,
    genId,
  } = useWeeklyFeedbackDraft(classroomId ?? "", weekStart, students);

  useEffect(() => {
    void loadWeek();
  }, [loadWeek]);

  const student = useMemo(
    () => (studentId !== undefined ? students.find((s) => s.id === studentId) : undefined),
    [students, studentId]
  );

  const selectedDraft = studentId !== undefined ? draft[studentId] : undefined;

  const listHref = classroomId !== undefined ? classroomFeedbackPath(classroomId, { week: weekStart }) : ROUTES.FEEDBACK;

  const classroomLabel = classrooms.find((c) => c.id === classroomId)?.name ?? "";

  const crumbs = [
    { label: "Inicio", href: `#${ROUTES.HOME}` },
    { label: "Mis aulas", href: `#${ROUTES.CLASSROOMS}` },
    ...(classroomLabel !== "" && classroomId !== undefined
      ? [{ label: classroomLabel, href: `#${ROUTES.CLASSROOMS}/${classroomId}` }]
      : []),
    { label: "Devoluciones", href: `#${listHref}` },
    ...(student !== undefined ? [{ label: student.name }] : [{ label: "Alumno" }]),
  ];

  const studentNotInClass =
    !loading &&
    students.length > 0 &&
    studentId !== undefined &&
    !students.some((s) => s.id === studentId);

  if (classroomId === undefined || studentId === undefined) {
    return (
      <PageContainer>
        <p className="text-sm text-muted-foreground">Ruta no válida.</p>
        <Button asChild variant="link" className="mt-2 h-auto px-0">
          <Link to={ROUTES.FEEDBACK}>Volver a devoluciones</Link>
        </Button>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <Breadcrumb items={crumbs} />
      <div className="mb-6">
        <Button variant="ghost" size="sm" className="gap-2 -ml-2 text-muted-foreground" asChild>
          <Link to={listHref}>
            <ArrowLeft className="size-4" />
            Volver al listado
          </Link>
        </Button>
      </div>

      {loading && (
        <Card className="border-dashed">
          <CardContent className="flex min-h-[200px] flex-col items-center justify-center gap-3 py-12">
            <Loader2 className="size-8 animate-spin text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Cargando…</p>
          </CardContent>
        </Card>
      )}

      {studentNotInClass && (
        <p className="text-sm text-muted-foreground">Este alumno no pertenece al aula o no existe.</p>
      )}

      {!loading && student !== undefined && selectedDraft !== undefined && (
        <FeedbackStudentForm
          student={student}
          draft={selectedDraft}
          saving={savingId === student.id}
          generating={genId === student.id}
          onIndicatorChange={(area, v) => setInd(student.id, area, v)}
          onObservationsChange={(t) => setObs(student.id, t)}
          onSummaryChange={(t) => setAi(student.id, t)}
          onMarkAsReadyChange={(ready) => setApproved(student.id, ready)}
          onGenerateSummary={() => void handleGenerate(student)}
          onSave={() => void handleSave(student.id)}
        />
      )}

      {!loading && classroomId !== "" && students.length === 0 && (
        <p className="text-sm text-muted-foreground">
          No hay alumnos en {classrooms.find((c) => c.id === classroomId)?.name ?? "esta aula"}.
        </p>
      )}
    </PageContainer>
  );
};
