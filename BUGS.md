# Known Bugs

Open issues tracked in one place instead of memory. Remove an item once it's fixed, merged, and re-verified — don't just mark it done from a code read.

## 1. Prep overlay clipping (Decks/Study)

**Status:** Fixed and merged to main. Visually verified on preview.

**Where:** `studlin-app.jsx`, `StudlinPrep`'s `flashcardsOverlay` render block.

**What was happening:** Prep → Decks → open a deck → Study clipped everything in the overlay (tab pills, deck grid, study view) at a fixed height, no scroll to reveal the rest.

**Root cause:** the overlay is `position:fixed;inset:0` but was rendered nested inside `[data-page]`, not portaled out of it. `[data-page]` has a CSS `animation` targeting `transform`, which makes it a containing block for `position:fixed` descendants — so `inset:0` filled `[data-page]`'s own box instead of the real viewport.

**Fix:** portaled the overlay to `document.body`, matching the pattern already used for the tour callout elsewhere in the file.

## 2. Phantom flashcard on failed AI generation

**Status:** Fixed and merged to main. Visually verified on preview.

**Where:** `studlin-app.jsx`, `Flashcards`'s `createDeck`.

**What was happening:** a failed generation (e.g. missing `ANTHROPIC_API_KEY` on preview) still created a deck, showing "1 cards" with a fake "No cards were generated" card.

**Root cause:** `createDeck` treated every empty-`cards` case identically — no file uploaded, no audio recorded, no manual cards added, or a genuine AI failure — by substituting a placeholder card and saving the deck regardless.

**Fix:** each case now validates up front with an inline red error (new `createDeckError` state) and the deck is never created on failure, per CLAUDE.md's inline-validation rule.

## 3. "Study with spaced repetition" overclaims the feature

**Status:** Fixed and merged to main (app copy). `index.html`'s comparison table still overclaims — separate, unscheduled fix.

**Where:** `studlin-app.jsx`'s `Flashcards` page header (was "Study with spaced repetition", now "Study now, or schedule reviews before an exam"). `index.html`'s comparison table still has the same overclaim ("Active recall and spaced repetition built into every deck") — not touched, out of scope for that branch.

**Why it's false:** card ratings (Missed/Hard/Good/Mastered) are cosmetic — nothing reads them back to schedule anything. The only real scheduling is session-level: if a deck is linked to an exam, `computeReviewDates`/`computeReviewOffsets` propose calendar review sessions before the exam date. True spaced repetition would track each card's own difficulty/recall history and compute a per-card next-review interval (SM-2/Anki-style) — no such per-card tracking exists anywhere in this codebase.

## 4. App-open can fire three stacked popups after missed blocks

**Status:** Fixed on `feat/catch-me-up` (unmerged — nothing merges until Today and Prep are also converted, per explicit instruction). Visually unverified on preview so far.

**Where:** `studlin-app.jsx`, the dashboard's floating-panel state: `tier0Batch` (auto-moved tasks, top-left), `rolloverPending` (Tier 1 yesterday's-tasks prompt, top-right), and `strugglingBucketOffer`/`peakInsightOffer` (peak-hour insight nudges, bottom-left) — plus a fourth, `examPrepSuggestion` (bottom-right), found during the Catch Me Up review and not in the original bug description.

**Root cause:** the two insight nudges (`strugglingBucketOffer`/`peakInsightOffer`) already had explicit mutual exclusion, but that never extended to `tier0Batch`, `rolloverPending`, or `examPrepSuggestion`, which could each fire independently on the same load.

**Fix:** `tier0Batch`/`rolloverPending` replaced with one `catchUpBanner` (2+ missed items triggers it; below that, Tier 0 still relocates silently with no banner at all now, not even for one item). `strugglingBucketOffer`/`peakInsightOffer`/`examPrepSuggestion` are now queued to storage (`queuedInsightNudges`) instead of rendering whenever recovery is pending — see item #8 below, since nothing reads that queue yet.

## 5. Integrations panel can show a stuck "Syncing…" state

**Status:** Partially fixed already. Remaining gap logged as a pre-launch polish item, not scheduled now.

**Where:** `studlin-app.jsx`, `SettingsTab`'s Google Calendar integration (`requestGoogleSync`/`connectGoogle`/`syncGoogleNow`) and `connectGoogleCalendar()` (module scope).

**Already fixed (prior session):** "Sync now" on an already-connected calendar used to alias the full OAuth popup flow, so a blocked popup left the button on "Syncing…" forever with only a page refresh as an escape. It now calls `pullGoogleCalendarIfConnected()` — a plain server-side pull, no popup — so it can only succeed, fail fast, or surface a real sync error.

**Remaining gap:** the initial "Connect" (and "Reconnect") button still opens a real Google OAuth popup via `connectGoogleCalendar()`. That function does have a 90-second timeout as a safety net if the popup never opens (browser/extension popup blocker) — it no longer hangs literally forever. But if the popup *does* open and the student just closes it without finishing (a very plausible action), Google's Identity Services library often never fires the callback at all, so the same 90-second timeout is what eventually rescues it — meaning the button can sit on "Syncing…" for up to 90 real seconds after a simple manual close, and the resulting error message ("Your browser may have blocked the popup") is wrong for that specific case.

**Fix idea (not yet built):** detect popup-closed-without-completing faster (e.g. poll `popupWindow.closed` if the code client exposes the window handle, or shorten the timeout) and give that case its own accurate message instead of reusing the popup-blocked one.

## 6. OPENAI_API_KEY — unreferenced anywhere in the codebase

**Status:** Resolved. Deleted from Vercel.

Grepped the entire repo for `OPENAI_API_KEY` and case-insensitively for `openai` — zero matches, in `api/*.js` or anywhere else. Nothing read it, so removing it from Vercel's environment variables was safe.

## 7. findFixedEventSlot's midnight-scan fallback — verified NOT reachable from Catch Me Up

**Status:** Closed. Verified by code reading and a real test, not just inference.

**Where:** `studlin-app.jsx`, `findFixedEventSlot` (its fallback scans from midnight and returns the first open 15-min slot anywhere in the day — see `tests/slot-finders-characterization.test.js`).

**Why this was worth checking:** if the rebuild preview could propose a 3am study session because of this fallback, it would look broken and undermine trust in the whole feature.

**Finding:** `findFixedEventSlot` has exactly one caller anywhere in the file — `computePausePlan`'s `move_event` intent, the unrelated "Studlin Reschedule" (Tier 3) flow for relocating a single fixed event by explicit request. `computeCatchUpPlan`'s entire call graph (`findTier0Slot` → `findSlotWithEviction` → `findLegalSlotOrNull` → `findOpenSlotFor`, plus its own direct `findLegalSlotOrNull`/`compressExamPrepForRoom` fallbacks) never touches it. `findLegalSlotOrNull` also independently re-validates any candidate slot against real work hours and conflicts before accepting it, so even `findOpenSlotFor`'s own (much milder) raw-fallback behavior can't slip through as a bad proposal — it becomes `null` (reported unplaceable) instead. Backed by a real test (`tests/catch-me-up.test.js`): a 25-day fully-booked window with no deadline never produces an off-hours time.

## 8. queuedInsightNudges is write-only — needs a read side when Dashboard/Today is built

**Status:** Open, expected, tracked so it isn't forgotten.

**Where:** `studlin-app.jsx`, `queueInsightNudge` (App()) writes to `localStorage["studlin-queuedInsightNudges"]` whenever a `strugglingBucketOffer`/`peakInsightOffer`/`examPrepSuggestion` would have fired while a Catch Me Up recovery banner is pending. Verified this is genuine `localStorage.setItem` persistence (via `lsSet`/`lsGet`, the app's standard wrapper) — it survives reloads/new sessions on the same device, it is not lost. It is not synced to Firestore (no `syncWriteHooks` entry registered for this key), so it's local-only, which is fine for its purpose.

**What's missing:** nothing reads this queue yet. Insight nudges that get deferred this way are captured but currently never shown to the student anywhere — they just accumulate in storage. This is expected and intentional for now (Dashboard/Today isn't converted on this branch), but needs a real read side — surfacing the queued nudges somewhere reasonable (Dashboard, once it exists) and clearing them once shown — or they'll silently pile up forever with no user-facing effect.
