// Persona audit 2026-09-25 (Wave 3, chunk 11): settings follow you across
// devices, and "Set up next term" asks for the new dates. settingsSync is an
// owner-only doc with no field allowlist in firestore.rules, so no rules
// change is needed for the new fields.
const { test, describe } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const path = require("path");
const SOURCE = fs.readFileSync(path.join(__dirname, "..", "studlin-app.jsx"), "utf8");
const RULES = fs.readFileSync(path.join(__dirname, "..", "firestore.rules"), "utf8");

describe("settings sync", () => {
  test("wake/sleep, term, days away and incognito are pushed on write and pulled on sign-in", () => {
    for (const k of ["wakeSleep", "schoolTerm", "holidays", "settings"]) {
      assert.ok(SOURCE.includes(`syncWriteHooks["${k}"]=()=>pushSettingsSync();`), k);
    }
    assert.match(SOURCE, /wakeSleep:lsGet\("wakeSleep",null\),\s*schoolTerm:lsGet\("schoolTerm",null\),\s*holidays:lsGet\("holidays",\[\]\),\s*incognito:lsGet\("settings",\{\}\)\.incognito===true/);
    assert.match(SOURCE, /if\(data\.schoolTerm&&data\.schoolTerm\.start&&data\.schoolTerm\.end\)lsSet\("schoolTerm",data\.schoolTerm\)/);
    assert.match(SOURCE, /if\(typeof data\.incognito==="boolean"\)lsSet\("settings",\{\.\.\.lsGet\("settings",\{\}\),incognito:data\.incognito\}\)/);
  });
  test("the rules for settingsSync stay owner-only with no field allowlist, so no deploy is needed", () => {
    const i = RULES.indexOf("match /settingsSync/{userId}");
    const block = RULES.slice(i, i + 200);
    assert.match(block, /allow read, write: if request\.auth != null && request\.auth\.uid == userId;/);
  });
});

describe("term rollover asks for the new dates", () => {
  test("the wizard treats the saved term as unknown and starts the term dates blank on rollover", () => {
    assert.match(SOURCE, /const knowsTerm=!termRollover&&\(\(\)=>/);
    assert.match(SOURCE, /setTermStart\(\(!termRollover&&term&&term\.start\)\|\|""\)/);
    assert.match(SOURCE, /setTermEnd\(\(!termRollover&&term&&term\.end\)\|\|""\)/);
  });
  test("only the Set up next term banner turns it on, and every exit turns it off", () => {
    assert.match(SOURCE, /onClick=\{\(\)=>\{setClassSetupRollover\(true\);setClassSetupOpen\(true\);\}\}/);
    assert.match(SOURCE, /onSkip=\{\(\)=>\{lsSet\("classSetupDeferredUntil",Date\.now\(\)\+86400000\);setClassSetupOpen\(false\);setClassSetupRollover\(false\);if\(isFreshAccount\)\{setTheme\("dark"\);if\(isBrandNewAccountForManualFirst\(\)\)\{setQuestionAskPref\("smartFeatures",false\);lsSet\("settings",\{\.\.\.lsGet\("settings",\{\}\),smartFeaturesSkipDefault:true\}\);\}\}\}/);
    assert.match(SOURCE, /setClassSetupRollover\(false\);\s*setClassSetupOpen\(false\);/);
  });
});
