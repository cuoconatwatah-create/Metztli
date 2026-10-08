// ─────────────────────────────────────────────────────────
// Metztli — Selector de fecha con botones (sin teclado ni librerías nativas)
//
// Pensado para uso sin conexión y para personas con poca práctica escribiendo
// fechas: día, mes y año se ajustan con − / +.
// ─────────────────────────────────────────────────────────

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Stepper } from '@/components/ui';
import { useUi } from '@/i18n/ui';
import { colors, fonts } from '@/theme';

const MONTHS = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];

function parse(iso: string): { y: number; m: number; d: number } {
  const [y, m, d] = iso.split('-').map(Number);
  return { y, m, d };
}

function daysInMonth(y: number, m: number): number {
  return new Date(Date.UTC(y, m, 0)).getUTCDate();
}

function format(y: number, m: number, d: number): string {
  return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
}

interface Props {
  value: string; // YYYY-MM-DD
  onChange: (iso: string) => void;
  minYear: number;
  maxYear: number;
}

export default function DateStepper({ value, onChange, minYear, maxYear }: Props) {
  const u = useUi();
  const { y, m, d } = parse(value);

  const set = (ny: number, nm: number, nd: number) => {
    const day = Math.min(nd, daysInMonth(ny, nm));
    onChange(format(ny, nm, day));
  };

  const row = (label: string, control: React.ReactNode) => (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      {control}
    </View>
  );

  return (
    <View style={{ gap: 10 }}>
      {row(u('Día'), <Stepper value={d} min={1} max={daysInMonth(y, m)} onChange={(v) => set(y, m, v)} />)}
      {row(
        u('Mes'),
        <Stepper value={m} min={1} max={12} onChange={(v) => set(y, v, d)} format={(v) => u(MONTHS[v - 1]).slice(0, 3)} />
      )}
      {row(u('Año'), <Stepper value={y} min={minYear} max={maxYear} onChange={(v) => set(v, m, d)} />)}
      <Text style={styles.summary} accessibilityLiveRegion="polite">
        {d} {u('de')} {u(MONTHS[m - 1])} {u('de')} {y}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  label: { fontFamily: fonts.semibold, fontSize: 13, color: colors.carbon },
  summary: { fontFamily: fonts.bold, fontSize: 14, color: colors.carmin, textAlign: 'center', marginTop: 2 },
});
