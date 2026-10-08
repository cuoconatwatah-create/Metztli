// ─────────────────────────────────────────────────────────
// Metztli — Etapa Embarazo: inicio ("Tu embarazo")
//
// Si aún no hay un embarazo activo, pide la FUM o la fecha probable de parto.
// Con embarazo activo muestra semana, progreso, próximo control y accesos.
// ─────────────────────────────────────────────────────────

import React, { useCallback, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, SafeAreaView, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { Bell, CalendarDays, Footprints, Siren, Stethoscope, ClipboardList } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import {
  endPregnancy,
  getActivePregnancy,
  getPrenatalCheckups,
  savePregnancyDates,
  dueDateFromLmp,
} from '@/db/database';
import { usePregnancyCalculator } from '@/hooks/usePregnancyCalculator';
import { localISODate } from '@/lib/dailyLog';
import type { Pregnancy, PrenatalCheckup } from '@/types';
import StageSwitcher from '@/components/StageSwitcher';
import DateStepper from '@/components/DateStepper';
import { Button, Card, Chip, CurvedHeader, HubRow, SectionTitle } from '@/components/ui';
import { colors, fonts, radius } from '@/theme';
import { useUi } from '@/i18n/ui';

const DAYS = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
const MONTHS = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];

export function daysBetween(fromISO: string, toISO: string): number {
  const [a, b] = [fromISO, toISO].map((s) => {
    const [y, m, d] = s.split('-').map(Number);
    return Date.UTC(y, m - 1, d);
  });
  return Math.round((b - a) / 86400000);
}

export function formatDate(iso: string, u: (s: string) => string): string {
  const [y, m, d] = iso.split('-').map(Number);
  return `${d} ${u('de')} ${u(MONTHS[m - 1])} ${u('de')} ${y}`;
}

export default function PregnancyHomeScreen() {
  const u = useUi();
  const { t } = useTranslation();
  const navigation = useNavigation<any>();
  const { calculation, recalculate } = usePregnancyCalculator();

  const [loading, setLoading] = useState(true);
  const [pregnancy, setPregnancy] = useState<Pregnancy | null>(null);
  const [next, setNext] = useState<PrenatalCheckup | null>(null);
  const [editing, setEditing] = useState(false);
  const [knows, setKnows] = useState<'lmp' | 'due'>('lmp');
  const [date, setDate] = useState(localISODate());

  const today = localISODate();
  const year = new Date().getFullYear();

  const load = useCallback(async () => {
    const p = await getActivePregnancy();
    const checkups = p ? await getPrenatalCheckups() : [];
    setPregnancy(p);
    setNext(checkups.find((c) => !c.done && c.checkup_date >= localISODate()) ?? null);
    setLoading(false);
    recalculate();
  }, [recalculate]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const startEditing = () => {
    if (pregnancy) {
      setKnows('lmp');
      setDate(pregnancy.lmp_date);
    } else {
      setKnows('lmp');
      setDate(localISODate());
    }
    setEditing(true);
  };

  const switchKnows = (k: 'lmp' | 'due') => {
    setKnows(k);
    // Valor inicial razonable: la FUM ronda las 20 semanas atrás; la fecha de parto, 20 adelante
    const base = new Date();
    base.setDate(base.getDate() + (k === 'due' ? 140 : 0));
    setDate(localISODate(base));
  };

  const save = async () => {
    try {
      await savePregnancyDates(knows === 'lmp' ? { lmp_date: date } : { due_date: date });
      setEditing(false);
      await load();
    } catch (e: any) {
      const messages: Record<string, string> = {
        future_date: u('La FUM no puede ser una fecha futura. Revisa el año y el mes.'),
        too_old: u('Esa fecha es de hace más de 10 meses. Revisa que sea correcta.'),
        invalid_date: u('La fecha no es válida.'),
      };
      Alert.alert(u('No se pudo guardar'), messages[e?.code] ?? e?.message ?? '');
    }
  };

  const finish = () => {
    Alert.alert(
      u('¿Terminó tu embarazo?'),
      u('Tus controles y pataditas se guardan como historial. Podrás empezar uno nuevo o cambiar de etapa cuando quieras.'),
      [
        { text: u('Cancelar'), style: 'cancel' },
        {
          text: u('Sí, terminó'),
          style: 'destructive',
          onPress: async () => {
            await endPregnancy();
            await load();
          },
        },
      ]
    );
  };

  const d = new Date();
  const dateLabel = `${u(DAYS[d.getDay()])}, ${d.getDate()} ${u('de')} ${u(MONTHS[d.getMonth()])}`;

  const showSetup = !loading && (!pregnancy || editing);
  const week = calculation?.gestationalWeeks ?? 0;
  const weekData = calculation?.weekData ?? null;

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>
        <CurvedHeader
          eyebrow={dateLabel}
          title={u('Tu embarazo')}
          right={
            <TouchableOpacity
              style={styles.bell}
              onPress={() => navigation.navigate('ObstetricAlarm')}
              accessibilityRole="button"
              accessibilityLabel={u('Señales de alarma')}
            >
              <Bell size={18} color={colors.white} />
            </TouchableOpacity>
          }
        >
          <StageSwitcher />
        </CurvedHeader>

        <View style={styles.body}>
          {loading && <ActivityIndicator color={colors.carmin} style={{ marginTop: 24 }} />}

          {showSetup && (
            <Card style={{ gap: 14 }}>
              <Text style={styles.title}>
                {pregnancy ? u('Corregir la fecha') : u('Cuéntanos de tu embarazo')}
              </Text>
              <Text style={styles.muted}>
                {u('Con una fecha calculamos en qué semana estás. Puedes cambiarla cuando quieras.')}
              </Text>
              <View style={styles.chips}>
                <Chip label={u('Sé mi FUM')} active={knows === 'lmp'} onPress={() => switchKnows('lmp')} />
                <Chip label={u('Sé mi fecha de parto')} active={knows === 'due'} onPress={() => switchKnows('due')} />
              </View>
              <Text style={styles.hint}>
                {knows === 'lmp'
                  ? u('FUM: el primer día de tu última menstruación.')
                  : u('Fecha probable de parto: la que te dijo tu partera o médica.')}
              </Text>
              <DateStepper
                value={date}
                onChange={setDate}
                minYear={knows === 'lmp' ? year - 1 : year}
                maxYear={knows === 'lmp' ? year : year + 1}
              />
              <Button label={u('Guardar')} onPress={save} />
              {pregnancy && (
                <TouchableOpacity style={styles.link} onPress={() => setEditing(false)} accessibilityRole="button">
                  <Text style={styles.linkText}>{u('Cancelar')}</Text>
                </TouchableOpacity>
              )}
            </Card>
          )}

          {!loading && pregnancy && !editing && calculation && (
            <>
              <Card style={{ gap: 12 }}>
                <View style={styles.weekRow}>
                  <View>
                    <Text style={styles.eyebrow}>{u('TRIMESTRE {{n}}', { n: calculation.trimester })}</Text>
                    <Text style={styles.weekNumber}>{u('Semana {{n}}', { n: week })}</Text>
                    <Text style={styles.muted}>
                      {u('{{d}} días de la semana', { d: calculation.gestationalDays })}
                    </Text>
                  </View>
                  <View style={styles.percent}>
                    <Text style={styles.percentText}>{calculation.progressPercent}%</Text>
                  </View>
                </View>
                <View style={styles.track}>
                  <View style={[styles.fill, { width: `${calculation.progressPercent}%` }]} />
                </View>
                <Text style={styles.muted}>
                  {u('Faltan {{n}} días · fecha probable de parto: {{date}}', {
                    n: calculation.daysRemaining,
                    date: formatDate(dueDateFromLmp(pregnancy.lmp_date), u),
                  })}
                </Text>
                {pregnancy.lmp_estimated === 1 && (
                  <Text style={styles.hint}>{u('Calculada a partir de la fecha probable de parto.')}</Text>
                )}
              </Card>

              {weekData && weekData.baby_size_cm > 0 && (
                <Card style={{ gap: 6, backgroundColor: colors.bosque }}>
                  <Text style={[styles.eyebrow, { color: 'rgba(244,241,234,0.7)' }]}>{u('TU BEBÉ ESTA SEMANA')}</Text>
                  <Text style={styles.babyTitle}>{t(weekData.size_comparison_key)}</Text>
                  <Text style={styles.babyBody}>
                    {u('Mide unos {{cm}} cm y pesa unos {{g}} g.', { cm: weekData.baby_size_cm, g: weekData.baby_weight_g })}
                  </Text>
                  <Text style={styles.babyBody}>{t(weekData.development_key)}</Text>
                </Card>
              )}

              <Card style={styles.nextCard}>
                <View style={styles.nextIcon}>
                  <Stethoscope size={20} color={colors.carmin} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.eyebrow}>{u('PRÓXIMO CONTROL')}</Text>
                  {next ? (
                    <>
                      <Text style={styles.nextTitle}>{formatDate(next.checkup_date, u)}</Text>
                      <Text style={styles.muted}>
                        {daysBetween(today, next.checkup_date) === 0
                          ? u('Es hoy')
                          : u('En {{n}} días', { n: daysBetween(today, next.checkup_date) })}
                        {next.place ? ` · ${next.place}` : ''}
                      </Text>
                    </>
                  ) : (
                    <Text style={styles.muted}>{u('No tienes controles agendados.')}</Text>
                  )}
                </View>
                <TouchableOpacity onPress={() => navigation.navigate('ControlesTab')} accessibilityRole="button">
                  <Text style={styles.linkText}>{next ? u('Ver') : u('Agendar')}</Text>
                </TouchableOpacity>
              </Card>

              <SectionTitle>{u('Cuida tu embarazo')}</SectionTitle>
              <HubRow
                icon={<Footprints size={20} color={colors.carmin} />}
                title={u('Contador de pataditas')}
                desc={u('Monitorea la actividad de tu bebé')}
                onPress={() => navigation.navigate('KickCounter')}
              />
              <HubRow
                icon={<CalendarDays size={20} color={colors.bosque} />}
                title={u('Desarrollo semana a semana')}
                desc={u('Explora los cambios de tu bebé')}
                onPress={() => navigation.navigate('PregnancyTimeline')}
              />
              <HubRow
                danger
                icon={<Siren size={20} color={colors.carmin} />}
                title={u('Señales de alarma')}
                desc={u('Qué hacer en una emergencia')}
                onPress={() => navigation.navigate('ObstetricAlarm')}
              />
              <HubRow
                icon={<ClipboardList size={20} color={colors.bosque} />}
                title={u('Triage y auxilio por SMS')}
                desc={u('Síntomas críticos y aviso a tu partera')}
                onPress={() => navigation.navigate('Embarazo')}
              />

              <View style={styles.footer}>
                <TouchableOpacity onPress={startEditing} accessibilityRole="button">
                  <Text style={styles.linkText}>{u('Corregir la fecha')}</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={finish} accessibilityRole="button">
                  <Text style={[styles.linkText, { color: colors.mutedSoft }]}>{u('Mi embarazo terminó')}</Text>
                </TouchableOpacity>
              </View>
            </>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.avena },
  body: { padding: 16, gap: 14 },
  bell: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { fontFamily: fonts.display, fontSize: 20, color: colors.carbon },
  muted: { fontFamily: fonts.regular, fontSize: 12, color: colors.muted, lineHeight: 18 },
  hint: { fontFamily: fonts.regular, fontSize: 11, color: colors.mutedSoft, lineHeight: 16 },
  chips: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  link: { alignItems: 'center', padding: 6 },
  linkText: { fontFamily: fonts.semibold, fontSize: 12, color: colors.carmin },
  eyebrow: { fontFamily: fonts.semibold, fontSize: 9, letterSpacing: 1.2, color: colors.carmin },
  weekRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  weekNumber: { fontFamily: fonts.display, fontSize: 34, color: colors.carbon, marginVertical: 2 },
  percent: { width: 64, height: 64, borderRadius: 32, backgroundColor: colors.blush, alignItems: 'center', justifyContent: 'center' },
  percentText: { fontFamily: fonts.display, fontSize: 18, color: colors.carmin },
  track: { height: 8, borderRadius: 4, backgroundColor: colors.line, overflow: 'hidden' },
  fill: { height: '100%', backgroundColor: colors.carmin, borderRadius: 4 },
  babyTitle: { fontFamily: fonts.display, fontSize: 18, color: colors.white },
  babyBody: { fontFamily: fonts.regular, fontSize: 12, lineHeight: 18, color: 'rgba(244,241,234,0.9)' },
  nextCard: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  nextIcon: { width: 44, height: 44, borderRadius: radius.sm, backgroundColor: colors.blush, alignItems: 'center', justifyContent: 'center' },
  nextTitle: { fontFamily: fonts.bold, fontSize: 14, color: colors.carbon, marginTop: 2 },
  footer: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 4, paddingTop: 4 },
});
