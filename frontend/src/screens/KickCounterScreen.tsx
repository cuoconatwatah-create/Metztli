import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import KickCounter from '@/components/KickCounter';
import { KickCounterLog } from '@/types';
import { getTodayKickSessions, addKickSession } from '@/db/database';

export default function KickCounterScreen() {
  const navigation = useNavigation();
  const { t } = useTranslation();
  const [sessions, setSessions] = React.useState<KickCounterLog[]>([]);

  React.useEffect(() => {
    loadSessions();
  }, []);

  const loadSessions = async () => {
    const todaySessions = await getTodayKickSessions();
    setSessions(todaySessions);
  };

  const handleSessionComplete = async (count: number, duration: number) => {
    await addKickSession(new Date().toISOString(), count, duration);
    await loadSessions();
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#8B2635" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('kicks.title')}</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Text style={styles.description}>
          Contar las pataditas es una forma de monitorear el bienestar de tu bebé. 
          Siéntate o recuéstate de lado en un lugar tranquilo.
        </Text>
        
        <KickCounter onSessionComplete={handleSessionComplete} />

        {sessions.length > 0 && (
          <View style={styles.sessionsContainer}>
            <Text style={styles.sessionsTitle}>Registros de Hoy</Text>
            {sessions.map((s, index) => (
              <View key={s.id || index} style={styles.sessionCard}>
                <View style={styles.sessionTime}>
                  <Ionicons name="time-outline" size={16} color="#666" />
                  <Text style={styles.sessionTimeText}>
                    {new Date(s.session_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </Text>
                </View>
                <View style={styles.sessionDetails}>
                  <Text style={styles.sessionKicks}>{s.kick_count} pataditas</Text>
                  <Text style={styles.sessionDuration}>en {s.duration_minutes} min</Text>
                </View>
              </View>
            ))}
          </View>
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
  description: {
    fontSize: 16,
    color: '#4A4A4A',
    marginBottom: 24,
    lineHeight: 24,
  },
  sessionsContainer: {
    marginTop: 32,
  },
  sessionsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2C3D30',
    marginBottom: 16,
  },
  sessionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: 'rgba(44, 61, 48, 0.1)',
  },
  sessionTime: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  sessionTimeText: {
    color: '#666',
    fontWeight: '500',
  },
  sessionDetails: {
    alignItems: 'flex-end',
  },
  sessionKicks: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#8B2635',
  },
  sessionDuration: {
    fontSize: 12,
    color: '#666',
  }
});
