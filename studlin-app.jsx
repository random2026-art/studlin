const { useState, useEffect, useRef } = React;

// ─── DESIGN TOKENS · dark + light themes ──────────────────────────────────────
const darkT = {
  bg:     "#080B18",
  surface:"#0D1124",
  card:   "#111530",
  card2:  "#181D38",
  border: "rgba(255,255,255,0.07)",
  borderHover: "rgba(255,255,255,0.14)",
  lime:   "#4F7FE8",
  limeDk: "#3462D4",
  limeLt: "#A695F5",
  glow:   "rgba(79,127,232,0.22)",
  text:   "#E8EEFF",
  muted:  "#8B95C0",
  faint:  "#2A3060",
  white:  "#ffffff",
  red:    "#D9806B",
  blue:   "#7BACDF",
  amber:  "#DCA64A",
  purple: "#A691DB",
  teal:   "#5FCBA8",
  butter: "#FFE99A",
  peach:  "#FFD7B5",
  mint:   "#C4F0D8",
  lilac:  "#E2D0FF",
  sky:    "#BFE3FF",
  rose:   "#FFC9D2",
  forest: "#0D1640",
  ink:    "#080C28",
  cream:  "#F6F1E6",
  font:   `"Geist", -apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif`,
  hand:   `"Bricolage Grotesque", "Geist", sans-serif`,
  serif:  `"Instrument Serif", serif`,
  mono:   `"JetBrains Mono", ui-monospace, monospace`,
  mode:   "dark",
};
const lightT = {
  bg:     "#F5F6FF",
  surface:"#1B2457",
  card:   "#ffffff",
  card2:  "#EBEEFF",
  border: "rgba(11,14,42,0.18)",
  borderHover: "rgba(11,14,42,0.32)",
  lime:   "#3A5FCA",
  limeDk: "#2646B0",
  limeLt: "#9A88F2",
  glow:   "rgba(58,95,202,0.20)",
  text:   "#0B0E2A",
  muted:  "rgba(11,14,42,0.55)",
  faint:  "rgba(11,14,42,0.30)",
  white:  "#1B2457",
  red:    "#A8412C",
  blue:   "#2D6FB8",
  amber:  "#A6700C",
  purple: "#5E45A8",
  teal:   "#1A8770",
  butter: "#FFE99A",
  peach:  "#FFD7B5",
  mint:   "#C4F0D8",
  lilac:  "#E2D0FF",
  sky:    "#BFE3FF",
  rose:   "#FFC9D2",
  forest: "#1B2457",
  ink:    "#080C28",
  cream:  "#F6F1E6",
  font:   `"Geist", -apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif`,
  hand:   `"Bricolage Grotesque", "Geist", sans-serif`,
  serif:  `"Instrument Serif", serif`,
  mono:   `"JetBrains Mono", ui-monospace, monospace`,
  mode:   "light",
};
const T = {...darkT}; // mutable · applyTheme() swaps in place so all components re-read on render
const hexA=(hex,a)=>{const h=hex.replace('#','');const r=parseInt(h.slice(0,2),16),g=parseInt(h.slice(2,4),16),b=parseInt(h.slice(4,6),16);return `rgba(${r},${g},${b},${a})`;};
// accent palettes — override the lime family per user choice
const ACCENTS={
  Indigo:{dk:{lime:"#4F7FE8",limeDk:"#3462D4",limeLt:"#A695F5"}, lt:{lime:"#3A5FCA",limeDk:"#2646B0",limeLt:"#9A88F2"}},
  Forest:{dk:{lime:"#6FC1A0",limeDk:"#4E9C7B",limeLt:"#A9E0CB"}, lt:{lime:"#2E8E6E",limeDk:"#22705680".slice(0,7),limeLt:"#A9E0CB"}},
  Sky:   {dk:{lime:"#84BBEA",limeDk:"#5A93C9",limeLt:"#BFE0FA"}, lt:{lime:"#2D74BC",limeDk:"#225A98",limeLt:"#BFE0FA"}},
  Lilac: {dk:{lime:"#B89BE0",limeDk:"#9474C9",limeLt:"#DCCBF5"}, lt:{lime:"#7E5BC0",limeDk:"#634599",limeLt:"#DCCBF5"}},
  Peach: {dk:{lime:"#E8A06E",limeDk:"#C9764A",limeLt:"#F5C9AC"}, lt:{lime:"#C2683A",limeDk:"#A4542C",limeLt:"#F5C9AC"}},
};
function applyTheme(name, accent, density) {
  Object.assign(T, name === 'light' ? lightT : darkT);
  const acc=ACCENTS[accent]||ACCENTS.Indigo;
  const a=name==='light'?acc.lt:acc.dk;
  T.lime=a.lime; T.limeDk=a.limeDk; T.limeLt=a.limeLt;
  T.glow=hexA(a.lime, name==='light'?0.18:0.22);
  if (typeof document !== 'undefined' && document.body) {
    document.body.style.background = T.bg;
    document.body.style.color = T.text;
    document.body.style.fontFamily = T.font;
    document.body.setAttribute('data-density', density||'Comfortable');
    document.body.setAttribute('data-theme', name==='light'?'light':'dark');
  }
}
applyTheme(
  (typeof localStorage !== 'undefined' && localStorage.getItem('studlin-theme')) || 'light',
  (typeof localStorage !== 'undefined' && localStorage.getItem('studlin-accent')) || 'Indigo',
  (typeof localStorage !== 'undefined' && localStorage.getItem('studlin-density')) || 'Comfortable'
);

// ─── ICON LIBRARY (SVG, no emoji) ─────────────────────────────────────────────
const ic = (path,size=16,vb="0 0 24 24") => (
  <svg width={size} height={size} viewBox={vb} fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{flexShrink:0,display:"block"}}>{path}</svg>
);

const Icon = {
  grid:      ic(<><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></>),
  chat:      ic(<><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></>),
  pen:       ic(<><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></>),
  layers:    ic(<><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></>),
  file:      ic(<><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></>),
  clock:     ic(<><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></>),
  cal:       ic(<><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></>),
  user:      ic(<><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></>),
  check:     ic(<><polyline points="20 6 9 17 4 12"/></>),
  refresh:   ic(<><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-3.51"/></>),
  music:     ic(<><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></>),
  users:     ic(<><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></>),
  trophy:    ic(<><polyline points="8 17 12 13 16 17"/><path d="M16 7H8"/><path d="M4 7h16l-1.5 9H5.5L4 7z"/><path d="M9 3.5L7 7h10l-2-3.5"/></>),
  settings:  ic(<><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></>),
  send:      ic(<><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></>),
  bar:       ic(<><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></>),
  play:      ic(<><polygon points="5 3 19 12 5 21 5 3"/></>),
  pause:     ic(<><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></>),
  skip:      ic(<><polygon points="5 4 15 12 5 20 5 4"/><line x1="19" y1="5" x2="19" y2="19"/></>),
  prev:      ic(<><polygon points="19 20 9 12 19 4 19 20"/><line x1="5" y1="19" x2="5" y2="5"/></>),
  chevDown:  ic(<><polyline points="6 9 12 15 18 9"/></>),
  plus:      ic(<><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></>),
  bold:      ic(<><path d="M6 4h8a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z"/><path d="M6 12h9a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z"/></>),
  italic:    ic(<><line x1="19" y1="4" x2="10" y2="4"/><line x1="14" y1="20" x2="5" y2="20"/><line x1="15" y1="4" x2="9" y2="20"/></>),
  link:      ic(<><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></>),
  quote:     ic(<><path d="M3 21c3 0 7-1 7-8V5c0-1.25-.756-2.017-2-2H4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2 1 0 1 0 1 1v1c0 1-1 2-2 2s-1 .008-1 1.031V20c0 1 0 1 1 1z"/><path d="M15 21c3 0 7-1 7-8V5c0-1.25-.757-2.017-2-2h-4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2h.75c0 2.25.25 4-2.75 4v3c0 1 0 1 1 1z"/></>),
  wand:      ic(<><path d="m15 4-1 1"/><path d="m4 15 1-1"/><path d="M7 6 5 8"/><path d="m17 16-2 2"/><path d="M6 18l11.93-11.93a1 1 0 0 1 1.41 0l.59.59a1 1 0 0 1 0 1.41L8 20"/></>),
  zap:       ic(<><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></>),
  shield:    ic(<><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></>),
  copy:      ic(<><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></>),
  award:     ic(<><circle cx="12" cy="8" r="7"/><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"/></>),
  star:      ic(<><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></>),
  flame:     ic(<><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/></>),
  volume:    ic(<><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/></>),
  xmark:     ic(<><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></>),
  arrowR:    ic(<><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></>),
  brain:     ic(<><path d="M12 5a3 3 0 1 0-5.997.125 4 4 0 0 0-2.526 5.77 4 4 0 0 0 .556 6.588A4 4 0 1 0 12 18Z"/><path d="M12 5a3 3 0 1 1 5.997.125 4 4 0 0 1 2.526 5.77 4 4 0 0 1-.556 6.588A4 4 0 1 1 12 18Z"/><path d="M15 13a4.5 4.5 0 0 1-3-4 4.5 4.5 0 0 1-3 4"/><path d="M17.599 6.5a3 3 0 0 0 .399-1.375"/><path d="M6.003 5.125A3 3 0 0 0 6.401 6.5"/><path d="M3.477 10.896a4 4 0 0 1 .585-.396"/><path d="M19.938 10.5a4 4 0 0 1 .585.396"/><path d="M6 18a4 4 0 0 1-1.967-.516"/><path d="M19.967 17.484A4 4 0 0 1 18 18"/></>),
  scan:      ic(<><path d="M3 7V5a2 2 0 0 1 2-2h2"/><path d="M17 3h2a2 2 0 0 1 2 2v2"/><path d="M21 17v2a2 2 0 0 1-2 2h-2"/><path d="M7 21H5a2 2 0 0 1-2-2v-2"/><line x1="8" y1="12" x2="16" y2="12"/></>),
  dot:       ic(<><circle cx="12" cy="12" r="4" fill="currentColor" stroke="none"/></>),
  mail:      ic(<><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></>),
  qr:        ic(<><rect width="5" height="5" x="3" y="3" rx="1"/><rect width="5" height="5" x="16" y="3" rx="1"/><rect width="5" height="5" x="3" y="16" rx="1"/><path d="M21 16h-3a2 2 0 0 0-2 2v3"/><path d="M21 21v.01"/><path d="M12 7v3a2 2 0 0 1-2 2H7"/><path d="M3 12h.01"/><path d="M12 3h.01"/><path d="M12 16v.01"/><path d="M16 12h1"/><path d="M21 12v.01"/><path d="M12 21v-1"/></>),
  heart:     ic(<><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></>),
  volOff:    ic(<><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/></>),
  msgSquare: ic(<><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></>),
  userPlus:  ic(<><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" y1="8" x2="19" y2="14"/><line x1="16" y1="11" x2="22" y2="11"/></>),
};

// ─── MOTIVATIONAL QUOTES + BREAK IDEAS ───────────────────────────────────────
const QUOTES=[
  {text:"The secret of getting ahead is getting started.",author:"Mark Twain"},
  {text:"It's not that I'm so smart. It's just that I stay with problems longer.",author:"Albert Einstein"},
  {text:"You don't have to be great to start, but you have to start to be great.",author:"Zig Ziglar"},
  {text:"The only way to do great work is to love what you do.",author:"Steve Jobs"},
  {text:"Success is the sum of small efforts, repeated day in and day out.",author:"Robert Collier"},
  {text:"Don't watch the clock; do what it does. Keep going.",author:"Sam Levenson"},
  {text:"A little progress each day adds up to big results.",author:"Satya Nani"},
  {text:"Start where you are. Use what you have. Do what you can.",author:"Arthur Ashe"},
  {text:"The expert in anything was once a beginner.",author:"Helen Hayes"},
  {text:"Focus on being productive instead of busy.",author:"Tim Ferriss"},
  {text:"It always seems impossible until it's done.",author:"Nelson Mandela"},
  {text:"You are never too old to set another goal or to dream a new dream.",author:"C.S. Lewis"},
  {text:"Discipline is choosing between what you want now and what you want most.",author:"Abraham Lincoln"},
  {text:"The beautiful thing about learning is that no one can take it away from you.",author:"B.B. King"},
  {text:"Small daily improvements over time lead to stunning results.",author:"Robin Sharma"},
  {text:"Education is the most powerful weapon you can use to change the world.",author:"Nelson Mandela"},
  {text:"You miss 100% of the shots you don't take.",author:"Wayne Gretzky"},
  {text:"Studying is not about time spent but about effort invested.",author:"Anonymous"},
  {text:"The pain of studying is temporary. The pain of not knowing is forever.",author:"Anonymous"},
  {text:"Your future self will thank you for the work you put in today.",author:"Anonymous"},
];
const BREAK_IDEAS=[
  "Go for a quick walk. Even 2 minutes helps clear your head.",
  "Are you hungry? Go eat silly.",
  "Stretch your arms, neck, and back. You've earned it.",
  "Grab some water. Stay hydrated.",
  "Look out a window for 20 seconds. Rest your eyes.",
  "Do 10 pushups. Seriously, it wakes you up.",
  "Text a friend something nice. Spread good energy.",
  "Take 5 deep breaths. In through the nose, out through the mouth.",
  "Stand up and shake it out. Wiggle your arms and legs.",
  "Close your eyes for 30 seconds. Just breathe.",
  "Play your favorite song. One song, then back to it.",
  "Splash some cold water on your face. Instant refresh.",
  "Do a quick doodle. Draw anything for 60 seconds.",
  "Look at something green. Plants are good for your brain.",
  "Roll your shoulders 10 times forward, 10 times back.",
];
const PRIORITY_LABELS=["","Low","Medium-Low","Medium","High","Urgent"];
const PRIORITY_COLORS=["","#5FCBA8","#7BACDF","#DCA64A","#E8946B","#D9806B"];
const DIFFICULTY_LABELS=["","Easy","Moderate","Challenging","Hard","Very Hard"];
const DIFFICULTY_COLORS=["","#5FCBA8","#7BACDF","#DCA64A","#E8946B","#D9806B"];

// ─── PROFESSIONAL TIER SYSTEM ─────────────────────────────────────────────────
const PROF_TIERS=[
  {title:"Intern",        minXP:0},
  {title:"Associate",     minXP:1000},
  {title:"Analyst",       minXP:3000},
  {title:"Senior Analyst",minXP:7500},
  {title:"Manager",       minXP:15000},
  {title:"Senior Manager",minXP:30000},
  {title:"Director",      minXP:55000},
  {title:"VP",            minXP:90000},
  {title:"SVP",           minXP:140000},
  {title:"C-Suite",       minXP:200000},
  {title:"CEO",           minXP:300000},
];
function getProfTitle(xp){let t=PROF_TIERS[0];for(const r of PROF_TIERS){if(xp>=r.minXP)t=r;else break;}return t.title;}
function calcSessionXP(mins){return Math.round(mins*(1+Math.floor(mins/30)*0.1));}
function awardFlashcardXP(rating){const pts={Mastered:15,Good:8,Hard:3,Missed:0};const gain=pts[rating]||0;if(gain>0)lsSet("xpBonus",(lsGet("xpBonus",0)+gain));return gain;}
function getWeeklyXP(){const sessions=lsGet("sessions",[]);const weekAgo=Date.now()-6*86400000;const weekSessions=sessions.filter(x=>x.t>=weekAgo);const focusXP=weekSessions.reduce((acc,x)=>acc+calcSessionXP(x.m||0),0);const days=new Set(lsGet("days",[]));let wdays=0;for(let i=0;i<7;i++){const d=new Date();d.setDate(d.getDate()-i);if(days.has(dayKey(d)))wdays++;}return focusXP+wdays*15+Math.min(getStreak(),7)*30;}

// ─── SHARED PRIMITIVES ────────────────────────────────────────────────────────
const Btn = ({children,onClick,style={},variant="lime"}) => {
  const base = {display:"inline-flex",alignItems:"center",gap:7,padding:"9px 18px",borderRadius:7,fontSize:12,fontWeight:600,cursor:"pointer",border:"none",fontFamily:T.font,letterSpacing:"0.01em",transition:"opacity 0.15s"};
  const variants = {
    lime:{background:T.lime,color:T.bg},
    ghost:{background:"transparent",color:T.muted,border:`1px solid ${T.border}`},
    subtle:{background:T.card2,color:T.text,border:`1px solid ${T.border}`},
    danger:{background:"rgba(224,90,71,0.1)",color:T.red,border:"1px solid rgba(224,90,71,0.2)"},
  };
  return <button onClick={onClick} style={{...base,...variants[variant],...style}}>{children}</button>;
};
const BtnSm = ({children,onClick,style={},variant="lime"}) => <Btn onClick={onClick} style={{padding:"5px 12px",fontSize:11,...style}} variant={variant}>{children}</Btn>;

const Badge = ({children,color=T.lime}) => <span style={{display:"inline-flex",alignItems:"center",padding:"3px 9px",borderRadius:4,fontSize:11,fontWeight:600,letterSpacing:"0.03em",background:color+"18",color,border:`1px solid ${color}22`}}>{children}</span>;

const Prog = ({pct,color=T.lime,height=4}) => <div style={{height,background:T.card2,borderRadius:height,overflow:"hidden"}}><div style={{height:"100%",width:`${pct}%`,background:color,borderRadius:height,transition:"width 0.5s ease"}}/></div>;

const Divider = ({style={}}) => <div style={{height:"1px",background:T.border,...style}} />;

const Label = ({children}) => <div style={{fontSize:10,fontWeight:700,letterSpacing:"0.1em",textTransform:"uppercase",color:T.muted,marginBottom:6}}>{children}</div>;

const Av = ({initials,color=T.lime,size=36,picUrl}) => {
  const pic = picUrl !== undefined ? picUrl : getUserPicUrl();
  if (pic) return <img src={pic} style={{width:size,height:size,borderRadius:"50%",objectFit:"cover",flexShrink:0,border:`1.5px solid ${color}44`}} alt="Profile" />;
  return <div style={{width:size,height:size,borderRadius:"50%",background:color+"22",border:`1.5px solid ${color}44`,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:700,color,fontSize:Math.round(size*0.33),flexShrink:0,letterSpacing:"0.02em"}}>{initials}</div>;
};

const Card = ({children,style={},onClick}) => (
  <div data-card onClick={onClick} style={{background:T.card,borderRadius:10,padding:20,border:`1px solid ${T.border}`,cursor:onClick?"pointer":"default",...style}}>{children}</div>
);

// ─── MODAL ────────────────────────────────────────────────────────────────────
const Modal = ({open, onClose, title, sub, children, footer, width=540}) => {
  if (!open) return null;
  return (
    <div onClick={onClose} style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.55)",backdropFilter:"blur(8px)",WebkitBackdropFilter:"blur(8px)",zIndex:1000,display:"flex",alignItems:"center",justifyContent:"center",padding:24,animation:"studlinFade 0.18s ease-out"}}>
      <div onClick={e=>e.stopPropagation()} style={{width:"100%",maxWidth:width,maxHeight:"90vh",background:T.card,borderRadius:16,border:`1px solid ${T.border}`,overflow:"hidden",display:"flex",flexDirection:"column",animation:"studlinPop 0.22s cubic-bezier(.2,.85,.3,1)",boxShadow:"0 24px 60px -16px rgba(0,0,0,0.5)"}}>
        <div style={{padding:"20px 22px 14px",borderBottom:`1px solid ${T.border}`,display:"flex",alignItems:"flex-start",gap:12}}>
          <div style={{flex:1}}>
            <div style={{fontSize:16,fontWeight:700,color:T.white,letterSpacing:"-0.01em"}}>{title}</div>
            {sub && <div style={{fontSize:12.5,color:T.muted,marginTop:3}}>{sub}</div>}
          </div>
          <button onClick={onClose} style={{width:30,height:30,borderRadius:8,border:`1px solid ${T.border}`,background:T.card2,color:T.muted,display:"grid",placeItems:"center",cursor:"pointer"}}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
        <div style={{padding:22,overflowY:"auto",flex:1}}>{children}</div>
        {footer && <div style={{padding:"14px 22px",borderTop:`1px solid ${T.border}`,background:T.bg,display:"flex",gap:10,justifyContent:"flex-end"}}>{footer}</div>}
      </div>
    </div>
  );
};
const Field = ({label, children, hint}) => (
  <div style={{marginBottom:14}}>
    <div style={{fontSize:11,fontWeight:600,letterSpacing:"0.08em",textTransform:"uppercase",color:T.muted,marginBottom:6}}>{label}</div>
    {children}
    {hint && <div style={{fontSize:11,color:T.muted,marginTop:4}}>{hint}</div>}
  </div>
);
const Input = (props) => (
  <input {...props} style={{width:"100%",background:T.card2,border:`1px solid ${T.border}`,borderRadius:8,padding:"10px 12px",color:T.text,fontSize:13.5,fontFamily:T.font,outline:"none",boxSizing:"border-box",...(props.style||{})}} />
);
const Textarea = (props) => (
  <textarea {...props} style={{width:"100%",background:T.card2,border:`1px solid ${T.border}`,borderRadius:8,padding:"10px 12px",color:T.text,fontSize:13.5,fontFamily:T.font,outline:"none",resize:"vertical",minHeight:90,boxSizing:"border-box",...(props.style||{})}} />
);
const SelectChip = ({options, value, onChange}) => (
  <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
    {options.map(o=>{
      const v = typeof o==="string"?o:o.value;
      const label = typeof o==="string"?o:o.label;
      const color = (typeof o==="object" && o.color) || null;
      const sel = value===v;
      return (
        <button key={v} type="button" onClick={()=>onChange(v)} style={{padding:"7px 13px",borderRadius:7,fontSize:12,cursor:"pointer",border:`1px solid ${sel?T.lime+"66":T.border}`,background:sel?T.lime+"14":"transparent",color:sel?T.lime:T.muted,fontFamily:T.font,fontWeight:sel?600:400,display:"inline-flex",alignItems:"center",gap:6}}>
          {color && <span style={{width:7,height:7,borderRadius:"50%",background:color}} />}
          {label}
        </button>
      );
    })}
  </div>
);

const PH = ({title,sub,action}) => (
  <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:28}}>
    <div>
      <h1 style={{fontSize:22,fontWeight:700,color:T.white,marginBottom:3,letterSpacing:"-0.02em"}}>{title}</h1>
      <p style={{fontSize:13,color:T.muted,margin:0}}>{sub}</p>
    </div>
    {action}
  </div>
);

const Pills = ({tabs,active,onChange}) => (
  <div style={{display:"flex",gap:4,marginBottom:20}}>
    {tabs.map(t=>(
      <button key={t} onClick={()=>onChange(t)} style={{padding:"6px 14px",borderRadius:6,fontSize:12,cursor:"pointer",border:`1px solid ${active===t?T.lime+"44":T.border}`,background:active===t?T.lime+"14":"transparent",color:active===t?T.lime:T.muted,fontWeight:active===t?600:400,fontFamily:T.font,letterSpacing:"0.01em",transition:"all 0.15s",textTransform:"capitalize"}}>{t}</button>
    ))}
  </div>
);

const StatNum = ({label,value,sub,accent,style={}}) => (
  <div style={{...style}}>
    <Label>{label}</Label>
    <div style={{fontSize:32,fontWeight:700,color:accent||T.white,letterSpacing:"-0.03em",lineHeight:1}}>{value}</div>
    {sub&&<div style={{fontSize:12,color:T.muted,marginTop:5}}>{sub}</div>}
  </div>
);

// ─── PERSISTENCE + MONETIZATION HELPERS ──────────────────────────────────────
const lsGet=(k,d)=>{try{const v=localStorage.getItem("studlin-"+k);return v===null?d:JSON.parse(v);}catch(e){return d;}};
const lsSet=(k,v)=>{try{localStorage.setItem("studlin-"+k,JSON.stringify(v));}catch(e){}};
async function getAuthToken(){try{const u=firebase.auth().currentUser;if(!u)return null;return await u.getIdToken();}catch(e){return null;}}
async function authFetch(url,opts={}){try{const token=await getAuthToken();const h=Object.assign({},opts.headers||{});if(token)h["Authorization"]="Bearer "+token;return fetch(url,Object.assign({},opts,{headers:h}));}catch(e){return fetch(url,opts);}}
async function fetchUserProfile(){try{const res=await authFetch("/api/me");if(!res.ok)return null;const d=await res.json();lsSet("credits",d.credits);lsSet("plan",d.plan||"Free");return d;}catch(e){return null;}}
const dayKey=(d)=>{const x=d||new Date();return x.getFullYear()+"-"+String(x.getMonth()+1).padStart(2,"0")+"-"+String(x.getDate()).padStart(2,"0");};
function daysOverdue(ev){if(!ev.deadline)return 0;if(ev.date<=ev.deadline)return 0;const d1=new Date(ev.date),d2=new Date(ev.deadline);return Math.ceil((d1-d2)/86400000);}
function daysUntilDeadline(ev){if(!ev.deadline)return null;const d1=new Date(ev.deadline),d2=new Date(dayKey());return Math.ceil((d1-d2)/86400000);}
function scheduleTaskNotif(task){try{if(!("Notification" in window)||Notification.permission!=="granted")return;const t=new Date(task.date+"T"+task.time);const delay=t.getTime()-10*60*1000-Date.now();if(delay<=0)return;setTimeout(()=>{new Notification("Studlin",{body:task.title+" starts in 10 minutes"});},delay);}catch(e){}}
function requestNotifPermission(){if(!("Notification" in window))return;Notification.requestPermission();}
function touchStreak(){const days=lsGet("days",[]);const t=dayKey();if(!days.includes(t)){days.push(t);lsSet("days",days);}}
function getStreak(){const days=new Set(lsGet("days",[]));let n=0;const d=new Date();while(days.has(dayKey(d))){n++;d.setDate(d.getDate()-1);}return n;}
function logSession(mins,mode){const s=lsGet("sessions",[]);s.push({d:dayKey(),m:mins,t:Date.now(),mode:mode||"Focus"});lsSet("sessions",s);}
function sessionStats(){
  const s=lsGet("sessions",[]);
  const weekAgo=Date.now()-6*86400000;
  const week=s.filter(x=>x.t>=weekAgo);
  const today=s.filter(x=>x.d===dayKey());
  const weekMin=week.reduce((a,x)=>a+x.m,0);
  const todayMin=today.reduce((a,x)=>a+x.m,0);
  return {weekCount:week.length,weekMin,todayMin,avg:week.length?Math.round(weekMin/week.length):0,todayCount:today.length};
}
const fmtH=(m)=>m>=60?Math.floor(m/60)+"h "+(m%60)+"m":m+"m";
const PLAN_LIMITS={Free:{music:2},Pro:{music:5},Max:{music:10}};
function getPlan(){return lsGet("plan","Free");}
function setPlanLS(p){lsSet("plan",p);}
function getCredits(){return lsGet("credits",120);}
function setCreditsLS(n){lsSet("credits",Math.max(0,n));}
function getCreditLimit(){const p=getPlan();return p==="Max"?500:p==="Pro"?200:30;}
const CREDIT_COST={standard:1,flash:1};

// ─── XP · LEVEL · STREAK · PLAN (all derived from real activity) ───────────────
const DOW_FULL=["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
const MON_SHORT=["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
function todayLabel(){const d=new Date();return DOW_FULL[d.getDay()]+" · "+MON_SHORT[d.getMonth()]+" "+d.getDate();}
function weekNo(){const d=new Date();const start=new Date(d.getFullYear(),0,1);return Math.ceil((((d-start)/86400000)+start.getDay()+1)/7);}
function getXP(){
  const s=lsGet("sessions",[]);
  const base=lsGet("xpBase",1850);
  const focusXP=s.reduce((acc,x)=>acc+calcSessionXP(x.m||0),0);
  const streakXP=getStreak()*30;
  const loginXP=lsGet("days",[]).length*15;
  const taskXP=Object.values(lsGet("planDone",{})).filter(Boolean).length*20;
  const penaltyXP=lsGet("xpPenaltyTotal",0);
  return Math.max(0,base+focusXP+streakXP+loginXP+taskXP+lsGet("xpBonus",0)-penaltyXP);
}
function applyOverduePenalties(){
  const today=dayKey();
  const events=lsGet("events",[]);
  const penalized=lsGet("penalizedTasks",{});
  let added=0;
  events.forEach(ev=>{
    if(penalized[ev.id])return;
    if(ev.status!=="pending")return;
    if(ev.date>=today)return;
    if(ev.deadline&&ev.deadline<today)return;
    const pen=Math.round((ev.duration||25)*(ev.priority||1)*(ev.difficulty||1));
    added+=pen;
    penalized[ev.id]=true;
  });
  if(added>0){lsSet("xpPenaltyTotal",(lsGet("xpPenaltyTotal",0)+added));lsSet("penalizedTasks",penalized);}
}
function levelInfo(){const xp=getXP();const per=300;const level=Math.floor(xp/per)+1;const into=xp-(level-1)*per;const title=getProfTitle(xp);const nextTier=PROF_TIERS.find(t=>t.minXP>xp)||null;const curTierXP=(PROF_TIERS.slice().reverse().find(t=>xp>=t.minXP)||PROF_TIERS[0]).minXP;const tierPct=nextTier?Math.round(Math.max(0,Math.min(100,(xp-curTierXP)/(nextTier.minXP-curTierXP)*100))):100;return {xp,level,into,per,toNext:per-into,pct:Math.round(into/per*100),title,nextTier,tierPct};}
function weekStreak(){const days=new Set(lsGet("days",[]));const now=new Date();const dow=(now.getDay()+6)%7;const mon=new Date(now);mon.setDate(now.getDate()-dow);return ["M","T","W","T","F","S","S"].map((lab,i)=>{const d=new Date(mon);d.setDate(mon.getDate()+i);const k=dayKey(d);const today=k===dayKey(now);return {lab,on:days.has(k),today,future:d>now&&!today};});}
// ─── ADVANCED SCHEDULING SYSTEM (5 features integrated) ──────────────────────
// Feature 1: User preference storage + getters/setters (complete with all onboarding preferences)
function getSchedulePreferences(){
  const def={
    workStartTime:"10:00",
    workEndTime:"18:00",
    bedtime:"23:00",
    taskDifficultyPreference:"NONE",
    bufferMarginStrategy:"15_MIN"
  };
  const stored=lsGet("schedulePrefs",def);
  return {...def,...stored};
}
function setSchedulePreferences(prefs){
  lsSet("schedulePrefs",prefs);
}

// Helper: convert "HH:MM" to minutes since midnight
function timeToMinutes(timeStr){
  if(!timeStr)return 0;
  const [h,m]=timeStr.split(":").map(Number);
  return h*60+m;
}

// Helper: convert minutes since midnight back to "HH:MM"
function minutesToTime(mins){
  const h=Math.floor(mins/60);
  const m=mins%60;
  return String(h).padStart(2,"0")+":"+String(m).padStart(2,"0");
}

// Feature 3: Task priority scoring (0-1000 scale with exponential deadline urgency)
function calculateTaskPriority(task,allTasks){
  let score=0;
  const prefs=getSchedulePreferences();
  const now=new Date();
  
  // Base priority (user-set)
  const basePriority=task.priority||3;
  score+=basePriority*100;
  
  // Deadline urgency (exponential scaling as due date approaches)
  if(task.deadline){
    const dueDate=new Date(task.deadline);
    const hoursDue=(dueDate-now)/(1000*60*60);
    if(hoursDue<=0){
      score+=300;
    }else if(hoursDue<=6){
      score+=250;
    }else if(hoursDue<=24){
      score+=200;
    }else if(hoursDue<=72){
      score+=120;
    }else{
      score+=Math.max(0,100-hoursDue/24);
    }
  }
  
  // Difficulty preference weighting
  const diff=task.difficulty||2;
  if(prefs.difficultyPreference==="hardFirst"&&diff>=3){
    score+=150;
  }else if(prefs.difficultyPreference==="easyFirst"&&diff<=2){
    score+=100;
  }
  
  // Duration penalty (longer tasks score lower to prioritize quick wins)
  const dur=task.duration||30;
  if(dur>90)score-=50;
  else if(dur>60)score-=25;
  
  return Math.min(1000,Math.max(0,score));
}

// Feature 4: Duration-aware chunking & auto-inject breaks
function chunkTasksWithBreaks(tasks){
  const chunked=[];
  tasks.forEach(task=>{
    if(!task.isFlexible||(task.duration||0)<=90){
      chunked.push(task);
      return;
    }
    const dur=task.duration;
    const chunks=Math.ceil(dur/45);
    for(let i=0;i<chunks;i++){
      const chunkDur=Math.min(45,dur-(i*45));
      chunked.push({
        ...task,
        id:task.id+"-chunk-"+i,
        title:task.title+(chunks>1?` (Part ${i+1}/${chunks})`:""),
        duration:chunkDur,
        parentId:task.id,
        isChunk:true,
      });
      if(i<chunks-1){
        chunked.push({
          id:"break-"+task.id+"-"+i,
          title:"Break",
          duration:15,
          isBreak:true,
          subject:"Rest",
          priority:1,
        });
      }
    }
  });
  return chunked;
}

// Feature 5: Conflict detection (detect overlaps with hard events)
function detectConflicts(task,allTasks,startMins){
  const prefs=getSchedulePreferences();
  const taskDur=task.duration||30;
  const taskEnd=startMins+taskDur;
  
  // Check for collisions with hard events (non-flexible tasks)
  return allTasks.some(other=>{
    if(other.id===task.id||!other.time||other.isFlexible)return false;
    const otherStart=timeToMinutes(other.time);
    const otherEnd=otherStart+(other.duration||30);
    return!(taskEnd<=otherStart||startMins>=otherEnd);
  });
}

// Feature 2+Features 1,3,4,5: Integrated advanced scheduler
function advancedSchedulePlanner(baseEvents){
  const prefs=getSchedulePreferences();
  const tk=dayKey();
  const done=lsGet("planDone",{});
  
  // Get all events for today
  const events=baseEvents.filter(e=>e.date===tk);
  const now=new Date();
  const nowMins=timeToMinutes(String(now.getHours()).padStart(2,"0")+":"+String(now.getMinutes()).padStart(2,"0"));
  
  // Time window constraints
  const workStart=timeToMinutes(prefs.workStartTime);
  const workEnd=timeToMinutes(prefs.workEndTime);
  const bedtime=timeToMinutes(prefs.bedtime);
  const softBedtimeBuffer=120; // 2 hours before bedtime
  
  // Separate hard events (fixed time) and flexible tasks
  const hardEvents=events.filter(e=>!e.isFlexible&&e.time);
  const flexibleTasks=events.filter(e=>e.isFlexible||!e.time).sort((a,b)=>calculateTaskPriority(b,events)-calculateTaskPriority(a,events));
  
  // Chunk long flexible tasks and add breaks
  const flexibleChunked=chunkTasksWithBreaks(flexibleTasks);
  
  // Sort hard events by time
  hardEvents.sort((a,b)=>(a.time||"")<(b.time||"")?-1:1);
  
  const scheduled=[];
  const occupiedSlots=hardEvents.map(e=>({
    start:timeToMinutes(e.time),
    end:timeToMinutes(e.time)+(e.duration||30),
    event:e,
  }));
  
  // Place hard events
  hardEvents.forEach(e=>{
    scheduled.push({...e,done:!!done[e.id],scheduled:true});
  });
  
  // Place flexible tasks in available windows
  flexibleChunked.forEach(task=>{
    if(task.isBreak){
      scheduled.push(task);
      return;
    }
    
    const dur=task.duration||30;
    let placed=false;
    
    // Try to find first available slot within work window
    for(let timeSlot=workStart;timeSlot+dur<=Math.min(workEnd,bedtime-softBedtimeBuffer);timeSlot+=15){
      if(!detectConflicts(task,occupiedSlots,timeSlot)){
        occupiedSlots.push({start:timeSlot,end:timeSlot+dur,task:task});
        scheduled.push({
          ...task,
          time:minutesToTime(timeSlot),
          done:!!done[task.id],
          scheduled:true,
        });
        placed=true;
        break;
      }
    }
    
    if(!placed){
      scheduled.push({
        ...task,
        done:!!done[task.id],
        scheduled:false,
        reason:"No available window within preferred hours",
      });
    }
  });
  
  return scheduled;
}

function todaysPlan(){
  const events=lsGet("events",[]);
  return advancedSchedulePlanner(events);
}

// Comprehensive task rearrangement function (Feature 3 advanced implementation)
function rearrangeUserTasks(tasks, userPrefs){
  if(!tasks||!Array.isArray(tasks)||tasks.length===0)return tasks;
  const prefs=userPrefs||getSchedulePreferences();
  
  // Parse time values
  const parseTime=(t)=>{const [h,m]=(t||"10:00").split(":").map(Number);return h*60+m;};
  const workStart=parseTime(prefs.workStartTime);
  const workEnd=parseTime(prefs.workEndTime);
  const bedtimeMin=parseTime(prefs.bedtime);
  const bedtimeSoftLimit=bedtimeMin-120; // 2-hour buffer before actual bedtime
  
  // Calculate baseline score (0-1000) with exponential deadline urgency
  const calcScore=(task)=>{
    let score=0;
    const now=Date.now();
    const deadline=task.deadline?new Date(task.deadline).getTime():null;
    
    // Base: priority level × 100
    score+=Math.min(500,(task.priority||3)*100);
    
    // Exponential deadline urgency
    if(deadline){
      const hoursUntil=(deadline-now)/(1000*60*60);
      if(hoursUntil<=0)score+=300; // overdue = critical
      else if(hoursUntil<=6)score+=250;
      else if(hoursUntil<=24)score+=200;
      else if(hoursUntil<=72)score+=120;
      else score+=Math.max(50,100-(hoursUntil/24)*5);
    }
    
    // Difficulty weighting based on preference
    const difficulty=task.difficulty||3;
    if(prefs.taskDifficultyPreference==="FIRST"&&difficulty>=3)score+=150;
    else if(prefs.taskDifficultyPreference==="LAST"&&difficulty<=2)score+=100;
    
    // Duration penalty (long tasks score lower to prioritize quick wins)
    const duration=task.duration||60;
    if(duration>90)score-=50;
    else if(duration>60)score-=25;
    
    return Math.max(0,Math.min(1000,Math.round(score)));
  };
  
  // Separate hard events from flexible tasks
  const hardEvents=tasks.filter(t=>t.kind==="class"||t.kind==="exam"||!t.isFlexible);
  const flexibleTasks=tasks.filter(t=>t.isFlexible);
  
  // Calculate occupied time slots from hard events
  const occupiedSlots=[];
  hardEvents.forEach(ev=>{
    if(ev.time){
      const [h,m]=(ev.time.split(":")).map(Number);
      const startMins=h*60+m;
      const endMins=startMins+(ev.duration||60);
      occupiedSlots.push({start:startMins,end:endMins,title:ev.title});
    }
  });
  
  // Sort flexible tasks by calculated score (highest first)
  const sorted=[...flexibleTasks].sort((a,b)=>calcScore(b)-calcScore(a));
  
  // Try to place each task, apply "LAST" preference by pushing to later slots
  const scheduled=[];
  sorted.forEach(task=>{
    let placed=false;
    const duration=task.duration||60;
    
    // Scan for first available 15-minute window within work constraints
    for(let mins=workStart;mins<=workEnd-duration;mins+=15){
      const endMins=mins+duration;
      
      // Check bedtime constraints
      if(prefs.taskDifficultyPreference==="LAST"&&(difficulty=>3||task.priority<=2)){
        // For LAST preference low-priority tasks, scan from workStart
        if(endMins>bedtimeSoftLimit)continue;
      }else{
        // Default: hard limit before bedtime
        if(endMins>bedtimeSoftLimit)continue;
      }
      
      // Check no conflict with occupied slots
      const hasConflict=occupiedSlots.some(slot=>
        (mins<slot.end&&endMins>slot.start)
      );
      if(!hasConflict){
        const h=Math.floor(mins/60);
        const m=mins%60;
        const time=String(h).padStart(2,"0")+":"+String(m).padStart(2,"0");
        scheduled.push({...task,scheduledTime:time,score:calcScore(task)});
        placed=true;
        break;
      }
    }
    
    if(!placed){
      scheduled.push({...task,score:calcScore(task),unschedulable:true,reason:"No available window within preferred work hours"});
    }
  });
  
  // Add back hard events
  const final=[...hardEvents,...scheduled].sort((a,b)=>{
    if(a.date!==b.date)return a.date.localeCompare(b.date);
    return (a.time||"00:00").localeCompare(b.time||"00:00");
  });
  
  return final;
}


function togglePlanDone(id){const done=lsGet("planDone",{});done[id]=!done[id];lsSet("planDone",done);return done;}
function profileStats(){const s=lsGet("sessions",[]);const totalMin=s.reduce((a,x)=>a+(x.m||0),0);const st=sessionStats();return {totalMin,focusSessions:s.length,weekMin:st.weekMin,avg:st.avg};}
function getProfile(){
  try{
    const u=typeof firebase!=="undefined"?firebase.auth().currentUser:null;
    const def={name:(u&&u.displayName)||"Student",email:(u&&u.email)||"you@studlin.app",school:"",tz:"America/New_York",status:"",affiliation:""};
    return lsGet("profile",def);
  }catch(e){return{name:"Student",email:"you@studlin.app",school:"",tz:"America/New_York",status:"",affiliation:""};}
}
function getUserPicUrl(){return lsGet("profilePic","");}
function getUserInitials(){
  try{
    const u=typeof firebase!=="undefined"?firebase.auth().currentUser:null;
    const n=(u&&u.displayName)||getProfile().name||"S";
    if(!n)return "S";
    const p=n.trim().split(" ").filter(Boolean);
    return p.length>1?(p[0][0]+p[p.length-1][0]).toUpperCase():n.slice(0,2).toUpperCase();
  }catch(e){return "S";}
}
function getUserName(){
  try{
    const u=typeof firebase!=="undefined"?firebase.auth().currentUser:null;
    return (u&&u.displayName)||getProfile().name||"Student";
  }catch(e){return "Student";}
}
function saveProfile(p){lsSet("profile",p);}
function seedEventsIfStale(){
  return;
  const ev=lsGet("events",null); const tk=dayKey();
  if(ev&&ev.some(e=>e.date>=tk))return;
  const mk=(off,time,title,subject,kind)=>{const d=new Date();d.setDate(d.getDate()+off);return {id:"seed-"+off+"-"+time,date:dayKey(d),time,title,subject,kind};};
  lsSet("events",[
    mk(0,"14:30","Chem quiz · Periodic trends","Chemistry","exam"),
    mk(0,"19:00","Macbeth essay · draft a section","English IV","study block"),
    mk(0,"21:00","Bio · cell respiration review","Biology","study block"),
    mk(1,"23:59","Biology lab report due","Biology","deadline"),
    mk(3,"09:00","Macbeth essay · first draft","English IV","deadline"),
    mk(5,"10:00","Calculus test · Derivatives","Calculus","exam"),
  ]);
}

// ─── SCHEDULE SETTINGS PANEL (Feature 2: Editable Preferences) ─────────────────
function ScheduleSettingsPanel({open,onClose,onSave}){
  const prefs=getSchedulePreferences();
  const [workStart,setWorkStart]=useState(prefs.workStartTime);
  const [workEnd,setWorkEnd]=useState(prefs.workEndTime);
  const [bedtime,setBedtime]=useState(prefs.bedtime);
  const [difficulty,setDifficulty]=useState(prefs.difficultyPreference);
  const [saved,setSaved]=useState(false);
  
  const handleSave=()=>{
    const newPrefs={
      workStartTime:workStart,
      workEndTime:workEnd,
      bedtime:bedtime,
      difficultyPreference:difficulty,
    };
    setSchedulePreferences(newPrefs);
    setSaved(true);
    setTimeout(()=>setSaved(false),2000);
    if(onSave)onSave();
  };
  
  if(!open)return null;
  
  return (
    <div onClick={onClose} style={{position:"fixed",inset:0,zIndex:95,background:"rgba(8,12,10,0.72)",backdropFilter:"blur(7px)",display:"flex",alignItems:"center",justifyContent:"center",padding:16}}>
      <div onClick={e=>e.stopPropagation()} style={{width:520,maxWidth:"100%",background:T.surface,border:"1px solid "+T.border,borderRadius:16,padding:28,boxShadow:"0 40px 90px -30px rgba(0,0,0,0.65)",maxHeight:"90vh",overflowY:"auto"}}>
        <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:24}}>
          <span style={{display:"inline-flex",width:34,height:34,borderRadius:10,background:T.lime+"20",border:"1px solid "+T.lime+"44",alignItems:"center",justifyContent:"center",color:T.lime,fontSize:16}}>⚙️</span>
          <div style={{fontSize:18,fontWeight:700,color:T.white,letterSpacing:"-0.01em"}}>Study Schedule Preferences</div>
        </div>
        
        <div style={{marginBottom:22}}>
          <label style={{display:"block",fontSize:11,fontWeight:700,letterSpacing:"0.08em",textTransform:"uppercase",color:T.muted,marginBottom:8}}>Peak Work Hours</label>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
            <div>
              <label style={{fontSize:12,color:T.text,marginBottom:4,display:"block"}}>Start time</label>
              <input type="time" value={workStart} onChange={e=>setWorkStart(e.target.value)} style={{width:"100%",background:T.card2,border:"1px solid "+T.border,borderRadius:8,padding:"10px 12px",color:T.text,fontSize:13.5,fontFamily:T.mono}} />
            </div>
            <div>
              <label style={{fontSize:12,color:T.text,marginBottom:4,display:"block"}}>End time</label>
              <input type="time" value={workEnd} onChange={e=>setWorkEnd(e.target.value)} style={{width:"100%",background:T.card2,border:"1px solid "+T.border,borderRadius:8,padding:"10px 12px",color:T.text,fontSize:13.5,fontFamily:T.mono}} />
            </div>
          </div>
          <div style={{fontSize:11,color:T.muted,marginTop:6,lineHeight:1.4}}>Tasks will be scheduled within this window. Your study schedule respects these hours.</div>
        </div>
        
        <div style={{marginBottom:22}}>
          <label style={{display:"block",fontSize:11,fontWeight:700,letterSpacing:"0.08em",textTransform:"uppercase",color:T.muted,marginBottom:8}}>Bedtime (Soft Limit)</label>
          <input type="time" value={bedtime} onChange={e=>setBedtime(e.target.value)} style={{width:"100%",background:T.card2,border:"1px solid "+T.border,borderRadius:8,padding:"10px 12px",color:T.text,fontSize:13.5,fontFamily:T.mono,maxWidth:200}} />
          <div style={{fontSize:11,color:T.muted,marginTop:6,lineHeight:1.4}}>Tasks won't be scheduled in the 2 hours before bedtime. This keeps your evening protected.</div>
        </div>
        
        <div style={{marginBottom:22}}>
          <label style={{display:"block",fontSize:11,fontWeight:700,letterSpacing:"0.08em",textTransform:"uppercase",color:T.muted,marginBottom:8}}>Difficulty Preference</label>
          <div style={{display:"flex",gap:8}}>
            {[
              {value:"easyFirst",label:"Easy First",desc:"Tackle quick wins before hard tasks"},
              {value:"balanced",label:"Balanced",desc:"Mix easy and hard throughout"},
              {value:"hardFirst",label:"Hard First",desc:"Hit hard tasks during peak focus"},
            ].map(opt=>(
              <button
                key={opt.value}
                onClick={()=>setDifficulty(opt.value)}
                style={{
                  flex:1,padding:12,borderRadius:8,border:"1px solid "+(difficulty===opt.value?T.lime+"66":T.border),
                  background:difficulty===opt.value?T.lime+"14":"transparent",
                  color:difficulty===opt.value?T.lime:T.muted,
                  fontSize:12,fontWeight:difficulty===opt.value?600:500,
                  cursor:"pointer",
                  transition:"all 0.15s",
                  textAlign:"left",
                }}
              >
                <div style={{fontWeight:600}}>{opt.label}</div>
                <div style={{fontSize:10.5,opacity:0.8,marginTop:2}}>{opt.desc}</div>
              </button>
            ))}
          </div>
        </div>
        
        {saved&&<div style={{background:T.lime+"20",border:"1px solid "+T.lime+"44",borderRadius:8,padding:12,fontSize:12,color:T.lime,marginBottom:16,display:"flex",alignItems:"center",gap:8}}>
          <span style={{display:"inline-flex"}}>✓</span>
          Preferences saved! Your schedule will instantly re-sort.
        </div>}
        
        <div style={{display:"flex",gap:10,justifyContent:"flex-end"}}>
          <button onClick={onClose} style={{padding:"10px 18px",borderRadius:8,border:"1px solid "+T.border,background:"transparent",color:T.muted,fontSize:12.5,fontWeight:600,cursor:"pointer",fontFamily:T.font}}>Cancel</button>
          <button onClick={handleSave} style={{padding:"10px 18px",borderRadius:8,border:"none",background:T.lime,color:T.ink,fontSize:12.5,fontWeight:600,cursor:"pointer",fontFamily:T.font}}>Save Preferences</button>
        </div>
      </div>
    </div>
  );
}

// ─── UPGRADE MODAL (shared paywall) ───────────────────────────────────────────
function UpgradeModal({open,onClose,feature,detail,onUpgraded}){
  if(!open)return null;
  const tiers=[
    {name:"Pro",price:"$9.99",perks:["5 AI music creations","200 AI credits / month","Unlimited decks + notes scanning"],color:T.lime},
    {name:"Max",price:"$24.99",perks:["10 AI music creations","500 AI credits / month","Advanced analytics + learning paths"],color:T.purple},
  ];
  const choose=(name)=>{setPlanLS(name);onClose();if(onUpgraded)onUpgraded(name);};
  return (
    <div onClick={onClose} style={{position:"fixed",inset:0,zIndex:90,background:"rgba(8,12,10,0.72)",backdropFilter:"blur(7px)",display:"flex",alignItems:"center",justifyContent:"center"}}>
      <div onClick={e=>e.stopPropagation()} style={{width:580,maxWidth:"92vw",background:T.surface,border:"1px solid "+T.border,borderRadius:16,padding:28,boxShadow:"0 40px 90px -30px rgba(0,0,0,0.65)"}}>
        <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:6}}>
          <span style={{display:"inline-flex",width:30,height:30,borderRadius:8,background:T.lime+"1c",border:"1px solid "+T.lime+"44",alignItems:"center",justifyContent:"center",color:T.lime}}>{Icon.wand}</span>
          <div style={{fontSize:17,fontWeight:700,color:T.white,letterSpacing:"-0.01em"}}>You have hit your {feature} limit</div>
        </div>
        <div style={{fontSize:12.5,color:T.muted,lineHeight:1.6,marginBottom:18}}>{detail}</div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:14}}>
          {tiers.map(t=>(
            <div key={t.name} style={{background:T.card,border:"1px solid "+(t.name==="Max"?t.color+"55":T.border),borderRadius:12,padding:16,position:"relative"}}>
              {t.name==="Max"&&<span style={{position:"absolute",top:-8,right:12,fontSize:9,fontWeight:700,letterSpacing:"0.08em",background:t.color,color:"#fff",padding:"2px 8px",borderRadius:4}}>BEST VALUE</span>}
              <div style={{fontSize:13,fontWeight:700,color:t.color,marginBottom:2}}>{t.name}</div>
              <div style={{fontSize:24,fontWeight:700,color:T.white,letterSpacing:"-0.02em"}}>{t.price}<span style={{fontSize:11,color:T.muted,fontWeight:400}}> /month</span></div>
              <div style={{margin:"10px 0 14px"}}>
                {t.perks.map((p,i)=>(
                  <div key={i} style={{display:"flex",gap:7,alignItems:"center",fontSize:11.5,color:T.text,padding:"3px 0"}}><span style={{color:t.color,display:"inline-flex"}}>{Icon.check}</span>{p}</div>
                ))}
              </div>
              <Btn onClick={()=>choose(t.name)} style={{width:"100%",justifyContent:"center",background:t.name==="Max"?t.color:T.lime,color:t.name==="Max"?"#fff":T.ink}}>Upgrade to {t.name}</Btn>
            </div>
          ))}
        </div>
        <div onClick={onClose} style={{textAlign:"center",fontSize:12,color:T.muted,cursor:"pointer",padding:6}}>Maybe later</div>
      </div>
    </div>
  );
}

// ─── NAV ICONS MAP ────────────────────────────────────────────────────────────
const navIcon = {dashboard:Icon.grid,aichat:Icon.chat,essays:Icon.pen,flashcards:Icon.layers,notes:Icon.file,calendar:Icon.cal,friends:Icon.heart,solve:Icon.zap,aitutor:Icon.brain,grammar:Icon.check,humanizer:Icon.scan,music:Icon.music,settings:Icon.settings,profile:Icon.user};

// ─── AI CHAT ──────────────────────────────────────────────────────────────────
function AiChat() {
  const MODELS=[
    {id:"standard",name:"Studlin",desc:"Smart, thorough answers for any study task",cost:"1 credit"},
    {id:"flash",name:"Studlin Flash",desc:"Fastest answers for quick questions",cost:"1 credit"},
  ];
  const [model,setModel]=useState(()=>{const saved=lsGet("chatModel","standard");return(saved==="standard"||saved==="flash")?saved:"standard";});
  const [modelOpen,setModelOpen]=useState(false);
  const curModel=MODELS.find(m=>m.id===model)||MODELS[0];
  const [input,setInput]=useState("");
  const [loading,setLoading]=useState(false);
  const [thinkStep,setThinkStep]=useState("");
  const [credits,setCredits]=useState(getCredits);
  const [msgs,setMsgs]=useState([]);
  const chatRef=useRef(null);
  const inputRef=useRef(null);
  const scrollToBottom=()=>{if(chatRef.current)chatRef.current.scrollTop=chatRef.current.scrollHeight;};
  useEffect(scrollToBottom,[msgs,thinkStep]);
  const hasMessages=msgs.length>0;

  const userName=(getUserName()||"there").split(" ")[0];

  const [recording,setRecording]=useState(false);
  const [micError,setMicError]=useState("");
  const recognitionRef=useRef(null);
  const toggleVoice=async()=>{
    const SR=window.SpeechRecognition||window.webkitSpeechRecognition;
    if(!SR){setMicError("Speech recognition isn't supported in this browser. Try Chrome or Edge.");return;}
    if(recording){recognitionRef.current?.stop();return;}
    setMicError("");
    try{const stream=await navigator.mediaDevices.getUserMedia({audio:true});stream.getTracks().forEach(t=>t.stop());}catch(e){setMicError("Microphone access denied. Please allow mic access and try again.");return;}
    const rec=new SR();
    rec.continuous=true;rec.interimResults=true;rec.lang="en-US";
    recognitionRef.current=rec;
    rec.onstart=()=>setRecording(true);
    rec.onresult=(e)=>{let t="";for(let i=0;i<e.results.length;i++)t+=e.results[i][0].transcript;setInput(t);};
    rec.onend=()=>setRecording(false);
    rec.onerror=(e)=>{setRecording(false);if(e.error!=="aborted")setMicError("Mic error: "+e.error);};
    rec.start();
  };

  const [attachedFile,setAttachedFile]=useState(null);
  const [fileLoading,setFileLoading]=useState(false);
  const fileRef=useRef(null);
  const handleFile=async(e)=>{
    const file=e.target.files?.[0];if(!file)return;
    e.target.value="";
    const maxSize=10*1024*1024;
    if(file.size>maxSize){setMicError("File too large. Max 10MB.");return;}
    const ext=file.name.split(".").pop().toLowerCase();
    const binaryTypes=["doc","docx","ppt","pptx","xls","xlsx","zip","rar","exe","dmg","png","jpg","jpeg","gif","mp3","mp4","mov"];
    if(binaryTypes.includes(ext)){setMicError("That file type isn't supported yet. Try .txt, .md, .csv, .pdf, or code files.");return;}
    setMicError("");
    if(ext==="pdf"){
      setFileLoading(true);
      try{
        const pdfjsLib=await window._pdfjs;
        const buf=await file.arrayBuffer();
        const pdf=await pdfjsLib.getDocument({data:buf}).promise;
        let text="";
        for(let i=1;i<=pdf.numPages;i++){const pg=await pdf.getPage(i);const tc=await pg.getTextContent();text+=tc.items.map(it=>it.str).join(" ")+"\n\n";}
        if(!text.trim()){setMicError("Couldn't extract text from this PDF. It might be scanned/image-based.");setFileLoading(false);return;}
        setAttachedFile({name:file.name,text});
      }catch(err){setMicError("Failed to read PDF: "+err.message);}
      setFileLoading(false);
    }else{
      const reader=new FileReader();
      reader.onload=()=>{setAttachedFile({name:file.name,text:reader.result});};
      reader.onerror=()=>{setMicError("Couldn't read that file.");};
      reader.readAsText(file);
    }
  };

  const thinkSteps=["Reading your question","Searching for the best approach","Preparing your answer"];
  const send=async(txt)=>{
    let t=(txt||input).trim();
    if(!t&&!attachedFile)return;if(loading)return;
    const cost=CREDIT_COST[model]||1;
    if(credits<cost){setMsgs(m=>[...m,{r:"ai",t:"⚠ Not enough credits. You need "+cost+" credit"+(cost>1?"s":"")+" for "+curModel.name+". Buy more or switch to a lighter model."}]);return;}
    let fileCtx=null;
    if(attachedFile){
      fileCtx=attachedFile;
      setAttachedFile(null);
    }
    const displayText=t||(fileCtx?"Uploaded "+fileCtx.name:"");
    const aiText=fileCtx?("[Uploaded file: "+fileCtx.name+"]\n\n"+fileCtx.text.slice(0,50000)+(t?"\n\n"+t:"\n\nSummarize the key points and help me understand this file.")):t;
    const newMsgs=[...msgs,{r:"user",t:displayText,file:fileCtx?fileCtx.name:null,_ai:aiText}];
    setMsgs(newMsgs);
    setInput("");
    setLoading(true);
    setThinkStep(thinkSteps[0]);
    let stepIdx=0;
    const stepTimer=setInterval(()=>{stepIdx++;if(stepIdx<thinkSteps.length)setThinkStep(thinkSteps[stepIdx]);},1200);
    try{
      const apiMsgs=newMsgs.map(m=>({r:m.r,t:m._ai||m.t}));
      const res=await authFetch("/api/chat",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({messages:apiMsgs,model})});
      const data=await res.json();
      clearInterval(stepTimer);
      setThinkStep("");
      if(data.error){setMsgs(m=>[...m,{r:"ai",t:"⚠ "+data.error}]);}
      else{
        if(typeof data.credits==="number"){setCredits(data.credits);setCreditsLS(data.credits);}
        const label=fileCtx?"Analyzed file and prepared response":"Analyzed your question and prepared response";
        setMsgs(m=>[...m,{r:"ai",t:data.reply,thinkLabel:label}]);
      }
    }catch(e){clearInterval(stepTimer);setThinkStep("");setMsgs(m=>[...m,{r:"ai",t:"⚠ "+e.message}]);}
    setLoading(false);
  };

  const quickActions=[
    {label:"Explain a concept",icon:Icon.star,prompt:"Explain this concept to me simply: "},
    {label:"Solve a problem",icon:Icon.zap,prompt:"Help me solve this step by step: "},
    {label:"Summarise notes",icon:Icon.file,prompt:"Summarise these notes for me: "},
    {label:"Quiz me",icon:Icon.layers,prompt:"Create a quick quiz to test my knowledge on: "},
  ];

  const modelSelector=(
    <div style={{position:"relative",display:"inline-flex"}}>
      <button onClick={()=>setModelOpen(o=>!o)} style={{display:"inline-flex",alignItems:"center",gap:6,padding:"6px 10px",borderRadius:8,border:"none",background:"transparent",color:T.muted,fontSize:12.5,fontWeight:500,cursor:"pointer",fontFamily:T.font,transition:"color 0.15s"}}>
        {curModel.name}
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
      </button>
      {modelOpen&&(<>
        <div onClick={()=>setModelOpen(false)} style={{position:"fixed",inset:0,zIndex:40}} />
        <div style={{position:"absolute",bottom:"100%",left:0,marginBottom:6,width:288,background:T.card,border:`1px solid ${T.border}`,borderRadius:12,boxShadow:"0 24px 60px -16px rgba(0,0,0,0.5)",zIndex:50,overflow:"hidden",padding:6}}>
          <div style={{fontSize:9.5,fontWeight:700,letterSpacing:"0.12em",textTransform:"uppercase",color:T.muted,padding:"6px 10px 4px"}}>Choose a model</div>
          {MODELS.map(m=>(
            <div key={m.id} onClick={()=>{setModel(m.id);lsSet("chatModel",m.id);setModelOpen(false);}} style={{display:"flex",gap:10,alignItems:"flex-start",padding:"10px 12px",borderRadius:8,cursor:"pointer",background:m.id===model?T.lime+"12":"transparent"}}>
              <span style={{width:16,height:16,marginTop:1,flexShrink:0,display:"flex",color:m.id===model?T.lime:T.faint}}>{m.id===model?Icon.check:Icon.dot}</span>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontSize:12.5,fontWeight:600,color:m.id===model?T.lime:T.text}}>{m.name}</div>
                <div style={{fontSize:11,color:T.muted,marginTop:1,lineHeight:1.35}}>{m.desc}</div>
              </div>
              <span style={{fontFamily:T.mono,fontSize:9.5,color:T.faint,flexShrink:0,marginTop:2}}>{m.cost}</span>
            </div>
          ))}
        </div>
      </>)}
    </div>
  );

  const inputBar=(compact)=>(
    <div style={{width:"100%",maxWidth:compact?undefined:680,margin:compact?undefined:"0 auto"}}>
      {attachedFile&&(
        <div style={{display:"flex",alignItems:"center",gap:8,padding:"6px 10px",background:T.lime+"15",border:`1px solid ${T.lime}33`,borderRadius:7,marginBottom:6}}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={T.lime} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
          <span style={{fontSize:12,color:T.lime,flex:1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{attachedFile.name}</span>
          <button onClick={()=>setAttachedFile(null)} style={{background:"none",border:"none",color:T.muted,cursor:"pointer",fontSize:14,lineHeight:1,padding:0}}>×</button>
        </div>
      )}
      <div style={{background:T.card,border:`1px solid ${T.border}`,borderRadius:16,overflow:"hidden",boxShadow:compact?"none":"0 8px 32px -8px rgba(0,0,0,0.2)"}}>
        <div style={{display:"flex",alignItems:"center",padding:"4px 8px 4px 16px",gap:4}}>
          <input ref={inputRef} style={{flex:1,background:"transparent",border:"none",padding:"14px 0",color:T.text,fontSize:14.5,fontFamily:T.font,outline:"none"}} placeholder={recording?"Listening — tap mic to stop...":loading?"Thinking...":"How can I help you today?"} value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();send();}}} disabled={loading} />
          <Btn onClick={()=>send()} style={{padding:"8px 12px",borderRadius:10,opacity:loading||(!input.trim()&&!attachedFile)?0.4:1}} disabled={loading||(!input.trim()&&!attachedFile)}>{Icon.send}</Btn>
        </div>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"0 8px 6px 8px",gap:8}}>
          <div style={{display:"flex",alignItems:"center",gap:2}}>
            <input type="file" ref={fileRef} onChange={handleFile} accept=".txt,.md,.csv,.json,.py,.js,.jsx,.ts,.tsx,.html,.css,.pdf,.doc,.docx,.rtf,.xml,.yaml,.yml,.log,.tex,.bib" style={{display:"none"}} />
            <button onClick={()=>fileRef.current?.click()} disabled={fileLoading} style={{display:"grid",placeItems:"center",width:32,height:32,borderRadius:8,border:"none",background:"transparent",color:fileLoading?T.lime:T.muted,cursor:"pointer",opacity:fileLoading?0.6:1,transition:"color 0.15s"}} title={fileLoading?"Reading file...":"Attach a file"}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            </button>
          </div>
          <div style={{display:"flex",alignItems:"center",gap:4}}>
            {modelSelector}
            <button onClick={toggleVoice} style={{display:"grid",placeItems:"center",width:32,height:32,borderRadius:8,border:"none",background:recording?"rgba(248,113,113,0.15)":"transparent",color:recording?"#f87171":T.muted,cursor:"pointer",transition:"color 0.15s",animation:recording?"studlinPulse 1.2s infinite":"none"}} title={recording?"Stop recording":"Voice input"}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>
            </button>
          </div>
        </div>
      </div>
      {micError&&<div style={{fontSize:11,color:"#f87171",marginTop:8,textAlign:"center",display:"flex",alignItems:"center",justifyContent:"center",gap:6}}><span>⚠ {micError}</span><button onClick={()=>setMicError("")} style={{background:"none",border:"none",color:"#f87171",cursor:"pointer",fontSize:11,fontFamily:T.font,textDecoration:"underline",padding:0}}>dismiss</button></div>}
    </div>
  );

  if(!hasMessages){
    return(
      <div style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",minHeight:"calc(100vh - 120px)",padding:"0 24px"}}>
        <div style={{display:"flex",flexDirection:"column",alignItems:"center",marginBottom:40,animation:"studlinRise 0.5s ease-out"}}>
          <div style={{width:44,height:44,borderRadius:12,background:T.lime,display:"grid",placeItems:"center",marginBottom:20,fontSize:22,fontWeight:800,color:T.ink||T.bg,fontFamily:T.font}}>S</div>
          <h1 style={{fontSize:32,fontWeight:700,color:T.white,letterSpacing:"-0.03em",margin:0,textAlign:"center",lineHeight:1.2}}>Welcome, {userName}.</h1>
        </div>
        {inputBar(false)}
        <div style={{display:"flex",gap:8,flexWrap:"wrap",justifyContent:"center",marginTop:20,animation:"studlinFade 0.6s ease-out 0.1s both"}}>
          {quickActions.map(a=>(
            <button key={a.label} onClick={()=>{setInput(a.prompt);setTimeout(()=>inputRef.current?.focus(),50);}} style={{display:"inline-flex",alignItems:"center",gap:7,padding:"9px 16px",borderRadius:99,border:`1px solid ${T.border}`,background:T.card,color:T.text,fontSize:12.5,fontWeight:500,cursor:"pointer",fontFamily:T.font,transition:"all 0.15s"}}>
              <span style={{display:"inline-flex",color:T.muted}}>{a.icon}</span>
              {a.label}
            </button>
          ))}
        </div>
        <div style={{fontSize:11,color:T.faint,marginTop:24}}><span style={{color:T.muted}}>{curModel.name}</span> · {credits} credits remaining</div>
      </div>
    );
  }

  return (
    <div style={{display:"flex",flexDirection:"column",height:"calc(100vh - 80px)"}}>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"12px 0 16px",flexShrink:0}}>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <button onClick={()=>setMsgs([])} style={{display:"inline-flex",alignItems:"center",gap:6,padding:"6px 12px",borderRadius:8,border:`1px solid ${T.border}`,background:T.card,color:T.muted,fontSize:12,fontWeight:500,cursor:"pointer",fontFamily:T.font}}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            New chat
          </button>
        </div>
        <div style={{fontSize:11,color:T.muted}}><span style={{color:credits<(CREDIT_COST[model]||1)?T.red||"#f87171":T.lime,fontWeight:600}}>{credits}</span> credits · {curModel.name}</div>
      </div>

      <div ref={chatRef} style={{flex:1,overflowY:"auto",paddingBottom:16}}>
        <div style={{maxWidth:720,margin:"0 auto"}}>
          {msgs.map((m,i)=>(
            <div key={i} style={{display:"flex",gap:12,alignItems:"flex-start",marginBottom:20,flexDirection:m.r==="user"?"row-reverse":"row"}}>
              {m.r==="ai"
                ?<div style={{width:28,height:28,borderRadius:7,background:T.lime,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:800,color:T.ink||T.bg,fontSize:13,flexShrink:0,marginTop:2,fontFamily:T.font}}>S</div>
                :<div style={{width:28,height:28,borderRadius:"50%",background:T.lime+"22",border:`1px solid ${T.lime}44`,display:"flex",alignItems:"center",justifyContent:"center",color:T.lime,flexShrink:0,marginTop:2}}>{Icon.user}</div>
              }
              <div style={{maxWidth:"80%",fontSize:14,lineHeight:1.7,color:T.text,whiteSpace:"pre-wrap"}}>
                {m.thinkLabel&&(
                  <div style={{fontSize:12,color:T.muted,marginBottom:6,display:"flex",alignItems:"center",gap:6}}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={T.muted} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                    {m.thinkLabel}
                  </div>
                )}
                {m.file&&(
                  <div style={{display:"inline-block",width:148,borderRadius:10,overflow:"hidden",border:`1px solid ${T.border}`,background:T.card,marginBottom:m.t&&m.t!=="Uploaded "+m.file?10:0,boxShadow:"0 2px 8px rgba(0,0,0,0.08)"}}>
                    <div style={{height:88,background:T.card2,display:"flex",alignItems:"center",justifyContent:"center",borderBottom:`1px solid ${T.border}`}}>
                      <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke={T.muted} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
                    </div>
                    <div style={{padding:"8px 10px"}}>
                      <div style={{fontSize:11.5,fontWeight:500,color:T.text,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",lineHeight:1.3}}>{m.file.replace(/\.[^.]+$/,"")}</div>
                      <div style={{marginTop:4}}><span style={{fontSize:9,fontWeight:700,letterSpacing:"0.08em",color:T.muted,background:T.muted+"22",padding:"2px 6px",borderRadius:3,textTransform:"uppercase"}}>{m.file.split(".").pop()}</span></div>
                    </div>
                  </div>
                )}
                {m.file&&m.t==="Uploaded "+m.file?null:m.t}
              </div>
            </div>
          ))}
          {loading&&(
            <div style={{display:"flex",gap:12,alignItems:"flex-start",marginBottom:20}}>
              <div style={{width:28,height:28,borderRadius:7,background:T.lime,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:800,color:T.ink||T.bg,fontSize:13,flexShrink:0,marginTop:2,fontFamily:T.font}}>S</div>
              <div style={{padding:"2px 0"}}>
                {thinkStep&&(
                  <div style={{fontSize:12.5,color:T.muted,marginBottom:4,display:"flex",alignItems:"center",gap:7,animation:"studlinFade 0.3s ease-out"}}>
                    <span style={{width:14,height:14,borderRadius:"50%",border:`2px solid ${T.lime}`,borderTopColor:"transparent",animation:"studlinSpin 0.7s linear infinite",display:"inline-block",flexShrink:0}} />
                    {thinkStep}
                  </div>
                )}
                {!thinkStep&&(
                  <div style={{display:"flex",gap:4,alignItems:"center",padding:"4px 0"}}><span style={{width:6,height:6,borderRadius:"50%",background:T.muted,animation:"studlinPulse 1.2s infinite"}}/><span style={{width:6,height:6,borderRadius:"50%",background:T.muted,animation:"studlinPulse 1.2s 0.2s infinite"}}/><span style={{width:6,height:6,borderRadius:"50%",background:T.muted,animation:"studlinPulse 1.2s 0.4s infinite"}}/></div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      <div style={{flexShrink:0,padding:"12px 0 8px",borderTop:`1px solid ${T.border}`}}>
        <div style={{maxWidth:720,margin:"0 auto"}}>
          {inputBar(true)}
        </div>
      </div>
    </div>
  );
}

// ─── ESSAYS ───────────────────────────────────────────────────────────────────
function Essays() {
  const [tab,setTab]=useState("active");
  const [newOpen,setNewOpen]=useState(false);
  const [eTitle,setETitle]=useState("");
  const [eSubject,setESubject]=useState("English IV");
  const [eTarget,setETarget]=useState("1500");
  const [ePrompt,setEPrompt]=useState("");
  const [eCustom,setECustom]=useState("");
  const [eMode,setEMode]=useState("self");
  const [gdocs,setGdocs]=useState(()=>lsGet("gdocs",false));
  const subjects=[{value:"English IV",label:"English IV",color:T.purple},{value:"Biology",label:"Biology",color:T.teal},{value:"History",label:"History",color:T.muted},{value:"Chemistry",label:"Chemistry",color:T.red},{value:"Calculus",label:"Calculus",color:T.blue},{value:"Other",label:"Other",color:T.lime}];
  const essays=[
    {title:"Power & Corruption in Macbeth",subject:"English IV",words:1247,target:1500,status:"In progress",grade:null},
    {title:"Photosynthesis Lab Report",subject:"Biology",words:800,target:800,status:"Submitted",grade:"A−"},
    {title:"Causes of World War I",subject:"History",words:450,target:1200,status:"Outline",grade:null},
  ];
  const subjectColor = {
    "English IV":T.purple,
    "Biology":T.teal,
    "History":T.blue,
  };
  return (
    <div>
      <PH title="Essays" sub="Draft, refine, and submit your writing" action={<span style={{display:"flex",gap:8}}><Btn variant="subtle" onClick={()=>{const v=!gdocs;setGdocs(v);lsSet("gdocs",v);}}>{React.createElement("span",{style:{display:"flex",alignItems:"center",gap:6}},gdocs?Icon.check:Icon.link,gdocs?"Google Docs · connected":"Connect Google Docs")}</Btn><Btn onClick={()=>setNewOpen(true)}>{React.createElement("span",{style:{display:"flex",alignItems:"center",gap:6}},Icon.plus,"New essay")}</Btn></span>} />
      <Modal open={newOpen} onClose={()=>setNewOpen(false)} title="Start a new essay" sub="Studlin will scaffold an outline and adapt the AI tutor to your subject."
        footer={<><Btn variant="subtle" onClick={()=>setNewOpen(false)}>Cancel</Btn><Btn onClick={()=>setNewOpen(false)}>{React.createElement("span",{style:{display:"flex",alignItems:"center",gap:6}},Icon.pen,"Create essay")}</Btn></>}>
        <Field label="Title"><Input placeholder="e.g. Ambition and ruin in Macbeth" value={eTitle} onChange={e=>setETitle(e.target.value)} autoFocus /></Field>
        <Field label="Subject"><SelectChip options={subjects} value={eSubject} onChange={setESubject} /></Field>
        {eSubject==="Other"&&<Field label="Custom subject"><Input placeholder="e.g. Physics, Economics, Psychology..." value={eCustom} onChange={ev=>setECustom(ev.target.value)} /></Field>}
        <Field label="How do you want to write it?">
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
            <button type="button" onClick={()=>setEMode("self")} style={{padding:14,borderRadius:10,border:"1px solid "+(eMode==="self"?T.lime+"66":T.border),background:eMode==="self"?T.lime+"10":T.card2,color:T.text,cursor:"pointer",textAlign:"left",fontFamily:T.font}}>
              <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:4}}><span style={{color:eMode==="self"?T.lime:T.muted,display:"flex"}}>{Icon.pen}</span><span style={{fontSize:13,fontWeight:600}}>Write it myself</span></div>
              <div style={{fontSize:11.5,color:T.muted}}>Blank editor. AI stays out of the way until you ask.</div>
            </button>
            <button type="button" onClick={()=>setEMode("ai")} style={{padding:14,borderRadius:10,border:"1px solid "+(eMode==="ai"?T.lime+"66":T.border),background:eMode==="ai"?T.lime+"10":T.card2,color:T.text,cursor:"pointer",textAlign:"left",fontFamily:T.font}}>
              <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:4}}><span style={{color:eMode==="ai"?T.lime:T.muted,display:"flex"}}>{Icon.wand}</span><span style={{fontSize:13,fontWeight:600}}>AI-assisted draft</span></div>
              <div style={{fontSize:11.5,color:T.muted}}>Outline plus a first draft in your voice · 5 credits.</div>
            </button>
          </div>
        </Field>
        <Field label="Word target"><Input type="number" value={eTarget} onChange={e=>setETarget(e.target.value)} /></Field>
        <Field label="Prompt or thesis (optional)" hint="Paste the assignment brief or sketch your argument.">
          <Textarea placeholder="e.g. Argue that Macbeth's downfall is caused by ambition, not the witches." value={ePrompt} onChange={e=>setEPrompt(e.target.value)} />
        </Field>
      </Modal>
      <Pills tabs={["active","library","templates"]} active={tab} onChange={setTab} />
      <div style={{display:"grid",gridTemplateColumns:"1fr 280px",gap:16}}>
        <div>
          {tab==="active"&&(
            <Card>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:16}}>
                <div>
                  <div style={{fontSize:15,fontWeight:700,color:T.white,marginBottom:3}}>Power &amp; Corruption in Macbeth</div>
                  <div style={{fontSize:12,color:T.muted}}>English IV · {(1247).toLocaleString()} / {(1500).toLocaleString()} words</div>
                </div>
                <Badge color={T.amber}>In progress</Badge>
              </div>
              <div style={{display:"flex",gap:2,background:T.card2,padding:"6px",borderRadius:"6px 6px 0 0",flexWrap:"wrap",border:`1px solid ${T.border}`,borderBottom:"none"}}>
                {[["B",Icon.bold],["I",Icon.italic],["Link",Icon.link],["Quote",Icon.quote]].map(([l,ico])=>(
                  <button key={l} style={{display:"flex",alignItems:"center",gap:4,padding:"5px 8px",borderRadius:4,border:"none",background:"transparent",color:T.muted,fontSize:12,cursor:"pointer",fontFamily:T.font}}>{ico} {l}</button>
                ))}
                <div style={{width:1,background:T.border,margin:"2px 4px"}} />
                {["H1","H2","H3"].map(h=><button key={h} style={{padding:"5px 8px",borderRadius:4,border:"none",background:"transparent",color:T.muted,fontSize:12,cursor:"pointer",fontFamily:T.font}}>{h}</button>)}
              </div>
              <div contentEditable suppressContentEditableWarning style={{background:T.card2,border:`1px solid ${T.border}`,borderRadius:"0 0 6px 6px",padding:16,minHeight:200,fontSize:14,lineHeight:1.8,color:T.text,outline:"none"}}>
                <p><strong style={{color:T.white,fontWeight:600}}>Introduction</strong></p>
                <p style={{marginTop:12}}>In Shakespeare's Macbeth, the corrupting influence of unchecked ambition is illustrated through the protagonist's descent from celebrated warrior to tyrannical murderer. The play explores how power, when pursued without moral constraint, dismantles the very humanity of those who seek it · a thesis the playwright reinforces through recurring imagery, soliloquy, and dramatic irony.</p>
              </div>
              <div style={{display:"flex",gap:8,marginTop:14,alignItems:"center"}}>
                <BtnSm variant="subtle">{Icon.wand} Refine prose</BtnSm>
                <BtnSm variant="subtle">{Icon.check} Grammar pass</BtnSm>
                <BtnSm variant="subtle">{Icon.quote} Cite source</BtnSm>
                <div style={{marginLeft:"auto",fontSize:11,color:T.faint}}>Saved automatically</div>
              </div>
            </Card>
          )}
          {tab==="library"&&(
            <div style={{display:"flex",flexDirection:"column",gap:8}}>
              {essays.map((e,i)=>(
                <Card key={i} onClick={()=>{}} style={{display:"flex",alignItems:"center",gap:16}}>
                  <div style={{width:3,height:40,borderRadius:2,background:subjectColor[e.subject]||T.lime,flexShrink:0}} />
                  <div style={{flex:1}}>
                    <div style={{fontSize:13,fontWeight:600,color:T.white,marginBottom:2}}>{e.title}</div>
                    <div style={{fontSize:11,color:T.muted}}>{e.subject} · {e.words.toLocaleString()} / {e.target.toLocaleString()} words</div>
                  </div>
                  <Badge color={e.status==="Submitted"?T.teal:e.status==="In progress"?T.amber:T.blue}>{e.status}</Badge>
                  {e.grade&&<div style={{fontSize:20,fontWeight:700,color:T.lime,letterSpacing:"-0.02em"}}>{e.grade}</div>}
                </Card>
              ))}
            </div>
          )}
          {tab==="templates"&&(
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
              {["Five-paragraph essay","Literary analysis","Scientific lab report","Argumentative essay","Compare & contrast","Research paper","Personal statement","Reflective journal"].map(t=>(
                <Card key={t} onClick={()=>{}} style={{cursor:"pointer",padding:16}}>
                  <div style={{width:32,height:32,borderRadius:6,background:T.card2,border:`1px solid ${T.border}`,display:"flex",alignItems:"center",justifyContent:"center",color:T.muted,marginBottom:10}}>{Icon.file}</div>
                  <div style={{fontSize:13,fontWeight:600,color:T.white,marginBottom:2}}>{t}</div>
                  <div style={{fontSize:11,color:T.muted}}>Structured template</div>
                </Card>
              ))}
            </div>
          )}
        </div>
        <div style={{display:"flex",flexDirection:"column",gap:12}}>
          <Card style={{background:T.lime,border:"none"}}>
            <Label style={{color:T.bg}}>Word count</Label>
            <div style={{fontSize:32,fontWeight:700,color:T.bg,letterSpacing:"-0.03em",lineHeight:1}}>1,247</div>
            <div style={{marginTop:10,height:4,background:T.bg+"22",borderRadius:2,overflow:"hidden"}}><div style={{height:"100%",width:"83%",background:T.bg,borderRadius:2}} /></div>
            <div style={{fontSize:12,color:T.bg,opacity:0.7,marginTop:5}}>253 words remaining</div>
          </Card>
          <Card>
            <Label>Writing feedback</Label>
            {[["Strengthen thesis statement",T.amber],["Include counterargument",T.amber],["Expand textual evidence",T.red],["Conclusion is underdeveloped",T.red]].map(([s,c],i)=>(
              <div key={i} style={{display:"flex",gap:8,padding:"8px 0",borderBottom:i<3?`1px solid ${T.border}`:"none",fontSize:12,color:T.muted}}>
                <div style={{width:5,height:5,borderRadius:"50%",background:c,flexShrink:0,marginTop:5}} />
                {s}
              </div>
            ))}
          </Card>
          <Card>
            <Label>Readability</Label>
            <div style={{fontSize:32,fontWeight:700,color:T.white,letterSpacing:"-0.02em"}}>B+</div>
            <div style={{fontSize:12,color:T.muted,marginTop:4}}>Grade 11 reading level</div>
          </Card>
        </div>
      </div>
    </div>
  );
}

// ─── FLASHCARDS ───────────────────────────────────────────────────────────────
function Flashcards() {
  const MicIcon=<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{flexShrink:0,display:"block"}}><rect x="9" y="2" width="6" height="12" rx="3"/><path d="M5 10v1a7 7 0 0 0 14 0v-1"/><line x1="12" y1="18" x2="12" y2="22"/></svg>;
  const [deckList,setDeckList]=useState(()=>{const d=lsGet("decks",null);return(d&&Array.isArray(d))?d:[];});
  const [studyDeck,setStudyDeck]=useState(null);
  const [flipped,setFlipped]=useState(false);
  const [idx,setIdx]=useState(0);
  const [tab,setTab]=useState("decks");
  const [newOpen,setNewOpen]=useState(false);
  const [dName,setDName]=useState("");
  const [dSource,setDSource]=useState("manual");
  const [aiLoading,setAiLoading]=useState(false);
  const [fileText,setFileText]=useState("");
  const fileRef=useRef(null);
  const [ytUrl,setYtUrl]=useState("");
  const [ytInfo,setYtInfo]=useState("");
  const [ytFetching,setYtFetching]=useState(false);
  const [recOn,setRecOn]=useState(false);
  const [recSecs,setRecSecs]=useState(0);
  const [recText,setRecText]=useState("");
  const recRef=useRef(null);
  const [cQ,setCQ]=useState("");
  const [cA,setCA]=useState("");
  const [draft,setDraft]=useState([]);
  const colorMap={Biology:T.teal,"English IV":T.purple,Calculus:T.blue,Spanish:T.amber,Chemistry:T.red};

  useEffect(()=>{if(!recOn)return;const id=setInterval(()=>setRecSecs(x=>x+1),1000);return()=>clearInterval(id);},[recOn]);
  const fmtRec=(x)=>String(Math.floor(x/60)).padStart(2,"0")+":"+String(x%60).padStart(2,"0");

  const startRec=()=>{const SR=window.SpeechRecognition||window.webkitSpeechRecognition;if(!SR)return;const r=new SR();r.continuous=true;r.interimResults=true;r.lang="en-US";r.onresult=(e)=>{let t="";for(let i=0;i<e.results.length;i++)t+=e.results[i][0].transcript;setRecText(t);};r.onend=()=>setRecOn(false);recRef.current=r;r.start();setRecOn(true);setRecSecs(0);setRecText("");};
  const stopRec=()=>{if(recRef.current)recRef.current.stop();setRecOn(false);};

  const handleFile=async(e)=>{const file=e.target.files&&e.target.files[0];if(!file)return;e.target.value="";const ext=file.name.split(".").pop().toLowerCase();if(ext==="pdf"){try{const pdfjsLib=await window._pdfjs;const buf=await file.arrayBuffer();const pdf=await pdfjsLib.getDocument({data:buf}).promise;let text="";for(let i=1;i<=pdf.numPages;i++){const pg=await pdf.getPage(i);const tc=await pg.getTextContent();text+=tc.items.map(it=>it.str).join(" ")+"\n\n";}setFileText(text);if(!dName)setDName("Cards from "+file.name);}catch(err){setFileText("Could not read PDF.");}}else{const reader=new FileReader();reader.onload=()=>{setFileText(reader.result);if(!dName)setDName("Cards from "+file.name);};reader.readAsText(file);}};

  const aiGenCards=async(content,context)=>{
    setAiLoading(true);
    try{
      const prompt="Hey Studlin, I need you to help me make flashcards for studying. Can you create 10 flashcards from this "+context+"? Please format them as a JSON array where each card has a \"q\" key for the question and an \"a\" key for the answer. Just give me the JSON array directly so I can import them into my deck. Here's the material:\n\n"+content.slice(0,15000);
      const res=await authFetch("/api/chat",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({messages:[{r:"user",t:prompt}],model:"standard"})});
      const data=await res.json();
      var raw=(data.reply||"").replace(/```json?|```/g,"").trim();
      var jsonStart=raw.indexOf("[");var jsonEnd=raw.lastIndexOf("]");
      if(jsonStart>=0&&jsonEnd>jsonStart){raw=raw.slice(jsonStart,jsonEnd+1);}
      try{var parsed=JSON.parse(raw);setAiLoading(false);return Array.isArray(parsed)?parsed:[];}
      catch(pe){
        var cards=[];var qMatches=raw.match(/"q"\s*:\s*"([^"]+)"/g)||[];var aMatches=raw.match(/"a"\s*:\s*"([^"]+)"/g)||[];
        for(var i=0;i<Math.min(qMatches.length,aMatches.length);i++){cards.push({q:qMatches[i].replace(/"q"\s*:\s*"/,"").replace(/"$/,""),a:aMatches[i].replace(/"a"\s*:\s*"/,"").replace(/"$/,"")});}
        setAiLoading(false);return cards;
      }
    }catch(e){setAiLoading(false);return [{q:"Error generating cards",a:e.message||"Try again"}];}
  };

  const createDeck=async()=>{
    const name=dName.trim()||"New deck";
    let cards=[];
    if(dSource==="manual"){cards=[...draft];}
    else if(dSource==="file"){
      if(!fileText){cards=[{q:"No file loaded",a:"Upload a PDF or text file first"}];}
      else{cards=await aiGenCards(fileText,"document/notes");}
    }
    else if(dSource==="youtube"){
      var topic=ytInfo||dName||ytUrl;
      if(!topic){cards=[{q:"No video detected",a:"Paste a YouTube link first"}];}
      else{cards=await aiGenCards("The topic is: "+topic+". Create 10 detailed study flashcards covering the key concepts, definitions, and important facts about this topic.","topic");}
    }
    else if(dSource==="record"){
      if(!recText){cards=[{q:"No audio recorded",a:"Record a lecture first"}];}
      else{cards=await aiGenCards("Lecture transcription:\n\n"+recText,"lecture transcription");}
    }
    if(cards.length===0){cards=[{q:"No cards were generated",a:"Try again with more content"}];}
    const nd={id:String(Date.now()),name:name,count:cards.length,done:0,color:T.lime,cards:cards};
    const next=[nd,...deckList];setDeckList(next);lsSet("decks",next);
    setNewOpen(false);setDName("");setDraft([]);setFileText("");setYtUrl("");setYtInfo("");setYtFetching(false);stopRec();setRecText("");setDSource("manual");
    setStudyDeck(nd);setTab("study");setIdx(0);setFlipped(false);
  };

  const addCard=()=>{if(!cQ.trim())return;setDraft(d=>[...d,{q:cQ.trim(),a:cA.trim()||"(no answer)"}]);setCQ("");setCA("");};
  const deleteDeck=(id)=>{const next=deckList.filter(d=>d.id!==id);setDeckList(next);lsSet("decks",next);if(studyDeck&&studyDeck.id===id){setStudyDeck(null);setTab("decks");}};
  const [sendDeckOpen,setSendDeckOpen]=useState(false);
  const [sendDeckTarget,setSendDeckTarget]=useState("");
  const [sendDeckId,setSendDeckId]=useState(null);
  const [sendDeckStatus,setSendDeckStatus]=useState("");
  const sendDeck=(deck)=>{setSendDeckId(deck.id);setSendDeckOpen(true);};
  const confirmSendDeck=()=>{
    const t=sendDeckTarget.trim();
    if(!t||!sendDeckId)return;
    const deck=deckList.find(d=>d.id===sendDeckId);
    if(!deck)return;
    const pending=lsGet("pendingShares",[]);
    pending.push({type:"deck",name:deck.name,cards:deck.cards,to:t,from:getUserName(),date:dayKey()});
    lsSet("pendingShares",pending);
    setSendDeckStatus("sent");
    setTimeout(()=>{setSendDeckOpen(false);setSendDeckTarget("");setSendDeckId(null);setSendDeckStatus("");},1800);
  };

  const studyCards=studyDeck?studyDeck.cards:[];
  const curCard=studyCards[idx];

  return (
    <div>
      <PH title="Flashcards" sub="Study with spaced repetition" action={<Btn onClick={()=>setNewOpen(true)}>{React.createElement("span",{style:{display:"flex",alignItems:"center",gap:6}},Icon.plus,"New deck")}</Btn>} />
      <Modal open={sendDeckOpen} onClose={()=>{setSendDeckOpen(false);setSendDeckTarget("");setSendDeckId(null);setSendDeckStatus("");}} title="Send deck to a friend" sub="Beam this entire deck into a friend's Studlin workspace." width={440}
        footer={sendDeckStatus==="sent"?null:<><Btn variant="subtle" onClick={()=>{setSendDeckOpen(false);setSendDeckTarget("");setSendDeckId(null);setSendDeckStatus("");}}>Cancel</Btn><Btn onClick={confirmSendDeck} style={{opacity:sendDeckTarget.trim()?1:0.45}}>{Icon.send} Send deck</Btn></>}>
        {sendDeckStatus==="sent"
          ?<div style={{textAlign:"center",padding:"24px 0"}}>
              <div style={{fontSize:32,marginBottom:12}}>✓</div>
              <div style={{fontSize:15,fontWeight:600,color:T.white,marginBottom:4}}>Deck sent!</div>
              <div style={{fontSize:13,color:T.muted}}>Sent to <strong style={{color:T.lime}}>{sendDeckTarget}</strong></div>
            </div>
          :<>
              {sendDeckId&&(()=>{const d=deckList.find(x=>x.id===sendDeckId);return d?<div style={{padding:"12px 14px",background:T.card2,borderRadius:8,border:`1px solid ${T.border}`,marginBottom:14}}><div style={{fontSize:12,fontWeight:600,color:T.white,marginBottom:2}}>{d.name}</div><div style={{fontSize:11,color:T.muted}}>{d.cards?d.cards.length:0} cards</div></div>:null;})()}
              <Field label="Friend's Studlin username or email">
                <Input placeholder="e.g. @alex or alex@school.edu" value={sendDeckTarget} onChange={e=>setSendDeckTarget(e.target.value)} autoFocus />
              </Field>
            </>
        }
      </Modal>
      <Modal open={newOpen} onClose={()=>{setNewOpen(false);stopRec();}} title="Create a flashcard deck" sub="Build manually, from a file, YouTube video, or recorded lecture." width={580}
        footer={<><Btn variant="subtle" onClick={()=>{setNewOpen(false);stopRec();}}>Cancel</Btn><Btn onClick={createDeck} disabled={aiLoading||ytFetching}>{aiLoading?"Generating cards...":ytFetching?"Detecting video...":React.createElement("span",{style:{display:"flex",alignItems:"center",gap:6}},Icon.layers,"Create deck")}</Btn></>}>
        <Field label="Deck name"><Input placeholder="e.g. Bio chapter 4 cards" value={dName} onChange={e=>setDName(e.target.value)} autoFocus /></Field>
        <Field label="Source">
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
            {[{id:"manual",label:"Build manually",desc:"Type Q&A cards yourself",icon:Icon.pen},{id:"file",label:"From file",desc:"PDF or notes — AI generates cards",icon:Icon.file},{id:"youtube",label:"From YouTube",desc:"Video topic — AI generates cards",icon:Icon.link},{id:"record",label:"From lecture",desc:"Record audio — AI generates cards",icon:MicIcon}].map(o=>(
              <button key={o.id} type="button" onClick={()=>setDSource(o.id)} style={{padding:12,borderRadius:10,border:"1px solid "+(dSource===o.id?T.lime+"66":T.border),background:dSource===o.id?T.lime+"10":T.card2,color:T.text,cursor:"pointer",textAlign:"left",fontFamily:T.font}}>
                <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:3}}><span style={{color:dSource===o.id?T.lime:T.muted,display:"flex"}}>{o.icon}</span><span style={{fontSize:12.5,fontWeight:600}}>{o.label}</span></div>
                <div style={{fontSize:11,color:T.muted}}>{o.desc}</div>
              </button>
            ))}
          </div>
        </Field>
        {dSource==="manual"&&(<>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:8}}>
            <Field label="Question"><Input placeholder="Front of card..." value={cQ} onChange={e=>setCQ(e.target.value)} /></Field>
            <Field label="Answer"><Input placeholder="Back of card..." value={cA} onChange={e=>setCA(e.target.value)} /></Field>
          </div>
          <div style={{display:"flex",gap:8,marginBottom:8}}><BtnSm onClick={addCard}>+ Add card</BtnSm><span style={{fontSize:11,color:T.muted,lineHeight:"28px"}}>{draft.length} card{draft.length===1?"":"s"}</span></div>
          {draft.length>0&&<div style={{maxHeight:120,overflowY:"auto",display:"flex",flexDirection:"column",gap:4}}>{draft.map((c,i)=>(<div key={i} style={{display:"flex",gap:8,padding:"6px 10px",background:T.card2,borderRadius:6,fontSize:11,alignItems:"center"}}><span style={{color:T.text,flex:1}}>{c.q}</span><span style={{color:T.muted,flex:1}}>{c.a}</span><button onClick={()=>setDraft(d=>d.filter((_,j)=>j!==i))} style={{background:"none",border:"none",color:T.faint,cursor:"pointer"}}>{Icon.xmark}</button></div>))}</div>}
        </>)}
        {dSource==="file"&&(
          <Field label="Upload a file" hint="AI reads the content and generates Q&A flashcards.">
            <input type="file" ref={fileRef} onChange={handleFile} accept=".txt,.md,.csv,.pdf,.doc,.docx" style={{display:"none"}} />
            <div onClick={()=>fileRef.current&&fileRef.current.click()} style={{border:"1px dashed "+T.borderHover,borderRadius:10,padding:22,textAlign:"center",background:T.card2,cursor:"pointer"}}>
              <div style={{color:T.muted,marginBottom:6,display:"flex",justifyContent:"center"}}>{Icon.file}</div>
              <div style={{fontSize:13,color:T.text,fontWeight:500}}>{fileText?"File loaded ("+fileText.length+" chars)":"Click to browse"}</div>
            </div>
          </Field>
        )}
        {dSource==="youtube"&&(
          <Field label="YouTube link" hint={ytInfo?"Found: "+ytInfo:"Paste a link — Studlin detects the topic and generates cards."}>
            <Input placeholder="https://youtube.com/watch?v=..." value={ytUrl} onChange={ev=>{setYtUrl(ev.target.value);var v=ev.target.value.trim();if(v&&(v.includes("youtube.com")||v.includes("youtu.be"))){setYtFetching(true);setYtInfo("");fetch("/api/youtube-info",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({url:v})}).then(function(r){return r.json();}).then(function(d){if(d.title){setYtInfo(d.title+(d.author?" by "+d.author:""));setDName(d.title+" cards");}setYtFetching(false);}).catch(function(){setYtFetching(false);});}}} />
            {ytFetching&&<div style={{fontSize:11,color:T.lime,marginTop:6}}>Detecting video title...</div>}
            {ytInfo&&!ytFetching&&<div style={{fontSize:11,color:T.lime,fontWeight:600,marginTop:6}}>Found: {ytInfo}</div>}
          </Field>
        )}
        {dSource==="record"&&(
          <Field label="Record lecture" hint="Speak or play audio — AI generates flashcards from what it hears.">
            <div style={{border:"1px solid "+(recOn?T.red+"55":T.border),borderRadius:10,padding:18,textAlign:"center",background:recOn?T.red+"0a":T.card2}}>
              <button type="button" onClick={recOn?stopRec:startRec} style={{width:48,height:48,borderRadius:"50%",border:"none",background:recOn?T.red:T.lime,color:recOn?"#fff":T.ink,cursor:"pointer",display:"inline-flex",alignItems:"center",justifyContent:"center",marginBottom:8}}>{recOn?<span style={{width:14,height:14,background:"#fff",borderRadius:3}} />:MicIcon}</button>
              <div style={{fontSize:14,fontWeight:700,color:recOn?T.red:T.white}}>{fmtRec(recSecs)}</div>
              <div style={{fontSize:11,color:T.muted,marginTop:2}}>{recOn?"Recording... tap to stop":"Tap to start"}</div>
              {recText&&<div style={{fontSize:11,color:T.text,marginTop:10,padding:"8px 10px",background:T.card,borderRadius:6,textAlign:"left",maxHeight:80,overflowY:"auto"}}>{recText}</div>}
            </div>
          </Field>
        )}
      </Modal>
      <Pills tabs={["study","decks"]} active={tab} onChange={setTab} />
      {tab==="study"&&(
        studyDeck&&studyCards.length>0?
        <div style={{maxWidth:600,margin:"0 auto"}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
            <div style={{fontSize:13,fontWeight:600,color:T.white}}>{studyDeck.name}</div>
            <div style={{fontSize:12,color:T.muted}}>Card {idx+1} of {studyCards.length}</div>
          </div>
          <div onClick={()=>setFlipped(f=>!f)} style={{cursor:"pointer",userSelect:"none"}}>
            {!flipped
              ?<Card style={{minHeight:200,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",textAlign:"center",padding:32,background:T.card2}}>
                  <div style={{fontSize:15,fontWeight:600,color:T.white,lineHeight:1.6,marginBottom:12}}>{curCard?curCard.q:"No question"}</div>
                  <div style={{fontSize:11,color:T.faint,letterSpacing:"0.03em"}}>CLICK TO REVEAL</div>
                </Card>
              :<div style={{background:T.lime,borderRadius:10,minHeight:200,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",textAlign:"center",padding:32}}>
                  <div style={{fontSize:14,fontWeight:600,color:T.bg,lineHeight:1.7,marginBottom:10}}>{curCard?curCard.a:"No answer"}</div>
                  <div style={{fontSize:11,color:T.bg,opacity:0.5}}>RATE YOUR RECALL</div>
                </div>
            }
          </div>
          <div style={{display:"flex",gap:8,marginTop:14,justifyContent:"center"}}>
            {flipped
              ?[["Missed",T.red],["Hard",T.amber],["Good",T.teal],["Mastered",T.lime]].map(([l,c])=>(
                  <button key={l} onClick={()=>{awardFlashcardXP(l);setFlipped(false);setIdx(i=>(i+1)%studyCards.length);}} style={{flex:1,padding:"9px 0",borderRadius:7,background:c+"14",color:c,border:"1px solid "+c+"33",cursor:"pointer",fontSize:12,fontWeight:600,fontFamily:T.font}}>{l}</button>
                ))
              :<><Btn variant="ghost" onClick={()=>{setFlipped(false);setIdx(i=>Math.max(0,i-1));}}>Prev</Btn><Btn onClick={()=>setFlipped(true)}>Reveal answer</Btn><Btn variant="ghost" onClick={()=>{setFlipped(false);setIdx(i=>(i+1)%studyCards.length);}}>Next</Btn></>
            }
          </div>
        </div>
        :<Card style={{padding:32,textAlign:"center"}}><div style={{fontSize:14,color:T.muted,marginBottom:16}}>Select a deck to study or create a new one.</div><div style={{display:"flex",gap:8,justifyContent:"center"}}><Btn onClick={()=>setNewOpen(true)}>{Icon.plus} New deck</Btn><Btn variant="ghost" onClick={()=>setTab("decks")}>Browse decks</Btn></div></Card>
      )}
      {tab==="decks"&&(
        <div>
          {deckList.length===0&&<Card style={{padding:24,textAlign:"center"}}><div style={{fontSize:13,color:T.muted,marginBottom:12}}>No decks yet. Create your first one.</div><Btn onClick={()=>setNewOpen(true)}>{Icon.plus} New deck</Btn></Card>}
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
            {deckList.map((d,i)=>(
              <Card key={d.id||i} style={{cursor:"pointer",position:"relative"}}>
                <button onClick={(e)=>{e.stopPropagation();deleteDeck(d.id);}} style={{position:"absolute",top:12,right:12,background:"none",border:"none",color:T.faint,cursor:"pointer",fontSize:14}}>x</button>
                <div style={{fontSize:13,fontWeight:700,color:T.white,marginBottom:4}}>{d.name}</div>
                <div style={{fontSize:11,color:T.muted,marginBottom:14}}>{d.cards?d.cards.length:d.count} cards</div>
                <div style={{display:"flex",gap:6}}>
                  <BtnSm onClick={()=>{setStudyDeck(d);setTab("study");setIdx(0);setFlipped(false);}}>Study now</BtnSm>
                  <BtnSm variant="ghost" onClick={(e)=>{e.stopPropagation();sendDeck(d);}}>{Icon.send} Send</BtnSm>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── NOTES ────────────────────────────────────────────────────────────────────
function Notes(){
  const MicIcon=<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{flexShrink:0,display:"block"}}><rect x="9" y="2" width="6" height="12" rx="3"/><path d="M5 10v1a7 7 0 0 0 14 0v-1"/><line x1="12" y1="18" x2="12" y2="22"/></svg>;
  const tagColor={Biology:T.teal,English:T.purple,Calculus:T.blue,Spanish:T.amber,Chemistry:T.red,History:T.muted};
  const colorOf=(tg)=>tagColor[tg]||T.lime;
  const [notes,setNotes]=useState(()=>{const n=lsGet("notes",null);return(n&&Array.isArray(n))?n.filter(x=>x&&x.title):[];});
  const [sel,setSel]=useState(null);
  const [search,setSearch]=useState("");
  const filtered=notes.filter(n=>n.title.toLowerCase().includes(search.toLowerCase())||n.body.toLowerCase().includes(search.toLowerCase()));
  const [newOpen,setNewOpen]=useState(false);
  const [src,setSrc]=useState("write");
  const [newTitle,setNewTitle]=useState("");
  const [newBody,setNewBody]=useState("");
  const [newTag,setNewTag]=useState("Biology");
  const [customTag,setCustomTag]=useState("");
  const [yt,setYt]=useState("");
  const [ytInfo,setYtInfo]=useState("");
  const [ytLoading,setYtLoading]=useState(false);
  const [rec,setRec]=useState(false);
  const [recSecs,setRecSecs]=useState(0);
  const [recText,setRecText]=useState("");
  const recognitionRef=useRef(null);
  const [aiLoading,setAiLoading]=useState(false);
  const [fileText,setFileText]=useState("");
  const fileRef=useRef(null);
  useEffect(()=>{if(!rec)return;const id=setInterval(()=>setRecSecs(x=>x+1),1000);return ()=>clearInterval(id);},[rec]);
  const fmtRec=(x)=>String(Math.floor(x/60)).padStart(2,"0")+":"+String(x%60).padStart(2,"0");
  const tagOptions=[{value:"Biology",label:"Biology",color:T.teal},{value:"English",label:"English",color:T.purple},{value:"Calculus",label:"Calculus",color:T.blue},{value:"Spanish",label:"Spanish",color:T.amber},{value:"Chemistry",label:"Chemistry",color:T.red},{value:"History",label:"History",color:T.muted},{value:"Other",label:"Other",color:T.lime}];
  const sources=[
    {id:"write",label:"Write",desc:"Type or paste notes yourself",icon:Icon.pen,cost:null},
    {id:"file",label:"Scan a file",desc:"PDF, slides, or photos of the board",icon:Icon.file,cost:"2 credits"},
    {id:"record",label:"Record lecture",desc:"Live transcription + summary",icon:MicIcon,cost:"3 credits"},
    {id:"youtube",label:"YouTube link",desc:"Transcribes and summarises a video",icon:Icon.link,cost:"3 credits"},
  ];

  const startRec=()=>{
    const SR=window.SpeechRecognition||window.webkitSpeechRecognition;
    if(!SR){setRecText("Speech recognition not supported. Try Chrome.");return;}
    const r=new SR();r.continuous=true;r.interimResults=true;r.lang="en-US";
    r.onresult=(e)=>{let t="";for(let i=0;i<e.results.length;i++)t+=e.results[i][0].transcript;setRecText(t);};
    r.onerror=()=>{setRec(false);};
    r.onend=()=>{setRec(false);};
    recognitionRef.current=r;r.start();setRec(true);setRecSecs(0);setRecText("");
  };
  const stopRec=()=>{if(recognitionRef.current)recognitionRef.current.stop();setRec(false);};

  const handleFile=async(e)=>{
    const file=e.target.files&&e.target.files[0];if(!file)return;
    e.target.value="";
    const ext=file.name.split(".").pop().toLowerCase();
    if(ext==="pdf"){
      try{const pdfjsLib=await window._pdfjs;const buf=await file.arrayBuffer();const pdf=await pdfjsLib.getDocument({data:buf}).promise;let text="";for(let i=1;i<=pdf.numPages;i++){const pg=await pdf.getPage(i);const tc=await pg.getTextContent();text+=tc.items.map(it=>it.str).join(" ")+"\n\n";}setFileText(text);if(!newTitle)setNewTitle("Notes from "+file.name);}catch(err){setFileText("Could not read PDF: "+err.message);}
    }else{
      const reader=new FileReader();reader.onload=()=>{setFileText(reader.result);if(!newTitle)setNewTitle("Notes from "+file.name);};reader.readAsText(file);
    }
  };

  const aiSummarize=async(text,context)=>{
    setAiLoading(true);
    try{
      const prompt="Summarize the following "+context+" into well-structured study notes. Use headings, bullet points, and key terms. Be thorough but concise:\n\n"+text.slice(0,30000);
      const res=await authFetch("/api/chat",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({messages:[{r:"user",t:prompt}],model:"flash"})});
      const data=await res.json();
      setAiLoading(false);
      return data.reply||text;
    }catch(e){setAiLoading(false);return text;}
  };

  const saveNote=async()=>{
    const tag=newTag==="Other"&&customTag.trim()?customTag.trim():newTag;
    let title=newTitle.trim();
    let body="";

    if(src==="write"){
      body=newBody.trim()||"Empty note";
      if(!title)title="Untitled note";
    }else if(src==="file"){
      if(!title)title="Scanned notes";
      if(fileText.trim()){body=await aiSummarize(fileText,"document/file");}else{body="No file content to process.";}
    }else if(src==="record"){
      if(!title)title="Lecture notes - "+fmtRec(recSecs);
      if(recText.trim()){body=await aiSummarize(recText,"lecture transcription");}else{body="No audio was captured. Try recording again.";}
    }else if(src==="youtube"){
      var videoTitle=ytInfo||yt.trim();
      if(!title)title=ytInfo?ytInfo:"Notes from video";
      if(videoTitle){
        body=await aiSummarize("Create comprehensive study notes on this topic from a YouTube video titled: \""+videoTitle+"\". Include clear headings, bullet points, key definitions, examples, and a summary. Write the notes directly — do not say you cannot access the video.","YouTube video study notes");
      }else{body="Paste a YouTube link to auto-detect the topic.";}
    }

    const next=[{id:String(Date.now()),title:title,body:body,tag:tag,date:new Date().toLocaleDateString("en-US",{month:"short",day:"numeric"}),createdAt:Date.now()}].concat(notes);
    setNotes(next);lsSet("notes",next);
    setNewOpen(false);setNewTitle("");setNewBody("");setYt("");setYtInfo("");setRec(false);setRecSecs(0);setRecText("");setSrc("write");setFileText("");setSel(0);setSearch("");
  };

  const updateNote=(idx,updates)=>{const next=notes.map((n,i)=>i===idx?Object.assign({},n,updates):n);setNotes(next);lsSet("notes",next);};
  const deleteNote=(idx)=>{const next=notes.filter((_,i)=>i!==idx);setNotes(next);lsSet("notes",next);if(sel===idx)setSel(null);else if(sel>idx)setSel(sel-1);};
  const exportNote=(n)=>{navigator.clipboard&&navigator.clipboard.writeText(n.title+"\n\n"+n.body);};
  const [sendNoteOpen,setSendNoteOpen]=useState(false);
  const [sendNoteTarget,setSendNoteTarget]=useState("");
  const [sendNoteStatus,setSendNoteStatus]=useState("");
  const sendNote=()=>{
    const t=sendNoteTarget.trim();
    if(!t||sel===null)return;
    const pending=lsGet("pendingShares",[]);
    pending.push({type:"note",title:notes[sel].title,body:notes[sel].body,tag:notes[sel].tag,to:t,from:getUserName(),date:dayKey()});
    lsSet("pendingShares",pending);
    setSendNoteStatus("sent");
    setTimeout(()=>{setSendNoteOpen(false);setSendNoteTarget("");setSendNoteStatus("");},1800);
  };

  return (
    <div>
      <PH title="Notes" sub="Write, scan, record, or import" action={<Btn onClick={()=>setNewOpen(true)}>{React.createElement("span",{style:{display:"flex",alignItems:"center",gap:6}},Icon.plus,"New note")}</Btn>} />
      <Modal open={sendNoteOpen} onClose={()=>{setSendNoteOpen(false);setSendNoteTarget("");setSendNoteStatus("");}} title="Send note to a friend" sub="Drop a copy of this note directly into a friend's Studlin workspace." width={440}
        footer={sendNoteStatus==="sent"?null:<><Btn variant="subtle" onClick={()=>{setSendNoteOpen(false);setSendNoteTarget("");setSendNoteStatus("");}}>Cancel</Btn><Btn onClick={sendNote} style={{opacity:sendNoteTarget.trim()?1:0.45}}>{Icon.send} Send note</Btn></>}>
        {sendNoteStatus==="sent"
          ?<div style={{textAlign:"center",padding:"24px 0"}}>
              <div style={{fontSize:32,marginBottom:12}}>✓</div>
              <div style={{fontSize:15,fontWeight:600,color:T.white,marginBottom:4}}>Note sent!</div>
              <div style={{fontSize:13,color:T.muted}}>"{sel!==null&&notes[sel]?notes[sel].title:""}" was sent to <strong style={{color:T.lime}}>{sendNoteTarget}</strong></div>
            </div>
          :<>
              <div style={{padding:"12px 14px",background:T.card2,borderRadius:8,border:`1px solid ${T.border}`,marginBottom:14}}>
                <div style={{fontSize:12,fontWeight:600,color:T.white,marginBottom:2}}>{sel!==null&&notes[sel]?notes[sel].title:"Selected note"}</div>
                <div style={{fontSize:11,color:T.muted}}>{sel!==null&&notes[sel]?notes[sel].body.slice(0,80)+"…":""}</div>
              </div>
              <Field label="Friend's Studlin username or email">
                <Input placeholder="e.g. @alex or alex@school.edu" value={sendNoteTarget} onChange={e=>setSendNoteTarget(e.target.value)} autoFocus />
              </Field>
            </>
        }
      </Modal>
      <Modal open={newOpen} onClose={()=>{setNewOpen(false);stopRec();}} title="Create a new note" sub="Pick a source. Studlin structures everything into clean, searchable notes." width={580}
        footer={<><Btn variant="subtle" onClick={()=>{setNewOpen(false);stopRec();}}>Cancel</Btn><Btn onClick={saveNote} disabled={aiLoading}>{aiLoading?"Processing...":React.createElement("span",{style:{display:"flex",alignItems:"center",gap:6}},Icon.check,src==="write"?"Save note":"Create note")}</Btn></>}>
        <Field label="Source">
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
            {sources.map(o=>(
              <button key={o.id} type="button" onClick={()=>setSrc(o.id)} style={{padding:"12px 14px",borderRadius:10,border:"1px solid "+(src===o.id?T.lime+"66":T.border),background:src===o.id?T.lime+"10":T.card2,color:T.text,cursor:"pointer",textAlign:"left",fontFamily:T.font,position:"relative"}}>
                {o.cost&&<span style={{position:"absolute",top:8,right:10,fontSize:9,fontFamily:T.mono,color:src===o.id?T.lime:T.faint,letterSpacing:"0.05em"}}>{o.cost}</span>}
                <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:3}}><span style={{color:src===o.id?T.lime:T.muted,display:"flex"}}>{o.icon}</span><span style={{fontSize:12.5,fontWeight:600}}>{o.label}</span></div>
                <div style={{fontSize:11,color:T.muted}}>{o.desc}</div>
              </button>
            ))}
          </div>
        </Field>
        <Field label="Title"><Input placeholder="e.g. Macbeth Act IV notes" value={newTitle} onChange={ev=>setNewTitle(ev.target.value)} /></Field>
        <Field label="Class"><SelectChip options={tagOptions} value={newTag} onChange={setNewTag} /></Field>
        {newTag==="Other"&&<Field label="Custom class"><Input placeholder="e.g. Physics, SAT prep..." value={customTag} onChange={ev=>setCustomTag(ev.target.value)} /></Field>}
        {src==="write"&&(
          <Field label="Body">
            <Textarea placeholder="Start writing or paste your notes here..." value={newBody} onChange={ev=>setNewBody(ev.target.value)} style={{minHeight:130}} />
          </Field>
        )}
        {src==="file"&&(
          <Field label="Upload" hint="Studlin reads the file and writes structured notes with AI.">
            <input type="file" ref={fileRef} onChange={handleFile} accept=".txt,.md,.csv,.pdf,.doc,.docx,.rtf" style={{display:"none"}} />
            <div onClick={()=>fileRef.current&&fileRef.current.click()} style={{border:"1px dashed "+T.borderHover,borderRadius:10,padding:26,textAlign:"center",background:T.card2,cursor:"pointer"}}>
              <div style={{color:T.muted,marginBottom:6,display:"flex",justifyContent:"center"}}>{Icon.file}</div>
              <div style={{fontSize:13,color:T.text,fontWeight:500}}>{fileText?"File loaded - "+fileText.length+" chars":"Click to browse or drop a file"}</div>
              <div style={{fontSize:11,color:T.muted,marginTop:4}}>PDF, TXT, MD, CSV, DOCX</div>
            </div>
          </Field>
        )}
        {src==="record"&&(
          <Field label="Lecture recording" hint="Records your microphone and transcribes live.">
            <div style={{border:"1px solid "+(rec?T.red+"55":T.border),borderRadius:10,padding:22,textAlign:"center",background:rec?T.red+"0a":T.card2}}>
              <button type="button" onClick={rec?stopRec:startRec} style={{width:54,height:54,borderRadius:"50%",border:"none",background:rec?T.red:T.lime,color:rec?"#fff":T.ink,cursor:"pointer",display:"inline-flex",alignItems:"center",justifyContent:"center",marginBottom:10}}>{rec?<span style={{width:16,height:16,background:"#fff",borderRadius:3,display:"block"}} />:MicIcon}</button>
              <div style={{fontSize:15,fontWeight:700,color:rec?T.red:T.white,fontVariantNumeric:"tabular-nums"}}>{fmtRec(recSecs)}</div>
              <div style={{fontSize:11.5,color:T.muted,marginTop:3}}>{rec?"Recording... tap to stop":"Tap to start recording"}</div>
              {recText&&<div style={{fontSize:12,color:T.text,marginTop:12,padding:"10px 12px",background:T.card,borderRadius:8,textAlign:"left",maxHeight:120,overflowY:"auto",lineHeight:1.5}}>{recText}</div>}
            </div>
          </Field>
        )}
        {src==="youtube"&&(
          <Field label="YouTube link" hint={ytInfo?"Found: "+ytInfo:"Paste any YouTube video link. Studlin will detect the topic and generate notes."}>
            <Input placeholder="https://youtube.com/watch?v=..." value={yt} onChange={ev=>{setYt(ev.target.value);var v=ev.target.value.trim();if(v&&(v.includes("youtube.com")||v.includes("youtu.be"))){setYtLoading(true);fetch("/api/youtube-info",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({url:v})}).then(r=>r.json()).then(d=>{if(d.title){setYtInfo(d.title+(d.author?" by "+d.author:""));if(!newTitle)setNewTitle(d.title);}setYtLoading(false);}).catch(()=>setYtLoading(false));}}} />
            {ytLoading&&<div style={{fontSize:11,color:T.lime,marginTop:4}}>Detecting video...</div>}
          </Field>
        )}
      </Modal>
      <div style={{display:"grid",gridTemplateColumns:"250px 1fr",gap:14}}>
        <div>
          <input style={{width:"100%",background:T.card2,border:"1px solid "+T.border,borderRadius:7,padding:"8px 12px",color:T.text,fontSize:12,fontFamily:T.font,outline:"none",marginBottom:10,boxSizing:"border-box"}} placeholder="Search notes..." value={search} onChange={ev=>setSearch(ev.target.value)} />
          {filtered.length===0&&<div style={{padding:"20px 0",textAlign:"center",fontSize:12,color:T.muted}}>No notes yet. Create your first one.</div>}
          {filtered.map((n,i)=>(
            <div key={n.id||i} onClick={()=>setSel(notes.indexOf(n))} style={{background:notes.indexOf(n)===sel?T.card2:T.card,borderRadius:8,padding:"12px 14px",marginBottom:6,border:"1px solid "+(notes.indexOf(n)===sel?colorOf(n.tag)+"44":T.border),cursor:"pointer",transition:"all 0.15s"}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:5}}>
                <div style={{fontSize:12,fontWeight:600,color:T.white,flex:1,marginRight:8,lineHeight:1.3}}>{n.title}</div>
                <Badge color={colorOf(n.tag)}>{n.tag}</Badge>
              </div>
              <div style={{fontSize:11,color:T.muted,lineHeight:1.5,maxHeight:40,overflow:"hidden"}}>{n.body.slice(0,100)}</div>
              <div style={{fontSize:10,color:T.faint,marginTop:8}}>{n.date}</div>
            </div>
          ))}
        </div>
        <Card style={{minHeight:380,padding:24}}>
          {sel!==null&&notes[sel]
            ?<>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:20}}>
                  <div style={{flex:1}}>
                    <input value={notes[sel].title} onChange={e=>updateNote(sel,{title:e.target.value})} style={{fontSize:17,fontWeight:700,color:T.white,letterSpacing:"-0.01em",marginBottom:4,background:"transparent",border:"none",outline:"none",fontFamily:T.font,width:"100%",padding:0}} />
                    <div style={{display:"flex",gap:8,alignItems:"center"}}><Badge color={colorOf(notes[sel].tag)}>{notes[sel].tag}</Badge><span style={{fontSize:11,color:T.muted}}>{notes[sel].date}</span></div>
                  </div>
                  <div style={{display:"flex",gap:6}}>
                    <BtnSm variant="subtle" onClick={()=>exportNote(notes[sel])}>{Icon.copy} Copy</BtnSm>
                    <BtnSm variant="ghost" onClick={()=>setSendNoteOpen(true)}>{Icon.send} Send</BtnSm>
                    <BtnSm variant="danger" onClick={()=>deleteNote(sel)}>Delete</BtnSm>
                  </div>
                </div>
                <textarea value={notes[sel].body} onChange={e=>updateNote(sel,{body:e.target.value})} style={{width:"100%",minHeight:280,fontSize:14,color:T.text,lineHeight:1.9,background:"transparent",border:"none",outline:"none",fontFamily:T.font,resize:"vertical",boxSizing:"border-box"}} />
              </>
            :<div style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",height:300,gap:12}}>
                <div style={{color:T.faint,opacity:0.5}}>{Icon.file}</div>
                <div style={{fontSize:13,color:T.muted}}>Select a note to read or edit it</div>
              </div>
          }
        </Card>
      </div>
    </div>
  );
}



// ─── FRIENDS & CHAT ──────────────────────────────────────────────────────────
function FriendsChat(){
  const [friends,setFriends]=useState(()=>lsGet("friends",[]));
  const [activeFriend,setActiveFriend]=useState(null);
  const [dms,setDms]=useState(()=>lsGet("dms",{}));
  const [dmInput,setDmInput]=useState("");
  const [addTab,setAddTab]=useState("link");
  const [inviteInput,setInviteInput]=useState("");
  const [inviteStatus,setInviteStatus]=useState("");
  const [copied,setCopied]=useState(false);
  const chatEndRef=useRef(null);
  const me=getUserName()||"You";
  const refCode=(me).toLowerCase().replace(/\s+/g,"");
  const inviteLink="https://studlin.vercel.app?ref="+refCode;
  const inviteMsg="Hey! I'm using Studlin to lock into my schedule. It has an AI calendar that automatically plans our study/work slots and lets us share notes or see when we're both free. Grab an account here so we can sync up: "+inviteLink;

  useEffect(()=>{if(chatEndRef.current)chatEndRef.current.scrollIntoView({behavior:"smooth"});},[activeFriend,dms]);

  const copyInvite=()=>{navigator.clipboard&&navigator.clipboard.writeText(inviteMsg);setCopied(true);setTimeout(()=>setCopied(false),2200);};

  const sendInvite=()=>{
    const v=inviteInput.trim();if(!v)return;
    const isEmail=v.includes("@")&&v.includes(".");
    const isUser=v.startsWith("@")||(!isEmail&&v.length>1);
    if(isEmail){
      setInviteStatus("email_sent");
      setTimeout(()=>{setInviteStatus("");setInviteInput("");},2000);
    } else if(isUser){
      const username=v.startsWith("@")?v.slice(1):v;
      if(friends.find(f=>f.name.toLowerCase()===username.toLowerCase())){setInviteStatus("already");return;}
      const newFriend={id:String(Date.now()),name:username,status:"pending",online:false,initials:username.slice(0,2).toUpperCase()};
      const next=[...friends,newFriend];setFriends(next);lsSet("friends",next);
      setInviteStatus("request_sent");
      setTimeout(()=>{setInviteStatus("");setInviteInput("");},2000);
    }
  };

  const sendDm=()=>{
    const msg=dmInput.trim();if(!msg||!activeFriend)return;
    const key=activeFriend.id;
    const thread=dms[key]||[];
    const next={...dms,[key]:[...thread,{from:"me",text:msg,ts:Date.now()}]};
    setDms(next);lsSet("dms",next);setDmInput("");
  };

  const DEMO_FRIENDS=[
    {id:"d1",name:"Alex Rivera",status:"active",online:true,initials:"AR"},
    {id:"d2",name:"Sam Chen",status:"active",online:false,initials:"SC"},
    {id:"d3",name:"Jordan Lee",status:"active",online:true,initials:"JL"},
  ];
  const allFriends=[...DEMO_FRIENDS,...friends.filter(f=>!DEMO_FRIENDS.find(d=>d.id===f.id))];
  const thread=activeFriend?(dms[activeFriend.id]||[]):[];

  const qrUrl="https://api.qrserver.com/v1/create-qr-code/?data="+encodeURIComponent(inviteLink)+"&size=180x180&color=AECE5E&bgcolor=19211C&margin=12";

  return (
    <div>
      <PH title="Friends & Chat" sub="Study together. Share notes. Stay in sync." />
      <div style={{display:"grid",gridTemplateColumns:"220px 1fr 300px",gap:14,minHeight:520}}>

        {/* ── FRIEND LIST ── */}
        <div>
          <div style={{fontSize:10,fontWeight:700,letterSpacing:"0.1em",textTransform:"uppercase",color:T.faint,marginBottom:8}}>Friends</div>
          {allFriends.length===0&&<div style={{fontSize:12,color:T.muted,padding:"10px 0"}}>No friends yet. Invite someone below.</div>}
          {allFriends.map(f=>(
            <div key={f.id} onClick={()=>setActiveFriend(f)} style={{display:"flex",alignItems:"center",gap:10,padding:"10px 12px",borderRadius:9,marginBottom:4,cursor:"pointer",background:activeFriend?.id===f.id?T.card2:"transparent",border:`1px solid ${activeFriend?.id===f.id?T.lime+"33":"transparent"}`,transition:"all 0.15s"}}>
              <div style={{position:"relative",flexShrink:0}}>
                <Av initials={f.initials||f.name.slice(0,2).toUpperCase()} color={T.lime} size={32} picUrl="" />
                <div style={{position:"absolute",bottom:0,right:0,width:9,height:9,borderRadius:"50%",background:f.online?T.teal:T.faint,border:`2px solid ${T.surface}`}} />
              </div>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontSize:12.5,fontWeight:600,color:T.white,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{f.name}</div>
                <div style={{fontSize:10,color:f.online?T.teal:T.muted}}>{f.status==="pending"?"Request sent":f.online?"Online":"Offline"}</div>
              </div>
            </div>
          ))}
        </div>

        {/* ── DM PANE ── */}
        <Card style={{display:"flex",flexDirection:"column",padding:0,overflow:"hidden"}}>
          {activeFriend
            ?<>
                <div style={{padding:"12px 16px",borderBottom:`1px solid ${T.border}`,display:"flex",alignItems:"center",gap:10}}>
                  <div style={{position:"relative",flexShrink:0}}>
                    <Av initials={activeFriend.initials||activeFriend.name.slice(0,2).toUpperCase()} color={T.lime} size={30} picUrl="" />
                    <div style={{position:"absolute",bottom:0,right:0,width:8,height:8,borderRadius:"50%",background:activeFriend.online?T.teal:T.faint,border:`2px solid ${T.card}`}} />
                  </div>
                  <div>
                    <div style={{fontSize:13,fontWeight:700,color:T.white}}>{activeFriend.name}</div>
                    <div style={{fontSize:10,color:activeFriend.online?T.teal:T.muted}}>{activeFriend.online?"Online":"Offline"}</div>
                  </div>
                </div>
                <div style={{flex:1,overflowY:"auto",padding:16,display:"flex",flexDirection:"column",gap:8,minHeight:200}}>
                  {thread.length===0&&<div style={{textAlign:"center",fontSize:12,color:T.muted,marginTop:40}}>No messages yet. Say hi!</div>}
                  {thread.map((m,i)=>(
                    <div key={i} style={{display:"flex",justifyContent:m.from==="me"?"flex-end":"flex-start"}}>
                      <div style={{maxWidth:"72%",padding:"9px 13px",borderRadius:12,background:m.from==="me"?T.lime:T.card2,color:m.from==="me"?T.ink:T.text,fontSize:13,lineHeight:1.5}}>
                        {m.text}
                      </div>
                    </div>
                  ))}
                  <div ref={chatEndRef} />
                </div>
                <div style={{padding:"10px 12px",borderTop:`1px solid ${T.border}`,display:"flex",gap:8}}>
                  <input value={dmInput} onChange={e=>setDmInput(e.target.value)} onKeyDown={e=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();sendDm();}}} placeholder={`Message ${activeFriend.name.split(" ")[0]}…`} style={{flex:1,background:T.card2,border:`1px solid ${T.border}`,borderRadius:8,padding:"9px 12px",color:T.text,fontSize:13,fontFamily:T.font,outline:"none"}} />
                  <BtnSm onClick={sendDm} style={{flexShrink:0}}>{Icon.send}</BtnSm>
                </div>
              </>
            :<div style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",height:"100%",gap:12,padding:32}}>
                <div style={{color:T.faint,opacity:0.5}}>{Icon.msgSquare}</div>
                <div style={{fontSize:13,color:T.muted,textAlign:"center"}}>Select a friend to start chatting</div>
              </div>
          }
        </Card>

        {/* ── ADD & INVITE ── */}
        <div style={{display:"flex",flexDirection:"column",gap:12}}>
          <div style={{fontSize:10,fontWeight:700,letterSpacing:"0.1em",textTransform:"uppercase",color:T.faint,marginBottom:4}}>Add &amp; Invite Friends</div>

          {/* Tab switcher */}
          <div style={{display:"flex",gap:4}}>
            {["link","email","qr"].map(t=>(
              <button key={t} onClick={()=>setAddTab(t)} style={{flex:1,padding:"6px 0",borderRadius:6,fontSize:11,fontWeight:600,cursor:"pointer",fontFamily:T.font,border:`1px solid ${addTab===t?T.lime+"44":T.border}`,background:addTab===t?T.lime+"14":"transparent",color:addTab===t?T.lime:T.muted,textTransform:"capitalize",transition:"all 0.15s"}}>
                {t==="link"?"Link":t==="email"?"Search":"QR Code"}
              </button>
            ))}
          </div>

          {addTab==="link"&&(
            <Card style={{padding:16}}>
              <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:10}}>
                <div style={{width:32,height:32,borderRadius:8,background:T.lime+"18",border:`1px solid ${T.lime}33`,display:"flex",alignItems:"center",justifyContent:"center",color:T.lime,flexShrink:0}}>{Icon.link}</div>
                <div>
                  <div style={{fontSize:12.5,fontWeight:700,color:T.white}}>One-click invite link</div>
                  <div style={{fontSize:11,color:T.muted}}>Copies a message + your link</div>
                </div>
              </div>
              <div style={{fontSize:11,color:T.muted,padding:"10px 12px",background:T.card2,borderRadius:7,border:`1px solid ${T.border}`,lineHeight:1.6,marginBottom:12,wordBreak:"break-all"}}>{inviteLink}</div>
              <Btn onClick={copyInvite} style={{width:"100%",justifyContent:"center"}}>{copied?Icon.check:Icon.copy} {copied?"Copied!":"Copy invite message"}</Btn>
            </Card>
          )}

          {addTab==="email"&&(
            <Card style={{padding:16}}>
              <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:10}}>
                <div style={{width:32,height:32,borderRadius:8,background:T.blue+"18",border:`1px solid ${T.blue}33`,display:"flex",alignItems:"center",justifyContent:"center",color:T.blue,flexShrink:0}}>{Icon.userPlus}</div>
                <div>
                  <div style={{fontSize:12.5,fontWeight:700,color:T.white}}>Find or invite</div>
                  <div style={{fontSize:11,color:T.muted}}>Username sends request · email invites</div>
                </div>
              </div>
              <input value={inviteInput} onChange={e=>{setInviteInput(e.target.value);setInviteStatus("");}} onKeyDown={e=>{if(e.key==="Enter")sendInvite();}} placeholder="@username or email@school.edu" style={{width:"100%",background:T.card2,border:`1px solid ${T.border}`,borderRadius:8,padding:"9px 12px",color:T.text,fontSize:13,fontFamily:T.font,outline:"none",boxSizing:"border-box",marginBottom:10}} />
              {inviteStatus==="email_sent"&&<div style={{fontSize:12,color:T.teal,marginBottom:8}}>Invite email sent!</div>}
              {inviteStatus==="request_sent"&&<div style={{fontSize:12,color:T.lime,marginBottom:8}}>Friend request sent!</div>}
              {inviteStatus==="already"&&<div style={{fontSize:12,color:T.amber,marginBottom:8}}>Already a friend.</div>}
              <Btn onClick={sendInvite} style={{width:"100%",justifyContent:"center",opacity:inviteInput.trim()?1:0.45}}>{Icon.send} Send</Btn>
            </Card>
          )}

          {addTab==="qr"&&(
            <Card style={{padding:16,textAlign:"center"}}>
              <div style={{fontSize:12.5,fontWeight:700,color:T.white,marginBottom:4}}>Scan to join Studlin</div>
              <div style={{fontSize:11,color:T.muted,marginBottom:12}}>Show this to a friend nearby</div>
              <div style={{display:"inline-block",padding:8,background:"#111530",borderRadius:10,border:`1px solid ${T.border}`}}>
                <img src={qrUrl} width={160} height={160} alt="Studlin invite QR code" style={{display:"block",borderRadius:6}} onError={e=>{e.target.style.display="none";}} />
              </div>
              <div style={{fontSize:10,color:T.faint,marginTop:10,wordBreak:"break-all"}}>{inviteLink}</div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── CALENDAR ─────────────────────────────────────────────────────────────────
// ─── TASK TIMER MODAL ────────────────────────────────────────────────────────
function TaskTimerModal({task,onClose,onComplete}){
  const totalMins=task.duration||25;
  const quoteRef=useRef(QUOTES[Math.floor(Math.random()*QUOTES.length)]);
  const breakIdeaRef=useRef(BREAK_IDEAS[Math.floor(Math.random()*BREAK_IDEAS.length)]);
  const focusElapsed=useRef(0);
  const barRef=useRef(null);
  const endTimeRef=useRef(null);
  const focusStartRef=useRef(null);

  const initBreakMins=totalMins>=120?15:totalMins>=60?10:5;
  const initBreakPos=Math.max(1,Math.floor((totalMins-initBreakMins)/2));

  const [breakOn,setBreakOn]=useState(totalMins>=15);
  const [breakMins,setBreakMins]=useState(initBreakMins);
  const [breakPos,setBreakPos]=useState(initBreakPos);
  const [breakEditOpen,setBreakEditOpen]=useState(false);
  const [breakEditVal,setBreakEditVal]=useState(String(initBreakMins));

  const [phase,setPhase]=useState("quote");
  const [secs,setSecs]=useState(0);
  const [running,setRunning]=useState(false);
  const [soundOn,setSoundOn]=useState(true);

  const playBeep=()=>{try{const ctx=new(window.AudioContext||window.webkitAudioContext)();const osc=ctx.createOscillator();const gain=ctx.createGain();osc.connect(gain);gain.connect(ctx.destination);osc.frequency.setValueAtTime(880,ctx.currentTime);osc.frequency.exponentialRampToValueAtTime(440,ctx.currentTime+0.3);gain.gain.setValueAtTime(0.3,ctx.currentTime);gain.gain.exponentialRampToValueAtTime(0.001,ctx.currentTime+0.35);osc.start(ctx.currentTime);osc.stop(ctx.currentTime+0.35);}catch(e){}};

  const focus2Mins=Math.max(1,totalMins-breakPos-breakMins);
  const fmt=s=>String(Math.floor(s/60)).padStart(2,"0")+":"+String(s%60).padStart(2,"0");
  const circumference=2*Math.PI*52;

  useEffect(()=>{
    if(!running)return;
    endTimeRef.current=Date.now()+secs*1000;
    if(phase!=="break")focusStartRef.current=Date.now();
    const id=setInterval(()=>{
      const remaining=Math.max(0,Math.round((endTimeRef.current-Date.now())/1000));
      setSecs(remaining);
      if(remaining<=0){
        if(phase==="focus1"){setPhase("break");setRunning(false);if(soundOn)playBeep();}
        else if(phase==="break"){setPhase("breakDone");setRunning(false);if(soundOn)playBeep();}
        else if(phase==="focus2"){
          setPhase("done");setRunning(false);
          if(onComplete)onComplete(Math.max(1,Math.round(focusElapsed.current/60)));
        }
      }
    },250);
    return()=>{
      clearInterval(id);
      if(phase!=="break"&&focusStartRef.current){
        focusElapsed.current+=(Date.now()-focusStartRef.current)/1000;
        focusStartRef.current=null;
      }
    };
  },[running,phase,totalMins,onComplete]);

  useEffect(()=>{
    if(phase==="break"){setSecs(breakMins*60);setRunning(true);}
  },[phase,breakMins]);

  const startLockIn=()=>{
    focusElapsed.current=0;
    if(breakOn&&totalMins>=15&&focus2Mins>0){
      setPhase("focus1");setSecs(breakPos*60);setRunning(true);
    }else{
      setPhase("focus2");setSecs(totalMins*60);setRunning(true);
    }
  };

  const resume=()=>{setPhase("focus2");setSecs(focus2Mins*60);setRunning(true);};

  const finishEarly=()=>{
    if(phase!=="break"&&focusStartRef.current){
      focusElapsed.current+=(Date.now()-focusStartRef.current)/1000;
      focusStartRef.current=null;
    }
    const m=Math.max(1,Math.round(focusElapsed.current/60));
    setPhase("done");setRunning(false);
    if(onComplete)onComplete(m);
  };

  const updateBreakPos=(e)=>{
    const bar=barRef.current;if(!bar)return;
    const rect=bar.getBoundingClientRect();
    const pctX=Math.max(0,Math.min(1,(e.clientX-rect.left)/rect.width));
    const mins=Math.round(pctX*totalMins);
    setBreakPos(Math.max(1,Math.min(totalMins-breakMins-1,mins-Math.floor(breakMins/2))));
  };
  const handleBarPointerDown=(e)=>{
    if(!breakOn)return;
    e.currentTarget.setPointerCapture(e.pointerId);
    updateBreakPos(e);
  };
  const handleBarPointerMove=(e)=>{
    if(!(e.buttons&1)||!breakOn)return;
    updateBreakPos(e);
  };
  const handleSegmentPointerDown=(e)=>{
    e.stopPropagation();
    e.currentTarget.setPointerCapture(e.pointerId);
    updateBreakPos(e);
  };
  const handleSegmentPointerMove=(e)=>{
    if(!(e.buttons&1))return;
    e.stopPropagation();
    updateBreakPos(e);
  };
  const handleBreakDblClick=(e)=>{
    e.stopPropagation();
    e.preventDefault();
    setBreakEditOpen(true);
    setBreakEditVal(String(breakMins));
  };
  const applyBreakEdit=()=>{
    const n=Math.max(1,Math.min(30,parseInt(breakEditVal,10)||breakMins));
    setBreakMins(n);
    setBreakPos(p=>Math.max(1,Math.min(totalMins-n-1,p)));
    setBreakEditOpen(false);
  };

  // ── QUOTE / SETUP SCREEN ──────────────────────────────────────────────────
  if(phase==="quote"){
    const q=quoteRef.current;
    return(
      <div onClick={onClose} style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.7)",backdropFilter:"blur(10px)",zIndex:1000,display:"flex",alignItems:"center",justifyContent:"center",padding:24}}>
        <div onClick={e=>e.stopPropagation()} style={{width:"100%",maxWidth:520,background:T.card,borderRadius:20,border:`1px solid ${T.border}`,padding:"40px 36px",textAlign:"center"}}>
          <div style={{fontSize:16,fontStyle:"italic",color:T.text,lineHeight:1.7,marginBottom:8,fontFamily:T.serif}}>"{q.text}"</div>
          <div style={{fontSize:12,color:T.muted,marginBottom:28}}>— {q.author}</div>
          <div style={{fontSize:15,fontWeight:600,color:T.white,marginBottom:4}}>{task.title}</div>
          <div style={{fontSize:12,color:T.muted,marginBottom:28}}>{totalMins} minutes · {task.subject||"Study session"}</div>

          {/* Interactive timeline */}
          <div style={{marginBottom:24,textAlign:"left"}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
              <span style={{fontSize:11,fontWeight:600,color:T.muted,letterSpacing:"0.06em",textTransform:"uppercase"}}>Challenge placement</span>
              <div onClick={()=>setBreakOn(b=>!b)} style={{display:"flex",alignItems:"center",gap:6,cursor:"pointer"}}>
                <div style={{width:30,height:17,borderRadius:99,background:breakOn?T.lime:T.faint,position:"relative",transition:"background 0.2s"}}>
                  <div style={{width:13,height:13,borderRadius:"50%",background:"#fff",position:"absolute",top:2,left:breakOn?15:2,transition:"left 0.2s"}}/>
                </div>
                <span style={{fontSize:11,color:T.text}}>{breakOn?"On":"Off"}</span>
              </div>
            </div>

            <div ref={barRef}
              style={{height:32,background:T.card2,borderRadius:8,position:"relative",cursor:"pointer",userSelect:"none",border:`1px solid ${T.border}`,overflow:"hidden"}}
              onPointerDown={handleBarPointerDown}
              onPointerMove={handleBarPointerMove}>
              <div style={{position:"absolute",inset:0,display:"flex",alignItems:"center",padding:"0 7px",pointerEvents:"none",justifyContent:"space-between"}}>
                <span style={{fontSize:9,color:T.faint,fontWeight:600}}>0m</span>
                <span style={{fontSize:9,color:T.faint,fontWeight:600}}>{totalMins}m</span>
              </div>
              {breakOn&&(
                <div
                  onDoubleClick={handleBreakDblClick}
                  onPointerDown={handleSegmentPointerDown}
                  onPointerMove={handleSegmentPointerMove}
                  style={{position:"absolute",left:`${(breakPos/totalMins)*100}%`,width:`${Math.max(4,(breakMins/totalMins)*100)}%`,top:2,bottom:2,background:T.amber,borderRadius:5,cursor:"grab",display:"flex",alignItems:"center",justifyContent:"center",minWidth:28,userSelect:"none"}}>
                  <span style={{fontSize:9,fontWeight:700,color:T.ink,letterSpacing:"0.04em",whiteSpace:"nowrap",pointerEvents:"none"}}>{breakMins}m</span>
                </div>
              )}
            </div>

            {breakOn&&(
              <div style={{fontSize:11,color:T.muted,marginTop:8,display:"flex",gap:10,alignItems:"center",flexWrap:"wrap"}}>
                <span>Challenge at <strong style={{color:T.amber}}>{breakPos}m</strong> · {breakMins}m · <strong style={{color:T.lime}}>{focus2Mins}m</strong> after</span>
                <span style={{fontSize:10,color:T.faint}}>Drag to reposition · double-click to edit duration</span>
              </div>
            )}

            {breakEditOpen&&(
              <div style={{marginTop:12,display:"flex",alignItems:"center",gap:8,background:T.card2,borderRadius:8,padding:"10px 14px",border:`1px solid ${T.border}`}}>
                <span style={{fontSize:12,color:T.muted,flex:"none"}}>Break duration:</span>
                <input type="number" min={1} max={30} value={breakEditVal}
                  onChange={e=>setBreakEditVal(e.target.value)}
                  onKeyDown={e=>{if(e.key==="Enter")applyBreakEdit();if(e.key==="Escape")setBreakEditOpen(false);}}
                  autoFocus
                  style={{width:52,padding:"5px 8px",borderRadius:6,border:`1px solid ${T.border}`,background:T.card,color:T.text,fontSize:13,fontFamily:T.font,textAlign:"center"}}/>
                <span style={{fontSize:12,color:T.muted,flex:"none"}}>min</span>
                <BtnSm onClick={applyBreakEdit}>Apply</BtnSm>
                <BtnSm variant="ghost" onClick={()=>setBreakEditOpen(false)}>Cancel</BtnSm>
              </div>
            )}
          </div>

          <Btn onClick={startLockIn} style={{width:"100%",justifyContent:"center",padding:"14px 24px",fontSize:15}}>Lock in</Btn>
        </div>
      </div>
    );
  }

  // ── DONE SCREEN ───────────────────────────────────────────────────────────
  if(phase==="done")return(
    <div onClick={onClose} style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.7)",backdropFilter:"blur(10px)",zIndex:1000,display:"flex",alignItems:"center",justifyContent:"center",padding:24}}>
      <div onClick={e=>e.stopPropagation()} style={{width:"100%",maxWidth:420,background:T.card,borderRadius:20,border:`1px solid ${T.border}`,padding:"40px 36px",textAlign:"center"}}>
        <h2 style={{fontSize:24,fontWeight:700,color:T.white,margin:"0 0 8px"}}>Session complete</h2>
        <p style={{fontSize:14,color:T.muted,margin:"0 0 8px"}}>{task.title}</p>
        <div style={{fontSize:28,fontWeight:700,color:T.lime,fontFamily:T.mono,marginBottom:20}}>{Math.max(1,Math.round(focusElapsed.current/60))} min focused</div>
        <Btn onClick={onClose} style={{width:"100%",justifyContent:"center"}}>Done</Btn>
      </div>
    </div>
  );

  // ── ACTIVE TIMER (focus1 | break | breakDone | focus2) ───────────────────
  const isBreak=phase==="break"||phase==="breakDone";
  const timerColor=isBreak?T.amber:T.lime;
  const phaseLabel=phase==="focus1"?"Time until challenge":phase==="break"?"Challenge":phase==="breakDone"?"Challenge complete":"Time remaining";
  const phaseDuration=phase==="focus1"?breakPos*60:phase==="break"?breakMins*60:focus2Mins*60;
  const phasePct=Math.max(0,Math.min(1,phaseDuration>0?1-secs/phaseDuration:1));

  return(
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.85)",backdropFilter:"blur(12px)",zIndex:1000,display:"flex",alignItems:"center",justifyContent:"center",padding:24}}>
      <button onClick={()=>setSoundOn(s=>!s)} title={soundOn?"Mute alarm":"Unmute alarm"} style={{position:"absolute",top:20,right:20,background:"rgba(255,255,255,0.08)",border:"1px solid rgba(255,255,255,0.15)",borderRadius:8,padding:"7px 10px",color:soundOn?"rgba(255,255,255,0.8)":"rgba(255,255,255,0.3)",cursor:"pointer",display:"flex",alignItems:"center",gap:6,fontSize:11,fontWeight:600,fontFamily:T.font,transition:"all 0.15s"}}>
        {soundOn?Icon.volume:Icon.volOff}
        <span>{soundOn?"Sound on":"Sound off"}</span>
      </button>
      <div style={{width:"100%",maxWidth:400,textAlign:"center"}}>
        <div style={{fontSize:11,fontWeight:700,letterSpacing:"0.12em",textTransform:"uppercase",color:timerColor,marginBottom:16}}>{phaseLabel}</div>

        <div style={{position:"relative",width:180,height:180,margin:"0 auto 20px"}}>
          <svg viewBox="0 0 120 120" style={{width:180,height:180,transform:"rotate(-90deg)"}}>
            <circle cx="60" cy="60" r="52" fill="rgba(0,0,0,0.6)" stroke="rgba(255,255,255,0.08)" strokeWidth="6"/>
            <circle cx="60" cy="60" r="52" fill="none" stroke={timerColor} strokeWidth="6" strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={circumference*(1-phasePct)}
              style={{transition:"stroke-dashoffset 0.5s",filter:`drop-shadow(0 0 6px ${timerColor}88)`}}/>
          </svg>
          <div style={{position:"absolute",inset:0,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center"}}>
            <div style={{fontSize:44,fontWeight:800,color:"#FFFFFF",fontFamily:T.mono,letterSpacing:"-0.03em",textShadow:"0 2px 12px rgba(0,0,0,0.6),0 0 30px rgba(255,255,255,0.15)"}}>{fmt(secs)}</div>
            <div style={{fontSize:10,color:"rgba(255,255,255,0.55)",marginTop:4,letterSpacing:"0.1em",textTransform:"uppercase"}}>
              {phase==="focus1"?"until challenge":isBreak?"challenge":"remaining"}
            </div>
          </div>
        </div>

        <div style={{fontSize:15,fontWeight:600,color:T.white,marginBottom:8}}>{task.title}</div>

        {isBreak&&(
          <div style={{fontSize:13,color:T.amber,margin:"0 auto 20px",padding:"12px 16px",background:T.amber+"12",borderRadius:10,lineHeight:1.5,maxWidth:320}}>
            {breakIdeaRef.current}
          </div>
        )}
        {phase==="break"&&(
          <button onClick={resume} style={{display:"block",width:"100%",maxWidth:240,margin:"0 auto 12px",padding:"12px 24px",background:"rgba(255,255,255,0.10)",color:"#ffffff",border:"1px solid rgba(255,255,255,0.25)",borderRadius:12,fontSize:14,fontWeight:600,cursor:"pointer",fontFamily:T.font,letterSpacing:"-0.01em"}}>
            Resume Focus Early
          </button>
        )}

        {phase==="breakDone"&&(
          <button onClick={resume} style={{display:"block",width:"100%",maxWidth:240,margin:"0 auto 16px",padding:"16px 24px",background:T.lime,color:T.ink,border:"none",borderRadius:12,fontSize:16,fontWeight:700,cursor:"pointer",fontFamily:T.font,letterSpacing:"-0.01em"}}>
            Resume
          </button>
        )}

        {phase!=="breakDone"&&(
          <div style={{display:"flex",gap:10,justifyContent:"center",marginTop:phase==="break"?8:24}}>
            {phase!=="break"&&<Btn variant="ghost" onClick={()=>setRunning(r=>!r)} style={{background:"rgba(255,255,255,0.13)",borderColor:"rgba(255,255,255,0.38)",color:"#ffffff",fontWeight:700}}>{running?"Pause":"Resume"}</Btn>}
            <Btn variant="danger" onClick={finishEarly}>Finish early</Btn>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── WEEKLY PLANNER ───────────────────────────────────────────────────────────
const WK_PX_HR = 64; // pixels per hour in weekly grid

function WeeklyPlanner({events, setEvents, weekOffset, setWeekOffset, todayK, colorOf, fmtTime, openNew, openEdit}) {
  const wkColRefs = useRef({});
  const weekScrollRef = useRef(null);
  const [wkDragId, setWkDragId] = useState(null);
  useEffect(()=>{
    if(weekScrollRef.current){
      const hour = new Date().getHours();
      weekScrollRef.current.scrollTop = Math.max(0, hour - 1) * WK_PX_HR;
    }
  },[]);
  const [wkDragDeadline, setWkDragDeadline] = useState(null);
  const [wkDragOverDay, setWkDragOverDay] = useState(null);
  const [wkDropTime, setWkDropTime] = useState(null);

  const weekDays = (() => {
    const d = new Date();
    const day = d.getDay();
    const diff = day === 0 ? -6 : 1 - day;
    d.setDate(d.getDate() + diff + weekOffset * 7);
    d.setHours(0, 0, 0, 0);
    return Array.from({length: 7}, (_, i) => { const x = new Date(d); x.setDate(x.getDate() + i); return x; });
  })();

  const byDay = {};
  events.forEach(ev => { (byDay[ev.date] = byDay[ev.date] || []).push(ev); });

  const handleDragOver = (e, dk) => {
    e.preventDefault();
    setWkDragOverDay(dk);
    const col = wkColRefs.current[dk];
    if (col) {
      const rect = col.getBoundingClientRect();
      const relY = Math.max(0, e.clientY - rect.top);
      const totalMins = Math.round(relY / WK_PX_HR * 60);
      const hrs = Math.min(23, Math.floor(totalMins / 60));
      const rawMins = totalMins % 60;
      const snappedMins = Math.min(45, Math.round(rawMins / 15) * 15);
      setWkDropTime(String(hrs).padStart(2,'0') + ':' + String(snappedMins).padStart(2,'0'));
    }
  };

  const handleDrop = (e, dk) => {
    e.preventDefault();
    if (!wkDragId) return;
    const time = wkDropTime || '09:00';
    const next = events.map(ev => ev.id === wkDragId ? {...ev, date: dk, time} : ev);
    setEvents(next); lsSet("events", next);
    setWkDragId(null); setWkDragDeadline(null); setWkDragOverDay(null); setWkDropTime(null);
  };

  const handleDragEnd = () => { setWkDragId(null); setWkDragDeadline(null); setWkDragOverDay(null); setWkDropTime(null); };

  const rangeLabel = weekDays[0].toLocaleDateString("en-US",{month:"short",day:"numeric"}) + " – " + weekDays[6].toLocaleDateString("en-US",{month:"short",day:"numeric",year:"numeric"});
  const DAY_NAMES = ["MON","TUE","WED","THU","FRI","SAT","SUN"];

  return (
    <Card style={{padding:0,overflow:"hidden"}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"12px 16px",borderBottom:`1px solid ${T.border}`}}>
        <span style={{fontSize:14,fontWeight:700,color:T.white,letterSpacing:"-0.01em"}}>{rangeLabel}</span>
        <div style={{display:"flex",gap:6}}>
          <BtnSm variant="ghost" onClick={()=>setWeekOffset(o=>o-1)}>←</BtnSm>
          <BtnSm variant="ghost" onClick={()=>setWeekOffset(0)}>This week</BtnSm>
          <BtnSm variant="ghost" onClick={()=>setWeekOffset(o=>o+1)}>→</BtnSm>
        </div>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"52px repeat(7,1fr)",borderBottom:`1px solid ${T.border}`,background:T.card}}>
        <div style={{height:48}} />
        {weekDays.map((d, i) => {
          const dk = dayKey(d);
          const isToday = dk === todayK;
          return (
            <div key={i} style={{textAlign:"center",padding:"7px 4px 9px",borderLeft:`1px solid ${T.border}`}}>
              <div style={{fontSize:9,fontWeight:700,letterSpacing:"0.1em",color:T.muted,marginBottom:4}}>{DAY_NAMES[i]}</div>
              <div onDoubleClick={()=>openNew(dk)} style={{width:28,height:28,borderRadius:"50%",background:isToday?T.lime:"transparent",color:isToday?T.ink:T.white,fontSize:13,fontWeight:700,display:"inline-flex",alignItems:"center",justifyContent:"center",cursor:"pointer"}}>{d.getDate()}</div>
            </div>
          );
        })}
      </div>
      <div ref={weekScrollRef} style={{display:"flex",overflowY:"auto",maxHeight:"calc(100vh - 330px)"}} onDragEnd={handleDragEnd}>
        <div style={{width:52,flexShrink:0,background:T.card,borderRight:`1px solid ${T.border}`,zIndex:2}}>
          {Array.from({length:24}, (_, h) => (
            <div key={h} style={{height:WK_PX_HR,display:"flex",alignItems:"flex-start",justifyContent:"flex-end",paddingRight:8,paddingTop:3,borderTop:`1px solid ${T.border}44`,boxSizing:"border-box"}}>
              <span style={{fontSize:9,color:T.muted,whiteSpace:"nowrap"}}>{h===0?"12 AM":h<12?h+" AM":h===12?"12 PM":(h-12)+" PM"}</span>
            </div>
          ))}
        </div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",flex:1,minWidth:0}}>
          {weekDays.map((day, colIdx) => {
            const dk = dayKey(day);
            const colEvs = (byDay[dk] || []).filter(ev => ev.time);
            const isPastDeadline = !!(wkDragDeadline && dk > wkDragDeadline);
            let ghostEl = null;
            if (wkDragOverDay === dk && wkDropTime) {
              const parts = wkDropTime.split(":").map(Number);
              const gh = parts[0]; const gm = parts[1];
              const dragEv = events.find(e => e.id === wkDragId);
              const dur = dragEv ? (dragEv.duration || 30) : 30;
              ghostEl = <div style={{position:"absolute",top:(gh*60+gm)*(WK_PX_HR/60),left:2,right:2,height:Math.max(22,dur*(WK_PX_HR/60)),borderRadius:5,background:T.lime+"14",border:`1.5px dashed ${T.lime}`,zIndex:4,pointerEvents:"none",boxSizing:"border-box"}} />;
            }
            return (
              <div key={colIdx} style={{position:"relative",borderLeft:`1px solid ${T.border}`,height:24*WK_PX_HR,boxSizing:"border-box"}}
                ref={el => { wkColRefs.current[dk] = el; }}
                onDragOver={e=>handleDragOver(e,dk)}
                onDrop={e=>handleDrop(e,dk)}>
                {Array.from({length:24}, (_, h) => (
                  <div key={h} style={{position:"absolute",top:h*WK_PX_HR,left:0,right:0,height:WK_PX_HR,borderTop:`1px solid ${T.border}44`,boxSizing:"border-box"}} />
                ))}
                {Array.from({length:24}, (_, h) => (
                  <div key={"hh"+h} style={{position:"absolute",top:h*WK_PX_HR+WK_PX_HR/2,left:0,right:0,borderTop:`1px dashed ${T.border}22`}} />
                ))}
                {isPastDeadline && (
                  <div style={{position:"absolute",inset:0,background:"rgba(217,128,107,0.07)",borderLeft:"2px solid rgba(217,128,107,0.35)",zIndex:5,pointerEvents:"none"}}>
                    <div style={{position:"sticky",top:6,textAlign:"center",fontSize:8,fontWeight:800,letterSpacing:"0.08em",color:"rgba(217,128,107,0.65)",padding:3}}>PAST DUE</div>
                  </div>
                )}
                {colEvs.map(ev => {
                  const timeParts = ev.time.split(":").map(Number);
                  const hh = timeParts[0]; const mm = timeParts[1];
                  const topPx = (hh * 60 + mm) * (WK_PX_HR / 60);
                  const dur = ev.duration || 30;
                  const heightPx = Math.max(22, dur * (WK_PX_HR / 60));
                  const isDone = ev.status === "done";
                  const over = daysOverdue(ev);
                  const color = over > 0 ? T.red : colorOf(ev.subject);
                  return (
                    <div key={ev.id}
                      draggable
                      onDragStart={()=>{ setWkDragId(ev.id); setWkDragDeadline(ev.deadline||null); }}
                      onDoubleClick={()=>openEdit(ev)}
                      title="Double-click to edit · Drag to reschedule"
                      style={{position:"absolute",top:topPx,left:2,right:2,height:heightPx,borderRadius:5,background:color+"1E",borderLeft:`3px solid ${color}`,padding:"2px 5px",cursor:"grab",overflow:"hidden",zIndex:3,opacity:isDone?0.4:1,boxSizing:"border-box",userSelect:"none"}}>
                      <div style={{fontSize:9.5,fontWeight:700,color,lineHeight:1.25,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{ev.title}</div>
                      {heightPx > 34 && <div style={{fontSize:8.5,color:T.muted,marginTop:1}}>{fmtTime(ev.time)}{dur ? " · "+dur+"m" : ""}</div>}
                    </div>
                  );
                })}
                {ghostEl}
              </div>
            );
          })}
        </div>
      </div>
    </Card>
  );
}

function CalendarTab(){
  const SUBJ=[
    {value:"Chemistry",label:"Chemistry",color:T.red},
    {value:"English IV",label:"English IV",color:T.purple},
    {value:"Biology",label:"Biology",color:T.teal},
    {value:"Calculus",label:"Calculus",color:T.blue},
    {value:"Spanish",label:"Spanish",color:T.amber},
    {value:"History",label:"History",color:T.muted},
    {value:"Other",label:"Other",color:T.lime},
  ];
  const colorOf=(sub)=>{const x=SUBJ.find(o=>o.value===sub);return x?x.color:T.lime;};
  const mk=(off,time,title,subject,kind)=>{const d=new Date();d.setDate(d.getDate()+off);return {id:"seed-"+off+"-"+time,date:dayKey(d),time,title,subject,kind};};
  const seed=[
    mk(0,"14:30","Chem quiz · Periodic trends","Chemistry","exam"),
    mk(1,"23:59","Biology lab report due","Biology","deadline"),
    mk(3,"09:00","Macbeth essay · first draft","English IV","deadline"),
    mk(5,"10:00","Calculus test · Derivatives","Calculus","exam"),
  ];
  const [events,setEvents]=useState(()=>{const ev=lsGet("events",null);return(ev&&Array.isArray(ev))?ev.filter(e=>!e.id.startsWith("seed-")):[];});
  const now=new Date();
  const [ym,setYm]=useState({y:now.getFullYear(),m:now.getMonth()});
  const [selDay,setSelDay]=useState(dayKey());
  const [newOpen,setNewOpen]=useState(false);
  const [evTitle,setEvTitle]=useState("");
  const [evDate,setEvDate]=useState(dayKey());
  const [evTime,setEvTime]=useState("14:30");
  const [evSubject,setEvSubject]=useState("Chemistry");
  const [evCustom,setEvCustom]=useState("");
  const [evKind,setEvKind]=useState("deadline");
  const [evNotes,setEvNotes]=useState("");
  const [evPriority,setEvPriority]=useState(500); // 0-1000 continuous scale
  const [evDifficulty,setEvDifficulty]=useState(500); // 0-1000 continuous scale for difficulty
  const [evDeadline,setEvDeadline]=useState("");
  const [evDuration,setEvDuration]=useState(60);
  const [evSplitEnabled,setEvSplitEnabled]=useState(false);
  const [evSplitCount,setEvSplitCount]=useState(2);
  const [aiLoading,setAiLoading]=useState(false);
  const [toast,setToast]=useState(false);
  const [dragId,setDragId]=useState(null);
  const [calView,setCalView]=useState("monthly");
  const [weekOffset,setWeekOffset]=useState(0);
  const [editOpen,setEditOpen]=useState(false);
  const [editEv,setEditEv]=useState(null);
  const [groupSyncOpen,setGroupSyncOpen]=useState(false);
  const [gsStep,setGsStep]=useState(1);
  const [gsDueDate,setGsDueDate]=useState(dayKey());
  const [gsDuration,setGsDuration]=useState(120);
  const [gsStartTime,setGsStartTime]=useState("15:00");
  const [gsEndTime,setGsEndTime]=useState("17:00");
  const [gsInvitees,setGsInvitees]=useState("");
  const [gsResults,setGsResults]=useState(null);
  const [editTitle,setEditTitle]=useState("");
  const [editDate,setEditDate]=useState("");
  const [editTime,setEditTime]=useState("14:30");
  const [editDuration,setEditDuration]=useState(60);
  const [editDeadline,setEditDeadline]=useState("");
  const [editPriority,setEditPriority]=useState(500);
  const [editDifficulty,setEditDifficulty]=useState(500);
  const [editSubject,setEditSubject]=useState("Chemistry");
  const [editKind,setEditKind]=useState("deadline");
  const [editNotes,setEditNotes]=useState("");
  const monthNames=["January","February","March","April","May","June","July","August","September","October","November","December"];
  const lead=(new Date(ym.y,ym.m,1).getDay()+6)%7;
  const dim=new Date(ym.y,ym.m+1,0).getDate();
  const dimPrev=new Date(ym.y,ym.m,0).getDate();
  const cells=[];
  for(let i=lead-1;i>=0;i--)cells.push({d:dimPrev-i,out:true,key:dayKey(new Date(ym.y,ym.m-1,dimPrev-i))});
  for(let d=1;d<=dim;d++)cells.push({d,out:false,key:dayKey(new Date(ym.y,ym.m,d))});
  let nx=1;while(cells.length%7!==0){cells.push({d:nx,out:true,key:dayKey(new Date(ym.y,ym.m+1,nx))});nx++;}
  const byDay={};events.forEach(ev=>{(byDay[ev.date]=byDay[ev.date]||[]).push(ev);});
  const todayK=dayKey();
  const fmtTime=(t)=>{const p=t.split(":");let h=+p[0];const ap=h>=12?"PM":"AM";h=h%12||12;return h+":"+p[1]+" "+ap;};
  const niceDate=(k)=>{const p=k.split("-");return new Date(+p[0],+p[1]-1,+p[2]).toLocaleDateString("en-US",{weekday:"long",month:"long",day:"numeric"});};
  const relDay=(k)=>{if(k===todayK)return "Today";const t=new Date();t.setDate(t.getDate()+1);if(k===dayKey(t))return "Tomorrow";const p=k.split("-");return new Date(+p[0],+p[1]-1,+p[2]).toLocaleDateString("en-US",{month:"short",day:"numeric"});};
  const upcoming=events.filter(ev=>ev.date>=todayK).sort((a,b)=>a.date===b.date?(a.time<b.time?-1:1):(a.date<b.date?-1:1)).slice(0,6);
  const dayEvents=(byDay[selDay]||[]).slice().sort((a,b)=>a.time<b.time?-1:1);
  const openNew=(dateK)=>{setEvDate(dateK||selDay);setEvDeadline("");setEvPriority(500);setEvDifficulty(500);setEvDuration(60);setEvSplitEnabled(false);setEvSplitCount(2);setNewOpen(true);};
  const resetForm=()=>{setNewOpen(false);setEvTitle("");setEvNotes("");setEvCustom("");setEvPriority(500);setEvDifficulty(500);setEvDeadline("");setEvDuration(60);setEvSplitEnabled(false);setEvSplitCount(2);setAiLoading(false);};
  const buildTask=(date,time,titleSuffix,splitInfo)=>{
    const subj=evSubject==="Other"&&evCustom.trim()?evCustom.trim():evSubject;
    return {id:String(Date.now()+Math.random()*1000),title:evTitle.trim()+(titleSuffix||""),date,time,subject:subj,kind:evKind,notes:evNotes,priority:Math.round(evPriority/100),difficulty:Math.round(evDifficulty/100),deadline:evDeadline||null,duration:splitInfo?Math.round(evDuration/evSplitCount):evDuration,status:"pending",timeSpent:0,completedAt:null,...(splitInfo||{})};
  };
  const commitTasks=(newTasks)=>{
    const next=events.concat(newTasks);
    setEvents(next);lsSet("events",next);
    newTasks.forEach(t=>scheduleTaskNotif(t));
    resetForm();setSelDay(newTasks[0].date);
    const d=newTasks[0].date;if(d.slice(0,7)!==(ym.y+"-"+String(ym.m+1).padStart(2,"0"))){const p=d.split("-");setYm({y:+p[0],m:+p[1]-1});}
    setToast(true);setTimeout(()=>setToast(false),2200);
  };
  const saveManual=()=>{
    if(!evTitle.trim())return;
    if(!evSplitEnabled){commitTasks([buildTask(evDate,evTime)]);return;}
    const groupId="split-"+Date.now();
    const perSession=Math.round(evDuration/evSplitCount);
    const tasks=[];
    for(let i=0;i<evSplitCount;i++){
      const d=new Date(evDate);d.setDate(d.getDate()+i);
      tasks.push(buildTask(dayKey(d),evTime," ("+(i+1)+"/"+evSplitCount+")",{splitGroup:groupId,splitIndex:i+1,splitTotal:evSplitCount,duration:perSession}));
    }
    commitTasks(tasks);
  };
  const aiArrange=async()=>{
    if(!evTitle.trim())return;
    setAiLoading(true);
    const now=new Date();
    const tk=dayKey();
    const nowH=String(now.getHours()).padStart(2,"0");
    const nowM=String(now.getMinutes()).padStart(2,"0");
    const nowTime=nowH+":"+nowM;
    // Earliest bookable time today: current time + 15-min buffer, rounded up to next 15-min mark
    const bufMins=now.getHours()*60+now.getMinutes()+15;
    const earliestTodayMins=Math.ceil(bufMins/15)*15;
    const earliestTodayTime=minutesToTime(earliestTodayMins);
    // If today's remaining window (earliestToday → 22:00) can't fit even one session, direct AI to start tomorrow
    const perSession=Math.round(evDuration/(evSplitEnabled?evSplitCount:1));
    const splitCount=evSplitEnabled?evSplitCount:1;
    const todayWindowMins=Math.max(0,22*60-earliestTodayMins);
    const firstAvailDate=todayWindowMins>=perSession?tk:(()=>{const d=new Date(now);d.setDate(d.getDate()+1);return dayKey(d);})();
    const existing=events.filter(ev=>ev.date>=tk).map(ev=>({title:ev.title,date:ev.date,time:ev.time,duration:ev.duration||60}));
    const priorityLabel=evPriority<200?"Low":evPriority<400?"Medium-Low":evPriority<600?"Medium":evPriority<800?"High":"Urgent";
    const prompt="You are a scheduling AI. The user's LIVE clock reads "+nowTime+" on "+tk+". Schedule "+splitCount+" session(s) of "+perSession+" minutes each for the task: \""+evTitle.trim()+"\". Priority: "+priorityLabel+(evDeadline?". Deadline: "+evDeadline:"")+". Existing schedule: "+JSON.stringify(existing)+". STRICT RULES (violations are forbidden): 1) NEVER place any session before "+earliestTodayTime+" on today ("+tk+") — those slots have already passed. 2) The earliest you may schedule anything today is "+earliestTodayTime+". 3) If today has no open window at or after "+earliestTodayTime+", start from "+firstAvailDate+" instead. 4) All sessions must be within 08:00-22:00. 5) Higher priority = earlier slots. 6) Must be before deadline. 7) Avoid conflicts. 8) Spread splits across days. Respond with ONLY valid JSON: {\"sessions\":[{\"date\":\"YYYY-MM-DD\",\"time\":\"HH:MM\"}]}";
    try{
      const res=await authFetch("/api/chat",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({messages:[{r:"user",t:prompt}],model:"flash"})});
      const data=await res.json();
      const raw=data.reply.replace(/```json?|```/g,"").trim();
      const parsed=JSON.parse(raw);
      if(parsed.sessions&&parsed.sessions.length>0){
        // Client-side guardrail: if the AI still returned a past slot, push it to the next valid day
        const sanitized=parsed.sessions.map(s=>{
          if(s.date===tk&&timeToMinutes(s.time)<earliestTodayMins){
            const d=new Date(now);d.setDate(d.getDate()+1);
            return {...s,date:dayKey(d),time:earliestTodayTime};
          }
          return s;
        });
        const groupId=splitCount>1?"split-"+Date.now():null;
        const tasks=sanitized.slice(0,splitCount).map((s,i)=>buildTask(s.date,s.time,splitCount>1?" ("+(i+1)+"/"+splitCount+")":"",(groupId?{splitGroup:groupId,splitIndex:i+1,splitTotal:splitCount,duration:perSession}:{duration:evDuration})));
        commitTasks(tasks);
      }else{saveManual();}
    }catch(e){saveManual();}
    setAiLoading(false);
  };
  const removeEvent=(id)=>{const next=events.filter(ev=>ev.id!==id);setEvents(next);lsSet("events",next);};
  const moveEvent=(id,newDate)=>{const next=events.map(ev=>ev.id===id?{...ev,date:newDate}:ev);setEvents(next);lsSet("events",next);};
  const markDone=(id)=>{const next=events.map(ev=>ev.id===id?{...ev,status:"done",completedAt:Date.now()}:ev);setEvents(next);lsSet("events",next);};
  const nav=(d)=>setYm(c=>{const m2=c.m+d;return {y:c.y+Math.floor(m2/12),m:((m2%12)+12)%12};});
  const openEdit=(ev)=>{setEditEv(ev);setEditTitle(ev.title||"");setEditDate(ev.date||dayKey());setEditTime(ev.time||"14:30");setEditDuration(ev.duration||60);setEditDeadline(ev.deadline||"");setEditPriority((ev.priority||5)*100);setEditDifficulty((ev.difficulty||5)*100);setEditSubject(ev.subject||"Chemistry");setEditKind(ev.kind||"deadline");setEditNotes(ev.notes||"");setEditOpen(true);};
  const runGroupSync=()=>{
    const prefStart=timeToMinutes(gsStartTime);
    const prefEnd=timeToMinutes(gsEndTime);
    const dur=gsDuration;
    const slots=[];
    const today=new Date();
    const due=new Date(gsDueDate);
    for(let offset=0;offset<=14;offset++){
      const d=new Date(today);d.setDate(today.getDate()+offset);
      if(d>due)break;
      const dk=dayKey(d);
      const dayEvs=events.filter(e=>e.date===dk);
      const occupied=dayEvs.map(e=>({s:timeToMinutes(e.time||"0:00"),e:timeToMinutes(e.time||"0:00")+(e.duration||60)}));
      const isFree=(start,end)=>!occupied.some(o=>!(end<=o.s||start>=o.e));
      if(prefEnd-prefStart>=dur&&isFree(prefStart,prefStart+dur)){
        slots.push({tier:1,date:dk,start:gsStartTime,end:minutesToTime(prefStart+dur),day:d.toLocaleDateString("en-US",{weekday:"long",month:"short",day:"numeric"})});
      }
      if(slots.length>=3)break;
    }
    if(slots.length===0){
      const altWindows=[{s:"09:00",e:"11:00"},{s:"13:00",e:"15:00"},{s:"18:00",e:"20:00"},{s:"20:00",e:"22:00"}];
      for(let offset=0;offset<=14&&slots.length<3;offset++){
        const d=new Date(today);d.setDate(today.getDate()+offset);
        if(d>due)break;
        const dk=dayKey(d);
        const dayEvs=events.filter(e=>e.date===dk);
        const occupied=dayEvs.map(e=>({s:timeToMinutes(e.time||"0:00"),e:timeToMinutes(e.time||"0:00")+(e.duration||60)}));
        const isFree=(start,end)=>!occupied.some(o=>!(end<=o.s||start>=o.e));
        for(const w of altWindows){
          const ws=timeToMinutes(w.s);const we=timeToMinutes(w.e);
          if(we-ws>=dur&&isFree(ws,ws+dur)){
            slots.push({tier:2,date:dk,start:w.s,end:minutesToTime(ws+dur),day:d.toLocaleDateString("en-US",{weekday:"long",month:"short",day:"numeric"})});
            break;
          }
        }
      }
    }
    setGsResults(slots);setGsStep(2);
  };
  const closeEdit=()=>{setEditOpen(false);setEditEv(null);};
  const saveEdit=()=>{if(!editEv||!editTitle.trim())return;const next=events.map(e=>e.id===editEv.id?{...e,title:editTitle.trim(),date:editDate,time:editTime,duration:editDuration,deadline:editDeadline||null,priority:Math.round(editPriority/100),difficulty:Math.round(editDifficulty/100),subject:editSubject,kind:editKind,notes:editNotes}:e);setEvents(next);lsSet("events",next);closeEdit();};
  return (
    <div>
      <PH title="Calendar" sub={monthNames[ym.m]+" "+ym.y} action={<div style={{display:"flex",gap:8}}><Btn variant="ghost" onClick={()=>{setGroupSyncOpen(true);setGsStep(1);setGsResults(null);}}>{Icon.users} Group Sync</Btn><Btn onClick={()=>openNew(selDay)}>{React.createElement("span",{style:{display:"flex",alignItems:"center",gap:6}},Icon.plus,"Add task")}</Btn></div>} />
      <div style={{display:"flex",gap:6,marginBottom:20}}>
        {["monthly","weekly"].map(v=>(
          <button key={v} onClick={()=>setCalView(v)} style={{padding:"6px 14px",borderRadius:7,fontSize:12,fontWeight:600,cursor:"pointer",background:calView===v?T.lime+"14":"transparent",color:calView===v?T.lime:T.muted,border:`1px solid ${calView===v?T.lime+"44":T.border}`,fontFamily:T.font,transition:"all 0.15s",textTransform:"capitalize"}}>{v}</button>
        ))}
      </div>
      {toast&&(
        <div style={{position:"fixed",bottom:24,left:"50%",transform:"translateX(-50%)",zIndex:80,background:T.lime,color:T.ink,fontSize:12.5,fontWeight:600,padding:"10px 18px",borderRadius:99,boxShadow:"0 14px 30px -10px rgba(0,0,0,0.5)",display:"flex",alignItems:"center",gap:8}}>{Icon.check} Task added</div>
      )}
      <Modal open={newOpen} onClose={resetForm} title="New task" sub="Add details and let Studlin schedule it, or place it manually." width={580}
        footer={(evKind==="reminder")?<><Btn variant="subtle" onClick={resetForm}>Cancel</Btn></>:<><Btn variant="subtle" onClick={resetForm}>Cancel</Btn><Btn variant="ghost" onClick={saveManual} style={{opacity:evTitle.trim()?1:0.45}}>Save manually</Btn><Btn onClick={aiArrange} style={{opacity:evTitle.trim()?1:0.45}} disabled={aiLoading}>{aiLoading?"Scheduling...":React.createElement("span",{style:{display:"flex",alignItems:"center",gap:6}},Icon.wand,"AI arrange")}</Btn></>}>
        <Field label="Title"><Input placeholder="e.g. Study Bio chapter 4-6" value={evTitle} onChange={ev=>setEvTitle(ev.target.value)} autoFocus /></Field>
        
        <Field label="Type" hint="Choose the task type to determine scheduling behavior">
          <SelectChip options={["deadline","exam","class","study block","reminder"]} value={evKind} onChange={setEvKind} />
        </Field>

        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
          <Field label="Scheduled date"><Input type="date" value={evDate} onChange={ev=>setEvDate(ev.target.value)} /></Field>
          {evKind!=="reminder"&&<Field label="Start time"><Input type="time" value={evTime} onChange={ev=>setEvTime(ev.target.value)} /></Field>}
          {evKind==="reminder"&&<Field label="Reminder time"><Input type="time" value={evTime} onChange={ev=>setEvTime(ev.target.value)} /></Field>}
        </div>

        {evKind!=="reminder"&&(
          <>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
              <Field label="Deadline" hint="When this must be done by"><Input type="date" value={evDeadline} onChange={ev=>setEvDeadline(ev.target.value)} /></Field>
              <Field label="Duration (minutes)" hint="How long you plan to spend"><Input type="number" min={5} max={480} value={evDuration} onChange={ev=>setEvDuration(Math.max(5,+ev.target.value||5))} /></Field>
            </div>

            <Field label={`Priority: ${Math.round(evPriority/10)}%`} hint="Higher priority tasks are scheduled earlier">
              <div style={{display:"flex",alignItems:"center",gap:12}}>
                <span style={{fontSize:11,color:T.muted,width:28}}>Low</span>
                <input type="range" min={0} max={1000} value={evPriority} onChange={ev=>setEvPriority(+ev.target.value)} style={{flex:1,accentColor:T.lime,height:6,borderRadius:3,appearance:"slider-horizontal"}} />
                <span style={{fontSize:11,color:T.muted,width:40,textAlign:"right"}}>Urgent</span>
              </div>
            </Field>

            <Field label={`Difficulty: ${Math.round(evDifficulty/10)}%`} hint="Very Easy to Very Difficult">
              <div style={{display:"flex",alignItems:"center",gap:12}}>
                <span style={{fontSize:11,color:T.muted,width:28}}>Easy</span>
                <input type="range" min={0} max={1000} value={evDifficulty} onChange={ev=>setEvDifficulty(+ev.target.value)} style={{flex:1,accentColor:T.purple,height:6,borderRadius:3,appearance:"slider-horizontal"}} />
                <span style={{fontSize:11,color:T.muted,width:40,textAlign:"right"}}>Hard</span>
              </div>
            </Field>
          </>
        )}

        <Field label="Subject"><SelectChip options={SUBJ} value={evSubject} onChange={setEvSubject} /></Field>
        {evSubject==="Other"&&<Field label="Custom subject"><Input placeholder="e.g. Drivers ed, SAT prep, club..." value={evCustom} onChange={ev=>setEvCustom(ev.target.value)} /></Field>}

        {evKind!=="reminder"&&(
          <div style={{background:T.card2,border:`1px solid ${T.border}`,borderRadius:10,padding:"12px 14px",marginBottom:14}}>
            <div onClick={()=>setEvSplitEnabled(s=>!s)} style={{display:"flex",justifyContent:"space-between",alignItems:"center",cursor:"pointer"}}>
              <div><div style={{fontSize:12.5,fontWeight:600,color:T.text}}>Split into sessions</div><div style={{fontSize:11,color:T.muted,marginTop:2}}>Spread this task across multiple days</div></div>
              <div style={{width:36,height:20,borderRadius:10,background:evSplitEnabled?T.lime:T.faint,position:"relative",transition:"background 0.2s",cursor:"pointer"}}><div style={{width:16,height:16,borderRadius:"50%",background:"#fff",position:"absolute",top:2,left:evSplitEnabled?18:2,transition:"left 0.2s"}} /></div>
            </div>
            {evSplitEnabled&&(
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginTop:12,paddingTop:12,borderTop:`1px solid ${T.border}`}}>
                <Field label="Number of sessions"><Input type="number" min={2} max={10} value={evSplitCount} onChange={ev=>setEvSplitCount(Math.max(2,Math.min(10,+ev.target.value||2)))} /></Field>
                <Field label="Per session"><div style={{fontSize:14,fontWeight:600,color:T.lime,padding:"10px 0"}}>{Math.round(evDuration/evSplitCount)} min each</div></Field>
              </div>
            )}
          </div>
        )}

        <Field label="Notes (optional)"><Textarea placeholder="e.g. Bring calculator, covers chapters 4 to 6." value={evNotes} onChange={ev=>setEvNotes(ev.target.value)} /></Field>
      </Modal>
      <Modal open={editOpen} onClose={closeEdit} title="Edit task" sub="Update this task's details." width={580}
        footer={<><Btn variant="subtle" onClick={closeEdit}>Cancel</Btn><Btn onClick={saveEdit} style={{opacity:editTitle.trim()?1:0.45}}>Save changes</Btn></>}>
        <Field label="Title"><Input value={editTitle} onChange={e=>setEditTitle(e.target.value)} autoFocus /></Field>
        <Field label="Type"><SelectChip options={["deadline","exam","class","study block","reminder"]} value={editKind} onChange={setEditKind} /></Field>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
          <Field label="Scheduled date"><Input type="date" value={editDate} onChange={e=>setEditDate(e.target.value)} /></Field>
          <Field label="Start time"><Input type="time" value={editTime} onChange={e=>setEditTime(e.target.value)} /></Field>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
          <Field label="Deadline" hint="When this must be done by"><Input type="date" value={editDeadline} onChange={e=>setEditDeadline(e.target.value)} /></Field>
          <Field label="Duration (minutes)"><Input type="number" min={5} max={480} value={editDuration} onChange={e=>setEditDuration(Math.max(5,+e.target.value||5))} /></Field>
        </div>
        <Field label={`Priority: ${Math.round(editPriority/10)}%`} hint="Higher priority tasks are scheduled earlier">
          <div style={{display:"flex",alignItems:"center",gap:12}}>
            <span style={{fontSize:11,color:T.muted,width:28}}>Low</span>
            <input type="range" min={0} max={1000} value={editPriority} onChange={e=>setEditPriority(+e.target.value)} style={{flex:1,accentColor:T.lime,height:6,borderRadius:3}} />
            <span style={{fontSize:11,color:T.muted,width:40,textAlign:"right"}}>Urgent</span>
          </div>
        </Field>
        <Field label={`Difficulty: ${Math.round(editDifficulty/10)}%`} hint="Very Easy to Very Difficult">
          <div style={{display:"flex",alignItems:"center",gap:12}}>
            <span style={{fontSize:11,color:T.muted,width:28}}>Easy</span>
            <input type="range" min={0} max={1000} value={editDifficulty} onChange={e=>setEditDifficulty(+e.target.value)} style={{flex:1,accentColor:T.purple,height:6,borderRadius:3}} />
            <span style={{fontSize:11,color:T.muted,width:40,textAlign:"right"}}>Hard</span>
          </div>
        </Field>
        <Field label="Subject"><SelectChip options={SUBJ} value={editSubject} onChange={setEditSubject} /></Field>
        <Field label="Notes (optional)"><Textarea value={editNotes} onChange={e=>setEditNotes(e.target.value)} /></Field>
      </Modal>
      <Modal open={groupSyncOpen} onClose={()=>setGroupSyncOpen(false)} title="Group Smart Match" sub="Find a time slot when everyone is free." width={540}
        footer={gsStep===1?<><Btn variant="subtle" onClick={()=>setGroupSyncOpen(false)}>Cancel</Btn><Btn onClick={runGroupSync}>Find slots</Btn></>:<><Btn variant="subtle" onClick={()=>{setGsStep(1);setGsResults(null);}}>← Back</Btn><Btn variant="subtle" onClick={()=>setGroupSyncOpen(false)}>Done</Btn></>}>
        {gsStep===1&&(
          <>
            <Field label="Project due date"><Input type="date" value={gsDueDate} onChange={e=>setGsDueDate(e.target.value)} /></Field>
            <Field label="Total meeting duration (minutes)" hint="e.g. 120 for a 2-hour session"><Input type="number" min={15} max={480} value={gsDuration} onChange={e=>setGsDuration(Math.max(15,+e.target.value||60))} /></Field>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
              <Field label="Preferred window — start"><Input type="time" value={gsStartTime} onChange={e=>setGsStartTime(e.target.value)} /></Field>
              <Field label="Preferred window — end"><Input type="time" value={gsEndTime} onChange={e=>setGsEndTime(e.target.value)} /></Field>
            </div>
            <Field label="Group members (optional)" hint="Enter usernames or emails, comma-separated"><Input placeholder="e.g. @alex, @sam, jamie@school.edu" value={gsInvitees} onChange={e=>setGsInvitees(e.target.value)} /></Field>
          </>
        )}
        {gsStep===2&&(
          <div>
            {gsResults&&gsResults.length===0&&<div style={{textAlign:"center",padding:"24px 0",color:T.muted,fontSize:13}}>No available slots found before the due date. Try extending the window or increasing flexibility.</div>}
            {gsResults&&gsResults.length>0&&(
              <div style={{display:"flex",flexDirection:"column",gap:10}}>
                {gsResults.some(s=>s.tier===1)&&<div style={{fontSize:11,fontWeight:700,letterSpacing:"0.08em",textTransform:"uppercase",color:T.lime,marginBottom:4}}>Ideal matches — everyone is free</div>}
                {gsResults.filter(s=>s.tier===1).map((s,i)=>(
                  <div key={"t1-"+i} style={{display:"flex",alignItems:"center",justify:"space-between",padding:"14px 16px",background:T.lime+"0e",border:`1px solid ${T.lime}33`,borderRadius:10}}>
                    <div style={{flex:1}}>
                      <div style={{fontSize:13,fontWeight:600,color:T.white}}>{s.day}</div>
                      <div style={{fontSize:12,color:T.lime}}>{s.start} – {s.end} · {gsDuration} min</div>
                    </div>
                    <BtnSm onClick={()=>{commitTasks([{id:String(Date.now()),title:"Group meeting",date:s.date,time:s.start,subject:"Other",kind:"study block",notes:gsInvitees?"Members: "+gsInvitees:"",priority:4,difficulty:2,deadline:gsDueDate,duration:gsDuration,status:"pending",timeSpent:0,completedAt:null}]);setGroupSyncOpen(false);}}>Book it</BtnSm>
                  </div>
                ))}
                {gsResults.some(s=>s.tier===2)&&<div style={{fontSize:11,fontWeight:700,letterSpacing:"0.08em",textTransform:"uppercase",color:T.amber,margin:"8px 0 4px"}}>Alternative slots</div>}
                {gsResults.filter(s=>s.tier===2).map((s,i)=>(
                  <div key={"t2-"+i} style={{display:"flex",alignItems:"center",padding:"14px 16px",background:T.amber+"0a",border:`1px solid ${T.amber}33`,borderRadius:10}}>
                    <div style={{flex:1}}>
                      <div style={{fontSize:13,fontWeight:600,color:T.white}}>{s.day}</div>
                      <div style={{fontSize:12,color:T.amber}}>{s.start} – {s.end} · {gsDuration} min</div>
                    </div>
                    <BtnSm onClick={()=>{commitTasks([{id:String(Date.now()),title:"Group meeting",date:s.date,time:s.start,subject:"Other",kind:"study block",notes:gsInvitees?"Members: "+gsInvitees:"",priority:4,difficulty:2,deadline:gsDueDate,duration:gsDuration,status:"pending",timeSpent:0,completedAt:null}]);setGroupSyncOpen(false);}}>Book it</BtnSm>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </Modal>
      {calView==="monthly"&&(<div style={{display:"grid",gridTemplateColumns:"1fr 300px",gap:16}}>
        <Card style={{padding:16}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14,padding:"4px 6px"}}>
            <div style={{display:"flex",gap:8,alignItems:"center"}}>
              <select value={ym.m} onChange={e=>setYm(c=>({...c,m:+e.target.value}))} style={{background:T.card2,border:`1px solid ${T.border}`,borderRadius:8,padding:"7px 10px",color:T.white,fontSize:15,fontWeight:700,fontFamily:T.font,outline:"none",cursor:"pointer",letterSpacing:"-0.01em"}}>
                {monthNames.map((mn,i)=><option key={i} value={i}>{mn}</option>)}
              </select>
              <select value={ym.y} onChange={e=>setYm(c=>({...c,y:+e.target.value}))} style={{background:T.card2,border:`1px solid ${T.border}`,borderRadius:8,padding:"7px 10px",color:T.muted,fontSize:15,fontFamily:T.font,outline:"none",cursor:"pointer"}}>
                {Array.from({length:31},(_,i)=>2015+i).map(y=><option key={y} value={y}>{y}</option>)}
              </select>
            </div>
            <div style={{display:"flex",gap:6}}>
              <BtnSm variant="ghost" onClick={()=>nav(-1)}>←</BtnSm>
              <BtnSm variant="ghost" onClick={()=>{setYm({y:now.getFullYear(),m:now.getMonth()});setSelDay(todayK);}}>Today</BtnSm>
              <BtnSm variant="ghost" onClick={()=>nav(1)}>→</BtnSm>
            </div>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:3}}>
            {["Mon","Tue","Wed","Thu","Fri","Sat","Sun"].map((d,i)=><div key={i} style={{fontSize:10,fontWeight:600,color:T.muted,textAlign:"center",padding:"6px 0",letterSpacing:"0.05em"}}>{d}</div>)}
            {cells.map((c,i)=>{
              const evs=byDay[c.key]||[];
              const isToday=c.key===todayK;
              const isSel=c.key===selDay;
              return (
                <div key={i} onClick={()=>{setSelDay(c.key);}} onDoubleClick={()=>openNew(c.key)}
                  onDragOver={e=>e.preventDefault()} onDrop={e=>{e.preventDefault();if(dragId){moveEvent(dragId,c.key);setDragId(null);}}}
                  style={{minHeight:64,borderRadius:9,padding:"6px 7px",cursor:"pointer",background:isSel?T.card2:"transparent",border:"1px solid "+(isSel?T.lime+"55":"transparent"),transition:"all 0.12s",opacity:c.out?0.35:1}}>
                  <div style={{display:"flex",justifyContent:"flex-start"}}>
                    <span style={{width:22,height:22,borderRadius:"50%",display:"inline-flex",alignItems:"center",justifyContent:"center",fontSize:12,fontWeight:isToday?700:500,background:isToday?T.lime:"transparent",color:isToday?T.ink:c.out?T.faint:T.text}}>{c.d}</span>
                  </div>
                  <div style={{display:"flex",flexDirection:"column",gap:2,marginTop:3}}>
                    {evs.slice(0,2).map((ev,j)=>{
                      const over=daysOverdue(ev);
                      return <div key={j} style={{fontSize:9,fontWeight:600,color:over>0?T.red:colorOf(ev.subject),background:(over>0?T.red:colorOf(ev.subject))+"16",borderRadius:4,padding:"2px 5px",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis",display:"flex",alignItems:"center",gap:3}}>
                        {ev.priority&&ev.priority>=4&&<span style={{width:5,height:5,borderRadius:"50%",background:PRIORITY_COLORS[ev.priority],flexShrink:0}} />}
                        {ev.title}
                      </div>;
                    })}
                    {evs.length>2&&<div style={{fontSize:9,color:T.muted,paddingLeft:5}}>+{evs.length-2} more</div>}
                  </div>
                </div>
              );
            })}
          </div>
          <div style={{fontSize:10.5,color:T.faint,marginTop:10,paddingLeft:6}}>Click a day to see its schedule · double-click to add a task · drag tasks between days</div>
        </Card>
        <div style={{display:"flex",flexDirection:"column",gap:14}}>
          <Card style={{padding:16}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
              <div>
                <div style={{fontSize:13,fontWeight:700,color:T.white}}>{relDay(selDay)}</div>
                <div style={{fontSize:10.5,color:T.muted,marginTop:1}}>{niceDate(selDay)}</div>
              </div>
              <BtnSm variant="subtle" onClick={()=>openNew(selDay)}>+ Add</BtnSm>
            </div>
            {dayEvents.length===0
              ?<div style={{fontSize:12,color:T.muted,padding:"14px 0 6px",textAlign:"center"}}>Nothing scheduled</div>
              :dayEvents.map(ev=>{
                const over=daysOverdue(ev);
                const isDone=ev.status==="done";
                return(
                <div key={ev.id} draggable onDragStart={()=>setDragId(ev.id)} style={{display:"flex",gap:10,padding:"9px 0",borderBottom:"1px solid "+T.border,alignItems:"flex-start",opacity:isDone?0.5:1,cursor:"grab"}}>
                  <div style={{width:3,alignSelf:"stretch",borderRadius:2,background:over>0?T.red:colorOf(ev.subject),flexShrink:0}} />
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{display:"flex",alignItems:"center",gap:6}}>
                      {ev.priority&&<span style={{width:7,height:7,borderRadius:"50%",background:PRIORITY_COLORS[ev.priority||3],flexShrink:0}} />}
                      <span style={{fontSize:12.5,fontWeight:600,color:isDone?T.muted:T.white,lineHeight:1.35,textDecoration:isDone?"line-through":"none"}}>{ev.title}</span>
                    </div>
                    <div style={{fontSize:11,color:T.muted,marginTop:2,display:"flex",gap:6,flexWrap:"wrap",alignItems:"center"}}>
                      <span>{fmtTime(ev.time)}</span>
                      {ev.duration&&<span style={{background:T.card2,padding:"1px 6px",borderRadius:4,fontSize:10,fontWeight:600}}>{ev.duration>=60?Math.floor(ev.duration/60)+"h"+(ev.duration%60?" "+ev.duration%60+"m":""):ev.duration+"m"}</span>}
                      <span>{ev.subject}</span>
                      {over>0&&<span style={{color:T.red,fontWeight:600}}>{over}d overdue</span>}
                    </div>
                  </div>
                  <div style={{display:"flex",gap:4,flexShrink:0,alignItems:"center"}}>
                    {!isDone&&ev.duration&&<button onClick={()=>{if(window._setTimerTask)window._setTimerTask(ev);}} style={{padding:"4px 8px",borderRadius:6,border:`1px solid ${T.lime}44`,background:T.lime+"12",color:T.lime,fontSize:10,fontWeight:600,cursor:"pointer",fontFamily:T.font}}>Begin</button>}
                    {!isDone&&<button onClick={()=>markDone(ev.id)} title="Mark done" style={{border:"none",background:"transparent",color:T.faint,cursor:"pointer",display:"flex"}}>{Icon.check}</button>}
                    <button onClick={()=>removeEvent(ev.id)} title="Delete" style={{border:"none",background:"transparent",color:T.faint,cursor:"pointer",fontSize:14,lineHeight:1,padding:2}}>×</button>
                  </div>
                </div>
              );})}
          </Card>
          <div>
            <div style={{fontSize:12,fontWeight:600,color:T.muted,letterSpacing:"0.05em",textTransform:"uppercase",marginBottom:10}}>Upcoming</div>
            {upcoming.length===0&&<Card style={{padding:14,fontSize:12,color:T.muted,textAlign:"center"}}>No upcoming events</Card>}
            {upcoming.map(ev=>{
              const dl=daysUntilDeadline(ev);
              const over=daysOverdue(ev);
              return(
              <Card key={ev.id} onClick={()=>{setSelDay(ev.date);const p=ev.date.split("-");setYm({y:+p[0],m:+p[1]-1});}} style={{borderLeft:"2px solid "+(over>0?T.red:colorOf(ev.subject)),marginBottom:8,cursor:"pointer",padding:14}}>
                <div style={{display:"flex",justifyContent:"space-between",marginBottom:5}}>
                  <div style={{fontSize:11,color:T.muted}}>{relDay(ev.date)}</div>
                  <Badge color={over>0?T.red:colorOf(ev.subject)}>{ev.subject}</Badge>
                </div>
                <div style={{display:"flex",alignItems:"center",gap:6}}>
                  {ev.priority&&<span style={{width:6,height:6,borderRadius:"50%",background:PRIORITY_COLORS[ev.priority||3]}} />}
                  <span style={{fontSize:13,fontWeight:600,color:T.white}}>{ev.title}</span>
                </div>
                <div style={{fontSize:11,color:T.muted,marginTop:4,display:"flex",gap:8}}>
                  <span>{fmtTime(ev.time)}</span>
                  {ev.duration&&<span>{ev.duration}m</span>}
                  {dl!==null&&dl>=0&&dl<=3&&<span style={{color:dl===0?T.red:T.amber,fontWeight:600}}>Due {dl===0?"today":"in "+dl+"d"}</span>}
                  {over>0&&<span style={{color:T.red,fontWeight:600}}>{over}d overdue</span>}
                </div>
              </Card>
            );})}
          </div>
        </div>
      </div>)}
      {calView==="weekly"&&<WeeklyPlanner events={events} setEvents={setEvents} weekOffset={weekOffset} setWeekOffset={setWeekOffset} todayK={todayK} colorOf={colorOf} fmtTime={fmtTime} openNew={openNew} openEdit={openEdit} />}
    </div>
  );
}

// ─── AI TUTOR ─────────────────────────────────────────────────────────────────
function AiTutor(){
  const defaults=["English IV","Biology","Calculus","Spanish","Chemistry","History"];
  const [subjects,setSubjects]=useState(()=>lsGet("subjects",defaults));
  const [subject,setSubject]=useState(subjects[0]||"English IV");
  const [adding,setAdding]=useState(false);
  const [newSub,setNewSub]=useState("");
  const subColor={"English IV":T.purple,"Biology":T.teal,"Calculus":T.blue,"Spanish":T.amber,"Chemistry":T.red,"History":T.muted};
  const colorOf=(sb)=>subColor[sb]||T.lime;

  const [mode,setMode]=useState("lesson");
  const [topic,setTopic]=useState("");
  const [lesson,setLesson]=useState(null);
  const [lessonLoading,setLessonLoading]=useState(false);
  const [showAnswer,setShowAnswer]=useState(false);

  const [socMsgs,setSocMsgs]=useState([]);
  const [socActive,setSocActive]=useState(false);
  const [socInput,setSocInput]=useState("");
  const [socLoading,setSocLoading]=useState(false);

  const addSubject=()=>{const v=newSub.trim();if(!v)return;if(!subjects.includes(v)){const next=subjects.concat([v]);setSubjects(next);lsSet("subjects",next);}setSubject(v);setNewSub("");setAdding(false);};
  const removeSubject=(sb)=>{const next=subjects.filter(x=>x!==sb);setSubjects(next);lsSet("subjects",next);if(subject===sb)setSubject(next[0]||"");};

  const resetAll=()=>{setLesson(null);setShowAnswer(false);setSocMsgs([]);setSocActive(false);};

  const genLesson=async()=>{
    if(!topic.trim())return;
    setLessonLoading(true);setLesson(null);setShowAnswer(false);
    const prompt="Hey Studlin, I want a mini-lesson on \""+topic.trim()+"\" for "+subject+". Respond with ONLY valid JSON in this exact shape, no markdown fences: {\"concept\":\"a clear 3-5 sentence plain-English explanation of the core idea\",\"example\":\"one fully worked example showing the steps\",\"mistakes\":[\"common mistake 1\",\"common mistake 2\",\"common mistake 3\"],\"question\":\"one short practice question testing this exact concept\",\"answer\":\"the answer to that question with a brief explanation why\"}";
    try{
      const res=await authFetch("/api/chat",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({messages:[{r:"user",t:prompt}],model:"standard"})});
      const data=await res.json();
      if(data.error){setLesson({concept:"Couldn't generate a lesson: "+data.error,example:"",mistakes:[],question:"",answer:""});setLessonLoading(false);return;}
      var raw=(data.reply||"").replace(/```json?|```/g,"").trim();
      var jsonStart=raw.indexOf("{");var jsonEnd=raw.lastIndexOf("}");
      if(jsonStart>=0&&jsonEnd>jsonStart){raw=raw.slice(jsonStart,jsonEnd+1);}
      var parsed=JSON.parse(raw);
      setLesson(parsed);
    }catch(e){setLesson({concept:"Something went wrong generating this lesson. Try again.",example:"",mistakes:[],question:"",answer:""});}
    setLessonLoading(false);
  };

  const startSocratic=async()=>{
    if(!topic.trim())return;
    setSocActive(true);setSocLoading(true);setSocMsgs([]);
    const kickoff="I want to learn about \""+topic.trim()+"\" in "+subject+" using the Socratic method. Don't explain it to me directly. Instead, ask me ONE short guiding question to start helping me figure it out myself. Wait for my answer before continuing.";
    try{
      const res=await authFetch("/api/chat",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({messages:[{r:"user",t:kickoff}],model:"standard"})});
      const data=await res.json();
      setSocMsgs([{r:"ai",t:data.reply||"Let's start: what do you already know about "+topic.trim()+"?"}]);
    }catch(e){setSocMsgs([{r:"ai",t:"Let's start: what do you already know about "+topic.trim()+"?"}]);}
    setSocLoading(false);
  };

  const sendSocraticReply=async()=>{
    if(!socInput.trim()||socLoading)return;
    const userMsg={r:"user",t:socInput.trim()};
    const next=socMsgs.concat([userMsg]);
    setSocMsgs(next);setSocInput("");setSocLoading(true);
    const apiMsgs=next.map(m=>({r:m.r,t:m.t}));
    apiMsgs.push({r:"user",t:"(Remember: keep using the Socratic method on the topic \""+topic.trim()+"\" -- ask guiding questions, give hints if I'm stuck, don't just give the answer outright unless I've clearly got it.)"});
    try{
      const res=await authFetch("/api/chat",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({messages:apiMsgs,model:"standard"})});
      const data=await res.json();
      setSocMsgs(m=>m.concat([{r:"ai",t:data.reply||"Hm, try explaining your thinking a bit more?"}]));
    }catch(e){setSocMsgs(m=>m.concat([{r:"ai",t:"Something went wrong. Try again?"}]));}
    setSocLoading(false);
  };

  return (
    <div>
      <PH title="Tutor" sub="Pick a topic. Get a mini-lesson, or learn it the Socratic way." />
      <div style={{display:"grid",gridTemplateColumns:"190px 1fr",gap:16}}>
        <div>
          <Label>Subjects</Label>
          {subjects.map(sb=>(
            <div key={sb} onClick={()=>{setSubject(sb);resetAll();}} style={{display:"flex",alignItems:"center",gap:10,padding:"9px 11px",borderRadius:7,marginBottom:3,fontSize:12,cursor:"pointer",background:subject===sb?T.lime+"10":"transparent",color:subject===sb?T.lime:T.muted,fontWeight:subject===sb?600:400,border:"1px solid "+(subject===sb?T.lime+"33":"transparent"),transition:"all 0.15s",position:"relative"}}>
              <div style={{width:5,height:5,borderRadius:"50%",background:subject===sb?T.lime:T.faint,flexShrink:0}} />
              <span style={{flex:1,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{sb}</span>
              {!defaults.includes(sb)&&<span onClick={ev=>{ev.stopPropagation();removeSubject(sb);}} style={{color:T.faint,fontSize:12}}>×</span>}
            </div>
          ))}
          {adding
            ?<div style={{display:"flex",gap:6,marginTop:6}}>
               <input value={newSub} onChange={ev=>setNewSub(ev.target.value)} onKeyDown={ev=>{if(ev.key==="Enter")addSubject();}} placeholder="e.g. Physics" autoFocus style={{flex:1,minWidth:0,background:T.card2,border:"1px solid "+T.border,borderRadius:6,padding:"7px 9px",color:T.text,fontSize:11.5,fontFamily:T.font,outline:"none"}} />
               <BtnSm onClick={addSubject}>Add</BtnSm>
             </div>
            :<div onClick={()=>setAdding(true)} style={{display:"flex",alignItems:"center",gap:8,padding:"9px 11px",borderRadius:7,fontSize:12,cursor:"pointer",color:T.muted,border:"1px dashed "+T.border,marginTop:6}}>{Icon.plus} Add subject</div>
          }
        </div>

        <div style={{display:"flex",flexDirection:"column",gap:14}}>
          <Card style={{padding:"14px 16px"}}>
            <div style={{display:"flex",gap:10,alignItems:"center",marginBottom:12}}>
              <span style={{color:T.muted,display:"flex"}}>{Icon.search||Icon.brain}</span>
              <input value={topic} onChange={ev=>setTopic(ev.target.value)} onKeyDown={ev=>{if(ev.key==="Enter")(mode==="lesson"?genLesson():startSocratic());}} placeholder={"What do you want to learn in "+subject+"? e.g. how photosynthesis works"} style={{flex:1,background:"transparent",border:"none",outline:"none",color:T.text,fontSize:13.5,fontFamily:T.font}} />
            </div>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <div style={{display:"flex",gap:6,background:T.card2,borderRadius:8,padding:3}}>
                <button onClick={()=>{setMode("lesson");resetAll();}} style={{padding:"6px 14px",borderRadius:6,border:"none",background:mode==="lesson"?T.lime:"transparent",color:mode==="lesson"?T.ink:T.muted,fontSize:12,fontWeight:600,cursor:"pointer",fontFamily:T.font,transition:"all 0.15s"}}>Mini-lesson</button>
                <button onClick={()=>{setMode("socratic");resetAll();}} style={{padding:"6px 14px",borderRadius:6,border:"none",background:mode==="socratic"?T.lime:"transparent",color:mode==="socratic"?T.ink:T.muted,fontSize:12,fontWeight:600,cursor:"pointer",fontFamily:T.font,transition:"all 0.15s"}}>Socratic mode</button>
              </div>
              {mode==="lesson"
                ?<Btn onClick={genLesson} style={{opacity:topic.trim()?1:0.45}} disabled={lessonLoading}>{lessonLoading?"Generating...":"Generate lesson"}</Btn>
                :<Btn onClick={startSocratic} style={{opacity:topic.trim()?1:0.45}} disabled={socLoading&&!socActive}>{socActive?"Restart":"Start"}</Btn>}
            </div>
          </Card>

          {mode==="lesson"&&!lesson&&!lessonLoading&&(
            <Card style={{padding:24}}>
              <div style={{display:"flex",alignItems:"center",gap:14,marginBottom:16}}>
                <div style={{width:44,height:44,borderRadius:10,background:colorOf(subject)+"18",border:"1px solid "+colorOf(subject)+"33",display:"flex",alignItems:"center",justifyContent:"center",color:colorOf(subject)}}>{Icon.brain}</div>
                <div>
                  <div style={{fontSize:16,fontWeight:700,color:T.white,letterSpacing:"-0.01em"}}>Studlin</div>
                  <div style={{fontSize:12,color:T.muted}}>{subject} · Mini-lesson</div>
                </div>
              </div>
              <div style={{fontSize:14,color:T.text,lineHeight:1.75,padding:"14px 16px",background:T.card2,borderRadius:8,border:"1px solid "+T.border}}>
                Type any topic in <strong style={{color:T.lime,fontWeight:600}}>{subject}</strong> above and I'll build you a quick lesson: the concept explained simply, a worked example, common mistakes to avoid, and a practice question to check you've got it.
              </div>
            </Card>
          )}

          {mode==="lesson"&&lessonLoading&&(
            <Card style={{padding:24,textAlign:"center"}}>
              <div style={{fontSize:13,color:T.muted}}>Building your lesson on "{topic}"...</div>
            </Card>
          )}

          {mode==="lesson"&&lesson&&(
            <div style={{display:"flex",flexDirection:"column",gap:12}}>
              <Card style={{borderLeft:"3px solid "+T.lime}}>
                <Label>The concept</Label>
                <div style={{fontSize:14.5,color:T.text,lineHeight:1.75}}>{lesson.concept}</div>
              </Card>
              {lesson.example&&(
                <Card style={{borderLeft:"3px solid "+T.blue}}>
                  <Label>Worked example</Label>
                  <div style={{fontSize:14,color:T.text,lineHeight:1.75,whiteSpace:"pre-wrap"}}>{lesson.example}</div>
                </Card>
              )}
              {lesson.mistakes&&lesson.mistakes.length>0&&(
                <Card style={{borderLeft:"3px solid "+T.amber}}>
                  <Label>Common mistakes</Label>
                  <ul style={{margin:0,paddingLeft:18,fontSize:13.5,color:T.text,lineHeight:1.8}}>
                    {lesson.mistakes.map((m,i)=><li key={i}>{m}</li>)}
                  </ul>
                </Card>
              )}
              {lesson.question&&(
                <Card style={{borderLeft:"3px solid "+T.purple}}>
                  <Label>Quick check</Label>
                  <div style={{fontSize:14.5,color:T.text,lineHeight:1.7,marginBottom:10}}>{lesson.question}</div>
                  {showAnswer
                    ?<div style={{fontSize:13.5,color:T.lime,lineHeight:1.7,padding:"10px 12px",background:T.lime+"0e",borderRadius:8,border:"1px solid "+T.lime+"33"}}>{lesson.answer}</div>
                    :<BtnSm variant="subtle" onClick={()=>setShowAnswer(true)}>Reveal answer</BtnSm>}
                </Card>
              )}
              <div style={{display:"flex",justifyContent:"center"}}>
                <BtnSm variant="ghost" onClick={()=>{setLesson(null);setShowAnswer(false);}}>Ask about something else</BtnSm>
              </div>
            </div>
          )}

          {mode==="socratic"&&!socActive&&(
            <Card style={{padding:24}}>
              <div style={{display:"flex",alignItems:"center",gap:14,marginBottom:16}}>
                <div style={{width:44,height:44,borderRadius:10,background:colorOf(subject)+"18",border:"1px solid "+colorOf(subject)+"33",display:"flex",alignItems:"center",justifyContent:"center",color:colorOf(subject)}}>{Icon.brain}</div>
                <div>
                  <div style={{fontSize:16,fontWeight:700,color:T.white,letterSpacing:"-0.01em"}}>Studlin</div>
                  <div style={{fontSize:12,color:T.muted}}>{subject} · Socratic method</div>
                </div>
              </div>
              <div style={{fontSize:14,color:T.text,lineHeight:1.75,padding:"14px 16px",background:T.card2,borderRadius:8,border:"1px solid "+T.border}}>
                Type a topic in <strong style={{color:T.lime,fontWeight:600}}>{subject}</strong> above and hit Start. I won't explain it -- I'll ask you guiding questions until you figure it out yourself. That's how it actually sticks.
              </div>
            </Card>
          )}

          {mode==="socratic"&&socActive&&(
            <Card style={{padding:0,overflow:"hidden"}}>
              <div style={{padding:"14px 18px",borderBottom:"1px solid "+T.border,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                <div style={{fontSize:13,fontWeight:700,color:T.white}}>{topic}</div>
                <BtnSm variant="ghost" onClick={resetAll}>End session</BtnSm>
              </div>
              <div style={{padding:"16px 18px",display:"flex",flexDirection:"column",gap:14,maxHeight:420,overflowY:"auto"}}>
                {socMsgs.map((m,i)=>(
                  <div key={i} style={{display:"flex",gap:10,alignItems:"flex-start"}}>
                    <div style={{width:26,height:26,borderRadius:7,flexShrink:0,background:m.r==="ai"?T.lime:T.card2,border:m.r==="ai"?"none":"1px solid "+T.border,display:"grid",placeItems:"center",fontSize:11,fontWeight:700,color:m.r==="ai"?T.ink:T.muted}}>{m.r==="ai"?"S":"Y"}</div>
                    <div style={{fontSize:13.5,color:T.text,lineHeight:1.7,whiteSpace:"pre-wrap",paddingTop:3}}>{m.t}</div>
                  </div>
                ))}
                {socLoading&&<div style={{fontSize:12,color:T.muted,paddingLeft:36}}>Thinking...</div>}
              </div>
              <div style={{padding:"12px 14px",borderTop:"1px solid "+T.border,display:"flex",gap:8}}>
                <input value={socInput} onChange={ev=>setSocInput(ev.target.value)} onKeyDown={ev=>{if(ev.key==="Enter")sendSocraticReply();}} placeholder="Type your answer or thinking..." style={{flex:1,background:T.card2,border:"1px solid "+T.border,borderRadius:8,padding:"9px 12px",color:T.text,fontSize:13,fontFamily:T.font,outline:"none"}} />
                <Btn onClick={sendSocraticReply} style={{opacity:socInput.trim()?1:0.45}} disabled={socLoading}>Send</Btn>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── SOLVE ───────────────────────────────────────────────────────────────────
function Solve(){
  const [image,setImage]=useState(null);
  const [imagePreview,setImagePreview]=useState(null);
  const [subject,setSubject]=useState("Math");
  const [deepThink,setDeepThink]=useState(false);
  const [loading,setLoading]=useState(false);
  const [result,setResult]=useState("");
  const [textInput,setTextInput]=useState("");
  const fileRef=useRef(null);
  const scrollRef=useRef(null);
  const subjects=["Psychology","Physics","Biology","Math","General","Chemistry","History","Economics","English","Spanish","Computer Science","Other"];

  var handleFile=function(e){var file=e.target.files&&e.target.files[0];if(!file)return;e.target.value="";if(!file.type.startsWith("image/"))return;setImage(file);var reader=new FileReader();reader.onload=function(){setImagePreview(reader.result);};reader.readAsDataURL(file);};
  var handleDrop=function(e){e.preventDefault();e.stopPropagation();var file=e.dataTransfer.files&&e.dataTransfer.files[0];if(file&&file.type.startsWith("image/")){setImage(file);var reader=new FileReader();reader.onload=function(){setImagePreview(reader.result);};reader.readAsDataURL(file);}};

  var solve=async function(){
    if(!textInput.trim()&&!image)return;
    setLoading(true);setResult("");
    try{
      var prompt="Hey Studlin, I need help solving this "+subject+" problem."+(deepThink?" Please show your full step-by-step thinking process and reasoning before giving the answer. Be very thorough.":"")+" Here's the problem:\n\n";
      if(textInput.trim())prompt+=textInput;
      if(!textInput.trim()&&image)prompt="Hey Studlin, I uploaded an image of a "+subject+" problem but since you can't see images, can you help me if I describe it? Ask me to type out what the problem says.";
      var res=await authFetch("/api/chat",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({messages:[{r:"user",t:prompt}],model:"standard"})});
      var data=await res.json();
      setResult(data.reply||"No response.");
    }catch(e){setResult("Error: "+e.message);}
    setLoading(false);
  };

  var scrollSubjects=function(dir){if(scrollRef.current)scrollRef.current.scrollBy({left:dir*150,behavior:"smooth"});};

  return(
    <div style={{maxWidth:720,margin:"0 auto"}}>
      <div style={{textAlign:"center",marginBottom:28}}>
        <h1 style={{fontSize:28,fontWeight:700,color:T.white,letterSpacing:"-0.02em",margin:"0 0 8px"}}>What do you want to solve?</h1>
      </div>

      <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:24}}>
        <button onClick={function(){scrollSubjects(-1);}} style={{width:32,height:32,borderRadius:"50%",border:"1px solid "+T.border,background:T.card,color:T.muted,cursor:"pointer",display:"grid",placeItems:"center",flexShrink:0,fontSize:14}}>‹</button>
        <div ref={scrollRef} style={{display:"flex",gap:8,overflowX:"auto",scrollbarWidth:"none",flex:1,WebkitOverflowScrolling:"touch",msOverflowStyle:"none"}}>
          {subjects.map(function(s){return(
            <button key={s} onClick={function(){setSubject(s);}} style={{display:"inline-flex",alignItems:"center",gap:6,padding:"8px 16px",borderRadius:99,fontSize:13,fontWeight:subject===s?600:400,cursor:"pointer",border:"1px solid "+(subject===s?T.lime+"66":T.border),background:subject===s?T.lime+"14":T.card,color:subject===s?T.lime:T.text,fontFamily:T.font,whiteSpace:"nowrap",flexShrink:0,transition:"all 0.15s"}}>
              {s}
            </button>
          );})}
        </div>
        <button onClick={function(){scrollSubjects(1);}} style={{width:32,height:32,borderRadius:"50%",border:"1px solid "+T.border,background:T.card,color:T.muted,cursor:"pointer",display:"grid",placeItems:"center",flexShrink:0,fontSize:14}}>›</button>
      </div>

      <div onDragOver={function(e){e.preventDefault();}} onDrop={handleDrop} onClick={function(){if(!imagePreview)fileRef.current&&fileRef.current.click();}} style={{border:"2px dashed "+(imagePreview?T.lime+"44":T.border),borderRadius:16,padding:imagePreview?0:36,textAlign:"center",background:imagePreview?"transparent":T.card,cursor:imagePreview?"default":"pointer",marginBottom:16,overflow:"hidden",position:"relative",transition:"border-color 0.2s"}}>
        <input type="file" ref={fileRef} onChange={handleFile} accept="image/*" style={{display:"none"}} />
        {imagePreview?(
          <div style={{position:"relative"}}>
            <img src={imagePreview} alt="Problem" style={{width:"100%",maxHeight:300,objectFit:"contain",display:"block"}} />
            <button onClick={function(e){e.stopPropagation();setImage(null);setImagePreview(null);}} style={{position:"absolute",top:10,right:10,width:30,height:30,borderRadius:"50%",background:"rgba(0,0,0,0.7)",color:"#fff",border:"none",cursor:"pointer",fontSize:16,display:"grid",placeItems:"center"}}>×</button>
          </div>
        ):(
          <div>
            <div style={{width:44,height:44,borderRadius:12,background:T.card2,border:"1px solid "+T.border,display:"grid",placeItems:"center",margin:"0 auto 12px",color:T.muted}}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
            </div>
            <div style={{fontSize:14,fontWeight:500,color:T.text}}>Drag & drop or click to add an image</div>
          </div>
        )}
      </div>

      <div style={{position:"relative",marginBottom:16}}>
        <input value={textInput} onChange={function(e){setTextInput(e.target.value);}} onKeyDown={function(e){if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();solve();}}} placeholder="Type your question here..." style={{width:"100%",padding:"14px 52px 14px 16px",borderRadius:12,border:"1px solid "+T.border,background:T.card,color:T.text,fontSize:14,fontFamily:T.font,outline:"none",boxSizing:"border-box"}} />
        <button onClick={solve} disabled={loading||(!textInput.trim()&&!image)} style={{position:"absolute",right:6,top:"50%",transform:"translateY(-50%)",width:36,height:36,borderRadius:10,background:(!textInput.trim()&&!image)?T.card2:T.lime,color:(!textInput.trim()&&!image)?T.muted:T.ink,border:"none",cursor:"pointer",display:"grid",placeItems:"center",transition:"all 0.15s"}}>
          {loading?<span style={{width:14,height:14,border:"2px solid "+T.muted,borderTopColor:T.text,borderRadius:"50%",animation:"studlinSpin 0.7s linear infinite",display:"block"}} />:<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="19" x2="12" y2="5"/><polyline points="5 12 12 5 19 12"/></svg>}
        </button>
      </div>

      <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:24}}>
        <div onClick={function(){setDeepThink(function(d){return!d;});}} style={{display:"flex",alignItems:"center",gap:8,cursor:"pointer"}}>
          <div style={{width:36,height:20,borderRadius:10,background:deepThink?T.purple:T.faint,position:"relative",transition:"background 0.2s"}}><div style={{width:16,height:16,borderRadius:"50%",background:"#fff",position:"absolute",top:2,left:deepThink?18:2,transition:"left 0.2s"}} /></div>
          <span style={{fontSize:13,color:deepThink?T.purple:T.muted,fontWeight:500}}>Thinking</span>
        </div>
      </div>

      {result&&(
        <Card style={{borderLeft:"3px solid "+T.lime,marginBottom:20}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
            <div style={{display:"flex",gap:8,alignItems:"center"}}>
              <div style={{width:28,height:28,borderRadius:7,background:T.lime,display:"grid",placeItems:"center",fontWeight:800,color:T.ink,fontSize:13,fontFamily:T.font}}>S</div>
              <div><div style={{fontSize:13,fontWeight:700,color:T.white}}>Studlin</div><div style={{fontSize:10,color:T.muted}}>{subject}{deepThink?" · Deep thinking":""}</div></div>
            </div>
            <BtnSm variant="ghost" onClick={function(){navigator.clipboard&&navigator.clipboard.writeText(result);}}>{Icon.copy} Copy</BtnSm>
          </div>
          <div style={{fontSize:14,color:T.text,lineHeight:1.8,whiteSpace:"pre-wrap"}}>{result}</div>
        </Card>
      )}
    </div>
  );
}

// ─── GRAMMAR & POLISH ─────────────────────────────────────────────────────────
function GrammarPolish() {
  const [text,setText]=useState("");
  const [issues,setIssues]=useState([]);
  const [loading,setLoading]=useState(false);
  const [grade,setGrade]=useState(null);
  const [stats,setStats]=useState(null);
  const [rewriteResult,setRewriteResult]=useState("");
  const [rewriteLoading,setRewriteLoading]=useState(false);
  const [activeMode,setActiveMode]=useState(null);

  const wordCount=text.trim()?text.trim().split(/\s+/).length:0;
  const sentenceCount=text.trim()?text.split(/[.!?]+/).filter(Boolean).length:0;
  const avgWords=sentenceCount?Math.round(wordCount/sentenceCount):0;

  const runCheck=async()=>{
    if(!text.trim()||text.trim().length<10)return;
    setLoading(true);setIssues([]);setGrade(null);setStats(null);setRewriteResult("");
    try{
      const prompt="Hey Studlin, I need you to check my writing for grammar, spelling, style, and clarity issues. Analyze this text and return a JSON object with this exact format:\n{\"grade\":\"B+\",\"readingLevel\":\"Grade 11\",\"issues\":[{\"type\":\"Grammar\",\"orig\":\"the exact wrong text\",\"fix\":\"corrected version\",\"desc\":\"brief explanation\"}],\"grammarCount\":2,\"styleCount\":1,\"clarityCount\":0,\"summary\":\"one sentence overall feedback\"}\n\nTypes can be: Grammar, Spelling, Style, Clarity, Punctuation\n\nMy text:\n"+text;
      const res=await authFetch("/api/chat",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({messages:[{r:"user",t:prompt}],model:"standard"})});
      const data=await res.json();
      var raw=(data.reply||"").replace(/```json?|```/g,"").trim();
      var jsonStart=raw.indexOf("{");var jsonEnd=raw.lastIndexOf("}");
      if(jsonStart>=0&&jsonEnd>jsonStart){raw=raw.slice(jsonStart,jsonEnd+1);}
      try{
        var parsed=JSON.parse(raw);
        setGrade(parsed.grade||"—");
        setStats({grammar:parsed.grammarCount||0,style:parsed.styleCount||0,clarity:parsed.clarityCount||0,reading:parsed.readingLevel||"",summary:parsed.summary||""});
        setIssues(Array.isArray(parsed.issues)?parsed.issues:[]);
      }catch(pe){setGrade("?");setStats({grammar:0,style:0,clarity:0,reading:"",summary:"Could not parse results. Try again."});setIssues([]);}
    }catch(e){setGrade("?");setStats({grammar:0,style:0,clarity:0,summary:"Error: "+e.message});}
    setLoading(false);
  };

  const rewriteTool=async(mode)=>{
    if(!text.trim())return;
    setActiveMode(mode);setRewriteLoading(true);setRewriteResult("");
    try{
      var prompts={"clarity":"Rewrite this text for maximum clarity. Keep the meaning but make every sentence easy to understand on first read.","academic":"Elevate this text to a formal academic register. Use sophisticated vocabulary and complex sentence structures while maintaining clarity.","simplify":"Simplify this text. Use shorter sentences, simpler words, and break down complex ideas. Aim for a Grade 8 reading level.","transitions":"Add transitional phrases between sentences and paragraphs to improve flow. Keep the original content but weave in connectors.","vary":"Rewrite this to vary sentence length and structure. Mix short punchy sentences with longer complex ones for rhythm."};
      var p="Hey Studlin, "+prompts[mode]+"\n\nOriginal text:\n"+text+"\n\nJust give me the rewritten text directly, nothing else.";
      var res=await authFetch("/api/chat",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({messages:[{r:"user",t:p}],model:"standard"})});
      var data=await res.json();
      setRewriteResult(data.reply||"No result.");
    }catch(e){setRewriteResult("Error: "+e.message);}
    setRewriteLoading(false);
  };

  var acceptFix=function(issue){setText(function(t){return t.replace(issue.orig,issue.fix);});setIssues(function(arr){return arr.filter(function(x){return x!==issue;});});};
  var acceptAll=function(){var t=text;issues.forEach(function(issue){t=t.replace(issue.orig,issue.fix);});setText(t);setIssues([]);};
  var typeColor={"Grammar":T.red,"Spelling":T.red,"Punctuation":T.amber,"Style":T.amber,"Clarity":T.teal};

  return (
    <div>
      <PH title="Grammar & Polish" sub="AI-powered writing analysis — fix errors, elevate your prose" />
      <div style={{display:"grid",gridTemplateColumns:"1fr 300px",gap:16}}>
        <div>
          <Card style={{marginBottom:14}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
              <Label>Your text</Label>
              <div style={{fontSize:11,color:T.muted}}>{wordCount} words · {sentenceCount} sentences · avg {avgWords} words/sentence</div>
            </div>
            <textarea style={{width:"100%",background:T.card2,border:"1px solid "+T.border,borderRadius:10,padding:"14px 16px",color:T.text,fontSize:14,fontFamily:T.font,outline:"none",resize:"vertical",minHeight:180,lineHeight:1.8,boxSizing:"border-box",marginBottom:14}} value={text} onChange={function(e){setText(e.target.value);}} placeholder="Paste your essay, paragraph, or any text here..." />
            <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
              <Btn onClick={runCheck} disabled={loading||!text.trim()}>{loading?"Analyzing...":"Run grammar check"}</Btn>
              <Btn variant="subtle" onClick={function(){rewriteTool("clarity");}} disabled={rewriteLoading}>{Icon.wand} Clarity</Btn>
              <Btn variant="subtle" onClick={function(){rewriteTool("academic");}} disabled={rewriteLoading}>{Icon.wand} Academic</Btn>
              <Btn variant="subtle" onClick={function(){rewriteTool("simplify");}} disabled={rewriteLoading}>{Icon.wand} Simplify</Btn>
            </div>
          </Card>
          {issues.length>0&&(
            <div>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
                <div style={{fontSize:14,fontWeight:700,color:T.white}}>{issues.length} issue{issues.length===1?"":"s"} found</div>
                <BtnSm onClick={acceptAll}>Accept all fixes</BtnSm>
              </div>
              {issues.map(function(issue,i){return(
                <Card key={i} style={{borderLeft:"3px solid "+(typeColor[issue.type]||T.amber),marginBottom:8,padding:16}}>
                  <div style={{display:"flex",gap:8,alignItems:"center",marginBottom:10}}>
                    <Badge color={typeColor[issue.type]||T.amber}>{issue.type}</Badge>
                    <span style={{fontSize:12,color:T.muted,flex:1}}>{issue.desc}</span>
                  </div>
                  <div style={{display:"flex",gap:10,alignItems:"center",fontSize:13.5,flexWrap:"wrap"}}>
                    <span style={{color:T.red,textDecoration:"line-through",opacity:0.7,background:T.red+"10",padding:"2px 8px",borderRadius:4}}>{issue.orig}</span>
                    <span style={{color:T.faint,fontSize:16}}>→</span>
                    <span style={{color:T.lime,fontWeight:600,background:T.lime+"10",padding:"2px 8px",borderRadius:4}}>{issue.fix}</span>
                    <div style={{marginLeft:"auto",display:"flex",gap:6}}>
                      <BtnSm onClick={function(){acceptFix(issue);}}>Accept</BtnSm>
                      <BtnSm variant="ghost" onClick={function(){setIssues(function(arr){return arr.filter(function(x){return x!==issue;});});}}>Dismiss</BtnSm>
                    </div>
                  </div>
                </Card>
              );})}
            </div>
          )}
          {rewriteResult&&(
            <Card style={{marginTop:14,borderLeft:"3px solid "+T.purple}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
                <div style={{display:"flex",gap:8,alignItems:"center"}}><Badge color={T.purple}>Rewrite</Badge><span style={{fontSize:12,color:T.muted,textTransform:"capitalize"}}>{activeMode}</span></div>
                <div style={{display:"flex",gap:6}}>
                  <BtnSm onClick={function(){setText(rewriteResult);setRewriteResult("");}}>Use this version</BtnSm>
                  <BtnSm variant="ghost" onClick={function(){navigator.clipboard&&navigator.clipboard.writeText(rewriteResult);}}>Copy</BtnSm>
                </div>
              </div>
              <div style={{fontSize:14,color:T.text,lineHeight:1.8,whiteSpace:"pre-wrap"}}>{rewriteResult}</div>
            </Card>
          )}
        </div>
        <div style={{display:"flex",flexDirection:"column",gap:12}}>
          <Card style={{background:grade?T.lime:T.card,border:grade?"none":"1px solid "+T.border}}>
            <Label style={grade?{color:T.bg}:{}}>Overall grade</Label>
            <div style={{fontSize:48,fontWeight:800,color:grade?T.bg:T.faint,letterSpacing:"-0.04em",lineHeight:1}}>{grade||"—"}</div>
            <div style={{fontSize:12,color:grade?T.bg:T.muted,opacity:grade?0.7:1,marginTop:6}}>{stats?stats.reading:"Paste text and run check"}</div>
            {stats&&stats.summary&&<div style={{fontSize:11.5,color:grade?T.bg:T.muted,opacity:0.8,marginTop:8,lineHeight:1.5,borderTop:"1px solid "+(grade?"rgba(0,0,0,0.1)":T.border),paddingTop:8}}>{stats.summary}</div>}
          </Card>
          {stats&&(
            <Card>
              <Label>Error breakdown</Label>
              {[["Grammar & spelling",stats.grammar,T.red],["Style issues",stats.style,T.amber],["Clarity flags",stats.clarity,T.teal]].map(function(arr,i){return(
                <div key={i} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"10px 0",borderBottom:i<2?"1px solid "+T.border:"none"}}>
                  <span style={{fontSize:12,color:T.muted}}>{arr[0]}</span>
                  <span style={{fontSize:14,fontWeight:700,color:arr[1]>0?arr[2]:T.faint}}>{arr[1]}</span>
                </div>
              );})}
            </Card>
          )}
          <Card>
            <Label>Rewrite tools</Label>
            {[["clarity","Rephrase for clarity"],["academic","Elevate to academic register"],["simplify","Simplify sentence structure"],["transitions","Add transitional phrases"],["vary","Vary sentence length"]].map(function(arr,i){return(
              <button key={i} onClick={function(){rewriteTool(arr[0]);}} disabled={rewriteLoading||!text.trim()} style={{display:"flex",alignItems:"center",gap:8,width:"100%",textAlign:"left",padding:"10px 12px",borderRadius:8,marginBottom:4,fontSize:12.5,cursor:"pointer",border:"1px solid "+(activeMode===arr[0]?T.purple+"55":T.border),background:activeMode===arr[0]?T.purple+"10":"transparent",color:activeMode===arr[0]?T.purple:T.muted,fontFamily:T.font,fontWeight:activeMode===arr[0]?600:400,transition:"all 0.15s"}}>{Icon.wand} {arr[1]}</button>
            );})}
          </Card>
          <Card>
            <Label>Quick stats</Label>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
              {[[wordCount,"Words"],[sentenceCount,"Sentences"],[avgWords,"Avg words/sent"],[text.length,"Characters"]].map(function(arr,i){return(
                <div key={i} style={{background:T.card2,borderRadius:8,padding:"10px 12px",border:"1px solid "+T.border}}>
                  <div style={{fontSize:20,fontWeight:700,color:T.white}}>{arr[0]}</div>
                  <div style={{fontSize:10,color:T.muted,marginTop:2}}>{arr[1]}</div>
                </div>
              );})}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

// ─── AI HUMANIZER ─────────────────────────────────────────────────────────────
function AiHumanizer() {
  const [done,setDone]=useState(false);
  const [voice,setVoice]=useState("Preserve my style");
  const inputText="The utilization of metaphorical language throughout Shakespeare's Macbeth serves as a fundamental mechanism by which the playwright effectuates the thematic exploration of moral degradation and its consequential psychological ramifications.";
  const outputText="Throughout Macbeth, Shakespeare uses metaphor to track moral collapse · each image of blood, vision, and darkness corresponds precisely to a stage in his protagonist's psychological unravelling.";
  const scores=[{label:"Detection probability",before:91,after:8,lower:true},{label:"Originality index",before:28,after:92,lower:false},{label:"Readability score",before:58,after:90,lower:false}];
  return (
    <div>
      <PH title="Rewrite" sub="Transform stilted prose into natural, confident academic writing" />
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14,marginBottom:14}}>
        <div>
          <Label>Source text</Label>
          <div style={{...({background:T.card,borderRadius:10,padding:16,border:`1px solid ${T.border}`,fontSize:13,lineHeight:1.75,color:T.muted,minHeight:160}),}}>{inputText}</div>
          <div style={{display:"flex",gap:6,flexWrap:"wrap",marginTop:10}}>
            {["Preserve my style","Academic register","Conversational","Formal"].map(s=>(
              <button key={s} onClick={()=>setVoice(s)} style={{padding:"5px 12px",borderRadius:5,fontSize:11,cursor:"pointer",border:`1px solid ${voice===s?T.lime+"44":T.border}`,background:voice===s?T.lime+"10":"transparent",color:voice===s?T.lime:T.muted,fontFamily:T.font,transition:"all 0.15s"}}>{s}</button>
            ))}
          </div>
          <div style={{marginTop:12}}>
            <Btn onClick={()=>setDone(true)} style={{width:"100%",justifyContent:"center",gap:8}}>{Icon.wand} Rewrite</Btn>
          </div>
        </div>
        <div>
          <Label>Rewritten output</Label>
          <div style={{background:T.card,borderRadius:10,padding:16,border:`1px solid ${done?T.lime+"33":T.border}`,fontSize:13,lineHeight:1.75,color:done?T.text:T.faint,minHeight:160,transition:"all 0.3s"}}>{done?outputText:"Output will appear here once you run the rewrite."}</div>
          {done&&(
            <div style={{display:"flex",gap:8,marginTop:10}}>
              <BtnSm>{Icon.copy} Copy</BtnSm>
              <BtnSm variant="subtle">Rerun</BtnSm>
              <BtnSm variant="subtle">Adjust further</BtnSm>
            </div>
          )}
        </div>
      </div>
      <Divider style={{marginBottom:16}} />
      <Label>Text analysis</Label>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:12}}>
        {scores.map((m,i)=>(
          <Card key={i}>
            <Label>{m.label}</Label>
            <div style={{fontSize:34,fontWeight:700,color:done?(m.lower?T.lime:T.lime):T.muted,letterSpacing:"-0.02em",lineHeight:1,marginBottom:10}}>{done?m.after:m.before}<span style={{fontSize:16,fontWeight:400}}>%</span></div>
            <Prog pct={done?m.after:m.before} color={m.lower?(done?T.lime:T.red):T.lime} />
            {done&&<div style={{fontSize:11,color:T.lime,marginTop:8}}>{m.lower?"Risk reduced":"Improved"}</div>}
          </Card>
        ))}
      </div>
    </div>
  );
}

// ─── FOCUS MUSIC ──────────────────────────────────────────────────────────────
function FocusMusic(){
  const plan=getPlan();
  const limit=(PLAN_LIMITS[plan]||PLAN_LIMITS.Free).music;
  const [creations,setCreations]=useState(()=>lsGet("musicCreations",[]));
  const [desc,setDesc]=useState("");
  const [len,setLen]=useState("30 min");
  const [genning,setGenning]=useState(false);
  const [upgOpen,setUpgOpen]=useState(false);
  const [playing,setPlaying]=useState(null);
  const [vol,setVol]=useState(70);
  const [,bump]=useState(0);
  const playlists=[
    {name:"Deep focus",sub:"Lo-fi instrumental · 2h 34m",bg:"#0d2235",flair:T.blue},
    {name:"Study jazz",sub:"Acoustic quartet · 1h 48m",bg:"#1a0d35",flair:T.purple},
    {name:"Classical flow",sub:"Strings and piano · 3h 10m",bg:"#0d2222",flair:T.teal},
    {name:"Brown noise",sub:"Ambient texture · continuous",bg:"#1a1a0d",flair:T.amber},
    {name:"Alpha waves",sub:"Binaural 10Hz · 90 min",bg:"#1a0d0d",flair:T.red},
    {name:"Forest ambience",sub:"Rain and birds · 4h",bg:"#0d1a12",flair:T.lime},
  ];
  const used=creations.length;
  const generate=()=>{
    if(!desc.trim()||genning)return;
    if(used>=limit){setUpgOpen(true);return;}
    setGenning(true);
    setTimeout(()=>{
      const name=desc.trim().length>36?desc.trim().slice(0,36)+"…":desc.trim();
      const next=creations.concat([{id:String(Date.now()),name,len}]);
      setCreations(next);lsSet("musicCreations",next);
      setGenning(false);setDesc("");setPlaying({kind:"own",i:next.length-1});
    },2400);
  };
  const removeCreation=(id)=>{const next=creations.filter(c=>c.id!==id);setCreations(next);lsSet("musicCreations",next);setPlaying(null);};
  const nowName=playing?(playing.kind==="own"?(creations[playing.i]?creations[playing.i].name:null):playlists[playing.i].name):null;
  const nowSub=playing?(playing.kind==="own"?"Your AI creation · "+(creations[playing.i]?creations[playing.i].len:""):playlists[playing.i].sub):null;
  const nowFlair=playing?(playing.kind==="own"?T.lime:playlists[playing.i].flair):T.lime;
  const nowBg=playing?(playing.kind==="own"?"#0d1a12":playlists[playing.i].bg):T.card;
  return (
    <div>
      <style>{"@keyframes eqb{0%,100%{transform:scaleY(0.3)}50%{transform:scaleY(1)}}"}</style>
      <UpgradeModal open={upgOpen} onClose={()=>setUpgOpen(false)} feature="AI music" detail={"The "+plan+" plan includes "+limit+" AI-generated tracks. Upgrade to keep composing custom focus sound, or delete an old creation to free a slot."} onUpgraded={()=>bump(x=>x+1)} />
      <PH title="Focus Music" sub="Curated environments, or describe your own and let AI compose it" />
      <div style={{display:"grid",gridTemplateColumns:"1fr 270px",gap:16}}>
        <div style={{display:"flex",flexDirection:"column",gap:14}}>
          <Card style={{background:"linear-gradient(120deg, "+T.card+" 0%, "+T.lime+"0d 100%)",border:"1px solid "+T.lime+"33",padding:20}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
              <Label>AI sound studio</Label>
              <span style={{fontFamily:T.mono,fontSize:10,color:used>=limit?T.red:T.muted,letterSpacing:"0.06em"}}>{used} of {limit} creations used · {plan}</span>
            </div>
            <Textarea placeholder="Describe your sound · e.g. mellow piano over soft rain, slow tempo, no drums" value={desc} onChange={ev=>setDesc(ev.target.value)} style={{minHeight:64,marginBottom:10}} />
            <div style={{display:"flex",gap:8,alignItems:"center"}}>
              <SelectChip options={["15 min","30 min","60 min","Loop"]} value={len} onChange={setLen} />
              <div style={{marginLeft:"auto"}}>
                {genning
                  ?<div style={{display:"flex",alignItems:"center",gap:10,padding:"8px 14px"}}>
                     <div style={{display:"flex",gap:3,alignItems:"center",height:18}}>
                       {[0,1,2,3,4].map(i=>(<div key={i} style={{width:3,height:16,borderRadius:2,background:T.lime,transformOrigin:"center",animation:"eqb 0.9s ease-in-out infinite",animationDelay:(i*0.13)+"s"}} />))}
                     </div>
                     <span style={{fontSize:12,color:T.lime,fontWeight:600}}>Composing your mix…</span>
                   </div>
                  :<Btn onClick={generate} style={{opacity:desc.trim()?1:0.45}}>{React.createElement("span",{style:{display:"flex",alignItems:"center",gap:6}},Icon.wand,"Generate track")}</Btn>
                }
              </div>
            </div>
          </Card>
          {creations.length>0&&(
            <div>
              <Label>Your creations</Label>
              <div style={{display:"flex",flexDirection:"column",gap:6}}>
                {creations.map((c,i)=>(
                  <Card key={c.id} style={{display:"flex",alignItems:"center",gap:12,padding:"10px 14px",border:"1px solid "+(playing&&playing.kind==="own"&&playing.i===i?T.lime+"55":T.border)}}>
                    <button onClick={()=>setPlaying(playing&&playing.kind==="own"&&playing.i===i?null:{kind:"own",i})} style={{width:30,height:30,borderRadius:"50%",border:"1px solid "+T.lime+"44",background:T.lime+"18",color:T.lime,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>{playing&&playing.kind==="own"&&playing.i===i?Icon.pause:Icon.play}</button>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{fontSize:12.5,fontWeight:600,color:T.white,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{c.name}</div>
                      <div style={{fontSize:10.5,color:T.muted}}>AI generated · {c.len}</div>
                    </div>
                    <button onClick={()=>removeCreation(c.id)} title="Delete to free a slot" style={{border:"none",background:"transparent",color:T.faint,cursor:"pointer",fontSize:14}}>×</button>
                  </Card>
                ))}
              </div>
            </div>
          )}
          <div>
            <Label>Curated</Label>
            <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:10}}>
              {playlists.map((p,i)=>(
                <Card key={i} onClick={()=>setPlaying(playing&&playing.kind==="set"&&playing.i===i?null:{kind:"set",i})} style={{padding:0,overflow:"hidden",cursor:"pointer",border:"1px solid "+(playing&&playing.kind==="set"&&playing.i===i?p.flair+"44":T.border),transition:"border 0.2s"}}>
                  <div style={{height:80,background:p.bg,borderBottom:"1px solid "+p.flair+"22",display:"flex",alignItems:"center",justifyContent:"center"}}>
                    <div style={{width:32,height:32,borderRadius:"50%",background:p.flair+"22",border:"1px solid "+p.flair+"44",display:"flex",alignItems:"center",justifyContent:"center",color:p.flair}}>{playing&&playing.kind==="set"&&playing.i===i?Icon.pause:Icon.play}</div>
                  </div>
                  <div style={{padding:"10px 12px"}}>
                    <div style={{fontSize:12,fontWeight:600,color:T.white,marginBottom:2}}>{p.name}</div>
                    <div style={{fontSize:11,color:T.muted}}>{p.sub}</div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </div>
        <div style={{display:"flex",flexDirection:"column",gap:12}}>
          {playing&&nowName
            ?<Card style={{background:nowBg,border:"1px solid "+nowFlair+"33"}}>
                <Label>Now playing</Label>
                <div style={{fontSize:15,fontWeight:700,color:"#fff",marginBottom:2,lineHeight:1.35}}>{nowName}</div>
                <div style={{fontSize:12,color:"rgba(255,255,255,0.55)",marginBottom:20}}>{nowSub}</div>
                <div style={{display:"flex",gap:10,justifyContent:"center",marginBottom:20}}>
                  <button style={{width:32,height:32,borderRadius:"50%",border:"1px solid rgba(255,255,255,0.1)",background:"transparent",color:"rgba(255,255,255,0.55)",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>{Icon.prev}</button>
                  <button onClick={()=>setPlaying(null)} style={{width:44,height:44,borderRadius:"50%",border:"none",background:nowFlair,color:T.bg,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>{Icon.pause}</button>
                  <button style={{width:32,height:32,borderRadius:"50%",border:"1px solid rgba(255,255,255,0.1)",background:"transparent",color:"rgba(255,255,255,0.55)",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>{Icon.skip}</button>
                </div>
                <div style={{display:"flex",gap:8,alignItems:"center"}}>
                  <div style={{color:"rgba(255,255,255,0.55)"}}>{Icon.volume}</div>
                  <input type="range" min="0" max="100" value={vol} onChange={ev=>setVol(+ev.target.value)} style={{flex:1}} />
                  <span style={{fontSize:11,color:"rgba(255,255,255,0.55)",minWidth:28,textAlign:"right"}}>{vol}%</span>
                </div>
              </Card>
            :<Card style={{textAlign:"center",padding:32}}>
                <div style={{color:T.faint,display:"flex",justifyContent:"center",marginBottom:10}}>{Icon.music}</div>
                <div style={{fontSize:13,color:T.muted}}>Pick a playlist or compose your own</div>
              </Card>
          }
          <Card>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
              <Label>AI creations</Label>
              <Badge color={plan==="Max"?T.purple:T.lime}>{plan}</Badge>
            </div>
            <div style={{fontSize:24,fontWeight:700,color:T.white,letterSpacing:"-0.02em"}}>{used}<span style={{fontSize:13,color:T.muted,fontWeight:400}}> / {limit} used</span></div>
            <Prog pct={Math.min(100,Math.round(used/limit*100))} height={4} />
            {plan!=="Max"&&<div onClick={()=>setUpgOpen(true)} style={{fontSize:11.5,color:T.lime,marginTop:10,cursor:"pointer",fontWeight:600}}>Upgrade for more creations →</div>}
          </Card>
          <Card>
            <Label>Ambient layer</Label>
            {[["Rain",38],["Cafe background",20],["White fan",0]].map(([nm,v],i)=>(
              <div key={i} style={{display:"flex",alignItems:"center",gap:10,marginBottom:12}}>
                <span style={{fontSize:11,color:T.muted,width:110,flexShrink:0}}>{nm}</span>
                <input type="range" min="0" max="100" defaultValue={v} style={{flex:1}} />
              </div>
            ))}
          </Card>
        </div>
      </div>
    </div>
  );
}


// ─── SETTINGS ─────────────────────────────────────────────────────────────────
function SettingsTab({theme="dark", setTheme=()=>{}, accent="Lime", setAccent=()=>{}, density="Comfortable", setDensity=()=>{}, seriousMode=false, setSeriousMode=()=>{}}) {
  const [active,setActive]=useState("General");
  const [toggles,setToggles]=useState(()=>({...{push:true,sound:true,streak:true,deadline:true,sr:true,auto:true,analytics:false,sync:true,emails:false,profile:true,share:true,twofa:false,collect:false,motion:false,hand:true,wrapped:true,squad:true,autoSession:false,block:false,notifMaster:true},...lsGet("settings",{})}));
  const tog=k=>setToggles(t=>{const n={...t,[k]:!t[k]};lsSet("settings",n);return n;});
  const [profile,setProfileState]=useState(()=>getProfile());
  const updProfile=(patch)=>{const n={...profile,...patch};setProfileState(n);saveProfile(n);};
  const allUsers=[{n:"Devon Karu",h:"@devonk",s:"UCLA"},{n:"Priya Shah",h:"@priyas",s:"Berkeley"},{n:"Jordan Tran",h:"@jtran",s:"UCLA"},{n:"Amara Okafor",h:"@amarao",s:"NYU"},{n:"Liam Chen",h:"@liamc",s:"Stanford"},{n:"Sofia Diaz",h:"@sofiad",s:"UCLA"}];
  const [friendQ,setFriendQ]=useState("");
  const [friends,setFriends]=useState(()=>lsGet("friends",[]));
  const toggleFriend=(h)=>{const n=friends.includes(h)?friends.filter(x=>x!==h):[...friends,h];setFriends(n);lsSet("friends",n);};
  const friendResults=friendQ.trim()?allUsers.filter(u=>(u.n+" "+u.h+" "+u.s).toLowerCase().includes(friendQ.toLowerCase())):allUsers.slice(0,3);
  const sections=[
    {id:"General",icon:Icon.settings},
    {id:"Appearance",icon:Icon.wand},
    {id:"Notifications",icon:Icon.send},
    {id:"Privacy",icon:Icon.shield},
    {id:"Study preferences",icon:Icon.brain},
    {id:"Subscription",icon:Icon.zap},
    {id:"Danger zone",icon:Icon.xmark},
  ];
  const Toggle = ({k}) => (
    <div onClick={()=>tog(k)} style={{width:38,height:20,borderRadius:10,background:toggles[k]?T.lime:T.card2,border:`1px solid ${toggles[k]?T.lime:T.border}`,position:"relative",cursor:"pointer",transition:"all 0.2s",flexShrink:0}}>
      <div style={{width:14,height:14,borderRadius:"50%",background:toggles[k]?T.bg:"#fff",position:"absolute",top:2,left:toggles[k]?21:2,transition:"left 0.2s"}} />
    </div>
  );
  const Row = ({label,sub,k,right}) => (
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"13px 0",borderBottom:`1px solid ${T.border}`}}>
      <div style={{flex:1,marginRight:14}}>
        <div style={{fontSize:13,color:T.text,fontWeight:500}}>{label}</div>
        {sub && <div style={{fontSize:11.5,color:T.muted,marginTop:2,lineHeight:1.45}}>{sub}</div>}
      </div>
      {right || <Toggle k={k} />}
    </div>
  );
  // Theme preview card
  const ThemeCard = ({mode,label,sub}) => {
    const sel=theme===mode;
    const isLight=mode==="light";
    return (
      <div onClick={()=>setTheme(mode)} style={{flex:1,cursor:"pointer",borderRadius:12,padding:16,border:`2px solid ${sel?T.lime:T.border}`,background:sel?T.lime+"08":T.card2,transition:"all 0.15s"}}>
        <div style={{height:90,borderRadius:8,overflow:"hidden",background:isLight?"#F5F6FF":"#0B0E20",border:`1px solid ${isLight?"rgba(11,14,42,0.08)":"rgba(255,255,255,0.06)"}`,marginBottom:12,display:"flex"}}>
          <div style={{width:24,background:"#1B2457",display:"flex",flexDirection:"column",alignItems:"center",padding:"6px 0",gap:4}}>
            <div style={{width:10,height:10,background:"#4F7FE8",borderRadius:2}} />
            <div style={{width:14,height:3,background:"rgba(255,255,255,0.2)",borderRadius:1,marginTop:4}} />
            <div style={{width:14,height:3,background:"rgba(255,255,255,0.12)",borderRadius:1}} />
            <div style={{width:14,height:3,background:"rgba(255,255,255,0.12)",borderRadius:1}} />
          </div>
          <div style={{flex:1,padding:8,display:"flex",flexDirection:"column",gap:5}}>
            <div style={{display:"flex",gap:4}}>
              <div style={{flex:1,height:18,background:isLight?"#1B2457":"#181D38",borderRadius:3}} />
              <div style={{width:24,height:18,background:"#4F7FE8",borderRadius:3}} />
              <div style={{width:24,height:18,background:isLight?"#fff":"#181D38",borderRadius:3,border:isLight?"1px solid rgba(11,14,42,0.08)":"none"}} />
            </div>
            <div style={{display:"flex",gap:4}}>
              <div style={{flex:1,height:14,background:isLight?"#fff":"#181D38",borderRadius:3,border:isLight?"1px solid rgba(11,14,42,0.08)":"none"}} />
              <div style={{flex:1,height:14,background:isLight?"#fff":"#181D38",borderRadius:3,border:isLight?"1px solid rgba(11,14,42,0.08)":"none"}} />
            </div>
          </div>
        </div>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <div>
            <div style={{fontSize:14,fontWeight:600,color:T.white,letterSpacing:"-0.01em"}}>{label}</div>
            <div style={{fontSize:11,color:T.muted,marginTop:2}}>{sub}</div>
          </div>
          <div style={{width:20,height:20,borderRadius:"50%",border:`2px solid ${sel?T.lime:T.border}`,background:sel?T.lime:"transparent",display:"flex",alignItems:"center",justifyContent:"center"}}>
            {sel&&<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke={T.bg} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>}
          </div>
        </div>
      </div>
    );
  };
  // Chip group helper
  const Chip = ({active,onClick,children}) => (
    <button type="button" onClick={onClick} style={{padding:"7px 14px",borderRadius:7,fontSize:12,cursor:"pointer",border:`1px solid ${active?T.lime+"66":T.border}`,background:active?T.lime+"14":"transparent",color:active?T.lime:T.muted,fontFamily:T.font,fontWeight:active?600:400,transition:"all 0.15s"}}>{children}</button>
  );
  const [pom,setPom]=useState(()=>lsGet("pref-pom","25 min"));
  const [verb,setVerb]=useState(()=>lsGet("pref-verb","Balanced"));
  const [brk,setBrk]=useState(()=>lsGet("pref-brk","15 min"));
  const accents=[{n:"Indigo",c:"#4F7FE8"},{n:"Forest",c:"#3E9576"},{n:"Sky",c:"#4F95D6"},{n:"Lilac",c:"#9474C9"},{n:"Peach",c:"#D07C4C"}];

  return (
    <div>
      <PH title="Settings" sub="Manage your account and preferences" />
      <div style={{display:"grid",gridTemplateColumns:"200px 1fr",gap:16}}>
        <div>
          {sections.map(s=>(
            <div key={s.id} onClick={()=>setActive(s.id)} style={{display:"flex",alignItems:"center",gap:10,padding:"9px 11px",borderRadius:7,marginBottom:3,fontSize:12.5,cursor:"pointer",background:active===s.id?T.lime+"10":"transparent",color:active===s.id?T.lime:T.muted,fontWeight:active===s.id?600:400,border:`1px solid ${active===s.id?T.lime+"22":"transparent"}`,transition:"all 0.15s"}}>
              <span style={{color:active===s.id?T.lime:T.faint,width:14,height:14,display:"flex"}}>{s.icon}</span>
              {s.id}
            </div>
          ))}
        </div>
        <div>

          {active==="General" && (<>
            <Card style={{marginBottom:12}}>
              <div style={{fontSize:14,fontWeight:700,color:T.white,marginBottom:4}}>Profile basics</div>
              <div style={{fontSize:12,color:T.muted,marginBottom:16}}>How you appear across Studlin.</div>
              <Field label="Display name"><Input value={profile.name} onChange={e=>updProfile({name:e.target.value})} /></Field>
              <Field label="Email"><Input value={profile.email} onChange={e=>updProfile({email:e.target.value})} type="email" /></Field>
              <Field label="School or affiliation"><Input value={profile.school} onChange={e=>updProfile({school:e.target.value})} /></Field>
              <Field label="Time zone">
                <select value={profile.tz} onChange={e=>updProfile({tz:e.target.value})} style={{width:"100%",background:T.card2,border:`1px solid ${T.border}`,borderRadius:8,padding:"10px 12px",color:T.text,fontSize:13.5,fontFamily:T.font,outline:"none"}}>
                  <option>America/Los_Angeles</option><option>America/New_York</option><option>Europe/London</option><option>Asia/Singapore</option>
                </select>
              </Field>
            </Card>
            <Card style={{marginBottom:12}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                <div>
                  <div style={{fontSize:14,fontWeight:700,color:T.white}}>Sign out</div>
                  <div style={{fontSize:12,color:T.muted,marginTop:2}}>Signed in as {firebase.auth().currentUser?.email}</div>
                </div>
                <button onClick={()=>firebase.auth().signOut().then(()=>{window.location.href="/";})} style={{padding:"8px 18px",borderRadius:8,border:"1px solid rgba(248,113,113,0.3)",background:"rgba(248,113,113,0.08)",color:"#f87171",fontSize:12.5,fontWeight:600,cursor:"pointer",fontFamily:T.font}}>Sign out</button>
              </div>
            </Card>
            <Card>
              <div style={{fontSize:14,fontWeight:700,color:T.white,marginBottom:4}}>Connected accounts</div>
              <div style={{fontSize:12,color:T.muted,marginBottom:16}}>Sync your calendar and cloud notes.</div>
              {[["Google Calendar","Synced",true],["Apple Calendar","Connect",false],["Notion workspace","Synced",true],["Dropbox","Connect",false]].map(([n,st,on],i)=>(
                <div key={i} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"12px 0",borderBottom:i<3?`1px solid ${T.border}`:"none"}}>
                  <div style={{fontSize:13,color:T.text,fontWeight:500}}>{n}</div>
                  <BtnSm variant={on?"subtle":"lime"}>{st}</BtnSm>
                </div>
              ))}
            </Card>
            <Card style={{marginTop:12}}>
              <div style={{fontSize:14,fontWeight:700,color:T.white,marginBottom:4}}>Friends</div>
              <div style={{fontSize:12,color:T.muted,marginBottom:14}}>Find classmates and add them to study together.</div>
              <div style={{display:"flex",alignItems:"center",gap:10,padding:"9px 13px",background:T.card2,border:`1px solid ${T.border}`,borderRadius:9,marginBottom:12}}>
                <span style={{color:T.muted,display:"flex"}}><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg></span>
                <input value={friendQ} onChange={e=>setFriendQ(e.target.value)} placeholder="Search by name, handle, or school" style={{flex:1,background:"none",border:"none",outline:"none",color:T.text,fontSize:13,fontFamily:T.font}} />
              </div>
              {friendResults.length===0
                ? <div style={{fontSize:12.5,color:T.muted,padding:"10px 0"}}>No students match “{friendQ}”.</div>
                : friendResults.map((u,i)=>{
                  const added=friends.includes(u.h);
                  return (
                  <div key={u.h} style={{display:"flex",alignItems:"center",gap:11,padding:"10px 0",borderBottom:i<friendResults.length-1?`1px solid ${T.border}`:"none"}}>
                    <Av initials={u.n.split(" ").map(x=>x[0]).join("")} color={T.lime} size={32} />
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{fontSize:13,color:T.text,fontWeight:600}}>{u.n}</div>
                      <div style={{fontSize:11,color:T.muted}}>{u.h} · {u.s}</div>
                    </div>
                    <BtnSm variant={added?"subtle":"lime"} onClick={()=>toggleFriend(u.h)}>{added?"Added":"Add friend"}</BtnSm>
                  </div>
                );})}
              {friends.length>0&&<div style={{fontSize:11.5,color:T.muted,marginTop:12}}>{friends.length} friend{friends.length===1?"":"s"} added.</div>}
            </Card>
          </>)}

          {active==="Appearance" && (<>
            <Card style={{marginBottom:12}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:18,gap:12}}>
                <div>
                  <div style={{fontSize:14,fontWeight:700,color:T.white,marginBottom:3}}>Theme</div>
                  <div style={{fontSize:12,color:T.muted}}>Switch between light and dark. Your choice persists across sessions.</div>
                </div>
                <div style={{display:"flex",alignItems:"center",gap:10}}>
                  <span style={{fontSize:12,color:T.muted}}>Light</span>
                  <div onClick={()=>setTheme(theme==="dark"?"light":"dark")} style={{width:46,height:24,borderRadius:12,background:theme==="dark"?T.lime:T.card2,border:`1.5px solid ${theme==="dark"?T.lime:T.border}`,position:"relative",cursor:"pointer",transition:"all 0.2s",flexShrink:0}}>
                    <div style={{width:18,height:18,borderRadius:"50%",background:theme==="dark"?T.ink:"#ffffff",border:`1px solid ${theme==="dark"?"transparent":T.border}`,position:"absolute",top:2,left:theme==="dark"?24:2,transition:"left 0.2s",boxShadow:"0 1px 4px rgba(0,0,0,0.2)"}} />
                  </div>
                  <span style={{fontSize:12,color:T.muted}}>Dark</span>
                </div>
              </div>
              <div style={{display:"flex",gap:10}}>
                <ThemeCard mode="light" label="Light" sub="Cream paper · sage accents" />
                <ThemeCard mode="dark"  label="Dark"  sub="Forest matte · refined" />
              </div>
            </Card>
            <Card style={{marginBottom:12}}>
              <div style={{fontSize:14,fontWeight:700,color:T.white,marginBottom:16}}>Accent color</div>
              <div style={{display:"flex",gap:10,flexWrap:"wrap"}}>
                {accents.map(a=>(
                  <button key={a.n} onClick={()=>setAccent(a.n)} style={{display:"flex",alignItems:"center",gap:8,padding:"8px 14px",borderRadius:8,border:`1.5px solid ${accent===a.n?a.c:T.border}`,background:accent===a.n?a.c+"15":T.card2,color:T.text,cursor:"pointer",fontFamily:T.font,fontSize:12.5,fontWeight:500}}>
                    <span style={{width:14,height:14,borderRadius:"50%",background:a.c,border:`1px solid ${T.border}`}} />
                    {a.n}
                  </button>
                ))}
              </div>
            </Card>
            <Card>
              <div style={{fontSize:14,fontWeight:700,color:T.white,marginBottom:16}}>Density</div>
              <div style={{display:"flex",gap:6,marginBottom:18}}>
                {["Compact","Comfortable","Spacious"].map(d=><Chip key={d} active={density===d} onClick={()=>setDensity(d)}>{d}</Chip>)}
              </div>
              <Row label="Reduce motion" sub="Disable parallax and bouncy animations." k="motion" />
              <Row label="Show handwritten display fonts" sub="Caveat for big numbers, Instrument Serif for accents." k="hand" />
            </Card>
          </>)}

          {active==="Notifications" && (<>
            <Card style={{marginBottom:12}}>
              <div style={{fontSize:14,fontWeight:700,color:T.white,marginBottom:4}}>Task &amp; App Notifications</div>
              <div style={{fontSize:12,color:T.muted,marginBottom:10}}>Master switch for all Studlin alerts. Smart reminders fire before study blocks begin.</div>
              <Row label="Task & App Notifications" sub="Smart alerts before study blocks, deadline reminders, and streak nudges." k="notifMaster" />
            </Card>
            <Card style={{marginBottom:12}}>
              <div style={{fontSize:14,fontWeight:700,color:T.white,marginBottom:4}}>Reminders</div>
              <div style={{fontSize:12,color:T.muted,marginBottom:10}}>Choose what wakes you up.</div>
              <Row label="Push notifications" sub="Deadline reminders, streak alerts, squad activity." k="push" />
              <Row label="Deadline alerts" sub="Get notified 24 hours, 1 hour, and 10 minutes before due time." k="deadline" />
              <Row label="Streak reminders" sub="A nudge if you haven't studied by 8pm." k="streak" />
              <Row label="Focus sound alerts" sub="Audio cue when Pomodoro sessions complete." k="sound" />
            </Card>
            <Card>
              <div style={{fontSize:14,fontWeight:700,color:T.white,marginBottom:4}}>Email</div>
              <div style={{fontSize:12,color:T.muted,marginBottom:10}}>Studlin will only email you when it matters.</div>
              <Row label="Weekly Wrapped digest" sub="Your stats, every Sunday evening." k="wrapped" right={<Toggle k="emails" />} />
              <Row label="Study milestones" sub="When you hit a streak milestone or level up." k="squad" />
              <Row label="Product updates" sub="Occasional notes about new features and tips." k="emails" />
            </Card>
          </>)}

          {active==="Privacy" && (<>
            <Card style={{marginBottom:12}}>
              <div style={{fontSize:14,fontWeight:700,color:T.white,marginBottom:4}}>Private Account · Serious Mode</div>
              <div style={{fontSize:12,color:T.muted,marginBottom:10}}>Strip gamification and go heads-down. XP, levels, and Weekly Wrapped are hidden. Chat, calendar sharing, and notes stay fully accessible.</div>
              <Row label="Private Account / Serious Mode" sub="Hides XP, tiers, leaderboard, and Weekly Wrapped. Dashboard shows clean calendar + task grid only." k="_" right={
                <div onClick={()=>{const next=!seriousMode;setSeriousMode(next);const s=lsGet("settings",{});lsSet("settings",{...s,seriousMode:next});}} style={{width:38,height:20,borderRadius:10,background:seriousMode?T.purple:T.card2,border:`1px solid ${seriousMode?T.purple:T.border}`,position:"relative",cursor:"pointer",transition:"all 0.2s",flexShrink:0}}>
                  <div style={{width:14,height:14,borderRadius:"50%",background:seriousMode?T.bg:"#fff",position:"absolute",top:2,left:seriousMode?21:2,transition:"left 0.2s"}} />
                </div>
              } />
            </Card>
            <Card style={{marginBottom:12}}>
              <div style={{fontSize:14,fontWeight:700,color:T.white,marginBottom:4}}>Visibility</div>
              <div style={{fontSize:12,color:T.muted,marginBottom:10}}>Control what others can see.</div>
              <Row label="Public profile" sub="Let others find you by name or handle." k="profile" />
              <Row label="Share Weekly Wrapped" sub="Allow sharing your stats card on social." k="share" />
              <Row label="Show online status" sub="Display a green dot when you're in a focus session." k="sync" />
            </Card>
            <Card style={{marginBottom:12}}>
              <div style={{fontSize:14,fontWeight:700,color:T.white,marginBottom:4}}>Data &amp; AI</div>
              <div style={{fontSize:12,color:T.muted,marginBottom:10}}>You own your notes, essays, and recordings.</div>
              <Row label="Use my work to train Studlin AI" sub="Off by default. We will never share your raw content." k="collect" />
              <Row label="Anonymous usage analytics" sub="Helps us fix bugs and prioritise features." k="analytics" />
              <div style={{display:"flex",gap:8,marginTop:14,flexWrap:"wrap"}}>
                <Btn variant="subtle">{React.createElement("span",{style:{display:"flex",alignItems:"center",gap:6}},Icon.copy,"Export all data")}</Btn>
                <Btn variant="subtle">Download chat history</Btn>
                <Btn variant="subtle">Privacy policy</Btn>
              </div>
            </Card>
            <Card>
              <div style={{fontSize:14,fontWeight:700,color:T.white,marginBottom:10}}>Account security</div>
              <Row label="Two-factor authentication" sub="Add a one-time code on every sign in." k="twofa" />
              <Row label="Active sessions" sub="3 devices currently signed in." k="sessions" right={<BtnSm variant="subtle">View sessions</BtnSm>} />
              <Row label="Change password" sub="Last changed 3 months ago." k="pw" right={<BtnSm variant="subtle">Change</BtnSm>} />
            </Card>
          </>)}

          {active==="Study preferences" && (<>
            <Card style={{marginBottom:12}}>
              <div style={{fontSize:14,fontWeight:700,color:T.white,marginBottom:16}}>Focus &amp; Pomodoro</div>
              <Field label="Session length"><div style={{display:"flex",gap:6}}>{["15 min","20 min","25 min","30 min","45 min"].map(t=><Chip key={t} active={pom===t} onClick={()=>{setPom(t);lsSet("pref-pom",t);}}>{t}</Chip>)}</div></Field>
              <Field label="Break after 4 sessions"><div style={{display:"flex",gap:6}}>{["10 min","15 min","20 min","30 min"].map(t=><Chip key={t} active={brk===t} onClick={()=>{setBrk(t);lsSet("pref-brk",t);}}>{t}</Chip>)}</div></Field>
              <Row label="Auto-start next session" sub="Skip the play button between focus blocks." k="autoSession" />
              <Row label="Block distracting sites" sub="Studlin's lightweight blocker pauses social media during focus." k="block" />
            </Card>
            <Card style={{marginBottom:12}}>
              <div style={{fontSize:14,fontWeight:700,color:T.white,marginBottom:16}}>AI tutor</div>
              <Field label="Response verbosity"><div style={{display:"flex",gap:6}}>{["Concise","Balanced","Comprehensive"].map(t=><Chip key={t} active={verb===t} onClick={()=>{setVerb(t);lsSet("pref-verb",t);}}>{t}</Chip>)}</div></Field>
              <Field label="Tutor style">
                <SelectChip options={["Socratic","Direct","Encouraging","Strict"]} value={"Socratic"} onChange={()=>{}} />
              </Field>
              <Row label="Spaced repetition engine" sub="Intelligent scheduling based on recall performance." k="sr" />
              <Row label="Auto-save drafts" sub="Save essay and note changes every 30 seconds." k="auto" />
            </Card>
            <Card>
              <div style={{fontSize:14,fontWeight:700,color:T.white,marginBottom:16}}>Daily targets</div>
              <Field label="Daily focus target (minutes)"><Input type="number" defaultValue="180" /></Field>
              <Field label="Daily flashcard target"><Input type="number" defaultValue="30" /></Field>
            </Card>
          </>)}

          {active==="Subscription" && (<>
            <Card style={{marginBottom:12,background:T.lime,border:"none"}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
                <div>
                  <div style={{fontSize:11,fontWeight:700,letterSpacing:"0.1em",color:T.bg,opacity:0.6}}>CURRENT PLAN</div>
                  <div style={{fontSize:26,fontWeight:700,color:T.bg,letterSpacing:"-0.02em",marginTop:4}}>Pro</div>
                  <div style={{fontSize:13,color:T.bg,opacity:0.75,marginTop:4}}>$9.99/mo · renews Jul 12, 2026</div>
                </div>
                <div style={{textAlign:"right"}}>
                  <div style={{fontSize:11,fontWeight:700,letterSpacing:"0.1em",color:T.bg,opacity:0.6}}>AI CREDITS</div>
                  <div style={{fontSize:26,fontWeight:700,color:T.bg,letterSpacing:"-0.02em",marginTop:4}}>{getCredits()} / {getCreditLimit()}</div>
                  <div style={{fontSize:13,color:T.bg,opacity:0.75,marginTop:4}}>Resets in 12 days</div>
                </div>
              </div>
              <div style={{display:"flex",gap:8,marginTop:18,flexWrap:"wrap"}}>
                <a href="checkout.html?credits=500" style={{background:T.bg,color:T.lime,padding:"8px 16px",borderRadius:7,fontSize:12.5,fontWeight:600,textDecoration:"none"}}>Buy credit packs</a>
                <a href="checkout.html?plan=max&billing=monthly" style={{background:"transparent",border:`1px solid ${T.bg}55`,color:T.bg,padding:"8px 16px",borderRadius:7,fontSize:12.5,fontWeight:600,textDecoration:"none"}}>Upgrade to Max</a>
                <button onClick={()=>{if(confirm("Are you sure you want to cancel your Pro plan? You'll keep access until Jul 12, 2026.")){alert("Your plan has been cancelled. You'll retain access until your current billing period ends.");}}} style={{background:"transparent",border:`1px solid ${T.bg}44`,color:T.bg,padding:"8px 16px",borderRadius:7,fontSize:12.5,fontWeight:600,cursor:"pointer",fontFamily:T.font,opacity:0.7}}>Cancel plan</button>
              </div>
            </Card>
            <Card style={{marginBottom:12}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
                <div style={{fontSize:14,fontWeight:700,color:T.white}}>Payment methods</div>
                <BtnSm variant="subtle" onClick={()=>alert("To add a new card, make any purchase — your card will be saved automatically.")}>+ Add card</BtnSm>
              </div>
              <div style={{display:"flex",alignItems:"center",gap:12,padding:14,background:T.card2,borderRadius:10,border:`1px solid ${T.lime}33`,marginBottom:8}}>
                <div style={{width:40,height:28,borderRadius:4,background:"linear-gradient(135deg,#1A1F36,#3F4865)",display:"grid",placeItems:"center",color:"#fff",fontSize:9,fontWeight:700,letterSpacing:"0.06em",fontFamily:T.mono}}>VISA</div>
                <div style={{fontFamily:T.mono,fontSize:13,color:T.text}}>•••• 4242</div>
                <Badge color={T.lime}>Default</Badge>
                <div style={{fontSize:11.5,color:T.muted,marginLeft:"auto"}}>Exp 08/27</div>
                <BtnSm variant="subtle">Update</BtnSm>
              </div>
              <div style={{fontSize:11.5,color:T.muted,lineHeight:1.5}}>Your default card is used for subscription renewals and credit purchases. Add more cards by making a purchase — we'll save it securely via Stripe.</div>
            </Card>
            <Card>
              <div style={{fontSize:14,fontWeight:700,color:T.white,marginBottom:10}}>Billing history</div>
              {[["Jun 1, 2026","Pro plan · monthly","$9.99","Paid"],["May 1, 2026","Pro plan · monthly","$9.99","Paid"],["Apr 28, 2026","Credit pack · 300","$8.99","Paid"],["Apr 1, 2026","Pro plan · monthly","$9.99","Paid"]].map(([d,t,a,s],i)=>(
                <div key={i} style={{display:"grid",gridTemplateColumns:"110px 1fr 80px 70px",gap:14,padding:"11px 0",borderBottom:i<3?`1px solid ${T.border}`:"none",fontSize:12.5,alignItems:"center"}}>
                  <span style={{color:T.muted,fontFamily:T.mono,fontSize:11}}>{d}</span>
                  <span style={{color:T.text}}>{t}</span>
                  <span style={{color:T.text,fontFamily:T.mono,fontWeight:600,textAlign:"right"}}>{a}</span>
                  <Badge color={T.teal}>{s}</Badge>
                </div>
              ))}
            </Card>
          </>)}

          {active==="Danger zone" && (<>
            <Card style={{marginBottom:12,border:"1px solid rgba(214,117,96,0.3)"}}>
              <div style={{fontSize:13,fontWeight:700,color:T.red,marginBottom:4}}>Reset progress</div>
              <div style={{fontSize:12,color:T.muted,marginBottom:14}}>Wipe your streak, XP, level, and Wrapped history. Notes and essays are kept.</div>
              <Btn variant="danger">Reset all progress</Btn>
            </Card>
            <Card style={{marginBottom:12,border:"1px solid rgba(214,117,96,0.3)"}}>
              <div style={{fontSize:13,fontWeight:700,color:T.red,marginBottom:4}}>Pause subscription</div>
              <div style={{fontSize:12,color:T.muted,marginBottom:14}}>Pause billing for up to 90 days. We'll keep your data intact and email you when it's about to resume.</div>
              <Btn variant="danger">Pause for 30 days</Btn>
            </Card>
            <Card style={{border:"1px solid rgba(214,117,96,0.3)"}}>
              <div style={{fontSize:13,fontWeight:700,color:T.red,marginBottom:4}}>Delete account</div>
              <div style={{fontSize:12,color:T.muted,marginBottom:14}}>Permanently remove your account, notes, essays, flashcards, and squad memberships. This cannot be undone.</div>
              <Btn variant="danger">Delete my account</Btn>
            </Card>
          </>)}
        </div>
      </div>
    </div>
  );
}


// ─── PROFILE ──────────────────────────────────────────────────────────────────
function Profile() {
  const [prof,setProfState]=useState(()=>getProfile());
  const [picUrl,setPicUrl]=useState(()=>getUserPicUrl());
  const [status,setStatus]=useState(prof.status||"");
  const [affiliation,setAffiliation]=useState(prof.affiliation||prof.school||"");
  const [picSaved,setPicSaved]=useState(false);
  const fileInputRef=useRef(null);
  const camInputRef=useRef(null);
  const prefs=getSchedulePreferences();
  const [workStart,setWorkStart]=useState(prefs.workStartTime||"09:00");
  const [bedtime,setBedtime]=useState(prefs.bedtime||"23:00");
  const [difficulty,setDifficulty]=useState(prefs.difficultyPreference||"balanced");
  const [prefSaved,setPrefSaved]=useState(false);
  const lvl=levelInfo();
  const streak=Math.max(1,getStreak());
  const ps=profileStats();
  const initials=((prof.name||"").split(" ").map(x=>x[0]).join("").slice(0,2).toUpperCase())||"S";

  const handlePicFile=(e)=>{
    const file=e.target.files&&e.target.files[0];
    if(!file)return;
    const reader=new FileReader();
    reader.onload=(ev)=>{
      const url=ev.target.result;
      lsSet("profilePic",url);
      setPicUrl(url);
      setPicSaved(true);
      setTimeout(()=>setPicSaved(false),2200);
    };
    reader.readAsDataURL(file);
  };

  const saveOnboarding=()=>{
    const updated={...getProfile(),status,affiliation,school:affiliation};
    lsSet("profile",updated);
    setProfState(updated);
    const updatedPrefs={...getSchedulePreferences(),workStartTime:workStart,bedtime,difficultyPreference:difficulty};
    setSchedulePreferences(updatedPrefs);
    setPrefSaved(true);
    setTimeout(()=>setPrefSaved(false),2200);
  };

  const affiliationLabel = status==="highschool"?"School name":status==="college"?"University":status==="working"?"Company":"School / affiliation";
  const affiliationPlaceholder = status==="highschool"?"e.g. Lincoln High School":status==="college"?"e.g. UCLA, NYU...":status==="working"?"e.g. Google, startup...":"Your school or company";

  const badges=[
    {icon:Icon.flame,name:streak+"-Day streak",color:T.amber},
    {icon:Icon.trophy,name:"Goal crusher",color:T.lime},
    {icon:Icon.layers,name:"Card master",color:T.teal},
    {icon:Icon.zap,name:"Speed reader",color:T.blue},
    {icon:Icon.brain,name:"Bio distinction",color:T.purple},
    {icon:Icon.pen,name:"Essay merit",color:T.red},
    {icon:Icon.star,name:"Top scorer",color:T.amber},
    {icon:Icon.award,name:"Peer mentor",color:T.lime},
    {icon:Icon.shield,name:"Streak guard",color:T.teal},
    {icon:Icon.check,name:"Consistent",color:T.blue},
  ];
  const activityData=[40,70,55,90,100,30,20];

  const StatusChip=({value,label,active})=>(
    <button type="button" onClick={()=>setStatus(value)} style={{padding:"8px 16px",borderRadius:8,fontSize:12,fontWeight:active?600:400,cursor:"pointer",border:`1.5px solid ${active?T.lime+"66":T.border}`,background:active?T.lime+"14":"transparent",color:active?T.lime:T.muted,fontFamily:T.font,transition:"all 0.15s"}}>{label}</button>
  );

  return (
    <div>
      {/* ── Header card */}
      <Card style={{display:"flex",alignItems:"center",gap:24,marginBottom:16,padding:28}}>
        {/* Profile picture module */}
        <div style={{position:"relative",flexShrink:0}}>
          {picUrl
            ? <img src={picUrl} style={{width:80,height:80,borderRadius:"50%",objectFit:"cover",border:`2px solid ${T.lime}44`}} alt="Profile" />
            : <Av initials={initials} color={T.lime} size={80} picUrl="" />
          }
          <div style={{position:"absolute",bottom:0,right:0,display:"flex",gap:3}}>
            <button title="Upload photo" onClick={()=>fileInputRef.current&&fileInputRef.current.click()} style={{width:24,height:24,borderRadius:"50%",background:T.lime,border:"none",cursor:"pointer",display:"grid",placeItems:"center",boxShadow:"0 2px 8px rgba(0,0,0,0.2)"}}>
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke={T.ink} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
            </button>
            <button title="Take photo" onClick={()=>camInputRef.current&&camInputRef.current.click()} style={{width:24,height:24,borderRadius:"50%",background:T.card2,border:`1px solid ${T.border}`,cursor:"pointer",display:"grid",placeItems:"center",boxShadow:"0 2px 8px rgba(0,0,0,0.15)"}}>
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke={T.muted} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>
            </button>
          </div>
          <input ref={fileInputRef} type="file" accept="image/*" style={{display:"none"}} onChange={handlePicFile} />
          <input ref={camInputRef} type="file" accept="image/*" capture="user" style={{display:"none"}} onChange={handlePicFile} />
        </div>
        <div style={{flex:1}}>
          <div style={{fontSize:22,fontWeight:700,color:T.white,letterSpacing:"-0.02em",marginBottom:3}}>{prof.name}</div>
          <div style={{fontSize:13,color:T.muted,marginBottom:12}}>{affiliation||prof.school||"No affiliation set"}</div>
          <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
            <Badge color={T.lime}>Pro</Badge>
            <Badge color={T.amber}>{streak}-day streak</Badge>
            <Badge color={T.blue}>{lvl.title}</Badge>
            {status&&<Badge color={T.teal}>{status==="highschool"?"High School":status==="college"?"College":"Working"}</Badge>}
          </div>
          {picSaved&&<div style={{marginTop:8,fontSize:11.5,color:T.lime,fontWeight:600}}>Profile picture updated.</div>}
        </div>
        <div style={{textAlign:"right"}}>
          <div style={{fontSize:42,fontWeight:700,color:T.lime,letterSpacing:"-0.04em",lineHeight:1}}>{lvl.xp.toLocaleString()}</div>
          <div style={{fontSize:12,color:T.muted,marginTop:3}}>XP · {lvl.title}</div>
          <div style={{marginTop:10,width:160}}><Prog pct={lvl.tierPct} /></div>
          <div style={{fontSize:11,color:T.muted,marginTop:4}}>{lvl.nextTier?`${(lvl.nextTier.minXP-lvl.xp).toLocaleString()} XP to ${lvl.nextTier.title}`:"Maximum rank achieved"}</div>
        </div>
      </Card>

      {/* ── Onboarding preferences hub */}
      <Card style={{marginBottom:16}}>
        <div style={{fontSize:14,fontWeight:700,color:T.white,marginBottom:4}}>Your profile & schedule preferences</div>
        <div style={{fontSize:12,color:T.muted,marginBottom:18}}>Update your answers from setup anytime. These train your scheduling algorithm.</div>

        <Field label="Status">
          <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
            <StatusChip value="highschool" label="High School" active={status==="highschool"} />
            <StatusChip value="college" label="College" active={status==="college"} />
            <StatusChip value="working" label="Working" active={status==="working"} />
          </div>
        </Field>

        {status&&(
          <Field label={affiliationLabel} hint="Visible to classmates on leaderboards.">
            <Input value={affiliation} onChange={e=>setAffiliation(e.target.value)} placeholder={affiliationPlaceholder} />
          </Field>
        )}

        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
          <Field label="Study start time" hint="Tasks are scheduled from this hour.">
            <Input type="time" value={workStart} onChange={e=>setWorkStart(e.target.value)} />
          </Field>
          <Field label="Bedtime" hint="Tasks end 2 hours before this.">
            <Input type="time" value={bedtime} onChange={e=>setBedtime(e.target.value)} />
          </Field>
        </div>

        <Field label="Task difficulty order">
          <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
            {[{v:"easyFirst",l:"Easy first"},{v:"balanced",l:"Balanced"},{v:"hardFirst",l:"Hard first"}].map(o=>(
              <button key={o.v} type="button" onClick={()=>setDifficulty(o.v)} style={{padding:"8px 14px",borderRadius:8,fontSize:12,fontWeight:difficulty===o.v?600:400,cursor:"pointer",border:`1.5px solid ${difficulty===o.v?T.lime+"66":T.border}`,background:difficulty===o.v?T.lime+"14":"transparent",color:difficulty===o.v?T.lime:T.muted,fontFamily:T.font,transition:"all 0.15s"}}>{o.l}</button>
            ))}
          </div>
        </Field>

        <div style={{display:"flex",alignItems:"center",gap:12,marginTop:4}}>
          <Btn onClick={saveOnboarding}>Save preferences</Btn>
          {prefSaved&&<span style={{fontSize:12,color:T.lime,fontWeight:600}}>Saved.</span>}
        </div>
      </Card>

      {/* ── Stats */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:10,marginBottom:16}}>
        {[["Total study time",fmtH(ps.totalMin),T.lime],["Essays submitted","8",T.purple],["Cards mastered","147",T.teal],["Quizzes completed","23",T.amber],["Chat sessions","89",T.blue],["Focus sessions",String(ps.focusSessions),T.red]].map(([l,v,c],i)=>(
          <Card key={i} style={{textAlign:"center",padding:16}}>
            <div style={{fontSize:26,fontWeight:700,color:c,letterSpacing:"-0.02em",lineHeight:1}}>{v}</div>
            <div style={{fontSize:11,color:T.muted,marginTop:6}}>{l}</div>
          </Card>
        ))}
      </div>

      {/* ── Achievements */}
      <div style={{fontSize:12,fontWeight:700,color:T.muted,letterSpacing:"0.08em",textTransform:"uppercase",marginBottom:10}}>Achievements</div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:8,marginBottom:16}}>
        {badges.map((b,i)=>(
          <Card key={i} style={{display:"flex",flexDirection:"column",alignItems:"center",gap:8,padding:14,cursor:"pointer"}}>
            <div style={{width:36,height:36,borderRadius:8,background:b.color+"14",border:`1px solid ${b.color}33`,display:"flex",alignItems:"center",justifyContent:"center",color:b.color}}>{b.icon}</div>
            <div style={{fontSize:10,color:T.muted,textAlign:"center",lineHeight:1.3}}>{b.name}</div>
          </Card>
        ))}
      </div>

      {/* ── Activity charts */}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
        <Card>
          <Label>Weekly activity</Label>
          <div style={{display:"flex",gap:5,alignItems:"flex-end",height:80,marginTop:8}}>
            {activityData.map((h,i)=>(
              <div key={i} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:5}}>
                <div style={{width:"100%",height:`${h}%`,background:i===4?T.lime:T.card2,borderRadius:"3px 3px 0 0",transition:"height 0.3s"}} />
                <div style={{fontSize:9,color:T.faint,letterSpacing:"0.05em"}}>{"MTWTFSS"[i]}</div>
              </div>
            ))}
          </div>
        </Card>
        <Card>
          <Label>Subject distribution</Label>
          {[["Biology",38,T.teal],["English",28,T.purple],["Calculus",22,T.blue],["Spanish",12,T.amber]].map(([s,p,c],i)=>(
            <div key={i} style={{marginBottom:11}}>
              <div style={{display:"flex",justifyContent:"space-between",fontSize:11,marginBottom:4}}>
                <span style={{color:T.muted}}>{s}</span>
                <span style={{color:c,fontWeight:600}}>{p}%</span>
              </div>
              <Prog pct={p} color={c} height={3} />
            </div>
          ))}
        </Card>
      </div>
    </div>
  );
}

// ─── LEVEL ROADMAP MODAL ─────────────────────────────────────────────────────
function LevelRoadmapModal({open,onClose,currentXP}){
  if(!open)return null;
  return(
    <div onClick={onClose} style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.6)",backdropFilter:"blur(8px)",WebkitBackdropFilter:"blur(8px)",zIndex:1000,display:"flex",alignItems:"center",justifyContent:"center",padding:24,animation:"studlinFade 0.18s ease-out"}}>
      <div onClick={e=>e.stopPropagation()} style={{width:"100%",maxWidth:460,maxHeight:"86vh",background:T.card,borderRadius:18,border:`1px solid ${T.border}`,overflow:"hidden",display:"flex",flexDirection:"column",boxShadow:"0 28px 70px -20px rgba(0,0,0,0.55)",animation:"studlinPop 0.22s cubic-bezier(.2,.85,.3,1)"}}>
        <div style={{padding:"20px 22px 14px",borderBottom:`1px solid ${T.border}`,display:"flex",alignItems:"center",justifyContent:"space-between"}}>
          <div>
            <div style={{fontSize:16,fontWeight:700,color:T.white,letterSpacing:"-0.01em"}}>Career Rank Roadmap</div>
            <div style={{fontSize:12.5,color:T.muted,marginTop:3}}>11 tiers · Intern to CEO</div>
          </div>
          <button onClick={onClose} style={{width:30,height:30,borderRadius:8,border:`1px solid ${T.border}`,background:T.card2,color:T.muted,display:"grid",placeItems:"center",cursor:"pointer",fontSize:15}}>×</button>
        </div>
        <div style={{padding:"18px 22px",overflowY:"auto"}}>
          {PROF_TIERS.map((tier,i)=>{
            const next=PROF_TIERS[i+1]||null;
            const unlocked=currentXP>=tier.minXP;
            const isCurrent=unlocked&&(!next||currentXP<next.minXP);
            const pct=isCurrent&&next?Math.round(Math.max(0,Math.min(100,(currentXP-tier.minXP)/(next.minXP-tier.minXP)*100))):unlocked?100:0;
            return(
              <div key={tier.title} style={{display:"flex",gap:14,position:"relative",paddingBottom:i<PROF_TIERS.length-1?8:0}}>
                {i<PROF_TIERS.length-1&&<div style={{position:"absolute",left:19,top:40,width:2,height:"calc(100% - 12px)",background:unlocked?T.lime+"66":T.card2,zIndex:0}}/>}
                <div style={{width:40,height:40,borderRadius:"50%",background:isCurrent?T.lime:unlocked?T.lime+"22":T.card2,border:`2px solid ${isCurrent?T.lime:unlocked?T.lime+"55":T.faint}`,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,zIndex:1,fontSize:15,fontWeight:700,color:isCurrent?T.ink:unlocked?T.lime:T.faint}}>
                  {isCurrent?"★":unlocked?"✓":""}
                </div>
                <div style={{flex:1,paddingBottom:i<PROF_TIERS.length-1?18:0,minWidth:0}}>
                  <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:8}}>
                    <div style={{fontSize:13.5,fontWeight:isCurrent?700:600,color:isCurrent?T.lime:unlocked?T.text:T.muted,letterSpacing:"-0.01em"}}>{tier.title}</div>
                    <div style={{fontFamily:T.mono,fontSize:10,color:unlocked?T.lime:T.faint,fontWeight:600,flexShrink:0}}>{tier.minXP.toLocaleString()} XP</div>
                  </div>
                  {isCurrent&&next&&(
                    <div style={{marginTop:7}}>
                      <div style={{height:4,background:T.card2,borderRadius:99,overflow:"hidden"}}><div style={{height:"100%",width:pct+"%",background:T.lime,borderRadius:99,transition:"width 0.5s ease"}}/></div>
                      <div style={{fontSize:11,color:T.muted,marginTop:4}}>{(next.minXP-currentXP).toLocaleString()} XP until {next.title}</div>
                    </div>
                  )}
                  {isCurrent&&!next&&<div style={{fontSize:11,color:T.lime,marginTop:4,fontWeight:600}}>Maximum rank achieved</div>}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── LEADERBOARD MODAL ───────────────────────────────────────────────────────
function LeaderboardModal({open,onClose,currentXP}){
  if(!open)return null;
  const [filter,setFilter]=React.useState("global");
  const userTier=getProfTitle(currentXP);
  const allUsers=[
    {r:1,n:"Maya R.",xp:2140,streak:12,tier:"Associate",you:true,grad:"linear-gradient(135deg,#FFD7B5,#FFC9D2)"},
    {r:2,n:"Devon K.",xp:1840,streak:8,tier:"Associate",grad:"linear-gradient(135deg,#BFE3FF,#E2D0FF)"},
    {r:3,n:"Priya S.",xp:1602,streak:5,tier:"Associate",grad:"linear-gradient(135deg,#C4F0D8,#FFE99A)"},
    {r:4,n:"Jordan T.",xp:1088,streak:0,tier:"Intern",grad:"linear-gradient(135deg,#E2D0FF,#FFD7B5)"},
    {r:5,n:"Alex W.",xp:980,streak:3,tier:"Intern",grad:"linear-gradient(135deg,#FFE99A,#C4F0D8)"},
    {r:6,n:"Sam L.",xp:870,streak:1,tier:"Intern",grad:"linear-gradient(135deg,#BFE3FF,#FFD7B5)"},
    {r:7,n:"Riley M.",xp:640,streak:0,tier:"Intern",grad:"linear-gradient(135deg,#C4F0D8,#E2D0FF)"},
  ];
  const shown=filter==="level"?allUsers.filter(u=>u.tier===userTier||u.you):allUsers;
  const rankColor=(r)=>r===1?"#FFD700":r===2?"#C0C0C0":r===3?"#CD7F32":T.muted;
  const rankBg=(r)=>r===1?"rgba(255,215,0,0.12)":r===2?"rgba(192,192,192,0.08)":r===3?"rgba(205,127,50,0.08)":"transparent";
  return(
    <div onClick={onClose} style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.6)",backdropFilter:"blur(8px)",WebkitBackdropFilter:"blur(8px)",zIndex:1000,display:"flex",alignItems:"center",justifyContent:"center",padding:24,animation:"studlinFade 0.18s ease-out"}}>
      <div onClick={e=>e.stopPropagation()} style={{width:"100%",maxWidth:500,maxHeight:"86vh",background:T.card,borderRadius:18,border:`1px solid ${T.border}`,overflow:"hidden",display:"flex",flexDirection:"column",boxShadow:"0 28px 70px -20px rgba(0,0,0,0.55)",animation:"studlinPop 0.22s cubic-bezier(.2,.85,.3,1)"}}>
        <div style={{padding:"20px 22px 14px",borderBottom:`1px solid ${T.border}`,display:"flex",alignItems:"center",justifyContent:"space-between"}}>
          <div>
            <div style={{fontSize:16,fontWeight:700,color:T.white,letterSpacing:"-0.01em"}}>Global Leaderboard</div>
            <div style={{fontSize:12.5,color:T.muted,marginTop:3}}>Rankings reset weekly</div>
          </div>
          <button onClick={onClose} style={{width:30,height:30,borderRadius:8,border:`1px solid ${T.border}`,background:T.card2,color:T.muted,display:"grid",placeItems:"center",cursor:"pointer",fontSize:15}}>×</button>
        </div>
        <div style={{padding:"14px 22px 10px",borderBottom:`1px solid ${T.border}`,display:"flex",gap:6}}>
          {["global","level"].map(f=>(
            <button key={f} onClick={()=>setFilter(f)} style={{padding:"6px 14px",borderRadius:6,fontSize:12,cursor:"pointer",border:`1px solid ${filter===f?T.lime+"44":T.border}`,background:filter===f?T.lime+"14":"transparent",color:filter===f?T.lime:T.muted,fontWeight:filter===f?600:400,fontFamily:T.font,letterSpacing:"0.01em",transition:"all 0.15s"}}>
              {f==="global"?"Global":"By Level ("+userTier+")"}
            </button>
          ))}
        </div>
        <div style={{overflowY:"auto",flex:1}}>
          {shown.map((u,i)=>(
            <div key={u.r} style={{display:"flex",alignItems:"center",gap:12,padding:"12px 22px",borderBottom:`1px solid ${T.border}`,background:u.you?T.lime+"08":rankBg(u.r)}}>
              <div style={{width:28,height:28,borderRadius:"50%",background:rankBg(u.r)||T.card2,border:`2px solid ${rankColor(u.r)}`,display:"flex",alignItems:"center",justifyContent:"center",fontFamily:T.mono,fontSize:11,fontWeight:700,color:rankColor(u.r),flexShrink:0}}>{u.r}</div>
              <div style={{width:34,height:34,borderRadius:"50%",background:u.grad,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:700,fontSize:13,color:T.ink,flexShrink:0}}>{u.n.slice(0,1)}</div>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontSize:13,fontWeight:u.you?700:600,color:u.you?T.lime:T.text}}>{u.n}{u.you&&" (you)"}</div>
                <div style={{fontSize:11,color:T.muted,marginTop:1}}>{u.tier} · {u.streak>0?u.streak+"-day streak":"No streak"}</div>
              </div>
              <div style={{textAlign:"right",flexShrink:0}}>
                <div style={{fontFamily:T.mono,fontSize:13,fontWeight:700,color:rankColor(u.r)||T.text}}>{u.xp.toLocaleString()}</div>
                <div style={{fontSize:10,color:T.faint}}>XP</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── LEADERBOARD BUILDER ─────────────────────────────────────────────────────
// Seed profiles fill the board until real users displace them by gaining XP.
// In production, fetch the real roster from /api/leaderboard and merge below.
const LB_SEED=[
  {n:"Devon K.",xp:1840,streak:8,tier:"Associate",grad:"linear-gradient(135deg,#BFE3FF,#E2D0FF)"},
  {n:"Priya S.",xp:1602,streak:5,tier:"Associate",grad:"linear-gradient(135deg,#C4F0D8,#FFE99A)"},
  {n:"Jordan T.",xp:1088,streak:0,tier:"Intern",grad:"linear-gradient(135deg,#E2D0FF,#FFD7B5)"},
  {n:"Alex W.",xp:980,streak:3,tier:"Intern",grad:"linear-gradient(135deg,#FFE99A,#C4F0D8)"},
  {n:"Sam L.",xp:870,streak:1,tier:"Intern",grad:"linear-gradient(135deg,#BFE3FF,#FFD7B5)"},
  {n:"Riley M.",xp:640,streak:0,tier:"Intern",grad:"linear-gradient(135deg,#C4F0D8,#E2D0FF)"},
];
function buildLeaderboard(realName, realXP, realStreak) {
  const you={n:realName||"You",xp:Math.max(0,realXP||0),streak:realStreak||0,tier:getProfTitle(realXP||0),you:true,grad:"linear-gradient(135deg,#FFD7B5,#FFC9D2)"};
  const sorted=[...LB_SEED,you].sort((a,b)=>b.xp-a.xp).map((u,i)=>({...u,r:i+1}));
  const top5=sorted.slice(0,5);
  if(top5.some(u=>u.you))return top5;
  return [...sorted.slice(0,4),sorted.find(u=>u.you)];
}

// ─── DASHBOARD ────────────────────────────────────────────────────────────────
function Dashboard({setActive, focusSecs=22*60+10, focusRunning=true, setFocusRunning=()=>{}, setScheduleSettingsOpen=()=>{}, seriousMode=false}) {
  const realStats=sessionStats();
  const realStreak=Math.max(1,getStreak());
  const lvl=levelInfo();
  const wk=weekStreak();
  const [,forcePlan]=useState(0);
  const [levelRoadmapOpen,setLevelRoadmapOpen]=useState(false);
  const [leaderboardOpen,setLeaderboardOpen]=useState(false);
  const [shareMsg,setShareMsg]=useState("");
  const plan=todaysPlan();
  const planDoneCount=plan.filter(t=>t.done).length;
  const planLeft=Math.max(0,plan.length-planDoneCount);
  const subjColor={Chemistry:T.red,"English IV":T.purple,Biology:T.teal,Calculus:T.blue,Spanish:T.amber,History:T.muted};
  const scOf=(s)=>subjColor[s]||T.lime;
  const fmtClock=(t)=>{if(!t)return"";const p=t.split(":");let h=+p[0];const ap=h>=12?"PM":"AM";h=h%12||12;return h+":"+p[1]+ap;};
  const prof=getProfile();
  const firstName=(prof.name||"there").split(" ")[0];
  const hr=new Date().getHours();
  const greet=hr<12?"Good morning":hr<18?"Good afternoon":"Good evening";
  // Real deck data from localStorage
  const rawDecks=lsGet("decks",[]);
  const realDecks=rawDecks.slice(0,6).map(d=>({
    subj:(d.name||"Deck").slice(0,10).toUpperCase()+" · DECK",
    title:d.name||"Untitled deck",
    pct:d.cards&&d.cards.length>0?Math.round((d.done||0)/d.cards.length*100):0,
    a:(d.cards?d.cards.length:(d.count||0))+" cards",
    b:d.done>0?d.done+" done":"NEW",
    bg:T.card2,
    id:d.id,
  }));
  // Real notes from localStorage
  const rawNotes=lsGet("notes",[]);
  const noteCards=rawNotes.slice(0,3).map(n=>({
    subj:(n.tag||"Note").slice(0,8).toUpperCase()+" · NOTES",
    title:n.title||"Untitled note",
    pct:50,
    a:n.body?(n.body.split(" ").length+" words"):"0 words",
    b:n.created?new Date(n.created).toLocaleDateString("en",{weekday:"short"}):"",
    bg:T.card2,
    id:n.id,
  }));
  const pickUpItems=[...realDecks,...noteCards];
  // Real upcoming events (next 14 days)
  const allEvents=lsGet("events",[]);
  const today=dayKey();
  const in14days=new Date();in14days.setDate(in14days.getDate()+14);
  const upcomingEvents=allEvents
    .filter(ev=>ev.date>=today&&ev.date<=dayKey(in14days)&&ev.status!=="done")
    .sort((a,b)=>a.date.localeCompare(b.date)||((a.time||"").localeCompare(b.time||"")))
    .slice(0,5)
    .map(ev=>{
      const evDate=new Date(ev.date+"T12:00:00");
      const daysUntil=Math.ceil((new Date(ev.date)-new Date(today))/86400000);
      return{
        d:String(evDate.getDate()).padStart(2,"0"),
        mo:["JAN","FEB","MAR","APR","MAY","JUN","JUL","AUG","SEP","OCT","NOV","DEC"][evDate.getMonth()],
        t:ev.title,
        sub:(ev.subject||"")+(ev.kind?" · "+ev.kind:""),
        cd:daysUntil===0?"Today":daysUntil===1?"Tomorrow":daysUntil+"d",
        urgent:daysUntil<=2,
        id:ev.id,
      };
    });
  // Real weekly wrapped stats
  const weeklyXP=getWeeklyXP();
  const weeklyFocusMin=realStats.weekMin;
  const lbRank=1;
  // streak heatmap data
  const seed=[0,1,2,0,3,4,2,1,0,3,2,4,1,0,2,3,1,4,2,3,0,1,2,4,3,2,1,3,4,2,3,1,4,3,2,4,3,2,1,2,3,4,3,2,3,4,2,3,2,4,3,2,3,4,3,4,2,3,4,3,4,3,2,3,4,3,4,3,4,3,4,3,4,3,4,3,4,3,4,3,4,3,4,3,4,3,4,3,4,3,4];
  const cellColor=(lvl)=>{
    if(!lvl) return T.mode==="light"?"rgba(8,12,40,0.06)":"rgba(255,255,255,0.06)";
    return [null,T.lime+"40",T.lime+"80",T.limeDk,T.forest][lvl];
  };
  // Mono label/eyebrow inside a card
  const Eye=({children,style={}})=>(
    <span style={{fontFamily:T.mono,fontSize:10,letterSpacing:"0.16em",textTransform:"uppercase",color:T.muted,padding:"4px 8px",border:`1px solid ${T.border}`,borderRadius:99,...style}}>{children}</span>
  );
  const Hand=({children,style={}})=>(
    <h3 style={{fontFamily:T.hand,fontSize:30,lineHeight:1,fontWeight:600,margin:0,color:T.white,letterSpacing:"-0.01em",whiteSpace:"nowrap",...style}}>{children}</h3>
  );
  const CardHead=({title,label,more,light=false})=>(
    <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:14,gap:12}}>
      <div style={{display:"flex",alignItems:"center",gap:10,minWidth:0}}>
        <Hand style={light?{color:T.cream}:{}}>{title}</Hand>
        {label&&<Eye style={light?{color:"rgba(246,241,230,0.6)",borderColor:"rgba(246,241,230,0.18)"}:{}}>{label}</Eye>}
      </div>
      {more&&<button style={{fontSize:12,color:light?"rgba(246,241,230,0.6)":T.muted,display:"inline-flex",alignItems:"center",gap:4,cursor:"pointer",background:"none",border:"none"}}>{more} <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg></button>}
    </div>
  );
  const isLight=T.mode==="light";
  // Daily unique quote — deterministic from today's date
  const qHash=today.split("").reduce((a,c)=>a+c.charCodeAt(0),0);
  const todayQuote=QUOTES[qHash%QUOTES.length];
  const [quoteCopied,setQuoteCopied]=useState(false);
  // Dynamic leaderboard — real user ranked among seed profiles by actual XP
  const lbUsers=buildLeaderboard(firstName, lvl.xp, realStreak);
  const lbRankColor=(r)=>r===1?"#FFD700":r===2?"#C0C0C0":r===3?"#CD7F32":T.muted;
  const lbRankBg=(r)=>r===1?"rgba(255,215,0,0.10)":r===2?"rgba(192,192,192,0.07)":r===3?"rgba(205,127,50,0.07)":"transparent";
  return (
    <div style={{display:"flex",flexDirection:"column",gap:16,paddingBottom:40}}>

      {/* GREETING STRIP — full 3-col in normal mode, single card in Serious Mode */}
      {seriousMode ? (
        <div style={{background:`linear-gradient(135deg, ${T.forest} 0%, #1E3078 100%)`,color:T.cream,borderRadius:22,padding:"28px 34px",position:"relative",overflow:"hidden"}}>
          <div style={{position:"absolute",right:-40,top:-40,width:240,height:240,background:"radial-gradient(circle,rgba(200,255,90,0.18),transparent 70%)",pointerEvents:"none"}} />
          <div style={{position:"relative"}}>
            <div style={{fontFamily:T.mono,fontSize:11,letterSpacing:"0.14em",textTransform:"uppercase",color:"rgba(246,241,230,0.45)",marginBottom:6}}>{todayLabel()} · Week {weekNo()} · <span style={{color:T.purple,letterSpacing:"0.12em"}}>SERIOUS MODE</span></div>
            <div style={{fontFamily:T.hand,fontSize:50,lineHeight:0.95,fontWeight:600,color:T.cream,margin:"0 0 10px"}}>{greet}, <span style={{color:T.lime}}>{firstName}.</span></div>
            <p style={{fontSize:13.5,color:"rgba(246,241,230,0.7)",margin:"0 0 18px",lineHeight:1.5,maxWidth:560}}>{planLeft>0?<>You have <strong style={{color:T.cream}}>{planLeft} task{planLeft===1?"":"s"} left</strong> today. No distractions — just get it done.</>:plan.length>0?<>All <strong style={{color:T.cream}}>{plan.length} tasks complete</strong> today. Outstanding focus.</>:<>Nothing scheduled yet. Add tasks to your calendar to get started.</>}</p>
            <div style={{display:"flex",gap:10,flexWrap:"wrap"}}>
              <button onClick={()=>setActive("calendar")} style={{display:"inline-flex",alignItems:"center",gap:8,padding:"10px 18px",background:T.lime,color:T.ink,borderRadius:99,fontSize:13,fontWeight:600,border:"none",cursor:"pointer",fontFamily:T.font}}>Open calendar</button>
              <button onClick={()=>setScheduleSettingsOpen(true)} style={{display:"inline-flex",alignItems:"center",gap:8,padding:"10px 18px",color:T.cream,border:"1px solid rgba(246,241,230,0.18)",background:"transparent",borderRadius:99,fontSize:13,fontWeight:500,cursor:"pointer",fontFamily:T.font}}>Customize schedule</button>
            </div>
          </div>
        </div>
      ) : (
      <div style={{display:"grid",gridTemplateColumns:"1.5fr 1fr 1fr",gap:16}}>
        {/* Greeting */}
        <div style={{background:`linear-gradient(135deg, ${T.forest} 0%, #1E3078 100%)`,color:T.cream,borderRadius:22,padding:"26px 30px",position:"relative",overflow:"hidden",minHeight:200}}>
          <div style={{position:"absolute",right:-40,top:-40,width:240,height:240,background:"radial-gradient(circle,rgba(200,255,90,0.18),transparent 70%)",pointerEvents:"none"}} />
          <div style={{position:"relative"}}>
            <div style={{fontFamily:T.mono,fontSize:11,letterSpacing:"0.14em",textTransform:"uppercase",color:"rgba(246,241,230,0.55)",marginBottom:6}}>{todayLabel()} · Week {weekNo()}</div>
            <div style={{fontFamily:T.hand,fontSize:54,lineHeight:0.95,fontWeight:600,color:T.cream,margin:"0 0 4px"}}>{greet}, <span style={{color:T.lime}}>{firstName}.</span></div>
            <p style={{fontSize:13.5,color:"rgba(246,241,230,0.7)",margin:"8px 0 16px",lineHeight:1.5,maxWidth:380}}>{planLeft>0?<>You've got <strong style={{color:T.cream}}>{planLeft} task{planLeft===1?"":"s"} left</strong> on today's plan. Let's lock in.</>:plan.length>0?<>All <strong style={{color:T.cream}}>{plan.length} tasks done</strong> today. Outstanding work.</>:<>Nothing scheduled yet. Add a few tasks and let's lock in.</>}</p>
            <div style={{display:"flex",gap:10,flexWrap:"wrap"}}>
              <button onClick={()=>setFocusRunning(r=>!r)} style={{display:"inline-flex",alignItems:"center",gap:8,padding:"9px 16px",background:T.lime,color:T.ink,borderRadius:99,fontSize:13,fontWeight:600,border:"none",cursor:"pointer",fontFamily:T.font}}>
                {focusRunning
                  ?<svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="5" width="4" height="14" rx="1"/><rect x="14" y="5" width="4" height="14" rx="1"/></svg>
                  :<svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21"/></svg>}
                {focusRunning?"Pause focus session":"Resume focus session"}
              </button>
              <button onClick={()=>setActive("calendar")} style={{display:"inline-flex",alignItems:"center",gap:8,padding:"9px 16px",color:T.cream,border:"1px solid rgba(246,241,230,0.18)",background:"transparent",borderRadius:99,fontSize:13,fontWeight:600,cursor:"pointer",fontFamily:T.font}}>View today's plan</button>
              <button onClick={()=>setScheduleSettingsOpen(true)} style={{display:"inline-flex",alignItems:"center",gap:8,padding:"9px 16px",color:T.cream,border:"1px solid rgba(246,241,230,0.18)",background:"transparent",borderRadius:99,fontSize:13,fontWeight:600,cursor:"pointer",fontFamily:T.font}}>⚙️ Customize schedule</button>
            </div>
          </div>
        </div>

        {/* Streak — Duolingo-style flame indicator */}
        <div onClick={()=>setActive("profile")} style={{background:T.lime,borderRadius:22,padding:22,cursor:"pointer",border:"none",display:"flex",flexDirection:"column"}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
            <span style={{fontFamily:T.mono,fontSize:10.5,letterSpacing:"0.14em",textTransform:"uppercase",color:"rgba(8,12,40,0.6)",fontWeight:600}}>Day Streak</span>
            <svg width="22" height="22" viewBox="0 0 24 24" fill={T.ink} stroke="none" style={{opacity:0.85}}><path d="M12 2s4 5 4 9a4 4 0 0 1-8 0c0-2 1-3 1-3s-3 2-3 6a6 6 0 0 0 12 0c0-5-6-12-6-12z"/></svg>
          </div>
          <div style={{fontFamily:T.hand,fontSize:60,lineHeight:0.85,fontWeight:600,color:T.ink,margin:"10px 0 2px"}}>{realStreak}<span style={{fontSize:20,color:"rgba(8,12,40,0.55)",marginLeft:6}}>days</span></div>
          <div style={{fontSize:12,color:"rgba(8,12,40,0.7)",marginBottom:4}}>Today{wk.find(d=>d.today)?.on?" · active":"· keep going!"}</div>
          <div style={{display:"flex",gap:5,marginTop:"auto",paddingTop:10}}>
            {wk.map((d,i)=>{
              const isToday=d.today, on=d.on;
              return(
                <div key={i} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:3}}>
                  <div style={{width:"100%",height:28,borderRadius:7,background:isToday?T.ink:on?T.forest:"rgba(8,12,40,0.10)",color:isToday?T.lime:on?T.lime:"rgba(8,12,40,0.35)",opacity:d.future?0.4:1,display:"flex",alignItems:"center",justifyContent:"center",boxShadow:isToday?"0 0 0 2px "+T.ink:"none"}}>
                    {on||isToday
                      ?<svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" stroke="none"><path d="M12 2s4 5 4 9a4 4 0 0 1-8 0c0-2 1-3 1-3s-3 2-3 6a6 6 0 0 0 12 0c0-5-6-12-6-12z"/></svg>
                      :<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="4"/></svg>
                    }
                  </div>
                  <span style={{fontSize:9,fontFamily:T.mono,fontWeight:isToday?700:400,color:isToday?T.ink:"rgba(8,12,40,0.45)"}}>{d.lab}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* XP / Level — clickable → career roadmap modal */}
        <div onClick={()=>setLevelRoadmapOpen(true)} style={{background:T.card,borderRadius:22,padding:22,cursor:"pointer",border:`1px solid ${T.border}`,display:"flex",flexDirection:"column",position:"relative",overflow:"hidden"}}>
          <div style={{position:"absolute",right:-30,bottom:-30,width:130,height:130,background:`radial-gradient(circle,${T.lime}18,transparent 70%)`,pointerEvents:"none"}}/>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
            <span style={{fontFamily:T.mono,fontSize:10.5,letterSpacing:"0.14em",textTransform:"uppercase",color:T.muted,fontWeight:600}}>XP &amp; Rank</span>
            <span style={{fontFamily:T.mono,fontSize:9.5,letterSpacing:"0.10em",background:T.lime+"22",padding:"3px 9px",borderRadius:99,color:T.lime,border:`1px solid ${T.lime}44`,fontWeight:700}}>{lvl.title.toUpperCase()}</span>
          </div>
          <div style={{fontFamily:T.hand,fontSize:60,lineHeight:0.85,fontWeight:600,color:T.text,margin:"10px 0 2px"}}>{lvl.xp.toLocaleString()}<span style={{fontSize:20,color:T.muted,marginLeft:6}}>xp</span></div>
          <div style={{fontSize:12,color:T.muted,marginBottom:4}}>{lvl.nextTier?`${(lvl.nextTier.minXP-lvl.xp).toLocaleString()} XP to ${lvl.nextTier.title}`:"Maximum rank achieved"}</div>
          <div style={{height:6,background:T.card2,borderRadius:99,marginTop:"auto",overflow:"hidden"}}>
            <div style={{height:"100%",width:lvl.tierPct+"%",background:`linear-gradient(90deg,${T.limeDk},${T.lime})`,borderRadius:99,transition:"width 0.5s ease"}}/>
          </div>
          <div style={{fontSize:11,color:T.faint,marginTop:8,display:"flex",alignItems:"center",gap:4}}>
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>
            View career roadmap
          </div>
        </div>
      </div>
      )} {/* end seriousMode ternary */}

      {/* ROW 2: QUOTE OF THE DAY */}
      <div style={{background:T.butter,borderRadius:22,padding:"28px 32px",position:"relative",overflow:"hidden"}}>
        <span style={{fontFamily:T.serif,fontSize:160,lineHeight:0.65,color:"rgba(8,12,40,0.10)",position:"absolute",top:-8,left:18,fontStyle:"italic",pointerEvents:"none"}}>"</span>
        <div style={{position:"relative",display:"flex",flexDirection:"column",gap:14}}>
          <div style={{fontFamily:T.mono,fontSize:10,letterSpacing:"0.16em",textTransform:"uppercase",color:"rgba(8,12,40,0.45)"}}>Quote of the Day</div>
          <div style={{fontFamily:T.serif,fontStyle:"italic",fontSize:26,lineHeight:1.3,color:T.ink,maxWidth:780}}>{todayQuote.text}</div>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:10}}>
            <div style={{fontFamily:T.mono,fontSize:12,letterSpacing:"0.10em",textTransform:"uppercase",color:"rgba(8,12,40,0.55)"}}>— {todayQuote.author}</div>
            <button onClick={()=>{
              const txt=`"${todayQuote.text}" — ${todayQuote.author}`;
              navigator.clipboard&&navigator.clipboard.writeText(txt).then(()=>{setQuoteCopied(true);setTimeout(()=>setQuoteCopied(false),2500);});
            }} style={{display:"inline-flex",alignItems:"center",gap:7,padding:"9px 18px",background:quoteCopied?T.forest:T.ink,color:T.cream,border:"none",borderRadius:99,fontSize:13,fontWeight:600,cursor:"pointer",fontFamily:T.font,transition:"background 0.2s",flexShrink:0}}>
              {quoteCopied
                ?<><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg> Copied!</>
                :<><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg> Share Quote</>
              }
            </button>
          </div>
        </div>
      </div>

      {/* ROW 3: TODAY'S PLAN — full width */}
      <div style={{background:T.card,border:`1px solid ${T.border}`,borderRadius:22,padding:22}}>
        <CardHead title="Today's plan" label={planDoneCount+" / "+plan.length+" DONE"} more="Calendar" />
        {plan.length===0
          ? <div style={{padding:"22px 8px",textAlign:"center"}}>
              <div style={{fontSize:13,color:T.muted,marginBottom:14,lineHeight:1.5}}>Nothing scheduled for today. Add events to your calendar and they appear here automatically.</div>
              <button onClick={()=>setActive("calendar")} style={{display:"inline-flex",alignItems:"center",gap:7,padding:"9px 16px",background:T.lime,color:T.ink,border:"none",borderRadius:99,fontSize:12.5,fontWeight:600,cursor:"pointer",fontFamily:T.font}}>Open calendar</button>
            </div>
          : plan.map((t)=>{
            const c=scOf(t.subject);
            return (
            <div key={t.id} onClick={()=>{togglePlanDone(t.id);forcePlan(x=>x+1);}} style={{display:"flex",alignItems:"center",gap:12,padding:"11px 14px",borderRadius:12,border:`1px solid ${T.border}`,marginBottom:8,cursor:"pointer"}}>
              <div style={{width:20,height:20,borderRadius:"50%",border:`1.5px solid ${t.done?T.forest:T.faint}`,background:t.done?T.forest:"transparent",flex:"none",display:"grid",placeItems:"center"}}>
                {t.done&&<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke={T.lime} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>}
              </div>
              <div style={{flex:1,minWidth:0}}>
                <div style={{display:"flex",alignItems:"center",gap:6}}>
                  {t.priority&&<span style={{width:6,height:6,borderRadius:"50%",background:PRIORITY_COLORS[t.priority||3],flexShrink:0}} />}
                  <span style={{fontSize:13.5,color:t.done?T.muted:T.text,textDecoration:t.done?"line-through":"none",fontWeight:500}}>{t.title}</span>
                </div>
                <div style={{fontSize:11.5,color:T.muted,marginTop:1,display:"flex",gap:6,alignItems:"center"}}>
                  <span style={{textTransform:"capitalize"}}>{t.subject}{t.kind?" · "+t.kind:""}</span>
                  {t.duration&&<span style={{background:T.card2,padding:"0 5px",borderRadius:3,fontSize:10,fontWeight:600}}>{t.duration}m</span>}
                </div>
              </div>
              <span style={{fontFamily:T.mono,fontSize:10,letterSpacing:"0.06em",padding:"3px 8px",borderRadius:6,background:c+"22",color:c,textTransform:"uppercase",fontWeight:600,flex:"none"}}>{t.subject.slice(0,4)}</span>
              <span style={{fontFamily:T.mono,fontSize:11,color:T.muted}}>{fmtClock(t.time)}</span>
            </div>
          );})}
      </div>

      {/* ROW 4: GLOBAL LEADERBOARD — hidden in Serious Mode */}
      {!seriousMode && <div style={{background:T.card,border:`1px solid ${T.border}`,borderRadius:22,padding:22}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:18,gap:12,flexWrap:"wrap"}}>
          <div style={{display:"flex",alignItems:"center",gap:10}}>
            <Hand>Global Leaderboard</Hand>
            <Eye>RESETS WEEKLY</Eye>
          </div>
          <button onClick={()=>setLeaderboardOpen(true)} style={{fontSize:12,color:T.muted,display:"inline-flex",alignItems:"center",gap:4,cursor:"pointer",background:"none",border:"none"}}>View all <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg></button>
        </div>
        <div style={{display:"flex",flexDirection:"column",gap:0}}>
          {lbUsers.map((u,i)=>(
            <div key={u.r} style={{display:"flex",alignItems:"center",gap:14,padding:"13px 16px",borderRadius:12,background:u.you?T.lime+"0c":lbRankBg(u.r),marginBottom:4,border:`1px solid ${u.you?T.lime+"33":"transparent"}`}}>
              <div style={{width:30,height:30,borderRadius:"50%",background:lbRankBg(u.r)||T.card2,border:`2px solid ${lbRankColor(u.r)}`,display:"flex",alignItems:"center",justifyContent:"center",fontFamily:T.mono,fontSize:12,fontWeight:700,color:lbRankColor(u.r),flexShrink:0}}>{u.r}</div>
              <div style={{width:36,height:36,borderRadius:"50%",background:u.grad,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:700,fontSize:13,color:T.ink,flexShrink:0}}>{u.n.slice(0,1)}</div>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontSize:13.5,fontWeight:u.you?700:600,color:u.you?T.lime:T.text}}>{u.n}{u.you&&<span style={{marginLeft:8,fontFamily:T.mono,fontSize:10,letterSpacing:"0.08em",background:T.lime+"22",color:T.lime,padding:"2px 7px",borderRadius:4,fontWeight:700}}>YOU</span>}</div>
                <div style={{fontSize:11.5,color:T.muted,marginTop:2}}>{u.tier} · {u.streak>0?u.streak+"-day streak":"No active streak"}</div>
              </div>
              <div style={{textAlign:"right",flexShrink:0}}>
                <div style={{fontFamily:T.mono,fontSize:14,fontWeight:700,color:lbRankColor(u.r)||T.text}}>{u.xp.toLocaleString()}</div>
                <div style={{fontSize:10,color:T.faint,marginTop:2}}>XP</div>
              </div>
            </div>
          ))}
        </div>
      </div>}

      {/* ROW 5: WEEKLY WRAPPED — hidden in Serious Mode */}
      {!seriousMode && <div style={{background:T.forest,color:T.cream,borderRadius:22,padding:22}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:14,gap:12,flexWrap:"wrap"}}>
          <div style={{display:"flex",alignItems:"center",gap:10,minWidth:0}}>
            <Hand style={{color:T.cream}}>This week, you…</Hand>
            <Eye style={{color:"rgba(246,241,230,0.6)",borderColor:"rgba(246,241,230,0.18)"}}>{"WRAPPED · WEEK "+weekNo()}</Eye>
          </div>
          <button onClick={()=>{
            const txt=`📊 My Studlin Week ${weekNo()}\n\nFocus time: ${fmtH(weeklyFocusMin)||"0m"}\nXP earned: ${weeklyXP.toLocaleString()} XP\nDay streak: ${realStreak} days\nRank: #${lbRank} Global\n\nstudlin.app`;
            navigator.clipboard&&navigator.clipboard.writeText(txt).then(()=>{setShareMsg("Copied to clipboard!");setTimeout(()=>setShareMsg(""),2500);});
          }} style={{display:"inline-flex",alignItems:"center",gap:7,padding:"8px 16px",background:T.lime,color:T.ink,border:"none",borderRadius:99,fontSize:12.5,fontWeight:700,cursor:"pointer",fontFamily:T.font,flexShrink:0}}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>
            Share Wrapped
          </button>
        </div>
        {shareMsg&&<div style={{fontSize:12,color:T.lime,fontWeight:600,marginBottom:12,display:"flex",alignItems:"center",gap:6}}>✓ {shareMsg}</div>}
        <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:10,marginTop:4}}>
          {[
            {ln:"Focus hours",vn:fmtH(weeklyFocusMin)||"0m"},
            {ln:"XP earned",vn:weeklyXP.toLocaleString()+" xp"},
            {ln:"Leaderboard rank",vn:"#"+lbRank+" Global"},
          ].map((ins,i)=>(
            <div key={i} style={{background:"rgba(246,241,230,0.05)",borderRadius:12,padding:"12px 14px"}}>
              <div style={{fontSize:11,color:"rgba(246,241,230,0.55)",fontFamily:T.mono,letterSpacing:"0.06em",textTransform:"uppercase"}}>{ins.ln}</div>
              <div style={{fontFamily:T.hand,fontSize:32,lineHeight:1,fontWeight:600,color:T.lime,marginTop:4}}>{ins.vn}</div>
            </div>
          ))}
        </div>
        <div style={{display:"flex",gap:10,flexWrap:"wrap",marginTop:18,alignItems:"center"}}>
          <div style={{display:"flex",alignItems:"center",gap:8,padding:"8px 12px",background:"rgba(246,241,230,0.06)",border:"1px solid rgba(246,241,230,0.12)",borderRadius:99,fontSize:12,fontWeight:500,color:T.cream}}>
            <span style={{width:22,height:22,borderRadius:"50%",background:T.lime,display:"grid",placeItems:"center",fontFamily:T.hand,fontWeight:700,fontSize:13,color:T.ink,flex:"none"}}>{realStreak}</span>
            {realStreak}-day streak
          </div>
          <button onClick={()=>setLeaderboardOpen(true)} style={{display:"flex",alignItems:"center",gap:8,padding:"8px 12px",background:"rgba(246,241,230,0.06)",border:"1px solid rgba(246,241,230,0.12)",borderRadius:99,fontSize:12,fontWeight:500,color:T.cream,cursor:"pointer",fontFamily:T.font}}>
            <span style={{width:22,height:22,borderRadius:"50%",background:T.lime,display:"grid",placeItems:"center",fontWeight:700,fontSize:13,color:T.ink,flex:"none"}}>#1</span>
            Global leaderboard
          </button>
        </div>
      </div>}

      {/* Modals */}
      <LevelRoadmapModal open={levelRoadmapOpen} onClose={()=>setLevelRoadmapOpen(false)} currentXP={lvl.xp} />
      <LeaderboardModal open={leaderboardOpen} onClose={()=>setLeaderboardOpen(false)} currentXP={lvl.xp} />
    </div>
  );
}

// ─── INIT WIZARD ─────────────────────────────────────────────────────────────
function InitWizard({onComplete}){
  const prefs = getSchedulePreferences();
  const prof = getProfile();
  const [step, setStep] = useState(0);
  const [status, setStatus] = useState(prof.status||"");
  const [affiliation, setAffiliation] = useState(prof.affiliation||prof.school||"");
  const [workStart, setWorkStart] = useState(prefs.workStartTime||"09:00");
  const [bedtime, setBedtime] = useState(prefs.bedtime||"23:00");
  const [difficulty, setDifficulty] = useState(prefs.difficultyPreference||"balanced");

  const affiliationLabel = status==="highschool" ? "School name" : status==="college" ? "University name" : status==="working" ? "Company name" : "Affiliation";
  const affiliationPlaceholder = status==="highschool" ? "e.g. Lincoln High School" : status==="college" ? "e.g. UCLA, NYU..." : status==="working" ? "e.g. Google, startup..." : "Your school or company";

  const save = () => {
    const updatedPrefs = {...prefs, workStartTime:workStart, bedtime, difficultyPreference:difficulty};
    setSchedulePreferences(updatedPrefs);
    const updatedProf = {...getProfile(), status, affiliation, school:affiliation};
    lsSet("profile", updatedProf);
    lsSet("onboarded", true);
    onComplete();
  };

  const skip = () => {
    lsSet("onboarded", true);
    onComplete();
  };

  const STEPS = [
    {key:"status"},
    {key:"workStart"},
    {key:"bedtime"},
    {key:"difficulty"},
  ];
  const isLast = step === STEPS.length - 1;

  const next = () => {
    if (isLast) { save(); return; }
    setStep(s => s + 1);
  };

  const bg = "#F5F6FF";
  const forest = "#1B2457";
  const lime = "#3A5FCA";
  const ink = "#0B0E2A";
  const muted = "rgba(11,14,42,0.5)";
  const border = "rgba(11,14,42,0.18)";
  const card = "#ffffff";

  const ChipOpt = ({value, active, onClick, children}) => (
    <button type="button" onClick={onClick} style={{padding:"12px 20px",borderRadius:10,fontSize:13,fontWeight:active?700:500,cursor:"pointer",border:`2px solid ${active?lime:border}`,background:active?lime+"18":"transparent",color:active?ink:muted,fontFamily:`"Geist",system-ui,sans-serif`,transition:"all 0.15s",textAlign:"center",minWidth:120}}>
      {children}
    </button>
  );

  return (
    <div style={{minHeight:"100vh",background:bg,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"24px 16px",fontFamily:`"Geist",system-ui,sans-serif`}}>
      {/* Logo */}
      <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:40}}>
        <div style={{width:36,height:36,borderRadius:10,background:"linear-gradient(135deg,#1C2250,#0E1238)",display:"grid",placeItems:"center",boxShadow:"0 0 16px 4px rgba(58,95,202,0.35)"}}>
            <div style={{width:11,height:11,borderRadius:"50%",background:"radial-gradient(circle at 35% 35%, #9A88F2, #3A5FCA)",boxShadow:"0 0 10px 3px rgba(58,95,202,0.6)"}} />
          </div>
        <span style={{fontSize:22,fontWeight:700,color:ink,letterSpacing:"-0.02em"}}>Studlin</span>
      </div>

      {/* Card */}
      <div style={{width:"100%",maxWidth:520,background:card,borderRadius:20,padding:"36px 40px",border:`1.5px solid ${border}`,boxShadow:"0 24px 60px -24px rgba(11,14,42,0.18)"}}>
        {/* Pre-question header (shown on all steps) */}
        <div style={{background:"rgba(79,127,232,0.10)",border:`1px solid ${lime}44`,borderRadius:10,padding:"10px 14px",marginBottom:28,fontSize:12.5,color:ink,lineHeight:1.5,fontWeight:500}}>
          The following questions are used to customize and train your calendar scheduling algorithm.
        </div>

        {/* Progress dots */}
        <div style={{display:"flex",gap:6,marginBottom:28}}>
          {STEPS.map((_,i) => (
            <div key={i} style={{height:4,flex:1,borderRadius:99,background:i<=step?lime:"rgba(11,14,42,0.12)",transition:"background 0.3s"}} />
          ))}
        </div>

        {/* Step content */}
        {step===0 && (
          <div>
            <div style={{fontSize:20,fontWeight:700,color:ink,marginBottom:6,letterSpacing:"-0.01em"}}>What best describes you?</div>
            <div style={{fontSize:13,color:muted,marginBottom:24}}>This helps us tailor deadlines, schedules, and peer matching.</div>
            <div style={{display:"flex",gap:10,flexWrap:"wrap",marginBottom:20}}>
              <ChipOpt value="highschool" active={status==="highschool"} onClick={()=>setStatus("highschool")}>High School</ChipOpt>
              <ChipOpt value="college" active={status==="college"} onClick={()=>setStatus("college")}>College</ChipOpt>
              <ChipOpt value="working" active={status==="working"} onClick={()=>setStatus("working")}>Working</ChipOpt>
            </div>
            {status && (
              <div style={{marginTop:4}}>
                <label style={{display:"block",fontSize:11,fontWeight:700,letterSpacing:"0.08em",textTransform:"uppercase",color:muted,marginBottom:8}}>{affiliationLabel}</label>
                <input value={affiliation} onChange={e=>setAffiliation(e.target.value)} placeholder={affiliationPlaceholder} style={{width:"100%",background:"#EBEEFF",border:`1.5px solid ${border}`,borderRadius:9,padding:"11px 14px",color:ink,fontSize:13.5,fontFamily:`"Geist",system-ui,sans-serif`,outline:"none",boxSizing:"border-box"}} />
                <div style={{fontSize:11,color:muted,marginTop:6}}>Visible to classmates on leaderboards.</div>
              </div>
            )}
          </div>
        )}

        {step===1 && (
          <div>
            <div style={{fontSize:20,fontWeight:700,color:ink,marginBottom:6,letterSpacing:"-0.01em"}}>When do you prefer to study?</div>
            <div style={{fontSize:13,color:muted,marginBottom:24}}>Tasks are scheduled inside this window so your time is protected.</div>
            <label style={{display:"block",fontSize:11,fontWeight:700,letterSpacing:"0.08em",textTransform:"uppercase",color:muted,marginBottom:8}}>Peak study start time</label>
            <input type="time" value={workStart} onChange={e=>setWorkStart(e.target.value)} style={{background:"#EBEEFF",border:`1.5px solid ${border}`,borderRadius:9,padding:"11px 14px",color:ink,fontSize:14,fontFamily:`"Geist",system-ui,sans-serif`,outline:"none",maxWidth:200}} />
          </div>
        )}

        {step===2 && (
          <div>
            <div style={{fontSize:20,fontWeight:700,color:ink,marginBottom:6,letterSpacing:"-0.01em"}}>What time do you go to bed?</div>
            <div style={{fontSize:13,color:muted,marginBottom:24}}>We won't schedule tasks within 2 hours of your bedtime.</div>
            <label style={{display:"block",fontSize:11,fontWeight:700,letterSpacing:"0.08em",textTransform:"uppercase",color:muted,marginBottom:8}}>Bedtime</label>
            <input type="time" value={bedtime} onChange={e=>setBedtime(e.target.value)} style={{background:"#EBEEFF",border:`1.5px solid ${border}`,borderRadius:9,padding:"11px 14px",color:ink,fontSize:14,fontFamily:`"Geist",system-ui,sans-serif`,outline:"none",maxWidth:200}} />
          </div>
        )}

        {step===3 && (
          <div>
            <div style={{fontSize:20,fontWeight:700,color:ink,marginBottom:6,letterSpacing:"-0.01em"}}>How do you like to tackle tasks?</div>
            <div style={{fontSize:13,color:muted,marginBottom:24}}>Studlin will order your schedule accordingly.</div>
            <div style={{display:"flex",flexDirection:"column",gap:10}}>
              {[
                {v:"easyFirst",l:"Easy first",d:"Build momentum with quick wins before harder tasks."},
                {v:"balanced",l:"Balanced",d:"Mix easy and hard tasks naturally throughout the day."},
                {v:"hardFirst",l:"Hard first",d:"Tackle demanding work during peak focus, then coast."},
              ].map(opt=>(
                <button key={opt.v} type="button" onClick={()=>setDifficulty(opt.v)} style={{padding:"14px 16px",borderRadius:10,border:`2px solid ${difficulty===opt.v?lime:border}`,background:difficulty===opt.v?lime+"14":"transparent",color:ink,textAlign:"left",cursor:"pointer",fontFamily:`"Geist",system-ui,sans-serif`,transition:"all 0.15s"}}>
                  <div style={{fontSize:13.5,fontWeight:difficulty===opt.v?700:600,color:difficulty===opt.v?ink:ink}}>{opt.l}</div>
                  <div style={{fontSize:12,color:muted,marginTop:3}}>{opt.d}</div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginTop:32}}>
          <button onClick={skip} style={{fontSize:13,color:muted,background:"none",border:"none",cursor:"pointer",fontFamily:`"Geist",system-ui,sans-serif`,fontWeight:500,padding:"8px 0"}}>
            Skip all
          </button>
          <div style={{display:"flex",gap:10,alignItems:"center"}}>
            {step > 0 && (
              <button onClick={()=>setStep(s=>s-1)} style={{padding:"11px 22px",borderRadius:99,border:`1.5px solid ${border}`,background:"transparent",color:ink,fontSize:13,fontWeight:600,cursor:"pointer",fontFamily:`"Geist",system-ui,sans-serif`}}>
                Back
              </button>
            )}
            <button onClick={next} style={{padding:"11px 28px",borderRadius:99,border:"none",background:lime,color:ink,fontSize:13,fontWeight:700,cursor:"pointer",fontFamily:`"Geist",system-ui,sans-serif`}}>
              {isLast ? "Finish" : (step===0&&!status ? "Skip" : "Continue")}
            </button>
          </div>
        </div>
      </div>

      <div style={{marginTop:20,fontSize:12,color:muted}}>All questions are optional. You can update these in Settings anytime.</div>
    </div>
  );
}

// ─── AUTH SCREEN — minimal gate, links to designed pages ────────────────────
function AuthScreen(){
  return(
    <div style={{minHeight:"100vh",background:"#080B18",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:20}}>
      <div style={{display:"flex",alignItems:"center",gap:10}}>
        <div style={{width:36,height:36,borderRadius:10,background:"linear-gradient(135deg,#1C2250,#0E1238)",display:"grid",placeItems:"center",boxShadow:"0 0 16px 4px rgba(79,127,232,0.38)"}}>
          <div style={{width:11,height:11,borderRadius:"50%",background:"radial-gradient(circle at 35% 35%, #A695F5, #4F7FE8)",boxShadow:"0 0 10px 3px rgba(79,127,232,0.65)"}} />
        </div>
        <span style={{fontSize:22,fontWeight:700,color:"#E8EEFF"}}>Studlin</span>
      </div>
      <p style={{fontSize:15,color:"rgba(232,238,255,0.6)",margin:0}}>Sign in to access your workspace.</p>
      <div style={{display:"flex",gap:12,marginTop:8}}>
        <a href="Studlin Sign In.html" style={{padding:"12px 28px",borderRadius:10,background:"#4F7FE8",color:"#080C28",fontSize:14,fontWeight:600,textDecoration:"none"}}>Sign in</a>
        <a href="Studlin Onboarding.html" style={{padding:"12px 28px",borderRadius:10,border:"1px solid rgba(79,127,232,0.3)",background:"transparent",color:"#4F7FE8",fontSize:14,fontWeight:600,textDecoration:"none"}}>Create account</a>
      </div>
    </div>
  );
}


// ─── AUTH GATE ────────────────────────────────────────────────────────────────
function AuthGate(){
  const [user,setUser]=useState(undefined);
  useEffect(()=>{return firebase.auth().onAuthStateChanged(u=>{setUser(u||null);if(u)fetchUserProfile();});},[]);
  if(user===undefined)return(<div style={{minHeight:"100vh",background:"#080B18",display:"grid",placeItems:"center"}}><div style={{display:"flex",alignItems:"center",gap:10}}><div style={{width:36,height:36,borderRadius:10,background:"linear-gradient(135deg,#1C2250,#0E1238)",display:"grid",placeItems:"center",boxShadow:"0 0 16px 4px rgba(79,127,232,0.38)"}}><div style={{width:11,height:11,borderRadius:"50%",background:"radial-gradient(circle at 35% 35%, #A695F5, #4F7FE8)",boxShadow:"0 0 10px 3px rgba(79,127,232,0.65)"}}/></div><span style={{fontSize:22,fontWeight:700,color:"#E8EEFF"}}>Studlin</span></div></div>);
  if(!user)return <AuthScreen />;
  return <App />;
}

// ─── NOTIFICATION PERMISSION MODAL ────────────────────────────────────────────
function NotifPermModal({onAllow=()=>{},onDeny=()=>{}}) {
  return (
    <div style={{position:"fixed",inset:0,zIndex:9999,background:"rgba(0,0,0,0.55)",display:"flex",alignItems:"center",justifyContent:"center",padding:24}}>
      <div style={{background:T.bg,borderRadius:24,padding:"36px 32px 28px",maxWidth:360,width:"100%",boxShadow:"0 24px 80px rgba(0,0,0,0.35)",border:`1px solid ${T.border}`,textAlign:"center"}}>
        <div style={{width:64,height:64,borderRadius:18,background:`linear-gradient(135deg,${T.lime}30,${T.lime}10)`,border:`1px solid ${T.lime}40`,display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 20px",fontSize:28}}>🔔</div>
        <div style={{fontFamily:T.sans,fontWeight:700,fontSize:20,color:T.text,marginBottom:8,letterSpacing:"-0.3px"}}>Stay on track</div>
        <div style={{fontFamily:T.sans,fontSize:14,color:T.muted,lineHeight:1.6,marginBottom:28}}>
          Allow Studlin to send you smart alerts before study blocks begin — so you never miss a lock-in session.
        </div>
        <button onClick={onAllow} style={{width:"100%",padding:"13px 0",borderRadius:12,background:T.lime,color:T.ink,border:"none",fontFamily:T.sans,fontWeight:700,fontSize:15,cursor:"pointer",marginBottom:10,letterSpacing:"-0.2px"}}>Allow notifications</button>
        <button onClick={onDeny} style={{width:"100%",padding:"11px 0",borderRadius:12,background:"transparent",color:T.muted,border:`1px solid ${T.border}`,fontFamily:T.sans,fontWeight:500,fontSize:14,cursor:"pointer"}}>Not now</button>
      </div>
    </div>
  );
}

// ─── APP SHELL ────────────────────────────────────────────────────────────────
function App() {
  seedEventsIfStale();
  const [onboarded,setOnboarded]=useState(()=>!!lsGet("onboarded",false));
  const [active,setActive]=useState("dashboard");
  const [theme,setThemeState]=useState(()=>(typeof localStorage!=="undefined" && localStorage.getItem("studlin-theme"))||"light");
  const [accent,setAccentState]=useState(()=>{
    if(typeof localStorage!=="undefined"){
      if(!localStorage.getItem("studlin-accent-reset4")){localStorage.setItem("studlin-accent","Indigo");localStorage.setItem("studlin-accent-reset4","1");}
      return localStorage.getItem("studlin-accent")||"Indigo";
    }
    return "Indigo";
  });
  const [density,setDensityState]=useState(()=>(typeof localStorage!=="undefined" && localStorage.getItem("studlin-density"))||"Comfortable");
  applyTheme(theme, accent, density); // mutate T on every render so all child components re-read
  const setTheme=(name)=>{ setThemeState(name); if(typeof localStorage!=="undefined") localStorage.setItem("studlin-theme",name); };
  const setAccent=(name)=>{ setAccentState(name); if(typeof localStorage!=="undefined") localStorage.setItem("studlin-accent",name); };
  const setDensity=(name)=>{ setDensityState(name); if(typeof localStorage!=="undefined") localStorage.setItem("studlin-density",name); };
  const [focusSecs,setFocusSecs]=useState(22*60+10);
  const [focusRunning,setFocusRunning]=useState(true);
  const [focusMode,setFocusMode]=useState("Focus");
  const [focusTotal,setFocusTotal]=useState(25*60);
  const [timerTask,setTimerTask]=useState(null);
  const [newDayModal,setNewDayModal]=useState(false);
  const [overdueForModal,setOverdueForModal]=useState([]);
  const [scheduleSettingsOpen,setScheduleSettingsOpen]=useState(false);
  window._setTimerTask=setTimerTask;
  const [creditsOpen,setCreditsOpen]=useState(false);
  const [pricingOpen,setPricingOpen]=useState(false);
  const [notifOpen,setNotifOpen]=useState(false);
  const [seriousMode,setSeriousMode]=useState(()=>lsGet("settings",{}).seriousMode||false);
  const [notifPermModal,setNotifPermModal]=useState(false);
  const handleNotifAllow=()=>{
    if(Notification&&Notification.requestPermission)Notification.requestPermission();
    const s=lsGet("settings",{});lsSet("settings",{...s,notifMaster:true});
    lsSet("notifAsked",true);setNotifPermModal(false);
  };
  const handleNotifDeny=()=>{
    lsSet("notifAsked",true);setNotifPermModal(false);
  };
  const [notifSeen,setNotifSeen]=useState(false);
  const [customDollars,setCustomDollars]=useState("");
  const [boughtMsg,setBoughtMsg]=useState("");
  const [creditCheckout,setCreditCheckout]=useState(null);
  const [creditProcessing,setCreditProcessing]=useState(false);
  const stripeCardRef=useRef(null);
  const stripeRef=useRef(null);
  const stripePk='pk_live_51TLuXlFJjTMWMaWhX10200LKeE5JW0FHH2qp6evADegl2MIHuz26vUoBKyn7ug7Sb0akTI0MQHE34Ocyg2XeviKT00H9SklfJK';

  const startCreditCheckout=async(credits,customAmount)=>{
    setBoughtMsg("Loading...");
    try{
      const body=customAmount?{mode:"payment",customAmount}:{mode:"payment",credits};
      const res=await authFetch("/api/create-intent",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(body)});
      const data=await res.json();
      if(data.error){setBoughtMsg(data.error);return;}
      const label=customAmount?(customAmount*30).toLocaleString()+" credits":credits.toLocaleString()+" credits";
      const price=customAmount?"$"+customAmount:({150:"$4.99",500:"$14.99",1000:"$24.99",3000:"$59.99"}[credits]||"$?.??");
      setCreditCheckout({clientSecret:data.clientSecret,label,price});
      setBoughtMsg("");
    }catch(e){setBoughtMsg("Something went wrong.");}
  };

  useEffect(()=>{
    if(!creditCheckout)return;
    const s=typeof Stripe!=="undefined"?Stripe(stripePk):null;
    if(!s)return;
    stripeRef.current=s;
    const el=s.elements();
    const cardEl=el.create("card",{style:{base:{fontSize:"15px",fontFamily:"'Geist',sans-serif",color:"#E8EEFF","::placeholder":{color:"rgba(255,255,255,0.35)"}},invalid:{color:"#D9806B"}}});
    setTimeout(()=>{const node=document.getElementById("stripe-card-el");if(node)cardEl.mount(node);},50);
    stripeCardRef.current=cardEl;
    return()=>{cardEl.destroy();};
  },[creditCheckout]);

  const confirmCreditPurchase=async()=>{
    if(!stripeRef.current||!stripeCardRef.current||!creditCheckout)return;
    setCreditProcessing(true);
    setBoughtMsg("");
    const prof=getProfile();
    const{error}=await stripeRef.current.confirmCardPayment(creditCheckout.clientSecret,{
      payment_method:{card:stripeCardRef.current,billing_details:{name:prof.name,email:prof.email}}
    });
    if(error){setBoughtMsg(error.message);setCreditProcessing(false);}
    else{setCreditCheckout(null);setCreditProcessing(false);setBoughtMsg("✓ Credits added to your account!");}
  };

  const buyPack=(credits)=>startCreditCheckout(credits,null);
  const buyCustom=()=>{
    let v=Math.floor(+customDollars||0);
    if(v<5){setBoughtMsg("Minimum purchase is $5.");return;}
    if(v>100000){setBoughtMsg("Maximum purchase is $100,000.");return;}
    startCreditCheckout(null,v);
  };
  const notifs=(()=>{
    const ev=lsGet("events",[]); const tk=dayKey();
    const rel=(k)=>{const tomorrow=dayKey(new Date(Date.now()+86400000));if(k===tk)return"Today";if(k===tomorrow)return"Tomorrow";const p=k.split("-");return MON_SHORT[+p[1]-1]+" "+(+p[2]);};
    const up=ev.filter(e=>e.date>=tk).sort((a,b)=>a.date===b.date?((a.time||"")<(b.time||"")?-1:1):(a.date<b.date?-1:1)).slice(0,4)
      .map(e=>({icon:Icon.cal,title:e.title,sub:rel(e.date)+" · "+e.subject,color:T.blue}));
    const list=[{icon:Icon.flame,title:getStreak()+"-day streak going",sub:"Study today to keep it alive",color:T.amber}].concat(up);
    return list;
  })();
  useEffect(()=>{
    if(!focusRunning) return;
    const endTime=Date.now()+focusSecs*1000;
    const id=setInterval(()=>{
      setFocusSecs(Math.max(0,Math.round((endTime-Date.now())/1000)));
    },250);
    return ()=>clearInterval(id);
  },[focusRunning]);
  useEffect(()=>{ touchStreak(); },[]);
  useEffect(()=>{
    const lastDay=lsGet("lastLoginDay","");
    const today=dayKey();
    if(lastDay===today)return;
    lsSet("lastLoginDay",today);
    applyOverduePenalties();
    const evs=lsGet("events",[]);
    const cleaned=evs.filter(ev=>!(ev.status==="pending"&&ev.deadline&&ev.deadline<today));
    if(cleaned.length!==evs.length)lsSet("events",cleaned);
    const od=cleaned.filter(ev=>ev.status==="pending"&&ev.date<today&&!(ev.deadline&&ev.deadline<today));
    if(od.length>0){setOverdueForModal(od);setNewDayModal(true);}
  },[]);
  useEffect(()=>{
    if(focusSecs===0&&focusRunning){
      setFocusRunning(false);
      if(focusMode==="Focus"){ logSession(Math.max(1,Math.round(focusTotal/60)),"Focus"); }
      setFocusSecs(focusTotal);
    }
  },[focusSecs,focusRunning,focusMode,focusTotal]);
  const navSections=[
    {label:"Workspace",items:[
      {id:"dashboard",label:"Dashboard"},
      {id:"calendar",label:"Calendar"},
      {id:"aichat",label:"Chat"},
      {id:"essays",label:"Essays",badge:String(lsGet("essays",[]).length||"")},
      {id:"flashcards",label:"Flashcards"},
      {id:"notes",label:"Notes"},
      {id:"friends",label:"Friends & Chat"},
    ]},
    {label:"Tools",items:[
      {id:"solve",label:"Solve"},
      {id:"aitutor",label:"Tutor"},
      {id:"grammar",label:"Grammar & Polish"},
      {id:"humanizer",label:"Rewrite"},
    ]},
  ];
  const bottomItems=[{id:"settings",label:"Settings"},{id:"profile",label:"Profile"}];
  const pages={aichat:AiChat,essays:Essays,flashcards:Flashcards,notes:Notes,calendar:CalendarTab,friends:FriendsChat,solve:Solve,aitutor:AiTutor,grammar:GrammarPolish,humanizer:AiHumanizer,profile:Profile};
  const labelOf={dashboard:"Dashboard",aichat:"AI Chat",essays:"Essays",flashcards:"Flashcards",notes:"Notes",calendar:"Calendar",friends:"Friends & Chat",aitutor:"AI Tutor",grammar:"Grammar & Polish",humanizer:"Rewrite",settings:"Settings",profile:"Profile",solve:"Solve"};
  const sectionOf={dashboard:"Workspace",aichat:"Workspace",essays:"Workspace",flashcards:"Workspace",notes:"Workspace",calendar:"Workspace",friends:"Workspace",aitutor:"Tools",grammar:"Tools",humanizer:"Tools",solve:"Tools",settings:"Account",profile:"Account"};
  const ActivePage=pages[active];
  const isLight=T.mode==="light";
  if (!onboarded) return <InitWizard onComplete={()=>{setOnboarded(true);if(!lsGet("notifAsked",false))setTimeout(()=>setNotifPermModal(true),500);}} />;
  const sidebarText=isLight?"#F6F1E6":T.text;
  const sidebarMuted=isLight?"rgba(246,241,230,0.55)":T.muted;
  const sidebarFaint=isLight?"rgba(246,241,230,0.35)":T.faint;
  const sidebarBorder=isLight?"rgba(246,241,230,0.10)":T.border;
  const sidebarCardBg=isLight?"rgba(246,241,230,0.06)":T.card;
  const NavItem=({item})=>{
    const act=active===item.id;
    return (
      <div onClick={()=>setActive(item.id)} style={{display:"flex",alignItems:"center",gap:10,padding:"9px 11px",borderRadius:9,cursor:"pointer",fontSize:12.5,background:act?(isLight?"rgba(246,241,230,0.95)":`linear-gradient(100deg, ${T.lime}1c, ${T.lime}08)`):"transparent",color:act?(isLight?T.ink:T.lime):sidebarMuted,fontWeight:act?600:400,marginBottom:2,border:`1px solid ${act?(isLight?"transparent":T.lime+"30"):"transparent"}`,boxShadow:act&&!isLight?`0 4px 14px -8px ${T.lime}70`:"none",transition:"all 0.18s cubic-bezier(.2,.8,.2,1)"}}>
        <span style={{width:16,height:16,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,color:act?(isLight?T.ink:T.lime):sidebarFaint}}>{navIcon[item.id]}</span>
        <span style={{flex:1,letterSpacing:"0.01em"}}>{item.label}</span>
        {item.badge&&<span style={{background:T.lime+(act?"":"18"),color:act?T.ink:T.lime,fontSize:9,fontWeight:700,padding:"2px 6px",borderRadius:4,letterSpacing:"0.03em"}}>{item.badge}</span>}
      </div>
    );
  };
  return (
    <div style={{display:"flex",height:"100vh",overflow:"hidden",background:isLight?T.bg:`radial-gradient(1200px 600px at 78% -8%, ${T.glow}, transparent 60%), ${T.bg}`,fontFamily:T.font,color:T.text}}>
      {/* SIDEBAR */}
      <div style={{width:230,flexShrink:0,background:isLight?T.surface:"linear-gradient(180deg, #131840 0%, #0E133000 60%)",backgroundColor:isLight?T.surface:T.surface,display:"flex",flexDirection:"column",padding:"20px 12px",borderRight:`1px solid ${isLight?"transparent":T.border}`,overflowY:"auto"}}>
        <div style={{display:"flex",alignItems:"center",gap:10,padding:"0 6px",marginBottom:20}}>
          <div style={{width:28,height:28,background:"linear-gradient(135deg,#1C2250,#0E1238)",borderRadius:7,display:"flex",alignItems:"center",justifyContent:"center",boxShadow:`0 0 14px 3px ${T.lime}38`,flexShrink:0,position:"relative"}}>
            <div style={{width:9,height:9,borderRadius:"50%",background:`radial-gradient(circle at 35% 35%, ${T.limeLt}, ${T.lime})`,boxShadow:`0 0 10px 3px ${T.lime}65`}} />
          </div>
          <span style={{fontSize:16,fontWeight:700,color:sidebarText,letterSpacing:"-0.02em",fontFamily:T.font}}>Studlin</span>
        </div>
        <div onClick={()=>setActive("profile")} style={{background:sidebarCardBg,borderRadius:8,padding:"10px 12px",marginBottom:16,display:"flex",alignItems:"center",gap:10,cursor:"pointer",border:`1px solid ${sidebarBorder}`}}>
          <Av initials={getUserInitials()} color={T.lime} size={30} />
          <div><div style={{fontSize:12,fontWeight:600,color:sidebarText}}>{getUserName()}</div><div style={{fontSize:10,color:sidebarMuted}}>{getPlan()}</div></div>
        </div>
        {navSections.map(sec=>(
          <div key={sec.label}>
            <div style={{fontSize:9,fontWeight:700,letterSpacing:"0.1em",color:sidebarFaint,textTransform:"uppercase",padding:"0 6px",margin:"14px 0 5px"}}>{sec.label}</div>
            {sec.items.map(item=><NavItem key={item.id} item={item} />)}
          </div>
        ))}
        <div style={{margin:"14px 0 5px"}}>
          {bottomItems.map(item=><NavItem key={item.id} item={item} />)}
        </div>
        {/* AI credits card */}
        <div onClick={()=>setCreditsOpen(true)} style={{background:T.lime,borderRadius:12,padding:"12px 14px",marginTop:"auto",border:`1px solid ${T.limeDk}`,cursor:"pointer",position:"relative",overflow:"hidden",boxShadow:`0 12px 24px -12px ${T.lime}80`}}>
          <div style={{position:"absolute",right:-30,top:-30,width:90,height:90,background:"radial-gradient(circle,rgba(255,255,255,0.5),transparent 70%)",pointerEvents:"none"}} />
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",position:"relative"}}>
            <span style={{fontFamily:T.mono,fontSize:9,letterSpacing:"0.14em",fontWeight:600,color:"rgba(8,12,40,0.65)"}}>AI CREDITS</span>
            <span style={{fontFamily:T.mono,fontSize:9,letterSpacing:"0.14em",fontWeight:700,background:T.ink,color:T.lime,padding:"2px 6px",borderRadius:4}}>PRO</span>
          </div>
          <div style={{fontFamily:T.hand,fontSize:36,fontWeight:700,color:T.ink,lineHeight:0.85,marginTop:6}}>{getCredits()}<span style={{fontFamily:T.font,fontSize:13,fontWeight:500,color:"rgba(8,12,40,0.5)",marginLeft:2}}>/ {getCreditLimit()}</span></div>
          <div style={{fontSize:10.5,color:"rgba(8,12,40,0.6)",marginTop:2,position:"relative"}}>Resets in 12 days</div>
          <div style={{height:4,background:"rgba(8,12,40,0.15)",borderRadius:99,marginTop:10,overflow:"hidden"}}><div style={{height:"100%",width:Math.min(100,Math.round(getCredits()/getCreditLimit()*100))+"%",background:T.ink,borderRadius:99}} /></div>
        </div>
      </div>

      {/* MAIN AREA */}
      <div style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden",background:T.bg}}>
        {/* TOP BAR */}
        <div style={{display:"flex",alignItems:"center",gap:14,padding:"14px 28px",borderBottom:`1px solid ${T.border}`,background:T.bg,position:"sticky",top:0,zIndex:10,flexShrink:0}}>
          <div style={{fontFamily:T.mono,fontSize:11,letterSpacing:"0.14em",textTransform:"uppercase",color:T.muted,flexShrink:0}}>
            {sectionOf[active]} · <span style={{color:T.text,fontWeight:600}}>{labelOf[active]}</span>
          </div>
          <div style={{flex:1,maxWidth:480,marginLeft:"auto",display:"flex",alignItems:"center",gap:10,padding:"9px 14px",background:T.card,border:`1px solid ${T.border}`,borderRadius:99}}>
            <span style={{color:T.muted,display:"flex"}}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg></span>
            <input placeholder="Search notes, flashcards, essays, or ask AI…" style={{flex:1,background:"none",border:"none",outline:"none",color:T.text,fontSize:13,fontFamily:T.font}} />
            <span style={{fontFamily:T.mono,fontSize:10,background:T.bg,color:T.muted,padding:"2px 7px",borderRadius:5,border:`1px solid ${T.border}`}}>⌘ K</span>
          </div>
          {/* See Pricing button */}
          <button onClick={()=>setPricingOpen(true)} style={{display:"inline-flex",alignItems:"center",gap:7,padding:"8px 16px",background:T.lime,color:T.ink,border:"none",borderRadius:99,fontSize:13,fontWeight:700,cursor:"pointer",flexShrink:0,fontFamily:T.font,letterSpacing:"-0.005em",boxShadow:`0 4px 14px -4px ${T.lime}80`}}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
            See Pricing
          </button>
          <div style={{position:"relative",flexShrink:0}}>
          <button onClick={()=>{setNotifOpen(o=>!o);setNotifSeen(true);}} style={{width:36,height:36,display:"grid",placeItems:"center",borderRadius:10,background:notifOpen?T.lime+"18":T.card,border:`1px solid ${notifOpen?T.lime+"55":T.border}`,color:notifOpen?T.lime:T.text,position:"relative",cursor:"pointer"}}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
            {!notifSeen && notifs.length>0 && <span style={{position:"absolute",top:7,right:7,width:7,height:7,background:T.limeDk,border:`2px solid ${T.bg}`,borderRadius:"50%"}} />}
          </button>
          {notifOpen && (<>
            <div onClick={()=>setNotifOpen(false)} style={{position:"fixed",inset:0,zIndex:40}} />
            <div style={{position:"absolute",top:46,right:0,width:340,maxWidth:"86vw",background:T.card,border:`1px solid ${T.border}`,borderRadius:14,boxShadow:"0 24px 60px -16px rgba(0,0,0,0.5)",zIndex:50,overflow:"hidden",animation:"studlinPop 0.18s cubic-bezier(.2,.85,.3,1)"}}>
              <div style={{padding:"13px 16px",borderBottom:`1px solid ${T.border}`,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                <span style={{fontSize:13,fontWeight:700,color:T.white,letterSpacing:"-0.01em"}}>Notifications</span>
                <span onClick={()=>setNotifOpen(false)} style={{fontSize:11,color:T.lime,cursor:"pointer",fontWeight:600}}>Mark all read</span>
              </div>
              <div style={{maxHeight:360,overflowY:"auto"}}>
                {notifs.map((n,i)=>(
                  <div key={i} onClick={()=>{setActive("calendar");setNotifOpen(false);}} style={{display:"flex",gap:11,padding:"12px 16px",borderBottom:i<notifs.length-1?`1px solid ${T.border}`:"none",cursor:"pointer",alignItems:"flex-start"}}>
                    <span style={{width:30,height:30,borderRadius:8,flexShrink:0,background:n.color+"18",border:`1px solid ${n.color}33`,color:n.color,display:"grid",placeItems:"center"}}>{n.icon}</span>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{fontSize:12.5,color:T.text,fontWeight:600,lineHeight:1.3}}>{n.title}</div>
                      <div style={{fontSize:11,color:T.muted,marginTop:2}}>{n.sub}</div>
                    </div>
                  </div>
                ))}
              </div>
              <div onClick={()=>{setActive("settings");setNotifOpen(false);}} style={{padding:"11px 16px",borderTop:`1px solid ${T.border}`,background:T.bg,fontSize:11.5,color:T.muted,cursor:"pointer",textAlign:"center"}}>Notification settings</div>
            </div>
          </>)}
          </div>
          <button onClick={()=>setActive("profile")} style={{width:36,height:36,borderRadius:"50%",background:"linear-gradient(135deg,#FFD7B5,#FFC9D2)",display:"grid",placeItems:"center",fontWeight:600,fontSize:12,color:T.ink,border:`2px solid ${T.bg}`,cursor:"pointer",flexShrink:0,fontFamily:T.font}}>{getUserInitials()}</button>
        </div>

        {/* CONTENT */}
        <div key={active} data-page style={{flex:1,overflowY:"auto",padding:"24px 32px",animation:"studlinRise 0.45s cubic-bezier(.2,.8,.2,1) both"}}>
          {active==="dashboard"?<Dashboard setActive={setActive} focusSecs={focusSecs} focusRunning={focusRunning} setFocusRunning={setFocusRunning} setScheduleSettingsOpen={setScheduleSettingsOpen} seriousMode={seriousMode} />:
           active==="settings"?<SettingsTab theme={theme} setTheme={setTheme} accent={accent} setAccent={setAccent} density={density} setDensity={setDensity} seriousMode={seriousMode} setSeriousMode={setSeriousMode} />:
           ActivePage?<ActivePage />:null}
        </div>
      </div>

      {/* PRICING MODAL */}
      <Modal open={pricingOpen} onClose={()=>setPricingOpen(false)} title="Studlin plans" sub="Start free. Upgrade when you're ready. Cancel anytime." width={820}>
        <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:14}}>
          {[
            {
              name:"Free",price:"$0",per:"forever",tag:null,
              desc:"Get organized. No credit card needed.",
              features:["30 AI credits / month","AI tutor — Standard model","Manual flashcards & notes","Focus timer, calendar & planner","Streaks, XP & basic stats"],
              cta:"Get started free",variant:"subtle",
            },
            {
              name:"Pro",price:"$9.99",per:"/mo",tag:"7 DAYS FREE",
              desc:"The full study OS. Built for serious students.",
              features:["200 AI credits / month","AI tutor — all models + 4 study modes","Full essay suite + plagiarism check","AI flashcards from notes, PDFs & YouTube","Google Docs sync + AI Rewrite (Humanizer)","Unlimited grammar + readability scores","Squad leaderboards + 2× focus XP"],
              cta:"Start free trial",variant:"lime",featured:true,
            },
            {
              name:"Max",price:"$24.99",per:"/mo",tag:null,
              desc:"Maximum firepower. No limits, ever.",
              features:["500 AI credits / month","Everything in Pro, unlimited","Bulk ops — 100 flashcards at once","Advanced analytics & learning paths","Cosmetics shop + monthly tournaments","Priority support + 3× focus XP"],
              cta:"Upgrade to Max",variant:"ink",
            },
          ].map((plan,i)=>(
            <div key={i} style={{
              background:plan.featured?T.forest:T.card2,
              border:`1.5px solid ${plan.featured?T.lime+"44":T.border}`,
              borderRadius:18,
              padding:24,
              position:"relative",
              display:"flex",flexDirection:"column",
              boxShadow:plan.featured?`0 24px 48px -20px ${T.lime}30`:"none",
            }}>
              {plan.tag && (
                <div style={{position:"absolute",top:-11,left:18,background:T.lime,color:T.ink,fontFamily:T.mono,fontSize:10,fontWeight:700,letterSpacing:"0.14em",padding:"4px 10px",borderRadius:99}}>{plan.tag}</div>
              )}
              <div style={{fontSize:18,fontWeight:700,color:plan.featured?T.cream:T.white,letterSpacing:"-0.02em",marginBottom:4}}>{plan.name}</div>
              <div style={{display:"flex",alignItems:"baseline",gap:5,margin:"8px 0 6px"}}>
                <span style={{fontFamily:T.hand,fontSize:50,fontWeight:700,lineHeight:0.9,color:plan.featured?T.lime:T.text,letterSpacing:"-0.02em"}}>{plan.price}</span>
                <span style={{fontSize:13,color:T.muted}}>{plan.per}</span>
              </div>
              <div style={{fontSize:13,color:plan.featured?"rgba(246,241,230,0.7)":T.muted,marginBottom:18,lineHeight:1.5}}>{plan.desc}</div>
              <ul style={{listStyle:"none",padding:0,margin:"0 0 20px",display:"flex",flexDirection:"column",gap:9,flex:1}}>
                {plan.features.map((f,j)=>(
                  <li key={j} style={{display:"flex",gap:9,fontSize:13,color:plan.featured?T.cream:T.text,lineHeight:1.45,alignItems:"flex-start"}}>
                    <span style={{width:16,height:16,borderRadius:"50%",background:T.lime,color:T.ink,display:"grid",placeItems:"center",flex:"none",marginTop:1}}>
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                    </span>
                    {f}
                  </li>
                ))}
              </ul>
              <button onClick={()=>setPricingOpen(false)} style={{
                width:"100%",padding:"11px",borderRadius:99,
                fontWeight:600,fontSize:14,cursor:"pointer",fontFamily:T.font,
                border:plan.variant==="subtle"?`1px solid ${T.border}`:"none",
                background:plan.variant==="lime"?T.lime:plan.variant==="ink"?T.ink:T.card,
                color:plan.variant==="lime"?T.ink:plan.variant==="ink"?T.cream:T.text,
                transition:"opacity .15s",
              }}>{plan.cta}</button>
            </div>
          ))}
        </div>
        <div style={{marginTop:20,padding:"16px 18px",background:T.card2,borderRadius:12,border:`1px solid ${T.border}`,display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:12}}>
          <div style={{fontSize:13,color:T.text,fontWeight:500}}>
            Grammarly + Quizlet + ChatGPT + Notion = <span style={{color:T.red,fontWeight:700}}>$55/mo</span>.&nbsp;&nbsp;Pro is <span style={{color:T.lime,fontWeight:700}}>$9.99</span>.
          </div>
          <div style={{fontSize:12,color:T.muted}}>All plans include a 14-day money-back guarantee. No credit card for Free or trial.</div>
        </div>
      </Modal>
      <Modal open={creditsOpen} onClose={()=>{setCreditsOpen(false);setCreditCheckout(null);setBoughtMsg("");}} title={creditCheckout?"Complete purchase":"AI Credits"} sub={creditCheckout?("Purchase "+creditCheckout.label+" for "+creditCheckout.price):"Every AI action uses credits. Top up, upgrade, or just check your balance."} width={620}
        footer={creditCheckout
          ?<><Btn variant="subtle" onClick={()=>{setCreditCheckout(null);setBoughtMsg("");}}>← Back</Btn><Btn onClick={confirmCreditPurchase} disabled={creditProcessing} style={{background:T.lime,color:T.ink}}>{creditProcessing?"Processing...":"Pay "+creditCheckout.price}</Btn></>
          :<><Btn variant="subtle" onClick={()=>setCreditsOpen(false)}>Close</Btn></>}>

        {creditCheckout ? (
          <div>
            <div style={{background:T.lime,borderRadius:14,padding:"18px 20px",marginBottom:20,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <div>
                <div style={{fontFamily:T.mono,fontSize:10,letterSpacing:"0.14em",fontWeight:600,color:"rgba(8,12,40,0.6)"}}>YOU'RE BUYING</div>
                <div style={{fontFamily:T.hand,fontSize:36,fontWeight:700,color:T.ink,lineHeight:0.9,marginTop:4}}>{creditCheckout.label}</div>
              </div>
              <div style={{fontFamily:T.hand,fontSize:36,fontWeight:700,color:T.ink}}>{creditCheckout.price}</div>
            </div>
            <div id="stripe-card-el" style={{padding:"14px 16px",border:"1.5px solid "+T.border,borderRadius:12,background:T.card,marginBottom:12,minHeight:22}}></div>
            {boughtMsg&&<div style={{fontSize:12.5,color:boughtMsg.startsWith("✓")?T.lime:T.red,fontWeight:600,marginTop:8}}>{boughtMsg}</div>}
            <div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:6,fontSize:11,color:T.muted,marginTop:12}}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>
              Secured by Stripe · 256-bit encryption
            </div>
          </div>
        ) : (
          <>
            <div style={{background:T.lime,borderRadius:14,padding:"20px 22px",position:"relative",overflow:"hidden",marginBottom:18}}>
              <div style={{position:"absolute",right:-30,top:-30,width:160,height:160,background:"radial-gradient(circle,rgba(255,255,255,0.45),transparent 70%)",pointerEvents:"none"}} />
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",position:"relative"}}>
                <div>
                  <div style={{fontFamily:T.mono,fontSize:10,letterSpacing:"0.14em",fontWeight:600,color:"rgba(8,12,40,0.6)"}}>CURRENT BALANCE</div>
                  <div style={{fontFamily:T.hand,fontSize:54,fontWeight:700,color:T.ink,lineHeight:0.9,marginTop:4}}>{getCredits()}<span style={{fontFamily:T.font,fontSize:18,fontWeight:500,color:"rgba(8,12,40,0.55)",marginLeft:4}}>/ {getCreditLimit()}</span></div>
                  <div style={{fontSize:12,color:"rgba(8,12,40,0.65)",marginTop:4}}>Resets in 12 days · {getCreditLimit()-getCredits()} used this cycle</div>
                </div>
                <span style={{fontFamily:T.mono,fontSize:10,letterSpacing:"0.16em",fontWeight:700,background:T.ink,color:T.lime,padding:"4px 8px",borderRadius:5}}>PRO</span>
              </div>
              <div style={{height:5,background:"rgba(8,12,40,0.15)",borderRadius:99,marginTop:14,overflow:"hidden",position:"relative"}}><div style={{height:"100%",width:Math.min(100,Math.round(getCredits()/getCreditLimit()*100))+"%",background:T.ink,borderRadius:99}} /></div>
            </div>

            <div style={{fontSize:11,fontWeight:700,letterSpacing:"0.1em",color:T.muted,textTransform:"uppercase",marginBottom:10}}>Quick top-up</div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:8,marginBottom:18}}>
              {[
                {n:150,p:"$4.99",save:null},
                {n:500,p:"$14.99",save:"−17%"},
                {n:1000,p:"$24.99",save:"−31%",featured:true},
                {n:3000,p:"$59.99",save:"−45%"},
              ].map((pk,i)=>(
                <div key={i} onClick={()=>buyPack(pk.n)} style={{background:pk.featured?T.ink:T.card2,color:pk.featured?T.cream:T.text,borderRadius:10,padding:14,border:`1px solid ${pk.featured?T.ink:T.border}`,cursor:"pointer",position:"relative",transition:"transform 0.15s"}}>
                  <div style={{fontFamily:T.hand,fontSize:34,fontWeight:700,color:pk.featured?T.lime:T.text,lineHeight:0.9,letterSpacing:"-0.01em"}}>{pk.n.toLocaleString()}</div>
                  <div style={{fontFamily:T.mono,fontSize:9,letterSpacing:"0.14em",color:pk.featured?"rgba(246,241,230,0.5)":T.muted,marginTop:2}}>CREDITS</div>
                  <div style={{fontSize:16,fontWeight:600,marginTop:6,letterSpacing:"-0.02em"}}>{pk.p}</div>
                  {pk.save && <div style={{fontFamily:T.mono,fontSize:9,letterSpacing:"0.14em",fontWeight:700,color:pk.featured?T.lime:T.limeDk,marginTop:4}}>SAVE {pk.save}</div>}
                </div>
              ))}
            </div>

            <div style={{fontSize:11,fontWeight:700,letterSpacing:"0.1em",color:T.muted,textTransform:"uppercase",marginBottom:10}}>Buy a custom amount</div>
            <div style={{display:"flex",gap:10,alignItems:"stretch",marginBottom:8,flexWrap:"wrap"}}>
              <div style={{flex:1,minWidth:220,display:"flex",alignItems:"center",gap:8,background:T.card2,border:`1px solid ${T.border}`,borderRadius:10,padding:"6px 14px"}}>
                <span style={{fontSize:20,color:T.muted,fontWeight:600}}>$</span>
                <input type="number" min="5" max="100000" value={customDollars} onChange={e=>setCustomDollars(e.target.value)} onKeyDown={e=>{if(e.key==="Enter")buyCustom();}} placeholder="Enter any amount" style={{flex:1,minWidth:60,background:"none",border:"none",outline:"none",color:T.text,fontSize:18,fontWeight:600,fontFamily:T.font}} />
                <span style={{fontSize:12,color:T.muted,whiteSpace:"nowrap"}}>≈ {Math.round(Math.min(100000,Math.max(0,+customDollars||0))*30).toLocaleString()} credits</span>
              </div>
              <button onClick={buyCustom} style={{background:T.lime,color:T.ink,border:"none",borderRadius:10,padding:"0 24px",fontSize:14,fontWeight:700,cursor:"pointer",fontFamily:T.font}}>Buy now</button>
            </div>
            {boughtMsg&&<div style={{fontSize:12.5,color:boughtMsg.startsWith("✓")?T.lime:T.red,fontWeight:600,marginBottom:8}}>{boughtMsg}</div>}
            <div style={{fontSize:11,color:T.muted,marginBottom:18}}>Buy any amount you want — $5 minimum, $100,000 max. Roughly 30 credits per $1.</div>

            <div style={{fontSize:11,fontWeight:700,letterSpacing:"0.1em",color:T.muted,textTransform:"uppercase",marginBottom:10}}>What costs what</div>
            <div style={{background:T.card2,border:`1px solid ${T.border}`,borderRadius:10,padding:"4px 14px"}}>
              {[["AI chat · Standard / Flash","1"],["AI chat · Pro","2"],["AI chat · Reasoning","3"],["Citation generation","1"],["File upload + analysis","2"],["Plagiarism check","2"],["AI Humanizer run","2"],["Full essay analysis","3"],["Practice test generation","4"]].map(([k,v],i)=>(
                <div key={i} style={{display:"flex",justifyContent:"space-between",padding:"9px 0",borderBottom:i<8?`1px solid ${T.border}`:"none",fontSize:13}}>
                  <span style={{color:T.text}}>{k}</span>
                  <span style={{fontFamily:T.mono,fontWeight:600,color:T.lime}}>{v}</span>
                </div>
              ))}
            </div>

            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginTop:16,padding:"12px 14px",background:T.card2,borderRadius:10,border:`1px solid ${T.border}`}}>
              <div>
                <div style={{fontSize:12.5,color:T.text,fontWeight:600}}>Hit your cap often?</div>
                <div style={{fontSize:11.5,color:T.muted,marginTop:2}}>Max plan gives you 500 credits / month.</div>
              </div>
              <a href="checkout.html?plan=max&billing=monthly" style={{display:"inline-flex",alignItems:"center",gap:6,padding:"7px 14px",borderRadius:7,fontSize:12,fontWeight:600,background:T.ink,color:T.lime,textDecoration:"none",fontFamily:T.font}}>Upgrade to Max</a>
            </div>
          </>
        )}
      </Modal>

      {timerTask&&<TaskTimerModal task={timerTask} onClose={()=>setTimerTask(null)} onComplete={(mins)=>{
        logSession(mins,"Task: "+timerTask.title);
        const next=lsGet("events",[]).map(ev=>ev.id===timerTask.id?{...ev,status:"done",timeSpent:mins,completedAt:Date.now()}:ev);
        lsSet("events",next);
        setTimerTask(null);
      }} />}

      {newDayModal&&(
        <div onClick={()=>setNewDayModal(false)} style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.6)",backdropFilter:"blur(8px)",WebkitBackdropFilter:"blur(8px)",zIndex:1000,display:"flex",alignItems:"center",justifyContent:"center",padding:24,animation:"studlinFade 0.2s ease"}}>
          <div onClick={e=>e.stopPropagation()} style={{width:"100%",maxWidth:500,background:T.card,borderRadius:18,border:`1px solid ${T.border}`,padding:"32px 28px",animation:"studlinPop 0.22s cubic-bezier(.2,.85,.3,1)",boxShadow:"0 24px 60px -16px rgba(0,0,0,0.5)"}}>
            <div style={{fontSize:22,fontWeight:700,color:T.white,marginBottom:6,letterSpacing:"-0.02em"}}>Welcome back</div>
            <div style={{fontSize:13.5,color:T.muted,marginBottom:20,lineHeight:1.6}}>You have <strong style={{color:T.amber}}>{overdueForModal.length} unfinished task{overdueForModal.length!==1?"s":""}</strong> from a previous day. Reschedule them into open slots today?</div>
            <div style={{display:"flex",flexDirection:"column",gap:7,marginBottom:22,maxHeight:220,overflowY:"auto"}}>
              {overdueForModal.map(ev=>(
                <div key={ev.id} style={{display:"flex",alignItems:"center",gap:10,padding:"9px 12px",background:T.card2,borderRadius:8,border:`1px solid ${T.border}`}}>
                  <div style={{width:6,height:6,borderRadius:"50%",background:T.amber,flexShrink:0}}/>
                  <div style={{flex:1,fontSize:13,color:T.text,fontWeight:500}}>{ev.title}</div>
                  <div style={{fontSize:11,color:T.muted,flexShrink:0}}>{ev.duration||25}m · {ev.subject||"Study"}</div>
                </div>
              ))}
            </div>
            <div style={{display:"flex",gap:10}}>
              <Btn onClick={()=>{
                const today=dayKey();
                const now=new Date();
                let slotMins=now.getHours()*60+now.getMinutes()+15;
                const evs=lsGet("events",[]);
                const rescheduled=evs.map(ev=>{
                  const od=overdueForModal.find(o=>o.id===ev.id);
                  if(!od)return ev;
                  const h=Math.floor(slotMins/60)%24;
                  const m=slotMins%60;
                  const timeStr=String(h).padStart(2,"0")+":"+String(m).padStart(2,"0");
                  slotMins+=((od.duration||25)+10);
                  return {...ev,date:today,time:timeStr,status:"pending"};
                });
                lsSet("events",rescheduled);
                setNewDayModal(false);
              }} style={{flex:1,justifyContent:"center",padding:"12px 0"}}>Reschedule all</Btn>
              <Btn variant="ghost" onClick={()=>setNewDayModal(false)} style={{flex:1,justifyContent:"center",padding:"12px 0"}}>Skip for now</Btn>
            </div>
          </div>
        </div>
      )}

      <ScheduleSettingsPanel open={scheduleSettingsOpen} onClose={()=>setScheduleSettingsOpen(false)} onSave={()=>{}} />

      <style>{`
        @keyframes studlinPulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.5;transform:scale(0.7)} }
        @keyframes studlinFade { from{opacity:0} to{opacity:1} }
        @keyframes studlinPop { from{opacity:0;transform:scale(0.96) translateY(8px)} to{opacity:1;transform:none} }
        @keyframes studlinRise {
          0% { opacity:0; transform: perspective(1100px) rotateX(7deg) translateY(26px) scale(.985); filter: blur(4px); }
          65% { filter: blur(0); }
          100% { opacity:1; transform: none; }
        }
        @keyframes studlinChild {
          0% { opacity:0; transform: perspective(900px) rotateX(10deg) translateY(18px); }
          100% { opacity:1; transform: none; }
        }
        [data-page] { transform-style: preserve-3d; }
        [data-page] > * { animation: studlinChild .55s cubic-bezier(.2,.85,.25,1.1) both; }
        [data-page] > *:nth-child(1) { animation-delay: 0s; }
        [data-page] > *:nth-child(2) { animation-delay: .07s; }
        [data-page] > *:nth-child(3) { animation-delay: .14s; }
        [data-page] > *:nth-child(4) { animation-delay: .21s; }
        [data-page] > *:nth-child(n+5) { animation-delay: .28s; }
        [data-card] { transition: transform .3s cubic-bezier(.2,.9,.3,1.2), box-shadow .3s ease, border-color .2s ease; }
        [data-card]:hover { transform: translateY(-3px); box-shadow: 0 16px 36px -18px rgba(0,0,0,0.45); }
        button { transition: transform .15s ease, filter .2s ease, background .2s ease, color .2s ease, border-color .2s ease, opacity .2s ease; }
        button:active { transform: scale(.96); }
        @media (prefers-reduced-motion: reduce) {
          [data-page], [data-page] > * { animation: none !important; }
        }
        body[data-density="Compact"] [data-page] { padding: 14px 22px !important; }
        body[data-density="Spacious"] [data-page] { padding: 38px 50px !important; }

        /* ── Light mode contrast overrides ── */
        body[data-theme="light"] input[type="range"] {
          -webkit-appearance: none; appearance: none;
          height: 6px; border-radius: 3px; outline: none; cursor: pointer;
          background: rgba(8,12,40,0.14);
        }
        body[data-theme="light"] input[type="range"]::-webkit-slider-runnable-track {
          height: 6px; border-radius: 3px; background: rgba(8,12,40,0.14);
        }
        body[data-theme="light"] input[type="range"]::-moz-range-track {
          height: 6px; border-radius: 3px; background: rgba(8,12,40,0.14);
        }
        body[data-theme="light"] input[type="range"]::-webkit-slider-thumb {
          -webkit-appearance: none; width: 16px; height: 16px; border-radius: 50%;
          background: #ffffff; border: 2px solid rgba(8,12,40,0.30);
          box-shadow: 0 1px 4px rgba(8,12,40,0.18); margin-top: -5px; cursor: pointer;
        }
        body[data-theme="light"] input[type="range"]::-moz-range-thumb {
          width: 16px; height: 16px; border-radius: 50%;
          background: #ffffff; border: 2px solid rgba(8,12,40,0.30);
          box-shadow: 0 1px 4px rgba(8,12,40,0.18); cursor: pointer;
        }
        body[data-theme="light"] input:not([type="range"]):not([type="checkbox"]):not([type="radio"]):focus,
        body[data-theme="light"] textarea:focus,
        body[data-theme="light"] select:focus {
          border-color: rgba(8,12,40,0.45) !important;
          box-shadow: 0 0 0 3px rgba(79,127,232,0.18);
        }
        body[data-theme="light"] [data-card]:hover {
          box-shadow: 0 8px 24px -10px rgba(8,12,40,0.14);
        }
      `}</style>
      {notifPermModal && <NotifPermModal onAllow={handleNotifAllow} onDeny={handleNotifDeny} />}
    </div>
  );
}


// Mount
ReactDOM.createRoot(document.getElementById('root')).render(<AuthGate />);
