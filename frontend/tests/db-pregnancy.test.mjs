// Prueba del modelo de embarazo (esquema v3) y su migración v2→v3 sobre SQLite real.
// Requiere Node >= 22.5 (node:sqlite).  cd frontend && npm run test:db
import { DatabaseSync } from 'node:sqlite';
import assert from 'node:assert/strict';
import * as P from '../src/db/pregnancySchema.ts';

function adapt(raw) {
  return {
    execAsync: async (sql) => raw.exec(sql),
    runAsync: async (sql, params = []) => raw.prepare(sql).run(...params),
    getFirstAsync: async (sql, params = []) => raw.prepare(sql).get(...params) ?? null,
    getAllAsync: async (sql, params = []) => raw.prepare(sql).all(...params),
  };
}
const TODAY = '2026-10-08';

// ── Base v2 con embarazo en el perfil y pataditas ──
const raw = new DatabaseSync(':memory:');
raw.exec('PRAGMA foreign_keys = ON;');
raw.exec(`
  CREATE TABLE user_profile (id INTEGER PRIMARY KEY CHECK (id = 1), current_mode TEXT DEFAULT 'cycle', lmp_date TEXT, due_date TEXT);
  INSERT INTO user_profile (id, current_mode, due_date) VALUES (1, 'pregnancy', '2027-01-15');
  CREATE TABLE kick_counter_logs (id INTEGER PRIMARY KEY AUTOINCREMENT, session_date TEXT NOT NULL, kick_count INTEGER NOT NULL, duration_minutes INTEGER NOT NULL);
  INSERT INTO kick_counter_logs (session_date, kick_count, duration_minutes) VALUES ('2026-10-05T10:00:00Z', 10, 40), ('2026-10-06T10:00:00Z', 12, 35);
`);
const db = adapt(raw);

await P.migrateToV3(db);
const preg = await P.getActivePregnancy(db);
assert.equal(preg.lmp_date, P.addDays('2027-01-15', -280), 'FUM calculada desde la fecha probable');
assert.equal(preg.lmp_estimated, 1);
assert.equal(P.dueDateFromLmp(preg.lmp_date), '2027-01-15', 'la fecha probable se deriva, no se guarda');
const kicks = raw.prepare('SELECT * FROM kick_counter_logs').all();
assert.ok(kicks.every((k) => k.pregnancy_id === preg.id && k.local_uuid), 'pataditas ligadas y con uuid');
const cols = raw.prepare('PRAGMA table_info(user_profile)').all().map((c) => c.name);
assert.deepEqual(cols, ['id', 'current_mode'], 'columnas sueltas eliminadas del perfil');
console.log('✓ migración v2→v3');

// idempotencia
await P.migrateToV3(db);
assert.equal((await db.getAllAsync('SELECT * FROM pregnancies')).length, 1);
console.log('✓ idempotente');

// ── Reglas del embarazo ──
await assert.rejects(() => P.savePregnancy(db, { lmp_date: '2026-13-40' }, TODAY), (e) => e.code === 'invalid_date');
await assert.rejects(() => P.savePregnancy(db, { lmp_date: '2026-12-01' }, TODAY), (e) => e.code === 'future_date');
await assert.rejects(() => P.savePregnancy(db, { lmp_date: '2025-01-01' }, TODAY), (e) => e.code === 'too_old');
const updated = await P.savePregnancy(db, { lmp_date: '2026-06-01' }, TODAY);
assert.equal(updated.id, preg.id, 'editar la fecha no crea otro embarazo');
assert.equal(updated.lmp_estimated, 0);
await assert.rejects(() => db.runAsync("INSERT INTO pregnancies (lmp_date, status) VALUES ('2026-07-01', 'active')"), /UNIQUE/);
console.log('✓ validaciones y un solo embarazo activo');

// ── Controles ──
const c1 = await P.addCheckup(db, { checkup_date: '2026-10-20', kind: 'ecografia', place: 'Hospital Regional' });
await P.addCheckup(db, { checkup_date: '2026-10-10', weight_kg: 62.5, bp_systolic: 110, bp_diastolic: 70, done: true });
const list = await P.listCheckups(db);
assert.deepEqual(list.map((c) => c.checkup_date), ['2026-10-10', '2026-10-20']);
await P.updateCheckup(db, c1.id, { done: true, weight_kg: 63 });
assert.equal((await P.listCheckups(db))[1].done, 1);
await assert.rejects(() => P.addCheckup(db, { checkup_date: '2026-10-11', weight_kg: 5 }), /CHECK/);
await assert.rejects(() => P.addCheckup(db, { checkup_date: '2026-10-11', kind: 'x' }), /CHECK/);
await P.deleteCheckup(db, c1.id);
assert.equal((await P.listCheckups(db)).length, 1);
console.log('✓ controles prenatales');

// ── Pataditas nuevas ──
await P.insertKickSession(db, '2026-10-08T09:00:00Z', 10, 30);
const last = raw.prepare('SELECT * FROM kick_counter_logs ORDER BY id DESC LIMIT 1').get();
assert.equal(last.pregnancy_id, preg.id);

// ── Terminar embarazo: ya no hay activo; el historial y los controles se conservan ──
await P.endActivePregnancy(db, TODAY);
assert.equal(await P.getActivePregnancy(db), null);
assert.equal((await P.listCheckups(db)).length, 0, 'controles del activo: ninguno');
assert.equal(raw.prepare('SELECT COUNT(*) n FROM prenatal_checkups').get().n, 1, 'no se borran al terminar');
await assert.rejects(() => P.addCheckup(db, { checkup_date: '2026-10-11' }), (e) => e.code === 'no_active_pregnancy');
const second = await P.savePregnancy(db, { lmp_date: '2026-09-01' }, TODAY);
assert.notEqual(second.id, preg.id, 'un embarazo nuevo después de terminar el anterior');
// cascada
raw.prepare('DELETE FROM pregnancies WHERE id = ?').run(preg.id);
assert.equal(raw.prepare('SELECT COUNT(*) n FROM prenatal_checkups').get().n, 0, 'cascade a controles');
assert.ok(raw.prepare('SELECT COUNT(*) n FROM kick_counter_logs WHERE pregnancy_id IS NULL').get().n >= 3, 'pataditas pasan a NULL (set null)');
console.log('✓ ciclo de vida, cascada y set null');

// fresh install
const raw2 = new DatabaseSync(':memory:'); raw2.exec('PRAGMA foreign_keys = ON;');
raw2.exec(`CREATE TABLE user_profile (id INTEGER PRIMARY KEY CHECK (id = 1), current_mode TEXT DEFAULT 'cycle'); CREATE TABLE kick_counter_logs (id INTEGER PRIMARY KEY AUTOINCREMENT, session_date TEXT NOT NULL, kick_count INTEGER NOT NULL, duration_minutes INTEGER NOT NULL);`);
await P.migrateToV3(adapt(raw2));
console.log('✓ instalación limpia');
