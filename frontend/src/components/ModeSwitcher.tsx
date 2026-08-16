// ─────────────────────────────────────────────────────────
// Metztli 2.0 — Mode Switcher (Life Stage Selector)
// ─────────────────────────────────────────────────────────

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Moon, Baby, Flower2 } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import GlassCard from './GlassCard';
import type { ModeSwitcherProps, LifeStageMode } from '@/types';

interface ModeOption {
  mode: LifeStageMode;
  icon: typeof Moon;
  titleKey: string;
  descKey: string;
}

const MODE_OPTIONS: ModeOption[] = [
  {
    mode: 'cycle',
    icon: Moon,
    titleKey: 'modes.cycle',
    descKey: 'modes.cycle_desc',
  },
  {
    mode: 'pregnancy',
    icon: Baby,
    titleKey: 'modes.pregnancy',
    descKey: 'modes.pregnancy_desc',
  },
  {
    mode: 'menopause',
    icon: Flower2,
    titleKey: 'modes.menopause',
    descKey: 'modes.menopause_desc',
  },
];

export default function ModeSwitcher({
  currentMode,
  onModeChange,
}: ModeSwitcherProps) {
  const { t } = useTranslation();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{t('modes.title')}</Text>
      <View style={styles.optionsRow}>
        {MODE_OPTIONS.map(({ mode, icon: Icon, titleKey, descKey }) => {
          const isActive = currentMode === mode;
          return (
            <TouchableOpacity
              key={mode}
              style={styles.optionWrapper}
              onPress={() => onModeChange(mode)}
              accessibilityRole="button"
              accessibilityState={{ selected: isActive }}
              accessibilityLabel={t(titleKey)}
            >
              <GlassCard variant={isActive ? 'carmin' : 'default'}>
                <View style={styles.optionContent}>
                  <View
                    style={[
                      styles.iconContainer,
                      isActive && styles.iconContainerActive,
                    ]}
                  >
                    <Icon
                      size={28}
                      color={isActive ? '#8B2635' : '#1A1A1A'}
                      strokeWidth={1.75}
                    />
                  </View>
                  <Text
                    style={[
                      styles.optionTitle,
                      isActive && styles.optionTitleActive,
                    ]}
                    numberOfLines={1}
                  >
                    {t(titleKey)}
                  </Text>
                  <Text style={styles.optionDesc} numberOfLines={2}>
                    {t(descKey)}
                  </Text>
                </View>
              </GlassCard>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 12,
    marginLeft: 4,
  },
  optionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  optionWrapper: {
    flex: 1,
  },
  optionContent: {
    alignItems: 'center',
    paddingVertical: 4,
  },
  iconContainer: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(44, 61, 48, 0.06)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  iconContainerActive: {
    backgroundColor: 'rgba(139, 38, 53, 0.1)',
  },
  optionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1A1A1A',
    textAlign: 'center',
    marginBottom: 4,
  },
  optionTitleActive: {
    color: '#8B2635',
  },
  optionDesc: {
    fontSize: 11,
    color: '#666',
    textAlign: 'center',
    lineHeight: 14,
  },
});
