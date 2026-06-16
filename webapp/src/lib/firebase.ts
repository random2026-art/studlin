import { initializeApp, getApps } from 'firebase/app'
import { getAuth, GoogleAuthProvider, OAuthProvider } from 'firebase/auth'

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
}

// Guard against undefined env vars during server-side prerendering.
// NEXT_PUBLIC_ vars are inlined by the bundler, so on the client auth is always defined.
const app = firebaseConfig.apiKey
  ? (getApps()[0] ?? initializeApp(firebaseConfig))
  : getApps()[0] ?? null

export const auth = app ? getAuth(app) : null
export const googleProvider = new GoogleAuthProvider()
export const appleProvider = new OAuthProvider('apple.com')
export const microsoftProvider = new OAuthProvider('microsoft.com')
