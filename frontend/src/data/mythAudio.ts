// ─────────────────────────────────────────────────────────
// Metztli — Audios del Desmitificador por idioma
//
// Grabaciones de la comunidad: una para el mito y otra para la verdad que lo
// desmiente. Para sumar otro mito o idioma: copiar los .ogg a
// assets/audio/<idioma>/ y registrarlos aquí con el id del mito.
// Formato Ogg/Opus (el que exporta WhatsApp): se reproduce en Android y web;
// iOS no lo soporta, ahí se usa la voz sintética en español.
// ─────────────────────────────────────────────────────────

export type AudioLanguage = 'miskitu';

export interface MythAudioSet {
  myth: number;
  reality: number;
}

export const MYTH_AUDIO: Record<string, Partial<Record<AudioLanguage, MythAudioSet>>> = {
  c5: {
    miskitu: {
      myth: require('../../assets/audio/miskitu/c5_myth.ogg'),
      reality: require('../../assets/audio/miskitu/c5_reality.ogg'),
    },
  },
};

export function getMythAudio(mythId: string, language: AudioLanguage = 'miskitu'): MythAudioSet | null {
  return MYTH_AUDIO[mythId]?.[language] ?? null;
}
