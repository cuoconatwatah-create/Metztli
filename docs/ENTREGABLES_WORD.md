# PROYECTO: METZTLI
## Entregables de Desarrollo — Pitch & Evaluación
**Plataforma de Salud Femenina Integral Intercultural (Offline-First)**  
**Costa Caribe de Nicaragua (Miskitu, Creole, Español)**  
**Repositorio Oficial en GitHub:** https://github.com/cuoconatwatah-create/Metztli  

---

### TABLA RESUMEN DE ENTREGABLES (RÚBRICA DE DESARROLLO)

| # | Entregable Oficial | Descripción Rápida | Enlace en GitHub / Recurso |
| :-: | :--- | :--- | :--- |
| **1** | **README** | Propósito del proyecto, instalación y ejecución. | https://github.com/cuoconatwatah-create/Metztli/blob/main/README.md |
| **2** | **Control de Versiones Git y GitHub** | Evidencia de repositorio, historial de commits y ramas colaborativas. | https://github.com/cuoconatwatah-create/Metztli/blob/main/docs/CONTROL_DE_VERSIONES.md |
| **3** | **Guía de Usuario Rápida** | Instrucciones simples para que cualquier persona use la solución. | https://github.com/cuoconatwatah-create/Metztli/blob/main/docs/GUIA_DE_USUARIO_RAPIDA.md |
| **4** | **Diseño de la Interfaz (3 pantallas)** | Implementación en código y navegación de al menos 3 pantallas clave. | https://github.com/cuoconatwatah-create/Metztli/blob/main/docs/INTERFAZ_Y_DESARROLLO.md |
| **5** | **Funcionalidades del Reto** | Funciones que atienden la problemática de salud en la Costa Caribe. | https://github.com/cuoconatwatah-create/Metztli/blob/main/docs/FUNCIONALIDADES_DEL_RETO.md |
| **6** | **Diagramación de la Base de Datos** | Modelo gráfico ER de tablas, relaciones y estructura de datos. | https://github.com/cuoconatwatah-create/Metztli/blob/main/docs/DIAGRAMA_BASE_DATOS.md |
| **7** | **Video Demo** | Grabación corta mostrando el sistema en funcionamiento. | [PEGAR ENLACE DEL VIDEO AQUÍ] |

---

### DETALLE DE CADA ENTREGABLE

#### 1. README
* **Criterio Evaluado:** Documento inicial que explique de forma breve el propósito del proyecto, cómo instalarlo y ejecutarlo.
* **Enlace directo en GitHub:** https://github.com/cuoconatwatah-create/Metztli/blob/main/README.md
* **Archivo local:** `README.md`
* **Contenido Destacado:**
  - **Propósito:** Metztli es una solución de salud sexual, reproductiva y materna diseñada para la Costa Caribe de Nicaragua (RACCN y RACCS), resolviendo la falta de conectividad y barreras lingüísticas.
  - **Instalación:** Clonación rápida del repositorio (`git clone`) e instalación de dependencias (`npm install`).
  - **Ejecución:** Comandos para Demo Web inmediata (`npm run web`), prueba móvil con Expo Go (`npx expo start -c`) y compilación nativa de APK Android (`./gradlew assembleRelease`).
  - **Stack Tecnológico:** React Native 0.74, Expo SDK 51, TypeScript 5.3, SQLite embebido, Supabase y expo-speech.

---

#### 2. Control de Versiones Git y GitHub
* **Criterio Evaluado:** Evidencia del uso de repositorio con historial de cambios, ramas y commits, mostrando buenas prácticas colaborativas.
* **Enlace directo en GitHub:** https://github.com/cuoconatwatah-create/Metztli/blob/main/docs/CONTROL_DE_VERSIONES.md
* **Repositorio activo:** https://github.com/cuoconatwatah-create/Metztli
* **Historial de Commits:** https://github.com/cuoconatwatah-create/Metztli/commits/main
* **Pipeline Automatizado de CI/CD:** https://github.com/cuoconatwatah-create/Metztli/blob/main/.github/workflows/build-apk.yml
* **Contenido Destacado:**
  - Adopción de la metodología **GitHub Flow** con ramas temáticas (`feat/`, `fix/`) integradas a `main`.
  - Historial limpio con el estándar internacional de **Conventional Commits** (`feat:`, `fix:`, `chore:`, `docs:`).
  - Pipeline de Integración Continua (CI/CD) con GitHub Actions que compila y genera automáticamente el archivo instalable `.apk` en cada push.

---

#### 3. Guía de Usuario Rápida
* **Criterio Evaluado:** Instrucciones simples y claras para que cualquier usuario pueda utilizar la solución desarrollada.
* **Enlace directo en GitHub:** https://github.com/cuoconatwatah-create/Metztli/blob/main/docs/GUIA_DE_USUARIO_RAPIDA.md
* **Archivo local:** `docs/GUIA_DE_USUARIO_RAPIDA.md`
* **Contenido Destacado:**
  - **Paso 1: Bienvenida e Idioma:** Cómo elegir entre Español, Miskitu y Creole en un toque.
  - **Paso 2: Selección de Etapa:** Configurar Ciclo Menstrual, Embarazo o Menopausia.
  - **Paso 3: Brújula Lunar:** Cómo visualizar las fases y registrar flujo, cólicos y estado anímico en el teléfono.
  - **Paso 4: Módulo de Embarazo:** Cómo consultar la semana 28, escuchar el consejo del día con voz y entender el semáforo.
  - **Paso 5: Triage y Auxilio SMS:** Cómo consultar síntomas críticos y enviar un SMS automático de emergencia a la partera sin internet.
  - **Paso 6: Directorio y Desmitificador:** Cómo consultar hospitales locales y desmentir tabúes comunitarios.

---

#### 4. Diseño de la Interfaz (3 Pantallas Principales)
* **Criterio Evaluado:** Implementación básica en código de la interfaz gráfica del proyecto, mostrando la navegación entre al menos tres pantallas principales con coherencia en el diseño y usabilidad.
* **Enlace directo en GitHub:** https://github.com/cuoconatwatah-create/Metztli/blob/main/docs/INTERFAZ_Y_DESARROLLO.md
* **Código de pantallas:** `frontend/src/screens/`
* **Las 3 Pantallas Principales Demostradas:**
  1. **Pantalla Principal y Brújula Lunar (`HomeScreen.tsx` / `BrujulaLunarScreen.tsx`):**
     - Rueda visual interactiva que vincula los ciclos reproductivos con las fases lunares.
     - Registro táctil intuitivo de síntomas íntimos con almacenamiento local privado.
  2. **Módulo de Embarazo y Triage de Emergencias (`PregnancyScreen.tsx`):**
     - Calculadora visual de progreso (Semana 28 / Faltan 12 semanas) y barra contextual.
     - Semáforo materno tripartito (Verde: Todo bien, Blanco: Citas, Rojo: Señales de alerta).
     - Acordeón de triage con principio Gestalt de revelación progresiva y botón de auxilio SMS.
  3. **Directorio Comunitario y Desmitificador (`DirectoryScreen.tsx` / `DesmitificadorScreen.tsx`):**
     - Directorio de emergencias filtrable por municipios de la Costa Caribe con botón de llamada directa.
     - Tarjetas interactivas que contrastan mitos populares con hechos médicos científicos.
* **Coherencia Visual y Tokens:** Diseñado para Next-Billion-Users con áreas táctiles de 48-56px, Avena Cálida (`#F4F1EA`), Carmín Profundo (`#8B2635`) y Verde Bosque (`#2C3D30`).

---

#### 5. Funcionalidades del Reto
* **Criterio Evaluado:** Listado y demostración de las funciones principales que atienden la problemática planteada.
* **Enlace directo en GitHub:** https://github.com/cuoconatwatah-create/Metztli/blob/main/docs/FUNCIONALIDADES_DEL_RETO.md
* **Archivo local:** `docs/FUNCIONALIDADES_DEL_RETO.md`
* **Problemática que resuelve en la Costa Caribe de Nicaragua:**
  1. **Falta de Conectividad a Internet:** Arquitectura 100% Offline-First con base de datos SQLite embebida que opera sin señal ni datos móviles.
  2. **Barreras Lingüísticas Indígenas y Afrodescendientes:** Soporte trilingüe nativo (Español, Miskitu y Creole/Kriol) con cambio dinámico.
  3. **Barreras de Alfabetización:** Asistencia de voz inclusiva (`expo-speech`) que narra consejos gestacionales y directivas médicas en voz alta.
  4. **Mortalidad Materna y Emergencias Obstétricas:** Semáforo de riesgo y botón de auxilio SMS celular directo hacia la partera de la Casa Materna comunitaria.
  5. **Desinformación y Tabúes Culturales:** Desmitificador intercultural validado clínicamente.
  6. **Privacidad Estricta de la Mujer:** Privacy-by-Design sin almacenamiento de PII en la nube y anonimato total en el foro comunitario.

---

#### 6. Diagramación de la Base de Datos
* **Criterio Evaluado:** Modelo gráfico que muestre las tablas, relaciones y estructura de los datos utilizados por el proyecto.
* **Enlace directo en GitHub:** https://github.com/cuoconatwatah-create/Metztli/blob/main/docs/DIAGRAMA_BASE_DATOS.md
* **Archivo local:** `docs/DIAGRAMA_BASE_DATOS.md`
* **Contenido Destacado:**
  - **Diagrama Entidad-Relación (ER)** completo en sintaxis Mermaid que modela tanto la base local SQLite como la nube Supabase.
  - **Estructura de Datos Local (SQLite - `metztli.db`):** 9 tablas detalladas (`user_profile`, `cycles`, `daily_logs`, `kick_counter_logs`, `user_cycle_logs`, `directory_contacts`, `forum_posts`, `myths`, `offline_faqs`).
  - **Diccionario de datos exhaustivo:** Tipos de campos, restricciones (`CHECK`, `UNIQUE`, `PRIMARY KEY`), valores por defecto y propósitos de uso.
  - **Protocolo de Sincronización Offline:** Manejo de colisiones idempotentes con `local_uuid` y bandera `is_synced`.

---

#### 7. Video Demo
* **Criterio Evaluado:** Grabación corta mostrando el sistema en funcionamiento.
* **Enlace de la Grabación:**
  `[PEGAR AQUÍ EL ENLACE DEL VIDEO DEMO - YouTube / Google Drive / Loom / Vimeo]`
* **Contenido recomendado en la grabación (2 a 3 minutos):**
  1. Navegación fluida entre las 3 pantallas principales.
  2. Demostración del cambio de idioma a Miskitu y Creole en tiempo real.
  3. Demostración de reproducción de voz con el botón *"Escuchar consejo de hoy"*.
  4. Demostración de la vista de Triage de Emergencias y activación del botón de auxilio SMS.
