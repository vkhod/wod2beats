from pydantic import BaseModel


class GenerateRequest(BaseModel):
    wod_text: str | None = None
    wod_image_b64: str | None = None
    wod_image_media_type: str | None = "image/png"
    genre: str = "Mainstream hits with classic-rock energy — no metal"
    iconic: int = 35           # 0..100, higher = more universally-known anthems
    core_target_min: float | None = None   # override the estimated Engine duration
    language: str = "EN"       # deferred feature; EN for the first build


class Track(BaseModel):
    title: str
    artist: str
    why: str = ""
    minutes: float = 0
    video_id: str | None = None
    youtube_url: str | None = None


class Segment(BaseModel):
    name: str
    minutes: float
    intensity: str


class CurationResult(BaseModel):
    session: list[Segment]
    core_name: str
    core_min: float
    core_note: str = ""
    buildup: list[Track]
    core: list[Track]
    filler: list[Track] = []


class AnchorInfo(BaseModel):
    skill_end_song: Track | None = None   # last build-up track → skill block wrapping up
    wod_start_song: Track | None = None   # first core track → begin main WOD
    filler_warning: str = ""              # non-empty when no buffer time remains after metcon


class PlaylistOut(BaseModel):
    name: str
    url: str
    track_count: int


class GenerateResponse(BaseModel):
    curation: CurationResult
    playlist: PlaylistOut | None = None
    core_start_index: int = 0
    filler_start_index: int = 0
    anchors: AnchorInfo = AnchorInfo()
