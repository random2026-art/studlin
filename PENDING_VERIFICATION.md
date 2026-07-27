# Pending Verification

Known/suspected issues deliberately deferred rather than fixed blind — each needs a specific verification step before launch, not just a code read. Remove an item once it's actually been tested and resolved (or promote it to a real fix if verification shows it's broken).

## Rules deploy status: LIVE as of 2026-07-27

The full contents of this branch's `firestore.rules` (commit 5f36610) were manually pasted into the Firebase Console and published on 2026-07-27. Live rules now match the committed file. See `project_firestore_rules_undeployed` in Claude's memory for the prior stale-rules history this closes out.

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

## events sync (DataStore, branch firestore-step1-events): no "synced" UI feedback

**Where:** `studlin-app.jsx`'s `DataStore` object (events -> Firestore sync).

**What's missing:** sync (hydrate on sign-in, background push/flush) runs completely silently. The only observability is the `users/{uid}/_sync/status` doc (`eventsLastSyncedAt`/`eventsLastError`), which isn't surfaced anywhere in the UI. This is arguably a gap against this project's own CLAUDE.md guardrail that successful async actions (sent, saved, synced) get a toast/confirmation, not silence.

**Verification needed before launch:** add a toast or similar confirmation when a sync/flush actually completes (and probably a discreet indicator on failure, given `_sync/status` already tracks `eventsLastError`). Deliberately not built yet — out of scope for the step-1 migration itself; scoped as its own follow-up.

## events sync (DataStore): cross-device delete propagation and the durable offline queue — implemented + unit-tested, not yet verified against a real two-device/offline scenario

**Where:** `studlin-app.jsx`'s `DataStore` object + `datastore-events-sync.js` (`mergeRemoteIntoLocal`, the `studlin-syncQueue` offline write queue).

**What's implemented:** a delete made on one device now propagates to remove a still-present item on another device (unless that device has a genuinely newer edit, in which case its edit wins and un-deletes it) — this was a real gap in the first version of this migration, fixed after review caught it. The propagation mechanism itself has no remaining gap; what's bounded is *when* it runs -- only on hydrate (sign-in / fresh page load), since there's no live listener (same pre-existing "one-time pull-and-merge, not live" limitation stated from the first commit, not something specific to deletes). Writes are also queued durably to `localStorage["studlin-syncQueue"]` on every edit, synchronously, before the debounced network push starts, so a tab closed immediately after an edit doesn't lose it; the queue flushes on auth-ready, the browser's `online` event, and a capped-backoff retry (2s doubling to 5min) on failure.

**Why this isn't marked fully done:** both are covered by unit tests against synthetic inputs (`tests/events-sync.test.js` — merge/delete-propagation cases, and a simulated edit -> JSON round-trip ("tab close/reopen") -> flush case for the queue), but neither has been exercised against a real two-device scenario or a real offline/reconnect cycle in an actual browser. Same category of risk as the chatRooms allowlist entry above: logic that's correct on paper needs a real run before it's trusted.

**Verification needed before launch:** (1) two real signed-in devices/browsers, edit the same event on both while one is offline, confirm the newest edit wins and the loser doesn't silently reappear; (2) delete an event on device A, confirm it disappears from device B on next hydrate; (3) edit an event, kill the tab/close the browser immediately, reopen, confirm the edit reaches Firestore without further action.

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
