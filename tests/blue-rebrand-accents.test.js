// experiment/blue-rebrand (2026-09-15): cofounder research says blue reads
// as "trust + studying" to students, green doesn't. This branch adds three
// new blue accent options (Cobalt/Ocean/Denim) to the existing ACCENTS
// system rather than inventing a new theming mechanism -- same
// dk/lt-pair shape every existing accent already uses (see
// tests/pink-slate-accents.test.js for the precedent this mirrors).
//
// Deliberately NOT reusing the existing "Sky" accent for this -- Sky's own
// values sit almost on top of the separate T.blue token already used
// throughout the app for comments/subject-color tags/notification
// highlights, which would make the brand accent visually indistinguishable
// from unrelated blue content. Verified below that all three new accents
// sit at a real color distance from T.blue.
//
// Also verifies the branch-only default-accent flip without disturbing the
// existing "reset5" migration or the unrecognized-accent-falls-back-to-Lime
// safety net from pink-slate-accents.test.js. The default flipped three
// times on this branch, each round driven by direct user feedback:
//   1. Cobalt (module-level applyTheme() call + one-time "reset6" migration)
//   2. Indigo (2026-09-16, "the blue doesn't look good" on Cobalt's
//      sky-blue -- user supplied a reference palette) via "reset7"
//   3. Denim (2026-09-16, "the blue screams at me, i want something
//      lighter and better contrast" on Indigo -- see ACCENTS.Denim's own
//      comment: dark ink text on Indigo only cleared 2.3-4.0:1 contrast,
//      below the 4.5:1 AA minimum) via "reset8"
// Each new default is its own additional one-time migration layered on
// top of the last, so anyone already forced onto an earlier default still
// picks up the current one.
const { test, describe } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const path = require("path");
const { loadStudlinModule } = require("./harness.js");

const SOURCE = fs.readFileSync(path.join(__dirname, "..", "studlin-app.jsx"), "utf8");

function hexDist(a, b) {
  a = a.replace("#", ""); b = b.replace("#", "");
  let s = 0;
  for (let i = 0; i < 6; i += 2) {
    const d = parseInt(a.slice(i, i + 2), 16) - parseInt(b.slice(i, i + 2), 16);
    s += d * d;
  }
  return Math.sqrt(s);
}

describe("ACCENTS: Cobalt/Ocean/Denim follow the exact same dk/lt-pair shape every other accent already uses", () => {
  test("all three are real entries in the shared ACCENTS palette map", () => {
    const idx = SOURCE.indexOf("const ACCENTS={");
    const body = SOURCE.slice(idx, SOURCE.indexOf("};", idx));
    assert.match(body, /Cobalt:\{dk:\{lime:"#5B9DF0",limeDk:"#3D7FDB",limeLt:"#A9CDF7"\}, lt:\{lime:"#1D5FCF",limeDk:"#154A9E",limeLt:"#A9CDF7"\}\},/);
    assert.match(body, /Ocean: \{dk:\{lime:"#4FB3D9",limeDk:"#2E93BC",limeLt:"#A8E0F2"\}, lt:\{lime:"#166E96",limeDk:"#125676",limeLt:"#A8E0F2"\}\},/);
    assert.match(body, /Denim: \{dk:\{lime:"#93A5C7",limeDk:"#7086AD",limeLt:"#D9E1EE"\}, lt:\{lime:"#6883AC",limeDk:"#4E6281",limeLt:"#D9E1EE"\}\},/);
  });

  test("all three sit at a real color distance from the separate T.blue token, unlike the existing Sky accent", () => {
    const tBlueDark = "#7BACDF";
    const tBlueLight = "#2D6FB8";
    const skyDark = "#84BBEA", skyLight = "#2D74BC";
    // Sky's own distance from T.blue is small (it's effectively the same
    // color) -- this is WHY Sky was never promoted to a brand-default
    // blue. Pinning it here as the baseline the new accents must clear.
    assert.ok(hexDist(skyDark, tBlueDark) < 25);
    assert.ok(hexDist(skyLight, tBlueLight) < 10);
    ["#5B9DF0", "#4FB3D9", "#93A5C7"].forEach((dk) => {
      assert.ok(hexDist(dk, tBlueDark) > 25, `${dk} should be clearly distinct from T.blue dark`);
    });
    ["#1D5FCF", "#166E96", "#6883AC"].forEach((lt) => {
      assert.ok(hexDist(lt, tBlueLight) > 25, `${lt} should be clearly distinct from T.blue light`);
    });
  });

  test("Denim's ink-on-accent contrast clears WCAG AA (4.5:1) in both modes -- the specific defect that sank Indigo", () => {
    // Every T.lime button in the app puts dark T.ink (#080C28) text
    // directly on the accent color. Indigo's own values (#5C6BC0 dk /
    // #35459E lt) only cleared 3.95:1 / 2.28:1 against that ink -- Denim
    // was chosen specifically to fix this, not just to look different.
    function luminance(hex) {
      hex = hex.replace("#", "");
      const [r, g, b] = [0, 2, 4].map(i => parseInt(hex.slice(i, i + 2), 16) / 255);
      const f = c => (c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4));
      return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
    }
    function contrastRatio(a, b) {
      const [l1, l2] = [luminance(a), luminance(b)].sort((x, y) => y - x);
      return (l1 + 0.05) / (l2 + 0.05);
    }
    assert.ok(contrastRatio("#93A5C7", "#080C28") >= 4.5, "dk.lime vs ink should clear AA");
    assert.ok(contrastRatio("#6883AC", "#080C28") >= 4.5, "lt.lime vs ink should clear AA");
  });
});

describe("applyTheme actually picks up all three new accents (same code path every existing accent already goes through)", () => {
  test("choosing Cobalt/Ocean/Denim sets T.lime to each one's dark-mode color", () => {
    const m = loadStudlinModule();
    m.applyTheme("dark", "Cobalt", "Comfortable");
    assert.equal(m.T.lime, "#5B9DF0");
    m.applyTheme("dark", "Ocean", "Comfortable");
    assert.equal(m.T.lime, "#4FB3D9");
    m.applyTheme("dark", "Denim", "Comfortable");
    assert.equal(m.T.lime, "#93A5C7");
  });

  test("light mode picks up each accent's own light-mode color, not the dark-mode one", () => {
    const m = loadStudlinModule();
    m.applyTheme("light", "Cobalt", "Comfortable");
    assert.equal(m.T.lime, "#1D5FCF");
  });

  test("an unrecognized accent name still falls back to Lime -- new accents don't disturb this existing safety net", () => {
    const m = loadStudlinModule();
    m.applyTheme("dark", "NotARealAccent", "Comfortable");
    assert.equal(m.T.lime, "#AECE5E");
  });
});

describe("Settings' Appearance picker offers all three new blues alongside every existing accent", () => {
  test("the accents array used to render the picker includes Cobalt, Ocean, and Denim", () => {
    assert.match(SOURCE, /\{n:"Cobalt",c:"#3D7FDB"\},\{n:"Ocean",c:"#1C7FA8"\},\{n:"Denim",c:"#7086AD"\}\];/);
  });

  test("every accent that existed before this branch is still present -- this only adds, never replaces or reorders a returning user's existing options", () => {
    ["Lime", "Forest", "Sky", "Lilac", "Peach", "Pink", "Slate"].forEach((name) => {
      assert.match(SOURCE, new RegExp(`\\{n:"${name}",c:"#[0-9A-F]+"\\}`));
    });
  });
});

describe("branch-only default flip to Denim (studlin-app.jsx, not a change to the underlying accent system itself)", () => {
  test("the module-level initial applyTheme() call defaults to Denim when nothing is saved yet", () => {
    assert.match(SOURCE, /localStorage\.getItem\('studlin-accent'\)\) \|\| 'Denim',/);
  });

  test("the reset6 migration (forcing Cobalt) is untouched", () => {
    assert.match(SOURCE, /if\(!localStorage\.getItem\("studlin-accent-reset6"\)\)\{localStorage\.setItem\("studlin-accent","Cobalt"\);localStorage\.setItem\("studlin-accent-reset6","1"\);\}/);
  });

  test("the reset7 migration (forcing Indigo) is untouched", () => {
    assert.match(SOURCE, /if\(!localStorage\.getItem\("studlin-accent-reset7"\)\)\{localStorage\.setItem\("studlin-accent","Indigo"\);localStorage\.setItem\("studlin-accent-reset7","1"\);\}/);
  });

  test("a one-time reset8 migration forces existing saved accents to Denim, mirroring the reset5/6/7 pattern exactly -- so anyone already forced onto Indigo by reset7 still picks up the final default", () => {
    assert.match(SOURCE, /if\(!localStorage\.getItem\("studlin-accent-reset8"\)\)\{localStorage\.setItem\("studlin-accent","Denim"\);localStorage\.setItem\("studlin-accent-reset8","1"\);\}/);
  });

  test("the pre-existing reset5 migration (which forces Lime) is untouched -- each new default is its own additional migration, not a rewrite of history", () => {
    assert.match(SOURCE, /if\(!localStorage\.getItem\("studlin-accent-reset5"\)\)\{localStorage\.setItem\("studlin-accent","Lime"\);localStorage\.setItem\("studlin-accent-reset5","1"\);\}/);
  });
});
