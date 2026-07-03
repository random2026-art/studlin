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

// Curated, real, verifiable list of well-known universities — not an
// exhaustive accredited-institution database (no source of truth for that
// exists here), just enough to cover most signups with genuine schools so
// "verified" grouping data isn't fabricated. "My school isn't listed" is
// the escape hatch for everyone else.
const UNIVERSITIES = [
  "Harvard University","Yale University","Princeton University","Columbia University","University of Pennsylvania","Brown University","Cornell University","Dartmouth College",
  "Stanford University","Massachusetts Institute of Technology","California Institute of Technology","Duke University","Northwestern University","Vanderbilt University","Georgetown University","New York University","University of Southern California","Boston University","Boston College","Northeastern University","Carnegie Mellon University","Johns Hopkins University","Rice University","Emory University","Tufts University","Wake Forest University","Washington University in St. Louis","University of Notre Dame","University of Chicago","University of Rochester","Case Western Reserve University","Tulane University","Syracuse University","Fordham University",
  "University of California, Berkeley","University of California, Los Angeles","University of California, San Diego","University of California, Davis","University of California, Irvine","University of California, Santa Barbara","University of California, Santa Cruz","University of California, Riverside","University of California, Merced",
  "University of Michigan","University of Virginia","University of North Carolina at Chapel Hill","University of Florida","University of Texas at Austin","University of Wisconsin-Madison","University of Illinois Urbana-Champaign","University of Washington","Ohio State University","Pennsylvania State University","University of Georgia","University of Maryland, College Park","Rutgers University","Indiana University Bloomington","University of Minnesota","Purdue University","Michigan State University","University of Iowa","University of Colorado Boulder","University of Arizona","Arizona State University","University of Utah","University of Oregon","Oregon State University","Washington State University","University of Connecticut","University of Massachusetts Amherst","University of Delaware","University of Pittsburgh","Temple University","Virginia Tech","North Carolina State University","Clemson University","University of South Carolina","Auburn University","University of Alabama","University of Tennessee","University of Kentucky","University of Missouri","University of Kansas","University of Nebraska-Lincoln","Iowa State University","University of Oklahoma","Oklahoma State University","Texas A&M University","Baylor University","Southern Methodist University","Texas Christian University","University of Houston","University of Miami","Florida State University","University of Central Florida","Georgia Institute of Technology","University of Colorado Denver","Colorado State University","University of Nevada, Las Vegas","University of Hawaii at Manoa",
  "Brigham Young University","University of Denver","San Diego State University","San Jose State University","California Polytechnic State University","University of San Francisco","Santa Clara University","Loyola Marymount University","Pepperdine University","Chapman University",
  "Howard University","Morehouse College","Spelman College","Amherst College","Williams College","Swarthmore College","Wellesley College","Bowdoin College","Middlebury College","Colby College","Vassar College","Smith College","Hamilton College","Colgate University","Bates College","Bucknell University","Lehigh University","Villanova University","Lafayette College",
  "University of Toronto","University of British Columbia","McGill University","University of Waterloo","University of Alberta","McMaster University","Queen's University","University of Montreal","University of Ottawa","Simon Fraser University",
  "University of Oxford","University of Cambridge","Imperial College London","London School of Economics","University College London","King's College London","University of Edinburgh","University of Manchester","University of Bristol","University of Warwick","University of St Andrews","University of Glasgow",
  "University of Melbourne","University of Sydney","Australian National University","University of Queensland","Monash University","University of New South Wales","University of Auckland",
];

function AutocompleteField({ label, options, value, otherValue, onSelect, onOtherChange, hint, error }) {
  const [query, setQuery] = useState(value || "");
  const [open, setOpen] = useState(false);
  const [isOther, setIsOther] = useState(!!otherValue && !value);
  const wrapRef = useRef(null);
  useEffect(()=>{ if(!isOther) setQuery(value||""); }, [value, isOther]);
  useEffect(()=>{
    const onDocClick = e => { if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", onDocClick);
    return ()=>document.removeEventListener("mousedown", onDocClick);
  }, []);
  const filtered = (query.trim()
    ? options.filter(o=>o.toLowerCase().includes(query.trim().toLowerCase()))
    : options
  ).slice(0,8);
  const selectOption = (opt) => { setQuery(opt); onSelect(opt); setOpen(false); };
  const useOther = () => { setIsOther(true); setOpen(false); onSelect(""); };
  const backToList = () => { setIsOther(false); setQuery(""); onOtherChange(""); };
  return (
    <div className="field" ref={wrapRef} style={{position:"relative"}}>
      <div className={"input-wrap" + ((value||otherValue)?" has-value":"") + (open?" is-focused":"") + (error?" has-error":"")}>
        <label>{label}</label>
        {isOther ? (
          <input value={otherValue||""} onChange={e=>onOtherChange(e.target.value)} autoFocus />
        ) : (
          <input value={query} onChange={e=>{setQuery(e.target.value);setOpen(true);if(value)onSelect("");}} onFocus={()=>setOpen(true)} />
        )}
      </div>
      {isOther && <button type="button" onClick={backToList} style={{marginTop:6,background:"none",border:"none",color:"var(--muted)",fontSize:12,cursor:"pointer",textDecoration:"underline",padding:0}}>← Search the list instead</button>}
      {open && !isOther && (
        <div style={{position:"absolute",top:"100%",left:0,right:0,zIndex:20,marginTop:4,background:"var(--card)",border:"1px solid var(--border)",borderRadius:10,maxHeight:220,overflowY:"auto",boxShadow:"0 12px 32px -8px rgba(0,0,0,0.25)"}}>
          {filtered.map(o=>(
            <div key={o} onMouseDown={()=>selectOption(o)} style={{padding:"10px 14px",fontSize:13,cursor:"pointer",color:"var(--text)"}}>{o}</div>
          ))}
          {filtered.length===0 && <div style={{padding:"10px 14px",fontSize:12,color:"var(--muted)"}}>No matches — try another spelling, or:</div>}
          <div onMouseDown={useOther} style={{padding:"10px 14px",fontSize:13,cursor:"pointer",color:"var(--muted)",borderTop:"1px solid var(--border)"}}>My school isn't listed</div>
        </div>
      )}
      {error && <div className="field-error">{error}</div>}
      {!error && hint && <div className="field-hint">{hint}</div>}
    </div>
  );
}

// Custom Hour / Minute / AM-PM dropdown trio — mobile-friendly native
// <select> controls, no typing required. Same 24h "HH:MM" value/onChange
// contract as before, so every call site is unaffected.
const TIME_HOURS_12=Array.from({length:12},(_,i)=>i+1);
const TIME_MINUTES_5=Array.from({length:12},(_,i)=>i*5);
function TimeInput({ value, onChange, style }) {
  let h=9,m=0,ap="AM";
  if(value){
    const [hStr,mStr]=value.split(":");
    const hh=parseInt(hStr,10),mm=parseInt(mStr,10);
    if(!isNaN(hh)&&!isNaN(mm)){
      ap=hh>=12?"PM":"AM";
      h=hh%12||12;
      m=Math.round(mm/5)*5%60;
    }
  }
  const commit=(nextH,nextM,nextAp)=>{
    let hh=nextH%12;
    if(nextAp==="PM")hh+=12;
    onChange(String(hh).padStart(2,"0")+":"+String(nextM).padStart(2,"0"));
  };
  const selStyle={flex:1,minWidth:0,padding:"10px 8px",background:"var(--card2)",border:"1px solid var(--border)",borderRadius:8,color:"var(--text)",fontSize:13,fontFamily:"inherit",outline:"none",cursor:"pointer",boxSizing:"border-box"};
  return (
    <div style={{display:"flex",gap:6,alignItems:"center",...(style||{})}}>
      <select value={h} onChange={e=>commit(+e.target.value,m,ap)} style={selStyle}>
        {TIME_HOURS_12.map(x=><option key={x} value={x}>{x}</option>)}
      </select>
      <span style={{color:"var(--muted)",flexShrink:0}}>:</span>
      <select value={m} onChange={e=>commit(h,+e.target.value,ap)} style={selStyle}>
        {TIME_MINUTES_5.map(x=><option key={x} value={x}>{String(x).padStart(2,"0")}</option>)}
      </select>
      <select value={ap} onChange={e=>commit(h,m,e.target.value)} style={selStyle}>
        <option value="AM">AM</option>
        <option value="PM">PM</option>
      </select>
    </div>
  );
}

const STEPS = [
  { name: "Sign up" },{ name: "Study Setup" },
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
  const groups = [{ name: "Sign up", from: 0, to: 0 },{ name: "Study Setup", from: 1, to: 1 }];
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

  // Required regardless of auth method — checked before either Google OAuth
  // or email account-creation is allowed to actually run, so both paths end
  // up with a verified school and accepted terms.
  const checkIdentityFields = () => {
    const errs = {};
    if (!state.university && !(state.universityOther||"").trim()) errs.university = "Select your school, or choose “My school isn't listed.”";
    if (!state.terms) errs.terms = "You need to accept the Terms of Service and Privacy Policy to continue.";
    return errs;
  };

  const googleSign = () => {
    const idErrs = checkIdentityFields();
    if (Object.keys(idErrs).length > 0) { setErrors(idErrs); return; }
    setErrors({});setAuthError("");setLoading(true);
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
    const errs = checkIdentityFields();
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
      try { await cred.user.sendEmailVerification(); } catch(e) {}
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

      <AutocompleteField
        label="Your university or school"
        options={UNIVERSITIES}
        value={state.university}
        otherValue={state.universityOther}
        onSelect={v=>set({...state, university:v, universityOther:""})}
        onOtherChange={v=>set({...state, university:"", universityOther:v})}
        hint={errors.university?null:"Verified schools get grouped into real leaderboards with actual classmates."}
        error={errors.university}
      />
      <label className={"checkbox" + (state.terms ? " is-checked" : "")} onClick={()=>set({...state, terms:!state.terms})} style={{marginBottom:18}}>
        <span className="box">{Ic.check}</span>
        <span>I accept the <a>Terms of Service</a> and <a>Privacy Policy</a>.</span>
      </label>
      {errors.terms && <div className="field-error" style={{marginTop:-12,marginBottom:14}}>{errors.terms}</div>}

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

function StepSchedulePrefs({ state, set }) {
  const handleWorkStart = (val) => set({...state, workStartTime: val});
  const handleWorkEnd = (val) => set({...state, workEndTime: val});

  return (
    <div className="frame">
      <div className="frame-head"><h2>Tune the <em>scheduling algorithm.</em></h2><p>This is the only time you'll set this — Studlin uses it to place every AI-scheduled focus block from here on.</p></div>

      <div>
        <div style={{fontSize:12.5,fontWeight:600,color:"var(--text)",marginBottom:10}}>Peak study window</div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
          <div>
            <label style={{fontSize:11,fontWeight:600,textTransform:"uppercase",color:"var(--muted)",display:"block",marginBottom:6}}>Peak study start time</label>
            <TimeInput value={state.workStartTime||"10:00"} onChange={handleWorkStart} />
          </div>
          <div>
            <label style={{fontSize:11,fontWeight:600,textTransform:"uppercase",color:"var(--muted)",display:"block",marginBottom:6}}>Peak study end time</label>
            <TimeInput value={state.workEndTime||"18:00"} onChange={handleWorkEnd} />
          </div>
        </div>
      </div>
    </div>
  );
}

function App() {
  const [step, setStep] = useState(()=>{
    if(firebase.auth().currentUser){const s=JSON.parse(localStorage.getItem("studlin-onboarding")||"null");return s&&s._step?s._step:1;}
    return 0;
  });
  // workStartTime/workEndTime need real values in state from the start, not
  // just display defaults inside StepSchedulePrefs — isStepValid() checks
  // state directly, so without these the "Continue" CTA on Study Setup would
  // stay disabled until the user touched every field, even though the UI
  // already shows filled-in-looking values.
  const SCHEDULE_DEFAULTS = { workStartTime:"10:00", workEndTime:"18:00" };
  const [state, setState] = useState(() => {
    try { const saved = JSON.parse(localStorage.getItem("studlin-onboarding")||"null"); if (saved && typeof saved === "object") return {goals:[],plan:"pro",...SCHEDULE_DEFAULTS,...saved}; } catch(e){}
    return { goals: [], plan: "pro", ...SCHEDULE_DEFAULTS };
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
    if (step === 0) {
      const identityOk = !!(state.university || (state.universityOther||"").trim()) && !!state.terms;
      return identityOk && (!!firebase.auth().currentUser || !!(state.provider) || !!(state.name && state.email && (state.password||"").length >= 8));
    }
    if (step === 1) return !!(state.workStartTime && state.workEndTime);
    return true;
  };

  const [transitioning, setTransitioning] = useState(false);
  const [finishing, setFinishing] = useState(false);

  const next = () => {
    if (!isStepValid()) return;
    const nextStep = Math.min(STEPS.length-1, step+1);
    setTransitioning(true);
    setTimeout(() => { setStep(nextStep); setTransitioning(false); }, 250);
  };
  const back = () => { setTransitioning(true); setTimeout(() => { setStep(s => Math.max(0, s-1)); setTransitioning(false); }, 250); };

  // The real "hand off to the app" step — saves everything collected across
  // both steps straight to the authenticated user's Firestore doc (this
  // wizard never wrote to Firestore before; it only cached progress in
  // localStorage), seeds the same localStorage key the main app's
  // getSchedulePreferences() reads so scheduling works instantly with no
  // Firestore round-trip, and sets the flag the main app's own separate
  // first-run wizard (InitWizard) checks — otherwise a user who just
  // finished this flow would immediately be asked most of the same
  // questions again on landing in the app.
  const finishOnboarding = async () => {
    if (!isStepValid() || finishing) return;
    setFinishing(true);
    const prefs = {
      workStartTime: state.workStartTime || "10:00",
      workEndTime: state.workEndTime || "18:00",
      taskDifficultyPreference: "NONE",
      bufferMarginStrategy: "15_MIN",
    };
    try { localStorage.setItem("studlin-schedulePrefs", JSON.stringify(prefs)); } catch(e){}
    try { localStorage.setItem("studlin-onboarded", "true"); } catch(e){}
    try { localStorage.setItem("studlin-pendingTour", JSON.stringify("calendar")); } catch(e){}
    try { localStorage.removeItem("studlin-onboarding"); } catch(e){}
    const u = firebase.auth().currentUser;
    if (u) {
      try {
        await firebase.firestore().collection('users').doc(u.uid).set({
          school: state.university || state.universityOther || "",
          ...prefs,
          onboarded: true,
          updatedAt: new Date().toISOString(),
        }, { merge: true });
      } catch(e) {}
    }
    window.location.href = "Studlin Web App.html";
  };

  useEffect(()=>{
    const fn = e => {
      if (e.key === "Enter") { if (step < STEPS.length-1) next(); else finishOnboarding(); }
      if (e.key === "Escape" && step > 0) back();
    };
    window.addEventListener("keydown", fn);
    return ()=>window.removeEventListener("keydown", fn);
  });

  const CTA_LABEL = ["Sign up for free","Continue"][step];

  return (
    <div className="shell">
      <LeftRail step={step} state={state} />
      <main className="stage">
        <div className="stage-top">
          {step > 0 && <span style={{color:"var(--muted)",fontSize:13}}>Step {step+1} of {STEPS.length}</span>}
        </div>
        <div className={"step-content" + (transitioning ? " is-leaving" : " is-entering")}>
          {step === 0 && <StepSignup state={state} set={setState} advance={(skip)=>{ if(skip||isStepValid()){ setTransitioning(true); setTimeout(()=>{ setStep(s=>Math.min(STEPS.length-1,s+1)); setTransitioning(false); },250); }}} />}
          {step === 1 && <StepSchedulePrefs state={state} set={setState} />}
        </div>
        <div className="stage-foot">
          <button className="cta" disabled={!isStepValid()||finishing} onClick={()=>{
            if(step===0&&!firebase.auth().currentUser){
              const btn=document.querySelector('[data-cta="signup"]');
              if(btn){btn.click();return;}
            }
            if(step===STEPS.length-1){finishOnboarding();return;}
            next();
          }}>
            {finishing?"Setting up...":CTA_LABEL}<span className="arrow">{Ic.arrow}</span>
          </button>
          {step === 0 && <div className="stage-links"><a href="#">Privacy Policy</a> · <a href="#">Terms of Service</a></div>}
          {step === 0 && <div style={{marginTop:16,textAlign:"center",fontSize:13,color:"var(--muted)"}}>Already have an account? <a href="Studlin Sign In.html">Log in</a></div>}
          {step > 0 && <div style={{marginTop:14}}><button onClick={back} style={{background:"transparent",border:"none",color:"var(--muted)",fontSize:13,cursor:"pointer",fontFamily:"inherit"}}>← Back</button></div>}
        </div>
      </main>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
