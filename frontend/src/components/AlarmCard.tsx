// ─────────────────────────────────────────────────────────
// Metztli 2.0 — Alarm Card Component (Obstetric Danger Signs)
// ─────────────────────────────────────────────────────────

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { AlertTriangle, PhoneCall } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import * as Linking from 'expo-linking';
import GlassCard from './GlassCard';
import type { AlarmCardProps } from '@/types';

export default function AlarmCard({ municipality }: AlarmCardProps) {
  const { t } = useTranslation();

  // En producción, buscar el número real basado en el municipio
  // usando getDirectoryContacts(municipality)
  const EMERGENCY_NUMBER = '+505-8888-8888'; 

  const handleCall = () => {
    Linking.openURL(`tel:${EMERGENCY_NUMBER}`).catch((err) =>
      console.error('Error opening dialer', err)
    );
  };

  const dangerSigns = [
    t('alarm.bleeding'),
    t('alarm.severe_pain'),
    t('alarm.blurred_vision'),
    t('alarm.no_movement'),
    t('alarm.fever')
  ];

  return (
    <GlassCard variant="alarm" className="mt-4">
      <View style={styles.header}>
        <AlertTriangle size={28} color="#8B2635" strokeWidth={2.5} />
        <Text style={styles.title}>{t('alarm.title')}</Text>
      </View>
      
      <Text style={styles.subtitle}>{t('alarm.subtitle')}</Text>
      
      <View style={styles.listContainer}>
        {dangerSigns.map((sign, index) => (
          <View key={index} style={styles.listItem}>
            <View style={styles.bullet} />
            <Text style={styles.listText}>{sign}</Text>
          </View>
        ))}
      </View>

      <TouchableOpacity style={styles.callButton} onPress={handleCall} activeOpacity={0.8}>
        <PhoneCall size={20} color="#FFF" />
        <Text style={styles.callButtonText}>{t('alarm.call_emergency')}</Text>
      </TouchableOpacity>
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: '#8B2635',
    flex: 1,
  },
  subtitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 12,
  },
  listContainer: {
    marginBottom: 20,
    gap: 8,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  bullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#8B2635',
    marginTop: 6,
  },
  listText: {
    flex: 1,
    fontSize: 14,
    color: '#1A1A1A',
    lineHeight: 20,
  },
  callButton: {
    backgroundColor: '#8B2635',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingVertical: 14,
    borderRadius: 12,
    shadowColor: '#8B2635',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  callButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
  }
});
