// ─────────────────────────────────────────────────────────
// Metztli 2.0 — Cycle Wheel Component (Visualizador de Ciclo)
// ─────────────────────────────────────────────────────────

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Circle, Path, G, Text as SvgText } from 'react-native-svg';
import { useTranslation } from 'react-i18next';
import GlassCard from './GlassCard';
import type { CycleCalculation } from '@/types';

interface CycleWheelProps {
  calculation: CycleCalculation | null;
  size?: number;
}

export default function CycleWheel({
  calculation,
  size = 280,
}: CycleWheelProps) {
  const { t } = useTranslation();

  if (!calculation) {
    return (
      <GlassCard className="items-center justify-center p-8">
        <Text style={styles.emptyText}>{t('common.no_data')}</Text>
      </GlassCard>
    );
  }

  const { currentDay, cycleLength, periodLength, currentPhase } = calculation;

  const center = size / 2;
  const radius = size / 2 - 30;
  const strokeWidth = 24;

  // Colores de las fases
  const colors = {
    menstrual: '#8B2635', // Carmín
    follicular: '#E2D9C8', // Avena oscura
    ovulation: '#D4A373', // Tono ocre/tierra
    luteal: '#2C3D30',    // Bosque
  };

  // Función auxiliar para dibujar arcos SVG
  const createArc = (startDay: number, endDay: number, color: string) => {
    const startAngle = ((startDay - 1) / cycleLength) * 360 - 90;
    const endAngle = ((endDay - 1) / cycleLength) * 360 - 90;

    const startRad = (startAngle * Math.PI) / 180;
    const endRad = (endAngle * Math.PI) / 180;

    const x1 = center + radius * Math.cos(startRad);
    const y1 = center + radius * Math.sin(startRad);
    const x2 = center + radius * Math.cos(endRad);
    const y2 = center + radius * Math.sin(endRad);

    const largeArcFlag = endAngle - startAngle <= 180 ? '0' : '1';

    const d = [
      'M', x1, y1,
      'A', radius, radius, 0, largeArcFlag, 1, x2, y2,
    ].join(' ');

    return <Path key={`${startDay}-${color}`} d={d} stroke={color} strokeWidth={strokeWidth} fill="none" strokeLinecap="round" />;
  };

  // Indicador del día actual
  const currentAngle = ((currentDay - 1) / cycleLength) * 360 - 90;
  const currentRad = (currentAngle * Math.PI) / 180;
  const indicatorX = center + radius * Math.cos(currentRad);
  const indicatorY = center + radius * Math.sin(currentRad);

  return (
    <GlassCard variant="default">
      <View style={styles.header}>
        <Text style={styles.title}>{t('cycle.title')}</Text>
        <Text style={styles.subtitle}>
          {t('cycle.current_day', { day: currentDay })}
        </Text>
      </View>

      <View style={styles.wheelContainer}>
        <Svg width={size} height={size}>
          {/* Fondo de la rueda */}
          <Circle
            cx={center}
            cy={center}
            r={radius}
            stroke="rgba(44, 61, 48, 0.08)"
            strokeWidth={strokeWidth}
            fill="none"
          />

          {/* Fases del ciclo */}
          {createArc(1, periodLength + 1, colors.menstrual)}
          {createArc(periodLength + 1, cycleLength - 14, colors.follicular)}
          {createArc(cycleLength - 14, cycleLength - 11, colors.ovulation)}
          {createArc(cycleLength - 11, cycleLength + 1, colors.luteal)}

          {/* Indicador de día actual */}
          <Circle
            cx={indicatorX}
            cy={indicatorY}
            r={strokeWidth / 2 + 4}
            fill="#F4F1EA"
            stroke="#1A1A1A"
            strokeWidth={3}
            shadowColor="#000"
            shadowOffset={{ width: 0, height: 2 }}
            shadowOpacity={0.25}
            shadowRadius={3.84}
          />
          <SvgText
            x={center}
            y={center}
            textAnchor="middle"
            alignmentBaseline="middle"
            fontSize="36"
            fontWeight="bold"
            fill="#1A1A1A"
          >
            {currentDay}
          </SvgText>
          <SvgText
            x={center}
            y={center + 25}
            textAnchor="middle"
            alignmentBaseline="middle"
            fontSize="14"
            fill="#666"
            fontWeight="500"
          >
            {t(`cycle.phase_${currentPhase}`)}
          </SvgText>
        </Svg>
      </View>

      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.dot, { backgroundColor: colors.menstrual }]} />
          <Text style={styles.legendText}>{t('cycle.phase_menstrual')}</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.dot, { backgroundColor: colors.ovulation }]} />
          <Text style={styles.legendText}>{t('cycle.phase_ovulation')}</Text>
        </View>
      </View>
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  header: {
    marginBottom: 16,
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  subtitle: {
    fontSize: 16,
    color: '#8B2635',
    fontWeight: '600',
    marginTop: 4,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  wheelContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 10,
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
    marginTop: 16,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  legendText: {
    fontSize: 12,
    color: '#1A1A1A',
    fontWeight: '500',
  },
});
