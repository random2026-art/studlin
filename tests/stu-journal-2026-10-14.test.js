// Stu Journal v1 (2026-10-14): local-only per-day note.
const { test, describe } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const path = require("path");
const { loadStudlinModule } = require("./harness.js");

const read = (p) => fs.readFileSync(path.join(__dirname, "..", p), "utf8").replace(/\r\n/g, "\n");
const SOURCE = read("studlin-app.jsx");
const start = SOURCE.indexOf("// ===== STU JOURNAL v1");
const end = SOURCE.indexOf("// ===== END STU JOURNAL =====");
const BLOCK = SOURCE.slice(start, end);

const M = loadStudlinModule({ now: "2026-10-14T09:00:00" });

describe("account deletion covers aiMemory and completionLogSync", () => {
  test("me.js runs the cleanup and the helper lists both docs", () => {
    assert.ok(read("api/me.js").includes("cleanupMissedCollections(db, admin, uid, safeStep)"));
    const c = read("api/_lib/account-cleanup.js");
    assert.ok(c.includes("'aiMemory'") && c.includes("'completionLogSync'"));
  });
});

describe("journal storage is local only", () => {
  test("block exists and uses lsGet/lsSet with the journal key", () => {
    assert.ok(start > 0 && end > start);
    assert.ok(BLOCK.includes('lsGet("journal"') && BLOCK.includes('lsSet("journal"'));
  });
  test("block never touches Firestore, AI memory, or network", () => {
    for (const bad of ["fsdb(", "firebase.", "aiMemory", "AiMemory", "authFetch", "fetch(", "shared_chats", "busyWindows", "profiles"]) {
      assert.ok(!BLOCK.includes(bad), "journal block must not include " + bad);
    }
  });
  test("no em dashes in the block", () => {
    assert.ok(!BLOCK.includes("—"));
  });
});

describe("journal pure helpers", () => {
  test("prompt rotation is deterministic and from the fixed list", () => {
    assert.equal(M.journalPromptFor("2026-10-14"), M.journalPromptFor("2026-10-14"));
    for (const k of ["2026-10-14", "2026-10-15", "2027-01-01"]) assert.ok(M.JOURNAL_PROMPTS.indexOf(M.journalPromptFor(k)) >= 0);
  });
  test("log of entries: many per day, edit by id, titled, newest day first", () => {
    let l = M.upsertJournalEntry([], { date: "2026-10-13", title: "Old", text: "a", mood: "good" }, "2026-10-13T08:00:00Z");
    l = M.upsertJournalEntry(l, { date: "2026-10-14", title: "Morning", text: "b", mood: null }, "2026-10-14T08:00:00Z");
    l = M.upsertJournalEntry(l, { date: "2026-10-14", title: "Evening", text: "c" }, "2026-10-14T20:00:00Z");
    assert.equal(l.length, 3, "two entries on one day are both kept");
    assert.equal(l[0].title, "Evening", "newest entry of the newest day first");
    const id = l[0].id;
    l = M.upsertJournalEntry(l, { id, date: "2026-10-14", title: "Evening 2", text: "d", mood: "okay", crisis: true }, "2026-10-14T21:00:00Z");
    assert.equal(l.length, 3, "editing by id replaces, not adds");
    const e = l.find((x) => x.id === id);
    assert.equal(e.title, "Evening 2");
    assert.equal(e.createdAt, "2026-10-14T20:00:00Z");
    assert.equal(e.updatedAt, "2026-10-14T21:00:00Z");
    assert.equal(e.crisis, true);
  });
  test("old one-per-day entries without a title still load", () => {
    const l = M.normalizeJournal([{ id: "j-2026-10-10", date: "2026-10-10", text: "legacy", mood: "good" }]);
    assert.equal(l.length, 1);
    assert.equal(l[0].title, "");
  });
  test("invalid mood is dropped and removal works", () => {
    const l = M.normalizeJournal([{ id: "j-1", date: "2026-10-14", text: "x", mood: "sad-guess" }]);
    assert.equal(l[0].mood, null);
    assert.equal(M.removeJournalEntry(l, "j-1").length, 0);
  });
});

describe("journal UI guardrails", () => {
  test("crisis check runs before saving, with the static card", () => {
    const save = BLOCK.slice(BLOCK.indexOf("const save=()=>"));
    assert.ok(save.indexOf("detectCrisis(t)") > 0 && save.indexOf("detectCrisis(t)") < save.indexOf("saveJournal("));
    assert.ok(BLOCK.includes("STU_CRISIS_MESSAGE") && BLOCK.includes("STU_CRISIS_RESOURCES"));
  });
  test("deletes are behind confirm modals, empty state has CTA, footer line present", () => {
    assert.ok(BLOCK.includes('title="Delete this entry?"') && BLOCK.includes('title="Delete your whole journal?"'));
    assert.ok(BLOCK.includes("Write your first entry"));
    assert.ok(BLOCK.includes("Stu is not a counselor."));
    assert.ok(BLOCK.includes('placeholder="Title"') && BLOCK.includes("+ New entry"));
    assert.ok(BLOCK.includes("not sent to AI in this version"));
    assert.ok(BLOCK.includes("Download (JSON)"));
  });
  test("no streak or guilt copy", () => {
    assert.ok(!/streak|missed|you haven't|come back/i.test(BLOCK));
  });
  test("mounted once on Dashboard and once in Settings", () => {
    assert.equal(SOURCE.split("<JournalCard />").length, 2);
    assert.equal(SOURCE.split("<JournalSettingsCard />").length, 2);
  });
  test("studlin- prefixed storage is covered by the account delete cleanup", () => {
    assert.ok(SOURCE.includes('Object.keys(localStorage).forEach(k=>{if(k.indexOf("studlin-")===0)localStorage.removeItem(k);});'));
  });
});
