import { useState } from 'react'
import LoginScreen from './components/LoginScreen'
import WodInput from './components/WodInput'
import PlaylistCard from './components/PlaylistCard'
import Spinner from './components/Spinner'
import { generate } from './api'
import type { GenerateRequest, GenerateResponse } from './api'

function isAuthed() {
  return localStorage.getItem('wod2beats_authed') === '1'
}

export default function App() {
  const [authed, setAuthed] = useState(isAuthed)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<GenerateResponse | null>(null)
  const [error, setError] = useState<string | null>(null)

  if (!authed) {
    return <LoginScreen onLogin={() => setAuthed(true)} />
  }

  async function handleGenerate(req: GenerateRequest) {
    setLoading(true)
    setError(null)
    setResult(null)
    try {
      const data = await generate(req)
      setResult(data)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  function handleReset() {
    setResult(null)
    setError(null)
  }

  function handleLogout() {
    localStorage.removeItem('wod2beats_authed')
    setAuthed(false)
  }

  return (
    <div className="min-h-screen flex flex-col">
      {loading && <Spinner />}

      {/* Header */}
      <header className="flex items-center justify-between px-5 pt-6 pb-2">
        <h1 className="text-xl font-bold text-white">WOD2Beats</h1>
        <button
          onClick={handleLogout}
          className="text-xs text-gray-500 hover:text-gray-300 transition-colors"
        >
          Log out
        </button>
      </header>

      <main className="flex-1 px-5 py-4 max-w-lg mx-auto w-full">
        {!result ? (
          <>
            <p className="text-gray-400 text-sm mb-5">
              Drop a WOD screenshot — one playlist built to carry the whole class.
            </p>

            {error && (
              <div className="mb-4 px-4 py-3 rounded-xl bg-red-900/50 border border-red-700 text-red-300 text-sm">
                {error}
              </div>
            )}

            <WodInput onSubmit={handleGenerate} loading={loading} />
          </>
        ) : (
          <>
            <p className="text-gray-400 text-sm mb-5">
              Ready — {result.curation.core_min} min {result.curation.core_name}, one playlist built.
            </p>

            {result.playlist && (
              <PlaylistCard
                playlist={result.playlist}
                curation={result.curation}
                anchors={result.anchors}
              />
            )}

            <button
              onClick={handleReset}
              className="mt-6 w-full py-3 rounded-xl border border-gray-600 hover:border-gray-400 text-gray-400 hover:text-gray-200 text-sm font-semibold transition-colors"
            >
              Generate another
            </button>
          </>
        )}
      </main>
    </div>
  )
}
