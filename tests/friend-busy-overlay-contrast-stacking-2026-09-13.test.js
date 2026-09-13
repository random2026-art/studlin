// User report, 2026-09-13: "make it so it's not transparent" (the friend
// busy overlay on Schedule with Friends) and "your schedule is on the top."
//
// Root cause: the busy mask (gsBusyEl in WeeklyPlanner, and its Day-view
// twin) rendered at ~12% opacity (mutedAlpha("1E")) AND at the same
// zIndex:3 as the real event-card block, but LATER in the DOM -- equal
// z-index ties break on document order, so the near-invisible mask was
// actually painting OVER real events, not under them. Low opacity had been
// masking that layering bug rather than fixing it.
//
// Fix: explicit zIndex:2 for the busy mask (below the event card's
// zIndex:3) guarantees the user's own real events always render on top
// regardless of DOM order, which is what makes it safe to raise the
// opacity (mutedAlpha("CC")) without ever obscuring a real event.
// Deliberately stays one merged/anonymous "someone's busy" mask, not
// broken out per friend (confirmed with the user).
//
// Component-closure UI (WeeklyPlanner/DayPlanner) -- source-level
// regression guard, same convention as the other Schedule with Friends
// test files. Run with `npm test`.
const { test, describe } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const path = require("path");

const SOURCE = fs.readFileSync(path.join(__dirname, "..", "studlin-app.jsx"), "utf8");

describe("Week view friend-busy overlay (gsBusyEl) is opaque and stacked below real events", () => {
  test("renders at high opacity, not the old ~12% mutedAlpha(\"1E\")", () => {
    const idx = SOURCE.indexOf("let gsBusyEl = null;");
    assert.ok(idx > -1, "gsBusyEl definition should still exist under this name");
    const body = SOURCE.slice(idx, idx + 700);
    assert.match(body, /background:mutedAlpha\("CC"\)/);
    assert.ok(!body.includes('mutedAlpha("1E")'), "must not still be using the old near-invisible opacity");
  });

  test("sits at a lower zIndex than the real event card, so ties never let it paint on top", () => {
    const idx = SOURCE.indexOf("let gsBusyEl = null;");
    const overlayBody = SOURCE.slice(idx, idx + 700);
    assert.match(overlayBody, /zIndex:2,pointerEvents:"none"/);

    const cardIdx = SOURCE.indexOf("blockRefs.current.set(ev.id,el)");
    assert.ok(cardIdx > -1, "the real week-view event card ref callback should still exist");
    const cardBody = SOURCE.slice(cardIdx, cardIdx + 400);
    assert.match(cardBody, /zIndex:3/, "the real event card must stay above the overlay's zIndex:2");
  });

  test("stays a single merged mask -- still concats friend-busy with the user's own occupied intervals, not split per friend", () => {
    const idx = SOURCE.indexOf("let gsBusyEl = null;");
    const body = SOURCE.slice(idx, idx + 700);
    assert.match(body, /\(gsBusyByDate\[dk\] \|\| \[\]\)\.concat\(getDayOccupiedIntervals\(dk\)\)/);
  });
});

describe("Day view friend-busy overlay mirrors the same contrast/stacking fix", () => {
  test("renders at the same high opacity and lower zIndex as the Week view", () => {
    const idx = SOURCE.indexOf("{gsBusyByDate&&(gsBusyByDate[selDay]||[]).concat(getDayOccupiedIntervals(selDay)).map((iv,ii)=>(");
    assert.ok(idx > -1, "the Day view busy-overlay map should still exist under this shape");
    const body = SOURCE.slice(idx, idx + 400);
    assert.match(body, /background:mutedAlpha\("CC"\)/);
    assert.match(body, /zIndex:2,pointerEvents:"none"/);
    assert.ok(!body.includes('mutedAlpha("1E")'));
  });
});
