// User request, 2026-09-09 ("please please please be careful" about a
// syllabus scan extracting extra false meeting times): investigation found
// the actual "same class re-scanned twice" duplicate case was already
// solved (newMeetingTimesForCourse/routineMeetingsOverlap, see their own
// comments -- a real prior bug report about OCR reading the same meeting
// slightly differently across scans). The real remaining gap was that
// neither extraction prompt ever told the AI to exclude office hours or
// optional review/help sessions from "meetingTimes" -- only one-off exam
// dates had an explicit carve-out (COLLEGE_SCHEDULE_JSON_CONTRACT). A
// syllabus that lists office hours with their own recurring day/time right
// near the real class schedule could plausibly get misread as a second
// legitimate meeting time, which the dedup logic would never catch (it's
// not a duplicate of the real lecture, it's a wholly separate, wrong block).
//
// Source-level guard on the prompt text itself -- there's no live AI call
// to test against here, just confirming the instruction is actually present
// in both contracts. Run with `npm test`.
const { test, describe } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const path = require("path");

const SOURCE = fs.readFileSync(path.join(__dirname, "..", "studlin-app.jsx"), "utf8");

describe("Syllabus/schedule extraction prompts explicitly exclude office hours and optional sessions from meetingTimes", () => {
  test("CLASS_SYLLABUS_JSON_CONTRACT (per-class syllabus scan) excludes them", () => {
    const idx = SOURCE.indexOf("const CLASS_SYLLABUS_JSON_CONTRACT=");
    assert.notEqual(idx, -1);
    const body = SOURCE.slice(idx, idx + 2000);
    assert.match(body, /Office hours, optional review\/help sessions, drop-in tutoring, or a TA's own separate hours are NEVER a meeting time/);
  });

  test("COLLEGE_SCHEDULE_JSON_CONTRACT (whole-schedule scan) excludes them too", () => {
    const idx = SOURCE.indexOf("const COLLEGE_SCHEDULE_JSON_CONTRACT=");
    assert.notEqual(idx, -1);
    const body = SOURCE.slice(idx, idx + 2600);
    assert.match(body, /Office hours, optional review\/help sessions, drop-in tutoring, or a TA's own separate hours are NEVER a meeting time/);
  });

  test("re-scanning an already-added class still only adds genuinely new meeting times (newMeetingTimesForCourse), unchanged by this prompt fix", () => {
    const idx = SOURCE.indexOf("function newMeetingTimesForCourse(");
    assert.notEqual(idx, -1);
    const body = SOURCE.slice(idx, idx + 400);
    assert.match(body, /routineMeetingsOverlap/);
  });
});
