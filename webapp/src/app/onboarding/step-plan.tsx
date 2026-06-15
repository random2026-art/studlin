'use client'

import { Ic } from './icons'
import type { OnboardingState, SetState } from './types'

interface StepPlanProps {
  state: OnboardingState
  set: SetState
}

export function StepPlan({ state, set }: StepPlanProps) {
  const annual = state.billing !== 'monthly'
  const first = (state.preferredName || state.name || 'you').split(' ')[0]

  return (
    <div className="frame">
      <div className="frame-head">
        <h2>Unlock your full <em>potential.</em></h2>
        <p>{first}, students on Scholar Pro study 2.4&times; more and report a full letter-grade jump. Try it free for 7 days.</p>
      </div>

      <div className="bill-toggle">
        <button className={!annual ? 'on' : ''} onClick={() => set((s) => ({ ...s, billing: 'monthly' }))}>Monthly</button>
        <button className={annual ? 'on' : ''} onClick={() => set((s) => ({ ...s, billing: 'annual' }))}>Annual <span className="save">Save 25%</span></button>
      </div>

      <div className="plans">
        <button className={'plan' + (state.plan === 'scholar' ? ' is-selected' : '')} onClick={() => set((s) => ({ ...s, plan: 'scholar' }))}>
          <span className="plan-tag">7 DAYS FREE</span>
          <h3>Scholar Pro</h3>
          <div className="pp"><strong>${annual ? '14.99' : '19.99'}</strong> / mo{annual ? ' · billed annually' : ''}</div>
          <ul>
            <li><span className="ck">{Ic.check}</span> 500 AI credits / month</li>
            <li><span className="ck">{Ic.check}</span> Full writing suite + AI Humanizer</li>
            <li><span className="ck">{Ic.check}</span> AI flashcards from any file</li>
            <li><span className="ck">{Ic.check}</span> AI tutor on every subject</li>
            <li><span className="ck">{Ic.check}</span> Smart calendar &amp; Weekly Wrapped</li>
          </ul>
        </button>
        <button className={'plan' + (state.plan === 'elite' ? ' is-selected' : '')} onClick={() => set((s) => ({ ...s, plan: 'elite' }))}>
          <span className="plan-tag dark">BEST VALUE</span>
          <h3>Elite</h3>
          <div className="pp"><strong>${annual ? '29.99' : '39.99'}</strong> / mo{annual ? ' · billed annually' : ''}</div>
          <ul>
            <li><span className="ck">{Ic.check}</span> <strong>Unlimited</strong> AI credits</li>
            <li><span className="ck">{Ic.check}</span> Everything in Scholar Pro</li>
            <li><span className="ck">{Ic.check}</span> AI detector + predictive grades</li>
            <li><span className="ck">{Ic.check}</span> Subject tutors &amp; exam prep mode</li>
            <li><span className="ck">{Ic.check}</span> Priority support</li>
          </ul>
        </button>
      </div>

      <div className="paywall-foot">
        <div className="pw-compare">Most students juggle 4 to 6 apps. Studlin is all of them, starting at <strong>${annual ? '14.99' : '19.99'}/mo</strong>.</div>
        <button className="pw-skip" onClick={() => set((s) => ({ ...s, plan: 'free' }))}>
          {state.plan === 'free' ? '✓ Continuing on the free plan' : 'Maybe later · continue with limited free plan'}
        </button>
      </div>
    </div>
  )
}
