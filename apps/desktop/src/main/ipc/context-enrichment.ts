import { and, asc, desc, eq, inArray } from "drizzle-orm";
import { getDatabase } from "../db";
import * as schema from "../db/schema";

type Db = ReturnType<typeof getDatabase>;

export interface EnrichmentInput {
  classroomId?: string;
  studentIds?: string[];
  omitStudents?: boolean;
}

export interface EnrichedAgentContext {
  classroom: Record<string, unknown> | null;
  students: Array<Record<string, unknown>>;
}

const FEEDBACK_LIMIT = 8;
const NOTES_LIMIT = 12;

export const buildEnrichedAgentContext = async (
  db: Db,
  input: EnrichmentInput
): Promise<EnrichedAgentContext> => {
  const classroomId = input.classroomId?.trim() || undefined;
  const rawIds = input.studentIds;
  const explicitIds =
    Array.isArray(rawIds) ? rawIds.filter((id) => id.length > 0) : undefined;
  const omitStudents = input.omitStudents === true;

  if (
    classroomId === undefined &&
    (explicitIds === undefined || explicitIds.length === 0)
  ) {
    return { classroom: null, students: [] };
  }

  let classroomRow: typeof schema.classrooms.$inferSelect | null = null;
  if (classroomId !== undefined) {
    const rows = await db
      .select()
      .from(schema.classrooms)
      .where(eq(schema.classrooms.id, classroomId))
      .limit(1);
    classroomRow = rows[0] ?? null;
  }

  let studentRows: (typeof schema.students.$inferSelect)[] = [];
  if (!omitStudents) {
    if (explicitIds !== undefined) {
      if (explicitIds.length > 0) {
        studentRows = await db
          .select()
          .from(schema.students)
          .where(inArray(schema.students.id, explicitIds))
          .orderBy(asc(schema.students.name));
      }
    } else if (classroomId !== undefined) {
      studentRows = await db
        .select()
        .from(schema.students)
        .where(eq(schema.students.classroomId, classroomId))
        .orderBy(asc(schema.students.name));
    }
  }

  const students: Array<Record<string, unknown>> = [];

  for (const st of studentRows) {
    const profRows = await db
      .select()
      .from(schema.studentProfiles)
      .where(eq(schema.studentProfiles.studentId, st.id))
      .limit(1);
    const profile = profRows[0] ?? null;

    const feedbackClassroomId = classroomRow?.id ?? st.classroomId;
    const fb = await db
      .select()
      .from(schema.weeklyFeedback)
      .where(
        and(
          eq(schema.weeklyFeedback.studentId, st.id),
          eq(schema.weeklyFeedback.classroomId, feedbackClassroomId)
        )
      )
      .orderBy(desc(schema.weeklyFeedback.weekStart))
      .limit(FEEDBACK_LIMIT);
    const recentFeedback = fb.map((r) => ({
      weekStart: r.weekStart,
      indicators: r.indicators,
      observations: r.observations,
      aiSummary: r.aiSummary,
      teacherApproved: r.teacherApproved,
    }));

    let recentNotes: Array<Record<string, unknown>> = [];
    if (profile !== null) {
      const notes = await db
        .select()
        .from(schema.learningNotes)
        .where(eq(schema.learningNotes.studentProfileId, profile.id))
        .orderBy(desc(schema.learningNotes.createdAt))
        .limit(NOTES_LIMIT);
      recentNotes = notes.map((n) => ({
        observation: n.observation,
        category: n.category,
        createdAt: n.createdAt,
      }));
    }

    students.push({
      id: st.id,
      name: st.name,
      birthDate: st.birthDate,
      notes: st.notes,
      profile:
        profile === null
          ? null
          : {
              learningStyle: profile.learningStyle,
              strengths: profile.strengths,
              challenges: profile.challenges,
              accommodations: profile.accommodations,
            },
      recentFeedback,
      recentNotes,
    });
  }

  const classroom =
    classroomRow === null
      ? null
      : {
          id: classroomRow.id,
          name: classroomRow.name,
          grade: classroomRow.grade,
          shift: classroomRow.shift,
        };

  return { classroom, students };
};
