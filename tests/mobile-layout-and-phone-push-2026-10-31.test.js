// 2026-10-31: phone support. A friend couldn't use Studlin on a phone: the
// sidebar ate the screen, nothing adapted to width, and iPhone can't show web
// push unless the app is installed to the Home Screen (needs a manifest).
// These pin the specific pieces; the layout itself is visual and needs a
// real look at phone width, which a source-level test can't give.
const { test, describe } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const SOURCE = fs.readFileSync(path.join(ROOT, "studlin-app.jsx"), "utf8").split("\r\n").join("\n");
const APP_HTML = fs.readFileSync(path.join(ROOT, "studlin-web-app.html"), "utf8");

describe("installable web app", () => {
  const manifest = JSON.parse(fs.readFileSync(path.join(ROOT, "manifest.webmanifest"), "utf8"));

  test("manifest is standalone, starts at /app, and has 192 + 512 icons that exist", () => {
    assert.equal(manifest.display, "standalone");
    assert.equal(manifest.start_url, "/app");
    const sizes = manifest.icons.map((i) => i.sizes);
    assert.ok(sizes.includes("192x192"));
    assert.ok(sizes.includes("512x512"));
    manifest.icons.forEach((i) => assert.ok(fs.existsSync(path.join(ROOT, i.src.replace(/^\//, ""))), i.src));
  });

  test("app page links the manifest and has the iOS home-screen tags", () => {
    assert.ok(APP_HTML.includes('rel="manifest" href="/manifest.webmanifest"'));
    assert.ok(APP_HTML.includes('name="apple-mobile-web-app-capable"'));
    assert.ok(APP_HTML.includes("viewport-fit=cover"));
  });
});

describe("phone layout shell", () => {
  test("useIsPhone hook and breakpoint exist", () => {
    assert.ok(SOURCE.includes("const PHONE_MAX_WIDTH=768;"));
    assert.ok(SOURCE.includes("function useIsPhone(){"));
  });

  test("sidebar is hidden on phone and a bottom tab bar renders instead", () => {
    assert.ok(SOURCE.includes('display:isPhone?"none":"flex",flexDirection:"column",padding:navExpanded'));
    assert.ok(SOURCE.includes('{isPhone&&(\n        <nav aria-label="Main"'));
  });

  test("calendar defaults to Day view on a phone when the student never chose a view", () => {
    assert.ok(SOURCE.includes('lsGet("calView",(typeof window!=="undefined"&&window.innerWidth<=PHONE_MAX_WIDTH)?"daily":"weekly")'));
  });
});

describe("phone notifications", () => {
  test("local notifications go through the service worker (iPhone has no Notification constructor)", () => {
    assert.ok(SOURCE.includes("async function showLocalNotification(title,body){"));
    assert.ok(SOURCE.includes("reg.showNotification(title,"));
    assert.ok(!SOURCE.includes('try{new Notification("Studlin",{body:ev.title+'));
  });

  test("Settings tells an iPhone user to install first instead of showing a dead toggle", () => {
    assert.ok(SOURCE.includes("Install Studlin to get notifications on your iPhone"));
    assert.ok(SOURCE.includes("function isIOSDevice(){"));
    assert.ok(SOURCE.includes("function isInstalledApp(){"));
  });

  test("reminder prefs are mirrored to the server when settings change", () => {
    assert.ok(SOURCE.includes('action:"set-reminder-prefs"'));
    assert.ok(SOURCE.includes("const REMINDER_PREF_KEYS={settings:1,schoolTerm:1,routineSkips:1,routineOverrides:1};"));
    assert.ok(SOURCE.includes("if(REMINDER_PREF_KEYS[k])syncReminderPrefs();"));
  });
});
