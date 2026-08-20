// ─────────────────────────────────────────────────────────
// Metztli 2.0 — Home Screen (Dynamic Dashboard & Menstruation Module)
// ─────────────────────────────────────────────────────────

import React, { useState, useEffect } from 'react';
import { View, ScrollView, StyleSheet, SafeAreaView, Alert, TouchableOpacity, Text } from 'react-native';
import { useTranslation } from 'react-i18next';
import { getUserProfile, updateUserMode, addDailyLog, getDailyLog } from '@/db/database';
import { useCycleCalculator } from '@/hooks/useCycleCalculator';
import { usePregnancyCalculator } from '@/hooks/usePregnancyCalculator';
import type { LifeStageMode } from '@/types';
import { useNavigation } from '@react-navigation/native';

import ModeSwitcher from '@/components/ModeSwitcher';
import PregnancyTracker from '@/components/PregnancyTracker';
import KickCounter from '@/components/KickCounter';
import MascotCompanion from '@/components/MascotCompanion';
import AlarmCard from '@/components/AlarmCard';

// Hackathon Menstruation Module Components
import LunarCompass from '@/components/LunarCompass';
import MindBodyTranslator from '@/components/MindBodyTranslator';
import GreenPharmacyModal from '@/components/GreenPharmacyModal';
import EducationalCarousel from '@/components/EducationalCarousel';
import HealthStar from '@/components/HealthStar';

export default function HomeScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation<any>();
  const [currentMode, setCurrentMode] = useState<LifeStageMode>('cycle');
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);
  const [showTranslator, setShowTranslator] = useState(false);
  const [showPharmacy, setShowPharmacy] = useState(false);
  const [isRetreatMode, setIsRetreatMode] = useState(false);
  
  const { calculation: cycleCalc } = useCycleCalculator();
  const { calculation: pregCalc } = usePregnancyCalculator();

  // Load user profile on mount
  useEffect(() => {
    const loadProfile = async () => {
      const profile = await getUserProfile();
      if (profile) {
        setCurrentMode(profile.current_mode);
      }
      
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
    setSelectedSymptoms([]); 
    setIsRetreatMode(false); // Reset retreat mode
    await updateUserMode(mode);
  };

  const handleToggleSymptom = (symptomId: string) => {
    setSelectedSymptoms(prev => 
      prev.includes(symptomId) ? prev.filter(id => id !== symptomId) : [...prev, symptomId]
    );
  };

  const handleSaveSymptoms = async () => {
    const today = new Date().toISOString().split('T')[0];
    await addDailyLog({
      log_date: today,
      mode: currentMode,
      flow_level: null,
      pain_level: null,
      pregnancy_symptoms: null,
      mood: null,
      symptoms_json: selectedSymptoms,
      notes: null,
    });
    setShowTranslator(false);
    setShowPharmacy(true); // Show recommendations
  };

  const handleToggleRetreatMode = () => {
    const newMode = !isRetreatMode;
    setIsRetreatMode(newMode);
    
    if (newMode) {
      // Mock the push notification to the partner
      Alert.alert(
        "Modo Retiro Activado",
        "La pantalla se ha oscurecido para tu descanso. Se ha enviado una notificación automática a tu Red de Apoyo (Familiar/Pareja):\n\n'Ana está en sus días de Sangre Sabia y su cuerpo hace un gran esfuerzo. Es un buen momento para que la apoyés con la cena y le des un espacio de descanso.'",
        [{ text: "Entendido" }]
      );
    }
  };

  const renderDashboard = () => {
    switch (currentMode) {
      case 'pregnancy':
        return (
          <View style={{ gap: 16 }}>
            {/* Mascot acts as the host */}
            <MascotCompanion stage="pregnancy" weekNumber={pregCalc?.gestationalWeeks} />

            {/* Global Progress Bar */}
            {pregCalc && (
              <View style={{ backgroundColor: '#FFFFFF', padding: 20, borderRadius: 16, elevation: 2 }}>
                <Text style={{ fontSize: 18, fontWeight: '700', color: '#1A1A1A', marginBottom: 12 }}>
                  {t('pregnancy.week', { week: pregCalc.gestationalWeeks })}
                </Text>
                <View style={{ height: 8, backgroundColor: 'rgba(44, 61, 48, 0.15)', borderRadius: 4, overflow: 'hidden' }}>
                  <View style={{ height: '100%', width: `${pregCalc.progressPercent}%`, backgroundColor: '#8B2635', borderRadius: 4 }} />
                </View>
                <Text style={{ textAlign: 'right', marginTop: 8, color: '#666', fontSize: 14 }}>
                  {t('pregnancy.days_remaining', { days: pregCalc.daysRemaining })}
                </Text>
              </View>
            )}

            {/* Hub Cards */}
            <TouchableOpacity 
              style={{ backgroundColor: '#FFFFFF', padding: 20, borderRadius: 16, flexDirection: 'row', alignItems: 'center', elevation: 2 }}
              onPress={() => navigation.navigate('PregnancyTimeline')}
            >
              <View style={{ backgroundColor: 'rgba(44, 61, 48, 0.1)', padding: 12, borderRadius: 12, marginRight: 16 }}>
                <Text style={{ fontSize: 24 }}>📅</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 18, fontWeight: '700', color: '#1A1A1A' }}>Desarrollo Semana a Semana</Text>
                <Text style={{ fontSize: 14, color: '#666', marginTop: 4 }}>Explora los cambios de tu bebé</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity 
              style={{ backgroundColor: '#FFFFFF', padding: 20, borderRadius: 16, flexDirection: 'row', alignItems: 'center', elevation: 2 }}
              onPress={() => navigation.navigate('KickCounter')}
            >
              <View style={{ backgroundColor: 'rgba(139, 38, 53, 0.1)', padding: 12, borderRadius: 12, marginRight: 16 }}>
                <Text style={{ fontSize: 24 }}>🦶</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 18, fontWeight: '700', color: '#1A1A1A' }}>Contador de Pataditas</Text>
                <Text style={{ fontSize: 14, color: '#666', marginTop: 4 }}>Monitorea la actividad de tu bebé</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity 
              style={{ backgroundColor: '#FFFFFF', padding: 20, borderRadius: 16, flexDirection: 'row', alignItems: 'center', elevation: 2 }}
              onPress={() => navigation.navigate('ObstetricAlarm')}
            >
              <View style={{ backgroundColor: 'rgba(139, 38, 53, 0.1)', padding: 12, borderRadius: 12, marginRight: 16 }}>
                <Text style={{ fontSize: 24 }}>🚨</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 18, fontWeight: '700', color: '#8B2635' }}>Señales de Alarma</Text>
                <Text style={{ fontSize: 14, color: '#666', marginTop: 4 }}>Qué hacer en una emergencia</Text>
              </View>
            </TouchableOpacity>

          </View>
        );
      case 'menopause':
        return (
          <>
             <MascotCompanion stage="menopause" />
          </>
        );
      case 'cycle':
      default:
        return (
          <View>
            <View style={{ marginBottom: 16 }}>
              <TouchableOpacity 
                style={{ backgroundColor: '#8B2635', padding: 16, borderRadius: 12, alignItems: 'center', marginBottom: 12 }}
                onPress={() => navigation.navigate('BrujulaLunar')}
              >
                <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 16 }}>Abrir Calendario Completo</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={{ backgroundColor: '#2C3D30', padding: 16, borderRadius: 12, alignItems: 'center' }}
                onPress={() => navigation.navigate('Desmitificador')}
              >
                <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 16 }}>Desmitificador (Mitos y Realidades)</Text>
              </TouchableOpacity>
            </View>

            <LunarCompass 
              calculation={cycleCalc} 
              onOpenTranslator={() => setShowTranslator(!showTranslator)}
              isRetreatMode={isRetreatMode}
              onToggleRetreatMode={handleToggleRetreatMode}
            />

            {showTranslator && (
              <MindBodyTranslator 
                selectedIds={selectedSymptoms}
                onToggle={handleToggleSymptom}
                onSave={handleSaveSymptoms}
                isRetreatMode={isRetreatMode}
              />
            )}

            {!showTranslator && <MascotCompanion stage="cycle" />}

            <HealthStar />

            <EducationalCarousel isRetreatMode={isRetreatMode} />

            <GreenPharmacyModal 
              visible={showPharmacy} 
              onClose={() => setShowPharmacy(false)}
              symptoms={selectedSymptoms}
            />
          </View>
        );
    }
  };

  return (
    <SafeAreaView style={[styles.safeArea, isRetreatMode && styles.safeAreaDark]}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        <ModeSwitcher currentMode={currentMode} onModeChange={handleModeChange} />
        
        <View style={styles.divider} />

        {renderDashboard()}

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F4F1EA', // Avena (Día)
  },
  safeAreaDark: {
    backgroundColor: '#111512', // Verde muy oscuro / Casi negro (Noche)
  },
  scrollContent: {
    padding: 24,
    paddingBottom: 60,
    gap: 24,
  },
  divider: {
    height: 1,
    backgroundColor: 'transparent', // Remover línea dura, usar espacio negativo
    marginVertical: 4,
  }
});
