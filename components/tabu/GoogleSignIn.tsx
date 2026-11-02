'use client'

import { useState } from 'react'
import { authClient } from '@/lib/auth-client'

export default function GoogleSignIn() {
  const [pending, setPending] = useState(false)
  const [failed, setFailed] = useState(false)

  async function signIn() {
    setPending(true)
    setFailed(false)
    // Redirects to Google; on a rejected account Google comes back to /tabu/login/?error=...
    const { error } = await authClient.signIn.social({
      provider: 'google',
      callbackURL: '/tabu/',
      errorCallbackURL: '/tabu/login/',
    })
    if (error) {
      setFailed(true)
      setPending(false)
    }
  }

  return (
    <>
      <button type="button" className="btn btn-primary btn-lg w-full" onClick={signIn} disabled={pending}>
        {pending && <span className="loading loading-spinner loading-sm" />}
        Accedi con Google
      </button>
      {failed && <p className="text-error text-sm mt-2">Non è stato possibile contattare Google, riprova.</p>}
    </>
  )
}
