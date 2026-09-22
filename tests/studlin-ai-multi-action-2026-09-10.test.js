// User report, 2026-09-10: "studlin ai needs to be able to do multiple
// things at once, like if i tell it remove meeting with z and add going
// hiking from 8:30pm it needs to be able to do that very well." Before this,
// classifyStudlinAiMessage's own prompt explicitly forced anything multi-
// step into "unsupported," and StudlinAiDrawer only ever built/showed one
// proposal per message.
//
// Fix: the classifier can now return kind:"multi_action" with an `actions`
// array of exactly two sub-requests (restricted to create_task/delete_task/
// move_flex_task/move_event/retime_event/set_peak_hours -- never a bulk/
// complex intent, even paired with something simple), and the drawer
// (runMultiAction/confirmProposal) builds both sub-proposals up front and
// commits them together under one combined card.
//
// classifyStudlinAiMessage itself is a real /api/chat call and isn't
// exercised here -- same precedent tests/studlin-ai-actions.test.js already
// documents (this repo has no fetch-mocking pattern). Its prompt/schema
// changes are covered by source-level regression guards instead.
// buildStudlinAiActionProposal (what each sub-action actually builds
// through) IS a pure, exported function, so the real per-item building is
// tested directly with real invocations, matching studlin-ai-actions.test.js's
// own convention. runMultiAction/confirmProposal's "multi" branch are
// component-closure code (not exported), covered by source-level guards,
// same established precedent as friend-request-notification-badge.test.js
// and share-availability-request.test.js. Run with `npm test`.
const { test, describe } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const path = require("path");
const { loadStudlinModule } = require("./harness.js");

const APP_SOURCE = fs.readFileSync(path.join(__dirname, "..", "studlin-app.jsx"), "utf8");

describe("classifyStudlinAiMessage's prompt now supports multi_action (source-level regression guards -- see this file's own top comment for why)", () => {
  // NOTE: the prompt's JSON schema is authored in studlin-app.jsx as a
  // plain (non-raw) JS string, so every literal quote inside it is a real
  // backslash-quote pair (\") in the source bytes -- fs.readFileSync reads
  // those bytes as-is. String.raw here preserves that same backslash
  // exactly as typed, so these literals byte-match the source without
  // regex escaping (which is what tripped up an earlier draft of this
  // exact file -- a bare `"kind"` doesn't match `\"kind\"`).
  test("the JSON envelope's kind enum includes multi_action, and gained an actions array field", () => {
    // 2026-09-15: availability_match was added between multi_action and
    // unsupported (see tests/studlin-ai-availability-match.test.js) --
    // updated to match, multi_action's own presence is still what this
    // test is really pinning.
    assert.ok(APP_SOURCE.includes(String.raw`\"kind\":\"question\"|\"coaching\"|\"action\"|\"multi_action\"|\"availability_match\"|\"unsupported\"`));
    assert.ok(APP_SOURCE.includes(String.raw`\"actions\":<for kind \"multi_action\" ONLY, an array of exactly 2 objects`));
  });

  test("multi_action is restricted to the safe intent subset -- bulk/complex intents are explicitly excluded even when paired with something simple", () => {
    assert.ok(APP_SOURCE.includes(String.raw`Each item in \"actions\" is restricted to intent \"create_task\", \"delete_task\", \"move_flex_task\", \"move_event\", \"retime_event\", or \"set_peak_hours\" ONLY -- never \"shift\", \"clear_day\", \"clear_week\", \"skip_class\", \"generate_study_material\", or \"import_syllabus_items\"`));
  });

  test("three or more distinct requests still falls back to unsupported, not multi_action -- never guess past two", () => {
    assert.ok(APP_SOURCE.includes("THREE OR MORE distinct action requests in one message"));
    assert.ok(APP_SOURCE.includes(String.raw`\"cancel my dentist appointment, move my chem homework to tomorrow, and add a task for my essay due friday\" (THREE distinct requests, not two`));
  });

  test("the worked example matches the exact user-reported scenario (remove one thing, add another)", () => {
    assert.ok(APP_SOURCE.includes(String.raw`\"remove meeting with z and add going hiking from 8:30 pm\"`));
    assert.ok(APP_SOURCE.includes(String.raw`\"intent\":\"delete_task\",\"target\":\"meeting with z\"`));
    assert.ok(APP_SOURCE.includes(String.raw`\"intent\":\"create_task\",\"target\":null,\"targetDate\":null,\"destDate\":null,\"newStart\":null,\"newDuration\":null,\"title\":\"Going hiking\"`));
  });
});

describe("runMultiAction (source-level regression guards -- component closure, see this file's own top comment)", () => {
  test("send() routes kind:multi_action to runMultiAction, distinct from the single-action path", () => {
    assert.match(APP_SOURCE, /else if\(parsed\.kind==="multi_action"\)await runMultiAction\(parsed,text\);/);
  });

  test("a defensive re-check rejects anything but exactly two allowed-intent sub-actions, even if the classifier didn't listen to its own prompt", () => {
    assert.match(APP_SOURCE, /const MULTI_ACTION_ALLOWED_INTENTS=new Set\(\["create_task","delete_task","move_flex_task","move_event","retime_event","set_peak_hours"\]\);/);
    assert.match(APP_SOURCE, /if\(actions\.length!==2\|\|actions\.some\(a=>!a\|\|!MULTI_ACTION_ALLOWED_INTENTS\.has\(a\.intent\)\)\)\{/);
  });

  test("either sub-action failing to build (not found, needs disambiguation, or not ok) declines the WHOLE request instead of doing just one half", () => {
    assert.match(APP_SOURCE, /const failed=items\.find\(p=>!p\.ok\);\s*\n\s*if\(failed\)\{/);
  });

  test("both sub-proposals build against the same current events snapshot before either commits", () => {
    assert.match(APP_SOURCE, /const items=actions\.map\(a=>buildStudlinAiActionProposal\(a,events,routines,prefs,null,rawText\)\);/);
  });
});

describe("confirmProposal's multi branch (source-level regression guards -- component closure, see this file's own top comment)", () => {
  test("commits each sub-proposal in order via the existing per-kind commit helpers, same ones the single-action path already uses", () => {
    assert.match(APP_SOURCE, /if\(proposal\.kind==="multi"\)\{/);
    // 2026-09-22: commitStudlinAiTasks now returns {events,moved} (moved is
    // whatever else rebalanceDay silently reshuffled) instead of a bare
    // array -- next is destructured from .events, same commit helper.
    assert.match(APP_SOURCE, /const r=commitStudlinAiTasks\(item\.tasks\);\s*\n\s*next=r\.events;/);
    assert.match(APP_SOURCE, /next=commitStudlinAiFixedMove\(item\.pausePreview\);/);
    assert.match(APP_SOURCE, /next=commitStudlinAiFlexMove\(item\.moved\);/);
    assert.match(APP_SOURCE, /onDeleteEvent\(item\.event\);/);
    assert.match(APP_SOURCE, /commitStudlinAiPeakHours\(getSchedulePreferences\(\),item\.bucketId\);/);
  });

  test("re-gates each item at confirm time too, same redundant-recheck reasoning as every other proposal kind here", () => {
    const marker = 'if(proposal.kind==="multi"){';
    const start = APP_SOURCE.indexOf(marker);
    assert.notEqual(start, -1);
    const block = APP_SOURCE.slice(start, start + 2200);
    assert.match(block, /if\(!canUseBrainDump\(\)\)\{setPricingOpen/);
    assert.match(block, /if\(!canUseSmartReschedule\(\)\)\{setPricingOpen/);
  });
});

describe("buildStudlinAiActionProposal handles the two sub-action shapes from the user's own reported scenario (real invocations)", () => {
  test("the delete_task half resolves a real existing event to remove", () => {
    const m = loadStudlinModule({ now: "2026-09-10T18:00:00" });
    // matchEventByTitle (what buildDeleteProposal resolves its target
    // through) reads lsGet("events",[]) directly rather than the `events`
    // argument passed in below -- same setup studlin-ai-actions.test.js's
    // own buildDeleteProposal tests already use.
    const events = [{ id: "e1", title: "Meeting with Z", date: "2026-09-10", time: "19:00", duration: 30, kind: "event", status: "pending" }];
    m.lsSet("events", events);
    const parsed = { intent: "delete_task", target: "meeting with z", targetDate: "2026-09-10" };
    const proposal = m.buildStudlinAiActionProposal(parsed, events, [], m.getSchedulePreferences(), null, "");
    assert.equal(proposal.ok, true);
    assert.equal(proposal.kind, "delete_task");
    assert.equal(proposal.event.id, "e1");
  });

  test("the create_task half places a real fixed event at the given time", () => {
    const m = loadStudlinModule({ now: "2026-09-10T18:00:00" });
    const parsed = { intent: "create_task", title: "Going hiking", dueDate: "2026-09-10", dueTime: "20:30", taskKind: "event" };
    const proposal = m.buildStudlinAiActionProposal(parsed, [], [], m.getSchedulePreferences(), null, "");
    assert.equal(proposal.ok, true);
    assert.equal(proposal.kind, "create_task");
    assert.equal(proposal.tasks[0].title, "Going hiking");
    assert.equal(proposal.tasks[0].date, "2026-09-10");
    assert.equal(proposal.tasks[0].time, "20:30");
  });

  test("a delete_task half that can't find its target reports ok:false, which runMultiAction's failed-item check catches", () => {
    const m = loadStudlinModule({ now: "2026-09-10T18:00:00" });
    const parsed = { intent: "delete_task", target: "meeting with z", targetDate: "2026-09-10" };
    const proposal = m.buildStudlinAiActionProposal(parsed, [], [], m.getSchedulePreferences(), null, "");
    assert.equal(proposal.ok, false);
    assert.match(proposal.label, /Couldn't find/);
  });
});
