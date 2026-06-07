"""WOD2Beats API.

Morning flow: client signs in (Cognito) -> POST /api/generate with the WOD ->
curator proposes two lists -> YouTube resolves + creates two PUBLIC playlists ->
links come back. Anti-repeat history is read before curation, written after."""
from contextlib import asynccontextmanager
from datetime import date

from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from .config import settings
from .db import init_db, add_used
from .models import GenerateRequest, GenerateResponse, PlaylistOut
from .curator import curate
from . import youtube
from .auth import require_user


@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    yield


app = FastAPI(title="WOD2Beats", lifespan=lifespan)

# TODO (prod): restrict origins to your frontend domain instead of "*".
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/healthz")
def health():
    return {"ok": True, "youtube_connected": bool(settings.youtube_refresh_token)}


@app.post("/api/generate", response_model=GenerateResponse)
def generate(req: GenerateRequest, user: dict = Depends(require_user)):
    if not req.wod_text and not req.wod_image_b64:
        raise HTTPException(400, "Provide wod_text or wod_image_b64")

    curation = curate(req)

    stamp = date.today().strftime("%Y%m%d")
    bu_name = f"WOD2Beats-{stamp}-Buildup"
    core_name = f"WOD2Beats-{stamp}-Core"

    bu_url, bu_tracks = youtube.build_playlist(bu_name, curation.buildup, None)
    target = req.core_target_min or curation.core_min
    core_url, core_tracks = youtube.build_playlist(core_name, curation.core, target)

    curation.buildup, curation.core = bu_tracks, core_tracks
    add_used([f"{t.artist} — {t.title}" for t in bu_tracks + core_tracks])

    return GenerateResponse(
        curation=curation,
        buildup_playlist=PlaylistOut(name=bu_name, url=bu_url, track_count=len(bu_tracks)),
        core_playlist=PlaylistOut(name=core_name, url=core_url, track_count=len(core_tracks)),
    )
