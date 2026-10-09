// Landing de Metztli: botón de descarga (lee la versión actual) y formulario de solicitud de demo.
import { config, configured, supabase, esc, formatBytes, releaseUrl } from './common.js';

const $ = (id) => document.getElementById(id);

// ── Enlace a la versión web ──────────────────────────────────────────────────
if (config.webAppUrl) $('web-link').href = config.webAppUrl;

// ── Descarga: versión actual de Android ──────────────────────────────────────
async function loadAndroid() {
  const btn = $('android-btn');
  const meta = $('android-meta');
  const notes = $('android-notes');
  const fallback = config.fallbackDownloadUrl;

  const useFallback = (text) => {
    meta.textContent = text;
    if (fallback) {
      btn.href = fallback;
      btn.removeAttribute('aria-disabled');
      btn.textContent = 'Ver descargas en GitHub';
    } else {
      btn.setAttribute('aria-disabled', 'true');
      btn.style.opacity = '.6';
    }
  };

  if (!configured) return useFallback('Descarga disponible en GitHub.');
  try {
    const { data, error } = await supabase
      .from('app_releases')
      .select('version, file_path, download_url, file_size, notes, created_at')
      .eq('platform', 'android')
      .eq('is_current', true)
      .maybeSingle();
    if (error) throw error;
    if (!data) return useFallback('Aún no hay una versión publicada en este servidor.');

    btn.href = releaseUrl(data);
    btn.removeAttribute('aria-disabled');
    btn.setAttribute('download', '');
    btn.textContent = `Descargar Metztli ${data.version}`;
    const size = data.file_size ? ` · ${formatBytes(data.file_size)}` : '';
    meta.textContent = `Versión ${data.version}${size}`;
    if (data.notes) notes.textContent = data.notes;
  } catch (e) {
    console.warn('No se pudo leer la versión actual', e);
    useFallback('No pudimos leer la versión más reciente.');
  }
}
loadAndroid();

// ── Formulario de demo ───────────────────────────────────────────────────────
const form = $('demo-form');
const msg = $('form-msg');
const submit = $('demo-submit');

function show(kind, text) {
  msg.innerHTML = `<div class="msg ${kind}">${esc(text)}</div>`;
}

form.addEventListener('submit', async (ev) => {
  ev.preventDefault();
  const f = new FormData(form);
  const name = String(f.get('name') || '').trim();
  const email = String(f.get('email') || '').trim();
  const organization = String(f.get('organization') || '').trim();
  const message = String(f.get('message') || '').trim();

  if (f.get('website')) return show('ok', '¡Gracias! Recibimos tu solicitud.'); // campo trampa: un robot lo llena
  if (name.length < 2) return show('err', 'Escribe tu nombre.');
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return show('err', 'Escribe un correo válido, por ejemplo nombre@correo.com.');
  if (!f.get('accepted_privacy')) return show('err', 'Para enviar la solicitud debes aceptar el uso de tus datos para contactarte.');
  if (!configured) return show('err', 'El formulario aún no está conectado al servidor. Inténtalo más tarde.');

  submit.disabled = true;
  show('info', 'Enviando…');
  const { error } = await supabase.from('demo_requests').insert({
    name,
    email,
    organization: organization || null,
    message: message || null,
    accepted_privacy: true,
  });
  submit.disabled = false;

  if (error) {
    console.warn(error);
    return show('err', 'No pudimos enviar tu solicitud. Revisa tu conexión e inténtalo otra vez.');
  }
  form.reset();
  show('ok', '¡Gracias! Recibimos tu solicitud y te contactaremos pronto al correo que nos diste.');
});
