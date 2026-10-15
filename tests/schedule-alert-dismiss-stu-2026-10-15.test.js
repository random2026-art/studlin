// 2026-10-15: dismissing the "Your new schedule came in" popup must stick, and
// Stu delivers it (with a plain-card fallback and a turn-off link).
const { test, describe } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const path = require("path");
const { loadStudlinModule } = require("./harness.js");

const APP = fs.readFileSync(path.join(__dirname, "..", "studlin-app.jsx"), "utf8").replace(/\r\n/g, "\n");

const conflict = (a, b) => ({ kind: "attention", newEvent: { id: a, title: "Meeting" }, conflictsWith: { id: b, title: "Meeting" } });

describe("dismissed schedule conflicts stay dismissed", () => {
  test("a remembered conflict is filtered out when the sync finds it again", () => {
    const m = loadStudlinModule({ now: "2026-10-15T09:00:00" });
    assert.equal(m.dedupeScheduleAlerts([conflict("a", "b")]).length, 1, "new conflict shows");
    m.rememberDismissedScheduleAlerts([conflict("a", "b")]);
    assert.equal(m.dedupeScheduleAlerts([conflict("a", "b")]).length, 0, "same conflict does not return");
    assert.equal(m.dedupeScheduleAlerts([conflict("a", "c")]).length, 1, "a different conflict still shows");
  });
  test("moved alerts are never suppressed", () => {
    const m = loadStudlinModule({ now: "2026-10-15T09:00:00" });
    m.rememberDismissedScheduleAlerts([{ kind: "moved", id: "x" }]);
    assert.equal(m.dedupeScheduleAlerts([{ kind: "moved", id: "x" }]).length, 1);
  });
  test("summary copy is short and has no em dash", () => {
    const m = loadStudlinModule({ now: "2026-10-15T09:00:00" });
    const s = m.scheduleAlertSummary([conflict("a", "b"), conflict("c", "d")]);
    assert.ok(s.line.includes("2 conflicts"));
    assert.ok(s.sub.includes("Plus 1 more"));
    assert.ok(!/—/.test(s.line + s.sub));
  });
});

describe("source wiring", () => {
  test("every dismiss path remembers the dismissal", () => {
    assert.ok(APP.includes("const dismissScheduleAlerts=()=>"));
    assert.ok(!APP.includes("onClick={()=>setScheduleChangeAlerts([])}"));
    assert.ok(APP.includes('setActive("calendar");dismissScheduleAlerts();'));
  });
  test("Stu shows it when on, plain card when off, nothing during a focus timer", () => {
    assert.ok(APP.includes('scheduleChangeAlerts.length>0&&stuSettingOn("mascotAlerts")&&!timerTask'));
    assert.ok(APP.includes('scheduleChangeAlerts.length>0&&!stuSettingOn("mascotAlerts")'));
    assert.ok(APP.includes('mode="alert"'));
  });
  test("turn-off link and settings row exist", () => {
    assert.ok(APP.includes("Turn off Stu notifications"));
    assert.ok(APP.includes('k="mascotAlerts"'));
    assert.ok(APP.includes("mascotAlerts:true"));
    assert.ok((APP.match(/onTurnOff=\{turnOffStuNotifications\}/g) || []).length >= 4);
  });
});
