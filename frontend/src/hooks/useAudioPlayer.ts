// ─────────────────────────────────────────────────────────
// Metztli 2.0 — Audio Player Hook (expo-av)
// ─────────────────────────────────────────────────────────

import { useState, useCallback, useRef, useEffect } from 'react';
import { Audio } from 'expo-av';

interface AudioPlayerState {
  isPlaying: boolean;
  isLoading: boolean;
  error: string | null;
}

interface UseAudioPlayerReturn extends AudioPlayerState {
  play: (audioKey: string) => Promise<void>;
  stop: () => Promise<void>;
  toggle: (audioKey: string) => Promise<void>;
}

/**
 * Maps an audio key to a local asset require.
 * Returns null for missing audio files (graceful degradation).
 */
function getAudioSource(audioKey: string): number | null {
  const audioMap: Record<string, number> = {
    // Audio stubs — replace with real audio files when available.
    // Example mapping:
    // 'audio_faq_cycle_what': require('../../assets/audio/faq_cycle_what.mp3'),
  };
  return audioMap[audioKey] ?? null;
}

export function useAudioPlayer(): UseAudioPlayerReturn {
  const [state, setState] = useState<AudioPlayerState>({
    isPlaying: false,
    isLoading: false,
    error: null,
  });

  const soundRef = useRef<Audio.Sound | null>(null);
  const currentKeyRef = useRef<string | null>(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (soundRef.current) {
        soundRef.current.unloadAsync().catch(() => {});
      }
    };
  }, []);

  const stop = useCallback(async () => {
    if (soundRef.current) {
      try {
        await soundRef.current.stopAsync();
        await soundRef.current.unloadAsync();
      } catch {
        // Ignore errors during cleanup
      }
      soundRef.current = null;
      currentKeyRef.current = null;
    }
    setState({ isPlaying: false, isLoading: false, error: null });
  }, []);

  const play = useCallback(
    async (audioKey: string) => {
      // Stop any currently playing audio
      await stop();

      const source = getAudioSource(audioKey);
      if (!source) {
        setState({
          isPlaying: false,
          isLoading: false,
          error: `Audio not available: ${audioKey}`,
        });
        return;
      }

      setState({ isPlaying: false, isLoading: true, error: null });

      try {
        // Set audio mode for playback
        await Audio.setAudioModeAsync({
          playsInSilentModeIOS: true,
          staysActiveInBackground: false,
        });

        const { sound } = await Audio.Sound.createAsync(source, {
          shouldPlay: true,
        });

        soundRef.current = sound;
        currentKeyRef.current = audioKey;

        // Listen for playback completion
        sound.setOnPlaybackStatusUpdate((status) => {
          if (status.isLoaded && status.didJustFinish) {
            setState({ isPlaying: false, isLoading: false, error: null });
            sound.unloadAsync().catch(() => {});
            soundRef.current = null;
            currentKeyRef.current = null;
          }
        });

        setState({ isPlaying: true, isLoading: false, error: null });
      } catch (err) {
        setState({
          isPlaying: false,
          isLoading: false,
          error: 'Error playing audio',
        });
      }
    },
    [stop]
  );

  const toggle = useCallback(
    async (audioKey: string) => {
      if (state.isPlaying && currentKeyRef.current === audioKey) {
        await stop();
      } else {
        await play(audioKey);
      }
    },
    [state.isPlaying, play, stop]
  );

  return {
    ...state,
    play,
    stop,
    toggle,
  };
}
