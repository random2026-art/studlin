// Persona audit, 2026-09-25 (Wave 1, chunk 2: "silent failures"). Four
// places reported a real failure as something else, or not at all:
//  1. Reschedule's typed box never checked the server response, so a rate
//     limit / out-of-credits / outage read as "that doesn't look like a
//     schedule change" (blaming the student's phrasing) and still counted
//     against the monthly cap.
//  2. Friend-request send/accept/decline swallowed every error.
//  3. Canvas sync skipped a course whose assignments failed to load with
//     no trace.
//  4. When a Pro account passed its monthly spend cap, the server quietly
//     switched to the cheaper model and the app never said so.
//
// Canvas is tested with real calls against a stubbed fetch; the rest are
// source-level regression guards (component-closure UI), same convention
// this file's neighbors use. Run with `npm test`.
const { test, describe, afterEach } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const SOURCE = fs.readFileSync(path.join(ROOT, "studlin-app.jsx"), "utf8");
const ME_SOURCE = fs.readFileSync(path.join(ROOT, "api", "me.js"), "utf8");
const canvas = require("../api/_lib/canvas.js");

const realFetch = global.fetch;
afterEach(() => { global.fetch = realFetch; });

const ok = (body) => ({ ok: true, status: 200, json: async () => body });
const fail = (status) => ({ ok: false, status, json: async () => ({}) });
function stubCanvas(routes) {
  global.fetch = async (url) => {
    const u = String(url);
    for (const [fragment, response] of routes) if (u.includes(fragment)) return response;
    return fail(404);
  };
}
const future = new Date(Date.now() + 7 * 86400000).toISOString();

describe("Canvas sync reports courses it had to skip (real calls, stubbed fetch)", () => {
  const baseRoutes = () => ([
    ["/courses?enrollment_state", ok([{ id: 1, name: "Course A" }, { id: 2, name: "Course B" }])],
    ["/courses/1/assignment_groups", ok([])],
    ["/courses/2/assignment_groups", ok([])],
    ["/courses/1/assignments", ok([{ id: 11, name: "HW 1", due_at: future, points_possible: 10 }])],
  ]);

  test("a course whose assignments fail to load is named in skippedCourses, and the rest still import", async () => {
    stubCanvas([...baseRoutes(), ["/courses/2/assignments", fail(500)]]);
    const out = await canvas.fetchAllCanvasDataDetailed("school.instructure.com", "tok");
    assert.equal(out.events.length, 1);
    assert.equal(out.events[0].title, "HW 1");
    assert.equal(out.skippedCourses.length, 1);
    assert.equal(out.skippedCourses[0], "Course B");
  });

  test("a malformed (non-array) assignments payload is reported too, not just a thrown error", async () => {
    stubCanvas([...baseRoutes(), ["/courses/2/assignments", ok({ unexpected: true })]]);
    const out = await canvas.fetchAllCanvasDataDetailed("school.instructure.com", "tok");
    assert.equal(out.skippedCourses.length, 1);
    assert.equal(out.skippedCourses[0], "Course B");
  });

  test("nothing skipped -> an empty list, not undefined", async () => {
    stubCanvas([...baseRoutes(), ["/courses/2/assignments", ok([])]]);
    const out = await canvas.fetchAllCanvasDataDetailed("school.instructure.com", "tok");
    assert.equal(out.skippedCourses.length, 0);
    assert.equal(out.events.length, 1);
  });

  test("fetchAllCanvasData keeps its original return shape (a bare events array) so the daily cron is untouched", async () => {
    stubCanvas([...baseRoutes(), ["/courses/2/assignments", fail(500)]]);
    const events = await canvas.fetchAllCanvasData("school.instructure.com", "tok");
    assert.ok(Array.isArray(events));
    assert.equal(events.length, 1);
  });

  test("api/me.js's connect and pull responses both carry skippedCourses; the cron still uses the plain function", () => {
    assert.match(ME_SOURCE, /json\(\{ events, skippedCourses, lastSyncedAt: now \}\)/);
    assert.match(ME_SOURCE, /json\(\{ connected: true, events, skippedCourses, lastSyncedAt: now, lastSyncError: null \}\)/);
    assert.match(ME_SOURCE, /const events = await fetchAllCanvasData\(resolved\.domain, data\.canvasAccessToken\);/, "the cron path must keep the bare-array function");
  });

  test("the client tells the student which courses were skipped on connect and on a manual sync (not on the silent daily one)", () => {
    assert.match(SOURCE, /data\.skippedCourses\.length>0\)showToast\("Canvas: couldn't load assignments for "/);
    assert.match(SOURCE, /if\(manual&&Array\.isArray\(data\.skippedCourses\)&&data\.skippedCourses\.length>0\)showToast\(/);
  });
});

describe("Reschedule's typed box no longer blames the student's phrasing for a server problem", () => {
  test("a non-ok response shows the server's real reason and returns BEFORE recordSmartReschedule counts it", () => {
    const start = SOURCE.indexOf("let serverAnswered=false;");
    assert.notEqual(start, -1);
    const body = SOURCE.slice(start, start + 1600);
    const notOk = body.indexOf("if(!res.ok){");
    const record = body.indexOf("recordSmartReschedule();");
    assert.ok(notOk > -1 && record > -1, "both must exist in submitPauseCommand");
    assert.ok(notOk < record, "a refused call must return before it is counted against the cap");
    assert.match(body, /setPauseError\(\(data&&data\.error\)\|\|"Something went wrong on our end/);
  });

  test("only a real 'answered but unusable' reply gets the phrasing message; a network failure says so", () => {
    assert.match(SOURCE, /setPauseError\(serverAnswered\s*\?"That doesn't look like a schedule change Studlin can act on\./);
    assert.match(SOURCE, /:"Couldn't reach Studlin\. Check your connection and try again\."\);/);
  });
});

describe("Friend requests report failures instead of swallowing them", () => {
  test("send, accept and decline each toast on error", () => {
    assert.match(SOURCE, /if\(onFriendRequestSent\)onFriendRequestSent\(\);\}catch\(e\)\{showNetToast\("Couldn't send that request\./);
    assert.match(SOURCE, /\}catch\(e\)\{showNetToast\("Couldn't accept that request\. Try again\."\);\}/);
    assert.match(SOURCE, /const declineReq=async\(id\)=>\{try\{await fsdb\(\)\.collection\('friendships'\)\.doc\(id\)\.delete\(\);\}catch\(e\)\{showNetToast\("Couldn't decline that request\./);
  });
});

describe("The AI drawer says when a Pro account has been moved to the cheaper model", () => {
  test("both Q&A and coaching replies call noteCostCapDowngrade with the server's response", () => {
    const calls = SOURCE.split("noteCostCapDowngrade(data);").length - 1;
    assert.equal(calls, 2, "askQuestion and giveCoaching both surface it");
  });

  test("it says so once per calendar month, and its copy doesn't promise a date the server doesn't use", () => {
    const idx = SOURCE.indexOf("const noteCostCapDowngrade=(data)=>{");
    assert.notEqual(idx, -1);
    const body = SOURCE.slice(idx, idx + 700);
    assert.match(body, /data\.downgradedForCostCap/);
    assert.match(body, /costCapNoteShown-/);
    assert.match(body, /until your plan renews/, "the server resets the spend counter on each renewal, not on a calendar date");
  });
});
