const { useState } = React;

const Ic = {
  google: <svg width="18" height="18" viewBox="0 0 18 18"><path fill="#4285F4" d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84c-.21 1.13-.84 2.08-1.79 2.72v2.26h2.9c1.7-1.56 2.69-3.87 2.69-6.62z"/><path fill="#34A853" d="M9 18c2.43 0 4.47-.8 5.95-2.18l-2.9-2.26c-.8.54-1.83.86-3.05.86-2.35 0-4.34-1.59-5.05-3.72H.96v2.33A8.997 8.997 0 0 0 9 18z"/><path fill="#FBBC05" d="M3.95 10.7c-.18-.54-.28-1.12-.28-1.7s.1-1.16.28-1.7V4.97H.96A8.996 8.996 0 0 0 0 9c0 1.45.35 2.82.96 4.03L3.95 10.7z"/><path fill="#EA4335" d="M9 3.58c1.32 0 2.51.45 3.44 1.35l2.58-2.58C13.46.89 11.43 0 9 0 5.48 0 2.44 2.02.96 4.97L3.95 7.3C4.66 5.17 6.65 3.58 9 3.58z"/></svg>,
  apple: <svg width="18" height="18" viewBox="0 0 18 18" fill="currentColor"><path d="M14.7 9.6c0-2.4 2-3.6 2.1-3.6-1.1-1.7-2.9-1.9-3.5-1.9-1.5-.2-2.9.9-3.7.9-.8 0-1.9-.9-3.2-.8-1.6 0-3.2 1-4 2.5-1.7 3-.4 7.4 1.2 9.8.8 1.2 1.8 2.5 3 2.4 1.2 0 1.7-.8 3.1-.8s1.9.8 3.2.7c1.3 0 2.2-1.2 3-2.4.9-1.4 1.3-2.7 1.4-2.8-.1 0-2.7-1-2.6-4zm-2.3-7.3c.6-.8 1.1-1.9 1-3-1 0-2.2.7-2.9 1.5-.6.7-1.2 1.8-1 2.8 1.1.1 2.2-.5 2.9-1.3z"/></svg>,
  microsoft: <svg width="18" height="18" viewBox="0 0 18 18"><rect x="1" y="1" width="7.5" height="7.5" fill="#F25022"/><rect x="9.5" y="1" width="7.5" height="7.5" fill="#7FBA00"/><rect x="1" y="9.5" width="7.5" height="7.5" fill="#00A4EF"/><rect x="9.5" y="9.5" width="7.5" height="7.5" fill="#FFB900"/></svg>,
  mail: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>,
  eye: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>,
  eyeOff: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>,
  check: <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>,
  arrow: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>,
  login: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" y1="12" x2="3" y2="12"/></svg>,
  flame: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2s4 5 4 9a4 4 0 0 1-8 0c0-2 1-3 1-3s-3 2-3 6a6 6 0 0 0 12 0c0-5-6-12-6-12z"/></svg>,
  spark: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2l2.4 6.5L21 11l-6.6 2.5L12 20l-2.4-6.5L3 11l6.6-2.5z"/></svg>,
  clock: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
};

const APP_URL = "Studlin Web App.html";

const ERR_MAP = {
  "auth/user-not-found":"No account found with this email. Try signing up instead.",
  "auth/wrong-password":"Incorrect password. Please try again.",
  "auth/invalid-credential":"Incorrect email or password. Please try again.",
  "auth/invalid-email":"Please enter a valid email address.",
  "auth/too-many-requests":"Too many attempts. Please wait a moment and try again.",
  "auth/network-request-failed":"Network error. Check your connection and try again.",
  "auth/popup-blocked":"Pop-up was blocked. Please allow pop-ups for this site.",
  "auth/account-exists-with-different-credential":"An account already exists with this email using a different sign-in method.",
};

function TextField({ label, value, onChange, type="text", hint, error, autoFocus, autoComplete, onEnter }) {
  const [focused, setFocused] = useState(false);
  const [show, setShow] = useState(false);
  const isPw = type === "password";
  const inputType = isPw && show ? "text" : type;
  const hasValue = !!(value && String(value).length);
  return (
    <div className="field">
      <div className={"input-wrap" + (hasValue ? " has-value" : "") + (focused ? " is-focused" : "") + (error ? " has-error" : "")}>
        <label>{label}</label>
        <input
          type={inputType}
          value={value || ""}
          onChange={e=>onChange(e.target.value)}
          onFocus={()=>setFocused(true)}
          onBlur={()=>setFocused(false)}
          onKeyDown={e=>{ if(e.key==="Enter"&&onEnter) onEnter(); }}
          autoFocus={autoFocus}
          autoComplete={autoComplete || "off"}
        />
        {isPw && (
          <button type="button" className="pwd-toggle" onClick={()=>setShow(s=>!s)} aria-label={show?"Hide password":"Show password"}>
            {show ? Ic.eyeOff : Ic.eye}
          </button>
        )}
      </div>
      {error && <div className="field-error">{error}</div>}
      {!error && hint && <div className="field-hint">{hint}</div>}
    </div>
  );
}

function LeftRail() {
  return (
    <aside className="rail">
      <div className="brand">
        <div style={{width:34,height:34,borderRadius:8,background:"#9EC83D",display:"grid",placeItems:"center",fontSize:17,fontWeight:800,color:"#14342A"}}>S</div>
        <span className="name">studlin</span>
      </div>
      <div className="rail-icon">{Ic.login}</div>
      <h1>Welcome back.</h1>
      <p className="lead">Your workspace is exactly where you left it. Sign in to pick up your notes, decks, and streak.</p>
      <div className="rail-tiles">
        <div className="rail-tile">
          <div className="ic">{Ic.flame}</div>
          <div className="t">Your streak is waiting</div>
          <div className="s">Sign in today to keep your momentum alive</div>
        </div>
        <div className="rail-tile">
          <div className="ic">{Ic.spark}</div>
          <div className="t">Everything synced</div>
          <div className="s">Notes, flashcards, essays and calendar, right where you left them</div>
        </div>
        <div className="rail-tile">
          <div className="ic">{Ic.clock}</div>
          <div className="t">Back in seconds</div>
          <div className="s">One tap with Google or Apple</div>
        </div>
      </div>
    </aside>
  );
}

function App() {
  const [mode, setMode] = useState("providers");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(true);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [globalError, setGlobalError] = useState("");

  const emailOk = /\S+@\S+\.\S+/.test(email);
  const valid = emailOk && password.length >= 1;

  const socialSign = async (provider) => {
    setGlobalError("");setLoading(true);
    try {
      await firebase.auth().signInWithRedirect(provider);
    } catch(err) {
      setGlobalError(ERR_MAP[err.code]||(err.message||"Sign-in failed. Please try again."));
      setLoading(false);
    }
  };

  const tryLogin = async () => {
    const errs = {};
    if (!email) errs.email = "Please enter your email address";
    else if (!emailOk) errs.email = "Please enter a valid email address";
    if (!password) errs.password = "Please enter your password";
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setGlobalError("");setLoading(true);
    try {
      await firebase.auth().signInWithEmailAndPassword(email, password);
      window.location.href = APP_URL;
    } catch(err) {
      setGlobalError(ERR_MAP[err.code]||"Incorrect email or password. Please try again.");
    }
    setLoading(false);
  };

  React.useEffect(()=>{
    return firebase.auth().onAuthStateChanged(u=>{if(u)window.location.href=APP_URL;});
  },[]);

  return (
    <div className="shell">
      <LeftRail />
      <main className="stage">
        <div className="stage-top">
          New to Studlin? <a href="Studlin Onboarding.html">Create an account</a>
        </div>

        <div className="step-content is-entering">
          <div className="frame">
            <div className="frame-head">
              <h2>Log in to <em>Studlin</em></h2>
              <p>Welcome back. Pick up right where you left off.</p>
            </div>

            {globalError && (
              <div style={{fontSize:13,color:"#C4544A",marginBottom:16,padding:"12px 14px",background:"#FCF1EF",borderRadius:10,border:"1px solid #F5D4D0",textAlign:"center"}}>{globalError}</div>
            )}

            {mode === "providers" && (
              <React.Fragment>
                <div className="providers">
                  <button className="provider" onClick={()=>socialSign(new firebase.auth.GoogleAuthProvider())} disabled={loading}>{Ic.google} Continue with Google</button>
                  <button className="provider dark" onClick={()=>socialSign(new firebase.auth.OAuthProvider("apple.com"))} disabled={loading}>{Ic.apple} Continue with Apple</button>
                </div>
                <div className="divider">or log in with email</div>
                <button className="provider" onClick={()=>setMode("email")}>{Ic.mail} Use email instead</button>
                <div className="signin-note">
                  Protected by industry-standard encryption. We never share your data.
                </div>
              </React.Fragment>
            )}

            {mode === "email" && (
              <React.Fragment>
                <TextField label="Email address" value={email} onChange={v=>{setEmail(v); if(errors.email) setErrors({...errors,email:null});}}
                  hint={errors.email ? null : "The email you signed up with."}
                  error={errors.email} type="email" autoComplete="email" autoFocus onEnter={tryLogin} />
                <TextField label="Password" value={password} onChange={v=>{setPassword(v); if(errors.password) setErrors({...errors,password:null});}}
                  type="password" autoComplete="current-password"
                  error={errors.password} onEnter={tryLogin} />
                <div className="signin-row">
                  <label className={"checkbox compact" + (remember ? " is-checked" : "")} onClick={()=>setRemember(r=>!r)}>
                    <span className="box">{Ic.check}</span>
                    <span>Keep me signed in</span>
                  </label>
                  <a className="forgot" href="#">Forgot password?</a>
                </div>
                <div style={{marginTop:18}}>
                  <button className="provider" onClick={()=>{setMode("providers"); setErrors({}); setGlobalError("");}} style={{padding:"10px 14px",fontSize:13}}>← Use Google or Apple instead</button>
                </div>
              </React.Fragment>
            )}
          </div>
        </div>

        <div className="stage-foot">
          {mode === "email" ? (
            <button className="cta" disabled={!valid||loading} onClick={tryLogin}>
              {loading ? "Signing in..." : "Log in"}
              <span className="arrow">{Ic.arrow}</span>
            </button>
          ) : (
            <div className="stage-hint">Choose a provider above, or use your email.</div>
          )}
          <div className="stage-links"><a href="#">Privacy Policy</a> · <a href="#">Terms of Service</a></div>
        </div>
      </main>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
