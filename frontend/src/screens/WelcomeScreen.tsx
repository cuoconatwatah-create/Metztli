// ─────────────────────────────────────────────────────────
// Metztli — Bienvenida (onboarding 1 del prototipo)
// ─────────────────────────────────────────────────────────

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, ScrollView, useWindowDimensions } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useUi } from '@/i18n/ui';
import Logo from '@/components/Logo';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import { Button, StepDots } from '@/components/ui';
import { colors, fonts } from '@/theme';

export default function WelcomeScreen() {
  const navigation = useNavigation<any>();
  const u = useUi();
  const { width, height } = useWindowDimensions();

  // El emblema y el título se ajustan al tamaño de la pantalla (teléfonos pequeños y ventanas bajas).
  const logoSize = Math.round(Math.min(170, Math.max(100, Math.min(width * 0.5, height * 0.22))));
  const compact = width < 360 || height < 640;

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Degradado inferior decorativo */}
      <View style={[styles.fade, { pointerEvents: 'none' }]}>
        {Array.from({ length: 16 }).map((_, i) => (
          <View key={i} style={{ flex: 1, backgroundColor: `rgba(139, 38, 53, ${(0.012 + i * 0.012).toFixed(3)})` }} />
        ))}
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.langRow}>
          <LanguageSwitcher />
        </View>

        <View style={styles.container}>
          <Logo size={logoSize} />

          <Text style={[styles.title, compact && styles.titleCompact]}>{u('Te damos la bienvenida a Metztli')}</Text>
          <Text style={styles.tagline}>{u('Salud y bienestar, versión tú')}</Text>

          <StepDots total={5} active={0} />

          <View style={styles.actions}>
            <Button
              label={u('COMENZAR (Usuario)')}
              onPress={() => navigation.navigate('Auth')}
            />
            <Button
              variant="outline"
              label={u('ACOMPAÑANTE')}
              onPress={() => navigation.navigate('PartnerDashboard')}
            />
          </View>
        </View>

        <TouchableOpacity
          style={styles.footer}
          onPress={() => navigation.navigate('Auth', { mode: 'login' })}
          accessibilityRole="button"
        >
          <Text style={styles.footerText}>
            {u('¿Ya tienes cuenta?')}{' '}
            <Text style={styles.footerLink}>{u('Iniciar sesión')}</Text>
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.avena },
  fade: { position: 'absolute', left: 0, right: 0, bottom: 0, height: 220 },
  scroll: { flexGrow: 1 },
  langRow: { alignItems: 'flex-end', paddingHorizontal: 20, paddingTop: 12 },
  container: { flexGrow: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 28, paddingVertical: 16, gap: 20 },
  title: {
    fontFamily: fonts.display,
    fontSize: 32,
    lineHeight: 38,
    color: colors.carmin,
    textAlign: 'center',
    marginTop: 12,
  },
  titleCompact: { fontSize: 26, lineHeight: 32 },
  tagline: { fontFamily: fonts.italic, fontStyle: 'italic', fontSize: 16, color: colors.carmin },
  actions: { width: '100%', gap: 12, marginTop: 8 },
  footer: { alignItems: 'center', paddingBottom: 28 },
  footerText: { fontFamily: fonts.regular, fontSize: 12, color: colors.carbon },
  footerLink: { fontFamily: fonts.bold },
});
