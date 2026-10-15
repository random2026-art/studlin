// Low-friction add (2026-10-14): duration chips + defaults, quick-create seeding,
// live resize pill, New Task date defaults, and the local Brain Dump line parser.
// Run with `npm test`. 2026-10-14 is a Wednesday.
const { test, describe } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const path = require("path");
const { loadStudlinModule } = require("./harness.js");

const SOURCE = fs.readFileSync(path.join(__dirname, "..", "studlin-app.jsx"), "utf8").replace(/\r\n/g, "\n");
const TODAY = "2026-10-14";

describe("parseBrainDumpLine", () => {
  const { parseBrainDumpLine } = loadStudlinModule({ now: "2026-10-14T09:00:00" });

  test("'bio lab fri 3pm' -> next Friday, 15:00, title stripped, an event", () => {
    const r = parseBrainDumpLine("bio lab fri 3pm", TODAY);
    assert.equal(r.title, "Bio lab");
    assert.equal(r.dueDate, "2026-10-16");
    assert.equal(r.time, "15:00");
    assert.equal(r.durationMin, null);
    assert.equal(r.kind, "event");
  });

  test("'essay due 10/20' -> due date, no time, a to-do", () => {
    const r = parseBrainDumpLine("essay due 10/20", TODAY);
    assert.equal(r.title, "Essay");
    assert.equal(r.dueDate, "2026-10-20");
    assert.equal(r.time, null);
    assert.equal(r.kind, "todo");
  });

  test("'read ch4 for 45m tomorrow' -> 45 minutes, tomorrow, study", () => {
    const r = parseBrainDumpLine("read ch4 for 45m tomorrow", TODAY);
    assert.equal(r.title, "Read ch4");
    assert.equal(r.durationMin, 45);
    assert.equal(r.dueDate, "2026-10-15");
    assert.equal(r.kind, "study");
  });

  test("plain text stays untouched with no invented date, time or duration", () => {
    const r = parseBrainDumpLine("email my counselor", TODAY);
    assert.equal(r.title, "Email my counselor");
    assert.equal(r.dueDate, null);
    assert.equal(r.time, null);
    assert.equal(r.durationMin, null);
    assert.equal(r.kind, "todo");
  });

  test("a past m/d rolls to next year, a same-weekday name is a week out (never in the past)", () => {
    assert.equal(parseBrainDumpLine("quiz 10/1", TODAY).dueDate, "2027-10-01");
    assert.equal(parseBrainDumpLine("lab wed", TODAY).dueDate, "2026-10-21");
  });

  test("hours, 3:30 and bare afternoon hours", () => {
    assert.equal(parseBrainDumpLine("gym tomorrow at 7am", TODAY).time, "07:00");
    assert.equal(parseBrainDumpLine("call mom 3:30", TODAY).time, "15:30");
    assert.equal(parseBrainDumpLine("study for 1.5 hours", TODAY).durationMin, 90);
  });

  test("an exam keyword with a date is an exam, not a study task", () => {
    const r = parseBrainDumpLine("chem midterm fri", TODAY);
    assert.equal(r.kind, "exam");
    assert.equal(r.dueDate, "2026-10-16");
  });
});

describe("fallbackSplitBrainDump", () => {
  const { fallbackSplitBrainDump } = loadStudlinModule({ now: "2026-10-14T09:00:00" });

  test("splits on newlines first and strips bullets and numbers", () => {
    const items = fallbackSplitBrainDump("- bio lab fri 3pm\n2. essay due 10/20\n* email counselor, then lunch");
    assert.equal(items.length, 3);
    assert.equal(items[0].title, "Bio lab");
    assert.equal(items[0].dueTime, "15:00");
    assert.equal(items[1].dueDate, "2026-10-20");
    assert.equal(items[2].title, "Email counselor, then lunch", "commas do not split a multi-line dump");
    assert.equal(items[0].confidence, "low");
  });

  test("a single line still splits on commas and 'and'", () => {
    const items = fallbackSplitBrainDump("chem homework, email counselor and read ch4 for 30m");
    assert.equal(items.length, 3);
    assert.equal(items[2].durationMin, 30);
  });

  test("never guesses a duration it was not given", () => {
    const items = fallbackSplitBrainDump("finish lab report");
    assert.equal(items[0].durationMin, null);
  });
});

describe("getDefaultDuration", () => {
  test("per-type table when there is no data and no last duration", () => {
    const m = loadStudlinModule();
    assert.equal(m.getDefaultDuration("reminder", "Bio"), 15);
    assert.equal(m.getDefaultDuration("class", "Bio"), 60);
    assert.equal(m.getDefaultDuration("study block", "Bio"), 45);
    assert.equal(m.getDefaultDuration("reading", "Bio"), 30);
    assert.equal(m.getDefaultDuration("errand", "Bio"), 30);
  });

  test("last used duration beats the table, and is saved under lastDuration:<kind>", () => {
    const m = loadStudlinModule();
    m.rememberLastDuration("study block", 75);
    assert.equal(m.lsGet("lastDuration:study block", null), 75);
    assert.equal(m.getDefaultDuration("study block", "Bio"), 75);
    assert.equal(m.getDefaultDuration("reminder", "Bio"), 15, "other kinds unaffected");
  });

  test("real data (suggestDurationFor) beats the last used duration and is labelled data", () => {
    const m = loadStudlinModule();
    m.rememberLastDuration("study block", 75);
    m.lsSet("subjectDurationOverride", { Bio: 50 });
    const info = m.getDefaultDurationInfo("study block", "Bio");
    assert.equal(info.minutes, 50);
    assert.equal(info.source, "data");
    assert.equal(m.getDefaultDurationInfo("study block", "Chem").source, "last");
  });

  test("out-of-range remembered values are ignored", () => {
    const m = loadStudlinModule();
    m.rememberLastDuration("study block", 2);
    m.rememberLastDuration("study block", 9999);
    assert.equal(m.getDefaultDuration("study block", "Bio"), 45);
  });
});

describe("helpers", () => {
  const m = loadStudlinModule();
  test("duration labels", () => {
    assert.equal(m.formatDurationChip(45), "45m");
    assert.equal(m.formatDurationChip(60), "1h");
    assert.equal(m.formatDurationChip(90), "1.5h");
    assert.equal(m.formatDurationChip(75), "1h 15m");
    assert.equal(m.formatDurationLong(75), "1h 15m");
    assert.equal(m.formatDurationLong(60), "1h");
    assert.equal(m.formatDurationLong(30), "30m");
    assert.equal(m.liveRangeLabel(900, 75).replace(/\s+/g, " "), "1h 15m 3 - 4:15 PM");
  });
  test("quick date chips start with Today and Tomorrow", () => {
    const chips = m.buildQuickDateChips("2026-10-14", 6);
    assert.equal(chips[0].label, "Today");
    assert.equal(chips[0].key, "2026-10-14");
    assert.equal(chips[1].label, "Tomorrow");
    assert.equal(chips[2].label, "Fri");
    assert.equal(chips[5].key, "2026-10-19");
  });
  test("drags keep the 15 minute floor and a plain click is gated by a drag threshold", () => {
    const q = loadStudlinModule();
    let r = q.computeQuickCreateRange(600, 615);
    assert.equal(r.endTime, "10:15");
    r = q.computeQuickCreateRange(600, 600);
    assert.equal(r.endTime, "10:15", "floor kept");
    assert.match(SOURCE, /CREATE_DRAG_THRESHOLD_PX=\d+/);
    assert.equal((SOURCE.match(/if\(!info\.moved\)\{/g) || []).length, 2, "week and day both wait for movement");
    assert.doesNotMatch(SOURCE, /computeQuickCreateRangeSeeded|quickCreateSeedMinutes/);
  });
});

describe("source guards", () => {
  test("DurationChips exists and is used at New Task, repeat task, routine modal and quick-create", () => {
    assert.match(SOURCE, /const DurationChips = \(/);
    assert.match(SOURCE, /role="radiogroup"/);
    assert.match(SOURCE, /<DurationChips value=\{evDuration\} onChange=\{v=>\{setEvDuration\(v\);setEvDurationTouched\(true\);\}\} \/>/);
    assert.match(SOURCE, /<Field label="Duration"><DurationChips value=\{duration\} onChange=\{setDuration\} \/><\/Field>/);
    const popover = SOURCE.slice(SOURCE.indexOf("function QuickCreateTaskPopover"));
    assert.ok(popover.slice(0, 4000).includes("<DurationChips"), "quick-create popover has the chips");
    assert.ok((SOURCE.match(/<DurationChips /g) || []).length >= 5);
  });

  test("quick-create duration change resizes the draft live and keeps the colour fill", () => {
    assert.match(SOURCE, /const handleQuickCreateDuration=/);
    assert.match(SOURCE, /const handleQuickCreateColor=\(color\)=>setQuickCreateDraft\(d=>d\?\{\.\.\.d,color\}:d\);/);
    assert.match(SOURCE, /quickCreateDraft\.color\?lookDraftStyle\(quickCreateDraft\.color,getLook\(\),lookMode\(\),quickCreateDraft\.color\+"B3"\)/);
    assert.match(SOURCE, /const ESTIMATED_HEIGHT=230;/);
    assert.match(SOURCE, /onKeyDown=\{e=>\{ if\(e\.key==="Enter"\)\{e\.preventDefault\(\);submit\(\);\}/);
  });

  test("live range pill renders while resizing and while drag-creating", () => {
    assert.match(SOURCE, /const LiveRangePill = /);
    assert.ok((SOURCE.match(/<LiveRangePill /g) || []).length >= 3);
  });

  test("New Task: date defaults to the selected day, Save is not blocked by an empty date, Type dropdown and More options remain", () => {
    assert.match(SOURCE, /setEvDate\(smartFeaturesOn\(\)\?"":\(dateK\|\|selDay\|\|dayKey\(\)\)\)/);
    assert.match(SOURCE, /taskMode==="manual"&&!evDate\)setEvDate\(evPrefillDate\|\|dayKey\(\)\)/);
    assert.ok(!/disabled=\{!evTitle\.trim\(\)\|\|!evDate\.trim\(\)/.test(SOURCE));
    assert.ok(!/disabled=\{!\(evTitle\.trim\(\)&&evDate\.trim\(\)/.test(SOURCE));
    assert.match(SOURCE, /<QuickDateField value=\{evDate\}/);
    assert.match(SOURCE, /\+ More options/);
    assert.match(SOURCE, /label="Type"/);
  });

  test("Brain Dump stays Pro-gated and the local parse is not charged", () => {
    assert.match(SOURCE, /if\(!canUseBrainDump\(\)\)\{setPricingOpen\(canUseBrainDumpReason\(\)==="free-tier"\?"brainDump":"aiUsageCap"\);return;\}\n    if\(bdListening\)stopBdRec\(\);/);
    const fb = SOURCE.slice(SOURCE.indexOf("function fallbackSplitBrainDump"), SOURCE.indexOf("function fallbackSplitBrainDump") + 1200);
    assert.ok(!fb.includes("recordBrainDump"));
    assert.match(SOURCE, /Ctrl\/Cmd\+Enter/);
    assert.match(SOURCE, /item"\+\(n!==1\?"s":""\)\+" detected"/);
  });
});
