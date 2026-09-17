// experiment/blue-rebrand (2026-09-15): cofounder research says blue reads
// as "trust + studying" to students, green doesn't. This branch adds three
// new blue accent options (Cobalt/Ocean/Cornflower) to the existing
// ACCENTS system rather than inventing a new theming mechanism -- same
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
// safety net from pink-slate-accents.test.js. The default flipped FOUR
// times on this branch (Cobalt -> Indigo -> Denim -> Cornflower, each its
// own one-time reset6/7/8/9 migration), then Cornflower's OWN values were
// revised once more in place (no new reset needed -- same accent name, the
// hex lookup is dynamic via ACCENTS, so anyone already on "Cornflower"
// automatically picks up the new values next render). See
// ACCENTS.Cornflower's own comment in studlin-app.jsx for the full story.
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

describe("ACCENTS: Cobalt/Ocean/Cornflower follow the exact same dk/lt-pair shape every other accent already uses", () => {
  test("all three are real entries in the shared ACCENTS palette map", () => {
    const idx = SOURCE.indexOf("const ACCENTS={");
    const body = SOURCE.slice(idx, SOURCE.indexOf("};", idx));
    assert.match(body, /Cobalt:\{dk:\{lime:"#5B9DF0",limeDk:"#3D7FDB",limeLt:"#A9CDF7"\}, lt:\{lime:"#1D5FCF",limeDk:"#154A9E",limeLt:"#A9CDF7"\}\},/);
    assert.match(body, /Ocean: \{dk:\{lime:"#4FB3D9",limeDk:"#2E93BC",limeLt:"#A8E0F2"\}, lt:\{lime:"#166E96",limeDk:"#125676",limeLt:"#A8E0F2"\}\},/);
    assert.match(body, /Cornflower:\{dk:\{lime:"#5F89DD",limeDk:"#4767A6",limeLt:"#B7CAF0"\}, lt:\{lime:"#4B78D2",limeDk:"#385A9E",limeLt:"#B7CAF0"\}\},/);
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
    ["#5B9DF0", "#4FB3D9", "#5F89DD"].forEach((dk) => {
      assert.ok(hexDist(dk, tBlueDark) > 25, `${dk} should be clearly distinct from T.blue dark`);
    });
    ["#1D5FCF", "#166E96", "#4B78D2"].forEach((lt) => {
      assert.ok(hexDist(lt, tBlueLight) > 25, `${lt} should be clearly distinct from T.blue light`);
    });
  });

  test("Cornflower's dark-mode value is a genuinely saturated blue, not a washed-out pastel", () => {
    // 2026-09-17 user report: "make the blue darker for certain things
    // because the original studlin color had darker green also" --
    // Cornflower's first cut (#A0B7E3) was contrast-matched to lime's
    // 9.6:1, which meant raising lightness to 76% -- technically
    // iso-saturated with lime, but T.lime is also the SOLID FILL for
    // study blocks and the default calendar event tint (see
    // design-tokens.js's accent===theme.lime), where a pale fill reads
    // weak regardless of its contrast number. Pulled back to a properly
    // saturated, richer blue.
    function hexToHsl(hex) {
      hex = hex.replace("#", "");
      const r = parseInt(hex.slice(0, 2), 16) / 255, g = parseInt(hex.slice(2, 4), 16) / 255, b = parseInt(hex.slice(4, 6), 16) / 255;
      const max = Math.max(r, g, b), min = Math.min(r, g, b);
      let s, l = (max + min) / 2;
      if (max === min) { s = 0; } else {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      }
      return { s: s * 100, l: l * 100 };
    }
    const cornflower = hexToHsl("5F89DD");
    assert.ok(cornflower.s >= 60, `dk.lime should read as a real saturated blue, not pastel -- got ${cornflower.s.toFixed(1)}% saturation`);
    assert.ok(cornflower.l < 65, `dk.lime should be meaningfully darker than the earlier 76%-lightness pale cut -- got ${cornflower.l.toFixed(1)}%`);
  });

  test("ink-on-accent contrast still clears WCAG AA (4.5:1) in both modes after darkening", () => {
    // Every T.lime button in the app puts dark T.ink (#080C28) text
    // directly on the accent color, and design-tokens.js's study-block
    // fill does the same. Darkening dk.lime traded some of the previous
    // 9.5:1 for a richer color, but it must still clear AA.
    const dkContrast = contrastRatio("#5F89DD", "#080C28");
    const ltContrast = contrastRatio("#4B78D2", "#080C28");
    assert.ok(dkContrast >= 4.5, `dk.lime contrast should clear AA, got ${dkContrast.toFixed(2)}`);
    assert.ok(ltContrast >= 4.5, `lt.lime contrast should clear AA, got ${ltContrast.toFixed(2)}`);
  });
});

describe("applyTheme actually picks up all three new accents (same code path every existing accent already goes through)", () => {
  test("choosing Cobalt/Ocean/Cornflower sets T.lime to each one's dark-mode color", () => {
    const m = loadStudlinModule();
    m.applyTheme("dark", "Cobalt", "Comfortable");
    assert.equal(m.T.lime, "#5B9DF0");
    m.applyTheme("dark", "Ocean", "Comfortable");
    assert.equal(m.T.lime, "#4FB3D9");
    m.applyTheme("dark", "Cornflower", "Comfortable");
    assert.equal(m.T.lime, "#5F89DD");
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
  test("the accents array used to render the picker includes Cobalt, Ocean, and Cornflower", () => {
    assert.match(SOURCE, /\{n:"Cobalt",c:"#3D7FDB"\},\{n:"Ocean",c:"#1C7FA8"\},\{n:"Cornflower",c:"#4767A6"\}\];/);
  });

  test("every accent that existed before this branch is still present -- this only adds, never replaces or reorders a returning user's existing options", () => {
    ["Lime", "Forest", "Sky", "Lilac", "Peach", "Pink", "Slate"].forEach((name) => {
      assert.match(SOURCE, new RegExp(`\\{n:"${name}",c:"#[0-9A-F]+"\\}`));
    });
  });
});

describe("branch-only default flip to Cornflower (studlin-app.jsx, not a change to the underlying accent system itself)", () => {
  test("the module-level initial applyTheme() call defaults to Cornflower when nothing is saved yet", () => {
    assert.match(SOURCE, /localStorage\.getItem\('studlin-accent'\)\) \|\| 'Cornflower',/);
  });

  test("the reset6/reset7/reset8/reset9 migrations (forcing Cobalt, then Indigo, then Denim, then Cornflower) are all untouched -- history isn't rewritten, each new default is its own additional migration", () => {
    assert.match(SOURCE, /if\(!localStorage\.getItem\("studlin-accent-reset6"\)\)\{localStorage\.setItem\("studlin-accent","Cobalt"\);localStorage\.setItem\("studlin-accent-reset6","1"\);\}/);
    assert.match(SOURCE, /if\(!localStorage\.getItem\("studlin-accent-reset7"\)\)\{localStorage\.setItem\("studlin-accent","Indigo"\);localStorage\.setItem\("studlin-accent-reset7","1"\);\}/);
    assert.match(SOURCE, /if\(!localStorage\.getItem\("studlin-accent-reset8"\)\)\{localStorage\.setItem\("studlin-accent","Denim"\);localStorage\.setItem\("studlin-accent-reset8","1"\);\}/);
    assert.match(SOURCE, /if\(!localStorage\.getItem\("studlin-accent-reset9"\)\)\{localStorage\.setItem\("studlin-accent","Cornflower"\);localStorage\.setItem\("studlin-accent-reset9","1"\);\}/);
  });

  test("the pre-existing reset5 migration (which forces Lime) is untouched -- each new default is its own additional migration, not a rewrite of history", () => {
    assert.match(SOURCE, /if\(!localStorage\.getItem\("studlin-accent-reset5"\)\)\{localStorage\.setItem\("studlin-accent","Lime"\);localStorage\.setItem\("studlin-accent-reset5","1"\);\}/);
  });
});
