// Configuración dinámica: se apoya en app.json y solo añade lo que depende del entorno.
// EXPO_BASE_URL permite publicar la versión web en una subruta (p. ej. GitHub Pages:
// https://<usuario>.github.io/Metztli/ → EXPO_BASE_URL=/Metztli). Sin la variable no cambia nada.
module.exports = ({ config }) => ({
  ...config,
  experiments: {
    ...(config.experiments ?? {}),
    ...(process.env.EXPO_BASE_URL ? { baseUrl: process.env.EXPO_BASE_URL } : {}),
  },
  web: {
    ...(config.web ?? {}),
    bundler: 'metro',
    output: 'single',
  },
});
