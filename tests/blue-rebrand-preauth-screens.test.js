// experiment/blue-rebrand (2026-09-15): VerifyEmailScreen, AuthScreen,
// AuthGate's own loading splash, SharedChatView's T.lime fallback, the
// Settings > Appearance ThemeCard preview swatches, and ErrorBoundary's
// crash screen all hardcode their colors directly rather than reading
// T.lime -- most render before the rest of the app's T/ACCENTS system is
// reachable (pre-auth gates, a crash fallback), so they never picked up
// ANY accent choice, always staying green regardless of what a student
// (or this branch's new default) actually selected. Source-level
// regression guards only -- these are component-closure/top-level literal
// styles, not pure functions worth a real invocation test.
const { test, describe } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const path = require("path");

const SOURCE = fs.readFileSync(path.join(__dirname, "..", "studlin-app.jsx"), "utf8");

describe("pre-auth / crash-fallback screens no longer hardcode the old green", () => {
  test("none of the old lime literals survive outside the real ACCENTS.Lime/accents-picker entries", () => {
    // The only 3 legitimate remaining hits are: darkT's own base lime
    // field, ACCENTS.Lime's dk.lime value, and the "Lime" swatch entry in
    // the Settings picker array -- Lime stays a real, selectable accent,
    // this just isn't the DEFAULT anymore. Anything beyond that count
    // would mean a hardcoded screen was missed.
    const hits = (SOURCE.match(/#AECE5E/g) || []).length;
    assert.equal(hits, 3, `expected exactly 3 legitimate #AECE5E references (found ${hits}) -- a new one means a hardcoded screen was missed`);
  });

  test("VerifyEmailScreen, AuthScreen, and AuthGate's loading splash all use the new blue instead", () => {
    const screens = ["function VerifyEmailScreen", "function AuthScreen", "if(user===undefined)return"];
    screens.forEach((marker) => {
      const idx = SOURCE.indexOf(marker);
      assert.notEqual(idx, -1, `couldn't find ${marker}`);
      const block = SOURCE.slice(idx, idx + 2600);
      assert.match(block, /#5F89DD/, `${marker}'s block should reference the new blue`);
      assert.doesNotMatch(block, /#AECE5E|#CBDF92|#14342A,#0E1F18|rgba\(174,206,94/, `${marker}'s block should have no leftover green literals`);
    });
  });

  test("ErrorBoundary's crash-recovery button uses the new blue", () => {
    const idx = SOURCE.indexOf("class ErrorBoundary extends React.Component");
    assert.notEqual(idx, -1);
    const block = SOURCE.slice(idx, idx + 2200);
    assert.match(block, /background:"#5F89DD"/);
  });

  test("SharedChatView's defensive T.lime fallback no longer falls back to green", () => {
    assert.match(SOURCE, /lime=T\.lime\|\|"#5F89DD"/);
  });

  test("Settings' theme-preview swatches reflect the real current accent (T.lime) instead of a hardcoded green dot", () => {
    const idx = SOURCE.indexOf("const ThemeCard = ({mode,label,sub})");
    assert.notEqual(idx, -1);
    const block = SOURCE.slice(idx, idx + 2000);
    assert.doesNotMatch(block, /background:"#AECE5E"/);
    assert.match(block, /background:T\.lime,borderRadius:2/);
    assert.match(block, /background:T\.lime,borderRadius:3/);
  });
});
