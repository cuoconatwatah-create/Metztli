// ─────────────────────────────────────────────────────────
// Metztli 2.0 — Home Screen (Dynamic Dashboard)
// ─────────────────────────────────────────────────────────

import React, { useState, useEffect } from 'react';
import { View, ScrollView, StyleSheet, SafeAreaView } from 'react-native';
import { useTranslation } from 'react-i18next';
import { getUserProfile, updateUserMode, addDailyLog, getDailyLog } from '@/db/database';
import { useCycleCalculator } from '@/hooks/useCycleCalculator';
import { usePregnancyCalculator } from '@/hooks/usePregnancyCalculator';
import type { LifeStageMode } from '@/types';

import ModeSwitcher from '@/components/ModeSwitcher';
import CycleWheel from '@/components/CycleWheel';
import PregnancyTracker from '@/components/PregnancyTracker';
import KickCounter from '@/components/KickCounter';
import SymptomGrid from '@/components/SymptomGrid';
import MascotCompanion from '@/components/MascotCompanion';
import AlarmCard from '@/components/AlarmCard';

export default function HomeScreen() {
  const { t } = useTranslation();
  const [currentMode, setCurrentMode] = useState<LifeStageMode>('cycle');
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);
  
  const { calculation: cycleCalc } = useCycleCalculator();
  const { calculation: pregCalc } = usePregnancyCalculator();

  // Load user profile on mount
  useEffect(() => {
    const loadProfile = async () => {
      const profile = await getUserProfile();
      if (profile) {
        setCurrentMode(profile.current_mode);
      }
      
      // Load today's symptoms if they exist
      const today = new Date().toISOString().split('T')[0];
      const todayLog = await getDailyLog(today);
      if (todayLog && todayLog.symptoms_json) {
        setSelectedSymptoms(todayLog.symptoms_json);
      }
    };
    loadProfile();
  }, []);

  const handleModeChange = async (mode: LifeStageMode) => {
    setCurrentMode(mode);
    setSelectedSymptoms([]); // Clear symptoms when mode changes
    await updateUserMode(mode);
  };

  const handleToggleSymptom = async (symptomId: string) => {
    const newSymptoms = selectedSymptoms.includes(symptomId)
      ? selectedSymptoms.filter(id => id !== symptomId)
      : [...selectedSymptoms, symptomId];
    
    setSelectedSymptoms(newSymptoms);

    // Auto-save log
    const today = new Date().toISOString().split('T')[0];
    await addDailyLog({
      log_date: today,
      mode: currentMode,
      flow_level: null,
      pain_level: null,
      pregnancy_symptoms: null,
      mood: null,
      symptoms_json: newSymptoms,
      notes: null,
    });
  };

  const renderDashboard = () => {
    switch (currentMode) {
      case 'pregnancy':
        return (
          <>
            <PregnancyTracker calculation={pregCalc} />
            <AlarmCard />
            <KickCounter onSessionComplete={(count, dur) => console.log('Saved kicks', count)} />
            <MascotCompanion stage="pregnancy" weekNumber={pregCalc?.gestationalWeeks} />
          </>
        );
      case 'menopause':
        return (
          <>
             {/* Menopause specific cards will go here */}
             <MascotCompanion stage="menopause" />
          </>
        );
      case 'cycle':
      default:
        return (
          <>
            <CycleWheel calculation={cycleCalc} />
            <MascotCompanion stage="cycle" />
          </>
        );
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        <ModeSwitcher currentMode={currentMode} onModeChange={handleModeChange} />
        
        <View style={styles.divider} />

        {renderDashboard()}

        <View style={styles.symptomContainer}>
          <SymptomGrid 
            mode={currentMode} 
            selectedSymptoms={selectedSymptoms}
            onToggleSymptom={handleToggleSymptom} 
          />
        </View>

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
    gap: 16,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(44, 61, 48, 0.1)',
    marginVertical: 4,
  },
  symptomContainer: {
    marginTop: 8,
  }
});
