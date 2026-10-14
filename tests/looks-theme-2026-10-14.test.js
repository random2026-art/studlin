// Whole-app Look theming foundation: theme tokens, applyLookTheme, per-class assignment.
const { test, describe, beforeEach } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const path = require("path");
const { loadStudlinModule } = require("./harness.js");

const m = loadStudlinModule();
const SRC = fs.readFileSync(path.join(__dirname, "..", "studlin-app.jsx"), "utf8");
const NON_CLASSIC = () => m.LOOK_PALETTES.filter((p) => p.id !== "classic");
const TOKENS = ["accent", "accentDk", "accentSoft", "accentInk", "hdrBg", "hdrText", "tint", "borderTint", "todayBg", "todayText", "chipBg"];
const CONTRACT = ["accentSoft", "accentInk", "hdrBg", "hdrText", "tint", "borderTint", "todayBg", "todayText", "chipBg"];
const HEX = /^#[0-9A-Fa-f]{6}$/;

function resetLook() { m.setLook({ palette: "classic", blockStyle: "soft", perClass: {}, seed: 0, accentFollows: true }); }
function warmOffWhite(hex) {
  const h = hex.replace("#", "");
  const r = parseInt(h.slice(0, 2), 16), g = parseInt(h.slice(2, 4), 16), b = parseInt(h.slice(4, 6), 16);
  return (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255 > 0.85 && r > b + 8;
}
const mkSubjects = (n) => Array.from({ length: n }, (_, i) => ({ id: "subj-" + (1000 + i * 7), label: "Class " + i, color: "#112233" }));
beforeEach(resetLook);

describe("looks theme: tokens", () => {
  test("every non-classic palette has full light and dark theme tokens as hex", () => {
    for (const p of NON_CLASSIC()) {
      for (const mode of ["light", "dark"]) {
        for (const k of TOKENS) assert.match(p.theme[mode][k], HEX, p.id + " " + mode + " " + k);
      }
    }
    assert.equal(m.LOOK_PALETTES[0].theme, undefined, "classic has no theme");
  });
  for (const mode of ["light", "dark"]) {
    test("contrast pairs are >= 4.5 in " + mode, () => {
      for (const p of NON_CLASSIC()) {
        const t = p.theme[mode];
        const pairs = [["accentInk/accentSoft", t.accentInk, t.accentSoft], ["hdrText/hdrBg", t.hdrText, t.hdrBg],
          ["todayText/todayBg", t.todayText, t.todayBg], ["accentInk/chipBg", t.accentInk, t.chipBg],
          ["fill text/accent", m.lookTextOnFill(t.accent), t.accent]];
        for (const [n, a, b] of pairs) assert.ok(m.contrastRatio(a, b) >= 4.5, p.id + " " + mode + " " + n + " " + m.contrastRatio(a, b).toFixed(2));
      }
    });
    test("no cream or warm off-white in any theme token in " + mode, () => {
      for (const p of NON_CLASSIC()) for (const k of TOKENS) assert.equal(warmOffWhite(p.theme[mode][k]), false, p.id + " " + mode + " " + k);
    });
  }
});

describe("looks theme: applyLookTheme", () => {
  const snap = () => JSON.stringify(CONTRACT.map((k) => m.T[k]).concat([m.T.lime, m.T.limeDk, m.T.limeLt, m.T.glow, m.T.card, m.T.card2]));
  for (const mode of ["light", "dark"]) {
    test("classic is a visual no-op with safe defaults in " + mode, () => {
      m.applyTheme(mode, "Lime", "Comfortable");
      assert.equal(m.T.hdrBg, m.T.card); assert.equal(m.T.hdrText, m.T.muted);
      assert.equal(m.T.accentSoft, m.T.card2); assert.equal(m.T.accentInk, m.T.text);
      assert.equal(m.T.tint, m.T.card); assert.equal(m.T.borderTint, m.T.border);
      assert.equal(m.T.todayBg, m.T.lime); assert.equal(m.T.todayText, m.T.ink); assert.equal(m.T.chipBg, m.T.card2);
      const fresh = mode === "dark" ? m.darkT : m.lightT;
      const acc = m.ACCENTS.Lime[mode === "dark" ? "dk" : "lt"];
      assert.equal(m.T.lime, acc.lime); assert.equal(m.T.card, fresh.card); assert.equal(m.T.card2, fresh.card2);
    });
    test("non-classic is idempotent and never mutates lightT/darkT in " + mode, () => {
      const before = JSON.stringify([m.lightT, m.darkT]);
      m.setLook({ palette: "sunset" });
      m.applyTheme(mode, "Lime", "Comfortable");
      const a = snap();
      m.applyTheme(mode, "Lime", "Comfortable");
      assert.equal(snap(), a);
      assert.equal(JSON.stringify([m.lightT, m.darkT]), before);
      const th = m.LOOK_PALETTES.find((p) => p.id === "sunset").theme[mode];
      assert.equal(m.T.hdrBg, th.hdrBg); assert.equal(m.T.lime, th.accent);
      assert.equal(m.T.card, (mode === "dark" ? m.darkT : m.lightT).card, "card is not retinted");
    });
    test("switching back to classic restores everything in " + mode, () => {
      m.applyTheme(mode, "Lime", "Comfortable");
      const classic = snap();
      m.setLook({ palette: "ocean" }); m.applyTheme(mode, "Lime", "Comfortable");
      assert.notEqual(snap(), classic);
      m.setLook({ palette: "classic" }); m.applyTheme(mode, "Lime", "Comfortable");
      assert.equal(snap(), classic);
    });
  }
  test("accentFollows=false keeps the Settings accent but still themes surfaces", () => {
    m.setLook({ palette: "forest", accentFollows: false });
    m.applyTheme("light", "Sky", "Comfortable");
    assert.equal(m.T.lime, m.ACCENTS.Sky.lt.lime);
    assert.equal(m.T.hdrBg, m.LOOK_PALETTES.find((p) => p.id === "forest").theme.light.hdrBg);
    m.setLook({ accentFollows: true });
    m.applyTheme("light", "Sky", "Comfortable");
    assert.equal(m.T.lime, m.LOOK_PALETTES.find((p) => p.id === "forest").theme.light.accent);
  });
  test("Btn and setAccent wiring present", () => {
    assert.match(SRC, /lime:\{background:T\.lime,color:T\.lookOn\?lookTextOnFill\(T\.lime\):T\.bg\}/);
    assert.match(SRC, /setLook\(\{accentFollows:false\}\)/);
    assert.match(SRC, /const appLook=useLook\(\);\s*applyTheme\(theme, accent, density\)/);
  });
});

describe("looks theme: per-class assignment", () => {
  test("normalize drops garbage perClass entries and bad seed", () => {
    const n = m.lookNormalize({ palette: "sunset", perClass: { a: 3, b: 9, c: "x", d: -1, e: 1.5, f: null, g: 7 }, seed: -4 });
    assert.equal(JSON.stringify(n.perClass), JSON.stringify({ a: 3, g: 7 }));
    assert.equal(n.seed, 0); assert.equal(n.v, 1); assert.equal(n.accentFollows, true);
    assert.equal(JSON.stringify(m.lookNormalize({ perClass: [1, 2] }).perClass), "{}");
    assert.equal(m.lookNormalize({ accentFollows: false }).accentFollows, false);
    assert.equal(m.lookNormalize({ seed: 5 }).seed, 5);
  });
  test("auto-assign is deterministic and order-independent", () => {
    const subs = mkSubjects(6);
    const a = m.lookAutoAssign(subs, "light", 0, "sunset", {});
    const b = m.lookAutoAssign(subs.slice().reverse(), "light", 0, "sunset", {});
    assert.equal(JSON.stringify(a), JSON.stringify(b));
    assert.equal(JSON.stringify(m.lookAutoAssign(subs, "light", 3, "sunset", {})), JSON.stringify(m.lookAutoAssign(subs, "light", 3, "sunset", {})));
    assert.equal(new Set(Object.values(a)).size, 6, "no repeats while swatches remain");
  });
  for (const pid of ["sunset", "pastel", "forest", "ocean"]) {
    test("neighbors are not near-duplicates in " + pid, () => {
      const p = m.LOOK_PALETTES.find((x) => x.id === pid);
      for (const seed of [0, 1, 2, 3]) {
        const subs = mkSubjects(7);
        const out = m.lookAutoAssign(subs, "light", seed, pid, {});
        const sorted = subs.map((s) => s.id).sort();
        // Each pick must be the farthest available from its predecessor (greedy guarantee) and clear a floor.
        let worst = Infinity;
        for (let i = 1; i < 6; i++) worst = Math.min(worst, m.lookDist(p.swatches[out[sorted[i]]], p.swatches[out[sorted[i - 1]]]));
        assert.ok(worst >= 40, pid + " seed " + seed + " worst neighbor distance " + worst.toFixed(1));
      }
    });
  }
  test("assignment wraps with least-used when classes exceed 8", () => {
    const out = m.lookAutoAssign(mkSubjects(12), "light", 0, "ocean", {});
    const counts = {}; Object.values(out).forEach((v) => { counts[v] = (counts[v] || 0) + 1; });
    assert.equal(Object.keys(counts).length, 8);
    assert.ok(Math.max(...Object.values(counts)) <= 2);
  });
  test("fixed picks are honored", () => {
    const subs = mkSubjects(4);
    const out = m.lookAutoAssign(subs, "light", 0, "sunset", { [subs[2].id]: 5 });
    assert.equal(out[subs[2].id], 5);
    assert.equal(Object.values(out).filter((v) => v === 5).length, 1);
  });
  test("shuffle persists a new seed and a different assignment that survives a reload", () => {
    const subs = mkSubjects(6);
    m.lsSet("user-subjects", subs);
    m.setLook({ palette: "sunset" });
    m.lookResetAssign(subs, "light");
    const a = JSON.stringify(m.getLook().perClass);
    m.lookShuffle(subs, "light");
    const l = m.getLook();
    assert.equal(l.seed, 1);
    assert.notEqual(JSON.stringify(l.perClass), a);
    assert.equal(JSON.stringify(m.readLook().perClass), JSON.stringify(l.perClass));
    assert.equal(m.readLook().seed, 1);
    m.lookResetAssign(subs, "light");
    assert.equal(m.getLook().seed, 0);
    assert.equal(JSON.stringify(m.getLook().perClass), a);
  });
  test("a class added later gets an index persisted; ids never pruned; classic is a no-op", () => {
    const subs = mkSubjects(3);
    assert.equal(m.lookPersistMissing(subs), false, "classic never writes");
    assert.equal(Object.keys(m.getLook().perClass).length, 0);
    m.setLook({ palette: "forest" });
    m.lookPersistMissing(subs);
    assert.equal(Object.keys(m.getLook().perClass).length, 3);
    const more = subs.concat([{ id: "subj-new", label: "New", color: "#000000" }]);
    assert.equal(m.lookPersistMissing(more), true);
    const pc = m.getLook().perClass;
    assert.ok(Number.isInteger(pc["subj-new"]));
    assert.ok(![subs[0].id, subs[1].id, subs[2].id].some((id) => pc[id] === pc["subj-new"]), "uses an unused swatch");
    assert.equal(m.lookPersistMissing(more), false, "second call is a no-op");
    m.lookPersistMissing(subs);
    assert.ok(m.getLook().perClass["subj-new"] !== undefined, "never pruned: late-loading subjects must not wipe manual picks");
  });
  test("subjectColor precedence: perClass over auto, classic ignores perClass and never writes subject.color", () => {
    const subs = mkSubjects(3);
    m.lsSet("user-subjects", subs);
    const sun = m.LOOK_PALETTES.find((p) => p.id === "sunset");
    m.setLook({ palette: "classic", perClass: { [subs[0].id]: 4 } });
    m.applyTheme("light", "Lime", "Comfortable");
    assert.equal(m.subjectColor(subs[0].id, "#fallback"), "#112233");
    m.setLook({ palette: "sunset", perClass: { [subs[0].id]: 4 } });
    assert.equal(m.subjectColor(subs[0].id, "#fallback"), sun.swatches[4]);
    assert.equal(m.subjectColor(subs[0].label, "#fallback"), sun.swatches[4]);
    assert.equal(m.subjectColor("unknown", "#fallback"), "#fallback");
    assert.equal(JSON.stringify(m.lsGet("user-subjects", [])), JSON.stringify(subs), "palette is a view");
    m.setLook({ palette: "classic" });
    assert.equal(m.subjectColor(subs[0].id), "#112233", "switching back is lossless");
  });
  test("ev.color precedence is still applied by call sites", () => {
    assert.ok((SRC.match(/lookEventColor\(ev\.color,ev\.courseId\|\|ev\.subject,/g) || []).length >= 4);
    assert.equal((SRC.match(/const colorOf=\(tg\)=>\{const s=userSubjects/g) || []).length, 0, "no local colorOf copies ignore the look");
  });
  test("assign UI copy is present and has no em dashes", () => {
    assert.match(SRC, /Your classes got colors from \$\{p\.name\}\. Change any below\./);
    assert.match(SRC, /Colors you set on a single event stay as you set them\./);
    assert.match(SRC, /Buttons and highlights use \$\{pal\.name\}\. Change in Settings\./);
    const a = SRC.indexOf("// ===== LOOKS"), b = SRC.indexOf("// ===== END LOOKS");
    assert.equal(SRC.slice(a, b).includes("—"), false);
  });
});

describe("review fixes: readable primary buttons, no pick wipes, live chat accent", () => {
  const SRC2 = require("fs").readFileSync(require("path").join(__dirname, "..", "studlin-app.jsx"), "utf8").replace(/\r\n/g, "\n");
  test("T.onLime exists: Classic keeps ink, palettes pick a readable label color, and primary buttons use it", () => {
    assert.ok(SRC2.includes("T.onLime=T.ink;"));
    assert.ok(SRC2.includes("T.onLime=lookTextOnFill(T.lime);"));
    assert.ok(!SRC2.includes("background:T.lime,color:T.ink"), "no primary fill may keep the fixed ink label");
  });
  test("lookPersistMissing only fills missing classes and never prunes manual picks", () => {
    const i = SRC2.indexOf("function lookPersistMissing");
    const body = SRC2.slice(i, i + 900);
    assert.ok(!body.includes("stale"));
    assert.ok(body.includes("if(!missing)return false;"));
  });
  test("picking one class color keeps the rest of the auto assignment unpinned", () => {
    assert.ok(SRC2.includes("perClass:{...(look.perClass||{}),[id]:i}"));
  });
  test("chat message accents are computed at render, not captured at load", () => {
    assert.ok(SRC2.includes("const studlinAiKindAccents=()=>({"));
    assert.ok(!SRC2.includes("const STUDLIN_AI_MSG_KIND_ACCENT="));
  });
});
