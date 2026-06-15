'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { FlameIc, PlayIc, Ic } from './icons'
import type { OnboardingState } from './types'

interface Task {
  id: 'dash' | 'focus' | 'cards' | 'tutor' | 'streak'
  text: string
  xp: number
  cap: string
}

const TUT_TASKS: Task[] = [
  { id: 'dash', text: 'Open your personalised dashboard', xp: 5, cap: 'Your whole day, planned before you sit down.' },
  { id: 'focus', text: 'Start your first 25-minute focus session', xp: 10, cap: 'One tap. Phone away. Totally locked in.' },
  { id: 'cards', text: 'Drop a PDF and generate flashcards', xp: 10, cap: 'Any file becomes a deck in seconds.' },
  { id: 'tutor', text: 'Ask the AI tutor your first question', xp: 5, cap: 'It walks you through it, step by step.' },
  { id: 'streak', text: 'Complete your first day streak', xp: 10, cap: 'Show up today. Future you says thanks.' },
]

function useRun() {
  const [on, setOn] = useState(false)
  useEffect(() => {
    const id = setTimeout(() => setOn(true), 60)
    return () => clearTimeout(id)
  }, [])
  return on
}

function Demo({ kind }: { kind: Task['id'] }) {
  const on = useRun()
  const cls = 'demo' + (on ? ' on' : '')

  if (kind === 'dash') return (
    <div className={cls}>
      <div className="dm-window">
        <div className="dm-greet"><span className="dm-hi">Good morning, Maya</span><span className="dm-pill">3 tasks today</span></div>
        <div className="dm-grid">
          <div className="dm-tile t1"><div className="dm-tlab">Focus</div><i className="dm-spark"></i></div>
          <div className="dm-tile t2"><div className="dm-tlab">Streak</div><div className="dm-big">12</div></div>
          <div className="dm-tile t3"><div className="dm-tlab">This week</div><i className="dm-bars"><b></b><b></b><b></b><b></b><b></b></i></div>
        </div>
      </div>
    </div>
  )

  if (kind === 'focus') return (
    <div className={cls}>
      <div className="dm-focus">
        <svg viewBox="0 0 120 120" className="dm-timer">
          <circle cx="60" cy="60" r="52" className="track"></circle>
          <circle cx="60" cy="60" r="52" className="prog"></circle>
        </svg>
        <div className="dm-mid"><div className="dm-time">25:00</div><div className="dm-lab">LOCKED IN</div></div>
      </div>
    </div>
  )

  if (kind === 'cards') return (
    <div className={cls}>
      <div className="dm-doc"><span>notes.pdf</span></div>
      <div className="dm-fan">
        <div className="dm-card c1">What is osmosis?</div>
        <div className="dm-card c2">Define entropy</div>
        <div className="dm-card c3">Mitosis vs meiosis?</div>
      </div>
    </div>
  )

  if (kind === 'tutor') return (
    <div className={cls}>
      <div className="dm-chat">
        <div className="dm-bub me">Why does ice float?</div>
        <div className="dm-bub ai">
          <span className="dm-dots"><i></i><i></i><i></i></span>
          <span className="dm-ans">Water expands as it freezes, so ice is less dense than liquid water. Less dense floats. Want the hydrogen-bond picture?</span>
        </div>
      </div>
    </div>
  )

  return (
    <div className={cls}>
      <div className="dm-streak">
        <div className="dm-flame">{FlameIc}</div>
        <div className="dm-days">
          {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d, i) => (
            <span key={i} className="dm-day" style={{ transitionDelay: (0.3 + i * 0.18) + 's' }}>{d}</span>
          ))}
        </div>
        <div className="dm-dlab">Day 1 · started</div>
      </div>
    </div>
  )
}

function TutTheater({ task, onFinish }: { task: Task; onFinish: () => void }) {
  const on = useRun()
  return (
    <div className={'tut-veil' + (on ? ' on' : '')} onClick={onFinish}>
      <div className="tut-stage" onClick={(e) => e.stopPropagation()}>
        <Demo kind={task.id} key={task.id} />
        <div className="tut-cap">{task.cap}</div>
        <div className="tut-bar"><i></i></div>
        <button className="tut-skip" onClick={onFinish}>Got it · collect +{task.xp} XP</button>
      </div>
    </div>
  )
}

function ConfettiBurst() {
  const on = useRun()
  const pieces = useMemo(() => Array.from({ length: 60 }).map((_, i) => {
    const colors = ['#9EC83D', '#7FA82A', '#FFE99A', '#FFD7B5', '#C4F0D8', '#BFE3FF', '#E2D0FF', '#FFC9D2']
    return {
      left: Math.random() * 100,
      bg: colors[i % colors.length],
      delay: Math.random() * 0.7,
      dur: 2.5 + Math.random() * 1.5,
      rot: 360 + Math.random() * 540,
    }
  }), [])

  return (
    <div className="confetti2">
      {pieces.map((p, i) => (
        <i
          key={i}
          style={{
            left: p.left + '%',
            background: p.bg,
            transition: 'transform ' + p.dur + 's cubic-bezier(.2,.85,.3,1) ' + p.delay + 's, opacity ' + p.dur + 's linear ' + p.delay + 's',
            transform: on ? 'translateY(110vh) rotate(' + p.rot + 'deg)' : 'translateY(-30px)',
            opacity: on ? 0 : 1,
          }}
        ></i>
      ))}
    </div>
  )
}

interface StepWelcomeProps {
  state: OnboardingState
}

export function StepWelcome({ state }: StepWelcomeProps) {
  const [done, setDone] = useState<Record<string, boolean>>({})
  const [active, setActive] = useState<Task | null>(null)
  const [justEarned, setJustEarned] = useState<string | null>(null)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const first = (state.preferredName || state.name || 'Maya').split(' ')[0]
  const max = TUT_TASKS.reduce((s, t) => s + t.xp, 0)
  const total = TUT_TASKS.reduce((s, t) => s + (done[t.id] ? t.xp : 0), 0)
  const allDone = TUT_TASKS.every((t) => done[t.id])

  const finish = (t: Task) => {
    if (timerRef.current) clearTimeout(timerRef.current)
    setActive(null)
    setDone((d) => ({ ...d, [t.id]: true }))
    setJustEarned(t.id)
    setTimeout(() => setJustEarned(null), 1100)
  }

  const open = (t: Task) => {
    if (done[t.id]) return
    setActive(t)
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => finish(t), 4000)
  }

  useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current) }, [])

  return (
    <div className="frame">
      {allDone && <ConfettiBurst />}
      <div className="celebrate">
        <div className="celebrate-glyph"><img src="/studlin-icon.png" alt="" /></div>
        <h2 style={{ fontSize: 32, margin: '0 0 8px', letterSpacing: '-0.025em', fontWeight: 600 }}>
          You&rsquo;re in, <em style={{ fontFamily: 'var(--font-instrument-serif), serif', fontStyle: 'italic', color: 'var(--lime-dk)', fontWeight: 400 }}>{first}.</em>
        </h2>
        <p style={{ fontSize: 15, color: 'var(--muted)', margin: '0 auto', maxWidth: 440, lineHeight: 1.55 }}>
          Tap each one to see how it works · finish all five to unlock a 40 XP bonus and start your streak.
        </p>
      </div>
      <div className="checklist">
        {TUT_TASKS.map((t) => (
          <div key={t.id} className={'cl-item' + (done[t.id] ? ' done' : '')} onClick={() => open(t)}>
            <span className="box">{Ic.check}</span>
            <span className="text">{t.text}</span>
            {!done[t.id] && <span className="cl-play">Watch{PlayIc}</span>}
            <span className={'reward' + (justEarned === t.id ? ' pop' : '')}>+{t.xp} XP</span>
          </div>
        ))}
      </div>
      <div className="xp-foot">
        {allDone ? (
          <div className="bonus-banner">Bonus unlocked · +40 XP · streak started</div>
        ) : (
          <>
            <div className="xp-row"><span>Today&rsquo;s XP</span><strong>{total} / {max}</strong></div>
            <div className="xp-track"><i style={{ width: (total / max * 100) + '%' }}></i></div>
          </>
        )}
      </div>

      {active && <TutTheater task={active} onFinish={() => finish(active)} />}
    </div>
  )
}
