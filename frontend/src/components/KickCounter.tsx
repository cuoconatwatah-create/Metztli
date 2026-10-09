// ─────────────────────────────────────────────────────────
// Metztli — Contador de pataditas
// Una sesión: se toca el círculo con cada movimiento. La meta de referencia es sentir 10 movimientos
// en 2 horas; si pasa más tiempo con menos, la app recomienda contactar al centro de salud.
// ─────────────────────────────────────────────────────────

import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { HeartPulse, Play, Square, AlertTriangle, CheckCircle2 } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { Card } from '@/components/ui';
import { colors, fonts, radius, shadow } from '@/theme';
import { useUi } from '@/i18n/ui';
import type { KickCounterProps } from '@/types';

const GOAL = 10;

function clock(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export default function KickCounter({ onSessionComplete }: KickCounterProps) {
  const { t } = useTranslation();
  const u = useUi();
  const [isActive, setIsActive] = useState(false);
  const [kickCount, setKickCount] = useState(0);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [elapsed, setElapsed] = useState(0); // segundos

  useEffect(() => {
    if (!isActive || !startTime) return;
    const id = setInterval(() => setElapsed(Math.floor((Date.now() - startTime) / 1000)), 1000);
    return () => clearInterval(id);
  }, [isActive, startTime]);

  const handleStart = () => {
    setIsActive(true);
    setKickCount(0);
    setStartTime(Date.now());
    setElapsed(0);
  };

  const handleStop = useCallback(() => {
    if (!isActive) return;
    setIsActive(false);

    const minutes = startTime ? Math.max(1, Math.floor((Date.now() - startTime) / 60000)) : 0;

    // Menos de 10 movimientos en 2 horas o más: se recomienda contactar al centro de salud
    if (minutes >= 120 && kickCount < GOAL) {
      Alert.alert(t('alarm.title'), t('kicks.alert_low'), [{ text: t('common.continue'), style: 'default' }]);
    }

    if (kickCount > 0) {
      onSessionComplete(kickCount, minutes);
      Alert.alert(t('common.save'), t('kicks.session_saved'));
    }

    setKickCount(0);
    setStartTime(null);
    setElapsed(0);
  }, [isActive, startTime, kickCount, onSessionComplete, t]);

  const handleKick = () => {
    if (isActive) setKickCount((prev) => prev + 1);
  };

  const reached = kickCount >= GOAL;
  const lowMovement = isActive && elapsed >= 3600 && kickCount < GOAL;
  const progress = Math.min(100, Math.round((kickCount / GOAL) * 100));

  return (
    <Card style={{ gap: 16 }}>
      <View style={styles.header}>
        <HeartPulse size={22} color={colors.carmin} />
        <Text style={styles.title}>{t('kicks.title')}</Text>
      </View>

      <View style={styles.stats}>
        <View style={styles.stat}>
          <Text style={styles.value}>{kickCount}</Text>
          <Text style={styles.label}>{u('Pataditas')}</Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.stat}>
          <Text style={styles.value}>{clock(elapsed)}</Text>
          <Text style={styles.label}>{u('Tiempo')}</Text>
        </View>
      </View>

      <View>
        <View style={styles.track} accessibilityLabel={u('{{n}} de {{goal}} pataditas', { n: kickCount, goal: GOAL })}>
          <View style={[styles.fill, { width: `${progress}%` }, reached && { backgroundColor: colors.bosque }]} />
        </View>
        <Text style={styles.goal}>{u('Meta: 10 movimientos en 2 horas')}</Text>
      </View>

      <View style={{ alignItems: 'center', gap: 12 }}>
        <Text style={styles.hint}>{isActive ? u('Toca el círculo cada vez que sientas un movimiento') : u('Toca el círculo para empezar a contar')}</Text>
        <TouchableOpacity
          style={[styles.big, isActive ? styles.bigActive : styles.bigIdle]}
          onPress={isActive ? handleKick : handleStart}
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityLabel={isActive ? t('kicks.tap_kick') : u('Iniciar conteo')}
        >
          {isActive ? (
            <HeartPulse size={52} color={colors.white} />
          ) : (
            <View style={{ alignItems: 'center', gap: 6 }}>
              <Play size={34} color={colors.white} />
              <Text style={styles.bigText}>{u('Iniciar conteo')}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {reached && isActive && (
        <View style={[styles.note, { backgroundColor: '#E6F2E8' }]}>
          <CheckCircle2 size={18} color={colors.bosque} />
          <Text style={[styles.noteText, { color: colors.bosque }]}>{u('¡Llegaste a 10 pataditas! Ya puedes finalizar la sesión.')}</Text>
        </View>
      )}

      {lowMovement && (
        <View style={[styles.note, { backgroundColor: colors.blush }]}>
          <AlertTriangle size={18} color={colors.carmin} />
          <Text style={[styles.noteText, { color: colors.carmin }]}>{t('kicks.alert_low')}</Text>
        </View>
      )}

      {isActive && (
        <TouchableOpacity style={styles.stop} onPress={handleStop} accessibilityRole="button">
          <Square size={18} color={colors.carbon} />
          <Text style={styles.stopText}>{u('Terminar y guardar')}</Text>
        </TouchableOpacity>
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  title: { fontFamily: fonts.display, fontSize: 18, color: colors.carbon },
  stats: { flexDirection: 'row', backgroundColor: colors.avena, borderRadius: radius.md, paddingVertical: 14 },
  stat: { flex: 1, alignItems: 'center' },
  divider: { width: 1, backgroundColor: colors.line },
  value: { fontFamily: fonts.display, fontSize: 32, color: colors.carmin },
  label: { fontFamily: fonts.semibold, fontSize: 10, letterSpacing: 1.2, color: colors.mutedSoft, textTransform: 'uppercase', marginTop: 2 },
  track: { height: 8, borderRadius: 4, backgroundColor: colors.line, overflow: 'hidden' },
  fill: { height: '100%', backgroundColor: colors.carmin, borderRadius: 4 },
  goal: { fontFamily: fonts.regular, fontSize: 11, color: colors.mutedSoft, marginTop: 6, textAlign: 'center' },
  hint: { fontFamily: fonts.medium, fontSize: 13, color: colors.muted, textAlign: 'center' },
  big: { width: 150, height: 150, borderRadius: 75, alignItems: 'center', justifyContent: 'center', ...shadow.glow },
  bigIdle: { backgroundColor: colors.bosque },
  bigActive: { backgroundColor: colors.carmin },
  bigText: { fontFamily: fonts.bold, fontSize: 13, color: colors.white },
  note: { flexDirection: 'row', gap: 10, alignItems: 'center', padding: 12, borderRadius: radius.sm },
  noteText: { flex: 1, fontFamily: fonts.medium, fontSize: 12, lineHeight: 18 },
  stop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 12, borderRadius: radius.md, backgroundColor: colors.avena },
  stopText: { fontFamily: fonts.semibold, fontSize: 14, color: colors.carbon },
});
