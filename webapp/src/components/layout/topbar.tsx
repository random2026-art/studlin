'use client'

import { useAuth } from '@/lib/auth-context'

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

function getGreeting(name: string) {
  const hour = new Date().getHours()
  if (hour < 12) return `Good morning, ${name} — let's lock in.`
  if (hour < 18) return `Hey ${name} — let's lock in.`
  return `Evening, ${name} — time to lock in.`
}

export function Topbar() {
  const { user } = useAuth()
  const now = new Date()
  const dateStr = `${DAYS[now.getDay()]}, ${MONTHS[now.getMonth()]} ${now.getDate()}`
  const firstName = user?.displayName?.split(' ')[0] ?? 'there'

  return (
    <div className="flex items-center justify-between mb-6">
      <div>
        <div
          className="text-[11px] uppercase tracking-[0.15em] text-ink/50 mb-1"
          style={{ fontFamily: 'var(--font-jetbrains-mono)' }}
        >
          {dateStr}
        </div>
        <h2
          className="text-4xl text-forest leading-none"
          style={{ fontFamily: 'var(--font-caveat)', fontWeight: 600 }}
        >
          {getGreeting(firstName)}
        </h2>
      </div>

      <div className="flex items-center gap-2.5">
        <div className="bg-lime text-ink px-3 py-1.5 rounded-full text-xs font-semibold">
          🔥 12-day streak
        </div>
        {user?.photoURL ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={user.photoURL}
            alt={user.displayName ?? 'avatar'}
            className="w-9 h-9 rounded-full object-cover"
          />
        ) : (
          <div
            className="w-9 h-9 rounded-full bg-gradient-to-br from-peach to-rose flex items-center justify-center text-ink text-sm font-bold"
          >
            {firstName[0]?.toUpperCase()}
          </div>
        )}
      </div>
    </div>
  )
}
