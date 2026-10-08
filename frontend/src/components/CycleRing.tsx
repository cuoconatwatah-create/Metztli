// ─────────────────────────────────────────────────────────
// Metztli — Anillo del ciclo (pantalla "Tu ciclo" del prototipo)
// ─────────────────────────────────────────────────────────

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Path, Circle } from 'react-native-svg';
import type { CycleCalculation, CyclePhase } from '@/types';
import { colors, fonts } from '@/theme';
import { useUi } from '@/i18n/ui';

export const PHASE_COLORS: Record<CyclePhase, string> = {
  menstrual: '#7A1F2D',
  follicular: '#E8B4BD',
  ovulation: '#D9A93A',
  luteal: '#C98A95',
};

export const PHASE_COPY: Record<CyclePhase, { label: string; short: string; hint: string }> = {
  menstrual: { label: 'Fase menstrual', short: 'Menstrual', hint: 'Tu cuerpo pide descanso y calor' },
  follicular: { label: 'Fase folicular', short: 'Folicular', hint: 'Tu energía comienza a subir' },
  ovulation: { label: 'Ovulación', short: 'Ovulación', hint: 'Días de mayor fertilidad' },
  luteal: { label: 'Fase lútea', short: 'Lútea', hint: 'Escucha tu cuerpo, baja el ritmo' },
};

interface Props {
  calculation: CycleCalculation | null;
  size?: number;
}

function polar(cx: number, cy: number, r: number, deg: number) {
  const rad = (deg * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

export default function CycleRing({ calculation, size = 220 }: Props) {
  const u = useUi();
  const cx = size / 2;
  const radius = size / 2 - 14;
  const stroke = 22;

  if (!calculation) {
    return (
      <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
        <Text style={styles.hint}>{u('Aún no hay datos de tu ciclo')}</Text>
      </View>
    );
  }

  const { currentDay, cycleLength: L, periodLength, currentPhase } = calculation;
  const day = Math.min(currentDay, L);

  const ranges: { phase: CyclePhase; from: number; to: number }[] = [
    { phase: 'menstrual', from: 1, to: periodLength },
    { phase: 'follicular', from: periodLength + 1, to: L - 16 },
    { phase: 'ovulation', from: L - 15, to: L - 12 },
    { phase: 'luteal', from: L - 11, to: L },
  ];

  const arc = (from: number, to: number) => {
    const a0 = ((from - 1) / L) * 360 - 90;
    const a1 = (to / L) * 360 - 90;
    const p0 = polar(cx, cx, radius, a0);
    const p1 = polar(cx, cx, radius, a1);
    return `M ${p0.x} ${p0.y} A ${radius} ${radius} 0 ${a1 - a0 > 180 ? 1 : 0} 1 ${p1.x} ${p1.y}`;
  };

  const marker = polar(cx, cx, radius, ((day - 0.5) / L) * 360 - 90);
  const copy = PHASE_COPY[currentPhase];

  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size}>
        {ranges
          .filter((r) => r.to >= r.from)
          .map((r) => (
            <Path
              key={r.phase}
              d={arc(r.from, r.to)}
              stroke={PHASE_COLORS[r.phase]}
              strokeWidth={stroke}
              fill="none"
            />
          ))}
        {Array.from({ length: L }).map((_, i) => {
          const p = polar(cx, cx, radius, ((i + 0.5) / L) * 360 - 90);
          return <Circle key={i} cx={p.x} cy={p.y} r={2} fill="rgba(255,255,255,0.9)" />;
        })}
        <Circle cx={marker.x} cy={marker.y} r={9} fill={colors.white} stroke={colors.carmin} strokeWidth={3} />
      </Svg>

      <View style={[styles.center, { pointerEvents: 'none' }]}>
        <Text style={styles.dayLabel}>{u('DÍA')}</Text>
        <Text style={styles.dayNumber} accessibilityLabel={u('Día {{day}} de {{total}}', { day, total: L })}>{day}</Text>
        <Text style={styles.phase}>{u(copy.label)}</Text>
        <Text style={styles.hint}>{u(copy.hint)}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 48,
  },
  dayLabel: { fontFamily: fonts.semibold, fontSize: 10, letterSpacing: 2, color: colors.mutedSoft },
  dayNumber: { fontFamily: fonts.display, fontSize: 48, lineHeight: 52, color: colors.carbon },
  phase: { fontFamily: fonts.bold, fontSize: 13, color: colors.carbon, marginTop: 2 },
  hint: { fontFamily: fonts.regular, fontSize: 10, color: colors.muted, textAlign: 'center', marginTop: 2 },
});
