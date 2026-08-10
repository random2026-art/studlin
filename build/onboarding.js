const { useState, useEffect, useRef } = React;
const Ic = {
  google: /* @__PURE__ */ React.createElement("svg", { width: "18", height: "18", viewBox: "0 0 18 18" }, /* @__PURE__ */ React.createElement("path", { fill: "#4285F4", d: "M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84c-.21 1.13-.84 2.08-1.79 2.72v2.26h2.9c1.7-1.56 2.69-3.87 2.69-6.62z" }), /* @__PURE__ */ React.createElement("path", { fill: "#34A853", d: "M9 18c2.43 0 4.47-.8 5.95-2.18l-2.9-2.26c-.8.54-1.83.86-3.05.86-2.35 0-4.34-1.59-5.05-3.72H.96v2.33A8.997 8.997 0 0 0 9 18z" }), /* @__PURE__ */ React.createElement("path", { fill: "#FBBC05", d: "M3.95 10.7c-.18-.54-.28-1.12-.28-1.7s.1-1.16.28-1.7V4.97H.96A8.996 8.996 0 0 0 0 9c0 1.45.35 2.82.96 4.03L3.95 10.7z" }), /* @__PURE__ */ React.createElement("path", { fill: "#EA4335", d: "M9 3.58c1.32 0 2.51.45 3.44 1.35l2.58-2.58C13.46.89 11.43 0 9 0 5.48 0 2.44 2.02.96 4.97L3.95 7.3C4.66 5.17 6.65 3.58 9 3.58z" })),
  apple: /* @__PURE__ */ React.createElement("svg", { width: "18", height: "18", viewBox: "0 0 18 18", fill: "currentColor" }, /* @__PURE__ */ React.createElement("path", { d: "M14.7 9.6c0-2.4 2-3.6 2.1-3.6-1.1-1.7-2.9-1.9-3.5-1.9-1.5-.2-2.9.9-3.7.9-.8 0-1.9-.9-3.2-.8-1.6 0-3.2 1-4 2.5-1.7 3-.4 7.4 1.2 9.8.8 1.2 1.8 2.5 3 2.4 1.2 0 1.7-.8 3.1-.8s1.9.8 3.2.7c1.3 0 2.2-1.2 3-2.4.9-1.4 1.3-2.7 1.4-2.8-.1 0-2.7-1-2.6-4zm-2.3-7.3c.6-.8 1.1-1.9 1-3-1 0-2.2.7-2.9 1.5-.6.7-1.2 1.8-1 2.8 1.1.1 2.2-.5 2.9-1.3z" })),
  microsoft: /* @__PURE__ */ React.createElement("svg", { width: "18", height: "18", viewBox: "0 0 18 18" }, /* @__PURE__ */ React.createElement("rect", { x: "1", y: "1", width: "7.5", height: "7.5", fill: "#F25022" }), /* @__PURE__ */ React.createElement("rect", { x: "9.5", y: "1", width: "7.5", height: "7.5", fill: "#7FBA00" }), /* @__PURE__ */ React.createElement("rect", { x: "1", y: "9.5", width: "7.5", height: "7.5", fill: "#00A4EF" }), /* @__PURE__ */ React.createElement("rect", { x: "9.5", y: "9.5", width: "7.5", height: "7.5", fill: "#FFB900" })),
  mail: /* @__PURE__ */ React.createElement("svg", { width: "18", height: "18", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" }, /* @__PURE__ */ React.createElement("path", { d: "M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" }), /* @__PURE__ */ React.createElement("polyline", { points: "22,6 12,13 2,6" })),
  eye: /* @__PURE__ */ React.createElement("svg", { width: "18", height: "18", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" }, /* @__PURE__ */ React.createElement("path", { d: "M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" }), /* @__PURE__ */ React.createElement("circle", { cx: "12", cy: "12", r: "3" })),
  eyeOff: /* @__PURE__ */ React.createElement("svg", { width: "18", height: "18", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" }, /* @__PURE__ */ React.createElement("path", { d: "M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" }), /* @__PURE__ */ React.createElement("line", { x1: "1", y1: "1", x2: "23", y2: "23" })),
  chev: /* @__PURE__ */ React.createElement("svg", { width: "14", height: "14", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2.5", strokeLinecap: "round", strokeLinejoin: "round" }, /* @__PURE__ */ React.createElement("polyline", { points: "6 9 12 15 18 9" })),
  check: /* @__PURE__ */ React.createElement("svg", { width: "11", height: "11", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "3.5", strokeLinecap: "round", strokeLinejoin: "round" }, /* @__PURE__ */ React.createElement("polyline", { points: "20 6 9 17 4 12" })),
  arrow: /* @__PURE__ */ React.createElement("svg", { width: "16", height: "16", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2.5", strokeLinecap: "round", strokeLinejoin: "round" }, /* @__PURE__ */ React.createElement("line", { x1: "5", y1: "12", x2: "19", y2: "12" }), /* @__PURE__ */ React.createElement("polyline", { points: "12 5 19 12 12 19" })),
  userPlus: /* @__PURE__ */ React.createElement("svg", { width: "22", height: "22", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" }, /* @__PURE__ */ React.createElement("path", { d: "M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" }), /* @__PURE__ */ React.createElement("circle", { cx: "8.5", cy: "7", r: "4" }), /* @__PURE__ */ React.createElement("line", { x1: "20", y1: "8", x2: "20", y2: "14" }), /* @__PURE__ */ React.createElement("line", { x1: "23", y1: "11", x2: "17", y2: "11" })),
  flame: /* @__PURE__ */ React.createElement("svg", { width: "22", height: "22", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" }, /* @__PURE__ */ React.createElement("path", { d: "M12 2s4 5 4 9a4 4 0 0 1-8 0c0-2 1-3 1-3s-3 2-3 6a6 6 0 0 0 12 0c0-5-6-12-6-12z" })),
  spark: /* @__PURE__ */ React.createElement("svg", { width: "22", height: "22", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" }, /* @__PURE__ */ React.createElement("path", { d: "M12 2l2.4 6.5L21 11l-6.6 2.5L12 20l-2.4-6.5L3 11l6.6-2.5z" })),
  zap: /* @__PURE__ */ React.createElement("svg", { width: "22", height: "22", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" }, /* @__PURE__ */ React.createElement("polygon", { points: "13 2 3 14 12 14 11 22 21 10 12 10 13 2" })),
  cap: /* @__PURE__ */ React.createElement("svg", { width: "20", height: "20", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" }, /* @__PURE__ */ React.createElement("path", { d: "M22 10v6M2 10l10-5 10 5-10 5z" }), /* @__PURE__ */ React.createElement("path", { d: "M6 12v5c3 3 9 3 12 0v-5" })),
  uni: /* @__PURE__ */ React.createElement("svg", { width: "20", height: "20", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" }, /* @__PURE__ */ React.createElement("path", { d: "M3 21h18" }), /* @__PURE__ */ React.createElement("path", { d: "M5 21V8l7-5 7 5v13" }), /* @__PURE__ */ React.createElement("path", { d: "M9 21V12h6v9" })),
  teacher: /* @__PURE__ */ React.createElement("svg", { width: "20", height: "20", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" }, /* @__PURE__ */ React.createElement("circle", { cx: "12", cy: "8", r: "4" }), /* @__PURE__ */ React.createElement("path", { d: "M4 21v-1a6 6 0 0 1 6-6h4a6 6 0 0 1 6 6v1" })),
  brief: /* @__PURE__ */ React.createElement("svg", { width: "20", height: "20", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" }, /* @__PURE__ */ React.createElement("rect", { x: "2", y: "7", width: "20", height: "14", rx: "2" }), /* @__PURE__ */ React.createElement("path", { d: "M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" })),
  learn: /* @__PURE__ */ React.createElement("svg", { width: "20", height: "20", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" }, /* @__PURE__ */ React.createElement("path", { d: "M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" }), /* @__PURE__ */ React.createElement("path", { d: "M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" })),
  pen: /* @__PURE__ */ React.createElement("svg", { width: "20", height: "20", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" }, /* @__PURE__ */ React.createElement("path", { d: "M12 20h9" }), /* @__PURE__ */ React.createElement("path", { d: "M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4z" })),
  cards: /* @__PURE__ */ React.createElement("svg", { width: "20", height: "20", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" }, /* @__PURE__ */ React.createElement("rect", { x: "3", y: "4", width: "14", height: "14", rx: "2" }), /* @__PURE__ */ React.createElement("path", { d: "M7 4V2a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2h-2" })),
  clock: /* @__PURE__ */ React.createElement("svg", { width: "20", height: "20", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" }, /* @__PURE__ */ React.createElement("circle", { cx: "12", cy: "12", r: "10" }), /* @__PURE__ */ React.createElement("polyline", { points: "12 6 12 12 16 14" })),
  cal: /* @__PURE__ */ React.createElement("svg", { width: "20", height: "20", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" }, /* @__PURE__ */ React.createElement("rect", { x: "3", y: "4", width: "18", height: "18", rx: "2" }), /* @__PURE__ */ React.createElement("line", { x1: "16", y1: "2", x2: "16", y2: "6" }), /* @__PURE__ */ React.createElement("line", { x1: "8", y1: "2", x2: "8", y2: "6" }), /* @__PURE__ */ React.createElement("line", { x1: "3", y1: "10", x2: "21", y2: "10" })),
  notes: /* @__PURE__ */ React.createElement("svg", { width: "20", height: "20", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" }, /* @__PURE__ */ React.createElement("path", { d: "M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" }), /* @__PURE__ */ React.createElement("polyline", { points: "14 2 14 8 20 8" })),
  star: /* @__PURE__ */ React.createElement("svg", { width: "20", height: "20", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" }, /* @__PURE__ */ React.createElement("polygon", { points: "12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26" }))
};
const isPasswordAccount = (u) => !!(u && u.providerData && u.providerData.some((p) => p.providerId === "password"));
const DISPOSABLE_EMAIL_DOMAINS = /* @__PURE__ */ new Set([
  "mailinator.com",
  "10minutemail.com",
  "10minutemail.net",
  "guerrillamail.com",
  "guerrillamail.info",
  "guerrillamail.biz",
  "guerrillamail.de",
  "tempmail.com",
  "temp-mail.org",
  "yopmail.com",
  "yopmail.fr",
  "throwawaymail.com",
  "trashmail.com",
  "getnada.com",
  "sharklasers.com",
  "dispostable.com",
  "fakeinbox.com",
  "maildrop.cc",
  "mintemail.com",
  "mohmal.com",
  "tempmailo.com",
  "emailondeck.com",
  "moakt.com",
  "mailnesia.com",
  "33mail.com",
  "spamgourmet.com",
  "tempinbox.com",
  "discard.email"
]);
const isDisposableEmail = (email) => {
  const domain = (email.split("@")[1] || "").toLowerCase().trim();
  return DISPOSABLE_EMAIL_DOMAINS.has(domain);
};
const isValidNameShape = (name) => {
  const t = (name || "").trim();
  if (t.length < 2 || t.length > 40) return false;
  if (!/^[A-Za-zÀ-ɏḀ-ỿ' -]+$/.test(t)) return false;
  if (/([A-Za-z])\1{3,}/.test(t)) return false;
  return true;
};
const looksLikeGibberishName = (name) => {
  const t = (name || "").trim();
  return /[bcdfghjklmnpqrstvwxyzBCDFGHJKLMNPQRSTVWXYZ]{4,}/.test(t);
};
async function isPasswordPwned(password) {
  try {
    const enc = new TextEncoder().encode(password);
    const digest = await crypto.subtle.digest("SHA-1", enc);
    const hashHex = Array.from(new Uint8Array(digest)).map((b) => b.toString(16).padStart(2, "0")).join("").toUpperCase();
    const prefix = hashHex.slice(0, 5);
    const suffix = hashHex.slice(5);
    const res = await fetch(`https://api.pwnedpasswords.com/range/${prefix}`);
    if (!res.ok) return false;
    const text = await res.text();
    return text.split("\n").some((line) => line.split(":")[0].trim() === suffix);
  } catch (e) {
    return false;
  }
}
const ERR_MAP = {
  "auth/email-already-in-use": "An account with this email already exists. Try signing in.",
  "auth/invalid-email": "Please enter a valid email address.",
  "auth/weak-password": "Password must be at least 6 characters.",
  "auth/network-request-failed": "Network error. Check your connection.",
  "auth/popup-blocked": "Pop-up was blocked. Please allow pop-ups.",
  "auth/account-exists-with-different-credential": "An account exists with this email using a different method."
};
function TextField({ label, value, onChange, type = "text", hint, error, warning, autoFocus, autoComplete }) {
  const [focused, setFocused] = useState(false);
  const [show, setShow] = useState(false);
  const isPw = type === "password";
  const inputType = isPw && show ? "text" : type;
  const hasValue = !!(value && String(value).length);
  return /* @__PURE__ */ React.createElement("div", { className: "field" }, /* @__PURE__ */ React.createElement("div", { className: "input-wrap" + (hasValue ? " has-value" : "") + (focused ? " is-focused" : "") + (error ? " has-error" : "") }, /* @__PURE__ */ React.createElement("label", null, label), /* @__PURE__ */ React.createElement("input", { type: inputType, value: value || "", onChange: (e) => onChange(e.target.value), onFocus: () => setFocused(true), onBlur: () => setFocused(false), autoFocus, autoComplete: autoComplete || "off" }), isPw && /* @__PURE__ */ React.createElement("button", { type: "button", className: "pwd-toggle", onClick: () => setShow((s) => !s) }, show ? Ic.eyeOff : Ic.eye)), error && /* @__PURE__ */ React.createElement("div", { className: "field-error" }, error), !error && warning && /* @__PURE__ */ React.createElement("div", { className: "field-hint", style: { color: "#B8860B" } }, warning), !error && !warning && hint && /* @__PURE__ */ React.createElement("div", { className: "field-hint" }, hint));
}
function SelectField({ label, value, onChange, options, hint }) {
  const [focused, setFocused] = useState(false);
  const hasValue = !!value;
  return /* @__PURE__ */ React.createElement("div", { className: "field" }, /* @__PURE__ */ React.createElement("div", { className: "input-wrap" + (hasValue ? " has-value" : "") + (focused ? " is-focused" : "") }, /* @__PURE__ */ React.createElement("label", null, label), /* @__PURE__ */ React.createElement("select", { value: value || "", onChange: (e) => onChange(e.target.value), onFocus: () => setFocused(true), onBlur: () => setFocused(false) }, /* @__PURE__ */ React.createElement("option", { value: "", disabled: true, hidden: true }), options.map((o) => /* @__PURE__ */ React.createElement("option", { key: typeof o === "string" ? o : o.value, value: typeof o === "string" ? o : o.value }, typeof o === "string" ? o : o.label))), /* @__PURE__ */ React.createElement("span", { className: "chev" }, Ic.chev)), hint && /* @__PURE__ */ React.createElement("div", { className: "field-hint" }, hint));
}
const STEPS = [
  { name: "Sign up" },
  { name: "Verify" },
  { name: "Profile" }
];
function LeftRail({ step, state }) {
  if (step === 0) {
    return /* @__PURE__ */ React.createElement("aside", { className: "rail" }, /* @__PURE__ */ React.createElement("div", { className: "brand" }, /* @__PURE__ */ React.createElement("div", { style: { width: 34, height: 34, borderRadius: 8, background: "#9EC83D", display: "grid", placeItems: "center", fontSize: 17, fontWeight: 800, color: "#14342A" } }, "S"), /* @__PURE__ */ React.createElement("span", { className: "name" }, "studlin")), /* @__PURE__ */ React.createElement("div", { className: "rail-icon" }, Ic.userPlus), /* @__PURE__ */ React.createElement("h1", null, "Sign up and lock in."), /* @__PURE__ */ React.createElement("p", { className: "lead" }, "Sign up is simple, free and fast. One workspace for everything you study, write, and remember."), /* @__PURE__ */ React.createElement("div", { className: "rail-tiles" }, /* @__PURE__ */ React.createElement("div", { className: "rail-tile" }, /* @__PURE__ */ React.createElement("div", { className: "ic" }, Ic.spark), /* @__PURE__ */ React.createElement("div", { className: "t" }, "AI tutor on every subject"), /* @__PURE__ */ React.createElement("div", { className: "s" }, "Drop a PDF \xB7 ask anything")), /* @__PURE__ */ React.createElement("div", { className: "rail-tile" }, /* @__PURE__ */ React.createElement("div", { className: "ic" }, Ic.flame), /* @__PURE__ */ React.createElement("div", { className: "t" }, "Streaks that keep you going"), /* @__PURE__ */ React.createElement("div", { className: "s" }, "Daily momentum, milestones, and Weekly Wrapped")), /* @__PURE__ */ React.createElement("div", { className: "rail-tile" }, /* @__PURE__ */ React.createElement("div", { className: "ic" }, Ic.zap), /* @__PURE__ */ React.createElement("div", { className: "t" }, "All your tools, one price"), /* @__PURE__ */ React.createElement("div", { className: "s" }, "Study groups, flashcards, calendar and more"))));
  }
  const groups = [{ name: "Sign up", from: 0, to: 0 }, { name: "Verify", from: 1, to: 1 }, { name: "Profile", from: 2, to: 2 }];
  return /* @__PURE__ */ React.createElement("aside", { className: "rail" }, /* @__PURE__ */ React.createElement("div", { className: "brand" }, /* @__PURE__ */ React.createElement("div", { style: { width: 34, height: 34, borderRadius: 8, background: "#9EC83D", display: "grid", placeItems: "center", fontSize: 17, fontWeight: 800, color: "#14342A" } }, "S"), /* @__PURE__ */ React.createElement("span", { className: "name" }, "studlin")), /* @__PURE__ */ React.createElement("div", { className: "rail-icon" }, Ic.userPlus), /* @__PURE__ */ React.createElement("h1", { style: { fontSize: 28 } }, "Create your account in a few clicks."), /* @__PURE__ */ React.createElement("div", { className: "stepper", style: { marginTop: 36 } }, groups.map((g, i) => {
    const done = step > g.to, current = step >= g.from && step <= g.to;
    return /* @__PURE__ */ React.createElement("div", { key: i, className: "step" + (done ? " is-done" : "") + (current ? " is-current" : "") }, /* @__PURE__ */ React.createElement("span", { className: "dot" }, done ? Ic.check : i + 1), /* @__PURE__ */ React.createElement("span", { className: "name" }, g.name));
  })), /* @__PURE__ */ React.createElement("div", { className: "rail-meta" }, /* @__PURE__ */ React.createElement("div", { className: "row", style: { color: "rgba(246,241,230,0.85)" } }, firebase.auth().currentUser?.email || state.email || "you@studlin.app")));
}
function StepSignup({ state, set, advance }) {
  const [mode, setMode] = useState("providers");
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [authError, setAuthError] = useState("");
  const checkIdentityFields = () => {
    const errs = {};
    if (!state.terms) errs.terms = "You need to accept the Terms of Service and Privacy Policy to continue.";
    return errs;
  };
  const googleSign = () => {
    const idErrs = checkIdentityFields();
    if (Object.keys(idErrs).length > 0) {
      setErrors(idErrs);
      const stageEl = document.querySelector(".stage");
      if (stageEl) stageEl.scrollTo({ top: stageEl.scrollHeight, behavior: "smooth" });
      else window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" });
      return;
    }
    setErrors({});
    setAuthError("");
    setLoading(true);
    if (window.__isInAppBrowser && window.__isInAppBrowser()) {
      setAuthError(`Google sign-in isn't available in this app's built-in browser. Tap the \u22EF or \u22EE menu and choose "Open in Browser" to continue.`);
      setLoading(false);
      return;
    }
    if (typeof google === "undefined" || !google.accounts) {
      setAuthError("Google sign-in is still loading. Please try again.");
      setLoading(false);
      return;
    }
    const client = google.accounts.oauth2.initTokenClient({
      client_id: "16831354472-rp345qhnnqcthvsq2m528e6o8n4vhfp2.apps.googleusercontent.com",
      scope: "email profile",
      callback: async (tokenResponse) => {
        if (tokenResponse.error) {
          setAuthError("Google sign-in was cancelled.");
          setLoading(false);
          return;
        }
        try {
          const credential = firebase.auth.GoogleAuthProvider.credential(null, tokenResponse.access_token);
          const result = await firebase.auth().signInWithCredential(credential);
          const u = result.user;
          set((s) => ({ ...s, provider: "google", name: u.displayName || s.name, email: u.email || s.email }));
          if (window.posthog) {
            posthog.identify(u.uid, { email: u.email, provider: "google" });
            posthog.capture("signup_completed", { method: "google" });
          }
          advance(true);
        } catch (err) {
          setAuthError(ERR_MAP[err.code] || (err.message || "Sign-up failed."));
          setLoading(false);
        }
      },
      error_callback: () => {
        setAuthError("Google sign-in was cancelled.");
        setLoading(false);
      }
    });
    client.requestAccessToken();
  };
  const pwOk = { len: (state.password || "").length >= 8 };
  const allOk = pwOk.len;
  const tryAdvance = async () => {
    const errs = checkIdentityFields();
    if (!state.email?.trim()) errs.email = "Please enter your email address";
    else if (!/\S+@\S+\.\S+/.test(state.email)) errs.email = "Please enter a valid email address";
    else if (isDisposableEmail(state.email)) errs.email = "Please use a permanent email address, not a temporary one";
    if (!allOk) errs.password = "Password must be at least 8 characters";
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;
    setAuthError("");
    setLoading(true);
    if (await isPasswordPwned(state.password)) {
      setErrors((e) => ({ ...e, password: "This password has appeared in a data breach. Please choose a different one." }));
      setLoading(false);
      return;
    }
    try {
      const cred = await firebase.auth().createUserWithEmailAndPassword(state.email, state.password);
      if (window.posthog) {
        posthog.identify(cred.user.uid, { email: state.email, provider: "email" });
        posthog.capture("signup_completed", { method: "email" });
      }
      try {
        const token = await cred.user.getIdToken();
        await fetch("/api/send-verification", { method: "POST", headers: { Authorization: "Bearer " + token } });
      } catch (e) {
      }
      advance(true);
    } catch (err) {
      setAuthError(ERR_MAP[err.code] || "Something went wrong. Please try again.");
    }
    setLoading(false);
  };
  return /* @__PURE__ */ React.createElement("div", { className: "frame" }, /* @__PURE__ */ React.createElement("div", { className: "frame-head" }, /* @__PURE__ */ React.createElement("h2", null, "Welcome to ", /* @__PURE__ */ React.createElement("em", null, "Studlin")), /* @__PURE__ */ React.createElement("p", null, "Better grades start here. Create your account in a few clicks.")), authError && /* @__PURE__ */ React.createElement("div", { style: { fontSize: 13, color: "#C4544A", marginBottom: 16, padding: "12px 14px", background: "#FCF1EF", borderRadius: 10, border: "1px solid #F5D4D0", textAlign: "center" } }, authError), mode === "providers" && /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("div", { className: "providers" }, /* @__PURE__ */ React.createElement("button", { className: "provider", onClick: googleSign, disabled: loading }, Ic.google, " Continue with Google")), /* @__PURE__ */ React.createElement("div", { className: "divider" }, "or sign up with email"), /* @__PURE__ */ React.createElement("button", { className: "provider", onClick: () => setMode("email") }, Ic.mail, " Use email instead"), /* @__PURE__ */ React.createElement("div", { className: "signup-trust" }, /* @__PURE__ */ React.createElement("div", { className: "trust-row" }, /* @__PURE__ */ React.createElement("span", { className: "tchip" }, Ic.check, " Free forever plan"), /* @__PURE__ */ React.createElement("span", { className: "tchip" }, Ic.check, " No card required"), /* @__PURE__ */ React.createElement("span", { className: "tchip" }, Ic.check, " 60-second setup")), /* @__PURE__ */ React.createElement("div", { className: "trust-foot" }, "Made for Students by Students"))), mode === "email" && /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement(TextField, { label: "Email address", value: state.email, onChange: (v) => set({ ...state, email: v }), hint: errors.email ? null : "Any email works: school, Gmail, whatever.", error: errors.email, type: "email", autoComplete: "email", autoFocus: true }), /* @__PURE__ */ React.createElement(TextField, { label: "Create password", value: state.password, onChange: (v) => set({ ...state, password: v }), type: "password", autoComplete: "new-password", error: errors.password, hint: errors.password ? null : "At least 8 characters." }), /* @__PURE__ */ React.createElement("div", { style: { marginTop: 18 } }, /* @__PURE__ */ React.createElement("button", { className: "provider", onClick: () => setMode("providers"), style: { padding: "10px 14px", fontSize: 13 } }, "\u2190 Use Google instead")), /* @__PURE__ */ React.createElement("button", { "data-cta": "signup", onClick: tryAdvance, style: { display: "none" } })), /* @__PURE__ */ React.createElement("label", { className: "checkbox" + (state.terms ? " is-checked" : ""), onClick: () => set({ ...state, terms: !state.terms }), style: { marginTop: 22 } }, /* @__PURE__ */ React.createElement("span", { className: "box" }, Ic.check), /* @__PURE__ */ React.createElement("span", null, "I accept the ", /* @__PURE__ */ React.createElement("a", { href: "/terms", target: "_blank", rel: "noopener noreferrer", onClick: (e) => e.stopPropagation() }, "Terms of Service"), " and ", /* @__PURE__ */ React.createElement("a", { href: "/privacy", target: "_blank", rel: "noopener noreferrer", onClick: (e) => e.stopPropagation() }, "Privacy Policy"), ".")), errors.terms && /* @__PURE__ */ React.createElement("div", { className: "field-error", style: { marginTop: 8 } }, errors.terms));
}
function OtpBoxes({ value, onChange, disabled, autoFocus }) {
  const refs = useRef([]);
  const setDigit = (i, d) => {
    const digits = value.split("");
    digits[i] = d;
    onChange(digits.join("").slice(0, 6));
  };
  const onKeyDown = (i, e) => {
    if (e.key === "Backspace" && !value[i] && i > 0) refs.current[i - 1]?.focus();
  };
  const onInput = (i, e) => {
    const raw = e.target.value.replace(/\D/g, "");
    if (!raw) {
      setDigit(i, "");
      return;
    }
    setDigit(i, raw[raw.length - 1]);
    if (i < 5) refs.current[i + 1]?.focus();
  };
  const onPaste = (e) => {
    const raw = (e.clipboardData.getData("text") || "").replace(/\D/g, "").slice(0, 6);
    if (!raw) return;
    e.preventDefault();
    onChange(raw.padEnd(value.length, "").slice(0, 6));
    refs.current[Math.min(raw.length, 5)]?.focus();
  };
  return /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 8, justifyContent: "center", marginBottom: 6 }, onPaste }, [0, 1, 2, 3, 4, 5].map((i) => /* @__PURE__ */ React.createElement(
    "input",
    {
      key: i,
      ref: (el) => refs.current[i] = el,
      value: value[i] || "",
      onChange: (e) => onInput(i, e),
      onKeyDown: (e) => onKeyDown(i, e),
      disabled,
      autoFocus: autoFocus && i === 0,
      inputMode: "numeric",
      maxLength: 1,
      style: { width: 42, height: 52, textAlign: "center", fontSize: 22, fontWeight: 700, borderRadius: 10, border: "1.5px solid var(--line-strong)", background: "white", color: "#14342A", outline: "none" },
      onFocus: (e) => e.target.style.borderColor = "#9EC83D",
      onBlur: (e) => e.target.style.borderColor = "var(--line-strong)"
    }
  )));
}
function StepVerify({ advanceToProfile }) {
  const [sendStatus, setSendStatus] = useState("idle");
  const [code, setCode] = useState("");
  const [checking, setChecking] = useState(false);
  const [err, setErr] = useState("");
  const [user, setUser] = useState(() => firebase.auth().currentUser);
  useEffect(() => firebase.auth().onAuthStateChanged(setUser), []);
  const resend = async () => {
    setSendStatus("sending");
    setErr("");
    try {
      const token = await user.getIdToken();
      const res = await fetch("/api/send-verification", { method: "POST", headers: { Authorization: "Bearer " + token } });
      const d = await res.json().catch(() => ({}));
      if (res.ok && d.ok) {
        setSendStatus("sent");
        setTimeout(() => setSendStatus("idle"), 3e4);
      } else {
        setErr(d.error || "Couldn't send the email. Try again shortly.");
        setSendStatus("idle");
      }
    } catch (e) {
      setErr("Couldn't send the email. Try again shortly.");
      setSendStatus("idle");
    }
  };
  const submitCode = async () => {
    if (code.length !== 6 || checking) return;
    setChecking(true);
    setErr("");
    try {
      const token = await user.getIdToken();
      const res = await fetch("/api/send-verification", { method: "POST", headers: { Authorization: "Bearer " + token, "Content-Type": "application/json" }, body: JSON.stringify({ code }) });
      const d = await res.json().catch(() => ({}));
      if (res.ok && d.ok) {
        advanceToProfile();
        return;
      }
      setErr(d.error || "Incorrect code. Try again.");
    } catch (e) {
      setErr("Couldn't verify right now. Try again.");
    }
    setChecking(false);
  };
  return /* @__PURE__ */ React.createElement("div", { className: "frame" }, /* @__PURE__ */ React.createElement("div", { className: "frame-head" }, /* @__PURE__ */ React.createElement("h2", null, "Enter your ", /* @__PURE__ */ React.createElement("em", null, "code")), /* @__PURE__ */ React.createElement("p", null, "We sent a 6-digit code to ", /* @__PURE__ */ React.createElement("strong", null, user && user.email), ".")), /* @__PURE__ */ React.createElement(OtpBoxes, { value: code, onChange: (v) => {
    setCode(v);
    setErr("");
  }, disabled: checking, autoFocus: true }), err && /* @__PURE__ */ React.createElement("div", { style: { fontSize: 13, color: "#C4544A", marginBottom: 16, padding: "12px 14px", background: "#FCF1EF", borderRadius: 10, border: "1px solid #F5D4D0", textAlign: "center" } }, err), /* @__PURE__ */ React.createElement("button", { className: "cta lime", disabled: code.length !== 6 || checking, onClick: submitCode, style: { width: "100%", justifyContent: "center", marginBottom: 12 } }, checking ? "Verifying\u2026" : "Verify email"), /* @__PURE__ */ React.createElement("button", { className: "provider", disabled: sendStatus === "sending" || sendStatus === "sent", onClick: resend }, sendStatus === "sending" ? "Sending\u2026" : sendStatus === "sent" ? "Sent, check your inbox" : "Resend code"));
}
const USERNAME_RE = /^[a-z][a-z0-9_]{2,19}$/;
function StepProfile({ state, set }) {
  useEffect(() => {
    if (!state.firstName && !state.lastName && state.name) {
      const parts = state.name.trim().split(/\s+/);
      set((s) => ({ ...s, firstName: s.firstName || parts[0] || "", lastName: s.lastName || parts.slice(1).join(" ") || "" }));
    }
  }, []);
  const firstNameVal = state.firstName || "";
  const lastNameVal = state.lastName || "";
  const firstNameError = firstNameVal && !isValidNameShape(firstNameVal) ? "Enter a valid first name" : "";
  const lastNameError = lastNameVal && !isValidNameShape(lastNameVal) ? "Enter a valid last name" : "";
  const firstNameWarning = !firstNameError && firstNameVal && looksLikeGibberishName(firstNameVal) ? "This doesn't look like a typical name, go ahead if it's correct" : "";
  const lastNameWarning = !lastNameError && lastNameVal && looksLikeGibberishName(lastNameVal) ? "This doesn't look like a typical name, go ahead if it's correct" : "";
  return /* @__PURE__ */ React.createElement("div", { className: "frame" }, /* @__PURE__ */ React.createElement("div", { className: "frame-head" }, /* @__PURE__ */ React.createElement("h2", null, "Tell us ", /* @__PURE__ */ React.createElement("em", null, "about you")), /* @__PURE__ */ React.createElement("p", null, "Just the basics. Everything else you can set up later.")), /* @__PURE__ */ React.createElement(TextField, { label: "First name", value: state.firstName || "", onChange: (v) => set({ ...state, firstName: v }), autoFocus: true, autoComplete: "given-name", error: firstNameError, warning: firstNameWarning }), /* @__PURE__ */ React.createElement(TextField, { label: "Last name", value: state.lastName || "", onChange: (v) => set({ ...state, lastName: v }), autoComplete: "family-name", error: lastNameError, warning: lastNameWarning }), /* @__PURE__ */ React.createElement(TextField, { label: "Enter your University / School", value: state.school || "", onChange: (v) => set({ ...state, school: v }), hint: "Just the name, no need to search a list." }));
}
const isVerifiedOrGoogle = (u) => !!u && (!isPasswordAccount(u) || u.emailVerified);
function App() {
  const [step, setStep] = useState(() => {
    const u = firebase.auth().currentUser;
    if (u) {
      const s = JSON.parse(localStorage.getItem("studlin-onboarding") || "null");
      if (s && s._step) return s._step;
      return isVerifiedOrGoogle(u) ? 2 : 1;
    }
    return 0;
  });
  const [state, setState] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem("studlin-onboarding") || "null");
      if (saved && typeof saved === "object") return { goals: [], plan: "pro", ...saved };
    } catch (e) {
    }
    return { goals: [], plan: "pro" };
  });
  useEffect(() => {
    return firebase.auth().onAuthStateChanged((u) => {
      if (u) {
        const minStep = isVerifiedOrGoogle(u) ? 2 : 1;
        setStep((prev) => prev < minStep ? minStep : prev);
      }
    });
  }, []);
  useEffect(() => {
    try {
      const { password, ...safe } = state;
      localStorage.setItem("studlin-onboarding", JSON.stringify({ ...safe, _step: step, _updatedAt: (/* @__PURE__ */ new Date()).toISOString() }));
    } catch (e) {
    }
  }, [state, step]);
  const isStepValid = () => {
    if (step === 0) {
      return !!state.terms && (!!firebase.auth().currentUser || !!state.provider || !!(state.email && (state.password || "").length >= 8));
    }
    if (step === 1) return isVerifiedOrGoogle(firebase.auth().currentUser);
    if (step === 2) return isValidNameShape(state.firstName) && isValidNameShape(state.lastName) && !!(state.school || "").trim();
    return true;
  };
  const [transitioning, setTransitioning] = useState(false);
  const [finishing, setFinishing] = useState(false);
  const [finishError, setFinishError] = useState("");
  const back = () => {
    setTransitioning(true);
    setTimeout(() => {
      setStep((s) => Math.max(0, s - 1));
      setTransitioning(false);
    }, 250);
  };
  const slugifyName = (s) => (s || "").toLowerCase().replace(/[^a-z0-9]/g, "");
  const claimUsernameSilently = async (db, uid, firstName, lastName) => {
    const base = (slugifyName(firstName) + slugifyName(lastName)).slice(0, 16) || "student";
    const withLetterStart = /^[a-z]/.test(base) ? base : "s" + base;
    for (let attempt = 0; attempt < 8; attempt++) {
      let candidate = attempt === 0 ? withLetterStart : withLetterStart.slice(0, 16) + Math.floor(1e3 + Math.random() * 9e3);
      candidate = candidate.slice(0, 20);
      if (candidate.length < 3) candidate = candidate.padEnd(3, "0");
      if (!USERNAME_RE.test(candidate)) continue;
      try {
        const unameRef = db.collection("usernames").doc(candidate);
        const profileRef = db.collection("profiles").doc(uid);
        await db.runTransaction(async (tx) => {
          const unameSnap = await tx.get(unameRef);
          if (unameSnap.exists) throw new Error("taken");
          tx.set(unameRef, { uid, createdAt: (/* @__PURE__ */ new Date()).toISOString() });
          tx.set(profileRef, { username: candidate, usernameLower: candidate }, { merge: true });
        });
        return candidate;
      } catch (e) {
      }
    }
    return "";
  };
  const finishOnboarding = async () => {
    if (!isStepValid() || finishing) return;
    setFinishing(true);
    setFinishError("");
    const u = firebase.auth().currentUser;
    const firstName = (state.firstName || "").trim();
    const lastName = (state.lastName || "").trim();
    const fullName = `${firstName} ${lastName}`.trim();
    let uname = "";
    if (u) {
      if (fullName && u.displayName !== fullName) {
        try {
          await u.updateProfile({ displayName: fullName });
        } catch (e) {
        }
      }
      uname = await claimUsernameSilently(firebase.firestore(), u.uid, firstName, lastName);
    }
    try {
      localStorage.setItem("studlin-onboarded", "true");
    } catch (e) {
    }
    try {
      const prevProfile = JSON.parse(localStorage.getItem("studlin-profile") || "null") || {};
      localStorage.setItem("studlin-profile", JSON.stringify({ ...prevProfile, name: fullName || prevProfile.name || "", username: uname, affiliation: (state.school || "").trim(), school: (state.school || "").trim() }));
    } catch (e) {
    }
    try {
      localStorage.removeItem("studlin-onboarding");
    } catch (e) {
    }
    if (u) {
      try {
        await firebase.firestore().collection("users").doc(u.uid).set({
          school: (state.school || "").trim(),
          affiliation: (state.school || "").trim(),
          onboarded: true,
          onboardedAt: (/* @__PURE__ */ new Date()).toISOString(),
          updatedAt: (/* @__PURE__ */ new Date()).toISOString()
        }, { merge: true });
      } catch (e) {
      }
      if (window.posthog) {
        posthog.capture("onboarding_completed", { school: (state.school || "").trim() });
        posthog.setPersonProperties({ school: (state.school || "").trim(), onboarded: true });
      }
    }
    window.location.href = "/app";
  };
  useEffect(() => {
    const fn = (e) => {
      if (e.key === "Enter") {
        if (step < STEPS.length - 1) {
          if (isStepValid()) {
            setTransitioning(true);
            setTimeout(() => {
              setStep((s) => Math.min(STEPS.length - 1, s + 1));
              setTransitioning(false);
            }, 250);
          }
        } else finishOnboarding();
      }
      if (e.key === "Escape" && step > 0) back();
    };
    window.addEventListener("keydown", fn);
    return () => window.removeEventListener("keydown", fn);
  });
  const CTA_LABEL = ["Sign up for free", "I've verified, continue", "Continue"][step];
  return /* @__PURE__ */ React.createElement("div", { className: "shell" }, /* @__PURE__ */ React.createElement(LeftRail, { step, state }), /* @__PURE__ */ React.createElement("main", { className: "stage" }, /* @__PURE__ */ React.createElement("div", { className: "stage-top" }, step > 0 && /* @__PURE__ */ React.createElement("span", { style: { color: "var(--muted)", fontSize: 13 } }, "Step ", step + 1, " of ", STEPS.length)), /* @__PURE__ */ React.createElement("div", { className: "step-content" + (transitioning ? " is-leaving" : " is-entering") }, step === 0 && /* @__PURE__ */ React.createElement(StepSignup, { state, set: setState, advance: (skip) => {
    if (skip || isStepValid()) {
      const dest = isVerifiedOrGoogle(firebase.auth().currentUser) ? 2 : 1;
      setTransitioning(true);
      setTimeout(() => {
        setStep(dest);
        setTransitioning(false);
      }, 250);
    }
  } }), step === 1 && /* @__PURE__ */ React.createElement(StepVerify, { advanceToProfile: () => {
    setTransitioning(true);
    setTimeout(() => {
      setStep(2);
      setTransitioning(false);
    }, 250);
  } }), step === 2 && /* @__PURE__ */ React.createElement(StepProfile, { state, set: setState })), /* @__PURE__ */ React.createElement("div", { className: "stage-foot", style: step === 1 ? { display: "none" } : void 0 }, finishError && /* @__PURE__ */ React.createElement("div", { style: { fontSize: 13, color: "#C4544A", marginBottom: 14, padding: "12px 14px", background: "#FCF1EF", borderRadius: 10, border: "1px solid #F5D4D0", textAlign: "center" } }, finishError), /* @__PURE__ */ React.createElement("button", { className: "cta", disabled: !isStepValid() || finishing, onClick: () => {
    if (step === 0 && !firebase.auth().currentUser) {
      const btn = document.querySelector('[data-cta="signup"]');
      if (btn) {
        btn.click();
        return;
      }
    }
    if (step === STEPS.length - 1) {
      finishOnboarding();
      return;
    }
    setTransitioning(true);
    setTimeout(() => {
      setStep((s) => Math.min(STEPS.length - 1, s + 1));
      setTransitioning(false);
    }, 250);
  } }, finishing ? "Setting up..." : CTA_LABEL, /* @__PURE__ */ React.createElement("span", { className: "arrow" }, Ic.arrow)), step === 0 && /* @__PURE__ */ React.createElement("div", { className: "stage-links" }, /* @__PURE__ */ React.createElement("a", { href: "/privacy", target: "_blank", rel: "noopener noreferrer" }, "Privacy Policy"), " \xB7 ", /* @__PURE__ */ React.createElement("a", { href: "/terms", target: "_blank", rel: "noopener noreferrer" }, "Terms of Service")), step === 0 && /* @__PURE__ */ React.createElement("div", { style: { marginTop: 16, textAlign: "center", fontSize: 13, color: "var(--muted)" } }, "Already have an account? ", /* @__PURE__ */ React.createElement("a", { href: "/signin" }, "Log in")), step > 0 && /* @__PURE__ */ React.createElement("div", { style: { marginTop: 14 } }, /* @__PURE__ */ React.createElement("button", { onClick: back, style: { background: "transparent", border: "none", color: "var(--muted)", fontSize: 13, cursor: "pointer", fontFamily: "inherit" } }, "\u2190 Back")))));
}
ReactDOM.createRoot(document.getElementById("root")).render(/* @__PURE__ */ React.createElement(App, null));
