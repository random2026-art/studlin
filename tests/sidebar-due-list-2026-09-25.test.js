// Persona audit, 2026-09-25 (Wave 1, chunk 3): old overdue items used to
// fill the sidebar's 20-item cap and push every upcoming item off the list.
// Also, the red dot said "Nd overdue" when it means "scheduled N days after
// its due date". Real invocations of the selector plus a copy guard.
const { test, describe } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const path = require("path");
const { loadStudlinModule } = require("./harness.js");

const SOURCE = fs.readFileSync(path.join(__dirname, "..", "studlin-app.jsx"), "utf8");
const TODAY = "2026-09-25";
const all = () => true;
const dl = (id, date, extra) => Object.assign({ id, kind: "deadline", date, status: "pending", title: id }, extra || {});

describe("selectSidebarDueItems", () => {
  test("25 old overdue items no longer push upcoming items off the list", () => {
    const m = loadStudlinModule();
    const events = [];
    for (let i = 1; i <= 25; i++) events.push(dl("old" + i, "2026-08-" + String(i).padStart(2, "0")));
    events.push(dl("soon", "2026-09-27"), dl("later", "2026-10-05"));
    const out = m.selectSidebarDueItems(events, TODAY, all);
    const ids = Array.from(out).map((e) => e.id);
    assert.ok(ids.includes("soon") && ids.includes("later"));
    assert.equal(ids.filter((i) => i.startsWith("old")).length, 20);
  });

  test("overdue is newest-first, upcoming is soonest-first", () => {
    const m = loadStudlinModule();
    const out = Array.from(m.selectSidebarDueItems([
      dl("a", "2026-09-01"), dl("b", "2026-09-20"), dl("c", "2026-10-01"), dl("d", "2026-09-26"),
    ], TODAY, all)).map((e) => e.id);
    assert.equal(out.join(","), "b,a,d,c");
  });

  test("done items and past exams are still excluded, deadline (not date) decides overdue", () => {
    const m = loadStudlinModule();
    const out = Array.from(m.selectSidebarDueItems([
      dl("done", "2026-09-01", { status: "done" }),
      { id: "pastExam", kind: "exam", date: "2026-09-01", status: "pending" },
      dl("project", "2026-09-25", { deadline: "2026-10-30" }),
    ], TODAY, all)).map((e) => e.id);
    assert.equal(out.join(","), "project");
  });
});

describe("red-dot copy", () => {
  test("says when it was scheduled, not 'overdue'", () => {
    assert.ok(!SOURCE.includes('over+"d overdue"'));
    assert.ok(!SOURCE.includes("{over}d overdue"));
    assert.ok(SOURCE.includes('" after its due date"'));
  });
});
