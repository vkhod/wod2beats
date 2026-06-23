export interface GenerateRequest {
  wod_text?: string
  wod_image_b64?: string
  wod_image_media_type?: string
  genre?: string
  iconic?: number
  core_target_min?: number | null
}

export interface PlaylistOut {
  name: string
  url: string
  track_count: number
}

export interface Track {
  title: string
  artist: string
  why?: string
  minutes?: number
  video_id?: string | null
  youtube_url?: string | null
}

export interface Segment {
  name: string
  minutes: number
  intensity: 'low' | 'med' | 'high'
}

export interface CurationResult {
  session: Segment[]
  core_name: string
  core_min: number
  core_note?: string
  buildup: Track[]
  core: Track[]
  filler: Track[]
}

export interface AnchorInfo {
  skill_end_song: Track | null
  wod_start_song: Track | null
  filler_warning: string
}

export interface GenerateResponse {
  curation: CurationResult
  playlist: PlaylistOut | null
  core_start_index: number
  filler_start_index: number
  anchors: AnchorInfo
}

const BASE = import.meta.env.VITE_API_BASE_URL ?? ''

export async function generate(req: GenerateRequest): Promise<GenerateResponse> {
  let res: Response
  try {
    res = await fetch(`${BASE}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req),
    })
  } catch {
    const target = BASE || window.location.origin
    const reason = navigator.onLine
      ? 'Server may be down or unreachable.'
      : 'No network connection.'
    throw new Error(`Cannot reach the API at ${target} — ${reason}`)
  }

  if (!res.ok) {
    const body = await res.text().catch(() => '')
    let detail = body || res.statusText
    try {
      const json = JSON.parse(body) as { detail?: unknown }
      if (typeof json.detail === 'string') {
        detail = json.detail
      } else if (Array.isArray(json.detail)) {
        detail = (json.detail as Array<{ msg: string }>).map(d => d.msg).join('; ')
      }
    } catch {
      // body is plain text, use as-is
    }
    throw new Error(`Server error ${res.status}: ${detail}`)
  }

  return res.json()
}
