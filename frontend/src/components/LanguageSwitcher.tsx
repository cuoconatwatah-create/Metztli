// ─────────────────────────────────────────────────────────
// Metztli 2.0 — Language Switcher Component
// ─────────────────────────────────────────────────────────

import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal } from 'react-native';
import { Globe, X } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import GlassCard from './GlassCard';

type LanguageCode = 'es' | 'miskitu' | 'creole';

export default function LanguageSwitcher() {
  const { t, i18n } = useTranslation();
  const [modalVisible, setModalVisible] = useState(false);

  const currentLang = i18n.language as LanguageCode;

  const changeLanguage = (lang: LanguageCode) => {
    i18n.changeLanguage(lang);
    setModalVisible(false);
  };

  const langNames = {
    es: 'Español',
    miskitu: 'Mískitu',
    creole: 'Creole'
  };

  return (
    <>
      <TouchableOpacity 
        style={styles.button} 
        onPress={() => setModalVisible(true)}
        accessibilityRole="button"
        accessibilityLabel={t('language.title')}
      >
        <Globe size={20} color="#1A1A1A" strokeWidth={2} />
        <Text style={styles.buttonText}>{langNames[currentLang] || langNames.es}</Text>
      </TouchableOpacity>

      <Modal
        animationType="fade"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <GlassCard variant="default" className="w-4/5 max-w-sm">
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{t('language.title')}</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.closeBtn}>
                <X size={24} color="#1A1A1A" />
              </TouchableOpacity>
            </View>
            
            <Text style={styles.modalSubtitle}>{t('language.subtitle')}</Text>

            <View style={styles.optionsContainer}>
              {(Object.keys(langNames) as LanguageCode[]).map((lang) => {
                const isActive = currentLang === lang;
                return (
                  <TouchableOpacity
                    key={lang}
                    style={[styles.option, isActive && styles.optionActive]}
                    onPress={() => changeLanguage(lang)}
                  >
                    <Text style={[styles.optionText, isActive && styles.optionTextActive]}>
                      {langNames[lang]}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </GlassCard>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(244, 241, 234, 0.8)',
    borderWidth: 1,
    borderColor: 'rgba(44, 61, 48, 0.1)',
  },
  buttonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(26, 26, 26, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  closeBtn: {
    padding: 4,
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 20,
  },
  optionsContainer: {
    gap: 12,
  },
  option: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    borderWidth: 1,
    borderColor: 'rgba(44, 61, 48, 0.1)',
  },
  optionActive: {
    backgroundColor: 'rgba(139, 38, 53, 0.1)',
    borderColor: 'rgba(139, 38, 53, 0.3)',
  },
  optionText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1A1A1A',
    textAlign: 'center',
  },
  optionTextActive: {
    color: '#8B2635',
    fontWeight: '700',
  }
});
