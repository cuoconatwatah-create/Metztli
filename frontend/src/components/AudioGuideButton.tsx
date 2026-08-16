// ─────────────────────────────────────────────────────────
// Metztli 2.0 — Audio Guide Button (Oralidad)
// ─────────────────────────────────────────────────────────

import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { Volume2, VolumeX } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { useAudioPlayer } from '@/hooks/useAudioPlayer';
import type { AudioGuideButtonProps } from '@/types';

export default function AudioGuideButton({
  audioKey,
  size = 40,
  label,
}: AudioGuideButtonProps) {
  const { t } = useTranslation();
  const { isPlaying, isLoading, toggle } = useAudioPlayer();

  const handlePress = () => {
    toggle(audioKey);
  };

  const iconColor = isPlaying ? '#8B2635' : '#1A1A1A';
  const iconSize = size * 0.5;

  return (
    <TouchableOpacity
      style={[
        styles.button,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
        },
        isPlaying && styles.buttonActive,
      ]}
      onPress={handlePress}
      accessibilityRole="button"
      accessibilityLabel={
        label || (isPlaying ? t('audio.stop') : t('audio.play'))
      }
      accessibilityState={{ busy: isLoading }}
    >
      {isLoading ? (
        <ActivityIndicator size="small" color="#8B2635" />
      ) : isPlaying ? (
        <VolumeX
          size={iconSize}
          color={iconColor}
          strokeWidth={1.75}
        />
      ) : (
        <Volume2
          size={iconSize}
          color={iconColor}
          strokeWidth={1.75}
        />
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: 'rgba(244, 241, 234, 0.82)',
    borderWidth: 1,
    borderColor: 'rgba(44, 61, 48, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: 'rgba(44, 61, 48, 0.15)',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 3,
  },
  buttonActive: {
    borderColor: 'rgba(139, 38, 53, 0.3)',
    backgroundColor: 'rgba(139, 38, 53, 0.08)',
  },
});
