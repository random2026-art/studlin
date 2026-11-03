// 2026-11-02: changes made on the desktop never reached an open phone (the
// one-time pull was gated per session), closed-app reminders had nothing
// calling them, and Settings was a two-column desktop layout on a phone.
const { test, describe } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const path = require("path");
const ROOT = path.join(__dirname, "..");
const SRC = fs.readFileSync(path.join(ROOT, "studlin-app.jsx"), "utf8").split("\r\n").join("\n");

describe("pulling changes from other devices", () => {
  test("hydrateOnAuth can be forced and announces when remote data changed local", () => {
    assert.ok(SRC.includes("async function hydrateOnAuth(force){"));
    assert.ok(SRC.includes("(hydratedForUid===uid&&force!==true)"));
    assert.ok(SRC.includes('new CustomEvent("studlin:remote-data"'));
  });
  test("the app re-pulls on focus, visibility, online and a timer, then redraws", () => {
    assert.ok(SRC.includes('document.addEventListener("visibilitychange",pull)'));
    assert.ok(SRC.includes('window.addEventListener("online",pull)'));
    assert.ok(SRC.includes('window.addEventListener("studlin:remote-data",onRemote)'));
    assert.ok(SRC.includes('<div key={active+"-"+dataEpoch} data-page'));
  });
});

describe("closed-app reminders get a caller", () => {
  const wf = fs.readFileSync(path.join(ROOT, ".github", "workflows", "reminders.yml"), "utf8");
  test("workflow calls /api/reminders every 5 minutes with the secret", () => {
    assert.ok(wf.includes('cron: "*/5 * * * *"'));
    assert.ok(wf.includes("secrets.CRON_SECRET"));
    assert.ok(wf.includes("/api/reminders"));
  });
  test("server window matches the 5 minute cadence", () => {
    assert.equal(require("../api/_lib/reminders-core").WINDOW_MINS, 5);
  });
});

describe("Settings on a phone", () => {
  test("single column with a scrolling section strip", () => {
    assert.ok(SRC.includes('gridTemplateColumns:isPhone?"minmax(0,1fr)":"200px 1fr"'));
  });
});
