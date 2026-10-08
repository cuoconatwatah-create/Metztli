// Pruebas de roles y RLS: aplica TODAS las migraciones sobre un PostgreSQL real en memoria (PGlite)
// y simula sesiones de usuaria, administradora, auditora y sin sesión.
//   cd backend && npm install && npm run test:rls
import { PGlite } from '@electric-sql/pglite';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const dir = new URL('../supabase/migrations/', import.meta.url);
const files = fs.readdirSync(dir).filter((f) => f.endsWith('.sql')).sort();
const db = new PGlite();

// ── Simula lo que Supabase ya trae: esquema auth, roles y permisos por defecto ──
await db.exec(`
  CREATE ROLE anon NOLOGIN; CREATE ROLE authenticated NOLOGIN;
  CREATE SCHEMA auth;
  CREATE TABLE auth.users (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), email text, raw_user_meta_data jsonb DEFAULT '{}', created_at timestamptz DEFAULT now());
  CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE AS $$ SELECT nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
  GRANT USAGE ON SCHEMA auth, public TO anon, authenticated;
  GRANT EXECUTE ON FUNCTION auth.uid() TO anon, authenticated;
  ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO anon, authenticated;
  ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO anon, authenticated;
  CREATE FUNCTION public.uuid_generate_v4() RETURNS uuid LANGUAGE sql AS 'SELECT gen_random_uuid()';
`);

// ── Todas las migraciones, en orden (sin CREATE EXTENSION: lo provee la función de arriba) ──
for (const f of files) {
  const sql = fs.readFileSync(new URL(f, dir), 'utf8').replace(/^\uFEFF/, '').replace(/CREATE EXTENSION[^;]*;/gi, '');
  try { await db.exec(sql); } catch (e) { console.error('✗ falla en', f, '\n', e.message); process.exit(1); }
}
console.log('✓ migraciones aplicadas:', files.length);

const U1 = '11111111-1111-1111-1111-111111111111';
const U2 = '22222222-2222-2222-2222-222222222222';
const ADM = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
const AUD = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';
for (const [id, email] of [[U1, 'ana@example.com'], [U2, 'beto@example.com'], [ADM, 'admin@example.com'], [AUD, 'audit@example.com']]) {
  await db.query('INSERT INTO auth.users (id, email, raw_user_meta_data) VALUES ($1, $2, $3)', [id, email, JSON.stringify({ display_name: email.split('@')[0] })]);
}
// El trigger de registro crea perfil y rol 'user'
assert.equal((await db.query('SELECT count(*)::int n FROM user_roles')).rows[0].n, 4);
assert.equal((await db.query('SELECT count(*)::int n FROM profiles')).rows[0].n, 4);
// Arranque: la dueña del proyecto asigna los primeros roles (como superusuaria, vía SQL)
await db.exec(`UPDATE user_roles SET role='admin' WHERE user_id='${ADM}'; UPDATE user_roles SET role='auditor' WHERE user_id='${AUD}';`);
console.log('✓ registro crea perfil + rol "user"; arranque de admin y auditora');

// ── Ayudante: ejecutar como un rol de Supabase con un usuario concreto ──
async function as(role, uid, fn) {
  await db.exec(`SET ROLE ${role}; SELECT set_config('request.jwt.claim.sub', '${uid ?? ''}', false);`);
  try { return await fn(); } finally { await db.exec('RESET ROLE; SELECT set_config(\'request.jwt.claim.sub\', \'\', false);'); }
}
const q = (sql, p) => db.query(sql, p);
const fails = async (p, re) => assert.rejects(p, re);

// datos de apoyo (como superusuaria)
await db.exec(`INSERT INTO forum_posts (local_uuid, alias, category, question) VALUES ('p1','Luna','ciclo_salud','¿Es normal?'), ('p2','Sol','menopausia','Bochornos');`);
await as('authenticated', U1, () => q(`INSERT INTO daily_logs (log_date, mode, mood) VALUES ('2026-10-01','cycle','feliz')`));
await as('authenticated', U2, () => q(`INSERT INTO daily_logs (log_date, mode, mood) VALUES ('2026-10-01','cycle','triste')`));

// ── USUARIA ──
await as('authenticated', U1, async () => {
  assert.equal((await q('SELECT my_role() r')).rows[0].r, 'user');
  assert.deepEqual((await q('SELECT user_id FROM user_roles')).rows.map((r) => r.user_id), [U1], 'solo ve su propio rol');
  await fails(q(`SELECT set_user_role('${U1}', 'admin')`), /Solo una administradora/);
  await fails(q(`UPDATE user_roles SET role='admin' WHERE user_id='${U1}'`), /permission denied/);
  await fails(q(`INSERT INTO user_roles (user_id, role) VALUES ('${U2}', 'admin')`), /permission denied/);
  assert.equal((await q('SELECT * FROM audit_log')).rows.length, 0, 'no ve la bitácora');
  await fails(q('SELECT audit_stats()'), /personal de auditoría/);
  await fails(q('SELECT * FROM admin_list_users()'), /Solo una administradora/);
  await fails(q(`INSERT INTO myths (id, category, myth, reality) VALUES ('x1','ciclo','m','r')`), /row-level security/);
  assert.equal((await q(`DELETE FROM forum_posts RETURNING id`)).rows.length, 0, 'no puede moderar');
  assert.deepEqual((await q('SELECT mood FROM daily_logs')).rows, [{ mood: 'feliz' }], 'solo ve sus registros');
});
console.log('✓ usuaria: solo lo suyo; no cambia roles, no ve auditoría, no modera');

// ── ADMINISTRADORA ──
await as('authenticated', ADM, async () => {
  assert.equal((await q('SELECT my_role() r')).rows[0].r, 'admin');
  assert.equal((await q('SELECT * FROM daily_logs')).rows.length, 0, 'ni la admin lee datos íntimos');
  const users = (await q('SELECT * FROM admin_list_users()')).rows;
  assert.equal(users.length, 4);
  assert.ok(users.every((u) => /^.\*\*\*@/.test(u.email_masked)), 'correos enmascarados');
  await q(`SELECT set_user_role('${U1}', 'auditor')`);
  assert.equal((await q(`SELECT role FROM user_roles WHERE user_id='${U1}'`)).rows[0].role, 'auditor');
  await q(`SELECT set_user_role('${U1}', 'user')`);
  await fails(q(`SELECT set_user_role('${U1}', 'jefa')`), /Rol inválido/);
  await fails(q(`SELECT set_user_role('${ADM}', 'user')`), /No puedes quitarte/);
  const del = await q(`DELETE FROM forum_posts WHERE local_uuid='p1' RETURNING alias`);
  assert.equal(del.rows.length, 1, 'modera el foro');
  await q(`INSERT INTO myths (id, category, myth, reality) VALUES ('x1','ciclo','Mito de prueba','Realidad')`);
  await q(`DELETE FROM myths WHERE id='x1'`);
  await q(`INSERT INTO directory_contacts (municipality, institution_name, phone_number, type) VALUES ('Bluefields','Centro','+505 1','hospital')`);
});
console.log('✓ administradora: asigna roles, modera, gestiona contenido; no lee datos íntimos');

// ── AUDITORA ──
await as('authenticated', AUD, async () => {
  assert.equal((await q('SELECT my_role() r')).rows[0].r, 'auditor');
  const log = (await q('SELECT actor_role, action, target_table FROM audit_log ORDER BY id')).rows;
  assert.ok(log.length >= 6, 've la bitácora (' + log.length + ' eventos)');
  assert.ok(log.some((l) => l.target_table === 'user_roles' && l.actor_role === 'admin'), 'cambio de rol registrado');
  assert.ok(log.some((l) => l.target_table === 'forum_posts' && l.action === 'DELETE'), 'moderación registrada');
  assert.ok(log.some((l) => l.target_table === 'myths' && l.action === 'INSERT'), 'alta de mito registrada');
  const stats = (await q('SELECT audit_stats() s')).rows[0].s;
  assert.equal(stats.users_total, 4); assert.equal(stats.daily_logs, 2); assert.equal(stats.by_role.admin, 1);
  assert.equal((await q('SELECT * FROM daily_logs')).rows.length, 0, 'la auditoría no ve datos íntimos');
  await fails(q(`SELECT set_user_role('${U1}', 'admin')`), /Solo una administradora/);
  assert.equal((await q(`DELETE FROM forum_posts RETURNING id`)).rows.length, 0, 'solo lectura');
  await fails(q(`INSERT INTO myths (id, category, myth, reality) VALUES ('x2','ciclo','m','r')`), /row-level security/);
  await fails(q('DELETE FROM audit_log'), /permission denied/);
  await fails(q(`UPDATE audit_log SET action='x'`), /permission denied/);
  await fails(q('SELECT * FROM admin_list_users()'), /Solo una administradora/);
});
console.log('✓ auditora: solo lectura de bitácora y estadísticas agregadas');

// ── SIN SESIÓN ──
await as('anon', null, async () => {
  assert.equal((await q('SELECT my_role() r')).rows[0].r, 'anon');
  assert.ok((await q('SELECT * FROM forum_posts')).rows.length >= 1, 'lee el foro');
  assert.equal((await q('SELECT * FROM audit_log')).rows.length, 0);
  await fails(q('SELECT audit_stats()'), /permission denied|personal de auditoría/);
  await q(`INSERT INTO forum_posts (local_uuid, alias, category, question) VALUES ('p9','Anon','ciclo_salud','Hola')`);
  await fails(q(`INSERT INTO forum_posts (local_uuid, alias, category, question, user_id) VALUES ('p10','x','ciclo_salud','x','${U1}')`), /row-level security/);
});
console.log('✓ sin sesión: lee y publica anónimo; nada más');

// La bitácora es inmutable incluso para la dueña del proyecto
await fails(db.exec(`UPDATE audit_log SET action='x'`), /solo escritura/);
await fails(db.exec(`DELETE FROM audit_log`), /solo escritura/);
console.log('✓ bitácora inmutable');

// Borrar una cuenta no rompe la bitácora ni deja roles huérfanos
await db.exec(`DELETE FROM auth.users WHERE id='${U2}'`);
assert.equal((await q(`SELECT count(*)::int n FROM user_roles WHERE user_id='${U2}'`)).rows[0].n, 0);
console.log('✓ borrar cuenta: sin roles huérfanos (cascade)');
