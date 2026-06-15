'use client'

import { useState } from 'react'
import { getAdditionalUserInfo, type UserCredential } from 'firebase/auth'
import { useAuth } from '@/lib/auth-context'
import { Ic } from './icons'
import { TextField } from './fields'
import type { OnboardingState, SetState, SignupErrors, Provider } from './types'

interface StepSignupProps {
  state: OnboardingState
  set: SetState
  advance: (skipValidate?: boolean) => void
  errors: SignupErrors
}

export function StepSignup({ state, set, advance, errors }: StepSignupProps) {
  const [mode, setMode] = useState<'providers' | 'email'>('providers')
  const [providerBusy, setProviderBusy] = useState<Provider | null>(null)
  const [providerError, setProviderError] = useState<string | null>(null)
  const { signInWithGoogle, signInWithApple, signInWithMicrosoft } = useAuth()

  const pwOk = {
    lower: /[a-z]/.test(state.password || ''),
    upper: /[A-Z]/.test(state.password || ''),
    nums: /\d/.test(state.password || ''),
    len: (state.password || '').length >= 14,
  }

  const handleProvider = async (name: Provider, fn: () => Promise<UserCredential>) => {
    setProviderError(null)
    setProviderBusy(name)
    try {
      const result = await fn()
      const isNewUser = getAdditionalUserInfo(result)?.isNewUser
      set((s) => ({ ...s, provider: name }))
      if (!isNewUser && localStorage.getItem('studlin-onboarded') === '1') {
        window.location.href = '/dashboard'
        return
      }
      advance(true)
    } catch {
      setProviderError("Couldn't sign in — please try again.")
    } finally {
      setProviderBusy(null)
    }
  }

  return (
    <div className="frame">
      <div className="frame-head">
        <h2>Welcome to Studlin</h2>
        <p>Better grades start here. Create your account in a few clicks.</p>
      </div>

      {mode === 'providers' && (
        <>
          <div className="providers">
            <button className="provider" disabled={!!providerBusy} onClick={() => handleProvider('google', signInWithGoogle)}>
              {Ic.google} Continue with Google
            </button>
            <button className="provider dark" disabled={!!providerBusy} onClick={() => handleProvider('apple', signInWithApple)}>
              {Ic.apple} Continue with Apple
            </button>
            <button className="provider" disabled={!!providerBusy} onClick={() => handleProvider('microsoft', signInWithMicrosoft)}>
              {Ic.microsoft} Continue with Microsoft
            </button>
          </div>
          {providerError && <div className="field-error" style={{ marginTop: 4, marginBottom: 4 }}>{providerError}</div>}
          <div className="divider">or sign up with email</div>
          <button className="provider" disabled={!!providerBusy} onClick={() => setMode('email')}>{Ic.mail} Use email instead</button>
        </>
      )}

      {mode === 'email' && (
        <>
          <TextField
            label="Full legal name"
            value={state.name}
            onChange={(v) => set((s) => ({ ...s, name: v }))}
            hint={errors.name ? null : 'Full name as it appears on identification document'}
            error={errors.name}
            autoFocus
            autoComplete="name"
          />
          <TextField
            label="School or work email"
            value={state.email}
            onChange={(v) => set((s) => ({ ...s, email: v }))}
            hint={errors.email ? null : "For example 'you@school.edu'"}
            error={errors.email}
            type="email"
            autoComplete="email"
          />
          <TextField
            label="Create password"
            value={state.password}
            onChange={(v) => set((s) => ({ ...s, password: v }))}
            type="password"
            autoComplete="new-password"
            error={errors.password}
          />
          <div className="pw-grid">
            <div className={'pwi' + (pwOk.lower ? ' ok' : '')}><span className="d"></span> Lowercase characters</div>
            <div className={'pwi' + (pwOk.upper ? ' ok' : '')}><span className="d"></span> Uppercase characters</div>
            <div className={'pwi' + (pwOk.nums ? ' ok' : '')}><span className="d"></span> Numbers</div>
            <div className={'pwi' + (pwOk.len ? ' ok' : '')}><span className="d"></span> 14 characters minimum</div>
          </div>
          <div style={{ marginTop: 18 }}>
            <button className="provider" onClick={() => setMode('providers')} style={{ padding: '10px 14px', fontSize: 13 }}>
              ← Use Google, Apple, or Microsoft instead
            </button>
          </div>
        </>
      )}
    </div>
  )
}
