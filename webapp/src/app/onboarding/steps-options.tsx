'use client'

import { Ic } from './icons'
import type { Goal, OnboardingState, SetState } from './types'

interface StepProps {
  state: OnboardingState
  set: SetState
}

const ROLES = [
  { id: 'hs', label: 'High school student', desc: '  Grades 9 to 12, IB, AP, A-Levels', ic: Ic.cap },
  { id: 'uni', label: 'University student', desc: '  Undergrad, graduate, or PhD', ic: Ic.uni },
  { id: 'teacher', label: 'Teacher or educator', desc: '  Lesson planning and grading support', ic: Ic.teacher },
  { id: 'pro', label: 'Working professional', desc: '  Writing, focus, and productivity', ic: Ic.brief },
  { id: 'self', label: 'Self-directed learner', desc: '  Cert prep, hobby learning, MOOCs', ic: Ic.learn },
] as const

export function StepRole({ state, set }: StepProps) {
  return (
    <div className="frame">
      <div className="frame-head">
        <h2>Who are you, <em>really?</em></h2>
        <p>We&rsquo;ll tune the AI tutor&rsquo;s voice and curriculum suggestions to match.</p>
      </div>
      <div className="opt-grid full">
        {ROLES.map((r) => (
          <button key={r.id} className={'opt' + (state.role === r.id ? ' is-selected' : '')} onClick={() => set((s) => ({ ...s, role: r.id }))}>
            <span className="ic">{r.ic}</span>
            <span className="body">
              <span className="lbl">{r.label}</span>
              <span className="desc">{r.desc}</span>
            </span>
            <span className="check">{Ic.check}</span>
          </button>
        ))}
      </div>
    </div>
  )
}

const GOALS = [
  { id: 'writing', label: 'Writing essays', ic: Ic.pen },
  { id: 'flashcards', label: 'Memorising material', ic: Ic.cards },
  { id: 'focus', label: 'Staying focused', ic: Ic.clock },
  { id: 'schedule', label: 'Planning my week', ic: Ic.cal },
  { id: 'notes', label: 'Organising notes', ic: Ic.notes },
  { id: 'all', label: 'All of the above', ic: Ic.star },
] as const

export function StepGoals({ state, set }: StepProps) {
  const selected = state.goals || []

  const toggle = (id: Goal) => {
    let next: Goal[]
    if (id === 'all') next = selected.includes('all') ? [] : ['all']
    else next = selected.includes(id) ? selected.filter((g) => g !== id) : [...selected.filter((g) => g !== 'all'), id]
    set((s) => ({ ...s, goals: next }))
  }

  return (
    <div className="frame">
      <div className="frame-head">
        <h2>What do you need <em>help with?</em></h2>
        <p>Pick everything that applies · we&rsquo;ll prioritise these tools first.</p>
      </div>
      <div className="opt-grid">
        {GOALS.map((g) => (
          <button key={g.id} className={'opt' + (selected.includes(g.id) ? ' is-selected' : '')} onClick={() => toggle(g.id)}>
            <span className="ic">{g.ic}</span>
            <span className="body"><span className="lbl">{g.label}</span></span>
            <span className="check">{Ic.check}</span>
          </button>
        ))}
      </div>
    </div>
  )
}

const LOADS = [
  { id: 'under1', label: 'Less than 1 hour', desc: '  Light review, weekend study' },
  { id: '1to3', label: '1 to 3 hours', desc: '  Steady daily routine' },
  { id: '3to5', label: '3 to 5 hours', desc: '  Serious student mode' },
  { id: 'over5', label: '5+ hours', desc: '  Cramming, prepping, deep work' },
] as const

export function StepLoad({ state, set }: StepProps) {
  return (
    <div className="frame">
      <div className="frame-head">
        <h2>How long do you study <em>daily?</em></h2>
        <p>Sets your Pomodoro defaults and daily focus target. You can change it anytime.</p>
      </div>
      <div className="opt-grid full">
        {LOADS.map((o) => (
          <button key={o.id} className={'opt' + (state.load === o.id ? ' is-selected' : '')} onClick={() => set((s) => ({ ...s, load: o.id }))}>
            <span className="ic">{Ic.clock}</span>
            <span className="body">
              <span className="lbl">{o.label}</span>
              <span className="desc">{o.desc}</span>
            </span>
            <span className="check">{Ic.check}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
