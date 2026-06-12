'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { clsx } from 'clsx'
import {
  LayoutDashboard,
  FileText,
  Layers,
  Timer,
  Calendar,
  Sparkles,
  ShieldCheck,
  NotebookPen,
  Music2,
  LogOut,
} from 'lucide-react'
import { useAuth } from '@/lib/auth-context'
import { useRouter } from 'next/navigation'

const WORKSPACE_NAV = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/essays', label: 'Essays', icon: FileText, badge: 3 },
  { href: '/flashcards', label: 'Flashcards', icon: Layers },
  { href: '/focus', label: 'Focus Timer', icon: Timer },
  { href: '/calendar', label: 'Calendar', icon: Calendar },
]

const TOOLS_NAV = [
  { href: '/tutor', label: 'AI Tutor', icon: Sparkles },
  { href: '/detector', label: 'AI Detector', icon: ShieldCheck },
  { href: '/notes', label: 'Note Taker', icon: NotebookPen },
  { href: '/music', label: 'Music', icon: Music2 },
]

function NavSection({ label, items }: { label: string; items: typeof WORKSPACE_NAV }) {
  const pathname = usePathname()

  return (
    <>
      <div
        className="px-2.5 pb-1.5 pt-4 text-[10.5px] uppercase tracking-[0.15em] text-ink/45"
        style={{ fontFamily: 'var(--font-jetbrains-mono)' }}
      >
        {label}
      </div>
      {items.map(({ href, label, icon: Icon, badge }) => {
        const active = pathname === href || (href !== '/dashboard' && pathname.startsWith(href))
        return (
          <Link
            key={href}
            href={href}
            className={clsx(
              'flex items-center gap-2.5 px-2.5 py-2 rounded-[10px] text-[13.5px] transition-colors relative',
              active
                ? 'bg-forest text-cream'
                : 'text-ink hover:bg-ink/5',
            )}
          >
            <Icon size={18} className="flex-none" />
            <span className="flex-1">{label}</span>
            {badge !== undefined && (
              <span className="bg-lime text-ink text-[10.5px] font-bold px-1.5 py-0.5 rounded-full">
                {badge}
              </span>
            )}
          </Link>
        )
      })}
    </>
  )
}

export function Sidebar() {
  const { signOutUser } = useAuth()
  const router = useRouter()

  async function handleSignOut() {
    await signOutUser()
    router.replace('/sign-in')
  }

  return (
    <aside className="w-[220px] flex-none bg-cream border-r border-[var(--line)] flex flex-col h-full">
      {/* Brand */}
      <div className="px-4 py-5 border-b border-[var(--line)]">
        <div className="flex items-center gap-2">
          <span
            className="w-7 h-7 rounded-[8px] bg-forest text-lime grid place-items-center text-xl font-bold flex-none"
            style={{ fontFamily: 'var(--font-caveat)', transform: 'rotate(-6deg)' }}
          >
            S
          </span>
          <span
            className="text-forest text-xl tracking-tight"
            style={{ fontFamily: 'var(--font-instrument-serif)', fontStyle: 'italic' }}
          >
            Studlin
          </span>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-2 flex flex-col gap-0.5">
        <NavSection label="Workspace" items={WORKSPACE_NAV} />
        <NavSection label="Tools" items={TOOLS_NAV} />
      </nav>

      {/* Sign out */}
      <div className="px-3 py-3 border-t border-[var(--line)]">
        <button
          onClick={handleSignOut}
          className="flex items-center gap-2.5 px-2.5 py-2 rounded-[10px] text-[13px] text-ink/60 hover:bg-ink/5 hover:text-ink transition-colors w-full"
        >
          <LogOut size={16} className="flex-none" />
          Sign out
        </button>
      </div>
    </aside>
  )
}
