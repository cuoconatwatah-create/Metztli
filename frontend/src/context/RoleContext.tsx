// ─────────────────────────────────────────────────────────
// Metztli — Rol de la cuenta (Administrador, Usuario o Auditor)
//
// Sin sesión (uso local) el rol es "user". Con sesión se lee de Supabase y se
// guarda una copia en el dispositivo solo para mostrar la interfaz sin conexión;
// los permisos reales siempre los decide la base de datos.
// ─────────────────────────────────────────────────────────

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { fetchMyRole, isRole, type AppRole } from '@/lib/roles';
import { getRolePref, setRolePref } from '@/lib/prefs';

interface RoleContextValue {
  role: AppRole;
  /** Administrador o auditor: pueden abrir paneles de personal. */
  isStaff: boolean;
  signedIn: boolean;
  refresh: () => Promise<void>;
}

const RoleContext = createContext<RoleContextValue>({
  role: 'user',
  isStaff: false,
  signedIn: false,
  refresh: async () => {},
});

export function RoleProvider({ children }: { children: React.ReactNode }) {
  const [role, setRole] = useState<AppRole>('user');
  const [signedIn, setSignedIn] = useState(false);

  const refresh = useCallback(async () => {
    try {
      const { data } = await supabase.auth.getSession();
      if (!data.session) {
        setSignedIn(false);
        setRole('user');
        await setRolePref('user');
        return;
      }
      setSignedIn(true);
      try {
        const fresh = await fetchMyRole();
        const next = fresh ?? 'user';
        setRole(next);
        await setRolePref(next);
      } catch {
        // Sin conexión: se usa la copia guardada solo para la interfaz
        const cached = await getRolePref();
        if (isRole(cached)) setRole(cached);
      }
    } catch (e) {
      console.warn('No se pudo determinar el rol', e);
    }
  }, []);

  useEffect(() => {
    refresh();
    const { data } = supabase.auth.onAuthStateChange(() => {
      refresh();
    });
    return () => data.subscription.unsubscribe();
  }, [refresh]);

  const value = useMemo(
    () => ({ role, isStaff: role === 'admin' || role === 'auditor', signedIn, refresh }),
    [role, signedIn, refresh]
  );
  return <RoleContext.Provider value={value}>{children}</RoleContext.Provider>;
}

export function useRole(): RoleContextValue {
  return useContext(RoleContext);
}
