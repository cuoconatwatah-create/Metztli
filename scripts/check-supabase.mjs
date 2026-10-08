// Verifica la conexión con Supabase y que las migraciones estén aplicadas.
//   node scripts/check-supabase.mjs
// Lee EXPO_PUBLIC_SUPABASE_URL y EXPO_PUBLIC_SUPABASE_ANON_KEY de frontend/.env
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const envPath = join(dirname(fileURLToPath(import.meta.url)), '..', 'frontend', '.env');
const env = Object.fromEntries(
  readFileSync(envPath, 'utf8')
    .split(/\r?\n/)
    .filter((l) => l.includes('=') && !l.startsWith('#'))
    .map((l) => [l.slice(0, l.indexOf('=')), l.slice(l.indexOf('=') + 1).trim()])
);
const url = env.EXPO_PUBLIC_SUPABASE_URL;
const key = env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
if (!url || !key) {
  console.error('Faltan EXPO_PUBLIC_SUPABASE_URL / EXPO_PUBLIC_SUPABASE_ANON_KEY en frontend/.env');
  process.exit(1);
}

const headers = { apikey: key };
let failures = 0;
const ok = (msg) => console.log('  ✓', msg);
const bad = (msg) => { console.log('  ✗', msg); failures += 1; };

console.log(`Proyecto: ${url}`);
try {
  const auth = await fetch(`${url}/auth/v1/settings`, { headers });
  if (auth.status !== 200) bad(`Auth respondió ${auth.status} (¿URL o key incorrectas?)`);
  else {
    const s = await auth.json();
    ok(`Auth activo · correo ${s.external?.email ? 'habilitado' : 'DESHABILITADO'} · confirmación de correo ${s.mailer_autoconfirm ? 'automática' : 'requerida'}`);
  }
} catch (e) {
  bad(`No se pudo conectar: ${e.cause?.code ?? e.message}`);
  process.exit(1);
}

const tables = ['user_roles', 'audit_log', 'profiles', 'pregnancies', 'prenatal_checkups', 'kick_sessions', 'myths', 'directory_contacts', 'forum_posts', 'user_cycle_logs', 'cycles', 'symptoms', 'daily_logs', 'daily_log_symptoms', 'daily_log_habits'];
for (const t of tables) {
  const r = await fetch(`${url}/rest/v1/${t}?select=*&limit=1`, { headers });
  if (r.status === 200) ok(`tabla ${t}`);
  else if (r.status === 404) bad(`tabla ${t} NO existe (aplica backend/supabase/setup_completo.sql)`);
  else bad(`tabla ${t}: HTTP ${r.status} ${(await r.text()).slice(0, 80)}`);
}

// Los datos íntimos deben estar protegidos por RLS: sin sesión no se ve nada
for (const t of ['daily_logs', 'cycles', 'profiles', 'pregnancies', 'user_roles', 'audit_log']) {
  const r = await fetch(`${url}/rest/v1/${t}?select=*&limit=1`, { headers });
  if (r.status === 200 && (await r.json()).length === 0) ok(`RLS ${t}: anónimo no ve filas`);
  else if (r.status === 200) bad(`RLS ${t}: ¡un anónimo puede leer filas!`);
}

// Roles: sin sesión no se puede cambiar roles, ver estadísticas ni escribir contenido
const rpc = (fn, body = {}) => fetch(`${url}/rest/v1/rpc/${fn}`, { method: 'POST', headers: { ...headers, 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
const role = await rpc('my_role');
if (role.status === 200 && (await role.json()) === 'anon') ok('my_role(): sin sesión devuelve "anon"');
else bad(`my_role() inesperado (HTTP ${role.status}); aplica la migración 006`);
for (const [fn, body] of [['audit_stats', {}], ['admin_list_users', {}], ['set_user_role', { target: '00000000-0000-0000-0000-000000000001', new_role: 'admin' }]]) {
  const r = await rpc(fn, body);
  r.status === 401 || r.status === 403 || r.status === 404 ? ok(`${fn}(): bloqueada sin sesión`) : bad(`${fn}(): ¡respondió HTTP ${r.status} sin sesión!`);
}
const myth = await fetch(`${url}/rest/v1/myths`, { method: 'POST', headers: { ...headers, 'Content-Type': 'application/json', Prefer: 'return=minimal' }, body: JSON.stringify({ id: 'zz-test', category: 'ciclo', myth: 'x', reality: 'x' }) });
myth.status === 401 || myth.status === 403 ? ok('myths: un anónimo no puede escribir') : bad(`myths: ¡un anónimo pudo escribir (HTTP ${myth.status})!`);

// Catálogo y mitos sembrados
const myths = await fetch(`${url}/rest/v1/myths?select=id`, { headers });
if (myths.status === 200) (await myths.json()).length >= 12 ? ok('mitos sembrados (12)') : bad('faltan mitos sembrados');
const syms = await fetch(`${url}/rest/v1/symptoms?select=code`, { headers });
if (syms.status === 200) (await syms.json()).length >= 23 ? ok('catálogo de síntomas sembrado (23)') : bad('faltan síntomas sembrados');

console.log(failures ? `\n${failures} problema(s).` : '\nTodo en orden.');
process.exit(failures ? 1 : 0);
