// ─────────────────────────────────────────────────────────
// Metztli — Pantalla del contador de pataditas
// ─────────────────────────────────────────────────────────

import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { Clock } from 'lucide-react-native';
import KickCounter from '@/components/KickCounter';
import { Card, CurvedHeader, SectionTitle } from '@/components/ui';
import { KickCounterLog } from '@/types';
import { getTodayKickSessions, addKickSession } from '@/db/database';
import { colors, fonts } from '@/theme';
import { useUi } from '@/i18n/ui';

export default function KickCounterScreen() {
  const navigation = useNavigation<any>();
  const { t } = useTranslation();
  const u = useUi();
  const [sessions, setSessions] = React.useState<KickCounterLog[]>([]);

  const loadSessions = React.useCallback(async () => {
    setSessions(await getTodayKickSessions());
  }, []);

  React.useEffect(() => {
    loadSessions();
  }, [loadSessions]);

  const handleSessionComplete = async (count: number, duration: number) => {
    await addKickSession(new Date().toISOString(), count, duration);
    await loadSessions();
  };

  const total = sessions.reduce((sum, s) => sum + s.kick_count, 0);

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 60 }}>
        <CurvedHeader title={t('kicks.title')} onBack={() => navigation.goBack()} />

        <View style={styles.body}>
          <Text style={styles.description}>
            {u('Contar las pataditas es una forma de monitorear el bienestar de tu bebé. Siéntate o recuéstate de lado en un lugar tranquilo.')}
          </Text>

          <KickCounter onSessionComplete={handleSessionComplete} />

          <SectionTitle>{u('Registros de hoy')}</SectionTitle>
          {sessions.length === 0 ? (
            <Text style={styles.empty}>{t('kicks.no_sessions')}</Text>
          ) : (
            <>
              <Text style={styles.total}>
                {sessions.length === 1
                  ? u('Hoy: {{n}} pataditas en 1 sesión', { n: total })
                  : u('Hoy: {{n}} pataditas en {{s}} sesiones', { n: total, s: sessions.length })}
              </Text>
              {sessions.map((s, index) => (
                <Card key={s.id || index} style={styles.session}>
                  <View style={styles.time}>
                    <Clock size={16} color={colors.mutedSoft} />
                    <Text style={styles.timeText}>
                      {new Date(s.session_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </Text>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={styles.kicks}>{u('{{n}} pataditas', { n: s.kick_count })}</Text>
                    <Text style={styles.duration}>{u('en {{n}} min', { n: s.duration_minutes })}</Text>
                  </View>
                </Card>
              ))}
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
  description: { fontFamily: fonts.regular, fontSize: 14, lineHeight: 21, color: colors.muted },
  empty: { fontFamily: fonts.regular, fontSize: 13, color: colors.mutedSoft, textAlign: 'center', paddingVertical: 12 },
  total: { fontFamily: fonts.semibold, fontSize: 13, color: colors.bosque },
  session: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  time: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  timeText: { fontFamily: fonts.medium, fontSize: 13, color: colors.muted },
  kicks: { fontFamily: fonts.bold, fontSize: 15, color: colors.carmin },
  duration: { fontFamily: fonts.regular, fontSize: 12, color: colors.mutedSoft },
});
