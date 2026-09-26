// A second Google account signing in on the same browser used to see the
// first account's calendar, because sign-out never cleared local data.
const { test, describe } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const path = require("path");
const guard = require("../owner-guard.js");
const ROOT = path.join(__dirname, "..");

function fakeStorage(initial) {
  const m = new Map(Object.entries(initial || {}));
  return {
    get length() { return m.size; },
    key: (i) => Array.from(m.keys())[i] ?? null,
    getItem: (k) => (m.has(k) ? m.get(k) : null),
    setItem: (k, v) => { m.set(k, String(v)); },
    removeItem: (k) => { m.delete(k); },
    keys: () => Array.from(m.keys()).sort(),
  };
}

describe("owner guard (real calls)", () => {
  test("a different account signing in clears the previous account's data but keeps device choices", () => {
    const s = fakeStorage({ "studlin-owner": "uidA", "studlin-events": "[1]", "studlin-subjects": "[2]", "studlin-analyticsOptOut": "true", "studlin-theme": "dark", "firebase:authUser": "x", other: "y" });
    const g = guard.make(s);
    assert.equal(g.claim("uidB"), true);
    assert.equal(s.keys().join(","), "firebase:authUser,other,studlin-analyticsOptOut,studlin-owner,studlin-theme");
    assert.equal(s.getItem("studlin-owner"), "uidB");
  });
  test("the same account signing in again keeps everything", () => {
    const s = fakeStorage({ "studlin-owner": "uidA", "studlin-events": "[1]" });
    assert.equal(guard.make(s).claim("uidA"), false);
    assert.equal(s.getItem("studlin-events"), "[1]");
  });
  test("data from before this existed is adopted by whoever is signed in, not deleted", () => {
    const s = fakeStorage({ "studlin-events": "[1]" });
    assert.equal(guard.make(s).claim("uidA"), false);
    assert.equal(s.getItem("studlin-events"), "[1]");
    assert.equal(s.getItem("studlin-owner"), "uidA");
  });
  test("a deliberate sign-out clears account data and the owner, keeps device choices", () => {
    const s = fakeStorage({ "studlin-owner": "uidA", "studlin-events": "[1]", "studlin-theme": "dark" });
    guard.make(s).clearOnSignOut();
    assert.equal(s.keys().join(","), "studlin-theme");
  });
  test("no uid does nothing", () => {
    const s = fakeStorage({ "studlin-owner": "uidA", "studlin-events": "[1]" });
    assert.equal(guard.make(s).claim(""), false);
    assert.equal(s.getItem("studlin-events"), "[1]");
  });
});

describe("wiring", () => {
  test("every page that signs in or out loads it with an absolute path (the /app/* rewrite would break a relative one)", () => {
    for (const p of ["studlin-web-app.html", "studlin-onboarding.html", "studlin-sign-in.html"]) {
      assert.ok(fs.readFileSync(path.join(ROOT, p), "utf8").includes('<script src="/owner-guard.js"></script>'), p);
    }
  });
  test("each sign-in listener claims the uid and each sign-out clears first", () => {
    const app = fs.readFileSync(path.join(ROOT, "studlin-app.jsx"), "utf8");
    assert.ok(app.includes("if(u&&window.StudlinOwnerGuard)StudlinOwnerGuard.claim(u.uid);"));
    assert.equal(app.split("StudlinOwnerGuard.clearOnSignOut();").length - 1, 3);
    assert.ok(fs.readFileSync(path.join(ROOT, "signin.jsx"), "utf8").includes("StudlinOwnerGuard.claim(u.uid)"));
    const onb = fs.readFileSync(path.join(ROOT, "onboarding.jsx"), "utf8");
    assert.ok(onb.includes("StudlinOwnerGuard.claim(u.uid)") && onb.includes("StudlinOwnerGuard.clearOnSignOut()"));
  });
});
