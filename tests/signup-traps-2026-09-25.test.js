// Persona audit 2026-09-25 (Wave 2, chunk 8): sign-up traps. Server side is
// exercised for real with stubbed dependencies; the UI parts are source guards.
const { test, describe } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const path = require("path");
const Module = require("module");

const ROOT = path.join(__dirname, "..");
const read = (f) => fs.readFileSync(path.join(ROOT, f), "utf8");

// ---- stub the handler's dependencies ----
const store = {};
const sentCodes = [];
const fakeDb = {
  collection: () => ({
    doc: (id) => ({
      get: async () => ({ exists: !!store[id], data: () => store[id] }),
      set: async (d) => { store[id] = d; },
      update: async (p) => { Object.assign(store[id], p); },
      delete: async () => { delete store[id]; },
    }),
  }),
};
const stubs = {
  "./_lib/firebase-admin": { db: fakeDb, auth: { getUser: async () => ({ email: "a@b.co", emailVerified: false }), updateUser: async () => {} } },
  "./_lib/auth": { setCors() {}, verifyAuth: async () => ({ uid: "u1" }) },
  "./_lib/sentry": { withSentry: (fn) => fn },
  "./_lib/rateLimit": { checkRateLimit: async () => ({ allowed: true }) },
  resend: { Resend: class { constructor() { this.emails = { send: async ({ html }) => { const m = html.match(/>(\d{6})</); sentCodes.push(m && m[1]); return { error: null }; } }; } } },
};
const origLoad = Module._load;
Module._load = function (request, parent, ...rest) {
  if (parent && parent.filename && parent.filename.endsWith("send-verification.js") && stubs[request]) return stubs[request];
  return origLoad.call(this, request, parent, ...rest);
};
process.env.RESEND_API_KEY = "x";
const handler = require("../api/send-verification.js");
Module._load = origLoad;

function call(body) {
  return new Promise((resolve) => {
    const res = { statusCode: 200, status(c) { this.statusCode = c; return this; }, json(b) { resolve({ code: this.statusCode, body: b }); return this; }, end() { resolve({ code: this.statusCode }); } };
    handler({ method: "POST", body }, res);
  });
}

describe("resending keeps the earlier code working", () => {
  test("both the first and the second emailed code verify", async () => {
    assert.equal((await call({})).body.ok, true);
    assert.equal((await call({})).body.ok, true);
    assert.equal(sentCodes.length, 2);
    assert.notEqual(sentCodes[0], sentCodes[1]);
    const first = await call({ code: sentCodes[0] });
    assert.equal(first.body.ok, true, "the earlier email must still work");
  });
  test("a wrong code is still rejected", async () => {
    await call({});
    const r = await call({ code: "000000" === sentCodes[sentCodes.length - 1] ? "111111" : "000000" });
    assert.equal(r.code, 400);
  });
});

describe("UI", () => {
  const onb = read("onboarding.jsx");
  test("a failed first send is recorded and the verify step auto-sends once", () => {
    assert.match(onb, /localStorage\.setItem\("studlin-verifySent", sendRes\.ok \? "ok" : "failed"\)/);
    assert.match(onb, /const autoSent = useRef\(false\);/);
    assert.match(onb, /if \(flag === "ok"\) return;/);
  });
  test("'Wrong email? Start over.' signs out and clears saved progress", () => {
    assert.match(onb, /Wrong email\? Start over\./);
    assert.match(onb, /localStorage\.removeItem\("studlin-onboarding"\)[\s\S]{0,200}signOut\(\)/);
  });
  test("a fresh Google account is no longer deleted by the auth gate", () => {
    const app = read("studlin-app.jsx");
    const i = app.indexOf("if(isFreshOAuthAccount(u)){");
    assert.ok(i > -1);
    assert.ok(!app.slice(i, i + 700).includes("u.delete()"));
    assert.ok(app.slice(i, i + 700).includes('window.location.href="/onboarding"'));
  });
});
