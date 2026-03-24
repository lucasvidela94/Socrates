import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import { app } from "electron";
import * as path from "path";
import * as schema from "./schema";

let db: ReturnType<typeof drizzle<typeof schema>> | null = null;
let client: PGlite | null = null;

const getDataDir = (): string => {
  const userData = app.getPath("userData");
  return path.join(userData, "pgdata");
};

export const initializeDatabase = async (): Promise<void> => {
  if (db !== null) return;

  const dataDir = getDataDir();
  client = new PGlite(dataDir);
  db = drizzle(client, { schema });

  await runMigrations(client);
  console.log(`PGlite initialized at ${dataDir}`);
};

const runMigrations = async (pg: PGlite): Promise<void> => {
  await pg.exec(`
    CREATE TABLE IF NOT EXISTS teachers (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name TEXT NOT NULL,
      email TEXT,
      created_at TIMESTAMP DEFAULT NOW() NOT NULL
    );

    CREATE TABLE IF NOT EXISTS classrooms (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name TEXT NOT NULL,
      grade TEXT NOT NULL,
      shift TEXT NOT NULL,
      teacher_id UUID NOT NULL REFERENCES teachers(id) ON DELETE CASCADE,
      created_at TIMESTAMP DEFAULT NOW() NOT NULL
    );

    CREATE TABLE IF NOT EXISTS students (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name TEXT NOT NULL,
      birth_date DATE,
      classroom_id UUID NOT NULL REFERENCES classrooms(id) ON DELETE CASCADE,
      notes TEXT,
      created_at TIMESTAMP DEFAULT NOW() NOT NULL
    );

    CREATE TABLE IF NOT EXISTS student_profiles (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
      learning_style TEXT,
      strengths TEXT,
      challenges TEXT,
      accommodations TEXT,
      updated_at TIMESTAMP DEFAULT NOW() NOT NULL
    );

    CREATE TABLE IF NOT EXISTS learning_notes (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      student_profile_id UUID NOT NULL REFERENCES student_profiles(id) ON DELETE CASCADE,
      observation TEXT NOT NULL,
      category TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT NOW() NOT NULL
    );

    CREATE TABLE IF NOT EXISTS documents (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      type TEXT NOT NULL,
      title TEXT NOT NULL,
      content JSONB,
      classroom_id UUID REFERENCES classrooms(id) ON DELETE SET NULL,
      teacher_id UUID NOT NULL REFERENCES teachers(id) ON DELETE CASCADE,
      created_at TIMESTAMP DEFAULT NOW() NOT NULL
    );

    CREATE TABLE IF NOT EXISTS document_versions (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
      content JSONB,
      version INTEGER NOT NULL,
      created_at TIMESTAMP DEFAULT NOW() NOT NULL
    );

    CREATE TABLE IF NOT EXISTS conversations (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      teacher_id UUID NOT NULL REFERENCES teachers(id) ON DELETE CASCADE,
      agent_type TEXT NOT NULL,
      context JSONB,
      created_at TIMESTAMP DEFAULT NOW() NOT NULL
    );

    CREATE TABLE IF NOT EXISTS messages (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
      role TEXT NOT NULL,
      content TEXT NOT NULL,
      metadata JSONB,
      created_at TIMESTAMP DEFAULT NOW() NOT NULL
    );

    CREATE TABLE IF NOT EXISTS llm_config (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      teacher_id UUID NOT NULL REFERENCES teachers(id) ON DELETE CASCADE,
      provider TEXT NOT NULL,
      model TEXT NOT NULL,
      api_key TEXT,
      base_url TEXT,
      settings JSONB,
      is_default BOOLEAN DEFAULT FALSE,
      updated_at TIMESTAMP DEFAULT NOW() NOT NULL
    );

    CREATE TABLE IF NOT EXISTS weekly_feedback (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
      classroom_id UUID NOT NULL REFERENCES classrooms(id) ON DELETE CASCADE,
      week_start DATE NOT NULL,
      indicators JSONB,
      observations TEXT,
      ai_summary TEXT,
      teacher_approved BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMP DEFAULT NOW() NOT NULL,
      UNIQUE(student_id, classroom_id, week_start)
    );
  `);
};

export const getDatabase = (): ReturnType<typeof drizzle<typeof schema>> => {
  if (db === null) {
    throw new Error("Database not initialized. Call initializeDatabase() first.");
  }
  return db;
};

export const closeDatabase = async (): Promise<void> => {
  if (client !== null) {
    await client.close();
    client = null;
    db = null;
  }
};
