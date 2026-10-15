// 2026-10-14: Stu UI polish. "+" menu in chat, bubble tap/close motion,
// sleeping Stu, night routine offer. Pure helpers are called for real;
// JSX wiring gets source-string guards (normalized for CRLF).
const { test, describe } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const path = require("path");
const { loadStudlinModule } = require("./harness.js");

const APP = fs.readFileSync(path.join(__dirname, "..", "studlin-app.jsx"), "utf8").replace(/\r\n/g, "\n");
const at = (marker) => { const i = APP.indexOf(marker); assert.notEqual(i, -1, marker + " not found"); return i; };
const drawerSrc = () => APP.slice(at("function StudlinAiDrawer("), at("function StudlinAiDrawer(") + 130000);

describe("sleep window uses only the saved bedtime and wake time", () => {
  const { stuIsSleepWindow } = loadStudlinModule({ now: "2026-10-14T09:00:00" });
  const ws = { sleepTime: "23:00", wakeTime: "07:00" };
  test("asleep late evening and early morning, awake midday", () => {
    assert.equal(stuIsSleepWindow(ws, new Date("2026-10-14T23:30:00")), true);
    assert.equal(stuIsSleepWindow(ws, new Date("2026-10-14T03:00:00")), true);
    assert.equal(stuIsSleepWindow(ws, new Date("2026-10-14T12:00:00")), false);
    assert.equal(stuIsSleepWindow(ws, new Date("2026-10-14T07:00:00")), false);
  });
  test("bedtime after midnight works", () => {
    const late = { sleepTime: "01:00", wakeTime: "09:00" };
    assert.equal(stuIsSleepWindow(late, new Date("2026-10-14T02:00:00")), true);
    assert.equal(stuIsSleepWindow(late, new Date("2026-10-14T22:00:00")), false);
  });
  test("null, missing or equal times never sleep", () => {
    assert.equal(stuIsSleepWindow(null, new Date("2026-10-14T03:00:00")), false);
    assert.equal(stuIsSleepWindow({ sleepTime: "23:00" }, new Date("2026-10-14T03:00:00")), false);
    assert.equal(stuIsSleepWindow({ sleepTime: "07:00", wakeTime: "07:00" }, new Date("2026-10-14T07:00:00")), false);
  });
  test("the setting turns it off", () => {
    const m = loadStudlinModule({ now: "2026-10-14T23:30:00" });
    m.lsSet("wakeSleep", ws);
    assert.equal(m.stuSleepsNow(new Date("2026-10-14T23:30:00")), true);
    m.lsSet("settings", { stuSleeps: false });
    assert.equal(m.stuSleepsNow(new Date("2026-10-14T23:30:00")), false);
  });
});

describe("motion plan: full animation only the first 3 times", () => {
  test("plays 3 times then stops, counter persisted", () => {
    const m = loadStudlinModule({ now: "2026-10-14T09:00:00" });
    assert.equal(m.stuMotionPlan("stuOpenAnims"), true);
    assert.equal(m.stuMotionPlan("stuOpenAnims"), true);
    assert.equal(m.stuMotionPlan("stuOpenAnims"), true);
    assert.equal(m.stuMotionPlan("stuOpenAnims"), false);
    assert.equal(m.lsGet("stuOpenAnims", 0), 3);
    assert.equal(m.stuMotionPlan("stuCloseAnims"), true, "close counter is separate");
  });
});

describe("night routine offer", () => {
  test("eligible with a bedtime, no routine, under 2 dismissals", () => {
    const { stuNightOfferEligible } = loadStudlinModule({ now: "2026-10-14T22:00:00" });
    assert.equal(stuNightOfferEligible(null, [], "23:00"), true);
    assert.equal(stuNightOfferEligible({ count: 1 }, [], "23:00"), true);
  });
  test("stops after two dismissals, with no bedtime, or with an existing night routine", () => {
    const { stuNightOfferEligible } = loadStudlinModule({ now: "2026-10-14T22:00:00" });
    assert.equal(stuNightOfferEligible({ count: 2 }, [], "23:00"), false);
    assert.equal(stuNightOfferEligible(null, [], null), false);
    assert.equal(stuNightOfferEligible(null, [{ title: "Wind down" }], "23:00"), false);
    assert.equal(stuNightOfferEligible(null, [{ title: "Night routine" }], "23:00"), false);
    assert.equal(stuNightOfferEligible(null, [{ title: "Gym" }], "23:00"), true);
  });
  test("dismissals are counted in stuWindDownOffer", () => {
    const m = loadStudlinModule({ now: "2026-10-14T22:00:00" });
    m.stuRecordWindDownDismiss();
    m.stuRecordWindDownDismiss();
    assert.equal(m.lsGet("stuWindDownOffer", null).count, 2);
  });
  test("prefill is 30 minutes before bedtime, 30 minutes long, and clamps near midnight", () => {
    const { stuNightRoutinePrefill } = loadStudlinModule({ now: "2026-10-14T22:00:00" });
    const p = stuNightRoutinePrefill("23:00");
    assert.equal(p.title, "Night routine");
    assert.equal(p.startTime, "22:30");
    assert.equal(p.durationMins, 30);
    const q = stuNightRoutinePrefill("00:10");
    assert.equal(q.startTime, "23:40");
    assert.ok(q.durationMins <= 19);
  });
  test("wiring: button, prefill-only bridge, no auto-add", () => {
    assert.ok(APP.includes("Set a night routine?"));
    assert.ok(APP.includes('kind:"nightRoutine"'));
    const consume = APP.slice(at("if(tool&&tool.kind===\"nightRoutine\")"), at("if(tool&&tool.kind===\"nightRoutine\")") + 700);
    assert.ok(consume.includes("setNewEventOpen(true)"));
    assert.ok(!consume.includes("persistRoutines"));
    assert.ok(APP.includes("initialRepeatAll"));
  });
  test("the 5-minute copy is true: only the first prompt promises a return visit", () => {
    assert.ok(APP.includes('line=firstPrompt?"Okay, 5 more minutes. I\'ll check back once.":"Okay. Sleep well.";'));
    assert.ok(APP.includes('firstPrompt={!String(stuBedtime.id).startsWith("bed2")}'));
  });
});

describe("+ menu in the Stu chat", () => {
  test("the + button is the menu button and keeps Attach material", () => {
    const d = drawerSrc();
    assert.ok(d.includes('aria-label="More actions"'));
    assert.ok(d.includes('aria-haspopup="menu"'));
    assert.ok(d.includes("aria-expanded={plusOpen}"));
    assert.ok(d.includes('aria-label="Attach material"'));
    assert.ok(d.includes('role="menu"'));
  });
  test("items reuse studlinAiChipsFor and tapChip; chips no longer render inline", () => {
    const d = drawerSrc();
    assert.ok(d.includes("studlinAiChipsFor(catchUpBanner).map("));
    assert.ok(d.includes("tapChip(c)"));
    assert.ok(!d.includes("renderStuChips"));
    assert.ok(d.indexOf("const tapChip=") < d.indexOf("const sendBrainDump="));
  });
  test("items are 44px, Escape and outside click close, brain dump pill stays", () => {
    const d = drawerSrc();
    assert.ok(d.includes("minHeight:44,padding:\"10px 14px\""));
    assert.ok(d.includes('e.key==="Escape"'));
    assert.ok(d.includes('document.addEventListener("mousedown",onDown)'));
    assert.ok(d.includes('aria-label="Cancel brain dump"'));
  });
  test("one-time hint is persisted and the empty state points to +", () => {
    const d = drawerSrc();
    assert.ok(d.includes("Quick actions live under +"));
    assert.ok(d.includes("studlin-stuPlusHintSeen"));
    assert.ok(d.includes('lsSet("stuPlusHintSeen",true)'));
    assert.ok(d.includes("Or tap + for quick actions"));
    assert.ok(!d.includes("Or start with one of these."));
  });
  test("iOS fixes: 100dvh with 100vh fallback, safe-area padding, 16px input on mobile", () => {
    assert.ok(APP.includes(".stu-ai-panel{height:100vh;height:100dvh}"));
    assert.ok(APP.includes("calc(12px + env(safe-area-inset-bottom, 0px))"));
    assert.ok(APP.includes(".stu-ai-input{font-size:16px!important}"));
  });
});

describe("bubble motion", () => {
  test("keyframes exist with reduced-motion coverage", () => {
    for (const k of ["stuTug", "stuJumpOut", "stuWake", "stuRider", "stuZz"]) assert.ok(APP.includes("@keyframes " + k), k);
    assert.ok(APP.includes("@media (prefers-reduced-motion:reduce){.stu-tug"));
    assert.ok(APP.includes('body[data-motion="reduce"] .stu-tug'));
  });
  test("motion is skipped under reduced motion or a running timer, and capped at 3", () => {
    const m = APP.slice(at("function stuMotionPlan"), at("function stuMotionPlan") + 300);
    assert.ok(m.includes("n>=3"));
    const allowed = APP.slice(at("const stuMotionAllowed="), at("const stuMotionAllowed=") + 300);
    assert.ok(allowed.includes("timerActive||reduceMotionOn()"));
    assert.ok(allowed.includes("prefers-reduced-motion"));
  });
  test("App effect never delays opening: no timers before the open, companion check on close", () => {
    const e = APP.slice(at("const stuPrevOpenRef="), at("const stuPrevOpenRef=") + 1500);
    assert.ok(e.includes("!stuMotionAllowed(!!timerTask)"));
    assert.ok(e.includes('document.querySelector(".stu-wrap-anim")'));
    assert.ok(e.includes('stuMotionPlan("stuOpenAnims")'));
    assert.ok(e.includes('stuMotionPlan("stuCloseAnims")'));
    assert.ok(e.includes("<450"));
    assert.ok(!e.includes("setStudlinAiOpen"));
  });
  test("rider lives inside the panel and the drawer stays mounted", () => {
    const d = drawerSrc();
    assert.ok(d.indexOf('className="stu-rider"') > d.indexOf('className="stu-ai-panel"'));
    assert.ok(d.includes("pointerEvents:open?\"auto\":\"none\""));
    assert.ok(/<StudlinAiDrawer open=\{studlinAiOpen\}/.test(APP));
  });
});

describe("sleeping Stu", () => {
  test("overlay is pointer-events none so the real button stays tappable", () => {
    const f = APP.slice(at("function StuSleepingFab"), at("function StuSleepingFab") + 900);
    assert.ok(f.includes('pointerEvents:"none"'));
    assert.ok(f.includes('mood="sleepy"'));
  });
  test("asleep is suppressed while chatting or during the bedtime cameo", () => {
    assert.ok(APP.includes("const stuAsleep=!studlinAiOpen&&!stuBedtime&&stuSleepsNow();"));
  });
  test("settings toggle exists and defaults on", () => {
    assert.ok(APP.includes('k="stuSleeps"'));
    assert.ok(APP.includes("mascotBedtime:true,stuSleeps:true"));
  });
  test("no em dashes in the new copy", () => {
    const block = APP.slice(at("// ===== Stu UI polish"), at("const STU_EXIT_MOOD="));
    assert.ok(!block.includes("—"));
    for (const s of ["Stu sleeps at night", "Quick actions live under +", "Set a night routine?"]) assert.ok(!s.includes("—"));
  });
});
