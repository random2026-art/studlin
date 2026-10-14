// Calendar surfaces consume the Looks theme tokens; Classic defaults make them no-ops.
const { test, describe, beforeEach } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const path = require("path");
const { loadStudlinModule } = require("./harness.js");

const m = loadStudlinModule();
const SRC = fs.readFileSync(path.join(__dirname, "..", "studlin-app.jsx"), "utf8");
function region(startMarker, endMarker) {
  const a = SRC.indexOf(startMarker);
  assert.ok(a >= 0, "missing " + startMarker);
  const b = SRC.indexOf(endMarker, a + startMarker.length);
  assert.ok(b > a, "missing end " + endMarker);
  return SRC.slice(a, b);
}
const WEEKLY = region("function WeeklyPlanner(", "const wizardChipStyle");
const DAYPLANNER = region("function DayPlanner(", "function DayPreviewModal(");
const PREVIEW = region("function DayPreviewModal(", "Hour gridlines: solid");
const TOOLBAR = region("function calTbSoft()", "{calView===\"monthly\"&&(");
const MONTH = region("{calView===\"monthly\"&&(", "{calView===\"weekly\"&&(");

beforeEach(() => m.setLook({ palette: "classic", blockStyle: "soft", perClass: {}, seed: 0, accentFollows: true }));

describe("looks calendar surfaces: source reads tokens", () => {
  test("WeeklyPlanner header row", () => {
    const hdr = WEEKLY.slice(WEEKLY.indexOf('data-wk-hdr="1"'));
    assert.match(hdr.slice(0, 200), /background:T\.hdrBg/);
    assert.match(hdr.slice(0, 200), /T\.borderTint/);
    assert.match(hdr, /color:T\.hdrText/);
    assert.match(hdr, /isToday\?T\.todayBg/);
    assert.match(hdr, /isToday\?T\.todayText/);
    assert.match(hdr, /isSel\?T\.accentSoft/);
    assert.match(WEEKLY, /T\.lookOn\?T\.borderTint:T\.borderHover/);
  });
  test("DayPlanner tint, grid lines and now-line accent", () => {
    assert.match(DAYPLANNER, /T\.lookOn&&isToday\?\{background:T\.accentSoft/);
    assert.match(DAYPLANNER, /T\.lookOn\?T\.borderTint:T\.borderHover/);
    assert.match(DAYPLANNER, /T\.lookOn\?T\.lime:"#E5484D"/);
  });
  test("DayPreviewModal header band", () => {
    assert.match(PREVIEW, /data-daypreview-hdr/);
    assert.match(PREVIEW, /background:T\.hdrBg,color:T\.hdrText/);
  });
  test("CalendarTab toolbar uses soft tinted treatment and accent segmented fill", () => {
    assert.match(TOOLBAR, /T\.accentSoft/);
    assert.match(TOOLBAR, /T\.accentInk/);
    assert.match(TOOLBAR, /T\.borderTint/);
    assert.match(TOOLBAR, /lookTextOnFill\(T\.lime\)/);
    assert.ok((TOOLBAR.match(/calTbSoft\(\)/g) || []).length >= 5, "nav, customize, tools use calTbSoft");
    assert.match(TOOLBAR, /Icon\.undo/);
  });
  test("Month view header, today, out-of-month, chips", () => {
    assert.match(MONTH, /color:T\.hdrText/);
    assert.match(MONTH, /background:T\.hdrBg/);
    assert.match(MONTH, /isToday\?T\.todayBg/);
    assert.match(MONTH, /isToday\?T\.todayText/);
    assert.match(MONTH, /c\.out\?T\.tint/);
    assert.match(MONTH, /T\.chipBg/);
    assert.match(MONTH, /T\.accentInk/);
  });
  test("new preview band copy has no em dash", () => {
    const band = PREVIEW.slice(PREVIEW.indexOf("data-daypreview-hdr"), PREVIEW.indexOf("data-daypreview-hdr") + 400);
    assert.equal(/—/.test(band), false);
  });
});

describe("looks calendar surfaces: Classic is a no-op", () => {
  for (const mode of ["light", "dark"]) {
    test("Classic tokens equal legacy values in " + mode, () => {
      m.applyTheme(mode, "Lime", "Comfortable");
      assert.equal(m.T.lookOn, false);
      assert.equal(m.T.hdrBg, m.T.card);
      assert.equal(m.T.hdrText, m.T.muted);
      assert.equal(m.T.accentSoft, m.T.card2);
      assert.equal(m.T.borderTint, m.T.border);
      assert.equal(m.T.todayBg, m.T.lime);
      assert.equal(m.T.todayText, m.T.ink);
      assert.equal(m.T.chipBg, m.T.card2);
    });
    test("non-classic palettes switch lookOn and change header tokens in " + mode, () => {
      m.setLook({ palette: "sunset" });
      m.applyTheme(mode, "Lime", "Comfortable");
      assert.equal(m.T.lookOn, true);
      assert.notEqual(m.T.hdrBg, m.T.card);
      assert.notEqual(m.T.accentSoft, m.T.card2);
      assert.notEqual(m.T.hdrText, m.T.muted);
    });
  }
});
