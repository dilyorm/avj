# avj.

Social music feed for Tashkent youth (ages 14–22).  
See what friends are listening to — in real time.

**Stack:** React 18 + Vite · FastAPI · TypeScript · Tailwind CSS v3

---

## Quick start

### Backend (Python 3.11+)

```bash
cd backend
pip install -r requirements.txt
python main.py
# → http://localhost:8000
# → API docs: http://localhost:8000/docs
```

### Frontend

```bash
cd frontend
npm install
npm run dev
# → http://localhost:5173
```

---

## Screens

| Route | Screen |
|---|---|
| `/` | Welcome / Landing |
| `/setup` | Profile setup |
| `/connect` | Connect Spotify / Yandex Music |
| `/home` | Home feed — Cards view |
| `/home/list` | Home feed — List view |
| `/home/stack` | Home feed — Stack/Hero view |
| `/home/empty` | Empty feed state |
| `/song/:id` | Song detail |
| `/friend/:id` | Friend profile |
| `/friends/add` | Add friends / search |
| `/search` | Search |
| `/profile` | My profile |

---

## Design system

| Token | Value |
|---|---|
| `--bg` | `#0F1419` |
| `--accent` | `#3DDC97` (live/now-playing — used exclusively) |
| `--font` | Manrope |
| `--font-mono` | IBM Plex Mono |

Dark-first. One accent color. Light mode toggle in profile screen and welcome screen.

---

## API endpoints

```
GET  /api/health
GET  /api/me
GET  /api/friends
GET  /api/friends/:id
POST /api/friends/:id/add
GET  /api/suggestions
POST /api/connect/:platform     (spotify|yandex)
DEL  /api/connect/:platform
WS   /ws/feed                   (real-time friend updates)
```

WebSocket pushes `friend_update` events every ~20s to simulate live listening changes.
