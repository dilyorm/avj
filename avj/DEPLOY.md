# Deploying avj to avj.dilyor.dev

## Prerequisites on VPS

- Ubuntu 22.04+ (or Debian)
- Docker + Docker Compose v2
- Domain `avj.dilyor.dev` DNS A record → VPS IP

---

## 1. Spotify Dashboard (one-time)

Go to [developer.spotify.com/dashboard](https://developer.spotify.com/dashboard) → your app → Edit Settings:

- Add Redirect URI: `https://avj.dilyor.dev/api/connect/spotify/callback`
- Save

---

## 2. Clone repo on VPS

```bash
git clone https://github.com/dilyorm/avj.git /opt/avj
cd /opt/avj
```

---

## 3. Create secret files (NOT in git)

**Root `.env`** — postgres password for docker-compose:
```bash
cat > /opt/avj/.env << 'EOF'
POSTGRES_PASSWORD=your_very_strong_password_here
EOF
```

**`backend/.env`** — all backend secrets:
```bash
cat > /opt/avj/backend/.env << 'EOF'
SECRET_KEY=<run: python3 -c "import secrets; print(secrets.token_hex(32))">

DATABASE_URL=postgresql+asyncpg://avj:your_very_strong_password_here@postgres:5432/avj

SPOTIFY_CLIENT_ID=<your_spotify_client_id>
SPOTIFY_CLIENT_SECRET=<your_spotify_client_secret>
SPOTIFY_REDIRECT_URI=https://avj.dilyor.dev/api/connect/spotify/callback

YANDEX_CLIENT_ID=

POLL_INTERVAL=30
CORS_ORIGINS=https://avj.dilyor.dev
FRONTEND_URL=https://avj.dilyor.dev
EOF
```

> **Note:** `POSTGRES_PASSWORD` in `backend/.env` → `DATABASE_URL` must match the root `.env` value.

---

## 4. Build and start

```bash
cd /opt/avj
docker compose up -d --build
```

All three services start: `postgres` → `backend` → `frontend`.

Tables are auto-created on first backend startup (`init_db()`).

---

## 5. HTTPS with Caddy (recommended)

```bash
apt install -y debian-keyring debian-archive-keyring apt-transport-https
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' | tee /etc/apt/sources.list.d/caddy-stable.list
apt update && apt install caddy
```

`/etc/caddy/Caddyfile`:
```
avj.dilyor.dev {
    reverse_proxy localhost:80
}
```

```bash
systemctl enable --now caddy
```

Caddy auto-provisions Let's Encrypt TLS. Done.

---

## 6. Updates

```bash
cd /opt/avj
git pull
docker compose up -d --build
```

---

## Checklist

- [ ] VPS with Docker
- [ ] DNS A record: `avj.dilyor.dev` → VPS IP
- [ ] Spotify redirect URI added in dashboard
- [ ] Root `.env` created with `POSTGRES_PASSWORD`
- [ ] `backend/.env` created with all secrets
- [ ] Caddy installed + Caddyfile set
- [ ] `docker compose up -d --build` run
