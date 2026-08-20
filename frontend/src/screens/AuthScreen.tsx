import React, { useState } from 'react';
import { 
  View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, 
  SafeAreaView, ActivityIndicator, KeyboardAvoidingView, 
  Platform, ScrollView, LayoutAnimation, UIManager 
} from 'react-native';
import { supabase } from '@/lib/supabase';
import { useNavigation } from '@react-navigation/native';
import { Shield } from 'lucide-react-native';

// Enable LayoutAnimation for Android
if (Platform.OS === 'android') {
  if (UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
  }
}

export default function AuthScreen() {
  const [isLogin, setIsLogin] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorField, setErrorField] = useState(''); // To highlight missing fields
  
  const navigation = useNavigation<any>();

  const toggleAuthMode = () => {
    // Smooth transition between Login and Signup
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setIsLogin(!isLogin);
    setErrorField(''); // Clear errors when switching modes
  };

  const handleAuth = async () => {
    // Validation with visual feedback
    if (!isLogin && !name) {
      setErrorField('name');
      return;
    }
    if (!email) {
      setErrorField('email');
      return;
    }
    if (!password) {
      setErrorField('password');
      return;
    }
    
    setErrorField('');
    setLoading(true);
    let error = null;

    if (!isLogin) {
      // Registro
      const { error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            display_name: name,
          }
        }
      });
      error = signUpError;
    } else {
      // Login
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      error = signInError;
    }

    setLoading(false);

    if (error) {
      Alert.alert('Error', error.message);
    } else {
      if (!isLogin) {
        Alert.alert('¡Santuario Creado!', 'Se ha enviado un correo de confirmación. Puedes continuar.');
        navigation.navigate('StageSelection');
      } else {
        navigation.reset({ index: 0, routes: [{ name: 'MainTabs' }] });
      }
    }
  };

  const handleSkip = () => {
    navigation.navigate('StageSelection');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView 
        style={{ flex: 1 }} 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContainer}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          
          <View style={styles.header}>
            <View style={styles.iconContainer}>
              <Shield size={48} color="#8B2C3B" strokeWidth={1.5} />
            </View>
            <Text style={styles.title}>{isLogin ? 'Bienvenida de vuelta' : 'Crea tu Santuario'}</Text>
            <Text style={styles.subtitle}>
              {isLogin 
                ? 'Inicia sesión para acceder a tu historial y herramientas de cuidado.'
                : 'Protegemos tu privacidad. Registra tu cuenta para respaldar tus datos.'}
            </Text>
          </View>

          <View style={styles.formCard}>
            {!isLogin && (
              <View style={[styles.inputWrapper, errorField === 'name' && styles.inputError]}>
                <TextInput
                  style={styles.input}
                  placeholder="Nombre o apodo"
                  placeholderTextColor="#A0AEC0"
                  value={name}
                  onChangeText={(text) => { setName(text); setErrorField(''); }}
                />
              </View>
            )}

            <View style={[styles.inputWrapper, errorField === 'email' && styles.inputError]}>
              <TextInput
                style={styles.input}
                placeholder="Correo electrónico o celular"
                placeholderTextColor="#A0AEC0"
                value={email}
                onChangeText={(text) => { setEmail(text); setErrorField(''); }}
                autoCapitalize="none"
                keyboardType="email-address"
              />
            </View>
            
            <View style={[styles.inputWrapper, errorField === 'password' && styles.inputError]}>
              <TextInput
                style={styles.input}
                placeholder="Contraseña"
                placeholderTextColor="#A0AEC0"
                value={password}
                onChangeText={(text) => { setPassword(text); setErrorField(''); }}
                secureTextEntry
              />
            </View>

            {!isLogin && (
              <Text style={styles.legalText}>
                Tus datos son tuyos. Nunca los compartiremos con terceros.
              </Text>
            )}

            {loading ? (
              <ActivityIndicator size="large" color="#8B2C3B" style={{ marginTop: 20 }} />
            ) : (
              <View style={styles.buttonGroup}>
                <TouchableOpacity style={styles.primaryBtn} onPress={handleAuth} activeOpacity={0.8}>
                  <Text style={styles.primaryBtnText}>
                    {isLogin ? 'Iniciar Sesión' : 'Crear Cuenta'}
                  </Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={styles.toggleBtn} 
                  onPress={toggleAuthMode}
                >
                  <Text style={styles.toggleBtnText}>
                    {isLogin ? '¿No tienes cuenta? Regístrate' : '¿Ya tienes cuenta? Inicia sesión'}
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </View>

          {!isLogin && (
            <TouchableOpacity style={styles.skipBtn} onPress={handleSkip}>
              <Text style={styles.skipBtnText}>Prefiero usarla sin cuenta por ahora</Text>
            </TouchableOpacity>
          )}

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F4F1EA',
  },
  scrollContainer: {
    flexGrow: 1,
    padding: 24,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  iconContainer: {
    backgroundColor: 'rgba(139, 44, 59, 0.1)',
    padding: 16,
    borderRadius: 30,
    marginBottom: 16,
  },
  title: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 28,
    color: '#1A1A1A',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontFamily: 'Inter-Regular',
    fontSize: 15,
    color: '#4A5568',
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 16,
  },
  formCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.5)', // Glassmorphism base
    padding: 24,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.8)',
    shadowColor: '#2C3D30',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.05,
    shadowRadius: 20,
    elevation: 3,
    gap: 16,
  },
  inputWrapper: {
    backgroundColor: 'rgba(255, 255, 255, 0.8)', // Lighter glass for inputs
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  inputError: {
    borderColor: '#8B2C3B',
    backgroundColor: 'rgba(139, 44, 59, 0.05)',
  },
  input: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    color: '#1A1A1A',
  },
  legalText: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    color: '#2C3D30',
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 8,
  },
  buttonGroup: {
    marginTop: 8,
    gap: 16,
  },
  primaryBtn: {
    backgroundColor: '#8B2C3B', // Carmín
    paddingVertical: 18,
    borderRadius: 30,
    alignItems: 'center',
    shadowColor: '#8B2C3B',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 15,
    elevation: 5,
  },
  primaryBtnText: {
    color: '#FFFFFF',
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    letterSpacing: 0.5,
  },
  toggleBtn: {
    alignItems: 'center',
    padding: 8,
  },
  toggleBtnText: {
    color: '#8B2C3B',
    fontFamily: 'Inter-Medium',
    fontSize: 14,
  },
  skipBtn: {
    marginTop: 32,
    alignItems: 'center',
    padding: 10,
  },
  skipBtnText: {
    color: '#4A5568',
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    textDecorationLine: 'underline',
  }
});
