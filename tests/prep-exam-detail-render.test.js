// Render-smoke test for Studlin Prep's exam detail page (Part B of the Prep
// redesign) -- catches the "View plan" crash where the detail view called
// niceDate(selectedExam.date) with no niceDate ever defined in StudlinPrep's
// scope (a bare ReferenceError on every click, not just the "no study plan
// yet" case). tests/harness.js's loadStudlinModule() can't catch this class
// of bug: its React stub fakes useState as always-undefined, so the detail
// view (gated on real selectedExamId state) never actually renders. This
// harness is a sibling of that one but wires in the real react/react-dom
// (already in node_modules) and actually renders StudlinPrep via
// react-dom/server, so a ReferenceError/TypeError during render surfaces
// exactly the way it does in the browser's error boundary.
const { test, describe } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const path = require("path");
const vm = require("vm");
const esbuild = require("esbuild");
const React = require("react");
const ReactDOMServer = require("react-dom/server");

function loadStudlinModuleForRender() {
  const filePath = path.join(__dirname, "..", "studlin-app.jsx");
  const raw = fs.readFileSync(filePath, "utf8");
  // Same boundary harness.js cuts at -- strips the real ReactDOM.createRoot(...)
  // .render(...) mount call so evaluating the module doesn't try to mount a
  // whole app; everything StudlinPrep itself needs is defined above that line.
  const mountMatch = raw.match(/^\/\/ Mount$/m);
  if (!mountMatch) throw new Error("Couldn't find the \"// Mount\" boundary -- has studlin-app.jsx been restructured?");
  const withoutMount = raw.slice(0, mountMatch.index);
  const { code } = esbuild.transformSync(withoutMount, { loader: "jsx", jsx: "transform", jsxFactory: "React.createElement", jsxFragment: "React.Fragment" });

  // lsGet/lsSet prefix every key with "studlin-" -- seed tests write through
  // this same prefix so StudlinPrep reads back exactly what a test seeded.
  const store = {};
  const localStorage = {
    getItem: (k) => (Object.prototype.hasOwnProperty.call(store, k) ? store[k] : null),
    setItem: (k, v) => { store[k] = String(v); },
    removeItem: (k) => { delete store[k]; },
    clear: () => { for (const k of Object.keys(store)) delete store[k]; },
  };

  const sandbox = {
    console,
    React, // the real thing, not harness.js's fake -- hooks need to actually work
    localStorage,
    document: {
      createElement: () => ({ style: {}, setAttribute() {}, appendChild() {}, addEventListener() {} }),
      addEventListener() {}, removeEventListener() {},
      documentElement: { style: {}, setAttribute() {}, removeAttribute() {}, classList: { add() {}, remove() {}, toggle() {}, contains: () => false } },
      body: { style: {}, setAttribute() {}, removeAttribute() {}, classList: { add() {}, remove() {}, toggle() {}, contains: () => false }, appendChild() {}, addEventListener() {} },
      getElementById: () => null,
      querySelector: () => null,
      querySelectorAll: () => [],
    },
    navigator: { userAgent: "node", language: "en-US", onLine: true, serviceWorker: undefined, clipboard: { writeText: () => Promise.resolve() } },
    location: { hostname: "test", href: "http://test/", pathname: "/", search: "", origin: "http://test" },
    history: { replaceState() {}, pushState() {} },
    URL, URLSearchParams,
    fetch: () => Promise.reject(new Error("fetch disabled in render test")),
    Notification: undefined,
    firebase: undefined,
    Sentry: undefined,
    DOMPurify: undefined,
    Stripe: undefined,
    posthog: undefined,
    mammoth: undefined,
    setTimeout, clearTimeout, setInterval, clearInterval,
    requestAnimationFrame: (fn) => setTimeout(fn, 0),
    Date, Math, JSON, Array, Object, String, Number, Boolean, RegExp, Map, Set, Promise, Error,
    addEventListener() {}, removeEventListener() {}, dispatchEvent() {},
  };
  sandbox.window = sandbox;
  sandbox.globalThis = sandbox;
  sandbox.self = sandbox;

  vm.createContext(sandbox);
  vm.runInContext(code, sandbox, { filename: "studlin-app.jsx (render test)" });
  return { sandbox, localStorage };
}

function seedExam(localStorage, examId, { withSession } = {}) {
  const examEvent = {
    id: examId, kind: "exam", title: "Organic Chemistry Midterm",
    subject: "Chemistry", date: "2099-01-15", examWeight: "major", difficulty: 500,
  };
  const events = [examEvent];
  if (withSession) {
    events.push({
      id: examId + "-session-1", dueEventId: examId, title: "Study: Organic Chemistry Midterm",
      date: "2099-01-10", time: "16:00", subject: "Chemistry", kind: "study block",
      duration: 25, status: "pending", timeSpent: 0, completedAt: null,
    });
  }
  localStorage.setItem("studlin-events", JSON.stringify(events));
  localStorage.setItem("studlin-decks", JSON.stringify([]));
  localStorage.setItem("studlin-practiceExams", JSON.stringify([]));
  // One-shot deep-link flag StudlinPrep's selectedExamId lazy initializer
  // reads on mount -- the same effective state "View plan" puts the page
  // into (setSelectedExamId(ex.id)), just reached via the deep-link path
  // instead of a click handler SSR can't invoke directly.
  localStorage.setItem("studlin-openPrepExamId", JSON.stringify(examId));
}

describe("Studlin Prep exam detail render", () => {
  test("renders the exam detail page for an exam with NO study plan yet, without throwing", () => {
    const { sandbox, localStorage } = loadStudlinModuleForRender();
    seedExam(localStorage, "exam-no-plan");
    const el = React.createElement(sandbox.StudlinPrep, {});
    const html = ReactDOMServer.renderToStaticMarkup(el);
    assert.match(html, /No study plan yet\./);
  });

  test("renders the exam detail page for an exam WITH a linked session, without throwing", () => {
    const { sandbox, localStorage } = loadStudlinModuleForRender();
    seedExam(localStorage, "exam-with-plan", { withSession: true });
    const el = React.createElement(sandbox.StudlinPrep, {});
    const html = ReactDOMServer.renderToStaticMarkup(el);
    assert.match(html, /Organic Chemistry Midterm/);
    assert.doesNotMatch(html, /No study plan yet\./);
  });
});
