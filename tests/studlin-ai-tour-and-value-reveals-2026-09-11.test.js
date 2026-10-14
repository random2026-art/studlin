// User request, 2026-09-11 ("PLEASE PAY ATTENTION... this will make our
// users love it"): a post-onboarding "dopamine rush" moment showing off
// Add Task AND Studlin AI, a one-time reveal explaining that Studlin
// quietly learns the student over time (real assignment durations via
// Attack Block, real peak-productivity hours), and an interactive first-
// visit guide in Studlin Prep pointing at a real exam instead of a static
// paragraph. Explicitly asked for a "hardening pass" on Studlin AI's
// question-routing before promoting it this confidently.
//
// routeStudlinAiQuestion/shouldShowLearnsYouReveal/shouldShowPrepGuide are
// real, exported, pure(ish) functions -- tested with real invocations.
// The tour step/bubble id/Dashboard card/Prep guide wiring are component-
// closure UI, so those are source-level regression guards, same mixed-
// coverage convention this session has used throughout. Run with
// `npm test`.
const { test, describe } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const path = require("path");
const { loadStudlinModule } = require("./harness.js");

const SOURCE = fs.readFileSync(path.join(__dirname, "..", "studlin-app.jsx"), "utf8");

describe("Studlin AI hardening pass: routeStudlinAiQuestion against a battery of realistic phrasings", () => {
  test("previously-missed attack-risk phrasings now route correctly (the actual gaps found before hardening)", () => {
    const { routeStudlinAiQuestion } = loadStudlinModule({ now: "2026-09-11T09:00:00" });
    assert.equal(routeStudlinAiQuestion("Am I going to run out of time for my paper?", []).needsAttackRisk, true);
    assert.equal(routeStudlinAiQuestion("I think this assignment won't be done by the deadline", []).needsAttackRisk, true);
    assert.equal(routeStudlinAiQuestion("I'm not going to finish this in time", []).needsAttackRisk, true);
  });

  test("the original exact phrasings still route correctly (this hardening pass is additive, not a rewrite)", () => {
    const { routeStudlinAiQuestion } = loadStudlinModule({ now: "2026-09-11T09:00:00" });
    assert.equal(routeStudlinAiQuestion("I'm running out of time", []).needsAttackRisk, true);
    assert.equal(routeStudlinAiQuestion("I won't finish this", []).needsAttackRisk, true);
  });

  test("a battery of other realistic questions each route to a real, non-empty signal", () => {
    const { routeStudlinAiQuestion } = loadStudlinModule({ now: "2026-09-11T09:00:00" });
    assert.equal(routeStudlinAiQuestion("What's my busiest day this week?", []).needsWorkload, true);
    assert.equal(routeStudlinAiQuestion("Am I behind on anything?", []).needsOverdue, true);
    assert.equal(routeStudlinAiQuestion("Am I on track with everything?", []).needsPace, true);
    assert.equal(routeStudlinAiQuestion("When am I most productive?", []).needsPeakHours, true);
    assert.equal(routeStudlinAiQuestion("How long does homework usually take me?", []).needsDuration, true);
  });

  test("a genuinely unrecognized question still falls back to a real answer (workload+overdue), never an empty digest", () => {
    const { routeStudlinAiQuestion } = loadStudlinModule({ now: "2026-09-11T09:00:00" });
    const flags = routeStudlinAiQuestion("What's up with everything", []);
    assert.equal(flags.needsWorkload, true);
    assert.equal(flags.needsOverdue, true);
  });
});

describe("shouldShowLearnsYouReveal: only true a few real days in, with real activity behind it", () => {
  test("false with no onboarding-finished timestamp at all", () => {
    const { shouldShowLearnsYouReveal } = loadStudlinModule({ now: "2026-09-11T09:00:00" });
    assert.equal(shouldShowLearnsYouReveal(), false);
  });

  test("false when onboarding finished too recently, even with real activity", () => {
    const { shouldShowLearnsYouReveal, lsSet } = loadStudlinModule({ now: "2026-09-11T09:00:00" });
    lsSet("onboardingFinishedAt", new Date("2026-09-11T08:00:00").getTime());
    lsSet("sessions", [{ m: 25 }]);
    assert.equal(shouldShowLearnsYouReveal(), false);
  });

  test("false once enough days have passed but there's still zero real activity -- the claim wouldn't be true yet", () => {
    const { shouldShowLearnsYouReveal, lsSet } = loadStudlinModule({ now: "2026-09-11T09:00:00" });
    lsSet("onboardingFinishedAt", new Date("2026-09-01T09:00:00").getTime());
    assert.equal(shouldShowLearnsYouReveal(), false);
  });

  test("true once enough days have passed AND real activity exists (a completed session)", () => {
    const { shouldShowLearnsYouReveal, lsSet } = loadStudlinModule({ now: "2026-09-11T09:00:00" });
    lsSet("onboardingFinishedAt", new Date("2026-09-01T09:00:00").getTime());
    lsSet("sessions", [{ m: 25 }]);
    assert.equal(shouldShowLearnsYouReveal(), true);
  });

  test("real activity via a completed event (not just a focus-timer session) also counts", () => {
    const { shouldShowLearnsYouReveal, lsSet } = loadStudlinModule({ now: "2026-09-11T09:00:00" });
    lsSet("onboardingFinishedAt", new Date("2026-09-01T09:00:00").getTime());
    lsSet("events", [{ id: "1", status: "done" }]);
    assert.equal(shouldShowLearnsYouReveal(), true);
  });

  test("false once already dismissed, even if every other condition is met", () => {
    const { shouldShowLearnsYouReveal, dismissLearnsYouReveal, lsSet } = loadStudlinModule({ now: "2026-09-11T09:00:00" });
    lsSet("onboardingFinishedAt", new Date("2026-09-01T09:00:00").getTime());
    lsSet("sessions", [{ m: 25 }]);
    dismissLearnsYouReveal();
    assert.equal(shouldShowLearnsYouReveal(), false);
  });
});

describe("shouldShowPrepGuide: one-time, dismissible", () => {
  test("true by default, false after dismissing", () => {
    const { shouldShowPrepGuide, dismissPrepGuide } = loadStudlinModule({ now: "2026-09-11T09:00:00" });
    assert.equal(shouldShowPrepGuide(), true);
    dismissPrepGuide();
    assert.equal(shouldShowPrepGuide(), false);
  });
});

describe("Source-level regression guards: the post-onboarding tour's 3rd step (Studlin AI)", () => {
  test("TourStep supports targeting by a stable DOM id (targetSelector), not just a same-tree ref", () => {
    const idx = SOURCE.indexOf("function TourStep(");
    assert.ok(idx > -1);
    const body = SOURCE.slice(idx, idx + 1200);
    assert.ok(body.includes("targetSelector"), "must accept a targetSelector prop");
    assert.ok(body.includes("document.querySelector(targetSelector)"), "must resolve it via the DOM, not a React ref");
  });

  test("the callout flips ABOVE a target sitting near the bottom of the viewport (the AI bubble), instead of always rendering below it", () => {
    const idx = SOURCE.indexOf("function TourStep(");
    const body = SOURCE.slice(idx, idx + 2200);
    assert.ok(body.includes("const isBottom"), "must detect a bottom-anchored target");
    assert.ok(body.includes('bottom:Math.max(16, vh-rect.top+16)'), "must flip to bottom-anchored positioning for it");
  });

  test("CAL_TOUR_STEPS has a 3rd step targeting the Studlin AI bubble by id", () => {
    const idx = SOURCE.indexOf("const CAL_TOUR_STEPS=[");
    assert.ok(idx > -1);
    const body = SOURCE.slice(idx, idx + 900);
    assert.ok(body.includes('targetSelector:"#studlin-ai-bubble"'));
    assert.ok(body.includes("Ask Stu anything"));
  });

  test("StudlinAiBubble's real button carries that exact id", () => {
    const idx = SOURCE.indexOf("function StudlinAiBubble(");
    assert.ok(idx > -1);
    const body = SOURCE.slice(idx, idx + 1600);
    assert.ok(body.includes('id="studlin-ai-bubble"'));
  });
});

describe("Source-level regression guards: Dashboard's one-time 'Studlin is learning you' reveal", () => {
  test("finishClassSetup stamps onboardingFinishedAt exactly once, never overwriting a real prior value", () => {
    const idx = SOURCE.indexOf("const finishClassSetup=(newIds)=>{");
    assert.ok(idx > -1);
    const body = SOURCE.slice(idx, idx + 1300);
    assert.ok(body.includes('if(!lsGet("onboardingFinishedAt",null))lsSet("onboardingFinishedAt",Date.now());'));
  });

  test("Dashboard renders the reveal card gated on shouldShowLearnsYouReveal, with a real dismiss action", () => {
    const idx = SOURCE.indexOf("function Dashboard(");
    assert.ok(idx > -1);
    // Window widened (18000->24000), 2026-09-30: the new setup-progress
    // checklist's state block sits between this reveal card's own state and
    // its JSX, pushing the JSX (and this string) further from the function
    // start.
    const body = SOURCE.slice(idx, idx + 24000);
    assert.ok(body.includes("useState(()=>shouldShowLearnsYouReveal())"));
    assert.ok(body.includes("Studlin's been paying attention"));
    assert.ok(body.includes("closeLearnsYouReveal"));
  });
});

describe("Source-level regression guards: Studlin Prep's interactive first-visit guide", () => {
  test("guide is gated on the Exams tab having at least one real exam, not shown over the empty state", () => {
    const idx = SOURCE.indexOf("function StudlinPrep(");
    assert.ok(idx > -1);
    // Window kept generous on purpose (not just enough to cover today's
    // offset) -- this is a big component that keeps growing, and a tight
    // window just means the next unrelated addition earlier in the
    // function trips this same false failure again.
    const body = SOURCE.slice(idx, idx + 120000);
    const guideIdx = body.indexOf('prepGuideOpen&&tab==="exams"');
    assert.ok(guideIdx > -1, "the guide render should exist somewhere in StudlinPrep");
    const guideBody = body.slice(guideIdx, guideIdx + 500);
    assert.ok(guideBody.includes("visibleExams.length>0"), "must require a real exam to point at");
    assert.ok(guideBody.includes("targetRef={firstExamRowRef}"));
    assert.ok(guideBody.includes("build a real study plan"));
  });

  test("the first exam row (only) carries the ref the guide points at", () => {
    const idx = SOURCE.indexOf("visibleExams.map((ex,exIdx)=>{");
    assert.ok(idx > -1, "the map must have an index to identify the first row");
    const body = SOURCE.slice(idx, idx + 900);
    assert.ok(body.includes("ref={exIdx===0?firstExamRowRef:null}"));
  });

  test("clicking into an exam (the successful outcome) dismisses the guide too, not just its own Skip/Done buttons", () => {
    const idx = SOURCE.indexOf("const viewPlan=(ex)=>{");
    assert.ok(idx > -1);
    const body = SOURCE.slice(idx, idx + 200);
    assert.ok(body.includes("if(prepGuideOpen)closePrepGuide();"));
  });
});
