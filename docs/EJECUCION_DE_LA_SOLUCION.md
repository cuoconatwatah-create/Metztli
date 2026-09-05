# Guía de Ejecución de la Solución — Metztli 2.0

> **Entregable de Desarrollo**: Ejecución de la Solución  
> **Proyecto**: Metztli 2.0 — Plataforma de Salud Femenina Integral Offline-First  
> **Fecha**: Septiembre 2026  
> **Estado**: Verificado y Listo para Evaluación  

---

## 1. Visión General de la Solución

Metztli 2.0 es una aplicación móvil desarrollada con **React Native (Expo SDK 51)**, **TypeScript**, **NativeWind (Tailwind CSS)** y una arquitectura **Offline-First** basada en **SQLite** local sincronizable con **Supabase** (PostgreSQL).

Para facilitar la revisión por parte de evaluadores y desarrolladores, la solución soporta **5 modalidades de ejecución**, desde una visualización instantánea en navegador web hasta la generación de un binario instalable (`.apk`) para dispositivos Android físicos.

---

## 2. Requisitos Previos del Entorno

Antes de comenzar, asegúrate de contar con los siguientes componentes instalados en tu sistema:

| Herramienta | Versión Mínima | Obligatorio Para | Enlace Oficial |
| :--- | :---: | :--- | :--- |
| **Node.js** | v18.0.0+ (LTS) | Todas las modalidades | [nodejs.org](https://nodejs.org/) |
| **npm** | v9.0.0+ | Gestión de paquetes | Incluido con Node.js |
| **Git** | v2.30.0+ | Clonación y control de versiones | [git-scm.com](https://git-scm.com/) |
| **Java JDK** | JDK 17 (Zulu recomendado) | Compilación nativa de APK local | [azul.com/downloads](https://www.azul.com/downloads/) |
| **Android SDK** | API Level 34 | Compilación nativa y emulador | Incluido en Android Studio |
| **Expo Go (App)** | Compatible SDK 51 | Ejecución rápida en teléfono móvil | Google Play / App Store |

---

## 3. Instalación Inicial del Proyecto

Abre una terminal (PowerShell en Windows o Bash en macOS/Linux) y ejecuta los siguientes pasos:

### Paso 1: Clonar el Repositorio
```bash
git clone https://github.com/cuoconatwatah-create/Metztli.git
cd Metztli
```

### Paso 2: Instalar Dependencias del Frontend
```bash
cd frontend
npm install
```

### Paso 3: Configurar Variables de Entorno
Copia el archivo de plantilla `.env.example` para crear tu `.env`:
```bash
# En Windows (PowerShell):
Copy-Item .env.example .env

# En Linux/macOS:
cp .env.example .env
```

Verifica el contenido de `frontend/.env`:
```env
EXPO_PUBLIC_SUPABASE_URL=https://ftcxvgxkkcfqucligesy.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_AQUI_VA_EL_RESTO_DE_TU_CLAVE
```

---

## 4. Modalidades de Ejecución

Elige la modalidad que mejor se adapte a tu objetivo de evaluación:

### Modalidad 1: Web Demo (Recomendada para Evaluación Inmediata ⚡)
No requiere emuladores ni Android Studio. La aplicación incluye una capa mock de SQLite para operar 100% en navegadores web modernos.

```bash
cd frontend
npm run web
```
- La aplicación abrirá automáticamente `http://localhost:8081` en tu navegador predeterminado.
- Permite probar todas las pantallas, flujos de navegación, el cambio de etapas de vida (Ciclo, Embarazo, Menopausia), y la interfaz trilingüe (Español, Miskitu, Creole).

---

### Modalidad 2: Móvil con Expo Go (Dispositivo Físico o Emulador 📱)
Permite correr la aplicación en tiempo real en tu teléfono:

1. Instala la app **Expo Go** en tu dispositivo desde Google Play Store.
2. Inicia el servidor de desarrollo de Metro:
   ```bash
   cd frontend
   npx expo start -c
   ```
3. Escanea el código QR que aparece en la terminal con la cámara de tu teléfono (en Android usando la app Expo Go).
4. El bundle se descargará e iniciará la aplicación en el dispositivo.

---

### Modalidad 3: Compilación Local de APK Android (Release) 📦
Para generar un instalable independiente `.apk` directamente en tu máquina:

1. **Generar los archivos nativos de Android:**
   ```bash
   cd frontend
   npx expo prebuild --platform android --clean
   ```
2. **Compilar el APK Release:**
   ```bash
   # En Windows:
   cd android
   .\gradlew assembleRelease

   # En macOS/Linux:
   cd android
   ./gradlew assembleRelease
   ```
3. **Ubicación del binario generado:**
   ```
   frontend/android/app/build/outputs/apk/release/app-release.apk
   ```
4. **Instalar en dispositivo conectado vía USB (ADB):**
   ```bash
   adb install app/build/outputs/apk/release/app-release.apk
   ```

---

### Modalidad 4: Descarga del APK desde CI/CD (GitHub Actions 🚀)
Metztli 2.0 cuenta con un pipeline automatizado de integración continua que compila el APK en cada actualización de `main`:

1. Ingresa al repositorio en GitHub: [https://github.com/cuoconatwatah-create/Metztli](https://github.com/cuoconatwatah-create/Metztli).
2. Haz clic en la pestaña **Actions**.
3. Selecciona el workflow **Build Android APK**.
4. Haz clic en la ejecución más reciente con éxito (marca verde).
5. En la sección inferior **Artifacts**, descarga el archivo **`Metztli-App-APK`** (contiene el archivo `app-release.apk` listo para instalar).

---

### Modalidad 5: Compilación en la Nube con Expo EAS Build ☁️
Si dispones de cuenta Expo:
```bash
cd frontend
npx eas-cli login
npx eas-cli build --platform android --profile preview
```
EAS Build generará un enlace de descarga directa del APK al finalizar la compilación en los servidores de Expo.

---

## 5. Configuración del Backend y Base de Datos (Supabase)

Metztli 2.0 utiliza Supabase para la persistencia comunitaria en la nube (directorio médico, mitos culturales y sincronización del foro).

### Opción A: Conexión al Supabase Cloud de Producción/Demo
El archivo `.env` del frontend ya viene configurado para consumir el endpoint activo del proyecto. No se requiere configuración adicional.

### Opción B: Despliegue en una Instancia Propia de Supabase
Si deseas desplegar tu propia instancia de base de datos:

1. Crea un nuevo proyecto en [supabase.com](https://supabase.com).
2. Ve al **SQL Editor** en el panel de control de Supabase.
3. Ejecuta en orden las siguientes migraciones ubicadas en `backend/supabase/migrations/`:
   - `20240101000000_init.sql` (Crea tablas `directory_contacts`, `forum_posts`, `user_cycle_logs` y configura políticas RLS).
   - `20240101000001_myths.sql` (Crea tabla `myths` con contenido semilla intercultural).
4. Copia tu `Project URL` y `anon public key` desde *Project Settings > API*.
5. Pégalas en tu archivo `frontend/.env`.

---

## 6. Verificación de Integridad y Pruebas

Para corroborar la calidad y consistencia del código antes de cualquier entrega:

### Verificación de Tipos TypeScript:
```bash
cd frontend
npm run ts:check
```
*(Debe finalizar con código de salida 0 y sin errores de tipado).*

### Verificación Funcional del Módulo de Embarazo (NBU & Triage):
1. **Acceso al Módulo**: Al abrir la aplicación, toca la pestaña **Embarazo** (icono de bebé en la barra inferior).
2. **Prueba del Dashboard**:
   - Observa la calculadora visual: debe mostrar *"Semana 28"* y *"Faltan 12 sem."* con la barra de progreso al 70%.
3. **Prueba de Voz (`expo-speech`)**:
   - Toca el botón *"Escuchar consejo de hoy"*. El dispositivo reproducirá en voz alta el consejo maternal. Toca nuevamente para pausar.
4. **Prueba del Semáforo**:
   - Revisa las tarjetas verde (Todo bajo control) y blanca (Control prenatal).
   - Toca la **tarjeta roja (Señales de Alerta)** para activar la **Vista de Triage**.
5. **Prueba del Triage de Emergencias**:
   - Toca cualquiera de los 4 síntomas para abrir el acordeón interactivo (revelación progresiva Gestalt).
   - Toca *"Escuchar qué hacer"* para oír la instrucción médica.
   - Toca *"Botón de Auxilio"* para verificar la apertura de la app nativa de SMS con el mensaje preformateado a la Casa Materna.
   - Toca *"Volver al panel"* para regresar al Dashboard.

---

## 7. Preguntas Frecuentes y Solución de Problemas (Troubleshooting)

### Problema: Metro Bundler falla con caché obsoleto
**Solución**: Inicia Metro limpiando la caché:
```bash
npx expo start -c
```

### Problema: Error de memoria en compilación Gradle (`OutOfMemoryError`)
**Solución**: Añade o edita en `frontend/android/gradle.properties`:
```properties
org.gradle.jvmargs=-Xmx4096m -XX:MaxMetaspaceSize=1024m
```

### Problema: `JAVA_HOME is not set` al ejecutar `./gradlew`
**Solución**: Asegúrate de tener instalado Java 17 y que la variable de entorno del sistema `JAVA_HOME` apunte a la ruta de instalación del JDK (ej. `C:\Program Files\Eclipse Adoptium\jdk-17...`).

### Problema: La aplicación web muestra advertencias sobre SQLite
**Solución**: Es el comportamiento esperado; en entorno web se activa automáticamente el mock SQLite (`frontend/src/db/database.ts`), permitiendo navegar sin caídas. La persistencia SQLite real opera de forma nativa en dispositivos Android e iOS.
