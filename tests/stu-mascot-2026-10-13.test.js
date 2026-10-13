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
