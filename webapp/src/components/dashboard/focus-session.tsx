'use client'

import { useReducer, useEffect, useRef } from 'react'

const POMODORO_SECONDS = 25 * 60

interface TimerState {
  total: number
  remaining: number
  running: boolean
}

type TimerAction = { type: 'tick' } | { type: 'start' } | { type: 'pause' } | { type: 'reset' }

function timerReducer(state: TimerState, action: TimerAction): TimerState {
  switch (action.type) {
    case 'tick':
      return state.running
        ? { ...state, remaining: Math.max(0, state.remaining - 1) }
        : state
    case 'start':
      return state.remaining > 0 ? { ...state, running: true } : state
    case 'pause':
      return { ...state, running: false }
    case 'reset':
      return { total: POMODORO_SECONDS, remaining: POMODORO_SECONDS, running: false }
  }
}

function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

export function FocusSession() {
  const [state, dispatch] = useReducer(timerReducer, {
    total: POMODORO_SECONDS,
    remaining: POMODORO_SECONDS,
    running: false,
  })
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    if (state.running) {
      intervalRef.current = setInterval(() => dispatch({ type: 'tick' }), 1000)
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [state.running])

  const progress = ((state.total - state.remaining) / state.total) * 100
  const minutesLeft = Math.ceil(state.remaining / 60)

  return (
    <div className="bg-forest text-cream rounded-[18px] p-5">
      <div className="flex justify-between items-center mb-3">
        <span
          className="text-[11px] uppercase tracking-[0.1em] opacity-70"
          style={{ fontFamily: 'var(--font-jetbrains-mono)' }}
        >
          Focus session
        </span>
        <div
          className={`w-2 h-2 rounded-full ${state.running ? 'bg-lime shadow-[0_0_10px_var(--color-lime)]' : 'bg-cream/30'} transition-all`}
        />
      </div>

      <div
        className="text-[64px] leading-none font-semibold text-lime"
        style={{ fontFamily: 'var(--font-caveat)' }}
      >
        {formatTime(state.remaining)}
      </div>

      <div className="text-xs opacity-70 mt-1.5 mb-3.5">
        {state.running
          ? `Pomodoro · break in ${minutesLeft} min`
          : state.remaining === 0
          ? 'Session complete! 🎉'
          : 'Pomodoro · 25 min session'}
      </div>

      {/* Progress bar */}
      <div className="h-1.5 bg-cream/15 rounded-full overflow-hidden mb-4">
        <div
          className="h-full bg-lime rounded-full transition-all duration-1000"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Controls */}
      <div className="flex gap-2">
        {state.running ? (
          <button
            onClick={() => dispatch({ type: 'pause' })}
            className="flex-1 bg-cream/10 hover:bg-cream/20 text-cream text-sm font-semibold py-2 rounded-full transition-colors"
          >
            Pause
          </button>
        ) : (
          <button
            onClick={() => dispatch({ type: 'start' })}
            className="flex-1 bg-lime text-ink text-sm font-semibold py-2 rounded-full hover:bg-lime-deep transition-colors"
          >
            {state.remaining === state.total ? 'Start' : 'Resume'}
          </button>
        )}
        <button
          onClick={() => dispatch({ type: 'reset' })}
          className="px-4 bg-cream/10 hover:bg-cream/20 text-cream text-sm py-2 rounded-full transition-colors"
        >
          Reset
        </button>
      </div>
    </div>
  )
}
