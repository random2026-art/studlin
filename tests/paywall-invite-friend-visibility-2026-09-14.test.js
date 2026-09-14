// User report, 2026-09-13/14: "the thing when the paywall shows up where
// they can get studlin pro limited free of invite friend make it more
// noticible right now as the user I have to scroll down to find it."
//
// The invite-a-friend referral banner used to render dead last in the
// pricing Modal -- after both plan cards AND the competitor-price
// comparison card -- so it was off-screen until a student scrolled the
// whole modal. Moved to right after the billing toggle, above PlanCards,
// and given a heavier border/background so it reads as a real option
// instead of fine print, while staying visually secondary to the plan
// cards' own "Upgrade to Pro" CTA just below it (still the primary
// action -- see PRICING_PLANS' own "featured" flag).
//
// Component-closure UI -- source-level regression guard, same convention
// as the other tests in this suite. Run with `npm test`.
const { test, describe } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const path = require("path");

const SOURCE = fs.readFileSync(path.join(__dirname, "..", "studlin-app.jsx"), "utf8");

describe("Pricing modal: invite-a-friend banner is above the fold, before the plan cards", () => {
  test("the banner now renders BEFORE <PlanCards, not after it", () => {
    const modalIdx = SOURCE.indexOf('title="Studlin plans"');
    assert.ok(modalIdx > -1, "the pricing Modal should still exist under this title");
    const bannerIdx = SOURCE.indexOf('Not ready to pay?', modalIdx);
    const planCardsIdx = SOURCE.indexOf('<PlanCards billing={pricingBilling}', modalIdx);
    assert.ok(bannerIdx > -1 && planCardsIdx > -1);
    assert.ok(bannerIdx < planCardsIdx, "the invite-a-friend banner must appear before PlanCards in the modal, not after it (and the competitor-price card), so it's visible without scrolling");
  });

  test("still hidden for someone already on Pro or Pro-Limited", () => {
    const modalIdx = SOURCE.indexOf('title="Studlin plans"');
    const guardIdx = SOURCE.indexOf('getPlan()!=="Pro"&&getPlan()!=="Pro-Limited"&&(', modalIdx);
    assert.ok(guardIdx > -1);
    const bannerIdx = SOURCE.indexOf('Not ready to pay?', modalIdx);
    assert.ok(guardIdx < bannerIdx && bannerIdx - guardIdx < 800, "the plan guard must directly wrap this same banner");
  });

  test("still routes to the Invite a friend action on click", () => {
    const idx = SOURCE.indexOf('Not ready to pay?');
    const body = SOURCE.slice(idx, idx + 700);
    assert.match(body, /lsSet\("pendingOpenInvite",true\);setPricingOpen\(false\);setActive\("friends"\);/);
  });

  test("visually strengthened, not just moved -- heavier border/background than the old fine-print treatment", () => {
    const modalIdx = SOURCE.indexOf('title="Studlin plans"');
    const guardIdx = SOURCE.indexOf('getPlan()!=="Pro"&&getPlan()!=="Pro-Limited"&&(', modalIdx);
    const body = SOURCE.slice(guardIdx, guardIdx + 800);
    assert.match(body, /background:T\.lime\+"14",borderRadius:12,border:`1\.5px solid \$\{T\.lime\}44`/);
  });
});
