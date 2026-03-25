import { useCallback, useState } from "react";
import { toast } from "sonner";
import type { StudentRow } from "@shared/types";
import {
  FEEDBACK_AREAS,
  type FeedbackDraftSlice,
} from "../components/feedback-student-form";

export function useWeeklyFeedbackDraft(
  classroomId: string,
  weekStart: string,
  students: StudentRow[]
) {
  const [draft, setDraft] = useState<Record<string, FeedbackDraftSlice>>({});
  const [loading, setLoading] = useState(false);
  const [genId, setGenId] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);

  const loadWeek = useCallback(async () => {
    if (classroomId === "") return;
    setLoading(true);
    try {
      const fb = await window.electronAPI.feedbackListByWeek(classroomId, weekStart);
      const next: Record<string, FeedbackDraftSlice> = {};
      for (const s of students) {
        const existing = fb.find((r) => r.studentId === s.id);
        const ind: Record<string, string> = {};
        for (const a of FEEDBACK_AREAS) {
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

  const setInd = (studentId: string, area: string, value: string) => {
    const stored = value === "__none" ? "" : value;
    setDraft((prev) => {
      const row = prev[studentId];
      if (row === undefined) return prev;
      return {
        ...prev,
        [studentId]: {
          ...row,
          indicators: { ...row.indicators, [area]: stored },
        },
      };
    });
  };

  const setObs = (studentId: string, text: string) => {
    setDraft((prev) => {
      const row = prev[studentId];
      if (row === undefined) return prev;
      return { ...prev, [studentId]: { ...row, observations: text } };
    });
  };

  const setAi = (studentId: string, text: string) => {
    setDraft((prev) => {
      const row = prev[studentId];
      if (row === undefined) return prev;
      return { ...prev, [studentId]: { ...row, aiSummary: text } };
    });
  };

  const setApproved = (studentId: string, v: boolean) => {
    setDraft((prev) => {
      const row = prev[studentId];
      if (row === undefined) return prev;
      return { ...prev, [studentId]: { ...row, teacherApproved: v } };
    });
  };

  const handleSave = async (studentId: string) => {
    const d = draft[studentId];
    if (d === undefined || classroomId === "") return;
    const indicators: Record<string, string> = {};
    for (const a of FEEDBACK_AREAS) {
      const v = d.indicators[a];
      if (v !== undefined && v !== "") indicators[a] = v;
    }
    setSavingId(studentId);
    try {
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
      toast.success("Devolución guardada", {
        description: "Los datos de esta semana quedaron registrados.",
      });
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Probá de nuevo en unos segundos.";
      toast.error("No se pudo guardar", { description: msg });
    } finally {
      setSavingId(null);
    }
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
        for (const a of FEEDBACK_AREAS) {
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
        toast.success("Resumen listo", {
          description: "Revisá y editá el texto abajo antes de guardar.",
        });
      } else {
        toast.error("No se pudo generar el resumen", { description: res.error });
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Error inesperado.";
      toast.error("No se pudo generar el resumen", { description: msg });
    } finally {
      setGenId(null);
    }
  };

  return {
    draft,
    loading,
    loadWeek,
    setInd,
    setObs,
    setAi,
    setApproved,
    handleSave,
    handleGenerate,
    savingId,
    genId,
  };
}
