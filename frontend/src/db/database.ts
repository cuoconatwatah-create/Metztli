// ─────────────────────────────────────────────────────────
// Metztli 2.0 — SQLite Database Initializer (Offline-First)
// ─────────────────────────────────────────────────────────

import * as SQLite from 'expo-sqlite';
import { Platform } from 'react-native';
import { supabase } from '@/lib/supabase';

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
    ('e1', 'embarazo', 'Las agruras o acidez significan que el bebé nacerá con mucho cabello.', 'La acidez es causada por los cambios hormonales que relajan una válvula del estómago y por la presión que ejerce el bebé al crecer, no por su cabello.'),
    ('e2', 'embarazo', 'La forma de la panza (alta o baja, redonda o puntiaguda) indica el sexo del bebé.', 'La forma de la panza depende de la estructura física de la madre, el tono muscular y la posición del bebé, no de si es niño o niña.'),
    ('e3', 'embarazo', 'No debes tejer ni enrollar hilos, porque el cordón se le puede enredar al bebé.', 'El enredo del cordón ocurre por los movimientos del bebé dentro de la panza, ninguna actividad que hagas con tus manos puede causarlo.'),
    ('e4', 'embarazo', 'Cargar cosas pesadas o levantar los brazos al inicio del embarazo causa abortos.', 'El útero protege muy bien al embrión. Sin embargo, para cuidar tu espalda, es recomendable no excederse en el esfuerzo físico.'),
    ('m1', 'menopausia', 'Con la menopausia desaparece el deseo sexual.', 'El deseo sexual puede cambiar debido a la sequedad o a las hormonas, pero muchas mujeres disfrutan de una vida sexual plena y sin la preocupación de un embarazo.'),
    ('m2', 'menopausia', 'La menopausia te hace ganar peso de forma inevitable.', 'El metabolismo se vuelve más lento con la edad. El aumento de peso se previene manteniendo una alimentación saludable y ejercicio regular.'),
    ('m3', 'menopausia', 'La menopausia es una enfermedad que requiere tratamiento médico siempre.', 'Es una etapa natural de la vida, no una enfermedad. Solo requiere tratamiento si los síntomas (como los bochornos) afectan severamente tu calidad de vida.');
  `);
}

// ─────────────────────────────────────────────────────────
// USER PROFILE
// ─────────────────────────────────────────────────────────

export async function getUserProfile(): Promise<UserProfile | null> {
  const database = await openDatabase();
  const result = (await database.getFirstAsync(
    'SELECT * FROM user_profile WHERE id = 1'
  )) as UserProfile | undefined;
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
  const result = (await database.getFirstAsync(
    'SELECT * FROM daily_logs WHERE log_date = ?',
    [date]
  )) as any;
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
  const results = (await database.getAllAsync(
    'SELECT * FROM daily_logs WHERE log_date BETWEEN ? AND ? ORDER BY log_date ASC',
    [fromDate, toDate]
  )) as any[];
  return results.map((r: any) => ({
    ...r,
    pregnancy_symptoms: r.pregnancy_symptoms
      ? JSON.parse(r.pregnancy_symptoms as unknown as string)
      : null,
    symptoms_json: r.symptoms_json
      ? JSON.parse(r.symptoms_json as unknown as string)
      : null,
  })) as DailyLog[];
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

  await database.runAsync(
    'INSERT INTO kick_counter_logs (session_date, kick_count, duration_minutes) VALUES (?, ?, ?)',
    [sessionDate, kickCount, durationMinutes]
  );
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
  const database = await openDatabase();
  return (await database.getAllAsync(
    'SELECT * FROM forum_posts WHERE is_synced = 0 ORDER BY created_at ASC'
  )) as ForumPost[];
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
    }
  } catch (err) {
    console.error('Error syncing myths:', err);
  }
}
