// User report, 2026-09-16: "when i hit edit... it doesnt save the title."
// Reproduced live on the real deployed app -- Save actually worked every
// time (commit() wrote the real change, onClose() closed the modal right
// after), but with zero visible confirmation, the modal silently vanishing
// reads exactly like "nothing happened, so it must have failed." CLAUDE.md's
// own guardrail already requires this: successful saves get a toast, never
// silence -- this modal's plain-field save path was the one place that
// still violated it (the async exam-material-generation branch already had
// its own toast; an ordinary title/date/etc. edit had none at all).
//
// EventDetailModal is component-closure UI, not a pure exported function --
// source-level regression guard, same established convention every other
// component-closure fix in this session already uses. Run with `npm test`.
const { test, describe } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const path = require("path");

const SOURCE = fs.readFileSync(path.join(__dirname, "..", "studlin-app.jsx"), "utf8");

describe("EventDetailModal's ordinary save now confirms with a toast instead of silently closing", () => {
  test("finishSave calls onToast right before onClose, for every save kind (not just the async exam-material one)", () => {
    const idx = SOURCE.indexOf("const finishSave=(forcedAttackSlot)=>{");
    assert.notEqual(idx, -1);
    // 2026-09-22: the toast now also names any OTHER task rebalanceDay
    // silently reshuffled while saving this one (see rebalanceMovedSuffix) --
    // still unconditional, still "Saved." as its base text, just with an
    // optional appended clause instead of a bare string literal.
    assert.match(SOURCE, /if\(onToast\)onToast\("Saved\."\+rebalanceMovedSuffix\([^)]*\)\);\s*\n\s*onClose\(\);/, "onToast(\"Saved.\"+...) must sit immediately before onClose()");
  });

  test("onToast is still called unconditionally (not gated behind attackPair/newExamSessions, which only control the separate calendar-highlight jump)", () => {
    const finishSaveIdx = SOURCE.indexOf("const finishSave=(forcedAttackSlot)=>{");
    const highlightBlockIdx = SOURCE.indexOf('if(attackPair||newExamSessions.length>0){', finishSaveIdx);
    const toastIdx = SOURCE.indexOf('if(onToast)onToast("Saved."', finishSaveIdx);
    const closeIdx = SOURCE.indexOf('onClose();', finishSaveIdx);
    assert.ok(highlightBlockIdx !== -1 && toastIdx !== -1 && closeIdx !== -1, "all three markers must exist in finishSave");
    // Real ordering check: the highlight-jump if-block, then the toast,
    // then the close -- toast must not be textually INSIDE the
    // highlight-jump block's own { } (which would make it conditional).
    assert.ok(highlightBlockIdx < toastIdx && toastIdx < closeIdx, "expected order: highlight-jump block, then onToast, then onClose");
    const blockToToast = SOURCE.slice(highlightBlockIdx, toastIdx);
    const openBraces = (blockToToast.match(/\{/g) || []).length;
    const closeBraces = (blockToToast.match(/\}/g) || []).length;
    assert.equal(openBraces, closeBraces, "the highlight-jump if-block must be fully closed before onToast -- unbalanced braces would mean onToast is still nested inside it");
  });
});
