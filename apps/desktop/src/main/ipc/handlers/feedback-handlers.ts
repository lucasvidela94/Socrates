import { ipcMain, type IpcMainInvokeEvent } from "electron";
import { and, asc, desc, eq } from "drizzle-orm";
import { IPC_CHANNELS } from "../../../shared/channels";
import { getDatabase, schema } from "../../db";
import { getSidecarClient } from "../../sidecar";
import type { WeeklyFeedbackInput } from "../../../shared/types";

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

const indicatorsToObservation = (
  indicators: Record<string, unknown> | null | undefined,
  observations: string | null | undefined
): string => {
  const parts: string[] = [];
  if (indicators !== null && indicators !== undefined && typeof indicators === "object") {
    for (const [k, v] of Object.entries(indicators)) {
      parts.push(`${k}: ${String(v)}`);
    }
  }
  if (observations !== null && observations !== undefined && observations.trim() !== "") {
    parts.push(`Observaciones: ${observations.trim()}`);
  }
  return parts.length > 0 ? parts.join(" | ") : "Devolución semanal registrada";
};

export const registerFeedbackHandlers = (): void => {
  ipcMain.handle(
    IPC_CHANNELS.FEEDBACK_LIST_BY_STUDENT,
    async (_event: IpcMainInvokeEvent, classroomId: string, studentId: string) => {
      const db = getDatabase();
      return db
        .select()
        .from(schema.weeklyFeedback)
        .where(
          and(
            eq(schema.weeklyFeedback.classroomId, classroomId),
            eq(schema.weeklyFeedback.studentId, studentId)
          )
        )
        .orderBy(desc(schema.weeklyFeedback.weekStart))
        .limit(16);
    }
  );

  ipcMain.handle(
    IPC_CHANNELS.FEEDBACK_LIST_BY_WEEK,
    async (_event: IpcMainInvokeEvent, classroomId: string, weekStart: string) => {
      const db = getDatabase();
      return db
        .select()
        .from(schema.weeklyFeedback)
        .where(
          and(
            eq(schema.weeklyFeedback.classroomId, classroomId),
            eq(schema.weeklyFeedback.weekStart, weekStart)
          )
        )
        .orderBy(asc(schema.weeklyFeedback.createdAt));
    }
  );

  ipcMain.handle(
    IPC_CHANNELS.FEEDBACK_UPSERT,
    async (_event: IpcMainInvokeEvent, input: WeeklyFeedbackInput) => {
      const db = getDatabase();
      const existing = await db
        .select()
        .from(schema.weeklyFeedback)
        .where(
          and(
            eq(schema.weeklyFeedback.studentId, input.studentId),
            eq(schema.weeklyFeedback.classroomId, input.classroomId),
            eq(schema.weeklyFeedback.weekStart, input.weekStart)
          )
        )
        .limit(1);

      let row;
      let isNew = false;
      if (existing.length > 0) {
        const [updated] = await db
          .update(schema.weeklyFeedback)
          .set({
            indicators: input.indicators ?? null,
            observations: input.observations ?? null,
            aiSummary: input.aiSummary ?? null,
            teacherApproved: input.teacherApproved ?? false,
          })
          .where(eq(schema.weeklyFeedback.id, existing[0].id))
          .returning();
        row = updated;
      } else {
        isNew = true;
        const [created] = await db
          .insert(schema.weeklyFeedback)
          .values({
            studentId: input.studentId,
            classroomId: input.classroomId,
            weekStart: input.weekStart,
            indicators: input.indicators ?? null,
            observations: input.observations ?? null,
            aiSummary: input.aiSummary ?? null,
            teacherApproved: input.teacherApproved ?? false,
          })
          .returning();
        row = created;
      }

      if (isNew) {
        const profile = await ensureProfile(input.studentId);
        const obs = indicatorsToObservation(
          input.indicators as Record<string, unknown> | undefined,
          input.observations ?? undefined
        );
        await db.insert(schema.learningNotes).values({
          studentProfileId: profile.id,
          observation: obs,
          category: "devolución semanal",
        });
      }

      return row;
    }
  );

  ipcMain.handle(
    IPC_CHANNELS.FEEDBACK_GENERATE_SUMMARY,
    async (
      _event: IpcMainInvokeEvent,
      payload: {
        studentId: string;
        classroomId: string;
        weekStart: string;
        studentName: string;
        priorWeeksJson: string;
        currentIndicators: Record<string, unknown>;
        currentObservations: string;
      }
    ) => {
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
      const message = JSON.stringify({
        studentName: payload.studentName,
        weekStart: payload.weekStart,
        priorWeeks: payload.priorWeeksJson,
        currentIndicators: payload.currentIndicators,
        currentObservations: payload.currentObservations,
      });
      try {
        const text = await client.sendRequestAndWait("feedback_summary", message, {
          llm_config: {
            provider: config.provider,
            model: config.model,
            api_key: config.apiKey,
            base_url: config.baseUrl,
          },
        });
        return { ok: true as const, summary: text };
      } catch (e) {
        return {
          ok: false as const,
          error: e instanceof Error ? e.message : "Error al generar resumen",
        };
      }
    }
  );
};
