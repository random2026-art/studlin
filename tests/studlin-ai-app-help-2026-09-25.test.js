// User request, 2026-09-25: "make it so a user can ask studlin ai
// something like 'how do i turn on dark mode' and it cleanly tells them
// how, where to go." Deliberately built as a deterministic keyword match
// against a hand-written, verified answer table (STUDLIN_HELP_ENTRIES) --
// NOT a free-form AI call -- since a model asked to describe Studlin's own
// UI from general/training-data knowledge can hallucinate a setting that
// doesn't exist, exactly the "confident wrong answer" CLAUDE.md's
// Certainty Policy says is worse than no answer. Same "bounded matching
// problem, not a model call" precedent routeStudlinAiQuestion already
// established in this file. Free for every plan (no Pro gate, no credit
// cost) since this is product support, not a premium AI feature.
//
// Mixed coverage: matchStudlinHelpEntry/scoreHelpEntry are real, exported,
// pure functions, tested with real invocations. The classifier prompt
// and drawer wiring are source-level regression guards, same convention
// this file's siblings already use. Run with `npm test`.
const { test, describe } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const path = require("path");
const { loadStudlinModule } = require("./harness.js");

const SOURCE = fs.readFileSync(path.join(__dirname, "..", "studlin-app.jsx"), "utf8");

describe("matchStudlinHelpEntry: real invocations against the verified answer table", () => {
  test("\"how do i turn on dark mode\" matches the theme entry, not something unrelated", () => {
    const m = loadStudlinModule();
    const entry = m.matchStudlinHelpEntry("how do i turn on dark mode");
    assert.ok(entry, "must find a match");
    assert.equal(entry.id, "theme");
  });

  test("the exact user-named example (\"stop telling me this is overdue\") matches the deadline-alerts entry, and its answer is honest about the two different real things this could mean", () => {
    const m = loadStudlinModule();
    const entry = m.matchStudlinHelpEntry("how do i stop studlin telling me this is overdue");
    assert.ok(entry);
    assert.equal(entry.id, "deadline-notifications");
    assert.match(entry.answer, /Deadline alerts/, "must name the real toggle");
    assert.match(entry.answer, /no toggle/, "must be honest that the visual overdue indicator itself has no off-switch, not imply one exists");
  });

  test("a message with no real match returns null rather than a weak guess -- Certainty Policy: say so plainly, never guess", () => {
    const m = loadStudlinModule();
    const entry = m.matchStudlinHelpEntry("what is the capital of France");
    assert.equal(entry, null);
  });

  test("a genuine schedule question (not app help) also finds no entry -- the table shouldn't accidentally swallow unrelated messages", () => {
    const m = loadStudlinModule();
    const entry = m.matchStudlinHelpEntry("which day next week is busiest");
    assert.equal(entry, null);
  });

  test("scoreHelpEntry weights a longer, more specific phrase match higher than a single generic word -- prevents an unrelated entry from outscoring the real one", () => {
    const m = loadStudlinModule();
    const entry = m.STUDLIN_HELP_ENTRIES.find(e => e.id === "deadline-notifications");
    const specific = m.scoreHelpEntry("turn off deadline alert", entry);
    const generic = m.scoreHelpEntry("notification", entry);
    assert.ok(specific > generic, "the multi-word phrase match must score higher than a lone generic word");
  });

  test("the Google unverified-app entry gives the real, code-confirmed workaround, not a vague 'check your settings'", () => {
    const m = loadStudlinModule();
    const entry = m.matchStudlinHelpEntry("google calendar unverified app warning");
    assert.ok(entry);
    assert.equal(entry.id, "google-unverified");
    assert.match(entry.answer, /Calendar or work schedule/);
  });

  test("the Weekly Wrapped entry only claims what's verified: the toggle gates the in-app popup (isWrappedWindow reads settings.wrapped). It must NOT claim an email -- nothing in api/ sends a Weekly Wrapped email (persona audit, 2026-09-25)", () => {
    const m = loadStudlinModule();
    const entry = m.matchStudlinHelpEntry("turn off weekly wrapped");
    assert.ok(entry);
    assert.equal(entry.id, "weekly-wrapped");
    assert.match(entry.answer, /popup/);
    // "Email" also appears in the real Settings path (Notifications -> Email
    // -> ...), so strip the path before checking the claim itself.
    const claim = entry.answer.replace("Notifications → Email →", "");
    assert.doesNotMatch(claim, /email/i, "no server code sends this email, so the answer must not promise it");
  });

  test("'turn off notifications' points at the real master switch (notifMaster), not the narrow Deadline-alerts toggle (persona audit)", () => {
    const m = loadStudlinModule();
    const entry = m.matchStudlinHelpEntry("how do i turn off notifications");
    assert.ok(entry);
    assert.equal(entry.id, "notifications-master");
    assert.match(entry.answer, /Task & App Notifications/);
    // ...while the overdue phrasing must still reach the Deadline-alerts answer.
    assert.equal(m.matchStudlinHelpEntry("how do i stop studlin telling me this is overdue").id, "deadline-notifications");
  });

  test("the overdue answer describes the red dot correctly: it marks a block scheduled AFTER its own due date, not a missed one", () => {
    const m = loadStudlinModule();
    const entry = m.matchStudlinHelpEntry("how do i stop studlin telling me this is overdue");
    assert.ok(entry);
    assert.match(entry.answer, /scheduled after its own due date/);
  });

  test("the task-kinds entry, sourced directly from classifyStudlinAiMessage's own taskKind rules (not re-guessed)", () => {
    const m = loadStudlinModule();
    const entry = m.matchStudlinHelpEntry("what's the difference between a task and an event");
    assert.ok(entry);
    assert.equal(entry.id, "task-kinds");
  });
});

describe("StudlinAiDrawer: app_help is wired into both the classifier and the dispatch", () => {
  test("the classifier's kind enum includes app_help alongside question/coaching", () => {
    const idx = SOURCE.indexOf('"{\\"kind\\":\\"question\\"|\\"coaching\\"|\\"app_help\\"');
    assert.notEqual(idx, -1, "the JSON schema string must list app_help in the kind enum");
  });

  test("send() dispatches kind===\"app_help\" to answerAppHelp", () => {
    const idx = SOURCE.indexOf('if(parsed.kind==="question")await askQuestion(text,history);');
    assert.notEqual(idx, -1);
    const body = SOURCE.slice(idx, idx + 400);
    assert.match(body, /else if\(parsed\.kind==="app_help"\)await answerAppHelp\(text\);/);
  });

  test("answerAppHelp has no canUseStudlinAiQna Pro gate -- this is free product support, not a premium capability", () => {
    const idx = SOURCE.indexOf("const answerAppHelp=async(text)=>{");
    assert.notEqual(idx, -1);
    const body = SOURCE.slice(idx, idx + 500);
    assert.doesNotMatch(body, /canUseStudlinAiQna/, "must not gate this behind Pro");
    assert.doesNotMatch(body, /authFetch\(.\/api\/chat/, "must not make a real API call -- local match only");
  });

  test("help message kind gets its own accent color in the drawer's per-kind styling map", () => {
    assert.match(SOURCE, /STUDLIN_AI_MSG_KIND_ACCENT=\{[^}]*help:T\.teal/);
  });

  test("the classifier's response validator accepts app_help -- it was missing, so every classifier-returned app_help was downgraded to unsupported (persona audit)", () => {
    assert.ok(SOURCE.includes('["question","coaching","app_help","action","multi_action","availability_match","unsupported"].includes(parsed.kind)'), "the client-side validator must list app_help, same as the classifier prompt's own kind enum");
  });

  test("a 402 from the classifier shows the upgrade prompt, not 'Couldn't reach Studlin AI. Check your connection' (persona audit)", () => {
    assert.match(SOURCE, /if\(!res\.ok\)\{const err=new Error\(data\.error\|\|"classify-failed"\);err\.status=res\.status;throw err;\}/);
    const idx = SOURCE.indexOf("parsed=await classifyStudlinAiMessage(text,history);");
    assert.notEqual(idx, -1);
    const body = SOURCE.slice(idx, idx + 900);
    assert.match(body, /e&&e\.status===402/);
    assert.match(body, /kind:"paywall"/);
  });

  test("send() checks matchStudlinHelpEntry BEFORE calling the Pro-gated classifier, not after -- so a Free student can get app help without ever hitting the paywall", () => {
    const idx = SOURCE.indexOf("const preMatch=matchStudlinHelpEntry(text,2);");
    assert.notEqual(idx, -1);
    const classifyIdx = SOURCE.indexOf("parsed=await classifyStudlinAiMessage(text,history);");
    assert.ok(idx < classifyIdx, "the local pre-check must run before the real AI classification call");
  });
});

describe("The pre-classification check (minScore=2) can't misfire on a real schedule question or action", () => {
  test("a bare single-word match ('overdue' alone) does NOT meet the minScore=2 threshold -- only a real multi-word phrase can skip classification", () => {
    const m = loadStudlinModule();
    const looseMatch = m.matchStudlinHelpEntry("what's overdue", 1);
    const strictMatch = m.matchStudlinHelpEntry("what's overdue", 2);
    assert.ok(looseMatch, "the word 'overdue' alone should still score under the default/loose threshold");
    assert.equal(strictMatch, null, "but must NOT be confident enough to skip real classification -- 'what's overdue' is a genuine schedule question, not app help");
  });

  test("'set my peak hours to evening' (a real, already-supported action) is not hijacked by the study-hours entry", () => {
    const m = loadStudlinModule();
    const entry = m.matchStudlinHelpEntry("set my peak hours to evening", 2);
    assert.equal(entry, null, "peak hours/focus hours were deliberately removed as bare keywords from study-hours specifically to avoid this collision -- see that entry's own comment");
  });

  test("a genuine app_help question about peak hours still works, phrased as a question rather than a command", () => {
    const m = loadStudlinModule();
    const entry = m.matchStudlinHelpEntry("where are my peak hours", 2);
    assert.ok(entry);
    assert.equal(entry.id, "study-hours");
  });
});
