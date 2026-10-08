// ─────────────────────────────────────────────────────────
// Metztli — Política de privacidad
// Texto en español claro. Si cambia lo que la app hace con los datos,
// se actualiza aquí y se sube PRIVACY_VERSION.
// ─────────────────────────────────────────────────────────

export const PRIVACY_VERSION = '1.0';
export const PRIVACY_DATE = '8 de octubre de 2026';

export interface PrivacySection {
  title: string;
  body: string[];
}

export const PRIVACY_INTRO =
  'Metztli es una app de salud sexual, reproductiva y comunitaria para mujeres y personas gestantes de la Costa Caribe de Nicaragua. Tu información es íntima, y aquí te explicamos con palabras sencillas qué guardamos, dónde y quién puede verla.';

export const PRIVACY_SECTIONS: PrivacySection[] = [
  {
    title: '1. Qué datos usamos',
    body: [
      'Tu nombre o apodo, tu correo y tu contraseña, si creas una cuenta.',
      'Lo que registras en la app: tu etapa, tu ciclo, tu embarazo, tus controles, tus pataditas, tu ánimo, tu sueño y tus síntomas.',
      'Lo que publicas en el foro Tribu, que es anónimo.',
    ],
  },
  {
    title: '2. Dónde se guardan',
    body: [
      'Por defecto, tus datos de salud se guardan solo en tu teléfono y funcionan sin internet.',
      'Solo si tú activas «Respaldar mis datos en la nube», una copia se guarda en tu cuenta, en los servidores de Supabase. Puedes apagarlo y borrar ese respaldo cuando quieras desde tu Perfil.',
      'Tu contraseña se guarda cifrada. Nosotras y nosotros no podemos verla.',
    ],
  },
  {
    title: '3. Para qué los usamos',
    body: [
      'Para mostrarte tu semana, tu fase, tus recomendaciones y tu historial.',
      'Para recuperar tus datos si cambias de teléfono, si activaste el respaldo.',
      'No vendemos tus datos ni los compartimos con empresas de publicidad.',
    ],
  },
  {
    title: '4. Quién puede verlos',
    body: [
      'Solo tú ves tus datos de salud. Esto está protegido en la base de datos, no solo en la pantalla.',
      'Las personas con perfil de Administrador o de Auditor no pueden ver datos de salud de nadie. El Administrador gestiona cuentas, foro y contenido; el Auditor revisa estadísticas generales y un historial de acciones.',
      'Una persona acompañante solo ve lo que decidas compartir con tu código de acompañante.',
    ],
  },
  {
    title: '5. Tus derechos',
    body: [
      'Puedes usar la app sin cuenta: todo queda en tu teléfono.',
      'Puedes activar o apagar el respaldo en la nube y borrar el respaldo desde Perfil.',
      'Puedes cerrar sesión cuando quieras. Tus datos guardados en el teléfono se mantienen.',
      'Si quieres que eliminemos tu cuenta, pídelo al equipo de Metztli.',
    ],
  },
  {
    title: '6. Importante',
    body: [
      'Metztli es una herramienta educativa y de acompañamiento. No sustituye la atención médica. Si tienes señales de alarma, acude al centro de salud o a la Casa Materna más cercana.',
      'Si esta política cambia, te lo avisaremos en la app y volveremos a pedirte que la aceptes.',
    ],
  },
];
