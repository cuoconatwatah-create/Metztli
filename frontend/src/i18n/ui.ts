// ─────────────────────────────────────────────────────────
// Metztli — Textos de interfaz traducibles (namespace "ui")
//
// El texto en español ES la clave: `u('Tu ciclo')`. Si un idioma no tiene la
// traducción, se muestra el español (nunca una clave rota). Las traducciones
// viven en locales/ui.creole.ts y locales/ui.miskitu.ts.
// ─────────────────────────────────────────────────────────

import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import i18n from 'i18next';

export type UiFn = (text: string, vars?: Record<string, string | number>) => string;

export function translateUi(text: string, vars?: Record<string, string | number>): string {
  return i18n.t(text, {
    ns: 'ui',
    defaultValue: text,
    keySeparator: false,
    nsSeparator: false,
    ...vars,
  }) as string;
}

/** Hook: devuelve `u()` y vuelve a renderizar la pantalla cuando cambia el idioma. */
export function useUi(): UiFn {
  const { i18n: instance } = useTranslation();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  return useCallback<UiFn>((text, vars) => translateUi(text, vars), [instance.language]);
}
