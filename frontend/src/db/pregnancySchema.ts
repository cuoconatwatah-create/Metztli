// ─────────────────────────────────────────────────────────
// Metztli — Modelo de embarazo (esquema v3, 2FN)
//
// Antes las fechas del embarazo vivían como columnas sueltas de user_profile
// (que ninguna pantalla llenaba). Ahora un embarazo es una entidad propia:
//   pregnancies ──< prenatal_checkups
//   pregnancies ──< kick_counter_logs
// · Un solo embarazo activo a la vez (índice único parcial).
// · Se guarda solo la FUM (lmp_date). La fecha probable de parto se deriva
//   (FUM + 280 días) y no se almacena: evita dependencias transitivas.
// · Si la usuaria solo conoce la fecha probable, se calcula la FUM y se marca
//   lmp_estimated = 1.
// Sin dependencias de React Native: se prueba con cualquier motor SQLite.
// ─────────────────────────────────────────────────────────

import type { SqlDb } from './schema';

export const PREGNANCY_SQL = `
  CREATE TABLE IF NOT EXISTS pregnancies (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    lmp_date TEXT NOT NULL UNIQUE,
    lmp_estimated INTEGER NOT NULL DEFAULT 0 CHECK (lmp_estimated IN (0, 1)),
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'ended')),
    ended_on TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    CHECK (status = 'ended' OR ended_on IS NULL)
  );
  CREATE UNIQUE INDEX IF NOT EXISTS idx_one_active_pregnancy ON pregnancies(status) WHERE status = 'active';

  CREATE TABLE IF NOT EXISTS prenatal_checkups (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    local_uuid TEXT NOT NULL UNIQUE,
    pregnancy_id INTEGER NOT NULL REFERENCES pregnancies(id) ON DELETE CASCADE,
    checkup_date TEXT NOT NULL,
    kind TEXT NOT NULL DEFAULT 'control' CHECK (kind IN ('control', 'ecografia', 'laboratorio', 'otro')),
    place TEXT,
    weight_kg REAL CHECK (weight_kg IS NULL OR weight_kg BETWEEN 20 AND 300),
    bp_systolic INTEGER CHECK (bp_systolic IS NULL OR bp_systolic BETWEEN 50 AND 260),
    bp_diastolic INTEGER CHECK (bp_diastolic IS NULL OR bp_diastolic BETWEEN 30 AND 160),
    notes TEXT,
    done INTEGER NOT NULL DEFAULT 0 CHECK (done IN (0, 1))
  );
  CREATE INDEX IF NOT EXISTS idx_checkups_pregnancy_date ON prenatal_checkups(pregnancy_id, checkup_date);
`;

export type CheckupKind = 'control' | 'ecografia' | 'laboratorio' | 'otro';

export interface PregnancyRow {
  id: number;
  lmp_date: string;
  lmp_estimated: 0 | 1;
  status: 'active' | 'ended';
  ended_on: string | null;
  created_at: string;
}

export interface CheckupRow {
  id: number;
  local_uuid: string;
  pregnancy_id: number;
  checkup_date: string;
  kind: CheckupKind;
  place: string | null;
  weight_kg: number | null;
  bp_systolic: number | null;
  bp_diastolic: number | null;
  notes: string | null;
  done: 0 | 1;
}

export type CheckupInput = Partial<
  Pick<CheckupRow, 'kind' | 'place' | 'weight_kg' | 'bp_systolic' | 'bp_diastolic' | 'notes'>
> & { checkup_date: string; done?: boolean | 0 | 1 };

export const GESTATION_DAYS = 280;
const MAX_PAST_DAYS = 300;

// ── Fechas (siempre YYYY-MM-DD, sin zona horaria) ──
export function addDays(iso: string, days: number): string {
  const [y, m, d] = iso.split('-').map(Number);
  const date = new Date(Date.UTC(y, m - 1, d + days));
  return date.toISOString().slice(0, 10);
}

export function isValidISODate(iso: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) return false;
  const [y, m, d] = iso.split('-').map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  return date.getUTCFullYear() === y && date.getUTCMonth() === m - 1 && date.getUTCDate() === d;
}

export function dueDateFromLmp(lmp: string): string {
  return addDays(lmp, GESTATION_DAYS);
}

/** Fecha de hoy en hora local (YYYY-MM-DD). */
export function localToday(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function makeUuid(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

export type PregnancyErrorCode = 'invalid_date' | 'future_date' | 'too_old' | 'no_active_pregnancy';

export class PregnancyError extends Error {
  code: PregnancyErrorCode;
  constructor(code: PregnancyErrorCode, message: string) {
    super(message);
    this.code = code;
  }
}

// ── Embarazo activo ──
export async function getActivePregnancy(db: SqlDb): Promise<PregnancyRow | null> {
  return (await db.getFirstAsync("SELECT * FROM pregnancies WHERE status = 'active'")) ?? null;
}

/** Valida la fecha ingresada y devuelve la FUM (calculada si solo se conoce la fecha probable de parto). */
export function resolveLmp(
  input: { lmp_date?: string; due_date?: string },
  today: string
): { lmp: string; estimated: 0 | 1 } {
  const source = input.lmp_date ?? input.due_date;
  if (!source || !isValidISODate(source)) throw new PregnancyError('invalid_date', 'Fecha inválida');
  const lmp = input.lmp_date ?? addDays(input.due_date as string, -GESTATION_DAYS);
  if (lmp > today) throw new PregnancyError('future_date', 'La fecha no puede estar en el futuro');
  if (lmp < addDays(today, -MAX_PAST_DAYS)) throw new PregnancyError('too_old', 'La fecha es demasiado antigua');
  return { lmp, estimated: input.lmp_date ? 0 : 1 };
}

/** Crea el embarazo activo o corrige su fecha. Acepta FUM o fecha probable de parto. */
export async function savePregnancy(
  db: SqlDb,
  input: { lmp_date?: string; due_date?: string },
  today: string
): Promise<PregnancyRow> {
  const { lmp, estimated } = resolveLmp(input, today);

  const active = await getActivePregnancy(db);
  if (active) {
    await db.runAsync('UPDATE pregnancies SET lmp_date = ?, lmp_estimated = ? WHERE id = ?', [lmp, estimated, active.id]);
  } else {
    await db.runAsync("INSERT INTO pregnancies (lmp_date, lmp_estimated, status) VALUES (?, ?, 'active')", [lmp, estimated]);
  }
  return (await getActivePregnancy(db)) as PregnancyRow;
}

export async function endActivePregnancy(db: SqlDb, endedOn: string): Promise<void> {
  await db.runAsync("UPDATE pregnancies SET status = 'ended', ended_on = ? WHERE status = 'active'", [endedOn]);
}

// ── Controles prenatales ──
export async function addCheckup(db: SqlDb, input: CheckupInput): Promise<CheckupRow> {
  const preg = await getActivePregnancy(db);
  if (!preg) throw new PregnancyError('no_active_pregnancy', 'No hay un embarazo activo');
  if (!isValidISODate(input.checkup_date)) throw new PregnancyError('invalid_date', 'Fecha inválida');
  const uuid = makeUuid();
  await db.runAsync(
    `INSERT INTO prenatal_checkups
       (local_uuid, pregnancy_id, checkup_date, kind, place, weight_kg, bp_systolic, bp_diastolic, notes, done)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      uuid, preg.id, input.checkup_date, input.kind ?? 'control', input.place ?? null, input.weight_kg ?? null,
      input.bp_systolic ?? null, input.bp_diastolic ?? null, input.notes ?? null, input.done ? 1 : 0,
    ]
  );
  return (await db.getFirstAsync('SELECT * FROM prenatal_checkups WHERE local_uuid = ?', [uuid])) as CheckupRow;
}

/** Controles del embarazo activo, del más próximo al más lejano. */
export async function listCheckups(db: SqlDb): Promise<CheckupRow[]> {
  return db.getAllAsync(
    `SELECT c.* FROM prenatal_checkups c JOIN pregnancies p ON p.id = c.pregnancy_id
     WHERE p.status = 'active' ORDER BY c.checkup_date ASC, c.id ASC`
  );
}

export async function updateCheckup(
  db: SqlDb,
  id: number,
  patch: Partial<Omit<CheckupInput, 'checkup_date'>> & { checkup_date?: string }
): Promise<void> {
  const allowed = ['checkup_date', 'kind', 'place', 'weight_kg', 'bp_systolic', 'bp_diastolic', 'notes', 'done'] as const;
  const keys = allowed.filter((k) => k in patch);
  if (!keys.length) return;
  if (patch.checkup_date !== undefined && !isValidISODate(patch.checkup_date)) {
    throw new PregnancyError('invalid_date', 'Fecha inválida');
  }
  await db.runAsync(
    `UPDATE prenatal_checkups SET ${keys.map((k) => `${k} = ?`).join(', ')} WHERE id = ?`,
    [...keys.map((k) => (k === 'done' ? (patch.done ? 1 : 0) : (patch as any)[k] ?? null)), id]
  );
}

export async function deleteCheckup(db: SqlDb, id: number): Promise<void> {
  await db.runAsync('DELETE FROM prenatal_checkups WHERE id = ?', [id]);
}

// ── Pataditas: se ligan al embarazo activo ──
export async function insertKickSession(
  db: SqlDb,
  sessionDate: string,
  kickCount: number,
  durationMinutes: number
): Promise<void> {
  const preg = await getActivePregnancy(db);
  await db.runAsync(
    'INSERT INTO kick_counter_logs (session_date, kick_count, duration_minutes, pregnancy_id, local_uuid) VALUES (?, ?, ?, ?, ?)',
    [sessionDate, kickCount, durationMinutes, preg?.id ?? null, makeUuid()]
  );
}

// ── Migración v2 → v3 ──
export async function migrateToV3(db: SqlDb): Promise<void> {
  await db.execAsync(PREGNANCY_SQL);

  // Pataditas: columnas nuevas (ALTER no admite UNIQUE → índice aparte)
  const kickCols = (await db.getAllAsync('PRAGMA table_info(kick_counter_logs)')).map((c) => c.name);
  if (!kickCols.includes('pregnancy_id')) {
    await db.execAsync('ALTER TABLE kick_counter_logs ADD COLUMN pregnancy_id INTEGER REFERENCES pregnancies(id) ON DELETE SET NULL');
  }
  if (!kickCols.includes('local_uuid')) {
    await db.execAsync('ALTER TABLE kick_counter_logs ADD COLUMN local_uuid TEXT');
  }
  for (const row of await db.getAllAsync('SELECT id FROM kick_counter_logs WHERE local_uuid IS NULL')) {
    await db.runAsync('UPDATE kick_counter_logs SET local_uuid = ? WHERE id = ?', [makeUuid(), row.id]);
  }
  await db.execAsync('CREATE UNIQUE INDEX IF NOT EXISTS idx_kick_local_uuid ON kick_counter_logs(local_uuid)');
  await db.execAsync('CREATE INDEX IF NOT EXISTS idx_kick_pregnancy ON kick_counter_logs(pregnancy_id)');

  // Fechas del perfil → embarazo activo
  const profCols = (await db.getAllAsync('PRAGMA table_info(user_profile)')).map((c) => c.name);
  if (profCols.includes('lmp_date') || profCols.includes('due_date')) {
    const prof = await db.getFirstAsync('SELECT * FROM user_profile WHERE id = 1');
    const existing = await getActivePregnancy(db);
    const lmp = prof?.lmp_date && isValidISODate(prof.lmp_date) ? prof.lmp_date : null;
    const due = prof?.due_date && isValidISODate(prof.due_date) ? prof.due_date : null;
    if (!existing && (lmp || due)) {
      await db.runAsync("INSERT OR IGNORE INTO pregnancies (lmp_date, lmp_estimated, status) VALUES (?, ?, 'active')", [
        lmp ?? addDays(due as string, -GESTATION_DAYS),
        lmp ? 0 : 1,
      ]);
      const created = await getActivePregnancy(db);
      if (created) await db.runAsync('UPDATE kick_counter_logs SET pregnancy_id = ? WHERE pregnancy_id IS NULL', [created.id]);
    }
    for (const col of ['lmp_date', 'due_date']) {
      if (profCols.includes(col)) {
        try {
          await db.execAsync(`ALTER TABLE user_profile DROP COLUMN ${col}`);
        } catch {
          // SQLite < 3.35: la columna queda sin uso (ya no se lee ni se escribe)
        }
      }
    }
  }
}
