// ─────────────────────────────────────────────────────────
// Metztli — Avisos en la web
// En react-native-web, Alert.alert no hace nada: los mensajes de error y las
// confirmaciones no se veían en la demo web. Aquí se reemplaza por los
// cuadros del navegador. En Android e iOS no se toca.
// ─────────────────────────────────────────────────────────

import { Alert, Platform } from 'react-native';

if (Platform.OS === 'web' && typeof window !== 'undefined') {
  Alert.alert = (title, message, buttons) => {
    const text = [title, message].filter(Boolean).join('\n\n');

    // Un solo botón (o ninguno): aviso simple.
    if (!buttons || buttons.length <= 1) {
      window.alert(text);
      buttons?.[0]?.onPress?.();
      return;
    }

    // Varios botones: se pregunta con Aceptar / Cancelar.
    const cancel = buttons.find((b) => b.style === 'cancel');
    const action = buttons.find((b) => b.style !== 'cancel') ?? buttons[buttons.length - 1];
    if (window.confirm(text)) action.onPress?.();
    else cancel?.onPress?.();
  };
}
