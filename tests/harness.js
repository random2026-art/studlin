// Loads the module-level pure(ish) functions out of studlin-app.jsx for
// testing, without touching the app's actual loading path at all (it's
// still Babel-in-browser via <script type="text/babel">, no bundler --
// this harness exists entirely on the side, for Node).
//
// Why this is more than "just require the file": studlin-app.jsx is JSX,
// which Node can't parse natively, and it ends with a real
// ReactDOM.createRoot(...).render(...) call that would try to mount the
// whole app the moment the file runs. This strips everything from the
// "// Mount" comment onward before transforming (JSX -> plain JS via
// esbuild, the same tool already used all session for syntax-checks) and
// evaluates what's left in a sandboxed vm context with just enough stubs
// (localStorage, Notification, a minimal React.Component) for the
// module-level function declarations to be defined without crashing.
// Nothing here needs the functions to actually render UI -- just to exist
// and be callable with plain data in, plain data out.
const fs = require("fs");
const path = require("path");
const vm = require("vm");
const esbuild = require("esbuild");

// A no-arg-freezing Date subclass for tests that need a deterministic
// "now" -- t.mock.timers.enable({apis:["Date"]}) does NOT reach here: it
// only patches the outer Node process's global Date, but loadStudlinModule
// runs the app in its own vm.createContext realm, which gets its own,
// separate, real (unmocked) Date built in. Verified empirically that
// pre-setting sandbox.Date before vm.createContext DOES take effect (the
// vm respects an already-present property instead of overwriting it with
// its own intrinsic) -- that's what makes this actually work, unlike the
// mock.timers approach two tests were relying on (silently a no-op,
// invisible until real wall-clock time happened to cross a day boundary
// mid-test-run and the "frozen" tests started failing for real).
// new Date(explicitArgs) still passes straight through to the real Date
// constructor -- only the no-arg "what time is it right now" case is
// frozen, so date-math against an explicit literal (very common
// throughout the scheduling engine, e.g. new Date(dateKey+"T12:00:00"))
// is completely unaffected.
function makeFrozenDateClass(nowISOString) {
  const fixedMs = new Date(nowISOString).getTime();
  return class extends Date {
    constructor(...args) {
      if (args.length === 0) super(fixedMs);
      else super(...args);
    }
    static now() { return fixedMs; }
  };
}

function loadStudlinModule(options) {
  const now = options && options.now;
  const filePath = path.join(__dirname, "..", "studlin-app.jsx");
  const raw = fs.readFileSync(filePath, "utf8");
  // Line-anchored exact match, not a plain substring search -- a prose
  // comment elsewhere in the file ("// Mounted conditionally in
  // Profile()...") starts with the same characters as this marker, and a
  // naive indexOf() silently matched THAT one instead of the real
  // boundary, truncating the module hundreds of lines early with no
  // error (everything after it just came back `undefined` from
  // globalThis, swallowed by the per-name try/catch below).
  const mountMatch = raw.match(/^\/\/ Mount$/m);
  if (!mountMatch) throw new Error("Couldn't find the \"// Mount\" boundary -- has studlin-app.jsx been restructured?");
  const withoutMount = raw.slice(0, mountMatch.index);

  const { code } = esbuild.transformSync(withoutMount, { loader: "jsx", format: "cjs" });
  // Function declarations (function foo(){}) leak onto the vm context's
  // global object automatically; const/let ones (const dayKey=(d)=>{...})
  // don't. This epilogue runs in the same scope as the original file, so
  // it can still see every one of them regardless of declaration style,
  // and explicitly exposes the ones tests actually need.
  const epilogue = `
;(function(){
  var exportNames = ["dayKey","checklistItemVisible","lsGet","lsSet","findOpenSlotFor","findReliableSlotFor",
    "findLegalSlotOrNull","rebalanceDay","isTier0Missed","computePausePlan","computeOccupiedIntervals",
    "IMMEDIATE_CATCHUP_MINS","IMMEDIATE_NOW_BUFFER_MINS",
    "findAllOverlaps","CALENDAR_OVERLAP_SCAN_DAYS_AHEAD","CALENDAR_OVERLAP_SCAN_DAYS_BEHIND",
    "computeAvatarScaledSize","AVATAR_MAX_DIM",
    "computeHolidayPlan",
    "computeReviewOffsets","computeReviewDates","weekPrepLoad",
    "evaluateExamPrepAdjustment","buildExamSessionEvents","scoreTask",
    "normalizeTaskVal","PAUSE_QUALIFYING_KINDS","TIER0_FIXED_KINDS",
    "planBrainDumpTasks","matchEventByTitle","getWeeklyRoutine","saveWeeklyRoutine",
    "getRoutineSkips","getRoutineOccurrencesForDate","findHabitSlotForToday",
    "materializeHabitsForDate","findTier0Slot","findSlotWithEviction",
    "RESHUFFLE_PENALTY","RESHUFFLE_ESCALATE_THRESHOLD","REBALANCE_RELIABILITY_MINS_WEIGHT",
    "examAlreadyPassedToday","getSchoolTerm","saveSchoolTerm",
    "getTimerCheckpoint","checkpointTimerSession","clearTimerCheckpoint",
    "resolveOrphanedCheckpoint","mergeImportedEvents","detectCalendarSourceType",
    "isAcademicCalendarSource","classifyImportedCalendarEvents","PLATFORM_HELP",
    "parseCalendarClassificationReply","projectSplitLinkFields",
    "splitSessionDuration","SPLIT_SESSION_MIN_MINUTES",
    "catchUpStalenessDays","catchUpStalenessLabel",
    "reconcileFixedEventConflicts","surfaceReconcileResult",
    "dayWorkloadMinutes","dayWorkloadTier","DAY_WORKLOAD_MODERATE_MINS","DAY_WORKLOAD_HEAVY_MINS",
    "computeMonthHeavyDays","MONTH_HEAVY_RELATIVE_RATIO","MONTH_HEAVY_MIN_ABSOLUTE_MINS",
    "MAX_VISIBLE_DAY_COLUMNS",
    "getDayOccupiedIntervals","checkManualStudyTime","dayHasRoomFor","undoTier0Move",
    "checkTimeOffImpact","simulateTimeOffBlock",
    "getWorkWindowMinsFor","detectPeakHourInsight","dismissPeakHourInsight",
    "logCompletionOutcome","getBucketReliability","setSchedulePreferences",
    "applyCheckInRating","computeExamReadiness","canGenQuiz","recordQuizGen",
    "getQuizGenUsage","QUIZ_GEN_LIMIT","PRO_QUIZ_GEN_LIMIT","setPlanLS","shouldShowWeekBalanceNudge",
    "canBuildExamPlan","recordExamPlanBuild","getExamPlanUsage","EXAM_PLAN_LIMIT","PRO_EXAM_PLAN_LIMIT",
    "canBreakDownProject","recordProjectBreakdown","getProjectBreakdownUsage","PROJECT_BREAKDOWN_LIMIT","PRO_PROJECT_BREAKDOWN_LIMIT",
    "canUseSmartReschedule","recordSmartReschedule","getSmartRescheduleUsage","PRO_SMART_RESCHEDULE_LIMIT",
    "chargeAiSpend","underAiSpendCeiling","getMonthlyAiSpend","PRO_MONTHLY_AI_SPEND_CEILING","AI_CALL_COST_ESTIMATES",
    "canUseBrainDump","recordBrainDump","getBrainDumpUsage","PRO_BRAIN_DUMP_LIMIT",
    "canUseAiArrange","recordAiArrange","getAiArrangeUsage","PRO_AI_ARRANGE_LIMIT",
    "canClassifyCalendarImport","recordCalendarClassify","getCalendarClassifyUsage","PRO_CALENDAR_CLASSIFY_LIMIT",
    "removeGenericExamPrepSessions","examLinkedPrepData","applyExamTypeSwitchCleanup",
    "examTypeSwitchFieldPatch","projectDropFieldPatch","deckExamIds","deckLinkedToExam",
    "findSharedStudyWindow","buildDeferredCalendarReviewQueue","hasEnoughDetailForBreakdown",
    "canAddSessionFocus","recordSessionFocus","getSessionFocusUsage","PRO_SESSION_FOCUS_LIMIT",
    "canGenFlashcards","recordFlashcardGen","getFlashcardGenUsage","FLASHCARD_GEN_LIMIT","PRO_FLASHCARD_GEN_LIMIT",
    "canScanSyllabus","recordSyllabusScan","getSyllabusScanUsage","SYLLABUS_SCAN_LIMIT","PRO_SYLLABUS_SCAN_LIMIT",
    "canScanScreenshot","recordScreenshotScan","getScreenshotScanUsage","SCREENSHOT_SCAN_LIMIT","PRO_SCREENSHOT_SCAN_LIMIT",
    "canScanNote","recordNoteScan","getNoteScanUsage","NOTE_SCAN_LIMIT","PRO_NOTE_SCAN_LIMIT",
    "dismissWeekBalanceNudge","computeBusyWindowsPayload","BUSY_WINDOW_DAYS_AHEAD",
    "layoutDayEvents","computeEventBlockHeightPx","isTimerEligible",
    "logSuggestionDecision","examPrepIntervalPosition","fmtMovedReasonSuffix",
    "fmtPlacementReason","TIER0_EXAM_PREP_TOLERANCE_DAYS","computeAttackBlockStartDate",
    "ATTACK_BLOCK_GATE_PADDING","ATTACK_BLOCK_FINISH_BUFFER_DAYS","ATTACK_BLOCK_SUSTAINABLE_WEEKLY_MINS",
    "computeAttackBlockRampOffsets","ATTACK_BLOCK_RAMP_EXPONENT","detectAttackBlockOverruns",
    "getAttackOverrunDismissals","isAttackOverrunDismissedToday","dismissAttackOverrunToday",
    "computeWeekBalancePlan","scheduleAttackBlockFollowUp","logSession","getTotalMinutesFocused",
    "startAttackBlockChain","isPhaseDecompositionCandidate","PHASE_DECOMPOSITION_MIN_WEEKS",
    "startPhaseAwareAttackChain","buildAssignmentAttackBlockPair","commitSyllabusEvents","advanceProjectPhase",
    "buildSpacedSessionPreviews","createPracticeExam","recordPracticeExamAttempt","wrongTopicsFor",
    "reoptimizeAttackChain","upcomingExams","linkDeckToExamStorage",
    "computeOutlineRemainingMins","ATTACK_BLOCK_SKIP_ASSUMED_PCT",
    "findLaterTodaySlot","findNotTodaySlot",
    "advancedSchedulePlanner","todaysPlan","chunkTasksWithBreaks",
    "isReorderableTask","calculateTaskPriority","detectConflicts",
    "isLeadInFixed","isFixedItem","commitSyllabusEvents","buildSyllabusEventBatch",
    "buildPendingSchedulePreview","proposeProjectPhases","proposeOutline","proposeSessionFocuses",
    "attachSessionFocusesToSyllabusExams",
    "isPhaseDecompositionCandidate","finalizeExtractedText","MATERIAL_TEXT_CAP",
    "computeCatchUpMissedItems","computeCatchUpPlan","catchUpReasonFor",
    "compressExamPrepForRoom","dayOfWeekLabel","ordinalDay","CATCHUP_EXAM_URGENT_DAYS",
    "logCatchUpEvent","computeStudyPlanParams","materialVolumeBonus","STUDY_PLAN_CONFIDENCE_LEVELS","defaultSessionCountFor",
    "suggestDurationFor","difficultyTierOf","TIER0_MIN_BUCKET_SAMPLE","IMPORTANCE_TO_DURATION_MULTIPLIER",
    "gradeWeightNudgeFor","isConfidenceStreak","scoreTierFromPercent","SCORE_TIER_LABEL","subjectOutcomeNudge","completionCredit",
    "getSubjects","saveSubjects","courseIdForLabel","backfillCourseIds",
    "nextAvailableSubjectColor","SUBJECT_COLORS",
    "deleteCourseWithCascade","undoCourseDelete",
    "deriveFreePeriodsFromPeriods","getHsSchoolHours","saveHsSchoolHours",
    "subtractIntervals","effectiveLeadIn","effectiveTrailOut","effectiveLeadInForManualPlacement","effectiveTrailOutForManualPlacement","isLeadInFixed","isDuePill","formatRealWorldScheduleForDate","findNowConflict",
    "getRoutineOverrides","saveRoutineOverrides","expandRoutineOccurrences",
    "findFragmentedRoutineGroups","mergeFragmentedRoutineGroup","mergeDuplicateRoutines",
    "getHolidays","saveHolidays","isHoliday","getWakeSleep","saveWakeSleep",
    "isTermRolloverDue","getTermRolloverDismissedFor","dismissTermRollover",
    "upcomingAssignments","upcomingProjects","allExamsForPrep","itemLifecycleState",
    "computeSessionPriority","computePreparedness","restampSessionPriorities",
    "IMPORTANCE_TO_IMPACT","EXAM_TYPE_TO_IMPORTANCE","examWeightFromImportance","withDerivedExamImportance",
    "derivePerformanceConfidence","performanceConfidenceSuggestion","dismissPerformanceConfidence",
    "CONFIDENCE_TO_UNIT","EXAM_WEIGHT_TO_IMPACT",
    "confidenceUnitOf","confidenceZoneOf","RATING_UNIT","RATING_COMPLETION_CREDIT","EXAM_CHECKIN_SCALE",
    "computeCapacitySlack","EXAM_READINESS_TIGHT_SLACK_RATIO",
    "applyHoursTarget",
    "computeAssignmentPace","ASSIGNMENT_BEHIND_THRESHOLD","ATTACK_BLOCK_DEFAULT_ESTIMATE_HOURS",
    "isPaceNudgeDismissed","dismissPaceNudge","PACE_NUDGE_COOLDOWN_MS",
    "computeFillSuggestions","shouldFireStreakNudge","getStreakNudgeSentDate","markStreakNudgeSent",
    "reminderCategoryAllowed","pickLatestQueuedNudgesByKind","CATCHUP_RECOVERY_THRESHOLD",
    "notifSignatureOf","bottomRightNotifSlot","computeStreakWithFreezes","awardFreezeTokenIfMilestone",
    "getStreakFreezeTokens","STREAK_FREEZE_MILESTONE_DAYS","STREAK_FREEZE_MAX",
    "touchStreak","getStreak","isNearDuplicateCourseLabel","findDuplicateCourseGroups",
    "ensureSubjectsForClassRoutines","shouldShowSyllabusNudge","dismissSyllabusNudge",
    "SYLLABUS_NUDGE_COOLDOWN_MS","classNeedsSyllabus","isNearDuplicateSchoolName",
    "resolveCalendarHighlightFlag","CALENDAR_HIGHLIGHT_MAX_AGE_MS",
    "computeNewSlotCandidates","NEW_PLACEMENT_SCAN_DAYS","NEW_PLACEMENT_MAX_CANDIDATES",
    "computeRescheduleCandidates","RESCHEDULE_SCAN_DAYS","RESCHEDULE_MAX_CANDIDATES",
    "computeAcceptanceSummary","refreshPendingAcceptance","addTaskWithRebalance",
    // 2026-08-22 intelligence audit fixes (batch 1) -- exported so their
    // regression tests can call them directly rather than reaching them
    // only indirectly through a component closure.
    "markEventDone",
    "aiGateBlockReason","AI_USAGE_CAP_MESSAGE",
    "getPlan","setPlanLS","getCreditLimit","hasProAccess","isReferralTrial","effectiveProLimit","REFERRAL_TRIAL_DAYS",
    "canScanScreenshot","canScanNote","canBuildExamPlan","canAddSessionFocus","canBreakDownProject",
    "canUseSmartReschedule","canUseBrainDump","canUseAiArrange","canClassifyCalendarImport","canGenQuiz",
    "PRO_SCREENSHOT_SCAN_LIMIT","PRO_NOTE_SCAN_LIMIT","PRO_EXAM_PLAN_LIMIT","PRO_SESSION_FOCUS_LIMIT",
    "PRO_PROJECT_BREAKDOWN_LIMIT","PRO_SMART_RESCHEDULE_LIMIT","PRO_BRAIN_DUMP_LIMIT","PRO_AI_ARRANGE_LIMIT",
    "PRO_CALENDAR_CLASSIFY_LIMIT","PRO_QUIZ_GEN_LIMIT",
    "canGenQuizReason","canScanSyllabusReason","canScanScreenshotReason","canScanNoteReason",
    "canGenFlashcardsReason","canBuildExamPlanReason","canAddSessionFocusReason",
    "canBreakDownProjectReason","canUseSmartRescheduleReason","canUseBrainDumpReason","canUseAiArrangeReason",
    "generateFlashcardsFromText","generateQuizFromText","latestWrongTopicsForExam","sessionPriorityFor",
    "hourBucket","timeToMinutes","minutesToTime"];
  for (var i = 0; i < exportNames.length; i++) {
    try { globalThis[exportNames[i]] = eval(exportNames[i]); } catch (e) {}
  }
})();
`;

  // In-memory localStorage shim -- lsGet/lsSet just need get/setItem.
  const store = {};
  const localStorage = {
    getItem: (k) => (Object.prototype.hasOwnProperty.call(store, k) ? store[k] : null),
    setItem: (k, v) => { store[k] = String(v); },
    removeItem: (k) => { delete store[k]; },
    clear: () => { for (const k of Object.keys(store)) delete store[k]; },
  };

  const sandbox = {
    console,
    localStorage,
    // Only set when a test explicitly asks for a frozen clock (see
    // makeFrozenDateClass above) -- omitted otherwise so every other test
    // keeps getting the vm context's own real, live Date as before.
    ...(now ? { Date: makeFrozenDateClass(now) } : {}),
    // ErrorBoundary's "extends React.Component" only needs the class to
    // exist at definition time -- nothing here ever instantiates it.
    React: { Component: class {}, useState: () => [undefined, () => {}], useEffect: () => {}, useRef: () => ({ current: undefined }), createElement: () => null },
    Notification: undefined,
    navigator: { serviceWorker: undefined },
    document: undefined,
    window: undefined,
    // undefined here used to mean any exported function reaching
    // firebase.auth() (e.g. upsertProfile, called fire-and-forget by
    // touchStreak) threw synchronously inside its own async body, turning
    // into an unhandled promise rejection well after the test that
    // triggered it had already finished -- confusing failures with no
    // connection back to the real assertion. currentUser:null makes that
    // same real code path's own "if(!u)return" guard just no-op cleanly,
    // same as a real signed-out browser tab.
    firebase: { auth: () => ({ currentUser: null }) },
    location: { hostname: "test", search: "", href: "http://test/" },
    module: { exports: {} },
    exports: {},
    require,
    // vm.createContext's sandbox is a genuinely separate global object --
    // it gets the real ECMAScript intrinsics for free, but URL is a
    // WHATWG/Node API, not one of those, so any exported function that
    // does `new URL(...)` (detectCalendarSourceType, isAllowedCalendarHost-
    // style hostname checks) would otherwise silently hit its own
    // catch-block fallback for every input, never actually exercising the
    // real logic.
    URL,
  };
  sandbox.global = sandbox;
  vm.createContext(sandbox);
  vm.runInContext(code + epilogue, sandbox, { filename: "studlin-app.jsx (transformed)" });
  return sandbox;
}

module.exports = { loadStudlinModule };
