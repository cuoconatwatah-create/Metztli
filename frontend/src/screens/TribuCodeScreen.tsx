// ─────────────────────────────────────────────────────────
// Metztli — Código de acompañante (onboarding 4 del prototipo)
// ─────────────────────────────────────────────────────────

import React, { useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, Share, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Share2, Copy } from 'lucide-react-native';
import { Button, BackLink, StepDots } from '@/components/ui';
import { colors, fonts, radius, shadow } from '@/theme';
import { useUi } from '@/i18n/ui';

export default function TribuCodeScreen() {
  const u = useUi();
  const navigation = useNavigation<any>();

  // Código de demostración: se genera una vez por apertura de la pantalla.
  const code = useMemo(() => 'METZ-' + Math.floor(100 + Math.random() * 900), []);

  const handleShare = async () => {
    try {
      await Share.share({
        message: u('¡Hola! Únete a mi red de apoyo en Metztli para acompañarme. Mi código es: {{code}}', { code }),
      });
    } catch (error) {
      console.warn('No se pudo compartir el código', error);
    }
  };

  const goToApp = () => navigation.reset({ index: 0, routes: [{ name: 'MainTabs' }] });

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <BackLink onPress={() => navigation.goBack()} />

        <Text style={styles.title}>
          {u('Tener vínculos afectivos sólidos está directamente relacionado con nuestro bienestar.')}
        </Text>

        <View style={styles.codeCard}>
          <Text style={styles.codeLabel}>{u('CÓDIGO DE ACOMPAÑANTE')}</Text>
          <View style={styles.codeBox}>
            <Text style={styles.codeText} accessibilityLabel={u('Código {{code}}', { code })}>{code}</Text>
            <TouchableOpacity style={styles.copy} onPress={handleShare} accessibilityLabel={u('Compartir código')}>
              <Copy size={18} color="rgba(244,241,234,0.6)" />
            </TouchableOpacity>
          </View>
        </View>

        <Text style={styles.helper}>
          {u('Comparte este código con tu acompañante para vincular su cuenta a la tuya.')}
        </Text>

        <View style={{ flex: 1 }} />

        <StepDots total={5} active={3} />
        <Button
          variant="dark"
          label={u('Compartir por WhatsApp')}
          icon={<Share2 size={18} color={colors.white} />}
          onPress={handleShare}
        />
        <TouchableOpacity style={styles.skip} onPress={goToApp} accessibilityRole="button">
          <Text style={styles.skipText}>{u('SALTAR ESTE PASO POR AHORA')}</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.avena },
  container: { flexGrow: 1, paddingHorizontal: 24, paddingTop: 20, paddingBottom: 24, gap: 20 },
  title: { fontFamily: fonts.display, fontSize: 24, lineHeight: 30, color: colors.carbon },
  codeCard: {
    backgroundColor: colors.bosque,
    borderRadius: radius.xl,
    padding: 22,
    gap: 14,
    ...shadow.card,
  },
  codeLabel: { fontFamily: fonts.medium, fontSize: 12, letterSpacing: 1.5, color: 'rgba(244,241,234,0.75)' },
  codeBox: {
    backgroundColor: 'rgba(244,241,234,0.12)',
    borderRadius: radius.lg,
    paddingVertical: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  codeText: { fontFamily: fonts.display, fontSize: 32, letterSpacing: 2, color: colors.avena },
  copy: { position: 'absolute', right: 14, bottom: 12 },
  helper: { fontFamily: fonts.regular, fontSize: 13, color: colors.muted, textAlign: 'center', lineHeight: 19 },
  skip: { alignItems: 'center', padding: 8 },
  skipText: { fontFamily: fonts.semibold, fontSize: 11, letterSpacing: 1, color: colors.mutedSoft },
});
