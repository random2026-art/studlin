// Regression tests for the Canvas Personal Access Token connector
// (api/_lib/canvas.js) -- domain validation/SSRF-hardening and the
// assignment-to-event normalizer, both pure (or, for resolveCanvasDomain's
// instructure.com fast path, deterministic with no real network call).
// The DNS-based custom-domain verification path (verifyPublicDomain) is
// deliberately NOT exercised here -- a real lookup would make this suite
// flaky/slow/network-dependent, same reasoning this codebase already
// applies to every other live external call. Run with `npm test`.
const { test, describe } = require("node:test");
const assert = require("node:assert/strict");
const { isAllowedCanvasDomain, extractHostname, isPrivateOrReservedIp, resolveCanvasDomain, canvasAssignmentToEvent, stripHtml } = require("../api/_lib/canvas.js");

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

describe("isPrivateOrReservedIp (SSRF hardening -- what a custom domain must NOT resolve to)", () => {
  test("blocks all three RFC1918 private ranges", () => {
    assert.equal(isPrivateOrReservedIp("10.0.0.1"), true);
    assert.equal(isPrivateOrReservedIp("172.16.0.1"), true);
    assert.equal(isPrivateOrReservedIp("172.31.255.255"), true);
    assert.equal(isPrivateOrReservedIp("192.168.1.1"), true);
  });
  test("blocks loopback", () => {
    assert.equal(isPrivateOrReservedIp("127.0.0.1"), true);
  });
  test("blocks link-local, including the cloud metadata endpoint every major provider uses", () => {
    assert.equal(isPrivateOrReservedIp("169.254.169.254"), true);
  });
  test("blocks carrier-grade NAT (100.64.0.0/10)", () => {
    assert.equal(isPrivateOrReservedIp("100.64.0.1"), true);
  });
  test("blocks multicast/reserved/broadcast (224.0.0.0 and above)", () => {
    assert.equal(isPrivateOrReservedIp("224.0.0.1"), true);
    assert.equal(isPrivateOrReservedIp("255.255.255.255"), true);
  });
  test("allows real public IPv4 addresses", () => {
    assert.equal(isPrivateOrReservedIp("8.8.8.8"), false);
    assert.equal(isPrivateOrReservedIp("1.1.1.1"), false);
  });
  test("blocks IPv6 loopback, link-local, and unique-local", () => {
    assert.equal(isPrivateOrReservedIp("::1"), true);
    assert.equal(isPrivateOrReservedIp("fe80::1"), true);
    assert.equal(isPrivateOrReservedIp("fd00::1"), true);
  });
  test("allows a real public IPv6 address", () => {
    assert.equal(isPrivateOrReservedIp("2606:4700:4700::1111"), false);
  });
  test("blocks an IPv4-mapped IPv6 address pointing at a private range", () => {
    assert.equal(isPrivateOrReservedIp("::ffff:127.0.0.1"), true);
  });
  test("malformed input fails closed (treated as blocked, not allowed)", () => {
    assert.equal(isPrivateOrReservedIp("not-an-ip"), true);
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
