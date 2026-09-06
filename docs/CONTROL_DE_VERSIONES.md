# Control de Versiones y CI/CD — Metztli

> **Entregable de Desarrollo**: Control de versiones  
> **Proyecto**: Metztli — Plataforma de Salud Femenina Integral Offline-First  
> **Fecha**: Septiembre 2026  
> **Estado**: Configurado, Automatizado y Documentado  

---

## 1. Estrategia de Ramas y Flujo de Trabajo (Git Workflow)

El repositorio de Metztli adopta una estrategia basada en **GitHub Flow** optimizada para despliegues continuos y trazabilidad en equipos ágiles:

```
                  ┌──────────────┐
                  │ feature/xxxx ├──────────┐
                  └──────────────┘          │ Pull Request & Review
                                            ▼
═════════════════════════════════════════[main]═════════════════════════════► Releases
                                            ▲
                  ┌──────────────┐          │ Hotfix
                  │   fix/xxxx   ├──────────┘
                  └──────────────┘
```

1. **Rama Principal (`main`)**:
   - Rama protegida y siempre estable.
   - Todo cambio incorporado a `main` activa automáticamente el pipeline de compilación de APK en GitHub Actions.
2. **Ramas de Características (`feat/*`)**:
   - Ramas de corta duración creadas para el desarrollo de módulos específicos (ej. `feat/offline-sync`, `feat/creole-i18n`).
3. **Ramas de Corrección (`fix/*`)**:
   - Destinadas a resolver incidencias detectadas en pruebas o prebuilds nativos.

---

## 2. Convención de Commits Semánticos (Conventional Commits)

Los mensajes de confirmación siguen el estándar internacional de **Conventional Commits**:
`<tipo>(<ámbito opcional>): <descripción concisa>`

### Tipos Utilizados:
- **`feat`**: Incorporación de una nueva funcionalidad visible para la usuaria.
- **`fix`**: Corrección de un error o falla en código o dependencias.
- **`docs`**: Modificaciones o adiciones en documentación técnica.
- **`chore`**: Tareas de mantenimiento, actualización de dependencias o ajustes de configuración.
- **`refactor`**: Reestructuración de código sin alterar su comportamiento externo.

### Muestra del Historial Real del Proyecto:
```bash
* 150656c chore: bump version and fix vscode tailwind warning
* 73476d2 fix: remove missing icon assets to fix expo prebuild
* 1b22d7f fix: update github actions versions to v4
* 6ac0d96 feat: setup demo mode and github actions apk build
* 96f0366 Update README.md
* 92b070f feat: Arquitectura base Offline-First
```

---

## 3. Pipeline Automatizado de Integración Continua (CI/CD)

El archivo [`.github/workflows/build-apk.yml`](file:///c:/Metzlit_2.0/.github/workflows/build-apk.yml) orquesta la compilación automatizada en la nube cada vez que se produce un cambio en la rama `main`:

```yaml
name: Build Android APK

on:
  push:
    branches:
      - main
  workflow_dispatch: # Permite ejecución manual desde la consola de GitHub

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout repository
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 18

      - name: Setup Java (for Android build)
        uses: actions/setup-java@v4
        with:
          distribution: 'zulu'
          java-version: '17'

      - name: Install dependencies
        working-directory: ./frontend
        run: npm install

      - name: Expo Prebuild (Generate Android Project)
        working-directory: ./frontend
        run: npx expo prebuild --platform android --clean

      - name: Build APK (Release)
        working-directory: ./frontend/android
        run: ./gradlew assembleRelease

      - name: Upload APK Artifact
        uses: actions/upload-artifact@v4
        with:
          name: Metztli-App-APK
          path: frontend/android/app/build/outputs/apk/release/app-release.apk
```

### Beneficios del Pipeline Implementado:
1. **Compilación Agnóstica**: Asegura que el proyecto compile de manera limpia y reproducible en un entorno neutral Linux, descartando problemas de caché local.
2. **Generación Inmediata de Entregables**: Los evaluadores y usuarios piloto pueden descargar el binario `app-release.apk` directamente desde los artefactos de la acción sin necesidad de instalar SDKs de Android en sus computadoras.
3. **Mantenibilidad con Acciones Actualizadas**: Utiliza las versiones oficiales `v4` de GitHub Actions (`checkout@v4`, `setup-node@v4`, `setup-java@v4`, `upload-artifact@v4`).

---

## 4. Esquema de Versionado Semántico (SemVer)

El proyecto sigue el estándar **SemVer 2.0.0** (`MAJOR.MINOR.PATCH`):
- **MAJOR (2)**: Reescritura arquitectónica hacia una solución integral offline-first y soporte trilingüe.
- **MINOR (0)**: Módulos de Maternidad, Desmitificador, Tribu y Dashboard de Pareja.
- **PATCH (1)**: Ajustes de tipado TypeScript, compatibilidad con Expo SDK 51 y corrección de assets.

El número de versión se mantiene sincronizado entre:
- `frontend/package.json` (`"version": "2.0.1"`)
- `frontend/app.json` (`"version": "2.0.0"`)
- `backend/package.json` (`"version": "1.0.1"`)
