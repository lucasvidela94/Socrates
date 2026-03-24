import { pgTable, uuid, text, timestamp, integer, jsonb, date, boolean } from "drizzle-orm/pg-core";

export const teachers = pgTable("teachers", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  email: text("email"),
  createdAt: timestamp("created_at").defaultNow().notNull()
});

export const classrooms = pgTable("classrooms", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  grade: text("grade").notNull(),
  shift: text("shift").notNull(),
  teacherId: uuid("teacher_id")
    .notNull()
    .references(() => teachers.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").defaultNow().notNull()
});

export const students = pgTable("students", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  birthDate: date("birth_date"),
  classroomId: uuid("classroom_id")
    .notNull()
    .references(() => classrooms.id, { onDelete: "cascade" }),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull()
});

export const studentProfiles = pgTable("student_profiles", {
  id: uuid("id").primaryKey().defaultRandom(),
  studentId: uuid("student_id")
    .notNull()
    .references(() => students.id, { onDelete: "cascade" }),
  learningStyle: text("learning_style"),
  strengths: text("strengths"),
  challenges: text("challenges"),
  accommodations: text("accommodations"),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

export const learningNotes = pgTable("learning_notes", {
  id: uuid("id").primaryKey().defaultRandom(),
  studentProfileId: uuid("student_profile_id")
    .notNull()
    .references(() => studentProfiles.id, { onDelete: "cascade" }),
  observation: text("observation").notNull(),
  category: text("category").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull()
});

export const weeklyFeedback = pgTable("weekly_feedback", {
  id: uuid("id").primaryKey().defaultRandom(),
  studentId: uuid("student_id")
    .notNull()
    .references(() => students.id, { onDelete: "cascade" }),
  classroomId: uuid("classroom_id")
    .notNull()
    .references(() => classrooms.id, { onDelete: "cascade" }),
  weekStart: date("week_start").notNull(),
  indicators: jsonb("indicators"),
  observations: text("observations"),
  aiSummary: text("ai_summary"),
  teacherApproved: boolean("teacher_approved").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull()
});

export const documents = pgTable("documents", {
  id: uuid("id").primaryKey().defaultRandom(),
  type: text("type").notNull(),
  title: text("title").notNull(),
  content: jsonb("content"),
  classroomId: uuid("classroom_id").references(() => classrooms.id, {
    onDelete: "set null"
  }),
  teacherId: uuid("teacher_id")
    .notNull()
    .references(() => teachers.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").defaultNow().notNull()
});

export const documentVersions = pgTable("document_versions", {
  id: uuid("id").primaryKey().defaultRandom(),
  documentId: uuid("document_id")
    .notNull()
    .references(() => documents.id, { onDelete: "cascade" }),
  content: jsonb("content"),
  version: integer("version").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull()
});

export const conversations = pgTable("conversations", {
  id: uuid("id").primaryKey().defaultRandom(),
  teacherId: uuid("teacher_id")
    .notNull()
    .references(() => teachers.id, { onDelete: "cascade" }),
  agentType: text("agent_type").notNull(),
  context: jsonb("context"),
  createdAt: timestamp("created_at").defaultNow().notNull()
});

export const messages = pgTable("messages", {
  id: uuid("id").primaryKey().defaultRandom(),
  conversationId: uuid("conversation_id")
    .notNull()
    .references(() => conversations.id, { onDelete: "cascade" }),
  role: text("role").notNull(),
  content: text("content").notNull(),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow().notNull()
});

export const llmConfig = pgTable("llm_config", {
  id: uuid("id").primaryKey().defaultRandom(),
  teacherId: uuid("teacher_id")
    .notNull()
    .references(() => teachers.id, { onDelete: "cascade" }),
  provider: text("provider").notNull(),
  model: text("model").notNull(),
  apiKey: text("api_key"),
  baseUrl: text("base_url"),
  settings: jsonb("settings"),
  isDefault: boolean("is_default").default(false),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});
