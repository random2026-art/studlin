// Regression test for a 2026-09-08 user report: "when i try to reschedule
// with friends why is it taking forever" -- confirmed via screenshot to be
// a "Schedule with Friends" modal stuck permanently on "Loading your
// friends…", not merely slow.
//
// Root cause: openGroupSchedule (CalendarTab) awaited
// getAcceptedFriendUids + a Promise.all of profile reads with NO
// try/catch. Any failure (offline, a transient hiccup, anything) threw
// out of the async function before setGsLoading(false) ever ran --
// setGsOpen(true) already ran synchronously first, so the modal was stuck
// open on its loading state forever, with no error shown and no retry.
// publishBusyWindows (a different caller of the same
// getAcceptedFriendUids) already wraps its whole body in try/catch and
// degrades silently -- openGroupSchedule needed the equivalent, just
// surfaced to the student instead of silent, since this IS the primary
// action they're waiting on.
//
// CalendarTab is a component closure, so this is a source-level
// regression guard, same established precedent as every other
// component-closure fix this session. Run with `npm test`.
const { test, describe } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const path = require("path");

const SOURCE = fs.readFileSync(path.join(__dirname, "..", "studlin-app.jsx"), "utf8");

describe("CalendarTab: openGroupSchedule never leaves 'Loading your friends…' stuck forever on failure", () => {
  test("the friend/profile fetch is wrapped in try/catch, and setGsLoading(false) runs even on failure", () => {
    const idx = SOURCE.indexOf("const openGroupSchedule=async()=>{");
    assert.notEqual(idx, -1, "openGroupSchedule must exist");
    const body = SOURCE.slice(idx, idx + 1200);
    assert.match(body, /try\{/, "the awaited Firestore calls must be inside a try block");
    assert.match(body, /\}catch\(e\)\{/, "a failure must be caught, not left as an unhandled rejection");
    // setGsLoading(false) must run unconditionally (outside/after the
    // try/catch), not only on the success path inside try.
    const catchIdx = body.indexOf("}catch(e){");
    const afterCatch = body.slice(catchIdx);
    assert.match(afterCatch, /setGsLoading\(false\)/, "setGsLoading(false) must still run after a caught failure, not just on success");
  });

  test("a failure sets a real error flag the render can react to", () => {
    const idx = SOURCE.indexOf("const openGroupSchedule=async()=>{");
    const body = SOURCE.slice(idx, idx + 1200);
    assert.match(body, /setGsLoadError\(true\)/, "a caught failure must set a visible error state, not fail silently like publishBusyWindows does");
  });

  test("the pick-friends modal renders a real error state with a retry action, not just an infinite spinner", () => {
    const idx = SOURCE.indexOf('title="Schedule with Friends"');
    assert.notEqual(idx, -1, "the Schedule with Friends modal must exist");
    const body = SOURCE.slice(idx, idx + 1200);
    assert.match(body, /gsLoadError\?/, "the render must branch on the error state");
    assert.match(body, /Try again/, "the error state must offer a way to retry, not dead-end the student");
  });
});
