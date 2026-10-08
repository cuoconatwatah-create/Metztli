// ─────────────────────────────────────────────────────────
// Metztli — Política de privacidad (lectura)
// ─────────────────────────────────────────────────────────

import React from 'react';
import { View, Text, ScrollView, StyleSheet, SafeAreaView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Card, CurvedHeader } from '@/components/ui';
import { PRIVACY_DATE, PRIVACY_INTRO, PRIVACY_SECTIONS, PRIVACY_VERSION } from '@/data/privacy';
import { colors, fonts } from '@/theme';
import { useUi } from '@/i18n/ui';

export default function PrivacyScreen() {
  const u = useUi();
  const navigation = useNavigation<any>();

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 60 }}>
        <CurvedHeader
          eyebrow={u('Versión {{v}} · {{date}}', { v: PRIVACY_VERSION, date: u(PRIVACY_DATE) })}
          title={u('Política de privacidad')}
          onBack={() => navigation.goBack()}
        />

        <View style={styles.body}>
          <Text style={styles.intro}>{u(PRIVACY_INTRO)}</Text>

          {PRIVACY_SECTIONS.map((section) => (
            <Card key={section.title} style={{ gap: 8 }}>
              <Text style={styles.sectionTitle}>{u(section.title)}</Text>
              {section.body.map((line) => (
                <View key={line} style={styles.row}>
                  <View style={styles.bullet} />
                  <Text style={styles.line}>{u(line)}</Text>
                </View>
              ))}
            </Card>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.avena },
  body: { padding: 16, gap: 14 },
  intro: { fontFamily: fonts.regular, fontSize: 13, lineHeight: 20, color: colors.muted },
  sectionTitle: { fontFamily: fonts.bold, fontSize: 15, color: colors.carmin },
  row: { flexDirection: 'row', gap: 10, alignItems: 'flex-start' },
  bullet: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.carmin, marginTop: 7 },
  line: { flex: 1, fontFamily: fonts.regular, fontSize: 13, lineHeight: 20, color: colors.carbon },
});
