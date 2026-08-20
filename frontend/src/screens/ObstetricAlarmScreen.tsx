import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, ScrollView, Platform } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { AlertTriangle, PhoneCall, MessageSquareWarning } from 'lucide-react-native';
import * as Linking from 'expo-linking';

export default function ObstetricAlarmScreen() {
  const navigation = useNavigation();
  const { t } = useTranslation();

  const EMERGENCY_NUMBER = '+505-8888-8888'; 

  const handleCall = () => {
    Linking.openURL(`tel:${EMERGENCY_NUMBER}`).catch((err) =>
      console.error('Error opening dialer', err)
    );
  };

  const handleSMS = () => {
    const message = "EMERGENCIA: Necesito asistencia médica urgente.";
    const url = Platform.OS === 'ios' 
      ? `sms:${EMERGENCY_NUMBER}&body=${encodeURIComponent(message)}`
      : `sms:${EMERGENCY_NUMBER}?body=${encodeURIComponent(message)}`;
      
    Linking.openURL(url).catch((err) =>
      console.error('Error opening SMS', err)
    );
  };

  const dangerSigns = [
    t('alarm.bleeding'),
    t('alarm.severe_pain'),
    t('alarm.blurred_vision'),
    t('alarm.no_movement'),
    t('alarm.fever'),
    t('alarm.headache_severe'),
    t('alarm.swelling_face'),
    t('alarm.fluid_leak')
  ];

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#8B2635" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('alarm.title')}</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        <View style={styles.warningContainer}>
          <AlertTriangle size={48} color="#8B2635" style={{ marginBottom: 16 }} />
          <Text style={styles.warningTitle}>Busca ayuda inmediata</Text>
          <Text style={styles.warningSubtitle}>
            Si presentas cualquiera de los siguientes síntomas, acude a la Casa Materna o Centro de Salud más cercano.
          </Text>
        </View>

        <View style={styles.listContainer}>
          {dangerSigns.map((sign, index) => (
            <View key={index} style={styles.listItem}>
              <View style={styles.bullet} />
              <Text style={styles.listText}>{sign}</Text>
            </View>
          ))}
        </View>

        <View style={styles.actionContainer}>
          <TouchableOpacity style={styles.callButton} onPress={handleCall} activeOpacity={0.8}>
            <PhoneCall size={24} color="#FFF" />
            <Text style={styles.callButtonText}>{t('alarm.call_emergency')}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.smsButton} onPress={handleSMS} activeOpacity={0.8}>
            <MessageSquareWarning size={24} color="#8B2635" />
            <View style={styles.smsButtonTextContainer}>
              <Text style={styles.smsButtonText}>Enviar SMS de Emergencia</Text>
              <Text style={styles.smsButtonSubText}>Útil si no tienes saldo para llamadas o buena señal.</Text>
            </View>
          </TouchableOpacity>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
  },
  backButton: {
    padding: 8,
    marginLeft: -8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#8B2635',
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 60,
  },
  warningContainer: {
    alignItems: 'center',
    backgroundColor: 'rgba(139, 38, 53, 0.1)',
    padding: 24,
    borderRadius: 16,
    marginBottom: 24,
  },
  warningTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#8B2635',
    marginBottom: 8,
    textAlign: 'center',
  },
  warningSubtitle: {
    fontSize: 15,
    color: '#4A4A4A',
    textAlign: 'center',
    lineHeight: 22,
  },
  listContainer: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderRadius: 16,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    gap: 12,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  bullet: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#8B2635',
    marginTop: 6,
  },
  listText: {
    flex: 1,
    fontSize: 16,
    color: '#1A1A1A',
    lineHeight: 22,
    fontWeight: '500',
  },
  actionContainer: {
    gap: 16,
  },
  callButton: {
    backgroundColor: '#8B2635',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingVertical: 18,
    borderRadius: 16,
    shadowColor: '#8B2635',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  callButtonText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  smsButton: {
    backgroundColor: 'rgba(139, 38, 53, 0.05)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(139, 38, 53, 0.2)',
  },
  smsButtonTextContainer: {
    flex: 1,
  },
  smsButtonText: {
    color: '#8B2635',
    fontSize: 16,
    fontWeight: 'bold',
  },
  smsButtonSubText: {
    color: '#666',
    fontSize: 12,
    marginTop: 2,
  }
});
