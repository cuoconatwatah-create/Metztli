// Utilidades compartidas por la landing (index.html) y el panel (admin.html).
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.45.4/+esm';

export const config = window.METZTLI_CONFIG || {};
export const configured = Boolean(config.supabaseUrl && config.supabaseAnonKey);

export const supabase = configured
  ? createClient(config.supabaseUrl, config.supabaseAnonKey, {
      auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: false },
    })
  : null;

export const BUCKET = 'app-releases';

/** Texto seguro para insertar en HTML (los mensajes de las solicitudes los escribe cualquiera). */
export function esc(value) {
  return String(value ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

export function formatBytes(n) {
  if (!n && n !== 0) return '';
  if (n < 1024 * 1024) return `${Math.max(1, Math.round(n / 1024))} KB`;
  return `${(n / 1024 / 1024).toFixed(1)} MB`;
}

export function formatDate(iso) {
  try {
    return new Date(iso).toLocaleString('es-NI', { dateStyle: 'medium', timeStyle: 'short' });
  } catch {
    return iso;
  }
}

/** Dirección de descarga de una versión: el archivo subido al servidor o un enlace externo. */
export function releaseUrl(release) {
  if (release.file_path) {
    const path = release.file_path.split('/').map(encodeURIComponent).join('/');
    return `${config.supabaseUrl}/storage/v1/object/public/${BUCKET}/${path}`;
  }
  return release.download_url;
}

export const PLATFORMS = {
  android: { label: 'Android (APK)', ext: '.apk' },
  windows: { label: 'Windows (EXE)', ext: '.exe' },
  macos: { label: 'macOS (DMG)', ext: '.dmg' },
  ios: { label: 'iPhone (iOS)', ext: '.ipa' },
};

export const STATUSES = {
  nueva: 'Nueva',
  contactada: 'Contactada',
  demo_realizada: 'Demo realizada',
  descartada: 'Descartada',
};
