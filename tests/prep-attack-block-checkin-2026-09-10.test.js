// User report, 2026-09-10, with a screenshot of the new Assignment detail
// page: "when i hit complete for my attack block when i schedule one it
// doesnt ask me how much i completed so that it makes me a plan to finish
// it or ask completed."
//
// Root cause: the app already has a real, working "how much did you get
// through, want the rest re-estimated" check-in (ProjectCheckInModal +
// shouldOfferProjectCheckIn + App()'s handleTaskCompleted) -- it's what
// Dashboard's Today's Plan checkbox and Calendar's day/agenda checkbox both
// already route through via their own onTaskCompleted prop. StudlinPrep
// (the "prep" tab, home of the new Assignment detail page) was simply
// never given that prop at all, so completing a scheduled Attack Block
// session from there always took the blunt "just flip status" path with
// no follow-up ever offered -- not a missing feature, a missing wire.
//
// Also fixed in the same pass: the assignment page's per-block "Mark done"
// used to only exist for a block already in the past (isPast) -- there was
// no way to mark a not-yet-past scheduled block done at all (exactly the
// screenshot's own scenario: a block dated 3 days out). Now available for
// any pending block.
//
// shouldOfferProjectCheckIn is a real, exported pure function -- tested
// with real invocations. Everything else is App()/StudlinPrep component-
// closure wiring -- source-level regression guards, same established
// precedent as friend-request-notification-badge.test.js. Run with
// `npm test`.
const { test, describe } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const path = require("path");
const { loadStudlinModule } = require("./harness.js");

const SOURCE = fs.readFileSync(path.join(__dirname, "..", "studlin-app.jsx"), "utf8");

describe("shouldOfferProjectCheckIn correctly distinguishes a real Attack Block session from a manually-added block (real invocations)", () => {
  test("a real Attack Block chain session (attackChainId + dueEventId pointing at a real marker) qualifies", () => {
    const m = loadStudlinModule({ now: "2026-09-10T08:00:00" });
    const marker = { id: "a1", title: "HW 3", kind: "deadline", date: "2026-09-13", status: "pending" };
    const session = { id: "s1", title: "HW 3", kind: "study block", date: "2026-09-13", time: "15:00", duration: 30, status: "pending", isAttackBlock: true, attackChainId: "attack-1", dueEventId: "a1" };
    assert.equal(m.shouldOfferProjectCheckIn(session, [marker, session]), true);
  });

  test("a manually-added block (dueEventId only, no attackChainId -- '+ Add my own time block') never triggers the percentage check-in -- there's no probe to extrapolate from", () => {
    const m = loadStudlinModule({ now: "2026-09-10T08:00:00" });
    const marker = { id: "a1", title: "HW 3", kind: "deadline", date: "2026-09-13", status: "pending" };
    const manualBlock = { id: "m1", title: "Work on: HW 3", kind: "study block", date: "2026-09-13", time: "16:00", duration: 30, status: "pending", dueEventId: "a1" };
    assert.equal(m.shouldOfferProjectCheckIn(manualBlock, [marker, manualBlock]), false);
  });

  test("a task with no dueEventId at all (not linked to anything) never qualifies", () => {
    const m = loadStudlinModule({ now: "2026-09-10T08:00:00" });
    const task = { id: "t1", title: "Plain task", kind: "study block", date: "2026-09-13", status: "pending" };
    assert.equal(m.shouldOfferProjectCheckIn(task, [task]), false);
  });
});

describe("StudlinPrep is now wired to the same onTaskCompleted check-in Dashboard/Calendar already use (source-level regression guards)", () => {
  test("App() passes onTaskCompleted={handleTaskCompleted} to StudlinPrep, same as it already does for Dashboard and CalendarTab", () => {
    assert.match(SOURCE, /active==="prep"\?<StudlinPrep setActive=\{setActive\} setDetailEventId=\{setDetailEventId\} onStartPrepNow=\{acceptPrepPrompt\} onDeclinePrep=\{declinePrepPrompt\} onTaskCompleted=\{handleTaskCompleted\} \/>:/);
  });

  test("StudlinPrep's own function signature accepts the new prop", () => {
    assert.match(SOURCE, /function StudlinPrep\(\{setActive=\(\)=>\{\},setDetailEventId=\(\)=>\{\},onStartPrepNow=\(\)=>\{\},onDeclinePrep=\(\)=>\{\},onTaskCompleted=\(\)=>\{\}\}=\{\}\)\{/);
  });

  test("the assignment page's markLinkedBlockDone calls onTaskCompleted after the status flip, same order Dashboard/Calendar's own markDone already uses", () => {
    const marker = "const markLinkedBlockDone=(id)=>{";
    const idx = SOURCE.indexOf(marker);
    assert.notEqual(idx, -1, "expected the assignment page's markLinkedBlockDone");
    const body = SOURCE.slice(idx, idx + 900);
    assert.match(body, /status:"done",completedAt:Date\.now\(\)/);
    assert.match(body, /onTaskCompleted\(id\);/);
    // Status flip must commit before onTaskCompleted runs -- ProjectCheckInModal
    // re-reads the task fresh from storage by id, so ordering matters.
    const statusIdx = body.indexOf('status:"done"');
    const onCompletedIdx = body.indexOf("onTaskCompleted(id)");
    assert.ok(statusIdx < onCompletedIdx, "the status write must happen before onTaskCompleted is called");
  });

  test("a scheduled block can now be marked done even before its date arrives -- not just once it's already past", () => {
    assert.ok(SOURCE.includes('{s.status==="pending"&&<button type="button" onClick={()=>markLinkedBlockDone(s.id)}'));
  });
});
