import type { Dispatch, SetStateAction } from 'react'

export type Provider = 'google' | 'apple' | 'microsoft'
export type Role = 'hs' | 'uni' | 'teacher' | 'pro' | 'self'
export type Goal = 'writing' | 'flashcards' | 'focus' | 'schedule' | 'notes' | 'all'
export type Load = 'under1' | '1to3' | '3to5' | 'over5'
export type Billing = 'monthly' | 'annual'
export type Plan = 'free' | 'scholar' | 'elite'

export interface OnboardingState {
  // Step 0 — sign up
  provider?: Provider
  name?: string
  email?: string
  password?: string
  // Step 1 — basic information
  preferredName?: string
  language?: string
  referral?: string
  descriptor?: string
  terms?: boolean
  // Step 2 — role
  role?: Role
  // Step 3 — goals
  goals: Goal[]
  // Step 4 — study load
  load?: Load
  // Step 6 — plan
  billing?: Billing
  plan: Plan
  _updatedAt?: string
}

export type SetState = Dispatch<SetStateAction<OnboardingState>>

export const DEFAULT_STATE: OnboardingState = {
  goals: [],
  plan: 'scholar',
}

export interface Step {
  name: string
}

export const STEPS: Step[] = [
  { name: 'Sign up' },
  { name: 'Basic information' },
  { name: 'About you' },
  { name: 'Goals' },
  { name: 'Study load' },
  { name: 'Workspace preview' },
  { name: 'Choose plan' },
  { name: 'Welcome' },
]

export const CTA_LABEL = (state: OnboardingState, step: number): string => {
  const labels = [
    'Sign up for free',
    'Continue',
    'Continue',
    'Continue',
    'Continue',
    'Looks good',
    state.plan === 'free' ? 'Continue with free plan' : 'Start 7-day free trial',
    'Enter Studlin',
  ]
  return labels[step]
}

export function isStepValid(state: OnboardingState, step: number): boolean {
  if (step === 0) {
    if (state.provider) return true
    const pwOk = !!(
      state.password &&
      /[a-z]/.test(state.password) &&
      /[A-Z]/.test(state.password) &&
      /\d/.test(state.password) &&
      state.password.length >= 14
    )
    return !!(state.name && state.email && pwOk)
  }
  if (step === 1) return !!(state.preferredName && state.language && state.descriptor && state.terms)
  if (step === 2) return !!state.role
  if (step === 3) return (state.goals || []).length > 0
  if (step === 4) return !!state.load
  if (step === 5) return true
  if (step === 6) return !!state.plan
  return true
}

export interface SignupErrors {
  name?: string
  email?: string
  password?: string
}

export function validateSignup(state: OnboardingState): SignupErrors {
  const errs: SignupErrors = {}
  const pwOk = !!(
    state.password &&
    /[a-z]/.test(state.password) &&
    /[A-Z]/.test(state.password) &&
    /\d/.test(state.password) &&
    state.password.length >= 14
  )
  if (!state.name) errs.name = 'Full name as it appears on identification document'
  if (!state.email) errs.email = 'Please enter your email address'
  else if (state.email.includes('@gmail.') || state.email.includes('@yahoo.') || state.email.includes('@hotmail.'))
    errs.email = 'Please use your school or company email'
  if (!pwOk) errs.password = "Password doesn't meet all criteria below"
  return errs
}
