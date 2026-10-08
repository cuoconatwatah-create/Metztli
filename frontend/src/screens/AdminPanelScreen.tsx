// ─────────────────────────────────────────────────────────
// Metztli — Panel de la Administradora
//   Cuentas y roles · Moderación del foro · Mitos del Desmitificador
// Los permisos los hace cumplir Supabase: si el rol no alcanza, la base rechaza la acción.
// ─────────────────────────────────────────────────────────

import React, { useCallback, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, SafeAreaView, TouchableOpacity, TextInput, Alert, ActivityIndicator } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { ShieldCheck, Trash2, Lock } from 'lucide-react-native';
import { useRole } from '@/context/RoleContext';
import {
  ROLES,
  ROLE_LABELS,
  adminListUsers,
  createMyth,
  deleteForumPost,
  deleteMyth,
  listForumPosts,
  listMyths,
  setUserRole,
  type AdminUser,
  type AppRole,
  type ForumPostRow,
  type MythRow,
} from '@/lib/roles';
import { Button, Card, Chip, CurvedHeader, SegmentedTabs } from '@/components/ui';
import { colors, fonts, radius } from '@/theme';
import { useUi } from '@/i18n/ui';

type Tab = 'users' | 'forum' | 'myths';
const CATEGORIES: MythRow['category'][] = ['ciclo', 'embarazo', 'menopausia'];

export default function AdminPanelScreen() {
  const u = useUi();
  const navigation = useNavigation<any>();
  const { role, signedIn } = useRole();
  const [tab, setTab] = useState<Tab>('users');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [posts, setPosts] = useState<ForumPostRow[]>([]);
  const [myths, setMyths] = useState<MythRow[]>([]);

  const [newCategory, setNewCategory] = useState<MythRow['category']>('ciclo');
  const [newMyth, setNewMyth] = useState('');
  const [newReality, setNewReality] = useState('');

  const load = useCallback(async () => {
    if (role !== 'admin') return;
    setLoading(true);
    setError(null);
    try {
      if (tab === 'users') setUsers(await adminListUsers());
      if (tab === 'forum') setPosts(await listForumPosts());
      if (tab === 'myths') setMyths(await listMyths());
    } catch (e: any) {
      setError(e?.message ?? String(e));
    } finally {
      setLoading(false);
    }
  }, [tab, role]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const guard = async (action: () => Promise<void>) => {
    try {
      await action();
      await load();
    } catch (e: any) {
      Alert.alert(u('La acción no se completó'), e?.message ?? '');
    }
  };

  const changeRole = (target: AdminUser, next: AppRole) => {
    if (next === target.user_role) return;
    Alert.alert(
      u('Cambiar rol'),
      u('{{name}} pasará a ser {{role}}.', { name: target.name || target.email_masked, role: u(ROLE_LABELS[next]) }),
      [
        { text: u('Cancelar'), style: 'cancel' },
        { text: u('Cambiar'), onPress: () => guard(() => setUserRole(target.uid, next)) },
      ]
    );
  };

  const removePost = (p: ForumPostRow) => {
    Alert.alert(u('¿Eliminar esta publicación?'), `"${p.question.slice(0, 120)}"`, [
      { text: u('Cancelar'), style: 'cancel' },
      {
        text: u('Eliminar'),
        style: 'destructive',
        onPress: () =>
          guard(async () => {
            if (!(await deleteForumPost(p.id))) throw new Error(u('No se pudo eliminar (¿ya no existe?).'));
          }),
      },
    ]);
  };

  const removeMyth = (m: MythRow) => {
    Alert.alert(u('¿Eliminar este mito?'), m.myth.slice(0, 120), [
      { text: u('Cancelar'), style: 'cancel' },
      {
        text: u('Eliminar'),
        style: 'destructive',
        onPress: () =>
          guard(async () => {
            if (!(await deleteMyth(m.id))) throw new Error(u('No se pudo eliminar (¿ya no existe?).'));
          }),
      },
    ]);
  };

  const addMyth = () =>
    guard(async () => {
      if (newMyth.trim().length < 10 || newReality.trim().length < 10) {
        throw new Error(u('Escribe el mito y la verdad (mínimo 10 letras cada uno).'));
      }
      await createMyth({ category: newCategory, myth: newMyth.trim(), reality: newReality.trim() });
      setNewMyth('');
      setNewReality('');
    });

  if (role !== 'admin') {
    return (
      <SafeAreaView style={styles.safeArea}>
        <CurvedHeader title={u('Panel de administración')} onBack={() => navigation.goBack()} />
        <View style={styles.locked}>
          <Lock size={32} color={colors.mutedSoft} />
          <Text style={styles.lockedTitle}>{u('Acceso restringido')}</Text>
          <Text style={styles.muted}>
            {signedIn
              ? u('Tu cuenta no tiene el rol de administradora.')
              : u('Inicia sesión con una cuenta de administradora para entrar.')}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 60 }} keyboardShouldPersistTaps="handled">
        <CurvedHeader
          title={u('Panel de administración')}
          subtitle={u('Cuentas, foro y contenido')}
          onBack={() => navigation.goBack()}
          right={<ShieldCheck size={22} color={colors.white} />}
        >
          <SegmentedTabs
            tabs={[
              { value: 'users', label: u('Cuentas') },
              { value: 'forum', label: u('Foro') },
              { value: 'myths', label: u('Mitos') },
            ]}
            active={tab}
            onChange={setTab}
          />
        </CurvedHeader>

        <View style={styles.body}>
          <Text style={styles.privacy}>
            {u('Por privacidad, este panel nunca muestra ciclos, embarazos ni registros diarios de nadie.')}
          </Text>
          {loading && <ActivityIndicator color={colors.carmin} />}
          {error && <Text style={styles.error}>{error}</Text>}

          {tab === 'users' &&
            users.map((usr) => (
              <Card key={usr.uid} style={{ gap: 10 }}>
                <View style={styles.row}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.title}>{usr.name || u('Sin nombre')}</Text>
                    <Text style={styles.muted}>{usr.email_masked}</Text>
                  </View>
                </View>
                <View style={styles.chips}>
                  {ROLES.map((r) => (
                    <Chip key={r} label={u(ROLE_LABELS[r])} active={usr.user_role === r} onPress={() => changeRole(usr, r)} />
                  ))}
                </View>
              </Card>
            ))}

          {tab === 'forum' &&
            (posts.length === 0 && !loading ? (
              <Text style={styles.muted}>{u('No hay publicaciones.')}</Text>
            ) : (
              posts.map((p) => (
                <Card key={p.id} style={{ gap: 6 }}>
                  <View style={styles.row}>
                    <Text style={[styles.eyebrow, { flex: 1 }]}>
                      {p.alias} · {p.category}
                    </Text>
                    <TouchableOpacity onPress={() => removePost(p)} accessibilityRole="button" accessibilityLabel={u('Eliminar')}>
                      <Trash2 size={18} color={colors.carmin} />
                    </TouchableOpacity>
                  </View>
                  <Text style={styles.body2}>{p.question}</Text>
                </Card>
              ))
            ))}

          {tab === 'myths' && (
            <>
              <Card style={{ gap: 10 }}>
                <Text style={styles.title}>{u('Agregar un mito')}</Text>
                <View style={styles.chips}>
                  {CATEGORIES.map((c) => (
                    <Chip key={c} label={c} active={newCategory === c} onPress={() => setNewCategory(c)} />
                  ))}
                </View>
                <TextInput
                  style={[styles.input, { minHeight: 70 }]}
                  placeholder={u('El mito')}
                  placeholderTextColor={colors.placeholder}
                  multiline
                  value={newMyth}
                  onChangeText={setNewMyth}
                />
                <TextInput
                  style={[styles.input, { minHeight: 90 }]}
                  placeholder={u('La verdad que lo desmiente')}
                  placeholderTextColor={colors.placeholder}
                  multiline
                  value={newReality}
                  onChangeText={setNewReality}
                />
                <Button label={u('Publicar mito')} onPress={addMyth} />
              </Card>
              {myths.map((m) => (
                <Card key={m.id} style={{ gap: 6 }}>
                  <View style={styles.row}>
                    <Text style={[styles.eyebrow, { flex: 1 }]}>
                      {m.id} · {m.category}
                    </Text>
                    <TouchableOpacity onPress={() => removeMyth(m)} accessibilityRole="button" accessibilityLabel={u('Eliminar')}>
                      <Trash2 size={18} color={colors.carmin} />
                    </TouchableOpacity>
                  </View>
                  <Text style={styles.title}>{m.myth}</Text>
                  <Text style={styles.body2}>{m.reality}</Text>
                </Card>
              ))}
            </>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.avena },
  body: { padding: 16, gap: 12 },
  privacy: { fontFamily: fonts.regular, fontSize: 11, color: colors.mutedSoft, lineHeight: 16 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  title: { fontFamily: fonts.bold, fontSize: 14, color: colors.carbon },
  muted: { fontFamily: fonts.regular, fontSize: 12, color: colors.muted },
  eyebrow: { fontFamily: fonts.semibold, fontSize: 10, letterSpacing: 0.8, color: colors.carmin },
  body2: { fontFamily: fonts.regular, fontSize: 12, lineHeight: 18, color: colors.muted },
  error: { fontFamily: fonts.semibold, fontSize: 12, color: colors.carmin },
  input: {
    fontFamily: fonts.regular,
    fontSize: 13,
    color: colors.carbon,
    backgroundColor: colors.avena,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.md,
    padding: 12,
    textAlignVertical: 'top',
  },
  locked: { alignItems: 'center', gap: 10, padding: 32, marginTop: 24 },
  lockedTitle: { fontFamily: fonts.display, fontSize: 20, color: colors.carbon },
});
