// Regression tests for two 2026-08-27 Calendar fixes, both requested
// directly by the user from a live screenshot:
//
// 1. The Calendar sidebar's "Upcoming" panel had a "Recently created"
//    collapsible section (newest-few-events-by-creation-order) sitting
//    above the actual due-date groups -- not a particularly useful thing
//    to lead with. Replaced with "Due Today," pulled out of the existing
//    date-grouped list the same way "Overdue" already is, and defaulting
//    open (unlike Overdue) since it's the most actionable thing in the
//    panel.
// 2. The Week view's per-day "N due" badge (shown under each date number
//    when that day has due-date markers) only ever called setSelDay,
//    which highlighted the column but didn't actually show what's due --
//    the student had to know to look elsewhere. Now it also opens
//    DayPreviewModal (the exact same read-only day-summary modal
//    DayPlanner's own "Day Preview" button already uses), so clicking it
//    actually answers "what's due" in one click.
//
// Both fixes live inside CalendarTab/WeeklyPlanner component closures, not
// exported pure functions, hence source-level regression guards rather
// than pure-function tests -- same established precedent as every other
// component-closure fix this session. Run with `npm test`.
const { test, describe } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const path = require("path");

const SOURCE = fs.readFileSync(path.join(__dirname, "..", "studlin-app.jsx"), "utf8");

describe("Fix 1: sidebar \"Due Today\" replaces \"Recently created\"", () => {
  test("the old creation-order-based Recently Created list is gone", () => {
    // "Recently created" still appears in two of this file's own
    // explanatory comments referencing what this section used to be --
    // that's expected, historical context, not a leftover live string. The
    // actual rendered JSX label (>Recently created<) and its backing data
    // source must both be gone.
    assert.doesNotMatch(SOURCE, />Recently created</,
      "a lingering rendered label would mean the old, less-useful section is still present alongside (or instead of) the new one");
    assert.doesNotMatch(SOURCE, /const sidebarRecentItems=/);
  });

  test("sidebarDueTodayItems is a real filter of the same due-items list Overdue already uses, not a separate ad-hoc query", () => {
    assert.match(SOURCE, /const sidebarDueTodayItems=sidebarUpcomingItems\.filter\(item=>item\.date===todayK\);/);
  });

  test("the date-grouped list below no longer double-shows today's items now that they have their own dedicated section (mirrors how Overdue is already excluded)", () => {
    assert.match(SOURCE, /sidebarUpcomingItems\.filter\(item=>item\.date>todayK\)\.forEach\(item=>\{/,
      "without excluding today here, an item due today would appear twice: once in the new Due Today section, once again under the 'Due: Today' group");
  });

  test("Due Today defaults open (unlike Overdue, which stays collapsed by default) since it's the most actionable thing in the panel", () => {
    assert.match(SOURCE, /const \[dueTodayOpen,setDueTodayOpen\]=useState\(true\);/);
  });

  test("the render actually shows the new label and count, matching Overdue's own count-in-header convention", () => {
    assert.match(SOURCE, /Due Today \(\{sidebarDueTodayItems\.length\}\)/);
  });
});

describe("Fix 2: Week view's \"N due\" badge opens a real day summary, not just column selection", () => {
  test("WeeklyPlanner tracks which day's badge was clicked", () => {
    assert.match(SOURCE, /const \[previewDayKey, setPreviewDayKey\] = useState\(null\);/);
  });

  test("clicking the badge sets previewDayKey in addition to the existing setSelDay call, rather than replacing it", () => {
    assert.match(SOURCE, /if\(setSelDay\)setSelDay\(dk\);setPreviewDayKey\(dk\);\}\}/,
      "keeping setSelDay preserves the existing column-highlight behavior; previewDayKey is what's new");
  });

  test("WeeklyPlanner renders DayPreviewModal (the same modal DayPlanner's own Day Preview button already opens), not a second duplicate summary UI", () => {
    assert.match(SOURCE, /<DayPreviewModal open=\{!!previewDayKey\} onClose=\{\(\)=>setPreviewDayKey\(null\)\} dayEvents=\{previewDayKey\?\(byDay\[previewDayKey\]\|\|\[\]\):\[\]\}/);
  });

  test("the modal is rendered as a sibling of WeeklyPlanner's root Card, not nested inside it -- matching this file's own documented [data-page]/animation containing-block gotcha for modals in tab components", () => {
    const idx = SOURCE.indexOf("function WeeklyPlanner(");
    const nextFn = SOURCE.indexOf("\nfunction WizardRoutineList(");
    const body = SOURCE.slice(idx, nextFn);
    assert.match(body, /return \(\s*<>\s*<Card/, "WeeklyPlanner's return must be a Fragment wrapping the Card, so the modal can sit alongside it as a true sibling");
    assert.match(body, /<\/Card>\s*<DayPreviewModal/);
  });
});
