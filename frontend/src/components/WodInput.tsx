import { useRef, useState } from 'react'
import type { GenerateRequest } from '../api'
import Controls from './Controls'

interface Props {
  onSubmit: (req: GenerateRequest) => void
  loading: boolean
}

const DEFAULT_GENRE = "Mainstream hits with classic-rock energy — no metal"
const DEFAULT_ICONIC = 35

export default function WodInput({ onSubmit, loading }: Props) {
  const [tab, setTab] = useState<'photo' | 'text'>('photo')
  const [text, setText] = useState('')
  const [imageB64, setImageB64] = useState<string | null>(null)
  const [imageType, setImageType] = useState('image/jpeg')
  const [preview, setPreview] = useState<string | null>(null)
  const [genre, setGenre] = useState(DEFAULT_GENRE)
  const [iconic, setIconic] = useState(DEFAULT_ICONIC)
  const fileRef = useRef<HTMLInputElement>(null)

  function handleFile(file: File | undefined) {
    if (!file) return
    setImageType(file.type || 'image/jpeg')
    const reader = new FileReader()
    reader.onload = e => {
      const dataUrl = e.target?.result as string
      setPreview(dataUrl)
      // strip "data:<type>;base64," prefix
      setImageB64(dataUrl.split(',')[1])
    }
    reader.readAsDataURL(file)
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    handleFile(e.dataTransfer.files[0])
  }

  function handleSubmit() {
    const req: GenerateRequest = { genre, iconic }
    if (tab === 'photo' && imageB64) {
      req.wod_image_b64 = imageB64
      req.wod_image_media_type = imageType
    } else if (tab === 'text' && text.trim()) {
      req.wod_text = text.trim()
    }
    onSubmit(req)
  }

  const canSubmit = !loading && (tab === 'photo' ? !!imageB64 : !!text.trim())

  return (
    <div className="space-y-4">
      {/* Tab bar */}
      <div className="flex rounded-xl bg-gray-800 p-1 gap-1">
        {(['photo', 'text'] as const).map(t => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-colors ${
              tab === t
                ? 'bg-orange-500 text-white'
                : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            {t === 'photo' ? '📷 Photo' : '✏️ Text'}
          </button>
        ))}
      </div>

      {/* Photo tab */}
      {tab === 'photo' && (
        <div>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={e => handleFile(e.target.files?.[0])}
          />
          {preview ? (
            <div className="relative">
              <img
                src={preview}
                alt="WOD preview"
                className="w-full rounded-xl object-cover max-h-64"
              />
              <button
                type="button"
                onClick={() => { setPreview(null); setImageB64(null); if (fileRef.current) fileRef.current.value = '' }}
                className="absolute top-2 right-2 bg-gray-900/80 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm"
              >
                ✕
              </button>
            </div>
          ) : (
            <div
              onClick={() => fileRef.current?.click()}
              onDrop={handleDrop}
              onDragOver={e => e.preventDefault()}
              className="flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-gray-600 hover:border-orange-500 active:border-orange-400 cursor-pointer px-6 py-12 transition-colors"
            >
              <span className="text-4xl">📷</span>
              <p className="text-gray-300 font-medium text-center">Tap to photograph or upload your WOD</p>
              <p className="text-gray-500 text-sm text-center">Opens camera on mobile · drag & drop or browse on desktop</p>
            </div>
          )}
        </div>
      )}

      {/* Text tab */}
      {tab === 'text' && (
        <textarea
          value={text}
          onChange={e => setText(e.target.value)}
          rows={7}
          placeholder={"Build: 5×5 back squat @ 80%\nEngine: 20 min AMRAP\n  10 burpees\n  15 wall balls\n  20 cal row"}
          className="w-full px-4 py-3 rounded-xl bg-gray-800 text-white placeholder-gray-600 border border-gray-700 focus:outline-none focus:border-orange-500 text-sm leading-relaxed resize-none"
        />
      )}

      {/* Controls (collapsed) */}
      <Controls
        genre={genre}
        iconic={iconic}
        onGenreChange={setGenre}
        onIconicChange={setIconic}
      />

      {/* Generate button */}
      <button
        type="button"
        onClick={handleSubmit}
        disabled={!canSubmit}
        className="w-full py-4 rounded-xl bg-orange-500 hover:bg-orange-400 active:bg-orange-600 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold text-base transition-colors"
      >
        Generate Playlists
      </button>
    </div>
  )
}
