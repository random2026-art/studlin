// Regression test for a 2026-08-28 fix requested directly by the user,
// with a screenshot: hitting Begin on "ENG10 work" and running longer
// than its scheduled block should have pushed whatever was scheduled
// right after it, but didn't -- the next task just sat there overlapping
// on the calendar.
//
// Studlin already retimes a completed task's own `duration` to the real
// elapsed session time (2026-08-26, see TaskTimerModal's onComplete) --
// that part was already working. What was missing: nothing checked
// whether that longer, real duration now runs into the next thing
// scheduled the same day. This adds exactly that -- a simple push of just
// the one following item later by the overlap amount (not a full
// re-layout, matching what was actually asked for: "the reschedule would
// only move the next task a bit lower"). A fixed/pinned item (a class, an
// exam, anything explicitly locked) is never auto-moved -- same reasoning
// "Can I go?"'s fixedConflicts already established -- Studlin surfaces
// the collision instead and lets the student know.
//
// This lives inside TaskTimerModal's onComplete handler, a component
// closure (App-level JSX, not a top-level exported function) -- source-
// level regression guards, same established precedent as every other
// component-closure fix this session. Run with `npm test`.
const { test, describe } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const path = require("path");

const SOURCE = fs.readFileSync(path.join(__dirname, "..", "studlin-app.jsx"), "utf8");

describe("A session that ran long pushes the next same-day item, not just its own duration", () => {
  test("computes the real end time from the task's own (already-retimed) start plus actual elapsed minutes", () => {
    assert.match(SOURCE, /const completedEndMins=timeToMinutes\(timerTask\.time\)\+mins;/);
  });

  test("finds the very next same-day pending, timed item at or after the original start -- a free period never counts as something to push", () => {
    assert.match(SOURCE, /ev\.date===timerTask\.date&&ev\.time&&!ev\.timeUnconfirmed&&ev\.status==="pending"&&ev\.kind!=="free period"&&timeToMinutes\(ev\.time\)>=timeToMinutes\(timerTask\.time\)/);
  });

  test("only acts when the real end genuinely runs past that item's start -- never touches anything that still fits fine", () => {
    assert.match(SOURCE, /if\(nextEvent&&completedEndMins>timeToMinutes\(nextEvent\.time\)\)\{/);
  });

  test("a fixed or explicitly-pinned item is never auto-moved -- only surfaced as a heads-up toast", () => {
    const idx = SOURCE.indexOf("if(nextEvent&&completedEndMins>timeToMinutes(nextEvent.time)){");
    const body = SOURCE.slice(idx, idx + 700);
    assert.match(body, /if\(TIER0_FIXED_KINDS\.has\(nextEvent\.kind\)\|\|nextEvent\.userPinned\)\{/);
    assert.match(body, /heads up, that now overlaps/);
  });

  test("a genuinely movable item is actually retimed to start right when the overrun session really ended", () => {
    const idx = SOURCE.indexOf("if(nextEvent&&completedEndMins>timeToMinutes(nextEvent.time)){");
    const body = SOURCE.slice(idx, idx + 700);
    assert.match(body, /next=next\.map\(ev=>ev\.id===nextEvent\.id\?\{\.\.\.ev,time:minutesToTime\(completedEndMins\)\}:ev\);/);
  });

  test("the push happens before the final lsSet, so both the duration fix and the downstream push land in the same write", () => {
    const durIdx = SOURCE.indexOf('let next=lsGet("events",[]).map(ev=>ev.id===timerTask.id?{...ev,status:"done",timeSpent:mins,duration:mins,completedAt:Date.now()}:ev);');
    const setIdx = SOURCE.indexOf('lsSet("events",next);', durIdx);
    const pushIdx = SOURCE.indexOf('const completedEndMins=timeToMinutes(timerTask.time)+mins;', durIdx);
    assert.ok(durIdx > -1 && pushIdx > -1 && setIdx > -1, "all three anchors must exist");
    assert.ok(durIdx < pushIdx && pushIdx < setIdx, "the overrun-push logic must run between the duration fix and the actual persist");
  });
});
