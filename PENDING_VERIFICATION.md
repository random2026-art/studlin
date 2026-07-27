# Pending Verification

Known/suspected issues deliberately deferred rather than fixed blind — each needs a specific verification step before launch, not just a code read. Remove an item once it's actually been tested and resolved (or promote it to a real fix if verification shows it's broken).

## chatRooms/messages update allowlist — unverified live

**Where:** `firestore.rules`, the `chatRooms/{roomId}/messages/{messageId}` `allow update` rule.

**What happened:** the rule's own comment documents a past incident where the update-field allowlist (`status`, `scheduledOption`, `scheduledMode`, `proposedBy`, `memberUids`, `studySessionId`, `responses`) drifted out of sync with what the client actually writes during the propose/accept/decline session-negotiation flow — Firestore silently rejected the whole update, and the client's own empty `.catch(()=>{})` masked it as a success. The committed rules file already contains what looks like the fix (the full field list above).

**Why it's not just marked done:** nobody has run the actual negotiation flow (propose a shared session → have the other party accept/decline) against the currently-deployed rules to confirm the fix is live and complete. A rules file change without a matching deploy, or a still-incomplete allowlist, would reproduce the exact same silent-failure bug.

**Verification needed before launch:** two real accounts, run a full propose → accept and a full propose → decline through the actual UI, confirm the Firestore write succeeds (no console error, state updates on both sides, not just optimistic local state).

## users/{uid} write rule errors (doesn't cleanly deny) on a true first-time create

**Where:** `firestore.rules`, the `users/{userId}` `allow write` rule (existing, not touched by the step-0 migration work).

**What the emulator test suite found (2026-07-27):** the rule unconditionally calls `request.resource.data.diff(resource.data).affectedKeys()`. `resource.data` is `null` when the document doesn't exist yet, and `.diff(null)` throws a rules-evaluation error rather than resolving to a clean allow/deny. In production this appears to never trigger: `users/{uid}` is always created server-side first via the Admin SDK (`api/me.js`, which bypasses rules entirely), so a client only ever hits this rule on an `update`, never a fresh `create`. Confirmed dormant, not exploitable as a bypass — an evaluation error still denies the request, it just does so with a different error shape than the other rules.

**Verification needed before launch:** confirm there's truly no code path where a client attempts to create `users/{uid}` directly (rather than update an Admin-SDK-created doc) — if one ever gets added, this rule would throw instead of denying cleanly, which could show up as a confusing "internal error" toast rather than a clear permission message. Low priority; worth a one-line rule fix (`resource == null || request.resource.data.diff(resource.data)...`) whenever `firestore.rules` is next touched for `users/{userId}` specifically.

## App Check disabled in production

**Where:** `studlin-web-app.html` (App Check init disabled after an unresolved reCAPTCHA init failure was found to be silently breaking Firestore reads app-wide).

**Assessed 2026-07-27** (live probing against production, see conversation history / commit context): this is **not** a cross-user data exposure — Firestore security rules independently enforce per-user ownership and were confirmed correct via live probing (a signed-in user cannot read/write another user's docs, unfiltered "list everyone" queries are rejected, the default-deny catch-all works). What App Check's absence actually removes is protection against **scripted/automated abuse** — since Firebase's public client config isn't secret and signup is open, a script (not just the real web app) can hit Firestore directly once it has a valid auth token. Concretely: directory-squatting abuse against `usernames`/`schools`, or write-volume cost/quota exhaustion.

**Status:** downgraded to post-launch abuse-resistance work, not a blocker. Re-enable App Check (fix the underlying reCAPTCHA init failure first) and consider rate limiting, before launch marketing/scale, not before this migration ships.
