// Panel privado del equipo: solicitudes de demo y versiones instalables.
// La seguridad la hace la base de datos (rol "admin" en cada tabla y en el almacenamiento);
// esta pantalla solo muestra u oculta lo que corresponde.
import { configured, supabase, esc, formatBytes, formatDate, releaseUrl, BUCKET, PLATFORMS, STATUSES } from './common.js';

const $ = (id) => document.getElementById(id);
const show = (id, on) => { $(id).hidden = !on; };
const note = (id, kind, text) => { $(id).innerHTML = text ? `<div class="msg ${kind}">${esc(text)}</div>` : ''; };

// Selectores con las opciones
$('status-filter').innerHTML += Object.entries(STATUSES).map(([k, v]) => `<option value="${k}">${esc(v)}</option>`).join('');
$('rel-platform').innerHTML = Object.entries(PLATFORMS).map(([k, v]) => `<option value="${k}">${esc(v.label)}</option>`).join('');

// ── Arranque y acceso ────────────────────────────────────────────────────────
async function boot() {
  if (!configured) {
    $('boot-msg').hidden = false;
    $('boot-msg').textContent = 'El panel aún no está conectado al servidor (falta config.js).';
    return;
  }
  const { data } = await supabase.auth.getSession();
  if (data.session) await enter(data.session.user);
  else showLogin();
}

function showLogin() {
  show('login-view', true); show('app-view', false); show('logout', false);
}

async function enter(user) {
  const { data: role, error } = await supabase.rpc('my_role');
  if (error || role !== 'admin') {
    await supabase.auth.signOut();
    showLogin();
    note('login-msg', 'err', 'Tu cuenta no tiene el rol de Administrador. Pide que te lo asignen.');
    return;
  }
  show('login-view', false); show('app-view', true); show('logout', true);
  $('who').textContent = `Sesión de ${user.email}`;
  loadRequests();
  loadReleases();
}

$('login-form').addEventListener('submit', async (ev) => {
  ev.preventDefault();
  const f = new FormData(ev.target);
  const btn = $('login-submit');
  btn.disabled = true; note('login-msg', 'info', 'Entrando…');
  const { data, error } = await supabase.auth.signInWithPassword({ email: String(f.get('email')).trim().toLowerCase(), password: String(f.get('password')) });
  btn.disabled = false;
  if (error) {
    const m = error.message.toLowerCase();
    return note('login-msg', 'err',
      m.includes('invalid login') ? 'Correo o contraseña incorrectos.'
      : m.includes('not confirmed') ? 'Aún no confirmas tu correo.'
      : 'No pudimos iniciar sesión. Inténtalo de nuevo.');
  }
  note('login-msg', '', '');
  await enter(data.user);
});

$('logout').addEventListener('click', async (ev) => {
  ev.preventDefault();
  await supabase.auth.signOut();
  showLogin();
});

// ── Pestañas ─────────────────────────────────────────────────────────────────
document.querySelectorAll('.tab').forEach((t) => t.addEventListener('click', () => {
  const which = t.dataset.tab;
  document.querySelectorAll('.tab').forEach((x) => x.setAttribute('aria-selected', String(x === t)));
  show('requests-pane', which === 'requests');
  show('releases-pane', which === 'releases');
}));

// ── Solicitudes de demo ──────────────────────────────────────────────────────
async function loadRequests() {
  const list = $('requests-list');
  list.innerHTML = '<div class="empty">Cargando…</div>';
  let q = supabase.from('demo_requests').select('*').order('created_at', { ascending: false }).limit(200);
  const status = $('status-filter').value;
  if (status) q = q.eq('status', status);
  const { data, error } = await q;
  if (error) { list.innerHTML = `<div class="msg err">${esc('No se pudieron leer las solicitudes: ' + error.message)}</div>`; return; }
  $('requests-count').textContent = `${data.length} solicitud${data.length === 1 ? '' : 'es'}`;
  if (!data.length) { list.innerHTML = '<div class="empty">No hay solicitudes todavía.</div>'; return; }

  list.innerHTML = data.map((r) => `
    <article class="row" data-id="${esc(r.id)}">
      <div class="head">
        <span class="who">${esc(r.name)}</span>
        <span class="meta">${esc(formatDate(r.created_at))}</span>
      </div>
      <div class="meta"><a href="mailto:${esc(r.email)}">${esc(r.email)}</a>${r.organization ? ' · ' + esc(r.organization) : ''}</div>
      ${r.message ? `<div class="text">${esc(r.message)}</div>` : ''}
      <div class="actions">
        <select data-act="status" aria-label="Estado de la solicitud">
          ${Object.entries(STATUSES).map(([k, v]) => `<option value="${k}" ${k === r.status ? 'selected' : ''}>${esc(v)}</option>`).join('')}
        </select>
        <a class="btn small ghost" href="mailto:${esc(r.email)}?subject=${encodeURIComponent('Tu solicitud de demo de Metztli')}">Responder</a>
        <button class="btn small danger" data-act="delete" type="button">Eliminar</button>
      </div>
    </article>`).join('');
}

$('status-filter').addEventListener('change', loadRequests);

$('requests-list').addEventListener('change', async (ev) => {
  if (ev.target.dataset.act !== 'status') return;
  const id = ev.target.closest('.row').dataset.id;
  const { error } = await supabase.from('demo_requests').update({ status: ev.target.value }).eq('id', id);
  if (error) { alert('No se pudo cambiar el estado: ' + error.message); loadRequests(); }
});

$('requests-list').addEventListener('click', async (ev) => {
  if (ev.target.dataset.act !== 'delete') return;
  if (!confirm('¿Eliminar esta solicitud? No se puede deshacer.')) return;
  const id = ev.target.closest('.row').dataset.id;
  const { error } = await supabase.from('demo_requests').delete().eq('id', id);
  if (error) return alert('No se pudo eliminar: ' + error.message);
  loadRequests();
});

// ── Versiones de la app ──────────────────────────────────────────────────────
async function loadReleases() {
  const list = $('releases-list');
  const { data, error } = await supabase.from('app_releases').select('*').order('created_at', { ascending: false });
  if (error) { list.innerHTML = `<div class="msg err">${esc('No se pudieron leer las versiones: ' + error.message)}</div>`; return; }
  if (!data.length) { list.innerHTML = '<div class="empty">Aún no hay versiones publicadas.</div>'; return; }
  list.innerHTML = data.map((r) => `
    <article class="row" data-id="${esc(r.id)}" data-path="${esc(r.file_path || '')}">
      <div class="head">
        <span class="who">${esc(PLATFORMS[r.platform]?.label || r.platform)} · ${esc(r.version)} ${r.is_current ? '<span class="pill current">Actual</span>' : ''}</span>
        <span class="meta">${esc(formatDate(r.created_at))}${r.file_size ? ' · ' + esc(formatBytes(r.file_size)) : ''}</span>
      </div>
      ${r.notes ? `<div class="text">${esc(r.notes)}</div>` : ''}
      <div class="meta">${r.file_path ? 'Archivo en este servidor' : 'Enlace externo'}: <a href="${esc(releaseUrl(r))}" target="_blank" rel="noopener">abrir descarga</a></div>
      <div class="actions">
        ${r.is_current ? '' : '<button class="btn small" data-act="current" type="button">Marcar como actual</button>'}
        <button class="btn small danger" data-act="delete" type="button">Eliminar</button>
      </div>
    </article>`).join('');
}

$('releases-list').addEventListener('click', async (ev) => {
  const act = ev.target.dataset.act;
  if (!act) return;
  const row = ev.target.closest('.row');
  const id = row.dataset.id;
  if (act === 'current') {
    const { error } = await supabase.rpc('set_current_release', { rel: id });
    if (error) return alert('No se pudo publicar: ' + error.message);
  } else if (act === 'delete') {
    if (!confirm('¿Eliminar esta versión? Si el archivo está en el servidor, también se borra.')) return;
    const path = row.dataset.path;
    if (path) await supabase.storage.from(BUCKET).remove([path]);
    const { error } = await supabase.from('app_releases').delete().eq('id', id);
    if (error) return alert('No se pudo eliminar: ' + error.message);
  }
  loadReleases();
});

function friendlyUploadError(error) {
  const m = String(error?.message || error).toLowerCase();
  if (m.includes('maximum allowed size') || m.includes('413') || m.includes('too large')) {
    return 'El archivo es más grande de lo que permite este servidor. En Supabase gratuito el límite es 50 MB; en el servidor propio de Azure es de 300 MB. También puedes pegar un enlace de descarga en lugar de subir el archivo.';
  }
  if (m.includes('row-level security') || m.includes('unauthorized')) return 'Tu cuenta no tiene permiso para subir archivos.';
  return 'No se pudo subir el archivo: ' + (error?.message || error);
}

$('release-form').addEventListener('submit', async (ev) => {
  ev.preventDefault();
  const f = new FormData(ev.target);
  const platform = String(f.get('platform'));
  const version = String(f.get('version') || '').trim();
  const downloadUrl = String(f.get('download_url') || '').trim();
  const notes = String(f.get('notes') || '').trim();
  const file = $('rel-file').files[0];
  const makeCurrent = Boolean(f.get('make_current'));

  if (!version) return note('release-msg', 'err', 'Escribe el número de versión, por ejemplo 2.0.8.');
  if (!file && !downloadUrl) return note('release-msg', 'err', 'Sube el archivo instalable o pega un enlace de descarga.');
  if (downloadUrl && !/^https:\/\//i.test(downloadUrl)) return note('release-msg', 'err', 'El enlace debe empezar con https://');
  if (file && !file.name.toLowerCase().endsWith(PLATFORMS[platform].ext)) {
    return note('release-msg', 'err', `Para ${PLATFORMS[platform].label} el archivo debe terminar en ${PLATFORMS[platform].ext}.`);
  }

  const btn = $('release-submit');
  btn.disabled = true;
  let filePath = null;
  try {
    if (file) {
      note('release-msg', 'info', `Subiendo ${file.name} (${formatBytes(file.size)})… puede tardar un poco.`);
      const safe = file.name.replace(/[^A-Za-z0-9._-]/g, '_');
      filePath = `${platform}/${version}/${safe}`;
      const { error } = await supabase.storage.from(BUCKET).upload(filePath, file, { upsert: true, contentType: file.type || 'application/octet-stream' });
      if (error) throw error;
    }
    const { data, error } = await supabase.from('app_releases').insert({
      platform, version, notes: notes || null,
      file_path: filePath, download_url: file ? null : downloadUrl,
      file_size: file ? file.size : null,
    }).select('id').single();
    if (error) throw error;
    if (makeCurrent) {
      const { error: e2 } = await supabase.rpc('set_current_release', { rel: data.id });
      if (e2) throw e2;
    }
    ev.target.reset();
    note('release-msg', 'ok', makeCurrent ? 'Versión publicada y marcada como actual.' : 'Versión guardada.');
    loadReleases();
  } catch (e) {
    note('release-msg', 'err', friendlyUploadError(e));
  } finally {
    btn.disabled = false;
  }
});

boot();
