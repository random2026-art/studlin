// Bug report 2026-09-26: after switching accounts the setup wizard came back
// on every visit to Calendar. Two causes fixed: settings were pushed to the
// cloud before the cloud copy was read (overwriting "setup done" with a wiped
// device's empty defaults), and "Save and finish later" did not defer anything.
const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const path = require("path");
const S = fs.readFileSync(path.join(__dirname, "..", "studlin-app.jsx"), "utf8");

test("settings are never pushed before the cloud copy has been read", () => {
  assert.match(S, /let settingsSyncHydrated=false;\s*function pushSettingsSync\(\)\{\s*const u=firebase\.auth\(\)\.currentUser;\s*if\(!u\|\|!settingsSyncHydrated\)return;/);
  const i = S.indexOf("async function hydrateSettingsSyncOnAuth(){");
  const body = S.slice(i, i + 2200);
  assert.match(body, /settingsSyncHydrated=false;/);
  assert.match(body, /\}catch\(e\)\{\}\s*settingsSyncHydrated=true;/, "set true after the read, even if it failed");
});

test("Save and finish later defers the wizard for a day, and the auto-open honors it", () => {
  assert.match(S, /lsSet\("classSetupDeferredUntil",Date\.now\(\)\+86400000\)/);
  assert.match(S, /&&Date\.now\(\)>=lsGet\("classSetupDeferredUntil",0\)\)/);
});
