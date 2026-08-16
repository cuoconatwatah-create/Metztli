// ─────────────────────────────────────────────────────────
// Metztli 2.0 — SQLite Database Initializer (Offline-First)
// ─────────────────────────────────────────────────────────

import * as SQLite from 'expo-sqlite';
import type {
  UserProfile,
  Cycle,
  DailyLog,
  KickCounterLog,
  DirectoryContact,
  ForumPost,
  OfflineFAQ,
  LifeStageMode,
  FlowLevel,
  MoodType,
  ForumCategory,
} from '@/types';

let db: SQLite.SQLiteDatabase | null = null;

/**
 * Opens (or creates) the Metztli SQLite database and returns the handle.
 */
export async function openDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (db) return db;
  db = await SQLite.openDatabaseAsync('metztli.db');
  return db;
}

/**
 * Initializes all tables. Must be called once at app startup.
 */
export async function initializeDatabase(): Promise<void> {
  const database = await openDatabase();

  await database.execAsync(`
    -- Perfil y modo de etapa de vida activa
    CREATE TABLE IF NOT EXISTS user_profile (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      current_mode TEXT DEFAULT 'cycle',
      lmp_date TEXT,
      due_date TEXT
    );

    -- Insertar perfil por defecto si no existe
    INSERT OR IGNORE INTO user_profile (id, current_mode) VALUES (1, 'cycle');

    -- Historial de ciclos y predicciones
    CREATE TABLE IF NOT EXISTS cycles (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      start_date TEXT NOT NULL,
      end_date TEXT,
      cycle_length INTEGER DEFAULT 28,
      period_length INTEGER DEFAULT 5
    );

    -- Registro diario de síntomas
    CREATE TABLE IF NOT EXISTS daily_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      log_date TEXT UNIQUE NOT NULL,
      mode TEXT NOT NULL,
      flow_level TEXT,
      pain_level INTEGER,
      pregnancy_symptoms TEXT,
      mood TEXT,
      symptoms_json TEXT,
      notes TEXT
    );

    -- Registro de pataditas fetales
    CREATE TABLE IF NOT EXISTS kick_counter_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      session_date TEXT NOT NULL,
      kick_count INTEGER NOT NULL,
      duration_minutes INTEGER NOT NULL
    );

    -- Directorio comunitario de emergencias
    CREATE TABLE IF NOT EXISTS directory_contacts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      municipality TEXT NOT NULL,
      institution_name TEXT NOT NULL,
      phone_number TEXT NOT NULL,
      type TEXT NOT NULL
    );

    -- Foro anónimo y cola de sincronización
    CREATE TABLE IF NOT EXISTS forum_posts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      local_uuid TEXT UNIQUE NOT NULL,
      alias TEXT NOT NULL,
      category TEXT NOT NULL,
      question TEXT NOT NULL,
      created_at TEXT NOT NULL,
      is_synced INTEGER DEFAULT 0
    );

    -- Biblioteca FAQ offline
    CREATE TABLE IF NOT EXISTS offline_faqs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      category TEXT NOT NULL,
      title_key TEXT NOT NULL,
      content_key TEXT NOT NULL,
      audio_key TEXT NOT NULL
    );
  `);
}

// ─────────────────────────────────────────────────────────
// USER PROFILE
// ─────────────────────────────────────────────────────────

export async function getUserProfile(): Promise<UserProfile | null> {
  const database = await openDatabase();
  const result = await database.getFirstAsync<UserProfile>(
    'SELECT * FROM user_profile WHERE id = 1'
  );
  return result ?? null;
}

export async function updateUserMode(mode: LifeStageMode): Promise<void> {
  const database = await openDatabase();
  await database.runAsync(
    'UPDATE user_profile SET current_mode = ? WHERE id = 1',
    [mode]
  );
}

export async function updateLMPDate(lmpDate: string): Promise<void> {
  const database = await openDatabase();
  await database.runAsync(
    'UPDATE user_profile SET lmp_date = ? WHERE id = 1',
    [lmpDate]
  );
}

export async function updateDueDate(dueDate: string): Promise<void> {
  const database = await openDatabase();
  await database.runAsync(
    'UPDATE user_profile SET due_date = ? WHERE id = 1',
    [dueDate]
  );
}

// ─────────────────────────────────────────────────────────
// CYCLES
// ─────────────────────────────────────────────────────────

export async function addCycle(
  startDate: string,
  endDate: string | null,
  cycleLength: number = 28,
  periodLength: number = 5
): Promise<void> {
  const database = await openDatabase();
  await database.runAsync(
    'INSERT INTO cycles (start_date, end_date, cycle_length, period_length) VALUES (?, ?, ?, ?)',
    [startDate, endDate, cycleLength, periodLength]
  );
}

export async function getCycles(limit: number = 12): Promise<Cycle[]> {
  const database = await openDatabase();
  const results = await database.getAllAsync<Cycle>(
    'SELECT * FROM cycles ORDER BY start_date DESC LIMIT ?',
    [limit]
  );
  return results;
}

export async function getLastCycle(): Promise<Cycle | null> {
  const database = await openDatabase();
  const result = await database.getFirstAsync<Cycle>(
    'SELECT * FROM cycles ORDER BY start_date DESC LIMIT 1'
  );
  return result ?? null;
}

// ─────────────────────────────────────────────────────────
// DAILY LOGS
// ─────────────────────────────────────────────────────────

export async function addDailyLog(log: Omit<DailyLog, 'id'>): Promise<void> {
  const database = await openDatabase();
  await database.runAsync(
    `INSERT OR REPLACE INTO daily_logs 
      (log_date, mode, flow_level, pain_level, pregnancy_symptoms, mood, symptoms_json, notes)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      log.log_date,
      log.mode,
      log.flow_level ?? null,
      log.pain_level ?? null,
      log.pregnancy_symptoms ? JSON.stringify(log.pregnancy_symptoms) : null,
      log.mood ?? null,
      log.symptoms_json ? JSON.stringify(log.symptoms_json) : null,
      log.notes ?? null,
    ]
  );
}

export async function getDailyLog(date: string): Promise<DailyLog | null> {
  const database = await openDatabase();
  const result = await database.getFirstAsync<DailyLog>(
    'SELECT * FROM daily_logs WHERE log_date = ?',
    [date]
  );
  if (result) {
    return {
      ...result,
      pregnancy_symptoms: result.pregnancy_symptoms
        ? JSON.parse(result.pregnancy_symptoms as unknown as string)
        : null,
      symptoms_json: result.symptoms_json
        ? JSON.parse(result.symptoms_json as unknown as string)
        : null,
    };
  }
  return null;
}

export async function getDailyLogs(
  fromDate: string,
  toDate: string
): Promise<DailyLog[]> {
  const database = await openDatabase();
  const results = await database.getAllAsync<DailyLog>(
    'SELECT * FROM daily_logs WHERE log_date BETWEEN ? AND ? ORDER BY log_date ASC',
    [fromDate, toDate]
  );
  return results.map((r) => ({
    ...r,
    pregnancy_symptoms: r.pregnancy_symptoms
      ? JSON.parse(r.pregnancy_symptoms as unknown as string)
      : null,
    symptoms_json: r.symptoms_json
      ? JSON.parse(r.symptoms_json as unknown as string)
      : null,
  }));
}

// ─────────────────────────────────────────────────────────
// KICK COUNTER
// ─────────────────────────────────────────────────────────

export async function addKickSession(
  sessionDate: string,
  kickCount: number,
  durationMinutes: number
): Promise<void> {
  const database = await openDatabase();
  await database.runAsync(
    'INSERT INTO kick_counter_logs (session_date, kick_count, duration_minutes) VALUES (?, ?, ?)',
    [sessionDate, kickCount, durationMinutes]
  );
}

export async function getKickSessions(
  limit: number = 30
): Promise<KickCounterLog[]> {
  const database = await openDatabase();
  return database.getAllAsync<KickCounterLog>(
    'SELECT * FROM kick_counter_logs ORDER BY session_date DESC LIMIT ?',
    [limit]
  );
}

export async function getTodayKickSessions(): Promise<KickCounterLog[]> {
  const database = await openDatabase();
  const today = new Date().toISOString().split('T')[0];
  return database.getAllAsync<KickCounterLog>(
    'SELECT * FROM kick_counter_logs WHERE session_date LIKE ? ORDER BY id DESC',
    [`${today}%`]
  );
}

// ─────────────────────────────────────────────────────────
// DIRECTORY CONTACTS
// ─────────────────────────────────────────────────────────

export async function getDirectoryContacts(
  municipality?: string
): Promise<DirectoryContact[]> {
  const database = await openDatabase();
  if (municipality) {
    return database.getAllAsync<DirectoryContact>(
      'SELECT * FROM directory_contacts WHERE municipality = ? ORDER BY type, institution_name',
      [municipality]
    );
  }
  return database.getAllAsync<DirectoryContact>(
    'SELECT * FROM directory_contacts ORDER BY municipality, type, institution_name'
  );
}

export async function getMunicipalities(): Promise<string[]> {
  const database = await openDatabase();
  const results = await database.getAllAsync<{ municipality: string }>(
    'SELECT DISTINCT municipality FROM directory_contacts ORDER BY municipality'
  );
  return results.map((r) => r.municipality);
}

// ─────────────────────────────────────────────────────────
// FORUM POSTS
// ─────────────────────────────────────────────────────────

export async function addForumPost(
  localUuid: string,
  alias: string,
  category: ForumCategory,
  question: string
): Promise<void> {
  const database = await openDatabase();
  await database.runAsync(
    'INSERT INTO forum_posts (local_uuid, alias, category, question, created_at, is_synced) VALUES (?, ?, ?, ?, ?, 0)',
    [localUuid, alias, category, question, new Date().toISOString()]
  );
}

export async function getForumPosts(
  category?: ForumCategory
): Promise<ForumPost[]> {
  const database = await openDatabase();
  if (category) {
    return database.getAllAsync<ForumPost>(
      'SELECT * FROM forum_posts WHERE category = ? ORDER BY created_at DESC',
      [category]
    );
  }
  return database.getAllAsync<ForumPost>(
    'SELECT * FROM forum_posts ORDER BY created_at DESC'
  );
}

export async function getUnsyncedPosts(): Promise<ForumPost[]> {
  const database = await openDatabase();
  return database.getAllAsync<ForumPost>(
    'SELECT * FROM forum_posts WHERE is_synced = 0 ORDER BY created_at ASC'
  );
}

export async function markPostAsSynced(localUuid: string): Promise<void> {
  const database = await openDatabase();
  await database.runAsync(
    'UPDATE forum_posts SET is_synced = 1 WHERE local_uuid = ?',
    [localUuid]
  );
}

// ─────────────────────────────────────────────────────────
// OFFLINE FAQS
// ─────────────────────────────────────────────────────────

export async function getOfflineFAQs(category?: string): Promise<OfflineFAQ[]> {
  const database = await openDatabase();
  if (category) {
    return database.getAllAsync<OfflineFAQ>(
      'SELECT * FROM offline_faqs WHERE category = ? ORDER BY id',
      [category]
    );
  }
  return database.getAllAsync<OfflineFAQ>(
    'SELECT * FROM offline_faqs ORDER BY category, id'
  );
}
