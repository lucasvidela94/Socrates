import { asc, eq } from "drizzle-orm";
import * as schema from "../db/schema";

type Db = ReturnType<typeof import("../db").getDatabase>;

export type CurriculumTopicRow = typeof schema.curriculumTopics.$inferSelect;
export type CurriculumUnitRow = typeof schema.curriculumUnits.$inferSelect;
export type CurriculumSubjectRow = typeof schema.curriculumSubjects.$inferSelect;
export type CurriculumRow = typeof schema.curricula.$inferSelect;

export type CurriculumUnitNode = CurriculumUnitRow & { topics: CurriculumTopicRow[] };
export type CurriculumSubjectNode = CurriculumSubjectRow & { units: CurriculumUnitNode[] };

export type CurriculumTree = {
  curriculum: CurriculumRow;
  subjects: CurriculumSubjectNode[];
};

function isoTodayLocal(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function dateStr(v: string | Date | null | undefined): string | null {
  if (v === null || v === undefined) return null;
  if (typeof v === "string") return v.slice(0, 10);
  const y = v.getFullYear();
  const m = String(v.getMonth() + 1).padStart(2, "0");
  const day = String(v.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export async function loadCurriculumTree(db: Db, classroomId: string): Promise<CurriculumTree | null> {
  const curRows = await db
    .select()
    .from(schema.curricula)
    .where(eq(schema.curricula.classroomId, classroomId))
    .limit(1);
  const curriculum = curRows[0];
  if (curriculum === undefined) return null;

  const subjects = await db
    .select()
    .from(schema.curriculumSubjects)
    .where(eq(schema.curriculumSubjects.curriculumId, curriculum.id))
    .orderBy(asc(schema.curriculumSubjects.sortOrder));

  const subjectNodes: CurriculumSubjectNode[] = [];
  for (const s of subjects) {
    const units = await db
      .select()
      .from(schema.curriculumUnits)
      .where(eq(schema.curriculumUnits.subjectId, s.id))
      .orderBy(asc(schema.curriculumUnits.sortOrder));

    const unitNodes: CurriculumUnitNode[] = [];
    for (const u of units) {
      const topics = await db
        .select()
        .from(schema.curriculumTopics)
        .where(eq(schema.curriculumTopics.unitId, u.id))
        .orderBy(asc(schema.curriculumTopics.sortOrder));
      unitNodes.push({ ...u, topics });
    }
    subjectNodes.push({ ...s, units: unitNodes });
  }

  return { curriculum, subjects: subjectNodes };
}

export function pickCurrentUnitWithTopics(
  tree: CurriculumTree
): { subjectName: string; unit: CurriculumUnitNode } | null {
  const today = isoTodayLocal();

  for (const subj of tree.subjects) {
    const inProg = subj.units.find((u) => u.status === "in_progress");
    if (inProg !== undefined) return { subjectName: subj.name, unit: inProg };
  }

  for (const subj of tree.subjects) {
    for (const u of subj.units) {
      const start = dateStr(u.startDate);
      const end = dateStr(u.endDate);
      if (start !== null && end !== null && start <= today && end >= today) {
        return { subjectName: subj.name, unit: u };
      }
    }
  }

  for (const subj of tree.subjects) {
    const upcoming = subj.units.find((u) => u.status === "upcoming");
    if (upcoming !== undefined) return { subjectName: subj.name, unit: upcoming };
  }

  const firstSubj = tree.subjects[0];
  if (firstSubj !== undefined && firstSubj.units.length > 0) {
    return { subjectName: firstSubj.name, unit: firstSubj.units[0] };
  }

  return null;
}

export function curriculumAgentPayload(tree: CurriculumTree): Record<string, unknown> {
  const pos = pickCurrentUnitWithTopics(tree);
  const c = tree.curriculum;
  const topicNames = pos?.unit.topics.map((t) => t.name) ?? [];
  const start = pos ? dateStr(pos.unit.startDate) : null;
  const end = pos ? dateStr(pos.unit.endDate) : null;
  const dateRange =
    start !== null && end !== null ? `${start} a ${end}` : start ?? end ?? "";

  return {
    title: c.title,
    year: c.year,
    description: c.description,
    currentSubjectName: pos?.subjectName ?? null,
    currentUnit: pos
      ? {
          name: pos.unit.name,
          objectives: pos.unit.objectives,
          startDate: start,
          endDate: end,
          status: pos.unit.status,
          dateRangeLabel: dateRange,
        }
      : null,
    currentTopicNames: topicNames,
  };
}

export function curriculumUiSummary(tree: CurriculumTree): {
  programTitle: string;
  currentUnitLabel: string | null;
} {
  const pos = pickCurrentUnitWithTopics(tree);
  const title = tree.curriculum.title.trim() !== "" ? tree.curriculum.title : "Programa anual";
  if (pos === null) return { programTitle: title, currentUnitLabel: null };
  return {
    programTitle: title,
    currentUnitLabel: `${pos.subjectName} › ${pos.unit.name}`,
  };
}
