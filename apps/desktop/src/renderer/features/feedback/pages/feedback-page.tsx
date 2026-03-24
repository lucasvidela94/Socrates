import { useCallback, useEffect, useMemo, useState } from "react";
import type { ReactElement } from "react";
import { Breadcrumb } from "@/shared/components/breadcrumb";
import { PageContainer } from "@/shared/components/page-container";
import { PageHeader } from "@/shared/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { BREADCRUMB_MAP, ROUTES } from "@shared/lib/routes";
import { useClassroomStore } from "@/stores/classroom-store";
import type { StudentRow } from "@shared/types";
import { CheckCircle2, Loader2, Sparkles } from "lucide-react";

const AREAS = ["lectura", "escritura", "matemática", "ciencias", "convivencia"] as const;
const INDICATOR_VALUES = ["__none", "mejoró", "igual", "retrocedió"] as const;

export const FeedbackPage = (): ReactElement => {
  const classrooms = useClassroomStore((s) => s.classrooms);
  const classroomId = useClassroomStore((s) => s.classroomId);
  const students = useClassroomStore((s) => s.students);
  const storeSetClassroomId = useClassroomStore((s) => s.setClassroomId);
  const fetchClassrooms = useClassroomStore((s) => s.fetchClassrooms);

  const [weekStart, setWeekStart] = useState(() => {
    const d = new Date();
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    const mon = new Date(d.setDate(diff));
    return mon.toISOString().slice(0, 10);
  });
  const [draft, setDraft] = useState<
    Record<
      string,
      {
        indicators: Record<string, string>;
        observations: string;
        aiSummary: string;
        teacherApproved: boolean;
      }
    >
  >({});
  const [loading, setLoading] = useState(false);
  const [genId, setGenId] = useState<string | null>(null);

  useEffect(() => {
    void fetchClassrooms();
  }, [fetchClassrooms]);

  const loadWeek = useCallback(async () => {
    if (classroomId === "") return;
    setLoading(true);
    try {
      const fb = await window.electronAPI.feedbackListByWeek(classroomId, weekStart);
      const next: typeof draft = {};
      for (const s of students) {
        const existing = fb.find((r) => r.studentId === s.id);
        const ind: Record<string, string> = {};
        for (const a of AREAS) {
          const v = existing?.indicators?.[a];
          ind[a] = typeof v === "string" ? v : "";
        }
        next[s.id] = {
          indicators: ind,
          observations: existing?.observations ?? "",
          aiSummary: existing?.aiSummary ?? "",
          teacherApproved: existing?.teacherApproved === true,
        };
      }
      setDraft(next);
    } finally {
      setLoading(false);
    }
  }, [classroomId, weekStart, students]);

  useEffect(() => {
    void loadWeek();
  }, [loadWeek]);

  const setInd = (studentId: string, area: string, value: string) => {
    const stored = value === "__none" ? "" : value;
    setDraft((prev) => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        indicators: { ...prev[studentId].indicators, [area]: stored },
      },
    }));
  };

  const setObs = (studentId: string, text: string) => {
    setDraft((prev) => ({
      ...prev,
      [studentId]: { ...prev[studentId], observations: text },
    }));
  };

  const setAi = (studentId: string, text: string) => {
    setDraft((prev) => ({
      ...prev,
      [studentId]: { ...prev[studentId], aiSummary: text },
    }));
  };

  const setApproved = (studentId: string, v: boolean) => {
    setDraft((prev) => ({
      ...prev,
      [studentId]: { ...prev[studentId], teacherApproved: v },
    }));
  };

  const handleSave = async (studentId: string) => {
    const d = draft[studentId];
    if (d === undefined || classroomId === "") return;
    const indicators: Record<string, string> = {};
    for (const a of AREAS) {
      const v = d.indicators[a];
      if (v !== undefined && v !== "") indicators[a] = v;
    }
    await window.electronAPI.feedbackUpsert({
      studentId,
      classroomId,
      weekStart,
      indicators,
      observations: d.observations || null,
      aiSummary: d.aiSummary || null,
      teacherApproved: d.teacherApproved,
    });
    await loadWeek();
  };

  const handleGenerate = async (student: StudentRow) => {
    if (classroomId === "") return;
    setGenId(student.id);
    try {
      const history = await window.electronAPI.feedbackListByStudent(
        classroomId,
        student.id
      );
      const prior = history.filter((r) => String(r.weekStart) !== weekStart).slice(0, 8);
      const d = draft[student.id];
      const currentIndicators: Record<string, unknown> = {};
      if (d !== undefined) {
        for (const a of AREAS) {
          const v = d.indicators[a];
          if (v !== undefined && v !== "") currentIndicators[a] = v;
        }
      }
      const res = await window.electronAPI.feedbackGenerateSummary({
        studentId: student.id,
        classroomId,
        weekStart,
        studentName: student.name,
        priorWeeksJson: JSON.stringify(prior),
        currentIndicators,
        currentObservations: d?.observations ?? "",
      });
      if (res.ok) {
        setAi(student.id, res.summary);
      } else {
        window.alert(res.error);
      }
    } finally {
      setGenId(null);
    }
  };

  const classroomLabel = useMemo(() => {
    return classrooms.find((c) => c.id === classroomId)?.name ?? "";
  }, [classrooms, classroomId]);

  return (
    <PageContainer>
      <Breadcrumb items={BREADCRUMB_MAP[ROUTES.FEEDBACK]} />
      <PageHeader
        title="Devoluciones semanales"
        description="Cargá observaciones de la semana y recibí una sugerencia de resumen para revisar."
      />

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-base">Semana y aula</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-4 items-end">
          <div className="space-y-1">
            <Label htmlFor="week">Inicio de semana</Label>
            <Input
              id="week"
              type="date"
              value={weekStart}
              onChange={(e) => setWeekStart(e.target.value)}
            />
          </div>
          <div className="space-y-1 min-w-[200px]">
            <Label>Aula</Label>
            <Select value={classroomId} onValueChange={(v) => void storeSetClassroomId(v)}>
              <SelectTrigger>
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

      <div className="space-y-6">
        {students.map((s) => {
          const d = draft[s.id];
          if (d === undefined) return null;
          return (
            <Card key={s.id}>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">{s.name}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                  {AREAS.map((area) => (
                    <div key={area} className="space-y-1">
                      <Label className="capitalize">{area}</Label>
                      <Select
                        value={d.indicators[area] === "" ? "__none" : d.indicators[area]}
                        onValueChange={(v) => setInd(s.id, area, v)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="—" />
                        </SelectTrigger>
                        <SelectContent>
                          {INDICATOR_VALUES.map((opt) => (
                            <SelectItem key={opt} value={opt}>
                              {opt === "__none" ? "—" : opt}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  ))}
                </div>
                <div className="space-y-1">
                  <Label>Observaciones</Label>
                  <textarea
                    className="flex min-h-[72px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    value={d.observations}
                    onChange={(e) => setObs(s.id, e.target.value)}
                  />
                </div>
                <div className="flex flex-wrap gap-2 items-center">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => void handleGenerate(s)}
                    disabled={genId === s.id}
                  >
                    {genId === s.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Sparkles className="h-4 w-4" />
                    )}
                    Sugerir resumen
                  </Button>
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={d.teacherApproved}
                      onChange={(e) => setApproved(s.id, e.target.checked)}
                    />
                    Revisado por la docente
                  </label>
                </div>
                <div className="space-y-1">
                  <Label>Resumen sugerido (podés editarlo)</Label>
                  <textarea
                    className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    value={d.aiSummary}
                    onChange={(e) => setAi(s.id, e.target.value)}
                  />
                </div>
                <Button type="button" onClick={() => void handleSave(s.id)}>
                  <CheckCircle2 className="h-4 w-4" />
                  Guardar devolución
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </PageContainer>
  );
};
