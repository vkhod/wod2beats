# WOD2Beats — context for Claude Code

A small mobile-first web app that turns a CrossFit/functional-fitness workout (the "WOD",
pasted text or a screenshot) into two **public** YouTube playlists: a **Build-up** list for the
strength/skill block and a **Core** list timed to the workout's conditioning piece (the "Engine").
Born to stop the gym's 7am coach from replaying the same songs forever.

## Architecture
- **Curator (the brain):** `app/curator.py` calls Claude to parse the WOD and *propose* real,
  well-known songs per segment. The model is the curator (it knows which songs are gym anthems);
  YouTube is only the resolver. Genre lean + an "iconic-anthem" dial + anti-repeat are prompt controls.
- **Resolver:** `app/youtube.py` turns proposed songs into real video IDs via `search.list`,
  filters with `videos.list` (region-block check against `TARGET_REGION`, duration sanity, prefer
  official "- Topic"/VEVO channels), creates the two public playlists, and fills the Core list to
  the Engine's clock.
- **Auth:** two separate flows. (1) **Login** = AWS Cognito + Google federation + email allow-list,
  validated per request in `app/auth.py`. (2) **YouTube authorization** = a one-time offline Google
  OAuth (`scripts/connect_youtube.py`) that stores a refresh token; playlists publish to *that* account.
- **State:** `app/db.py` (SQLite) holds prefs + the rolling "recently used" track list (cross-day anti-repeat).
- **API:** `app/main.py` — `POST /api/generate`.
- **Frontend:** `frontend/` — Vite + React + TypeScript + Tailwind. Mobile-first, dark theme.
  Photo tab is the primary input (opens camera on mobile). Simple username/password gate
  (`VITE_APP_USER` / `VITE_APP_PASSWORD`) keeps the test instance private. Served by nginx
  on port 8231 via its own Docker container.

## Frontend env vars (baked into the build)
| Var | Purpose |
|---|---|
| `VITE_API_BASE_URL` | URL the browser uses to reach the API (e.g. `http://77.42.123.217:8232`) |
| `VITE_APP_USER` | Login screen username |
| `VITE_APP_PASSWORD` | Login screen password |

Set these in the root `.env` (picked up by docker-compose build args) or in
`frontend/.env.local` for local `npm run dev`.

## Conventions
- Python 3.11+, FastAPI, pydantic v2. Keep deps minimal (see `requirements.txt`).
- Secrets only via env / `.env` (never in code or git). Frontend never sees API keys.
- Playlists are always `privacyStatus: "public"`.
- Frontend: `import type` for all type-only imports (verbatimModuleSyntax is on).

## Roadmap / phases
1. **Core loop ✓** wire curator → resolver → public playlists under one account; run locally.
2. **Deploy ✓** Docker + CI/CD (GitHub Actions → SSH → Hetzner). Backend live at port 8232.
3. **Frontend ✓** React mobile UI — photo-first WOD input, login gate, playlist result cards.
   Live at port 8231 after next push.
4. **Caddy + TLS** reverse proxy on a real domain (waiting on domain purchase).
5. **Package for friends:** setup doc, each friend their own Google project (publish unverified).
6. **Later — per-user accounts:** let each logged-in user publish to *their own* YouTube account by
   storing a refresh token **per Cognito identity** and looking it up at generate time (instead of one
   shared account). Same two-flow shape, just keyed by user.

## Known TODOs
- Cache song → video_id resolution to cut the 100-unit-per-search quota cost.
- Tighten CORS to the real frontend origin (currently `*`).
- AWS Cognito setup and wiring (currently bypassed — `COGNITO_USER_POOL_ID` empty).
- Optional: show the parsed WOD for confirmation when curator confidence is low.
- Optional: QR code for the playlist link (for the gym iPad).
