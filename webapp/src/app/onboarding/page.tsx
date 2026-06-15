'use client'

import { useEffect, useState } from 'react'
import './onboarding.css'
import { useAuth } from '@/lib/auth-context'
import { Ic } from './icons'
import { LeftRail } from './left-rail'
import { StepSignup } from './step-signup'
import { StepBasic } from './step-basic'
import { StepRole, StepGoals, StepLoad } from './steps-options'
import { StepPreview } from './step-preview'
import { StepPlan } from './step-plan'
import { StepWelcome } from './step-welcome'
import {
  CTA_LABEL,
  DEFAULT_STATE,
  STEPS,
  isStepValid,
  validateSignup,
  type OnboardingState,
  type SignupErrors,
} from './types'

export default function OnboardingPage() {
  const { user, loading, signUpWithEmail, signOutUser } = useAuth()
  const [step, setStep] = useState(0)
  const [state, setState] = useState<OnboardingState>(DEFAULT_STATE)
  const [signupErrors, setSignupErrors] = useState<SignupErrors>({})
  const [authError, setAuthError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [transitioning, setTransitioning] = useState(false)
  const [paywallRevealed, setPaywallRevealed] = useState(false)

  // Restore saved answers from a previous session
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('studlin-onboarding') || 'null')
      if (saved && typeof saved === 'object') setState((s) => ({ ...s, ...saved }))
    } catch {}
  }, [])

  // Persist every answer as the user progresses
  useEffect(() => {
    try {
      localStorage.setItem('studlin-onboarding', JSON.stringify({ ...state, _updatedAt: new Date().toISOString() }))
    } catch {}
  }, [state, step])

  // Resume mid-flow for signed-in users, or skip straight to the app if already onboarded
  useEffect(() => {
    if (loading) return
    try {
      if (localStorage.getItem('studlin-onboarded') === '1') {
        window.location.href = '/dashboard'
        return
      }
    } catch {}
    if (user) setStep((s) => (s === 0 ? 1 : s))
  }, [loading, user])

  async function validateStep(): Promise<boolean> {
    if (step === 0 && !state.provider) {
      const errs = validateSignup(state)
      if (Object.keys(errs).length > 0) {
        setSignupErrors(errs)
        return false
      }
      setSubmitting(true)
      setAuthError(null)
      try {
        await signUpWithEmail(state.name!, state.email!, state.password!)
        setSignupErrors({})
        return true
      } catch (err) {
        const code = (err as { code?: string })?.code
        if (code === 'auth/email-already-in-use') {
          setSignupErrors({ email: 'An account with this email already exists. Try logging in instead.' })
        } else {
          setAuthError('Something went wrong creating your account. Please try again.')
        }
        return false
      } finally {
        setSubmitting(false)
      }
    }
    return isStepValid(state, step)
  }

  const next = async () => {
    if (await validateStep()) {
      const nextStep = Math.min(STEPS.length - 1, step + 1)
      if (nextStep === 6) {
        setTransitioning(true)
        setTimeout(() => {
          setStep(nextStep)
          setTransitioning(false)
          setTimeout(() => setPaywallRevealed(true), 50)
        }, 400)
      } else {
        setTransitioning(true)
        setTimeout(() => {
          setStep(nextStep)
          setTransitioning(false)
        }, 250)
      }
    }
  }

  const back = () => {
    setTransitioning(true)
    setPaywallRevealed(false)
    setTimeout(() => {
      setStep((s) => Math.max(0, s - 1))
      setTransitioning(false)
    }, 250)
  }

  const advance = (skipValidate?: boolean) => {
    if (skipValidate) {
      setTransitioning(true)
      setTimeout(() => {
        setStep((s) => Math.min(STEPS.length - 1, s + 1))
        setTransitioning(false)
      }, 250)
    } else {
      next()
    }
  }

  useEffect(() => {
    const fn = (e: KeyboardEvent) => {
      if (e.key === 'Enter' && step < STEPS.length - 1) next()
      if (e.key === 'Escape' && step > 0) back()
    }
    window.addEventListener('keydown', fn)
    return () => window.removeEventListener('keydown', fn)
  })

  const handleLogout = async () => {
    try {
      await signOutUser()
    } catch {}
    window.location.href = '/onboarding'
  }

  const isPaywall = step === 6

  return (
    <div className={'onboarding-shell shell' + (isPaywall ? ' paywall-mode' : '')}>
      {!isPaywall && <LeftRail step={step} state={state} onLogout={handleLogout} />}
      <main className={'stage' + (isPaywall ? ' paywall-stage' : '') + (paywallRevealed ? ' paywall-revealed' : '')}>
        <div className="stage-top">
          {step === 0 ? (
            <>Already have an account? <a href="/sign-in">Log in</a></>
          ) : (
            <span style={{ color: 'var(--muted)', fontSize: 13 }}>Step {Math.min(step + 1, 7)} of 7</span>
          )}
        </div>

        <div className={'step-content' + (transitioning ? ' is-leaving' : ' is-entering')}>
          {step === 0 && <StepSignup state={state} set={setState} advance={advance} errors={signupErrors} />}
          {step === 1 && <StepBasic state={state} set={setState} />}
          {step === 2 && <StepRole state={state} set={setState} />}
          {step === 3 && <StepGoals state={state} set={setState} />}
          {step === 4 && <StepLoad state={state} set={setState} />}
          {step === 5 && <StepPreview state={state} />}
          {step === 6 && <StepPlan state={state} set={setState} />}
          {step === 7 && <StepWelcome state={state} />}
        </div>

        <div className="stage-foot">
          {authError && <div className="field-error" style={{ marginBottom: 14 }}>{authError}</div>}
          {step < STEPS.length - 1 ? (
            <button className="cta" disabled={!isStepValid(state, step) || submitting} onClick={next}>
              {CTA_LABEL(state, step)}
              <span className="arrow">{Ic.arrow}</span>
            </button>
          ) : (
            <a
              className="cta lime"
              href="/dashboard"
              onClick={() => {
                try {
                  localStorage.setItem('studlin-onboarded', '1')
                } catch {}
              }}
            >
              Enter Studlin
              <span className="arrow">{Ic.arrow}</span>
            </a>
          )}
          {step === 0 && <div className="stage-links"><a>Privacy Policy</a> · <a>Terms of Service</a></div>}
          {step > 0 && step < STEPS.length - 1 && (
            <div style={{ marginTop: 14 }}>
              <button onClick={back} style={{ background: 'transparent', border: 'none', color: 'var(--muted)', fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}>
                ← Back
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
