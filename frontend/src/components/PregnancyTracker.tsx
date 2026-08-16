// ─────────────────────────────────────────────────────────
// Metztli 2.0 — Pregnancy Tracker Component
// ─────────────────────────────────────────────────────────

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Baby, Calendar, Stethoscope } from 'lucide-react-native';
import GlassCard from './GlassCard';
import type { PregnancyCalculation } from '@/types';

interface PregnancyTrackerProps {
  calculation: PregnancyCalculation | null;
}

export default function PregnancyTracker({
  calculation,
}: PregnancyTrackerProps) {
  const { t } = useTranslation();

  if (!calculation) {
    return (
      <GlassCard className="items-center justify-center p-8">
        <Text style={styles.emptyText}>{t('common.no_data')}</Text>
      </GlassCard>
    );
  }

  const {
    gestationalWeeks,
    gestationalDays,
    trimester,
    daysRemaining,
    progressPercent,
    weekData,
  } = calculation;

  return (
    <View style={styles.container}>
      {/* Tarjeta Principal - Resumen */}
      <GlassCard variant="bosque" className="mb-4">
        <View style={styles.header}>
          <View>
            <Text style={styles.weekTitle}>
              {t('pregnancy.week', { week: gestationalWeeks })}
            </Text>
            <Text style={styles.daySubtitle}>
              {t('pregnancy.week_day', { week: gestationalWeeks, day: gestationalDays })}
            </Text>
          </View>
          <View style={styles.trimesterBadge}>
            <Text style={styles.trimesterText}>
              {t('pregnancy.trimester', { num: trimester })}
            </Text>
          </View>
        </View>

        <View style={styles.progressContainer}>
          <View style={styles.progressBarBg}>
            <View
              style={[
                styles.progressBarFill,
                { width: `${progressPercent}%` },
              ]}
            />
          </View>
          <Text style={styles.progressText}>
            {t('pregnancy.days_remaining', { days: daysRemaining })}
          </Text>
        </View>
      </GlassCard>

      {/* Tarjeta de Desarrollo Semanal */}
      {weekData && (
        <GlassCard variant="default" className="mb-4">
          <View style={styles.sectionHeader}>
            <Baby size={24} color="#8B2635" strokeWidth={1.75} />
            <Text style={styles.sectionTitle}>{t('pregnancy.baby_size', { cm: weekData.baby_size_cm })}</Text>
          </View>
          
          <Text style={styles.highlightText}>
            {t(weekData.size_comparison_key)}
          </Text>
          
          {weekData.baby_weight_g > 0 && (
            <Text style={styles.subText}>
              {t('pregnancy.baby_weight', { g: weekData.baby_weight_g })}
            </Text>
          )}

          <View style={styles.divider} />
          
          <Text style={styles.bodyText}>
            {t(weekData.development_key)}
          </Text>
        </GlassCard>
      )}

      {/* Tarjeta de Cuidado Prenatal */}
      {weekData && (
        <GlassCard variant="default">
          <View style={styles.sectionHeader}>
            <Stethoscope size={24} color="#2C3D30" strokeWidth={1.75} />
            <Text style={styles.sectionTitle}>{t('pregnancy.prenatal_care')}</Text>
          </View>
          <Text style={styles.bodyText}>
            {t(weekData.recommended_exams_key)}
          </Text>
          <View style={styles.divider} />
          <View style={styles.sectionHeader}>
            <Calendar size={24} color="#2C3D30" strokeWidth={1.75} />
            <Text style={styles.sectionTitle}>Tips</Text>
          </View>
          <Text style={styles.bodyText}>
            {t(weekData.maternal_tips_key)}
          </Text>
        </GlassCard>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  weekTitle: {
    fontSize: 32,
    fontWeight: '800',
    color: '#2C3D30', // Bosque text for the bosque variant card
  },
  daySubtitle: {
    fontSize: 16,
    color: '#1A1A1A',
    fontWeight: '500',
    marginTop: 4,
  },
  trimesterBadge: {
    backgroundColor: 'rgba(44, 61, 48, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  trimesterText: {
    color: '#2C3D30',
    fontWeight: '700',
    fontSize: 12,
  },
  progressContainer: {
    marginTop: 8,
  },
  progressBarBg: {
    height: 8,
    backgroundColor: 'rgba(44, 61, 48, 0.15)',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#8B2635', // Carmín
    borderRadius: 4,
  },
  progressText: {
    fontSize: 14,
    color: '#1A1A1A',
    fontWeight: '500',
    textAlign: 'right',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  highlightText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#8B2635',
    marginBottom: 6,
  },
  subText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
  },
  bodyText: {
    fontSize: 15,
    lineHeight: 22,
    color: '#1A1A1A',
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(44, 61, 48, 0.1)',
    marginVertical: 16,
  },
});
