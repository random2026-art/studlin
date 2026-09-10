// User request, 2026-09-10 ("instead of looking indefinitely studlin
// looks in 1 or 2 months thats it"): the opt-in shared free/busy payload
// (computeBusyWindowsPayload, published to Firestore by publishBusyWindows)
// only ever covered BUSY_WINDOW_DAYS_AHEAD=21 days (3 weeks) -- scroll the
// Schedule with Friends calendar a few weeks out and a friend who'd shared
// everything still read as fully free there, since there was simply no
// published data that far out (not the same as genuinely free). Separately,
// confirmGsPeople's own "Found N windows that work" recommendation search
// only scanned lookAheadDayRange:7 (one week). Both bumped to 60 days
// (~2 months), the top of the explicitly-requested range, staying finite
// on purpose ("thats it" -- not unbounded).
//
// computeBusyWindowsPayload/BUSY_WINDOW_DAYS_AHEAD are real, pure,
// top-level code -- unit tested directly. The confirmGsPeople call site is
// component-closure UI, covered by a source-level regression guard, same
// mixed-coverage convention this session uses elsewhere. Run with `npm test`.
const { test, describe } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const path = require("path");
const { loadStudlinModule } = require("./harness.js");

const SOURCE = fs.readFileSync(path.join(__dirname, "..", "studlin-app.jsx"), "utf8");

const DEFAULT_PREFS = {
  workStartTime: "09:00", workEndTime: "18:00", bedtime: "23:00",
  taskDifficultyPreference: "NONE", bufferMarginStrategy: "15_MIN",
  weekendEnabled: true, weekendStartTime: "09:00", weekendEndTime: "18:00",
  peakHourBuckets: [],
};

describe("computeBusyWindowsPayload covers ~2 months ahead, not 3 weeks", () => {
  test("BUSY_WINDOW_DAYS_AHEAD is 60", () => {
    const { BUSY_WINDOW_DAYS_AHEAD } = loadStudlinModule({ now: "2026-09-10T09:00:00" });
    assert.equal(BUSY_WINDOW_DAYS_AHEAD, 60);
  });

  test("an event 45 days out (past the old 21-day range, inside the new 60-day one) is included in the published payload", () => {
    const { computeBusyWindowsPayload, dayKey } = loadStudlinModule({ now: "2026-09-10T09:00:00" });
    const farDate = "2026-10-25"; // 45 days after 2026-09-10
    const events = [{ id: "far", date: farDate, time: "14:00", duration: 60, status: "pending" }];
    const payload = computeBusyWindowsPayload(events, [], DEFAULT_PREFS, "2026-09-10");
    assert.ok(payload.some(iv => iv.date === farDate), "an event 45 days out must appear in the published busy-window payload");
  });

  test("an event 90 days out (past even the new 60-day range) is correctly excluded, staying finite on purpose", () => {
    const { computeBusyWindowsPayload } = loadStudlinModule({ now: "2026-09-10T09:00:00" });
    const tooFarDate = "2026-12-09"; // 90 days after 2026-09-10
    const events = [{ id: "toofar", date: tooFarDate, time: "14:00", duration: 60, status: "pending" }];
    const payload = computeBusyWindowsPayload(events, [], DEFAULT_PREFS, "2026-09-10");
    assert.ok(!payload.some(iv => iv.date === tooFarDate), "the range must stay bounded, not become unbounded/indefinite again");
  });
});

describe("Schedule with Friends' own recommendation search matches the same ~2-month range", () => {
  test("confirmGsPeople's findSharedStudyWindow call uses lookAheadDayRange:60, not the old 7", () => {
    const idx = SOURCE.indexOf("const rec=await findSharedStudyWindow(myUid,gsSelected,");
    assert.notEqual(idx, -1);
    const line = SOURCE.slice(idx, idx + 200);
    assert.match(line, /lookAheadDayRange:60/);
  });
});
