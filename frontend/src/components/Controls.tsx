import { useState } from 'react'

interface Props {
  genre: string
  iconic: number
  onGenreChange: (v: string) => void
  onIconicChange: (v: number) => void
}

export default function Controls({ genre, iconic, onGenreChange, onIconicChange }: Props) {
  const [open, setOpen] = useState(false)

  return (
    <div className="rounded-xl border border-gray-700 overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-4 py-3 text-sm text-gray-400 hover:text-gray-200 transition-colors"
      >
        <span>Tune the vibe</span>
        <span className="text-lg">{open ? '▲' : '▼'}</span>
      </button>

      {open && (
        <div className="px-4 pb-4 space-y-4 border-t border-gray-700">
          <div>
            <label className="block text-xs text-gray-400 mb-1 mt-3">Genre / energy</label>
            <input
              type="text"
              value={genre}
              onChange={e => onGenreChange(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-gray-900 text-white text-sm border border-gray-700 focus:outline-none focus:border-orange-500"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">
              Anthem dial — <span className="text-white">{iconic}</span>
              <span className="ml-1 text-gray-500">(0 = fresh picks · 100 = crowd anthems)</span>
            </label>
            <input
              type="range"
              min={0}
              max={100}
              value={iconic}
              onChange={e => onIconicChange(Number(e.target.value))}
              className="w-full accent-orange-500"
            />
          </div>
        </div>
      )}
    </div>
  )
}
