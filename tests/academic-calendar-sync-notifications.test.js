// Regression tests for the 2026-08-28 academic calendar sync notification
// feature, requested directly by the user: "when new assignments quizzes
// exam projects come from canvas or whatever studlin lets the user know
// also if update anything from any of the calendars."
//
// Before this fix, syncing Canvas/Schoology/Moodle/Blackboard only ever
// happened while the student had the app open (a client-side once-a-day
// check) -- a new assignment posted while they weren't looking got, at
// best, a passive toast the next time they opened Studlin, and nothing at
// all otherwise. This adds a real server-side daily job (the same cron
// Google Calendar already uses) that notices a genuine change and sends a
// push notification, without replicating the client's own classification/
// review pipeline -- its only job is noticing and nudging the student to
// open the app, where the existing, already-correct client-side resync
// takes over exactly as it does today.
//
// api/cal-proxy.js's fetchCalendarRevalidated export is a real function,
// tested directly (same precedent as parseICS/isCalendarHostAllowedForPlatform
// in tests/cal-import.test.js). api/me.js requires a Stripe key and the
// Firebase Admin SDK at module load -- no mock exists for either in this
// suite (same established limitation as share-availability-request.test.js
// covering api/notify.js) -- so its new logic is covered by source-level
// regression guards instead. The client-side sync trigger
// (saveImportedCalendars) is a real top-level function, tested directly.
// Run with `npm test`.
const { test, describe } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const path = require("path");
const { loadStudlinModule } = require("./harness.js");
const { fetchCalendarRevalidated } = require("../api/cal-proxy.js");

const ME_SOURCE = fs.readFileSync(path.join(__dirname, "..", "api", "me.js"), "utf8");
const APP_SOURCE = fs.readFileSync(path.join(__dirname, "..", "studlin-app.jsx"), "utf8");

describe("api/cal-proxy.js: fetchCalendarRevalidated is now exported for the cron to reuse", () => {
  test("it's a real function, not undefined", () => {
    assert.equal(typeof fetchCalendarRevalidated, "function");
  });
});

describe("api/me.js: calendarChanged never notifies on a subscription's first-ever cron pass", () => {
  test("no baseline (null/undefined fingerprints) short-circuits to false before comparing anything", () => {
    assert.match(ME_SOURCE, /function calendarChanged\(oldFingerprints, newEvents\) \{\s*if \(!oldFingerprints\) return false;/);
  });
});

describe("api/me.js: the Canvas half of the academic cron", () => {
  test("queries the same way handleGoogleCalendarCron already does (canvasAccessToken != null)", () => {
    assert.match(ME_SOURCE, /const canvasSnap = await db\.collection\('users'\)\.where\('canvasAccessToken', '!=', null\)\.get\(\);/);
  });
  test("sends a push only when calendarChanged says something real changed, not on every pass", () => {
    assert.match(ME_SOURCE, /if \(calendarChanged\(data\.canvasFingerprints \|\| null, events\)\) \{\s*await sendAcademicSyncPush\(doc\.id, data, 'Canvas'\);/);
  });
  test("always refreshes canvasSyncedEvents/canvasFingerprints/canvasLastSyncedAt regardless of whether it notified, keeping the stored snapshot current for next time", () => {
    const idx = ME_SOURCE.indexOf("const canvasSnap = await db.collection('users')");
    const body = ME_SOURCE.slice(idx, idx + 1600);
    assert.match(body, /canvasSyncedEvents: events,/);
    assert.match(body, /canvasFingerprints: \[\.\.\.calendarFingerprint\(events\)\]\.slice\(0, CALENDAR_FINGERPRINT_CAP\),/);
  });
  test("one user's failure (revoked token, DNS issue) doesn't stop the batch, and is recorded per-user same as the Google cron already does", () => {
    const idx = ME_SOURCE.indexOf("const canvasSnap = await db.collection('users')");
    const body = ME_SOURCE.slice(idx, idx + 1600);
    assert.match(body, /catch \(err\) \{\s*failed\+\+;\s*await doc\.ref\.update\(\{ canvasLastSyncError: err\.message \|\| 'Sync failed' \}\)\.catch\(\(\) => \{\}\);/);
  });
});

describe("api/me.js: the Schoology/Moodle/Blackboard (.ics) half of the academic cron", () => {
  test("queries the indexed boolean flag, not an array-contains check Firestore can't do efficiently", () => {
    assert.match(ME_SOURCE, /const icsSnap = await db\.collection\('users'\)\.where\('hasImportedAcademicCalendars', '==', true\)\.get\(\);/);
  });
  test("only ever checks subscriptions with a real academic sourceType -- a plain personal iCloud/work-schedule link has no 'new assignment' concept worth a push", () => {
    assert.match(ME_SOURCE, /const subs = \(data\.importedCalendars \|\| \[\]\)\.filter\(s => ACADEMIC_SOURCE_TYPES\.includes\(s\.sourceType\)\);/);
  });
  test("reuses cal-proxy's own SSRF-safe fetch, not a second, easier-to-drift copy of that safety logic", () => {
    assert.match(ME_SOURCE, /const r = await fetchCalendarRevalidated\(sub\.url, platformHintFor\(sub\.sourceType\)\);/);
  });
  test("a failed subscription fetch never wipes that subscription's last-known-good snapshot -- nextSnapshots starts as a copy of the existing map and is only overwritten on success", () => {
    assert.match(ME_SOURCE, /const nextSnapshots = \{ \.\.\.snapshots \};/);
    const idx = ME_SOURCE.indexOf("const nextSnapshots = { ...snapshots };");
    const body = ME_SOURCE.slice(idx, idx + 900);
    assert.match(body, /\} catch \(err\) \{\s*failed\+\+;\s*\}/, "a caught fetch error must not touch nextSnapshots[sub.id], leaving the prior snapshot intact");
  });
  test("one push per user even when multiple subscriptions all changed, not one per subscription", () => {
    const idx = ME_SOURCE.indexOf("const icsSnap = await db.collection('users')");
    const body = ME_SOURCE.slice(idx, idx + 1800);
    const pushCalls = body.match(/sendAcademicSyncPush\(/g) || [];
    assert.equal(pushCalls.length, 1, "expected exactly one sendAcademicSyncPush call site in the ICS loop, called once per user after checking all their subscriptions");
  });
});

describe("api/me.js: sendAcademicSyncPush respects the same preferences/cleanup contract every other push in this app already uses", () => {
  test("gated on the recipient's own pushNotificationsEnabled preference", () => {
    assert.match(ME_SOURCE, /async function sendAcademicSyncPush\(uid, data, sourceLabel\) \{\s*if \(!data\.preferences \|\| data\.preferences\.pushNotificationsEnabled !== true\) return;/);
  });
  test("cleans up stale/invalid FCM tokens, same as sendPush/sendShareAvailabilityRequest", () => {
    const idx = ME_SOURCE.indexOf("async function sendAcademicSyncPush");
    const body = ME_SOURCE.slice(idx, idx + 1200);
    assert.match(body, /messaging\/invalid-registration-token/);
    assert.match(body, /fcmTokens: admin\.firestore\.FieldValue\.arrayRemove\(\.\.\.staleTokens\),/);
  });
});

describe("api/me.js: handleSyncImportedCalendars persists the client's calendar list server-side", () => {
  test("sanitizes the incoming array down to only the fields the cron actually reads", () => {
    assert.match(ME_SOURCE, /\.map\(s => \(\{ id: s\.id, url: s\.url, label: String\(s\.label \|\| ''\)\.slice\(0, 120\), sourceType: String\(s\.sourceType \|\| ''\)\.slice\(0, 40\) \}\)\);/);
  });
  test("computes hasImportedAcademicCalendars fresh server-side rather than trusting a client-sent flag", () => {
    assert.match(ME_SOURCE, /const hasImportedAcademicCalendars = sanitized\.some\(s => ACADEMIC_SOURCE_TYPES\.includes\(s\.sourceType\)\);/);
  });
  test("the router dispatches the new action", () => {
    assert.match(ME_SOURCE, /if \(action === 'sync-imported-calendars'\) return handleSyncImportedCalendars\(user, req, res\);/);
  });
  test("Canvas disconnect also clears the fingerprint snapshot, not just the synced events", () => {
    assert.match(ME_SOURCE, /canvasSyncedEvents: admin\.firestore\.FieldValue\.delete\(\),\s*canvasFingerprints: admin\.firestore\.FieldValue\.delete\(\),/);
  });
});

describe("api/me.js: the cron dispatch runs both jobs independently, so one provider's outage can't silently skip the other", () => {
  test("both handlers are awaited with their own separate .catch, not one shared try/catch that could let a Google failure skip the academic pass entirely", () => {
    assert.match(ME_SOURCE, /const google = await handleGoogleCalendarCron\(\)\.catch\(\(err\) => \(\{ ok: false, error: err\.message \}\)\);/);
    assert.match(ME_SOURCE, /const academic = await handleAcademicCalendarCron\(\)\.catch\(\(err\) => \(\{ ok: false, error: err\.message \}\)\);/);
  });
  test("neither cron function calls res itself anymore -- both return a plain result object so this one dispatch point is the only place sending the real HTTP response", () => {
    assert.match(ME_SOURCE, /async function handleGoogleCalendarCron\(\) \{\s*if \(!db\) return \{ ok: false, error: 'Database unavailable\.' \};/);
    assert.match(ME_SOURCE, /async function handleAcademicCalendarCron\(\) \{\s*if \(!db\) return \{ ok: false, error: 'Database unavailable\.' \};/);
  });
});

describe("Client: saveImportedCalendars pushes the list server-side too, not just to localStorage", () => {
  test("every call site (add/remove/edit a calendar link) automatically syncs, since this is centralized in the one shared function rather than repeated at each call site", () => {
    assert.match(APP_SOURCE, /const saveImportedCalendars=\(list\)=>\{\s*lsSet\("importedCalendars",list\);\s*authFetch\("\/api\/me",\{method:"POST",headers:\{"Content-Type":"application\/json"\},body:JSON\.stringify\(\{action:"sync-imported-calendars",importedCalendars:list\}\)\}\)\.catch\(\(\)=>\{\}\);\s*\};/);
  });
  test("a failed sync is fire-and-forget -- it never blocks or breaks the local save, which stays the real source of truth for what the app does with these subscriptions", () => {
    const idx = APP_SOURCE.indexOf('const saveImportedCalendars=(list)=>{');
    const body = APP_SOURCE.slice(idx, idx + 400);
    assert.match(body, /\.catch\(\(\)=>\{\}\);/);
  });
});
