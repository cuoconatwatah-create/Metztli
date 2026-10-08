// ─────────────────────────────────────────────────────────
// Metztli — Etapa activa (menstruación, embarazo o menopausia)
//
// Cada etapa tiene sus propias pantallas (navigation/StageTabs.tsx). Cambiar de
// etapa intercambia el conjunto de pestañas; los datos de las otras etapas se
// conservan.
// ─────────────────────────────────────────────────────────

import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { updateUserMode } from '@/db/database';
import { setStagePref } from '@/lib/prefs';
import { pushProfile } from '@/db/cloud';
import type { LifeStageMode } from '@/types';

interface StageContextValue {
  stage: LifeStageMode;
  setStage: (stage: LifeStageMode) => Promise<void>;
}

const StageContext = createContext<StageContextValue>({
  stage: 'cycle',
  setStage: async () => {},
});

export const STAGES: LifeStageMode[] = ['cycle', 'pregnancy', 'menopause'];

export function isStage(value: unknown): value is LifeStageMode {
  return typeof value === 'string' && (STAGES as string[]).includes(value);
}

export function StageProvider({ initial, children }: { initial: LifeStageMode; children: React.ReactNode }) {
  const [stage, setStageState] = useState<LifeStageMode>(initial);

  const setStage = useCallback(async (next: LifeStageMode) => {
    setStageState(next); // la interfaz cambia al instante; la persistencia va detrás
    try {
      await updateUserMode(next);
      await setStagePref(next);
      pushProfile(next).catch(() => undefined); // solo actúa si hay sesión y respaldo activado
    } catch (e) {
      console.warn('No se pudo guardar la etapa', e);
    }
  }, []);

  const value = useMemo(() => ({ stage, setStage }), [stage, setStage]);
  return <StageContext.Provider value={value}>{children}</StageContext.Provider>;
}

export function useStage(): StageContextValue {
  return useContext(StageContext);
}
