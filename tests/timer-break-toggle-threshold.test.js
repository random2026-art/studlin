// Regression test for a 2026-08-28 fix requested directly by the user:
// TaskTimerModal's "Add Break Time" toggle on the pre-start setup screen
// used to render (and default on) for ANY session of 15+ minutes -- a
// plain 20 or 30-minute focus block offered a mid-session break that
// never really made sense for something that short. Now the whole
// section (toggle, draggable timeline, duration editor) only appears for
// sessions genuinely over an hour, and defaults off below that threshold
// too, so a short session can never silently pick one up.
//
// TaskTimerModal is a component closure (JSX rendering, useState hooks) --
// source-level regression guards, same established precedent as every
// other component-closure fix this session. Run with `npm test`.
const { test, describe } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const path = require("path");

const SOURCE = fs.readFileSync(path.join(__dirname, "..", "studlin-app.jsx"), "utf8");

describe("TaskTimerModal: break toggle only exists for sessions over an hour", () => {
  test("breakOn defaults to off unless the session is genuinely over 60 minutes", () => {
    assert.match(SOURCE, /const \[breakOn,setBreakOn\]=useState\(totalMins>60\);/);
  });

  test("the old, looser 15-minute threshold is gone", () => {
    assert.doesNotMatch(SOURCE, /useState\(totalMins>=15\)/);
  });

  test("the entire 'Add Break Time' section (toggle, timeline, duration editor) is gated behind the same >60min check, not just the default state", () => {
    assert.match(SOURCE, /\{totalMins>60&&\(\s*<div style=\{\{marginBottom:24,textAlign:"left"\}\}>/, "the whole section must be conditionally rendered, not just defaulted off, so a short session never even sees the option");
  });

  test("the section still closes its own conditional block before the Lock in button, so a short session's setup screen isn't left with a dangling/broken render", () => {
    assert.match(SOURCE, /\)\}\s*<Btn onClick=\{startLockIn\}/);
  });
});
