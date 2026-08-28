// Regression tests for the 2026-08-27 referral trial feature.
//
// Context: the Network tab's growth banner promised "50 bonus AI credits"
// for every friend who joins via an invite link -- on inspection this had
// ZERO backing implementation anywhere (no server code granted anything;
// accepting a friend request just flipped its status, nothing else). The
// user asked for something clearer than raw "AI credits" ("no one knows
// what that means"), framed as days of Pro instead, but with genuinely
// stricter usage caps than real Pro -- not just a cosmetic copy change.
//
// This is now real: accepting a friend request that came in via someone's
// invite link (source:"invite_link" on the friendship doc, stamped only
// by AuthGate's onAuthStateChanged) grants BOTH people a 3-day
// "Pro-Limited" plan -- its own distinct plan value, not "Pro" with a
// shorter clock, so every per-feature AI cap stays a fraction of real
// Pro's for the whole trial (see effectiveProLimit).
//
// hasProAccess/isReferralTrial/effectiveProLimit/getCreditLimit and all 12
// canX gates + aiGateBlockReason are real top-level pure functions, tested
// directly via the harness. The client-side grant trigger (acceptReq) and
// the server-side grant/expiry logic (api/me.js, which needs the Firebase
// Admin SDK this suite doesn't mock -- same established precedent as
// share-availability-request.test.js) are covered by source-level
// regression guards. Run with `npm test`.
const { test, describe } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const path = require("path");
const { loadStudlinModule } = require("./harness.js");

const APP_SOURCE = fs.readFileSync(path.join(__dirname, "..", "studlin-app.jsx"), "utf8");
const ME_SOURCE = fs.readFileSync(path.join(__dirname, "..", "api", "me.js"), "utf8");
const monthKey = () => new Date().toISOString().slice(0, 7);

describe("hasProAccess / isReferralTrial: Pro-Limited is real access, but not real Pro", () => {
  test("Free has neither", () => {
    const m = loadStudlinModule();
    m.setPlanLS("Free");
    assert.equal(m.hasProAccess(), false);
    assert.equal(m.isReferralTrial(), false);
  });
  test("Pro-Limited has Pro access but IS the referral trial", () => {
    const m = loadStudlinModule();
    m.setPlanLS("Pro-Limited");
    assert.equal(m.hasProAccess(), true);
    assert.equal(m.isReferralTrial(), true);
  });
  test("real Pro has Pro access and is NOT the referral trial", () => {
    const m = loadStudlinModule();
    m.setPlanLS("Pro");
    assert.equal(m.hasProAccess(), true);
    assert.equal(m.isReferralTrial(), false);
  });
});

describe("effectiveProLimit: only shrinks the cap during the referral trial", () => {
  test("Free and Pro both get the full, unmodified limit", () => {
    const m = loadStudlinModule();
    m.setPlanLS("Free");
    assert.equal(m.effectiveProLimit(60), 60);
    m.setPlanLS("Pro");
    assert.equal(m.effectiveProLimit(60), 60);
  });
  test("Pro-Limited gets roughly a twentieth of the full limit, floored at 2 -- meaningfully stricter than Pro's own daily rate over a 3-day trial", () => {
    const m = loadStudlinModule();
    m.setPlanLS("Pro-Limited");
    assert.equal(m.effectiveProLimit(60), 3);
    assert.equal(m.effectiveProLimit(40), 2);
    assert.equal(m.effectiveProLimit(400), 20);
    assert.equal(m.effectiveProLimit(30), 2, "never floors below 2 -- a trial that grants zero real uses of a feature isn't a trial");
  });
});

describe("getCreditLimit: three distinct tiers, not just Free-vs-Pro", () => {
  test("Free=120, Pro-Limited=300, Pro=100000", () => {
    const m = loadStudlinModule();
    m.setPlanLS("Free");
    assert.equal(m.getCreditLimit(), 120);
    m.setPlanLS("Pro-Limited");
    assert.equal(m.getCreditLimit(), 300);
    m.setPlanLS("Pro");
    assert.equal(m.getCreditLimit(), 100000);
  });
});

describe("A representative Pro-gated feature (flashcard generation) respects the trial's reduced cap", () => {
  test("Free: still hard-blocked, exactly as before this change", () => {
    const m = loadStudlinModule();
    m.setPlanLS("Free");
    assert.equal(m.canGenFlashcards(), false);
  });
  test("Pro-Limited: allowed under the reduced cap (PRO_FLASHCARD_GEN_LIMIT=60 -> trial cap 3)", () => {
    const m = loadStudlinModule();
    m.setPlanLS("Pro-Limited");
    m.localStorage.setItem("studlin-flashcardGens", JSON.stringify({ month: monthKey(), count: 2 }));
    assert.equal(m.canGenFlashcards(), true);
  });
  test("Pro-Limited: blocked once it hits its OWN reduced cap, well before Pro's real 60/month limit", () => {
    const m = loadStudlinModule();
    m.setPlanLS("Pro-Limited");
    m.localStorage.setItem("studlin-flashcardGens", JSON.stringify({ month: monthKey(), count: 3 }));
    assert.equal(m.canGenFlashcards(), false, "3 uses should already exhaust the trial's cap even though real Pro allows 60");
  });
  test("real Pro: completely unaffected, still gets the full 60/month cap", () => {
    const m = loadStudlinModule();
    m.setPlanLS("Pro");
    m.localStorage.setItem("studlin-flashcardGens", JSON.stringify({ month: monthKey(), count: 3 }));
    assert.equal(m.canGenFlashcards(), true, "a real Pro subscriber must never be capped at the trial's tiny limit");
  });
});

describe("canScanSyllabus/recordSyllabusScan: Pro-Limited uses the Pro-style monthly counter, not Free's one-time flag", () => {
  test("Pro-Limited scan is recorded against the monthly counter, leaving the one-time Free flag untouched", () => {
    const m = loadStudlinModule();
    m.setPlanLS("Pro-Limited");
    m.recordSyllabusScan();
    assert.equal(m.getSyllabusScanUsage().count, 1);
    assert.equal(m.localStorage.getItem("studlin-freeSyllabusScanUsed"), null);
  });
  test("Pro-Limited is capped at its own reduced limit (PRO_SYLLABUS_SCAN_LIMIT=40 -> trial cap 2), not Free's single lifetime scan", () => {
    const m = loadStudlinModule();
    m.setPlanLS("Pro-Limited");
    m.localStorage.setItem("studlin-syllabusScans", JSON.stringify({ month: monthKey(), count: 2 }));
    assert.equal(m.canScanSyllabus(), false);
    m.localStorage.setItem("studlin-syllabusScans", JSON.stringify({ month: monthKey(), count: 1 }));
    assert.equal(m.canScanSyllabus(), true);
  });
});

describe("aiGateBlockReason: Pro-Limited gets an honest reason, distinct from Free", () => {
  test("Free is still free-tier", () => {
    const m = loadStudlinModule();
    m.setPlanLS("Free");
    assert.equal(m.canGenQuizReason(), "free-tier");
  });
  test("Pro-Limited under its own reduced cap has no block reason (allowed)", () => {
    const m = loadStudlinModule();
    m.setPlanLS("Pro-Limited");
    assert.ok(!m.canGenQuizReason());
  });
  test("Pro-Limited over its OWN reduced cap (not Pro's real 60) reports feature-cap", () => {
    const m = loadStudlinModule();
    m.setPlanLS("Pro-Limited");
    m.localStorage.setItem("studlin-quizGens", JSON.stringify({ month: monthKey(), count: 3 }));
    assert.equal(m.canGenQuizReason(), "feature-cap");
    assert.equal(m.canGenQuiz(), false);
  });
  test("Pro-Limited still shares the same global AI-spend ceiling as real Pro", () => {
    const m = loadStudlinModule();
    m.setPlanLS("Pro-Limited");
    m.localStorage.setItem("studlin-aiSpendMills", JSON.stringify({ month: monthKey(), count: 4000 }));
    assert.equal(m.canGenQuizReason(), "spend-ceiling");
  });
});

describe("Every other Pro-gated feature was actually migrated off the old binary getPlan()===\"Free\" check (not just the one tested above)", () => {
  test("no canXxx gate still hard-codes the old Free-only check -- every one now goes through hasProAccess so Pro-Limited is included", () => {
    const staleGates = [
      'function canScanScreenshot(){if(getPlan()==="Free")return false;',
      'function canScanNote(){if(getPlan()==="Free")return false;',
      'function canGenFlashcards(){if(getPlan()==="Free")return false;',
      'function canBuildExamPlan(){if(getPlan()==="Free")return false;',
      'function canAddSessionFocus(){if(getPlan()==="Free")return false;',
      'function canBreakDownProject(){if(getPlan()==="Free")return false;',
      'function canUseSmartReschedule(){if(getPlan()==="Free")return false;',
      'function canUseBrainDump(){if(getPlan()==="Free")return false;',
      'function canUseAiArrange(){if(getPlan()==="Free")return false;',
      'function canClassifyCalendarImport(){if(getPlan()==="Free")return false;',
      'function canGenQuiz(){if(getPlan()==="Free")return false;',
    ];
    staleGates.forEach(snippet => assert.doesNotMatch(APP_SOURCE, new RegExp(snippet.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))));
  });

  test("all 11 now check hasProAccess and cap through effectiveProLimit", () => {
    ['canScanScreenshot,getScreenshotScanUsage,PRO_SCREENSHOT_SCAN_LIMIT',
     'canScanNote,getNoteScanUsage,PRO_NOTE_SCAN_LIMIT',
     'canGenFlashcards,getFlashcardGenUsage,PRO_FLASHCARD_GEN_LIMIT',
     'canBuildExamPlan,getExamPlanUsage,PRO_EXAM_PLAN_LIMIT',
     'canAddSessionFocus,getSessionFocusUsage,PRO_SESSION_FOCUS_LIMIT',
     'canBreakDownProject,getProjectBreakdownUsage,PRO_PROJECT_BREAKDOWN_LIMIT',
     'canUseSmartReschedule,getSmartRescheduleUsage,PRO_SMART_RESCHEDULE_LIMIT',
     'canUseBrainDump,getBrainDumpUsage,PRO_BRAIN_DUMP_LIMIT',
     'canUseAiArrange,getAiArrangeUsage,PRO_AI_ARRANGE_LIMIT',
     'canClassifyCalendarImport,getCalendarClassifyUsage,PRO_CALENDAR_CLASSIFY_LIMIT',
     'canGenQuiz,getQuizGenUsage,PRO_QUIZ_GEN_LIMIT',
    ].forEach(triple => {
      const [fn, usage, limit] = triple.split(',');
      const re = new RegExp(`function ${fn}\\(\\)\\{if\\(!hasProAccess\\(\\)\\)return false;if\\(!underAiSpendCeiling\\(\\)\\)return false;return ${usage}\\(\\)\\.count<effectiveProLimit\\(${limit}\\);\\}`);
      assert.match(APP_SOURCE, re, `${fn} did not migrate to hasProAccess()/effectiveProLimit()`);
    });
  });
});

describe("Growth banner copy: real days-of-trial framing, not the old unbacked credit promise", () => {
  test("neither banner mentions the old fabricated credit promise anymore", () => {
    assert.doesNotMatch(APP_SOURCE, /bonus AI credits/);
    assert.doesNotMatch(APP_SOURCE, /bonus AI scheduling credits/);
  });
  test("both banners state the real, shared REFERRAL_TRIAL_DAYS constant, not a hardcoded number that could drift from the real grant", () => {
    const matches = APP_SOURCE.match(/\{REFERRAL_TRIAL_DAYS\} days of Pro-Limited/g) || [];
    assert.equal(matches.length, 2, "expected both the Network-tab banner and the invite modal to reference the same constant");
  });
});

describe("Client: acceptReq actually triggers the grant (source-level regression guard -- component closure)", () => {
  test("accepting a friend request POSTs the accept-friend-referral action with the friendship id", () => {
    assert.match(APP_SOURCE, /action:"accept-friend-referral",friendshipId:id/);
  });
  test("a failure in the grant call never surfaces as an error on the accept action itself (fire-and-forget)", () => {
    const idx = APP_SOURCE.indexOf("const acceptReq=async(id)=>{");
    const body = APP_SOURCE.slice(idx, idx + 700);
    assert.match(body, /\.catch\(\(\)=>\{\}\);/);
  });
  test("the device re-syncs its own plan/credits right after, so Pro-Limited access reflects immediately without waiting on a natural poll", () => {
    assert.match(APP_SOURCE, /\.then\(\(\)=>fetchUserProfile\(\)\)\.catch\(\(\)=>\{\}\);/);
  });
});

describe("Server: handleReferralTrialGrant (api/me.js) (source-level regression guards -- needs the Admin SDK this suite doesn't mock, same precedent as share-availability-request.test.js)", () => {
  test("the router dispatches the new action", () => {
    assert.match(ME_SOURCE, /if \(action === 'accept-friend-referral'\) return handleReferralTrialGrant\(user, req, res\);/);
  });
  test("only a real party to the friendship can trigger this", () => {
    assert.match(ME_SOURCE, /if \(data\.senderId !== user\.uid && data\.receiverId !== user\.uid\) \{/);
  });
  test("requires BOTH a genuinely accepted status AND an invite_link source -- an ordinary organic friend request must never pay out", () => {
    assert.match(ME_SOURCE, /if \(data\.status !== 'accepted'\) return res\.status\(200\)\.json\(\{ ok: true, granted: false, reason: 'not_accepted' \}\);/);
    assert.match(ME_SOURCE, /if \(data\.source !== 'invite_link'\) return res\.status\(200\)\.json\(\{ ok: true, granted: false, reason: 'not_a_referral' \}\);/);
  });
  test("grants exactly once per friendship via a persisted flag on the friendship doc itself", () => {
    assert.match(ME_SOURCE, /if \(data\.referralTrialGranted\) return res\.status\(200\)\.json\(\{ ok: true, granted: false, reason: 'already_granted' \}\);/);
    assert.match(ME_SOURCE, /await ref\.set\(\{ referralTrialGranted: true, referralTrialGrantedAt: new Date\(\)\.toISOString\(\) \}, \{ merge: true \}\);/);
  });
  test("never downgrades a real paying subscriber or an already-longer beta/referral trial", () => {
    assert.match(ME_SOURCE, /if \(udata\.stripeSubscriptionId && udata\.subscriptionStatus === 'active'\) return;/);
    assert.match(ME_SOURCE, /if \(udata\.plan === 'Pro' && udata\.betaTrialExpiresAt && new Date\(udata\.betaTrialExpiresAt\) > new Date\(\)\) return;/);
    assert.match(ME_SOURCE, /if \(udata\.plan === 'Pro-Limited' && udata\.referralTrialExpiresAt && new Date\(udata\.referralTrialExpiresAt\) > new Date\(expiresAt\)\) return;/);
  });
  test("tops up real Firestore credits to match the client's 300 cap, since api/chat.js deducts against the real stored field regardless of plan", () => {
    assert.match(ME_SOURCE, /const credits = Math\.max\(udata\.credits \?\? DEFAULT_CREDITS, 300\);/);
  });
  test("grants to both parties of the friendship, not just the accepter", () => {
    assert.match(ME_SOURCE, /await Promise\.all\(\[grantTo\(data\.senderId\), grantTo\(data\.receiverId\)\]\);/);
  });
  test("self-expires on read, same compute-on-read pattern as the existing beta trial, and resets plan to Free once it lapses", () => {
    assert.match(ME_SOURCE, /if \(plan === 'Pro-Limited' && data\.referralTrialExpiresAt && new Date\(data\.referralTrialExpiresAt\) <= new Date\(\)\) \{\s*plan = 'Free';/);
  });
  test("referralTrialExpiresAt is returned in the profile payload so the client can show a real countdown", () => {
    assert.match(ME_SOURCE, /referralTrialExpiresAt: data\.referralTrialExpiresAt \|\| null,/);
  });
});
