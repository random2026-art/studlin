// 2026-10-13: Stu (the corner companion) + the master switch for Studlin's
// proactive suggestions. The user complained Studlin "keeps asking
// questions" (the "morning tasks haven't been sticking" card) with no way to
// turn it off, and asked for a mascot who delivers upcoming-task reminders,
// follows the accent color, and has emotions. Pure helpers are tested with
// real calls; the JSX wiring (component closures) gets source-level guards,
// same mixed-coverage convention used elsewhere in this suite.
const { test, describe } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const path = require("path");
const { loadStudlinModule } = require("./harness.js");

const ROOT = path.join(__dirname, "..");
const APP = fs.readFileSync(path.join(ROOT, "studlin-app.jsx"), "utf8").replace(/\r\n/g, "\n");
const ONB = fs.readFileSync(path.join(ROOT, "onboarding.jsx"), "utf8").replace(/\r\n/g, "\n");

describe("nudgesAllowed: the master switch for suggestions and questions", () => {
  test("defaults to on when the setting was never touched", () => {
    const { nudgesAllowed } = loadStudlinModule({ now: "2026-10-13T09:00:00" });
    assert.equal(nudgesAllowed(), true);
  });
  test("off only when nudgesMaster is explicitly false", () => {
    const { nudgesAllowed, lsSet } = loadStudlinModule({ now: "2026-10-13T09:00:00" });
    lsSet("settings", { nudgesMaster: false });
    assert.equal(nudgesAllowed(), false);
    lsSet("settings", { nudgesMaster: true });
    assert.equal(nudgesAllowed(), true);
  });
  test("when off, the Studlin AI bubble shows no proactive dot either", () => {
    const { deriveStudlinAiProactiveSignal, lsSet } = loadStudlinModule({ now: "2026-10-13T09:00:00" });
    const offer = { strugglingBucket: "morning", suggestedBucket: "midday" };
    assert.equal(deriveStudlinAiProactiveSignal(offer, null, null).kind, "struggling_bucket");
    lsSet("settings", { nudgesMaster: false });
    assert.equal(deriveStudlinAiProactiveSignal(offer, null, null), null);
  });
});

describe("Stu's settings and the daily decline counter", () => {
  test("Stu's settings default to on and only turn off when explicitly false", () => {
    const { stuSettingOn, lsSet } = loadStudlinModule({ now: "2026-10-13T09:00:00" });
    assert.equal(stuSettingOn("mascotReminders"), true);
    lsSet("settings", { mascotReminders: false });
    assert.equal(stuSettingOn("mascotReminders"), false);
    assert.equal(stuSettingOn("mascotCheers"), true);
  });
  test("declines count per day and reset the next day", () => {
    const { stuDeclinesToday, stuRecordDecline, lsSet } = loadStudlinModule({ now: "2026-10-13T09:00:00" });
    assert.equal(stuDeclinesToday(), 0);
    stuRecordDecline();
    stuRecordDecline();
    assert.equal(stuDeclinesToday(), 2);
    lsSet("stuDeclines", { date: "2026-10-12", count: 5 });
    assert.equal(stuDeclinesToday(), 0, "yesterday's declines must not carry over");
  });
});

describe("Stu follows the student's accent color", () => {
  test("defaults to the Lime accent's bright tone with the brand ink outline", () => {
    const { stuPalette } = loadStudlinModule({ now: "2026-10-13T09:00:00" });
    const pal = stuPalette();
    assert.equal(pal.color, "#AECE5E");
    assert.equal(pal.outline, "#0E1F18");
  });
  test("source reads the saved accent and maps it through ACCENTS, so Pink gives pink", () => {
    assert.ok(APP.includes('localStorage.getItem("studlin-accent")'));
    assert.ok(APP.includes("const a=ACCENTS[name]||ACCENTS.Lime;"));
    assert.ok(APP.includes("#E8829E"), "Pink accent must exist for Stu to follow");
  });
});

describe("shared mascot code stays identical in both bundles", () => {
  const grab = (src) => {
    const a = src.indexOf("// ===== STU MASCOT");
    const b = src.indexOf("// ===== END STU MASCOT =====");
    assert.ok(a >= 0 && b > a, "mascot block markers must exist");
    return src.slice(a, b);
  };
  test("studlin-app.jsx and onboarding.jsx carry the exact same StudMascot", () => {
    assert.equal(grab(APP), grab(ONB));
  });
  test("it covers every mood the reminders and onboarding use", () => {
    const block = grab(APP);
    for (const m of ["happy", "waving", "worried", "sad", "celebrating", "proud", "thinking", "sleepy", "excited", "wink"]) {
      assert.ok(block.includes(m + ":"), "missing mood " + m);
    }
  });
  test("it respects reduced motion", () => {
    assert.ok(grab(APP).includes("prefers-reduced-motion"));
  });
});

describe("source-level wiring guards", () => {
  test("all four daily detectors are behind the master switch", () => {
    assert.ok(APP.includes("const strugglingBucket=nudgesAllowed()?detectStrugglingBucket"));
    assert.ok(APP.includes("const unscheduledDueSoon=nudgesAllowed()?detectUnscheduledDueSoon"));
    assert.ok(APP.includes("const peakInsight=(strugglingBucket||!nudgesAllowed())?null:detectPeakHourInsight"));
    assert.ok(APP.includes("if(nudgesAllowed()&&!strugglingBucket&&!peakInsight){"));
  });
  test("questions are behind it too (duration question and post-session check-in)", () => {
    assert.ok(APP.includes("askDurationQuestions===false||!nudgesAllowed()"));
    assert.ok(APP.includes("}else if(nudgesAllowed()){\n        setExamCheckIn(task);"));
  });
  test("each bottom-left suggestion card offers 'Stop showing suggestions like this'", () => {
    const n = APP.split("Stop showing suggestions like this").length - 1;
    assert.equal(n, 3);
    assert.ok(APP.includes("const turnOffNudges=()=>{"));
  });
  test("Settings has the three new switches with on-by-default state", () => {
    for (const k of ["nudgesMaster", "mascotReminders", "mascotCheers"]) {
      assert.ok(APP.includes('k="' + k + '"'), "missing Settings row " + k);
      assert.ok(APP.includes(k + ":true"), "missing default for " + k);
    }
  });
  test("upcoming-task heads-up goes through Stu, with the plain card as the opt-out fallback", () => {
    assert.ok(APP.includes('<StudCompanion key={headsUpEvent.id} mode="ask"'));
    assert.ok(APP.includes('!stuSettingOn("mascotReminders")&&('), "plain card must remain for people who turn Stu off");
    assert.ok(APP.includes("stuDeclinesToday()>=3"), "Stu must stop asking after 3 'not now's in a day");
  });
  test("Stu appears in both onboarding bundles", () => {
    assert.ok(ONB.includes("<StuGreeting step={step} />"));
    assert.ok(APP.includes("STU_WIZARD_LINES"));
    assert.ok(APP.includes('<StudMascot mood="waving" size={60}'));
  });
  test("none of Stu's copy contains an em dash", () => {
    const a = APP.indexOf("// ===== Stu, the corner companion");
    const b = APP.indexOf("// ===== END Stu companion =====");
    assert.ok(!APP.slice(a, b).includes("—"));
    const w = APP.indexOf("const STU_WIZARD_LINES");
    assert.ok(!APP.slice(w, w + 900).includes("—"));
    const o = ONB.indexOf("const STU_RAIL_LINES");
    assert.ok(!ONB.slice(o, o + 400).includes("—"));
  });
});

describe("review fixes (2026-10-13)", () => {
  test("Settings toggles merge over the saved object, so 'Stop showing suggestions' is not undone by a stale snapshot", () => {
    assert.ok(APP.includes('const cur={...t,...lsGet("settings",{})};'));
    assert.ok(APP.includes('window.addEventListener("studlin-settings-changed",sync)'));
    assert.ok(APP.includes('window.dispatchEvent(new Event("studlin-settings-changed"))'));
  });
  test("a cheer only shows if it is fresh, and untitled tasks get a plain 'Nice work!'", () => {
    assert.ok(APP.includes("Date.now()-stuCheer.at<10000"));
    assert.ok(APP.includes('line=title?"Nice work on "+short+"!":"Nice work!";'));
  });
  test("starting a timer clears any pending reminder", () => {
    assert.ok(APP.includes("useEffect(()=>{if(timerTask)setHeadsUpEvent(null);},[timerTask]);"));
  });
  test("Stu honors the in-app Reduce motion setting and stacks above same-tier cards", () => {
    assert.ok(APP.includes('document.body.getAttribute("data-motion")==="reduce"'));
    assert.ok(APP.includes('body[data-motion="reduce"] .stu-root'));
    assert.ok(APP.includes("left,zIndex:999,display:\"flex\",alignItems:\"flex-end\""));
  });
});

describe("Stu bedtime reminder", () => {
  const at = (h, m) => new Date(2026, 9, 13, h, m, 0);
  test("never due when no sleep time was saved", () => {
    const { stuBedtimeDue } = loadStudlinModule({ now: "2026-10-13T22:40:00" });
    assert.equal(stuBedtimeDue(at(22, 40)), false);
  });
  test("due from 30 minutes before bedtime to an hour after, not earlier", () => {
    const { stuBedtimeDue, lsSet } = loadStudlinModule({ now: "2026-10-13T22:40:00" });
    lsSet("wakeSleep", { wakeTime: "07:00", sleepTime: "23:00" });
    assert.equal(stuBedtimeDue(at(22, 20)), false);
    assert.equal(stuBedtimeDue(at(22, 40)), true);
    assert.equal(stuBedtimeDue(at(23, 30)), true);
    assert.equal(stuBedtimeDue(at(0, 30)), false);
  });
  test("handles a bedtime after midnight", () => {
    const { stuBedtimeDue, lsSet } = loadStudlinModule({ now: "2026-10-13T00:40:00" });
    lsSet("wakeSleep", { wakeTime: "09:00", sleepTime: "01:00" });
    assert.equal(stuBedtimeDue(at(0, 40)), true);
    assert.equal(stuBedtimeDue(at(23, 0)), false);
  });
  test("once per night, and off when Stu's bedtime switch or suggestions are off", () => {
    const { stuBedtimeDue, lsSet } = loadStudlinModule({ now: "2026-10-13T22:40:00" });
    lsSet("wakeSleep", { wakeTime: "07:00", sleepTime: "23:00" });
    lsSet("stuBedtimeShown", at(22, 31).getTime());
    assert.equal(stuBedtimeDue(at(22, 40)), false);
    lsSet("stuBedtimeShown", 0);
    lsSet("settings", { mascotBedtime: false });
    assert.equal(stuBedtimeDue(at(22, 40)), false);
    lsSet("settings", { nudgesMaster: false });
    assert.equal(stuBedtimeDue(at(22, 40)), false);
  });
  test("Settings row exists, defaults on, and copy has no em dash", () => {
    assert.ok(APP.includes('k="mascotBedtime"'));
    assert.ok(APP.includes("mascotBedtime:true"));
    const i = APP.indexOf("Getting late. Want to wrap up");
    assert.ok(i > 0 && !APP.slice(i - 200, i + 600).includes("—"));
  });
});
