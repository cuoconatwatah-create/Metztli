import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { Flame, CloudRain, BatteryLow, Droplets, Wind, HeartPulse } from 'lucide-react-native';

interface SymptomOption {
  id: string;
  label: string;
  icon: React.ReactNode;
}

const SYMPTOMS: SymptomOption[] = [
  { id: 'cramps', label: 'Siento cólicos o dolor', icon: <Flame size={24} color="#8B2C3B" /> },
  { id: 'sadness', label: 'Ando irritable o triste', icon: <CloudRain size={24} color="#4A5568" /> },
  { id: 'low_energy', label: 'Me siento sin energía', icon: <BatteryLow size={24} color="#D97706" /> },
  { id: 'heavy_flow', label: 'Sangrado abundante', icon: <Droplets size={24} color="#8B2C3B" /> },
  { id: 'bloating', label: 'Me siento inflamada', icon: <Wind size={24} color="#2D3748" /> },
  { id: 'tender_breasts', label: 'Sensibilidad en el pecho', icon: <HeartPulse size={24} color="#E53E3E" /> },
];

interface MindBodyTranslatorProps {
  selectedIds: string[];
  onToggle: (id: string) => void;
  onSave: () => void;
  isRetreatMode: boolean;
}

export default function MindBodyTranslator({ 
  selectedIds, 
  onToggle, 
  onSave,
  isRetreatMode
}: MindBodyTranslatorProps) {
  
  return (
    <View style={[styles.container, isRetreatMode && styles.containerDark]}>
      <Text style={[styles.title, isRetreatMode && styles.textDark]}>
        Traductor Cuerpomente
      </Text>
      
      <View style={styles.grid}>
        {SYMPTOMS.map((sym) => {
          const isSelected = selectedIds.includes(sym.id);
          return (
            <TouchableOpacity 
              key={sym.id}
              style={[
                styles.card,
                isSelected && styles.cardSelected,
                isRetreatMode && styles.cardDark,
                isRetreatMode && isSelected && styles.cardDarkSelected
              ]}
              onPress={() => onToggle(sym.id)}
            >
              <View style={styles.iconWrapper}>
                {sym.icon}
              </View>
              <Text style={[
                styles.label,
                isSelected && styles.labelSelected,
                isRetreatMode && styles.textDark
              ]}>
                {sym.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <TouchableOpacity style={styles.saveBtn} onPress={onSave}>
        <Text style={styles.saveBtnText}>Traducir mi cuerpo</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 24,
    marginTop: 20,
    shadowColor: '#2C3D30',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 3,
  },
  containerDark: {
    backgroundColor: '#242D26', // slightly lighter than background
    shadowOpacity: 0,
  },
  title: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 20,
    color: '#1A1A1A',
    marginBottom: 20,
  },
  textDark: {
    color: '#F4F1EA',
  },
  grid: {
    gap: 12,
    marginBottom: 24,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    backgroundColor: '#F9F8F6',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  cardDark: {
    backgroundColor: '#1A211C',
  },
  cardSelected: {
    backgroundColor: '#FDF2F4', // light red
    borderColor: '#8B2C3B',
  },
  cardDarkSelected: {
    backgroundColor: '#3A2024', // dark red tint
    borderColor: '#8B2C3B',
  },
  iconWrapper: {
    marginRight: 16,
  },
  label: {
    fontFamily: 'Inter-Medium',
    fontSize: 15,
    color: '#4A5568',
    flex: 1,
  },
  labelSelected: {
    color: '#8B2C3B',
    fontFamily: 'Inter-SemiBold',
  },
  saveBtn: {
    backgroundColor: '#2C3D30', // Verde Bosque
    paddingVertical: 16,
    borderRadius: 30,
    alignItems: 'center',
  },
  saveBtnText: {
    color: '#FFFFFF',
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
  }
});
