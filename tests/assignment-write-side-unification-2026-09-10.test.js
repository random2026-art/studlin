// User-approved follow-up to the assignment detail page work (2026-09-10):
// "make sure they all connect." Two real, previously-confirmed gaps closed
// at the SOURCE (write side) instead of only patching Prep's own read side:
//
// 1) Add Task's resolveAssignmentKind used to give an Assignment a
//    DIFFERENT underlying kind depending only on taskMode -- "deadline" in
//    AI mode, "study block"+isAssignment in manual mode -- even though both
//    are the exact same Type choice. Now Assignment always resolves to
//    "deadline" regardless of taskMode. Manual mode still places exactly
//    the time/duration the student picked; only the stored shape changed,
//    to the one AI mode already used (which the Prep assignment page's own
//    hasOwnScheduledTime already handles correctly). "task" (General Task)
//    is deliberately untouched -- it was never part of this bug.
//
// 2) planBrainDumpTasks' plain "study" branch (shared by Brain Dump and
//    Studlin AI chat's create_task) had the exact same "study block"+
//    isAssignment default -- now "deadline" too, same reasoning.
//
// 3) A genuine "just track the due date, schedule it whenever" option was
//    added to Add Task (AI mode, Assignment only) -- evScheduleLater --
//    committing a bare kind:"deadline" marker with no session at all, no
//    AI call (checked before the AI-cost gate, same "free" precedent
//    Attack Block's own branch already established).
//
// Deliberately NOT changed: evLinkedExamId (optional "count toward an
// exam" link) only ever applied when resolveAssignmentKind()==="study
// block" -- it still works for Study Session, but a manual-mode Assignment
// can no longer be exam-linked this way. Known, judged acceptable (see the
// resolveAssignmentKind comment) -- Assignments were never really "exam
// prep" to begin with.
//
// resolveAssignmentKind/aiArrange/the new toggle are CalendarTab component-
// closure code (not exported) -- covered by source-level regression
// guards, same precedent as friend-request-notification-badge.test.js.
// planBrainDumpTasks IS exported -- real invocation. Run with `npm test`.
const { test, describe } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const path = require("path");
const { loadStudlinModule } = require("./harness.js");

const APP_SOURCE = fs.readFileSync(path.join(__dirname, "..", "studlin-app.jsx"), "utf8");

describe("resolveAssignmentKind unification (source-level regression guard -- component closure, see this file's own top comment)", () => {
  test("Assignment always resolves to deadline regardless of taskMode -- General Task's own taskMode-dependent behavior is untouched", () => {
    assert.match(APP_SOURCE, /const resolveAssignmentKind=\(\)=>evKind==="assignment"\?"deadline":\(evKind==="task"\?\(taskMode==="ai"\?"deadline":"study block"\):\(evKind==="studySession"\?"study block":evKind==="project"\?"deadline":evKind\)\);/);
  });
});

describe("planBrainDumpTasks' plain study-item default now builds the same kind:\"deadline\" shape Add Task's AI mode already used (real invocations)", () => {
  test("a plain brain-dumped study item (no attackBlock flag) commits as kind:deadline, not study block", () => {
    const m = loadStudlinModule({ now: "2026-09-10T08:00:00" });
    const items = [{ kind: "study", title: "Read chapter 4", dueDate: "2026-09-20", durationMin: 30 }];
    const { tasks } = m.planBrainDumpTasks(items, [], [], m.getSchedulePreferences());
    assert.equal(tasks.length, 1);
    assert.equal(tasks[0].kind, "deadline");
    assert.equal(tasks[0].isAssignment, true);
    assert.ok(tasks[0].time, "still gets a real placed time, same as before this fix");
    assert.ok(tasks[0].duration > 0, "still gets a real duration, same as before this fix");
  });

  test("an explicit Attack Block item is untouched by this change -- still a real probe chain, not this shape", () => {
    const m = loadStudlinModule({ now: "2026-09-10T08:00:00" });
    const items = [{ kind: "study", title: "Write essay", dueDate: "2026-09-25", attackBlock: true }];
    const { tasks } = m.planBrainDumpTasks(items, [], [], m.getSchedulePreferences());
    assert.equal(tasks.length, 1);
    assert.equal(tasks[0].isAttackBlock, true);
    assert.ok(tasks[0].attackChainId);
  });

  test("this new kind:deadline shape is picked up by the broadened upcomingAssignments() (both fixes compose correctly together)", () => {
    const m = loadStudlinModule({ now: "2026-09-10T08:00:00" });
    const items = [{ kind: "study", title: "Problem set 3", dueDate: "2026-09-18", durationMin: 45 }];
    const { tasks } = m.planBrainDumpTasks(items, [], [], m.getSchedulePreferences());
    m.lsSet("events", tasks);
    const list = m.upcomingAssignments();
    assert.equal(list.length, 1);
    assert.equal(list[0].title, "Problem set 3");
  });
});

describe("\"Just track the due date\" -- evScheduleLater (source-level regression guards -- component closure)", () => {
  test("aiArrange commits a bare kind:deadline marker with no session, checked BEFORE the AI-cost gate (free, no AI call)", () => {
    const marker = APP_SOURCE.indexOf('if(evKind==="assignment"&&evScheduleLater){');
    const gate = APP_SOURCE.indexOf("if(!canUseAiArrange())");
    assert.notEqual(marker, -1);
    assert.notEqual(gate, -1);
    assert.ok(marker < gate, "evScheduleLater's bypass must run before the AI-cost gate, same free precedent as Attack Block's own branch");
    const block = APP_SOURCE.slice(marker, marker + 700);
    assert.match(block, /kind:"deadline",notes:evNotes,priority:evPriority,difficulty:evDifficulty,deadline:evDeadline\|\|null,/);
    assert.match(block, /duration:null,status:"pending"/);
    assert.match(block, /commitTasks\(\[marker\]\);/);
  });

  test("only reachable in AI mode for Assignment -- Manual Placement inherently means picking an exact time", () => {
    assert.match(APP_SOURCE, /\{evKind==="assignment"&&!isChecklistMode&&taskMode==="ai"&&\(/);
  });

  test("turning it on clears Attack Block so the two toggles can never both be active", () => {
    assert.match(APP_SOURCE, /onClick=\{\(\)=>setEvScheduleLater\(s=>\{if\(!s\)setEvAttackBlock\(false\);return !s;\}\)\}/);
  });

  test("Duration, Attack Block, and Split sections are all suppressed while it's on -- nothing to configure for a session that isn't being scheduled", () => {
    assert.match(APP_SOURCE, /taskRepeatDays\.length===0&&!evAttackBlock&&!evScheduleLater&&\(\s*\n\s*<Field label="Duration \(minutes\)"/);
    assert.match(APP_SOURCE, /!isChecklistMode&&!evScheduleLater&&evKind!=="task"&&evKind!=="studySession"&&\(evSplitEnabled\?/);
    assert.match(APP_SOURCE, /isTaskKind&&!isChecklistMode&&!evScheduleLater&&\(evAttackBlock\?/);
  });

  test("the save button relabels to 'Save due date' instead of the misleading 'Add Task with AI' (no AI is actually called)", () => {
    assert.match(APP_SOURCE, /\{aiLoading\?"Scheduling\.\.\.":evScheduleLater\?"Save due date":"Add Task with AI"\}/);
  });
});
