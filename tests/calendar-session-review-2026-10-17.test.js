// 2026-10-17: Prep "See on calendar" opens a Back/Next session review with a persistent pulsing
// highlight; the gold exam row is gone and its time edits from the header line.
const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const path = require("path");
const APP = fs.readFileSync(path.join(__dirname, "..", "studlin-app.jsx"), "utf8").replace(/\r\n/g, "\n");

test("calendar reads the review request once, forces the week view, and highlights every session", () => {
  assert.ok(APP.includes('const q=lsGet("openSessionReview",null);'));
  assert.ok(APP.includes("if(!q.setAt||Date.now()-q.setAt>60000)return;"));
  assert.ok(APP.includes("setNewItemHighlightIds(q.ids||[]);"));
});
test("the current session stays pulsing and the view jumps to it as you step through", () => {
  assert.ok(APP.includes("useEffect(()=>{if(reviewCurrent)jumpToSession(reviewCurrent);},[reviewCurrent&&reviewCurrent.id]);"));
  assert.ok(APP.includes("highlightedSessionId={sessionReview&&reviewCurrent?reviewCurrent.id:highlightedSessionId}"));
  assert.ok(APP.includes('animation:"studlinPulseRing 1.5s ease-in-out infinite"'));
  assert.ok(APP.includes("@keyframes studlinPulseRing"));
  assert.ok(APP.includes("prefers-reduced-motion"));
});
test("Back / Next / Done, with a clear instruction and position", () => {
  assert.ok(APP.includes("{sessionReview.title}: session {reviewIdx+1} of {reviewSessions.length}"));
  assert.ok(APP.includes("onClick={()=>stepReview(-1)}>‹ Back</BtnSm>"));
  assert.ok(APP.includes("onClick={()=>stepReview(1)}>Next ›</BtnSm>"));
  assert.ok(APP.includes("Drag the pulsing block to move it, or drag its bottom edge to change the length."));
  assert.ok(APP.includes("disabled={reviewIdx>=reviewSessions.length-1}"));
});
test("Done returns to the same exam page", () => {
  assert.ok(APP.includes('if(backExam){lsSet("openExamId",backExam);setActive("prep");}'));
  assert.ok(APP.includes('if(ex){lsSet("openExamId",null);setTab("exams");setSelectedExamId(ex);}'));
});
test("the gold exam row is gone; the exam time edits from the header line", () => {
  assert.ok(!APP.includes("<div style={{fontSize:14,fontWeight:700,color:T.amber}}>{selectedExam.title}</div>"));
  assert.ok(APP.includes("The exam's own time lives here now"));
  assert.ok(APP.includes('"· "+fmtRolloverClock(selectedExam.time):"· time TBD"}</button>'));
});
test("no em dashes in the new copy", () => {
  const i = APP.indexOf("Study-session review (Prep");
  assert.ok(!APP.slice(i, i + 1800).includes("—"));
});
