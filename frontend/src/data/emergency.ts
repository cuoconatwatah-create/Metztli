// ─────────────────────────────────────────────────────────
// Metztli — Números de emergencia de Nicaragua
// Verificados en varias fuentes (guías oficiales de viaje y listados de teléfonos útiles).
// Revísalos de vez en cuando: los números de un país pueden cambiar.
// ─────────────────────────────────────────────────────────

import { Platform } from 'react-native';

/** Ambulancia / Cruz Roja Nicaragüense: el número para una emergencia de salud. */
export const AMBULANCE_NUMBER = '128';
export const POLICE_NUMBER = '118';
export const FIRE_NUMBER = '115';

/**
 * Abre la app de mensajes con el texto ya escrito y SIN destinatario: la persona elige a su partera o a un
 * contacto de confianza. (Antes se enviaba a un número de ejemplo que no era de nadie.)
 */
export function buildSmsUrl(body: string): string {
  const q = encodeURIComponent(body);
  return Platform.OS === 'ios' ? `sms:&body=${q}` : `sms:?body=${q}`;
}
