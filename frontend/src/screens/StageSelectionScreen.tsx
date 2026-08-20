import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { updateUserMode } from '@/db/database';
import type { LifeStageMode } from '@/types';
import { Moon, Baby, Sparkles } from 'lucide-react-native';

export default function StageSelectionScreen() {
  const navigation = useNavigation<any>();
  const [selected, setSelected] = useState<LifeStageMode | null>(null);

  const handleContinue = async () => {
    if (!selected) {
      Alert.alert('Selecciona una etapa', 'Por favor elige la etapa en la que te encuentras para personalizar tu Santuario.');
      return;
    }

    try {
      await updateUserMode(selected);
      navigation.navigate('TribuCode');
    } catch (e: any) {
      console.error(e);
      Alert.alert('Error Guardando', e.message);
      // Navegamos igual de momento para no bloquear la demo
      navigation.navigate('TribuCode');
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        
        <Text style={styles.title}>¿En qué etapa de tu vida te encontrás hoy?</Text>
        <Text style={styles.subtitle}>Esto nos ayudará a personalizar tu Brújula Lunar y tus consejos de la Farmacia Verde.</Text>

        <View style={styles.options}>
          
          <TouchableOpacity 
            style={[styles.card, selected === 'cycle' && styles.cardSelected]}
            onPress={() => setSelected('cycle')}
          >
            <Moon size={28} color={selected === 'cycle' ? '#F4F1EA' : '#2C3D30'} />
            <Text style={[styles.cardText, selected === 'cycle' && styles.textSelected]}>
              Menstruación / Ciclo
            </Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.card, selected === 'pregnancy' && styles.cardSelected]}
            onPress={() => setSelected('pregnancy')}
          >
            <Baby size={28} color={selected === 'pregnancy' ? '#F4F1EA' : '#2C3D30'} />
            <Text style={[styles.cardText, selected === 'pregnancy' && styles.textSelected]}>
              Embarazo
            </Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.card, selected === 'menopause' && styles.cardSelected]}
            onPress={() => setSelected('menopause')}
          >
            <Sparkles size={28} color={selected === 'menopause' ? '#F4F1EA' : '#2C3D30'} />
            <Text style={[styles.cardText, selected === 'menopause' && styles.textSelected]}>
              Menopausia / Climaterio
            </Text>
          </TouchableOpacity>

        </View>

        <TouchableOpacity 
          style={[styles.primaryBtn, !selected && styles.primaryBtnDisabled]} 
          onPress={handleContinue}
          disabled={!selected}
        >
          <Text style={styles.primaryBtnText}>Continuar</Text>
        </TouchableOpacity>

      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F4F1EA',
  },
  container: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
  },
  title: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 28,
    color: '#1A1A1A',
    marginBottom: 12,
  },
  subtitle: {
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    color: '#4A5568',
    marginBottom: 40,
    lineHeight: 24,
  },
  options: {
    gap: 16,
    marginBottom: 40,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: '#2C3D30', // Verde Bosque
    backgroundColor: 'transparent',
  },
  cardSelected: {
    backgroundColor: '#2C3D30',
  },
  cardText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 18,
    color: '#2C3D30',
    marginLeft: 16,
  },
  textSelected: {
    color: '#F4F1EA',
  },
  primaryBtn: {
    backgroundColor: '#8B2635',
    paddingVertical: 18,
    borderRadius: 32,
    alignItems: 'center',
  },
  primaryBtnDisabled: {
    backgroundColor: '#A0AEC0',
  },
  primaryBtnText: {
    color: '#FFFFFF',
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
  }
});
