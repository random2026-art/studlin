// Regression tests for calendar/work-shift import: the .ics feed parser
// (api/cal-proxy.js) and the merge/dedup logic that reconciles a fresh
// fetch against what's already in the student's calendar
// (mergeImportedEvents, studlin-app.jsx). Run with `npm test`.
const { test, describe } = require("node:test");
const assert = require("node:assert/strict");
const { loadStudlinModule } = require("./harness.js");
const { parseICS, normalizeCalendarUrl, isAllowedCalendarHost } = require("../api/cal-proxy.js");

function pad(n) { return String(n).padStart(2, "0"); }
// Builds an ICS timestamp for N days from now at a fixed hour, so fixtures
// stay "upcoming" no matter when the test suite actually runs.
function icsTimestamp(daysFromNow, hour, minute) {
  const d = new Date();
  d.setDate(d.getDate() + daysFromNow);
  return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}T${pad(hour)}${pad(minute)}00`;
}
function icsDateOnly(daysFromNow) {
  const d = new Date();
  d.setDate(d.getDate() + daysFromNow);
  return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}`;
}

describe("parseICS (api/cal-proxy.js)", () => {
  test("parses UID and computes duration from DTSTART/DTEND", () => {
    const ics = [
      "BEGIN:VCALENDAR",
      "BEGIN:VEVENT",
      "UID:shift-123@whenIwork.com",
      "SUMMARY:Closing shift",
      `DTSTART:${icsTimestamp(2, 17, 0)}`,
      `DTEND:${icsTimestamp(2, 21, 30)}`,
      "END:VEVENT",
      "END:VCALENDAR",
    ].join("\r\n");
    const { events, skippedAllDay } = parseICS(ics);
    assert.equal(events.length, 1);
    assert.equal(skippedAllDay, 0);
    assert.equal(events[0].uid, "shift-123@whenIwork.com");
    assert.equal(events[0].duration, 270);
    assert.equal(events[0].kind, "busy block");
  });

  test("defaults duration to 60 when DTEND is missing", () => {
    const ics = [
      "BEGIN:VCALENDAR",
      "BEGIN:VEVENT",
      "UID:no-end@example.com",
      "SUMMARY:Untimed meeting",
      `DTSTART:${icsTimestamp(3, 9, 0)}`,
      "END:VEVENT",
      "END:VCALENDAR",
    ].join("\r\n");
    const { events } = parseICS(ics);
    assert.equal(events.length, 1);
    assert.equal(events[0].duration, 60);
  });

  test("skips all-day (date-only) entries instead of treating them as a full-day blocker, and reports the count", () => {
    const ics = [
      "BEGIN:VCALENDAR",
      "BEGIN:VEVENT",
      "UID:spring-break@example.com",
      "SUMMARY:Spring Break",
      `DTSTART;VALUE=DATE:${icsDateOnly(5)}`,
      "END:VEVENT",
      "BEGIN:VEVENT",
      "UID:real-shift@example.com",
      "SUMMARY:Morning shift",
      `DTSTART:${icsTimestamp(5, 8, 0)}`,
      `DTEND:${icsTimestamp(5, 12, 0)}`,
      "END:VEVENT",
      "END:VCALENDAR",
    ].join("\r\n");
    const { events, skippedAllDay } = parseICS(ics);
    assert.equal(events.length, 1);
    assert.equal(events[0].uid, "real-shift@example.com");
    assert.equal(skippedAllDay, 1);
  });

  test("filters out events already in the past", () => {
    const ics = [
      "BEGIN:VCALENDAR",
      "BEGIN:VEVENT",
      "UID:old@example.com",
      "SUMMARY:Last week's shift",
      `DTSTART:${icsTimestamp(-7, 9, 0)}`,
      `DTEND:${icsTimestamp(-7, 12, 0)}`,
      "END:VEVENT",
      "END:VCALENDAR",
    ].join("\r\n");
    const { events } = parseICS(ics);
    assert.equal(events.length, 0);
  });
});

describe("isAllowedCalendarHost (Schoology/Canvas unlock -- suffix-match must not be spoofable)", () => {
  test("allows Schoology's own domain and subdomains", () => {
    assert.equal(isAllowedCalendarHost("schoology.com"), true);
    assert.equal(isAllowedCalendarHost("app.schoology.com"), true);
  });
  test("allows Canvas's own domain and any school's *.instructure.com subdomain", () => {
    assert.equal(isAllowedCalendarHost("instructure.com"), true);
    assert.equal(isAllowedCalendarHost("myschool.instructure.com"), true);
  });
  test("rejects an unrelated domain that merely contains the name", () => {
    assert.equal(isAllowedCalendarHost("notschoology.com"), false);
  });
  test("rejects a lookalike suffix trick (schoology.com.evil.tld)", () => {
    assert.equal(isAllowedCalendarHost("schoology.com.evil.tld"), false);
  });
  test("still rejects PowerSchool/Infinite Campus -- district-hosted domains aren't a static suffix this list can safely cover yet", () => {
    assert.equal(isAllowedCalendarHost("powerschool.com"), false);
    assert.equal(isAllowedCalendarHost("ps.somedistrict.k12.state.us"), false);
    assert.equal(isAllowedCalendarHost("infinitecampus.org"), false);
  });
  test("still allows the pre-existing providers", () => {
    assert.equal(isAllowedCalendarHost("icloud.com"), true);
    assert.equal(isAllowedCalendarHost("calendar.google.com"), true);
    assert.equal(isAllowedCalendarHost("outlook.live.com"), true);
  });
});

describe("normalizeCalendarUrl (regression: iCloud's own Public Calendar link defaults to webcal://, which the HTTP client can't fetch as-is)", () => {
  test("rewrites a webcal:// iCloud link to https://", () => {
    assert.equal(
      normalizeCalendarUrl("webcal://p01-calendars.icloud.com/published/2/abc123"),
      "https://p01-calendars.icloud.com/published/2/abc123"
    );
  });

  test("leaves an already-https:// link untouched", () => {
    assert.equal(
      normalizeCalendarUrl("https://calendar.google.com/calendar/ical/foo/basic.ics"),
      "https://calendar.google.com/calendar/ical/foo/basic.ics"
    );
  });

  test("is case-insensitive on the scheme", () => {
    assert.equal(
      normalizeCalendarUrl("WEBCAL://p01-calendars.icloud.com/published/2/abc123"),
      "https://p01-calendars.icloud.com/published/2/abc123"
    );
  });
});

describe("detectCalendarSourceType / isAcademicCalendarSource (Schoology/Canvas recognition)", () => {
  test("labels a Schoology feed link", () => {
    const { detectCalendarSourceType } = loadStudlinModule();
    assert.equal(detectCalendarSourceType("https://app.schoology.com/calendar/feed/abc123.ics"), "Schoology");
  });
  test("labels a school-branded Canvas feed link", () => {
    const { detectCalendarSourceType } = loadStudlinModule();
    assert.equal(detectCalendarSourceType("https://myschool.instructure.com/feeds/calendars/user_XXXX.ics"), "Canvas");
  });
  test("an unrelated link still falls back to the pre-existing generic label", () => {
    const { detectCalendarSourceType } = loadStudlinModule();
    assert.equal(detectCalendarSourceType("https://scheduling.homebase.com/ical/abc"), "Work schedule");
  });
  test("isAcademicCalendarSource is true only for Schoology/Canvas, not any other connected calendar", () => {
    const { isAcademicCalendarSource } = loadStudlinModule();
    assert.equal(isAcademicCalendarSource("Schoology"), true);
    assert.equal(isAcademicCalendarSource("Canvas"), true);
    assert.equal(isAcademicCalendarSource("Google Calendar"), false);
    assert.equal(isAcademicCalendarSource("Work schedule"), false);
  });
});

describe("parseCalendarClassificationReply (Schoology/Canvas AI classification -- pure parsing, no network)", () => {
  const capped = [
    { uid: "u1", title: "Ch. 4 problem set" },
    { uid: "u2", title: "Unit 2 midterm" },
    { uid: "u3", title: "Group presentation" },
  ];

  test("maps a well-formed reply back onto the right uid by index", () => {
    const { parseCalendarClassificationReply } = loadStudlinModule();
    const reply = JSON.stringify({ items: [
      { i: 0, kind: "assignment", subject: "Biology" },
      { i: 1, kind: "exam", subject: "Biology", examWeight: "major" },
      { i: 2, kind: "project", subject: "History" },
    ]});
    const result = parseCalendarClassificationReply(reply, capped);
    assert.equal(result.u1.kind, "assignment");
    assert.equal(result.u2.kind, "exam");
    assert.equal(result.u2.examWeight, "major");
    assert.equal(result.u3.kind, "project");
    assert.equal(result.u3.subject, "History");
  });

  test("strips markdown fences before parsing", () => {
    const { parseCalendarClassificationReply } = loadStudlinModule();
    const reply = "```json\n" + JSON.stringify({ items: [{ i: 0, kind: "exam", subject: "Chem" }] }) + "\n```";
    const result = parseCalendarClassificationReply(reply, capped);
    assert.equal(result.u1.kind, "exam");
  });

  test("an unrecognized kind falls back to assignment rather than throwing or being dropped", () => {
    const { parseCalendarClassificationReply } = loadStudlinModule();
    const reply = JSON.stringify({ items: [{ i: 0, kind: "homework_thing", subject: "Biology" }] });
    const result = parseCalendarClassificationReply(reply, capped);
    assert.equal(result.u1.kind, "assignment");
  });

  test("a missing subject falls back to \"Other\" rather than empty/undefined", () => {
    const { parseCalendarClassificationReply } = loadStudlinModule();
    const reply = JSON.stringify({ items: [{ i: 0, kind: "assignment" }] });
    const result = parseCalendarClassificationReply(reply, capped);
    assert.equal(result.u1.subject, "Other");
  });

  test("examWeight is only kept for kind:exam, and only a real value", () => {
    const { parseCalendarClassificationReply } = loadStudlinModule();
    const reply = JSON.stringify({ items: [
      { i: 0, kind: "assignment", subject: "Bio", examWeight: "major" }, // not an exam, should be dropped
      { i: 1, kind: "exam", subject: "Bio", examWeight: "extra-credit" }, // not a real value, should be dropped
    ]});
    const result = parseCalendarClassificationReply(reply, capped);
    assert.equal(result.u1.examWeight, undefined);
    assert.equal(result.u2.examWeight, undefined);
  });

  test("an out-of-range index or an event with no uid is silently skipped, not thrown", () => {
    const { parseCalendarClassificationReply } = loadStudlinModule();
    const reply = JSON.stringify({ items: [{ i: 99, kind: "exam", subject: "Bio" }] });
    const result = parseCalendarClassificationReply(reply, capped);
    assert.deepEqual(Object.keys(result), []);
  });

  test("malformed JSON returns {} instead of throwing", () => {
    // Not assert.deepEqual against a literal {} -- loadStudlinModule runs
    // the app in its own vm realm, so an object it returns and a literal
    // {} from this file's realm have different prototypes and always
    // false-fail a deep-equality check even when "empty" either way.
    // Object.keys sidesteps that by only comparing plain data.
    const { parseCalendarClassificationReply } = loadStudlinModule();
    assert.equal(Object.keys(parseCalendarClassificationReply("not json at all", capped)).length, 0);
  });

  test("a reply with no items array returns {}", () => {
    const { parseCalendarClassificationReply } = loadStudlinModule();
    assert.equal(Object.keys(parseCalendarClassificationReply(JSON.stringify({ foo: "bar" }), capped)).length, 0);
  });
});

describe("mergeImportedEvents classifications param (Schoology/Canvas: exam/assignment/project get real kinds instead of a generic busy block)", () => {
  const fetched = [
    { uid: "u1", title: "Ch. 4 problem set", date: "2026-08-01", time: "23:59", duration: 60 },
    { uid: "u2", title: "Unit 2 midterm", date: "2026-08-05", time: "09:00", duration: 50 },
  ];
  const classifications = {
    u1: { kind: "assignment", subject: "Biology" },
    u2: { kind: "exam", subject: "Biology", examWeight: "major" },
  };

  test("an assignment/project becomes a non-occupying deadline (duration:null), not a fixed block", () => {
    const { mergeImportedEvents } = loadStudlinModule();
    const result = mergeImportedEvents([], "sub-1", fetched, classifications);
    const assignment = result.find((e) => e.externalUid === "u1");
    assert.equal(assignment.kind, "deadline");
    assert.equal(assignment.duration, null);
    assert.equal(assignment.subject, "Biology");
  });

  test("an exam keeps its real timed slot, gets examWeight + an empty confidenceLog", () => {
    const { mergeImportedEvents } = loadStudlinModule();
    const result = mergeImportedEvents([], "sub-1", fetched, classifications);
    const exam = result.find((e) => e.externalUid === "u2");
    assert.equal(exam.kind, "exam");
    assert.equal(exam.duration, 50);
    assert.equal(exam.examWeight, "major");
    // Not assert.deepEqual against a literal [] -- same vm-realm caveat as
    // the parseCalendarClassificationReply tests above.
    assert.equal(exam.confidenceLog.length, 0);
  });

  test("an unclassified uid (no matching classification entry) falls back to the pre-existing generic busy block", () => {
    const { mergeImportedEvents } = loadStudlinModule();
    const result = mergeImportedEvents([], "sub-1", [{ uid: "u3", title: "Unmatched", date: "2026-08-01", time: "10:00", duration: 30 }], classifications);
    assert.equal(result[0].kind, "busy block");
    assert.equal(result[0].subject, "General");
  });

  test("omitting classifications entirely (every pre-existing caller) is byte-identical to before", () => {
    const { mergeImportedEvents } = loadStudlinModule();
    const result = mergeImportedEvents([], "sub-1", fetched);
    for (const ev of result) {
      assert.equal(ev.kind, "busy block");
      assert.equal(ev.subject, "General");
    }
  });

  test("resyncing a classified deadline never has its duration overwritten back to the feed's own value", () => {
    const { mergeImportedEvents } = loadStudlinModule();
    const first = mergeImportedEvents([], "sub-1", fetched, classifications);
    // Upstream feed still reports its own (irrelevant) duration on resync.
    const resynced = mergeImportedEvents(first, "sub-1", fetched);
    const assignment = resynced.find((e) => e.externalUid === "u1");
    assert.equal(assignment.kind, "deadline");
    assert.equal(assignment.duration, null);
  });
});

describe("mergeImportedEvents (regression: reconciling an imported calendar must never duplicate, and must never touch other data)", () => {
  const fetched = [
    { uid: "u1", title: "Closing shift", date: "2026-08-01", time: "17:00", duration: 240 },
    { uid: "u2", title: "Opening shift", date: "2026-08-02", time: "08:00", duration: 180 },
  ];

  test("first import creates real, occupied 'busy block' events tagged with the subscription", () => {
    const { mergeImportedEvents } = loadStudlinModule();
    const result = mergeImportedEvents([], "sub-1", fetched);
    assert.equal(result.length, 2);
    for (const ev of result) {
      assert.equal(ev.kind, "busy block");
      assert.equal(ev.importSubId, "sub-1");
      assert.equal(ev.status, "pending");
    }
    assert.ok(result.some((e) => e.externalUid === "u1" && e.title === "Closing shift"));
  });

  test("re-syncing an unchanged feed creates no duplicates", () => {
    const { mergeImportedEvents } = loadStudlinModule();
    const first = mergeImportedEvents([], "sub-1", fetched);
    const second = mergeImportedEvents(first, "sub-1", fetched);
    assert.equal(second.length, 2);
  });

  test("a shift removed from the feed disappears from Studlin on resync", () => {
    const { mergeImportedEvents } = loadStudlinModule();
    const first = mergeImportedEvents([], "sub-1", fetched);
    const onlyOneLeft = [fetched[0]]; // u2's shift got cancelled upstream
    const second = mergeImportedEvents(first, "sub-1", onlyOneLeft);
    assert.equal(second.length, 1);
    assert.equal(second[0].externalUid, "u1");
  });

  test("a shift's time changing in the feed updates the existing event instead of duplicating it", () => {
    const { mergeImportedEvents } = loadStudlinModule();
    const first = mergeImportedEvents([], "sub-1", fetched);
    const moved = [{ ...fetched[0], time: "19:00" }, fetched[1]];
    const second = mergeImportedEvents(first, "sub-1", moved);
    assert.equal(second.length, 2);
    const u1 = second.find((e) => e.externalUid === "u1");
    assert.equal(u1.time, "19:00");
    // Same event identity preserved across the update, not a fresh row.
    assert.equal(u1.id, first.find((e) => e.externalUid === "u1").id);
  });

  test("never touches events from another subscription or a manually-created event", () => {
    const { mergeImportedEvents } = loadStudlinModule();
    const other = { id: "other-sub-event", title: "Other job", date: "2026-08-01", time: "10:00", duration: 60, kind: "busy block", status: "pending", importSubId: "sub-2", externalUid: "z1" };
    const manual = { id: "manual-1", title: "Dentist", date: "2026-08-01", time: "14:00", duration: 30, kind: "busy block", status: "pending" };
    const result = mergeImportedEvents([other, manual], "sub-1", fetched);
    assert.equal(result.length, 4);
    assert.ok(result.some((e) => e.id === "other-sub-event"));
    assert.ok(result.some((e) => e.id === "manual-1"));
  });
});

describe("mergeImportedEvents order-independent dedup (regression: connecting Canvas/Schoology AFTER a syllabus scan created real duplicates)", () => {
  test("a syllabus-scanned exam already on the calendar is not duplicated when Canvas later reports the same one", () => {
    const { mergeImportedEvents } = loadStudlinModule();
    const alreadyThere = { id: "syl-1", title: "Unit 2 midterm", date: "2026-08-05", time: "09:00", duration: 50, kind: "exam", status: "pending", noteId: "syl-note-1" };
    const classifications = { u1: { kind: "exam", subject: "Biology", examWeight: "major" } };
    const fetched = [{ uid: "u1", title: "Unit 2 midterm", date: "2026-08-05", time: "09:00", duration: 50 }];
    const result = mergeImportedEvents([alreadyThere], "sub-1", fetched, classifications);
    assert.equal(result.length, 1, "the Canvas item should be recognized as the same exam, not added a second time");
    assert.equal(result[0].id, "syl-1", "the original syllabus-scanned event survives untouched, not replaced");
  });

  test("a manually-typed assignment already on the calendar is not duplicated by a later Canvas sync", () => {
    const { mergeImportedEvents } = loadStudlinModule();
    const alreadyThere = { id: "manual-1", title: "Ch. 4 problem set", date: "2026-08-01", time: "23:59", duration: null, kind: "deadline", status: "pending" };
    const classifications = { u1: { kind: "assignment", subject: "Biology" } };
    const fetched = [{ uid: "u1", title: "Ch. 4 problem set", date: "2026-08-01", time: "23:59", duration: 60 }];
    const result = mergeImportedEvents([alreadyThere], "sub-1", fetched, classifications);
    assert.equal(result.length, 1);
  });

  test("the reverse order (syllabus scan after Canvas already imported it) was already safe -- still is", () => {
    const { mergeImportedEvents } = loadStudlinModule();
    const classifications = { u1: { kind: "exam", subject: "Biology", examWeight: "major" } };
    const fetched = [{ uid: "u1", title: "Unit 2 midterm", date: "2026-08-05", time: "09:00", duration: 50 }];
    const afterCanvasImport = mergeImportedEvents([], "sub-1", fetched, classifications);
    assert.equal(afterCanvasImport.length, 1);
    // buildSyllabusEventBatch's own isDuplicate check (not exercised here,
    // it lives in a different function) is what protects this direction --
    // this test just documents the existing import stays put, unaffected
    // by this branch's change.
    assert.equal(afterCanvasImport[0].kind, "exam");
  });

  test("a genuinely different item with a coincidentally matching title is NOT falsely deduped away", () => {
    const { mergeImportedEvents } = loadStudlinModule();
    // Different date -- a real, separate assignment that just happens to
    // share a title (e.g. a recurring weekly problem set).
    const alreadyThere = { id: "manual-1", title: "Weekly reading response", date: "2026-08-01", time: "23:59", duration: null, kind: "deadline", status: "pending" };
    const classifications = { u1: { kind: "assignment", subject: "English" } };
    const fetched = [{ uid: "u1", title: "Weekly reading response", date: "2026-08-08", time: "23:59", duration: 60 }];
    const result = mergeImportedEvents([alreadyThere], "sub-1", fetched, classifications);
    assert.equal(result.length, 2, "a later week's genuinely separate item must still be added");
  });

  test("still dedupes correctly against its own prior imports on resync (unchanged behavior)", () => {
    const { mergeImportedEvents } = loadStudlinModule();
    const fetched = [{ uid: "u1", title: "Closing shift", date: "2026-08-01", time: "17:00", duration: 240 }];
    const first = mergeImportedEvents([], "sub-1", fetched);
    const second = mergeImportedEvents(first, "sub-1", fetched);
    assert.equal(second.length, 1);
  });
});

describe("mergeImportedEvents classified projects (regression: a 'project' classification used to collapse to a plain deadline, never actually qualifying as a real Project)", () => {
  test("a classified project gets a real, non-empty outline, unlike a plain assignment", () => {
    const { mergeImportedEvents } = loadStudlinModule();
    const classifications = { u1: { kind: "project", subject: "History" } };
    const fetched = [{ uid: "u1", title: "Research paper", date: "2026-08-20", time: "23:59", duration: 60 }];
    const result = mergeImportedEvents([], "sub-1", fetched, classifications);
    assert.equal(result[0].kind, "deadline");
    assert.equal(result[0].outline.length, 1, "needs a real outline entry for isProjectMarker to ever fire");
  });

  test("a plain assignment classification gets no outline at all -- stays a genuine non-project deadline", () => {
    const { mergeImportedEvents } = loadStudlinModule();
    const classifications = { u1: { kind: "assignment", subject: "History" } };
    const fetched = [{ uid: "u1", title: "Problem set", date: "2026-08-20", time: "23:59", duration: 60 }];
    const result = mergeImportedEvents([], "sub-1", fetched, classifications);
    assert.equal(result[0].outline, undefined);
  });
});
