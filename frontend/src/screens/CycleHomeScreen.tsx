// ─────────────────────────────────────────────────────────
// Metztli — Etapa Menstruación: Calendario / "Tu ciclo" (prototipo)
// ─────────────────────────────────────────────────────────

import React, { useCallback, useState } from 'react';
import { View, ScrollView, StyleSheet, SafeAreaView, Alert, TouchableOpacity, Text } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { Bell, Droplet, Volume2, Moon, ChevronRight } from 'lucide-react-native';
import * as Speech from 'expo-speech';
import { useCycleCalculator } from '@/hooks/useCycleCalculator';
import { loadDay, saveDay } from '@/lib/dailyLog';
import type { DailyLog } from '@/types';
import StageSwitcher from '@/components/StageSwitcher';
import CycleRing, { PHASE_COLORS, PHASE_COPY } from '@/components/CycleRing';
import { Card, CurvedHeader } from '@/components/ui';
import { colors, fonts, radius } from '@/theme';
import { useUi } from '@/i18n/ui';

const DAYS = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
const MONTHS = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];

function formatToday(u: (s: string) => string): string {
  const d = new Date();
  return `${u(DAYS[d.getDay()])}, ${d.getDate()} ${u('de')} ${u(MONTHS[d.getMonth()])}`;
}

const FLOW_COLORS = [
  { id: 'rosado', label: 'Rosa', color: '#F2A6B3' },
  { id: 'rojo', label: 'Rojo', color: '#D8344A' },
  { id: 'rojo_oscuro', label: 'Oscuro', color: '#7A1F2D' },
  { id: 'cafe', label: 'Café', color: '#6B3F2A' },
];

const MUCUS = [
  { id: 'seco', label: 'Seco' },
  { id: 'cremoso', label: 'Cremoso' },
  { id: 'acuoso', label: 'Acuoso' },
  { id: 'elastico', label: 'Elástico' },
];

const LISTEN_TEXT = 'El dolor que detiene tu día merece atención. Registra tu intensidad y pide apoyo si no puedes seguir con tu día.';

export default function CycleHomeScreen() {
  const u = useUi();
  const navigation = useNavigation<any>();
  const [day, setDay] = useState<DailyLog | null>(null);
  const [retreat, setRetreat] = useState(false);

  const { calculation: cycleCalc, recalculate } = useCycleCalculator();

  useFocusEffect(
    useCallback(() => {
      let active = true;
      (async () => {
        const today = await loadDay();
        if (!active) return;
        setDay(today);
        recalculate();
      })();
      return () => {
        active = false;
      };
    }, [recalculate])
  );

  const pick = async (key: 'flow_color' | 'mucus', value: string) => {
    const current = key === 'flow_color' ? day?.flow_color : day?.mucus;
    setDay(await saveDay({ [key]: current === value ? null : value }));
  };

  const speak = () => {
    Speech.stop();
    Speech.speak(u(LISTEN_TEXT), { language: 'es-ES', rate: 0.9 });
  };

  const toggleRetreat = () => {
    const next = !retreat;
    setRetreat(next);
    if (next) {
      Alert.alert(
        u('Modo Retiro activado'),
        u('La pantalla se oscureció para tu descanso. Tu red de apoyo recibirá un aviso para que te acompañe con calma y te dé espacio.'),
        [{ text: u('Entendido') }]
      );
    }
  };

  const showReminders = () => {
    if (cycleCalc) {
      Alert.alert(
        u('Recordatorios'),
        `${u('Próximo periodo')}: ${cycleCalc.nextPeriodDate}\n${u('Día de ovulación')}: ${cycleCalc.ovulationDate}`
      );
    } else {
      Alert.alert(u('Recordatorios'), u('Aún no tienes recordatorios programados.'));
    }
  };

  const selectedFlow = day?.flow_color ?? null;
  const selectedMucus = day?.mucus ?? null;

  const renderCycle = () => (
    <>
      <Card style={{ alignItems: 'center', gap: 12 }}>
        <View style={styles.cycleHead}>
          <View>
            <Text style={styles.muted}>{u('Ciclo actual')}</Text>
            <Text style={styles.strong}>
              {cycleCalc ? u('Día {{day}} de {{total}}', { day: Math.min(cycleCalc.currentDay, cycleCalc.cycleLength), total: cycleCalc.cycleLength }) : '—'}
            </Text>
          </View>
          {cycleCalc && (
            <Text style={[styles.strong, { color: colors.carmin }]}>{u(PHASE_COPY[cycleCalc.currentPhase].label)}</Text>
          )}
        </View>

        <CycleRing calculation={cycleCalc} />

        <TouchableOpacity
          style={styles.bleedBtn}
          onPress={() => navigation.navigate('MiCiclo')}
          accessibilityRole="button"
          accessibilityLabel={u('Registrar nuevo sangrado')}
        >
          <Droplet size={14} color={colors.white} />
          <Text style={styles.bleedText}>{u('Nuevo sangrado')}</Text>
        </TouchableOpacity>

        <View style={styles.legend}>
          {(['menstrual', 'follicular', 'ovulation', 'luteal'] as const).map((p) => (
            <View key={p} style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: PHASE_COLORS[p] }]} />
              <Text style={styles.legendText}>{u(PHASE_COPY[p].short)}</Text>
            </View>
          ))}
        </View>
      </Card>

      <View style={styles.row}>
        <Card style={styles.half}>
          <Text style={styles.strong}>{u('Color del flujo')}</Text>
          <View style={styles.swatches}>
            {FLOW_COLORS.map((f) => {
              const active = selectedFlow === f.id;
              return (
                <TouchableOpacity
                  key={f.id}
                  onPress={() => pick('flow_color', f.id)}
                  style={styles.swatchWrap}
                  accessibilityRole="button"
                  accessibilityLabel={u('Flujo {{c}}', { c: u(f.label) })}
                  accessibilityState={{ selected: active }}
                >
                  <View style={[styles.swatch, { backgroundColor: f.color }, active && styles.swatchActive]} />
                  <Text style={[styles.swatchLabel, active && { color: colors.carmin, fontFamily: fonts.bold }]}>
                    {u(f.label)}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </Card>

        <Card style={styles.half}>
          <Text style={styles.strong}>{u('Moco cervical')}</Text>
          <View style={styles.mucusGrid}>
            {MUCUS.map((m) => {
              const active = selectedMucus === m.id;
              return (
                <TouchableOpacity
                  key={m.id}
                  onPress={() => pick('mucus', m.id)}
                  style={[styles.mucusChip, active && styles.mucusChipActive]}
                  accessibilityRole="button"
                  accessibilityState={{ selected: active }}
                >
                  <Text style={[styles.mucusText, active && { color: colors.white }]}>{u(m.label)}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </Card>
      </View>

      <TouchableOpacity activeOpacity={0.9} onPress={() => navigation.navigate('ComoHabitas')} style={styles.listenCard}>
        <TouchableOpacity style={styles.listenIcon} onPress={speak} accessibilityLabel={u('Escuchar mensaje')} accessibilityRole="button">
          <Volume2 size={18} color={colors.white} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.listenEyebrow}>{u('ESCUCHA Y PREVIENE')}</Text>
          <Text style={styles.listenTitle}>{u('El dolor que detiene tu día merece atención.')}</Text>
          <Text style={styles.listenBody}>{u('Registra tu intensidad y pide apoyo si no puedes seguir con tu día.')}</Text>
        </View>
        <ChevronRight size={18} color={colors.carmin} />
      </TouchableOpacity>
    </>
  );

  return (
    <SafeAreaView style={[styles.safeArea, retreat && styles.safeAreaDark]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>
        <CurvedHeader
          eyebrow={formatToday(u)}
          title={u('Tu ciclo')}
          right={
            <TouchableOpacity style={styles.bell} onPress={showReminders} accessibilityLabel={u('Recordatorios')} accessibilityRole="button">
              <Bell size={18} color={colors.white} />
            </TouchableOpacity>
          }
        >
          <StageSwitcher />
        </CurvedHeader>

        <View style={styles.body}>
          {renderCycle()}

          <TouchableOpacity activeOpacity={0.9} onPress={toggleRetreat} style={[styles.retreat, retreat && { backgroundColor: colors.bosque }]}>
            <Moon size={18} color={retreat ? colors.avena : colors.bosque} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.strong, retreat && { color: colors.avena }]}>{u('Modo retiro')}</Text>
              <Text style={[styles.muted, retreat && { color: 'rgba(244,241,234,0.7)' }]}>
                {retreat ? u('Activo · toca para desactivar') : u('Descansa y avisa a tu red de apoyo')}
              </Text>
            </View>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.avena },
  safeAreaDark: { backgroundColor: '#111512' },
  body: { padding: 16, gap: 16 },
  bell: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  muted: { fontFamily: fonts.regular, fontSize: 11, color: colors.muted },
  strong: { fontFamily: fonts.bold, fontSize: 14, color: colors.carbon },
  cycleHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', alignSelf: 'stretch' },
  bleedBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.carmin,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: radius.pill,
    marginTop: -26,
  },
  bleedText: { fontFamily: fonts.semibold, fontSize: 12, color: colors.white },
  legend: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 12, marginTop: 4 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendText: { fontFamily: fonts.regular, fontSize: 10, color: colors.muted, textTransform: 'capitalize' },
  row: { flexDirection: 'row', gap: 12 },
  half: { flex: 1, gap: 10, padding: 14 },
  swatches: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  swatchWrap: { alignItems: 'center', gap: 4, width: '40%' },
  swatch: { width: 26, height: 26, borderRadius: 13 },
  swatchActive: { borderWidth: 3, borderColor: colors.white, shadowColor: colors.carmin, shadowOpacity: 0.6, shadowRadius: 4, elevation: 4 },
  swatchLabel: { fontFamily: fonts.regular, fontSize: 9, color: colors.muted },
  mucusGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  mucusChip: {
    flexGrow: 1,
    minWidth: '44%',
    alignItems: 'center',
    paddingVertical: 7,
    borderRadius: radius.pill,
    backgroundColor: colors.avena,
  },
  mucusChipActive: { backgroundColor: colors.bosque },
  mucusText: { fontFamily: fonts.medium, fontSize: 10, color: colors.carbon },
  listenCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    borderRadius: radius.lg,
    backgroundColor: '#EFE2D6',
  },
  listenIcon: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.bosque, alignItems: 'center', justifyContent: 'center' },
  listenEyebrow: { fontFamily: fonts.semibold, fontSize: 9, letterSpacing: 1.2, color: colors.carmin, marginBottom: 2 },
  listenTitle: { fontFamily: fonts.bold, fontSize: 14, color: colors.carbon, lineHeight: 19 },
  listenBody: { fontFamily: fonts.regular, fontSize: 11, color: colors.muted, marginTop: 4, lineHeight: 16 },
  retreat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: radius.lg,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.line,
  },
});
