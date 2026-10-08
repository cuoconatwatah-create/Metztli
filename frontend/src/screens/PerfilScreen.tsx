// ─────────────────────────────────────────────────────────
// Metztli — Perfil e Historial
// ─────────────────────────────────────────────────────────

import React, { useCallback, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, SafeAreaView, TouchableOpacity, Share, Alert, Switch } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { ShieldCheck, ClipboardCheck, Users, PhoneCall, Baby, CalendarDays, HeartHandshake, LogOut, Share2, ChevronRight } from 'lucide-react-native';
import { getDailyLogs } from '@/db/database';
import { supabase } from '@/lib/supabase';
import { isCloudBackupEnabled, setCloudBackupEnabled } from '@/lib/prefs';
import { deleteHealthBackup, pushHealthBackup } from '@/db/cloud';
import { localISODate } from '@/lib/dailyLog';
import type { DailyLog } from '@/types';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import StageSwitcher from '@/components/StageSwitcher';
import { useStage } from '@/context/StageContext';
import { useRole } from '@/context/RoleContext';
import { ROLE_LABELS } from '@/lib/roles';
import { Card, CurvedHeader, SectionTitle } from '@/components/ui';
import { colors, fonts, radius } from '@/theme';
import { useUi, type UiFn } from '@/i18n/ui';

const MONTHS = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

function daysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return localISODate(d);
}

/** Puntaje 0-100 con sueño, movimiento, hidratación y ánimo de un conjunto de registros. */
function wellness(logs: DailyLog[]): number | null {
  const scores = logs
    .map((l) => {
      const parts: number[] = [];
      if (l.sleep_hours !== null) parts.push(Math.min(l.sleep_hours / 8, 1));
      if (l.movement_min !== null) parts.push(Math.min(l.movement_min / 30, 1));
      if (l.water_glasses !== null) parts.push(Math.min(l.water_glasses / 8, 1));
      if (l.mood !== null) parts.push(l.mood === 'feliz' || l.mood === 'bien' ? 1 : 0.4);
      return parts.length ? parts.reduce((a, b) => a + b, 0) / parts.length : null;
    })
    .filter((s): s is number => s !== null);
  if (!scores.length) return null;
  return Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 100);
}

function describe(l: DailyLog, u: UiFn): { tag: string; title: string; detail: string } {
  const bits: string[] = [];
  if (l.sleep_hours !== null) bits.push(u('Sueño {{n}} h', { n: l.sleep_hours }));
  if (l.movement_min !== null) bits.push(u('Movimiento {{n}} min', { n: l.movement_min }));
  if (l.water_glasses !== null) bits.push(u('Agua {{n}}/8', { n: l.water_glasses }));
  const flow = l.flow_intensity;
  if (flow) return { tag: u('Ciclo'), title: u('Registro de período'), detail: u('Flujo {{f}}', { f: u(flow.replace('_', ' ')) }) };
  return { tag: u('Cuerpo y mente'), title: u('Registro diario'), detail: bits.join(' · ') || u('Registro guardado') };
}

export default function PerfilScreen() {
  const u = useUi();
  const navigation = useNavigation<any>();
  const [name, setName] = useState('');
  const { stage: mode } = useStage();
  const { role, isStaff, signedIn } = useRole();
  const [logs, setLogs] = useState<DailyLog[]>([]);
  const [backup, setBackup] = useState(false);
  const [backupBusy, setBackupBusy] = useState(false);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      (async () => {
        const monthLogs = await getDailyLogs(daysAgo(30), localISODate());
        let display = '';
        try {
          const { data } = await supabase.auth.getUser();
          display = (data.user?.user_metadata?.display_name as string) ?? '';
        } catch {
          // Sin conexión o sin sesión: se muestra el perfil sin nombre.
        }
        if (!active) return;
        const backupOn = await isCloudBackupEnabled();
        if (!active) return;
        setBackup(backupOn);
        setLogs(monthLogs);
        setName(display);
      })();
      return () => {
        active = false;
      };
    }, [])
  );

  const last7 = logs.filter((l) => l.log_date >= daysAgo(6));
  const prev7 = logs.filter((l) => l.log_date >= daysAgo(13) && l.log_date < daysAgo(6));
  const score = wellness(last7);
  const prevScore = wellness(prev7);
  const delta = score !== null && prevScore !== null ? score - prevScore : null;

  const avg = (key: 'sleep_hours' | 'water_glasses') => {
    const vals = logs.map((l) => l[key]).filter((v): v is number => v !== null);
    return vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : null;
  };
  const sleepAvg = avg('sleep_hours');
  const waterAvg = avg('water_glasses');
  const recent = [...logs].reverse().slice(0, 5);
  const month = u(MONTHS[new Date().getMonth()]);

  const shareSummary = async () => {
    const lines = [
      `${u('Resumen Metztli')} · ${month} ${new Date().getFullYear()}${name ? ` · ${name}` : ''}`,
      u('Días con registro (últimos 30 días): {{n}}', { n: logs.length }),
      sleepAvg !== null ? u('Sueño promedio: {{n}} h', { n: sleepAvg.toFixed(1) }) : null,
      waterAvg !== null ? u('Hidratación promedio: {{n}} de 8 vasos', { n: waterAvg.toFixed(1) }) : null,
      score !== null ? u('Índice de bienestar (7 días): {{n}}%', { n: score }) : null,
    ].filter(Boolean);
    try {
      await Share.share({ message: lines.join('\n') });
    } catch (e) {
      console.warn('No se pudo compartir el resumen', e);
    }
  };

  const toggleBackup = async (enable: boolean) => {
    if (backupBusy) return;
    if (enable) {
      const { data } = await supabase.auth.getSession();
      if (!data.session) {
        Alert.alert(u('Inicia sesión para respaldar'), u('Necesitas una cuenta para guardar un respaldo. Inicia sesión y vuelve a activarlo.'));
        return;
      }
      setBackupBusy(true);
      try {
        await setCloudBackupEnabled(true);
        setBackup(true);
        const res = await pushHealthBackup();
        Alert.alert(u('Respaldo guardado'), u('Se respaldaron {{logs}} registros y {{cycles}} ciclos.', { logs: res?.logs ?? 0, cycles: res?.cycles ?? 0 }) + (res?.pregnancies ? ' ' + u('Y {{n}} embarazo(s) con sus controles.', { n: res.pregnancies }) : ''));
      } catch (e: any) {
        await setCloudBackupEnabled(false);
        setBackup(false);
        Alert.alert(u('No se pudo respaldar'), e?.message ?? '');
      } finally {
        setBackupBusy(false);
      }
      return;
    }
    await setCloudBackupEnabled(false);
    setBackup(false);
    Alert.alert(u('Respaldo desactivado'), u('¿Quieres borrar también lo que ya está guardado en la nube?'), [
      { text: u('Solo desactivar'), style: 'cancel' },
      {
        text: u('Borrar respaldo'),
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteHealthBackup();
            Alert.alert(u('Respaldo borrado'), u('Tu respaldo en la nube se eliminó.'));
          } catch (e: any) {
            Alert.alert(u('No se pudo respaldar'), e?.message ?? '');
          }
        },
      },
    ]);
  };

  const logout = () => {
    Alert.alert(u('Cerrar sesión'), u('¿Quieres salir de tu cuenta? Tus datos guardados en este teléfono se mantienen.'), [
      { text: u('Cancelar'), style: 'cancel' },
      {
        text: u('Salir'),
        style: 'destructive',
        onPress: async () => {
          try {
            await supabase.auth.signOut();
          } finally {
            navigation.reset({ index: 0, routes: [{ name: 'Welcome' }] });
          }
        },
      },
    ]);
  };

  const Row = ({ icon, label, onPress }: { icon: React.ReactNode; label: string; onPress: () => void }) => (
    <TouchableOpacity style={styles.row} onPress={onPress} accessibilityRole="button" accessibilityLabel={label}>
      <View style={styles.rowIcon}>{icon}</View>
      <Text style={styles.rowLabel}>{label}</Text>
      <ChevronRight size={18} color={colors.mutedSoft} />
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>
        <CurvedHeader
          title={name ? u('Hola, {{name}}', { name }) : u('Mi perfil')}
          subtitle={u('Tu viaje completo en Metztli')}
          right={
            <TouchableOpacity style={styles.share} onPress={shareSummary} accessibilityRole="button" accessibilityLabel={u('Compartir resumen')}>
              <Share2 size={14} color={colors.carmin} />
              <Text style={styles.shareText}>{u('Compartir')}</Text>
            </TouchableOpacity>
          }
        />

        <View style={styles.body}>
          <SectionTitle>{u('Mi etapa')}</SectionTitle>
          <StageSwitcher tone="dark" />

          {signedIn && (
            <View style={styles.roleBadge} accessibilityLabel={u('Tu rol: {{role}}', { role: u(ROLE_LABELS[role]) })}>
              <Text style={styles.roleBadgeText}>{u('Tu rol: {{role}}', { role: u(ROLE_LABELS[role]) })}</Text>
            </View>
          )}

          <SectionTitle>{u('Resumen')} · {month}</SectionTitle>
          <View style={styles.stats}>
            <Stat value={String(logs.length)} label={u('Días registrados')} />
            <Stat value={sleepAvg !== null ? sleepAvg.toFixed(1) : '—'} label={u('Horas de sueño (prom.)')} />
            <Stat value={String(logs.filter((l) => l.mood !== null).length)} label={u('Registros de ánimo')} />
            <Stat value={waterAvg !== null ? waterAvg.toFixed(1) : '—'} label={u('Vasos de agua (prom.)')} />
          </View>

          <View style={styles.index}>
            <Text style={styles.indexEyebrow}>{u('ÍNDICE DE BIENESTAR · ÚLTIMOS 7 DÍAS')}</Text>
            <Text style={styles.indexValue}>{score !== null ? `${score}%` : u('Sin datos')}</Text>
            <Text style={styles.indexNote}>
              {score === null
                ? u('Guarda tu registro en Cuerpo y Mente para ver tu índice.')
                : delta === null
                ? u('Basado en sueño, hidratación, movimiento y ánimo.')
                : `${delta >= 0 ? '▲ +' : '▼ '}${delta} ${u('puntos vs. semana anterior')}`}
            </Text>
          </View>

          <SectionTitle>{u('Actividad reciente')}</SectionTitle>
          {recent.length === 0 ? (
            <Text style={styles.muted}>{u('Aún no tienes registros. Usa el botón + para empezar.')}</Text>
          ) : (
            recent.map((l) => {
              const d = describe(l, u);
              return (
                <Card key={l.log_date} style={{ gap: 2 }}>
                  <Text style={styles.activityTag}>{u(d.tag)} · {l.log_date}</Text>
                  <Text style={styles.rowLabel}>{u(d.title)}</Text>
                  <Text style={styles.muted}>{d.detail}</Text>
                </Card>
              );
            })
          )}

          <SectionTitle>{u('Mi espacio')}</SectionTitle>
          <Card style={{ padding: 4 }}>
            <Row icon={<Users size={18} color={colors.carmin} />} label={u('Tribu comunitaria (foro anónimo)')} onPress={() => navigation.navigate('Foro')} />
            {role === 'admin' && (
              <Row icon={<ShieldCheck size={18} color={colors.carmin} />} label={u('Panel de administración')} onPress={() => navigation.navigate('AdminPanel')} />
            )}
            {isStaff && (
              <Row icon={<ClipboardCheck size={18} color={colors.carmin} />} label={u('Panel de auditoría')} onPress={() => navigation.navigate('AuditPanel')} />
            )}
            <Row icon={<PhoneCall size={18} color={colors.carmin} />} label={u('Directorio de emergencias')} onPress={() => navigation.navigate('Directorio')} />
            <Row icon={<CalendarDays size={18} color={colors.carmin} />} label={u('Calendario completo')} onPress={() => navigation.navigate('BrujulaLunar')} />
            {mode === 'pregnancy' && (
              <Row icon={<Baby size={18} color={colors.carmin} />} label={u('Triage y auxilio por SMS')} onPress={() => navigation.navigate('Embarazo')} />
            )}
            <Row icon={<HeartHandshake size={18} color={colors.carmin} />} label={u('Mi código de acompañante')} onPress={() => navigation.navigate('TribuCode')} />
            <Row icon={<Users size={18} color={colors.carmin} />} label={u('Ver como acompañante')} onPress={() => navigation.navigate('PartnerMain')} />
          </Card>

          <Card style={styles.backupCard}>
            <View style={{ flex: 1, gap: 2 }}>
              <Text style={styles.rowLabel}>{u('Respaldar mis datos en la nube')}</Text>
              <Text style={styles.muted}>{u('Guarda tus registros de ciclo, sueño y ánimo en tu cuenta. Solo tú puedes verlos. Es opcional.')}</Text>
            </View>
            <Switch
              value={backup}
              onValueChange={toggleBackup}
              disabled={backupBusy}
              trackColor={{ true: colors.carmin, false: colors.disabled }}
              accessibilityLabel={u('Respaldar mis datos en la nube')}
            />
          </Card>

          <View style={styles.language}>
            <Text style={styles.rowLabel}>{u('Idioma')}</Text>
            <LanguageSwitcher />
          </View>

          <TouchableOpacity style={styles.logout} onPress={logout} accessibilityRole="button">
            <LogOut size={16} color={colors.carmin} />
            <Text style={styles.logoutText}>{u('Cerrar sesión')}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <Card style={styles.stat}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </Card>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.avena },
  body: { padding: 16, gap: 14 },
  muted: { fontFamily: fonts.regular, fontSize: 11, color: colors.muted },
  share: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.avena,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radius.pill,
  },
  shareText: { fontFamily: fonts.semibold, fontSize: 11, color: colors.carmin },
  roleBadge: { alignSelf: 'flex-start', backgroundColor: colors.bosque, borderRadius: radius.pill, paddingHorizontal: 12, paddingVertical: 6 },
  roleBadgeText: { fontFamily: fonts.semibold, fontSize: 11, color: colors.white },
  stageRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  stats: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  stat: { width: '47.5%', alignItems: 'center', gap: 2, paddingVertical: 14 },
  statValue: { fontFamily: fonts.display, fontSize: 26, color: colors.carmin },
  statLabel: { fontFamily: fonts.regular, fontSize: 10, color: colors.muted, textAlign: 'center' },
  index: { backgroundColor: colors.bosque, borderRadius: radius.lg, padding: 18, gap: 4 },
  indexEyebrow: { fontFamily: fonts.semibold, fontSize: 9, letterSpacing: 1.2, color: 'rgba(244,241,234,0.7)' },
  indexValue: { fontFamily: fonts.display, fontSize: 32, color: colors.white },
  indexNote: { fontFamily: fonts.regular, fontSize: 11, color: 'rgba(244,241,234,0.85)' },
  activityTag: { fontFamily: fonts.semibold, fontSize: 9, letterSpacing: 0.8, color: colors.carmin },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12 },
  rowIcon: { width: 36, height: 36, borderRadius: radius.sm, backgroundColor: colors.blush, alignItems: 'center', justifyContent: 'center' },
  rowLabel: { flex: 1, fontFamily: fonts.semibold, fontSize: 13, color: colors.carbon },
  backupCard: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  language: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 4 },
  logout: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, padding: 14 },
  logoutText: { fontFamily: fonts.semibold, fontSize: 13, color: colors.carmin },
});
