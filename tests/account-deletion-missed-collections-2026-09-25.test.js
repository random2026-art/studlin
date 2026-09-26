// Persona audit 2026-09-25 (Wave 2, chunk 6): "Delete my account" left seven
// collections behind. Runs the real cleanup against a small in-memory fake.
const { test, describe } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const path = require("path");
const { cleanupMissedCollections } = require("../api/_lib/account-cleanup.js");

const DEL = { __del: true };
const admin = { firestore: { FieldValue: { arrayRemove: (v) => ({ __rm: v }), delete: () => DEL } } };

function fakeDb(data) {
  const ref = (col, id) => ({
    delete: async () => { delete data[col][id]; },
    update: async (patch) => {
      const d = data[col][id];
      for (const [k, v] of Object.entries(patch)) {
        if (v && v.__rm) d[k] = d[k].filter((x) => x !== v.__rm);
        else if (v === DEL) { const [a, b] = k.split("."); delete d[a][b]; }
      }
    },
  });
  const docs = (col, pred) => Object.keys(data[col] || {}).filter((id) => pred(data[col][id])).map((id) => ({ id, ref: ref(col, id), data: () => data[col][id] }));
  return {
    collection: (col) => ({
      doc: (id) => ref(col, id),
      where: (field, op, val) => ({
        get: async () => { const d = docs(col, (x) => op === "==" ? x[field] === val : (x[field] || []).includes(val)); return { empty: !d.length, docs: d }; },
      }),
    }),
    batch: () => { const ops = []; return { delete: (r) => ops.push(r), commit: async () => { for (const r of ops) await r.delete(); } }; },
  };
}

const safeStep = async (l, fn) => { try { return await fn(); } catch (e) { return null; } };

describe("cleanupMissedCollections", () => {
  test("removes the student's own docs, grants, and owned shared records; leaves others' records intact", async () => {
    const data = {
      aiMemory: { me: {}, other: {} }, completionLogSync: { me: {}, other: {} }, settingsSync: { me: {}, other: {} }, busyWindows: { me: {}, other: {} },
      calendarViewGrants: { me_x: { ownerUid: "x", requesterUid: "me" }, x_me: { ownerUid: "me", requesterUid: "x" }, x_y: { ownerUid: "y", requesterUid: "x" } },
      studySessions: {
        mine: { createdBy: "me", memberUids: ["me", "x"] },
        theirs3: { createdBy: "x", memberUids: ["me", "x", "y"], participants: { me: {}, x: {}, y: {} } },
        theirs2: { createdBy: "x", memberUids: ["me", "x"] },
      },
      sharedProjects: { p: { ownerUid: "me", memberUids: ["me", "x"] }, q: { ownerUid: "x", memberUids: ["x", "me", "y"], participants: { x: {}, me: {}, y: {} } } },
    };
    await cleanupMissedCollections(fakeDb(data), admin, "me", safeStep);
    for (const c of ["aiMemory", "completionLogSync", "settingsSync", "busyWindows"]) {
      assert.equal(Object.keys(data[c]).join(","), "other");
    }
    assert.equal(Object.keys(data.calendarViewGrants).join(","), "x_y");
    assert.equal(Object.keys(data.studySessions).join(","), "theirs3");
    assert.equal(data.studySessions.theirs3.memberUids.join(","), "x,y");
    assert.equal(Object.keys(data.studySessions.theirs3.participants).join(","), "x,y");
    assert.equal(Object.keys(data.sharedProjects).join(","), "q");
    assert.equal(data.sharedProjects.q.memberUids.join(","), "x,y");
  });

  test("handleDeleteAccount actually calls it, before the critical delete steps", () => {
    const src = fs.readFileSync(path.join(__dirname, "..", "api", "me.js"), "utf8");
    const a = src.indexOf("cleanupMissedCollections(db, admin, uid, safeStep)");
    const b = src.indexOf("await deleteDocTree(userRef);");
    assert.ok(a > -1 && b > a);
  });
});
