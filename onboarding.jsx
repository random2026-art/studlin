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

const ERR_MAP = {
  "auth/email-already-in-use":"An account with this email already exists. Try signing in.",
  "auth/invalid-email":"Please enter a valid email address.",
  "auth/weak-password":"Password must be at least 6 characters.",
  "auth/network-request-failed":"Network error. Check your connection.",
  "auth/popup-blocked":"Pop-up was blocked. Please allow pop-ups.",
  "auth/account-exists-with-different-credential":"An account exists with this email using a different method.",
};

function TextField({ label, value, onChange, type="text", hint, error, autoFocus, autoComplete }) {
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
      {!error && hint && <div className="field-hint">{hint}</div>}
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

// Drop-in replacement for <input type="time"> — same 24h "HH:MM" value/onChange
// contract, but never invokes the browser's own picker chrome (which on
// Safari/iOS renders as a scrolling wheel; Chrome/Edge render it as a plain
// box — same code, wildly different UX depending on browser). Typing digits
// ("930", "1430") or digits+am/pm ("930pm") both parse; an unparseable entry
// just reverts to the last valid value on blur rather than crashing or left
// half-typed.
function TimeInput({ value, onChange, style }) {
  const to12=(v)=>{
    if(!v)return "";
    const p=v.split(":");const h=+p[0],m=+p[1];
    if(isNaN(h)||isNaN(m))return "";
    const ap=h>=12?"PM":"AM";const h12=h%12||12;
    return h12+":"+String(m).padStart(2,"0")+" "+ap;
  };
  const parse=(str)=>{
    const s=(str||"").trim().toLowerCase();
    if(!s)return null;
    const ap=/pm/.test(s)?"pm":/am/.test(s)?"am":null;
    const digits=s.replace(/[^0-9]/g,"");
    if(!digits)return null;
    let h,m;
    if(digits.length<=2){h=+digits;m=0;}
    else if(digits.length===3){h=+digits.slice(0,1);m=+digits.slice(1);}
    else{h=+digits.slice(0,2);m=+digits.slice(2,4);}
    if(m>59)return null;
    if(ap==="pm"&&h<12)h+=12;
    if(ap==="am"&&h===12)h=0;
    if(h>23||h<0)return null;
    return String(h).padStart(2,"0")+":"+String(m).padStart(2,"0");
  };
  const [draft,setDraft]=useState(()=>to12(value));
  const [focused,setFocused]=useState(false);
  useEffect(()=>{if(!focused)setDraft(to12(value));},[value,focused]);
  const commit=()=>{
    setFocused(false);
    const parsed=parse(draft);
    if(parsed){if(parsed!==value)onChange(parsed);setDraft(to12(parsed));}
    else setDraft(to12(value));
  };
  return (
    <input
      type="text"
      inputMode="numeric"
      placeholder="e.g. 9:30 AM"
      value={draft}
      onFocus={e=>{setFocused(true);e.target.select();}}
      onChange={e=>setDraft(e.target.value)}
      onBlur={commit}
      onKeyDown={e=>{if(e.key==="Enter")e.target.blur();}}
      style={{width:"100%",padding:"10px 12px",background:"var(--card2)",border:"1px solid var(--border)",borderRadius:8,color:"var(--text)",fontSize:13,fontFamily:"inherit",outline:"none",boxSizing:"border-box",...(style||{})}}
    />
  );
}

const STEPS = [
  { name: "Sign up" },{ name: "Basic information" },{ name: "About you" },
  { name: "Goals" },{ name: "Schedule preferences" },{ name: "Workspace preview" },
  { name: "Choose plan" },{ name: "Welcome" },
];

function LeftRail({ step, state }) {
  if (step === 0) {
    return (
      <aside className="rail">
        <div className="brand">
          <div style={{width:34,height:34,borderRadius:8,background:"#9EC83D",display:"grid",placeItems:"center",fontSize:17,fontWeight:800,color:"#14342A"}}>S</div>
          <span className="name">studlin</span>
        </div>
        <div className="rail-icon">{Ic.userPlus}</div>
        <h1>Sign up and lock in.</h1>
        <p className="lead">Sign up is simple, free and fast. One workspace for everything you study, write, and remember.</p>
        <div className="rail-tiles">
          <div className="rail-tile"><div className="ic">{Ic.spark}</div><div className="t">AI tutor on every subject</div><div className="s">Drop a PDF · ask anything</div></div>
          <div className="rail-tile"><div className="ic">{Ic.flame}</div><div className="t">Streaks that keep you going</div><div className="s">Daily momentum, milestones, and Weekly Wrapped</div></div>
          <div className="rail-tile"><div className="ic">{Ic.zap}</div><div className="t">All your tools, one price</div><div className="s">Writing, flashcards, AI tutor, focus timer and more</div></div>
        </div>
      </aside>
    );
  }
  const groups = [{ name: "Sign up", from: 0, to: 0 },{ name: "Basic information", from: 1, to: 5 },{ name: "Confirm email", from: 6, to: 7 }];
  return (
    <aside className="rail">
      <div className="brand">
        <div style={{width:34,height:34,borderRadius:8,background:"#9EC83D",display:"grid",placeItems:"center",fontSize:17,fontWeight:800,color:"#14342A"}}>S</div>
        <span className="name">studlin</span>
      </div>
      <div className="rail-icon">{Ic.userPlus}</div>
      <h1 style={{fontSize:28}}>Create your account in a few clicks.</h1>
      <div className="stepper" style={{marginTop:36}}>
        {groups.map((g,i)=>{
          const done=step>g.to, current=step>=g.from&&step<=g.to;
          return <div key={i} className={"step"+(done?" is-done":"")+(current?" is-current":"")}><span className="dot">{done?Ic.check:i+1}</span><span className="name">{g.name}</span></div>;
        })}
      </div>
      <div className="rail-meta">
        <div className="row" style={{color:"rgba(246,241,230,0.85)"}}>{firebase.auth().currentUser?.email || state.email || "you@studlin.app"}</div>
      </div>
    </aside>
  );
}

function StepSignup({ state, set, advance }) {
  const [mode, setMode] = useState("providers");
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [authError, setAuthError] = useState("");

  const googleSign = () => {
    setAuthError("");setLoading(true);
    if(typeof google==="undefined"||!google.accounts){setAuthError("Google sign-in is still loading. Please try again.");setLoading(false);return;}
    const client = google.accounts.oauth2.initTokenClient({
      client_id:"16831354472-lbsnd5rithhidj57gfh5rqsqvc3cv7as.apps.googleusercontent.com",
      scope:"email profile",
      callback: async (tokenResponse) => {
        if(tokenResponse.error){setAuthError("Google sign-in was cancelled.");setLoading(false);return;}
        try {
          const credential = firebase.auth.GoogleAuthProvider.credential(null, tokenResponse.access_token);
          const result = await firebase.auth().signInWithCredential(credential);
          const u = result.user;
          set(s=>({...s, provider:"google", name:u.displayName||s.name, email:u.email||s.email}));
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
    const errs = {};
    if (!state.name?.trim()) errs.name = "Please enter your full name";
    if (!state.email?.trim()) errs.email = "Please enter your email address";
    else if (!/\S+@\S+\.\S+/.test(state.email)) errs.email = "Please enter a valid email address";
    if (!allOk) errs.password = "Password must be at least 8 characters";
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setAuthError("");setLoading(true);
    try {
      const cred = await firebase.auth().createUserWithEmailAndPassword(state.email, state.password);
      await cred.user.updateProfile({ displayName: state.name.trim() });
      try {
        const token = await cred.user.getIdToken();
        await fetch("/api/send-verification", { method: "POST", headers: { Authorization: "Bearer " + token } });
      } catch(e) {}
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
            <div className="signup-quote">
              <div className="sq-mark">"</div>
              <p>Studlin replaced five different apps I was paying for. My grades went from a 3.1 to a 3.8 in a single semester.</p>
              <div className="sq-by">
                <span className="sq-av">M</span>
                <div className="sq-meta"><strong>Maya</strong><span>Senior · AP Bio &amp; Calculus</span></div>
              </div>
            </div>
            <div className="trust-foot">
              <div className="tf-avatars"><span></span><span></span><span></span><span></span></div>
              Loved by <strong>24,000+</strong> students
            </div>
          </div>
        </>
      )}

      {mode === "email" && (
        <>
          <TextField label="Full name" value={state.name} onChange={v=>set({...state, name:v})} error={errors.name} autoFocus autoComplete="name" />
          <TextField label="Email address" value={state.email} onChange={v=>set({...state, email:v})} hint={errors.email?null:"Any email works — school, Gmail, whatever."} error={errors.email} type="email" autoComplete="email" />
          <TextField label="Create password" value={state.password} onChange={v=>set({...state, password:v})} type="password" autoComplete="new-password" error={errors.password} hint={errors.password?null:"At least 8 characters."} />
          <div style={{marginTop:18}}>
            <button className="provider" onClick={()=>setMode("providers")} style={{padding:"10px 14px",fontSize:13}}>← Use Google instead</button>
          </div>
          <button data-cta="signup" onClick={tryAdvance} style={{display:"none"}}></button>
        </>
      )}
    </div>
  );
}

function StepBasic({ state, set }) {
  const first = (state.name || "").split(" ")[0];
  return (
    <div className="frame">
      <div className="frame-head">
        <h2>{first ? <>Hey <em>{first}</em>, let's personalize.</> : <>Let's <em>personalize</em> Studlin.</>}</h2>
        <p>A few quick questions so we can shape your workspace around you.</p>
      </div>
      <TextField label="What should we call you?" value={state.preferredName} onChange={v=>set({...state, preferredName:v})} hint="We'll greet you with this across the app." autoFocus />
      <SelectField label="Preferred language" value={state.language} onChange={v=>set({...state, language:v})} hint="The interface and AI tutor will speak this." options={["English","Español","Français","Deutsch","Português","हिन्दी","中文","日本語","العربية","Other"]} />
      <SelectField label="How did you hear about Studlin?" value={state.referral} onChange={v=>set({...state, referral:v})} hint="Helps us know what's working · totally optional." options={["TikTok","Instagram","YouTube","A friend or classmate","Reddit","Google search","Product Hunt","My school or teacher","X (Twitter)","Other"]} />
      <SelectField label="What describes you best?" value={state.descriptor} onChange={v=>set({...state, descriptor:v})} hint="Sets your default dashboard layout." options={["I'm cramming for exams","I want to stay organised","I write a lot of essays","I'm building a study habit","I teach or tutor others","Just exploring"]} />
      <label className={"checkbox" + (state.terms ? " is-checked" : "")} onClick={()=>set({...state, terms:!state.terms})}>
        <span className="box">{Ic.check}</span>
        <span>I accept the <a>Terms of Service</a> and <a>Privacy Policy</a>.</span>
      </label>
    </div>
  );
}

function StepRole({ state, set }) {
  const roles = [
    { id:"hs", label:"High school student", desc:"Grades 9 to 12, IB, AP, A-Levels", ic:Ic.cap },
    { id:"uni", label:"University student", desc:"Undergrad, graduate, or PhD", ic:Ic.uni },
    { id:"teacher", label:"Teacher or educator", desc:"Lesson planning and grading support", ic:Ic.teacher },
    { id:"pro", label:"Working professional", desc:"Writing, focus, and productivity", ic:Ic.brief },
    { id:"self", label:"Self-directed learner", desc:"Cert prep, hobby learning, MOOCs", ic:Ic.learn },
  ];
  return (
    <div className="frame">
      <div className="frame-head"><h2>Who are you, <em>really?</em></h2><p>We'll tune the AI tutor's voice and curriculum suggestions to match.</p></div>
      <div className="opt-grid full">
        {roles.map(r=><button key={r.id} className={"opt"+(state.role===r.id?" is-selected":"")} onClick={()=>set({...state, role:r.id})}><span className="ic">{r.ic}</span><span className="body"><span className="lbl">{r.label}</span><span className="desc">{r.desc}</span></span><span className="check">{Ic.check}</span></button>)}
      </div>
    </div>
  );
}

function StepGoals({ state, set }) {
  const goals = [{id:"writing",label:"Writing essays",ic:Ic.pen},{id:"flashcards",label:"Memorising material",ic:Ic.cards},{id:"focus",label:"Staying focused",ic:Ic.clock},{id:"schedule",label:"Planning my week",ic:Ic.cal},{id:"notes",label:"Organising notes",ic:Ic.notes},{id:"all",label:"All of the above",ic:Ic.star}];
  const selected = state.goals||[];
  const toggle = id => { let next; if(id==="all") next=selected.includes("all")?[]:[id]; else next=selected.includes(id)?selected.filter(g=>g!==id):[...selected.filter(g=>g!=="all"),id]; set({...state, goals:next}); };
  return (
    <div className="frame">
      <div className="frame-head"><h2>What do you need <em>help with?</em></h2><p>Pick everything that applies · we'll prioritise these tools first.</p></div>
      <div className="opt-grid">
        {goals.map(g=><button key={g.id} className={"opt"+(selected.includes(g.id)?" is-selected":"")} onClick={()=>toggle(g.id)}><span className="ic">{g.ic}</span><span className="body"><span className="lbl">{g.label}</span></span><span className="check">{Ic.check}</span></button>)}
      </div>
    </div>
  );
}

function StepSchedulePrefs({ state, set }) {
  const handleDiffPref = (val) => set({...state, taskDifficultyPreference: val});
  const handleWorkStart = (val) => set({...state, workStartTime: val});
  const handleWorkEnd = (val) => set({...state, workEndTime: val});
  const handleBedtime = (val) => set({...state, bedtime: val});
  const handleBufferMargin = (val) => set({...state, bufferMarginStrategy: val});

  const diffOptions = [
    {id:"FIRST",label:"Tackle hard tasks first",desc:"Crush the most challenging work when you're fresh"},
    {id:"LAST",label:"Save hard tasks for later",desc:"Build momentum with easier wins first"},
    {id:"NONE",label:"No preference",desc:"Let Studlin decide based on deadlines"},
  ];
  
  const bufferOptions = [
    {id:"NONE",label:"No buffer",desc:"Back-to-back tasks, no padding"},
    {id:"15_MIN",label:"15 min buffer",desc:"Breathing room between tasks"},
    {id:"30_MIN",label:"30 min buffer",desc:"Stretch, grab water, reset focus"},
  ];

  return (
    <div className="frame">
      <div className="frame-head"><h2>How do you study <em>best?</em></h2><p>Let's tune your schedule around how you actually work.</p></div>
      
      <div style={{marginBottom:24}}>
        <div style={{fontSize:12.5,fontWeight:600,color:"var(--text)",marginBottom:10}}>Task difficulty preference</div>
        <div className="opt-grid" style={{gap:10}}>
          {diffOptions.map(o=><button key={o.id} className={"opt small"+(state.taskDifficultyPreference===o.id?" is-selected":"")} onClick={()=>handleDiffPref(o.id)} style={{padding:"12px 14px",textAlign:"left"}}><span className="body" style={{display:"block"}}><span className="lbl" style={{display:"block",fontSize:13,fontWeight:600,marginBottom:3}}>{o.label}</span><span className="desc" style={{display:"block",fontSize:11,color:"var(--muted)"}}>{o.desc}</span></span><span className="check" style={{position:"absolute",right:14,top:"50%",transform:"translateY(-50%)"}}>{Ic.check}</span></button>)}
        </div>
      </div>

      <div style={{marginBottom:24}}>
        <div style={{fontSize:12.5,fontWeight:600,color:"var(--text)",marginBottom:10}}>Peak productivity window</div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
          <div>
            <label style={{fontSize:11,fontWeight:600,textTransform:"uppercase",color:"var(--muted)",display:"block",marginBottom:6}}>Start time</label>
            <TimeInput value={state.workStartTime||"10:00"} onChange={handleWorkStart} />
          </div>
          <div>
            <label style={{fontSize:11,fontWeight:600,textTransform:"uppercase",color:"var(--muted)",display:"block",marginBottom:6}}>End time</label>
            <TimeInput value={state.workEndTime||"18:00"} onChange={handleWorkEnd} />
          </div>
        </div>
      </div>

      <div style={{marginBottom:24}}>
        <div style={{fontSize:12.5,fontWeight:600,color:"var(--text)",marginBottom:10}}>Sleep schedule</div>
        <div>
          <label style={{fontSize:11,fontWeight:600,textTransform:"uppercase",color:"var(--muted)",display:"block",marginBottom:6}}>Bedtime</label>
          <TimeInput value={state.bedtime||"23:00"} onChange={handleBedtime} style={{maxWidth:180}} />
        </div>
      </div>

      <div>
        <div style={{fontSize:12.5,fontWeight:600,color:"var(--text)",marginBottom:10}}>Buffer margin strategy</div>
        <div className="opt-grid" style={{gap:10}}>
          {bufferOptions.map(o=><button key={o.id} className={"opt small"+(state.bufferMarginStrategy===o.id?" is-selected":"")} onClick={()=>handleBufferMargin(o.id)} style={{padding:"12px 14px",textAlign:"left"}}><span className="body" style={{display:"block"}}><span className="lbl" style={{display:"block",fontSize:13,fontWeight:600,marginBottom:3}}>{o.label}</span><span className="desc" style={{display:"block",fontSize:11,color:"var(--muted)"}}>{o.desc}</span></span><span className="check" style={{position:"absolute",right:14,top:"50%",transform:"translateY(-50%)"}}>{Ic.check}</span></button>)}
        </div>
      </div>
    </div>
  );
}

function StepPreview({ state }) {
  const first = (state.name||"you").split(" ")[0];
  const goalsLabel = (state.goals||[]).length===0?"everything":state.goals.includes("all")?"every Studlin tool":state.goals.length===1?state.goals[0]:state.goals.length+" areas";
  const focusTarget = state.load==="under1"?"30m":state.load==="1to3"?"2h":state.load==="3to5"?"4h":"6h";
  return (
    <div className="frame">
      <div className="frame-head"><h2>Hey <em>{first}.</em> Here's your space.</h2><p>Personalised based on what you just told us. Tweak anything in Settings later.</p></div>
      <div className="preview">
        <div className="preview-row">
          <div className="preview-tile lime"><div className="pt-label">DAILY FOCUS</div><div className="pt-value">{focusTarget}</div><div className="pt-sub">From your study load</div></div>
          <div className="preview-tile"><div className="pt-label">PRIMARY GOAL</div><div className="pt-value" style={{fontSize:18,fontFamily:"Geist,sans-serif",fontWeight:600}}>{goalsLabel}</div><div className="pt-sub">Pinned to dashboard</div></div>
          <div className="preview-tile"><div className="pt-label">STREAK</div><div className="pt-value">0</div><div className="pt-sub">Starts today</div></div>
        </div>
        <div className="preview-row" style={{gridTemplateColumns:"1fr"}}>
          <div className="preview-tile" style={{padding:"14px 16px",background:"white"}}>
            <div className="pt-label" style={{marginBottom:8}}>TUTOR VOICE</div>
            <div style={{fontSize:13.5,color:"var(--ink)",lineHeight:1.55}}>
              {state.role==="hs"&&"Encouraging. Breaks topics down step by step. Uses analogies and worked examples."}
              {state.role==="uni"&&"Socratic. Citation-aware. Calibrated to advanced coursework and seminar discussion."}
              {state.role==="teacher"&&"Direct. Curriculum-aware. Includes rubric, pedagogy notes, and lesson plans."}
              {state.role==="pro"&&"Concise. Professional register. Optimised for deliverables and tight deadlines."}
              {state.role==="self"&&"Patient. Builds from fundamentals. Suggests learning paths and milestone checks."}
              {!state.role&&"Balanced and adaptive · personalised once you pick your role."}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StepPlan({ state, set }) {
  const annual = state.billing!=="monthly";
  const first = (state.preferredName||state.name||"you").split(" ")[0];
  return (
    <div className="frame">
      <div className="frame-head"><h2>Unlock your full <em>potential.</em></h2><p>{first}, students on Pro study 2.4× more and report a full letter-grade jump. Try it free for 7 days.</p></div>
      <div className="bill-toggle">
        <button className={!annual?"on":""} onClick={()=>set({...state, billing:"monthly"})}>Monthly</button>
        <button className={annual?"on":""} onClick={()=>set({...state, billing:"annual"})}>Annual <span className="save">Save 25%</span></button>
      </div>
      <div className="plans">
        <button className={"plan"+(state.plan==="pro"?" is-selected":"")} onClick={()=>set({...state, plan:"pro"})}>
          <span className="plan-tag">7 DAYS FREE</span>
          <h3>Pro</h3>
          {annual
            ? <div className="pp"><strong>$95.88</strong> / year<br/><span style={{fontSize:12,color:"var(--muted)"}}>That's just $7.99/mo</span></div>
            : <div className="pp"><strong>$9.99</strong> / month</div>
          }
          <ul>
            <li><span className="ck">{Ic.check}</span> 200 AI credits / month</li>
            <li><span className="ck">{Ic.check}</span> AI tutor — all models</li>
            <li><span className="ck">{Ic.check}</span> Full essay suite + AI Humanizer</li>
            <li><span className="ck">{Ic.check}</span> AI flashcards from any file</li>
            <li><span className="ck">{Ic.check}</span> Smart calendar & Weekly Wrapped</li>
          </ul>
        </button>
        <button className={"plan"+(state.plan==="max"?" is-selected":"")} onClick={()=>set({...state, plan:"max"})}>
          <span className="plan-tag dark">BEST VALUE</span>
          <h3>Max</h3>
          {annual
            ? <div className="pp"><strong>$239.88</strong> / year<br/><span style={{fontSize:12,color:"var(--muted)"}}>That's just $19.99/mo</span></div>
            : <div className="pp"><strong>$24.99</strong> / month</div>
          }
          <ul>
            <li><span className="ck">{Ic.check}</span> 500 AI credits / month</li>
            <li><span className="ck">{Ic.check}</span> Everything in Pro</li>
            <li><span className="ck">{Ic.check}</span> Advanced analytics & learning paths</li>
            <li><span className="ck">{Ic.check}</span> Priority support + 3× focus XP</li>
            <li><span className="ck">{Ic.check}</span> Cosmetics shop + tournaments</li>
          </ul>
        </button>
      </div>
      <div className="paywall-foot">
        <button className="pw-skip" onClick={()=>set({...state, plan:"free"})}>{state.plan==="free"?"✓ Continuing on the free plan":"Maybe later · continue with limited free plan"}</button>
      </div>
    </div>
  );
}

const TUT_TASKS=[
  {id:"dash",text:"Open your personalised dashboard",xp:5,cap:"Your whole day, planned before you sit down."},
  {id:"focus",text:"Start your first 25-minute focus session",xp:10,cap:"One tap. Phone away. Totally locked in."},
  {id:"cards",text:"Drop a PDF and generate flashcards",xp:10,cap:"Any file becomes a deck in seconds."},
  {id:"tutor",text:"Ask the AI tutor your first question",xp:5,cap:"It walks you through it, step by step."},
  {id:"streak",text:"Complete your first day streak",xp:10,cap:"Show up today. Future you says thanks."},
];

function useRun(){const[on,setOn]=useState(false);useEffect(()=>{const id=setTimeout(()=>setOn(true),60);return()=>clearTimeout(id);},[]);return on;}

const FlameIc=<svg viewBox="0 0 24 24" width="44" height="44" fill="currentColor"><path d="M12 2c1.2 3.9-2.8 5.6-2.8 9a2.8 2.8 0 0 0 5.6 0c0-1.4-.6-2.5-1.3-3.4C16.2 8.7 18.5 10.9 18.5 14a6.5 6.5 0 0 1-13 0C5.5 9 10.4 6.8 12 2z"/></svg>;

function Demo({kind}){
  const on=useRun();const cls="demo"+(on?" on":"");
  if(kind==="dash")return(<div className={cls}><div className="dm-window"><div className="dm-greet"><span className="dm-hi">Good morning</span><span className="dm-pill">3 tasks today</span></div><div className="dm-grid"><div className="dm-tile t1"><div className="dm-tlab">Focus</div><i className="dm-spark"></i></div><div className="dm-tile t2"><div className="dm-tlab">Streak</div><div className="dm-big">12</div></div><div className="dm-tile t3"><div className="dm-tlab">This week</div><i className="dm-bars"><b></b><b></b><b></b><b></b><b></b></i></div></div></div></div>);
  if(kind==="focus")return(<div className={cls}><div className="dm-focus"><svg viewBox="0 0 120 120" className="dm-timer"><circle cx="60" cy="60" r="52" className="track"></circle><circle cx="60" cy="60" r="52" className="prog"></circle></svg><div className="dm-mid"><div className="dm-time">25:00</div><div className="dm-lab">LOCKED IN</div></div></div></div>);
  if(kind==="cards")return(<div className={cls}><div className="dm-doc"><span>notes.pdf</span></div><div className="dm-fan"><div className="dm-card c1">What is osmosis?</div><div className="dm-card c2">Define entropy</div><div className="dm-card c3">Mitosis vs meiosis?</div></div></div>);
  if(kind==="tutor")return(<div className={cls}><div className="dm-chat"><div className="dm-bub me">Why does ice float?</div><div className="dm-bub ai"><span className="dm-dots"><i></i><i></i><i></i></span><span className="dm-ans">Water expands as it freezes, so ice is less dense than liquid water. Less dense floats.</span></div></div></div>);
  return(<div className={cls}><div className="dm-streak"><div className="dm-flame">{FlameIc}</div><div className="dm-days">{["M","T","W","T","F","S","S"].map((d,i)=><span key={i} className="dm-day" style={{transitionDelay:(0.3+i*0.18)+"s"}}>{d}</span>)}</div><div className="dm-dlab">Day 1 · started</div></div></div>);
}

function TutTheater({task,onFinish}){
  const on=useRun();
  return(<div className={"tut-veil"+(on?" on":"")} onClick={onFinish}><div className="tut-stage" onClick={e=>e.stopPropagation()}><Demo kind={task.id} key={task.id} /><div className="tut-cap">{task.cap}</div><div className="tut-bar"><i></i></div><button className="tut-skip" onClick={onFinish}>Got it · collect +{task.xp} XP</button></div></div>);
}

function StepWelcome({ state }) {
  const [done,setDone]=useState({});
  const [active,setActive]=useState(null);
  const [justEarned,setJustEarned]=useState(null);
  const timerRef=useRef(null);
  const first=(state.preferredName||state.name||"there").split(" ")[0];
  const max=TUT_TASKS.reduce((s,t)=>s+t.xp,0);
  const total=TUT_TASKS.reduce((s,t)=>s+(done[t.id]?t.xp:0),0);
  const allDone=TUT_TASKS.every(t=>done[t.id]);

  const finish=(t)=>{clearTimeout(timerRef.current);setActive(null);setDone(d=>({...d,[t.id]:true}));setJustEarned(t.id);setTimeout(()=>setJustEarned(null),1100);};
  const open=(t)=>{if(done[t.id])return;setActive(t);clearTimeout(timerRef.current);timerRef.current=setTimeout(()=>finish(t),4000);};
  useEffect(()=>()=>clearTimeout(timerRef.current),[]);

  return (
    <div className="frame">
      <div className="celebrate">
        <div className="celebrate-glyph"><div style={{width:56,height:56,borderRadius:12,background:"#9EC83D",display:"grid",placeItems:"center",fontSize:28,fontWeight:800,color:"#14342A"}}>S</div></div>
        <h2 style={{fontSize:32,margin:"0 0 8px",letterSpacing:"-0.025em",fontWeight:600}}>You're in, <em style={{fontFamily:"Instrument Serif,serif",fontStyle:"italic",color:"var(--lime-dk)",fontWeight:400}}>{first}.</em></h2>
        <p style={{fontSize:15,color:"var(--muted)",margin:"0 auto",maxWidth:440,lineHeight:1.55}}>Tap each one to see how it works · finish all five to unlock a 40 XP bonus and start your streak.</p>
      </div>
      <div className="checklist">
        {TUT_TASKS.map(t=>(
          <div key={t.id} className={"cl-item"+(done[t.id]?" done":"")} onClick={()=>open(t)}>
            <span className="box">{Ic.check}</span>
            <span className="text">{t.text}</span>
            {!done[t.id]&&<span className="cl-play">Watch<svg viewBox="0 0 24 24" width="11" height="11" fill="currentColor"><path d="M8 5v14l11-7z"/></svg></span>}
            <span className={"reward"+(justEarned===t.id?" pop":"")}>+{t.xp} XP</span>
          </div>
        ))}
      </div>
      <div className="xp-foot">
        {allDone?(<div className="bonus-banner">Bonus unlocked · +40 XP · streak started</div>):(<><div className="xp-row"><span>Today's XP</span><strong>{total} / {max}</strong></div><div className="xp-track"><i style={{width:(total/max*100)+"%"}}></i></div></>)}
      </div>
      {active&&<TutTheater task={active} onFinish={()=>finish(active)} />}
    </div>
  );
}

function App() {
  const [step, setStep] = useState(()=>{
    if(firebase.auth().currentUser){const s=JSON.parse(localStorage.getItem("studlin-onboarding")||"null");return s&&s._step?s._step:1;}
    return 0;
  });
  const [state, setState] = useState(() => {
    try { const saved = JSON.parse(localStorage.getItem("studlin-onboarding")||"null"); if (saved && typeof saved === "object") return {goals:[],plan:"pro",...saved}; } catch(e){}
    return { goals: [], plan: "pro" };
  });

  useEffect(()=>{
    return firebase.auth().onAuthStateChanged(u=>{
      if(u) setStep(prev=>prev<1?1:prev);
    });
  },[]);

  useEffect(()=>{
    try {
      const { password, ...safe } = state;
      localStorage.setItem("studlin-onboarding", JSON.stringify({ ...safe, _step:step, _updatedAt: new Date().toISOString() }));
    } catch(e){}
  }, [state, step]);

  const isStepValid = () => {
    if (step === 0) { return !!firebase.auth().currentUser || !!(state.provider) || !!(state.name && state.email && (state.password||"").length >= 8); }
    if (step === 1) return !!(state.preferredName && state.language && state.descriptor && state.terms);
    if (step === 2) return !!state.role;
    if (step === 3) return (state.goals||[]).length > 0;
    if (step === 4) return !!(state.taskDifficultyPreference && state.workStartTime && state.workEndTime && state.bedtime && state.bufferMarginStrategy);
    if (step === 5) return true;
    if (step === 6) return !!state.plan;
    return true;
  };

  const [transitioning, setTransitioning] = useState(false);
  const [paywallRevealed, setPaywallRevealed] = useState(false);

  const next = () => {
    if (!isStepValid()) return;
    const nextStep = Math.min(STEPS.length-1, step+1);
    if (nextStep === 6) {
      setTransitioning(true);
      setTimeout(() => { setStep(nextStep); setTransitioning(false); setTimeout(() => setPaywallRevealed(true), 50); }, 400);
    } else {
      setTransitioning(true);
      setTimeout(() => { setStep(nextStep); setTransitioning(false); }, 250);
    }
  };
  const back = () => { setTransitioning(true); setPaywallRevealed(false); setTimeout(() => { setStep(s => Math.max(0, s-1)); setTransitioning(false); }, 250); };

  useEffect(()=>{
    const fn = e => { if (e.key === "Enter" && step < STEPS.length-1) next(); if (e.key === "Escape" && step > 0) back(); };
    window.addEventListener("keydown", fn);
    return ()=>window.removeEventListener("keydown", fn);
  });

  const handleCheckout = () => {
    if (state.plan === "free") { next(); return; }
    const billing = state.billing === "monthly" ? "monthly" : "annual";
    window.location.href = "checkout.html?plan=" + state.plan + "&billing=" + billing;
  };

  const CTA_LABEL = ["Sign up for free","Continue","Continue","Continue","Continue","Looks good",(state.plan==="free"?"Continue with free plan":"Start 7-day free trial"),"Enter Studlin"][step];
  const isPaywall = step === 6;

  return (
    <div className={"shell" + (isPaywall ? " paywall-mode" : "")}>
      {!isPaywall && <LeftRail step={step} state={state} />}
      <main className={"stage" + (isPaywall ? " paywall-stage" : "") + (paywallRevealed ? " paywall-revealed" : "")}>
        <div className="stage-top">
          {step === 0 ? <>Already have an account? <a href="Studlin Sign In.html">Log in</a></> :
            <span style={{color:"var(--muted)",fontSize:13}}>Step {Math.min(step+1,7)} of 7</span>}
        </div>
        <div className={"step-content" + (transitioning ? " is-leaving" : " is-entering")}>
          {step === 0 && <StepSignup state={state} set={setState} advance={(skip)=>{ if(skip||isStepValid()){ setTransitioning(true); setTimeout(()=>{ setStep(s=>Math.min(STEPS.length-1,s+1)); setTransitioning(false); },250); }}} />}
          {step === 1 && <StepBasic state={state} set={setState} />}
          {step === 2 && <StepRole state={state} set={setState} />}
          {step === 3 && <StepGoals state={state} set={setState} />}
          {step === 4 && <StepSchedulePrefs state={state} set={setState} />}
          {step === 5 && <StepPreview state={state} />}
          {step === 6 && <StepPlan state={state} set={setState} />}
          {step === 7 && <StepWelcome state={state} />}
        </div>
        <div className="stage-foot">
          {step < STEPS.length-1 ? (
            <button className="cta" disabled={!isStepValid()} onClick={()=>{
              if(step===0&&!firebase.auth().currentUser){
                const btn=document.querySelector('[data-cta="signup"]');
                if(btn){btn.click();return;}
              }
              if(step===6){handleCheckout();return;}
              next();
            }}>
              {CTA_LABEL}<span className="arrow">{Ic.arrow}</span>
            </button>
          ) : (
            <a className="cta lime" href="Studlin Web App.html">Enter Studlin<span className="arrow">{Ic.arrow}</span></a>
          )}
          {step === 0 && <div className="stage-links"><a href="#">Privacy Policy</a> · <a href="#">Terms of Service</a></div>}
          {step > 0 && step < STEPS.length-1 && <div style={{marginTop:14}}><button onClick={back} style={{background:"transparent",border:"none",color:"var(--muted)",fontSize:13,cursor:"pointer",fontFamily:"inherit"}}>← Back</button></div>}
        </div>
      </main>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
