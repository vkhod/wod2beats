import { useState } from 'react'
import type { FormEvent } from 'react'

const VALID_USER = import.meta.env.VITE_APP_USER ?? ''
const VALID_PASS = import.meta.env.VITE_APP_PASSWORD ?? ''

interface Props {
  onLogin: () => void
}

export default function LoginScreen({ onLogin }: Props) {
  const [user, setUser] = useState('')
  const [pass, setPass] = useState('')
  const [error, setError] = useState(false)

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (user === VALID_USER && pass === VALID_PASS) {
      localStorage.setItem('wod2beats_authed', '1')
      onLogin()
    } else {
      setError(true)
      setPass('')
    }
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-6">
      <div className="w-full max-w-sm">
        <h1 className="text-3xl font-bold text-white text-center mb-2">WOD2Beats</h1>
        <p className="text-gray-400 text-center text-sm mb-8">Fresh playlists for every workout</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <input
              type="text"
              placeholder="Username"
              autoCapitalize="off"
              autoCorrect="off"
              value={user}
              onChange={e => { setUser(e.target.value); setError(false) }}
              className="w-full px-4 py-3 rounded-xl bg-gray-800 text-white placeholder-gray-500 border border-gray-700 focus:outline-none focus:border-orange-500 text-base"
            />
          </div>
          <div>
            <input
              type="password"
              placeholder="Password"
              value={pass}
              onChange={e => { setPass(e.target.value); setError(false) }}
              className="w-full px-4 py-3 rounded-xl bg-gray-800 text-white placeholder-gray-500 border border-gray-700 focus:outline-none focus:border-orange-500 text-base"
            />
          </div>

          {error && (
            <p className="text-red-400 text-sm text-center">Wrong credentials, try again.</p>
          )}

          <button
            type="submit"
            className="w-full py-3 rounded-xl bg-orange-500 hover:bg-orange-400 active:bg-orange-600 text-white font-semibold text-base transition-colors"
          >
            Enter
          </button>
        </form>
      </div>
    </div>
  )
}
