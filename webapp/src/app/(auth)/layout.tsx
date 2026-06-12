import type { ReactNode } from 'react'

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-forest flex items-center justify-center px-4 py-16">
      {children}
    </div>
  )
}
