// ─────────────────────────────────────────────────────────
// Metztli 2.0 — Symptom Grid Component (Sin Emojis)
// ─────────────────────────────────────────────────────────

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { 
  Activity, 
  BatteryLow, 
  CircleDot, 
  HeartPulse, 
  Flame, 
  Droplets,
  Thermometer,
  Wind,
  Moon,
  Frown,
  Meh,
  Smile,
  Zap,
  Coffee
} from 'lucide-react-native';
import GlassCard from './GlassCard';
import type { SymptomGridProps, LifeStageMode } from '@/types';

type IconComponent = typeof Activity;

interface SymptomDef {
  id: string;
  icon: IconComponent;
  labelKey: string;
}

// Síntomas específicos por modo
const SYMPTOMS_BY_MODE: Record<LifeStageMode, SymptomDef[]> = {
  pregnancy: [
    { id: 'nausea', icon: Activity, labelKey: 'symptoms.nausea' },
    { id: 'fatigue', icon: BatteryLow, labelKey: 'symptoms.fatigue' },
    { id: 'swelling', icon: CircleDot, labelKey: 'symptoms.swelling' },
    { id: 'kicks', icon: HeartPulse, labelKey: 'symptoms.kicks_felt' },
    { id: 'backPain', icon: Flame, labelKey: 'symptoms.back_pain' },
    { id: 'headache', icon: Zap, labelKey: 'symptoms.headache' },
    { id: 'cramps', icon: Wind, labelKey: 'symptoms.cramps' },
    { id: 'dizziness', icon: Coffee, labelKey: 'symptoms.dizziness' },
  ],
  cycle: [
    { id: 'cramps', icon: Flame, labelKey: 'symptoms.cramps' },
    { id: 'headache', icon: Zap, labelKey: 'symptoms.headache' },
    { id: 'bloating', icon: CircleDot, labelKey: 'symptoms.bloating' },
    { id: 'breastTenderness', icon: Activity, labelKey: 'symptoms.breast_tenderness' },
    { id: 'acne', icon: Droplets, labelKey: 'symptoms.acne' },
    { id: 'fatigue', icon: BatteryLow, labelKey: 'symptoms.fatigue' },
    { id: 'backPain', icon: Wind, labelKey: 'symptoms.back_pain' },
    { id: 'insomnia', icon: Moon, labelKey: 'symptoms.insomnia' },
  ],
  menopause: [
    { id: 'hotFlashes', icon: Thermometer, labelKey: 'menopause.hot_flashes' },
    { id: 'insomnia', icon: Moon, labelKey: 'symptoms.insomnia' },
    { id: 'fatigue', icon: BatteryLow, labelKey: 'symptoms.fatigue' },
    { id: 'headache', icon: Zap, labelKey: 'symptoms.headache' },
    { id: 'mood_sensitive', icon: Frown, labelKey: 'mood.sensitive' },
    { id: 'mood_low', icon: Meh, labelKey: 'mood.low' },
  ]
};

export default function SymptomGrid({ mode, selectedSymptoms, onToggleSymptom }: SymptomGridProps) {
  const { t } = useTranslation();
  const symptoms = SYMPTOMS_BY_MODE[mode] || SYMPTOMS_BY_MODE.cycle;

  return (
    <GlassCard variant="default">
      <Text style={styles.title}>{t('symptoms.title')}</Text>
      
      <View style={styles.grid}>
        {symptoms.map((symptom) => {
          const isSelected = selectedSymptoms.includes(symptom.id);
          const Icon = symptom.icon;
          
          return (
            <TouchableOpacity
              key={symptom.id}
              style={[
                styles.itemContainer,
                isSelected && styles.itemContainerActive
              ]}
              onPress={() => onToggleSymptom(symptom.id)}
              activeOpacity={0.7}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: isSelected }}
              accessibilityLabel={t(symptom.labelKey)}
            >
              <View style={[
                styles.iconWrapper,
                isSelected ? styles.iconWrapperActive : styles.iconWrapperInactive
              ]}>
                <Icon 
                  size={24} 
                  color={isSelected ? '#8B2635' : '#1A1A1A'} 
                  strokeWidth={isSelected ? 2 : 1.5} 
                />
              </View>
              <Text 
                style={[
                  styles.label,
                  isSelected && styles.labelActive
                ]}
                numberOfLines={2}
              >
                {t(symptom.labelKey)}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 16,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -4,
  },
  itemContainer: {
    width: '25%', // 4 items per row
    alignItems: 'center',
    paddingHorizontal: 4,
    marginBottom: 16,
  },
  itemContainerActive: {
    transform: [{ scale: 1.05 }],
  },
  iconWrapper: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    borderWidth: 1,
  },
  iconWrapperInactive: {
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    borderColor: 'rgba(44, 61, 48, 0.1)',
  },
  iconWrapperActive: {
    backgroundColor: 'rgba(139, 38, 53, 0.1)',
    borderColor: 'rgba(139, 38, 53, 0.3)',
    shadowColor: 'rgba(139, 38, 53, 0.3)',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 4,
  },
  label: {
    fontSize: 11,
    color: '#666',
    textAlign: 'center',
    fontWeight: '500',
  },
  labelActive: {
    color: '#8B2635',
    fontWeight: '700',
  }
});
