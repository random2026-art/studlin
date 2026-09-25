// Real screenshot bug report, 2026-09-15: a student pasted specific
// date+time options for an outside meeting/interview and asked which fit
// their schedule. Studlin AI had no concept for this at all -- none of its
// known action intents cover "check these candidate windows against my
// calendar" -- so the classifier was forced into the closest-sounding one
// and wrongly proposed changing the student's declared peak focus hours.
//
// This adds the real capability behind that gap: classifyStudlinAiMessage
// can now return kind:"availability_match" with extracted date/time
// candidates + a duration, resolveAvailabilityMatch checks each against the
// real calendar (reusing checkManualStudyTime's own getDayOccupiedIntervals
// conflict data), and answerAvailabilityMatch (StudlinAiDrawer) replies with
// which are free/busy and why. Deliberately answer-only for this pass -- it
// never creates anything itself; a natural follow-up ("add the 22nd one,
// it's an interview") is an ordinary create_task message already handled by
// existing, unrelated code, so that half needs no new tests here.
//
// classifyStudlinAiMessage itself is a real /api/chat call and isn't
// exercised here -- same precedent every other Studlin AI intent's tests
// already follow (this repo has no fetch-mocking pattern). Its prompt/schema
// changes are covered by source-level regression guards instead.
// findFreeSlotInWindow/resolveAvailabilityMatch ARE pure, exported
// functions, so the real matching logic is tested directly with real
// invocations. answerAvailabilityMatch is component-closure code (not
// exported), covered by source-level guards only, same established
// precedent as tests/studlin-ai-multi-action-2026-09-10.test.js. Run with
// `npm test`.
const { test, describe } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const path = require("path");
const { loadStudlinModule } = require("./harness.js");

const APP_SOURCE = fs.readFileSync(path.join(__dirname, "..", "studlin-app.jsx"), "utf8");

describe("classifyStudlinAiMessage's prompt now supports availability_match (source-level regression guards)", () => {
  test("the JSON envelope's kind enum includes availability_match, and gained matchCandidates/matchDurationMin fields", () => {
    // 2026-09-25: app_help was added between coaching and action (see
    // tests/studlin-ai-app-help-2026-09-25.test.js) -- updated to match,
    // availability_match's own presence is still what this test pins.
    assert.ok(APP_SOURCE.includes(String.raw`\"kind\":\"question\"|\"coaching\"|\"app_help\"|\"action\"|\"multi_action\"|\"availability_match\"|\"unsupported\"`));
    assert.ok(APP_SOURCE.includes(String.raw`\"matchCandidates\":<for kind \"availability_match\" ONLY, an array of 1-8 objects`));
    assert.ok(APP_SOURCE.includes(String.raw`\"matchDurationMin\":<for kind \"availability_match\" ONLY, integer minutes`));
  });

  test("set_peak_hours has its own explicit guard against this exact misfire -- never fires just because a message mentions clock times", () => {
    assert.ok(APP_SOURCE.includes("Never force this intent onto a message just because it mentions several clock times or a time of day"));
  });

  test("a missing/non-impliable duration falls back to unsupported+clarify instead of guessing one", () => {
    assert.ok(APP_SOURCE.includes(String.raw`if it's genuinely not stated or impliable, set kind to \"unsupported\" instead with clarify asking how long it needs to be`));
  });

  test("the worked example matches the exact user-reported scenario, now correctly extracted once a duration is stated", () => {
    assert.ok(APP_SOURCE.includes(String.raw`\"kind\":\"availability_match\"`));
    assert.ok(APP_SOURCE.includes(String.raw`\"matchDurationMin\":30}`));
  });
});

describe("classifyStudlinAiMessage's validation gate accepts availability_match (regression guard -- this exact class of bug, a new kind missing from the allowed-kind array, already silently bit multi_action once)", () => {
  test("the allowed-kind array includes availability_match", () => {
    assert.match(APP_SOURCE, /\["question","coaching","action","multi_action","availability_match","unsupported"\]\.includes\(parsed\.kind\)/);
  });

  test("a malformed candidate list or missing/invalid duration is rejected before it can reach resolveAvailabilityMatch", () => {
    assert.match(APP_SOURCE, /if\(candidates\.length<1\|\|candidates\.length>8\|\|!candidates\.every\(validCandidate\)\)throw new Error\("bad-match-candidates"\);/);
    assert.match(APP_SOURCE, /if\(!\(Number\.isInteger\(parsed\.matchDurationMin\)&&parsed\.matchDurationMin>0\)\)throw new Error\("bad-match-duration"\);/);
  });
});

describe("answerAvailabilityMatch (source-level regression guards -- component closure)", () => {
  test("send() routes kind:availability_match to answerAvailabilityMatch, distinct from every other path", () => {
    assert.match(APP_SOURCE, /else if\(parsed\.kind==="availability_match"\)await answerAvailabilityMatch\(parsed\);/);
  });

  test("gated the same as askQuestion (Pro, read-only Q&A usage bucket) -- never the action/paywall gate", () => {
    const start = APP_SOURCE.indexOf("const answerAvailabilityMatch=async(parsed)=>{");
    assert.notEqual(start, -1);
    const block = APP_SOURCE.slice(start, start + 700);
    assert.match(block, /if\(!canUseStudlinAiQna\(\)\)\{/);
    assert.match(block, /recordStudlinAiQnaUsage\(\);/);
  });
});

describe("findFreeSlotInWindow (real invocations)", () => {
  test("an empty calendar returns the window's own start time as free", () => {
    const m = loadStudlinModule({ now: "2026-09-15T08:00:00" });
    const r = m.findFreeSlotInWindow("2026-09-24", 13 * 60, 15 * 60 + 30, 30);
    assert.equal(r.time, "13:00");
    assert.equal(r.conflicts.length, 0);
  });

  test("a window fully covered by one long event returns null with the real conflict named", () => {
    const m = loadStudlinModule({ now: "2026-09-15T08:00:00" });
    const events = [{ id: "e1", title: "Group project meeting", date: "2026-09-24", time: "12:30", duration: 240, kind: "event", status: "pending" }];
    m.lsSet("events", events);
    const r = m.findFreeSlotInWindow("2026-09-24", 13 * 60, 15 * 60 + 30, 30);
    assert.equal(r.time, null);
    assert.ok(r.conflicts.some((c) => c.title === "Group project meeting"));
  });

  test("finds the real gap after an event that only covers the first part of the window", () => {
    const m = loadStudlinModule({ now: "2026-09-15T08:00:00" });
    const events = [{ id: "e1", title: "Quick call", date: "2026-09-24", time: "13:00", duration: 30, kind: "event", status: "pending" }];
    m.lsSet("events", events);
    const r = m.findFreeSlotInWindow("2026-09-24", 13 * 60, 15 * 60 + 30, 30);
    assert.notEqual(r.time, null);
    assert.equal(r.conflicts.length, 0);
  });
});

describe("resolveAvailabilityMatch (real invocations)", () => {
  test("a single free point candidate ends up in free[], not busy[]", () => {
    const m = loadStudlinModule({ now: "2026-09-15T08:00:00" });
    const { free, busy } = m.resolveAvailabilityMatch([{ date: "2026-09-22", startTime: "13:30", endTime: null }], 30);
    assert.equal(free.length, 1);
    assert.equal(busy.length, 0);
    assert.equal(free[0].timeLabel, "1:30 PM");
  });

  test("a single busy point candidate names the real conflicting event", () => {
    const m = loadStudlinModule({ now: "2026-09-15T08:00:00" });
    const events = [{ id: "e1", title: "Chem Lab", date: "2026-09-23", time: "08:30", duration: 60, kind: "event", status: "pending" }];
    m.lsSet("events", events);
    const { free, busy } = m.resolveAvailabilityMatch([{ date: "2026-09-23", startTime: "08:30", endTime: null }], 30);
    assert.equal(free.length, 0);
    assert.equal(busy.length, 1);
    assert.ok(busy[0].conflicts.some((c) => c.title === "Chem Lab"));
  });

  test("a window candidate with real room inside it ends up free, at the found instant (not the window's own start blindly)", () => {
    const m = loadStudlinModule({ now: "2026-09-15T08:00:00" });
    const { free, busy } = m.resolveAvailabilityMatch([{ date: "2026-09-24", startTime: "13:00", endTime: "15:30" }], 30);
    assert.equal(busy.length, 0);
    assert.equal(free.length, 1);
    assert.equal(free[0].isWindow, true);
  });

  test("a window candidate fully booked end to end is reported as the whole range, not a single misleading instant", () => {
    const m = loadStudlinModule({ now: "2026-09-15T08:00:00" });
    const events = [{ id: "e1", title: "All-day retreat", date: "2026-09-24", time: "12:00", duration: 300, kind: "event", status: "pending" }];
    m.lsSet("events", events);
    const { free, busy } = m.resolveAvailabilityMatch([{ date: "2026-09-24", startTime: "13:00", endTime: "15:30" }], 30);
    assert.equal(free.length, 0);
    assert.equal(busy.length, 1);
    assert.equal(busy[0].isWindow, true);
    assert.equal(busy[0].windowLabel, "1:00 PM–3:30 PM");
  });

  test("multiple candidates come back sorted chronologically within each of free/busy, matching the real reported scenario's shape", () => {
    const m = loadStudlinModule({ now: "2026-09-15T08:00:00" });
    const events = [{ id: "e1", title: "Chem Lab", date: "2026-09-23", time: "08:30", duration: 60, kind: "event", status: "pending" }];
    m.lsSet("events", events);
    const { free, busy } = m.resolveAvailabilityMatch(
      [
        { date: "2026-09-23", startTime: "08:30", endTime: null },
        { date: "2026-09-22", startTime: "13:30", endTime: null },
        // Well clear of Chem Lab's 08:30-09:30 real span plus its
        // trailing breathing-room buffer, so this is unambiguously free
        // regardless of the exact buffer size (see effectiveTrailOut).
        { date: "2026-09-23", startTime: "10:30", endTime: null },
      ],
      30
    );
    assert.equal(busy.length, 1);
    assert.equal(busy[0].date, "2026-09-23");
    assert.equal(busy[0].time, "08:30");
    assert.equal(free.length, 2);
    assert.equal(free[0].date, "2026-09-22");
    assert.equal(free[1].date, "2026-09-23");
    assert.equal(free[1].time, "10:30");
  });
});
