// ─────────────────────────────────────────────────────────
// Metztli 2.0 — Mascot Companion Component (Sula)
// ─────────────────────────────────────────────────────────

import React, { useMemo } from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { useTranslation } from 'react-i18next';
import GlassCard from './GlassCard';
import AudioGuideButton from './AudioGuideButton';
import type { MascotCompanionProps } from '@/types';

// Tipos de consejos disponibles para rotación simple
const TIP_TYPES = ['hydration', 'nutrition', 'rest', 'danger'];

export default function MascotCompanion({ stage, weekNumber }: MascotCompanionProps) {
  const { t } = useTranslation();

  // Selecciona un consejo basado en la semana (para rotación pseudo-aleatoria estable)
  const tipKey = useMemo(() => {
    if (stage === 'pregnancy' && weekNumber) {
      if (weekNumber >= 28) return 'mascot.tip_kicks';
      if (weekNumber === 6 || weekNumber === 16 || weekNumber === 26) return 'mascot.tip_prenatal';
      const typeIndex = weekNumber % TIP_TYPES.length;
      return `mascot.tip_${TIP_TYPES[typeIndex]}`;
    }
    
    if (stage === 'menopause') {
       // Alternar entre calcio y ejercicio (simulado simple por día)
       const isEvenDay = new Date().getDate() % 2 === 0;
       return isEvenDay ? 'menopause.tip_calcium' : 'menopause.tip_exercise';
    }

    // Default para ciclo
    return 'mascot.tip_hydration';
  }, [stage, weekNumber]);

  return (
    <GlassCard variant="bosque" className="flex-row items-center">
      {/* Sula Avatar Placeholder */}
      <View style={styles.avatarContainer}>
         <View style={styles.avatarPlaceholder}>
            <Text style={styles.avatarText}>S</Text>
         </View>
      </View>

      <View style={styles.textContainer}>
        <Text style={styles.name}>{t('mascot.name')}</Text>
        <Text style={styles.tip}>{t(tipKey)}</Text>
      </View>

      <View style={styles.audioContainer}>
        <AudioGuideButton 
          audioKey={`audio_${tipKey}`} 
          size={44} 
        />
      </View>
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  avatarContainer: {
    marginRight: 16,
  },
  avatarPlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#F4F1EA',
    borderWidth: 2,
    borderColor: '#2C3D30',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 28,
    fontWeight: '800',
    color: '#2C3D30',
  },
  textContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  name: {
    fontSize: 16,
    fontWeight: '700',
    color: '#2C3D30',
    marginBottom: 4,
  },
  tip: {
    fontSize: 13,
    color: '#1A1A1A',
    lineHeight: 18,
    paddingRight: 8,
  },
  audioContainer: {
    paddingLeft: 8,
  }
});
