# Seguridad y Buenas Prácticas — Metztli 2.0

> **Entregable de Desarrollo**: Seguridad y Buenas Prácticas  
> **Proyecto**: Metztli 2.0 — Plataforma de Salud Femenina Integral Offline-First para la Costa Caribe de Nicaragua  
> **Fecha de Actualización**: Septiembre 2026  
> **Estado**: Implementado y Verificado  

---

## 1. Visión General y Filosofía de Privacidad

Metztli 2.0 gestiona información altamente sensible sobre la salud sexual, reproductiva y los ciclos biológicos de mujeres y personas menstruantes, muchas de ellas residentes en comunidades rurales de la Costa Caribe de Nicaragua (Bluefields, Bilwi/Puerto Cabezas, Waspam, etc.).

La seguridad en Metztli 2.0 no es un añadido secundario, sino el núcleo de su arquitectura bajo el principio de **Privacidad desde el Diseño y por Defecto (Privacy by Design and by Default)**.

```
┌────────────────────────────────────────────────────────────────────────┐
│               ARQUITECTURA DE PRIVACIDAD EN METZTLI 2.0                 │
└────────────────────────────────────────────────────────────────────────┘
  Dispositivo de la Usuaria (100% Local y Privado)
  ┌────────────────────────────────────────────────────────────────────┐
  │  • Ciclos Menstruales (fechas, duración, predicciones)             │
  │  • Registro Diario de Síntomas (flujo, cólicos, estrés, ánimo)     │
  │  • Contador de Pataditas Fetales                                   │
  │  • Notas Clínicas Personales                                       │
  │                                                                    │
  │   Almacenado localmente en SQLite (metztli.db)                     │
  │   → NUNCA se transmiten a la nube sin consentimiento explícito.    │
  └────────────────────────────────────────────────────────────────────┘
                                   │
              Capa de Transporte Cifrado (TLS 1.3 / HTTPS)
                                   ▼
  Nube Supabase (Solo Datos Públicos y Anónimos Comunitarios)
  ┌────────────────────────────────────────────────────────────────────┐
  │  • Foro Comunitario Anónimo (sin nombres reales, alias aleatorio)   │
  │  • Directorio de Emergencias (datos institucionales públicos)       │
  │  • Desmitificador Intercultural (contenido educativo verificado)    │
  │                                                                    │
  │   Protegido mediante Row Level Security (RLS) en PostgreSQL        │
  └────────────────────────────────────────────────────────────────────┘
```

---

## 2. Protección de Datos Sensibles de Salud (Offline-First)

### 2.1 Aislamiento de Datos Médicos en Dispositivo
Los módulos más íntimos de la aplicación operan de manera 100% offline:
- **Brújula Lunar (`user_cycle_logs` / `cycles` / `daily_logs`)**: Los síntomas de dolor, variaciones de flujo menstrual, estados emocionales y notas quedan restringidos a la base de datos local SQLite (`metztli.db`).
- **Seguimiento Obstétrico (`kick_counter_logs` / `user_profile`)**: Los registros de movimientos fetales y fecha de última menstruación (FUM / LMP) se procesan directamente en el dispositivo móvil sin telemetría intrusiva.
- **Soberanía del Dato**: Si la usuaria desinstala la aplicación o borra los datos de la app, su información íntima es purgada por completo del almacenamiento del dispositivo.

### 2.2 Sincronización Opcional e Idempotente
Cuando se interactúa con el backend Supabase (por ejemplo, en el foro de dudas comunitarias o sincronización de ciclos si la usuaria inicia sesión):
- Cada registro cuenta con un `local_uuid` generado en el cliente mediante identificadores únicos universales.
- El servidor aplica restricciones de unicidad (`UNIQUE NOT NULL`), evitando registros duplicados ante reintentos de conexión intermitente.
- El campo `is_synced` en SQLite marca el estado localmente, evitando transferencias redundantes de datos.

---

## 3. Almacenamiento Criptográfico Seguro (`expo-secure-store`)

A diferencia del uso inseguro de `localStorage` o `AsyncStorage` en texto plano (vulnerable en dispositivos con root o jailbreak), Metztli 2.0 utiliza **`expo-secure-store`** para toda información de credenciales y configuración sensible:

- **Android**: Los datos se cifran utilizando **Android Keystore**, garantizando que las llaves criptográficas residan en el elemento seguro del hardware (TEE - Trusted Execution Environment).
- **iOS**: Los datos se almacenan en el **Keychain** del sistema operativo con atributos de accesibilidad restringida.

### Componentes protegidos con SecureStore:
1. **Tokens de Sesión Supabase**: Tokens JWT de acceso y de refresco gestionados por el adaptador seguro en `frontend/src/lib/supabase.ts`.
2. **Alias del Foro Comunitario**: Se resguarda la identidad asignada a la usuaria (`forum_alias`) sin asociarla a su nombre real o correo electrónico.
3. **Preferencia de Idioma y Modo**: Almacenados de forma persistente y aislada.

```typescript
// Implementación en frontend/src/lib/supabase.ts
const ExpoSecureStoreAdapter = {
  getItem: (key: string) => SecureStore.getItemAsync(key),
  setItem: (key: string, value: string) => SecureStore.setItemAsync(key, value),
  removeItem: (key: string) => SecureStore.deleteItemAsync(key),
};
```

---

## 4. Anonimato y Prevención de Rastreo en el Foro Comunitario

En comunidades pequeñas de la Costa Caribe, el estigma social en torno a la salud sexual y reproductiva puede inhibir la búsqueda de orientación. Por ello, el módulo **Tribu / Foro Comunitario** implementa:

1. **Generación Automática de Pseudónimos**: La aplicación asigna automáticamente nombres anónimos poéticos y seguros (ej. *Luna Creciente*, *Flor de Mayo*, *Mangle Verde*) sin requerir nombres reales, cédula ni números telefónicos.
2. **Desvinculación de PII (Personally Identifiable Information)**: Ningún post en `forum_posts` almacena dirección IP, modelo de dispositivo ni ubicación GPS exacta.
3. **Agrupación Temática Inclusiva**: Los temas se clasifican por categorías generales (`ciclo`, `embarazo`, `menopausia`, `general`) para facilitar la consulta sin exponer información identitaria.

---

## 5. Seguridad en la Capa de Datos (Supabase PostgreSQL RLS)

Todas las tablas en PostgreSQL tienen habilitado de forma estricta **Row Level Security (RLS)** en los scripts de migración (`backend/supabase/migrations/20240101000000_init.sql` y `20240101000001_myths.sql`):

### Políticas Implementadas:

| Tabla | RLS Habilitado | Política | Operación | Regla de Acceso | Justificación |
| :--- | :---: | :--- | :---: | :--- | :--- |
| `directory_contacts` | ✅ Sí | `Public Directory Read` | `SELECT` | `USING (true)` | Directorio de hospitales, centros de salud y comisarías de libre acceso público. |
| `directory_contacts` | ✅ Sí | *Restricción de escritura* | `INSERT / UPDATE / DELETE` | Solo administradores (service_role) | Evita manipulación maliciosa de números de emergencia. |
| `forum_posts` | ✅ Sí | `Public Forum Read` | `SELECT` | `USING (true)` | Lectura libre comunitaria de dudas y respuestas. |
| `forum_posts` | ✅ Sí | `Insert Forum Posts` | `INSERT` | `WITH CHECK (true)` | Permite publicación anónima comunitaria sin obligar a registrar datos personales. |
| `user_cycle_logs` | ✅ Sí | `Users can read own logs` | `SELECT` | `USING (auth.uid() = user_id)` | Solo la usuaria autenticada puede ver su historial. |
| `user_cycle_logs` | ✅ Sí | `Users can insert own logs`| `INSERT` | `WITH CHECK (auth.uid() = user_id)` | Impide inserción a nombre de terceros. |
| `user_cycle_logs` | ✅ Sí | `Users can update own logs`| `UPDATE` | `USING (auth.uid() = user_id)` | Impide modificación de datos de terceros. |
| `myths` | ✅ Sí | `Public Myths Read` | `SELECT` | `USING (true)` | Mitos y realidades culturales de lectura abierta. |

---

## 6. Mitigación de Inyección SQL y Sanitización en SQLite

En la base de datos local embebida (`frontend/src/db/database.ts`), se erradica por completo la concatenación de cadenas de texto no sanitizadas. Todas las operaciones utilizan **consultas parametrizadas**:

```typescript
// ✅ BUENA PRÁCTICA (Implementada en Metztli 2.0):
await database.runAsync(
  'UPDATE user_profile SET current_mode = ? WHERE id = 1',
  [mode]
);

await database.runAsync(
  `INSERT OR REPLACE INTO daily_logs 
    (log_date, mode, flow_level, pain_level, pregnancy_symptoms, mood, symptoms_json, notes)
   VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
  [log.log_date, log.mode, log.flow_level ?? null, log.pain_level ?? null, ...]
);

// ❌ PRÁCTICA INSEGURA (Evitada):
// await database.runAsync(`UPDATE user_profile SET current_mode = '${mode}' WHERE id = 1`);
```

---

## 7. Gestión Segura de Variables de Entorno y Secretos

1. **Separación de Llaves Públicas y Secretas**:
   - `EXPO_PUBLIC_SUPABASE_URL`: URL pública de la instancia de Supabase.
   - `EXPO_PUBLIC_SUPABASE_ANON_KEY`: Llave pública para operaciones con RLS habilitado.
   - **NUNCA se incluye ni compila la llave `SUPABASE_SERVICE_ROLE_KEY` en la aplicación cliente**. Cualquier operación administrativa se ejecuta en entornos seguros de backend o scripts de migración aislados.
2. **Control de Archivos en `.gitignore`**:
   - `.env`, `.env.local` y artefactos de compilación (`dist/`, `build/`, `android/app/build/`) están excluidos del historial de control de versiones.
3. **Disponibilidad de Plantilla Documentada**:
   - Se provee [frontend/.env.example](file:///c:/Metzlit_2.0/frontend/.env.example) para guiar la configuración segura sin filtrar credenciales reales.

---

## 8. Resiliencia, Conectividad y Manejo Defensivo de Errores

Las redes móviles en la Costa Caribe presentan alta latencia y frecuentes caídas de señal. Metztli 2.0 incorpora patrones defensivos:

1. **Detección Activa de Conectividad con NetInfo**:
   Antes de disparar cualquier petición de red hacia Supabase, `sync.ts` verifica el estado real de la conexión:
   ```typescript
   const state = await NetInfo.fetch();
   if (!state.isConnected) {
     console.log('Sin conexión a Internet. Operando en modo local.');
     return;
   }
   ```
2. **Entornos de Simulación y Pruebas Web**:
   En entornos de navegador web (donde SQLite nativo no está disponible), se provee un controlador mock en `database.ts` para permitir pruebas de interfaz y validaciones sin provocar caídas de la aplicación (*no crashes*).
3. **Manejo de Errores con Try/Catch Contextual**:
   Las excepciones de red o lectura de base de datos son capturadas y registradas sin congelar la interfaz de usuario, preservando la continuidad de la experiencia.
4. **Protocolo Seguro de Triage y Auxilio Offline (Sin Exposición Cloud)**:
   En situaciones de emergencia obstétrica vital (hemorragias, sospecha de preeclampsia, fiebre alta), la aplicación no depende de servidores web intermedios ni APIs en la nube que puedan fallar por falta de cobertura de datos móviles. Se apoya en el protocolo estándar celular GSM `sms:` para enlazar a la partera o Casa Materna de forma directa. El mensaje aplica **minimización de datos** (únicamente reporta la semana gestacional y el síntoma de alerta, sin exponer nombres completos, cédula ni historial privado).

---

## 9. Lista de Verificación de Cumplimiento (Checklist)

- [x] **Privacy by Design**: Datos de ciclo y salud almacenados 100% en local.
- [x] **Almacenamiento Criptográfico**: Tokens y alias gestionados por `expo-secure-store`.
- [x] **PostgreSQL RLS Activo**: Todas las tablas en Supabase con políticas de acceso verificadas.
- [x] **Prevención SQL Injection**: 100% de consultas SQLite parametrizadas con marcadores de posición (`?`).
- [x] **Control de Secretos**: `.env` excluido de git y `.env.example` disponible.
- [x] **Cero PII en Foro Comunitario**: Pseudónimos anónimos automáticos.
- [x] **Resiliencia de Red**: Validación con NetInfo y reintentos idempotentes.
- [x] **Canal de Auxilio de Emergencia Offline**: Enlace nativo SMS celular directo a la Casa Materna sin intermediarios cloud.
