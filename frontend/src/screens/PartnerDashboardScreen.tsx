import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, SafeAreaView, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Users, CheckCircle2 } from 'lucide-react-native';

export default function PartnerDashboardScreen() {
  const navigation = useNavigation<any>();
  const [code, setCode] = useState('');
  const [linked, setLinked] = useState(false);

  const handleLink = () => {
    if (code.length < 5) {
      Alert.alert('Código inválido', 'Por favor ingresa un código válido (ej. METZ-123).');
      return;
    }
    // Simulate linking success
    setLinked(true);
  };

  const handleGoBack = () => {
    navigation.goBack();
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        
        <View style={styles.iconContainer}>
          <Users size={64} color="#8B2635" />
        </View>

        {!linked ? (
          <>
            <Text style={styles.title}>Red de Apoyo</Text>
            <Text style={styles.subtitle}>
              Ingresa el código que tu pareja o familiar te compartió para vincular sus cuentas.
            </Text>

            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                placeholder="Ej. METZ-849"
                placeholderTextColor="#A0AEC0"
                value={code}
                onChangeText={setCode}
                autoCapitalize="characters"
              />
            </View>

            <TouchableOpacity style={styles.primaryBtn} onPress={handleLink}>
              <Text style={styles.primaryBtnText}>Vincular Cuentas</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.secondaryBtn} onPress={handleGoBack}>
              <Text style={styles.secondaryBtnText}>Cancelar</Text>
            </TouchableOpacity>
          </>
        ) : (
          <View style={styles.successContainer}>
            <CheckCircle2 size={80} color="#2C3D30" style={{ marginBottom: 24 }} />
            <Text style={styles.title}>¡Cuentas Vinculadas!</Text>
            <Text style={styles.subtitle}>
              Ahora eres parte de la Red de Apoyo de Ana. Recibirás notificaciones importantes cuando ella active el Modo Retiro.
            </Text>
            <TouchableOpacity style={styles.primaryBtn} onPress={() => navigation.navigate('PartnerMain')}>
              <Text style={styles.primaryBtnText}>Ir a mi Dashboard</Text>
            </TouchableOpacity>
          </View>
        )}

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
    alignItems: 'center',
  },
  iconContainer: {
    marginBottom: 24,
  },
  title: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 28,
    color: '#1A1A1A',
    textAlign: 'center',
    marginBottom: 12,
  },
  subtitle: {
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    color: '#4A5568',
    textAlign: 'center',
    marginBottom: 40,
    lineHeight: 24,
  },
  inputContainer: {
    width: '100%',
    marginBottom: 24,
  },
  input: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingVertical: 18,
    borderRadius: 16,
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: '#1A1A1A',
    borderWidth: 1,
    borderColor: 'rgba(44, 61, 48, 0.1)',
    textAlign: 'center',
    letterSpacing: 2,
  },
  primaryBtn: {
    backgroundColor: '#8B2635',
    paddingVertical: 18,
    borderRadius: 32,
    alignItems: 'center',
    width: '100%',
    marginBottom: 16,
  },
  primaryBtnText: {
    color: '#FFFFFF',
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
  },
  secondaryBtn: {
    paddingVertical: 18,
    borderRadius: 32,
    alignItems: 'center',
    width: '100%',
  },
  secondaryBtnText: {
    color: '#4A5568',
    fontFamily: 'Inter-Medium',
    fontSize: 16,
  },
  successContainer: {
    alignItems: 'center',
    width: '100%',
  }
});
