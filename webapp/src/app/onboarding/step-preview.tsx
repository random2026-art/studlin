'use client'

import type { OnboardingState } from './types'

interface StepPreviewProps {
  state: OnboardingState
}

export function StepPreview({ state }: StepPreviewProps) {
  const first = (state.name || 'you').split(' ')[0]
  const goals = state.goals || []
  const goalsLabel =
    goals.length === 0 ? 'everything' :
    goals.includes('all') ? 'every Studlin tool' :
    goals.length === 1 ? goals[0] : goals.length + ' areas'
  const focusTarget = state.load === 'under1' ? '30m' : state.load === '1to3' ? '2h' : state.load === '3to5' ? '4h' : '6h'

  return (
    <div className="frame">
      <div className="frame-head">
        <h2>Hey <em>{first}.</em> Here&rsquo;s your space.</h2>
        <p>Personalised based on what you just told us. Tweak anything in Settings later.</p>
      </div>
      <div className="preview">
        <div className="preview-row">
          <div className="preview-tile lime">
            <div className="pt-label">DAILY FOCUS</div>
            <div className="pt-value">{focusTarget}</div>
            <div className="pt-sub">From your study load</div>
          </div>
          <div className="preview-tile">
            <div className="pt-label">PRIMARY GOAL</div>
            <div className="pt-value" style={{ fontSize: 18, fontFamily: 'var(--font-geist), sans-serif', fontWeight: 600 }}>{goalsLabel}</div>
            <div className="pt-sub">Pinned to dashboard</div>
          </div>
          <div className="preview-tile">
            <div className="pt-label">STREAK</div>
            <div className="pt-value">0</div>
            <div className="pt-sub">Starts today</div>
          </div>
        </div>
        <div className="preview-row" style={{ gridTemplateColumns: '1fr' }}>
          <div className="preview-tile" style={{ padding: '14px 16px', background: 'white' }}>
            <div className="pt-label" style={{ marginBottom: 8 }}>TUTOR VOICE</div>
            <div style={{ fontSize: 13.5, color: 'var(--ink)', lineHeight: 1.55 }}>
              {state.role === 'hs' && 'Encouraging. Breaks topics down step by step. Uses analogies and worked examples.'}
              {state.role === 'uni' && 'Socratic. Citation-aware. Calibrated to advanced coursework and seminar discussion.'}
              {state.role === 'teacher' && 'Direct. Curriculum-aware. Includes rubric, pedagogy notes, and lesson plans.'}
              {state.role === 'pro' && 'Concise. Professional register. Optimised for deliverables and tight deadlines.'}
              {state.role === 'self' && 'Patient. Builds from fundamentals. Suggests learning paths and milestone checks.'}
              {!state.role && 'Balanced and adaptive · personalised once you pick your role.'}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
