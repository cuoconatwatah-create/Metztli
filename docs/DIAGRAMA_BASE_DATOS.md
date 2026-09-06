# Diagrama de Base de Datos y Modelo de Datos — Metztli

> **Entregable de Desarrollo**: Diagrama de base de datos  
> **Proyecto**: Metztli — Plataforma de Salud Femenina Integral Offline-First  
> **Fecha**: Septiembre 2026  
> **Estado**: Modelado, Implementado y Documentado  

---

## 1. Arquitectura de Datos Híbrida (Offline-First)

Metztli implementa una arquitectura de persistencia dual:
1. **Base de Datos Local Embebida (SQLite — `metztli.db`)**:
   - Reside en el almacenamiento privado del dispositivo mediante `expo-sqlite`.
   - Garantiza velocidad instantánea, cero latencia y disponibilidad 100% desconectada (*offline*).
   - Es el repositorio exclusivo de información íntima (ciclos menstruales, síntomas diarios, pataditas fetales).
2. **Base de Datos en la Nube (Supabase — PostgreSQL 15)**:
   - Aloja datos compartidos comunitariamente (Directorio de Emergencias, Mitos Médicos validados y Foro Anónimo).
   - Administrada con políticas estrictas de **Row Level Security (RLS)**.

---

## 2. Diagrama Entidad-Relación (ER) General

```mermaid
erDiagram
    %% ENTIDADES LOCALES (SQLite)
    USER_PROFILE {
        int id PK "Singleton (id=1)"
        string current_mode "cycle | pregnancy | menopause"
        string lmp_date "Fecha Ultima Menstruacion (ISO)"
        string due_date "Fecha Probable de Parto (ISO)"
    }

    CYCLES {
        int id PK "Autoincrement"
        string start_date "Fecha inicio ciclo"
        string end_date "Fecha fin ciclo"
        int cycle_length "Duracion ciclo (def: 28)"
        int period_length "Duracion sangrado (def: 5)"
    }

    DAILY_LOGS {
        int id PK "Autoincrement"
        string log_date UK "Fecha del registro (YYYY-MM-DD)"
        string mode "Etapa activa"
        string flow_level "light | medium | heavy"
        int pain_level "Escala 0-5"
        string pregnancy_symptoms "JSON array de sintomas"
        string mood "Estado animico"
        string symptoms_json "JSON detallado"
        string notes "Notas privadas de la usuaria"
    }

    KICK_COUNTER_LOGS {
        int id PK "Autoincrement"
        string session_date "Fecha y hora de la sesion"
        int kick_count "Numero total de pataditas"
        int duration_minutes "Duracion en minutos"
    }

    USER_CYCLE_LOGS {
        int log_id PK "Autoincrement"
        string local_uuid UK "UUID idempotente cliente"
        string date_logged UK "Fecha de registro"
        string flow_intensity "light | medium | heavy"
        int cramps_level "Nivel de colicos 0-5"
        int stress_level "Nivel de estres 0-5"
        string mood_tag "Etiqueta emocional"
        int is_synced "0=pendiente, 1=sincronizado"
    }

    %% ENTIDADES SINCRONIZADAS (SQLite <-> Supabase)
    DIRECTORY_CONTACTS {
        uuid id PK "UUID en Supabase / int en SQLite"
        string municipality "Bluefields, Bilwi, Waspam, etc."
        string institution_name "Nombre hospital o centro"
        string phone_number "Numero telefonico directo"
        string type "hospital | police | ambulance | clinic"
        timestamp created_at "Fecha de creacion"
    }

    FORUM_POSTS {
        uuid id PK "UUID Supabase"
        string local_uuid UK "UUID idempotente local"
        string alias "Pseudonimo anonimo"
        string category "ciclo | embarazo | menopausia | general"
        string question "Texto de la consulta"
        string created_at "Marca temporal ISO"
        int is_synced "0=pendiente local, 1=en nube"
    }

    MYTHS {
        string id PK "c1..c4, e1..e4, m1..m3"
        string category "ciclo | embarazo | menopausia"
        string myth "Mito popular comunitario"
        string reality "Explicacion medica real"
        timestamp created_at "Fecha creacion"
    }

    OFFLINE_FAQS {
        int id PK "Autoincrement"
        string category "Categoria tematica"
        string title_key "Clave de traduccion titulo"
        string content_key "Clave de traduccion contenido"
        string audio_key "Clave de audio en Miskitu/Creole"
    }

    %% RELACIONES CONCEPTUALES
    USER_PROFILE ||--o{ DAILY_LOGS : "registra_en_etapa"
    USER_PROFILE ||--o{ KICK_COUNTER_LOGS : "monitorea_en_embarazo"
    USER_PROFILE ||--o{ CYCLES : "calcula_con"
    FORUM_POSTS ||--o{ DIRECTORY_CONTACTS : "apoyo_comunitario"
```

---

## 3. Diccionario de Datos Exhaustivo

### 3.1 `user_profile` (Tabla Local de Estado)
Almacena la configuración activa de la usuaria en el dispositivo móvil. Contiene un único registro (patrón *Singleton* `id = 1`).

| Campo | Tipo SQLite | Restricciones | Descripción |
| :--- | :--- | :--- | :--- |
| `id` | `INTEGER` | `PRIMARY KEY CHECK (id = 1)` | Identificador único singleton. |
| `current_mode` | `TEXT` | `DEFAULT 'cycle'` | Modo actual: `'cycle'`, `'pregnancy'` o `'menopause'`. |
| `lmp_date` | `TEXT` | Nullable | Fecha de Última Menstruación en formato ISO (YYYY-MM-DD). |
| `due_date` | `TEXT` | Nullable | Fecha Estimada de Parto calculada mediante la Regla de Naegele. |

---

### 3.2 `cycles` (Historial y Predicción de Ciclos)
Almacena los intervalos entre menstruaciones para alimentar el algoritmo de predicción de la **Brújula Lunar**.

| Campo | Tipo SQLite | Restricciones | Descripción |
| :--- | :--- | :--- | :--- |
| `id` | `INTEGER` | `PRIMARY KEY AUTOINCREMENT` | ID interno autoincremental. |
| `start_date` | `TEXT` | `NOT NULL` | Fecha de inicio del periodo menstrual (YYYY-MM-DD). |
| `end_date` | `TEXT` | Nullable | Fecha de finalización del sangrado (YYYY-MM-DD). |
| `cycle_length` | `INTEGER` | `DEFAULT 28` | Longitud típica del ciclo en días. |
| `period_length`| `INTEGER` | `DEFAULT 5` | Duración típica del sangrado en días. |

---

### 3.3 `daily_logs` (Registro Diario de Síntomas)
Permite a la usuaria registrar síntomas físicos, emocionales y notas clínicas día con día.

| Campo | Tipo SQLite | Restricciones | Descripción |
| :--- | :--- | :--- | :--- |
| `id` | `INTEGER` | `PRIMARY KEY AUTOINCREMENT` | ID autoincremental. |
| `log_date` | `TEXT` | `UNIQUE NOT NULL` | Fecha del log (garantiza un único log por día). |
| `mode` | `TEXT` | `NOT NULL` | Modo activo en el que se tomó el registro. |
| `flow_level` | `TEXT` | Nullable | Nivel de flujo: `'spotting'`, `'light'`, `'medium'`, `'heavy'`. |
| `pain_level` | `INTEGER` | Nullable | Escala de dolor de cólicos de 0 a 5. |
| `pregnancy_symptoms`| `TEXT` | Nullable | Lista serializada JSON de síntomas gestacionales. |
| `mood` | `TEXT` | Nullable | Estado de ánimo registrado (ej. `'calm'`, `'happy'`, `'tired'`). |
| `symptoms_json`| `TEXT` | Nullable | Carga útil serializada con detalles complementarios. |
| `notes` | `TEXT` | Nullable | Texto libre privado de la usuaria. |

---

### 3.4 `kick_counter_logs` (Contador de Pataditas Fetales)
Registra las sesiones de monitoreo de movimientos fetales para el seguimiento obstétrico.

| Campo | Tipo SQLite | Restricciones | Descripción |
| :--- | :--- | :--- | :--- |
| `id` | `INTEGER` | `PRIMARY KEY AUTOINCREMENT` | ID autoincremental. |
| `session_date`| `TEXT` | `NOT NULL` | Marca temporal de la sesión (ISO 8601). |
| `kick_count` | `INTEGER` | `NOT NULL` | Total de movimientos registrados en la sesión. |
| `duration_minutes` | `INTEGER` | `NOT NULL` | Duración total de la sesión en minutos. |

---

### 3.5 `user_cycle_logs` (Brújula Lunar y Registro Sincronizable)

| Campo | Tipo SQLite / Postgres | Restricciones | Descripción |
| :--- | :--- | :--- | :--- |
| `log_id` | `INTEGER / SERIAL` | `PRIMARY KEY` | ID numérico. |
| `local_uuid` | `TEXT` | `UNIQUE NOT NULL` | UUID generado por el cliente móvil para sincronización. |
| `date_logged` | `TEXT / DATE` | `NOT NULL` | Fecha del reporte de ciclo. |
| `flow_intensity` | `TEXT` | `CHECK IN ('light','medium','heavy')` | Intensidad del flujo. |
| `cramps_level` | `INTEGER` | `CHECK (0 <= cramps_level <= 5)` | Nivel de cólicos. |
| `stress_level` | `INTEGER` | `CHECK (0 <= stress_level <= 5)` | Nivel de estrés. |
| `mood_tag` | `TEXT` | Nullable | Etiqueta emocional. |
| `is_synced` | `INTEGER` | `DEFAULT 0` (solo SQLite) | Bandera local: `0` = pendiente, `1` = sincronizado. |
| `user_id` | `UUID` | Nullable (solo Supabase) | Llave foránea a `auth.users(id)` si se autentica. |

---

### 3.6 `forum_posts` (Tribu / Foro Comunitario Anónimo)

| Campo | Tipo SQLite / Postgres | Restricciones | Descripción |
| :--- | :--- | :--- | :--- |
| `id` | `INTEGER / UUID` | `PRIMARY KEY` | ID local autoincremental en SQLite / UUID en Supabase. |
| `local_uuid` | `TEXT` | `UNIQUE NOT NULL` | UUID único universal para sincronización idempotente. |
| `alias` | `TEXT` | `NOT NULL` | Seudónimo comunitario anónimo (ej. "Luna Creciente"). |
| `category` | `TEXT` | `NOT NULL` | `'ciclo'`, `'embarazo'`, `'menopausia'`, `'general'`. |
| `question` | `TEXT` | `NOT NULL` | Pregunta o inquietud planteada. |
| `created_at` | `TEXT / TIMESTAMPTZ` | `NOT NULL` | Fecha y hora de publicación. |
| `is_synced` | `INTEGER` | `DEFAULT 0` (solo SQLite) | Bandera de sincronización en cliente. |

---

### 3.7 `directory_contacts` (Directorio Médico de Emergencias)

| Campo | Tipo | Restricciones | Descripción |
| :--- | :--- | :--- | :--- |
| `id` | `INTEGER / UUID` | `PRIMARY KEY` | Identificador de contacto. |
| `municipality` | `TEXT` | `NOT NULL` | Municipio: `'Bluefields'`, `'Bilwi'`, `'Waspam'`, etc. |
| `institution_name` | `TEXT` | `NOT NULL` | Nombre institucional del centro hospitalario o policial. |
| `phone_number` | `TEXT` | `NOT NULL` | Número telefónico para marcado directo. |
| `type` | `TEXT` | `NOT NULL` | Tipo de entidad: `'hospital'`, `'police'`, `'clinic'`, `'brigade'`. |

---

### 3.8 `myths` (Desmitificador Intercultural)

| Campo | Tipo | Restricciones | Descripción |
| :--- | :--- | :--- | :--- |
| `id` | `TEXT` | `PRIMARY KEY` | Identificador alfanumérico (ej. `'c1'`, `'e1'`, `'m1'`). |
| `category` | `TEXT` | `CHECK IN ('ciclo', 'embarazo', 'menopausia')` | Etapa asociada. |
| `myth` | `TEXT` | `NOT NULL` | Creencia o tabú popular recopilado en comunidades. |
| `reality` | `TEXT` | `NOT NULL` | Respuesta científica, médica y comprensible. |

---

## 4. Estrategia de Sincronización y Resolución de Conflictos

El motor de sincronización (`frontend/src/db/sync.ts` y `useSyncQueue.ts`) opera bajo las siguientes reglas:

```
┌─────────────────┐      1. Usuario publica post offline      ┌──────────────────────┐
│  Dispositivo    ├──────────────────────────────────────────►│  SQLite Local        │
│  (Sin internet) │                                           │  is_synced = 0       │
└─────────────────┘                                           │  local_uuid = "abc"  │
                                                              └──────────┬───────────┘
                                                                         │
                         2. NetInfo detecta conexión                     │
                            Se invoca syncForumPosts()                   │
                                                                         ▼
┌─────────────────┐      3. INSERT a Supabase                 ┌──────────────────────┐
│  Supabase Cloud │◄──────────────────────────────────────────┤  Sync Engine         │
│  (PostgreSQL)   │                                           │  (frontend/src/db)   │
└────────┬────────┘                                           └──────────▲───────────┘
         │                                                               │
         └──────── 4. Supabase responde 201 Created (o 23505 Duplicate) ─┘
                      5. SQLite ejecuta: UPDATE is_synced = 1 WHERE local_uuid = "abc"
```

1. **Garantía Idempotente**: Si la conexión falla a mitad de la transmisión y el paquete llegó al servidor, el reintento enviará el mismo `local_uuid`. Supabase captura la violación de unicidad (`error.code === '23505'`) y el cliente marca con seguridad el registro como sincronizado sin duplicar contenido en el foro.
2. **Prioridad Local (Offline Authority)**: Los datos de salud privada nunca son sobreescritos por servidores externos; el cliente es la única fuente de la verdad para el historial menstrual y síntomas.
