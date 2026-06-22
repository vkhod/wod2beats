"""WOD2Beats API.

Morning flow: client signs in -> POST /api/generate with the WOD ->
curator proposes three lists (build-up, core, filler) -> YouTube resolves +
creates one PUBLIC playlist -> link + coach anchors come back.
Anti-repeat history is read before curation, written after."""
from contextlib import asynccontextmanager
from datetime import date

from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from .config import settings
from .db import init_db, add_used
from .models import GenerateRequest, GenerateResponse, PlaylistOut, AnchorInfo
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
    pl_name = f"WOD2Beats-{stamp}"
    target = req.core_target_min or curation.core_min

    url, all_tracks, core_idx, filler_idx = youtube.build_combined_playlist(
        pl_name,
        curation.buildup,
        curation.core,
        curation.filler,
        core_min=target,
    )

    # Partition resolved tracks back into the curation sections
    curation.buildup = all_tracks[:core_idx]
    curation.core = all_tracks[core_idx:filler_idx]
    curation.filler = all_tracks[filler_idx:]

    add_used([f"{t.artist} — {t.title}" for t in all_tracks])

    skill_end = all_tracks[core_idx - 1] if core_idx > 0 else None
    wod_start = all_tracks[core_idx] if core_idx < len(all_tracks) else None
    has_filler = len(all_tracks) > filler_idx
    filler_warning = "" if has_filler else "Tight schedule — no buffer time after the metcon"

    return GenerateResponse(
        curation=curation,
        playlist=PlaylistOut(name=pl_name, url=url, track_count=len(all_tracks)),
        core_start_index=core_idx,
        filler_start_index=filler_idx,
        anchors=AnchorInfo(
            skill_end_song=skill_end,
            wod_start_song=wod_start,
            filler_warning=filler_warning,
        ),
    )
