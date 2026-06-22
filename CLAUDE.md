# WOD2Beats — context for Claude Code

A small mobile-first web app that turns a CrossFit/functional-fitness workout (the "WOD",
pasted text or a screenshot) into a single **public** YouTube playlist that carries the coach
through the entire 60-minute class by ear. Born to stop the gym's 7am coach from replaying
the same songs forever.

## How it works

The playlist is an **audio guide** for the coach — no need to watch a clock. Specific songs
signal when to transition between phases:

- **Build-up** songs play during warm-up and skill/strength blocks
- The **Main WOD** section starts when a named "anchor song" plays → coach hears the cue and
  kicks off the conditioning piece
- **Filler / cool-down** songs fill the remainder of the 60-minute class after the metcon
  (target: content ends at 55 min, leaving a 5-min buffer before the time cap)

The result card shows **Coach Anchors** prominently: the last build-up song ("skill block
wrapping up") and the first core song ("BEGIN MAIN WOD"). If there's no room for filler
after the metcon, the coach sees a warning instead.

## Architecture
- **Curator (the brain):** `app/curator.py` calls Claude to parse the WOD and *propose* real,
  well-known songs for **three sections**: build-up, core (timed to the Engine), and filler
  (fills to ~55 min total). The model is the curator; YouTube is only the resolver.
  Genre lean + an "iconic-anthem" dial + anti-repeat are prompt controls.
- **Resolver:** `app/youtube.py` turns proposed songs into real video IDs via `search.list`,
  filters with `videos.list` (region-block check against `TARGET_REGION`, duration sanity,
  prefer official "- Topic"/VEVO channels), and creates **one public playlist** via
  `build_combined_playlist()`. Build-up → Core (stops at `core_min`) → Filler (stops at 55 min).
- **Auth:** two separate flows. (1) **Login** = AWS Cognito + Google federation + email allow-list,
  validated per request in `app/auth.py`. (2) **YouTube authorization** = a one-time offline Google
  OAuth (`scripts/connect_youtube.py`) that stores a refresh token; playlists publish to *that* account.
- **State:** `app/db.py` (SQLite) holds prefs + the rolling "recently used" track list (cross-day anti-repeat).
- **API:** `app/main.py` — `POST /api/generate`. Returns `playlist` (single `PlaylistOut`),
  `anchors` (`AnchorInfo` with `skill_end_song`, `wod_start_song`, `filler_warning`),
  `core_start_index`, and `filler_start_index`.
- **Frontend:** `frontend/` — Vite + React + TypeScript + Tailwind. Mobile-first, dark theme.
  Photo tab is the primary input (opens camera on mobile). Simple username/password gate
  (`VITE_APP_USER` / `VITE_APP_PASSWORD`) keeps the test instance private. Served by nginx
  on port 8231 via its own Docker container.

## Key data models (`app/models.py`)
- `CurationResult` — curator output: `session`, `core_name`, `core_min`, `buildup`, `core`, `filler`
- `AnchorInfo` — `skill_end_song`, `wod_start_song` (both `Track | None`), `filler_warning: str`
- `GenerateResponse` — `curation`, `playlist`, `core_start_index`, `filler_start_index`, `anchors`

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
4. **Smart playlist ✓** Single 60-min playlist with coach anchors, filler fill, and section markers.
5. **Caddy + TLS** reverse proxy on a real domain (waiting on domain purchase).
6. **In-app YouTube OAuth** — button in the app to connect the gym's YouTube account instead of
   running `scripts/connect_youtube.py` via SSH.
7. **Package for friends:** setup doc, each friend their own Google project (publish unverified).
8. **Later — per-user accounts:** let each logged-in user publish to *their own* YouTube account by
   storing a refresh token **per Cognito identity** and looking it up at generate time.

## Known TODOs
- Cache song → video_id resolution to cut the 100-unit-per-search quota cost.
- Tighten CORS to the real frontend origin (currently `*`).
- AWS Cognito setup and wiring (currently bypassed — `COGNITO_USER_POOL_ID` empty).
- In-app YouTube OAuth (see roadmap item 6).
- Optional: show the parsed WOD for confirmation when curator confidence is low.
