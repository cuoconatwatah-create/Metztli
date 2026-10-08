// ─────────────────────────────────────────────────────────
// Metztli — Reproductor de los audios del Desmitificador (expo-av)
// ─────────────────────────────────────────────────────────

import { Audio } from 'expo-av';

let current: Audio.Sound | null = null;
let token = 0;
let modeSet = false;

async function ensureAudioMode() {
  if (modeSet) return;
  modeSet = true;
  try {
    await Audio.setAudioModeAsync({ playsInSilentModeIOS: true });
  } catch {
    // Sin soporte (web): se reproduce con la configuración por defecto
  }
}

export async function stopMythAudio(): Promise<void> {
  token += 1; // invalida cualquier reproducción en curso
  const sound = current;
  current = null;
  if (sound) {
    try {
      await sound.stopAsync();
    } catch {
      // ya estaba detenido
    }
    await sound.unloadAsync().catch(() => undefined);
  }
}

/**
 * Reproduce los audios en orden (p. ej. el mito y luego la verdad).
 * Devuelve cuando termina o cuando otra reproducción / `stopMythAudio` la interrumpe.
 */
export async function playMythAudio(sources: number[], onFinished?: () => void): Promise<void> {
  await stopMythAudio();
  await ensureAudioMode();
  const mine = ++token;

  for (const source of sources) {
    if (mine !== token) return;
    const { sound } = await Audio.Sound.createAsync(source, { shouldPlay: true });
    if (mine !== token) {
      await sound.unloadAsync().catch(() => undefined);
      return;
    }
    current = sound;
    await new Promise<void>((resolve) => {
      sound.setOnPlaybackStatusUpdate((status) => {
        if (!status.isLoaded || status.didJustFinish) resolve();
      });
    });
    await sound.unloadAsync().catch(() => undefined);
    if (current === sound) current = null;
  }
  if (mine === token) onFinished?.();
}
