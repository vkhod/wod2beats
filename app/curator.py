"""The curator brain. Same logic the prototype validated, now server-side:
parse a WOD (text or screenshot) and propose two real, well-known track lists.
The model is the *curator*; YouTube (youtube.py) is just the resolver."""
import json
import re

from anthropic import Anthropic

from .config import settings
from .models import CurationResult, Track, Segment
from .db import recent_used

_client = Anthropic(api_key=settings.anthropic_api_key)

SYSTEM = (
    "You parse functional-fitness workouts and curate music. "
    "Reply with strictly valid minified JSON only — no markdown, no code fences, no commentary."
)


def _prompt(req, avoid: list[str]) -> str:
    avoid_block = (
        "\nDo NOT reuse any of these recently-used tracks (pick different songs/artists):\n- "
        + "\n- ".join(avoid)
    ) if avoid else ""
    tgt = (
        f"\nThe coach wants the CORE list to total about {req.core_target_min} minutes — size it to that."
        if req.core_target_min else ""
    )
    wod = "(see attached screenshot)" if req.wod_image_b64 else (req.wod_text or "")
    return f"""You are a music curator for a functional-fitness / CrossFit class. Read the workout and do two jobs.

JOB 1 — Parse the session into ordered segments. For each: name, estimated duration in minutes, intensity (low/med/high). Find the conditioning piece (often labelled "Engine", "Metcon", "WOD", AMRAP, EMOM, RFT, "For Time") — that is the CORE. Estimate the CORE's duration: use explicit caps/round counts where given; for an uncapped "For Time" piece, estimate a typical class athlete's time and say it's an estimate.

JOB 2 — Curate TWO playlists of REAL, well-known songs that exist on YouTube (exact artist + title; avoid obscure tracks that may not exist):
- BUILD-UP: soundtrack for the strength/skill/warm-up blocks. Groove, steady, in-the-pocket. ~6 tracks.
- CORE: track durations should SUM to roughly the CORE duration (slightly over is good). High energy, driving, push-forward. ~5-7 tracks.

Style controls:
- Genre lean: {req.genre}.
- Iconic-anthem dial = {req.iconic}/100. Higher = more universally-recognised montage anthems (e.g. Rocky-style). Lower = more current/cool, less cheese.{tgt}{avoid_block}

WORKOUT:
{wod}

Output ONLY minified JSON, this exact schema:
{{"session":[{{"name":"","min":0,"intensity":"low|med|high"}}],"core":{{"name":"","min":0,"note":""}},"buildup":[{{"t":"","a":"","why":"","min":0}}],"coreList":[{{"t":"","a":"","why":"","min":0}}]}}
Keep every "why" to 6 words max. "min" are numbers (decimals ok)."""


def curate(req) -> CurationResult:
    avoid = recent_used(days=14)

    content = []
    if req.wod_image_b64:
        content.append({
            "type": "image",
            "source": {
                "type": "base64",
                "media_type": req.wod_image_media_type or "image/png",
                "data": req.wod_image_b64,
            },
        })
    content.append({"type": "text", "text": _prompt(req, avoid)})

    msg = _client.messages.create(
        model=settings.curator_model,
        max_tokens=1500,
        system=SYSTEM,
        messages=[{"role": "user", "content": content}],
    )

    raw = "".join(b.text for b in msg.content if b.type == "text").strip()
    raw = re.sub(r"```json|```", "", raw).strip()
    a, b = raw.find("{"), raw.rfind("}")
    data = json.loads(raw[a:b + 1])

    return CurationResult(
        session=[
            Segment(name=s["name"], minutes=s.get("min", 0), intensity=s.get("intensity", ""))
            for s in data.get("session", [])
        ],
        core_name=data["core"]["name"],
        core_min=data["core"].get("min", 0),
        core_note=data["core"].get("note", ""),
        buildup=[
            Track(title=t["t"], artist=t["a"], why=t.get("why", ""), minutes=t.get("min", 0))
            for t in data.get("buildup", [])
        ],
        core=[
            Track(title=t["t"], artist=t["a"], why=t.get("why", ""), minutes=t.get("min", 0))
            for t in data.get("coreList", [])
        ],
    )
