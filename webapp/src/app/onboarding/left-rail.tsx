'use client'

import { Ic } from './icons'
import type { OnboardingState } from './types'

interface LeftRailProps {
  step: number
  state: OnboardingState
  onLogout?: () => void
}

export function LeftRail({ step, state, onLogout }: LeftRailProps) {
  if (step === 0) {
    return (
      <aside className="rail">
        <div className="brand">
          <img src="/studlin-icon.png" alt="Studlin" />
          <span className="name">studlin</span>
        </div>
        <div className="rail-icon">{Ic.userPlus}</div>
        <h1>Sign up and lock in.</h1>
        <p className="lead">Sign up is simple, free and fast. One workspace for everything you study, write, and remember.</p>
        <div className="rail-tiles">
          <div className="rail-tile">
            <div className="ic">{Ic.spark}</div>
            <div className="t">AI tutor on every subject</div>
            <div className="s">Drop a PDF · ask anything</div>
          </div>
          <div className="rail-tile">
            <div className="ic">{Ic.flame}</div>
            <div className="t">Streaks that keep you going</div>
            <div className="s">Daily momentum, milestones, and Weekly Wrapped</div>
          </div>
          <div className="rail-tile">
            <div className="ic">{Ic.zap}</div>
            <div className="t">All your tools, one price</div>
            <div className="s">Writing, flashcards, AI tutor, focus timer and more</div>
          </div>
        </div>
      </aside>
    )
  }

  const groups = [
    { name: 'Sign up', from: 0, to: 0 },
    { name: 'Basic information', from: 1, to: 5 },
    { name: 'Confirm email', from: 6, to: 7 },
  ]

  return (
    <aside className="rail">
      <div className="brand">
        <img src="/studlin-icon.png" alt="Studlin" />
        <span className="name">studlin</span>
      </div>
      <div className="rail-icon">{Ic.userPlus}</div>
      <h1 style={{ fontSize: 28 }}>Create your account in a few clicks.</h1>
      <div className="stepper" style={{ marginTop: 36 }}>
        {groups.map((g, i) => {
          const done = step > g.to
          const current = step >= g.from && step <= g.to
          return (
            <div key={i} className={'step' + (done ? ' is-done' : '') + (current ? ' is-current' : '')}>
              <span className="dot">{done ? Ic.check : i + 1}</span>
              <span className="name">{g.name}</span>
            </div>
          )
        })}
      </div>
      <div className="rail-meta">
        <div className="row" style={{ color: 'rgba(246,241,230,0.85)' }}>{state.email || 'you@studlin.app'}</div>
        <div className="row"><a onClick={onLogout}>Logout</a></div>
        <div className="row"><a>← Change password</a></div>
      </div>
    </aside>
  )
}
