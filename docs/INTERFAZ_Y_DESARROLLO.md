# Interfaz y Desarrollo — Metztli

> **Entregable de Desarrollo**: Interfaz y desarrollo  
> **Proyecto**: Metztli — Plataforma de Salud Femenina Integral Offline-First  
> **Fecha**: Septiembre 2026  
> **Estado**: Diseñado, Implementado y Documentado  

---

## 1. Filosofía de Diseño UI/UX Intercultural

Metztli está diseñado para responder a la realidad sociocultural de la **Costa Caribe de Nicaragua**, donde convergen pueblos indígenas y afrodescendientes (Miskitus, Criollos, Mayangnas y Mestizos). El diseño se fundamenta en:

1. **Simplicidad y Accesibilidad Cognitiva**:
   - Elementos visuales claros, iconografía médica intuitiva y mínima sobrecarga de texto.
   - Apoyo con colores de advertencia universales (semáforo clínico verde, amarillo y rojo) para usuarias con niveles variados de alfabetización.
2. **Paleta de Identidad Lunar y Nocturna**:
   - Inspirada en la Luna (*Metztli* en náhuatl y su relación ancestral con los ciclos femeninos).
   - Fondos oscuros elegantes y de alto contraste que reducen el consumo de batería en pantallas OLED y facilitan la lectura en exteriores.
3. **Trilingüismo Nativo y en Tiempo Real**:
   - Soporte para **Español**, **Miskitu** y **Creole (Kriol)** con cambio inmediato desde cualquier pantalla.

---

## 2. Sistema de Diseño y Tokens

### 2.1 Paleta Cromática
| Token / Nombre | Valor HEX | Uso Semántico |
| :--- | :---: | :--- |
| `Dark Navy / Noche` | `#17153B` | Fondo principal de la aplicación y pantallas base. |
| `Deep Violet` | `#2E236C` | Contenedores secundarios y tarjetas de superficie. |
| `Mystic Purple` | `#433D8B` | Elementos de acento, bordes sutiles y chips inactivos. |
| `Lunar Lavender` | `#C8ACD6` | Textos secundarios, iconos suaves y fases lunares. |
| `Rose Crimson` | `#E84545` | Fase menstrual, alertas obstétricas críticas y botones de acción primaria. |
| `Golden Amber` | `#F5A623` | Fase fértil, precauciones y estado pendiente de sincronización. |
| `Emerald Jade` | `#2EC4B6` | Estado saludable, éxito de sincronización y mitigación de mitos. |

### 2.2 Tipografía y Jerarquía
- **Familia tipográfica**: Inter / San Francisco / Roboto (optimizadas para renderizado nativo de alto rendimiento).
- **Escalas**:
  - `Heading 1`: 28px — Bold (Títulos de pantalla y métricas principales).
  - `Heading 2`: 20px — SemiBold (Encabezados de sección y tarjetas).
  - `Body`: 15px — Regular / Medium (Textos informativos y descripciones de mitos).
  - `Caption`: 12px — Regular (Marcas de tiempo, estado de sincronización y pies de página).

---

## 3. Internacionalización (i18n)

La capa de internacionalización reside en `frontend/src/i18n/` y está construida sobre `i18next` y `react-i18next`:

```typescript
// Configuración en frontend/src/i18n/index.ts
i18n.use(initReactI18next).init({
  compatibilityJSON: 'v3',
  resources: {
    es: { translation: es },
    miskitu: { translation: miskitu },
    creole: { translation: creole },
  },
  lng: 'es',
  fallbackLng: 'es',
  interpolation: { escapeValue: false },
});
```

### Cobertura de Vocabulario Cultural:
- **Español**: Lenguaje empático, clínico y accesible.
- **Miskitu**: Terminología comunitaria validada (ej. *Kati* para luna/ciclo, *Blahkan sa* para sincronizado, *Blahkaia apu sa* para pendiente).
- **Creole**: Variedad lingüística caribeña nicaragüense (ej. *Waitin fi sync*, *Talk wid di docta*).

---

## 4. Arquitectura de Pantallas y Flujos de Navegación

El sistema cuenta con **16 pantallas funcionales** agrupadas por flujos:

```
                      ┌────────────────────────┐
                      │     WelcomeScreen      │
                      └───────────┬────────────┘
                                  ▼
                      ┌────────────────────────┐
                      │ LanguageSelectionScreen│
                      └───────────┬────────────┘
                                  ▼
                      ┌────────────────────────┐
                      │  StageSelectionScreen  │
                      └───────────┬────────────┘
                                  │
         ┌────────────────────────┼────────────────────────┐
         ▼                        ▼                        ▼
┌──────────────────┐    ┌──────────────────┐    ┌──────────────────┐
│   Modo Ciclo     │    │  Modo Embarazo   │    │ Modo Menopausia  │
│ (BrujulaLunar,   │    │(PregnancyTimeline│    │(Desmitificador,  │
│  DailyLogs)      │    │ KickCounter,     │    │ Sintomas)        │
│                  │    │ ObstetricAlarm)  │    │                  │
└────────┬─────────┘    └────────┬─────────┘    └────────┬─────────┘
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 ▼
                     ┌───────────────────────┐
                     │      HomeScreen       │
                     │  (Dashboard Central)  │
                     └───────────┬───────────┘
         ┌───────────────────────┼───────────────────────┐
         ▼                       ▼                       ▼
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   ForumScreen   │     │ DirectoryScreen │     │PartnerDashboard │
│ (Tribu Anónima) │     │ (Emergencias)   │     │ (Modo Pareja)   │
└─────────────────┘     └─────────────────┘     └─────────────────┘
```

### Catálogo Detallado de Pantallas:

1. **`WelcomeScreen.tsx`**:
   - Presentación inmersiva con metáfora visual de la luna.
   - Enrutamiento inicial hacia selección de idioma o dashboard directo si ya existe perfil.
2. **`LanguageSelectionScreen.tsx`**:
   - Selección inmediata entre Español, Miskitu y Creole mediante tarjetas visuales.
3. **`StageSelectionScreen.tsx`**:
   - Permite elegir la etapa de vida: *Ciclo Menstrual*, *Embarazo* o *Menopausia*, adaptando toda la aplicación de inmediato.
4. **`HomeScreen.tsx`**:
   - Núcleo de la experiencia de usuario. Muestra dinámicamente el estado actual del ciclo o semana gestacional, tarjetas de acción rápida y resúmenes de salud.
5. **`BrujulaLunarScreen.tsx`**:
   - Calendario circular menstrual. Registra nivel de flujo, escala analógica visual de dolor de cólicos (0 a 5), niveles de estrés y estados de ánimo.
6. **`PregnancyScreen.tsx` (Módulo de Embarazo NBU & Triage Offline)**:
   - **Dashboard Interno**: Calculadora visual de progreso ("Semana 28", "Faltan 12 sem.", barra al 70%, comparación contextual del tamaño del feto con frutas locales y fase de Tercer Trimestre).
   - **Voice-First CTA (`expo-speech`)**: Botón interactivo *"Escuchar consejo de hoy"* con síntesis de voz en español pausada y accesible para usuarias con menor alfabetización.
   - **Semáforo Materno Clínico**:
     - *Verde*: Todo bajo control (`#F2F6F3`, movimientos normales).
     - *Blanco*: Próximo control prenatal (`#FFFFFF`, cita en Casa Materna/C.S.).
     - *Rojo*: Señales de alerta (`#FDF2F4`, borde `#8B2635`), que oculta el dashboard y activa de inmediato la vista de Triage.
   - **Vista de Triage de Emergencias**: Acordeón interactivo con el principio Gestalt de *Revelación Progresiva* para 4 síntomas críticos (Sangrado vaginal, Fiebre alta, Preeclampsia/Lucecitas, Falta de movimientos).
   - **Acción Médica y Auxilio SMS**: Al expandir, ofrece el botón *"Escuchar qué hacer"* (lectura por voz del protocolo médico) y el *"Botón de Auxilio"* que abre el SMS nativo (`sms:+50588880000?body=...`) hacia la partera comunitaria.
7. **`PregnancyTimelineScreen.tsx`**:
   - Visualización gráfica del desarrollo fetal semana a semana con hitos biomédicos y recomendaciones de nutrición.
8. **`KickCounterScreen.tsx`**:
   - Monitoreo obstétrico de movimientos fetales con botón táctil de alta sensibilidad, cronómetro y cálculo automático de frecuencia saludable.
8. **`ObstetricAlarmScreen.tsx`**:
   - Semáforo obstétrico con detección de signos de alarma (sangrado vaginal, dolor de cabeza intenso con lucecitas/tinnitus, fiebre, hinchazón repentina).
   - Acceso telefónico directo de un toque hacia el hospital más cercano.
9. **`DesmitificadorScreen.tsx`**:
   - Tarjetas dinámicas que contrastan mitos populares de la región con hechos médicos respaldados.
10. **`DirectoryScreen.tsx`**:
    - Directorio telefónico de centros de salud, ambulancias y policía por municipio (Bluefields, Bilwi, Laguna de Perlas, Corn Island, etc.).
11. **`ForumScreen.tsx`**:
    - Foro anónimo comunitario "Tribu". Permite crear publicaciones locales sin red, ver indicadores visuales de sincronización (`Pendiente` / `Sincronizado`) y filtrar por categoría.
12. **`TribuCodeScreen.tsx`**:
    - Generación y compartición de código seguro de vinculación para la pareja o red de apoyo.
13. **`PartnerDashboardScreen.tsx` y `PartnerMainScreen.tsx`**:
    - Interfaz adaptada para el acompañante masculino o familiar, con pautas de cuidados y empatía según la etapa en la que se encuentra la usuaria.
14. **`AuthScreen.tsx`**:
    - Inicio de sesión y registro opcional para sincronización multiespacio.

---

## 5. Componentes Reutilizables de Interfaz

- **`CycleWheel.tsx`**: Representación gráfica circular de las fases del ciclo (Menstrual, Folicular, Ovulatoria, Lútea).
- **`AlarmCard.tsx`**: Tarjeta semafórica interactiva con iconografía Lucide, nivel de urgencia y llamada directa.
- **`EmergencyContactCard.tsx`**: Componente de directorio con botón integrado `Linking.openURL('tel:...')`.
- **`SyncStatusBadge.tsx`**: Indicador visual que informa a la usuaria si su información se encuentra protegida en el dispositivo o replicada en la nube.
