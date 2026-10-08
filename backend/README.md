# Backend (Supabase)

Metztli usa Supabase (PostgreSQL + Auth + RLS) como nube; la app funciona sin conexión con SQLite y sincroniza cuando hay red.

## Puesta en marcha

1. **Variables de entorno** — en `frontend/.env` (fuera de git):
   ```env
   EXPO_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
   EXPO_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_...
   ```
   Solo la *publishable key*. Nunca pongas la `secret`/`service_role` en la app.

2. **Crear las tablas** (proyecto vacío) — elige una opción:
   - **SQL Editor (más simple):** abre Supabase → *SQL Editor* → pega todo `supabase/setup_completo.sql` → *Run*. Ejecútalo una sola vez.
   - **CLI:**
     ```bash
     cd backend
     npx supabase login
     npx supabase link --project-ref <project-ref>
     npx supabase db push
     ```

3. **Verificar**:
   ```bash
   node scripts/check-supabase.mjs
   ```
   Comprueba la conexión, que existan las 9 tablas, que la RLS oculte los datos íntimos a usuarias anónimas y que estén sembrados los mitos y el catálogo de síntomas.

## Migraciones (`supabase/migrations/`)

| Archivo | Contenido |
| :--- | :--- |
| `…000_init.sql` | Directorio, foro anónimo, `user_cycle_logs` y sus políticas RLS |
| `…001_myths.sql` | Mitos y realidades (lectura pública) con datos iniciales |
| `…002_daily_logs_normalized.sql` | `cycles`, `symptoms`, `daily_logs`, `daily_log_symptoms`, `daily_log_habits` (2FN) con RLS por dueña |
| `…003_forum_hardening.sql` | Límites de texto, categorías válidas y `user_id` solo propio en el foro |

`supabase/setup_completo.sql` es la concatenación de todas, generada para pegar en el SQL Editor. Si cambias una migración, regenera el archivo.

## Qué se sincroniza

| Dato | Dirección | Cuándo |
| :--- | :--- | :--- |
| Foro (Tribu) | ↑ publicaciones pendientes, ↓ últimas 100 de la comunidad | Al abrir el foro y al volver la conexión. Anónimo: no se envía `user_id` |
| Mitos | ↓ | Al abrir el Desmitificador |
| Registros diarios y ciclos | ↑ últimos 90 días, ↓ al iniciar sesión | **Solo si la usuaria activa "Respaldar mis datos en la nube"** en Perfil (apagado por defecto) y tiene sesión |

El correo debe confirmarse antes de iniciar sesión (configuración actual del proyecto, *Authentication → Providers → Email → Confirm email*).
