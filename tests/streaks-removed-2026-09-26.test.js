// Product decision 2026-09-26: Studlin has no streaks. XP and levels (based on
// real focus minutes) stay. Guards that the feature, its data, and every place
// that talked about it are gone.
const { test, describe } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const path = require("path");
const ROOT = path.join(__dirname, "..");
const read = (f) => fs.readFileSync(path.join(ROOT, f), "utf8");
const APP = read("studlin-app.jsx");

describe("streak feature is gone from the app", () => {
  test("no streak machinery, UI or nudge remains", () => {
    for (const name of ["getStreak", "touchStreak", "StreakDetailModal", "computeStreakHeatmap", "streakCellColor", "shouldFireStreakNudge", "computeStreakWithFreezes", "weekStreak", "needsStreak", "STREAK_FREEZE"]) {
      assert.ok(!APP.includes(name), name + " must be gone");
    }
    assert.ok(!/-day streak|Day streak|Streak reminders|Study Streak/.test(APP), "no user-facing streak copy");
  });
  test("tiers and XP stay", () => {
    assert.ok(APP.includes("function levelInfo("));
    assert.ok(APP.includes("function getTotalMinutesFocused("));
  });
  test("the old local data is cleared and the published profile field is deleted", () => {
    assert.match(APP, /\["days","streakFrozenDays","streakFreezeTokens","streak-nudge-sent-date"\]\.forEach\(k=>\{try\{localStorage\.removeItem\("studlin-"\+k\);\}catch\(e\)\{\}\}\)/);
    assert.match(APP, /streak:firebase\.firestore\.FieldValue\.delete\(\),/);
  });
  test("task scoring no longer takes a streak (ordering is unchanged: the boost was the same for every task)", () => {
    assert.match(APP, /function scoreTask\(task,prefs\)\{/);
    assert.match(APP, /const raw=0\.35\*p\+0\.35\*urgency\+0\.20\*diffWeight;/);
  });
  test("an empty notification bell says so instead of showing a blank panel", () => {
    assert.match(APP, /notifs\.length===0&&<div[^\n]*You're all caught up/);
  });
});

describe("no streak talk on the public pages", () => {
  test("landing page, sign-in, onboarding and privacy policy", () => {
    for (const f of ["index.html", "signin.jsx", "onboarding.jsx", "privacy.html"]) {
      assert.ok(!/streak/i.test(read(f)), f + " still mentions streaks");
    }
  });
});
