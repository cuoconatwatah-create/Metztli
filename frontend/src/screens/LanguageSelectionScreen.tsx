// ─────────────────────────────────────────────────────────
// Metztli — Selección de idioma (primera pantalla)
// ─────────────────────────────────────────────────────────

import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, ScrollView, useWindowDimensions } from 'react-native';
import { useTranslation } from 'react-i18next';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Logo from '@/components/Logo';
import { Button, StepDots } from '@/components/ui';
import { colors, fonts, radius, shadow } from '@/theme';

type RootStackParamList = {
  LanguageSelection: undefined;
  Welcome: undefined;
  MainTabs: undefined;
};

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'LanguageSelection'>;
};

type LanguageCode = 'es' | 'miskitu' | 'creole';

const LANGUAGES: { code: LanguageCode; name: string }[] = [
  { code: 'es', name: 'Español' },
  { code: 'miskitu', name: 'Mískitu' },
  { code: 'creole', name: 'Creole' },
];

export default function LanguageSelectionScreen({ navigation }: Props) {
  const { t, i18n } = useTranslation();
  const { width, height } = useWindowDimensions();
  const [selectedLang, setSelectedLang] = useState<LanguageCode>(
    (i18n.language as LanguageCode) || 'es'
  );

  // El emblema se ajusta a la pantalla (teléfonos pequeños y ventanas bajas).
  const logoSize = Math.round(Math.min(150, Math.max(90, Math.min(width * 0.45, height * 0.2))));

  const handleSelect = (code: LanguageCode) => {
    setSelectedLang(code);
    i18n.changeLanguage(code);
  };

  const handleContinue = () => {
    navigation.reset({
      index: 0,
      routes: [{ name: 'Welcome' }],
    });
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Logo size={logoSize} />
          <Text style={styles.tagline}>{t('app.tagline')}</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.title}>{t('language.title')}</Text>
          <Text style={styles.subtitle}>{t('language.subtitle')}</Text>

          <View style={styles.options} accessibilityRole="radiogroup">
            {LANGUAGES.map((lang) => {
              const isActive = selectedLang === lang.code;
              return (
                <TouchableOpacity
                  key={lang.code}
                  style={[styles.option, isActive && styles.optionActive]}
                  onPress={() => handleSelect(lang.code)}
                  activeOpacity={0.8}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: isActive }}
                  accessibilityLabel={lang.name}
                >
                  <Text style={[styles.optionText, isActive && styles.optionTextActive]}>
                    {lang.name}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <Button label={t('common.continue')} onPress={handleContinue} />
        </View>

        <StepDots total={5} active={0} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.avena },
  container: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 24,
    gap: 24,
  },
  header: { alignItems: 'center', gap: 10 },
  tagline: {
    fontFamily: fonts.italic,
    fontStyle: 'italic',
    fontSize: 15,
    color: colors.carmin,
    textAlign: 'center',
  },
  card: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.line,
    padding: 20,
    gap: 14,
    ...shadow.card,
  },
  title: {
    fontFamily: fonts.display,
    fontSize: 22,
    color: colors.carmin,
    textAlign: 'center',
  },
  subtitle: {
    fontFamily: fonts.regular,
    fontSize: 13,
    color: colors.muted,
    textAlign: 'center',
    marginBottom: 4,
  },
  options: { gap: 10, marginBottom: 6 },
  option: {
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: radius.pill,
    backgroundColor: colors.avena,
    borderWidth: 1,
    borderColor: colors.line,
  },
  optionActive: {
    backgroundColor: colors.blush,
    borderColor: colors.carmin,
  },
  optionText: {
    fontFamily: fonts.semibold,
    fontSize: 16,
    color: colors.carbon,
    textAlign: 'center',
  },
  optionTextActive: {
    fontFamily: fonts.bold,
    color: colors.carmin,
  },
});
