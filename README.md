# WOD2Beats

> *It's 6:58 AM. The coach hits play. The gym hears "Eye of the Tiger" for the fourth time this week.*
>
> **There had to be a better way.**

**WOD2Beats** takes a CrossFit workout — pasted text or a phone screenshot — and turns it into two fresh YouTube playlists in seconds: a **Build-up** list for the strength block, and a **Core** list timed precisely to the conditioning piece. Different every day. No repeats for two weeks. No "Eye of the Tiger."

The secret: Claude reads the WOD like a coach, figures out the vibe and duration of each segment, and curates real, well-known tracks. YouTube is just the delivery mechanism.

---

## How it works

```
[WOD text / screenshot]
        │
        ▼
   Claude (curator)
   ├─ parses segments (Build / Engine / Cool-down)
   ├─ estimates Engine duration
   └─ proposes real song titles + artists per segment
        │
        ▼
   YouTube Data API (resolver)
   ├─ searches each track
   ├─ filters region-blocked / wrong-length / unofficial results
   ├─ prefers Artist-Topic / VEVO channels
   └─ fills Core list to exactly the Engine's clock
        │
        ▼
   Two public playlists  ←  scan QR / open link on gym iPad
   WOD2Beats-20260603-Buildup
   WOD2Beats-20260603-Core
```

**Anti-repeat:** a rolling 14-day SQLite log makes sure the same track can't come back before two weeks have passed.

**Genre + vibe controls:** tune the `genre` and `iconic` (0–100 anthem dial) parameters per request — or leave the defaults for mainstream rock energy that works in any gym.

---

## Stack

| Layer | What |
|---|---|
| Curator | [Claude](https://anthropic.com) (Haiku by default, swap to Sonnet for richer picks) |
| API | FastAPI · Python 3.11 |
| Resolver | YouTube Data API v3 |
| Auth | AWS Cognito + Google federation (optional — bypassable for local dev) |
| State | SQLite (anti-repeat history + prefs) |
| Frontend | React + Vite + TypeScript + Tailwind CSS · mobile-first, dark theme |
| Deploy | Docker + Caddy (auto-TLS) on a Hetzner VPS |

---

## Quickstart (local, no Cognito)

### 1. Clone and set up Python

```bash
git clone https://github.com/vkhod/wod2beats.git /opt/wod2beats
cd /opt/wod2beats
python -m venv .venv
# macOS/Linux:
source .venv/bin/activate
# Windows:
.venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env
```

### 2. Google Cloud — YouTube Data API

1. [Create a project](https://console.cloud.google.com/) → enable **YouTube Data API v3**.
2. Create an **OAuth 2.0 client** (type: *Desktop app*). Add the client ID and secret to `.env`.
3. On the OAuth consent screen set publishing to **Production** — this gives a non-expiring refresh token (no formal verification needed for <100 users; you'll click through one "unverified app" warning).

### 3. Capture the YouTube refresh token (one-time)

```bash
python -m scripts.connect_youtube
```

Sign in with the account the playlists should publish to (e.g. the gym's shared iPad account). Paste the printed token into `.env` as `YOUTUBE_REFRESH_TOKEN`.

### 4. Anthropic API key

Add your key to `.env` as `ANTHROPIC_API_KEY`. Haiku is the default — cheap and fast enough for curation.

### 5. Run

Leave `COGNITO_USER_POOL_ID` empty in `.env` to bypass auth for local development.

```bash
uvicorn app.main:app --reload
```

Health check (no auth required):
```
GET http://localhost:8000/healthz
→ {"ok": true, "youtube_connected": true}
```

### 6. Generate a playlist from a WOD

```bash
curl -X POST http://localhost:8000/api/generate \
  -H "Content-Type: application/json" \
  -d '{"wod_text": "Build: 5x5 back squat\nEngine: 20 min AMRAP - 10 burpees, 15 wall balls, 20 cal row"}'
```

Or send a phone screenshot:

```python
import base64, httpx

img = base64.b64encode(open("wod.png", "rb").read()).decode()
r = httpx.post("http://localhost:8000/api/generate", json={"wod_image_b64": img})
print(r.json()["buildup_playlist"]["url"])
print(r.json()["core_playlist"]["url"])
```

### 7. Run the frontend (local dev)

```bash
cd frontend
cp .env.local.example .env.local   # or create manually — see below
npm install
npm run dev
```

Create `frontend/.env.local`:
```
VITE_API_BASE_URL=http://localhost:8000
VITE_APP_USER=gym
VITE_APP_PASSWORD=changeme
```

Opens at `http://localhost:5173`. Photo tab is the default — tap to photograph or drag a WOD screenshot.

---

## Deploy (Docker + Caddy)

```bash
# on the server
git clone https://github.com/vkhod/wod2beats.git /opt/wod2beats
cp /opt/wod2beats/.env.example /opt/wod2beats/.env   # fill in real values
# edit Caddyfile → replace your-domain.com
docker compose up -d
```

The compose file starts two containers:

| Service | Port | What |
|---|---|---|
| `api` | 8232 | FastAPI backend |
| `frontend` | 8231 | React app (nginx) |

Add `VITE_API_BASE_URL`, `VITE_APP_USER`, and `VITE_APP_PASSWORD` to `.env` alongside the other
secrets — the frontend build args pick them up automatically.

CI/CD is wired via GitHub Actions (`.github/workflows/deploy.yml`): push to `main` → SSH deploy → `docker compose up -d --build`. Add `HETZNER_HOST`, `HETZNER_USER`, and `HETZNER_SSH_KEY` to your repo's Actions secrets.

---

## Quota

`search.list` costs 100 units; `videos.list` 1 unit (batched); playlist inserts ~50. Two playlists a day sits well under the free 10,000 units/day. Resolution caching (song → video_id) is a planned optimisation, not a launch blocker.

---

## Roadmap

- [x] Curator → resolver → public playlists, local
- [x] Screenshot / image input (Claude vision)
- [x] Anti-repeat 14-day rolling log
- [x] Docker + CI/CD (backend live on Hetzner at port 8232)
- [x] React mobile frontend — photo-first, login gate, playlist result cards (port 8231)
- [ ] Caddy + auto-TLS on Hetzner (waiting on domain)
- [ ] Resolution cache (cut quota cost)
- [ ] AWS Cognito login (currently bypassed)
- [ ] Per-user YouTube accounts (each friend publishes to their own channel)

---

## Contributing

Issues and PRs welcome. If you run a gym and want this working yesterday — same, that's why it exists.
