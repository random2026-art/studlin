'use client'

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react'
import type { User, UserCredential } from 'firebase/auth'
import {
  onAuthStateChanged,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  signOut,
} from 'firebase/auth'
import { auth, googleProvider, appleProvider, microsoftProvider } from './firebase'

interface AuthContextValue {
  user: User | null
  loading: boolean
  signInWithGoogle: () => Promise<UserCredential>
  signInWithApple: () => Promise<UserCredential>
  signInWithMicrosoft: () => Promise<UserCredential>
  signInWithEmail: (email: string, password: string) => Promise<void>
  signUpWithEmail: (name: string, email: string, password: string) => Promise<void>
  signOutUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u)
      setLoading(false)
      const secure = location.protocol === 'https:' ? '; Secure' : ''
      if (u) {
        document.cookie = `studlin-session=1; path=/; max-age=604800; SameSite=Lax${secure}`
      } else {
        document.cookie = `studlin-session=; path=/; max-age=0${secure}`
      }
    })
    return unsubscribe
  }, [])

  async function signInWithGoogle() {
    return signInWithPopup(auth, googleProvider)
  }

  async function signInWithApple() {
    return signInWithPopup(auth, appleProvider)
  }

  async function signInWithMicrosoft() {
    return signInWithPopup(auth, microsoftProvider)
  }

  async function signInWithEmail(email: string, password: string) {
    await signInWithEmailAndPassword(auth, email, password)
  }

  async function signUpWithEmail(name: string, email: string, password: string) {
    const cred = await createUserWithEmailAndPassword(auth, email, password)
    await updateProfile(cred.user, { displayName: name })
  }

  async function signOutUser() {
    await signOut(auth)
  }

  return (
    <AuthContext.Provider value={{ user, loading, signInWithGoogle, signInWithApple, signInWithMicrosoft, signInWithEmail, signUpWithEmail, signOutUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
