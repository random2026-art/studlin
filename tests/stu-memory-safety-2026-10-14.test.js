// 2026-10-14: Stu chat safety + memory. Crisis detection runs before any model
// call; memory facts carry provenance, extraction is strict, sync merges by id.
const { test, describe } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const path = require("path");
const { loadStudlinModule } = require("./harness.js");

const APP = fs.readFileSync(path.join(__dirname, "..", "studlin-app.jsx"), "utf8").replace(/\r\n/g, "\n");

describe("detectCrisis", () => {
  const yes = [
    "I want to kill myself",
    "i've been thinking about suicide",
    "I'm feeling suicidal",
    "sometimes I want to die",
    "I just want to end it all",
    "I don't want to live anymore",
    "I keep hurting myself",
    "I think everyone would be better off without me",
    "I've been cutting myself",
    "my boyfriend hits me",
    "I was sexually assaulted",
    "I want to take my own life",
    "I’m going to end my life"
  ];
  const no = [
    "this exam is killing me",
    "I could die of boredom",
    "how do I turn on dark mode",
    "which day next week is busiest?",
    "kill the background timer",
    "I want to die of embarrassment",
    "it just hits me that the exam is tomorrow",
    "beats me, no idea which chapter",
    "add a study block called Suicide Squad essay outline",
    "I'm dead tired, this problem set is murder"
  ];
  for (const t of yes) test("flags: " + t, () => assert.equal(loadStudlinModule().detectCrisis(t), true));
  for (const t of no) test("does not flag: " + t, () => assert.equal(loadStudlinModule().detectCrisis(t), false));
  test("empty and non-string input is safe", () => {
    const m = loadStudlinModule();
    assert.equal(m.detectCrisis(""), false);
    assert.equal(m.detectCrisis(null), false);
  });
  test("static card text and resources are present", () => {
    const m = loadStudlinModule();
    assert.ok(m.STU_CRISIS_MESSAGE.startsWith("I'm Stu, not a counselor"));
    const all = m.STU_CRISIS_RESOURCES.join("\n");
    for (const s of ["988", "741741", "emergency number", "findahelpline.com", "campus counseling"]) assert.ok(all.includes(s), s);
  });
});

describe("crisis messages never reach the model or memory (source wiring)", () => {
  const sendBody = APP.slice(APP.indexOf("const send=async()=>{"), APP.indexOf("const pickDisambiguate"));
  test("send() checks detectCrisis before paywall, help match, classifier and any fetch", () => {
    const iCrisis = sendBody.indexOf("detectCrisis(text)");
    assert.ok(iCrisis > 0);
    for (const later of ["buildStudlinAiChatHistory", "matchStudlinHelpEntry", "classifyStudlinAiMessage", "canUseStudlinAiQna", "authFetch", "askQuestion("]) {
      const i = sendBody.indexOf(later);
      assert.ok(i < 0 || i > iCrisis, later + " must come after the crisis check");
    }
  });
  test("the crisis branch returns without any network call", () => {
    const branch = sendBody.slice(sendBody.indexOf("if(detectCrisis(text)){"), sendBody.indexOf("const history="));
    assert.ok(branch.includes("return;"));
    assert.ok(!/authFetch|fetch\(|classify|askQuestion|pushAiMemory|saveAiMemory|console\./.test(branch));
  });
  test("history builder drops crisis turns", () => {
    const m = loadStudlinModule();
    const h = m.buildStudlinAiChatHistory([
      { role: "user", text: "hello" },
      { role: "ai", text: "hi" },
      { role: "user", text: "I want to kill myself", crisis: true },
      { role: "ai", text: "static card", kind: "crisis" },
      { role: "user", text: "ok thanks" }
    ]);
    const joined = JSON.stringify(h);
    assert.ok(!joined.includes("kill myself"));
    assert.ok(!joined.includes("static card"));
  });
  test("extraction effect skips any session containing a crisis message", () => {
    const eff = APP.slice(APP.indexOf("A session containing a crisis message"), APP.indexOf("A session containing a crisis message") + 400);
    assert.ok(eff.includes("m.crisis"));
    assert.ok(eff.includes("return;"));
  });
});

describe("fact provenance and legacy facts", () => {
  test("new facts get id, addedAt and source", () => {
    const m = loadStudlinModule();
    const r = m.mergeAiMemoryFacts({ facts: [], updatedAt: null }, ["prefers evenings"], "asked-to-remember");
    assert.ok(r.facts[0].id);
    assert.equal(r.facts[0].source, "asked-to-remember");
    assert.equal(m.mergeAiMemoryFacts({ facts: [] }, ["x y z"]).facts[0].source, "told");
  });
  test("legacy facts without id/source load with a stable lazily-assigned id and no source", () => {
    const m = loadStudlinModule();
    m.saveAiMemory({ facts: [{ text: "Hates mornings", addedAt: 5 }], updatedAt: "x" });
    const a = m.getAiMemory().facts[0];
    assert.ok(a.id);
    assert.equal(a.source, undefined);
    assert.equal(m.getAiMemory().facts[0].id, a.id);
  });
  test("edit keeps the id, forget tombstones it", () => {
    const m = loadStudlinModule();
    const mem = m.mergeAiMemoryFacts({ facts: [] }, ["prefers evenings"]);
    const id = mem.facts[0].id;
    const edited = m.editAiMemoryFact(mem, id, "prefers late evenings");
    assert.equal(edited.facts[0].id, id);
    assert.equal(edited.facts[0].text, "prefers late evenings");
    const gone = m.removeAiMemoryFactById(edited, id);
    assert.equal(gone.facts.length, 0);
    assert.equal(gone.deleted[0].id, id);
  });
  test("clear all tombstones every fact", () => {
    const m = loadStudlinModule();
    const mem = m.mergeAiMemoryFacts({ facts: [] }, ["one thing", "another thing"]);
    const c = m.clearAiMemoryFacts(mem);
    assert.equal(c.facts.length, 0);
    assert.equal(c.deleted.length, 2);
  });
  test("memoryAgeLabel", () => {
    const m = loadStudlinModule();
    const now = Date.parse("2026-10-14T12:00:00Z");
    assert.equal(m.memoryAgeLabel(now - 100 * 86400000, now), "3 months ago");
    assert.equal(m.memoryAgeLabel(undefined, now), "");
  });
});

describe("strict extraction", () => {
  test("remember requests parse; ordinary text does not", () => {
    const m = loadStudlinModule();
    assert.equal(m.parseRememberRequest("Remember that I prefer evenings"), "I prefer evenings");
    assert.equal(m.parseRememberRequest("stu, remember I work weekends."), "I work weekends");
    assert.equal(m.parseRememberRequest("please don't forget that my exam is tough"), "my exam is tough");
    assert.equal(m.parseRememberRequest("I remember the exam"), null);
    assert.equal(m.parseRememberRequest("remember"), null);
  });
  test("filter keeps near-quoted facts, drops inferred, sensitive, and over-long ones", () => {
    const m = loadStudlinModule();
    const turns = ["I study best in the evening", "I work weekends at a cafe", "my mom is stressing me out and I feel anxious"];
    const out = m.filterExtractedFacts(["studies best in the evening", "likes quiet libraries and group projects", "my mom is stressing me out", "feels anxious", "x".repeat(130)], turns);
    assert.equal(out.length, 1);
    assert.equal(out[0], "studies best in the evening");
  });
  test("extraction prompt demands explicit statements and skips short sessions", () => {
    assert.ok(APP.includes("EXPLICITLY STATED"));
    assert.ok(APP.includes("Never infer, never guess"));
    assert.ok(APP.includes("userTurns.length<2"));
  });
  test("prompt block is labelled and capped at 20 facts x 120 chars", () => {
    const m = loadStudlinModule();
    const facts = [];
    for (let i = 0; i < 25; i++) facts.push({ id: "i" + i, text: "fact number " + i + " " + "y".repeat(200), addedAt: i });
    m.saveAiMemory({ facts, updatedAt: "x" });
    const line = m.formatAiMemoryForPrompt();
    assert.ok(line.startsWith("Things the student told you (may be outdated; never state them as certain):"));
    const parts = line.split(": ").slice(1).join(": ").split("; ");
    assert.equal(parts.length, 20);
    assert.ok(parts.every(p => p.length <= 121));
  });
});

describe("sync merge by id with tombstones", () => {
  test("a fact added offline survives the merge (union)", () => {
    const m = loadStudlinModule();
    const local = { facts: [{ id: "a", text: "local only", addedAt: 2 }], deleted: [], updatedAt: "2026-10-02" };
    const remote = { facts: [{ id: "b", text: "remote only", addedAt: 1 }], deleted: [], updatedAt: "2026-10-01" };
    const r = m.mergeAiMemoryDocs(local, remote);
    assert.equal(r.facts.length, 2);
  });
  test("a deleted id does not come back from the other side", () => {
    const m = loadStudlinModule();
    const local = { facts: [], deleted: [{ id: "b", at: 5 }], updatedAt: "2026-10-02" };
    const remote = { facts: [{ id: "b", text: "was forgotten", addedAt: 1 }], deleted: [], updatedAt: "2026-10-01" };
    assert.equal(m.mergeAiMemoryDocs(local, remote).facts.length, 0);
    assert.equal(m.mergeAiMemoryDocs(remote, local).facts.length, 0);
  });
  test("same id edited on both sides: later edit wins", () => {
    const m = loadStudlinModule();
    const a = { facts: [{ id: "a", text: "old", addedAt: 1 }], updatedAt: "1" };
    const b = { facts: [{ id: "a", text: "new", addedAt: 1, editedAt: 9 }], updatedAt: "2" };
    assert.equal(m.mergeAiMemoryDocs(a, b).facts[0].text, "new");
  });
  test("legacy facts on both devices dedupe to one by deterministic id", () => {
    const m = loadStudlinModule();
    const a = { facts: [{ text: "Hates mornings", addedAt: 1 }] };
    const b = { facts: [{ text: "Hates mornings", addedAt: 1 }] };
    assert.equal(m.mergeAiMemoryDocs(a, b).facts.length, 1);
  });
  test("hydrate merges instead of replacing, and failed push is retried", () => {
    const body = APP.slice(APP.indexOf("async function hydrateAiMemoryOnAuth"), APP.indexOf("async function hydrateAiMemoryOnAuth") + 1500);
    assert.ok(body.includes("mergeAiMemoryDocs"));
    assert.ok(body.includes("aiMemoryPushPending"));
  });
});

describe("Stu only reads memory through the helpers", () => {
  test("getStuKnown returns just first name, time of day, facts", () => {
    const m = loadStudlinModule();
    m.saveAiMemory({ facts: [{ id: "a", text: "works weekends", addedAt: 1 }], timeOfDay: "evening", updatedAt: "x" });
    const k = m.getStuKnown();
    assert.deepEqual(Object.keys(k).sort(), ["facts", "firstName", "timeOfDay"]);
    assert.equal(k.timeOfDay, "evening");
    assert.equal(k.facts.length, 1);
  });
  test("no lsGet of the aiMemory key outside getAiMemory", () => {
    const re = /lsGet\(\s*["']aiMemory["']/g;
    const hits = [];
    let mt;
    while ((mt = re.exec(APP))) hits.push(mt.index);
    assert.equal(hits.length, 1);
    const fnStart = APP.indexOf("function getAiMemory()");
    assert.ok(hits[0] > fnStart && hits[0] < fnStart + 200);
  });
  test("firestore rule for aiMemory has no field allowlist", () => {
    const rules = fs.readFileSync(path.join(__dirname, "..", "firestore.rules"), "utf8");
    const i = rules.indexOf("match /aiMemory/{userId}");
    const block = rules.slice(i, i + 260);
    assert.ok(/allow read, write: if request\.auth != null && request\.auth\.uid == userId;/.test(block));
    assert.ok(!/hasOnly|keys\(\)/.test(block));
  });
});

describe("chat failure and memory UI wiring", () => {
  test("a visible failure bubble exists for classifier and network failures", () => {
    const n = (APP.match(/Stu can't reach the server\. Try again\./g) || []).length;
    assert.ok(n >= 2);
  });
  test("Settings and the drawer share StuMemoryPanel; drawer has the header link", () => {
    assert.ok((APP.match(/<StuMemoryPanel \/>/g) || []).length === 2);
    assert.ok(APP.includes("What do you remember?"));
    assert.ok(APP.includes("Nothing yet. Tell me things and I'll ask before saving."));
  });
  test("save toast shows the real text with Undo", () => {
    assert.ok(APP.includes('showMemoryToast("Remembered: "'));
    assert.ok(APP.includes("undoMemoryToast"));
  });
});
