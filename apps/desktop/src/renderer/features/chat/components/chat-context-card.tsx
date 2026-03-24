import type { ReactElement } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { ClassroomRow, StudentRow } from "@shared/types";

interface ChatContextCardProps {
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
}

export const ChatContextCard = ({
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
}: ChatContextCardProps): ReactElement => {
  return (
    <Card className="mb-4">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">Información para personalizar la ayuda</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        <div className="flex flex-wrap gap-4 items-end">
          <div className="space-y-1 min-w-[200px]">
            <Label>Aula (opcional)</Label>
            <Select
              value={classroomId === "" ? noneSentinel : classroomId}
              onValueChange={(v) => onClassroomIdChange(v === noneSentinel ? "" : v)}
            >
              <SelectTrigger>
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
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={omitStudents}
              onChange={(e) => onOmitStudentsChange(e.target.checked)}
              disabled={classroomId === ""}
            />
            Usar solo datos del aula (sin fichas de alumnos)
          </label>
        </div>
        {classroomId !== "" && !omitStudents && students.length > 0 && (
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={filterStudentsEnabled}
                onChange={(e) => onFilterStudentsEnabledChange(e.target.checked)}
              />
              Elegir alumnos específicos (si no, se incluyen todos)
            </label>
            {filterStudentsEnabled && (
              <>
                <p className="text-xs text-muted-foreground">
                  Solo se usarán los alumnos marcados. Si no marcás ninguno, no se toma
                  información de alumnos.
                </p>
                <div className="flex flex-wrap gap-2 max-h-28 overflow-y-auto border rounded-md p-2">
                  {students.map((s) => (
                    <label key={s.id} className="flex items-center gap-1 text-xs">
                      <input
                        type="checkbox"
                        checked={selectedStudentIds.has(s.id)}
                        onChange={() => onToggleStudent(s.id)}
                      />
                      {s.name}
                    </label>
                  ))}
                </div>
              </>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
