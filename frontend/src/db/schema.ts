// ─────────────────────────────────────────────────────────
// Metztli — Esquema normalizado del registro diario (2FN)
//
// Módulo sin dependencias de React Native para poder probarlo con cualquier
// motor SQLite. Normalización aplicada:
//   · 1FN: se eliminan los campos multivaluados (JSON en `symptoms_json`,
//     `pregnancy_symptoms` y hábitos dentro de `notes`). Cada síntoma / hábito
//     es una fila en una tabla hija.
//   · 2FN: las tablas hijas tienen clave compuesta (daily_log_id, código) y no
//     guardan más atributos, por lo que no hay dependencias parciales. El resto
//     de tablas usa clave simple, así que cumplen 2FN por construcción.
//   · Las métricas del día (sueño, movimiento, agua…) son atributos atómicos que
//     dependen solo de la clave (la fecha del registro): columnas de daily_logs.
// ─────────────────────────────────────────────────────────

import type { DailyLog } from '@/types';

export const SCHEMA_VERSION = 3;

/** Subconjunto de expo-sqlite que usamos (también lo cumple un adaptador de pruebas). */
export interface SqlDb {
  execAsync(sql: string): Promise<unknown>;
  runAsync(sql: string, params?: unknown[]): Promise<unknown>;
  getFirstAsync(sql: string, params?: unknown[]): Promise<any>;
  getAllAsync(sql: string, params?: unknown[]): Promise<any[]>;
}

export const DAILY_LOG_SQL = `
  -- Registro diario: un renglón por fecha, solo atributos atómicos
  CREATE TABLE IF NOT EXISTS daily_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    log_date TEXT NOT NULL UNIQUE,
    mode TEXT NOT NULL CHECK (mode IN ('cycle', 'pregnancy', 'menopause')),
    flow_level TEXT CHECK (flow_level IN ('none', 'spotting', 'medium', 'heavy')),
    flow_color TEXT,
    flow_intensity TEXT,
    mucus TEXT,
    pain_level INTEGER CHECK (pain_level BETWEEN 0 AND 5),
    mood TEXT,
    vitality INTEGER CHECK (vitality BETWEEN 1 AND 5),
    discomfort INTEGER CHECK (discomfort BETWEEN 1 AND 5),
    weather TEXT,
    sleep_hours REAL CHECK (sleep_hours BETWEEN 0 AND 24),
    movement_min INTEGER CHECK (movement_min >= 0),
    water_glasses INTEGER CHECK (water_glasses >= 0),
    notes TEXT
  );

  -- Catálogo de síntomas (ciclo, embarazo, menopausia y cuerpo-mente)
  CREATE TABLE IF NOT EXISTS symptoms (
    code TEXT PRIMARY KEY,
    label_key TEXT NOT NULL
  );

  -- Síntomas de cada registro (relación N:M, clave compuesta)
  CREATE TABLE IF NOT EXISTS daily_log_symptoms (
    daily_log_id INTEGER NOT NULL REFERENCES daily_logs(id) ON DELETE CASCADE,
    symptom_code TEXT NOT NULL REFERENCES symptoms(code),
    PRIMARY KEY (daily_log_id, symptom_code)
  ) WITHOUT ROWID;
  CREATE INDEX IF NOT EXISTS idx_daily_log_symptoms_code ON daily_log_symptoms(symptom_code);

  -- Micro-hábitos cumplidos en el día (clave compuesta)
  CREATE TABLE IF NOT EXISTS daily_log_habits (
    daily_log_id INTEGER NOT NULL REFERENCES daily_logs(id) ON DELETE CASCADE,
    habit_code TEXT NOT NULL,
    PRIMARY KEY (daily_log_id, habit_code)
  ) WITHOUT ROWID;
`;

export const SYMPTOM_CODES = [
  // embarazo / ciclo
  'nausea', 'fatigue', 'swelling', 'kicks', 'backPain', 'headache', 'cramps', 'dizziness',
  'bloating', 'breastTenderness', 'acne', 'insomnia',
  // menopausia
  'hotFlashes', 'mood_sensitive', 'mood_low',
  // cuerpo-mente
  'sadness', 'low_energy', 'heavy_flow', 'tender_breasts', 'sweet_cravings',
  'body_image', 'mental_load', 'disabling_pain',
];

export const SYMPTOM_SEED_SQL = `INSERT OR IGNORE INTO symptoms (code, label_key) VALUES ${SYMPTOM_CODES.map(
  (c) => `('${c}', 'symptoms.${c}')`
).join(', ')};`;

// ── Escritura serializada (evita transacciones intercaladas por los await) ──
let writeQueue: Promise<unknown> = Promise.resolve();
function serialized<T>(task: () => Promise<T>): Promise<T> {
  const run = writeQueue.then(task, task);
  writeQueue = run.catch(() => undefined);
  return run;
}

const COLUMNS = [
  'log_date', 'mode', 'flow_level', 'flow_color', 'flow_intensity', 'mucus', 'pain_level', 'mood',
  'vitality', 'discomfort', 'weather', 'sleep_hours', 'movement_min', 'water_glasses', 'notes',
] as const;

/** Inserta o actualiza el registro del día y reemplaza sus síntomas y hábitos. */
export function upsertDailyLog(db: SqlDb, log: Omit<DailyLog, 'id'>): Promise<void> {
  return serialized(async () => {
    const values = COLUMNS.map((c) => (log as any)[c] ?? null);
    const updates = COLUMNS.filter((c) => c !== 'log_date').map((c) => `${c} = excluded.${c}`).join(', ');
    await db.execAsync('BEGIN');
    try {
      await db.runAsync(
        `INSERT INTO daily_logs (${COLUMNS.join(', ')}) VALUES (${COLUMNS.map(() => '?').join(', ')})
         ON CONFLICT(log_date) DO UPDATE SET ${updates}`,
        values
      );
      const row = await db.getFirstAsync('SELECT id FROM daily_logs WHERE log_date = ?', [log.log_date]);
      if (row) {
        await db.runAsync('DELETE FROM daily_log_symptoms WHERE daily_log_id = ?', [row.id]);
        await db.runAsync('DELETE FROM daily_log_habits WHERE daily_log_id = ?', [row.id]);
        for (const code of new Set(log.symptoms ?? [])) {
          await db.runAsync('INSERT OR IGNORE INTO symptoms (code, label_key) VALUES (?, ?)', [code, `symptoms.${code}`]);
          await db.runAsync('INSERT INTO daily_log_symptoms (daily_log_id, symptom_code) VALUES (?, ?)', [row.id, code]);
        }
        for (const code of new Set(log.habits ?? [])) {
          await db.runAsync('INSERT INTO daily_log_habits (daily_log_id, habit_code) VALUES (?, ?)', [row.id, code]);
        }
      }
      await db.execAsync('COMMIT');
    } catch (e) {
      await db.execAsync('ROLLBACK');
      throw e;
    }
  });
}

/** Lee registros (con sus síntomas y hábitos) que cumplan el filtro. */
export async function readDailyLogs(db: SqlDb, where = '', params: unknown[] = []): Promise<DailyLog[]> {
  const rows = await db.getAllAsync(`SELECT * FROM daily_logs ${where} ORDER BY log_date ASC`, params);
  if (!rows.length) return [];
  const marks = rows.map(() => '?').join(', ');
  const ids = rows.map((r) => r.id);
  const symptoms = await db.getAllAsync(
    `SELECT daily_log_id, symptom_code FROM daily_log_symptoms WHERE daily_log_id IN (${marks}) ORDER BY symptom_code`,
    ids
  );
  const habits = await db.getAllAsync(
    `SELECT daily_log_id, habit_code FROM daily_log_habits WHERE daily_log_id IN (${marks}) ORDER BY habit_code`,
    ids
  );
  return rows.map((r) => ({
    ...r,
    symptoms: symptoms.filter((s) => s.daily_log_id === r.id).map((s) => s.symptom_code),
    habits: habits.filter((h) => h.daily_log_id === r.id).map((h) => h.habit_code),
  })) as DailyLog[];
}

// ── Migración desde el esquema v1 (symptoms_json / pregnancy_symptoms) ──

/** Paso 1: si la tabla vieja existe, se aparta antes de crear el esquema nuevo. */
export async function renameLegacyDailyLogs(db: SqlDb): Promise<void> {
  const cols = await db.getAllAsync('PRAGMA table_info(daily_logs)');
  if (cols.some((c) => c.name === 'symptoms_json')) {
    await db.execAsync('DROP TABLE IF EXISTS daily_logs_legacy; ALTER TABLE daily_logs RENAME TO daily_logs_legacy;');
  }
}

const TAG_TO_COLUMN: Record<string, { col: string; kind: 'text' | 'int' | 'real' }> = {
  flow_color: { col: 'flow_color', kind: 'text' },
  flow_intensity: { col: 'flow_intensity', kind: 'text' },
  mucus: { col: 'mucus', kind: 'text' },
  mood: { col: 'mood', kind: 'text' },
  weather: { col: 'weather', kind: 'text' },
  vitality: { col: 'vitality', kind: 'int' },
  discomfort: { col: 'discomfort', kind: 'int' },
  sleep: { col: 'sleep_hours', kind: 'real' },
  move: { col: 'movement_min', kind: 'int' },
  water: { col: 'water_glasses', kind: 'int' },
};

function parseJsonArray(text: unknown): string[] {
  if (typeof text !== 'string') return [];
  try {
    const v = JSON.parse(text);
    return Array.isArray(v) ? v.filter((x) => typeof x === 'string') : [];
  } catch {
    return [];
  }
}

/** Paso 2: copia los datos de la tabla vieja al esquema normalizado y la elimina. */
export async function migrateLegacyDailyLogs(db: SqlDb): Promise<number> {
  const legacy = await db.getFirstAsync("SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'daily_logs_legacy'");
  if (!legacy) return 0;
  const rows = await db.getAllAsync('SELECT * FROM daily_logs_legacy ORDER BY log_date ASC');
  for (const r of rows) {
    const log: any = {
      log_date: r.log_date,
      mode: ['cycle', 'pregnancy', 'menopause'].includes(r.mode) ? r.mode : 'cycle',
      flow_level: ['none', 'spotting', 'medium', 'heavy'].includes(r.flow_level) ? r.flow_level : null,
      pain_level: Number.isInteger(r.pain_level) && r.pain_level >= 0 && r.pain_level <= 5 ? r.pain_level : null,
      mood: r.mood ?? null,
      notes: r.notes ?? null,
      symptoms: [] as string[],
      habits: [] as string[],
    };
    // Hábitos de HealthStar guardados como JSON dentro de `notes`
    const asHabits = parseJsonArray(r.notes);
    if (asHabits.length || r.notes === '[]') {
      log.habits = asHabits;
      log.notes = null;
    }
    for (const tag of parseJsonArray(r.symptoms_json)) {
      const idx = tag.indexOf(':');
      if (idx === -1) {
        log.symptoms.push(tag);
        continue;
      }
      const map = TAG_TO_COLUMN[tag.slice(0, idx)];
      if (!map) continue;
      const raw = tag.slice(idx + 1);
      const num = Number(raw);
      log[map.col] = map.kind === 'text' ? raw : Number.isFinite(num) ? num : null;
    }
    log.symptoms.push(...parseJsonArray(r.pregnancy_symptoms));
    await upsertDailyLog(db, log);
  }
  await db.execAsync('DROP TABLE daily_logs_legacy;');
  return rows.length;
}
