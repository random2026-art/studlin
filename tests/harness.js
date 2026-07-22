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
  var exportNames = ["dayKey","lsGet","lsSet","findOpenSlotFor","findReliableSlotFor",
    "findLegalSlotOrNull","rebalanceDay","isTier0Missed","computePausePlan",
    "computeReviewOffsets","computeReviewDates","weekPrepLoad",
    "evaluateExamPrepAdjustment","buildExamSessionEvents","scoreTask",
    "normalizeTaskVal","PAUSE_QUALIFYING_KINDS","TIER0_FIXED_KINDS",
    "planBrainDumpTasks","matchEventByTitle","getWeeklyRoutine","saveWeeklyRoutine",
    "getRoutineSkips","getRoutineOccurrencesForDate","findHabitSlotForToday",
    "materializeHabitsForDate","findTier0Slot","findSlotWithEviction",
    "examAlreadyPassedToday","getSchoolTerm","saveSchoolTerm",
    "getTimerCheckpoint","checkpointTimerSession","clearTimerCheckpoint",
    "resolveOrphanedCheckpoint","mergeImportedEvents","detectCalendarSourceType",
    "getDayOccupiedIntervals","checkManualStudyTime","dayHasRoomFor","undoTier0Move",
    "getWorkWindowMinsFor","detectPeakHourInsight","dismissPeakHourInsight",
    "logCompletionOutcome","getBucketReliability","setSchedulePreferences",
    "applyCheckInRating","computeExamReadiness","canGenQuiz","recordQuizGen",
    "getQuizGenUsage","QUIZ_GEN_LIMIT","setPlanLS","shouldShowWeekBalanceNudge",
    "dismissWeekBalanceNudge","computeBusyWindowsPayload","BUSY_WINDOW_DAYS_AHEAD",
    "layoutDayEvents","computeEventBlockHeightPx","isTimerEligible",
    "logSuggestionDecision","examPrepIntervalPosition","fmtMovedReasonSuffix",
    "fmtPlacementReason","TIER0_EXAM_PREP_TOLERANCE_DAYS","computeAttackBlockStartDate",
    "ATTACK_BLOCK_GATE_PADDING","ATTACK_BLOCK_FINISH_BUFFER_DAYS","ATTACK_BLOCK_SUSTAINABLE_WEEKLY_MINS",
    "computeAttackBlockRampOffsets","ATTACK_BLOCK_RAMP_EXPONENT","detectAttackBlockOverruns",
    "getAttackOverrunDismissals","isAttackOverrunDismissedToday","dismissAttackOverrunToday",
    "computeWeekBalancePlan","scheduleAttackBlockFollowUp","logSession","getTotalMinutesFocused",
    "startAttackBlockChain","isPhaseDecompositionCandidate","PHASE_DECOMPOSITION_MIN_WEEKS",
    "startPhaseAwareAttackChain","commitSyllabusEvents","advanceProjectPhase",
    "computeDayViewScale","DAY_VIEW_MIN_PX_HR","DAY_VIEW_MAX_PX_HR",
    "buildSpacedSessionPreviews","createPracticeExam","recordPracticeExamAttempt","wrongTopicsFor",
    "reoptimizeAttackChain","upcomingExams","linkDeckToExamStorage",
    "computeOutlineRemainingMins","ATTACK_BLOCK_SKIP_ASSUMED_PCT",
    "findLaterTodaySlot","findNotTodaySlot",
    "advancedSchedulePlanner","todaysPlan","chunkTasksWithBreaks",
    "isReorderableTask","calculateTaskPriority","detectConflicts",
    "isLeadInFixed","commitSyllabusEvents","buildSyllabusEventBatch",
    "buildPendingSchedulePreview","proposeProjectPhases","proposeOutline",
    "isPhaseDecompositionCandidate"];
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
    firebase: undefined,
    location: { hostname: "test", search: "", href: "http://test/" },
    module: { exports: {} },
    exports: {},
    require,
  };
  sandbox.global = sandbox;
  vm.createContext(sandbox);
  vm.runInContext(code + epilogue, sandbox, { filename: "studlin-app.jsx (transformed)" });
  return sandbox;
}

module.exports = { loadStudlinModule };
