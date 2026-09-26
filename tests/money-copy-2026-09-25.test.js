// Persona audit 2026-09-25 (Wave 2, chunk 10, copy part): Pro AI has real
// monthly limits, so "Unlimited"/"no caps" was untrue. Manual features that
// really are unlimited keep that word.
const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const path = require("path");
const app = fs.readFileSync(path.join(__dirname, "..", "studlin-app.jsx"), "utf8");
const idx = fs.readFileSync(path.join(__dirname, "..", "index.html"), "utf8");

test("Pro AI copy no longer claims unlimited or no cap", () => {
  assert.ok(!app.includes('getPlan()==="Pro"?"Unlimited"'));
  assert.ok(!app.includes('"No monthly cap"'));
  assert.ok(!app.includes("unlimited AI chat"));
  assert.ok(!idx.includes("Everything, no caps."));
  assert.ok(idx.includes("generous monthly limits"));
});
test("the add-card hint is a toast, not a browser alert", () => {
  assert.ok(!app.includes('alert("To add a new card'));
  assert.ok(app.includes('showToast("To add a new card, make any purchase. Your card is saved automatically.")'));
});
test("genuinely unlimited manual features keep the word", () => {
  assert.ok(app.includes('["Manual classes, tasks & calendar","Unlimited"]'));
});
