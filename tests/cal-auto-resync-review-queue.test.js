// Regression tests for the silent, once-a-day calendar auto-resync (see
// resyncCalendar's own useEffect in studlin-app.jsx). Before this fix, the
// automatic path called classifyImportedCalendarEvents (a real AI
// classification pass -- "is this new Canvas item an exam? worth what % of
// the grade?") and then immediately merged the result straight onto the
// calendar with only a toast, unlike the two user-initiated paths
// (fetchCalendarPreview/connectCanvasToken and the manual "Sync now"
// button), which both always route through the importCalReview
// preview-then-commit screen first.
//
// buildDeferredCalendarReviewQueue is the pure piece of that fix: it builds
// the same importCalReview-shaped payload those two paths already produce
// and queues it into openImportCalQueue (the existing one-shot flag the
// onboarding wizard's deferred platform picks already use) instead of
// merging anything, so the classified guesses get a real review screen the
// next time Settings opens rather than a silent commit. Run with `npm test`.
const { test, describe } = require("node:test");
const assert = require("node:assert/strict");
const { loadStudlinModule } = require("./harness.js");

describe("buildDeferredCalendarReviewQueue (Fix 2: auto-resync defers to a real review instead of committing silently)", () => {
  test("builds one reviewPayload entry per resync, classified events mapped the same way fetchCalendarPreview/connectCanvasToken already shape them", () => {
    const { buildDeferredCalendarReviewQueue } = loadStudlinModule({});
    const sub = { id: "sub-1", url: "https://example.com/feed.ics", label: "Canvas", sourceType: "Canvas", viaToken: false };
    const newEvents = [
      { uid: "u1", title: "Midterm 1", date: "2026-09-01" },
      { uid: "u2", title: "Reading response", date: "2026-08-30" },
    ];
    const classifications = { u1: { kind: "exam", subject: "Chemistry", examWeight: "major" } };
    const { queue, reviewEvents } = buildDeferredCalendarReviewQueue([], sub, newEvents, classifications);
    assert.equal(queue.length, 1);
    assert.equal(queue[0].reviewPayload.subId, "sub-1");
    assert.equal(queue[0].reviewPayload.label, "Canvas");
    assert.equal(queue[0].reviewPayload.classified, true);
    assert.equal(reviewEvents.length, 2);
    const classified = reviewEvents.find(e => e.uid === "u1");
    assert.equal(classified.kind, "exam");
    assert.equal(classified.subjectGuess, "Chemistry");
    assert.equal(classified.examWeight, "major");
    assert.equal(classified.include, true, "every reviewed item starts checked, same as the manual review paths");
  });

  test("an unclassified item (no matching uid in classifications) still gets a safe, editable default -- 'assignment'/'Other' for a plain .ics feed", () => {
    const { buildDeferredCalendarReviewQueue } = loadStudlinModule({});
    const sub = { id: "sub-1", url: "https://example.com/feed.ics", label: "Schoology", sourceType: "Schoology", viaToken: false };
    const newEvents = [{ uid: "u1", title: "Unclassified item", subject: "Whatever" }];
    const { reviewEvents } = buildDeferredCalendarReviewQueue([], sub, newEvents, {});
    assert.equal(reviewEvents[0].kind, "assignment");
    assert.equal(reviewEvents[0].subjectGuess, "Other");
  });

  test("a Canvas-token subscription falls back to the item's own real course name, not the generic 'Other' -- matches connectCanvasToken's own fallback", () => {
    const { buildDeferredCalendarReviewQueue } = loadStudlinModule({});
    const sub = { id: "canvas-token", url: null, label: "Canvas", sourceType: "Canvas", viaToken: true };
    const newEvents = [{ uid: "u1", title: "Unclassified item", subject: "Organic Chemistry" }];
    const { reviewEvents } = buildDeferredCalendarReviewQueue([], sub, newEvents, {});
    assert.equal(reviewEvents[0].subjectGuess, "Organic Chemistry");
  });

  test("re-queuing the same source replaces its earlier unreviewed entry instead of stacking a second one -- a student who ignores this for a few days shouldn't see duplicate queue entries", () => {
    const { buildDeferredCalendarReviewQueue } = loadStudlinModule({});
    const sub = { id: "sub-1", url: "u", label: "Canvas", sourceType: "Canvas", viaToken: false };
    const first = buildDeferredCalendarReviewQueue([], sub, [{ uid: "u1", title: "First day's item" }], {});
    const second = buildDeferredCalendarReviewQueue(first.queue, sub, [{ uid: "u1", title: "First day's item" }, { uid: "u2", title: "Second day's new item" }], {});
    assert.equal(second.queue.length, 1, "still exactly one queued entry for this source, not two");
    assert.equal(second.queue[0].reviewPayload.events.length, 2, "the newer, superset fetch replaces the stale one");
  });

  test("queuing for one source never disturbs an unrelated queued entry (e.g. an onboarding wizard hint already waiting)", () => {
    const { buildDeferredCalendarReviewQueue } = loadStudlinModule({});
    const existingQueue = [{ hint: "canvas" }, true];
    const sub = { id: "sub-1", url: "u", label: "Schoology", sourceType: "Schoology", viaToken: false };
    const { queue } = buildDeferredCalendarReviewQueue(existingQueue, sub, [{ uid: "u1", title: "x" }], {});
    assert.equal(queue.length, 3);
    assert.equal(queue[0].hint, "canvas");
    assert.equal(queue[1], true);
    assert.equal(queue[2].reviewPayload.subId, "sub-1");
  });

  test("a second, different source queues its own separate entry alongside the first", () => {
    const { buildDeferredCalendarReviewQueue } = loadStudlinModule({});
    const subA = { id: "sub-a", url: "a", label: "Canvas", sourceType: "Canvas", viaToken: false };
    const subB = { id: "sub-b", url: "b", label: "Schoology", sourceType: "Schoology", viaToken: false };
    const first = buildDeferredCalendarReviewQueue([], subA, [{ uid: "u1", title: "x" }], {});
    const second = buildDeferredCalendarReviewQueue(first.queue, subB, [{ uid: "u2", title: "y" }], {});
    assert.equal(second.queue.length, 2);
    const ids = second.queue.map(q => q.reviewPayload.subId);
    assert.equal(ids.includes("sub-a"), true);
    assert.equal(ids.includes("sub-b"), true);
  });

  test("zero new events still produces a valid (empty) review payload rather than throwing", () => {
    const { buildDeferredCalendarReviewQueue } = loadStudlinModule({});
    const sub = { id: "sub-1", url: "u", label: "Canvas", sourceType: "Canvas", viaToken: false };
    const { queue, reviewEvents } = buildDeferredCalendarReviewQueue([], sub, [], {});
    assert.equal(reviewEvents.length, 0);
    assert.equal(queue[0].reviewPayload.events.length, 0);
  });
});
