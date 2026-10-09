#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# Metztli — Paso 6: publicar o actualizar la web en el servidor de Azure
#
# Se ejecuta DENTRO de la VM (o con `az vm run-command`, sin SSH). Es seguro repetirlo:
#
#   bash /opt/metztli-src/infra/azure/6-actualizar.sh            # publica lo que hay en la rama main
#   BRANCH=otra-rama bash /opt/metztli-src/infra/azure/6-actualizar.sh
#
# Qué hace:
#   1. Trae el código de GitHub (rama main por defecto) y lo deja en /opt/metztli-src.
#   2. Publica la landing y el panel, y la app web en /app/ (del Release de GitHub, si existe).
#   3. Escribe /version.json con la versión y el commit publicados: así se puede comprobar
#      que lo que corre en Azure es EXACTAMENTE lo que está en GitHub (ver scripts/verify-deploy.mjs).
#   4. Sirve todo por HTTPS (https://<IP>.sslip.io) y también por la IP directa (http://<IP>).
#   5. Cierra al exterior los puertos internos de Supabase (8000, 8443, 5432, 6543): solo
#      Caddy, en los puertos 80 y 443, recibe conexiones de internet.
# ─────────────────────────────────────────────────────────────────────────────
set -euo pipefail

BASE=/opt/metztli-supabase
SRC=/opt/metztli-src
REPO="${REPO:-https://github.com/cuoconatwatah-create/Metztli}"
BRANCH="${BRANCH:-main}"
DOCKER="sudo docker"

say() { printf '\n\033[1;35m▶ %s\033[0m\n' "$*"; }
getenv() { grep "^$1=" "$BASE/.env" | head -1 | cut -d= -f2-; }

HOST="$(getenv API_EXTERNAL_URL | sed 's#https://##')"
PUBLIC_IP="$(curl -fsS -H Metadata:true --max-time 5 \
  'http://169.254.169.254/metadata/instance/network/interface/0/ipv4/ipAddress/0/publicIpAddress?api-version=2021-02-01&format=text' 2>/dev/null || true)"
[ -n "$PUBLIC_IP" ] || PUBLIC_IP="$(curl -fsS --max-time 8 https://ifconfig.me)"

# ── 1. Código ────────────────────────────────────────────────────────────────
say "1/5 Trayendo el código de GitHub ($BRANCH)"
if [ ! -d "$SRC/.git" ]; then
  sudo rm -rf "$SRC"; sudo git clone --depth 1 --branch "$BRANCH" "$REPO" "$SRC"
else
  sudo git -C "$SRC" fetch -q --depth 1 origin "$BRANCH"
  sudo git -C "$SRC" checkout -q -f -B "$BRANCH" FETCH_HEAD
fi
COMMIT="$(sudo git -C "$SRC" rev-parse HEAD)"
VERSION="$(node -p "require('$SRC/frontend/package.json').version")"
echo "   Versión $VERSION · commit ${COMMIT:0:7}"

# ── 2. Landing, panel y app web ──────────────────────────────────────────────
say "2/5 Publicando la landing, el panel y la app web"
mkdir -p "$BASE/landing"
cp -rf "$SRC/landing/." "$BASE/landing/"

WEB_APP="no"
WEB_ZIP="https://github.com/cuoconatwatah-create/Metztli/releases/download/v${VERSION}/metztli-web-${VERSION}.zip"
if curl -fsIL --max-time 20 "$WEB_ZIP" >/dev/null 2>&1; then
  command -v unzip >/dev/null 2>&1 || sudo apt-get install -y unzip >/dev/null
  TMP="$(mktemp -d)"
  curl -fsSL --max-time 300 -o "$TMP/web.zip" "$WEB_ZIP"
  rm -rf "$BASE/landing/app"; mkdir -p "$BASE/landing/app"
  unzip -q "$TMP/web.zip" -d "$BASE/landing/app"
  rm -rf "$TMP"
  WEB_APP="si"
  echo "   App web publicada en /app/ (metztli-web-${VERSION}.zip)"
else
  rm -rf "$BASE/landing/app"
  echo "   No hay metztli-web-${VERSION}.zip en el Release v${VERSION}: la landing enlaza a la web de GitHub Pages."
fi

WEB_LINK="https://cuoconatwatah-create.github.io/Metztli/"
[ "$WEB_APP" = "si" ] && WEB_LINK="/app/"
# supabaseUrl = el mismo origen desde el que se abre la página: funciona por el nombre y por la IP directa
cat > "$BASE/landing/config.js" <<EOF
window.METZTLI_CONFIG = {
  supabaseUrl: window.location.origin,
  supabaseAnonKey: '$(getenv ANON_KEY)',
  fallbackDownloadUrl: 'https://github.com/cuoconatwatah-create/Metztli/releases/latest',
  webAppUrl: '$WEB_LINK',
};
EOF

# ── 3. Marca de versión (se compara con GitHub) ──────────────────────────────
say "3/5 Escribiendo version.json"
cat > "$BASE/landing/version.json" <<EOF
{
  "proyecto": "Metztli",
  "version": "$VERSION",
  "commit": "$COMMIT",
  "rama": "$BRANCH",
  "repositorio": "$REPO",
  "app_web": "$WEB_APP",
  "desplegado": "$(date -u +%FT%TZ)"
}
EOF
cat "$BASE/landing/version.json"

# ── 4. Caddy: HTTPS por nombre y HTTP por IP ─────────────────────────────────
say "4/5 Configurando Caddy (https://$HOST y http://$PUBLIC_IP)"
cat > "$BASE/Caddyfile" <<EOF
(sitio) {
  encode gzip
  @api path /auth/v1/* /rest/v1/* /storage/v1/* /realtime/v1/* /graphql/v1/* /functions/v1/*
  handle @api {
    reverse_proxy 127.0.0.1:8000 {
      flush_interval -1
    }
  }
  handle /app/* {
    root * /srv/landing
    try_files {path} /app/index.html
    file_server
  }
  handle {
    header Cache-Control "no-cache"
    root * /srv/landing
    file_server
  }
}

$HOST {
  import sitio
}

http://$PUBLIC_IP {
  import sitio
}
EOF
$DOCKER run --rm -v "$BASE/Caddyfile:/etc/caddy/Caddyfile:ro" caddy:2 caddy validate --config /etc/caddy/Caddyfile >/dev/null
$DOCKER rm -f caddy >/dev/null 2>&1 || true
$DOCKER run -d --name caddy --restart unless-stopped --network host \
  -v "$BASE/Caddyfile:/etc/caddy/Caddyfile:ro" -v "$BASE/landing:/srv/landing:ro" \
  -v caddy_data:/data -v caddy_config:/config caddy:2 >/dev/null

# ── 5. Puertos internos solo en localhost ────────────────────────────────────
say "5/5 Cerrando al exterior los puertos internos de Supabase"
cd "$BASE"
sed -i -E 's/^(\s+- )(\$\{(KONG_HTTP_PORT|KONG_HTTPS_PORT|POSTGRES_PORT|POOLER_PROXY_PORT_TRANSACTION)\}:)/\1127.0.0.1:\2/' docker-compose.yml
$DOCKER compose up -d >/dev/null 2>&1
echo "   Puertos publicados por Docker (deben decir 127.0.0.1):"
$DOCKER ps --format '   {{.Names}}  {{.Ports}}' | grep -E ':[0-9]+->' | cut -c1-110 || echo "   (ninguno)"

echo
echo "════════════════════════════════════════════════════════════"
echo " Publicado: versión $VERSION · commit ${COMMIT:0:7}"
echo "   https://$HOST/        landing, panel (/admin.html) y app web (/app/)"
echo "   http://$PUBLIC_IP/    lo mismo por la IP directa"
echo "   https://$HOST/version.json   para comprobar que coincide con GitHub"
echo "════════════════════════════════════════════════════════════"
