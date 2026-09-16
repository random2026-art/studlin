// experiment/blue-rebrand (2026-09-15): cofounder research says blue reads
// as "trust + studying" to students, green doesn't. This branch adds three
// new blue accent options (Cobalt/Ocean/Indigo) to the existing ACCENTS
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
// safety net from pink-slate-accents.test.js. The default flipped twice on
// this branch: Cobalt first (module-level applyTheme() call + one-time
// "reset6" migration), then Indigo (2026-09-16, after "the blue doesn't
// look good" feedback on Cobalt's sky-blue -- see ACCENTS.Indigo's own
// comment for the user-supplied reference palette) via a second one-time
// "reset7" migration layered on top, so anyone already forced onto Cobalt
// by reset6 also picks up the new default.
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

describe("ACCENTS: Cobalt/Ocean/Indigo follow the exact same dk/lt-pair shape every other accent already uses", () => {
  test("all three are real entries in the shared ACCENTS palette map", () => {
    const idx = SOURCE.indexOf("const ACCENTS={");
    const body = SOURCE.slice(idx, SOURCE.indexOf("};", idx));
    assert.match(body, /Cobalt:\{dk:\{lime:"#5B9DF0",limeDk:"#3D7FDB",limeLt:"#A9CDF7"\}, lt:\{lime:"#1D5FCF",limeDk:"#154A9E",limeLt:"#A9CDF7"\}\},/);
    assert.match(body, /Ocean: \{dk:\{lime:"#4FB3D9",limeDk:"#2E93BC",limeLt:"#A8E0F2"\}, lt:\{lime:"#166E96",limeDk:"#125676",limeLt:"#A8E0F2"\}\},/);
    assert.match(body, /Indigo:\{dk:\{lime:"#5C6BC0",limeDk:"#3F51B5",limeLt:"#BBC5FB"\}, lt:\{lime:"#35459E",limeDk:"#283477",limeLt:"#BBC5FB"\}\},/);
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
    ["#5B9DF0", "#4FB3D9", "#5C6BC0"].forEach((dk) => {
      assert.ok(hexDist(dk, tBlueDark) > 25, `${dk} should be clearly distinct from T.blue dark`);
    });
    ["#1D5FCF", "#166E96", "#35459E"].forEach((lt) => {
      assert.ok(hexDist(lt, tBlueLight) > 25, `${lt} should be clearly distinct from T.blue light`);
    });
  });
});

describe("applyTheme actually picks up all three new accents (same code path every existing accent already goes through)", () => {
  test("choosing Cobalt/Ocean/Indigo sets T.lime to each one's dark-mode color", () => {
    const m = loadStudlinModule();
    m.applyTheme("dark", "Cobalt", "Comfortable");
    assert.equal(m.T.lime, "#5B9DF0");
    m.applyTheme("dark", "Ocean", "Comfortable");
    assert.equal(m.T.lime, "#4FB3D9");
    m.applyTheme("dark", "Indigo", "Comfortable");
    assert.equal(m.T.lime, "#5C6BC0");
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
  test("the accents array used to render the picker includes Cobalt, Ocean, and Indigo", () => {
    assert.match(SOURCE, /\{n:"Cobalt",c:"#3D7FDB"\},\{n:"Ocean",c:"#1C7FA8"\},\{n:"Indigo",c:"#3F51B5"\}\];/);
  });

  test("every accent that existed before this branch is still present -- this only adds, never replaces or reorders a returning user's existing options", () => {
    ["Lime", "Forest", "Sky", "Lilac", "Peach", "Pink", "Slate"].forEach((name) => {
      assert.match(SOURCE, new RegExp(`\\{n:"${name}",c:"#[0-9A-F]+"\\}`));
    });
  });
});

describe("branch-only default flip to Indigo (studlin-app.jsx, not a change to the underlying accent system itself)", () => {
  test("the module-level initial applyTheme() call defaults to Indigo when nothing is saved yet", () => {
    assert.match(SOURCE, /localStorage\.getItem\('studlin-accent'\)\) \|\| 'Indigo',/);
  });

  test("the original reset6 migration (forcing Cobalt) is untouched -- history isn't rewritten, a new migration is layered on top instead", () => {
    assert.match(SOURCE, /if\(!localStorage\.getItem\("studlin-accent-reset6"\)\)\{localStorage\.setItem\("studlin-accent","Cobalt"\);localStorage\.setItem\("studlin-accent-reset6","1"\);\}/);
  });

  test("a one-time reset7 migration forces existing saved accents to Indigo, mirroring the reset5/reset6 pattern exactly -- so anyone already forced onto Cobalt by reset6 still picks up the new default", () => {
    assert.match(SOURCE, /if\(!localStorage\.getItem\("studlin-accent-reset7"\)\)\{localStorage\.setItem\("studlin-accent","Indigo"\);localStorage\.setItem\("studlin-accent-reset7","1"\);\}/);
  });

  test("the pre-existing reset5 migration (which forces Lime) is untouched -- each new default is its own additional migration, not a rewrite of history", () => {
    assert.match(SOURCE, /if\(!localStorage\.getItem\("studlin-accent-reset5"\)\)\{localStorage\.setItem\("studlin-accent","Lime"\);localStorage\.setItem\("studlin-accent-reset5","1"\);\}/);
  });
});
