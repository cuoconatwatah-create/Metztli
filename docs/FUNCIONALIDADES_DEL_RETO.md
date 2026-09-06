# Funcionalidades del Reto — Metztli

> **Entregable de Desarrollo**: Funcionalidades del Reto  
> **Proyecto**: Metztli — Salud Femenina Integral Intercultural (Offline-First)  
> **Propósito**: Listado y demostración de las funciones principales que atienden directamente la problemática planteada para la Costa Caribe de Nicaragua.  

---

## 1. La Problemática en la Costa Caribe de Nicaragua

Las Regiones Autónomas de la Costa Caribe (RACCN y RACCS) presentan desafíos estructurales únicos:
1. **Conectividad a Internet casi nula o intermitente** en comunidades rurales a lo largo de los ríos y litorales (Waspam, Laguna de Perlas, desembocadura del Río Grande, Prinzapolka).
2. **Diversidad lingüística e intercultural**: Poblaciones que se comunican principalmente en **Miskitu** o **Creole (Kriol)**, marginadas por aplicaciones médicas que únicamente operan en español estándar.
3. **Brechas de alfabetización digital y convencional**: Dificultades para asimilar textos clínicos extensos o pantallas complejas.
4. **Mortalidad materna prevenible**: Falta de identificación temprana de señales de alarma obstétricas (preeclampsia, hemorragias) y demoras críticas en el traslado hacia las Casas Maternas o Centros de Salud.
5. **Estigma y tabúes**: Mitos arraigados en torno a la menstruación y la sexualidad que desincentivan la búsqueda de atención oportuna.

---

## 2. Matriz de Funcionalidades vs. Problemática

| Desafío en Territorio | Funcionalidad Clave de Metztli | Módulo / Pantalla en la App | Impacto Social y Clínico |
| :--- | :--- | :--- | :--- |
| **Falta de Conectividad (Sin Internet)** | **Arquitectura 100% Offline-First** con SQLite local (`metztli.db`) | Toda la aplicación (`frontend/src/db/`) | La app funciona en su totalidad sin señal de red ni consumo de datos móviles. |
| **Barrera de Idioma** | **Internacionalización Trilingüe Dinámica** (Español, Miskitu, Creole) | Selector en barra superior (`frontend/src/i18n/`) | Empoderamiento en lengua originaria; inclusión de pueblos indígenas y afrodescendientes. |
| **Baja Alfabetización** | **Asistencia de Voz Inclusiva (Voice-First)** mediante `expo-speech` | Botón *"Escuchar consejo de hoy"* en `PregnancyScreen.tsx` | Permite a cualquier persona escuchar recomendaciones médicas de viva voz a ritmo pausado. |
| **Riesgo Obstétrico / Urgencias** | **Semáforo Clínico de Estado Materno y Triage** | Módulo de Embarazo (`PregnancyScreen.tsx`) | Código visual universal (Verde, Blanco, Rojo) que guía a la gestante ante síntomas de peligro. |
| **Falta de Red en Emergencias** | **Botón de Auxilio SMS Celular Directo** a la Casa Materna | Acordeón de Triage en `PregnancyScreen.tsx` | Envía un SMS nativo preconfigurado a la partera mediante red celular GSM sin saldo de internet. |
| **Tabúes y Desinformación** | **Desmitificador Intercultural Científico** | `DesmitificadorScreen.tsx` | Contrapone mitos populares locales con respuestas médicas y biológicas claras y comprensibles. |
| **Emergencias Médicas Aisladas** | **Directorio Telefónico Comunitario Offline** | `DirectoryScreen.tsx` | Acceso inmediato a números de hospitales y ambulancias de Bluefields, Bilwi, Waspam, etc. |
| **Desconocimiento del Ciclo** | **Brújula Lunar** con Rueda Visual y Registro de Síntomas | `BrujulaLunarScreen.tsx` | Educación sobre el ciclo menstrual y fertilidad vinculado con los ciclos de la naturaleza. |
| **Falta de Apoyo Familiar** | **Modo Pareja / Acompañante** con Código de Tribu | `PartnerDashboardScreen.tsx` y `TribuCodeScreen.tsx` | Involucra a la pareja o familia en el cuidado, reduciendo la carga y la soledad de la gestante. |
| **Vulnerabilidad de Datos Íntimos** | **Privacy by Design y Cero PII** | SQLite Local + `expo-secure-store` | Los datos íntimos nunca se venden ni se suben a la nube sin consentimiento de la usuaria. |

---

## 3. Demostración en Código de las Funcionalidades

### 3.1 Operatividad 100% Offline
La aplicación inicializa una base de datos embebida en el dispositivo de la usuaria:
```typescript
// frontend/src/db/database.ts
db = await SQLite.openDatabaseAsync('metztli.db');
```
Todos los registros de síntomas, notas privadas y datos de ciclo se procesan en milisegundos sin requerir internet.

### 3.2 Asistencia por Voz para Accesibilidad Universal (NBU)
Rompe la barrera de la lectura médica mediante síntesis de voz en el dispositivo:
```typescript
// frontend/src/screens/PregnancyScreen.tsx
Speech.speak(tipMessage, {
  language: 'es-ES',
  rate: 0.92, // Pausado y claro
});
```

### 3.3 Auxilio SMS Nativo sin Cobertura de Datos
En situaciones donde la conectividad 3G/4G no existe pero hay señal de telefonía básica, el enlace nativo dispara la mensajería celular pre-cargada:
```typescript
// frontend/src/screens/PregnancyScreen.tsx
const smsUrl = `sms:+50588880000?body=${encodeURIComponent(symptom.smsMessage)}`;
await Linking.openURL(smsUrl);
```

### 3.4 Inclusión Lingüística en Tiempo Real
Permite alternar entre lenguas con un solo toque:
```typescript
// frontend/src/i18n/index.ts
i18n.use(initReactI18next).init({
  resources: { es, miskitu, creole },
  lng: 'es',
});
```
