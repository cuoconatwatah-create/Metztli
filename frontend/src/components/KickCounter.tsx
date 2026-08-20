// ─────────────────────────────────────────────────────────
// Metztli 2.0 — Kick Counter Component
// ─────────────────────────────────────────────────────────

import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { HeartPulse, Play, Square, AlertTriangle } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import GlassCard from './GlassCard';
import type { KickCounterProps } from '@/types';

export default function KickCounter({ onSessionComplete }: KickCounterProps) {
  const { t } = useTranslation();
  const [isActive, setIsActive] = useState(false);
  const [kickCount, setKickCount] = useState(0);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [elapsedMinutes, setElapsedMinutes] = useState(0);

  // Timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isActive && startTime) {
      interval = setInterval(() => {
        const now = Date.now();
        const diffMs = now - startTime;
        setElapsedMinutes(Math.floor(diffMs / 60000));
      }, 10000); // Check every 10 seconds for UI updates
    }
    return () => clearInterval(interval);
  }, [isActive, startTime]);

  const handleStart = () => {
    setIsActive(true);
    setKickCount(0);
    setStartTime(Date.now());
    setElapsedMinutes(0);
  };

  const handleStop = useCallback(() => {
    if (!isActive) return;
    
    // Stop the session
    setIsActive(false);
    
    // Calculate final duration
    let finalDuration = 0;
    if (startTime) {
      finalDuration = Math.max(1, Math.floor((Date.now() - startTime) / 60000));
    }

    // Check for low movement alert (less than 10 kicks in >= 120 minutes)
    // Note: In real scenarios, users might not wait 2 hours, but if they do and kicks are low:
    if (finalDuration >= 120 && kickCount < 10) {
      Alert.alert(
        t('alarm.title'),
        t('kicks.alert_low'),
        [{ text: t('common.continue'), style: 'default' }]
      );
    }

    // Save session if at least 1 kick was recorded
    if (kickCount > 0) {
      onSessionComplete(kickCount, finalDuration);
      Alert.alert(t('common.save'), t('kicks.session_saved'));
    }

    // Reset state
    setKickCount(0);
    setStartTime(null);
    setElapsedMinutes(0);

  }, [isActive, startTime, kickCount, onSessionComplete, t]);

  const handleKick = () => {
    if (isActive) {
      setKickCount((prev) => prev + 1);
    }
  };

  return (
    <GlassCard variant="default">
      <View style={styles.header}>
        <HeartPulse size={24} color="#8B2635" strokeWidth={2} />
        <Text style={styles.title}>{t('kicks.title')}</Text>
      </View>

      <Text style={styles.instructions}>
        {isActive ? t('kicks.tap_kick') : ''}
      </Text>

      <View style={styles.mainContent}>
        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>{kickCount}</Text>
            <Text style={styles.statLabel}>{t('kicks.kick_count', { count: kickCount }).trim()}</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statBox}>
            <Text style={styles.statValue}>{elapsedMinutes}</Text>
            <Text style={styles.statLabel}>{t('kicks.duration', { minutes: '' }).trim()}</Text>
          </View>
        </View>

        <TouchableOpacity
          style={[styles.bigButton, isActive ? styles.bigButtonActive : styles.bigButtonInactive]}
          onPress={isActive ? handleKick : handleStart}
          activeOpacity={0.7}
        >
          {isActive ? (
            <View style={styles.buttonInner}>
              <HeartPulse size={48} color="#FFF" strokeWidth={2} />
            </View>
          ) : (
            <View style={styles.buttonInner}>
              <Play size={32} color="#FFF" strokeWidth={2} style={{ marginLeft: 4 }} />
              <Text style={styles.startButtonText}>{t('kicks.start_session')}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {isActive && (
        <TouchableOpacity style={styles.stopButton} onPress={handleStop}>
          <Square size={20} color="#1A1A1A" strokeWidth={2} />
          <Text style={styles.stopButtonText}>{t('kicks.stop_session')}</Text>
        </TouchableOpacity>
      )}
      
      {/* Alert note visible when active */}
      {isActive && elapsedMinutes >= 60 && kickCount < 10 && (
         <View style={styles.alertNote}>
            <AlertTriangle size={16} color="#8B2635" />
            <Text style={styles.alertNoteText}>{t('kicks.alert_low')}</Text>
         </View>
      )}
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  instructions: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 16,
    minHeight: 20,
  },
  mainContent: {
    alignItems: 'center',
  },
  statsRow: {
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'space-around',
    marginBottom: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    borderRadius: 16,
    paddingVertical: 16,
  },
  statBox: {
    alignItems: 'center',
    flex: 1,
  },
  statDivider: {
    width: 1,
    backgroundColor: 'rgba(44, 61, 48, 0.1)',
  },
  statValue: {
    fontSize: 36,
    fontWeight: '800',
    color: '#8B2635',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    textTransform: 'uppercase',
    marginTop: 4,
  },
  bigButton: {
    width: 140,
    height: 140,
    borderRadius: 70,
    justifyContent: 'center',
    alignItems: 'center',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 1,
    shadowRadius: 16,
    elevation: 8,
    marginBottom: 16,
  },
  bigButtonInactive: {
    backgroundColor: '#2C3D30', // Bosque
    shadowColor: 'rgba(44, 61, 48, 0.4)',
  },
  bigButtonActive: {
    backgroundColor: '#8B2635', // Carmín
    shadowColor: 'rgba(139, 38, 53, 0.4)',
  },
  buttonInner: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  startButtonText: {
    color: '#FFF',
    fontWeight: '700',
    marginTop: 8,
    fontSize: 14,
  },
  stopButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    backgroundColor: 'rgba(44, 61, 48, 0.05)',
    borderRadius: 12,
    marginTop: 8,
  },
  stopButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  alertNote: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 16,
    padding: 12,
    backgroundColor: 'rgba(139, 38, 53, 0.1)',
    borderRadius: 8,
  },
  alertNoteText: {
    flex: 1,
    fontSize: 12,
    color: '#8B2635',
    fontWeight: '500',
  }
});
