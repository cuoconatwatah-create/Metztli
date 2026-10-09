#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# Metztli — Paso 2: instalar Supabase completo dentro de la VM de Azure
#
# Se ejecuta DENTRO de la VM (entra antes con: ssh azureuser@IP_PUBLICA):
#
#   curl -fsSL https://raw.githubusercontent.com/cuoconatwatah-create/Metztli/main/infra/azure/2-instalar-servidor.sh | bash
#
# Qué hace:
#   1. Prepara el sistema: swap de 2 GB, Docker, Node.js 20 y Python 3.
#   2. Descarga Supabase (la versión para instalar en servidor propio) y genera
#      claves y contraseñas nuevas, solo para este servidor.
#   3. Publica todo por HTTPS en  https://<IP>.sslip.io  y por la IP directa (certificado automático
#      con Caddy). sslip.io es un nombre que apunta a tu IP pública:
#        /            landing page de Metztli (descarga del APK y formulario de demo)
#        /admin.html  panel privado (solicitudes de demo y subida de versiones)
#        /rest/v1, /auth/v1, /storage/v1   API de Supabase (base de datos, cuentas, archivos)
#   4. Crea las tablas, roles y reglas de seguridad de Metztli (setup_completo.sql).
#   5. Permite subir archivos de hasta 300 MB (el APK pesa unos 86 MB).
#   6. Guarda las credenciales en /opt/metztli-supabase/CREDENCIALES.txt
#
# Variables opcionales:
#   PUBLIC_HOST=mi-dominio.com   usa tu propio dominio en lugar de <IP>.sslip.io
#   SITE_URL=https://...         a dónde llevan los enlaces de correo (por defecto, la web de Metztli)
#   REPO=https://github.com/cuoconatwatah-create/Metztli   BRANCH=main (rama de la que se toma la landing y las tablas)
# Se puede ejecutar de nuevo sin romper nada: no regenera claves ni repite las tablas.
# ─────────────────────────────────────────────────────────────────────────────
set -euo pipefail

REPO="${REPO:-https://github.com/cuoconatwatah-create/Metztli}"
BRANCH="${BRANCH:-main}"
SITE_URL="${SITE_URL:-https://cuoconatwatah-create.github.io/Metztli/}"
BASE=/opt/metztli-supabase
SRC=/opt/metztli-src
DOCKER="sudo docker"

say() { printf '\n\033[1;35m▶ %s\033[0m\n' "$*"; }

# ── 1. Sistema ───────────────────────────────────────────────────────────────
say "1/6 Preparando el sistema (swap, Docker, Node.js, Python)"
sudo apt-get update -y
sudo apt-get install -y ca-certificates curl git openssl gnupg lsb-release python3 python3-pip

if ! swapon --show | grep -q '/swapfile'; then
  sudo fallocate -l 2G /swapfile
  sudo chmod 600 /swapfile
  sudo mkswap /swapfile >/dev/null
  sudo swapon /swapfile
  grep -q '/swapfile' /etc/fstab || echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab >/dev/null
fi

if ! command -v docker >/dev/null 2>&1; then
  curl -fsSL https://get.docker.com | sudo sh
fi
sudo usermod -aG docker "$USER" || true

if ! command -v node >/dev/null 2>&1; then
  curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
  sudo apt-get install -y nodejs
fi

# ── 2. IP pública y nombre ───────────────────────────────────────────────────
say "2/6 Detectando la IP pública"
PUBLIC_IP="$(curl -fsS -H Metadata:true --max-time 5 \
  'http://169.254.169.254/metadata/instance/network/interface/0/ipv4/ipAddress/0/publicIpAddress?api-version=2021-02-01&format=text' 2>/dev/null || true)"
[ -n "$PUBLIC_IP" ] || PUBLIC_IP="$(curl -fsS --max-time 8 https://ifconfig.me)"
HOST="${PUBLIC_HOST:-${PUBLIC_IP//./-}.sslip.io}"
echo "   IP pública: $PUBLIC_IP"
echo "   Dirección de la API: https://$HOST"

# ── 3. Supabase en servidor propio ───────────────────────────────────────────
say "3/6 Descargando Supabase"
sudo mkdir -p "$BASE" && sudo chown "$USER":"$USER" "$BASE"
if [ ! -f "$BASE/docker-compose.yml" ]; then
  rm -rf /tmp/supabase-src
  git clone --depth 1 https://github.com/supabase/supabase /tmp/supabase-src
  cp -rf /tmp/supabase-src/docker/. "$BASE"/
  cp "$BASE/.env.example" "$BASE/.env"
fi
cd "$BASE"

setenv() { # setenv CLAVE valor  → reemplaza la línea si existe, o la agrega
  local k="$1" v="$2"
  if grep -q "^${k}=" .env; then sed -i "s#^${k}=.*#${k}=${v}#" .env; else echo "${k}=${v}" >> .env; fi
}
getenv() { grep "^$1=" .env | head -1 | cut -d= -f2-; }

b64url() { openssl base64 -A | tr '+/' '-_' | tr -d '='; }
jwt() { # jwt <rol>  → token firmado con JWT_SECRET (10 años)
  local iat exp h p s
  iat=$(date +%s); exp=$((iat + 315360000))
  h=$(printf '%s' '{"alg":"HS256","typ":"JWT"}' | b64url)
  p=$(printf '%s' "{\"role\":\"$1\",\"iss\":\"supabase\",\"iat\":$iat,\"exp\":$exp}" | b64url)
  s=$(printf '%s' "$h.$p" | openssl dgst -sha256 -hmac "$JWT_SECRET" -binary | b64url)
  printf '%s.%s.%s' "$h" "$p" "$s"
}

say "Descargando el código de Metztli (landing, panel y tablas)"
if [ ! -d "$SRC/.git" ]; then
  sudo rm -rf "$SRC"; sudo git clone --depth 1 --branch "$BRANCH" "$REPO" "$SRC"
else
  sudo git -C "$SRC" pull --ff-only || true
fi

say "4/6 Generando claves nuevas y configurando"
if [ ! -f "$BASE/.claves-generadas" ]; then
  POSTGRES_PASSWORD="$(openssl rand -hex 16)"
  JWT_SECRET="$(openssl rand -hex 32)"
  DASHBOARD_PASSWORD="$(openssl rand -hex 10)"
  setenv POSTGRES_PASSWORD "$POSTGRES_PASSWORD"
  setenv JWT_SECRET "$JWT_SECRET"
  setenv ANON_KEY "$(jwt anon)"
  setenv SERVICE_ROLE_KEY "$(jwt service_role)"
  setenv DASHBOARD_USERNAME "metztli"
  setenv DASHBOARD_PASSWORD "$DASHBOARD_PASSWORD"
  setenv SECRET_KEY_BASE "$(openssl rand -hex 32)"
  setenv VAULT_ENC_KEY "$(openssl rand -hex 16)"
  setenv PG_META_CRYPTO_KEY "$(openssl rand -hex 16)"
  touch "$BASE/.claves-generadas"
fi
JWT_SECRET="$(getenv JWT_SECRET)"

setenv SUPABASE_PUBLIC_URL "https://$HOST"
setenv API_EXTERNAL_URL "https://$HOST"
setenv SITE_URL "$SITE_URL"
setenv ADDITIONAL_REDIRECT_URLS ""
setenv ENABLE_EMAIL_SIGNUP "true"
setenv ENABLE_EMAIL_AUTOCONFIRM "true"   # sin correo de confirmación (ver docs/AZURE_DESPLIEGUE.md)
setenv ENABLE_PHONE_SIGNUP "false"
setenv ENABLE_ANONYMOUS_USERS "false"
setenv DISABLE_SIGNUP "false"

# El almacenamiento de Supabase limita cada archivo a 50 MB por defecto: se sube a 300 MB para el APK
sed -i 's/FILE_SIZE_LIMIT: 52428800/FILE_SIZE_LIMIT: 314572800/' docker-compose.yml

say "5/6 Levantando Supabase (descarga ~2 GB la primera vez)"
$DOCKER compose pull
$DOCKER compose up -d

echo "   Esperando a la base de datos…"
for i in $(seq 1 60); do
  if $DOCKER exec supabase-db pg_isready -U postgres -h localhost >/dev/null 2>&1; then break; fi
  sleep 5
done
$DOCKER exec supabase-db pg_isready -U postgres -h localhost

# Landing, panel, app web, HTTPS (Caddy) y puertos internos cerrados: lo hace el script 6,
# el mismo que se usa después para actualizar. Así instalar y actualizar dan el mismo resultado.
BRANCH="$BRANCH" REPO="$REPO" bash "$SRC/infra/azure/6-actualizar.sh"

# ── 6. Tablas de Metztli ─────────────────────────────────────────────────────
say "6/6 Creando las tablas, roles y seguridad de Metztli"
psql_admin() { $DOCKER exec -i supabase-db psql -U supabase_admin -d postgres "$@"; }
for i in $(seq 1 20); do
  psql_admin -tAc "select to_regclass('auth.users') is not null" 2>/dev/null | grep -q t && break
  echo "   Esperando a que Supabase Auth cree sus tablas…"; sleep 6
done

if psql_admin -tAc "select to_regclass('public.daily_logs') is not null" | grep -q t; then
  echo "   Las tablas de Metztli ya existen; no se repite."
else
  # sed quita marcas BOM invisibles que haría fallar a psql
  sed 's/\xEF\xBB\xBF//g' "$SRC/backend/supabase/setup_completo.sql" | psql_admin -v ON_ERROR_STOP=1
  echo "   Tablas creadas."
fi

# ── Credenciales ─────────────────────────────────────────────────────────────
ANON_KEY="$(getenv ANON_KEY)"
cat > "$BASE/CREDENCIALES.txt" <<EOF
Metztli · servidor propio en Azure
Generado: $(date -u +%FT%TZ)

IP pública ........ $PUBLIC_IP
API (HTTPS) ....... https://$HOST
Landing page ..... https://$HOST/
Panel del equipo .. https://$HOST/admin.html   (necesita una cuenta de Administrador: ver 4-crear-admin.sh)
Studio (BD) ....... no está expuesto a internet. Para verlo: ssh -L 8000:localhost:8000 azureuser@$PUBLIC_IP
                    y abre http://localhost:8000   usuario: $(getenv DASHBOARD_USERNAME)   contraseña: $(getenv DASHBOARD_PASSWORD)

Para la app (frontend/.env y variables de GitHub):
EXPO_PUBLIC_SUPABASE_URL=https://$HOST
EXPO_PUBLIC_SUPABASE_ANON_KEY=$ANON_KEY

SECRETAS (no las compartas ni las subas a GitHub):
POSTGRES_PASSWORD=$(getenv POSTGRES_PASSWORD)
JWT_SECRET=$(getenv JWT_SECRET)
SERVICE_ROLE_KEY=$(getenv SERVICE_ROLE_KEY)
EOF
chmod 600 "$BASE/CREDENCIALES.txt"

echo
echo "════════════════════════════════════════════════════════════"
echo " Servidor listo"
echo "   Landing .... https://$HOST/"
echo "   Panel ...... https://$HOST/admin.html"
echo "   API ........ https://$HOST"
echo "   Verificar .. curl -s https://$HOST/auth/v1/settings -H \"apikey: <ANON_KEY>\""
echo
echo " Para la app, usa estas dos líneas (son públicas):"
echo "   EXPO_PUBLIC_SUPABASE_URL=https://$HOST"
echo "   EXPO_PUBLIC_SUPABASE_ANON_KEY=$ANON_KEY"
echo
echo " Todo (incluidas las contraseñas) está en: $BASE/CREDENCIALES.txt"
echo " Siguientes pasos:"
echo "   bash $SRC/infra/azure/4-crear-admin.sh tu@correo.com   (cuenta para el panel)"
echo "   bash $SRC/infra/azure/3-evidencias.sh                  (capturas de los entregables)"
echo "════════════════════════════════════════════════════════════"
