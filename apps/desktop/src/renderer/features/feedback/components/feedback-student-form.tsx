import type { ReactElement } from "react";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { StudentRow } from "@shared/types";
import { CheckCircle2, Loader2, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

export const FEEDBACK_AREAS = ["lectura", "escritura", "matemática", "ciencias", "convivencia"] as const;
const INDICATOR_VALUES = ["__none", "mejoró", "igual", "retrocedió"] as const;

export type FeedbackDraftSlice = {
  indicators: Record<string, string>;
  observations: string;
  aiSummary: string;
  teacherApproved: boolean;
};

interface FeedbackStudentFormProps {
  student: StudentRow;
  draft: FeedbackDraftSlice;
  saving: boolean;
  generating: boolean;
  onIndicatorChange: (area: string, value: string) => void;
  onObservationsChange: (text: string) => void;
  onSummaryChange: (text: string) => void;
  onMarkAsReadyChange: (ready: boolean) => void;
  onGenerateSummary: () => void;
  onSave: () => void;
}

export const FeedbackStudentForm = ({
  student,
  draft,
  saving,
  generating,
  onIndicatorChange,
  onObservationsChange,
  onSummaryChange,
  onMarkAsReadyChange,
  onGenerateSummary,
  onSave,
}: FeedbackStudentFormProps): ReactElement => {
  const readyId = `feedback-ready-${student.id}`;

  return (
    <Card className="overflow-hidden border-border/80 shadow-sm">
      <CardHeader className="border-b border-border/60 bg-muted/20 pb-4">
        <CardTitle className="text-lg font-semibold tracking-tight">{student.name}</CardTitle>
        <p className="text-xs font-normal leading-relaxed text-muted-foreground">
          Completá los indicadores y observaciones, pedí un resumen si querés ayuda con el texto, y guardá.
          Marcá como lista cuando el borrador te cierre para esta semana.
        </p>
      </CardHeader>

      <CardContent className="space-y-6 pt-6">
        <section className="space-y-3" aria-labelledby="fb-ind-label">
          <h3 id="fb-ind-label" className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
            Indicadores por área
          </h3>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {FEEDBACK_AREAS.map((area) => (
              <div key={area} className="space-y-1.5">
                <Label className="capitalize text-foreground/90">{area}</Label>
                <Select
                  value={draft.indicators[area] === "" ? "__none" : draft.indicators[area]}
                  onValueChange={(v) => onIndicatorChange(area, v)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Sin cargar" />
                  </SelectTrigger>
                  <SelectContent>
                    {INDICATOR_VALUES.map((opt) => (
                      <SelectItem key={opt} value={opt}>
                        {opt === "__none" ? "Sin cargar" : opt}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ))}
          </div>
        </section>

        <Separator className="bg-border/70" />

        <section className="space-y-2" aria-labelledby="fb-obs-label">
          <h3 id="fb-obs-label" className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
            Tus observaciones
          </h3>
          <textarea
            className={cn(
              "flex min-h-[88px] w-full rounded-md border border-input bg-background px-3 py-2.5 text-sm",
              "placeholder:text-muted-foreground/70 shadow-sm",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            )}
            placeholder="Qué notaste esta semana en el aula con este alumno…"
            value={draft.observations}
            onChange={(e) => onObservationsChange(e.target.value)}
          />
        </section>

        <Separator className="bg-border/70" />

        <section className="space-y-3" aria-labelledby="fb-ai-label">
          <div className="space-y-1">
            <h3 id="fb-ai-label" className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
              Resumen con IA
            </h3>
            <p className="text-xs leading-relaxed text-muted-foreground">
              Genera un texto breve a partir de los indicadores y observaciones. Podés editarlo después.
            </p>
          </div>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            className="w-full sm:w-auto"
            onClick={onGenerateSummary}
            disabled={generating}
          >
            {generating ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="h-4 w-4" />
            )}
            {generating ? "Generando…" : "Sugerir resumen con IA"}
          </Button>
          <div className="space-y-1.5">
            <Label htmlFor={`fb-summary-${student.id}`} className="text-foreground/90">
              Texto del resumen
            </Label>
            <textarea
              id={`fb-summary-${student.id}`}
              className={cn(
                "flex min-h-[88px] w-full rounded-md border border-input bg-background px-3 py-2.5 text-sm",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              )}
              value={draft.aiSummary}
              onChange={(e) => onSummaryChange(e.target.value)}
            />
          </div>
        </section>

        <Separator className="bg-border/70" />

        <section
          className="flex gap-3 rounded-lg border border-border/60 bg-muted/15 p-4"
          aria-labelledby={readyId}
        >
          <Checkbox
            id={readyId}
            checked={draft.teacherApproved}
            onCheckedChange={(v) => onMarkAsReadyChange(v === true)}
            className="mt-0.5"
          />
          <div className="min-w-0 space-y-1">
            <Label htmlFor={readyId} className="cursor-pointer text-sm font-medium leading-snug">
              Devolución lista para esta semana
            </Label>
            <p id={`${readyId}-desc`} className="text-xs leading-relaxed text-muted-foreground">
              Activá esto cuando el contenido te parece listo. El asistente puede darle más peso a las
              devoluciones marcadas como lista, y acá ves en la columna izquierda quién ya cerró la semana.
            </p>
          </div>
        </section>
      </CardContent>

      <CardFooter className="flex flex-col gap-2 border-t border-border/60 bg-muted/10 pb-6 pt-4 sm:flex-row sm:justify-end">
        <Button
          type="button"
          size="default"
          className="w-full sm:w-auto"
          disabled={saving}
          onClick={onSave}
        >
          {saving ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <CheckCircle2 className="h-4 w-4" />
          )}
          {saving ? "Guardando…" : "Guardar devolución"}
        </Button>
      </CardFooter>
    </Card>
  );
};
