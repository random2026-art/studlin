const DAYS = ['M', 'T', 'W', 'T', 'F', 'S', 'S']
const DATA = [0.4, 0.65, 0.55, 0.9, 0.7, 0.3, 0]

function getTodayIndex() {
  const day = new Date().getDay()
  return day === 0 ? 6 : day - 1
}

export function WeeklyChart() {
  const todayIndex = getTodayIndex()

  return (
    <div className="bg-white border border-[var(--line)] rounded-[18px] p-5">
      <div
        className="text-[11px] uppercase tracking-[0.1em] text-ink/50 mb-3"
        style={{ fontFamily: 'var(--font-jetbrains-mono)' }}
      >
        Week so far
      </div>

      <div className="flex items-end gap-1.5 h-12">
        {DATA.map((height, i) => (
          <div
            key={i}
            className="flex-1 rounded-sm rounded-t-[3px] transition-all"
            style={{
              height: `${Math.max(height * 100, 2)}%`,
              backgroundColor:
                i === todayIndex
                  ? '#9FE235'
                  : height === 0
                  ? 'rgba(14,31,24,0.1)'
                  : '#C8FF5A',
            }}
          />
        ))}
      </div>

      <div
        className="flex justify-between mt-1.5 text-[10px] text-ink/40"
        style={{ fontFamily: 'var(--font-jetbrains-mono)' }}
      >
        {DAYS.map((d, i) => (
          <span
            key={i}
            className={i === todayIndex ? 'text-ink font-semibold' : ''}
          >
            {d}
          </span>
        ))}
      </div>
    </div>
  )
}
