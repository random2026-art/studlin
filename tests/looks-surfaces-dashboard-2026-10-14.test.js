// Looks surfaces: Dashboard cards + shared primitives (Card, Badge, Prog, Modal) read palette tokens.
const { test, describe, beforeEach } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const path = require("path");
const { loadStudlinModule } = require("./harness.js");

const m = loadStudlinModule();
const SRC = fs.readFileSync(path.join(__dirname, "..", "studlin-app.jsx"), "utf8");
const slice = (from, to) => {
  const a = SRC.indexOf(from);
  assert.ok(a >= 0, "missing " + from);
  const b = SRC.indexOf(to, a + from.length);
  assert.ok(b > a, "missing end " + to);
  return SRC.slice(a, b);
};
beforeEach(() => m.setLook({ palette: "classic", blockStyle: "soft", perClass: {}, seed: 0, accentFollows: true }));

describe("looks surfaces: primitives", () => {
  test("Badge reads chipBg/accentInk/borderTint when lookOn", () => {
    const s = slice("const Badge = ", "const Prog = ");
    for (const t of ["T.lookOn", "T.chipBg", "T.accentInk", "T.borderTint"]) assert.ok(s.includes(t), t);
  });
  test("Prog track uses accentSoft when lookOn and keeps the accent fill", () => {
    const s = slice("const Prog = ", "const Divider = ");
    assert.ok(s.includes("T.accentSoft")); assert.ok(s.includes("color=T.lime"));
  });
  test("Card uses tint and borderTint when lookOn", () => {
    const s = slice("const Card = ", "// ─── MODAL");
    assert.ok(s.includes("T.tint")); assert.ok(s.includes("T.borderTint"));
  });
  test("Modal header band uses hdrBg/hdrText when lookOn", () => {
    const s = slice("const Modal = ", "// ─── GUIDED TAB TOUR");
    assert.ok(s.includes("T.hdrBg")); assert.ok(s.includes("T.hdrText"));
  });
});

describe("looks surfaces: Dashboard", () => {
  const dash = () => slice("function Dashboard(", "// ─── FEEDBACK");
  test("cards, chips, buttons and rows read tokens", () => {
    const d = dash();
    for (const t of ["T.tint", "T.borderTint", "T.chipBg", "T.accentInk", "T.accentSoft", "T.lookOn"]) assert.ok(d.includes(t), t);
    assert.ok(/borderTop:`3px solid \$\{T\.lime\}`/.test(d), "accent top line");
    assert.ok(d.includes("subjectColor(t.subject,null)"), "plan row class stripe");
  });
  test("every top-level Dashboard card goes through dashCardStyle", () => {
    const d = dash();
    assert.ok((d.match(/dashCardStyle\(/g) || []).length >= 6);
    assert.ok(!/<div style=\{\{background:T\.card,border:`1px solid \$\{T\.border\}`,borderRadius:8/.test(d), "no hand-rolled card left");
  });
  test("weekly bars no longer hard-code the dark-only white-alpha fills", () => {
    const d = dash();
    assert.ok(!d.includes('"rgba(255,255,255,0.25)"'));
    assert.ok(!d.includes('"rgba(255,255,255,0.4)":"rgba(255,255,255,0.18)"'));
    assert.ok(d.includes("wkBarTint"));
  });
  test("no em dashes added to Dashboard strings", () => {
    assert.ok(!/[>"]\s*[^"<>]*—[^"<>]*[<"]/.test(slice("const dashCardStyle=", "const SETUP_CHECKLIST_SKIP_COOLDOWN_MS")));
  });
});

describe("looks surfaces: Classic no-op", () => {
  const snap = (mode) => { m.applyTheme(mode, "Lime", "Comfortable"); return [m.T.lookOn, m.T.tint === m.T.card, m.T.borderTint === m.T.border, m.T.hdrBg === m.T.card, m.T.accentSoft === m.T.card2, m.T.chipBg === m.T.card2, m.T.accentInk === m.T.text]; };
  for (const mode of ["light", "dark"]) {
    test("classic keeps lookOn false and tokens equal to the surfaces they replace in " + mode, () => {
      const s = snap(mode);
      assert.equal(s[0], false);
      assert.ok(s.slice(1).every(Boolean), JSON.stringify(s));
    });
    test("a palette turns lookOn on and tint differs from card in " + mode, () => {
      m.setLook({ palette: "sunset" });
      m.applyTheme(mode, "Lime", "Comfortable");
      assert.equal(m.T.lookOn, true);
      assert.notEqual(m.T.chipBg, m.T.card2);
    });
  }
});
