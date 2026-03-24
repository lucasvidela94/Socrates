import { useCallback, useEffect, useMemo, useState } from "react";
import { useClassroomStore } from "@/stores/classroom-store";
import type { ClassroomRow, StudentRow } from "@shared/types";

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

  useEffect(() => {
    void fetchClassrooms();
  }, [fetchClassrooms]);

  useEffect(() => {
    setSelectedStudentIds(new Set(students.map((s) => s.id)));
    setFilterStudentsEnabled(false);
  }, [students]);

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
  };
};
