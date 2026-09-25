// Regression test for the 2026-08-28 "Phase 1" accent-color addition,
// requested directly by the user: "some people want a more pink theme or
// lighter color theme." Settings > Appearance already had a real accent
// picker (Lime/Forest/Sky/Lilac/Peach) wired to applyTheme -- this adds
// two more options to that same existing system rather than building
// anything new: Pink (reusing this file's own existing `rose` design
// token, already used elsewhere for content, just never offered as a
// selectable accent) and Slate (a calm, desaturated neutral for the
// "lighter" half of the ask).
//
// ACCENTS/applyTheme are real top-level definitions; the Settings picker
// array (`accents`) lives inside a component closure -- source-level
// regression guards for that half, same established precedent as every
// other component-closure fix this session. Run with `npm test`.
const { test, describe } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const path = require("path");
const { loadStudlinModule } = require("./harness.js");

const SOURCE = fs.readFileSync(path.join(__dirname, "..", "studlin-app.jsx"), "utf8");

describe("ACCENTS: Pink and Slate follow the exact same dk/lt-pair shape every other accent already uses", () => {
  test("both are real entries in the shared ACCENTS palette map", () => {
    const idx = SOURCE.indexOf("const ACCENTS={");
    const body = SOURCE.slice(idx, SOURCE.indexOf("};", idx));
    assert.match(body, /Pink:\s*\{dk:\{lime:"#E8829E",limeDk:"#C95F7C",limeLt:"#FFC9D2"\}, lt:\{lime:"#C23F68",limeDk:"#9E2F52",limeLt:"#FFC9D2"\}\},/);
    assert.match(body, /Slate:\s*\{dk:\{lime:"#9AA5B1",limeDk:"#7A8592",limeLt:"#C9D1D9"\}, lt:\{lime:"#5B6672",limeDk:"#454E58",limeLt:"#C9D1D9"\}\},/);
  });

  test("Pink reuses this file's own existing rose design token for its light-mode-shared tint, not a newly invented color", () => {
    assert.match(SOURCE, /rose:\s*"#FFC9D2"/, "sanity check that T.rose is really this exact value elsewhere in the file");
    const idx = SOURCE.indexOf("Pink:  {dk:");
    assert.match(SOURCE.slice(idx, idx + 200), /limeLt:"#FFC9D2"/);
  });
});

describe("applyTheme actually picks up both new accents (same code path every existing accent already goes through)", () => {
  test("choosing Pink sets T.lime to Pink's dark-mode color; Slate to Slate's", () => {
    const m = loadStudlinModule();
    m.applyTheme("dark", "Pink", "Comfortable");
    assert.equal(m.T.lime, "#E8829E");
    m.applyTheme("dark", "Slate", "Comfortable");
    assert.equal(m.T.lime, "#9AA5B1");
  });

  test("light mode picks up each accent's own light-mode color, not the dark-mode one", () => {
    const m = loadStudlinModule();
    m.applyTheme("light", "Pink", "Comfortable");
    assert.equal(m.T.lime, "#C23F68");
  });

  test("an unrecognized accent name falls back to Lime rather than crashing -- same safety net every existing accent already relies on", () => {
    const m = loadStudlinModule();
    m.applyTheme("dark", "NotARealAccent", "Comfortable");
    assert.equal(m.T.lime, "#AECE5E");
  });
});

describe("Settings' Appearance picker offers both new accents alongside the original 5", () => {
  test("the accents array used to render the picker now includes Pink and Slate", () => {
    assert.match(SOURCE, /const accents=\[\{n:"Lime",c:"#AECE5E"\},\{n:"Forest",c:"#3E9576"\},\{n:"Sky",c:"#4F95D6"\},\{n:"Lilac",c:"#9474C9"\},\{n:"Peach",c:"#D07C4C"\},\{n:"Pink",c:"#D9648A"\},\{n:"Slate",c:"#7A8592"\}\];/);
  });

  test("every original accent is still present -- this only adds, it doesn't replace or reorder anything a returning user already picked", () => {
    ["Lime", "Forest", "Sky", "Lilac", "Peach"].forEach(name => {
      assert.match(SOURCE, new RegExp(`\\{n:"${name}",c:"#[0-9A-F]+"\\}`));
    });
  });
});
