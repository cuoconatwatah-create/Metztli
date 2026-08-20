// ─────────────────────────────────────────────────────────
// Metztli 2.0 — Language Selection Screen (Onboarding)
// ─────────────────────────────────────────────────────────

import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, Image } from 'react-native';
import { useTranslation } from 'react-i18next';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import GlassCard from '@/components/GlassCard';

type RootStackParamList = {
  LanguageSelection: undefined;
  Welcome: undefined;
  MainTabs: undefined;
};

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'LanguageSelection'>;
};

type LanguageCode = 'es' | 'miskitu' | 'creole';

export default function LanguageSelectionScreen({ navigation }: Props) {
  const { t, i18n } = useTranslation();
  const [selectedLang, setSelectedLang] = useState<LanguageCode>(
    (i18n.language as LanguageCode) || 'es'
  );

  const languages: { code: LanguageCode; name: string }[] = [
    { code: 'es', name: 'Español' },
    { code: 'miskitu', name: 'Mískitu' },
    { code: 'creole', name: 'Creole' }
  ];

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
      <View style={styles.container}>
        <View style={styles.header}>
          {/* Logo Placeholder */}
          <View style={styles.logoPlaceholder}>
             <Text style={styles.logoText}>M</Text>
          </View>
          <Text style={styles.appName}>{t('app.name')}</Text>
          <Text style={styles.tagline}>{t('app.tagline')}</Text>
        </View>

        <GlassCard variant="default" className="mt-8">
          <Text style={styles.title}>{t('language.title')}</Text>
          <Text style={styles.subtitle}>{t('language.subtitle')}</Text>

          <View style={styles.optionsContainer}>
            {languages.map((lang) => {
              const isActive = selectedLang === lang.code;
              return (
                <TouchableOpacity
                  key={lang.code}
                  style={[styles.option, isActive && styles.optionActive]}
                  onPress={() => handleSelect(lang.code)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.optionText, isActive && styles.optionTextActive]}>
                    {lang.name}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <TouchableOpacity 
            style={styles.continueButton} 
            onPress={handleContinue}
            activeOpacity={0.8}
          >
            <Text style={styles.continueButtonText}>{t('common.continue')}</Text>
          </TouchableOpacity>
        </GlassCard>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F4F1EA',
  },
  container: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  logoPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#8B2635',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#8B2635',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  logoText: {
    fontSize: 40,
    fontWeight: '800',
    color: '#F4F1EA',
  },
  appName: {
    fontSize: 32,
    fontWeight: '800',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  tagline: {
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
    textAlign: 'center',
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 24,
    textAlign: 'center',
  },
  optionsContainer: {
    gap: 12,
    marginBottom: 32,
  },
  option: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
    borderWidth: 1,
    borderColor: 'rgba(44, 61, 48, 0.1)',
  },
  optionActive: {
    backgroundColor: 'rgba(139, 38, 53, 0.1)',
    borderColor: 'rgba(139, 38, 53, 0.4)',
  },
  optionText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1A1A',
    textAlign: 'center',
  },
  optionTextActive: {
    color: '#8B2635',
    fontWeight: '800',
  },
  continueButton: {
    backgroundColor: '#2C3D30',
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#2C3D30',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  continueButtonText: {
    color: '#F4F1EA',
    fontSize: 18,
    fontWeight: '700',
  }
});
