// Persona audit, 2026-09-25 (Wave 1, chunk 5: keyboard/screen-reader basics).
// Settings switches were clickable divs (no keyboard, no screen reader), and
// Toggle/Row were defined inside SettingsTab so every render remounted them
// (which would drop keyboard focus from a real button). This makes no claim
// of WCAG conformance; it only pins the specific fixes.
const { test, describe } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const path = require("path");

const SOURCE = fs.readFileSync(path.join(__dirname, "..", "studlin-app.jsx"), "utf8");
const settings = SOURCE.slice(SOURCE.indexOf("function SettingsTab("));

describe("Settings switches", () => {
  test("Toggle and Row are module-level, not re-created inside SettingsTab", () => {
    assert.ok(SOURCE.includes("function SettingsToggle({k,label}){"));
    assert.ok(SOURCE.includes("function SettingsRow({label,sub,k,right,highlight}){"));
    assert.ok(!/const Toggle = \(\{k\}\) =>/.test(settings));
    assert.ok(!/const Row = \(\{label/.test(settings));
    assert.ok(settings.includes("<SettingsCtx.Provider value={{toggles,tog}}>"));
  });

  test("no clickable-div pill switch is left in SettingsTab; all are real switch buttons", () => {
    const end = settings.indexOf("\nfunction ", 10);
    const body = end > 0 ? settings.slice(0, end) : settings;
    assert.ok(!/<div onClick=[^\n]*width:38,height:20/.test(body));
    const switches = body.match(/role="switch" aria-checked=/g) || [];
    assert.equal(switches.length, 6);
    assert.ok(/aria-label="Anonymous usage analytics"/.test(body));
  });

  test("the shared switch is a button with role=switch and an accessible name", () => {
    const i = SOURCE.indexOf("function SettingsToggle(");
    const fn = SOURCE.slice(i, i + 700);
    assert.match(fn, /<button type="button" role="switch" aria-checked=\{on\} aria-label=\{label\}/);
  });
});

describe("Shared Modal", () => {
  test("is announced as a dialog, named by its title, with a labelled close button", () => {
    const i = SOURCE.indexOf("const Modal = ({open");
    const fn = SOURCE.slice(i, i + 3600);
    assert.match(fn, /role="dialog" aria-modal="true" aria-label=\{typeof title==="string"\?title:undefined\}/);
    assert.match(fn, /<button type="button" aria-label="Close" onClick=\{onClose\}/);
  });
});
