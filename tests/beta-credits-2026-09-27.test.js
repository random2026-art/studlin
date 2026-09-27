// Bug 2026-09-27: beta-trial Pro accounts never received the monthly credits a
// paying Pro subscriber gets, so they ran out of the starting 120 (about 40
// Studlin AI questions) and api/chat.js then refused every AI call.
const { test, describe } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const path = require("path");
process.env.STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY || "sk_test_x";
const me = require("../api/me.js");
const ME = fs.readFileSync(path.join(__dirname, "..", "api", "me.js"), "utf8");

const now = new Date("2026-09-27T12:00:00Z");
const active = "2026-10-15T00:00:00.000Z";
const beta = (over) => ({ plan: "Pro", betaTrialExpiresAt: active, credits: 0, aiSpendCentsCycle: 300, ...over });

describe("betaCreditTopUp (real calls)", () => {
  test("an active beta account with no credits is refilled to the Pro amount and its spend counter is reset", () => {
    const t = me.betaCreditTopUp(beta(), now, false);
    assert.equal(t.credits, me.BETA_MONTHLY_CREDITS);
    assert.equal(t.aiSpendCentsCycle, 0);
    assert.equal(t.betaCreditsMonth, "2026-09");
  });
  test("it never reduces someone who already has more", () => {
    assert.equal(me.betaCreditTopUp(beta({ credits: 250000 }), now, false).credits, 250000);
  });
  test("once per calendar month: nothing due if already topped up this month, due again next month", () => {
    assert.equal(me.betaCreditTopUp(beta({ betaCreditsMonth: "2026-09" }), now, false), null);
    assert.equal(me.betaCreditTopUp(beta({ betaCreditsMonth: "2026-08" }), now, false).betaCreditsMonth, "2026-09");
  });
  test("force (redemption) tops up even in the same month", () => {
    assert.ok(me.betaCreditTopUp(beta({ betaCreditsMonth: "2026-09" }), now, true));
  });
  test("never applies to an expired trial, a Free account, or a real paying subscriber", () => {
    assert.equal(me.betaCreditTopUp(beta({ betaTrialExpiresAt: "2026-09-01T00:00:00.000Z" }), now, false), null);
    assert.equal(me.betaCreditTopUp({ plan: "Free", credits: 0 }, now, false), null);
    assert.equal(me.betaCreditTopUp(beta({ stripeSubscriptionId: "sub_1" }), now, false), null);
    assert.equal(me.betaCreditTopUp(null, now, false), null);
  });
});

describe("wiring", () => {
  test("redemption grants the credits and the profile read tops up before it answers", () => {
    assert.match(ME, /Object\.assign\(update, betaCreditTopUp\(\{ \.\.\.data, \.\.\.update \}, new Date\(\), true\)\);/);
    assert.match(ME, /const topUp = betaCreditTopUp\(\{ \.\.\.data, plan \}, new Date\(\), false\);\s*if \(topUp\) \{\s*await ref\.set\(topUp, \{ merge: true \}\);\s*Object\.assign\(data, topUp\);/);
  });
  test("the amount matches what a paying Pro subscriber gets", () => {
    const wh = fs.readFileSync(path.join(__dirname, "..", "api", "stripe-webhook.js"), "utf8");
    const n = wh.match(/PLAN_CREDITS = \{ Pro: (\d+) \}/)[1];
    assert.equal(Number(n), me.BETA_MONTHLY_CREDITS);
  });
});
