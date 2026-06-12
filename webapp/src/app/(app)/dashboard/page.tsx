import { Topbar } from '@/components/layout/topbar'
import { TodayPlan } from '@/components/dashboard/today-plan'
import { FocusSession } from '@/components/dashboard/focus-session'
import { WeeklyChart } from '@/components/dashboard/weekly-chart'

export default function DashboardPage() {
  return (
    <div className="p-6 md:p-8 max-w-5xl mx-auto">
      <Topbar />

      {/* Dashboard grid: plan (left) + focus+chart (right) */}
      <div className="grid grid-cols-1 md:grid-cols-[1.4fr_1fr] gap-4">
        <TodayPlan />

        <div className="flex flex-col gap-4">
          <FocusSession />
          <WeeklyChart />
        </div>
      </div>

      {/* Quick access row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
        {[
          { label: 'Essays', sublabel: '3 drafts', bg: 'bg-peach', emoji: '✍️' },
          { label: 'Flashcards', sublabel: '0 due today', bg: 'bg-sky', emoji: '🃏' },
          { label: 'AI Tutor', sublabel: 'Ask anything', bg: 'bg-mint', emoji: '✨' },
          { label: 'Streaks', sublabel: '12 days 🔥', bg: 'bg-butter', emoji: '🏆' },
        ].map(({ label, sublabel, bg, emoji }) => (
          <div
            key={label}
            className={`${bg} rounded-[18px] p-4 cursor-pointer hover:-translate-y-0.5 transition-transform`}
          >
            <div className="text-2xl mb-2">{emoji}</div>
            <div className="font-semibold text-sm text-ink">{label}</div>
            <div className="text-xs text-ink/60 mt-0.5">{sublabel}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
