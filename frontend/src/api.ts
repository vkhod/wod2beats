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

export interface CurationResult {
  core_min: number
  core_note?: string
  buildup: Track[]
  core: Track[]
}

export interface GenerateResponse {
  curation: CurationResult
  buildup_playlist: PlaylistOut | null
  core_playlist: PlaylistOut | null
}

const BASE = import.meta.env.VITE_API_BASE_URL ?? ''

export async function generate(req: GenerateRequest): Promise<GenerateResponse> {
  const res = await fetch(`${BASE}/api/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(req),
  })
  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText)
    throw new Error(`${res.status}: ${text}`)
  }
  return res.json()
}
