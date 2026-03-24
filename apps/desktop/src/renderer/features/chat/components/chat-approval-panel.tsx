import type { ReactElement } from "react";
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
import type { StudentRow } from "@shared/types";
import { Loader2 } from "lucide-react";

interface ChatApprovalPanelProps {
  approveTitle: string;
  onApproveTitleChange: (v: string) => void;
  recordLearningNote: boolean;
  onRecordLearningNoteChange: (v: boolean) => void;
  students: StudentRow[];
  noteStudentId: string;
  onNoteStudentIdChange: (v: string) => void;
  savingDoc: boolean;
  onSave: () => void;
  onCancel: () => void;
}

export const ChatApprovalPanel = ({
  approveTitle,
  onApproveTitleChange,
  recordLearningNote,
  onRecordLearningNoteChange,
  students,
  noteStudentId,
  onNoteStudentIdChange,
  savingDoc,
  onSave,
  onCancel,
}: ChatApprovalPanelProps): ReactElement => {
  return (
    <Card className="mt-4 border-primary/30">
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Revisar propuesta</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="space-y-1">
          <Label htmlFor="doctitle">Título del documento</Label>
          <Input
            id="doctitle"
            value={approveTitle}
            onChange={(e) => onApproveTitleChange(e.target.value)}
          />
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={recordLearningNote}
            onChange={(e) => onRecordLearningNoteChange(e.target.checked)}
          />
          Registrar resumen en la ficha de un alumno
        </label>
        {recordLearningNote && students.length > 0 && (
          <div className="space-y-1">
            <Label>Alumno</Label>
            <Select value={noteStudentId} onValueChange={onNoteStudentIdChange}>
              <SelectTrigger>
                <SelectValue placeholder="Elegir" />
              </SelectTrigger>
              <SelectContent>
                {students.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
        <div className="flex flex-wrap gap-2">
          <Button onClick={onSave} disabled={savingDoc}>
            {savingDoc ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Guardar en documentos
          </Button>
          <Button variant="ghost" onClick={onCancel}>
            Cancelar
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
