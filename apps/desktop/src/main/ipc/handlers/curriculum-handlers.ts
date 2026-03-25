import { ipcMain, type IpcMainInvokeEvent } from "electron";
import { asc, eq } from "drizzle-orm";
import { IPC_CHANNELS } from "../../../shared/channels";
import { getDatabase, schema } from "../../db";
import { getSidecarClient } from "../../sidecar";
import { loadCurriculumTree, curriculumUiSummary } from "../../curriculum/curriculum-tree";

const ensureTeacher = async (): Promise<string> => {
  const db = getDatabase();
  const existing = await db.select().from(schema.teachers).limit(1);
  if (existing.length > 0) return existing[0].id;
  const [t] = await db.insert(schema.teachers).values({ name: "Docente" }).returning();
  return t.id;
};

function stripLlmJson(raw: string): string {
  let t = raw.trim();
  if (t.startsWith("```")) {
    t = t.replace(/^```(?:json)?\s*/i, "");
    t = t.replace(/\s*```$/, "");
  }
  return t.trim();
}

type ImportTopic = { name: string; description: string | null };
type ImportUnit = {
  name?: string;
  description?: string | null;
  objectives?: string | null;
  topics?: unknown[];
};
type ImportSubject = { name?: string; units?: ImportUnit[] };

function normalizeTopics(topics: unknown[] | undefined): ImportTopic[] {
  if (!Array.isArray(topics)) return [];
  return topics
    .map((item, i) => {
      if (typeof item === "string") {
        const name = item.trim();
        return name.length > 0 ? { name, description: null } : null;
      }
      if (item !== null && typeof item === "object" && "name" in item) {
        const o = item as Record<string, unknown>;
        const name = String(o.name ?? "").trim();
        if (name.length === 0) return null;
        const desc = o.description;
        return {
          name,
          description: desc !== null && desc !== undefined ? String(desc) : null,
        };
      }
      return { name: `Tema ${i + 1}`, description: null };
    })
    .filter((x): x is ImportTopic => x !== null);
}

export const registerCurriculumHandlers = (): void => {
  ipcMain.handle(
    IPC_CHANNELS.CURRICULUM_TREE_GET,
    async (_event: IpcMainInvokeEvent, classroomId: string) => {
      const db = getDatabase();
      return loadCurriculumTree(db, classroomId);
    }
  );

  ipcMain.handle(
    IPC_CHANNELS.CURRICULUM_CHAT_SUMMARY,
    async (_event: IpcMainInvokeEvent, classroomId: string) => {
      const db = getDatabase();
      const tree = await loadCurriculumTree(db, classroomId);
      if (tree === null) return null;
      return curriculumUiSummary(tree);
    }
  );

  ipcMain.handle(
    IPC_CHANNELS.CURRICULUM_CREATE,
    async (
      _event: IpcMainInvokeEvent,
      classroomId: string,
      input: { title?: string; year?: number | null; description?: string | null }
    ) => {
      const db = getDatabase();
      const teacherId = await ensureTeacher();
      const existing = await db
        .select()
        .from(schema.curricula)
        .where(eq(schema.curricula.classroomId, classroomId))
        .limit(1);
      if (existing.length > 0) {
        throw new Error("Este aula ya tiene un programa anual");
      }
      const [row] = await db
        .insert(schema.curricula)
        .values({
          classroomId,
          teacherId,
          title: input.title?.trim() ?? "",
          year: input.year ?? null,
          description: input.description?.trim() ?? null,
        })
        .returning();
      return row;
    }
  );

  ipcMain.handle(
    IPC_CHANNELS.CURRICULUM_UPDATE,
    async (
      _event: IpcMainInvokeEvent,
      curriculumId: string,
      input: { title?: string; year?: number | null; description?: string | null }
    ) => {
      const db = getDatabase();
      const patch: Partial<typeof schema.curricula.$inferInsert> & { updatedAt: Date } = {
        updatedAt: new Date(),
      };
      if (input.title !== undefined) patch.title = input.title;
      if (input.year !== undefined) patch.year = input.year;
      if (input.description !== undefined) patch.description = input.description;
      const [row] = await db
        .update(schema.curricula)
        .set(patch)
        .where(eq(schema.curricula.id, curriculumId))
        .returning();
      return row ?? null;
    }
  );

  ipcMain.handle(IPC_CHANNELS.CURRICULUM_DELETE, async (_event: IpcMainInvokeEvent, curriculumId: string) => {
    const db = getDatabase();
    await db.delete(schema.curricula).where(eq(schema.curricula.id, curriculumId));
  });

  ipcMain.handle(
    IPC_CHANNELS.CURRICULUM_SUBJECT_CREATE,
    async (_event: IpcMainInvokeEvent, curriculumId: string, name: string) => {
      const db = getDatabase();
      const last = await db
        .select()
        .from(schema.curriculumSubjects)
        .where(eq(schema.curriculumSubjects.curriculumId, curriculumId))
        .orderBy(asc(schema.curriculumSubjects.sortOrder));
      const nextOrder = last.length > 0 ? (last[last.length - 1]?.sortOrder ?? 0) + 1 : 0;
      const [row] = await db
        .insert(schema.curriculumSubjects)
        .values({ curriculumId, name: name.trim(), sortOrder: nextOrder })
        .returning();
      return row;
    }
  );

  ipcMain.handle(
    IPC_CHANNELS.CURRICULUM_SUBJECT_UPDATE,
    async (_event: IpcMainInvokeEvent, subjectId: string, input: { name?: string; sortOrder?: number }) => {
      const db = getDatabase();
      const patch: Partial<typeof schema.curriculumSubjects.$inferInsert> = {};
      if (input.name !== undefined) patch.name = input.name.trim();
      if (input.sortOrder !== undefined) patch.sortOrder = input.sortOrder;
      const [row] = await db
        .update(schema.curriculumSubjects)
        .set(patch)
        .where(eq(schema.curriculumSubjects.id, subjectId))
        .returning();
      return row ?? null;
    }
  );

  ipcMain.handle(IPC_CHANNELS.CURRICULUM_SUBJECT_DELETE, async (_event: IpcMainInvokeEvent, subjectId: string) => {
    const db = getDatabase();
    await db.delete(schema.curriculumSubjects).where(eq(schema.curriculumSubjects.id, subjectId));
  });

  ipcMain.handle(
    IPC_CHANNELS.CURRICULUM_UNIT_CREATE,
    async (
      _event: IpcMainInvokeEvent,
      subjectId: string,
      input: {
        name: string;
        description?: string | null;
        objectives?: string | null;
        startDate?: string | null;
        endDate?: string | null;
        status?: string;
      }
    ) => {
      const db = getDatabase();
      const last = await db
        .select()
        .from(schema.curriculumUnits)
        .where(eq(schema.curriculumUnits.subjectId, subjectId))
        .orderBy(asc(schema.curriculumUnits.sortOrder));
      const nextOrder = last.length > 0 ? (last[last.length - 1]?.sortOrder ?? 0) + 1 : 0;
      const [row] = await db
        .insert(schema.curriculumUnits)
        .values({
          subjectId,
          name: input.name.trim(),
          description: input.description?.trim() ?? null,
          objectives: input.objectives?.trim() ?? null,
          startDate: input.startDate ?? null,
          endDate: input.endDate ?? null,
          status: input.status ?? "upcoming",
          sortOrder: nextOrder,
        })
        .returning();
      return row;
    }
  );

  ipcMain.handle(
    IPC_CHANNELS.CURRICULUM_UNIT_UPDATE,
    async (
      _event: IpcMainInvokeEvent,
      unitId: string,
      input: {
        name?: string;
        description?: string | null;
        objectives?: string | null;
        startDate?: string | null;
        endDate?: string | null;
        status?: string;
        sortOrder?: number;
      }
    ) => {
      const db = getDatabase();
      const patch: Partial<typeof schema.curriculumUnits.$inferInsert> = {};
      if (input.name !== undefined) patch.name = input.name.trim();
      if (input.description !== undefined) patch.description = input.description?.trim() ?? null;
      if (input.objectives !== undefined) patch.objectives = input.objectives?.trim() ?? null;
      if (input.startDate !== undefined) patch.startDate = input.startDate;
      if (input.endDate !== undefined) patch.endDate = input.endDate;
      if (input.status !== undefined) patch.status = input.status;
      if (input.sortOrder !== undefined) patch.sortOrder = input.sortOrder;
      const [row] = await db
        .update(schema.curriculumUnits)
        .set(patch)
        .where(eq(schema.curriculumUnits.id, unitId))
        .returning();
      return row ?? null;
    }
  );

  ipcMain.handle(IPC_CHANNELS.CURRICULUM_UNIT_DELETE, async (_event: IpcMainInvokeEvent, unitId: string) => {
    const db = getDatabase();
    await db.delete(schema.curriculumUnits).where(eq(schema.curriculumUnits.id, unitId));
  });

  ipcMain.handle(
    IPC_CHANNELS.CURRICULUM_TOPIC_CREATE,
    async (_event: IpcMainInvokeEvent, unitId: string, name: string) => {
      const db = getDatabase();
      const last = await db
        .select()
        .from(schema.curriculumTopics)
        .where(eq(schema.curriculumTopics.unitId, unitId))
        .orderBy(asc(schema.curriculumTopics.sortOrder));
      const nextOrder = last.length > 0 ? (last[last.length - 1]?.sortOrder ?? 0) + 1 : 0;
      const [row] = await db
        .insert(schema.curriculumTopics)
        .values({ unitId, name: name.trim(), sortOrder: nextOrder })
        .returning();
      return row;
    }
  );

  ipcMain.handle(
    IPC_CHANNELS.CURRICULUM_TOPIC_UPDATE,
    async (
      _event: IpcMainInvokeEvent,
      topicId: string,
      input: { name?: string; description?: string | null; sortOrder?: number }
    ) => {
      const db = getDatabase();
      const patch: Partial<typeof schema.curriculumTopics.$inferInsert> = {};
      if (input.name !== undefined) patch.name = input.name.trim();
      if (input.description !== undefined) patch.description = input.description?.trim() ?? null;
      if (input.sortOrder !== undefined) patch.sortOrder = input.sortOrder;
      const [row] = await db
        .update(schema.curriculumTopics)
        .set(patch)
        .where(eq(schema.curriculumTopics.id, topicId))
        .returning();
      return row ?? null;
    }
  );

  ipcMain.handle(IPC_CHANNELS.CURRICULUM_TOPIC_DELETE, async (_event: IpcMainInvokeEvent, topicId: string) => {
    const db = getDatabase();
    await db.delete(schema.curriculumTopics).where(eq(schema.curriculumTopics.id, topicId));
  });

  ipcMain.handle(
    IPC_CHANNELS.CURRICULUM_IMPORT,
    async (_event: IpcMainInvokeEvent, classroomId: string, rawText: string) => {
      const client = getSidecarClient();
      if (client === null) {
        return { ok: false as const, error: "Sidecar no conectado" };
      }
      const db = getDatabase();
      const llmRows = await db
        .select()
        .from(schema.llmConfig)
        .where(eq(schema.llmConfig.isDefault, true))
        .limit(1);
      const config = llmRows[0] ?? null;
      if (config === null || config.apiKey === null) {
        return { ok: false as const, error: "Configurá el LLM en Ajustes" };
      }

      let parsed: { subjects?: ImportSubject[] };
      try {
        const text = await client.sendRequestAndWait("curriculum_parser", rawText, {
          llm_config: {
            provider: config.provider,
            model: config.model,
            api_key: config.apiKey,
            base_url: config.baseUrl,
          },
        });
        parsed = JSON.parse(stripLlmJson(text)) as { subjects?: ImportSubject[] };
      } catch (e) {
        return {
          ok: false as const,
          error: e instanceof Error ? e.message : "No se pudo interpretar el programa",
        };
      }

      const subjectsIn = Array.isArray(parsed.subjects) ? parsed.subjects : [];
      if (subjectsIn.length === 0) {
        return { ok: false as const, error: "El texto no produjo materias reconocibles" };
      }

      const teacherId = await ensureTeacher();

      await db.transaction(async (tx) => {
        const existing = await tx
          .select()
          .from(schema.curricula)
          .where(eq(schema.curricula.classroomId, classroomId))
          .limit(1);
        if (existing.length > 0) {
          await tx.delete(schema.curricula).where(eq(schema.curricula.id, existing[0]!.id));
        }

        const [cur] = await tx
          .insert(schema.curricula)
          .values({
            classroomId,
            teacherId,
            title: "Programa importado",
            year: new Date().getFullYear(),
            description: null,
          })
          .returning();

        let sOrder = 0;
        for (const subj of subjectsIn) {
          const sName = String(subj.name ?? "").trim();
          if (sName.length === 0) continue;
          const [sRow] = await tx
            .insert(schema.curriculumSubjects)
            .values({ curriculumId: cur!.id, name: sName, sortOrder: sOrder++ })
            .returning();

          let uOrder = 0;
          const units = Array.isArray(subj.units) ? subj.units : [];
          for (const u of units) {
            const uName = String(u.name ?? "").trim();
            if (uName.length === 0) continue;
            const [uRow] = await tx
              .insert(schema.curriculumUnits)
              .values({
                subjectId: sRow!.id,
                name: uName,
                description: u.description != null ? String(u.description) : null,
                objectives: u.objectives != null ? String(u.objectives) : null,
                startDate: null,
                endDate: null,
                status: "upcoming",
                sortOrder: uOrder++,
              })
              .returning();

            let tOrder = 0;
            for (const t of normalizeTopics(u.topics)) {
              await tx.insert(schema.curriculumTopics).values({
                unitId: uRow!.id,
                name: t.name,
                description: t.description,
                sortOrder: tOrder++,
              });
            }
          }
        }
      });

      const tree = await loadCurriculumTree(db, classroomId);
      return { ok: true as const, tree };
    }
  );
};
