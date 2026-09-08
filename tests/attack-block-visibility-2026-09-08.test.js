// Part A of the approved 2026-09-08 plan ("Attack Block Transparency,
// Collaborator Search, and Phase-Level Work Tracking"): Assignments have
// the Attack Block on/off toggle, but nothing showed WHEN/WHAT TIME the
// probe landed, and the "done" screen after finishing a probe only ever
// summarized a multi-session follow-up as "starting X" -- every session
// after the first was invisible unless the student went hunting on the
// calendar, even though scheduleAttackBlockFollowUp (its own 90-min
// CHUNK/ramp-offset logic) already splits a long remaining estimate into
// several real sessions.
//
// A1: startAttackBlockWithChoice's finish() now shows a real toast with
// the actual scheduled date/time, reusing the same placementToast
// mechanism commitManualBlockDrop's own "Block added — 3:00–4:00 PM."
// already uses.
// A2: TaskTimerModal's "done" screen now lists every session in a
// multi-session follow-up, not just "starting X" -- each one is already
// a normal calendar event, so moving it around is the existing
// drag-and-drop, nothing new needed there.
//
// Both are component-closure changes, so these are source-level
// regression guards, same established precedent as every other
// component-closure fix this session. Run with `npm test`.
const { test, describe } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const path = require("path");

const SOURCE = fs.readFileSync(path.join(__dirname, "..", "studlin-app.jsx"), "utf8");

describe("A1: Attack Block save shows a real toast with when/what time it landed", () => {
  test("startAttackBlockWithChoice's finish() sets placementToast with a real date+time after committing", () => {
    const idx = SOURCE.indexOf("const startAttackBlockWithChoice=");
    assert.notEqual(idx, -1, "startAttackBlockWithChoice must exist");
    const body = SOURCE.slice(idx, idx + 1800);
    assert.match(body, /setPlacementToast\("Attack Block scheduled"\+dateLabel\+" — "\+fmtTimeRange\(pair\.task\.time,pair\.task\.duration\)\+"\."\);/,
      "must show a real toast naming the actual scheduled time, not just the silent highlight flash");
  });

  test("the date is only mentioned when the probe landed on a day other than today", () => {
    const idx = SOURCE.indexOf("const startAttackBlockWithChoice=");
    const body = SOURCE.slice(idx, idx + 1800);
    assert.match(body, /const dateLabel=pair\.task\.date===dayKey\(\)\?""\s*:/,
      "a same-day probe shouldn't redundantly state the date");
  });
});

describe("A2: the 'done' screen lists every session in a multi-session Attack Block follow-up", () => {
  test("more than one session renders a real per-session list, not just a 'starting X' summary", () => {
    const idx = SOURCE.indexOf("{attackPlacement&&(");
    assert.notEqual(idx, -1, "the attackPlacement summary block must exist");
    const body = SOURCE.slice(idx, idx + 2200);
    assert.match(body, /Rest of the plan -- \{attackPlacement\.sessions\.length\} sessions:/,
      "a multi-session follow-up must be introduced as a real plan, not a single vague summary line");
    assert.match(body, /attackPlacement\.sessions\.map\(\(s,i\)=>/,
      "every session must actually be enumerated, not just the first one referenced via sessions[0]");
  });

  test("a single-session follow-up still shows the simple 'Next session' line unchanged, not the new list treatment", () => {
    const idx = SOURCE.indexOf("{attackPlacement&&(");
    const body = SOURCE.slice(idx, idx + 900);
    assert.match(body, /attackPlacement\.sessions\.length===1\s*\?"Next session: "/,
      "a single real session doesn't need list treatment -- one line is already the full plan");
  });

  test("the 'couldn't fit everything' honesty note still survives for a partial placement", () => {
    const idx = SOURCE.indexOf("{attackPlacement&&(");
    const body = SOURCE.slice(idx, idx + 2400);
    assert.match(body, /!attackPlacement\.allPlaced&&<div[^>]*>Couldn't fit all of it before the deadline\.<\/div>/);
  });
});
