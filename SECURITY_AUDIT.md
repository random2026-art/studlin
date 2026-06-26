# Studlin — Security Audit

**Scope:** Full source review of the deployed web app (static frontend + Vercel serverless `/api`, Firebase Auth, Stripe).
**Date:** 2026-06-22
**Method:** Static code review (OWASP Top 10 lens). Live/dynamic testing pending (needs the deployed URL + Chrome extension connected).

---

## TL;DR

Two issues make the whole business model bypassable today:

1. **Your AI endpoint has no authentication.** Anyone on the internet can POST to `/api/chat` and spend your Anthropic API budget for free, from any website. This is a direct, automatable bill against you.
2. **Credits and paid tiers live only in the browser's `localStorage`.** A user types two lines in the dev console and becomes "Max" with 999,999 credits. No payment, no server check.

Nothing about login, credits, or "Pro/Max" is enforced on a server you control. The frontend is the honor system. The fix is one principle: **never trust the client** — move auth, credits, and entitlements behind verified server checks.

The good news: secret keys are handled correctly (server-side env vars), the real login screen uses Firebase properly, Stripe *amounts* are computed server-side, and React's default escaping means no obvious XSS in the app. So the foundation is fine — the gaps are about enforcement, not rewrites.

---

## Severity summary

| # | Severity | Issue | Where |
|---|----------|-------|-------|
| 1 | 🔴 Critical | `/api/chat` unauthenticated + open CORS + no rate limit → free use of your Anthropic key | `api/chat.js` |
| 2 | 🔴 Critical | Credits & plan tier enforced only in `localStorage` → all paid features free | `studlin-app.jsx` |
| 3 | 🟠 High | No Stripe webhook / no server-side fulfillment → payments never verified, value granted client-side | `api/*`, `checkout.html` |
| 4 | 🟠 High | Plaintext password persisted to `localStorage` during onboarding | `onboarding.jsx` |
| 5 | 🟠 High | Subscription & payment-intent endpoints unauthenticated → spam/abuse with arbitrary emails | `api/checkout.js`, `api/create-intent.js`, `api/buy-credits.js` |
| 6 | 🟡 Medium | No security headers / no CSP (clickjacking, no XSS defense-in-depth, no HSTS) | `vercel.json`, all HTML |
| 7 | 🟡 Medium | Firebase API key unrestricted + Firestore/Storage rules unverified | Firebase console (verify) |
| 8 | 🟡 Medium | No email verification on signup | `studlin-app.jsx` |
| 9 | 🟡 Medium | No rate limiting on any endpoint (DoS / cost / brute force) | `api/*` |
| 10 | 🔵 Low | React dev builds + in-browser Babel in production | `Studlin Web App.html` |
| 11 | 🔵 Low | Weak server-side input validation (`customAmount` NaN, message size) | `api/create-intent.js`, `api/buy-credits.js`, `api/chat.js` |
| 12 | 🔵 Low | Duplicate unused endpoint increases attack surface | `api/buy-credits.js` vs `api/create-intent.js` |
| 13 | ⚪ Info | Full source (incl. monetization logic) shipped to browser | `studlin-app.jsx` via Babel |

---

## Critical findings

### 1. `/api/chat` is a wide-open, unauthenticated proxy to your paid Anthropic key 🔴

**Where:** `api/chat.js` lines 22–34.

```js
res.setHeader('Access-Control-Allow-Origin', '*');   // any website
...
const { messages, model: modelId } = req.body;        // no auth, no identity
```

**The attack (a hacker's first move):** There is no token check, no origin check, no rate limit. The endpoint forwards straight to `api.anthropic.com` using *your* `ANTHROPIC_API_KEY`. So anyone can run, from a terminal or a script, thousands of times a minute:

```bash
curl -s https://YOUR-DOMAIN/api/chat \
  -H 'Content-Type: application/json' \
  -d '{"model":"reason","messages":[{"r":"user","t":"write me a 4000-token essay"}]}'
```

`model:"reason"` even routes to your highest-cost path (`max_tokens: 4096`). Because CORS is `*`, an attacker can also embed this in any web page and use your visitors as a botnet. **Result: an attacker runs up your Anthropic bill with zero friction, and your in-app "credits" are irrelevant because the server never checks them.**

**Fix:**
- Require a Firebase **ID token** on every call and verify it server-side with `firebase-admin`. Reject anonymous requests.
- Lock CORS to your own origin(s), not `*`.
- Enforce credits **server-side** before calling Anthropic (see #2).
- Add rate limiting (see #9) and cap `max_tokens` / message length.

```js
// api/chat.js — top of handler
const admin = require('firebase-admin'); // initialize once with a service account
const ALLOWED = 'https://your-domain.com';
res.setHeader('Access-Control-Allow-Origin', ALLOWED);

const m = (req.headers.authorization || '').match(/^Bearer (.+)$/);
if (!m) return res.status(401).json({ error: 'Sign in required.' });
let uid;
try { uid = (await admin.auth().verifyIdToken(m[1])).uid; }
catch { return res.status(401).json({ error: 'Invalid session.' }); }
// ...then check & decrement this uid's credits in Firestore before calling Anthropic
```

---

### 2. Credits and plan tier are client-side only — the paywall is decorative 🔴

**Where:** `studlin-app.jsx` lines 257–278, 426, 443.

```js
const lsGet=(k,d)=>{ ... localStorage.getItem("studlin-"+k) ... };
function getPlan(){return lsGet("plan","Free");}
function getCredits(){return lsGet("credits",120);}
function setCreditsLS(n){lsSet("credits",Math.max(0,n));}
...
if(credits<cost){ /* "Not enough credits" */ }      // line 426 — client decides
const nc=credits-cost; setCredits(nc); setCreditsLS(nc); // line 443 — client decrements
```

There is no Firestore/database write and no server validation — all of `plan`, `credits`, XP, streaks, and limits are read from and written to `localStorage`.

**The attack (takes ~5 seconds in dev tools):**

```js
localStorage.setItem('studlin-plan', '"Max"');        // instant Max tier
localStorage.setItem('studlin-credits', '999999');    // unlimited credits
location.reload();
```

Every "Pro/Max" gate (`getPlan()`, `PLAN_LIMITS`, `getCreditLimit()`) now reads the forged value. Combined with #1, a user doesn't even need the UI — they can hit `/api/chat` directly forever.

**Fix:** Treat the client as untrusted display only.
- Store `plan`, `credits`, and entitlements in Firestore keyed by `uid`.
- Lock them with security rules so a user can **read** their own balance but **never write** it (only your server / webhook can).
- Deduct credits inside `/api/chat` *after* verifying the token and *after* a successful Anthropic call; return the authoritative new balance to the UI.

---

## High findings

### 3. No Stripe webhook — payments are never verified, value is granted by the browser 🟠

**Where:** `api/checkout.js`, `api/create-intent.js`, `api/buy-credits.js`, `checkout.html` lines 195–215. There is no `api/stripe-webhook` and no signature verification anywhere.

Today the flow is: create a PaymentIntent/Subscription → on the client's `then()` redirect to the app → the app shows credits/tier from `localStorage`. Nothing ties a *confirmed* payment to a *server-recorded* entitlement. Two consequences:

- A user can grant themselves credits/tier without paying at all (see #2).
- A real payment that succeeds *after* the browser closes (3-D Secure, async methods) may never be reflected — you'll have charges with no record of what they bought.

**Fix:** Add `api/stripe-webhook.js`, verify `Stripe-Signature` with `stripe.webhooks.constructEvent` and your `STRIPE_WEBHOOK_SECRET`, and only on `payment_intent.succeeded` / `invoice.paid` / `customer.subscription.updated` write the credits/entitlement to Firestore. Make the webhook the **only** thing that grants paid value. Tie the Stripe customer to the Firebase `uid` (pass it in metadata).

### 4. Onboarding stores the user's plaintext password in `localStorage` 🟠

**Where:** `onboarding.jsx` lines 670–680 (and the password field at 235).

```js
const payload = { ...state, _updatedAt: new Date().toISOString() };
localStorage.setItem("studlin-onboarding", JSON.stringify(payload)); // state.password included
```

The full onboarding `state` — which includes `password` — is serialized to `localStorage` on every step. Passwords in `localStorage` survive until manually cleared and are readable by any script on the origin (so any future XSS = instant credential theft) and by anyone with access to the device (shared/library computers are the norm for students). Your password policy is otherwise strong (14 chars, mixed case + digits), which makes leaking it here all the more wasteful.

Also note (lines 200–201): the "Continue with Google/Apple" buttons just set `provider` and advance — they don't perform OAuth, and the email step never calls Firebase. So onboarding collects credentials it doesn't actually use to create the account (the real account is created later in `AuthScreen`). 

**Fix:** Never persist raw passwords. Exclude `password` (and any secret) from the saved payload, or don't save credentials at all — create the Firebase account at the moment of signup and keep only non-sensitive progress (name, goals). Clear `studlin-onboarding` after completion.

### 5. Subscription / payment endpoints are unauthenticated → spam & abuse 🟠

**Where:** `api/checkout.js` line 18, `api/create-intent.js` line 18, `api/buy-credits.js` line 18 (all `Access-Control-Allow-Origin: *`, no identity).

Anyone can POST arbitrary `email`/`name` to `/api/checkout` and create unlimited Stripe customers + 7-day-trial subscriptions, or spin up endless PaymentIntents. This pollutes your Stripe account, can trigger trial/welcome emails to **arbitrary victims' inboxes** (using your brand to harass), and is a free way to probe your Stripe setup. Amounts are safely server-side (good — no price tampering), but the lack of auth is the problem.

**Fix:** Require a verified Firebase ID token (same as #1), tie the Stripe customer to the `uid`, lock CORS, and rate-limit. Consider Stripe's built-in fraud tooling (Radar) and idempotency keys.

---

## Medium findings

### 6. No security headers and no Content-Security-Policy 🟡
`vercel.json` only sets cache-control on two files; no HTML sends a CSP. You're missing `Content-Security-Policy`, `X-Frame-Options` / `frame-ancestors` (clickjacking), `X-Content-Type-Options: nosniff`, `Strict-Transport-Security` (HSTS), `Referrer-Policy`, and `Permissions-Policy`. With no CSP, any future injected script runs unrestricted.

**Fix:** Add a global `headers` block in `vercel.json`:

```json
{ "source": "/(.*)", "headers": [
  { "key": "Strict-Transport-Security", "value": "max-age=63072000; includeSubDomains; preload" },
  { "key": "X-Content-Type-Options", "value": "nosniff" },
  { "key": "X-Frame-Options", "value": "DENY" },
  { "key": "Referrer-Policy", "value": "strict-origin-when-cross-origin" },
  { "key": "Permissions-Policy", "value": "camera=(self), microphone=(self), geolocation=()" },
  { "key": "Content-Security-Policy", "value": "default-src 'self'; script-src 'self' https://js.stripe.com https://unpkg.com https://www.gstatic.com https://cdnjs.cloudflare.com 'unsafe-inline'; frame-src https://js.stripe.com https://www.youtube.com; connect-src 'self' https://api.anthropic.com https://*.googleapis.com; img-src 'self' https://img.youtube.com data:; style-src 'self' https://fonts.googleapis.com 'unsafe-inline'; font-src https://fonts.gstatic.com" }
]}
```
(Tighten `script-src` once you drop in-browser Babel — see #10. `'unsafe-inline'` is a stopgap.)

### 7. Restrict the Firebase web API key and verify Firestore/Storage rules 🟡
The `apiKey: "AIzaSy…"` in `Studlin Web App.html` is a public client identifier (safe to ship) — **but** it should be restricted in Google Cloud (HTTP referrers limited to your domains, and only the APIs you use) to limit quota abuse. More importantly, I can't see your Firestore/Storage **security rules** from the repo. If any data is stored there, confirm rules deny access unless `request.auth.uid` matches the document owner. Open ("test mode") rules would let anyone read/write all user data with just the public config.

### 8. No email verification 🟡
`createUserWithEmailAndPassword` (`studlin-app.jsx` line 2579) is never followed by `sendEmailVerification`, and nothing checks `emailVerified`. The onboarding even tells users to use a school/work email, but it's unverified — easy to fake accounts and abuse free credits. **Fix:** send verification on signup; gate credit-granting / sensitive actions on `emailVerified`.

### 9. No rate limiting anywhere 🟡
None of the endpoints throttle requests. This is what turns #1 from "annoying" into "expensive," and leaves login open to credential-stuffing. **Fix:** add per-IP + per-uid rate limits (e.g., Upstash Ratelimit on Vercel, or Vercel's firewall) on `/api/chat` and auth-adjacent endpoints.

---

## Low / informational

- **10. Production ships React *development* builds and transpiles JSX in the browser with Babel** (`Studlin Web App.html` lines 28–30). Slower, larger, and leaks verbose warnings. Move to a build step (Vite/Next) that emits minified production React and precompiled JS; this also lets you tighten CSP by removing `unpkg`/Babel.
- **11. Weak server-side input validation.** `+customAmount` accepts `NaN` (`"abc"` passes the `<5`/`>100000` checks and yields a `NaN` amount); `/api/chat` doesn't cap message count/size. Validate that amounts are finite positive integers and cap payload sizes.
- **12. Duplicate endpoint.** `api/buy-credits.js` and `api/create-intent.js` do nearly the same thing; only `create-intent` is called from `checkout.html`. Remove the unused one to shrink attack surface.
- **13. Source fully exposed.** Because JSX is compiled in-browser, all app logic (including the credit math) is readable in plain text. That's expected for this architecture — the takeaway is that obfuscation will never protect monetization; only server-side checks will.
- **Minor data bug (not security):** in `api/search-videos.js`, id `dQw4w9WgXcQ` is labeled "Probability — From Basics to Bayes / Veritasium" but that's the Rick Astley video. Swap it for a real one.

---

## What's already done right (keep it)

- Secret keys (`ANTHROPIC_API_KEY`, `STRIPE_SECRET_KEY`) are server-side env vars, never shipped to the client.
- The Stripe **publishable** key and Firebase config in the client are *meant* to be public — correct.
- Stripe charge **amounts** are computed server-side from fixed maps, so prices can't be tampered with from the client.
- The real auth screen uses Firebase Auth correctly (`createUserWithEmailAndPassword` / `signInWithEmailAndPassword` / `signInWithPopup`).
- No `innerHTML` / `dangerouslySetInnerHTML` in the app — React escaping prevents the obvious stored/reflected XSS.
- SRI `integrity` hashes on the CDN `<script>` tags.
- A genuinely strong password policy (14+ chars, mixed case + digits).

---

## Priority roadmap

**Do this week (stops active money loss):**
1. Put Firebase ID-token verification in front of `/api/chat` and lock CORS (#1).
2. Move `credits` + `plan` to Firestore; deduct server-side; rules make them client-read-only (#2).
3. Add rate limiting to `/api/chat` (#9).
4. Stop saving the password to `localStorage` (#4).

**Do next (close the paywall properly):**
5. Add a signature-verified Stripe webhook as the only way value is granted (#3).
6. Authenticate the checkout/intent endpoints (#5).
7. Add security headers + CSP (#6); verify Firebase key restriction + Firestore rules (#7).

**Then (hardening & polish):**
8. Email verification (#8); production build instead of in-browser Babel (#10); input validation (#11); remove the duplicate endpoint (#12).

---

## Couldn't verify from source (please confirm)

- **Firestore/Storage security rules** (in Firebase console) — the single most important thing I can't see.
- Whether the **Firebase API key** is restricted by HTTP referrer in Google Cloud.
- **Vercel env vars** are set as encrypted/Production-scoped (not committed) — the repo looks clean of secrets, which is good.
- The **deployed URL** — needed to run the live exploitation demo (the `localStorage` tier override and an unauthenticated `/api/chat` call) against the running site.
