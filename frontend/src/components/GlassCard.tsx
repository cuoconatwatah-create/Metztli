// ─────────────────────────────────────────────────────────
// Metztli 2.0 — GlassCard Component (Glassmorphism Base)
// ─────────────────────────────────────────────────────────

import React from 'react';
import { View, StyleSheet, type ViewStyle } from 'react-native';
import type { GlassCardProps } from '@/types';

const VARIANT_STYLES: Record<string, ViewStyle> = {
  default: {
    backgroundColor: 'rgba(244, 241, 234, 0.82)',
    borderColor: 'rgba(44, 61, 48, 0.12)',
  },
  carmin: {
    backgroundColor: 'rgba(244, 241, 234, 0.88)',
    borderColor: 'rgba(139, 38, 53, 0.25)',
  },
  bosque: {
    backgroundColor: 'rgba(244, 241, 234, 0.85)',
    borderColor: 'rgba(44, 61, 48, 0.22)',
  },
  alarm: {
    backgroundColor: 'rgba(244, 241, 234, 0.92)',
    borderColor: 'rgba(139, 38, 53, 0.4)',
  },
};

const SHADOW_STYLES: Record<string, ViewStyle> = {
  default: {
    shadowColor: 'rgba(44, 61, 48, 0.15)',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 16,
    elevation: 4,
  },
  carmin: {
    shadowColor: 'rgba(139, 38, 53, 0.35)',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 1,
    shadowRadius: 24,
    elevation: 8,
  },
  bosque: {
    shadowColor: 'rgba(44, 61, 48, 0.15)',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 16,
    elevation: 4,
  },
  alarm: {
    shadowColor: 'rgba(139, 38, 53, 0.45)',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 1,
    shadowRadius: 20,
    elevation: 6,
  },
};

export default function GlassCard({
  children,
  variant = 'default',
  className,
}: GlassCardProps) {
  const variantStyle = VARIANT_STYLES[variant] || VARIANT_STYLES.default;
  const shadowStyle = SHADOW_STYLES[variant] || SHADOW_STYLES.default;

  return (
    <View
      style={[styles.card, variantStyle, shadowStyle]}
      className={className}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 20,
    marginVertical: 8,
    marginHorizontal: 4,
  },
});
