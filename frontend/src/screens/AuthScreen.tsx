// ─────────────────────────────────────────────────────────
// Metztli — Perfil / Inicio de sesión (onboarding 3 del prototipo)
// ─────────────────────────────────────────────────────────

import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Alert,
  SafeAreaView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableOpacity,
  LayoutAnimation,
  UIManager,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Lock } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';
import { restoreHealthBackup } from '@/db/cloud';
import { setCloudBackupEnabled } from '@/lib/prefs';
import { useStage, isStage } from '@/context/StageContext';
import { Button, BackLink, StepDots } from '@/components/ui';
import { colors, fonts, radius } from '@/theme';
import { useUi } from '@/i18n/ui';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const MIN_PASSWORD = 8;

export default function AuthScreen() {
  const u = useUi();
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { setStage } = useStage();
  const [isLogin, setIsLogin] = useState(route.params?.mode === 'login');
  const [name, setName] = useState('');
  const [contact, setContact] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorField, setErrorField] = useState('');

  const toggleAuthMode = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setIsLogin(!isLogin);
    setErrorField('');
  };

  const handleAuth = async () => {
    if (!isLogin && !name.trim()) return setErrorField('name');
    if (!contact.trim()) return setErrorField('contact');
    if (password.length < MIN_PASSWORD) return setErrorField('password');

    setErrorField('');
    setLoading(true);

    // Correo si contiene "@"; de lo contrario se trata como teléfono.
    const id = contact.trim();
    const credentials = id.includes('@')
      ? { email: id, password }
      : { phone: id.replace(/[\s-]/g, ''), password };

    const { data, error } = isLogin
      ? await supabase.auth.signInWithPassword(credentials)
      : await supabase.auth.signUp({ ...credentials, options: { data: { display_name: name.trim() } } });

    setLoading(false);

    if (error) {
      Alert.alert(u('No pudimos continuar'), error.message);
      return;
    }
    if (isLogin) {
      // Si la usuaria ya tenía un respaldo en la nube, se recupera en este teléfono.
      try {
        const restored = await restoreHealthBackup();
        if (restored && (restored.logs > 0 || restored.cycles > 0 || restored.pregnancies > 0)) {
          await setCloudBackupEnabled(true);
          if (isStage(restored.stage)) await setStage(restored.stage);
        }
      } catch (e) {
        console.warn('No se pudo restaurar el respaldo', e);
      }
      navigation.reset({ index: 0, routes: [{ name: 'MainTabs' }] });
    } else {
      // El proyecto exige confirmar el correo antes de poder iniciar sesión.
      if (!data.session) {
        Alert.alert(u('Revisa tu correo'), u('Te enviamos un mensaje para confirmar tu cuenta. Después podrás iniciar sesión.'));
      }
      navigation.navigate('StageSelection');
    }
  };

  const fieldStyle = (key: string) => [styles.input, errorField === key && styles.inputError];

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <BackLink onPress={() => navigation.goBack()} />

          <View style={{ gap: 6 }}>
            <Text style={styles.eyebrow}>{isLogin ? u('BIENVENIDA DE VUELTA') : u('TU ESPACIO')}</Text>
            <Text style={styles.title}>{isLogin ? u('Inicia sesión') : u('Creando tu perfil')}</Text>
          </View>

          <View style={{ gap: 12 }}>
            {!isLogin && (
              <TextInput
                style={fieldStyle('name')}
                placeholder={u('Escribe tu nombre')}
                placeholderTextColor={colors.placeholder}
                value={name}
                onChangeText={(v) => { setName(v); setErrorField(''); }}
              />
            )}
            <TextInput
              style={fieldStyle('contact')}
              placeholder={u('Correo o teléfono')}
              placeholderTextColor={colors.placeholder}
              value={contact}
              onChangeText={(v) => { setContact(v); setErrorField(''); }}
              autoCapitalize="none"
              keyboardType="email-address"
            />
            <TextInput
              style={fieldStyle('password')}
              placeholder={u('Contraseña mínimo {{n}} dígitos', { n: MIN_PASSWORD })}
              placeholderTextColor={colors.placeholder}
              value={password}
              onChangeText={(v) => { setPassword(v); setErrorField(''); }}
              secureTextEntry
            />
            {errorField === 'password' && (
              <Text style={styles.errorText}>{u('La contraseña debe tener al menos {{n}} caracteres.', { n: MIN_PASSWORD })}</Text>
            )}
          </View>

          {!isLogin && (
            <View style={styles.privacy}>
              <Lock size={14} color={colors.bosque} style={{ marginTop: 2 }} />
              <Text style={styles.privacyText}>
                <Text style={{ fontFamily: fonts.bold }}>{u('Tus datos son 100% tuyos')}</Text>{' '}
                {u('y están seguros. Solo los usamos para personalizar tu espacio y darte las mejores recomendaciones.')}
              </Text>
            </View>
          )}

          <View style={{ flex: 1 }} />

          {!isLogin && <StepDots total={5} active={2} />}

          {loading ? (
            <ActivityIndicator size="large" color={colors.carmin} />
          ) : (
            <View style={{ gap: 12 }}>
              <Button label={isLogin ? u('INICIAR SESIÓN') : u('COMENZAR (Usuaria)')} onPress={handleAuth} />
              <TouchableOpacity style={styles.link} onPress={toggleAuthMode} accessibilityRole="button">
                <Text style={styles.linkText}>
                  {isLogin ? u('¿No tienes cuenta? Regístrate') : u('¿Ya tienes cuenta? Inicia sesión')}
                </Text>
              </TouchableOpacity>
              {!isLogin && (
                <TouchableOpacity style={styles.link} onPress={() => navigation.navigate('StageSelection')}>
                  <Text style={[styles.linkText, { textDecorationLine: 'underline', color: colors.mutedSoft }]}>
                    {u('Prefiero usarla sin cuenta por ahora')}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.avena },
  scroll: { flexGrow: 1, paddingHorizontal: 24, paddingTop: 20, paddingBottom: 24, gap: 24 },
  eyebrow: { fontFamily: fonts.semibold, fontSize: 11, letterSpacing: 1.2, color: colors.mutedSoft },
  title: { fontFamily: fonts.display, fontSize: 26, color: colors.carmin },
  input: {
    fontFamily: fonts.regular,
    fontSize: 14,
    color: colors.carbon,
    backgroundColor: 'rgba(255,255,255,0.6)',
    borderWidth: 1,
    borderColor: colors.disabled,
    borderRadius: radius.pill,
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  inputError: { borderColor: colors.carmin, backgroundColor: colors.blush },
  errorText: { fontFamily: fonts.regular, fontSize: 12, color: colors.carmin, marginLeft: 12 },
  privacy: {
    flexDirection: 'row',
    gap: 10,
    padding: 14,
    borderRadius: radius.md,
    backgroundColor: 'rgba(255,255,255,0.6)',
    borderWidth: 1,
    borderColor: colors.line,
  },
  privacyText: { flex: 1, fontFamily: fonts.regular, fontSize: 12, lineHeight: 18, color: colors.muted },
  link: { alignItems: 'center', padding: 6 },
  linkText: { fontFamily: fonts.medium, fontSize: 13, color: colors.carmin },
});
