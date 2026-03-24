import { create } from "zustand";
import type { ClassroomRow, StudentRow } from "@shared/types";

interface ClassroomStoreState {
  classrooms: ClassroomRow[];
  classroomId: string;
  students: StudentRow[];
  loading: boolean;
}

interface ClassroomStoreActions {
  fetchClassrooms: () => Promise<void>;
  setClassroomId: (id: string) => Promise<void>;
  refreshStudents: () => Promise<void>;
}

type ClassroomStore = ClassroomStoreState & ClassroomStoreActions;

export const useClassroomStore = create<ClassroomStore>((set, get) => ({
  classrooms: [],
  classroomId: "",
  students: [],
  loading: false,

  fetchClassrooms: async () => {
    set({ loading: true });
    const list = await window.electronAPI.classroomsList();
    const current = get().classroomId;
    const stillValid = current !== "" && list.some((c) => c.id === current);
    set({
      classrooms: list,
      classroomId: stillValid ? current : "",
      students: stillValid ? get().students : [],
      loading: false,
    });
    if (!stillValid) {
      set({ students: [] });
    }
  },

  setClassroomId: async (id: string) => {
    if (id === get().classroomId) return;
    set({ classroomId: id });
    if (id === "") {
      set({ students: [] });
      return;
    }
    const list = await window.electronAPI.studentsListByClassroom(id);
    if (get().classroomId === id) {
      set({ students: list });
    }
  },

  refreshStudents: async () => {
    const id = get().classroomId;
    if (id === "") {
      set({ students: [] });
      return;
    }
    const list = await window.electronAPI.studentsListByClassroom(id);
    if (get().classroomId === id) {
      set({ students: list });
    }
  },
}));
