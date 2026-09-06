# Metztli — Salud Femenina Integral Intercultural (Offline-First)

<div align="center">

![Metztli Version](https://img.shields.io/badge/Versi%C3%B3n-2.0.1-6C4AB6?style=for-the-badge)
![React Native](https://img.shields.io/badge/React_Native-0.74-61DAFB?style=for-the-badge&logo=react&logoColor=black)
![Expo SDK](https://img.shields.io/badge/Expo_SDK-51.0-000020?style=for-the-badge&logo=expo&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5.3-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![SQLite](https://img.shields.io/badge/SQLite-Offline--First-003B57?style=for-the-badge&logo=sqlite&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-Cloud_Sync-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)
![CI/CD](https://img.shields.io/badge/CI%2FCD-GitHub_Actions_APK-2088FF?style=for-the-badge&logo=githubactions&logoColor=white)

</div>

---

## 🌙 Acerca de Metztli

**Metztli** es una solución tecnológica de salud sexual, reproductiva y comunitaria diseñada especialmente para mujeres y personas gestantes en la **Costa Caribe de Nicaragua** (Regiones Autónomas RACCN y RACCS: Bluefields, Bilwi/Puerto Cabezas, Waspam, Corn Island y comunidades rurales circundantes).

El proyecto aborda los desafíos críticos de conectividad limitada, barreras lingüísticas y desinformación médica a través de tres pilares fundamentales:
1. **Arquitectura 100% Offline-First**: Operatividad completa sin conexión a Internet mediante base de datos embebida SQLite local y cola de sincronización resiliente cuando se restablece la red.
2. **Interculturalidad Trilingüe**: Soporte nativo de idiomas locales con cambio dinámico entre **Español**, **Miskitu** y **Creole (Kriol)**.
3. **Privacidad y Protección Médica Estricta**: Almacenamiento local seguro de registros íntimos (Privacy by Design), anonimato en dudas comunitarias y cero exposición de PII.

---

## 🧭 Módulos y Funcionalidades Principales

```
                               ┌─────────────────────────────┐
                               │         Metztli         │
                               └──────────────┬──────────────┘
            ┌──────────────────┬──────────────┼──────────────────┬──────────────────┐
            ▼                  ▼              ▼                  ▼                  ▼
     ┌──────────────┐   ┌──────────────┐┌──────────────┐  ┌──────────────┐   ┌──────────────┐
     │Brújula Lunar │   │   Maternidad ││Desmitificador│  │  Directorio  │   │     Tribu    │
     │  (Ciclos y   │   │  (Pataditas, ││Intercultural │  │Comunitario de│   │    (Foro     │
     │  Síntomas)   │   │  Semáforo)   ││  Científico  │  │  Emergencia  │   │   Anónimo)   │
     └──────────────┘   └──────────────┘└──────────────┘  └──────────────┘   └──────────────┘
            │                                                            │
            └─────────► Modo Acompañante / Pareja (Tribu Code) ◄─────────┘
```

- 🩸 **Brújula Lunar**: Calendario ovulatorio y menstrual con rueda visual lunar, registro diario de flujo, cólicos, nivel de estrés, emociones y notas privadas.
- 🤰 **Módulo de Maternidad y Embarazo (NBU & Triage Offline)**:
  - **Dashboard Gestacional de Progreso**: Calculadora visual con tiempo actual ("Semana 28"), cuenta regresiva ("Faltan 12 sem."), barra de progreso y comparativa de desarrollo fetal.
  - **Asistencia de Voz Inclusiva (`expo-speech`)**: Call to Action de audio "Escuchar consejo de hoy" con síntesis de voz en español pausada para usuarias con distintos niveles de alfabetización.
  - **Semáforo Clínico de Estado Materno**: Tres tarjetas visuales (Verde: Todo bajo control, Blanco: Próximo control prenatal, Rojo: Señales de alerta urgente).
  - **Vista de Triage de Emergencias (Gestalt)**: Acordeón de revelación progresiva para síntomas críticos (hemorragias, fiebre alta, sospecha de preeclampsia, cese de movimientos fetales).
  - **Canal de Auxilio SMS Nativo**: Botón de auxilio con enlace directo (`href="sms:+50588880000?body=..."`) a la Casa Materna/partera comunitaria sin requerir conexión a internet.
- 💡 **Desmitificador Intercultural**: Mitos y realidades locales sobre menstruación, fertilidad, embarazo y menopausia, validados con evidencia médica y contextualizados culturalmente.
- 🚨 **Directorio Comunitario de Emergencias**: Directorio offline de centros de salud, hospitales (e.g. Hospital Regional Ernesto Sequeira, Hospital Nuevo Amanecer), comisarías y brigadas comunitarias con llamada directa de un toque.
- 💬 **Tribu Comunitaria (Foro Anónimo)**: Espacio seguro donde las usuarias publican inquietudes con seudónimos aleatorios; sincroniza cuando detecta conectividad.
- 🤝 **Modo Pareja / Acompañante**: Dashboard educativo para que la pareja o acompañante comprenda la etapa actual, consejos de apoyo emocional y alertas clave mediante un código de enlace seguro.
- 🌿 **Modo Menopausia**: Seguimiento especializado para la etapa de climaterio y post-menopausia.

---

## 🛠️ Stack Tecnológico

| Capa | Tecnología | Propósito |
| :--- | :--- | :--- |
| **Framework Móvil** | React Native 0.74 + Expo SDK 51 | Desarrollo multiplataforma optimizado para Android y Web |
| **Lenguaje** | TypeScript 5.3 (Strict Mode) | Tipado estricto para confiabilidad médica y mantenibilidad |
| **Estilos y UI** | NativeWind (Tailwind CSS v3) + Lucide Icons | Interfaz moderna, accesible, responsiva y temática oscura/lunar |
| **Accesibilidad de Voz** | `expo-speech` (~12.0.2) | Síntesis de voz offline para consejos gestacionales y triage NBU |
| **Base de Datos Local** | `expo-sqlite` (~14.0.0) | Almacenamiento offline-first persistente en el dispositivo |
| **Capa de Criptografía** | `expo-secure-store` (~13.0.0) | Almacenamiento seguro de tokens y credenciales (Keystore/Keychain) |
| **Backend & Cloud** | Supabase (PostgreSQL + RLS) | Persistencia comunitaria, autenticación anónima y sincronización |
| **Internacionalización** | `i18next` + `react-i18next` | Soporte trilingüe en tiempo real: Español, Miskitu, Creole |
| **Conectividad** | `@react-native-community/netinfo` | Detección de red en tiempo real y disparo de sincronizaciones |
| **CI / CD** | GitHub Actions | Compilación y empaquetado automatizado de APKs para Android |

---

## 📂 Estructura del Repositorio

```
Metztli_2.0/
├── .github/
│   └── workflows/
│       └── build-apk.yml           # Pipeline de CI/CD para compilar APK en GitHub Actions
├── backend/
│   └── supabase/
│       └── migrations/
│           ├── 20240101000000_init.sql   # Esquema PostgreSQL, RLS y tablas base
│           └── 20240101000001_myths.sql  # Mitos interculturales y políticas de lectura
├── docs/                           # Documentación formal de entregables
│   ├── README.md                   # Índice general de documentación
│   ├── SEGURIDAD_Y_BUENAS_PRACTICAS.md # Entregable: Seguridad, RLS, cifrado y privacidad
│   ├── EJECUCION_DE_LA_SOLUCION.md     # Entregable: Guía completa de ejecución y APK
│   ├── DIAGRAMA_BASE_DATOS.md          # Entregable: Diagrama ER Mermaid y esquemas
│   ├── INTERFAZ_Y_DESARROLLO.md        # Entregable: UI/UX, arquitectura de pantallas
│   └── CONTROL_DE_VERSIONES.md         # Entregable: Git flow, SemVer y CI/CD
├── frontend/
│   ├── assets/                     # Iconos y splash screens de la aplicación
│   ├── src/
│   │   ├── components/             # Componentes reutilizables (AlarmCard, Wheel, etc.)
│   │   ├── data/                   # Datos locales y preguntas frecuentes
│   │   ├── db/                     # Base de datos SQLite, migraciones y sincronizador
│   │   │   ├── database.ts         # Inicialización, tablas y consultas parametrizadas
│   │   │   ├── seedData.ts         # Datos semilla (contactos de Bluefields/Bilwi)
│   │   │   └── sync.ts             # Motor de sincronización con Supabase
│   │   ├── hooks/                  # Custom hooks (useCycleCalculator, useSyncQueue, etc.)
│   │   ├── i18n/                   # Localización (es.json, miskitu.json, creole.json)
│   │   ├── lib/                    # Cliente Supabase seguro con SecureStore
│   │   ├── screens/                # Pantallas principales del sistema
│   │   └── types/                  # Definiciones de tipos TypeScript
│   ├── .env.example                # Plantilla de variables de entorno seguras
│   ├── app.json                    # Configuración de Expo
│   ├── eas.json                    # Perfiles de compilación EAS Build
│   └── package.json                # Dependencias y scripts de ejecución
└── README.md                       # README Técnico Principal (Este documento)
```

---

## 🚀 Inicio Rápido

### 1. Instalación
```bash
git clone https://github.com/cuoconatwatah-create/Metztli.git
cd Metztli/frontend
npm install
cp .env.example .env
```

### 2. Ejecutar Demo Web Instantánea (Sin emulador)
```bash
npm run web
```
Abre automáticamente en `http://localhost:8081`.

### 3. Ejecutar en Dispositivo Móvil (Expo Go)
```bash
npx expo start -c
```
Escanea el código QR con la app **Expo Go** en Android.

### 4. Compilar APK Android
```bash
npx expo prebuild --platform android --clean
cd android && ./gradlew assembleRelease
```
El APK se genera en: `frontend/android/app/build/outputs/apk/release/app-release.apk`.

Para instrucciones completas de backend, cloud builds y depuración, consulta la [Guía de Ejecución de la Solución](file:///c:/Metzlit_2.0/docs/EJECUCION_DE_LA_SOLUCION.md).

---

## 📚 Documentación de Entregables

Para consultar en profundidad los entregables evaluados, dirígete a:

1. 🔒 **[Seguridad y Buenas Prácticas](file:///c:/Metzlit_2.0/docs/SEGURIDAD_Y_BUENAS_PRACTICAS.md)**: Privacidad médica, SecureStore, Row Level Security (RLS) y mitigación de SQL Injection.
2. ⚙️ **[Ejecución de la Solución](file:///c:/Metzlit_2.0/docs/EJECUCION_DE_LA_SOLUCION.md)**: Guía de despliegue paso a paso, web preview, emulador y artefactos de compilación.
3. 🗄️ **[Diagrama de Base de Datos](file:///c:/Metzlit_2.0/docs/DIAGRAMA_BASE_DATOS.md)**: Diagrama ER interactivo en Mermaid, modelo SQLite local y réplica en Supabase.
4. 🎨 **[Interfaz y Desarrollo](file:///c:/Metzlit_2.0/docs/INTERFAZ_Y_DESARROLLO.md)**: Guía de diseño, accesibilidad, sistema trilingüe y catálogo de pantallas.
5. 🌿 **[Control de Versiones](file:///c:/Metzlit_2.0/docs/CONTROL_DE_VERSIONES.md)**: Estrategia de ramas, SemVer, Conventional Commits y CI/CD con GitHub Actions.

---

## 👥 Equipo y Créditos
- **Metztli Team — Costa Caribe de Nicaragua**
- Licencia: Código de impacto social y comunitario.
