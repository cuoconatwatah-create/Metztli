// ─────────────────────────────────────────────────────────
// Metztli 2.0 — Módulo de Embarazo (NBU & Offline-First)
// Panel de Seguimiento Gestacional + Triage de Emergencias
// ─────────────────────────────────────────────────────────

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Linking,
  Platform,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Speech from 'expo-speech';
import {
  Sparkles,
  Volume2,
  VolumeX,
  Play,
  Square,
  Check,
  Calendar,
  AlertTriangle,
  ArrowRight,
  ArrowLeft,
  ChevronDown,
  ChevronUp,
  MessageSquareWarning,
  ShieldAlert,
  Activity,
  Edit3,
} from 'lucide-react-native';

import { usePregnancyCalculator } from '@/hooks/usePregnancyCalculator';

interface SymptomAccordionItem {
  id: string;
  title: string;
  actionRequired: string;
  speechText: string;
  smsMessage: string;
}

const SYMPTOMS_DATA: SymptomAccordionItem[] = [
  {
    id: 'sangrado',
    title: 'Sangrado vaginal (rojo o café)',
    actionRequired:
      'Reposa acostada del lado izquierdo de inmediato. No tomes tés ni remedios caseros. Debe evaluarte el personal de salud urgentemente.',
    speechText:
      'Atención. El sangrado vaginal es una señal de peligro. Acuéstate de inmediato sobre tu lado izquierdo. No tomes infusiones y comunícate con la partera o dirígete al centro de salud.',
    smsMessage:
      'URGENTE Metztli: Soy usuaria de la comunidad, tengo 28 semanas de embarazo y presento SANGRADO VAGINAL. Necesito apoyo inmediato.',
  },
  {
    id: 'fiebre',
    title: 'Fiebre alta o escalofríos',
    actionRequired:
      'Aplica paños de agua tibia en la frente y cuello. Bebe agua fresca para mantenerte hidratada y reporta el síntoma sin demora a la Casa Materna.',
    speechText:
      'Si tienes fiebre alta, coloca paños con agua tibia en tu cabeza y bebe agua. La fiebre en el embarazo requiere revisión de la partera o enfermera comunitaria.',
    smsMessage:
      'URGENTE Metztli: Tengo embarazo de 28 semanas y presento FIEBRE ALTA con escalofríos. Por favor orientarme.',
  },
  {
    id: 'dolor_cabeza',
    title: 'Dolor de cabeza fuerte / Lucecitas',
    actionRequired:
      'Puede indicar presión alta (preeclampsia). Mantén la calma en un lugar con poca luz y sin ruido, y pide ayuda inmediata para chequear tu presión arterial.',
    speechText:
      'Alerta. Ver lucecitas o tener dolor de cabeza muy fuerte puede significar que tu presión está alta. Permanece en reposo y solicita que te tomen la presión arterial ahora.',
    smsMessage:
      'URGENTE Metztli: Tengo dolor de cabeza muy fuerte y veo lucecitas con zumbidos. Posible presión alta. Solicito auxilio.',
  },
  {
    id: 'movimientos',
    title: 'El bebé no se mueve como de costumbre',
    actionRequired:
      'Come un alimento nutritivo o bebe agua fresca, acuéstate de lado y cuenta las pataditas durante una hora. Si no sientes al menos 3 a 5 movimientos, busca auxilio.',
    speechText:
      'Si sientes que tu bebé se mueve poco, bebe agua, descansa de lado y concéntrate en su pancita por una hora. Si sigue sin moverse, avisa de inmediato a la partera.',
    smsMessage:
      'URGENTE Metztli: Mi bebé ha dejado de moverse durante la sesión de conteo. Semana 28. Solicito evaluación.',
  },
];

export default function PregnancyScreen() {
  const { calculation } = usePregnancyCalculator();

  // Estado de navegación interna del módulo (Dashboard vs Triage de Emergencias)
  const [currentView, setCurrentView] = useState<'dashboard' | 'triage'>('dashboard');

  // Estado de los acordeones de síntomas (revelación progresiva Gestalt)
  const [expandedSymptomId, setExpandedSymptomId] = useState<string | null>(null);

  // Estados de audio / voz en tiempo real
  const [isSpeakingTip, setIsSpeakingTip] = useState<boolean>(false);
  const [speakingSymptomId, setSpeakingSymptomId] = useState<string | null>(null);

  // Valores gestacionales: Dinámicos si hay cálculo, o predeterminados para demo/pitch (Semana 28 / Faltan 12 semanas)
  const gestationalWeeks = calculation?.gestationalWeeks || 28;
  const weeksRemaining = calculation ? Math.max(0, 40 - calculation.gestationalWeeks) : 12;
  const progressPercent = Math.min(100, Math.max(10, (gestationalWeeks / 40) * 100));

  // Limpiar síntesis de voz al desmontar
  useEffect(() => {
    return () => {
      Speech.stop();
    };
  }, []);

  // Manejador para el botón principal "Escuchar consejo de hoy"
  const handleToggleTipSpeech = async () => {
    if (isSpeakingTip) {
      await Speech.stop();
      setIsSpeakingTip(false);
      return;
    }

    // Detener cualquier audio previo
    await Speech.stop();
    setSpeakingSymptomId(null);

    const tipMessage = `Consejo para tu semana veintiocho: Tu bebé ya puede abrir los ojos y percibir la luz. Recuerda beber agua fresca de coco o agua hervida, descansar con los pies en alto y realizar tu conteo diario de pataditas.`;

    setIsSpeakingTip(true);
    try {
      Speech.speak(tipMessage, {
        language: 'es-ES',
        rate: 0.92, // Velocidad pausada y clara para Next-Billion-Users
        pitch: 1.0,
        onDone: () => setIsSpeakingTip(false),
        onStopped: () => setIsSpeakingTip(false),
        onError: () => setIsSpeakingTip(false),
      });
    } catch (error) {
      console.warn('Error al reproducir voz con expo-speech:', error);
      setIsSpeakingTip(false);
    }
  };

  // Manejador para "Escuchar qué hacer" en los acordeones de Triage
  const handleToggleSymptomSpeech = async (symptom: SymptomAccordionItem) => {
    if (speakingSymptomId === symptom.id) {
      await Speech.stop();
      setSpeakingSymptomId(null);
      return;
    }

    await Speech.stop();
    setIsSpeakingTip(false);
    setSpeakingSymptomId(symptom.id);

    try {
      Speech.speak(symptom.speechText, {
        language: 'es-ES',
        rate: 0.9,
        pitch: 1.0,
        onDone: () => setSpeakingSymptomId(null),
        onStopped: () => setSpeakingSymptomId(null),
        onError: () => setSpeakingSymptomId(null),
      });
    } catch (error) {
      console.warn('Error en síntesis de voz del síntoma:', error);
      setSpeakingSymptomId(null);
    }
  };

  // Manejador del botón de auxilio SMS nativo hacia la partera de la Casa Materna
  const handleSendEmergencySMS = async (symptom: SymptomAccordionItem) => {
    const phoneNumber = '+50588880000'; // Partera comunitaria / Casa Materna
    const smsUrl = `sms:${phoneNumber}?body=${encodeURIComponent(symptom.smsMessage)}`;

    try {
      const canOpen = await Linking.canOpenURL(smsUrl);
      if (canOpen) {
        await Linking.openURL(smsUrl);
      } else {
        // Fallback para dispositivos o emuladores
        await Linking.openURL(`sms:${phoneNumber}`);
      }
    } catch (error) {
      Alert.alert(
        'Mensaje de Auxilio Preparado',
        `No se pudo abrir la aplicación de SMS automáticamente. Por favor envía este texto a tu partera:\n\n"${symptom.smsMessage}"`,
        [{ text: 'Entendido' }]
      );
    }
  };

  const toggleAccordion = (id: string) => {
    setExpandedSymptomId((prev) => (prev === id ? null : id));
    // Detener audio al cerrar acordeón
    if (speakingSymptomId === id) {
      Speech.stop();
      setSpeakingSymptomId(null);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* ============================================================= */}
        {/* 1. VISTA: PANEL DE SEGUIMIENTO (DASHBOARD INTERNO)            */}
        {/* ============================================================= */}
        {currentView === 'dashboard' && (
          <View style={styles.viewContent}>
            
            {/* Header de Identidad y Modo Offline */}
            <View style={styles.topHeader}>
              <View>
                <Text style={styles.stageEyebrow}>ETAPA GESTACIONAL</Text>
                <Text style={styles.mainTitle}>Tu Embarazo</Text>
              </View>
              <View style={styles.offlineBadge}>
                <View style={styles.pulsingDot} />
                <Text style={styles.offlineBadgeText}>Offline Activo</Text>
              </View>
            </View>

            {/* Calculadora Visual de Progreso (Semana 28 / Faltan 12 sem.) */}
            <View style={styles.card}>
              <View style={styles.progressHeaderRow}>
                <View>
                  <Text style={styles.metricLabel}>Tiempo actual</Text>
                  <Text style={styles.weekNumberText}>Semana {gestationalWeeks}</Text>
                </View>
                <View style={styles.countdownColumn}>
                  <Text style={styles.metricLabel}>Cuenta regresiva</Text>
                  <Text style={styles.countdownText}>Faltan {weeksRemaining} sem.</Text>
                </View>
              </View>

              {/* Barra de Progreso Visual */}
              <View style={styles.progressBarTrack}>
                <View style={[styles.progressBarFill, { width: `${progressPercent}%` }]} />
              </View>

              {/* Referencia contextual NBU (Tamaño gestacional) */}
              <View style={styles.progressFooterRow}>
                <Text style={styles.trimesterBadgeText}>Tercer Trimestre</Text>
                <View style={styles.babySizeTag}>
                  <Sparkles size={16} color="#8B2635" />
                  <Text style={styles.babySizeText}>Bebé del tamaño de una berenjena</Text>
                </View>
              </View>
            </View>

            {/* Call to Action Principal: Escuchar Consejo de Hoy (Voice-First NBU) */}
            <TouchableOpacity
              activeOpacity={0.88}
              style={[
                styles.voiceCtaButton,
                isSpeakingTip && styles.voiceCtaButtonActive,
              ]}
              onPress={handleToggleTipSpeech}
              accessibilityLabel="Escuchar consejo de salud para el día de hoy"
            >
              <View style={styles.voiceCtaContent}>
                <View style={styles.voiceIconCircle}>
                  {isSpeakingTip ? (
                    <VolumeX size={22} color="#FFF" />
                  ) : (
                    <Volume2 size={22} color="#FFF" />
                  )}
                </View>
                <View style={styles.voiceCtaTextWrapper}>
                  <Text style={styles.voiceCtaTitle}>
                    {isSpeakingTip ? 'Pausar audio de hoy' : 'Escuchar consejo de hoy'}
                  </Text>
                  <Text style={styles.voiceCtaSubtitle}>
                    {isSpeakingTip ? 'Reproduciendo con voz clara...' : 'Audio en voz clara y directa'}
                  </Text>
                </View>
              </View>
              <View style={styles.playIconBadge}>
                {isSpeakingTip ? (
                  <Square size={14} color="#FFF" fill="#FFF" />
                ) : (
                  <Play size={14} color="#FFF" fill="#FFF" />
                )}
              </View>
            </TouchableOpacity>

            {/* Sistema de Enrutamiento Tipo "Semáforo Clínico" */}
            <View style={styles.semaphoreSection}>
              <Text style={styles.sectionHeaderTitle}>Semáforo de Estado Materno</Text>

              {/* Tarjeta 1 (Verde: Todo Bien / Bienestar) */}
              <View style={[styles.semaphoreCard, styles.cardSuccess]}>
                <View style={styles.semaphoreCardLeft}>
                  <View style={styles.successIconBubble}>
                    <Check size={20} color="#FFF" strokeWidth={3} />
                  </View>
                  <View>
                    <Text style={styles.successTitle}>Todo bajo control</Text>
                    <Text style={styles.successSubtitle}>Movimientos fetales normales hoy</Text>
                  </View>
                </View>
                <View style={styles.greenDot} />
              </View>

              {/* Tarjeta 2 (Blanca: Próximas Citas Médicas) */}
              <View style={[styles.semaphoreCard, styles.cardAppointment]}>
                <View style={styles.semaphoreCardLeft}>
                  <View style={styles.calendarIconBubble}>
                    <Calendar size={20} color="#2C3D30" />
                  </View>
                  <View>
                    <Text style={styles.appointmentTitle}>Próximo Control Prenatal</Text>
                    <Text style={styles.appointmentSubtitle}>Martes 14 — Casa Materna / C.S.</Text>
                  </View>
                </View>
                <Activity size={18} color="#8A8A8A" />
              </View>

              {/* Tarjeta 3 (Roja: Alertas / Disparador de la Vista de Triage) */}
              <TouchableOpacity
                activeOpacity={0.88}
                style={[styles.semaphoreCard, styles.cardAlertTrigger]}
                onPress={() => {
                  Speech.stop();
                  setIsSpeakingTip(false);
                  setCurrentView('triage');
                }}
                accessibilityLabel="Abrir señales de alerta y guía de emergencias"
              >
                <View style={styles.semaphoreCardLeft}>
                  <View style={styles.alertIconBubble}>
                    <AlertTriangle size={20} color="#FFF" strokeWidth={2.5} />
                  </View>
                  <View style={{ flexShrink: 1 }}>
                    <View style={styles.alertTitleRow}>
                      <Text style={styles.alertTitle}>Señales de Alerta</Text>
                      <View style={styles.urgentTag}>
                        <Text style={styles.urgentTagText}>Urgente</Text>
                      </View>
                    </View>
                    <Text style={styles.alertSubtitle}>
                      Toca aquí si sientes dolor, fiebre o sangrado
                    </Text>
                  </View>
                </View>
                <View style={styles.alertArrowBadge}>
                  <ArrowRight size={18} color="#8B2635" strokeWidth={2.5} />
                </View>
              </TouchableOpacity>
            </View>

          </View>
        )}

        {/* ============================================================= */}
        {/* 2. VISTA: TRIAGE Y EMERGENCIAS (REVELACIÓN PROGRESIVA GESTALT) */}
        {/* ============================================================= */}
        {currentView === 'triage' && (
          <View style={styles.viewContent}>
            
            {/* Barra superior con botón de retorno al Dashboard */}
            <View style={styles.triageNavBar}>
              <TouchableOpacity
                activeOpacity={0.7}
                style={styles.backButton}
                onPress={() => {
                  Speech.stop();
                  setSpeakingSymptomId(null);
                  setCurrentView('dashboard');
                }}
                accessibilityLabel="Volver al panel de seguimiento"
              >
                <ArrowLeft size={20} color="#2C3D30" strokeWidth={2.5} />
                <Text style={styles.backButtonText}>Volver al panel</Text>
              </TouchableOpacity>

              <View style={styles.triageBadge}>
                <Text style={styles.triageBadgeText}>Triage Rápido</Text>
              </View>
            </View>

            {/* Banner de Orientación al Usuario */}
            <View style={styles.triageBanner}>
              <ShieldAlert size={26} color="#FFF" style={styles.bannerIcon} />
              <View style={{ flex: 1 }}>
                <Text style={styles.bannerTitle}>¿Qué síntoma estás sintiendo?</Text>
                <Text style={styles.bannerSubtitle}>
                  Toca el síntoma para escuchar qué hacer o enviar auxilio inmediato a la partera de tu comunidad.
                </Text>
              </View>
            </View>

            {/* Acordeón Interactivo de Síntomas (Revelación Progresiva) */}
            <View style={styles.accordionContainer}>
              {SYMPTOMS_DATA.map((symptom) => {
                const isExpanded = expandedSymptomId === symptom.id;
                const isSpeakingThis = speakingSymptomId === symptom.id;

                return (
                  <View key={symptom.id} style={styles.accordionItem}>
                    <TouchableOpacity
                      activeOpacity={0.8}
                      style={[
                        styles.accordionHeader,
                        isExpanded && styles.accordionHeaderExpanded,
                      ]}
                      onPress={() => toggleAccordion(symptom.id)}
                    >
                      <View style={styles.accordionHeaderLeft}>
                        <View style={styles.symptomIndicatorDot} />
                        <Text style={styles.symptomTitle}>{symptom.title}</Text>
                      </View>
                      {isExpanded ? (
                        <ChevronUp size={20} color="#8A8A8A" />
                      ) : (
                        <ChevronDown size={20} color="#8A8A8A" />
                      )}
                    </TouchableOpacity>

                    {/* Contenido expandible del síntoma */}
                    {isExpanded && (
                      <View style={styles.accordionBody}>
                        <Text style={styles.actionText}>
                          <Text style={styles.actionHighlight}>Acción requerida: </Text>
                          {symptom.actionRequired}
                        </Text>

                        <View style={styles.actionButtonsRow}>
                          {/* Botón: Escuchar qué hacer */}
                          <TouchableOpacity
                            activeOpacity={0.8}
                            style={[
                              styles.btnListenSymptom,
                              isSpeakingThis && styles.btnListenSymptomActive,
                            ]}
                            onPress={() => handleToggleSymptomSpeech(symptom)}
                          >
                            <Volume2
                              size={18}
                              color={isSpeakingThis ? '#FFF' : '#2C3D30'}
                            />
                            <Text
                              style={[
                                styles.btnListenSymptomText,
                                isSpeakingThis && styles.btnListenSymptomTextActive,
                              ]}
                            >
                              {isSpeakingThis ? 'Reproduciendo...' : 'Escuchar qué hacer'}
                            </Text>
                          </TouchableOpacity>

                          {/* Botón de Auxilio: SMS Nativo a la Partera */}
                          <TouchableOpacity
                            activeOpacity={0.85}
                            style={styles.btnEmergencySMS}
                            onPress={() => handleSendEmergencySMS(symptom)}
                          >
                            <MessageSquareWarning size={18} color="#FFF" />
                            <Text style={styles.btnEmergencySMSText}>Botón de Auxilio</Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    )}
                  </View>
                );
              })}
            </View>

          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

// ─────────────────────────────────────────────────────────
// ESTILOS Y SISTEMA DE TOKENS VISUALES (TAILWIND ALIGNED)
// ─────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F4F1EA', // Avena Cálida
  },
  scrollContainer: {
    paddingHorizontal: 18,
    paddingTop: 12,
    paddingBottom: 48,
  },
  viewContent: {
    gap: 20,
  },

  // Encabezado
  topHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 4,
  },
  stageEyebrow: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
    color: '#8B2635', // Carmín Profundo
    textTransform: 'uppercase',
  },
  mainTitle: {
    fontSize: 26,
    fontWeight: '900',
    color: '#1A1A1A',
    letterSpacing: -0.5,
  },
  offlineBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(26, 26, 26, 0.06)',
    gap: 6,
  },
  pulsingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#2C3D30', // Verde Bosque
  },
  offlineBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#2C3D30',
  },

  // Tarjeta de Progreso
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(26, 26, 26, 0.05)',
    shadowColor: '#1A1A1A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  progressHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 14,
  },
  metricLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: '#8A8A8A', // Gris secundario
    marginBottom: 2,
  },
  weekNumberText: {
    fontSize: 30,
    fontWeight: '900',
    color: '#1A1A1A',
    letterSpacing: -0.5,
  },
  countdownColumn: {
    alignItems: 'flex-end',
  },
  countdownText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#8B2635',
  },
  progressBarTrack: {
    height: 12,
    backgroundColor: '#F4F1EA',
    borderRadius: 6,
    overflow: 'hidden',
    marginBottom: 14,
    borderWidth: 1,
    borderColor: 'rgba(26, 26, 26, 0.04)',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#8B2635',
    borderRadius: 6,
  },
  progressFooterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F4F1EA',
  },
  trimesterBadgeText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#8A8A8A',
  },
  babySizeTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  babySizeText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#2C3D30',
  },

  // Botón Voice CTA (Escuchar consejo de hoy)
  voiceCtaButton: {
    backgroundColor: '#2C3D30', // Verde Bosque
    borderRadius: 20,
    paddingVertical: 16,
    paddingHorizontal: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 56,
    shadowColor: '#1A1A1A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  voiceCtaButtonActive: {
    backgroundColor: '#222F25',
    borderWidth: 1.5,
    borderColor: '#C8ACD6',
  },
  voiceCtaContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    flex: 1,
  },
  voiceIconCircle: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  voiceCtaTextWrapper: {
    flex: 1,
  },
  voiceCtaTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  voiceCtaSubtitle: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.85)',
  },
  playIconBadge: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Semáforo de Estado Materno
  semaphoreSection: {
    gap: 12,
    paddingTop: 4,
  },
  sectionHeaderTitle: {
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.8,
    color: '#8A8A8A',
    textTransform: 'uppercase',
  },
  semaphoreCard: {
    borderRadius: 20,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 56,
    shadowColor: '#1A1A1A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  semaphoreCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    flex: 1,
  },

  // Tarjeta Verde (Éxito)
  cardSuccess: {
    backgroundColor: '#F2F6F3', // Fondo Tarjeta Éxito
    borderWidth: 1,
    borderColor: 'rgba(44, 61, 48, 0.15)',
  },
  successIconBubble: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#2C3D30',
    justifyContent: 'center',
    alignItems: 'center',
  },
  successTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#2C3D30',
  },
  successSubtitle: {
    fontSize: 13,
    color: 'rgba(44, 61, 48, 0.8)',
    marginTop: 2,
  },
  greenDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#2C3D30',
  },

  // Tarjeta Blanca (Citas)
  cardAppointment: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(26, 26, 26, 0.06)',
  },
  calendarIconBubble: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F4F1EA',
    justifyContent: 'center',
    alignItems: 'center',
  },
  appointmentTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  appointmentSubtitle: {
    fontSize: 13,
    color: '#8A8A8A',
    marginTop: 2,
  },

  // Tarjeta Roja (Alertas / Disparador de Triage)
  cardAlertTrigger: {
    backgroundColor: '#FDF2F4', // Fondo Tarjeta Alerta
    borderWidth: 2,
    borderColor: '#8B2635', // Carmín Profundo
  },
  alertIconBubble: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#8B2635',
    justifyContent: 'center',
    alignItems: 'center',
  },
  alertTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  alertTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#8B2635',
  },
  urgentTag: {
    backgroundColor: '#8B2635',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  urgentTagText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  alertSubtitle: {
    fontSize: 13,
    color: 'rgba(139, 38, 53, 0.85)',
    marginTop: 2,
  },
  alertArrowBadge: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(139, 38, 53, 0.08)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // VISTA DE TRIAGE
  triageNavBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(26, 26, 26, 0.06)',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 4,
    minHeight: 44,
  },
  backButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#2C3D30',
  },
  triageBadge: {
    backgroundColor: '#FDF2F4',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(139, 38, 53, 0.2)',
  },
  triageBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#8B2635',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  triageBanner: {
    backgroundColor: '#8B2635',
    borderRadius: 20,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 14,
    shadowColor: '#1A1A1A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  bannerIcon: {
    marginTop: 2,
  },
  bannerTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  bannerSubtitle: {
    fontSize: 13.5,
    color: 'rgba(255, 255, 255, 0.92)',
    lineHeight: 19,
  },

  // Acordeón de Síntomas
  accordionContainer: {
    gap: 12,
  },
  accordionItem: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(26, 26, 26, 0.06)',
    overflow: 'hidden',
    shadowColor: '#1A1A1A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  accordionHeader: {
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    minHeight: 56,
  },
  accordionHeaderExpanded: {
    backgroundColor: '#FDF2F4',
  },
  accordionHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
    paddingRight: 10,
  },
  symptomIndicatorDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#8B2635',
  },
  symptomTitle: {
    fontSize: 15.5,
    fontWeight: '700',
    color: '#1A1A1A',
    flex: 1,
  },
  accordionBody: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    paddingTop: 8,
    backgroundColor: '#FDF2F4',
    borderTopWidth: 1,
    borderTopColor: '#F4F1EA',
    gap: 14,
  },
  actionText: {
    fontSize: 14,
    color: '#1A1A1A',
    lineHeight: 20,
  },
  actionHighlight: {
    fontWeight: '800',
    color: '#8B2635',
  },
  actionButtonsRow: {
    flexDirection: 'column',
    gap: 10,
    paddingTop: 4,
  },

  // Botón Escuchar qué hacer
  btnListenSymptom: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(44, 61, 48, 0.18)',
    borderRadius: 14,
    paddingVertical: 13,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    minHeight: 48,
  },
  btnListenSymptomActive: {
    backgroundColor: '#2C3D30',
  },
  btnListenSymptomText: {
    fontSize: 14.5,
    fontWeight: '700',
    color: '#2C3D30',
  },
  btnListenSymptomTextActive: {
    color: '#FFFFFF',
  },

  // Botón de Auxilio SMS
  btnEmergencySMS: {
    backgroundColor: '#8B2635', // Carmín Profundo
    borderRadius: 14,
    paddingVertical: 13,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    minHeight: 48,
    shadowColor: '#8B2635',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  btnEmergencySMSText: {
    fontSize: 14.5,
    fontWeight: '800',
    color: '#FFFFFF',
  },
});
