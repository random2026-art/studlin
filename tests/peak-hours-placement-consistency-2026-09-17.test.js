// Internal audit finding, 2026-09-17: a dedicated enumeration pass over
// every findOpenSlotFor/findFixedEventSlot/findLegalSlotOrNull call site
// found the previously-known class of bug (work-hours/weekend/deadline/
// occupied-conflict silently ignored) fully fixed everywhere -- but
// peak-hour preference (peakHourBuckets) is a SEPARATE, optional scoring
// layer only findReliableSlotFor consults. ~7 "place this for me" call
// sites used raw findLegalSlotOrNull directly and never considered
// declared peak hours at all, even though a student who set e.g. 6-10pm
// as their focus window would reasonably expect every "smart" placement
// to respect it, not just some.
//
// findReliableSlotFor itself was extended to accept the same optional
// catchupBufferMins/nowBufferMins findOpenSlotFor/findLegalSlotOrNull
// already have (threaded through to both its internal calls, and used in
// place of the old hardcoded +15 now-buffer) -- without this it would
// have silently dropped the IMMEDIATE_CATCHUP_MINS/IMMEDIATE_NOW_BUFFER_MINS
// overrides two Brain Dump call sites depend on, becoming a lossy
// "upgrade" rather than a true drop-in.
//
// Two of the fork's originally-flagged sites turned out to be deliberate,
// already-documented exceptions on closer reading -- NOT bugs -- and are
// explicitly verified here to still bypass the reliability engine:
// planBrainDumpTasks' "then"-chained branch (chain intent must win over
// "statistically smartest") and its "now"-immediate branch, plus
// submitBrainDump's own immediate pre-commit check (same rationale).
// Source-level regression guards -- component-closure/module-level mixed
// code, same convention this file's other scheduling fixes use.
const { test, describe } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const path = require("path");
const { loadStudlinModule } = require("./harness.js");

const SOURCE = fs.readFileSync(path.join(__dirname, "..", "studlin-app.jsx"), "utf8");

describe("findReliableSlotFor: extended to accept catchupBufferMins/nowBufferMins as a true drop-in for findLegalSlotOrNull", () => {
  test("signature accepts the two extra optional params with the same defaults findOpenSlotFor/findLegalSlotOrNull use", () => {
    assert.match(SOURCE, /function findReliableSlotFor\(events,routines,prefs,desiredDate,desiredTime,duration,deadlineKey,difficulty,catchupBufferMins=CATCHUP_BUFFER_MINS,nowBufferMins=15\)\{/);
  });

  test("both internal calls (baseline findOpenSlotFor, and the no-candidates findLegalSlotOrNull fallback) thread the buffers through instead of silently using defaults", () => {
    const idx = SOURCE.indexOf("function findReliableSlotFor(");
    const body = SOURCE.slice(idx, idx + 2200);
    assert.match(body, /findOpenSlotFor\(events,routines,prefs,desiredDate,desiredTime,duration,deadlineKey,catchupBufferMins,nowBufferMins\)/);
    assert.match(body, /findLegalSlotOrNull\(events,routines,prefs,desiredDate,desiredTime,duration,deadlineKey,catchupBufferMins,nowBufferMins\)/);
  });

  test("the now-floor uses the real nowBufferMins, not a hardcoded +15", () => {
    const idx = SOURCE.indexOf("function findReliableSlotFor(");
    const body = SOURCE.slice(idx, idx + 2200);
    assert.match(body, /now\.getHours\(\)\*60\+now\.getMinutes\(\)\+nowBufferMins/);
    assert.doesNotMatch(body, /now\.getHours\(\)\*60\+now\.getMinutes\(\)\+15/);
  });
});

describe("Seven real gap sites now route through findReliableSlotFor instead of raw findLegalSlotOrNull", () => {
  const fixedSites = [
    { fn: "scheduleAssignmentExtension", marker: "function scheduleAssignmentExtension(task,deadlineKey,totalMins){", needle: "findReliableSlotFor(events.concat(newEvents),routines,prefs,cursorDate,cursorTime,mins,deadlineKey,task.difficulty)" },
    { fn: "scheduleStudyBlockExtension", marker: "function scheduleStudyBlockExtension(task,totalMins){", needle: "findReliableSlotFor(events.concat(newEvents),routines,prefs,cursorDate,cursorTime,mins,deadlineKey,task.difficulty)" },
    { fn: "buildMoveFlexTaskProposal", marker: "const destDate=parsed.destDate||dayKey(new Date(new Date(targetDate+\"T12:00:00\").getTime()+86400000));", needle: "findReliableSlotFor(others,routines,prefs,destDate,matched.time||prefs.workStartTime,matched.duration||30,matched.deadline||null,matched.difficulty)" },
    { fn: "claimOrCreatePhaseSessionForChecklistItem", marker: "function claimOrCreatePhaseSessionForChecklistItem(markerId,phaseIdx,itemText,deadline,subject,priority,difficulty,events,routines,prefs,todayKey){", needle: "findReliableSlotFor(events,routines,prefs,today,prefs.workStartTime,30,deadline||null,difficulty)" },
    { fn: "planBrainDumpTasks (kind===\"event\" branch)", marker: 'if(it.kind==="event"&&!it.dueTime){', needle: "findReliableSlotFor(working,routines,prefs,desiredDate,desiredTime,duration,it.dueDate||null,5)" },
    { fn: "proposePaceBlock", marker: "const proposePaceBlock=()=>{", needle: "findReliableSlotFor(allEvents,getWeeklyRoutine(),getSchedulePreferences(),dayKey(),getSchedulePreferences().workStartTime,30,ev.deadline||ev.date,ev.difficulty)" },
    { fn: "proposeAssignPaceBlock", marker: "const proposeAssignPaceBlock=()=>{", needle: "findReliableSlotFor(allEvents,getWeeklyRoutine(),getSchedulePreferences(),today,getSchedulePreferences().workStartTime,30,selectedAssignment.deadline||selectedAssignment.date,selectedAssignment.difficulty)" },
  ];
  fixedSites.forEach(({ fn, marker, needle }) => {
    test(`${fn} calls findReliableSlotFor, not raw findLegalSlotOrNull`, () => {
      const idx = SOURCE.indexOf(marker);
      assert.notEqual(idx, -1, `couldn't find ${fn}'s own marker`);
      const body = SOURCE.slice(idx, idx + 1000);
      assert.match(body, new RegExp(needle.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
    });
  });
});

describe("Deliberate exceptions correctly left untouched -- chain/immediate intent must override the reliability engine, not the other way around", () => {
  test("planBrainDumpTasks' \"then\"-chained branch still uses raw findLegalSlotOrNull", () => {
    const idx = SOURCE.indexOf("Chain intent overrides the reliability engine entirely");
    assert.notEqual(idx, -1, "the explanatory comment must still be here, documenting why this is intentional");
    const body = SOURCE.slice(idx, idx + 500);
    assert.match(body, /findLegalSlotOrNull\(working,routines,prefs,cursorDate\|\|today,cursorTime,duration,it\.dueDate\|\|null\)/);
  });

  test("planBrainDumpTasks' \"now\"-immediate branch still uses raw findLegalSlotOrNull with IMMEDIATE buffers", () => {
    const idx = SOURCE.indexOf('\"Now\" items skip the reliability-bucket engine entirely');
    assert.notEqual(idx, -1);
    const body = SOURCE.slice(idx, idx + 1000);
    assert.match(body, /findLegalSlotOrNull\(working,routines,prefs,today,prefs\.workStartTime,duration,it\.dueDate\|\|null,IMMEDIATE_CATCHUP_MINS,IMMEDIATE_NOW_BUFFER_MINS\)/);
  });

  test("submitBrainDump's immediate pre-commit check still uses raw findLegalSlotOrNull with IMMEDIATE buffers", () => {
    const idx = SOURCE.indexOf('if(kind==="study"&&it.immediate&&!it.needsDuration){');
    assert.notEqual(idx, -1);
    const body = SOURCE.slice(idx, idx + 1600);
    assert.match(body, /findLegalSlotOrNull\(events,routines,prefs,todayKeyNow,prefs\.workStartTime,duration,it\.dueDate\|\|null,IMMEDIATE_CATCHUP_MINS,IMMEDIATE_NOW_BUFFER_MINS\)/);
  });
});

describe("findReliableSlotFor real invocation: peak-hour bucket actually changes which time wins, not just which day", () => {
  test("a declared peak-hour bucket beats a non-peak bucket on the same day when both are open", () => {
    const m = loadStudlinModule({ now: "2026-09-17T08:00:00" });
    const prefs = {
      workStartTime: "09:00", workEndTime: "21:00", bedtime: "23:00",
      taskDifficultyPreference: "NONE", bufferMarginStrategy: "15_MIN",
      weekendEnabled: true, weekendStartTime: "09:00", weekendEndTime: "21:00",
      // Real bucket ids are named ("morning"/"midday"/"afternoon"/"evening"
      // -- see TIER0_HOUR_BUCKETS), not raw hour-range strings. An earlier
      // draft of this test used "18-19", which never matched any real
      // bucket id -- isDeclaredPeak was always false, so the test was
      // silently checking nothing.
      peakHourBuckets: ["evening"],
    };
    const result = m.findReliableSlotFor([], [], prefs, "2026-09-18", "09:00", 30, null, 500);
    assert.notEqual(result, null);
    // Should land inside the declared "evening" bucket (18:00-22:00) rather
    // than the plain desired 09:00 -- this is the whole point of the fix: a
    // caller that used to get 09:00 unconditionally now gets steered to
    // the declared focus window when nothing else forces a different time.
    const [h] = result.time.split(":").map(Number);
    assert.ok(h >= 18 && h < 22, `expected the declared "evening" bucket (18-22), got ${result.time}`);
    assert.equal(result.reason && result.reason.type, "peak");
  });
});
