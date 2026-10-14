// User report, 2026-09-15 ("there is no way to dismiss this reconstruct
// my week thingy thats stupid"): the Catch Me Up recovery banner
// (catchUpBanner) only ever cleared by completing the full "Rebuild my
// week" flow -- confirmCatchUpRebuild's own setCatchUpBanner(null). There
// was no way to just close it and move on. Component-closure UI, source-
// level regression guards only, same convention this file's other
// component-closure fixes already use. Run with `npm test`.
const { test, describe } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const path = require("path");

const SOURCE = fs.readFileSync(path.join(__dirname, "..", "studlin-app.jsx"), "utf8");

describe("catchUpBanner now has a real dismiss control", () => {
  test("dismissCatchUpBanner persists a dayKey so the banner doesn't reappear later the same day, then clears it", () => {
    const idx = SOURCE.indexOf("const dismissCatchUpBanner=()=>{");
    assert.notEqual(idx, -1);
    const body = SOURCE.slice(idx, idx + 250);
    assert.match(body, /lsSet\("catchUpBannerDismissedDate",dayKey\(\)\)/);
    assert.match(body, /setCatchUpBanner\(null\)/);
  });

  test("the mount effect that shows the banner is gated on that same dismissed-date check", () => {
    // 2026-09-21: gate renamed recoveryPending -> catchUpOffered when the
    // banner started showing for a single missed item too (see
    // pinned-never-moved-and-preview-before-move-2026-09-21.test.js).
    assert.match(SOURCE, /if\(catchUpOffered&&lsGet\("catchUpBannerDismissedDate",null\)!==today\)\{/);
  });

  test("the banner renders a visible close button wired to dismissCatchUpBanner, not just the Rebuild action", () => {
    // 2026-10-14: Stu delivers this by default; the banner remains as the fallback when Stu is off.
    const idx = SOURCE.indexOf('{catchUpBanner&&!stuSettingOn("mascotReminders")&&(()=>{');
    assert.notEqual(idx, -1);
    const body = SOURCE.slice(idx, idx + 1200);
    assert.match(body, /<Btn onClick=\{openCatchUpPreview\}/, "the existing Rebuild my week action must still be there");
    assert.match(body, /onClick=\{dismissCatchUpBanner\}/, "a real dismiss control must exist alongside it");
  });

  test("dismissing never touches the missed items themselves -- only the nudge about them", () => {
    const idx = SOURCE.indexOf("const dismissCatchUpBanner=()=>{");
    const body = SOURCE.slice(idx, idx + 250);
    assert.doesNotMatch(body, /lsSet\("events"/, "dismiss must not silently mark or move anything -- it only silences today's nudge");
  });
});
