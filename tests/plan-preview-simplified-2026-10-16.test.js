// 2026-10-16: the study plan preview is one summary line plus chips, with the
// long reasoning hidden behind a "Why?" link.
const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const path = require("path");
const APP = fs.readFileSync(path.join(__dirname, "..", "studlin-app.jsx"), "utf8").replace(/\r\n/g, "\n");
const start = APP.indexOf("the preview used to stack five text boxes");
const block = APP.slice(start, start + 6500);

test("summary line and chips replace the stacked text boxes", () => {
  assert.ok(start > 0);
  assert.ok(block.includes('" min each"'));
  assert.ok(block.includes("chips.push("));
  assert.ok(!APP.includes('>Why this plan</div>'));
  assert.ok(!APP.includes("will also be generated."));
  assert.ok(!APP.includes("No material yet, so these are general review blocks"));
});
test("reasoning is still available behind a Why? toggle", () => {
  assert.ok(block.includes('buildPlanWhyOpen?"Hide":"Why?"'));
  assert.ok(block.includes("studyPlanReasoning("));
  assert.ok(APP.includes("const [buildPlanWhyOpen,setBuildPlanWhyOpen]=useState(false);"));
});
test("no em dashes in the new copy", () => {
  assert.ok(!block.includes("—"));
});
