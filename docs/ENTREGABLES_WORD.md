# PROYECTO: METZTLI
## Informe Ejecutivo de Entregables de Desarrollo
**Plataforma de Salud Femenina Integral Intercultural (Offline-First)**  
**Costa Caribe de Nicaragua (Miskitu, Creole, Español)**  
**Repositorio Oficial en GitHub:** https://github.com/cuoconatwatah-create/Metztli  

---

### TABLA RESUMEN DE ENTREGABLES

| # | Entregable | Estado | Enlace Oficial en GitHub |
| :---: | :--- | :---: | :--- |
| 1 | README Técnico Maestro | Completado | https://github.com/cuoconatwatah-create/Metztli/blob/main/README.md |
| 2 | Diagrama de Base de Datos | Completado | https://github.com/cuoconatwatah-create/Metztli/blob/main/docs/DIAGRAMA_BASE_DATOS.md |
| 3 | Interfaz y Desarrollo | Completado | https://github.com/cuoconatwatah-create/Metztli/blob/main/docs/INTERFAZ_Y_DESARROLLO.md |
| 4 | Control de Versiones | Completado | https://github.com/cuoconatwatah-create/Metztli/blob/main/docs/CONTROL_DE_VERSIONES.md |
| 5 | Seguridad y Buenas Prácticas | Completado | https://github.com/cuoconatwatah-create/Metztli/blob/main/docs/SEGURIDAD_Y_BUENAS_PRACTICAS.md |
| 6 | Ejecución de la Solución | Completado | https://github.com/cuoconatwatah-create/Metztli/blob/main/docs/EJECUCION_DE_LA_SOLUCION.md |

---

### DETALLE DE CADA ENTREGABLE

#### 1. README Técnico Maestro
* **Enlace directo:** https://github.com/cuoconatwatah-create/Metztli/blob/main/README.md
* **Archivo local:** README.md
* **Descripción:**
  Documento central del proyecto que reúne la visión social, la arquitectura de alto nivel, el stack tecnológico con insignias oficiales (React Native 0.74, Expo SDK 51, TypeScript 5.3, SQLite, Supabase y expo-speech), los 7 módulos del sistema y la guía de inicio rápido.

---

#### 2. Diagrama de Base de Datos
* **Enlace directo:** https://github.com/cuoconatwatah-create/Metztli/blob/main/docs/DIAGRAMA_BASE_DATOS.md
* **Archivo local:** docs/DIAGRAMA_BASE_DATOS.md
* **Descripción:**
  Contiene el Diagrama Entidad-Relación (ER) completo e interactivo en sintaxis Mermaid, el diccionario de datos de las 9 entidades locales en SQLite (metztli.db), el esquema cloud en PostgreSQL/Supabase y el protocolo de sincronización offline-first con resolución idempotente de conflictos mediante local_uuid y bandera is_synced.

---

#### 3. Interfaz y Desarrollo
* **Enlace directo:** https://github.com/cuoconatwatah-create/Metztli/blob/main/docs/INTERFAZ_Y_DESARROLLO.md
* **Archivo local:** docs/INTERFAZ_Y_DESARROLLO.md
* **Código de pantallas:** frontend/src/screens/
* **Descripción:**
  Documenta el sistema de diseño enfocado en Next-Billion-Users (NBU), la paleta de tokens cromáticos (Avena Cálida #F4F1EA, Carmín Profundo #8B2635, Verde Bosque #2C3D30), la internacionalización trilingüe en tiempo real (Español, Miskitu y Creole) y el catálogo de las 16 pantallas funcionales, incluyendo el nuevo Módulo de Embarazo con semáforo clínico, asistencia de voz y triage Gestalt de revelación progresiva.

---

#### 4. Control de Versiones
* **Enlace directo:** https://github.com/cuoconatwatah-create/Metztli/blob/main/docs/CONTROL_DE_VERSIONES.md
* **Archivo local:** docs/CONTROL_DE_VERSIONES.md
* **Pipeline CI/CD:** https://github.com/cuoconatwatah-create/Metztli/blob/main/.github/workflows/build-apk.yml
* **Descripción:**
  Detalla la metodología de trabajo basada en GitHub Flow, la convención de Conventional Commits (feat, fix, chore), el versionado semántico (SemVer 2.0.1) y el pipeline automatizado de integración continua que compila y empaqueta el archivo APK instalable para Android en cada actualización a la rama main.

---

#### 5. Seguridad y Buenas Prácticas
* **Enlace directo:** https://github.com/cuoconatwatah-create/Metztli/blob/main/docs/SEGURIDAD_Y_BUENAS_PRACTICAS.md
* **Archivo local:** docs/SEGURIDAD_Y_BUENAS_PRACTICAS.md
* **Plantilla de entorno:** frontend/.env.example
* **Descripción:**
  Sustenta el enfoque de Privacy by Design: almacenamiento local estricto de registros médicos y de ciclo en SQLite, uso de hardware criptográfico seguro con expo-secure-store (Android Keystore e iOS Keychain), Row Level Security (RLS) en Supabase, consultas parametrizadas contra SQL Injection, canal seguro de auxilio SMS offline hacia la Casa Materna con minimización de datos y política de cero exposición de PII en el foro comunitario.

---

#### 6. Ejecución de la Solución
* **Enlace directo:** https://github.com/cuoconatwatah-create/Metztli/blob/main/docs/EJECUCION_DE_LA_SOLUCION.md
* **Archivo local:** docs/EJECUCION_DE_LA_SOLUCION.md
* **Descripción:**
  Guía práctica paso a paso para evaluar la solución en 5 modalidades: Demo Web inmediata (npm run web), ejecución en dispositivo móvil con Expo Go (npx expo start -c), compilación nativa de APK local (gradlew assembleRelease), descarga de APK desde GitHub Actions y despliegue del backend en Supabase. Incluye checklist de pruebas del módulo gestacional y resolución de problemas frecuentes.

---

### RECURSOS MULTIMEDIA Y EVALUACIÓN

* **Video Demostrativo / Pitch:**
  [PEGAR AQUÍ EL ENLACE DEL VIDEO - YouTube / Google Drive / Loom]

* **Presentación / Diapositivas:**
  [PEGAR AQUÍ EL ENLACE DE LA PRESENTACIÓN / PITCH DECK]

* **Descarga del APK de Android (Build Automático en CI/CD):**
  https://github.com/cuoconatwatah-create/Metztli/actions

* **Centro de Documentación Unificado:**
  https://github.com/cuoconatwatah-create/Metztli/blob/main/docs/README.md
