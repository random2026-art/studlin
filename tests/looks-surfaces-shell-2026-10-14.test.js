// Looks palette tokens reach the app shell (nav, toasts), Prep, Notes, Routine center, and Stu.
const { test, describe, beforeEach } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const path = require("path");
const { loadStudlinModule } = require("./harness.js");

const m = loadStudlinModule();
const SRC = fs.readFileSync(path.join(__dirname, "..", "studlin-app.jsx"), "utf8");
const grab = (a, len) => { const i = SRC.indexOf(a); assert.ok(i >= 0, "missing: " + a); return SRC.slice(i, i + (len || 1500)); };

function resetLook() { m.setLook({ palette: "classic", blockStyle: "soft", perClass: {}, seed: 0, accentFollows: true }); }
beforeEach(resetLook);

describe("shell: nav and toasts read the palette tokens", () => {
  const nav = grab("const NavItem=({item})=>{", 2600);
  test("active nav item uses accentSoft + accentInk + a 3px accent bar when a palette is on", () => {
    assert.ok(nav.includes("T.lookOn?T.accentSoft"));
    assert.ok(nav.includes("T.lookOn?T.accentInk"));
    assert.ok(nav.includes("inset 3px 0 0 ${T.lime}"));
  });
  test("hover uses the faint tint, only when a palette is on", () => {
    assert.ok(nav.includes("navHover===item.id&&T.lookOn?hexA(T.tint,"));
    assert.ok(nav.includes("onMouseEnter={()=>setNavHover(item.id)}"));
  });
  test("classic nav branches are preserved", () => {
    assert.ok(nav.includes('"rgba(255,255,255,0.95)"'));
    assert.ok(nav.includes("linear-gradient(100deg, ${T.lime}1c"));
  });
  test("palette sidebar background uses the dark hdrText ink (white text stays legible), classic keeps T.surface", () => {
    assert.ok(SRC.includes("backgroundColor:isLight&&T.lookOn?T.hdrText:T.surface"));
    for (const p of m.LOOK_PALETTES.filter((x) => x.id !== "classic")) {
      assert.ok(m.contrastRatio("#FFFFFF", p.theme.light.hdrText) >= 7, p.id + " sidebar ink vs white");
    }
  });
  test("dashToast and bottom-right toasts use accentSoft/accentInk/borderTint when a palette is on", () => {
    const dash = grab("{dashToast&&(", 600);
    assert.ok(dash.includes("T.lookOn?T.accentSoft:T.lime") && dash.includes("T.lookOn?T.accentInk:T.ink") && dash.includes("T.borderTint"));
    const auto = grab('bottomRightSlot==="autoToast"', 600);
    assert.ok(auto.includes("T.lookOn?T.accentSoft:T.teal") && auto.includes("T.accentInk"));
    const batch = grab('bottomRightSlot==="promptBatch"', 500);
    assert.ok(batch.includes("T.lookOn?T.accentSoft:T.card"));
  });
  test("the error toast stays semantic red", () => {
    assert.ok(grab('bottomRightSlot==="error"', 500).includes("background:T.red"));
  });
});

describe("Prep, Notes, Routine read the tokens", () => {
  test("Prep tabs, exam chips and section headers", () => {
    assert.ok(SRC.includes("background:tab===v.id?(T.lookOn?T.hdrBg:T.card)"));
    assert.ok(SRC.includes("color:tab===v.id?(T.lookOn?T.hdrText:T.text)"));
    assert.ok(SRC.includes("T.lookOn?T.chipBg:T.lime+\"14\",color:T.lookOn?T.accentInk:T.lime"));
    assert.ok(SRC.includes("T.lookOn?{background:T.hdrBg,padding:\"6px 10px\",borderRadius:6}:{}"));
  });
  test("Notes selected card uses accentSoft background and the accent border", () => {
    assert.ok(SRC.includes("idx===sel?(T.lookOn?T.accentSoft:T.card2)"));
    assert.ok(SRC.includes("idx===sel?(T.lookOn?T.lime:colorOf(n.tag)+\"55\")"));
  });
  test("Routine day chips use accent tokens", () => {
    assert.ok(SRC.includes("background:sel?(T.lookOn?T.accentSoft:T.lime+\"14\")"));
  });
});

describe("Stu follows the palette accent", () => {
  const pal = (id) => m.LOOK_PALETTES.find((p) => p.id === id);
  test("classic: unchanged, follows the saved accent (default Lime)", () => {
    assert.equal(m.stuPalette().color, m.ACCENTS.Lime.dk.lime);
  });
  test("non-classic with accentFollows: palette dark accent", () => {
    for (const p of m.LOOK_PALETTES.filter((x) => x.id !== "classic")) {
      m.setLook({ palette: p.id });
      assert.equal(m.stuPalette().color, p.theme.dark.accent, p.id);
    }
  });
  test("non-classic with accentFollows false: the saved accent as before", () => {
    m.setLook({ palette: "sunset", accentFollows: false });
    assert.equal(m.stuPalette().color, m.ACCENTS.Lime.dk.lime);
  });
  test("outline and edge are unchanged by a palette", () => {
    m.setLook({ palette: "ocean" });
    assert.equal(m.stuPalette().outline, "#0E1F18");
  });
});
