import React from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity } from 'react-native';
import { X, Volume2 } from 'lucide-react-native';
import * as Speech from 'expo-speech';

interface GreenPharmacyModalProps {
  visible: boolean;
  onClose: () => void;
  symptoms: string[];
}

export default function GreenPharmacyModal({ visible, onClose, symptoms }: GreenPharmacyModalProps) {
  
  // Basic mock logic for Hackathon MVP
  const getRecommendation = () => {
    if (symptoms.includes('cramps') || symptoms.includes('heavy_flow')) {
      return "Los cólicos son mensajeros de inflamación. Hoy tratá de evitar el azúcar y los lácteos. Te recomendamos aplicarte calor en el vientre y tomarte un té de manzanilla o jengibre de nuestra Farmacia Verde.";
    }
    if (symptoms.includes('sadness') || symptoms.includes('low_energy')) {
      return "Tu cuerpo y tu mente te piden una pausa. Es un buen momento para descansar, tomar una infusión de cacao o hierba de San Juan, y ser amable contigo misma.";
    }
    return "Tu cuerpo está haciendo un gran trabajo. Mantente hidratada, come ligero y tómate tiempo para escuchar qué necesitas hoy.";
  };

  const textToRead = getRecommendation();

  const handleSpeak = () => {
    Speech.stop(); // Stop any ongoing speech
    Speech.speak(textToRead, { language: 'es-NI' }); // Spanish - Nicaragua/generic
  };

  const handleClose = () => {
    Speech.stop();
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={handleClose}
    >
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <View style={styles.header}>
            <Text style={styles.title}>Tu cuerpo te pide una pausa.</Text>
            <TouchableOpacity onPress={handleClose} style={styles.closeBtn}>
              <X color="#1A1A1A" size={24} />
            </TouchableOpacity>
          </View>

          <Text style={styles.bodyText}>
            {textToRead}
          </Text>

          <TouchableOpacity style={styles.audioBtn} onPress={handleSpeak}>
            <Volume2 color="#FFFFFF" size={20} style={styles.audioIcon} />
            <Text style={styles.audioBtnText}>Escuchar el consejo</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#F4F1EA', // Avena
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    padding: 24,
    paddingBottom: 40,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -5 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 10,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 22,
    color: '#2C3D30', // Verde Bosque
    flex: 1,
  },
  closeBtn: {
    padding: 4,
  },
  bodyText: {
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    color: '#4A5568',
    lineHeight: 24,
    marginBottom: 32,
  },
  audioBtn: {
    backgroundColor: '#2C3D30',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 30,
  },
  audioIcon: {
    marginRight: 8,
  },
  audioBtnText: {
    color: '#FFFFFF',
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
  }
});
