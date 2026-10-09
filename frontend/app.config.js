// Configuración dinámica: se apoya en app.json y solo añade lo que depende del entorno.
// EXPO_BASE_URL permite publicar la versión web en una subruta (p. ej. GitHub Pages:
// https://<usuario>.github.io/Metztli/ → EXPO_BASE_URL=/Metztli). Sin la variable no cambia nada.
//
// versionCode de Android: se calcula a partir de la versión (2.0.10 → 20010) para que cada
// compilación sea reconocida como más nueva que la anterior al instalarla encima.
module.exports = ({ config }) => {
  const [maj, min, pat] = String(config.version ?? '0.0.0').split('.').map((n) => Number(n) || 0);
  const versionCode = maj * 10000 + min * 100 + pat;
  return {
    ...config,
    android: { ...(config.android ?? {}), versionCode },
    experiments: {
      ...(config.experiments ?? {}),
      ...(process.env.EXPO_BASE_URL ? { baseUrl: process.env.EXPO_BASE_URL } : {}),
    },
    web: {
      ...(config.web ?? {}),
      bundler: 'metro',
      output: 'single',
    },
  };
};
