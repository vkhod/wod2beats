import { QRCodeSVG } from 'qrcode.react'
import type { PlaylistOut, CurationResult, AnchorInfo, Track } from '../api'

interface Props {
  playlist: PlaylistOut
  curation: CurationResult
  anchors: AnchorInfo
}

const intensityDot: Record<string, string> = {
  low: 'bg-green-400',
  med: 'bg-yellow-400',
  high: 'bg-orange-400',
}

function TrackRow({ track, label }: { track: Track; label?: string }) {
  return (
    <div className="flex items-start gap-2 py-1">
      {label && (
        <span className="text-xs font-semibold text-gray-500 w-5 flex-shrink-0 pt-0.5">{label}</span>
      )}
      <div className="flex-1 min-w-0">
        <p className="text-gray-200 text-sm truncate">{track.title}</p>
        <p className="text-gray-500 text-xs truncate">{track.artist}</p>
      </div>
      {track.minutes ? (
        <span className="text-gray-500 text-xs tabular-nums pt-0.5 flex-shrink-0">
          {track.minutes.toFixed(1)}m
        </span>
      ) : null}
    </div>
  )
}

const sectionStyle = {
  buildup: { line: 'bg-blue-700', text: 'text-blue-400' },
  core:    { line: 'bg-orange-600', text: 'text-orange-400' },
  filler:  { line: 'bg-gray-600', text: 'text-gray-400' },
} as const

function SectionDivider({ label, variant }: { label: string; variant: keyof typeof sectionStyle }) {
  const { line, text } = sectionStyle[variant]
  return (
    <div className="flex items-center gap-2 py-1.5 mt-1">
      <div className={`h-px flex-1 ${line}`} />
      <span className={`text-xs font-bold uppercase tracking-wider px-1 ${text}`}>{label}</span>
      <div className={`h-px flex-1 ${line}`} />
    </div>
  )
}

export default function PlaylistCard({ playlist, curation, anchors }: Props) {
  const totalMin = curation.session.reduce((sum, s) => sum + s.minutes, 0)
  const hasFiller = curation.filler.length > 0

  return (
    <div className="rounded-2xl bg-gray-800 border border-gray-700 p-5 flex flex-col gap-4">

      {/* Coach Anchors — the most important section */}
      <div className="rounded-xl bg-gray-900 border border-gray-600 p-4 flex flex-col gap-3">
        <p className="text-xs font-bold uppercase tracking-widest text-gray-400">Coach anchors</p>

        {anchors.skill_end_song && (
          <div className="flex items-start gap-3">
            <span className="text-lg leading-none flex-shrink-0">🎵</span>
            <div>
              <p className="text-gray-300 text-sm font-medium leading-snug">
                &ldquo;{anchors.skill_end_song.title}&rdquo;
              </p>
              <p className="text-gray-500 text-xs">{anchors.skill_end_song.artist}</p>
              <p className="text-gray-400 text-xs mt-0.5">Skill block wrapping up</p>
            </div>
          </div>
        )}

        {anchors.wod_start_song && (
          <div className="flex items-start gap-3">
            <span className="text-lg leading-none flex-shrink-0">🔥</span>
            <div>
              <p className="text-orange-300 text-sm font-bold leading-snug">
                &ldquo;{anchors.wod_start_song.title}&rdquo;
              </p>
              <p className="text-gray-500 text-xs">{anchors.wod_start_song.artist}</p>
              <p className="text-orange-400 text-xs font-semibold mt-0.5">BEGIN MAIN WOD</p>
            </div>
          </div>
        )}

        {anchors.filler_warning && (
          <div className="flex items-start gap-2 pt-1 border-t border-gray-700">
            <span className="text-base leading-none flex-shrink-0">⚠️</span>
            <p className="text-yellow-400 text-xs">{anchors.filler_warning}</p>
          </div>
        )}
      </div>

      {/* WOD segment breakdown */}
      {curation.session.length > 0 && (
        <div className="flex flex-col gap-1">
          <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-1">Session</p>
          {curation.session.map((seg, i) => (
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
          {curation.core_note && (
            <p className="text-gray-500 text-xs italic">{curation.core_note}</p>
          )}
        </div>
      )}

      {/* Full track list with section markers */}
      <div className="flex flex-col">
        <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-1">Playlist</p>

        {curation.buildup.length > 0 && (
          <>
            <SectionDivider label="Build-up" variant="buildup" />
            {curation.buildup.map((t, i) => (
              <TrackRow key={i} track={t} />
            ))}
          </>
        )}

        {curation.core.length > 0 && (
          <>
            <SectionDivider label="Main WOD" variant="core" />
            {curation.core.map((t, i) => (
              <TrackRow key={i} track={t} />
            ))}
          </>
        )}

        {hasFiller && (
          <>
            <SectionDivider label="Cool-down" variant="filler" />
            {curation.filler.map((t, i) => (
              <TrackRow key={i} track={t} />
            ))}
          </>
        )}
      </div>

      {/* Playlist name */}
      <p className="text-gray-400 text-xs">{playlist.name} · {playlist.track_count} tracks</p>

      {/* YouTube link */}
      <a
        href={playlist.url}
        target="_blank"
        rel="noopener noreferrer"
        className="block text-center py-3 rounded-xl text-white font-semibold text-sm transition-colors bg-orange-500 hover:bg-orange-400 active:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-orange-400"
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
