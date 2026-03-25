import { and, asc, desc, eq, inArray } from "drizzle-orm";
import { curriculumAgentPayload, loadCurriculumTree } from "../curriculum/curriculum-tree";
import { getDatabase } from "../db";
import * as schema from "../db/schema";

type Db = ReturnType<typeof getDatabase>;

export interface EnrichmentInput {
  classroomId?: string;
  studentIds?: string[];
  omitStudents?: boolean;
  userMessage?: string;
}

export interface EnrichedAgentContext {
  classroom: Record<string, unknown> | null;
  students: Array<Record<string, unknown>>;
  materials: Array<Record<string, unknown>>;
  curriculum: Record<string, unknown> | null;
}

const FEEDBACK_LIMIT = 8;
const NOTES_LIMIT = 12;
const MATERIALS_TOKEN_BUDGET = 6000;
const MATERIALS_MAX_CHUNKS = 40;

const tokenizeKeywords = (message: string): string[] => {
  return Array.from(
    new Set(
      message
        .toLowerCase()
        .split(/[^a-z0-9áéíóúñü]+/i)
        .map((v) => v.trim())
        .filter((v) => v.length >= 4)
    )
  ).slice(0, 20);
};

export const buildMaterialContext = async (
  db: Db,
  classroomId: string,
  userMessage?: string
): Promise<Array<Record<string, unknown>>> => {
  const materials = await db
    .select()
    .from(schema.materials)
    .where(
      and(
        eq(schema.materials.classroomId, classroomId),
        eq(schema.materials.status, "ready")
      )
    )
    .orderBy(desc(schema.materials.createdAt));

  if (materials.length === 0) return [];

  const materialIds = materials.map((m) => m.id);
  const chunkRows = await db
    .select()
    .from(schema.materialChunks)
    .where(inArray(schema.materialChunks.materialId, materialIds))
    .orderBy(asc(schema.materialChunks.chunkIndex));

  const keywords = userMessage ? tokenizeKeywords(userMessage) : [];

  const ranked = chunkRows
    .map((chunk) => {
      const text = chunk.content.toLowerCase();
      const score = keywords.reduce((acc, kw) => (text.includes(kw) ? acc + 1 : acc), 0);
      return { chunk, score };
    })
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return a.chunk.chunkIndex - b.chunk.chunkIndex;
    });

  let usedTokens = 0;
  const selectedByMaterial = new Map<string, typeof chunkRows>();

  for (const { chunk } of ranked) {
    const tokenEstimate = chunk.tokenEstimate ?? Math.ceil(chunk.content.length / 4);
    if (usedTokens + tokenEstimate > MATERIALS_TOKEN_BUDGET) continue;
    usedTokens += tokenEstimate;
    const list = selectedByMaterial.get(chunk.materialId) ?? [];
    list.push(chunk);
    selectedByMaterial.set(chunk.materialId, list);
    if (Array.from(selectedByMaterial.values()).reduce((acc, chunks) => acc + chunks.length, 0) >= MATERIALS_MAX_CHUNKS) {
      break;
    }
  }

  const materialContext = materials
    .map((material) => {
      const chunks = (selectedByMaterial.get(material.id) ?? []).sort(
        (a, b) => a.chunkIndex - b.chunkIndex
      );
      if (chunks.length === 0) return null;
      return {
        id: material.id,
        title: material.title,
        subject: material.subject,
        status: material.status,
        chunks: chunks.map((chunk) => ({
          chunkIndex: chunk.chunkIndex,
          content: chunk.content,
          tokenEstimate: chunk.tokenEstimate,
          pageNumber: chunk.pageNumber,
        })),
      };
    })
    .filter((item) => item !== null);

  return materialContext as Array<Record<string, unknown>>;
};

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
    return { classroom: null, students: [], materials: [], curriculum: null };
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

  const materials =
    classroomRow === null ? [] : await buildMaterialContext(db, classroomRow.id, input.userMessage);

  let curriculum: Record<string, unknown> | null = null;
  if (classroomRow !== null) {
    const tree = await loadCurriculumTree(db, classroomRow.id);
    if (tree !== null) {
      curriculum = curriculumAgentPayload(tree);
    }
  }

  return { classroom, students, materials, curriculum };
};
