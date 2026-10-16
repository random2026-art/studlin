// 2026-10-16: secondary text was too faint on video (light theme time labels).
const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const path = require("path");
const APP = fs.readFileSync(path.join(__dirname, "..", "studlin-app.jsx"), "utf8").replace(/\r\n/g, "\n");

function alphaOf(rgba) { return parseFloat(rgba.match(/rgba\([^)]*,\s*([\d.]+)\)/)[1]); }
function lum(hex) {
  const c = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((v) => (v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4)));
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
}
const contrast = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };
function overWhite(alpha) { const ch = Math.round(255 - alpha * (255 - 0x14)); return "#" + [ch, Math.round(255 - alpha * (255 - 0x1f)), Math.round(255 - alpha * (255 - 0x18))].map((n) => n.toString(16).padStart(2, "0")).join(""); }

test("light theme muted text clears WCAG AA on white, faint is no longer near-invisible", () => {
  const light = APP.slice(APP.indexOf("const lightT = {"));
  const muted = alphaOf(light.match(/muted:\s*"(rgba\([^"]+\))"/)[1]);
  const faint = alphaOf(light.match(/faint:\s*"(rgba\([^"]+\))"/)[1]);
  assert.ok(muted >= 0.68, "muted alpha " + muted);
  assert.ok(faint >= 0.5, "faint alpha " + faint);
  assert.ok(muted > faint, "hierarchy kept");
  assert.ok(contrast(overWhite(muted), "#ffffff") >= 4.5);
  assert.ok(contrast(overWhite(faint), "#ffffff") >= 3);
});
test("dark theme secondary text is lighter than before", () => {
  const dark = APP.slice(APP.indexOf("const darkT = {"), APP.indexOf("const lightT = {"));
  const faint = dark.match(/faint:\s*"(#[0-9A-Fa-f]{6})"/)[1];
  assert.notEqual(faint.toLowerCase(), "#3f5147");
  assert.ok(contrast(faint, "#19211C") >= 3, "faint on dark card");
});
test("Today's plan time labels use the darker color, slightly larger", () => {
  assert.ok(!APP.includes("<span style={{fontFamily:T.mono,fontSize:10,color:T.faint}}>"));
  assert.equal((APP.match(/<span style=\{\{fontFamily:T\.mono,fontSize:11,fontWeight:500,color:T\.muted\}\}>/g) || []).length, 3);
});
