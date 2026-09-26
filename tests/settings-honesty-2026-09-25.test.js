// Persona audit, 2026-09-25 (Wave 1, chunk 1: "honest settings"). Settings
// had switches that promised something and did nothing:
//  - "Study milestones" and "Product updates": read nowhere, and no server
//    code sends either email (api/ only sends note-share, welcome and the
//    sign-up code).
//  - "Use my work to train Studlin AI": read nowhere; nothing trains on
//    student content (privacy.html says as much).
//  - "Anonymous usage analytics": read nowhere, defaulted to OFF, while
//    PostHog and Firebase Analytics ran for everyone. Now a real opt-out.
//  - "Weekly Wrapped digest" is real but gates the in-app popup, not an
//    email -- renamed and moved out of the empty Email card.
//
// Source-level regression guards (component-closure UI) plus real
// invocations of the FAQ matcher. Run with `npm test`.
const { test, describe } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const path = require("path");
const { loadStudlinModule } = require("./harness.js");

const ROOT = path.join(__dirname, "..");
const SOURCE = fs.readFileSync(path.join(ROOT, "studlin-app.jsx"), "utf8");

describe("Do-nothing toggles are gone", () => {
  test("the four dead Settings rows no longer exist", () => {
    for (const label of ["Study milestones", "Product updates", "Use my work to train Studlin AI"]) {
      assert.ok(!SOURCE.includes(`<Row label="${label}"`), `"${label}" row must be removed`);
    }
    assert.ok(!SOURCE.includes('k="squad"') && !SOURCE.includes('k="emails"') && !SOURCE.includes('k="collect"'));
  });

  test("the empty Email card is gone, and Weekly Wrapped is an honestly named popup row", () => {
    assert.ok(!SOURCE.includes('marginBottom:4}}>Email</div>'), "the Email card heading must be removed -- nothing sends those emails");
    assert.ok(SOURCE.includes('<Row label="Weekly Wrapped popup"'));
    assert.ok(!SOURCE.includes('<Row label="Weekly Wrapped digest"'));
  });

  test("the dead defaults are no longer seeded into the toggles object", () => {
    const idx = SOURCE.indexOf("const [toggles,setToggles]=useState(()=>({...{push:true");
    assert.notEqual(idx, -1);
    const line = SOURCE.slice(idx, idx + 700);
    for (const key of ["analytics:", "collect:", "squad:", "emails:"]) {
      assert.ok(!line.includes(key), `${key} must not be a default any more`);
    }
    assert.ok(line.includes("wrapped:true"), "the real Weekly Wrapped toggle keeps its default");
  });
});

describe("Anonymous usage analytics is a real opt-out", () => {
  test("its own storage key, written only when the student flips the switch", () => {
    assert.match(SOURCE, /const toggleAnalytics=\(\)=>\{[\s\S]{0,260}lsSet\("analyticsOptOut",next\);[\s\S]{0,60}applyAnalyticsChoice\(next\);/);
    // Deliberately NOT part of `toggles`, whose defaults get persisted the
    // moment any other toggle is touched.
    assert.match(SOURCE, /useState\(\(\)=>lsGet\("analyticsOptOut",false\)===true\)/);
  });

  test("applyAnalyticsChoice stops both trackers", () => {
    const idx = SOURCE.indexOf("function applyAnalyticsChoice(optOut){");
    assert.notEqual(idx, -1);
    const body = SOURCE.slice(idx, idx + 500);
    assert.match(body, /opt_out_capturing\(\)/);
    assert.match(body, /opt_in_capturing\(\)/);
    assert.match(body, /setAnalyticsCollectionEnabled\(!optOut\)/);
  });

  test("every page that starts analytics reads the opt-out BEFORE starting it", () => {
    for (const page of ["studlin-web-app.html", "studlin-onboarding.html", "studlin-sign-in.html"]) {
      const html = fs.readFileSync(path.join(ROOT, page), "utf8");
      assert.match(html, /opt_out_capturing_by_default:\(function\(\)\{try\{return localStorage\.getItem\('studlin-analyticsOptOut'\)==='true'/, `${page}: PostHog must start opted out when the student chose that`);
    }
    const app = fs.readFileSync(path.join(ROOT, "studlin-web-app.html"), "utf8");
    assert.match(app, /if\(localStorage\.getItem\('studlin-analyticsOptOut'\)!=='true'\)firebase\.analytics\(\)/, "Firebase Analytics must not even initialize when opted out");
  });
});

describe("Help answers match the new Settings layout", () => {
  test("Weekly Wrapped answer points at the new row and still claims only the popup", () => {
    const m = loadStudlinModule();
    const entry = m.matchStudlinHelpEntry("turn off weekly wrapped");
    assert.equal(entry.id, "weekly-wrapped");
    assert.match(entry.answer, /Reminders → "Weekly Wrapped popup"/);
    assert.doesNotMatch(entry.answer, /email/i);
  });

  test("'turn off analytics' has a real answer, honest that it is per-device", () => {
    const m = loadStudlinModule();
    const entry = m.matchStudlinHelpEntry("how do i turn off analytics");
    assert.ok(entry);
    assert.equal(entry.id, "analytics-opt-out");
    assert.match(entry.answer, /on this device/);
  });
});
