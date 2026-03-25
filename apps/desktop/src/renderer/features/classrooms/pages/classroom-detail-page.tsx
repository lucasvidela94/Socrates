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
import { ROUTES, classroomCurriculumPath } from "@shared/lib/routes";
import { useClassroomStore } from "@/stores/classroom-store";
import type { ClassroomRow, StudentInput } from "@shared/types";
import { ArrowLeft, BookMarked, Trash2, UserPlus, Users } from "lucide-react";
import { MaterialsPanel } from "../../materials";

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
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <Button asChild variant="ghost" size="sm">
          <Link to={ROUTES.CLASSROOMS}>
            <ArrowLeft className="h-4 w-4" />
            Aulas
          </Link>
        </Button>
        <Button variant="destructive" size="sm" onClick={() => void handleDeleteClassroom()}>
          <Trash2 className="h-4 w-4" />
          Eliminar aula
        </Button>
      </div>
      <PageHeader
        title={classroom.name}
        description={`${classroom.grade} · ${classroom.shift}`}
      />

      <Card className="max-w-xl mb-8">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <UserPlus className="h-4 w-4" />
            Agregar alumno
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <div className="flex-1 min-w-[200px] space-y-1">
            <Label htmlFor="sname">Nombre y apellido</Label>
            <Input
              id="sname"
              value={studentName}
              onChange={(e) => setStudentName(e.target.value)}
              placeholder="Nombre completo"
            />
          </div>
          <div className="flex items-end">
            <Button
              onClick={() => void handleAddStudent()}
              disabled={saving || studentName.trim() === ""}
            >
              Agregar
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="mb-8">
        <CardContent className="pt-6">
          <MaterialsPanel classroomId={classroomId} />
        </CardContent>
      </Card>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <BookMarked className="h-4 w-4" />
            Programa anual
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap items-center gap-3">
          <p className="text-sm text-muted-foreground flex-1 min-w-[200px]">
            Definí materias, unidades y temas para alinear los asistentes al curso.
          </p>
          <Button asChild variant="outline" size="sm">
            <Link to={classroomCurriculumPath(classroomId)}>Gestionar programa</Link>
          </Button>
        </CardContent>
      </Card>

      <div className="space-y-2">
        <h2 className="text-sm font-medium flex items-center gap-2">
          <Users className="h-4 w-4" />
          Alumnos ({students.length})
        </h2>
        <ul className="divide-y rounded-md border">
          {students.map((s) => (
            <li key={s.id}>
              <Link
                className="flex items-center justify-between px-4 py-3 text-sm hover:bg-muted/50"
                to={`${ROUTES.CLASSROOMS}/${classroomId}/students/${s.id}`}
              >
                <span>{s.name}</span>
                <span className="text-muted-foreground text-xs">Ficha →</span>
              </Link>
            </li>
          ))}
        </ul>
        {students.length === 0 && (
          <p className="text-sm text-muted-foreground">No hay alumnos en esta aula.</p>
        )}
      </div>
    </PageContainer>
  );
};
