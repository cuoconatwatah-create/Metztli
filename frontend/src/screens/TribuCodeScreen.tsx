import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, Share } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Users, Share2 } from 'lucide-react-native';

export default function TribuCodeScreen() {
  const navigation = useNavigation<any>();
  
  // Generar un código aleatorio para la demostración
  const tribuCode = "METZ-" + Math.floor(100 + Math.random() * 900);

  const handleShare = async () => {
    try {
      await Share.share({
        message: `¡Hola! Únete a mi Tribu en Metztli para acompañarme en mi ciclo. Mi código es: ${tribuCode}`,
      });
    } catch (error) {
      console.log('Error sharing', error);
    }
  };

  const handleSkip = () => {
    navigation.reset({
      index: 0,
      routes: [{ name: 'MainTabs' }],
    });
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        
        <View style={styles.iconContainer}>
          <Users size={64} color="#F4F1EA" />
        </View>

        <Text style={styles.title}>Sanamos mejor acompañadas</Text>
        <Text style={styles.subtitle}>
          Comparte este código con tu pareja, un familiar o tu mejor amiga para que sean parte de tu Red de Apoyo.
        </Text>

        <View style={styles.codeCard}>
          <Text style={styles.codeLabel}>TU CÓDIGO DE TRIBU</Text>
          <Text style={styles.codeText}>{tribuCode}</Text>
        </View>

        <TouchableOpacity style={styles.primaryBtn} onPress={handleShare}>
          <Share2 size={20} color="#2C3D30" style={{ marginRight: 8 }} />
          <Text style={styles.primaryBtnText}>Compartir por WhatsApp</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.skipBtn} onPress={handleSkip}>
          <Text style={styles.skipBtnText}>Saltar este paso por ahora</Text>
        </TouchableOpacity>

      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#2C3D30', // Verde Bosque
  },
  container: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconContainer: {
    marginBottom: 24,
  },
  title: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 28,
    color: '#F4F1EA',
    textAlign: 'center',
    marginBottom: 12,
  },
  subtitle: {
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    color: '#A0AEC0',
    textAlign: 'center',
    marginBottom: 40,
    lineHeight: 24,
  },
  codeCard: {
    backgroundColor: 'rgba(244, 241, 234, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(244, 241, 234, 0.3)',
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    width: '100%',
    marginBottom: 40,
  },
  codeLabel: {
    fontFamily: 'Inter-Medium',
    fontSize: 12,
    color: '#F4F1EA',
    letterSpacing: 2,
    marginBottom: 8,
  },
  codeText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 36,
    color: '#F4F1EA',
    letterSpacing: 4,
  },
  primaryBtn: {
    backgroundColor: '#F4F1EA', // Avena
    flexDirection: 'row',
    paddingVertical: 18,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    marginBottom: 24,
  },
  primaryBtnText: {
    color: '#2C3D30',
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
  },
  skipBtn: {
    padding: 10,
  },
  skipBtnText: {
    color: '#A0AEC0',
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    textDecorationLine: 'underline',
  }
});
