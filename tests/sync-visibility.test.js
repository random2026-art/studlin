// Two "silent surprise" fixes, both from a 2026-09-06 user report:
// - Google Calendar's background sync landed real data with zero
//   announcement anywhere, ever, even on a fully successful pull.
// - Canvas/Schoology/Moodle's own once-a-day auto-resync already defers
//   new academic items to a review screen instead of merging them
//   unreviewed, but the only announcement of that (a toast) only fired
//   if the student happened to already be sitting in Settings at the
//   exact moment the daily check ran.
// These pure helpers back a real, always-visible banner/toast for both
// (see App()'s own sync-check effects). Run with `npm test`.
const { test, describe } = require("node:test");
const assert = require("node:assert/strict");
const { loadStudlinModule } = require("./harness.js");

describe("diffNewGoogleEvents", () => {
  test("an event whose id was never seen before counts as new", () => {
    const m = loadStudlinModule();
    const previous = [{ id: "gcal-1", title: "Old meeting" }];
    const fresh = [{ id: "gcal-1", title: "Old meeting" }, { id: "gcal-2", title: "New appointment" }];
    const result = m.diffNewGoogleEvents(previous, fresh);
    assert.equal(result.length, 1);
    assert.equal(result[0].id, "gcal-2");
  });

  test("a re-fetch of something already known produces no new items", () => {
    const m = loadStudlinModule();
    const previous = [{ id: "gcal-1", title: "Old meeting" }];
    const fresh = [{ id: "gcal-1", title: "Old meeting" }];
    assert.equal(m.diffNewGoogleEvents(previous, fresh).length, 0);
  });

  test("an empty previous set means every fresh event counts as new (first-ever connect)", () => {
    const m = loadStudlinModule();
    const fresh = [{ id: "gcal-1", title: "A" }, { id: "gcal-2", title: "B" }];
    assert.equal(m.diffNewGoogleEvents([], fresh).length, 2);
  });

  test("an empty fresh batch never throws, returns empty", () => {
    const m = loadStudlinModule();
    assert.equal(m.diffNewGoogleEvents([{ id: "gcal-1" }], []).length, 0);
  });

  test("missing arguments (undefined) never throw", () => {
    const m = loadStudlinModule();
    assert.equal(m.diffNewGoogleEvents(undefined, undefined).length, 0);
  });
});

describe("describeNewGoogleEvents", () => {
  test("nothing new -> empty string, no toast shown", () => {
    const m = loadStudlinModule();
    assert.equal(m.describeNewGoogleEvents([]), "");
    assert.equal(m.describeNewGoogleEvents(null), "");
  });

  test("one new event names it directly, singular wording", () => {
    const m = loadStudlinModule();
    const text = m.describeNewGoogleEvents([{ id: "gcal-1", title: "Dentist appointment" }]);
    assert.ok(text.includes("Dentist appointment"));
    assert.ok(text.includes("1 event"));
    assert.ok(!text.includes("1 events"));
  });

  test("several new events are all named, plural wording", () => {
    const m = loadStudlinModule();
    const text = m.describeNewGoogleEvents([{ id: "gcal-1", title: "A" }, { id: "gcal-2", title: "B" }]);
    assert.ok(text.includes("2 events"));
    assert.ok(text.includes("A"));
    assert.ok(text.includes("B"));
  });

  test("more than 3 new events truncates the list with a real remaining count, never fabricating titles", () => {
    const m = loadStudlinModule();
    const events = [1, 2, 3, 4, 5].map(n => ({ id: "gcal-" + n, title: "Event " + n }));
    const text = m.describeNewGoogleEvents(events);
    assert.ok(text.includes("Event 1"));
    assert.ok(text.includes("Event 2"));
    assert.ok(text.includes("Event 3"));
    assert.ok(!text.includes("Event 4"));
    assert.ok(text.includes("+2 more"));
  });
});

describe("summarizeImportReviewQueue", () => {
  test("an empty queue -> null, no banner shown", () => {
    const m = loadStudlinModule();
    assert.equal(m.summarizeImportReviewQueue([]), null);
    assert.equal(m.summarizeImportReviewQueue(null), null);
  });

  test("the onboarding wizard's plain queued hints (true, or {hint}) are ignored -- nothing to review yet", () => {
    const m = loadStudlinModule();
    assert.equal(m.summarizeImportReviewQueue([true, { hint: "canvas" }]), null);
  });

  test("a real review payload with events produces an honest count and label", () => {
    const m = loadStudlinModule();
    const queue = [{ reviewPayload: { subId: "s1", label: "Canvas", events: [{ title: "HW1" }, { title: "HW2" }] } }];
    const result = m.summarizeImportReviewQueue(queue);
    assert.equal(result.totalCount, 2);
    assert.equal(result.sourceCount, 1);
    assert.deepEqual(result.labels, ["Canvas"]);
  });

  test("a review payload with an empty events array is skipped (nothing actually pending)", () => {
    const m = loadStudlinModule();
    const queue = [{ reviewPayload: { subId: "s1", label: "Canvas", events: [] } }];
    assert.equal(m.summarizeImportReviewQueue(queue), null);
  });

  test("multiple sources sum their counts and list every label", () => {
    const m = loadStudlinModule();
    const queue = [
      { reviewPayload: { subId: "s1", label: "Canvas", events: [{ title: "HW1" }] } },
      { reviewPayload: { subId: "s2", label: "Course Site", events: [{ title: "Quiz 1" }, { title: "Quiz 2" }] } },
    ];
    const result = m.summarizeImportReviewQueue(queue);
    assert.equal(result.totalCount, 3);
    assert.equal(result.sourceCount, 2);
    assert.deepEqual(result.labels, ["Canvas", "Course Site"]);
  });

  test("a mix of a real payload and a plain onboarding hint only counts the real one", () => {
    const m = loadStudlinModule();
    const queue = [true, { reviewPayload: { subId: "s1", label: "Schoology", events: [{ title: "Essay" }] } }];
    const result = m.summarizeImportReviewQueue(queue);
    assert.equal(result.totalCount, 1);
    assert.equal(result.sourceCount, 1);
  });
});

describe("shouldShowImportReviewNudge / dismissImportReviewNudge", () => {
  test("never dismissed before -> shows immediately", () => {
    const m = loadStudlinModule();
    assert.equal(m.shouldShowImportReviewNudge(), true);
  });

  test("dismissing suppresses it for the cooldown window", () => {
    const m = loadStudlinModule();
    m.dismissImportReviewNudge();
    assert.equal(m.shouldShowImportReviewNudge(), false);
  });

  test("the cooldown is real, finite time, not a permanent silence", () => {
    const m = loadStudlinModule();
    assert.ok(m.IMPORT_REVIEW_NUDGE_COOLDOWN_MS > 0);
    assert.ok(m.IMPORT_REVIEW_NUDGE_COOLDOWN_MS < 24 * 3600000, "shorter than a full day -- real pending work shouldn't go quiet for long");
  });
});
