// ─────────────────────────────────────────────────────────
// Metztli — SQLite Database Initializer (Offline-First)
// ─────────────────────────────────────────────────────────

import * as SQLite from 'expo-sqlite';
import { Platform } from 'react-native';
import { supabase } from '@/lib/supabase';
import {
  DAILY_LOG_SQL,
  SCHEMA_VERSION,
  SYMPTOM_SEED_SQL,
  migrateLegacyDailyLogs,
  readDailyLogs,
  renameLegacyDailyLogs,
  upsertDailyLog,
} from './schema';
import {
  GESTATION_DAYS,
  addCheckup,
  addDays,
  deleteCheckup,
  dueDateFromLmp,
  endActivePregnancy,
  getActivePregnancy as selectActivePregnancy,
  insertKickSession,
  listCheckups,
  localToday,
  makeUuid,
  migrateToV3,
  resolveLmp,
  savePregnancy,
  updateCheckup,
  type CheckupInput,
} from './pregnancySchema';

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
  UserCycleLog,
  Myth,
  Pregnancy,
  PrenatalCheckup,
} from '@/types';

let db: any = null;

/**
 * Opens (or creates) the Metztli SQLite database and returns the handle.
 */
export async function openDatabase(): Promise<any> {
  if (Platform.OS === 'web') {
    // Return a mock DB for web to prevent crashes during demo
    return {
      execAsync: async () => {},
      getFirstAsync: async () => null,
      getAllAsync: async () => [],
      runAsync: async () => {},
    };
  }
  if (db) return db;
  db = await SQLite.openDatabaseAsync('metztli.db');
  await db.execAsync('PRAGMA foreign_keys = ON;');
  return db;
}

/**
 * Initializes all tables. Must be called once at app startup.
 */
export async function initializeDatabase(): Promise<void> {
  const database = await openDatabase();

  // v1 → v2: aparta la tabla daily_logs antigua (JSON en columnas) antes de crear el esquema normalizado
  await renameLegacyDailyLogs(database);

  await database.execAsync(`
    -- Perfil y modo de etapa de vida activa
    CREATE TABLE IF NOT EXISTS user_profile (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      current_mode TEXT DEFAULT 'cycle'
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

    -- Registro de ciclo de la usuaria (Brújula Lunar)
    CREATE TABLE IF NOT EXISTS user_cycle_logs (
      log_id INTEGER PRIMARY KEY AUTOINCREMENT,
      local_uuid TEXT UNIQUE NOT NULL,
      date_logged TEXT UNIQUE NOT NULL,
      flow_intensity TEXT,
      cramps_level INTEGER,
      stress_level INTEGER,
      mood_tag TEXT,
      is_synced INTEGER DEFAULT 0
    );

    -- Mitos y Realidades (Desmitificador)
    CREATE TABLE IF NOT EXISTS myths (
      id TEXT PRIMARY KEY,
      category TEXT NOT NULL,
      myth TEXT NOT NULL,
      reality TEXT NOT NULL
    );

    -- Insertar mitos iniciales para uso offline
    INSERT OR IGNORE INTO myths (id, category, myth, reality) VALUES
    ('c1', 'ciclo', 'No te puedes bañar ni lavar el cabello cuando andas con la regla.', '¡Falso! Bañarse es muy importante para la higiene y comodidad. El agua no "corta" la menstruación ni causa daño.'),
    ('c2', 'ciclo', 'Si comes cosas ácidas como limón se te corta el periodo.', 'No hay alimentos que puedan detener tu flujo menstrual. Puedes mantener tu dieta habitual sin problemas.'),
    ('c3', 'ciclo', 'La sangre menstrual es sucia o tóxica.', 'La sangre menstrual es completamente natural, está compuesta de sangre, tejido del útero y agua. No es tóxica de ninguna manera.'),
    ('c4', 'ciclo', 'No puedes hacer ejercicio mientras estás menstruando.', 'El ejercicio leve o moderado puede incluso ayudar a reducir los cólicos menstruales al liberar endorfinas.'),
    ('c5', 'ciclo', 'Las mujeres que están menstruando no deben cocinar ni preparar alimentos porque pueden dañarlos o hacer que se descompongan.', 'La menstruación es un proceso biológico natural del cuerpo femenino y no afecta la calidad de los alimentos ni la capacidad de una mujer para cocinar, trabajar, estudiar o participar en actividades comunitarias. No existe ninguna evidencia científica que demuestre que una mujer menstruando pueda dañar los alimentos o alterar su preparación. Estas creencias forman parte de mitos y tradiciones culturales transmitidas de generación en generación.'),
    ('e1', 'embarazo', 'Las agruras o acidez significan que el bebé nacerá con mucho cabello.', 'La acidez es causada por los cambios hormonales que relajan una válvula del estómago y por la presión que ejerce el bebé al crecer, no por su cabello.'),
    ('e2', 'embarazo', 'La forma de la panza (alta o baja, redonda o puntiaguda) indica el sexo del bebé.', 'La forma de la panza depende de la estructura física de la madre, el tono muscular y la posición del bebé, no de si es niño o niña.'),
    ('e3', 'embarazo', 'No debes tejer ni enrollar hilos, porque el cordón se le puede enredar al bebé.', 'El enredo del cordón ocurre por los movimientos del bebé dentro de la panza, ninguna actividad que hagas con tus manos puede causarlo.'),
    ('e4', 'embarazo', 'Cargar cosas pesadas o levantar los brazos al inicio del embarazo causa abortos.', 'El útero protege muy bien al embrión. Sin embargo, para cuidar tu espalda, es recomendable no excederse en el esfuerzo físico.'),
    ('m1', 'menopausia', 'Con la menopausia desaparece el deseo sexual.', 'El deseo sexual puede cambiar debido a la sequedad o a las hormonas, pero muchas mujeres disfrutan de una vida sexual plena y sin la preocupación de un embarazo.'),
    ('m2', 'menopausia', 'La menopausia te hace ganar peso de forma inevitable.', 'El metabolismo se vuelve más lento con la edad. El aumento de peso se previene manteniendo una alimentación saludable y ejercicio regular.'),
    ('m3', 'menopausia', 'La menopausia es una enfermedad que requiere tratamiento médico siempre.', 'Es una etapa natural de la vida, no una enfermedad. Solo requiere tratamiento si los síntomas (como los bochornos) afectan severamente tu calidad de vida.');
  `);

  // Registro diario normalizado (2FN) + catálogo de síntomas + migración desde v1
  await database.execAsync(DAILY_LOG_SQL);
  await database.execAsync(SYMPTOM_SEED_SQL);
  await migrateLegacyDailyLogs(database);
  // v3: embarazos, controles prenatales y pataditas ligadas al embarazo
  await migrateToV3(database);
  await database.execAsync(`PRAGMA user_version = ${SCHEMA_VERSION};`);
}

// ─────────────────────────────────────────────────────────
// USER PROFILE
// ─────────────────────────────────────────────────────────

// En web la base es un mock sin persistencia: se guarda en memoria.
let webMode: LifeStageMode = 'cycle';
let webPregnancy: Pregnancy | null = null;
let webCheckups: PrenatalCheckup[] = [];
let webSeq = 1;

export async function getUserProfile(): Promise<UserProfile | null> {
  const database = await openDatabase();
  const row = Platform.OS === 'web'
    ? { id: 1, current_mode: webMode }
    : ((await database.getFirstAsync('SELECT id, current_mode FROM user_profile WHERE id = 1')) as { id: 1; current_mode: LifeStageMode } | null);
  if (!row) return null;
  const preg = await getActivePregnancy();
  return {
    id: 1,
    current_mode: row.current_mode,
    lmp_date: preg?.lmp_date ?? null,
    due_date: preg ? dueDateFromLmp(preg.lmp_date) : null,
  };
}

export async function updateUserMode(mode: LifeStageMode): Promise<void> {
  webMode = mode;
  const database = await openDatabase();
  await database.runAsync('UPDATE user_profile SET current_mode = ? WHERE id = 1', [mode]);
}

// ─────────────────────────────────────────────────────────
// PREGNANCY (embarazo activo, controles prenatales)
// ─────────────────────────────────────────────────────────

export async function getActivePregnancy(): Promise<Pregnancy | null> {
  if (Platform.OS === 'web') return webPregnancy && webPregnancy.status === 'active' ? webPregnancy : null;
  return selectActivePregnancy(await openDatabase());
}

/** Crea el embarazo activo o corrige su fecha (FUM o fecha probable de parto). */
export async function savePregnancyDates(input: { lmp_date?: string; due_date?: string }): Promise<Pregnancy> {
  if (Platform.OS === 'web') {
    const { lmp, estimated } = resolveLmp(input, localToday());
    webPregnancy = webPregnancy && webPregnancy.status === 'active'
      ? { ...webPregnancy, lmp_date: lmp, lmp_estimated: estimated }
      : { id: webSeq++, lmp_date: lmp, lmp_estimated: estimated, status: 'active', ended_on: null, created_at: new Date().toISOString() };
    return webPregnancy;
  }
  return savePregnancy(await openDatabase(), input, localToday());
}

export async function updateLMPDate(lmpDate: string): Promise<void> {
  await savePregnancyDates({ lmp_date: lmpDate });
}

export async function updateDueDate(dueDate: string): Promise<void> {
  await savePregnancyDates({ due_date: dueDate });
}

/** Termina el embarazo activo. Controles y pataditas se conservan como historial. */
export async function endPregnancy(): Promise<void> {
  if (Platform.OS === 'web') {
    if (webPregnancy) webPregnancy = { ...webPregnancy, status: 'ended', ended_on: localToday() };
    return;
  }
  await endActivePregnancy(await openDatabase(), localToday());
}

export async function getPrenatalCheckups(): Promise<PrenatalCheckup[]> {
  if (Platform.OS === 'web') {
    return webPregnancy?.status === 'active'
      ? [...webCheckups].sort((a, b) => (a.checkup_date < b.checkup_date ? -1 : 1))
      : [];
  }
  return (await listCheckups(await openDatabase())) as PrenatalCheckup[];
}

export async function addPrenatalCheckup(input: CheckupInput): Promise<PrenatalCheckup> {
  if (Platform.OS === 'web') {
    if (!webPregnancy || webPregnancy.status !== 'active') throw new Error('No hay un embarazo activo');
    const row: PrenatalCheckup = {
      id: webSeq++,
      local_uuid: makeUuid(),
      pregnancy_id: webPregnancy.id,
      checkup_date: input.checkup_date,
      kind: input.kind ?? 'control',
      place: input.place ?? null,
      weight_kg: input.weight_kg ?? null,
      bp_systolic: input.bp_systolic ?? null,
      bp_diastolic: input.bp_diastolic ?? null,
      notes: input.notes ?? null,
      done: input.done ? 1 : 0,
    };
    webCheckups.push(row);
    return row;
  }
  return (await addCheckup(await openDatabase(), input)) as PrenatalCheckup;
}

export async function updatePrenatalCheckup(id: number, patch: Partial<CheckupInput>): Promise<void> {
  if (Platform.OS === 'web') {
    webCheckups = webCheckups.map((c) => (c.id === id ? ({ ...c, ...patch, done: patch.done === undefined ? c.done : patch.done ? 1 : 0 } as PrenatalCheckup) : c));
    return;
  }
  await updateCheckup(await openDatabase(), id, patch);
}

export async function removePrenatalCheckup(id: number): Promise<void> {
  if (Platform.OS === 'web') {
    webCheckups = webCheckups.filter((c) => c.id !== id);
    return;
  }
  await deleteCheckup(await openDatabase(), id);
}

// ── Respaldo en la nube (db/cloud.ts): lectura completa e importación sin pisar datos locales ──

export type CheckupWithLmp = PrenatalCheckup & { lmp_date: string };
export type KickWithLmp = KickCounterLog & { lmp_date: string };

export async function getAllPregnancies(): Promise<Pregnancy[]> {
  if (Platform.OS === 'web') return webPregnancy ? [webPregnancy] : [];
  return (await (await openDatabase()).getAllAsync('SELECT * FROM pregnancies ORDER BY lmp_date ASC')) as Pregnancy[];
}

export async function getAllCheckupsWithLmp(): Promise<CheckupWithLmp[]> {
  if (Platform.OS === 'web') return webPregnancy ? webCheckups.map((c) => ({ ...c, lmp_date: webPregnancy!.lmp_date })) : [];
  return (await (await openDatabase()).getAllAsync(
    'SELECT c.*, p.lmp_date FROM prenatal_checkups c JOIN pregnancies p ON p.id = c.pregnancy_id ORDER BY c.checkup_date'
  )) as CheckupWithLmp[];
}

export async function getAllKicksWithLmp(): Promise<KickWithLmp[]> {
  if (Platform.OS === 'web') return [];
  return (await (await openDatabase()).getAllAsync(
    'SELECT k.*, p.lmp_date FROM kick_counter_logs k JOIN pregnancies p ON p.id = k.pregnancy_id ORDER BY k.session_date'
  )) as KickWithLmp[];
}

/** Importa un embarazo con sus controles y pataditas si no existe aún (por FUM / local_uuid). */
export async function importPregnancy(
  p: { lmp_date: string; lmp_estimated: boolean; status: 'active' | 'ended'; ended_on: string | null },
  checkups: Omit<PrenatalCheckup, 'id' | 'pregnancy_id'>[],
  kicks: { local_uuid: string; session_date: string; kick_count: number; duration_minutes: number }[]
): Promise<boolean> {
  if (Platform.OS === 'web') return false;
  const database = await openDatabase();
  const existing = await database.getFirstAsync('SELECT id FROM pregnancies WHERE lmp_date = ?', [p.lmp_date]);
  let id: number | undefined = existing?.id;
  let created = false;
  if (!id) {
    // Nunca pisa el embarazo activo local: si ya hay uno, el importado entra como terminado
    const active = await selectActivePregnancy(database);
    const status = p.status === 'active' && active ? 'ended' : p.status;
    await database.runAsync('INSERT INTO pregnancies (lmp_date, lmp_estimated, status, ended_on) VALUES (?, ?, ?, ?)', [
      p.lmp_date, p.lmp_estimated ? 1 : 0, status, status === 'ended' ? p.ended_on : null,
    ]);
    id = (await database.getFirstAsync('SELECT id FROM pregnancies WHERE lmp_date = ?', [p.lmp_date])).id;
    created = true;
  }
  for (const c of checkups) {
    await database.runAsync(
      `INSERT OR IGNORE INTO prenatal_checkups
         (local_uuid, pregnancy_id, checkup_date, kind, place, weight_kg, bp_systolic, bp_diastolic, notes, done)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [c.local_uuid, id, c.checkup_date, c.kind, c.place, c.weight_kg, c.bp_systolic, c.bp_diastolic, c.notes, c.done ? 1 : 0]
    );
  }
  for (const k of kicks) {
    await database.runAsync(
      'INSERT OR IGNORE INTO kick_counter_logs (local_uuid, pregnancy_id, session_date, kick_count, duration_minutes) VALUES (?, ?, ?, ?, ?)',
      [k.local_uuid, id, k.session_date, k.kick_count, k.duration_minutes]
    );
  }
  return created;
}

export { GESTATION_DAYS, addDays, dueDateFromLmp };

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
  const results = (await database.getAllAsync(
    'SELECT * FROM cycles ORDER BY start_date DESC LIMIT ?',
    [limit]
  )) as Cycle[];
  return results;
}

export async function getLastCycle(): Promise<Cycle | null> {
  const database = await openDatabase();
  const result = (await database.getFirstAsync(
    'SELECT * FROM cycles ORDER BY start_date DESC LIMIT 1'
  )) as Cycle | undefined;
  return result ?? null;
}

// ─────────────────────────────────────────────────────────
// DAILY LOGS
// ─────────────────────────────────────────────────────────

export async function addDailyLog(log: Omit<DailyLog, 'id'>): Promise<void> {
  const database = await openDatabase();
  await upsertDailyLog(database, log);
}

export async function getDailyLog(date: string): Promise<DailyLog | null> {
  const database = await openDatabase();
  const [log] = await readDailyLogs(database, 'WHERE log_date = ?', [date]);
  return log ?? null;
}

export async function getDailyLogs(fromDate: string, toDate: string): Promise<DailyLog[]> {
  const database = await openDatabase();
  return readDailyLogs(database, 'WHERE log_date BETWEEN ? AND ?', [fromDate, toDate]);
}

// ─────────────────────────────────────────────────────────
// KICK COUNTER
// ─────────────────────────────────────────────────────────

export const fallbackKickLogs: KickCounterLog[] = [];

export async function addKickSession(
  sessionDate: string,
  kickCount: number,
  durationMinutes: number
): Promise<void> {
  const database = await openDatabase();
  
  if (Platform.OS === 'web') {
    fallbackKickLogs.unshift({
      id: Date.now(),
      session_date: sessionDate,
      kick_count: kickCount,
      duration_minutes: durationMinutes,
    });
    return;
  }

  await insertKickSession(database, sessionDate, kickCount, durationMinutes);
}

export async function getKickSessions(
  limit: number = 30
): Promise<KickCounterLog[]> {
  const database = await openDatabase();
  return (await database.getAllAsync(
    'SELECT * FROM kick_counter_logs ORDER BY session_date DESC LIMIT ?',
    [limit]
  )) as KickCounterLog[];
}

export async function getTodayKickSessions(): Promise<KickCounterLog[]> {
  const database = await openDatabase();
  const today = new Date().toISOString().split('T')[0];
  const logs = (await database.getAllAsync(
    'SELECT * FROM kick_counter_logs WHERE session_date LIKE ? ORDER BY id DESC',
    [`${today}%`]
  )) as KickCounterLog[];

  if (Platform.OS === 'web' && (!logs || logs.length === 0)) {
    return fallbackKickLogs.filter(l => l.session_date.startsWith(today));
  }
  return logs;
}

// ─────────────────────────────────────────────────────────
// DIRECTORY CONTACTS
// ─────────────────────────────────────────────────────────

export async function getDirectoryContacts(
  municipality?: string
): Promise<DirectoryContact[]> {
  const database = await openDatabase();
  if (municipality) {
    return (await database.getAllAsync(
      'SELECT * FROM directory_contacts WHERE municipality = ? ORDER BY type, institution_name',
      [municipality]
    )) as DirectoryContact[];
  }
  return (await database.getAllAsync(
    'SELECT * FROM directory_contacts ORDER BY municipality, type, institution_name'
  )) as DirectoryContact[];
}

export async function getMunicipalities(): Promise<string[]> {
  const database = await openDatabase();
  const results = (await database.getAllAsync(
    'SELECT DISTINCT municipality FROM directory_contacts ORDER BY municipality'
  )) as { municipality: string }[];
  return results.map((r: any) => r.municipality);
}

// ─────────────────────────────────────────────────────────
// FORUM POSTS
// ─────────────────────────────────────────────────────────

export const fallbackForumPosts: ForumPost[] = [
  { id: 1, local_uuid: 'f1', alias: 'LunaMenguante', category: 'ciclo_salud', question: '¿Alguien más siente mucho cansancio los días antes de que le baje?', created_at: new Date(Date.now() - 86400000).toISOString(), is_synced: 1 },
  { id: 2, local_uuid: 'f2', alias: 'MamaPrimeriza', category: 'embarazo_parto', question: 'Tengo 6 semanas y las náuseas son terribles. ¿El té de jengibre es seguro?', created_at: new Date(Date.now() - 172800000).toISOString(), is_synced: 1 },
  { id: 3, local_uuid: 'f3', alias: 'SabiduriaAncestral', category: 'saberes_ancestrales', question: 'Mi abuela recomienda tomar infusión de ruda para los cólicos. ¿Qué opinan?', created_at: new Date(Date.now() - 259200000).toISOString(), is_synced: 1 },
  { id: 4, local_uuid: 'f4', alias: 'NuevaEtapa', category: 'menopausia', question: 'Los bochornos me están despertando por la noche. ¿Algún remedio natural?', created_at: new Date(Date.now() - 345600000).toISOString(), is_synced: 1 },
];

export async function addForumPost(
  localUuid: string,
  alias: string,
  category: ForumCategory,
  question: string
): Promise<void> {
  const database = await openDatabase();
  const createdAt = new Date().toISOString();
  
  if (Platform.OS === 'web') {
    fallbackForumPosts.unshift({
      id: Date.now(),
      local_uuid: localUuid,
      alias,
      category,
      question,
      created_at: createdAt,
      is_synced: 0,
    });
  } else {
    await database.runAsync(
      'INSERT INTO forum_posts (local_uuid, alias, category, question, created_at, is_synced) VALUES (?, ?, ?, ?, ?, 0)',
      [localUuid, alias, category, question, createdAt]
    );
  }
}

export async function getForumPosts(
  category?: ForumCategory
): Promise<ForumPost[]> {
  const database = await openDatabase();
  let posts: ForumPost[] = [];
  
  if (category) {
    posts = (await database.getAllAsync(
      'SELECT * FROM forum_posts WHERE category = ? ORDER BY created_at DESC',
      [category]
    )) as ForumPost[];
  } else {
    posts = (await database.getAllAsync(
      'SELECT * FROM forum_posts ORDER BY created_at DESC'
    )) as ForumPost[];
  }

  // Fallback for Web/Demo
  if (!posts || posts.length === 0) {
    if (category) {
      return fallbackForumPosts.filter(p => p.category === category);
    }
    return fallbackForumPosts;
  }

  return posts;
}

export async function getUnsyncedPosts(): Promise<ForumPost[]> {
  if (Platform.OS === 'web') return fallbackForumPosts.filter((p) => p.is_synced === 0);
  const database = await openDatabase();
  return (await database.getAllAsync(
    'SELECT * FROM forum_posts WHERE is_synced = 0 ORDER BY created_at ASC'
  )) as ForumPost[];
}

export async function markPostAsSynced(localUuid: string): Promise<void> {
  if (Platform.OS === 'web') {
    fallbackForumPosts.forEach((p) => { if (p.local_uuid === localUuid) p.is_synced = 1; });
    return;
  }
  const database = await openDatabase();
  await database.runAsync(
    'UPDATE forum_posts SET is_synced = 1 WHERE local_uuid = ?',
    [localUuid]
  );
}

/** Guarda publicaciones bajadas de Supabase (o marca como sincronizadas las que ya existían). */
export async function saveRemoteForumPosts(
  posts: { local_uuid: string; alias: string; category: ForumCategory; question: string; created_at: string }[]
): Promise<void> {
  if (Platform.OS === 'web') {
    for (const p of posts) {
      const existing = fallbackForumPosts.find((x) => x.local_uuid === p.local_uuid);
      if (existing) existing.is_synced = 1;
      else fallbackForumPosts.push({ id: Date.now() + Math.random(), ...p, is_synced: 1 });
    }
    fallbackForumPosts.sort((a, b) => (a.created_at < b.created_at ? 1 : -1));
    return;
  }
  const database = await openDatabase();
  for (const p of posts) {
    await database.runAsync(
      `INSERT INTO forum_posts (local_uuid, alias, category, question, created_at, is_synced)
       VALUES (?, ?, ?, ?, ?, 1)
       ON CONFLICT(local_uuid) DO UPDATE SET is_synced = 1`,
      [p.local_uuid, p.alias, p.category, p.question, p.created_at]
    );
  }
}

// ─────────────────────────────────────────────────────────
// OFFLINE FAQS
// ─────────────────────────────────────────────────────────

export async function getOfflineFAQs(category?: string): Promise<OfflineFAQ[]> {
  const database = await openDatabase();
  if (category) {
    return (await database.getAllAsync(
      'SELECT * FROM offline_faqs WHERE category = ? ORDER BY id',
      [category]
    )) as OfflineFAQ[];
  }
  return (await database.getAllAsync(
    'SELECT * FROM offline_faqs ORDER BY category, id'
  )) as OfflineFAQ[];
}
// ─────────────────────────────────────────────────────────
// BRÚJULA LUNAR (USER CYCLE LOGS)
// ─────────────────────────────────────────────────────────

export async function addUserCycleLog(
  log: Omit<UserCycleLog, 'log_id' | 'local_uuid' | 'is_synced'>
): Promise<void> {
  const database = await openDatabase();
  const localUuid = Math.random().toString(36).substring(2, 15);
  
  if (Platform.OS === 'web') {
    const existingIndex = fallbackCycleLogs.findIndex(l => l.date_logged === log.date_logged);
    if (existingIndex >= 0) {
      fallbackCycleLogs[existingIndex] = { ...fallbackCycleLogs[existingIndex], ...log };
    } else {
      fallbackCycleLogs.push({
        log_id: Date.now(),
        local_uuid: localUuid,
        date_logged: log.date_logged,
        flow_intensity: log.flow_intensity ?? null,
        cramps_level: log.cramps_level ?? 0,
        stress_level: log.stress_level ?? 0,
        mood_tag: log.mood_tag ?? null,
        is_synced: 0
      });
    }
    return;
  }

  await database.runAsync(
    `INSERT OR REPLACE INTO user_cycle_logs 
      (local_uuid, date_logged, flow_intensity, cramps_level, stress_level, mood_tag, is_synced)
     VALUES (
       COALESCE((SELECT local_uuid FROM user_cycle_logs WHERE date_logged = ?), ?), 
       ?, ?, ?, ?, ?, 0
     )`,
    [
      log.date_logged,
      localUuid,
      log.date_logged,
      log.flow_intensity ?? null,
      log.cramps_level ?? 0,
      log.stress_level ?? 0,
      log.mood_tag ?? null,
    ]
  );
}

export async function getUserCycleLog(date: string): Promise<UserCycleLog | null> {
  const database = await openDatabase();
  const result = (await database.getFirstAsync(
    'SELECT * FROM user_cycle_logs WHERE date_logged = ?',
    [date]
  )) as UserCycleLog | undefined;
  return result ?? null;
}

export async function getUserCycleLogs(
  fromDate: string,
  toDate: string
): Promise<UserCycleLog[]> {
  const database = await openDatabase();
  return (await database.getAllAsync(
    'SELECT * FROM user_cycle_logs WHERE date_logged BETWEEN ? AND ? ORDER BY date_logged ASC',
    [fromDate, toDate]
  )) as UserCycleLog[];
}

export const fallbackCycleLogs: UserCycleLog[] = (() => {
  const logs: UserCycleLog[] = [];
  const today = new Date();
  
  // Generar 3 meses de ciclos pasados (aprox 28 dias cada uno)
  for (let i = 0; i < 3; i++) {
    const cycleStart = new Date(today);
    cycleStart.setDate(today.getDate() - (i * 28) - 14); // Empezó hace 14 días (mitad de ciclo)
    
    // 5 días de periodo
    for (let day = 0; day < 5; day++) {
      const logDate = new Date(cycleStart);
      logDate.setDate(cycleStart.getDate() + day);
      logs.push({
        log_id: Date.now() + day + i * 10,
        local_uuid: `cycle_${i}_${day}`,
        date_logged: logDate.toISOString().split('T')[0],
        flow_intensity: day < 2 ? 'heavy' : day < 4 ? 'medium' : 'light',
        cramps_level: day < 2 ? 3 : 1,
        stress_level: 2,
        mood_tag: day === 0 ? 'sensitive' : 'calm',
        is_synced: 1
      });
    }
  }
  return logs.sort((a, b) => a.date_logged.localeCompare(b.date_logged));
})();

export async function getAllUserCycleLogs(): Promise<UserCycleLog[]> {
  const database = await openDatabase();
  const logs = (await database.getAllAsync(
    'SELECT * FROM user_cycle_logs ORDER BY date_logged ASC'
  )) as UserCycleLog[];
  
  if (Platform.OS === 'web' && (!logs || logs.length === 0)) {
    return fallbackCycleLogs;
  }
  return logs;
}

// ─────────────────────────────────────────────────────────
// DESMITIFICADOR (MYTHS)
// ─────────────────────────────────────────────────────────

export const fallbackMyths: Myth[] = [
  { id: 'c1', category: 'ciclo', myth: 'No te puedes bañar ni lavar el cabello cuando andas con la regla.', reality: '¡Falso! Bañarse es muy importante para la higiene y comodidad. El agua no "corta" la menstruación ni causa daño.' },
  { id: 'c2', category: 'ciclo', myth: 'Si comes cosas ácidas como limón se te corta el periodo.', reality: 'No hay alimentos que puedan detener tu flujo menstrual. Puedes mantener tu dieta habitual sin problemas.' },
  { id: 'c3', category: 'ciclo', myth: 'La sangre menstrual es sucia o tóxica.', reality: 'La sangre menstrual es completamente natural, está compuesta de sangre, tejido del útero y agua. No es tóxica de ninguna manera.' },
  { id: 'c4', category: 'ciclo', myth: 'No puedes hacer ejercicio mientras estás menstruando.', reality: 'El ejercicio leve o moderado puede incluso ayudar a reducir los cólicos menstruales al liberar endorfinas.' },
  { id: 'c5', category: 'ciclo', myth: 'Las mujeres que están menstruando no deben cocinar ni preparar alimentos porque pueden dañarlos o hacer que se descompongan.', reality: 'La menstruación es un proceso biológico natural del cuerpo femenino y no afecta la calidad de los alimentos ni la capacidad de una mujer para cocinar, trabajar, estudiar o participar en actividades comunitarias. No existe ninguna evidencia científica que demuestre que una mujer menstruando pueda dañar los alimentos o alterar su preparación. Estas creencias forman parte de mitos y tradiciones culturales transmitidas de generación en generación.' },
  { id: 'e1', category: 'embarazo', myth: 'Las agruras o acidez significan que el bebé nacerá con mucho cabello.', reality: 'La acidez es causada por los cambios hormonales que relajan una válvula del estómago y por la presión que ejerce el bebé al crecer, no por su cabello.' },
  { id: 'e2', category: 'embarazo', myth: 'La forma de la panza (alta o baja, redonda o puntiaguda) indica el sexo del bebé.', reality: 'La forma de la panza depende de la estructura física de la madre, el tono muscular y la posición del bebé, no de si es niño o niña.' },
  { id: 'e3', category: 'embarazo', myth: 'No debes tejer ni enrollar hilos, porque el cordón se le puede enredar al bebé.', reality: 'El enredo del cordón ocurre por los movimientos del bebé dentro de la panza, ninguna actividad que hagas con tus manos puede causarlo.' },
  { id: 'e4', category: 'embarazo', myth: 'Cargar cosas pesadas o levantar los brazos al inicio del embarazo causa abortos.', reality: 'El útero protege muy bien al embrión. Sin embargo, para cuidar tu espalda, es recomendable no excederse en el esfuerzo físico.' },
  { id: 'm1', category: 'menopausia', myth: 'Con la menopausia desaparece el deseo sexual.', reality: 'El deseo sexual puede cambiar debido a la sequedad o a las hormonas, pero muchas mujeres disfrutan de una vida sexual plena y sin la preocupación de un embarazo.' },
  { id: 'm2', category: 'menopausia', myth: 'La menopausia te hace ganar peso de forma inevitable.', reality: 'El metabolismo se vuelve más lento con la edad. El aumento de peso se previene manteniendo una alimentación saludable y ejercicio regular.' },
  { id: 'm3', category: 'menopausia', myth: 'La menopausia es una enfermedad que requiere tratamiento médico siempre.', reality: 'Es una etapa natural de la vida, no una enfermedad. Solo requiere tratamiento si los síntomas (como los bochornos) afectan severamente tu calidad de vida.' }
];

export async function getLocalMyths(): Promise<Myth[]> {
  const database = await openDatabase();
  const myths = (await database.getAllAsync(
    'SELECT * FROM myths ORDER BY id ASC'
  )) as Myth[];

  // Fallback para Web (donde SQLite es un mock) o si la DB falló al inicializar
  if (!myths || myths.length === 0) {
    return fallbackMyths;
  }

  return myths;
}

/**
 * Quita de este teléfono las publicaciones ya sincronizadas que la nube dejó de tener
 * (moderación). Solo dentro de la ventana que se acaba de bajar: lo más antiguo no se toca.
 */
export async function pruneSyncedForumPosts(keepUuids: string[], sinceISO: string | null): Promise<void> {
  const keep = new Set(keepUuids);
  if (Platform.OS === 'web') {
    for (let i = fallbackForumPosts.length - 1; i >= 0; i--) {
      const p = fallbackForumPosts[i];
      const inWindow = sinceISO === null || p.created_at >= sinceISO;
      if (p.is_synced === 1 && inWindow && !keep.has(p.local_uuid) && !p.local_uuid.startsWith('f')) fallbackForumPosts.splice(i, 1);
    }
    return;
  }
  const database = await openDatabase();
  const rows = (await database.getAllAsync(
    sinceISO === null
      ? 'SELECT local_uuid FROM forum_posts WHERE is_synced = 1'
      : 'SELECT local_uuid FROM forum_posts WHERE is_synced = 1 AND created_at >= ?',
    sinceISO === null ? [] : [sinceISO]
  )) as { local_uuid: string }[];
  for (const r of rows) {
    if (!keep.has(r.local_uuid)) await database.runAsync('DELETE FROM forum_posts WHERE local_uuid = ?', [r.local_uuid]);
  }
}

export async function syncMythsFromSupabase(): Promise<void> {
  try {
    const { data: remoteMyths, error } = await supabase
      .from('myths')
      .select('*');

    if (error) {
      console.error('Error fetching myths from Supabase:', error);
      return;
    }

    if (remoteMyths && remoteMyths.length > 0) {
      const database = await openDatabase();
      for (const myth of remoteMyths) {
        await database.runAsync(
          `INSERT OR REPLACE INTO myths (id, category, myth, reality) VALUES (?, ?, ?, ?)`,
          [myth.id, myth.category, myth.myth, myth.reality]
        );
      }
      // La nube es la fuente de verdad: un mito eliminado por la administradora sale también de aquí
      const ids = remoteMyths.map((m: any) => m.id as string);
      await database.runAsync(`DELETE FROM myths WHERE id NOT IN (${ids.map(() => '?').join(', ')})`, ids);
    }
  } catch (err) {
    console.error('Error syncing myths:', err);
  }
}
