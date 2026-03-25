import { useCallback, useEffect, useState } from "react";
import type { ReactElement } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Breadcrumb } from "@/shared/components/breadcrumb";
import { PageContainer } from "@/shared/components/page-container";
import { PageHeader } from "@/shared/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ROUTES, classroomFeedbackPath, classroomProgramAnnualPath } from "@shared/lib/routes";
import { useClassroomStore } from "@/stores/classroom-store";
import type { ClassroomRow, StudentInput } from "@shared/types";
import { ArrowLeft, BookMarked, ChevronDown, ClipboardCheck, Trash2, UserPlus, Users } from "lucide-react";
import { MaterialsPanel } from "../../materials";
import { StudentRosterTable } from "../components/student-roster-table";

export const ClassroomDetailPage = (): ReactElement => {
  const { classroomId } = useParams<{ classroomId: string }>();
  const navigate = useNavigate();

  const classrooms = useClassroomStore((s) => s.classrooms);
  const students = useClassroomStore((s) => s.students);
  const storeSetClassroomId = useClassroomStore((s) => s.setClassroomId);
  const refreshStudents = useClassroomStore((s) => s.refreshStudents);
  const fetchClassrooms = useClassroomStore((s) => s.fetchClassrooms);

  const [classroom, setClassroom] = useState<ClassroomRow | null>(null);
  const [studentName, setStudentName] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (classroomId === undefined) return;
    void storeSetClassroomId(classroomId);
  }, [classroomId, storeSetClassroomId]);

  useEffect(() => {
    const found = classrooms.find((c) => c.id === classroomId) ?? null;
    setClassroom(found);
  }, [classrooms, classroomId]);

  const handleAddStudent = useCallback(async () => {
    if (classroomId === undefined || studentName.trim() === "") return;
    setSaving(true);
    try {
      const input: StudentInput = {
        name: studentName.trim(),
        classroomId,
      };
      await window.electronAPI.studentCreate(input);
      setStudentName("");
      await refreshStudents();
    } finally {
      setSaving(false);
    }
  }, [classroomId, studentName, refreshStudents]);

  const handleDeleteClassroom = useCallback(async () => {
    if (classroomId === undefined || classroom === null) return;
    if (!window.confirm(`¿Eliminar el aula "${classroom.name}" y todos sus alumnos?`)) return;
    await window.electronAPI.classroomDelete(classroomId);
    await fetchClassrooms();
    void navigate(ROUTES.CLASSROOMS);
  }, [classroomId, classroom, fetchClassrooms, navigate]);

  if (classroomId === undefined || classroom === null) {
    return (
      <PageContainer>
        <p className="text-sm text-muted-foreground">Aula no encontrada.</p>
        <Button asChild variant="link" className="mt-2 px-0">
          <Link to={ROUTES.CLASSROOMS}>Volver</Link>
        </Button>
      </PageContainer>
    );
  }

  const crumbs = [
    { label: "Inicio", href: `#${ROUTES.HOME}` },
    { label: "Mis aulas", href: `#${ROUTES.CLASSROOMS}` },
    { label: classroom.name },
  ];

  return (
    <PageContainer>
      <Breadcrumb items={crumbs} />
      <div className="mb-6 flex flex-wrap items-center gap-2">
        <Button asChild variant="ghost" size="sm" className="-ml-2">
          <Link to={ROUTES.CLASSROOMS}>
            <ArrowLeft className="h-4 w-4" />
            Aulas
          </Link>
        </Button>
        <span className="hidden min-[480px]:inline text-muted-foreground/50">·</span>
        <div className="flex flex-wrap items-center gap-2 sm:ml-auto">
          <Button asChild variant="outline" size="sm">
            <Link to={classroomFeedbackPath(classroomId)}>
              <ClipboardCheck className="h-4 w-4" />
              Devoluciones
            </Link>
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link to={classroomProgramAnnualPath(classroomId)}>
              <BookMarked className="h-4 w-4" />
              Programa
            </Link>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="text-destructive hover:bg-destructive/10 hover:text-destructive"
            onClick={() => void handleDeleteClassroom()}
          >
            <Trash2 className="h-4 w-4" />
            Eliminar
          </Button>
        </div>
      </div>

      <PageHeader title={classroom.name} description={`${classroom.grade} · ${classroom.shift}`} />

      <div className="mt-8 space-y-4">
        <Card>
          <CardHeader className="pb-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <CardTitle className="text-base font-semibold tracking-tight">
                <span className="inline-flex items-center gap-2">
                  <Users className="h-4 w-4 text-muted-foreground" aria-hidden />
                  Alumnos
                  <span className="rounded-md bg-muted px-1.5 py-0.5 text-xs font-medium tabular-nums text-muted-foreground">
                    {students.length}
                  </span>
                </span>
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap items-end gap-2 border-b border-border/60 pb-4">
              <div className="min-w-[min(100%,220px)] flex-1 space-y-1">
                <Label htmlFor="sname" className="text-xs text-muted-foreground">
                  Nuevo alumno
                </Label>
                <Input
                  id="sname"
                  value={studentName}
                  onChange={(e) => setStudentName(e.target.value)}
                  placeholder="Nombre y apellido"
                  className="h-9"
                />
              </div>
              <Button
                type="button"
                size="sm"
                className="shrink-0"
                onClick={() => void handleAddStudent()}
                disabled={saving || studentName.trim() === ""}
              >
                <UserPlus className="h-4 w-4" />
                Agregar
              </Button>
            </div>
            <StudentRosterTable classroomId={classroomId} students={students} />
          </CardContent>
        </Card>

        <details className="group rounded-xl border border-border/80 bg-card/30 [&[open]_summary_svg]:rotate-180">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 text-sm font-medium [&::-webkit-details-marker]:hidden">
            <span>Materiales para los asistentes</span>
            <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200" />
          </summary>
          <div className="border-t border-border/60 px-4 py-4">
            <MaterialsPanel classroomId={classroomId} embedded />
          </div>
        </details>
      </div>
    </PageContainer>
  );
};
