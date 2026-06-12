'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { clsx } from 'clsx'
import { Button } from '@/components/ui/button'

const TOTAL_STEPS = 4

const PAIN_POINTS = [
  { id: 'apps', label: 'Too many apps', emoji: '📱' },
  { id: 'notes', label: 'Messy notes', emoji: '🗂️' },
  { id: 'deadlines', label: 'Missed deadlines', emoji: '⏰' },
  { id: 'ai', label: 'AI tabs everywhere', emoji: '🤖' },
  { id: 'organize', label: 'No organization', emoji: '📚' },
  { id: 'focus', label: 'Procrastination', emoji: '😴' },
]

const FEATURE_CHIPS = [
  { label: 'Notes', emoji: '📝', bg: 'bg-mint' },
  { label: 'Flashcards', emoji: '🃏', bg: 'bg-sky' },
  { label: 'AI Tutor', emoji: '✨', bg: 'bg-lilac' },
  { label: 'Essays', emoji: '✍️', bg: 'bg-peach' },
  { label: 'Focus', emoji: '🎯', bg: 'bg-butter' },
  { label: 'Calendar', emoji: '🗓️', bg: 'bg-rose' },
]

const FOCUS_OPTIONS = [
  { id: 'notes', label: 'Notes', sub: 'Write, organize, summarize', emoji: '📝', bg: 'bg-mint', href: '/notes' },
  { id: 'flashcards', label: 'Flashcards', sub: 'AI-made, spaced repetition', emoji: '🃏', bg: 'bg-sky', href: '/flashcards' },
  { id: 'tutor', label: 'AI Tutor', sub: 'Ask anything, get it explained', emoji: '✨', bg: 'bg-lilac', href: '/tutor' },
  { id: 'essays', label: 'Essays', sub: 'Draft, edit, polish', emoji: '✍️', bg: 'bg-peach', href: '/essays' },
  { id: 'focus-timer', label: 'Focus Timer', sub: 'Pomodoro sessions', emoji: '🎯', bg: 'bg-butter', href: '/focus' },
  { id: 'calendar', label: 'Calendar', sub: 'Deadlines & study plans', emoji: '🗓️', bg: 'bg-rose', href: '/calendar' },
]

const HEADLINE_STYLE = { fontFamily: 'var(--font-caveat)', fontWeight: 600 } as const

export default function OnboardingPage() {
  const router = useRouter()
  const [step, setStep] = useState(0)
  const [pains, setPains] = useState<string[]>([])

  function togglePain(id: string) {
    setPains((prev) => (prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]))
  }

  function finish(href: string) {
    localStorage.setItem('studlin-onboarded', '1')
    router.replace(href)
  }

  return (
    <div className="min-h-screen bg-forest flex flex-col">
      <header className="flex items-center justify-between px-6 py-6 md:px-10">
        <div className="flex items-center gap-2.5">
          <span
            className="w-8 h-8 rounded-[10px] bg-lime grid place-items-center text-ink text-lg font-bold"
            style={{ fontFamily: 'var(--font-caveat)', transform: 'rotate(-6deg)' }}
          >
            S
          </span>
          <span
            className="text-cream text-lg tracking-tight"
            style={{ fontFamily: 'var(--font-instrument-serif)', fontStyle: 'italic' }}
          >
            Studlin
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
            <span
              key={i}
              className={clsx('h-1.5 w-6 rounded-full transition-colors', i <= step ? 'bg-lime' : 'bg-cream/15')}
            />
          ))}
        </div>

        <button onClick={() => finish('/dashboard')} className="text-sm text-cream/50 hover:text-cream transition-colors">
          Skip
        </button>
      </header>

      <main className="flex-1 flex items-center justify-center px-6 pb-16">
        <div key={step} className="w-full max-w-md onboard-step">
          {step === 0 && <WelcomeStep onNext={() => setStep(1)} />}
          {step === 1 && (
            <PainStep selected={pains} onToggle={togglePain} onBack={() => setStep(0)} onNext={() => setStep(2)} />
          )}
          {step === 2 && <AhaStep onBack={() => setStep(1)} onNext={() => setStep(3)} />}
          {step === 3 && <FocusStep onBack={() => setStep(2)} onSelect={finish} />}
        </div>
      </main>
    </div>
  )
}

function WelcomeStep({ onNext }: { onNext: () => void }) {
  return (
    <div className="text-center">
      <div className="flex justify-center gap-2 mb-8">
        {['📝', '🃏', '✨', '🗓️', '🎯'].map((emoji, i) => (
          <span
            key={emoji}
            className="w-11 h-11 rounded-2xl bg-white/5 border border-[var(--line-dark)] grid place-items-center text-xl"
            style={{ transform: `rotate(${(i - 2) * 6}deg)` }}
          >
            {emoji}
          </span>
        ))}
      </div>
      <h1 className="text-cream text-4xl md:text-5xl mb-3" style={HEADLINE_STYLE}>
        Let&apos;s set up your space.
      </h1>
      <p className="text-cream/60 text-base mb-10">Two quick questions. Then you&apos;re in.</p>
      <Button variant="lime" size="lg" onClick={onNext} className="w-full">
        Let&apos;s go →
      </Button>
    </div>
  )
}

function PainStep({
  selected,
  onToggle,
  onBack,
  onNext,
}: {
  selected: string[]
  onToggle: (id: string) => void
  onBack: () => void
  onNext: () => void
}) {
  return (
    <div>
      <h2 className="text-cream text-3xl md:text-4xl mb-2" style={HEADLINE_STYLE}>
        What&apos;s slowing you down?
      </h2>
      <p className="text-cream/60 text-sm mb-7">Pick what feels familiar — we&apos;ll fix it.</p>

      <div className="grid grid-cols-2 gap-3 mb-8">
        {PAIN_POINTS.map((p) => {
          const active = selected.includes(p.id)
          return (
            <button
              key={p.id}
              onClick={() => onToggle(p.id)}
              className={clsx(
                'flex items-center gap-2.5 rounded-2xl border px-4 py-3.5 text-left text-sm font-medium transition-all',
                active ? 'border-lime bg-lime/10 text-cream' : 'border-[var(--line-dark)] text-cream/70 hover:border-cream/25',
              )}
            >
              <span className="text-lg">{p.emoji}</span>
              {p.label}
            </button>
          )
        })}
      </div>

      <div className="flex items-center gap-3">
        <Button variant="ghost" size="lg" onClick={onBack}>
          ←
        </Button>
        <Button variant="lime" size="lg" onClick={onNext} className="flex-1">
          Continue →
        </Button>
      </div>
    </div>
  )
}

function AhaStep({ onBack, onNext }: { onBack: () => void; onNext: () => void }) {
  return (
    <div className="text-center">
      <div className="grid grid-cols-3 gap-3 mb-8">
        {FEATURE_CHIPS.map((f, i) => (
          <div key={f.label} className={clsx(f.bg, 'rounded-2xl py-4 onboard-merge')} style={{ animationDelay: `${i * 70}ms` }}>
            <div className="text-2xl mb-1">{f.emoji}</div>
            <div className="text-xs font-semibold text-ink">{f.label}</div>
          </div>
        ))}
      </div>
      <h2 className="text-cream text-3xl md:text-4xl mb-2" style={HEADLINE_STYLE}>
        Studlin replaces all of it.
      </h2>
      <p className="text-cream/60 text-sm mb-8">Everything above, in one app. No more switching tabs.</p>
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="lg" onClick={onBack}>
          ←
        </Button>
        <Button variant="lime" size="lg" onClick={onNext} className="flex-1">
          Show me →
        </Button>
      </div>
    </div>
  )
}

function FocusStep({ onBack, onSelect }: { onBack: () => void; onSelect: (href: string) => void }) {
  return (
    <div>
      <h2 className="text-cream text-3xl md:text-4xl mb-2" style={HEADLINE_STYLE}>
        Where do you want to start?
      </h2>
      <p className="text-cream/60 text-sm mb-7">Tap one — we&apos;ll take you straight there.</p>

      <div className="grid grid-cols-2 gap-3 mb-6">
        {FOCUS_OPTIONS.map((f) => (
          <button
            key={f.id}
            onClick={() => onSelect(f.href)}
            className={clsx(f.bg, 'rounded-2xl p-4 text-left hover:-translate-y-0.5 transition-transform')}
          >
            <div className="text-2xl mb-2">{f.emoji}</div>
            <div className="font-semibold text-sm text-ink">{f.label}</div>
            <div className="text-xs text-ink/60 mt-0.5">{f.sub}</div>
          </button>
        ))}
      </div>

      <div className="flex items-center gap-3">
        <Button variant="ghost" size="lg" onClick={onBack}>
          ←
        </Button>
        <button
          onClick={() => onSelect('/dashboard')}
          className="flex-1 text-center text-sm text-cream/50 hover:text-cream transition-colors py-3.5"
        >
          Not sure — go to dashboard →
        </button>
      </div>
    </div>
  )
}
