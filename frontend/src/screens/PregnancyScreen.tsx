// ─────────────────────────────────────────────────────────
// Metztli 2.0 — Pregnancy Screen (Detailed Weekly View)
// ─────────────────────────────────────────────────────────

import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, TextInput } from 'react-native';
import { useTranslation } from 'react-i18next';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Calendar as CalendarIcon, CheckCircle2 } from 'lucide-react-native';
import { usePregnancyCalculator } from '@/hooks/usePregnancyCalculator';
import { updateLMPDate } from '@/db/database';
import GlassCard from '@/components/GlassCard';
import PregnancyTracker from '@/components/PregnancyTracker';

export default function PregnancyScreen() {
  const { t } = useTranslation();
  const { calculation, calculateManualLMP } = usePregnancyCalculator();
  const [lmpInput, setLmpInput] = useState('');
  const [isEditing, setIsEditing] = useState(false);

  const handleSaveLMP = async () => {
    // Basic validation YYYY-MM-DD
    const regex = /^\d{4}-\d{2}-\d{2}$/;
    if (regex.test(lmpInput)) {
      await updateLMPDate(lmpInput);
      calculateManualLMP(lmpInput);
      setIsEditing(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        
        <View style={styles.header}>
          <Text style={styles.headerTitle}>{t('pregnancy.title')}</Text>
        </View>

        {(!calculation || isEditing) ? (
          <GlassCard variant="default" className="mb-6">
            <View style={styles.setupHeader}>
              <CalendarIcon size={24} color="#8B2635" />
              <Text style={styles.setupTitle}>{t('pregnancy.setup_title')}</Text>
            </View>
            <Text style={styles.setupSubtitle}>{t('pregnancy.enter_lmp')}</Text>
            
            <TextInput
              style={styles.input}
              placeholder="2024-01-15"
              placeholderTextColor="#999"
              value={lmpInput}
              onChangeText={setLmpInput}
              keyboardType="numeric"
            />
            <TouchableOpacity style={styles.saveButton} onPress={handleSaveLMP}>
              <Text style={styles.saveButtonText}>{t('pregnancy.calculate')}</Text>
            </TouchableOpacity>
            {isEditing && (
              <TouchableOpacity onPress={() => setIsEditing(false)} style={styles.cancelBtn}>
                 <Text style={styles.cancelBtnText}>{t('common.cancel')}</Text>
              </TouchableOpacity>
            )}
          </GlassCard>
        ) : (
           <GlassCard variant="default">
              <View style={styles.dateInfoContainer}>
                <View>
                  <Text style={styles.dueDateLabel}>{t('pregnancy.due_date')}</Text>
                  <Text style={styles.dueDateText}>{calculation.dueDate}</Text>
                </View>
                <TouchableOpacity onPress={() => setIsEditing(true)} style={styles.editButton}>
                   <Text style={styles.editLink}>{t('pregnancy.edit_lmp')}</Text>
                </TouchableOpacity>
              </View>
           </GlassCard>
        )}

        {calculation && (
          <PregnancyTracker calculation={calculation} />
        )}

        {calculation?.weekData && (
          <GlassCard variant="bosque" className="mt-4">
             <View style={styles.setupHeader}>
                 <CheckCircle2 size={24} color="#2C3D30" />
                 <Text style={styles.setupTitle}>{t('pregnancy.weekly_tips')}</Text>
             </View>
             <Text style={styles.setupSubtitle}>{t(calculation.weekData.maternal_tips_key)}</Text>
          </GlassCard>
        )}

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F4F1EA',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#1A1A1A',
  },
  setupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  setupTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  setupSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
  },
  input: {
    width: '100%',
    height: 48,
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: 'rgba(44, 61, 48, 0.2)',
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    color: '#1A1A1A',
    marginBottom: 12,
  },
  saveButton: {
    backgroundColor: '#8B2635',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    width: '100%',
  },
  saveButtonText: {
    color: '#FFF',
    fontWeight: '700',
    fontSize: 16,
  },
  cancelBtn: {
     marginTop: 12,
     alignItems: 'center',
  },
  cancelBtnText: {
     color: '#666',
     fontWeight: '500',
  },
  dateInfoContainer: {
     flexDirection: 'row',
     justifyContent: 'space-between',
     alignItems: 'center',
  },
  dueDateLabel: {
     fontSize: 12,
     color: '#666',
     fontWeight: '500',
     marginBottom: 2,
  },
  dueDateText: {
     fontSize: 18,
     fontWeight: '700',
     color: '#2C3D30',
  },
  editButton: {
     backgroundColor: 'rgba(139, 38, 53, 0.08)',
     paddingHorizontal: 14,
     paddingVertical: 8,
     borderRadius: 8,
  },
  editLink: {
     fontSize: 14,
     color: '#8B2635',
     fontWeight: '600',
  }
});
