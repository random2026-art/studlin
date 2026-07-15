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

function loadStudlinModule() {
  const filePath = path.join(__dirname, "..", "studlin-app.jsx");
  const raw = fs.readFileSync(filePath, "utf8");
  const mountIdx = raw.indexOf("// Mount");
  if (mountIdx === -1) throw new Error("Couldn't find the \"// Mount\" boundary -- has studlin-app.jsx been restructured?");
  const withoutMount = raw.slice(0, mountIdx);

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
    "getRoutineSkips","getRoutineOccurrencesForDate"];
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
