// Persona audit 2026-09-25 (Wave 3, chunk 13, part): "Days away", and Catch
// Me Up's Undo brings back what the rebuild dropped or shortened.
const { test, describe } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const path = require("path");
const SOURCE = fs.readFileSync(path.join(__dirname, "..", "studlin-app.jsx"), "utf8");

describe("Days away", () => {
  test("the routine center section is renamed and says misses on those days don't count", () => {
    assert.match(SOURCE, />Days away<\/div>/);
    assert.match(SOURCE, /anything you didn't get to won't count against you/);
    assert.ok(!SOURCE.includes('marginBottom:2}}>Holidays</div>'));
  });
  test("a session that fell on a day away is not logged as a miss, but is still de-duplicated", () => {
    const i = SOURCE.indexOf("newlyMissed.forEach(ev=>{");
    const body = SOURCE.slice(i, i + 500);
    assert.match(body, /if\(!isHoliday\(ev\.date\)\)logCompletionOutcome\("missed"/);
    assert.match(body, /missedLoggedKeys\.add\(ev\.id\+"\|"\+ev\.date\)/);
  });
});

describe("Catch Me Up undo", () => {
  test("confirming remembers the dropped event and the shortened original on the applied entry", () => {
    assert.match(SOURCE, /if\(entry&&dropped\)entry\.droppedEvent=dropped;/);
    assert.match(SOURCE, /entry\.shortened=\{id:m\.shortenedId,from:shortEv\.duration,to:newDuration\}/);
  });
  test("undo restores them only for moves that were actually undone, and only un-shortens if the duration is untouched", () => {
    const i = SOURCE.indexOf("const undoCatchUpRebuild=()=>{");
    const body = SOURCE.slice(i, i + 1600);
    assert.match(body, /if\(result\.blocked\)\{blockedCount\+\+;return;\}/);
    assert.match(body, /if\(m\.droppedEvent\)restoredDropped\.push\(m\.droppedEvent\)/);
    assert.match(body, /if\(!evs\.some\(e=>e\.id===d\.id\)\)evs=\[\.\.\.evs,d\]/);
    assert.match(body, /e\.id===sh\.id&&e\.duration===sh\.to\?\{\.\.\.e,duration:sh\.from\}:e/);
  });
});
