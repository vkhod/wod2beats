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

## Conventions
- Python 3.11+, FastAPI, pydantic v2. Keep deps minimal (see `requirements.txt`).
- Secrets only via env / `.env` (never in code or git). Frontend never sees keys.
- Playlists are always `privacyStatus: "public"`.

## Roadmap / phases
1. **Core loop (now):** wire curator → resolver → public playlists under one account; run locally.
2. **Deploy:** containerize, Caddy reverse proxy + auto-TLS on the Hetzner box, Cognito login,
   mobile React frontend against `/api/generate`.
3. **Package for friends:** setup doc, each friend their own Google project (publish unverified).
4. **Later — per-user accounts:** let each logged-in user publish to *their own* YouTube account by
   storing a refresh token **per Cognito identity** and looking it up at generate time (instead of one
   shared account). Same two-flow shape, just keyed by user.

## Known TODOs
- Cache song → video_id resolution to cut the 100-unit-per-search quota cost.
- Tighten CORS to the real frontend origin.
- Optional: show the parsed WOD for confirmation when curator confidence is low.
- Optional: QR code for the playlist link (for the gym iPad).
