// Looks consistency pass (2026-10-14): every kind of calendar block follows the chosen block style,
// new Blush Pink palette, calm light-mode sidebar, class colors follow the palette everywhere.
const { test, describe, beforeEach } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const path = require("path");
const { loadStudlinModule } = require("./harness.js");

const m = loadStudlinModule();
const SRC = fs.readFileSync(path.join(__dirname, "..", "studlin-app.jsx"), "utf8").replace(/\r\n/g, "\n");
const NON_CLASSIC = () => m.LOOK_PALETTES.filter((p) => p.id !== "classic");
function resetLook() { m.setLook({ palette: "classic", blockStyle: "soft", perClass: {}, seed: 0, accentFollows: true }); }
beforeEach(resetLook);

describe("block style applies to every kind", () => {
  test("outlined: subject, study, preview are all hollow (card fill + colored outline)", () => {
    for (const mode of ["light", "dark"]) {
      m.applyTheme(mode, "Lime", "Comfortable");
      const card = mode === "dark" ? m.darkT.card : m.lightT.card;
      for (const kind of ["subject", "study", "preview"]) {
        const s = m.lookBlockStyle("#D9487F", { v: 1, palette: "sunset", blockStyle: "outlined" }, mode, kind);
        assert.equal(s.fill, card, kind + " " + mode);
        assert.match(s.outline, /^1\.5px solid #D9487F$/);
        assert.equal(s.solid, false);
      }
    }
  });
  test("flat: every kind is solid", () => {
    m.applyTheme("light", "Lime", "Comfortable");
    for (const kind of ["subject", "study", "preview"]) {
      const s = m.lookBlockStyle("#D9487F", { v: 1, palette: "pink", blockStyle: "flat" }, "light", kind);
      assert.equal(s.fill, "#D9487F");
      assert.equal(s.solid, true);
    }
  });
  test("soft: study is no longer a solid fill under a palette", () => {
    m.applyTheme("light", "Lime", "Comfortable");
    const s = m.lookBlockStyle("#D9487F", { v: 1, palette: "pink", blockStyle: "soft" }, "light", "study");
    assert.notEqual(s.fill, "#D9487F");
    assert.equal(s.solid, false);
  });
  test("classic study stays the legacy solid focus block", () => {
    m.applyTheme("light", "Lime", "Comfortable");
    const s = m.lookBlockStyle("#D9806B", { v: 1, palette: "classic", blockStyle: "outlined" }, "light", "study");
    assert.equal(s.fill, "#D9806B");
    assert.equal(s.text, m.T.ink);
  });
  test("text stays >= 4.5:1 for every palette x style x kind x mode (incl. preview)", () => {
    for (const mode of ["light", "dark"]) {
      m.applyTheme(mode, "Lime", "Comfortable");
      for (const p of NON_CLASSIC()) for (const style of ["soft", "flat", "outlined"]) for (const kind of ["subject", "study", "preview"]) {
        for (const c of (mode === "dark" ? p.swatchesDark : p.swatches)) {
          const s = m.lookBlockStyle(c, { v: 1, palette: p.id, blockStyle: style }, mode, kind);
          if (kind === "preview" && style === "soft") continue; // translucent over a modal surface, text is T.text
          assert.ok(m.contrastRatio(s.text, s.fill) >= 4.5, [p.id, mode, style, kind, c].join(" "));
        }
      }
    }
  });
  test("draft ghosts follow the style; classic returns the legacy fill", () => {
    m.applyTheme("light", "Lime", "Comfortable");
    assert.equal(m.lookDraftStyle("#D9806B", { palette: "classic" }, "light", "#D9806B22").fill, "#D9806B22");
    assert.equal(m.lookDraftStyle("#D9487F", { palette: "pink", blockStyle: "outlined" }, "light", "x").fill, "transparent");
    assert.equal(m.lookDraftStyle("#D9487F", { palette: "pink", blockStyle: "flat" }, "light", "x").fill, "#D9487FB3");
    assert.equal(m.lookDraftStyle("#D9487F", { palette: "pink", blockStyle: "soft" }, "light", "x").fill, "#D9487F22");
  });
  test("calendar views route study/exam/drafts/preview through the look helpers", () => {
    assert.ok(SRC.includes('lookBlockStyle(lookEventColor(ev.color,ev.courseId||ev.subject,tokens.color.accent),lookNow,lookModeNow,"study");return {background:ls.fill,color:ls.text,...(ls.outline?{border:ls.outline}:{})}'));
    assert.ok(SRC.includes("const warnLegacy = isWarningKind && lookClassicNow;"));
    assert.ok(SRC.includes("const examLegacy=isExam&&lookClassicNow;"));
    assert.ok(!SRC.includes('isStudy?T.ink+"aa":'));
    assert.equal((SRC.match(/lookDraftStyle\(/g) || []).length >= 8, true);
    assert.ok(SRC.includes('lookBlockStyle(color,getLook(),lookMode(),"preview").fill'));
  });
});

describe("Blush Pink palette", () => {
  const pink = () => m.LOOK_PALETTES.find((p) => p.id === "pink");
  test("exists with 8 light + 8 dark swatches and both theme token sets", () => {
    const p = pink();
    assert.ok(p);
    assert.equal(p.name, "Blush Pink");
    assert.equal(p.swatches.length, 8);
    assert.equal(p.swatchesDark.length, 8);
    for (const k of ["accent", "accentDk", "accentSoft", "accentInk", "hdrBg", "hdrText", "tint", "borderTint", "todayBg", "todayText", "chipBg"]) {
      assert.match(p.theme.light[k], /^#[0-9A-Fa-f]{6}$/);
      assert.match(p.theme.dark[k], /^#[0-9A-Fa-f]{6}$/);
    }
  });
  test("normalizes as a valid palette and themes the app", () => {
    assert.equal(m.lookNormalize({ palette: "pink" }).palette, "pink");
    m.setLook({ palette: "pink" });
    m.applyTheme("light", "Lime", "Comfortable");
    assert.equal(m.T.lookOn, true);
    assert.equal(m.T.tint, pink().theme.light.tint);
  });
  test("accent/today/chip text pairs are readable in light and dark", () => {
    const p = pink();
    for (const mode of ["light", "dark"]) {
      const t = p.theme[mode];
      assert.ok(m.contrastRatio(t.todayText, t.todayBg) >= 4.5, mode + " today");
      assert.ok(m.contrastRatio(t.accentInk, t.accentSoft) >= 4.5, mode + " accentInk");
      assert.ok(m.contrastRatio(t.hdrText, t.hdrBg) >= 4.5, mode + " hdr");
    }
  });
});

describe("calm sidebar in light mode", () => {
  test("source uses a tinted surface and ink, not the deep hdrText slab", () => {
    assert.ok(SRC.includes("backgroundColor:softSide?T.tint:T.surface"));
    assert.ok(!SRC.includes("backgroundColor:isLight&&T.lookOn?T.hdrText:T.surface"));
    assert.ok(SRC.includes("const softSide=isLight&&T.lookOn;"));
    assert.ok(SRC.includes("const sidebarText=softSide?T.hdrText:"));
  });
  test("every palette: sidebar text, muted and faint labels are readable on the tint; active item readable", () => {
    for (const p of NON_CLASSIC()) {
      const t = p.theme.light;
      assert.ok(m.contrastRatio(t.hdrText, t.tint) >= 7, p.id + " text");
      assert.ok(m.contrastRatio(m.blendOverBg(t.hdrText, 0.78, t.tint), t.tint) >= 4.5, p.id + " muted");
      assert.ok(m.contrastRatio(m.blendOverBg(t.hdrText, 0.62, t.tint), t.tint) >= 3, p.id + " faint");
      assert.ok(m.contrastRatio(t.accentInk, t.hdrBg) >= 4.5, p.id + " active");
      assert.notEqual(t.hdrBg.toLowerCase(), t.tint.toLowerCase(), p.id + " active differs from surface");
    }
  });
  test("the sidebar surface is light (never a saturated slab)", () => {
    for (const p of NON_CLASSIC()) assert.ok(m.lookLuminance(p.theme.light.tint) > 0.8, p.id);
  });
  test("classic and dark mode keep their old sidebar branches", () => {
    assert.ok(SRC.includes('isLight?"#FFFFFF":T.text'));
    assert.ok(SRC.includes('isLight?"rgba(255,255,255,0.55)":T.muted'));
  });
});

describe("class colors follow the palette everywhere", () => {
  const subjects = [{ id: "a", label: "Bio", color: "#D9806B" }, { id: "b", label: "Chem", color: "#7BACDF" }];
  test("courses list and activities use palette-aware colors", () => {
    assert.ok(SRC.includes("const subColor=colorOf(sub.id)||sub.color;"));
    assert.ok(!/subjectRowStyle\(sub\.color\)\s*,\s*cursor/.test(SRC));
    assert.ok(SRC.includes("const actColor=lookEventColor(primary.color,null,T.muted);"));
    assert.ok(!SRC.includes("subjectRowStyle(primary.color||T.muted)"));
  });
  test("subject pickers pass palette colors", () => {
    assert.equal((SRC.match(/color:subjectColor\(s\.id,s\.color,userSubjects\)/g) || []).length, 3);
  });
  test("lookEventColor: classic is a pass-through", () => {
    m.setLook({ palette: "classic" });
    assert.equal(m.lookEventColor("#D9806B", "a", "#000000", subjects), "#D9806B");
    assert.equal(m.lookEventColor(null, "a", "#123456", subjects), "#123456");
  });
  test("lookEventColor: a stale copy of the class color follows the palette live", () => {
    m.applyTheme("light", "Lime", "Comfortable");
    m.setLook({ palette: "forest", perClass: {} });
    const live = m.subjectColor("a", "#000000", subjects);
    assert.notEqual(live.toLowerCase(), "#d9806b");
    assert.equal(m.lookEventColor("#D9806B", "a", "#000000", subjects), live);
    m.setLook({ palette: "pink" });
    const live2 = m.subjectColor("a", "#000000", subjects);
    assert.equal(m.lookEventColor("#D9806B", "a", "#000000", subjects), live2);
    assert.notEqual(live, live2);
  });
  test("lookEventColor: default swatch remaps by slot, a true custom color is kept", () => {
    m.applyTheme("light", "Lime", "Comfortable");
    m.setLook({ palette: "ocean" });
    const ocean = m.LOOK_PALETTES.find((p) => p.id === "ocean");
    assert.equal(m.lookEventColor(m.SUBJECT_COLORS[1], null, "#000", subjects), ocean.swatches[1]);
    assert.equal(m.lookEventColor("#123456", null, "#000", subjects), "#123456");
  });
  test("calendar day/week/detail views resolve event colors through lookEventColor", () => {
    assert.equal((SRC.match(/lookEventColor\(ev\.color,ev\.courseId\|\|ev\.subject,colorOf\(ev\.courseId\|\|ev\.subject\)\)/g) || []).length >= 4, true);
    assert.ok(!SRC.includes("ev.color||colorOf(ev.courseId||ev.subject)"));
  });
});

describe("contrast on accent fills", () => {
  test("accent-filled controls use onLime rather than a fixed dark ink", () => {
    for (const s of [
      "color:examPrepSpacingStyle===opt.key?T.onLime:T.text",
      'background:recOn?T.red:T.lime,color:recOn?"#fff":T.onLime',
      "color:it.attackBlock?T.onLime:T.amber",
      "color:isCurrent?T.onLime:unlocked?T.lime:T.faint",
    ]) assert.ok(SRC.includes(s), s);
  });
  test("onLime is readable on the accent for every palette and mode", () => {
    for (const mode of ["light", "dark"]) for (const p of NON_CLASSIC()) {
      m.setLook({ palette: p.id, accentFollows: true });
      m.applyTheme(mode, "Lime", "Comfortable");
      assert.ok(m.contrastRatio(m.T.onLime, m.T.lime) >= 4.5, p.id + " " + mode);
    }
  });
});
