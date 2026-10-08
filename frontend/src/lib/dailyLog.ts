// ─────────────────────────────────────────────────────────
// Metztli — Registro del día (acceso a daily_logs normalizado)
//
// Los datos (color del flujo, sueño, ánimo…) son columnas de `daily_logs`;
// síntomas y hábitos son filas en tablas hijas. Ver db/schema.ts.
// En web la base es un mock sin persistencia, por eso se mantiene una caché en
// memoria con el último estado de cada día.
// ─────────────────────────────────────────────────────────

import { addDailyLog, getDailyLog, getUserProfile } from '@/db/database';
import type { DailyLog, LifeStageMode } from '@/types';

/** Fecha local (YYYY-MM-DD). `toISOString()` usa UTC y se adelanta un día de noche en Nicaragua. */
export function localISODate(d: Date = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export type DayPatch = Partial<Omit<DailyLog, 'id' | 'log_date' | 'mode'>>;

const memory: Record<string, DailyLog> = {};

function blank(date: string, mode: LifeStageMode): DailyLog {
  return {
    id: 0,
    log_date: date,
    mode,
    flow_level: null,
    flow_color: null,
    flow_intensity: null,
    mucus: null,
    pain_level: null,
    mood: null,
    vitality: null,
    discomfort: null,
    weather: null,
    sleep_hours: null,
    movement_min: null,
    water_glasses: null,
    notes: null,
    symptoms: [],
    habits: [],
  };
}

/** Registro del día: el guardado, o uno vacío (sin persistir) si aún no existe. */
export async function loadDay(date: string = localISODate()): Promise<DailyLog> {
  const stored = (await getDailyLog(date)) ?? memory[date];
  if (stored) return stored;
  const profile = await getUserProfile();
  return blank(date, profile?.current_mode ?? 'cycle');
}

/** Combina `patch` con lo ya guardado y persiste. Devuelve el registro resultante. */
export async function saveDay(patch: DayPatch, date: string = localISODate()): Promise<DailyLog> {
  const current = await loadDay(date);
  const next: DailyLog = { ...current, ...patch };
  const { id: _id, ...row } = next;
  memory[date] = next;
  await addDailyLog(row);
  return next;
}
