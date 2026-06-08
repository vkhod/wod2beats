import type { PlaylistOut } from '../api'

interface Props {
  playlist: PlaylistOut
  type: 'buildup' | 'core'
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

export default function PlaylistCard({ playlist, type }: Props) {
  const c = config[type]
  return (
    <div className="rounded-2xl bg-gray-800 border border-gray-700 p-5 flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full text-white ${c.color}`}>
          {c.label}
        </span>
        <span className="text-gray-400 text-sm">{playlist.track_count} tracks</span>
      </div>
      <p className="text-white font-semibold text-base leading-tight">{playlist.name}</p>
      <a
        href={playlist.url}
        target="_blank"
        rel="noopener noreferrer"
        className={`block text-center py-3 rounded-xl text-white font-semibold text-sm transition-colors focus:outline-none focus:ring-2 ${c.btn} ${c.ring}`}
      >
        Open on YouTube ↗
      </a>
    </div>
  )
}
