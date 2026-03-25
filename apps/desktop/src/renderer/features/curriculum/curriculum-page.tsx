import { useCallback, useEffect, useState, type ReactElement } from "react";
import { Link, useParams } from "react-router-dom";
import { Breadcrumb } from "@/shared/components/breadcrumb";
import { PageContainer } from "@/shared/components/page-container";
import { PageHeader } from "@/shared/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ROUTES, classroomCurriculumPath } from "@shared/lib/routes";
import { useClassroomStore } from "@/stores/classroom-store";
import type {
  CurriculumTree,
  CurriculumSubjectNode,
  CurriculumUnitNode,
  CurriculumTopicNode,
} from "@shared/types";
import { ArrowLeft, BookMarked, Plus, Trash2, Upload } from "lucide-react";

function dateInputValue(d: string | Date | null | undefined): string {
  if (d === null || d === undefined) return "";
  if (typeof d === "string") return d.slice(0, 10);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function nextUnitStatus(s: string): string {
  if (s === "upcoming") return "in_progress";
  if (s === "in_progress") return "completed";
  return "upcoming";
}

function TopicRow({
  topic,
  onRefresh,
}: {
  topic: CurriculumTopicNode;
  onRefresh: () => void;
}): ReactElement {
  const [name, setName] = useState(topic.name);

  useEffect(() => {
    setName(topic.name);
  }, [topic.id, topic.name]);

  const saveName = async () => {
    if (name.trim() === topic.name) return;
    await window.electronAPI.curriculumTopicUpdate(topic.id, { name: name.trim() });
    onRefresh();
  };

  return (
    <div className="flex items-center gap-2 pl-4 py-1 border-l-2 border-muted">
      <Input
        className="h-8 text-xs flex-1"
        value={name}
        onChange={(e) => setName(e.target.value)}
        onBlur={() => void saveName()}
      />
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="h-8 w-8 shrink-0"
        onClick={() => void window.electronAPI.curriculumTopicDelete(topic.id).then(onRefresh)}
      >
        <Trash2 className="h-3.5 w-3.5" />
      </Button>
    </div>
  );
}

function UnitBlock({
  unit,
  onRefresh,
}: {
  unit: CurriculumUnitNode;
  onRefresh: () => void;
}): ReactElement {
  const [name, setName] = useState(unit.name);
  const [objectives, setObjectives] = useState(unit.objectives ?? "");
  const [start, setStart] = useState(dateInputValue(unit.startDate));
  const [end, setEnd] = useState(dateInputValue(unit.endDate));

  useEffect(() => {
    setName(unit.name);
    setObjectives(unit.objectives ?? "");
    setStart(dateInputValue(unit.startDate));
    setEnd(dateInputValue(unit.endDate));
  }, [unit.id, unit.name, unit.objectives, unit.startDate, unit.endDate, unit.status]);

  const saveMeta = async () => {
    await window.electronAPI.curriculumUnitUpdate(unit.id, {
      name: name.trim(),
      objectives: objectives.trim() || null,
      startDate: start || null,
      endDate: end || null,
    });
    onRefresh();
  };

  const cycleStatus = async () => {
    await window.electronAPI.curriculumUnitUpdate(unit.id, { status: nextUnitStatus(unit.status) });
    onRefresh();
  };

  const addTopic = async () => {
    const t = window.prompt("Nombre del tema");
    if (t === null || t.trim() === "") return;
    await window.electronAPI.curriculumTopicCreate(unit.id, t.trim());
    onRefresh();
  };

  return (
    <div className="rounded-md border bg-muted/20 p-3 space-y-2">
      <div className="flex flex-wrap gap-2 items-start">
        <Input
          className="max-w-xs h-8 text-sm font-medium"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onBlur={() => void saveMeta()}
        />
        <Button type="button" variant="outline" size="sm" onClick={() => void cycleStatus()}>
          {unit.status}
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="text-destructive"
          onClick={() => void window.electronAPI.curriculumUnitDelete(unit.id).then(onRefresh)}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        <div className="space-y-1">
          <Label className="text-xs">Inicio</Label>
          <Input
            type="date"
            className="h-8 text-xs"
            value={start}
            onChange={(e) => setStart(e.target.value)}
            onBlur={() => void saveMeta()}
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Fin</Label>
          <Input
            type="date"
            className="h-8 text-xs"
            value={end}
            onChange={(e) => setEnd(e.target.value)}
            onBlur={() => void saveMeta()}
          />
        </div>
      </div>
      <div className="space-y-1">
        <Label className="text-xs">Objetivos</Label>
        <textarea
          className="w-full min-h-[56px] text-xs rounded-md border border-input bg-background px-2 py-1.5"
          value={objectives}
          onChange={(e) => setObjectives(e.target.value)}
          onBlur={() => void saveMeta()}
        />
      </div>
      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">Temas</span>
          <Button type="button" variant="ghost" size="sm" className="h-7 text-xs" onClick={() => void addTopic()}>
            <Plus className="h-3 w-3 mr-1" />
            Tema
          </Button>
        </div>
        {unit.topics.map((t) => (
          <TopicRow key={t.id} topic={t} onRefresh={onRefresh} />
        ))}
      </div>
    </div>
  );
}

function SubjectBlock({
  subject,
  onRefresh,
}: {
  subject: CurriculumSubjectNode;
  onRefresh: () => void;
}): ReactElement {
  const [name, setName] = useState(subject.name);

  useEffect(() => {
    setName(subject.name);
  }, [subject.id, subject.name]);

  const saveName = async () => {
    if (name.trim() === subject.name) return;
    await window.electronAPI.curriculumSubjectUpdate(subject.id, { name: name.trim() });
    onRefresh();
  };

  const addUnit = async () => {
    const n = window.prompt("Nombre de la unidad");
    if (n === null || n.trim() === "") return;
    await window.electronAPI.curriculumUnitCreate(subject.id, { name: n.trim() });
    onRefresh();
  };

  return (
    <div className="border rounded-lg p-4 space-y-3">
      <div className="flex flex-wrap items-center gap-2 justify-between">
        <Input
          className="max-w-md h-9 font-medium"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onBlur={() => void saveName()}
        />
        <div className="flex gap-1">
          <Button type="button" variant="outline" size="sm" onClick={() => void addUnit()}>
            <Plus className="h-4 w-4 mr-1" />
            Unidad
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="text-destructive"
            onClick={() => void window.electronAPI.curriculumSubjectDelete(subject.id).then(onRefresh)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
      <div className="space-y-2">
        {subject.units.map((u) => (
          <UnitBlock key={u.id} unit={u} onRefresh={onRefresh} />
        ))}
      </div>
    </div>
  );
}

export const CurriculumPage = (): ReactElement => {
  const { classroomId } = useParams<{ classroomId: string }>();
  const classrooms = useClassroomStore((s) => s.classrooms);
  const storeSetClassroomId = useClassroomStore((s) => s.setClassroomId);

  const [tree, setTree] = useState<CurriculumTree | null>(null);
  const [loading, setLoading] = useState(true);
  const [newTitle, setNewTitle] = useState("");
  const [newYear, setNewYear] = useState(String(new Date().getFullYear()));
  const [newDesc, setNewDesc] = useState("");
  const [importOpen, setImportOpen] = useState(false);
  const [importText, setImportText] = useState("");
  const [importing, setImporting] = useState(false);
  const [metaTitle, setMetaTitle] = useState("");
  const [metaYear, setMetaYear] = useState("");
  const [metaDesc, setMetaDesc] = useState("");

  const classroom = classrooms.find((c) => c.id === classroomId) ?? null;

  const refresh = useCallback(async () => {
    if (classroomId === undefined) return;
    setLoading(true);
    try {
      const t = await window.electronAPI.curriculumTreeGet(classroomId);
      setTree(t);
      if (t !== null) {
        setMetaTitle(t.curriculum.title);
        setMetaYear(t.curriculum.year !== null ? String(t.curriculum.year) : "");
        setMetaDesc(t.curriculum.description ?? "");
      }
    } finally {
      setLoading(false);
    }
  }, [classroomId]);

  useEffect(() => {
    if (classroomId === undefined) return;
    void storeSetClassroomId(classroomId);
  }, [classroomId, storeSetClassroomId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

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
    { label: classroom.name, href: `#${ROUTES.CLASSROOMS}/${classroomId}` },
    { label: "Programa anual" },
  ];

  const handleCreate = async () => {
    await window.electronAPI.curriculumCreate(classroomId, {
      title: newTitle.trim() || "Programa anual",
      year: newYear.trim() === "" ? null : Number.parseInt(newYear, 10),
      description: newDesc.trim() || null,
    });
    setNewTitle("");
    setNewDesc("");
    await refresh();
  };

  const saveCurriculumMeta = async () => {
    if (tree === null) return;
    await window.electronAPI.curriculumUpdate(tree.curriculum.id, {
      title: metaTitle.trim(),
      year: metaYear.trim() === "" ? null : Number.parseInt(metaYear, 10),
      description: metaDesc.trim() || null,
    });
    await refresh();
  };

  const addSubject = async () => {
    if (tree === null) return;
    const n = window.prompt("Nombre de la materia");
    if (n === null || n.trim() === "") return;
    await window.electronAPI.curriculumSubjectCreate(tree.curriculum.id, n.trim());
    await refresh();
  };

  const handleImport = async () => {
    if (importText.trim() === "") return;
    setImporting(true);
    try {
      const res = await window.electronAPI.curriculumImport(classroomId, importText);
      if (res.ok) {
        setTree(res.tree);
        setMetaTitle(res.tree.curriculum.title);
        setMetaYear(res.tree.curriculum.year !== null ? String(res.tree.curriculum.year) : "");
        setMetaDesc(res.tree.curriculum.description ?? "");
        setImportOpen(false);
        setImportText("");
      } else {
        window.alert(res.error);
      }
    } finally {
      setImporting(false);
    }
  };

  const deleteProgram = async () => {
    if (tree === null) return;
    if (!window.confirm("¿Eliminar todo el programa anual de esta aula?")) return;
    await window.electronAPI.curriculumDelete(tree.curriculum.id);
    setTree(null);
    await refresh();
  };

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
      </div>
      <PageHeader
        title="Programa anual"
        description={`${classroom.name} · ${classroom.grade}`}
      />

      {loading ? (
        <p className="text-sm text-muted-foreground">Cargando…</p>
      ) : tree === null ? (
        <Card className="max-w-lg">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <BookMarked className="h-4 w-4" />
              Crear programa
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-1">
              <Label>Título</Label>
              <Input value={newTitle} onChange={(e) => setNewTitle(e.target.value)} placeholder="Ej. 2025" />
            </div>
            <div className="space-y-1">
              <Label>Año</Label>
              <Input value={newYear} onChange={(e) => setNewYear(e.target.value)} type="number" />
            </div>
            <div className="space-y-1">
              <Label>Descripción (opcional)</Label>
              <textarea
                className="w-full min-h-[72px] text-sm rounded-md border border-input bg-background px-2 py-1.5"
                value={newDesc}
                onChange={(e) => setNewDesc(e.target.value)}
              />
            </div>
            <Button type="button" onClick={() => void handleCreate()}>
              Crear programa vacío
            </Button>
            <div className="pt-2 border-t">
              <Button type="button" variant="outline" onClick={() => setImportOpen(true)}>
                <Upload className="h-4 w-4 mr-2" />
                Importar desde texto
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          <Card>
            <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2 pb-2">
              <CardTitle className="text-base">Datos del programa</CardTitle>
              <div className="flex gap-2">
                <Button type="button" variant="outline" size="sm" onClick={() => setImportOpen(true)}>
                  <Upload className="h-4 w-4 mr-1" />
                  Importar
                </Button>
                <Button type="button" variant="destructive" size="sm" onClick={() => void deleteProgram()}>
                  Eliminar programa
                </Button>
              </div>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-3 items-end">
              <div className="space-y-1 min-w-[160px]">
                <Label className="text-xs">Título</Label>
                <Input className="h-8" value={metaTitle} onChange={(e) => setMetaTitle(e.target.value)} />
              </div>
              <div className="space-y-1 w-24">
                <Label className="text-xs">Año</Label>
                <Input className="h-8" value={metaYear} onChange={(e) => setMetaYear(e.target.value)} />
              </div>
              <Button type="button" size="sm" onClick={() => void saveCurriculumMeta()}>
                Guardar
              </Button>
            </CardContent>
            <CardContent className="pt-0">
              <Label className="text-xs">Descripción</Label>
              <textarea
                className="w-full min-h-[64px] text-sm rounded-md border border-input bg-background px-2 py-1.5 mt-1"
                value={metaDesc}
                onChange={(e) => setMetaDesc(e.target.value)}
                onBlur={() => void saveCurriculumMeta()}
              />
            </CardContent>
          </Card>

          <div className="flex items-center justify-between">
            <h2 className="text-sm font-medium">Materias y unidades</h2>
            <Button type="button" size="sm" variant="outline" onClick={() => void addSubject()}>
              <Plus className="h-4 w-4 mr-1" />
              Materia
            </Button>
          </div>
          <div className="space-y-4">
            {tree.subjects.map((s: CurriculumSubjectNode) => (
              <SubjectBlock key={s.id} subject={s} onRefresh={refresh} />
            ))}
          </div>
        </div>
      )}

      {importOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <Card className="w-full max-w-lg max-h-[90vh] flex flex-col">
            <CardHeader>
              <CardTitle className="text-base">Importar programa</CardTitle>
              <p className="text-xs text-muted-foreground">
                Pegá el texto del programa. Se reemplaza el programa actual del aula.
              </p>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col gap-2 min-h-0">
              <textarea
                className="flex-1 min-h-[200px] text-sm rounded-md border border-input bg-background px-2 py-1.5 font-mono"
                value={importText}
                onChange={(e) => setImportText(e.target.value)}
                placeholder="Contenido del programa escolar…"
              />
              <div className="flex justify-end gap-2">
                <Button type="button" variant="ghost" onClick={() => setImportOpen(false)}>
                  Cancelar
                </Button>
                <Button type="button" disabled={importing} onClick={() => void handleImport()}>
                  {importing ? "Procesando…" : "Importar"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </PageContainer>
  );
};
