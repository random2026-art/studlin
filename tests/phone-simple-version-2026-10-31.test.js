// 2026-10-31 user report: the phone layout was a mess, items overlapped and the
// Dashboard checklist was hard to see. The phone is now a simpler Studlin:
// Today (checklist first), Day-view calendar, Network, and a More sheet. Desktop
// is untouched. Source-level pins; the look itself needs a real phone.
const { test, describe } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const path = require("path");

const SOURCE = fs.readFileSync(path.join(__dirname, "..", "studlin-app.jsx"), "utf8").split("\r\n").join("\n");
const HTML = fs.readFileSync(path.join(__dirname, "..", "studlin-web-app.html"), "utf8");

describe("phone tab bar", () => {
  test("four tabs: Today, Calendar, Network, More; Prep/Settings/Profile live under More", () => {
    assert.ok(SOURCE.includes('{id:"dashboard",label:"Today"}'));
    assert.ok(SOURCE.includes('{id:"calendar",label:"Calendar"}'));
    assert.ok(SOURCE.includes('{id:"friends",label:"Network"'));
    assert.ok(SOURCE.includes('{id:"more",label:"More"'));
    assert.ok(SOURCE.includes('const PHONE_MORE_IDS=["prep","settings","profile"];'));
    assert.ok(SOURCE.includes('{[{id:"prep",label:"Studlin Prep"},{id:"settings",label:"Settings"},{id:"profile",label:"Profile"}]'));
  });
});

describe("phone Today (Dashboard)", () => {
  test("checklist comes first, extra cards are hidden on phone", () => {
    assert.ok(SOURCE.includes("order:isPhone?-1:0"));
    assert.ok(SOURCE.includes("{!isPhone&&<JournalCard />}"));
    assert.ok(SOURCE.includes("{learnsYouReveal&&!isPhone&&("));
    assert.ok(SOURCE.includes("{showSetupChecklist&&!isPhone&&("));
    assert.ok(SOURCE.includes('gridTemplateColumns:isPhone?"1fr":"1fr 1fr"'));
    assert.ok(SOURCE.includes('gridTemplateColumns:isPhone?"1fr":"5fr 7fr"'));
    assert.ok(SOURCE.includes('display:isPhone?"none":undefined'));
  });
});

describe("phone Calendar", () => {
  test("Day view only, no courses sidebar, no right column, no view switcher", () => {
    assert.ok(SOURCE.includes('const calView=isPhone?"daily":calViewStored;'));
    assert.equal((SOURCE.match(/display:isPhone\?"none":"flex",position:"relative",alignSelf:"stretch"/g) || []).length, 2);
    assert.ok(SOURCE.includes('display:isPhone?"none":"flex",gap:2,background:T.lookOn?T.accentSoft:T.card2'));
  });

  test("desktop still honors the saved view (stored value, not forced)", () => {
    assert.ok(SOURCE.includes("const [calViewStored,setCalViewState]="));
    assert.ok(SOURCE.includes("const setCalView=(v)=>{setCalViewState(v);lsSet(\"calView\",v);};"));
  });
});

describe("phone overlap fixes", () => {
  test("Stu sits above the tab bar and is smaller on phone", () => {
    assert.ok(SOURCE.includes('bottom:isPhone?"calc(70px + env(safe-area-inset-bottom, 0px))":14'));
    assert.ok(SOURCE.includes("size={isPhone?60:88}"));
  });

  test("fixed toasts and floating buttons are lifted above the tab bar on phone", () => {
    assert.ok(HTML.includes('[style*="position: fixed"][style*="bottom: 24px"]'));
    assert.ok(HTML.includes("bottom: calc(76px + env(safe-area-inset-bottom)) !important"));
  });
});

describe("per-task reminder time", () => {
  test("options, shared lead rule, and the in-app reminder loop uses it", () => {
    assert.ok(SOURCE.includes("const REMIND_OPTIONS=["));
    assert.ok(SOURCE.includes('{value:"20",label:"20 min before"}'));
    assert.ok(SOURCE.includes('{value:"0",label:"No reminder"}'));
    assert.ok(SOURCE.includes("function reminderLeadsFor(ev,defaults){"));
    assert.ok(SOURCE.includes("reminderLeadsFor(ev,LEAD_TIMES).forEach(lead=>{"));
  });

  test("the task editor has a Remind me field that is saved on the event", () => {
    assert.ok(SOURCE.includes('<Field label="Remind me"><CustomSelect boxed options={REMIND_OPTIONS} value={remindMins}'));
    assert.ok(SOURCE.includes('remindMins:remindMins===""?undefined:Number(remindMins)'));
    assert.ok(SOURCE.includes('setRemindMins(ev.remindMins==null?"":String(ev.remindMins));'));
  });
});
