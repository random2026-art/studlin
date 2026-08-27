// Regression tests for two 2026-08-27 Brain Dump fixes, both requested
// directly by the user:
//
// 1. "Back" on the Review screen -- there was previously no way to return
//    to the original typed prompt once Studlin had parsed it; a
//    structurally wrong read (the AI split things up wrong, or missed
//    something) meant either hand-editing many separate fields or
//    cancelling and retyping the whole thing from scratch.
// 2. Vacation/break awareness -- "I'm going on vacation, don't schedule
//    anything" had no representation at all in Brain Dump's extraction
//    schema; the closest existing kind ("event") would have wrongly
//    turned a whole unavailable PERIOD into a single point-in-time
//    calendar item Studlin would still schedule around, not avoid.
//
// Both fixes live inside CalendarTab's component closures (parseBrainDump,
// submitBrainDump, commitBrainDump are not exported top-level functions),
// so these are source-level regression guards against the exact literals
// changed -- same established precedent as friend-profile-pic-sync.test.js
// and friend-request-notification-badge.test.js for this class of logic.
// computeHolidayPlan/getHolidays/saveHolidays/isHoliday themselves are
// pre-existing, already-tested pure functions this fix reuses unchanged --
// no new pure logic was introduced for the vacation half beyond wiring.
const { test, describe } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const path = require("path");

const SOURCE = fs.readFileSync(path.join(__dirname, "..", "studlin-app.jsx"), "utf8");

describe("Brain Dump Review: Back button (source-level regression guards)", () => {
  test("submitBrainDump no longer clears brainDumpText the moment parsing succeeds", () => {
    assert.doesNotMatch(SOURCE, /const \{items,error\}=await parseBrainDump\(brainDumpText\);[\s\S]{0,400}setBrainDumpText\(""\);/,
      "the original prompt must still be sitting in brainDumpText when the Review screen is showing, or Back has nothing to restore");
  });

  test("the Review modal's footer has a Back button that reopens the text entry modal without wiping the prompt", () => {
    assert.match(SOURCE, /<Btn variant="subtle" onClick=\{\(\)=>\{setBrainDumpReview\(null\);setBrainDumpOpen\(true\);\}\}>← Back<\/Btn>/,
      "Back must reopen brainDumpOpen WITHOUT calling setBrainDumpText(\"\") -- that's what makes the original wording still be there to edit");
  });

  test("Review's own Cancel and the final commit both clear brainDumpText for real, so a genuinely finished session starts blank next time", () => {
    const cancelClears = /onClick=\{\(\)=>\{setBrainDumpReview\(null\);setBrainDumpText\(""\);\}\}>Cancel<\/Btn>/.test(SOURCE);
    const commitClears = /commitBrainDump\(expandBrainDumpReviewItems\(included\)\);\s*setBrainDumpReview\(null\);\s*setBrainDumpText\(""\);/.test(SOURCE);
    assert.ok(cancelClears, "Review's Cancel must still fully discard the prompt, not leave it lingering for next time");
    assert.ok(commitClears, "the real Add-to-plan commit must also clear the now-consumed prompt");
  });
});

describe("Brain Dump: vacation/break awareness (source-level regression guards)", () => {
  test("parseBrainDump's extraction prompt describes a new \"unavailable\" kind for vacations/trips/being sick", () => {
    assert.match(SOURCE, /\\"unavailable\\" — the student describes a whole period where they will NOT be doing any schoolwork at all/,
      "without this, the AI has no category for \"I'm on vacation, don't schedule anything\" and will misclassify it as some other kind");
  });

  test("the prompt asks for an endDate field specific to the unavailable kind", () => {
    assert.match(SOURCE, /\\"endDate\\" \(YYYY-MM-DD, ONLY for kind:\\"unavailable\\"/,
      "a vacation is a RANGE, not a single date -- without a real end date field the range collapses to one day");
  });

  test("submitBrainDump accepts \"unavailable\" as a valid kind instead of silently downgrading it to a plain to-do", () => {
    assert.match(SOURCE, /const validKinds=\["study","todo","event","exam","project","reminder","unavailable"\];/);
  });

  test("submitBrainDump's item mapping carries endDate through into the review item, defaulting to dueDate for a single-day break", () => {
    assert.match(SOURCE, /endDate:it\.endDate\|\|it\.dueDate\|\|""/);
  });

  test("the Review screen's kind selector includes Vacation/Break as a choice, so a misclassified item can be corrected by hand", () => {
    assert.match(SOURCE, /\{value:"unavailable",label:"Vacation\/Break"\}/);
  });

  test("commitBrainDump routes unavailable items to saveHolidays instead of planBrainDumpTasks -- a break is not a task", () => {
    assert.match(SOURCE, /const unavailableItems=items\.filter\(it=>it\.kind==="unavailable"\);/);
    assert.match(SOURCE, /const taskItems=items\.filter\(it=>it\.kind!=="unavailable"\);/);
    assert.match(SOURCE, /saveHolidays\(\[\.\.\.getHolidays\(\),\.\.\.newHolidays\]\);/);
  });

  test("commitBrainDump reuses computeHolidayPlan + the existing pausePreview/pauseOpen reschedule-preview surface, not a second parallel UI", () => {
    assert.match(SOURCE, /const plans=newHolidays\.map\(h=>computeHolidayPlan\(h\.start,h\.end,h\.label\)\);/,
      "without this, anything already scheduled during the new break would just silently stay there instead of getting the same relocate-and-review offer a manually-added Settings holiday already gives");
  });

  test("only taskItems (not the full items array) get passed to planBrainDumpTasks, so a vacation entry can never accidentally become a schedulable task", () => {
    assert.match(SOURCE, /planBrainDumpTasks\(taskItems,events,routines,prefs\)/);
  });
});
