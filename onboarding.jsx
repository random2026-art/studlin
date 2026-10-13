const { useState, useEffect, useRef } = React;

// ─── ICONS ──────────────────────────────────────────────────────────────────
const Ic = {
  google: <svg width="18" height="18" viewBox="0 0 18 18"><path fill="#4285F4" d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84c-.21 1.13-.84 2.08-1.79 2.72v2.26h2.9c1.7-1.56 2.69-3.87 2.69-6.62z"/><path fill="#34A853" d="M9 18c2.43 0 4.47-.8 5.95-2.18l-2.9-2.26c-.8.54-1.83.86-3.05.86-2.35 0-4.34-1.59-5.05-3.72H.96v2.33A8.997 8.997 0 0 0 9 18z"/><path fill="#FBBC05" d="M3.95 10.7c-.18-.54-.28-1.12-.28-1.7s.1-1.16.28-1.7V4.97H.96A8.996 8.996 0 0 0 0 9c0 1.45.35 2.82.96 4.03L3.95 10.7z"/><path fill="#EA4335" d="M9 3.58c1.32 0 2.51.45 3.44 1.35l2.58-2.58C13.46.89 11.43 0 9 0 5.48 0 2.44 2.02.96 4.97L3.95 7.3C4.66 5.17 6.65 3.58 9 3.58z"/></svg>,
  apple: <svg width="18" height="18" viewBox="0 0 18 18" fill="currentColor"><path d="M14.7 9.6c0-2.4 2-3.6 2.1-3.6-1.1-1.7-2.9-1.9-3.5-1.9-1.5-.2-2.9.9-3.7.9-.8 0-1.9-.9-3.2-.8-1.6 0-3.2 1-4 2.5-1.7 3-.4 7.4 1.2 9.8.8 1.2 1.8 2.5 3 2.4 1.2 0 1.7-.8 3.1-.8s1.9.8 3.2.7c1.3 0 2.2-1.2 3-2.4.9-1.4 1.3-2.7 1.4-2.8-.1 0-2.7-1-2.6-4zm-2.3-7.3c.6-.8 1.1-1.9 1-3-1 0-2.2.7-2.9 1.5-.6.7-1.2 1.8-1 2.8 1.1.1 2.2-.5 2.9-1.3z"/></svg>,
  microsoft: <svg width="18" height="18" viewBox="0 0 18 18"><rect x="1" y="1" width="7.5" height="7.5" fill="#F25022"/><rect x="9.5" y="1" width="7.5" height="7.5" fill="#7FBA00"/><rect x="1" y="9.5" width="7.5" height="7.5" fill="#00A4EF"/><rect x="9.5" y="9.5" width="7.5" height="7.5" fill="#FFB900"/></svg>,
  mail: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>,
  eye: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>,
  eyeOff: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>,
  chev: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"/></svg>,
  check: <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>,
  arrow: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>,
  userPlus: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><line x1="20" y1="8" x2="20" y2="14"/><line x1="23" y1="11" x2="17" y2="11"/></svg>,
  flame: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2s4 5 4 9a4 4 0 0 1-8 0c0-2 1-3 1-3s-3 2-3 6a6 6 0 0 0 12 0c0-5-6-12-6-12z"/></svg>,
  spark: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2l2.4 6.5L21 11l-6.6 2.5L12 20l-2.4-6.5L3 11l6.6-2.5z"/></svg>,
  zap: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>,
  cap: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></svg>,
  uni: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 21h18"/><path d="M5 21V8l7-5 7 5v13"/><path d="M9 21V12h6v9"/></svg>,
  teacher: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="4"/><path d="M4 21v-1a6 6 0 0 1 6-6h4a6 6 0 0 1 6 6v1"/></svg>,
  brief: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>,
  learn: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>,
  pen: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4z"/></svg>,
  cards: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="14" height="14" rx="2"/><path d="M7 4V2a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2h-2"/></svg>,
  clock: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
  cal: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>,
  notes: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>,
  star: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26"/></svg>,
};

// Google-authenticated accounts are already verified by Google — only
// email/password signups need the Verify step. Mirrors studlin-app.jsx's
// own isPasswordAccount helper exactly, kept as a separate copy since this
// is a standalone bundle.
const isPasswordAccount = (u) => !!(u && u.providerData && u.providerData.some(p => p.providerId === "password"));

// Common disposable/throwaway email providers — blocked at signup so a
// single person can't script infinite free-tier accounts. Not exhaustive
// (new disposable domains appear constantly), but stops the well-known
// ones with zero cost to real users, who are never on these domains.
const DISPOSABLE_EMAIL_DOMAINS = new Set([
  "mailinator.com","10minutemail.com","10minutemail.net","guerrillamail.com",
  "guerrillamail.info","guerrillamail.biz","guerrillamail.de","tempmail.com",
  "temp-mail.org","yopmail.com","yopmail.fr","throwawaymail.com","trashmail.com",
  "getnada.com","sharklasers.com","dispostable.com","fakeinbox.com","maildrop.cc",
  "mintemail.com","mohmal.com","tempmailo.com","emailondeck.com","moakt.com",
  "mailnesia.com","33mail.com","spamgourmet.com","tempinbox.com","discard.email",
]);
const isDisposableEmail = (email) => {
  const domain = (email.split("@")[1] || "").toLowerCase().trim();
  return DISPOSABLE_EMAIL_DOMAINS.has(domain);
};

// Hard block: charset/length/repeated-character sanity that no real name
// ever fails. Deliberately loose (allows accented Latin letters, hyphens,
// apostrophes, spaces) so it never rejects a legitimate name.
const isValidNameShape = (name) => {
  const t = (name||"").trim();
  if (t.length < 2 || t.length > 40) return false;
  if (!/^[A-Za-zÀ-ɏḀ-ỿ' -]+$/.test(t)) return false;
  if (/([A-Za-z])\1{3,}/.test(t)) return false; // e.g. "jjjj", "aaaa"
  return true;
};

// Soft signal only — flags keyboard-mash-looking names (4+ consonants in a
// row) for a non-blocking warning. NOT a hard rule: real surnames (Schmidt,
// Strickland, Krzysztof...) hit this same pattern, so it must never block
// submission, only nudge a second look.
const looksLikeGibberishName = (name) => {
  const t = (name||"").trim();
  return /[bcdfghjklmnpqrstvwxyzBCDFGHJKLMNPQRSTVWXYZ]{4,}/.test(t);
};

// Have I Been Pwned's k-anonymity range API: only the first 5 hex chars of
// the SHA-1 hash ever leave the browser, so the real password is never
// transmitted, logged, or reconstructable by the API. Fails open (treats
// as "not pwned") on any network/API error — a third-party outage must
// never block signup.
async function isPasswordPwned(password) {
  try {
    const enc = new TextEncoder().encode(password);
    const digest = await crypto.subtle.digest("SHA-1", enc);
    const hashHex = Array.from(new Uint8Array(digest)).map(b=>b.toString(16).padStart(2,"0")).join("").toUpperCase();
    const prefix = hashHex.slice(0,5);
    const suffix = hashHex.slice(5);
    const res = await fetch(`https://api.pwnedpasswords.com/range/${prefix}`);
    if (!res.ok) return false;
    const text = await res.text();
    return text.split("\n").some(line => line.split(":")[0].trim() === suffix);
  } catch(e) {
    return false;
  }
}

const ERR_MAP = {
  "auth/email-already-in-use":"An account with this email already exists. Try signing in.",
  "auth/invalid-email":"Please enter a valid email address.",
  "auth/weak-password":"Password must be at least 6 characters.",
  "auth/network-request-failed":"Network error. Check your connection.",
  "auth/popup-blocked":"Pop-up was blocked. Please allow pop-ups.",
  "auth/account-exists-with-different-credential":"An account exists with this email using a different method.",
};

function TextField({ label, value, onChange, type="text", hint, error, warning, autoFocus, autoComplete }) {
  const [focused, setFocused] = useState(false);
  const [show, setShow] = useState(false);
  const isPw = type === "password";
  const inputType = isPw && show ? "text" : type;
  const hasValue = !!(value && String(value).length);
  return (
    <div className="field">
      <div className={"input-wrap" + (hasValue ? " has-value" : "") + (focused ? " is-focused" : "") + (error ? " has-error" : "")}>
        <label>{label}</label>
        <input type={inputType} value={value || ""} onChange={e=>onChange(e.target.value)} onFocus={()=>setFocused(true)} onBlur={()=>setFocused(false)} autoFocus={autoFocus} autoComplete={autoComplete || "off"} />
        {isPw && <button type="button" className="pwd-toggle" onClick={()=>setShow(s=>!s)}>{show ? Ic.eyeOff : Ic.eye}</button>}
      </div>
      {error && <div className="field-error">{error}</div>}
      {!error && warning && <div className="field-hint" style={{color:"#B8860B"}}>{warning}</div>}
      {!error && !warning && hint && <div className="field-hint">{hint}</div>}
    </div>
  );
}

function SelectField({ label, value, onChange, options, hint }) {
  const [focused, setFocused] = useState(false);
  const hasValue = !!value;
  return (
    <div className="field">
      <div className={"input-wrap" + (hasValue ? " has-value" : "") + (focused ? " is-focused" : "")}>
        <label>{label}</label>
        <select value={value || ""} onChange={e=>onChange(e.target.value)} onFocus={()=>setFocused(true)} onBlur={()=>setFocused(false)}>
          <option value="" disabled hidden></option>
          {options.map(o=><option key={typeof o==="string"?o:o.value} value={typeof o==="string"?o:o.value}>{typeof o==="string"?o:o.label}</option>)}
        </select>
        <span className="chev">{Ic.chev}</span>
      </div>
      {hint && <div className="field-hint">{hint}</div>}
    </div>
  );
}

const STEPS = [
  { name: "Sign up" },{ name: "Verify" },{ name: "Profile" },
];

// ===== STU MASCOT: the Studlin logo square come to life. SHARED COPY, keep identical in studlin-app.jsx and onboarding.jsx (a test checks). =====
// Props: mood, color (body fill), outline (face ink), edge (body/limb outline, defaults to outline), size (px height), walking, facing, speaking, ariaLabel.
const stuH = React.createElement;
const STU_CSS = [
  '.stu-root{display:inline-block;line-height:0;overflow:visible}',
  '.stu-root svg{overflow:visible;display:block}',
  '.stu-breathe{transform-origin:60px 80px;animation:stu-breathe 4s ease-in-out infinite}',
  '.stu-bob{animation:stu-bob .56s ease-in-out infinite}',
  '.stu-blink{transform-origin:60px 44px;animation:stu-blink 4.2s infinite}',
  '.stu-legA{transform-origin:47px 82px;animation:stu-swingA .56s ease-in-out infinite}',
  '.stu-legB{transform-origin:73px 82px;animation:stu-swingB .56s ease-in-out infinite}',
  '.stu-talk{transform-origin:60px 58px;animation:stu-talk .34s ease-in-out infinite}',
  '.stu-conf{animation:stu-conf 1.6s ease-in-out infinite}',
  '.stu-spark{transform-origin:100px 22px;animation:stu-spark 1.8s ease-in-out infinite}',
  '@keyframes stu-breathe{0%,100%{transform:scale(1,1)}50%{transform:scale(1.015,.985)}}',
  '@keyframes stu-bob{0%,100%{transform:translateY(0)}50%{transform:translateY(-2.5px)}}',
  '@keyframes stu-blink{0%,93%,100%{transform:scaleY(1)}96%{transform:scaleY(.08)}}',
  '@keyframes stu-swingA{0%,100%{transform:rotate(-22deg)}50%{transform:rotate(22deg)}}',
  '@keyframes stu-swingB{0%,100%{transform:rotate(22deg)}50%{transform:rotate(-22deg)}}',
  '@keyframes stu-talk{0%,100%{transform:scaleY(1)}50%{transform:scaleY(.55)}}',
  '@keyframes stu-conf{0%,100%{transform:translateY(0);opacity:1}50%{transform:translateY(-3px);opacity:.7}}',
  '@keyframes stu-spark{0%,100%{transform:scale(1) rotate(0)}50%{transform:scale(1.25) rotate(20deg)}}',
  '@media (prefers-reduced-motion:reduce){.stu-root *{animation:none!important}}',
  'body[data-motion="reduce"] .stu-root *{animation:none!important}'
].join('');

function stuRgb(c) { c = String(c).replace('#', ''); if (c.length === 3) c = c.replace(/(.)/g, '$1$1'); var n = parseInt(c, 16); return isNaN(n) ? [158, 200, 61] : [n >> 16 & 255, n >> 8 & 255, n & 255]; }
function stuMix(a, b, t) { var A = stuRgb(a), B = stuRgb(b); return 'rgb(' + A.map(function (v, i) { return Math.round(v + (B[i] - v) * t); }).join(',') + ')'; }

// Hand-made wonky body, flat bottom, clipped top-right corner like the drawing.
const STU_BODY = 'M31 24 Q30 20 36 19.5 L77 18 Q82 17.5 85 21 L90 27 Q91.5 29 91.5 33 L91.5 74 Q92 79 87 79.5 L38 82 Q31 82.5 31 77 Z';

// arms: per side [elbowX, elbowY, handX, handY]
const STU_ARMS = {
  out: [[22, 62, 14, 50], [98, 62, 106, 50]],
  up: [[20, 52, 18, 36], [100, 52, 102, 36]],
  droop: [[22, 70, 18, 82], [98, 70, 102, 82]],
  hips: [[20, 64, 30, 72], [100, 64, 90, 72]],
  wave: [[22, 62, 14, 50], [100, 50, 110, 34]],
  think: [[22, 66, 14, 74], [92, 62, 80, 54]],
  hurray: [[18, 48, 12, 30], [102, 48, 108, 30]],
  sleepy: [[22, 68, 16, 78], [98, 68, 104, 78]],
  proud: [[24, 66, 18, 56], [96, 66, 102, 56]]
};

const STU_MOODS = {
  neutral: { l: 'dot', r: 'ring', mouth: 'M50 62 Q60 65 70 62', arms: 'out' },
  happy: { l: 'dot', r: 'ring', mouth: 'M47 59 Q60 71 73 59', arms: 'out', blush: 1 },
  excited: { l: 'big', r: 'ring', mouth: 'open', arms: 'up', blush: 1, brow: 'up' },
  wink: { l: 'dot', r: 'arcUp', mouth: 'M47 59 Q58 70 73 58', arms: 'wave', blush: 1 },
  sad: { l: 'dot', r: 'ring', mouth: 'M50 66 Q60 58 70 66', arms: 'droop', brow: 'sad', tear: 1 },
  worried: { l: 'dot', r: 'ring', mouth: 'M49 65 Q54 61 59 65 Q64 69 71 64', arms: 'hips', brow: 'sad', sweat: 1 },
  sleepy: { l: 'line', r: 'line', mouth: 'M55 62 Q60 66 65 62', arms: 'sleepy', zz: 1 },
  proud: { l: 'arcUp', r: 'arcUp', mouth: 'M48 60 Q60 70 72 60', arms: 'proud', blush: 1, sparkle: 1, chest: 1 },
  thinking: { l: 'dotUp', r: 'ringUp', mouth: 'M52 63 Q58 61 68 64', arms: 'think', brow: 'think', dots: 1 },
  waving: { l: 'dot', r: 'ring', mouth: 'M47 59 Q60 70 73 59', arms: 'wave', blush: 1 },
  celebrating: { l: 'arcUp', r: 'arcUp', mouth: 'open', arms: 'hurray', blush: 1, confetti: 1 }
};

function stuEye(kind, x, ink, hi) {
  var y = 44, s = { stroke: ink, strokeWidth: 3, fill: 'none', strokeLinecap: 'round' };
  switch (kind) {
    case 'dot': return stuH('ellipse', { cx: x, cy: y, rx: 3.6, ry: 4.2, fill: ink });
    case 'dotUp': return stuH('ellipse', { cx: x + 1.5, cy: y - 2, rx: 3.6, ry: 4.2, fill: ink });
    case 'big': return stuH('g', null, stuH('circle', { cx: x, cy: y, r: 6, fill: ink }), stuH('circle', { cx: x + 1.8, cy: y - 2, r: 1.8, fill: hi }));
    case 'ring': return stuH('g', null, stuH('circle', { cx: x, cy: y, r: 5.4, fill: hi, stroke: ink, strokeWidth: 2.6 }), stuH('circle', { cx: x, cy: y, r: 2.4, fill: ink }));
    case 'ringUp': return stuH('g', null, stuH('circle', { cx: x, cy: y - 1, r: 5.4, fill: hi, stroke: ink, strokeWidth: 2.6 }), stuH('circle', { cx: x + 1.5, cy: y - 3, r: 2.4, fill: ink }));
    case 'arcUp': return stuH('path', Object.assign({ d: 'M' + (x - 5) + ' ' + (y + 2) + ' Q' + x + ' ' + (y - 6) + ' ' + (x + 5) + ' ' + (y + 2) }, s));
    case 'line': return stuH('path', Object.assign({ d: 'M' + (x - 5) + ' ' + (y + 1) + ' Q' + x + ' ' + (y + 4) + ' ' + (x + 5) + ' ' + (y + 1) }, s));
  }
}

function StudMascot(p) {
  var mood = STU_MOODS[p.mood] ? p.mood : 'happy', m = STU_MOODS[mood];
  var color = p.color || '#9EC83D', ink = p.outline || '#0E1F18', edge = p.edge || ink, size = p.size || 96;
  var hi = stuMix(color, '#ffffff', 0.82), shine = stuMix(color, '#ffffff', 0.45), blush = stuMix(color, '#ff4d7a', 0.55), shade = stuMix(color, '#000000', 0.12);
  var walking = !!p.walking, arms = STU_ARMS[m.arms];
  var line = { stroke: ink, strokeWidth: 3.4, fill: 'none', strokeLinecap: 'round', strokeLinejoin: 'round' };
  var eline = Object.assign({}, line, { stroke: edge });
  var ky = m.chest ? -2 : 0;

  if (typeof document !== 'undefined' && !document.getElementById('stu-style')) {
    var st = document.createElement('style'); st.id = 'stu-style'; st.textContent = STU_CSS; document.head.appendChild(st);
  }

  function arm(a, side) {
    var sx = side ? 91 : 31, sy = m.chest ? 62 : 60;
    return stuH('path', Object.assign({ key: 'arm' + side, d: 'M' + sx + ' ' + sy + ' L' + a[0] + ' ' + a[1] + ' L' + a[2] + ' ' + a[3] }, eline));
  }
  function leg(x, cls) {
    return stuH('g', { key: 'leg' + x, className: walking ? cls : undefined },
      stuH('path', Object.assign({ d: 'M' + x + ' 81 L' + x + ' 104' }, eline)),
      stuH('path', Object.assign({ d: 'M' + (x - 6) + ' 106 Q' + (x - 6) + ' 102 ' + (x - 1) + ' 102.5 L' + (x + 6) + ' 103 Q' + (x + 8) + ' 108 ' + (x + 3) + ' 109 L' + (x - 4) + ' 109 Q' + (x - 6) + ' 109 ' + (x - 6) + ' 106 Z', fill: color }, eline, { strokeWidth: 3 })));
  }
  var mouth;
  if (p.speaking) {
    mouth = stuH('g', { className: 'stu-talk' }, stuH('path', { d: 'M51 60 Q60 62 69 60 Q68 70 60 70 Q52 70 51 60 Z', fill: ink, stroke: ink, strokeWidth: 2.4, strokeLinejoin: 'round' }));
  } else if (m.mouth === 'open') {
    mouth = [stuH('path', { key: 'o', d: 'M49 58 Q60 60 71 58 Q70 72 60 72 Q50 72 49 58 Z', fill: ink, stroke: ink, strokeWidth: 2.4, strokeLinejoin: 'round' }),
      stuH('path', { key: 't', d: 'M54 69 Q60 64 66 69 Q60 72 54 69 Z', fill: blush })];
  } else {
    mouth = stuH('path', Object.assign({ d: m.mouth }, line, { strokeWidth: 3 }));
  }

  var bs = { stroke: ink, strokeWidth: 2.6, fill: 'none', strokeLinecap: 'round' }, brows = null;
  if (m.brow === 'sad') brows = [stuH('path', Object.assign({ key: 1, d: 'M40 38 L53 33' }, bs)), stuH('path', Object.assign({ key: 2, d: 'M80 38 L67 33' }, bs))];
  if (m.brow === 'up') brows = [stuH('path', Object.assign({ key: 1, d: 'M42 33 Q48 29 54 33' }, bs)), stuH('path', Object.assign({ key: 2, d: 'M66 33 Q72 29 78 33' }, bs))];
  if (m.brow === 'think') brows = stuH('path', Object.assign({ d: 'M66 32 Q72 29 78 33' }, bs));

  var extras = [];
  if (m.blush) extras.push(stuH('ellipse', { key: 'b1', cx: 40, cy: 55, rx: 5, ry: 3, fill: blush, opacity: 0.5 }), stuH('ellipse', { key: 'b2', cx: 80, cy: 55, rx: 5, ry: 3, fill: blush, opacity: 0.5 }));
  if (m.tear) extras.push(stuH('path', { key: 'tr', d: 'M72 52 Q75 57 72 60 Q69 57 72 52 Z', fill: '#7cc4ff', stroke: ink, strokeWidth: 1.6 }));
  if (m.sweat) extras.push(stuH('path', { key: 'sw', d: 'M85 28 Q88 33 85 36 Q82 33 85 28 Z', fill: '#7cc4ff', stroke: ink, strokeWidth: 1.6 }));
  var star = function (cx, cy, r, k) { return stuH('path', { key: k, d: 'M' + cx + ' ' + (cy - r) + ' Q' + cx + ' ' + cy + ' ' + (cx + r) + ' ' + cy + ' Q' + cx + ' ' + cy + ' ' + cx + ' ' + (cy + r) + ' Q' + cx + ' ' + cy + ' ' + (cx - r) + ' ' + cy + ' Q' + cx + ' ' + cy + ' ' + cx + ' ' + (cy - r) + ' Z', fill: ink }); };
  if (m.sparkle) extras.push(stuH('g', { key: 'sp', className: 'stu-spark' }, star(100, 22, 8, 's1')), star(22, 14, 4, 's2'));
  if (m.zz) extras.push(stuH('text', { key: 'zz', x: 92, y: 20, fontSize: 14, fontWeight: 800, fontFamily: 'system-ui,sans-serif', fill: ink, className: 'stu-conf' }, 'z'), stuH('text', { key: 'zz2', x: 101, y: 8, fontSize: 10, fontWeight: 800, fontFamily: 'system-ui,sans-serif', fill: ink, className: 'stu-conf' }, 'z'));
  if (m.dots) extras.push(stuH('circle', { key: 'd1', cx: 96, cy: 24, r: 2, fill: ink }), stuH('circle', { key: 'd2', cx: 102, cy: 16, r: 3, fill: ink }), stuH('circle', { key: 'd3', cx: 110, cy: 6, r: 4.2, fill: 'none', stroke: ink, strokeWidth: 2 }));
  if (m.confetti) [[12, 14, '#F27BAA'], [28, 4, '#FFC93C'], [96, 6, '#5BC0EB'], [108, 18, '#F27BAA'], [60, 2, '#FFC93C'], [116, 40, '#5BC0EB'], [4, 36, '#5BC0EB']].forEach(function (c, i) {
    extras.push(stuH('rect', { key: 'c' + i, x: c[0], y: c[1], width: 5, height: 5, rx: 1.4, fill: c[2], className: 'stu-conf', style: { animationDelay: (i * 0.17) + 's' }, transform: 'rotate(' + (i * 27) + ' ' + c[0] + ' ' + c[1] + ')' }));
  });

  var face = stuH('g', null, stuH('g', { className: 'stu-blink' }, stuEye(m.l, 48, ink, hi), stuEye(m.r, 72, ink, hi)), brows, mouth);
  var body = stuH('g', { className: walking ? 'stu-bob' : undefined },
    stuH('g', { className: 'stu-breathe' },
      arms.map(function (a, i) { return arm(a, i); }),
      stuH('path', { d: STU_BODY, fill: color, stroke: edge, strokeWidth: 4, strokeLinejoin: 'round' }),
      stuH('path', { d: 'M37 27 L37 40', stroke: shine, strokeWidth: 3.4, strokeLinecap: 'round', opacity: 0.9 }),
      stuH('path', { d: 'M38 77 L89 75', stroke: shade, strokeWidth: 3, strokeLinecap: 'round', opacity: 0.6 }),
      stuH('g', { transform: 'translate(0 ' + ky + ')' }, face), extras));
  var aria = p.ariaLabel ? { role: 'img', 'aria-label': p.ariaLabel } : { 'aria-hidden': true };
  return stuH('span', { className: 'stu-root ' + (p.className || ''), style: Object.assign({ transform: p.facing === 'left' ? 'scaleX(-1)' : undefined, filter: p.onDark ? 'drop-shadow(0 0 1.2px rgba(255,255,255,.95))' : undefined }, p.style) },
    stuH('svg', Object.assign({ viewBox: '-2 -4 124 120', height: size, width: size * 124 / 120, xmlns: 'http://www.w3.org/2000/svg' }, aria),
      stuH('g', null, leg(47, 'stu-legA'), leg(73, 'stu-legB'), body)));
}
// ===== END STU MASCOT =====

// Stu says hi in the left panel (2026-10-13). Always the brand lime here:
// there is no theme before sign-up. Mood and line change per step.
const STU_RAIL_LINES = [
  ["waving", "Hi, I'm Stu! I'll help you stay on top of school."],
  ["thinking", "Check your email. I'll wait right here."],
  ["excited", "Almost there! Tell me a bit about you."],
];
function StuGreeting({ step }) {
  const [mood, line] = STU_RAIL_LINES[Math.min(step, STU_RAIL_LINES.length - 1)];
  return (
    <div className="stu-greet">
      <StudMascot mood={mood} size={84} color="#9EC83D" outline="#0E1F18" edge="#E6ECE7" ariaLabel="Stu, the Studlin mascot" />
      <div className="stu-say">{line}</div>
    </div>
  );
}

// One product preview per step in the left panel (2026-10-13). The files are
// light WebP exports of the hero mockups; the rail is hidden under 980px, so
// no mobile variant is needed. Mockups, not live screenshots.
const RAIL_SHOTS = [
  { name: "hero-calendar", alt: "Studlin calendar with color-coded courses and a study session planned from your syllabus." },
  { name: "hero-deadlines", alt: "Studlin deadlines list with a scanned syllabus and a connected Canvas account." },
  { name: "hero-dashboard", alt: "Studlin dashboard with today, a checklist, upcoming deadlines and a Catch Me Up card." },
];
function RailShot({ step }) {
  const shot = RAIL_SHOTS[Math.min(step, RAIL_SHOTS.length - 1)];
  return (
    <div className="rail-shot">
      <img src={"/assets/images/" + shot.name + "-1600.webp"} srcSet={"/assets/images/" + shot.name + "-800.webp 800w, /assets/images/" + shot.name + "-1600.webp 1600w"} sizes="600px" width="1600" height="1000" alt={shot.alt} decoding="async" />
    </div>
  );
}

function LeftRail({ step, state }) {
  if (step === 0) {
    return (
      <aside className="rail">
        <div className="brand">
          <div style={{width:34,height:34,borderRadius:8,background:"#9EC83D",display:"grid",placeItems:"center",fontSize:17,fontWeight:800,color:"#14342A"}}>S</div>
          <span className="name">studlin</span>
        </div>
        <StuGreeting step={step} />
        <h1>Sign up and lock in.</h1>
        <p className="lead">Sign up is simple, free and fast. One workspace for everything you study, write, and remember.</p>
        <RailShot step={step} />
      </aside>
    );
  }
  const groups = [{ name: "Sign up", from: 0, to: 0 },{ name: "Verify", from: 1, to: 1 },{ name: "Profile", from: 2, to: 2 }];
  return (
    <aside className="rail">
      <div className="brand">
        <div style={{width:34,height:34,borderRadius:8,background:"#9EC83D",display:"grid",placeItems:"center",fontSize:17,fontWeight:800,color:"#14342A"}}>S</div>
        <span className="name">studlin</span>
      </div>
      <StuGreeting step={step} />
      <h1 style={{fontSize:28}}>Create your account in a few clicks.</h1>
      <div className="stepper" style={{marginTop:36}}>
        {groups.map((g,i)=>{
          const done=step>g.to, current=step>=g.from&&step<=g.to;
          return <div key={i} className={"step"+(done?" is-done":"")+(current?" is-current":"")}><span className="dot">{done?Ic.check:i+1}</span><span className="name">{g.name}</span></div>;
        })}
      </div>
      <RailShot step={step} />
      <div className="rail-meta">
        <div className="row" style={{color:"rgba(255,255,255,0.85)"}}>{firebase.auth().currentUser?.email || state.email || "you@studlin.app"}</div>
      </div>
    </aside>
  );
}

function StepSignup({ state, set, advance }) {
  const [mode, setMode] = useState("providers");
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [authError, setAuthError] = useState("");

  // Only the Terms checkbox gates identity here now — school/status
  // collection moved to the post-auth Profile step (StepProfile) so this
  // screen stays a pure auth gate with minimal friction.
  const checkIdentityFields = () => {
    const errs = {};
    if (!state.terms) errs.terms = "You need to accept the Terms of Service and Privacy Policy to continue.";
    return errs;
  };

  // Terms checkbox unchecked — it may be below the fold (the trust panel
  // above it can push it out of view on shorter screens), so the inline
  // error alone might be invisible. Scroll it into view instead of
  // leaving the click looking like it did nothing. The page itself never
  // scrolls here (.shell is a fixed 100vh grid) — .stage is the actual
  // scrollable element, not window/body. Shared by both auth paths below
  // — bug fix, 2026-09-04 audit: originally only googleSign had this,
  // so the identical error on the email path (tryAdvance) showed with no
  // visible feedback near the button the student actually clicked.
  const scrollTermsIntoView = () => {
    const stageEl = document.querySelector('.stage');
    if (stageEl) stageEl.scrollTo({ top: stageEl.scrollHeight, behavior: 'smooth' });
    else window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
  };

  const googleSign = () => {
    const idErrs = checkIdentityFields();
    if (Object.keys(idErrs).length > 0) {
      setErrors(idErrs);
      scrollTermsIntoView();
      return;
    }
    setErrors({});setAuthError("");setLoading(true);
    if(window.__isInAppBrowser&&window.__isInAppBrowser()){setAuthError("Google sign-in isn't available in this app's built-in browser. Tap the ⋯ or ⋮ menu and choose \"Open in Browser\" to continue.");setLoading(false);return;}
    if(typeof google==="undefined"||!google.accounts){setAuthError("Google sign-in is still loading. Please try again.");setLoading(false);return;}
    const client = google.accounts.oauth2.initTokenClient({
      client_id:"16831354472-rp345qhnnqcthvsq2m528e6o8n4vhfp2.apps.googleusercontent.com",
      scope:"email profile",
      callback: async (tokenResponse) => {
        if(tokenResponse.error){setAuthError("Google sign-in was cancelled.");setLoading(false);return;}
        try {
          const credential = firebase.auth.GoogleAuthProvider.credential(null, tokenResponse.access_token);
          const result = await firebase.auth().signInWithCredential(credential);
          const u = result.user;
          set(s=>({...s, provider:"google", name:u.displayName||s.name, email:u.email||s.email}));
          if(window.posthog){posthog.identify(u.uid,{email:u.email,provider:"google"});posthog.capture("signup_completed",{method:"google"});}
          advance(true);
        } catch(err) {
          setAuthError(ERR_MAP[err.code]||(err.message||"Sign-up failed."));
          setLoading(false);
        }
      },
      error_callback: () => {setAuthError("Google sign-in was cancelled.");setLoading(false);}
    });
    client.requestAccessToken();
  };

  const pwOk = { len: (state.password||"").length >= 8 };
  const allOk = pwOk.len;

  const tryAdvance = async () => {
    const errs = checkIdentityFields();
    if (!state.email?.trim()) errs.email = "Please enter your email address";
    else if (!/\S+@\S+\.\S+/.test(state.email)) errs.email = "Please enter a valid email address";
    else if (isDisposableEmail(state.email)) errs.email = "Please use a permanent email address, not a temporary one";
    if (!allOk) errs.password = "Password must be at least 8 characters";
    setErrors(errs);
    if (Object.keys(errs).length > 0) {
      if (errs.terms) scrollTermsIntoView();
      return;
    }

    setAuthError("");setLoading(true);

    if (await isPasswordPwned(state.password)) {
      setErrors(e => ({ ...e, password: "This password has appeared in a data breach. Please choose a different one." }));
      setLoading(false);
      return;
    }

    try {
      const cred = await firebase.auth().createUserWithEmailAndPassword(state.email, state.password);
      // Full name is collected later, in StepProfile (First/Last name) —
      // this account's displayName gets set from that once known, in
      // finishOnboarding.
      if(window.posthog){posthog.identify(cred.user.uid,{email:state.email,provider:"email"});posthog.capture("signup_completed",{method:"email"});}
      try {
        const token = await cred.user.getIdToken();
        const sendRes = await fetch("/api/send-verification", { method: "POST", headers: { Authorization: "Bearer " + token } });
        try { localStorage.setItem("studlin-verifySent", sendRes.ok ? "ok" : "failed"); } catch(e) {}
      } catch(e) {
        try { localStorage.setItem("studlin-verifySent", "failed"); } catch(e2) {}
      }
      advance(true);
    } catch(err) {
      setAuthError(ERR_MAP[err.code]||"Something went wrong. Please try again.");
    }
    setLoading(false);
  };

  return (
    <div className="frame">
      <div className="frame-head">
        <h2>Welcome to <em>Studlin</em></h2>
        <p>Better grades start here. Create your account in a few clicks.</p>
      </div>

      {authError && <div style={{fontSize:13,color:"#C4544A",marginBottom:16,padding:"12px 14px",background:"#FCF1EF",borderRadius:10,border:"1px solid #F5D4D0",textAlign:"center"}}>{authError}</div>}

      {mode === "providers" && (
        <>
          <div className="providers">
            <button className="provider" onClick={googleSign} disabled={loading}>{Ic.google} Continue with Google</button>
          </div>
          <div className="divider">or sign up with email</div>
          <button className="provider" onClick={()=>setMode("email")}>{Ic.mail} Use email instead</button>
          <div className="signup-trust">
            <div className="trust-row">
              <span className="tchip">{Ic.check} Free forever plan</span>
              <span className="tchip">{Ic.check} No card required</span>
              <span className="tchip">{Ic.check} 60-second setup</span>
            </div>
            <div className="trust-foot">
              Made for Students by Students
            </div>
          </div>
        </>
      )}

      {mode === "email" && (
        <>
          <TextField label="Email address" value={state.email} onChange={v=>set({...state, email:v})} hint={errors.email?null:"Any email works: school, Gmail, whatever."} error={errors.email} type="email" autoComplete="email" autoFocus />
          <TextField label="Create password" value={state.password} onChange={v=>set({...state, password:v})} type="password" autoComplete="new-password" error={errors.password} hint={errors.password?null:"At least 8 characters."} />
          <div style={{marginTop:18}}>
            <button className="provider" onClick={()=>setMode("providers")} style={{padding:"10px 14px",fontSize:13}}>← Use Google instead</button>
          </div>
          <button data-cta="signup" onClick={tryAdvance} style={{display:"none"}}></button>
        </>
      )}

      <label className={"checkbox" + (state.terms ? " is-checked" : "")} onClick={()=>set({...state, terms:!state.terms})} style={{marginTop:22}}>
        <span className="box">{Ic.check}</span>
        <span>I accept the <a href="/terms" target="_blank" rel="noopener noreferrer" onClick={e=>e.stopPropagation()}>Terms of Service</a> and <a href="/privacy" target="_blank" rel="noopener noreferrer" onClick={e=>e.stopPropagation()}>Privacy Policy</a>.</span>
      </label>
      {errors.terms && <div className="field-error" style={{marginTop:8}}>{errors.terms}</div>}
    </div>
  );
}

// Six-box OTP input — auto-advance, paste-friendly. Kept as its own copy
// (mirrors studlin-app.jsx's OtpBoxes) since this is a standalone bundle.
function OtpBoxes({ value, onChange, disabled, autoFocus }) {
  const refs = useRef([]);
  const setDigit = (i, d) => { const digits = value.split(""); digits[i] = d; onChange(digits.join("").slice(0,6)); };
  const onKeyDown = (i, e) => { if (e.key === "Backspace" && !value[i] && i > 0) refs.current[i-1]?.focus(); };
  const onInput = (i, e) => {
    const raw = e.target.value.replace(/\D/g, "");
    if (!raw) { setDigit(i, ""); return; }
    setDigit(i, raw[raw.length-1]);
    if (i < 5) refs.current[i+1]?.focus();
  };
  const onPaste = (e) => {
    const raw = (e.clipboardData.getData("text")||"").replace(/\D/g,"").slice(0,6);
    if (!raw) return;
    e.preventDefault();
    onChange(raw.padEnd(value.length,"").slice(0,6));
    refs.current[Math.min(raw.length,5)]?.focus();
  };
  return (
    <div style={{display:"flex",gap:8,justifyContent:"center",marginBottom:6}} onPaste={onPaste}>
      {[0,1,2,3,4,5].map(i => (
        <input key={i} ref={el=>refs.current[i]=el} value={value[i]||""} onChange={e=>onInput(i,e)} onKeyDown={e=>onKeyDown(i,e)}
          disabled={disabled} autoFocus={autoFocus && i===0} inputMode="numeric" maxLength={1}
          style={{width:42,height:52,textAlign:"center",fontSize:22,fontWeight:700,borderRadius:10,border:"1.5px solid var(--line-strong)",background:"white",color:"#14342A",outline:"none"}}
          onFocus={e=>e.target.style.borderColor="#9EC83D"}
          onBlur={e=>e.target.style.borderColor="var(--line-strong)"} />
      ))}
    </div>
  );
}

// Verification gate — sits between Sign up and Profile so an unverified
// (or fake) account can never reach StepProfile, which is what writes
// school/status to Firestore. Mirrors studlin-app.jsx's own
// VerifyEmailScreen code-entry logic, styled to match this bundle's
// onboarding.css classes instead of inline dark-theme styles.
function StepVerify({ advanceToProfile }) {
  const [sendStatus, setSendStatus] = useState("idle"); // idle | sending | sent
  const [code, setCode] = useState("");
  const [checking, setChecking] = useState(false);
  const [err, setErr] = useState("");
  // firebase.auth().currentUser is a plain snapshot, not reactive — if this
  // step is reached by resuming an in-progress signup (step is persisted in
  // localStorage, so a reload can land here directly), this component can
  // mount before Firebase finishes restoring auth state, capturing user as
  // null forever (React won't re-render this on its own once currentUser
  // resolves). That showed up as a blank email in the message above and
  // "Couldn't send the email" on Resend, since user.getIdToken() was
  // throwing on null. Subscribing here instead of reading once fixes both.
  const [user, setUser] = useState(()=>firebase.auth().currentUser);
  useEffect(()=>firebase.auth().onAuthStateChanged(setUser), []);

  const resend = async () => {
    setSendStatus("sending"); setErr("");
    try {
      const token = await user.getIdToken();
      const res = await fetch("/api/send-verification", { method: "POST", headers: { Authorization: "Bearer " + token } });
      const d = await res.json().catch(()=>({}));
      if (res.ok && d.ok) { try { localStorage.setItem("studlin-verifySent", "ok"); } catch(e) {} setSendStatus("sent"); setTimeout(()=>setSendStatus("idle"), 30000); }
      else { setErr(d.error || "Couldn't send the email. Try again shortly."); setSendStatus("idle"); }
    } catch(e) { setErr("Couldn't send the email. Try again shortly."); setSendStatus("idle"); }
  };

  // If the first send at sign-up failed (or this step was reached some other
  // way, like a reload), send once automatically so nobody sits here waiting
  // for an email that was never sent.
  const autoSent = useRef(false);
  useEffect(() => {
    if (!user || autoSent.current) return;
    let flag = "";
    try { flag = localStorage.getItem("studlin-verifySent") || ""; } catch(e) {}
    if (flag === "ok") return;
    autoSent.current = true;
    resend();
  }, [user]);

  const startOver = async () => {
    try { localStorage.removeItem("studlin-onboarding"); localStorage.removeItem("studlin-verifySent"); } catch(e) {}
    if (window.StudlinOwnerGuard) StudlinOwnerGuard.clearOnSignOut();
    try { await firebase.auth().signOut(); } catch(e) {}
    window.location.href = "/onboarding";
  };

  const submitCode = async () => {
    if (code.length !== 6 || checking) return;
    setChecking(true); setErr("");
    try {
      const token = await user.getIdToken();
      const res = await fetch("/api/send-verification", { method: "POST", headers: { Authorization: "Bearer " + token, "Content-Type": "application/json" }, body: JSON.stringify({ code }) });
      const d = await res.json().catch(()=>({}));
      if (res.ok && d.ok) { advanceToProfile(); return; }
      setErr(d.error || "Incorrect code. Try again.");
    } catch(e) { setErr("Couldn't verify right now. Try again."); }
    setChecking(false);
  };

  return (
    <div className="frame">
      <div className="frame-head">
        <h2>Enter your <em>code</em></h2>
        <p>We sent a 6-digit code to <strong>{user && user.email}</strong>.</p>
      </div>
      <OtpBoxes value={code} onChange={v=>{setCode(v);setErr("");}} disabled={checking} autoFocus />
      {err && <div style={{fontSize:13,color:"#C4544A",marginBottom:16,padding:"12px 14px",background:"#FCF1EF",borderRadius:10,border:"1px solid #F5D4D0",textAlign:"center"}}>{err}</div>}
      <button className="cta lime" disabled={code.length!==6||checking} onClick={submitCode} style={{width:"100%",justifyContent:"center",marginBottom:12}}>
        {checking ? "Verifying…" : "Verify email"}
      </button>
      <button className="provider" disabled={sendStatus==="sending"||sendStatus==="sent"} onClick={resend}>
        {sendStatus==="sending" ? "Sending…" : sendStatus==="sent" ? "Sent, check your inbox" : "Resend code"}
      </button>
      <button type="button" onClick={startOver} style={{display:"block",margin:"14px auto 0",background:"none",border:"none",color:"inherit",opacity:0.7,fontSize:13,textDecoration:"underline",cursor:"pointer"}}>
        Wrong email? Start over.
      </button>
    </div>
  );
}

const USERNAME_RE = /^[a-z][a-z0-9_]{2,19}$/;

// Same near-duplicate matcher studlin-app.jsx's own SchoolSelect and
// classmate-matching query use (see that file's own comment for the full
// reasoning) -- kept byte-identical here on purpose, same convention this
// file already uses for isPasswordAccount/other small cross-bundle copies.
// This is the one piece that MUST stay in sync between the two files: if
// it ever drifts, a school judged a near-duplicate at signup could stop
// being judged one in Settings (or vice versa), silently breaking
// classmate-matching for anyone caught on the wrong side of the drift.
const SCHOOL_NAME_STOPWORDS = new Set(["the","of","at","a","an"]);
const SCHOOL_NAME_DROPPABLE_SUFFIX = new Set(["university","college"]);
function normalizeSchoolName(name) {
  return (name||"").trim().toLowerCase().replace(/[^a-z0-9\s]/g," ").replace(/\s+/g," ").trim();
}
function schoolSignificantWords(name) {
  return normalizeSchoolName(name).split(" ").filter(w=>w&&!SCHOOL_NAME_STOPWORDS.has(w));
}
function isNearDuplicateSchoolName(labelA, labelB) {
  const a = normalizeSchoolName(labelA), b = normalizeSchoolName(labelB);
  if (!a || !b) return false;
  if (a === b) return true;
  const dropSuffix = (s) => { const w=s.split(" "); return w.length>1&&SCHOOL_NAME_DROPPABLE_SUFFIX.has(w[w.length-1])?w.slice(0,-1).join(" "):s; };
  if (dropSuffix(a) === dropSuffix(b)) return true;
  const compactA = a.replace(/\s+/g,""), compactB = b.replace(/\s+/g,"");
  const initialsOf = (name) => schoolSignificantWords(name).map(w=>w[0]).join("");
  if (compactA.length<=6 && compactA===initialsOf(labelB)) return true;
  if (compactB.length<=6 && compactB===initialsOf(labelA)) return true;
  const wordsA = a.split(" "), wordsB = b.split(" ");
  if (wordsA.length===wordsB.length && wordsA.every((w,i)=>{
    const w2 = wordsB[i];
    if (w===w2) return true;
    const shorter = w.length<w2.length?w:w2, longer = w.length<w2.length?w2:w;
    return shorter.length>=3 && longer.startsWith(shorter);
  })) return true;
  return false;
}
// Registers a school in the shared cross-user directory (same collection/
// shape studlin-app.jsx's own ensureSchoolInDirectory writes) so the very
// first student to type it makes it findable for every student after --
// silently no-ops (security rules reject the update, caught and ignored)
// if it's already there, which is fine: the point is just that it exists.
function ensureSchoolInDirectory(name, type) {
  if (!name || !name.trim()) return;
  const slug = name.trim().toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-+|-+$/g,"").slice(0,100);
  if (!slug) return;
  try { firebase.firestore().collection('schools').doc(slug).set({ name: name.trim(), nameLower: name.trim().toLowerCase(), type, createdAt: new Date().toISOString() }).catch(()=>{}); } catch(e) {}
}
// Lean version of studlin-app.jsx's SchoolSelect -- live-search autocomplete
// against the same shared directory, plus the same "did you mean X?"
// near-duplicate nudge before a genuinely new entry gets created. Doesn't
// carry the local SCHOOL_DIRECTORY seed list or the two wired demo
// schools -- those exist there for the main app's own onboarding-adjacent
// wizards; a brand-new signup has nothing to seed a first paint from, so
// this only ever shows real, live results.
function SchoolField({ value, onChange, statusFilter, onCommitted }) {
  const [q, setQ] = useState(value || "");
  const [open, setOpen] = useState(false);
  const [matches, setMatches] = useState([]); // [name,...]
  const [suggestion, setSuggestion] = useState(null);
  const [focused, setFocused] = useState(false);
  useEffect(()=>{ setQ(value||""); }, [value]);
  useEffect(()=>{
    const term = q.trim().toLowerCase();
    if (!term) { setMatches([]); return; }
    let active = true;
    const t = setTimeout(()=>{
      firebase.firestore().collection('schools').where('nameLower','>=',term).where('nameLower','<=',term+"").limit(15).get()
        .then(snap=>{
          if (!active) return;
          const rows = snap.docs.map(d=>d.data());
          const filtered = statusFilter ? rows.filter(s=>s.type===statusFilter) : rows;
          setMatches(filtered.map(s=>s.name));
        })
        .catch(()=>{ if (active) setMatches([]); });
    }, 250);
    return ()=>{ active=false; clearTimeout(t); };
  }, [q, statusFilter]);
  const pick = (name) => { setQ(name); onChange(name); setSuggestion(null); setOpen(false); };
  const checkAndCommit = async (typed) => {
    const norm = typed.toLowerCase();
    if (matches.some(m=>m.toLowerCase()===norm)) { ensureSchoolInDirectory(typed, statusFilter); if (onCommitted) onCommitted(typed); return; }
    const prefixHit = matches.find(m=>isNearDuplicateSchoolName(m, typed));
    if (prefixHit) { setSuggestion(prefixHit); return; }
    try {
      const snap = await firebase.firestore().collection('schools').limit(300).get();
      const all = snap.docs.map(d=>d.data());
      const pool = statusFilter ? all.filter(s=>s.type===statusFilter) : all;
      const hit = pool.find(s=>isNearDuplicateSchoolName(s.name, typed));
      if (hit) { setSuggestion(hit.name); return; }
    } catch(e) {}
    ensureSchoolInDirectory(typed, statusFilter);
    if (onCommitted) onCommitted(typed);
  };
  const hasValue = !!(q && q.length);
  return (
    <div className="field" style={{position:"relative"}}>
      <div className={"input-wrap" + (hasValue?" has-value":"") + (focused?" is-focused":"")}>
        <label>{statusFilter==="highschool" ? "School name" : statusFilter==="college" ? "University" : "School"}</label>
        <input
          value={q}
          onChange={e=>{ setQ(e.target.value); onChange(e.target.value); setOpen(true); setSuggestion(null); }}
          onFocus={()=>{ setFocused(true); setOpen(true); }}
          onBlur={()=>{
            setFocused(false);
            const typed = q.trim();
            if (typed) checkAndCommit(typed);
            setTimeout(()=>setOpen(false), 150);
          }}
          autoComplete="off"
        />
      </div>
      {open && q.trim() && (
        <div className="school-dropdown">
          {matches.length>0
            ? matches.map(name=>(
                <div key={name} className="school-dropdown-item" onMouseDown={e=>e.preventDefault()} onClick={()=>pick(name)}>{name}</div>
              ))
            : <div className="school-dropdown-empty" onMouseDown={e=>e.preventDefault()} onClick={()=>setOpen(false)}>Can't find your school? Use "{q}" instead</div>
          }
        </div>
      )}
      {suggestion && (
        <div className="school-suggest">
          <span>Did you mean <strong>{suggestion}</strong>?</span>
          <span style={{display:"flex",gap:8}}>
            <button type="button" className="use-btn" onMouseDown={e=>e.preventDefault()} onClick={()=>{ const s=suggestion; pick(s); ensureSchoolInDirectory(s, statusFilter); if (onCommitted) onCommitted(s); }}>Use this</button>
            <button type="button" className="keep-btn" onMouseDown={e=>e.preventDefault()} onClick={()=>{ const typed=q.trim(); if (typed) { ensureSchoolInDirectory(typed, statusFilter); if (onCommitted) onCommitted(typed); } setSuggestion(null); }}>No, keep mine</button>
          </span>
        </div>
      )}
    </div>
  );
}

// Post-auth profile fork — the only other thing collected before the user
// lands in the product. Student status (high school/college) is asked
// right here, immediately before the school field it gates: the school
// field's own label/placeholder and the shared-directory search it runs
// against both depend on knowing which one a student is first. Username
// isn't asked either: finishOnboarding derives one silently from first+
// last name so Studlin Network search/autocomplete keep working without
// adding a field here. Weekly routine and peak study window stay deferred
// to the Calendar tab's first-visit wizard, same as before.
function StepProfile({ state, set }) {
  // Google accounts arrive with a full display name already — split it into
  // first/last once, on mount, so returning/Google users don't have to
  // retype what's already known. Never overwrites anything the user typed.
  useEffect(() => {
    if (!state.firstName && !state.lastName && state.name) {
      const parts = state.name.trim().split(/\s+/);
      set(s => ({ ...s, firstName: s.firstName || parts[0] || "", lastName: s.lastName || parts.slice(1).join(" ") || "" }));
    }
  }, []);

  const firstNameVal = state.firstName || "";
  const lastNameVal = state.lastName || "";
  const firstNameError = firstNameVal && !isValidNameShape(firstNameVal) ? "Enter a valid first name" : "";
  const lastNameError = lastNameVal && !isValidNameShape(lastNameVal) ? "Enter a valid last name" : "";
  const firstNameWarning = !firstNameError && firstNameVal && looksLikeGibberishName(firstNameVal) ? "This doesn't look like a typical name, go ahead if it's correct" : "";
  const lastNameWarning = !lastNameError && lastNameVal && looksLikeGibberishName(lastNameVal) ? "This doesn't look like a typical name, go ahead if it's correct" : "";

  return (
    <div className="frame">
      <div className="frame-head">
        <h2>Tell us <em>about you</em></h2>
        <p>Just the basics. Everything else you can set up later.</p>
      </div>

      <TextField label="First name" value={state.firstName||""} onChange={v=>set({...state, firstName:v})} autoFocus autoComplete="given-name" error={firstNameError} warning={firstNameWarning} />
      <TextField label="Last name" value={state.lastName||""} onChange={v=>set({...state, lastName:v})} autoComplete="family-name" error={lastNameError} warning={lastNameWarning} />
      <SelectField label="High school or college?" value={state.status||""} onChange={v=>set({...state, status:v, school:""})}
        options={[{value:"highschool",label:"High School"},{value:"college",label:"College"}]} />
      {/* Gated on status -- the field's own label and which half of the
          shared directory it searches both depend on knowing this first,
          same reasoning Settings' own affiliation field already applies. */}
      {state.status && (
        <SchoolField value={state.school||""} onChange={v=>set({...state, school:v})} statusFilter={state.status} />
      )}
    </div>
  );
}

// A password-account user is only past the gate once they've actually
// verified; Google (or any non-password provider) is already verified.
const isVerifiedOrGoogle = (u) => !!u && (!isPasswordAccount(u) || u.emailVerified);

function App() {
  const [step, setStep] = useState(()=>{
    const u=firebase.auth().currentUser;
    if(u){
      const s=JSON.parse(localStorage.getItem("studlin-onboarding")||"null");
      if(s&&s._step)return s._step;
      return isVerifiedOrGoogle(u)?2:1;
    }
    return 0;
  });
  const [state, setState] = useState(() => {
    try { const saved = JSON.parse(localStorage.getItem("studlin-onboarding")||"null"); if (saved && typeof saved === "object") return {goals:[],...saved}; } catch(e){}
    return { goals: [] };
  });

  useEffect(()=>{
    return firebase.auth().onAuthStateChanged(u=>{
      if(u&&window.StudlinOwnerGuard)StudlinOwnerGuard.claim(u.uid,(function(){try{return Date.now()-Date.parse(u.metadata.lastSignInTime)<120000;}catch(e){return false;}})());
      if(u){
        const minStep = isVerifiedOrGoogle(u) ? 2 : 1;
        setStep(prev=>prev<minStep?minStep:prev);
      }
    });
  },[]);

  useEffect(()=>{
    try {
      const { password, ...safe } = state;
      localStorage.setItem("studlin-onboarding", JSON.stringify({ ...safe, _step:step, _updatedAt: new Date().toISOString() }));
    } catch(e){}
  }, [state, step]);

  const isStepValid = () => {
    if (step === 0) {
      return !!state.terms && (!!firebase.auth().currentUser || !!(state.provider) || !!(state.email && (state.password||"").length >= 8));
    }
    if (step === 1) return isVerifiedOrGoogle(firebase.auth().currentUser);
    if (step === 2) return isValidNameShape(state.firstName) && isValidNameShape(state.lastName) && !!state.status && !!(state.school||"").trim();
    return true;
  };

  const [transitioning, setTransitioning] = useState(false);
  const [finishing, setFinishing] = useState(false);
  const [finishError, setFinishError] = useState("");

  const back = () => { setTransitioning(true); setTimeout(() => { setStep(s => Math.max(0, s-1)); setTransitioning(false); }, 250); };

  // Derives a candidate handle from a real name for the silent username
  // auto-generation below — same charset the rest of the app expects
  // (USERNAME_RE), never shown to the student.
  const slugifyName = (s) => (s||"").toLowerCase().replace(/[^a-z0-9]/g,"");

  // Claims a unique username for uid via the same atomic transaction the
  // old user-facing flow used, except silently: starts from firstName+
  // lastName, and on collision retries with a random numeric suffix instead
  // of surfacing an error (there's no username field to show one against
  // anymore). A handful of retries makes a true failure astronomically
  // unlikely; if it somehow still fails, onboarding proceeds without a
  // username rather than blocking the student on an invisible field.
  const claimUsernameSilently = async (db, uid, firstName, lastName) => {
    const base = (slugifyName(firstName)+slugifyName(lastName)).slice(0,16) || "student";
    const withLetterStart = /^[a-z]/.test(base) ? base : "s"+base;
    for (let attempt = 0; attempt < 8; attempt++) {
      let candidate = attempt === 0 ? withLetterStart : withLetterStart.slice(0, 16) + Math.floor(1000 + Math.random()*9000);
      candidate = candidate.slice(0, 20);
      if (candidate.length < 3) candidate = candidate.padEnd(3, "0");
      if (!USERNAME_RE.test(candidate)) continue;
      try {
        const unameRef = db.collection('usernames').doc(candidate);
        const profileRef = db.collection('profiles').doc(uid);
        await db.runTransaction(async (tx) => {
          const unameSnap = await tx.get(unameRef);
          if (unameSnap.exists) throw new Error('taken');
          tx.set(unameRef, { uid, createdAt: new Date().toISOString() });
          tx.set(profileRef, { username: candidate, usernameLower: candidate }, { merge: true });
        });
        return candidate;
      } catch(e) { /* collision — loop and retry with a new suffix */ }
    }
    return "";
  };

  // The real "hand off to the app" step — writes the profile fork straight
  // to the authenticated user's Firestore doc(s) and sets the flag the main
  // app's own separate first-run wizard (InitWizard) checks. Weekly Routine
  // and peak-study-window collection are deliberately NOT seeded here
  // anymore — that's the Calendar tab's first-visit wizard's job now, so the
  // user lands on the Dashboard, not forced into Calendar.
  const finishOnboarding = async () => {
    if (!isStepValid() || finishing) return;
    setFinishing(true); setFinishError("");
    const u = firebase.auth().currentUser;
    const firstName = (state.firstName||"").trim();
    const lastName = (state.lastName||"").trim();
    const fullName = `${firstName} ${lastName}`.trim();

    let uname = "";
    if (u) {
      if (fullName && u.displayName !== fullName) {
        try { await u.updateProfile({ displayName: fullName }); } catch(e) {}
      }
      uname = await claimUsernameSilently(firebase.firestore(), u.uid, firstName, lastName);
    }

    try { localStorage.setItem("studlin-onboarded", "true"); } catch(e){}
    // Mirrors the app's own local `profile` object (studlin-app.jsx's
    // getProfile()/saveProfile()) so name/school/username are available to
    // the Calendar's routine wizard immediately, with no Firestore round-trip.
    // status must be included here too -- the main app calls upsertProfile()
    // unconditionally on every load (see App()'s onAuthStateChanged), which
    // reads status from THIS local object, not from what finishOnboarding
    // just wrote to Firestore directly below. Leaving it out here would let
    // that very next auto-upsert silently overwrite the correct status back
    // to empty the moment the student lands on /app.
    try {
      const prevProfile = JSON.parse(localStorage.getItem("studlin-profile")||"null") || {};
      localStorage.setItem("studlin-profile", JSON.stringify({ ...prevProfile, name: fullName || prevProfile.name || "", username: uname, affiliation: (state.school||"").trim(), school: (state.school||"").trim(), status: state.status||"" }));
    } catch(e){}
    try { localStorage.removeItem("studlin-onboarding"); } catch(e){}
    // Bug fix, 2026-09-04 audit: both Firestore writes below discarded
    // their errors completely -- finishError existed in the UI (see its
    // render further down) but nothing ever actually set it to a real
    // message, so it was dead code. A write failure (permission-rule
    // change, transient outage, network drop) used to leave school/status
    // never actually saved server-side with zero indication anything went
    // wrong -- silently breaking classmate-matching (profiles.schoolLower)
    // and desyncing onboarded status across devices. Still navigates
    // forward either way (local state already looks right on this
    // device, and the main app's own upsertProfile() retries the profiles
    // write on next load anyway -- see the comment above), just makes a
    // real failure visible for a moment first instead of masking it.
    let saveError=false;
    if (u) {
      try {
        // name/email/provider are deliberately NOT written here — Firestore
        // security rules only allow this client write to touch a specific
        // onboarding-field allowlist (see firestore.rules). name already
        // lives on the Auth profile via updateProfile() above; email and
        // provider are populated server-side via the Admin SDK (api/me.js)
        // the first time the app calls it. Writing them here would just get
        // silently rejected by the rules and, worse, was masking a real bug
        // (this succeeded before only because the live rules were stale).
        await firebase.firestore().collection('users').doc(u.uid).set({
          school: (state.school||"").trim(),
          affiliation: (state.school||"").trim(),
          onboarded: true,
          onboardedAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }, { merge: true });
      } catch(e) { saveError=true; }
      try {
        // The `users` write above is the account record; classmate-matching
        // (studlin-app.jsx's own Studlin Network) reads from `profiles`
        // instead and specifically needs schoolLower -- writing school only
        // to `users` (the bug this fixes) left every new signup's school
        // invisible to matching until they separately opened Settings and
        // re-saved it there through Profile's own upsertProfile call. Same
        // fields that call writes, profiles/{uid} has no field allowlist
        // (unlike users/{uid} -- see firestore.rules) so this is a normal
        // merge, no rules change needed.
        const school = (state.school||"").trim();
        await firebase.firestore().collection('profiles').doc(u.uid).set({
          school, schoolLower: school.toLowerCase(), status: state.status||"",
          updatedAt: new Date().toISOString(),
        }, { merge: true });
      } catch(e) { saveError=true; }
      if(window.posthog){
        posthog.capture("onboarding_completed",{school:(state.school||"").trim()});
        posthog.setPersonProperties({school:(state.school||"").trim(),onboarded:true});
      }
    }
    if(saveError){
      setFinishError("Couldn't save your school to your account -- you can set it again in Settings.");
      setTimeout(()=>{window.location.href="/app";},1800);
    }else{
      window.location.href = "/app";
    }
  };

  useEffect(()=>{
    const fn = e => {
      if (e.key === "Enter") { if (step < STEPS.length-1) { if(isStepValid()){ setTransitioning(true); setTimeout(()=>{ setStep(s=>Math.min(STEPS.length-1,s+1)); setTransitioning(false); },250); } } else finishOnboarding(); }
      if (e.key === "Escape" && step > 0) back();
    };
    window.addEventListener("keydown", fn);
    return ()=>window.removeEventListener("keydown", fn);
  });

  const CTA_LABEL = ["Sign up for free","I've verified, continue","Continue"][step];

  return (
    <div className="shell">
      <LeftRail step={step} state={state} />
      <main className="stage">
        <div className="stage-top">
          {step > 0 && <span style={{color:"var(--muted)",fontSize:13}}>Step {step+1} of {STEPS.length}</span>}
        </div>
        <div className={"step-content" + (transitioning ? " is-leaving" : " is-entering")}>
          {/* advance() only ever fires from step 0 right after a successful
              signup/sign-in. Password accounts must land on the Verify step
              first — StepProfile (which writes school/status to Firestore)
              must never be reachable before the account is actually
              verified. Google accounts are already verified by Google, so
              they skip straight to Profile. */}
          {step === 0 && <StepSignup state={state} set={setState} advance={(skip)=>{
            if(skip||isStepValid()){
              const dest = isVerifiedOrGoogle(firebase.auth().currentUser) ? 2 : 1;
              setTransitioning(true); setTimeout(()=>{ setStep(dest); setTransitioning(false); },250);
            }
          }} />}
          {step === 1 && <StepVerify advanceToProfile={()=>{ setTransitioning(true); setTimeout(()=>{ setStep(2); setTransitioning(false); },250); }} />}
          {step === 2 && <StepProfile state={state} set={setState} />}
        </div>
        <div className="stage-foot" style={step===1?{display:"none"}:undefined}>
          {finishError && <div style={{fontSize:13,color:"#C4544A",marginBottom:14,padding:"12px 14px",background:"#FCF1EF",borderRadius:10,border:"1px solid #F5D4D0",textAlign:"center"}}>{finishError}</div>}
          <button className="cta" disabled={!isStepValid()||finishing} onClick={()=>{
            if(step===0&&!firebase.auth().currentUser){
              const btn=document.querySelector('[data-cta="signup"]');
              if(btn){btn.click();return;}
            }
            if(step===STEPS.length-1){finishOnboarding();return;}
            setTransitioning(true); setTimeout(()=>{ setStep(s=>Math.min(STEPS.length-1,s+1)); setTransitioning(false); },250);
          }}>
            {finishing?"Setting up...":CTA_LABEL}<span className="arrow">{Ic.arrow}</span>
          </button>
          {step === 0 && <div className="stage-links"><a href="/privacy" target="_blank" rel="noopener noreferrer">Privacy Policy</a> · <a href="/terms" target="_blank" rel="noopener noreferrer">Terms of Service</a></div>}
          {step === 0 && <div style={{marginTop:16,textAlign:"center",fontSize:13,color:"var(--muted)"}}>Already have an account? <a href="/signin">Log in</a></div>}
          {step > 0 && <div style={{marginTop:14}}><button onClick={back} style={{background:"transparent",border:"none",color:"var(--muted)",fontSize:13,cursor:"pointer",fontFamily:"inherit"}}>← Back</button></div>}
        </div>
      </main>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
