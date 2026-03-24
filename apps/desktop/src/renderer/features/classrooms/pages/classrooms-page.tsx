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
import { BREADCRUMB_MAP, ROUTES } from "@shared/lib/routes";
import { useClassroomStore } from "@/stores/classroom-store";
import type { ClassroomInput } from "@shared/types";
import { Plus, School } from "lucide-react";

export const ClassroomsPage = (): ReactElement => {
  const classrooms = useClassroomStore((s) => s.classrooms);
  const fetchClassrooms = useClassroomStore((s) => s.fetchClassrooms);
  useEffect(() => {
    void fetchClassrooms();
  }, [fetchClassrooms]);

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
      <PageHeader
        title="Mis aulas"
        description="Gestioná aulas, alumnos y perfiles para que los asistentes usen contexto real."
      />

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

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {classrooms.map((c) => (
          <Link key={c.id} to={`${ROUTES.CLASSROOMS}/${c.id}`}>
            <Card className="h-full transition-colors hover:bg-muted/40">
              <CardHeader className="flex flex-row items-center gap-2 space-y-0 pb-2">
                <School className="h-5 w-5 text-muted-foreground" />
                <CardTitle className="text-base">{c.name}</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                {c.grade} · {c.shift}
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {classrooms.length === 0 && (
        <p className="text-sm text-muted-foreground">No hay aulas todavía. Creá la primera arriba.</p>
      )}
    </PageContainer>
  );
};
