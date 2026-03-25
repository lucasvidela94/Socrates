import { useCallback, useEffect, useMemo, useState } from "react";
import { useClassroomStore } from "@/stores/classroom-store";
import type { ClassroomRow, CurriculumChatSummary, StudentRow } from "@shared/types";

const NONE = "__none";

export interface ChatClassroomContextValue {
  classrooms: ClassroomRow[];
  classroomId: string;
  setClassroomId: (id: string) => void;
  students: StudentRow[];
  omitStudents: boolean;
  setOmitStudents: (v: boolean) => void;
  filterStudentsEnabled: boolean;
  setFilterStudentsEnabled: (v: boolean) => void;
  selectedStudentIds: Set<string>;
  toggleStudent: (id: string) => void;
  chatContext: Record<string, unknown> | undefined;
  noneSentinel: typeof NONE;
  materialsCount: number;
  curriculumSummary: CurriculumChatSummary | null;
}

export const useChatClassroomContext = (): ChatClassroomContextValue => {
  const classrooms = useClassroomStore((s) => s.classrooms);
  const classroomId = useClassroomStore((s) => s.classroomId);
  const students = useClassroomStore((s) => s.students);
  const storeSetClassroomId = useClassroomStore((s) => s.setClassroomId);
  const fetchClassrooms = useClassroomStore((s) => s.fetchClassrooms);

  const [selectedStudentIds, setSelectedStudentIds] = useState<Set<string>>(new Set());
  const [omitStudents, setOmitStudents] = useState(false);
  const [filterStudentsEnabled, setFilterStudentsEnabled] = useState(false);
  const [materialsCount, setMaterialsCount] = useState(0);
  const [curriculumSummary, setCurriculumSummary] = useState<CurriculumChatSummary | null>(null);

  useEffect(() => {
    void fetchClassrooms();
  }, [fetchClassrooms]);

  useEffect(() => {
    setSelectedStudentIds(new Set(students.map((s) => s.id)));
    setFilterStudentsEnabled(false);
  }, [students]);

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      if (classroomId === "") {
        if (!cancelled) {
          setMaterialsCount(0);
          setCurriculumSummary(null);
        }
        return;
      }
      const rows = await window.electronAPI.materialsList(classroomId);
      const cur = await window.electronAPI.curriculumChatSummary(classroomId);
      if (!cancelled) {
        setMaterialsCount(rows.filter((row) => row.status === "ready").length);
        setCurriculumSummary(cur);
      }
    };
    void run();
    return () => {
      cancelled = true;
    };
  }, [classroomId]);

  const setClassroomId = useCallback(
    (id: string) => {
      void storeSetClassroomId(id);
    },
    [storeSetClassroomId]
  );

  const toggleStudent = useCallback((id: string) => {
    setSelectedStudentIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const chatContext = useMemo((): Record<string, unknown> | undefined => {
    const ctx: Record<string, unknown> = {};
    if (classroomId !== "") ctx.classroomId = classroomId;
    if (omitStudents) ctx.omitStudents = true;
    else if (filterStudentsEnabled) ctx.studentIds = Array.from(selectedStudentIds);
    return Object.keys(ctx).length > 0 ? ctx : undefined;
  }, [classroomId, omitStudents, filterStudentsEnabled, selectedStudentIds]);

  return {
    classrooms,
    classroomId,
    setClassroomId,
    students,
    omitStudents,
    setOmitStudents,
    filterStudentsEnabled,
    setFilterStudentsEnabled,
    selectedStudentIds,
    toggleStudent,
    chatContext,
    noneSentinel: NONE,
    materialsCount,
    curriculumSummary,
  };
};
