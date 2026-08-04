# Pending Verification

Known/suspected issues deliberately deferred rather than fixed blind — each needs a specific verification step before launch, not just a code read. Remove an item once it's actually been tested and resolved (or promote it to a real fix if verification shows it's broken).

## Spaced repetition is not real card-level scheduling -- copy overclaims it

**Where:** `studlin-app.jsx`'s `Flashcards` page header (fixed on `fix/prep-decks-clipping-and-copy`, was "Study with spaced repetition"), and separately `index.html`'s comparison table ("Active recall and spaced repetition built into every deck" -- NOT fixed, out of scope for that branch).

**What's actually real today:** manual "Study now" flip-card self-review, plus, if a deck is linked to an exam, AI-proposed *review sessions* scheduled on the calendar before that exam date (`computeReviewDates`/`computeReviewOffsets`, shipped and verified end-to-end per an earlier session). This is session-level scheduling -- when to sit down and review a deck -- not true spaced repetition, which tracks each individual CARD's own difficulty/recall history and computes a per-card next-review interval (SM-2/Anki-style). No such per-card interval tracking exists anywhere in this codebase.

**No prior tracked item found for this** -- checked memory and this file; the only related note was CLAUDE.md/AGENTS.md listing "Spaced repetition" as an aspirational product-vision bullet, not a tracked gap.

**Verification needed before launch:** either build real per-card interval scheduling, or stop describing the review-session feature as "spaced repetition" anywhere it's user-facing (the app header is fixed; `index.html`'s comparison-table line still needs the same treatment).

## Marketing/legal copy advertises features removed in chore/remove-dead-features

**Where:** `index.html` (hero copy, a marquee item, an FAQ section, and a pricing/credits section header — all "AI Tutor"; separately, "essay polish" in the hero subtitle; separately, "Lecture recording" listed as a real credit-metered pricing feature), `terms.html` and `privacy.html` (both reference "AI tutor" in liability/data-processing language).

**What happened:** `chore/remove-dead-features` deleted `AiTutor`/`GrammarPolish`/`AiHumanizer`/`WriteStudio`/`Solve`/`Essays` (confirmed dead — never instantiated as JSX anywhere, not reachable from any nav path) and cut `Lectures` (had exactly one real entry point, the "Record lecture" option in Notes, which that same branch removed). None of that touched `index.html`/`terms.html`/`privacy.html` — this is a content/marketing/possibly-legal decision, not a code cleanup one, and pricing copy already has known drift across multiple files from prior work, so a partial fix here isn't right either.

**Verification needed before launch:** decide what to do with the marketing/legal copy — rewrite it to stop advertising AI Tutor/essay polish/Lecture recording, or revisit whether one of these features should actually be rebuilt/re-exposed instead of the marketing copy changed. Either is legitimate; the current state (advertising features with zero working entry point) is not.

## Rules deploy status: LIVE as of 2026-07-27

The full contents of this branch's `firestore.rules` (commit 5f36610) were manually pasted into the Firebase Console and published on 2026-07-27. Live rules now match the committed file. See `project_firestore_rules_undeployed` in Claude's memory for the prior stale-rules history this closes out.

## Prep overlay clipping (Decks/Study) -- fixed, needs re-verification on preview

**Where:** `studlin-app.jsx`, `StudlinPrep`'s `flashcardsOverlay` render block.

**Root cause:** the overlay is `position:fixed;inset:0` but was rendered in place, nested inside `[data-page]` rather than portaled out of it. `[data-page]` has a CSS `animation` targeting `transform`, which per spec makes it a containing block for any `position:fixed` descendant even when not portaled to `document.body` -- so `inset:0` filled `[data-page]`'s own box instead of the real viewport, silently clipping everything past wherever that box's bottom edge fell (tab pills, deck grid, study view -- all of it, no scroll to reveal the rest). Same class of bug as the tour callout elsewhere in this file, which already works around it the same way.

**Fix:** wrapped the overlay in `ReactDOM.createPortal(..., document.body)`, matching the established pattern used elsewhere in the file. Verified: esbuild parse-check clean, full `node --test` suite (281/290 pass, same 9 pre-existing `computeDayViewScale` failures as before -- see below, unrelated), and `npm run test:rules` (55/55 pass). Not yet re-verified visually on a real preview deploy -- needs a human check of Prep → Decks → open a deck → Study at a real viewport size before this item is removed.

## Phantom flashcard on failed AI generation -- fixed, needs re-verification on preview

**Where:** `studlin-app.jsx`, `Flashcards`'s `createDeck`.

**Root cause:** `generateFlashcardsFromText`'s inner JSON-parse fallback returns `[]` (not a thrown error) when the AI response has no usable content -- e.g. a missing `ANTHROPIC_API_KEY` on preview causes a server error response with no `reply` field, which parses to an empty string, fails `JSON.parse`, and the regex fallback finds no matches. `createDeck` then treated any empty `cards` array (across `manual` with zero drafted cards, `file` with no upload, `record` with no audio, and genuine AI-generation failure) identically: substitute a placeholder card and create the deck anyway. That's how preview testing produced a deck labeled "1 cards" containing a fake "No cards were generated" card.

**Fix:** `createDeck` now validates before generating (no file uploaded / no audio recorded / no manual cards added -- inline red error via a new `createDeckError` state, deck is never created) and treats a genuine post-generation empty result as a failure too (inline error, deck not created), rather than ever substituting a fake card. Matches the CLAUDE.md rule that validation failures render as inline text beneath the field, not silent fallbacks. Verified: esbuild parse-check clean, same full test suite results as above. Not yet re-verified visually on preview -- needs a human check that triggering a real generation failure (e.g. on the preview deploy with no API key configured) now shows the inline error and creates no deck at all, instead of the old phantom-card deck.

## Three-account username/profile audit — VERIFIED 2026-07-27

**Accounts checked:** `shenouday7@gmail.com` (real, pre-existing, previously bounced to onboarding Step 3 by the stale-rules 403, manually completed by the founder the morning of the deploy), `shenouday7+test1@gmail.com`, `shenouday7+test2@gmail.com` (both fresh signups created after the deploy).

**Method:** read `profiles/{uid}` and `usernames/{username}` directly in Firestore Console (not the app UI) for all three.

**Result — all three PASS:**

| Account | uid | profiles doc | usernames doc | uid match |
|---|---|---|---|---|
| shenouday7@gmail.com | `23oK85PZtBSPllintSlB2rO0TDB3` | complete (name, school, status, streak, minutes) | `usernames/shenoudanessim` | ✓ |
| test1 | `Nh4g0CLKu6SqlWVN3riK9Wl5Nh73` | complete | `usernames/shenneno` | ✓ |
| test2 | `mN0iaCMaxLXxESRxX6pOpxsjTxP2` | complete | `usernames/shenoootwonen` | ✓ |

All three `profiles.updatedAt` timestamps are from 2026-07-27 (post-deploy), confirming the writes are landing under the new rules rather than being stale pre-existing data. No partial/inconsistent writes found on any of the three.

## Stale-rules blast radius — AUDITED 2026-07-27

**Method:** compared all 78 Firebase Auth accounts (project `studlin-cb78b`) against all 65 `profiles` collection docs by UID, via Firestore/Auth console (no Admin SDK access available in this environment to script it).

**Result:** 19 Auth accounts have no `profiles` doc at all:
- **11 are the founder's own Playwright/QA test fixtures** (`studlin.qa*`, `studlin.diag*`, `studlin.e2e*`, all created Jul 2–9) — not real users, no action needed.
- **8 look like real signups, never completed onboarding**: `johntimeones@gmail.com`, `nora49284@gmail.com`, `yemil34@gmail.com`, `shenouda@gmail.com`, `studlin2026@gmail.com`, `shen@gmail.com`, `shenouday@gmail.com`, `studlin.bis@gmail.com`. Several of these read like the founder's own alt-testing emails rather than distinct outside users; `johntimeones` and `nora49284` are the clearest candidates for genuine outside testers affected by the stale-rules bug.

Also found, as a side effect, **6 orphaned `profiles` docs** with no matching Auth user (leftover from deleted test accounts — Firestore doesn't cascade-delete on Auth user deletion). Unrelated to this bug; harmless.

**Self-heal status:** unconfirmed for the 8 real-looking accounts. The one account manually verified (the founder's real account) required a manual completion of onboarding Step 3 after being bounced there — it did not silently repair itself without that action. Whether the app's bounce-to-onboarding logic fires automatically for a different account on next login has not been tested with any of the 8.

## chatRooms/messages update allowlist — VERIFIED live (2026-07-27), fix confirmed complete

**Where:** `firestore.rules`, the `chatRooms/{roomId}/messages/{messageId}` `allow update` rule.

**What happened:** the rule's own comment documents a past incident where the update-field allowlist (`status`, `scheduledOption`, `scheduledMode`, `proposedBy`, `memberUids`, `studySessionId`, `responses`) drifted out of sync with what the client actually writes during the propose/accept/decline session-negotiation flow — Firestore silently rejected the whole update, and the client's own empty `.catch(()=>{})` masked it as a success. The committed rules file already contains what looks like the fix (the full field list above).

**Propose → accept: VERIFIED PASS.** Real two-account test (test1 → test2, both logged in live) against production, confirmed directly in Firestore (not UI): `chatRooms/dm_Nh4g0CLKu6SqlWVN3riK9Wl5Nh73_mN0iaCMaxLXxESRxX6pOpxsjTxP2/messages/hbvD9GEhNTngdP5dKRpd` shows `status: "confirmed"`, `proposedBy` set to test1, `responses` map with both UIDs correctly `"accepted"`, and a real `studySessionId` assigned. The write genuinely committed — this is not swallowed-error optimistic UI.

**Propose → decline: VERIFIED PASS.** Second proposal from test1, declined by test2. Confirmed directly in Firestore: `chatRooms/dm_Nh4g0CLKu6SqlWVN3riK9Wl5Nh73_mN0iaCMaxLXxESRxX6pOpxsjTxP2/messages/42gwCUBd2RvlfJyKiWkU` shows `status: "declined"`, `responses: {test1: "accepted" (implicit proposer), test2: "declined"}`. Write committed correctly.

**Conclusion: this item is closed.** Both negotiation paths verified against production Firestore, not just UI state. Safe to remove from future pending-verification passes.

## DataStore sync (events + decks + notes): no "synced" UI feedback

**Where:** `studlin-app.jsx`'s `createCollectionSync` factory (used by `DataStore.events`, `DataStore.decks`, `DataStore.notes`).

**What's missing:** sync (hydrate on sign-in, background push/flush) runs completely silently for all three collections. The only observability is the `users/{uid}/_sync/status` doc (`<type>LastSyncedAt`/`<type>LastError`), which isn't surfaced anywhere in the UI. This is arguably a gap against this project's own CLAUDE.md guardrail that successful async actions (sent, saved, synced) get a toast/confirmation, not silence.

**Verification needed before launch:** add a toast or similar confirmation when a sync/flush actually completes (and probably a discreet indicator on failure, given `_sync/status` already tracks `*LastError`). Deliberately not built yet — out of scope for the migration itself; scoped as its own follow-up. Applies equally to every future collection built on this same factory.

## events sync: cross-device delete propagation + durable offline queue — VERIFIED 2026-07-27, merged to main

**Where:** `studlin-app.jsx`'s `createCollectionSync` factory + `datastore-events-sync.js` (`mergeRemoteIntoLocal`, the `studlin-syncQueue` offline write queue).

**What's implemented:** a delete made on one device propagates to remove a still-present item on another device (unless that device has a genuinely newer edit, in which case its edit wins and un-deletes it). The propagation mechanism has no remaining gap; what's bounded is *when* it runs -- only on hydrate (sign-in / fresh page load), since there's no live listener (same pre-existing "one-time pull-and-merge, not live" limitation stated from the first commit, not something specific to deletes). Writes are also queued durably to `localStorage["studlin-syncQueue"]` on every edit, synchronously, before the debounced network push starts, so a tab closed immediately after an edit doesn't lose it; the queue flushes on auth-ready, the browser's `online` event, and a capped-backoff retry (2s doubling to 5min) on failure.

**Verified 2026-07-27 against the preview deployment** (real signed-in test accounts, not just unit tests): cross-device sync, delete propagation, an edit followed by an immediate tab close, and an offline edit all confirmed working. Merged to `main`. **This item is closed** for events specifically.

**Still open for decks (step 2), notes (step 3), and practiceExams/timerLogs (step 4), same factory, none live-verified yet:** all reuse this exact machinery (`createCollectionSync`) with their own localStorage keys and Firestore subcollections. Covered by the same unit + emulator test suites, but none has been through a real-device verification pass the way events just was -- treat all as "logic verified, not yet live-verified" until that happens. Decks is pushed (`firestore-step2-decks`) and awaiting its preview test; notes is pushed (`firestore-step3-notes`) and hasn't been previewed at all yet; practiceExams + timerLogs are pushed (`firestore-step4-remaining`) and also not yet previewed.

**timerLogs specifically has a wrinkle worth verifying live, not just in the emulator:** it migrates the real `sessions` localStorage array (there was never an actual `timerLogs` feature/key -- that name only ever existed in `firestore.rules`), and `logSession`'s entries only just got an `id` field retrofitted for this step. Session entries logged before this change have no `id` and are deliberately excluded from sync (stay local-only forever) rather than backfilled -- confirm on a real account with pre-existing timer history that this degrades the way intended (old sessions simply don't appear in Firestore, new ones do) rather than erroring.

## REMOVED: 9 aspirational computeDayViewScale tests (2026-07-27)

**What happened:** `tests/scheduling.test.js` had a `describe("computeDayViewScale (Day view's smart viewport...)")` block (9 tests) plus matching entries in `tests/harness.js`'s export list, testing a function that has never existed anywhere in `studlin-app.jsx` -- confirmed by grep, the name only ever appeared once, in an unrelated comment. The real Day view component (~line 12897) has similar logic (a `scrollToMin` calc, a fixed pxPerHr) inlined directly instead, hardcoded to a constant full-day span, not the dynamic per-event-widening/viewport-fitting behavior these tests specified. These 9 failures were confirmed pre-existing (via `git stash`, present before any of this session's Firestore/DataStore work) across three separate check-ins and never actually fixed.

**Decision:** deleted, not fixed. Aspirational tests for code that doesn't exist are noise, not a safety net -- a red suite that's "supposed to" have some permanent red stops meaning anything, and makes a real regression easy to miss in the noise. If Day view's viewport logic is ever actually extracted into a real, standalone `computeDayViewScale`, write real tests against the real implementation at that time -- these are not a spec to build to, they were never verified against anything real.

**Where:** removed the `describe` block from `tests/scheduling.test.js` and the `computeDayViewScale`/`DAY_VIEW_MIN_PX_HR`/`DAY_VIEW_MAX_PX_HR` entries from `tests/harness.js`'s export list. `npm test` is now expected to be 100% green.

## users/{uid} write rule errors (doesn't cleanly deny) on a true first-time create

**Where:** `firestore.rules`, the `users/{userId}` `allow write` rule (existing, not touched by the step-0 migration work).

**What the emulator test suite found (2026-07-27):** the rule unconditionally calls `request.resource.data.diff(resource.data).affectedKeys()`. `resource.data` is `null` when the document doesn't exist yet, and `.diff(null)` throws a rules-evaluation error rather than resolving to a clean allow/deny. In production this appears to never trigger: `users/{uid}` is always created server-side first via the Admin SDK (`api/me.js`, which bypasses rules entirely), so a client only ever hits this rule on an `update`, never a fresh `create`. Confirmed dormant, not exploitable as a bypass — an evaluation error still denies the request, it just does so with a different error shape than the other rules.

**Verification needed before launch:** confirm there's truly no code path where a client attempts to create `users/{uid}` directly (rather than update an Admin-SDK-created doc) — if one ever gets added, this rule would throw instead of denying cleanly, which could show up as a confusing "internal error" toast rather than a clear permission message. Low priority; worth a one-line rule fix (`resource == null || request.resource.data.diff(resource.data)...`) whenever `firestore.rules` is next touched for `users/{userId}` specifically.

## App Check disabled in production

**Where:** `studlin-web-app.html` (App Check init disabled after an unresolved reCAPTCHA init failure was found to be silently breaking Firestore reads app-wide).

**Assessed 2026-07-27** (live probing against production, see conversation history / commit context): this is **not** a cross-user data exposure — Firestore security rules independently enforce per-user ownership and were confirmed correct via live probing (a signed-in user cannot read/write another user's docs, unfiltered "list everyone" queries are rejected, the default-deny catch-all works). What App Check's absence actually removes is protection against **scripted/automated abuse** — since Firebase's public client config isn't secret and signup is open, a script (not just the real web app) can hit Firestore directly once it has a valid auth token. Concretely: directory-squatting abuse against `usernames`/`schools`, or write-volume cost/quota exhaustion.

**Status:** downgraded to post-launch abuse-resistance work, not a blocker. Re-enable App Check (fix the underlying reCAPTCHA init failure first) and consider rate limiting, before launch marketing/scale, not before this migration ships.
