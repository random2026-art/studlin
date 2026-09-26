// 2026-09-26 request: syllabus scan, whole-schedule scan and high school scan
// must be very accurate and the student must have the final say in everything.
// Model output is checked by plain code before it reaches the review screen,
// and the review screens let the student change, remove or add anything.
const { test, describe } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const path = require("path");
const { loadStudlinModule } = require("./harness.js");
const S = fs.readFileSync(path.join(__dirname, "..", "studlin-app.jsx"), "utf8");
const m = loadStudlinModule();
const yr = new Date().getFullYear();

describe("parseJsonReply", () => {
  test("plain JSON, and JSON wrapped in prose, both parse; no JSON still throws", () => {
    assert.equal(m.parseJsonReply('{"a":1}').a, 1);
    assert.equal(m.parseJsonReply('Here you go: {"a":2} hope that helps').a, 2);
    assert.throws(() => m.parseJsonReply("no json here"));
  });
});

describe("sanitizeMeetingTimes", () => {
  test("keeps valid entries, drops ones with no usable day or start time, dedupes, clamps duration", () => {
    const out = m.sanitizeMeetingTimes([
      { days: [0, 2, 4], startTime: "10:00", duration: 50 },
      { days: [0, 2, 4], startTime: "10:00", duration: 75 },
      { days: [1, 1, 3, 9, "x"], startTime: "13:30", duration: 5000 },
      { days: [1], startTime: "9am", duration: 50 },
      { days: [], startTime: "09:00" },
      { days: ["2"], startTime: "08:00" },
      null,
    ]);
    assert.equal(out.length, 3);
    assert.equal(out[0].days.join(), "0,2,4");
    assert.equal(out[1].days.join(), "1,3");
    assert.equal(out[1].duration, 480);
    assert.equal(out[2].days.join(), "2");
    assert.equal(out[2].duration, 50);
  });
  test("not an array -> empty", () => { assert.equal(m.sanitizeMeetingTimes(undefined).length, 0); });
});

describe("sanitizeHsPeriods", () => {
  test("drops unnamed and duplicate periods, blanks impossible times, flags missing days", () => {
    const out = m.sanitizeHsPeriods([
      { subjectName: "English IV", startTime: "08:00", endTime: "08:45", days: [0, 1, 2, 3, 4] },
      { subjectName: "English IV", startTime: "08:00", endTime: "08:45", days: [0, 1, 2, 3, 4] },
      { subjectName: "  ", startTime: "09:00", endTime: "09:45" },
      { subjectName: "Math", startTime: "10:30", endTime: "09:45", days: [0] },
      { subjectName: "Study Hall" },
    ]);
    assert.equal(out.length, 3);
    assert.equal(out[0].startTime, "08:00");
    assert.equal(out[1].subjectName, "Math");
    assert.equal(out[1].startTime, undefined, "end before start is not kept as a guess");
    assert.equal(out[2].daysAssumed, true);
    assert.equal(out[2].days, undefined);
  });
});

describe("findOverlappingPeriods", () => {
  test("only periods that share a day and overlap in time are reported; free periods and unconfirmed times are ignored", () => {
    const o = m.findOverlappingPeriods([
      { subjectName: "A", startTime: "08:00", endTime: "08:50", days: [0, 1] },
      { subjectName: "B", startTime: "08:30", endTime: "09:20", days: [1, 2] },
      { subjectName: "C", startTime: "08:30", endTime: "09:20", days: [3] },
      { subjectName: "D", startTime: "08:00", endTime: "08:50", days: [0], isFree: true },
      { subjectName: "E", startTime: "08:00", endTime: "08:50", days: [0], timeUnconfirmed: true },
    ]);
    assert.equal(o.length, 1);
    assert.equal(o[0].join("|"), "A|B");
  });
});

describe("deadline dates", () => {
  test("looksLikeDateString now requires a real calendar date", () => {
    assert.equal(m.looksLikeDateString(yr + "-02-30"), false);
    assert.equal(m.looksLikeDateString(yr + "-13-01"), false);
    assert.equal(m.looksLikeDateString(yr + "-09-24"), true);
  });
  test("an implausible year or impossible date is blanked, not guessed; a good one is untouched", () => {
    assert.equal(m.sanitizeDeadlineDate({ title: "x", date: (yr + 9) + "-01-01" }).date, null);
    assert.equal(m.sanitizeDeadlineDate({ title: "x", date: yr + "-02-30" }).date, null);
    assert.equal(m.sanitizeDeadlineDate({ title: "x", date: yr + "-10-01" }).date, yr + "-10-01");
    assert.equal(m.sanitizeDeadlineDate({ title: "x", date: null }).date, null);
  });
  test("the same item listed twice is kept once", () => {
    const list = [
      { title: "Problem Set 3", date: yr + "-10-01", kind: "assignment" },
      { title: "problem set 3", date: yr + "-10-01", kind: "assignment" },
      { title: "Problem Set 3", date: yr + "-10-08", kind: "assignment" },
    ];
    assert.equal(list.filter(m.uniqueDeadlineFilter()).length, 2);
  });
});

describe("wiring: the checks run on every scan path, and the student can change anything", () => {
  test("all extractors use the sanitizers", () => {
    assert.equal(S.split(".map(sanitizeDeadlineDate).filter(uniqueDeadlineFilter())").length - 1, 6);
    assert.equal(S.split("meetingTimes:sanitizeMeetingTimes(").length - 1, 4);
    assert.equal(S.split("periods:sanitizeHsPeriods(parsed&&parsed.periods)").length - 1, 2);
    assert.equal(S.split("parsed=parseJsonReply(raw)").length - 1, 7);
  });
  test("uncertain items start unchecked and the notice says how many", () => {
    assert.match(S, /include:!isPast&&d\.confidence!=="low",/);
    assert.match(S, /looks|uncertain, so/);
    assert.match(m.scanReviewNotice("", [{ title: "a", date: yr + 1 + "-01-01", confidence: "low" }, { title: "b", date: yr + 1 + "-01-02", confidence: "high" }]), /1 item looks uncertain, so it starts unchecked/);
    assert.match(m.scanReviewNotice("", [{ title: "a", date: null }]), /1 item has no date/);
  });
  test("skipping one class of a scanned schedule moves to the next instead of discarding the rest", () => {
    const i = S.indexOf("const cancelReview=()=>{");
    const body = S.slice(i, i + 700);
    assert.match(body, /if\(!editingPendingId&&scanQueue\.length>0\)\{\s*const \[nextClass,\.\.\.rest\]=scanQueue;\s*setScanQueue\(rest\);\s*buildReviewFromExtraction\(nextClass\);/);
    assert.match(S, /Stop and discard the other \{scanQueue\.length\} class/);
  });
  test("high school review: remove a period, add a missed one, edit days and time with a button, overlap warning, assumed days flagged", () => {
    assert.match(S, /aria-label=\{"Remove "\+\(p\.subjectName\|\|"this period"\)\}/);
    assert.match(S, /\+ Add a period Studlin missed/);
    assert.match(S, />\{isEditingTime\?"Close":"Edit days & time"\}<\/button>/);
    assert.match(S, /These overlap, so one of them was probably misread/);
    assert.match(S, /so Mon to Fri is a guess/);
  });
});
