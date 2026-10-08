// ─────────────────────────────────────────────────────────
// Metztli — Persistencia del idioma elegido
// ─────────────────────────────────────────────────────────

import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

const KEY = 'app_language';
export const SUPPORTED = ['es', 'miskitu', 'creole'] as const;

export async function loadStoredLanguage(): Promise<string | null> {
  try {
    const value =
      Platform.OS === 'web' ? localStorage.getItem(KEY) : await SecureStore.getItemAsync(KEY);
    return value && (SUPPORTED as readonly string[]).includes(value) ? value : null;
  } catch {
    return null;
  }
}

export async function saveLanguage(lang: string): Promise<void> {
  try {
    if (Platform.OS === 'web') localStorage.setItem(KEY, lang);
    else await SecureStore.setItemAsync(KEY, lang);
  } catch {
    // Sin almacenamiento disponible: el idioma solo dura la sesión.
  }
}
