// ─────────────────────────────────────────────────────────
// Metztli — Respaldo opcional de datos de salud en Supabase
//
// Solo se ejecuta si la usuaria tiene sesión Y activó "Respaldar mis datos".
// Cada fila queda ligada a su user_id y las políticas RLS impiden que otra
// persona la lea. La clave natural (user_id, log_date) hace la subida
// idempotente. SQLite local sigue siendo la fuente principal.
// ─────────────────────────────────────────────────────────

import { supabase } from '@/lib/supabase';
import i18n from 'i18next';
import {
  addCycle,
  addDailyLog,
  getAllCheckupsWithLmp,
  getAllKicksWithLmp,
  getAllPregnancies,
  getCycles,
  getDailyLog,
  getDailyLogs,
  importPregnancy,
} from '@/db/database';
import { isCloudBackupEnabled } from '@/lib/prefs';
import { localISODate } from '@/lib/dailyLog';
import type { DailyLog } from '@/types';

const WINDOW_DAYS = 90;
const RESTORE_LIMIT = 365;

async function currentUserId(): Promise<string | null> {
  const { data } = await supabase.auth.getSession();
  return data.session?.user.id ?? null;
}

function check<T>(res: { data: T | null; error: { message: string } | null }, what: string): T {
  if (res.error) throw new Error(`${what}: ${res.error.message}`);
  return res.data as T;
}

export interface BackupResult {
  logs: number;
  cycles: number;
  pregnancies: number;
  stage?: string;
}

/** Guarda la etapa activa y el idioma en el perfil. Solo actúa con sesión y respaldo activado. */
export async function pushProfile(stage: string): Promise<void> {
  if (!(await isCloudBackupEnabled())) return;
  const uid = await currentUserId();
  if (!uid) return;
  const lang = ['es', 'miskitu', 'creole'].includes(i18n.language) ? i18n.language : 'es';
  check(
    await supabase.from('profiles').upsert(
      { user_id: uid, current_stage: stage, language: lang, updated_at: new Date().toISOString() },
      { onConflict: 'user_id' }
    ),
    'profiles'
  );
}

/** Sube embarazos, controles y pataditas. Los terminados van primero (solo puede haber uno activo). */
async function pushPregnancies(uid: string): Promise<number> {
  const pregnancies = await getAllPregnancies();
  if (!pregnancies.length) return 0;
  const toRow = (p: (typeof pregnancies)[number]) => ({
    user_id: uid,
    lmp_date: p.lmp_date,
    lmp_estimated: !!p.lmp_estimated,
    status: p.status,
    ended_on: p.ended_on,
  });
  const ended = pregnancies.filter((p) => p.status === 'ended').map(toRow);
  const active = pregnancies.filter((p) => p.status === 'active').map(toRow);
  const idByLmp = new Map<string, string>();
  for (const batch of [ended, active]) {
    if (!batch.length) continue;
    const saved = check(
      await supabase.from('pregnancies').upsert(batch, { onConflict: 'user_id,lmp_date' }).select('id, lmp_date'),
      'pregnancies'
    );
    for (const r of saved as any[]) idByLmp.set(r.lmp_date, r.id);
  }

  const checkups = await getAllCheckupsWithLmp();
  const rows = checkups.map((c) => ({
    pregnancy_id: idByLmp.get(c.lmp_date),
    local_uuid: c.local_uuid,
    checkup_date: c.checkup_date,
    kind: c.kind,
    place: c.place,
    weight_kg: c.weight_kg,
    bp_systolic: c.bp_systolic,
    bp_diastolic: c.bp_diastolic,
    notes: c.notes,
    done: !!c.done,
  }));
  if (rows.length) {
    check(await supabase.from('prenatal_checkups').upsert(rows, { onConflict: 'pregnancy_id,local_uuid' }), 'prenatal_checkups');
  }
  // Controles borrados en el teléfono: se quitan también de la nube
  for (const [lmp, id] of idByLmp) {
    const keep = checkups.filter((c) => c.lmp_date === lmp).map((c) => c.local_uuid);
    const del = supabase.from('prenatal_checkups').delete().eq('pregnancy_id', id);
    check(keep.length ? await del.not('local_uuid', 'in', `(${keep.map((k) => `"${k}"`).join(',')})`) : await del, 'prenatal_checkups');
  }

  const kicks = (await getAllKicksWithLmp()).filter((k) => k.local_uuid);
  if (kicks.length) {
    check(
      await supabase.from('kick_sessions').upsert(
        kicks.map((k) => ({
          pregnancy_id: idByLmp.get(k.lmp_date),
          local_uuid: k.local_uuid,
          session_date: k.session_date,
          kick_count: k.kick_count,
          duration_minutes: k.duration_minutes,
        })),
        { onConflict: 'pregnancy_id,local_uuid' }
      ),
      'kick_sessions'
    );
  }
  return pregnancies.length;
}

async function restorePregnancies(uid: string): Promise<number> {
  const remote = check(
    await supabase
      .from('pregnancies')
      .select('*, prenatal_checkups(*), kick_sessions(*)')
      .eq('user_id', uid),
    'pregnancies'
  ) as any[];
  let restored = 0;
  // Los terminados primero, para que el activo remoto no choque con uno local
  for (const p of [...remote].sort((a, b) => (a.status === 'ended' ? -1 : 1) - (b.status === 'ended' ? -1 : 1))) {
    const created = await importPregnancy(
      { lmp_date: p.lmp_date, lmp_estimated: p.lmp_estimated, status: p.status, ended_on: p.ended_on },
      (p.prenatal_checkups ?? []).map((c: any) => ({
        local_uuid: c.local_uuid,
        checkup_date: c.checkup_date,
        kind: c.kind,
        place: c.place,
        weight_kg: c.weight_kg === null ? null : Number(c.weight_kg),
        bp_systolic: c.bp_systolic,
        bp_diastolic: c.bp_diastolic,
        notes: c.notes,
        done: c.done ? 1 : 0,
      })),
      (p.kick_sessions ?? []).map((k: any) => ({
        local_uuid: k.local_uuid,
        session_date: k.session_date,
        kick_count: k.kick_count,
        duration_minutes: k.duration_minutes,
      }))
    );
    if (created) restored += 1;
  }
  return restored;
}

/** Sube los últimos 90 días de registros y los ciclos. Devuelve null si no hay sesión. */
export async function pushHealthBackup(): Promise<BackupResult | null> {
  const uid = await currentUserId();
  if (!uid) return null;

  const from = new Date();
  from.setDate(from.getDate() - WINDOW_DAYS);
  const logs = await getDailyLogs(localISODate(from), localISODate());

  if (logs.length) {
    const now = new Date().toISOString();
    const rows = logs.map((l) => ({
      user_id: uid,
      log_date: l.log_date,
      mode: l.mode,
      flow_level: l.flow_level,
      flow_color: l.flow_color,
      flow_intensity: l.flow_intensity,
      mucus: l.mucus,
      pain_level: l.pain_level,
      mood: l.mood,
      vitality: l.vitality,
      discomfort: l.discomfort,
      weather: l.weather,
      sleep_hours: l.sleep_hours,
      movement_min: l.movement_min,
      water_glasses: l.water_glasses,
      notes: l.notes,
      updated_at: now,
    }));
    const saved = check(
      await supabase.from('daily_logs').upsert(rows, { onConflict: 'user_id,log_date' }).select('id, log_date'),
      'daily_logs'
    );
    const idByDate = new Map(saved.map((r: any) => [r.log_date as string, r.id as string]));
    const ids = [...idByDate.values()];

    // Hijas: se reemplazan por completo (síntomas solo si existen en el catálogo remoto)
    const catalog = new Set(
      check(await supabase.from('symptoms').select('code'), 'symptoms').map((r: any) => r.code as string)
    );
    check(await supabase.from('daily_log_symptoms').delete().in('daily_log_id', ids), 'daily_log_symptoms');
    check(await supabase.from('daily_log_habits').delete().in('daily_log_id', ids), 'daily_log_habits');

    const symptomRows = logs.flatMap((l) =>
      l.symptoms.filter((c) => catalog.has(c)).map((c) => ({ daily_log_id: idByDate.get(l.log_date), symptom_code: c }))
    );
    const habitRows = logs.flatMap((l) => l.habits.map((c) => ({ daily_log_id: idByDate.get(l.log_date), habit_code: c })));
    if (symptomRows.length) check(await supabase.from('daily_log_symptoms').insert(symptomRows), 'daily_log_symptoms');
    if (habitRows.length) check(await supabase.from('daily_log_habits').insert(habitRows), 'daily_log_habits');
  }

  const cycles = await getCycles(24);
  if (cycles.length) {
    check(
      await supabase.from('cycles').upsert(
        cycles.map((c) => ({
          user_id: uid,
          start_date: c.start_date,
          end_date: c.end_date,
          cycle_length: c.cycle_length,
          period_length: c.period_length,
        })),
        { onConflict: 'user_id,start_date' }
      ),
      'cycles'
    );
  }

  const pregnancies = await pushPregnancies(uid);
  return { logs: logs.length, cycles: cycles.length, pregnancies };
}

/** Trae a este teléfono lo respaldado que aún no existe localmente. No pisa datos locales. */
export async function restoreHealthBackup(): Promise<BackupResult | null> {
  const uid = await currentUserId();
  if (!uid) return null;

  const remoteLogs = check(
    await supabase
      .from('daily_logs')
      .select('*, daily_log_symptoms(symptom_code), daily_log_habits(habit_code)')
      .eq('user_id', uid)
      .order('log_date', { ascending: false })
      .limit(RESTORE_LIMIT),
    'daily_logs'
  );

  let restoredLogs = 0;
  for (const r of remoteLogs as any[]) {
    if (await getDailyLog(r.log_date)) continue;
    const log: Omit<DailyLog, 'id'> = {
      log_date: r.log_date,
      mode: r.mode,
      flow_level: r.flow_level,
      flow_color: r.flow_color,
      flow_intensity: r.flow_intensity,
      mucus: r.mucus,
      pain_level: r.pain_level,
      mood: r.mood,
      vitality: r.vitality,
      discomfort: r.discomfort,
      weather: r.weather,
      sleep_hours: r.sleep_hours === null ? null : Number(r.sleep_hours),
      movement_min: r.movement_min,
      water_glasses: r.water_glasses,
      notes: r.notes,
      symptoms: (r.daily_log_symptoms ?? []).map((s: any) => s.symptom_code),
      habits: (r.daily_log_habits ?? []).map((h: any) => h.habit_code),
    };
    await addDailyLog(log);
    restoredLogs += 1;
  }

  const remoteCycles = check(await supabase.from('cycles').select('*').eq('user_id', uid), 'cycles');
  const known = new Set((await getCycles(500)).map((c) => c.start_date));
  let restoredCycles = 0;
  for (const c of remoteCycles as any[]) {
    if (known.has(c.start_date)) continue;
    await addCycle(c.start_date, c.end_date, c.cycle_length, c.period_length);
    restoredCycles += 1;
  }

  const restoredPregnancies = await restorePregnancies(uid);
  const profile = check(await supabase.from('profiles').select('current_stage').eq('user_id', uid).maybeSingle(), 'profiles');

  return {
    logs: restoredLogs,
    cycles: restoredCycles,
    pregnancies: restoredPregnancies,
    stage: (profile as any)?.current_stage ?? undefined,
  };
}

/** Borra todo el respaldo de la usuaria en la nube (las tablas hijas caen en cascada). */
export async function deleteHealthBackup(): Promise<void> {
  const uid = await currentUserId();
  if (!uid) return;
  check(await supabase.from('daily_logs').delete().eq('user_id', uid), 'daily_logs');
  check(await supabase.from('cycles').delete().eq('user_id', uid), 'cycles');
  // Embarazos: controles y pataditas caen en cascada
  check(await supabase.from('pregnancies').delete().eq('user_id', uid), 'pregnancies');
}
