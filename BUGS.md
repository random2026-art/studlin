# Known Bugs

Open issues tracked in one place instead of memory. Remove an item once it's fixed, merged, and re-verified — don't just mark it done from a code read.

## 1. Prep overlay clipping (Decks/Study)

**Status:** Fixed, unmerged. Branch `fix/prep-decks-clipping-and-copy`. Pending visual check on preview.

**Where:** `studlin-app.jsx`, `StudlinPrep`'s `flashcardsOverlay` render block.

**What was happening:** Prep → Decks → open a deck → Study clipped everything in the overlay (tab pills, deck grid, study view) at a fixed height, no scroll to reveal the rest.

**Root cause:** the overlay is `position:fixed;inset:0` but was rendered nested inside `[data-page]`, not portaled out of it. `[data-page]` has a CSS `animation` targeting `transform`, which makes it a containing block for `position:fixed` descendants — so `inset:0` filled `[data-page]`'s own box instead of the real viewport.

**Fix:** portaled the overlay to `document.body`, matching the pattern already used for the tour callout elsewhere in the file.

## 2. Phantom flashcard on failed AI generation

**Status:** Fixed, unmerged. Same branch as #1. Pending visual check on preview.

**Where:** `studlin-app.jsx`, `Flashcards`'s `createDeck`.

**What was happening:** a failed generation (e.g. missing `ANTHROPIC_API_KEY` on preview) still created a deck, showing "1 cards" with a fake "No cards were generated" card.

**Root cause:** `createDeck` treated every empty-`cards` case identically — no file uploaded, no audio recorded, no manual cards added, or a genuine AI failure — by substituting a placeholder card and saving the deck regardless.

**Fix:** each case now validates up front with an inline red error (new `createDeckError` state) and the deck is never created on failure, per CLAUDE.md's inline-validation rule.

## 3. "Study with spaced repetition" overclaims the feature

**Status:** Fixed, unmerged. Same branch as #1 and #2. Not a new item — already addressed, just flagging its status matches the other two.

**Where:** `studlin-app.jsx`'s `Flashcards` page header (was "Study with spaced repetition", now "Study now, or schedule reviews before an exam"). `index.html`'s comparison table still has the same overclaim ("Active recall and spaced repetition built into every deck") — not touched, out of scope for that branch.

**Why it's false:** card ratings (Missed/Hard/Good/Mastered) are cosmetic — nothing reads them back to schedule anything. The only real scheduling is session-level: if a deck is linked to an exam, `computeReviewDates`/`computeReviewOffsets` propose calendar review sessions before the exam date. True spaced repetition would track each card's own difficulty/recall history and compute a per-card next-review interval (SM-2/Anki-style) — no such per-card tracking exists anywhere in this codebase.

## 4. App-open can fire three stacked popups after missed blocks

**Status:** Confirmed real via code read. Not fixed.

**Where:** `studlin-app.jsx`, the dashboard's floating-panel state: `tier0Batch` (auto-moved tasks, top-left), `rolloverPending` (Tier 1 yesterday's-tasks prompt, top-right), and `strugglingBucketOffer`/`peakInsightOffer` (peak-hour insight nudges, bottom-left).

**Root cause:** the two insight nudges (`strugglingBucketOffer`/`peakInsightOffer`) already have explicit mutual exclusion — the code picks at most one of those two per load ("one nudge at a time, not a stack fighting for the same spot"). But that exclusion doesn't extend to `tier0Batch` or `rolloverPending`, which are set independently in the same daily-gate pass. A day with both an auto-moved task and an overdue-from-yesterday task and a ready insight nudge shows all three panels at once — different corners of the screen, so they don't overlap pixel-for-pixel, but it's three simultaneous asks on one app open, which is the "stacked popups" complaint.

**Needs a decision:** sequence them (show one, then the next on dismiss) or accept simultaneous-but-separate-corners as fine and just soften it (stagger the entrance animation, cap total panels shown at once, etc).

## 5. Integrations panel can show a stuck "Syncing…" state

**Status:** Partially fixed already; one real gap remains.

**Where:** `studlin-app.jsx`, `SettingsTab`'s Google Calendar integration (`requestGoogleSync`/`connectGoogle`/`syncGoogleNow`) and `connectGoogleCalendar()` (module scope).

**Already fixed (prior session):** "Sync now" on an already-connected calendar used to alias the full OAuth popup flow, so a blocked popup left the button on "Syncing…" forever with only a page refresh as an escape. It now calls `pullGoogleCalendarIfConnected()` — a plain server-side pull, no popup — so it can only succeed, fail fast, or surface a real sync error.

**Remaining gap:** the initial "Connect" (and "Reconnect") button still opens a real Google OAuth popup via `connectGoogleCalendar()`. That function does have a 90-second timeout as a safety net if the popup never opens (browser/extension popup blocker) — it no longer hangs literally forever. But if the popup *does* open and the student just closes it without finishing (a very plausible action), Google's Identity Services library often never fires the callback at all, so the same 90-second timeout is what eventually rescues it — meaning the button can sit on "Syncing…" for up to 90 real seconds after a simple manual close, and the resulting error message ("Your browser may have blocked the popup") is wrong for that specific case.

**Fix idea (not yet built):** detect popup-closed-without-completing faster (e.g. poll `popupWindow.closed` if the code client exposes the window handle, or shorten the timeout) and give that case its own accurate message instead of reusing the popup-blocked one.

## 6. OPENAI_API_KEY — unreferenced anywhere in the codebase

**Status:** Confirmed dead. Safe to delete from Vercel.

Grepped the entire repo for `OPENAI_API_KEY` and case-insensitively for `openai` — zero matches, in `api/*.js` or anywhere else. Nothing reads it. Not currently wired to anything, so removing it from Vercel's environment variables is safe.
