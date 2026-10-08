// ─────────────────────────────────────────────────────────
// Metztli — Preferencias simples de la usuaria (clave/valor en el dispositivo)
// ─────────────────────────────────────────────────────────

import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

async function read(key: string): Promise<string | null> {
  try {
    return Platform.OS === 'web' ? localStorage.getItem(key) : await SecureStore.getItemAsync(key);
  } catch {
    return null;
  }
}

async function write(key: string, value: string): Promise<void> {
  try {
    if (Platform.OS === 'web') localStorage.setItem(key, value);
    else await SecureStore.setItemAsync(key, value);
  } catch {
    // Sin almacenamiento: la preferencia dura solo la sesión.
  }
}

const BACKUP_KEY = 'cloud_backup_enabled';

/** El respaldo en la nube de datos íntimos es opcional y está desactivado por defecto. */
export async function isCloudBackupEnabled(): Promise<boolean> {
  return (await read(BACKUP_KEY)) === '1';
}

export async function setCloudBackupEnabled(enabled: boolean): Promise<void> {
  await write(BACKUP_KEY, enabled ? '1' : '0');
}

const STAGE_KEY = 'current_stage';

/** Etapa activa guardada en el dispositivo (respaldo de la base local; necesaria en web). */
export async function getStagePref(): Promise<string | null> {
  return read(STAGE_KEY);
}

export async function setStagePref(stage: string): Promise<void> {
  await write(STAGE_KEY, stage);
}

const ROLE_KEY = 'cached_role';

/** Copia del rol solo para pintar la interfaz sin conexión (la autoridad es la base de datos). */
export async function getRolePref(): Promise<string | null> {
  return read(ROLE_KEY);
}

export async function setRolePref(role: string): Promise<void> {
  await write(ROLE_KEY, role);
}
