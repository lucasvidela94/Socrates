import { useId, useMemo, type ReactElement } from "react";
import { BookOpen, SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { ClassroomRow, CurriculumChatSummary, StudentRow } from "@shared/types";

interface ChatContextSettingsModalProps {
  classrooms: ClassroomRow[];
  classroomId: string;
  onClassroomIdChange: (id: string) => void;
  noneSentinel: string;
  students: StudentRow[];
  omitStudents: boolean;
  onOmitStudentsChange: (v: boolean) => void;
  filterStudentsEnabled: boolean;
  onFilterStudentsEnabledChange: (v: boolean) => void;
  selectedStudentIds: Set<string>;
  onToggleStudent: (id: string) => void;
  materialsCount: number;
  curriculumSummary: CurriculumChatSummary | null;
}

export const ChatContextSettingsModal = ({
  classrooms,
  classroomId,
  onClassroomIdChange,
  noneSentinel,
  students,
  omitStudents,
  onOmitStudentsChange,
  filterStudentsEnabled,
  onFilterStudentsEnabledChange,
  selectedStudentIds,
  onToggleStudent,
  materialsCount,
  curriculumSummary,
}: ChatContextSettingsModalProps): ReactElement => {
  const omitId = useId();
  const filterId = useId();

  const classroomName = useMemo(() => {
    if (classroomId === "") return null;
    return classrooms.find((c) => c.id === classroomId)?.name ?? null;
  }, [classrooms, classroomId]);

  const triggerHint =
    classroomName === null
      ? "Sin aula vinculada"
      : `${classroomName} · ${materialsCount} ${materialsCount === 1 ? "material" : "materiales"}`;

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-9 gap-2 border-foreground/12 bg-background/80 px-3 font-normal shadow-none hover:bg-muted/60"
        >
          <span className="flex size-7 items-center justify-center rounded-md bg-primary/10 text-primary">
            <SlidersHorizontal className="size-3.5" aria-hidden />
          </span>
          <span className="flex min-w-0 flex-col items-start text-left leading-tight">
            <span className="text-xs font-medium text-foreground">Contexto del aula</span>
            <span className="max-w-[11rem] truncate text-[11px] text-muted-foreground sm:max-w-[14rem]">
              {triggerHint}
            </span>
          </span>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[min(88vh,720px)] max-w-[min(calc(100vw-2rem),440px)] overflow-hidden sm:max-w-md">
        <DialogHeader className="relative shrink-0 pl-6 before:absolute before:top-4 before:bottom-4 before:left-0 before:w-1 before:rounded-full before:bg-primary/50">
          <div className="flex items-start gap-3">
            <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/12 text-primary">
              <BookOpen className="size-4" aria-hidden />
            </span>
            <div className="min-w-0 space-y-1">
              <DialogTitle>Personalizar la ayuda</DialogTitle>
              <DialogDescription>
                Elegí aula, materiales y alumnos que el asistente tendrá en cuenta al redactar borradores.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>
        <div className="max-h-[min(52vh,420px)] space-y-5 overflow-y-auto overscroll-contain px-6 py-5 text-sm">
          <div className="space-y-2">
            <Label htmlFor="chat-context-classroom">Aula (opcional)</Label>
            <Select
              value={classroomId === "" ? noneSentinel : classroomId}
              onValueChange={(v) => onClassroomIdChange(v === noneSentinel ? "" : v)}
            >
              <SelectTrigger id="chat-context-classroom" className="w-full">
                <SelectValue placeholder="Sin aula" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={noneSentinel}>Sin aula</SelectItem>
                {classrooms.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-start gap-3 rounded-lg border border-foreground/10 bg-muted/25 p-3">
            <Checkbox
              id={omitId}
              checked={omitStudents}
              disabled={classroomId === ""}
              onCheckedChange={(v) => onOmitStudentsChange(v === true)}
            />
            <div className="min-w-0 space-y-0.5">
              <Label htmlFor={omitId} className="cursor-pointer font-medium leading-snug">
                Solo datos del aula
              </Label>
              <p className="text-xs leading-relaxed text-muted-foreground">
                No se envían fichas ni notas de alumnos al asistente.
              </p>
            </div>
          </div>

          {classroomId !== "" && !omitStudents && students.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-start gap-3 rounded-lg border border-foreground/10 bg-muted/25 p-3">
                <Checkbox
                  id={filterId}
                  checked={filterStudentsEnabled}
                  onCheckedChange={(v) => onFilterStudentsEnabledChange(v === true)}
                />
                <div className="min-w-0 space-y-0.5">
                  <Label htmlFor={filterId} className="cursor-pointer font-medium leading-snug">
                    Elegir alumnos específicos
                  </Label>
                  <p className="text-xs leading-relaxed text-muted-foreground">
                    Si no activás esta opción, se incluyen todos. Si no marcás ninguno con la opción activa, no se usa
                    información de alumnos.
                  </p>
                </div>
              </div>
              {filterStudentsEnabled && (
                <div className="max-h-36 space-y-2 overflow-y-auto rounded-lg border border-dashed border-foreground/15 p-3">
                  <p className="text-xs font-medium text-muted-foreground">Alumnos</p>
                  <div className="flex flex-wrap gap-x-3 gap-y-2">
                    {students.map((s) => {
                      const sid = `stu-${s.id}`;
                      return (
                        <label
                          key={s.id}
                          htmlFor={sid}
                          className="flex cursor-pointer items-center gap-2 text-xs"
                        >
                          <Checkbox
                            id={sid}
                            checked={selectedStudentIds.has(s.id)}
                            onCheckedChange={() => onToggleStudent(s.id)}
                          />
                          {s.name}
                        </label>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {classroomId !== "" && (
            <div className="space-y-2 rounded-lg border border-foreground/8 bg-background/60 p-3 text-xs text-muted-foreground">
              <p>
                <span className="font-medium text-foreground/80">Materiales:</span> {materialsCount}{" "}
                {materialsCount === 1 ? "disponible" : "disponibles"} en esta aula.
              </p>
              {curriculumSummary !== null && (
                <p className="leading-relaxed">
                  <span className="font-medium text-foreground/80">Programa:</span>{" "}
                  {curriculumSummary.programTitle}
                  {curriculumSummary.currentUnitLabel !== null
                    ? ` · Unidad: ${curriculumSummary.currentUnitLabel}`
                    : ""}
                </p>
              )}
            </div>
          )}
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="default">
              Listo
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
