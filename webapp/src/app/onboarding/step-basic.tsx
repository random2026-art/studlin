'use client'

import { Ic } from './icons'
import { TextField, SelectField } from './fields'
import type { OnboardingState, SetState } from './types'

interface StepBasicProps {
  state: OnboardingState
  set: SetState
}

export function StepBasic({ state, set }: StepBasicProps) {
  const first = (state.name || '').split(' ')[0]

  return (
    <div className="frame">
      <div className="frame-head">
        <h2>
          {first ? (
            <>Hey <em>{first}</em>, let&rsquo;s personalize.</>
          ) : (
            <>Let&rsquo;s <em>personalize</em> Studlin.</>
          )}
        </h2>
        <p>A few quick questions so we can shape your workspace around you.</p>
      </div>
      <TextField
        label="What should we call you?"
        value={state.preferredName}
        onChange={(v) => set((s) => ({ ...s, preferredName: v }))}
        hint="We'll greet you with this across the app."
        autoFocus
      />
      <SelectField
        label="Preferred language"
        value={state.language}
        onChange={(v) => set((s) => ({ ...s, language: v }))}
        hint="The interface and AI tutor will speak this."
        options={['English', 'Español', 'Français', 'Deutsch', 'Português', 'हिन्दी', '中文', '日本語', 'العربية', 'Other']}
      />
      <SelectField
        label="How did you hear about Studlin?"
        value={state.referral}
        onChange={(v) => set((s) => ({ ...s, referral: v }))}
        hint="Helps us know what's working · totally optional."
        options={['TikTok', 'Instagram', 'YouTube', 'A friend or classmate', 'Reddit', 'Google search', 'Product Hunt', 'My school or teacher', 'X (Twitter)', 'Other']}
      />
      <SelectField
        label="What describes you best?"
        value={state.descriptor}
        onChange={(v) => set((s) => ({ ...s, descriptor: v }))}
        hint="Sets your default dashboard layout."
        options={["I'm cramming for exams", 'I want to stay organised', 'I write a lot of essays', "I'm building a study habit", 'I teach or tutor others', 'Just exploring']}
      />
      <label className={'checkbox' + (state.terms ? ' is-checked' : '')} onClick={() => set((s) => ({ ...s, terms: !s.terms }))}>
        <span className="box">{Ic.check}</span>
        <span>I accept the <a>Terms of Service</a> and <a>Privacy Policy</a>.</span>
      </label>
    </div>
  )
}
