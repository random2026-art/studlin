// 2026-10-16: a habit isn't labeled "Your study session", "None" never shows as a
// class, and any task can have its own color.
const { test, describe } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const path = require("path");
const { loadStudlinModule } = require("./harness.js");
const APP = fs.readFileSync(path.join(__dirname, "..", "studlin-app.jsx"), "utf8").replace(/\r\n/g, "\n");
const m = loadStudlinModule({ now: "2026-10-16T09:00:00" });

describe("Today's plan row labels", () => {
  test("a habit (gym) reads Habit, with no 'None' and no leading dot", () => {
    const gym = { title: "Gym", kind: "study block", subject: "None", routineId: "rt-1", duration: 60 };
    assert.equal(m.dashRowMeta(gym), "Habit");
  });
  test("a plain task with no class reads 'Your task'", () => {
    assert.equal(m.dashRowMeta({ kind: "study block", subject: "", isGeneralTask: true }), "Your task");
    assert.equal(m.dashRowMeta({ kind: "study block", subject: "None", isGeneralTask: true }), "Your task");
  });
  test("real study sessions and deadlines keep their wording and class", () => {
    assert.equal(m.dashRowMeta({ kind: "study block", subject: "Calculus II" }), "Calculus II · Your study session");
    assert.equal(m.dashRowMeta({ kind: "deadline", subject: "Calculus II" }), "Calculus II · Due");
  });
  test("subject placeholders are hidden", () => {
    assert.equal(m.dashSubjectText("None"), "");
    assert.equal(m.dashSubjectText("Other"), "");
    assert.equal(m.dashSubjectText("Chemistry"), "Chemistry");
  });
  test("an event's own color wins over the class color", () => {
    assert.equal(m.dashRowColor({ color: "#123456", subject: "Chemistry" }), "#123456");
  });
});

describe("source guards", () => {
  test("habit instances never carry the literal 'None' subject", () => {
    assert.ok(APP.includes('subject:(r.subject&&r.subject!=="None")?r.subject:""'));
  });
  test("event editor stores a blank subject, not 'None', and keeps an optional color", () => {
    assert.ok(APP.includes('subject:subject==="None"?"":subject,courseId:courseIdForLabel(subject)'));
    assert.ok(APP.includes("color:colorChoice||undefined"));
    assert.ok(APP.includes('const [colorChoice,setColorChoice]=useState("");'));
  });
  test("New Task modal has an optional color for every subject, saved on tasks and habits", () => {
    assert.ok(APP.includes('const [evTaskColor,setEvTaskColor]=useState("");'));
    assert.ok(APP.includes('evSubject!=="Other"&&('));
    assert.ok(APP.includes('(evTaskColor?{color:evTaskColor}:{})'));
    assert.ok(APP.includes('...(evTaskColor?{color:evTaskColor}:{}),notes:evNotes||undefined,isGeneralTask:true'));
    assert.equal((APP.match(/setEvTaskColor\(""\)/g) || []).length >= 3, true, "reset on open, on close and via the link");
  });
  test("dashboard rows use the event color for the left bar", () => {
    assert.equal((APP.match(/dashRowColor\(t\)/g) || []).length >= 4, true);
  });
});
