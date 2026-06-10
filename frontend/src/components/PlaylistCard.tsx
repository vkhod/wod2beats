import { QRCodeSVG } from 'qrcode.react'
import type { PlaylistOut, Segment } from '../api'

interface Props {
  playlist: PlaylistOut
  type: 'buildup' | 'core'
  segments: Segment[]
  coreName?: string
  coreNote?: string
}

const config = {
  buildup: {
    label: 'Build-up',
    color: 'bg-blue-500',
    ring: 'focus:ring-blue-400',
    btn: 'bg-blue-600 hover:bg-blue-500 active:bg-blue-700',
  },
  core: {
    label: 'Core (Engine)',
    color: 'bg-orange-500',
    ring: 'focus:ring-orange-400',
    btn: 'bg-orange-500 hover:bg-orange-400 active:bg-orange-600',
  },
}

const intensityDot: Record<string, string> = {
  low: 'bg-green-400',
  med: 'bg-yellow-400',
  high: 'bg-orange-400',
}

export default function PlaylistCard({ playlist, type, segments, coreName, coreNote }: Props) {
  const c = config[type]
  const totalMin = segments.reduce((sum, s) => sum + s.minutes, 0)

  return (
    <div className="rounded-2xl bg-gray-800 border border-gray-700 p-5 flex flex-col gap-3">
      {/* Badge + track count */}
      <div className="flex items-center gap-2">
        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full text-white ${c.color}`}>
          {c.label}
        </span>
        <span className="text-gray-400 text-sm">{playlist.track_count} tracks</span>
      </div>

      {/* Core name (Engine card only) */}
      {coreName && (
        <p className="text-gray-200 text-sm font-medium">{coreName}</p>
      )}

      {/* Segment breakdown */}
      {segments.length > 0 && (
        <div className="flex flex-col gap-1">
          {segments.map((seg, i) => (
            <div key={i} className="flex items-center gap-2 text-sm">
              <span className={`w-2 h-2 rounded-full flex-shrink-0 ${intensityDot[seg.intensity] ?? 'bg-gray-400'}`} />
              <span className="text-gray-300 flex-1">{seg.name}</span>
              <span className="text-gray-400 tabular-nums">{seg.minutes} min</span>
            </div>
          ))}
          <div className="flex items-center justify-between text-sm pt-1 border-t border-gray-700 mt-1">
            <span className="text-gray-400">Total</span>
            <span className="text-white font-semibold tabular-nums">{totalMin} min</span>
          </div>
        </div>
      )}

      {/* Duration note (Engine card only) */}
      {coreNote && (
        <p className="text-gray-500 text-xs italic">{coreNote}</p>
      )}

      {/* Playlist name */}
      <p className="text-white font-semibold text-base leading-tight">{playlist.name}</p>

      {/* YouTube link */}
      <a
        href={playlist.url}
        target="_blank"
        rel="noopener noreferrer"
        className={`block text-center py-3 rounded-xl text-white font-semibold text-sm transition-colors focus:outline-none focus:ring-2 ${c.btn} ${c.ring}`}
      >
        Open on YouTube ↗
      </a>

      {/* QR code */}
      <div className="flex justify-center pt-1">
        <QRCodeSVG
          value={playlist.url}
          size={96}
          bgColor="transparent"
          fgColor="#e5e7eb"
        />
      </div>
    </div>
  )
}
