'use client'

import { useState } from 'react'
import { clsx } from 'clsx'

interface Task {
  id: number
  text: string
  done: boolean
  active?: boolean
}

const INITIAL_TASKS: Task[] = [
  { id: 1, done: true, text: 'Bio: Cell respiration flashcards · 30 min' },
  { id: 2, done: true, text: 'Read Ch. 4 — Macbeth Act III' },
  { id: 3, done: false, text: 'Draft essay: "Power & corruption" · 45 min', active: true },
  { id: 4, done: false, text: 'Calc: practice integrals · 25 min' },
  { id: 5, done: false, text: 'Spanish: review subjunctive · 20 min' },
]

export function TodayPlan() {
  const [tasks, setTasks] = useState(INITIAL_TASKS)

  function toggle(id: number) {
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, done: !t.done, active: false } : t)),
    )
  }

  const doneCount = tasks.filter((t) => t.done).length

  return (
    <div className="bg-white border border-[var(--line)] rounded-[18px] p-5 flex flex-col h-full">
      <div className="flex justify-between items-center mb-4">
        <span className="font-semibold text-sm text-ink">Today's plan</span>
        <span className="text-xs text-ink/50">{doneCount} of {tasks.length} done</span>
      </div>

      <div className="flex flex-col gap-2.5">
        {tasks.map((task) => (
          <button
            key={task.id}
            onClick={() => toggle(task.id)}
            className={clsx(
              'flex items-center gap-3 px-3 py-2.5 rounded-[12px] text-left transition-all',
              task.done && 'bg-mint',
              task.active && !task.done && 'bg-butter border-2 border-lime-deep',
              !task.done && !task.active && 'hover:bg-cream',
            )}
          >
            {/* Checkbox */}
            <div
              className={clsx(
                'w-[18px] h-[18px] rounded-full flex-none grid place-items-center transition-all',
                task.done
                  ? 'bg-forest text-lime text-[11px]'
                  : 'border-2 border-ink/30',
              )}
            >
              {task.done && '✓'}
            </div>

            <span
              className={clsx(
                'flex-1 text-[13px] leading-snug',
                task.done && 'line-through opacity-60',
                task.active && !task.done && 'font-semibold text-[13.5px]',
              )}
            >
              {task.text}
            </span>

            {task.active && !task.done && (
              <span className="bg-ink text-cream text-[10.5px] font-bold px-2 py-0.5 rounded-[6px]">
                NOW
              </span>
            )}
          </button>
        ))}
      </div>
    </div>
  )
}
