import { ipcMain, type IpcMainInvokeEvent } from "electron";
import { and, asc, eq } from "drizzle-orm";
import { IPC_CHANNELS } from "../../../shared/channels";
import { getDatabase, schema } from "../../db";
import type {
  ClassroomInput,
  StudentInput,
  StudentProfileInput,
  LearningNoteInput,
} from "../../../shared/types";

const ensureTeacher = async (): Promise<string> => {
  const db = getDatabase();
  const existing = await db.select().from(schema.teachers).limit(1);
  if (existing.length > 0) return existing[0].id;
  const [t] = await db.insert(schema.teachers).values({ name: "Docente" }).returning();
  return t.id;
};

const ensureProfile = async (studentId: string) => {
  const db = getDatabase();
  const rows = await db
    .select()
    .from(schema.studentProfiles)
    .where(eq(schema.studentProfiles.studentId, studentId))
    .limit(1);
  if (rows.length > 0) return rows[0];
  const [p] = await db
    .insert(schema.studentProfiles)
    .values({ studentId })
    .returning();
  return p;
};

export const registerStudentsHandlers = (): void => {
  ipcMain.handle(IPC_CHANNELS.CLASSROOMS_LIST, async (_event: IpcMainInvokeEvent) => {
    const db = getDatabase();
    return db.select().from(schema.classrooms).orderBy(asc(schema.classrooms.name));
  });

  ipcMain.handle(
    IPC_CHANNELS.CLASSROOM_CREATE,
    async (_event: IpcMainInvokeEvent, input: ClassroomInput) => {
      const db = getDatabase();
      const teacherId = await ensureTeacher();
      const [row] = await db
        .insert(schema.classrooms)
        .values({
          name: input.name,
          grade: input.grade,
          shift: input.shift,
          teacherId,
        })
        .returning();
      return row;
    }
  );

  ipcMain.handle(
    IPC_CHANNELS.CLASSROOM_UPDATE,
    async (_event: IpcMainInvokeEvent, id: string, input: ClassroomInput) => {
      const db = getDatabase();
      const [row] = await db
        .update(schema.classrooms)
        .set({
          name: input.name,
          grade: input.grade,
          shift: input.shift,
        })
        .where(eq(schema.classrooms.id, id))
        .returning();
      return row;
    }
  );

  ipcMain.handle(IPC_CHANNELS.CLASSROOM_DELETE, async (_event: IpcMainInvokeEvent, id: string) => {
    const db = getDatabase();
    await db.delete(schema.classrooms).where(eq(schema.classrooms.id, id));
  });

  ipcMain.handle(
    IPC_CHANNELS.STUDENTS_LIST_BY_CLASSROOM,
    async (_event: IpcMainInvokeEvent, classroomId: string) => {
      const db = getDatabase();
      return db
        .select()
        .from(schema.students)
        .where(eq(schema.students.classroomId, classroomId))
        .orderBy(asc(schema.students.name));
    }
  );

  ipcMain.handle(IPC_CHANNELS.STUDENT_GET, async (_event: IpcMainInvokeEvent, studentId: string) => {
    const db = getDatabase();
    const students = await db
      .select()
      .from(schema.students)
      .where(eq(schema.students.id, studentId))
      .limit(1);
    if (students.length === 0) return null;
    const student = students[0];
    const profile = await ensureProfile(studentId);
    return { student, profile };
  });

  ipcMain.handle(
    IPC_CHANNELS.STUDENT_CREATE,
    async (_event: IpcMainInvokeEvent, input: StudentInput) => {
      const db = getDatabase();
      const [row] = await db
        .insert(schema.students)
        .values({
          name: input.name,
          birthDate: input.birthDate ?? null,
          classroomId: input.classroomId,
          notes: input.notes ?? null,
        })
        .returning();
      await ensureProfile(row.id);
      return row;
    }
  );

  ipcMain.handle(
    IPC_CHANNELS.STUDENT_UPDATE,
    async (_event: IpcMainInvokeEvent, id: string, input: StudentInput) => {
      const db = getDatabase();
      const [row] = await db
        .update(schema.students)
        .set({
          name: input.name,
          birthDate: input.birthDate ?? null,
          classroomId: input.classroomId,
          notes: input.notes ?? null,
        })
        .where(eq(schema.students.id, id))
        .returning();
      return row;
    }
  );

  ipcMain.handle(IPC_CHANNELS.STUDENT_DELETE, async (_event: IpcMainInvokeEvent, id: string) => {
    const db = getDatabase();
    await db.delete(schema.students).where(eq(schema.students.id, id));
  });

  ipcMain.handle(
    IPC_CHANNELS.PROFILE_UPSERT,
    async (_event: IpcMainInvokeEvent, studentId: string, input: StudentProfileInput) => {
      const db = getDatabase();
      const existing = await db
        .select()
        .from(schema.studentProfiles)
        .where(eq(schema.studentProfiles.studentId, studentId))
        .limit(1);
      if (existing.length > 0) {
        const [row] = await db
          .update(schema.studentProfiles)
          .set({
            learningStyle: input.learningStyle ?? null,
            strengths: input.strengths ?? null,
            challenges: input.challenges ?? null,
            accommodations: input.accommodations ?? null,
            updatedAt: new Date(),
          })
          .where(eq(schema.studentProfiles.id, existing[0].id))
          .returning();
        return row;
      }
      const [row] = await db
        .insert(schema.studentProfiles)
        .values({
          studentId,
          learningStyle: input.learningStyle ?? null,
          strengths: input.strengths ?? null,
          challenges: input.challenges ?? null,
          accommodations: input.accommodations ?? null,
        })
        .returning();
      return row;
    }
  );

  ipcMain.handle(
    IPC_CHANNELS.LEARNING_NOTES_LIST_BY_STUDENT,
    async (_event: IpcMainInvokeEvent, studentId: string) => {
      const db = getDatabase();
      const profile = await ensureProfile(studentId);
      return db
        .select()
        .from(schema.learningNotes)
        .where(eq(schema.learningNotes.studentProfileId, profile.id))
        .orderBy(asc(schema.learningNotes.createdAt));
    }
  );

  ipcMain.handle(
    IPC_CHANNELS.LEARNING_NOTE_ADD,
    async (_event: IpcMainInvokeEvent, studentId: string, input: LearningNoteInput) => {
      const db = getDatabase();
      const profile = await ensureProfile(studentId);
      const [row] = await db
        .insert(schema.learningNotes)
        .values({
          studentProfileId: profile.id,
          observation: input.observation,
          category: input.category,
        })
        .returning();
      return row;
    }
  );
};
