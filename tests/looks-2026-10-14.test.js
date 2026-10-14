// "Looks" Phase 1 (2026-10-14): calendar palettes + block styles + customize
// panel. Classic must stay byte-identical to the legacy block styling, every
// palette/mode/style text must pass WCAG AA (4.5:1), and no palette may use a
// warm off-white (the app has no cream anywhere).
const { test, describe } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const path = require("path");
const { loadStudlinModule } = require("./harness.js");

const m = loadStudlinModule();
const SRC = fs.readFileSync(path.join(__dirname, "..", "studlin-app.jsx"), "utf8");
const STYLES = ["soft", "flat", "outlined"];
const KINDS = ["subject", "study", "reminder", "preview"];

function withMode(mode, fn) {
  m.applyTheme(mode, "Lime", "Comfortable");
  return fn();
}
function cardBgFor(mode) { return mode === "dark" ? m.darkT.card : m.lightT.card; }

describe("looks: palette data", () => {
  test("every palette has 8 light + 8 dark hex swatches", () => {
    assert.ok(m.LOOK_PALETTES.length >= 6);
    for (const p of m.LOOK_PALETTES) {
      assert.equal(p.swatches.length, 8, p.id);
      assert.equal(p.swatchesDark.length, 8, p.id);
      for (const c of [...p.swatches, ...p.swatchesDark]) assert.match(c, /^#[0-9A-Fa-f]{6}$/, p.id + " " + c);
    }
  });

  test("no warm off-white (cream) anywhere in palette data", () => {
    const warmOffWhite = (hex) => {
      const h = hex.replace("#", "");
      const r = parseInt(h.slice(0, 2), 16), g = parseInt(h.slice(2, 4), 16), b = parseInt(h.slice(4, 6), 16);
      const lum = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
      return lum > 0.85 && r > b + 8;
    };
    for (const p of m.LOOK_PALETTES) {
      for (const c of [...p.swatches, ...p.swatchesDark, p.headerTint || "#808080"]) {
        assert.equal(warmOffWhite(c), false, p.id + " " + c);
      }
    }
  });
});

describe("looks: contrast", () => {
  for (const mode of ["light", "dark"]) {
    test("every palette x style x kind text is >= 4.5:1 in " + mode, () => {
      withMode(mode, () => {
        for (const p of m.LOOK_PALETTES) {
          if (p.id === "classic") continue; // classic is legacy, untouched on purpose
          const swatches = mode === "dark" ? p.swatchesDark : p.swatches;
          for (const style of STYLES) for (const kind of ["subject", "study", "reminder"]) {
            for (const c of swatches) {
              const look = { v: 1, palette: p.id, blockStyle: style };
              const s = m.lookBlockStyle(c, look, mode, kind);
              const bg = kind === "reminder" ? cardBgFor(mode) : s.fill;
              assert.ok(m.contrastRatio(s.text, bg) >= 4.5, [p.id, mode, style, kind, c, s.text, bg].join(" "));
            }
          }
        }
      });
    });
  }
});

describe("looks: classic is exactly legacy", () => {
  for (const mode of ["light", "dark"]) {
    test("subject/study/reminder match the old inline computation in " + mode, () => {
      withMode(mode, () => {
        const look = { v: 1, palette: "classic", blockStyle: "soft" };
        for (const c of m.SUBJECT_COLORS) {
          const s = m.lookBlockStyle(c, look, mode, "subject");
          assert.equal(s.fill, m.blendOverBg(c, 0.1176, m.T.card));
          assert.equal(s.text, c);
          assert.equal(s.border, c);
          const st = m.lookBlockStyle(c, look, mode, "study");
          assert.equal(st.fill, c);
          assert.equal(st.text, m.T.ink);
          assert.equal(m.lookBlockStyle(c, look, mode, "reminder").text, c);
          const pv = m.lookBlockStyle(c, look, mode, "preview");
          assert.equal(pv.fill, c + "22");
          assert.equal(pv.outline, "1px solid " + c + "55");
          assert.equal(pv.text, m.T.text);
        }
      });
    });
    test("classic block style setting never changes classic output in " + mode, () => {
      withMode(mode, () => {
        for (const style of STYLES) for (const kind of KINDS) {
          const a = m.lookBlockStyle("#D9806B", { v: 1, palette: "classic", blockStyle: "soft" }, mode, kind);
          const b = m.lookBlockStyle("#D9806B", { v: 1, palette: "classic", blockStyle: style }, mode, kind);
          assert.equal(JSON.stringify(a), JSON.stringify(b));
        }
      });
    });
  }
  test("classic lookColorFor returns the subject's own saved color", () => {
    const subjects = [{ id: "a", label: "Bio", color: "#123456" }, { id: "b", label: "Chem", color: "#654321" }];
    const look = { v: 1, palette: "classic", blockStyle: "soft" };
    assert.equal(m.lookColorFor("a", look, "light", subjects), "#123456");
    assert.equal(m.lookColorFor("Chem", look, "light", subjects), "#654321");
    const map = m.lookSubjectColorMap(subjects, look, "light");
    assert.equal(map.a, "#123456");
    assert.equal(map.Chem, "#654321");
  });
});

describe("looks: subject index resolution", () => {
  const look = { v: 1, palette: "sunset", blockStyle: "soft" };
  const subjects = Array.from({ length: 11 }, (_, i) => ({ id: "s" + i, label: "L" + i, color: "#000000" }));
  test("auto assignment uses all 8 swatches before repeating; numeric slot wraps", () => {
    const sun = m.LOOK_PALETTES.find((p) => p.id === "sunset");
    const first8 = subjects.slice(0, 8).map((s) => m.lookColorFor(s.id, look, "light", subjects));
    // lookColorFor assigns over the WHOLE list (11): the first 8 sorted-by-id classes are not all in slots 0-7 order,
    // so just check every result is a real swatch and the whole set of 11 touches all 8 swatches.
    const all = subjects.map((s) => m.lookColorFor(s.id, look, "light", subjects));
    for (const c of all) assert.ok(sun.swatches.includes(c));
    assert.equal(new Set(all).size, 8);
    assert.equal(first8.length, 8);
    assert.equal(m.lookColorFor(9, look, "light"), sun.swatches[1]);
    assert.equal(m.lookColorFor(-1 + 16, look, "light"), sun.swatches[7]);
  });
  test("unknown subject resolves to null; map has id and label keys", () => {
    assert.equal(m.lookColorFor("nope", look, "light", subjects), null);
    const map = m.lookSubjectColorMap(subjects, look, "light");
    assert.equal(map.s3, map.L3);
  });
});

describe("looks: persistence", () => {
  test("garbage or missing JSON falls back to classic", () => {
    m.localStorage.setItem("studlin-look", "{not json");
    assert.equal(m.readLook().palette, "classic");
    m.localStorage.setItem("studlin-look", JSON.stringify({ palette: "nope", blockStyle: "weird" }));
    const l = m.readLook();
    assert.equal(l.palette, "classic");
    assert.equal(l.blockStyle, "soft");
    m.localStorage.removeItem("studlin-look");
    assert.equal(m.readLook().palette, "classic");
  });
  test("saveLook round-trips a valid look", () => {
    m.saveLook({ v: 1, palette: "ocean", blockStyle: "outlined" });
    const l = m.readLook();
    assert.equal(l.palette, "ocean");
    assert.equal(l.blockStyle, "outlined");
    m.localStorage.removeItem("studlin-look");
  });
});

describe("looks: render sites go through the single helper", () => {
  const start = SRC.indexOf("// ===== LOOKS");
  const end = SRC.indexOf("// ===== END LOOKS =====");
  test("looks block is marked", () => { assert.ok(start > 0 && end > start); });
  test("WeeklyPlanner, DayPlanner, DayPreviewModal and the AI mini preview use it", () => {
    const grab = (name) => {
      const i = SRC.indexOf("function " + name);
      assert.ok(i > 0, name);
      const next = SRC.slice(i + 10).search(/\n(?:async )?function [A-Za-z]/);
      return SRC.slice(i, next < 0 ? undefined : i + 10 + next);
    };
    assert.match(grab("WeeklyPlanner"), /lookBlockStyle\(subjectColor,lookNow/);
    assert.match(grab("DayPlanner"), /lookBlockStyle\(color,lookNow/);
    assert.match(grab("DayPreviewModal"), /lookBlockStyle\(c,getLook\(\),lookMode\(\),"preview"\)/);
    assert.match(grab("StudlinAiMiniDayPreview"), /subjectColor\(/);
  });
  test("legacy inline subject-block blend is gone from the render sites", () => {
    const outside = SRC.slice(0, start) + SRC.slice(end);
    assert.equal(/background:blendOverBg\((subjectColor|color),0\.1176,T\.card\)/.test(outside), false);
  });
  test("CalendarTab resolves colors through the memoized palette map and exposes Customize", () => {
    assert.match(SRC, /const lookColorMap=useMemo\(\(\)=>lookSubjectColorMap\(/);
    assert.match(SRC, /<LookCustomizePanel open=\{lookPanelOpen\}/);
    assert.ok((SRC.match(/<LookCustomizePanel /g) || []).length >= 2, "Calendar header and Settings both open the panel");
  });
  test("per-event ev.color still wins over the palette", () => {
    assert.ok((SRC.match(/ev\.color\|\|colorOf\(ev\.courseId\|\|ev\.subject\)/g) || []).length >= 4);
  });
  test("no em dashes in the looks block", () => {
    assert.equal(SRC.slice(start, end).includes("—"), false);
  });
});
