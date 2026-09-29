// User decisions, 2026-09-09:
// 1. Onboarding's "How do you want to add it?" step offered "Scan my whole
//    schedule" and "Scan a syllabus" as equal parallel choices even before
//    a single class existed -- user chose "whole schedule first, syllabus
//    per-class after" out of the tradeoffs offered. "Scan a syllabus" now
//    only appears once at least one class already exists this session.
// 2. The missing-syllabus nudge in the Courses sidebar used to sit
//    permanently until manually dismissed -- user wants it a "one time
//    thing". Converted to an auto-dismissing floating toast (needSyllabusCount
//    effect + its own fixed-position render), reusing the existing 3-day
//    cooldown so a genuinely new unscanned class still gets a fresh nudge
//    later rather than being silenced forever.
//
// Source-level regression guards (component-closure UI) -- same
// mixed-coverage convention this session uses elsewhere. Run with `npm test`.
const { test, describe } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const path = require("path");

const SOURCE = fs.readFileSync(path.join(__dirname, "..", "studlin-app.jsx"), "utf8");

describe("Onboarding: 'Scan a syllabus' only appears once at least one class already exists", () => {
  // 2026-09-29 extension: the same gate now also fires for a RETURNING
  // student's real, already-committed classes (realSubjects.length>0) --
  // not just this session's own pendingClasses/hsClassesCommitted -- so
  // the general Tools-menu "Scan schedule" quick action can offer it too,
  // not only mid-onboarding. Still gated, never unconditional.
  test("the syllabus-scan button is gated on pendingClasses/hsClassesCommitted/realSubjects, not shown unconditionally", () => {
    const idx = SOURCE.indexOf('title="How do you want to add it?"');
    assert.notEqual(idx, -1);
    const body = SOURCE.slice(idx, idx + 6000);
    assert.match(body, /\(pendingClasses\.length>0\|\|hsClassesCommitted>0\|\|realSubjects\.length>0\)&&\(/, "Scan a syllabus must be conditionally rendered on at least one class already existing (this session, or for real)");
    assert.match(body, /Scan my whole schedule/, "Scan my whole schedule must still always be offered up front");
  });
});

describe("Missing-syllabus nudge is a one-time auto-dismissing toast, not a permanent sidebar fixture", () => {
  test("an effect starts an auto-dismiss timer, reusing the existing dismissSyllabusNudge cooldown", () => {
    const idx = SOURCE.indexOf("const needSyllabusCount=currentTermSubjects.filter(s=>s.needsSyllabus).length;");
    assert.notEqual(idx, -1);
    const body = SOURCE.slice(idx, idx + 500);
    assert.match(body, /setTimeout\(\(\)=>\{dismissSyllabusNudge\(\);setSyllabusNudgeDismissed\(true\);\},8000\)/);
    assert.match(body, /shouldShowSyllabusNudge\(\)/);
  });

  test("the nudge renders as a position:fixed toast now, not inline above the Courses list", () => {
    const idx = SOURCE.indexOf("needSyllabusCount>0&&!syllabusNudgeDismissed&&shouldShowSyllabusNudge()&&(");
    assert.notEqual(idx, -1);
    const body = SOURCE.slice(idx, idx + 300);
    assert.match(body, /position:"fixed"/);
  });

  test("the old inline sidebar block is gone", () => {
    assert.doesNotMatch(SOURCE, /const needSyllabus=currentTermSubjects\.filter\(s=>s\.needsSyllabus\);/, "the old per-render inline IIFE computing this must be removed, not left as dead duplicate logic");
  });
});
