// Configuración pública de la landing y del panel. Se rellena al desplegar:
//   · GitHub Pages: el workflow la genera con las variables del repositorio.
//   · Azure: el script infra/azure/2-instalar-servidor.sh la genera con la dirección del servidor.
// La clave "anon" es pública por diseño (la seguridad la hacen las reglas de la base de datos).
window.METZTLI_CONFIG = {
  supabaseUrl: '',
  supabaseAnonKey: '',
  // Si la base de datos aún no tiene una versión publicada, el botón lleva a los Releases de GitHub.
  fallbackDownloadUrl: 'https://github.com/cuoconatwatah-create/Metztli/releases/latest',
  webAppUrl: 'https://cuoconatwatah-create.github.io/Metztli/',
};
