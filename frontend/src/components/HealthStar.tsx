import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { Star, Check, Droplet, Activity, Wind } from 'lucide-react-native';
import { getDailyLog, addDailyLog, getUserProfile } from '@/db/database';

interface MicroHabit {
  id: string;
  title: string;
  icon: React.ElementType;
}

const HABITS: MicroHabit[] = [
  { id: 'water', title: 'Agua (1L)', icon: Droplet },
  { id: 'walk', title: 'Caminar', icon: Activity },
  { id: 'breathe', title: 'Respirar', icon: Wind },
];

export default function HealthStar() {
  const [completedHabits, setCompletedHabits] = useState<string[]>([]);
  const [currentMode, setCurrentMode] = useState('cycle');

  useEffect(() => {
    const loadHabits = async () => {
      const profile = await getUserProfile();
      if (profile) setCurrentMode(profile.current_mode);

      const today = new Date().toISOString().split('T')[0];
      const todayLog = await getDailyLog(today);
      if (todayLog && todayLog.notes) {
        try {
          const habits = JSON.parse(todayLog.notes);
          if (Array.isArray(habits)) {
            setCompletedHabits(habits);
          }
        } catch (e) {
          // not valid json in notes
        }
      }
    };
    loadHabits();
  }, []);

  const toggleHabit = async (habitId: string) => {
    let newHabits = [...completedHabits];
    if (newHabits.includes(habitId)) {
      newHabits = newHabits.filter(id => id !== habitId);
    } else {
      newHabits.push(habitId);
    }
    setCompletedHabits(newHabits);

    const today = new Date().toISOString().split('T')[0];
    await addDailyLog({
      log_date: today,
      mode: currentMode as any,
      flow_level: null,
      pain_level: null,
      pregnancy_symptoms: null,
      mood: null,
      symptoms_json: null,
      notes: JSON.stringify(newHabits),
    });
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Star size={24} color="#8B2635" fill="#8B2635" />
        <Text style={styles.title}>Tus hábitos de hoy</Text>
      </View>
      <Text style={styles.subtitle}>Pequeñas acciones, gran bienestar.</Text>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.habitsList}>
        {HABITS.map(habit => {
          const isCompleted = completedHabits.includes(habit.id);
          const IconComponent = habit.icon;
          return (
            <TouchableOpacity 
              key={habit.id} 
              style={[styles.habitPill, isCompleted && styles.habitPillCompleted]}
              onPress={() => toggleHabit(habit.id)}
              activeOpacity={0.8}
            >
              <View style={[styles.iconCircle, isCompleted && styles.iconCircleCompleted]}>
                {isCompleted ? (
                  <Check size={18} color="#FFFFFF" strokeWidth={3} />
                ) : (
                  <IconComponent size={18} color="#8B2635" />
                )}
              </View>
              <Text style={[styles.habitTitle, isCompleted && styles.habitTitleCompleted]}>
                {habit.title}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 24,
    marginBottom: 32,
    shadowColor: '#2C3D30',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.05,
    shadowRadius: 20,
    elevation: 4,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  title: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 18,
    color: '#1A1A1A',
    marginLeft: 10,
  },
  subtitle: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: '#718096',
    marginBottom: 20,
  },
  habitsList: {
    gap: 12,
  },
  habitPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(244, 241, 234, 0.6)',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 30,
    borderWidth: 1,
    borderColor: 'rgba(139, 38, 53, 0.1)',
  },
  habitPillCompleted: {
    backgroundColor: 'rgba(44, 61, 48, 0.05)',
    borderColor: 'rgba(44, 61, 48, 0.15)',
  },
  iconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(139, 38, 53, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  iconCircleCompleted: {
    backgroundColor: '#2C3D30', // Verde Bosque
  },
  habitTitle: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    color: '#1A1A1A',
  },
  habitTitleCompleted: {
    color: '#4A5568',
  }
});
