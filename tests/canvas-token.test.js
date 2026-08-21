// Regression tests for the Canvas Personal Access Token connector
// (api/_lib/canvas.js) -- domain validation and the assignment-to-event
// normalizer, both pure (or, for resolveCanvasDomain's instructure.com
// fast path, deterministic with no real network call). The SSRF-hardening
// IP-range logic this relies on for custom domains lives in
// api/_lib/ssrf-guard.js and is tested there (tests/ssrf-guard.test.js),
// not duplicated here. Run with `npm test`.
const { test, describe } = require("node:test");
const assert = require("node:assert/strict");
const { isAllowedCanvasDomain, extractHostname, resolveCanvasDomain, canvasAssignmentToEvent, computeGroupWeightPercents, stripHtml } = require("../api/_lib/canvas.js");

describe("isAllowedCanvasDomain (fast path -- vendor-controlled DNS, trusted with no network round trip)", () => {
  test("allows instructure.com and any school's *.instructure.com subdomain", () => {
    assert.equal(isAllowedCanvasDomain("instructure.com"), true);
    assert.equal(isAllowedCanvasDomain("myschool.instructure.com"), true);
  });
  test("rejects an unrelated domain that merely contains the name", () => {
    assert.equal(isAllowedCanvasDomain("notinstructure.com"), false);
  });
  test("rejects a lookalike suffix trick", () => {
    assert.equal(isAllowedCanvasDomain("instructure.com.evil.tld"), false);
  });
  test("a custom/self-hosted Canvas domain isn't on this fast path -- it goes through resolveCanvasDomain's DNS check instead", () => {
    assert.equal(isAllowedCanvasDomain("canvas.someuniversity.edu"), false);
  });
});

describe("extractHostname (pure parsing, no allow/deny decision -- that's resolveCanvasDomain's job)", () => {
  test("accepts a bare domain", () => {
    assert.equal(extractHostname("myschool.instructure.com"), "myschool.instructure.com");
  });
  test("accepts a full URL and strips it down to the hostname", () => {
    assert.equal(extractHostname("https://myschool.instructure.com/calendar"), "myschool.instructure.com");
  });
  test("accepts a custom domain just as readily as an instructure.com one", () => {
    assert.equal(extractHostname("canvas.someuniversity.edu"), "canvas.someuniversity.edu");
  });
  test("lowercases the domain", () => {
    assert.equal(extractHostname("MySchool.Instructure.com"), "myschool.instructure.com");
  });
  test("rejects empty/garbage input", () => {
    assert.equal(extractHostname(""), null);
    assert.equal(extractHostname("   "), null);
    assert.equal(extractHostname(undefined), null);
  });
});

describe("resolveCanvasDomain (instructure.com fast path)", () => {
  test("resolves an instructure.com domain immediately, with no DNS lookup needed", async () => {
    const result = await resolveCanvasDomain("myschool.instructure.com");
    assert.equal(result.ok, true);
    assert.equal(result.domain, "myschool.instructure.com");
  });
  test("rejects unparseable input without ever attempting a DNS lookup", async () => {
    const result = await resolveCanvasDomain("");
    assert.equal(result.ok, false);
  });
});

describe("stripHtml", () => {
  test("removes tags and decodes the common entities Canvas descriptions use", () => {
    assert.equal(stripHtml("<p>Read Ch.&nbsp;4 &amp; take notes</p>"), "Read Ch. 4 & take notes");
  });
  test("collapses whitespace left behind by stripped tags", () => {
    assert.equal(stripHtml("<div>Line one</div><div>Line two</div>"), "Line one Line two");
  });
  test("handles empty/missing input", () => {
    assert.equal(stripHtml(""), "");
    assert.equal(stripHtml(null), "");
  });
});

describe("canvasAssignmentToEvent (normalizer -- must match parseICS's own event shape exactly)", () => {
  test("produces the same field set parseICS produces (see api/cal-proxy.js)", () => {
    const ev = canvasAssignmentToEvent({ id: 501, name: "Problem Set 4", due_at: "2026-09-01T23:59:00Z", points_possible: 20, description: "<p>Solve problems 1-10</p>", submission_types: ["online_upload"] }, "AP Chemistry", null);
    assert.equal(ev.id, "canvas-501");
    assert.equal(ev.uid, "canvas-501");
    assert.equal(ev.date, "2026-09-01");
    assert.equal(ev.time, "23:59");
    assert.equal(ev.duration, 60);
    assert.equal(ev.title, "Problem Set 4");
    assert.equal(ev.kind, "busy block");
    assert.ok(ev.description.includes("Solve problems 1-10"));
  });

  test("flags a quiz_id assignment as a quiz/test hint in the description, for the classifier to pick up", () => {
    const ev = canvasAssignmentToEvent({ id: 502, name: "Unit 2 Test", due_at: "2026-09-05T09:00:00Z", quiz_id: 88 }, "AP Chemistry", null);
    assert.ok(ev.description.startsWith("This is a quiz/test."));
  });

  test("flags an online_quiz submission type the same way, even with no quiz_id", () => {
    const ev = canvasAssignmentToEvent({ id: 503, name: "Reading Check", due_at: "2026-09-05T09:00:00Z", submission_types: ["online_quiz"] }, "AP Chemistry", null);
    assert.ok(ev.description.startsWith("This is a quiz/test."));
  });

  test("a regular assignment (no quiz signal) gets no quiz hint", () => {
    const ev = canvasAssignmentToEvent({ id: 504, name: "Essay Draft", due_at: "2026-09-05T09:00:00Z", submission_types: ["online_upload"] }, "English", null);
    assert.equal(ev.description.startsWith("This is a quiz/test."), false);
  });

  test("carries the real course name as subject, unlike the .ics path's generic 'General'", () => {
    const ev = canvasAssignmentToEvent({ id: 505, name: "Lab Report", due_at: "2026-09-05T09:00:00Z" }, "AP Chemistry", null);
    assert.equal(ev.subject, "AP Chemistry");
  });

  test("carries the real assignment_groups.group_weight as gradeWeightPercent when the group has one", () => {
    const ev = canvasAssignmentToEvent({ id: 506, name: "Unit 2 midterm", due_at: "2026-09-05T09:00:00Z" }, "AP Chemistry", 20);
    assert.equal(ev.gradeWeightPercent, 20);
  });

  test("gradeWeightPercent is null when the course has no configured weighting", () => {
    const ev = canvasAssignmentToEvent({ id: 507, name: "Homework 3", due_at: "2026-09-05T09:00:00Z" }, "AP Chemistry", null);
    assert.equal(ev.gradeWeightPercent, null);
  });

  test("gradeWeightPercent stays 0 (not null) when the group weight really is 0 -- a real, meaningful value, not treated as unset", () => {
    const ev = canvasAssignmentToEvent({ id: 508, name: "Extra Credit", due_at: "2026-09-05T09:00:00Z" }, "AP Chemistry", 0);
    assert.equal(ev.gradeWeightPercent, 0);
  });
});

describe("computeGroupWeightPercents (2026-08-20: split a group's weight across its real items instead of repeating it on every one)", () => {
  test("a single item alone in its group gets the full group weight", () => {
    const weightById = new Map([[1, 40]]);
    const result = computeGroupWeightPercents([{ id: 501, assignment_group_id: 1, points_possible: 100 }], weightById);
    assert.equal(result.get(501), 40);
  });

  test("3 exams sharing one 40%-weighted group split proportionally by points, not 40% each", () => {
    const weightById = new Map([[1, 40]]);
    const assignments = [
      { id: 501, assignment_group_id: 1, points_possible: 100 },
      { id: 502, assignment_group_id: 1, points_possible: 100 },
      { id: 503, assignment_group_id: 1, points_possible: 100 },
    ];
    const result = computeGroupWeightPercents(assignments, weightById);
    assert.ok(Math.abs(result.get(501) - 40 / 3) < 0.01);
    assert.ok(Math.abs(result.get(502) - 40 / 3) < 0.01);
    assert.ok(Math.abs(result.get(503) - 40 / 3) < 0.01);
  });

  test("splits by real point value, not an even count-based split, when points differ", () => {
    const weightById = new Map([[1, 30]]);
    // A 150-point final and a 50-point midterm sharing a 30%-weighted group
    // -- the final should get 3x the midterm's share (75/25), not 15/15.
    const assignments = [
      { id: 501, assignment_group_id: 1, points_possible: 150 },
      { id: 502, assignment_group_id: 1, points_possible: 50 },
    ];
    const result = computeGroupWeightPercents(assignments, weightById);
    assert.ok(Math.abs(result.get(501) - 22.5) < 0.01, "final (150pt of 200) should get 75% of 30 = 22.5, got " + result.get(501));
    assert.ok(Math.abs(result.get(502) - 7.5) < 0.01, "midterm (50pt of 200) should get 25% of 30 = 7.5, got " + result.get(502));
  });

  test("falls back to an even split when points_possible is missing", () => {
    const weightById = new Map([[1, 20]]);
    const assignments = [
      { id: 501, assignment_group_id: 1 },
      { id: 502, assignment_group_id: 1 },
    ];
    const result = computeGroupWeightPercents(assignments, weightById);
    assert.equal(result.get(501), 10);
    assert.equal(result.get(502), 10);
  });

  test("a past, already-graded homework in the group still counts toward the point total, so it doesn't inflate everyone else's share", () => {
    const weightById = new Map([[1, 40]]);
    const assignments = [
      { id: 501, assignment_group_id: 1, points_possible: 100 }, // the final
      { id: 502, assignment_group_id: 1, points_possible: 100 }, // an already-past, already-graded homework in the same group
    ];
    const result = computeGroupWeightPercents(assignments, weightById);
    assert.ok(Math.abs(result.get(501) - 20) < 0.01, "final should only get its real half-share (20), not the full 40, got " + result.get(501));
  });

  test("an item in a group with no configured weight gets null, not 0 or NaN", () => {
    const weightById = new Map(); // no groups configured
    const result = computeGroupWeightPercents([{ id: 501, assignment_group_id: 1, points_possible: 100 }], weightById);
    assert.equal(result.get(501), null);
  });
});
