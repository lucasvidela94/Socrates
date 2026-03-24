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
import { ROUTES } from "@shared/lib/routes";
import type {
  ClassroomRow,
  LearningNoteInput,
  LearningNoteRow,
  StudentProfileInput,
  StudentWithProfile,
} from "@shared/types";
import { ArrowLeft, Save, StickyNote, Trash2 } from "lucide-react";

export const StudentDetailPage = (): ReactElement => {
  const { classroomId, studentId } = useParams<{
    classroomId: string;
    studentId: string;
  }>();
  const navigate = useNavigate();
  const [classroom, setClassroom] = useState<ClassroomRow | null>(null);
  const [data, setData] = useState<StudentWithProfile | null>(null);
  const [notes, setNotes] = useState<LearningNoteRow[]>([]);
  const [learningStyle, setLearningStyle] = useState("");
  const [strengths, setStrengths] = useState("");
  const [challenges, setChallenges] = useState("");
  const [accommodations, setAccommodations] = useState("");
  const [noteObs, setNoteObs] = useState("");
  const [noteCat, setNoteCat] = useState("observación");
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    if (classroomId === undefined || studentId === undefined) return;
    const all = await window.electronAPI.classroomsList();
    setClassroom(all.find((x) => x.id === classroomId) ?? null);
    const sp = await window.electronAPI.studentGet(studentId);
    setData(sp);
    if (sp !== null) {
      setLearningStyle(sp.profile.learningStyle ?? "");
      setStrengths(sp.profile.strengths ?? "");
      setChallenges(sp.profile.challenges ?? "");
      setAccommodations(sp.profile.accommodations ?? "");
      const n = await window.electronAPI.learningNotesListByStudent(studentId);
      setNotes(n);
    }
  }, [classroomId, studentId]);

  useEffect(() => {
    void load();
  }, [load]);

  const handleSaveProfile = async () => {
    if (studentId === undefined) return;
    setSaving(true);
    try {
      const input: StudentProfileInput = {
        learningStyle: learningStyle || null,
        strengths: strengths || null,
        challenges: challenges || null,
        accommodations: accommodations || null,
      };
      await window.electronAPI.profileUpsert(studentId, input);
      await load();
    } finally {
      setSaving(false);
    }
  };

  const handleAddNote = async () => {
    if (studentId === undefined || noteObs.trim() === "") return;
    const input: LearningNoteInput = {
      observation: noteObs.trim(),
      category: noteCat.trim() || "observación",
    };
    await window.electronAPI.learningNoteAdd(studentId, input);
    setNoteObs("");
    await load();
  };

  const handleDeleteStudent = async () => {
    if (studentId === undefined || data === null) return;
    if (!window.confirm(`¿Eliminar a ${data.student.name}?`)) return;
    await window.electronAPI.studentDelete(studentId);
    void navigate(`${ROUTES.CLASSROOMS}/${classroomId}`);
  };

  if (
    classroomId === undefined ||
    studentId === undefined ||
    data === null ||
    classroom === null
  ) {
    return (
      <PageContainer>
        <p className="text-sm text-muted-foreground">Alumno no encontrado.</p>
        <Button asChild variant="link" className="mt-2 px-0">
          <Link to={ROUTES.CLASSROOMS}>Volver</Link>
        </Button>
      </PageContainer>
    );
  }

  const crumbs = [
    { label: "Inicio", href: `#${ROUTES.HOME}` },
    { label: "Mis aulas", href: `#${ROUTES.CLASSROOMS}` },
    { label: classroom.name, href: `#${ROUTES.CLASSROOMS}/${classroomId}` },
    { label: data.student.name },
  ];

  return (
    <PageContainer>
      <Breadcrumb items={crumbs} />
      <div className="mb-4 flex flex-wrap gap-2">
        <Button asChild variant="ghost" size="sm">
          <Link to={`${ROUTES.CLASSROOMS}/${classroomId}`}>
            <ArrowLeft className="h-4 w-4" />
            Aula
          </Link>
        </Button>
        <Button variant="destructive" size="sm" onClick={handleDeleteStudent}>
          <Trash2 className="h-4 w-4" />
          Eliminar alumno
        </Button>
      </div>
      <PageHeader
        title={data.student.name}
        description="Perfil de aprendizaje y notas que alimentan a los asistentes."
      />

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-base">Perfil de aprendizaje</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1 sm:col-span-2">
            <Label htmlFor="ls">Estilo de aprendizaje</Label>
            <Input
              id="ls"
              value={learningStyle}
              onChange={(e) => setLearningStyle(e.target.value)}
              placeholder="Visual, auditivo, kinestésico..."
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="st">Fortalezas</Label>
            <Input id="st" value={strengths} onChange={(e) => setStrengths(e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label htmlFor="ch">Desafíos</Label>
            <Input id="ch" value={challenges} onChange={(e) => setChallenges(e.target.value)} />
          </div>
          <div className="space-y-1 sm:col-span-2">
            <Label htmlFor="ac">Adecuaciones</Label>
            <Input
              id="ac"
              value={accommodations}
              onChange={(e) => setAccommodations(e.target.value)}
            />
          </div>
          <Button onClick={handleSaveProfile} disabled={saving}>
            <Save className="h-4 w-4" />
            Guardar perfil
          </Button>
        </CardContent>
      </Card>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <StickyNote className="h-4 w-4" />
            Nueva nota de aprendizaje
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid gap-2 sm:grid-cols-4">
            <div className="space-y-1 sm:col-span-1">
              <Label htmlFor="ncat">Categoría</Label>
              <Input
                id="ncat"
                value={noteCat}
                onChange={(e) => setNoteCat(e.target.value)}
              />
            </div>
            <div className="space-y-1 sm:col-span-3">
              <Label htmlFor="nobs">Observación</Label>
              <Input
                id="nobs"
                value={noteObs}
                onChange={(e) => setNoteObs(e.target.value)}
                placeholder="Lo que observaste en clase..."
              />
            </div>
          </div>
          <Button onClick={handleAddNote} disabled={noteObs.trim() === ""}>
            Agregar nota
          </Button>
        </CardContent>
      </Card>

      <div>
        <h2 className="text-sm font-medium mb-2">Historial</h2>
        <ul className="space-y-2">
          {notes.map((n) => (
            <li
              key={n.id}
              className="rounded-md border px-3 py-2 text-sm"
            >
              <span className="text-xs text-muted-foreground">{n.category}</span>
              <p className="mt-1">{n.observation}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {new Date(n.createdAt).toLocaleString()}
              </p>
            </li>
          ))}
        </ul>
        {notes.length === 0 && (
          <p className="text-sm text-muted-foreground">Sin notas todavía.</p>
        )}
      </div>
    </PageContainer>
  );
};
