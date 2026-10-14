// Stu chat quick-action chips (2026-10-14).
const { test, describe } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const path = require("path");
const { loadStudlinModule } = require("./harness.js");

const SOURCE = fs.readFileSync(path.join(__dirname, "..", "studlin-app.jsx"), "utf8").replace(/\r\n/g, "\n");
const { studlinAiChipsFor } = loadStudlinModule({ now: "2026-10-14T09:00:00" });
const ids = (b) => studlinAiChipsFor(b).map((c) => c.id).join(",");

describe("chip set", () => {
  test("catch-up chip only when catchUpBanner is non-null", () => {
    assert.equal(ids(null), "brainDump,move,free,findTime");
    assert.equal(ids({ count: 3 }), "brainDump,catchUp,move,free,findTime");
  });
  test("catch-up label is Reschedule it for one item, Rebuild my week otherwise", () => {
    const l = (b) => studlinAiChipsFor(b).find((c) => c.id === "catchUp").label;
    assert.equal(l({ count: 1 }), "Reschedule it");
    assert.equal(l({ count: 4 }), "Rebuild my week");
  });
  test("prefill chips carry text and no em dashes anywhere", () => {
    const chips = studlinAiChipsFor({ count: 2 });
    assert.equal(chips.find((c) => c.id === "move").prefill, "Push everything back ");
    assert.equal(chips.find((c) => c.id === "free").prefill, "Which of these times work for me: ");
    assert.equal(chips.find((c) => c.id === "findTime").prefill, "Find me time for ");
    assert.ok(!JSON.stringify(chips).includes("—"));
  });
});

describe("source guards", () => {
  const start = SOURCE.indexOf("function openStuCalendarTool");
  const end = SOURCE.indexOf("// Derives the live \"who else is locked in\"");
  const drawer = SOURCE.slice(start, end);
  const tap = drawer.slice(drawer.indexOf("const tapChip="), drawer.indexOf("const sendBrainDump="));

  test("prefill chips fill the input and never call send", () => {
    const prefill = tap.slice(0, tap.indexOf('if(chip.kind==="catchup")'));
    assert.ok(prefill.includes("setInput(chip.prefill)"));
    assert.ok(!prefill.includes("send("));
  });
  test("free users get paywall before any navigation", () => {
    assert.ok(tap.indexOf("canUseBrainDump()") < tap.indexOf("setBdMode(true)"));
    assert.ok(/brainDumpPaywall=\(\)=>\{\s*setPricingOpen\(/.test(drawer));
    assert.ok(drawer.includes('kind:"paywall"'));
    const sb = drawer.slice(drawer.indexOf("const sendBrainDump="));
    assert.ok(sb.indexOf("canUseBrainDump()") < sb.indexOf("openStuCalendarTool("));
  });
  test("catch-up chip closes drawer then opens the preview", () => {
    assert.ok(/onClose\(\);\s*onOpenCatchUp\(\);/.test(tap));
  });
  test("brain dump mode bypasses the classifier and never records usage itself", () => {
    const send = drawer.slice(drawer.indexOf("const send=async()=>{"));
    assert.ok(send.indexOf("if(bdMode){sendBrainDump(text);return;}") < send.indexOf("classifyStudlinAiMessage("));
    assert.ok(!drawer.slice(drawer.indexOf("const tapChip="), drawer.indexOf("const send=async()=>{")).includes("recordBrainDump("));
  });
  test("bridge writes flag + event and CalendarTab consumes both", () => {
    assert.ok(/lsSet\("pendingCalendarTool",tool\);\s*setActive\("calendar"\);/.test(drawer));
    assert.ok(drawer.includes('"studlin:open-tool"'));
    assert.ok(SOURCE.includes('lsGet("pendingCalendarTool",null)'));
    assert.ok(SOURCE.includes('addEventListener("studlin:open-tool"'));
    assert.ok(SOURCE.includes('removeItem("studlin-pendingCalendarTool")'));
  });
  test("App passes the new props", () => {
    assert.ok(SOURCE.includes("catchUpBanner={catchUpBanner} onOpenCatchUp={openCatchUpPreview}"));
  });
});
