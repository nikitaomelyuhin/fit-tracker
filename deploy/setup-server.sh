#!/usr/bin/env bash
# Разовая настройка VPS под Fit Tracker (Ubuntu 22.04/24.04), запускать от root.
#
#   bash setup-server.sh <домен> <ref>.supabase.co <email> "<публичный ssh-ключ для деплоя>"
#
# Что делает:
#   - <домен>      → отдаёт собранное приложение (SPA) из /var/www/fit-tracker
#   - api.<домен>  → прокси на Supabase: браузер ходит только на твой домен, поэтому
#                    блокировки *.supabase.co / GitHub Pages в РФ перестают мешать
#   - HTTPS через Let's Encrypt (нужен для PWA и service worker)
#   - пользователь deploy, под которым GitHub Actions заливает новые сборки
# Скрипт идемпотентный — можно запускать повторно.
set -euo pipefail

DOMAIN="${1:?домен, например fittrack.ru}"
SUPABASE_HOST="${2:?хост Supabase, например abcd1234.supabase.co}"
EMAIL="${3:?email для HTTPS-сертификата}"
DEPLOY_PUBKEY="${4:?публичный ssh-ключ для деплоя из GitHub Actions}"
API_DOMAIN="api.${DOMAIN}"
WEB_ROOT="/var/www/fit-tracker"

export DEBIAN_FRONTEND=noninteractive
apt-get update -y
apt-get install -y nginx certbot python3-certbot-nginx rsync ufw

# ── Пользователь для деплоя ──────────────────────────────────
id deploy >/dev/null 2>&1 || useradd --create-home --shell /bin/bash deploy
install -d -m 700 -o deploy -g deploy /home/deploy/.ssh
grep -qxF "$DEPLOY_PUBKEY" /home/deploy/.ssh/authorized_keys 2>/dev/null \
  || echo "$DEPLOY_PUBKEY" >> /home/deploy/.ssh/authorized_keys
chown deploy:deploy /home/deploy/.ssh/authorized_keys
chmod 600 /home/deploy/.ssh/authorized_keys

install -d -o deploy -g deploy "$WEB_ROOT"
[ -f "$WEB_ROOT/index.html" ] || echo '<!doctype html><title>Fit Tracker</title>Скоро здесь будет приложение' > "$WEB_ROOT/index.html"
chown -R deploy:deploy "$WEB_ROOT"

# ── nginx ────────────────────────────────────────────────────
cat > /etc/nginx/sites-available/fit-tracker <<NGINX
map \$http_upgrade \$connection_upgrade {
  default upgrade;
  ''      close;
}

# Приложение (SPA)
server {
  listen 80;
  server_name ${DOMAIN};
  root ${WEB_ROOT};

  # index.html и service worker не кэшируем — иначе новая версия не приедет.
  location = /index.html { add_header Cache-Control "no-cache"; }
  location = /sw.js { add_header Cache-Control "no-cache"; }
  # Ассеты с хэшем в имени — неизменяемые, кэшируем надолго.
  location /assets/ { add_header Cache-Control "public, max-age=31536000, immutable"; }

  location / { try_files \$uri \$uri/ /index.html; }
}

# Прокси на Supabase (REST, Auth, Storage)
server {
  listen 80;
  server_name ${API_DOMAIN};
  client_max_body_size 30m; # загрузка фото прогресса

  location / {
    proxy_pass https://${SUPABASE_HOST};
    proxy_ssl_server_name on;
    proxy_ssl_name ${SUPABASE_HOST};
    proxy_set_header Host ${SUPABASE_HOST};
    proxy_http_version 1.1;
    proxy_set_header Upgrade \$http_upgrade;
    proxy_set_header Connection \$connection_upgrade;
    proxy_buffering off;
    proxy_request_buffering off;
    proxy_read_timeout 120s;
  }
}
NGINX

ln -sf /etc/nginx/sites-available/fit-tracker /etc/nginx/sites-enabled/fit-tracker
rm -f /etc/nginx/sites-enabled/default
nginx -t
systemctl enable --now nginx
systemctl reload nginx

# ── Firewall ─────────────────────────────────────────────────
ufw allow OpenSSH
ufw allow 'Nginx Full'
ufw --force enable

# ── HTTPS ────────────────────────────────────────────────────
# DNS (A-записи ${DOMAIN} и ${API_DOMAIN} → IP сервера) должны уже указывать сюда.
certbot --nginx --non-interactive --agree-tos -m "$EMAIL" --redirect \
  -d "$DOMAIN" -d "$API_DOMAIN"

echo
echo "Готово: https://${DOMAIN} (приложение) и https://${API_DOMAIN} (прокси Supabase)"
