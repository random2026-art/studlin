// User request, 2026-09-13: "maybe there's option for one time allow only
// so that person won't be able to overlay your calendar unless you agree
// one time" -- plus, for chat: "I want it where you can overlay calendar
// as well" instead of only AI-suggested times.
//
// Firestore rules can't detect "they looked at it once" and auto-revoke at
// that instant (rules aren't event-driven), so this is a REALISTIC
// one-time: the owner approves a single request, which grants a short,
// explicit expiresAt window rather than a standing grant. See
// firestore.rules' calendarViewGrants match block (own tests in
// firestore-rules.test.js, run via `npm run test:rules`) for the
// server-enforced half of this; this file covers the client-side request/
// approve/deny wiring, which is component-closure UI -- source-level
// regression guard, same convention as the other Schedule with Friends
// test files. Run with `npm test`.
const { test, describe } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const path = require("path");

const SOURCE = fs.readFileSync(path.join(__dirname, "..", "studlin-app.jsx"), "utf8");
const NOTIFY = fs.readFileSync(path.join(__dirname, "..", "api", "notify.js"), "utf8");

describe("Owner side: incoming requests list + approve/deny", () => {
  test("live-listens for pending requests where I'm the owner, same shape as incomingProjectInvites", () => {
    const idx = SOURCE.indexOf("const [incomingCalendarViewRequests,setIncomingCalendarViewRequests]=useState([]);");
    assert.ok(idx > -1);
    const body = SOURCE.slice(idx, idx + 500);
    assert.match(body, /fsdb\(\)\.collection\('calendarViewGrants'\)\s*\r?\n\s*\.where\('ownerUid','==',myUid\)\s*\r?\n\s*\.where\('status','==','pending'\)/);
  });

  test("approving sets a real expiresAt window rather than a standing grant", () => {
    const idx = SOURCE.indexOf("const approveCalendarViewRequest=async(req)=>{");
    assert.ok(idx > -1);
    const body = SOURCE.slice(idx, idx + 400);
    assert.match(body, /status:'approved',expiresAt:new Date\(Date\.now\(\)\+ONE_TIME_CALENDAR_VIEW_WINDOW_MS\)/);
  });

  test("denying just sets status without ever granting an expiresAt", () => {
    const idx = SOURCE.indexOf("const denyCalendarViewRequest=async(req)=>{");
    assert.ok(idx > -1);
    const body = SOURCE.slice(idx, idx + 300);
    assert.match(body, /status:'denied'/);
    assert.ok(!body.includes("expiresAt"));
  });

  test("the incoming-requests card renders Approve/Deny per request, mirroring the project-invite card", () => {
    const idx = SOURCE.indexOf("Calendar View Requests");
    assert.ok(idx > -1);
    const body = SOURCE.slice(idx, idx + 1800);
    assert.match(body, /onClick=\{\(\)=>approveCalendarViewRequest\(req\)\}/);
    assert.match(body, /onClick=\{\(\)=>denyCalendarViewRequest\(req\)\}/);
  });
});

describe("Requester side: creating a request at the deterministic composite id", () => {
  test("requestCalendarViewAccess (Schedule with Friends) writes requesterUid_ownerUid as the doc id", () => {
    const idx = SOURCE.indexOf("const requestCalendarViewAccess=async(otherUid)=>{");
    assert.ok(idx > -1);
    const body = SOURCE.slice(idx, idx + 500);
    assert.match(body, /\.doc\(myUid\+"_"\+otherUid\)\.set\(\{requesterUid:myUid,ownerUid:otherUid,status:'pending'/);
  });

  test("requestOneTimeCalendarAccess (ChatDrawer DM) uses the same composite id shape and is a no-op for groups", () => {
    const idx = SOURCE.indexOf("const requestOneTimeCalendarAccess=async()=>{");
    assert.ok(idx > -1);
    const body = SOURCE.slice(idx, idx + 600);
    assert.match(body, /if\(isGroup\|\|!myUid\|\|!target\|\|!target\.user\|\|!target\.user\.uid\)return;/, "a calendarViewGrants request is always 1:1 -- must not fire for a group chat");
    assert.match(body, /\.doc\(myUid\+"_"\+target\.user\.uid\)\.set\(\{requesterUid:myUid,ownerUid:target\.user\.uid,status:'pending'/);
  });

  test("Schedule with Friends' 'place' step offers a per-person one-time-access request for anyone who hasn't shared", () => {
    const idx = SOURCE.indexOf("Or ask {gsMemberNames[uid]||\"this friend\"} for a one-time look instead");
    assert.ok(idx > -1, "the per-person one-time-access row should still exist in the non-sharing list");
    const body = SOURCE.slice(idx, idx + 500);
    assert.match(body, /onClick=\{\(\)=>requestCalendarViewAccess\(uid\)\}/);
  });

  test("ChatDrawer's Find Shared Study Window modal offers the same request, DM-only", () => {
    const idx = SOURCE.indexOf("Haven't shared their calendar with you? Ask for a one-time look.");
    assert.ok(idx > -1);
    const body = SOURCE.slice(idx - 300, idx + 400);
    assert.match(body, /\{!isGroup&&\(/);
    assert.match(body, /onClick=\{requestOneTimeCalendarAccess\}/);
  });
});

describe("Push notification bonus channel", () => {
  test("client fires a calendarViewRequest notify call alongside both request paths", () => {
    const count = (SOURCE.match(/type:"calendarViewRequest"/g) || []).length;
    assert.equal(count, 2, "both requestCalendarViewAccess and requestOneTimeCalendarAccess should fire this");
  });

  test("api/notify.js routes calendarViewRequest to its own handler, friend-only like shareAvailabilityRequest", () => {
    assert.match(NOTIFY, /if \(type === 'calendarViewRequest'\) return sendCalendarViewRequest\(user, req, res\);/);
    const idx = NOTIFY.indexOf("async function sendCalendarViewRequest(");
    assert.ok(idx > -1);
    const body = NOTIFY.slice(idx, idx + 900);
    assert.match(body, /Not friends with this user/, "must reject a request between non-friends, same as sendShareAvailabilityRequest");
  });
});
