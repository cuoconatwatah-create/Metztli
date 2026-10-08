// Prueba del registro diario normalizado (2FN) y su migración v1→v2 sobre SQLite real.
// Requiere Node >= 22.5 (node:sqlite).  cd frontend && npm run test:db
import { DatabaseSync } from 'node:sqlite';
import assert from 'node:assert/strict';
import {
  DAILY_LOG_SQL, SYMPTOM_SEED_SQL, renameLegacyDailyLogs, migrateLegacyDailyLogs, upsertDailyLog, readDailyLogs,
} from '../src/db/schema.ts';

function adapt(raw) {
  return {
    execAsync: async (sql) => raw.exec(sql),
    runAsync: async (sql, params = []) => raw.prepare(sql).run(...params),
    getFirstAsync: async (sql, params = []) => raw.prepare(sql).get(...params) ?? null,
    getAllAsync: async (sql, params = []) => raw.prepare(sql).all(...params),
  };
}

// ── 1. Base v1 con datos reales del formato anterior ──
const raw = new DatabaseSync(':memory:');
raw.exec('PRAGMA foreign_keys = ON;');
raw.exec(`CREATE TABLE daily_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT, log_date TEXT UNIQUE NOT NULL, mode TEXT NOT NULL, flow_level TEXT,
  pain_level INTEGER, pregnancy_symptoms TEXT, mood TEXT, symptoms_json TEXT, notes TEXT);`);
const ins = raw.prepare('INSERT INTO daily_logs (log_date, mode, flow_level, pain_level, pregnancy_symptoms, mood, symptoms_json, notes) VALUES (?,?,?,?,?,?,?,?)');
ins.run('2026-10-01', 'cycle', 'medium', 3, null, null,
  JSON.stringify(['cramps', 'low_energy', 'flow_color:rojo_brillante', 'mucus:seca', 'sleep:6.5', 'move:25', 'water:4', 'mood:triste', 'vitality:2', 'discomfort:4', 'weather:lluvia']), null);
ins.run('2026-10-02', 'pregnancy', null, null, JSON.stringify(['nausea', 'swelling']), 'calm', null, JSON.stringify(['water', 'walk']));
ins.run('2026-10-03', 'cycle', 'raro', 99, null, null, JSON.stringify(['algo_nuevo', 'sleep:abc']), 'nota libre de la usuaria');
const db = adapt(raw);

// ── 2. Migración ──
await renameLegacyDailyLogs(db);
await db.execAsync(DAILY_LOG_SQL);
await db.execAsync(SYMPTOM_SEED_SQL);
const migrated = await migrateLegacyDailyLogs(db);
assert.equal(migrated, 3);
assert.equal(await db.getFirstAsync("SELECT name FROM sqlite_master WHERE name='daily_logs_legacy'"), null, 'la tabla vieja se elimina');

const logs = await readDailyLogs(db);
const [a, b, c] = logs;
assert.equal(a.flow_color, 'rojo_brillante'); assert.equal(a.mucus, 'seca');
assert.equal(a.sleep_hours, 6.5); assert.equal(a.movement_min, 25); assert.equal(a.water_glasses, 4);
assert.equal(a.mood, 'triste'); assert.equal(a.vitality, 2); assert.equal(a.discomfort, 4); assert.equal(a.weather, 'lluvia');
assert.deepEqual(a.symptoms, ['cramps', 'low_energy']); assert.equal(a.flow_level, 'medium'); assert.equal(a.pain_level, 3);
assert.deepEqual(b.symptoms, ['nausea', 'swelling']); assert.deepEqual(b.habits, ['walk', 'water']);
assert.equal(b.notes, null); assert.equal(b.mood, 'calm'); assert.equal(b.mode, 'pregnancy');
assert.equal(c.flow_level, null, 'valor inválido se descarta'); assert.equal(c.pain_level, null);
assert.equal(c.notes, 'nota libre de la usuaria'); assert.equal(c.sleep_hours, null);
assert.deepEqual(c.symptoms, ['algo_nuevo']);
assert.ok(await db.getFirstAsync("SELECT 1 FROM symptoms WHERE code='algo_nuevo'"), 'síntoma desconocido entra al catálogo');
console.log('✓ migración v1→v2');

// ── 3. Upsert conserva id y reemplaza hijas ──
const idBefore = (await db.getFirstAsync('SELECT id FROM daily_logs WHERE log_date=?', ['2026-10-01'])).id;
await upsertDailyLog(db, { ...a, mood: 'feliz', symptoms: ['headache'], habits: ['breathe'] });
const [a2] = await readDailyLogs(db, 'WHERE log_date = ?', ['2026-10-01']);
assert.equal(a2.id, idBefore, 'el id no cambia (no hay INSERT OR REPLACE)');
assert.deepEqual(a2.symptoms, ['headache']); assert.deepEqual(a2.habits, ['breathe']); assert.equal(a2.mood, 'feliz');
assert.equal(a2.sleep_hours, 6.5);
console.log('✓ upsert');

// ── 4. Integridad ──
await assert.rejects(() => upsertDailyLog(db, { ...a, log_date: '2026-10-09', mode: 'otro' }), /CHECK/);
assert.equal(await db.getFirstAsync('SELECT 1 FROM daily_logs WHERE log_date=?', ['2026-10-09']), null, 'rollback');
await assert.rejects(() => upsertDailyLog(db, { ...a, log_date: '2026-10-10', vitality: 9 }), /CHECK/);
await assert.rejects(() => db.runAsync('INSERT INTO daily_log_symptoms VALUES (999, ?)', ['cramps']), /FOREIGN KEY/);
await assert.rejects(() => db.runAsync('INSERT INTO daily_log_symptoms VALUES (?, ?)', [idBefore, 'no_existe']), /FOREIGN KEY/);
await db.runAsync('DELETE FROM daily_logs WHERE id = ?', [idBefore]);
assert.equal((await db.getAllAsync('SELECT * FROM daily_log_symptoms WHERE daily_log_id=?', [idBefore])).length, 0, 'cascade');
console.log('✓ integridad (CHECK, FK, rollback, cascade)');

// ── 5. Instalación limpia y escrituras concurrentes ──
const raw2 = new DatabaseSync(':memory:'); raw2.exec('PRAGMA foreign_keys = ON;');
const db2 = adapt(raw2);
await renameLegacyDailyLogs(db2); await db2.execAsync(DAILY_LOG_SQL); await db2.execAsync(SYMPTOM_SEED_SQL);
assert.equal(await migrateLegacyDailyLogs(db2), 0);
const base = { mode: 'cycle', flow_level: null, flow_color: null, flow_intensity: null, mucus: null, pain_level: null, mood: null, vitality: null, discomfort: null, weather: null, sleep_hours: null, movement_min: null, water_glasses: null, notes: null, symptoms: [], habits: [] };
await Promise.all(Array.from({ length: 20 }, (_, i) => upsertDailyLog(db2, { ...base, log_date: `2026-11-${String(i + 1).padStart(2, '0')}`, symptoms: ['cramps', 'headache'] })));
assert.equal((await readDailyLogs(db2)).length, 20);
assert.equal((await db2.getFirstAsync('SELECT COUNT(*) n FROM daily_log_symptoms')).n, 40);
// idempotencia de la migración
await renameLegacyDailyLogs(db); assert.equal(await migrateLegacyDailyLogs(db), 0);
console.log('✓ instalación limpia, concurrencia, idempotencia');
const idx = raw.prepare("SELECT name FROM sqlite_master WHERE type='index' AND name LIKE 'idx_%'").all();
console.log('índices:', idx.map((i) => i.name).join(', '));
