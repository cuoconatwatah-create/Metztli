// ─────────────────────────────────────────────────────────
// Metztli — Panel de el Auditor (solo lectura)
//   Estadísticas agregadas y bitácora de acciones del personal.
// Nunca muestra datos de salud de personas: solo conteos y quién hizo qué.
// ─────────────────────────────────────────────────────────

import React, { useCallback, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, SafeAreaView, ActivityIndicator, RefreshControl } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { ClipboardCheck, Lock } from 'lucide-react-native';
import { useRole } from '@/context/RoleContext';
import { ROLE_LABELS, fetchAuditLog, fetchAuditStats, isRole, type AuditEvent, type AuditStats } from '@/lib/roles';
import { Card, CurvedHeader, SectionTitle } from '@/components/ui';
import { colors, fonts, radius } from '@/theme';
import { useUi } from '@/i18n/ui';

function formatWhen(iso: string): string {
  const d = new Date(iso);
  const p = (n: number) => String(n).padStart(2, '0');
  return `${p(d.getDate())}/${p(d.getMonth() + 1)}/${d.getFullYear()} ${p(d.getHours())}:${p(d.getMinutes())}`;
}

function detailText(e: AuditEvent): string {
  const d = e.details ?? {};
  return Object.entries(d)
    .filter(([, v]) => v !== null && v !== undefined && v !== '')
    .map(([k, v]) => `${k}: ${String(v)}`)
    .join(' · ');
}

export default function AuditPanelScreen() {
  const u = useUi();
  const navigation = useNavigation<any>();
  const { role, isStaff, signedIn } = useRole();
  const [stats, setStats] = useState<AuditStats | null>(null);
  const [events, setEvents] = useState<AuditEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!isStaff) return;
    setLoading(true);
    setError(null);
    try {
      const [s, log] = await Promise.all([fetchAuditStats(), fetchAuditLog()]);
      setStats(s);
      setEvents(log);
    } catch (e: any) {
      setError(e?.message ?? String(e));
    } finally {
      setLoading(false);
    }
  }, [isStaff]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  if (!isStaff) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <CurvedHeader title={u('Panel de auditoría')} tone="bosque" onBack={() => navigation.goBack()} />
        <View style={styles.locked}>
          <Lock size={32} color={colors.mutedSoft} />
          <Text style={styles.lockedTitle}>{u('Acceso restringido')}</Text>
          <Text style={styles.muted}>
            {signedIn
              ? u('Tu cuenta no tiene el rol de auditor.')
              : u('Inicia sesión con una cuenta de auditor para entrar.')}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const cards: { label: string; value: number | string }[] = stats
    ? [
        { label: u('Cuentas'), value: stats.users_total },
        { label: u('Publicaciones del foro'), value: stats.forum_posts },
        { label: u('Mitos publicados'), value: stats.myths },
        { label: u('Registros diarios (total)'), value: stats.daily_logs },
        { label: u('Embarazos activos'), value: stats.pregnancies_active },
        { label: u('Eventos de auditoría'), value: stats.audit_events },
      ]
    : [];

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 60 }}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={load} tintColor={colors.bosque} />}
      >
        <CurvedHeader
          title={u('Panel de auditoría')}
          subtitle={role === 'admin' ? u('Vista de solo lectura') : u('Solo lectura')}
          tone="bosque"
          onBack={() => navigation.goBack()}
          right={<ClipboardCheck size={22} color={colors.white} />}
        />

        <View style={styles.body}>
          <Text style={styles.privacy}>
            {u('Solo se muestran conteos y acciones del personal. Nunca datos de salud de una persona.')}
          </Text>
          {loading && !stats && <ActivityIndicator color={colors.bosque} />}
          {error && <Text style={styles.error}>{error}</Text>}

          {stats && (
            <>
              <View style={styles.grid}>
                {cards.map((c) => (
                  <Card key={c.label} style={styles.stat}>
                    <Text style={styles.statValue}>{c.value}</Text>
                    <Text style={styles.statLabel}>{c.label}</Text>
                  </Card>
                ))}
              </View>
              <Card style={{ gap: 6 }}>
                <Text style={styles.title}>{u('Cuentas por rol')}</Text>
                {(Object.entries(stats.by_role) as [string, number][]).map(([r, n]) => (
                  <View key={r} style={styles.roleRow}>
                    <Text style={styles.muted}>{isRole(r) ? u(ROLE_LABELS[r]) : r}</Text>
                    <Text style={styles.title}>{n}</Text>
                  </View>
                ))}
              </Card>
            </>
          )}

          <SectionTitle>{u('Bitácora (últimas 50 acciones)')}</SectionTitle>
          {events.length === 0 && !loading && !error && <Text style={styles.muted}>{u('Aún no hay acciones registradas.')}</Text>}
          {events.map((e) => (
            <Card key={e.id} style={{ gap: 4 }}>
              <View style={styles.eventHead}>
                <Text style={styles.event}>
                  {e.action} · {e.target_table}
                </Text>
                <Text style={styles.when}>{formatWhen(e.created_at)}</Text>
              </View>
              <Text style={styles.muted}>
                {u('Quién')}: {e.actor_role ? (isRole(e.actor_role) ? u(ROLE_LABELS[e.actor_role]) : e.actor_role) : u('sistema')}
                {e.actor_id ? ` (${e.actor_id.slice(0, 8)}…)` : ''}
              </Text>
              {detailText(e) ? <Text style={styles.detail}>{detailText(e)}</Text> : null}
            </Card>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.avena },
  body: { padding: 16, gap: 12 },
  privacy: { fontFamily: fonts.regular, fontSize: 11, color: colors.mutedSoft, lineHeight: 16 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  stat: { width: '47.5%', alignItems: 'center', gap: 2, paddingVertical: 14 },
  statValue: { fontFamily: fonts.display, fontSize: 26, color: colors.bosque },
  statLabel: { fontFamily: fonts.regular, fontSize: 10, color: colors.muted, textAlign: 'center' },
  title: { fontFamily: fonts.bold, fontSize: 14, color: colors.carbon },
  muted: { fontFamily: fonts.regular, fontSize: 12, color: colors.muted },
  roleRow: { flexDirection: 'row', justifyContent: 'space-between' },
  eventHead: { flexDirection: 'row', justifyContent: 'space-between', gap: 8 },
  event: { fontFamily: fonts.bold, fontSize: 12, color: colors.carmin, flex: 1 },
  when: { fontFamily: fonts.regular, fontSize: 10, color: colors.mutedSoft },
  detail: {
    fontFamily: fonts.regular,
    fontSize: 11,
    color: colors.muted,
    backgroundColor: colors.avena,
    borderRadius: radius.sm,
    padding: 8,
  },
  error: { fontFamily: fonts.semibold, fontSize: 12, color: colors.carmin },
  locked: { alignItems: 'center', gap: 10, padding: 32, marginTop: 24 },
  lockedTitle: { fontFamily: fonts.display, fontSize: 20, color: colors.carbon },
});
