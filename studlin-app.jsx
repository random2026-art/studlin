const { useState, useEffect, useRef, useMemo } = React;

// ─── DESIGN TOKENS · dark + light themes ──────────────────────────────────────
const darkT = {
  bg:     "#0D120F",
  surface:"#141A16",
  card:   "#19211C",
  card2:  "#212A24",
  border: "rgba(255,255,255,0.07)",
  borderHover: "rgba(255,255,255,0.14)",
  lime:   "#AECE5E",
  limeDk: "#8BAE3C",
  limeLt: "#CBDF92",
  glow:   "rgba(174,206,94,0.22)",
  text:   "#E8EFE7",
  muted:  "#849389",
  faint:  "#3F5147",
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
  forest: "#14342A",
  ink:    "#0E1F18",
  cream:  "#F6F1E6",
  font:   `"Geist", -apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif`,
  hand:   `"Bricolage Grotesque", "Geist", sans-serif`,
  serif:  `"Instrument Serif", serif`,
  mono:   `"JetBrains Mono", ui-monospace, monospace`,
  mode:   "dark",
};
const lightT = {
  bg:     "#FAF6EC",
  surface:"#14342A",
  card:   "#ffffff",
  card2:  "#F0EBE0",
  border: "rgba(14,31,24,0.18)",
  borderHover: "rgba(14,31,24,0.32)",
  lime:   "#9EC83D",
  limeDk: "#7FA82A",
  limeLt: "#CBDF92",
  glow:   "rgba(158,200,61,0.20)",
  text:   "#0E1F18",
  muted:  "rgba(14,31,24,0.55)",
  faint:  "rgba(14,31,24,0.30)",
  white:  "#14342A",
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
  forest: "#14342A",
  ink:    "#0E1F18",
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
  Lime:  {dk:{lime:"#AECE5E",limeDk:"#8BAE3C",limeLt:"#CBDF92"}, lt:{lime:"#6E9C35",limeDk:"#57802A",limeLt:"#DCE9C0"}},
  Forest:{dk:{lime:"#6FC1A0",limeDk:"#4E9C7B",limeLt:"#A9E0CB"}, lt:{lime:"#2E8E6E",limeDk:"#227056",limeLt:"#A9E0CB"}},
  Sky:   {dk:{lime:"#84BBEA",limeDk:"#5A93C9",limeLt:"#BFE0FA"}, lt:{lime:"#2D74BC",limeDk:"#225A98",limeLt:"#BFE0FA"}},
  Lilac: {dk:{lime:"#B89BE0",limeDk:"#9474C9",limeLt:"#DCCBF5"}, lt:{lime:"#7E5BC0",limeDk:"#634599",limeLt:"#DCCBF5"}},
  Peach: {dk:{lime:"#E8A06E",limeDk:"#C9764A",limeLt:"#F5C9AC"}, lt:{lime:"#C2683A",limeDk:"#A4542C",limeLt:"#F5C9AC"}},
};
function applyTheme(name, accent, density) {
  Object.assign(T, name === 'light' ? lightT : darkT);
  const acc=ACCENTS[accent]||ACCENTS.Lime;
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
  (typeof localStorage !== 'undefined' && localStorage.getItem('studlin-accent')) || 'Lime',
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
  mic:       ic(<><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></>),
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
  sparkles:  ic(<><path d="m12 3-1.9 4.6a2.5 2.5 0 0 1-1.5 1.5L4 11l4.6 1.9a2.5 2.5 0 0 1 1.5 1.5L12 19l1.9-4.6a2.5 2.5 0 0 1 1.5-1.5L20 11l-4.6-1.9a2.5 2.5 0 0 1-1.5-1.5L12 3Z"/><path d="M19 3v3M17.5 4.5h3"/></>),
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
// Thresholds unchanged from the old XP ladder, just re-denominated as real
// focus minutes instead of points — 1000 minutes (~16.7 hours) to reach
// Associate is a clean, honest, achievable milestone the old points system
// never really had (its "points" were inflated by streak/login/task bonuses).
const PROF_TIERS=[
  {title:"Intern",        minMinutes:0},
  {title:"Associate",     minMinutes:1000},
  {title:"Analyst",       minMinutes:3000},
  {title:"Senior Analyst",minMinutes:7500},
  {title:"Manager",       minMinutes:15000},
  {title:"Senior Manager",minMinutes:30000},
  {title:"Director",      minMinutes:55000},
  {title:"VP",            minMinutes:90000},
  {title:"SVP",           minMinutes:140000},
  {title:"C-Suite",       minMinutes:200000},
  {title:"CEO",           minMinutes:300000},
];
function getProfTitle(minutes){let t=PROF_TIERS[0];for(const r of PROF_TIERS){if(minutes>=r.minMinutes)t=r;else break;}return t.title;}
function tierProgressFor(minutes){let idx=0;for(let i=0;i<PROF_TIERS.length;i++){if(minutes>=PROF_TIERS[i].minMinutes)idx=i;}const cur=PROF_TIERS[idx],next=PROF_TIERS[idx+1]||null;const pct=next?Math.round(Math.max(0,Math.min(100,(minutes-cur.minMinutes)/(next.minMinutes-cur.minMinutes)*100))):100;return {title:cur.title,next,pct};}

// ─── PUSH NOTIFICATIONS (FCM) ────────────────────────────────────────────────
// To enable real desktop push delivery, replace the placeholder below with
// your Web Push certificate key pair from Firebase Console:
//   console.firebase.google.com → studlin-cb78b → Project Settings →
//   Cloud Messaging → Web configuration → Web Push certificates → Generate key pair
// Also requires FIREBASE_SERVICE_ACCOUNT set in Vercel's env vars so
// api/notify.js can actually call admin.messaging().send() — see api/_lib/firebase-admin.js.
const FCM_VAPID_KEY = "BAgeXH3hA5APFcYuopRiB_7dBey6w1cYHStHBG-b8jnYA3941-4D1pQKILfsfNCjI3Ot2S5BTAwvEMgohR9ubmA";
const FCM_CONFIGURED = FCM_VAPID_KEY !== "REPLACE_WITH_VAPID_KEY_FROM_FIREBASE_CONSOLE";

// ─── GOOGLE DOCS INTEGRATION ─────────────────────────────────────────────────
// To enable one-click export to Google Docs, replace the placeholder below
// with your OAuth 2.0 Client ID from Google Cloud Console:
//   console.cloud.google.com → APIs & Services → Credentials → Create OAuth Client ID (Web)
//   Authorized JS origin: https://studlin.vercel.app
//   Also enable: Drive API (googleapis.com/drive/v3)
const GOOGLE_OAUTH_CLIENT_ID = "16831354472-bsq7nhbg1jbrovhj69sib9f9fmg4jag2.apps.googleusercontent.com";
const GDOCS_CONFIGURED = GOOGLE_OAUTH_CLIENT_ID !== "YOUR_GOOGLE_OAUTH_CLIENT_ID.apps.googleusercontent.com";

// Gates the "seed mock Canvas data" dev-only button in Settings > Integrations.
// This app has no build step (Babel-in-browser via CDN), so there is no
// process.env to read client-side — a plain runtime check is the only option.
const DEV_MODE = location.hostname==="localhost" || location.hostname==="127.0.0.1";

async function createGoogleDoc(essay) {
  if (!GDOCS_CONFIGURED) throw new Error("GOOGLE_OAUTH_CLIENT_ID not configured");
  if (typeof google === "undefined" || !google.accounts) throw new Error("Google Identity Services not loaded");
  const htmlContent = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>${essay.title}</title></head><body>${essay.content||"<p></p>"}</body></html>`;
  return new Promise(function(resolve, reject) {
    const tokenClient = google.accounts.oauth2.initTokenClient({
      client_id: GOOGLE_OAUTH_CLIENT_ID,
      scope: "https://www.googleapis.com/auth/drive.file",
      callback: async function(tokenResponse) {
        if (tokenResponse.error) { reject(new Error(tokenResponse.error)); return; }
        try {
          const boundary = "studlin_gdoc_boundary";
          const metadata = JSON.stringify({ name: essay.title||"Untitled", mimeType: "application/vnd.google-apps.document" });
          const body = "--"+boundary+"\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n"+metadata+"\r\n--"+boundary+"\r\nContent-Type: text/html\r\n\r\n"+htmlContent+"\r\n--"+boundary+"--";
          const res = await fetch("https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart", {
            method: "POST",
            headers: { "Authorization": "Bearer "+tokenResponse.access_token, "Content-Type": "multipart/related; boundary="+boundary },
            body: body,
          });
          const data = await res.json();
          if (data.id) { resolve("https://docs.google.com/document/d/"+data.id+"/edit"); }
          else { reject(new Error(data.error?.message||"Failed to create document")); }
        } catch(e) { reject(e); }
      },
    });
    tokenClient.requestAccessToken({ prompt: "" });
  });
}

// ─── SHARED PRIMITIVES ────────────────────────────────────────────────────────
const Btn = ({children,onClick,style={},variant="lime",disabled=false}) => {
  const base = {display:"inline-flex",alignItems:"center",gap:7,padding:"9px 18px",borderRadius:7,fontSize:12,fontWeight:600,cursor:disabled?"not-allowed":"pointer",border:"none",fontFamily:T.font,letterSpacing:"0.01em",transition:"opacity 0.15s"};
  const variants = {
    lime:{background:T.lime,color:T.bg},
    ghost:{background:"transparent",color:T.muted,border:`1px solid ${T.border}`},
    subtle:{background:T.card2,color:T.text,border:`1px solid ${T.border}`},
    danger:{background:"rgba(224,90,71,0.1)",color:T.red,border:"1px solid rgba(224,90,71,0.2)"},
  };
  return <button onClick={onClick} disabled={disabled} style={{...base,...variants[variant],...style}}>{children}</button>;
};
const BtnSm = ({children,onClick,style={},variant="lime",disabled=false}) => <Btn onClick={onClick} disabled={disabled} style={{padding:"5px 12px",fontSize:11,...style}} variant={variant}>{children}</Btn>;

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
// ─── GUIDED TAB TOUR ──────────────────────────────────────────────────────────
// Lightweight first-run coachmark: given targetRef, it draws a spotlight ring
// around that element (via a single box-shadow-as-backdrop trick — clicks on
// the rest of the page still pass through, so the user can follow along by
// actually clicking the highlighted control) and anchors a callout next to
// it. With no targetRef it renders the same callout as a blocking centered
// card instead, for steps that aren't about one specific control.
function TourStep({ targetRef, title, body, step, total, onNext, onSkip, isLast }) {
  const [rect, setRect] = useState(null);
  useEffect(() => {
    setRect(null);
    if (!targetRef) return;
    let cancelled = false;
    let pollId = null;
    // targetRef.current read here always reflects the *previous* commit —
    // callers that open a modal to reveal the target do so from their own
    // effect, one render after this one starts, so a plain "current is
    // still null" check misses it permanently. Poll briefly until it
    // mounts instead of depending on ref identity in the deps array.
    const tryMeasure = () => {
      if (cancelled) return;
      if (targetRef.current) setRect(targetRef.current.getBoundingClientRect());
      else pollId = setTimeout(tryMeasure, 50);
    };
    tryMeasure();
    window.addEventListener("resize", tryMeasure);
    return () => { cancelled = true; if (pollId) clearTimeout(pollId); window.removeEventListener("resize", tryMeasure); };
  }, [targetRef, step]);

  const anchored = !!rect;
  const vw = typeof window!=="undefined"?window.innerWidth:1200;
  const vh = typeof window!=="undefined"?window.innerHeight:800;
  const calloutStyle = anchored
    ? { position:"fixed", top:Math.min(rect.bottom+14, vh-240), left:Math.max(16,Math.min(rect.left, vw-336)), width:320 }
    : { position:"fixed", top:"50%", left:"50%", transform:"translate(-50%,-50%)", width:380 };

  // Portaled straight to <body> — the tab content wrapper has a CSS
  // `animation` targeting `transform`, which per spec makes it a permanent
  // containing block for `position:fixed` descendants (not just while the
  // animation is actively running). Left in place, this callout's "fixed"
  // coordinates would be relative to that wrapper's box instead of the
  // viewport, landing the callout hundreds of pixels off from its target.
  return ReactDOM.createPortal((
    <div style={{position:"fixed",inset:0,zIndex:900,animation:"studlinFade 0.18s ease-out"}}>
      {anchored ? (
        <div style={{position:"fixed",top:rect.top-8,left:rect.left-8,width:rect.width+16,height:rect.height+16,borderRadius:12,border:`2px solid ${T.lime}`,boxShadow:"0 0 0 4000px rgba(8,12,10,0.6)",pointerEvents:"none"}} />
      ) : (
        <div style={{position:"absolute",inset:0,background:"rgba(8,12,10,0.6)",backdropFilter:"blur(4px)"}} />
      )}
      <div data-tour-callout style={{...calloutStyle, background:T.card, border:`1px solid ${T.border}`, borderRadius:14, padding:"18px 20px", boxShadow:"0 24px 60px -16px rgba(0,0,0,0.55)", zIndex:910, animation:"studlinPop 0.2s cubic-bezier(.2,.85,.3,1)"}}>
        <div style={{display:"flex",gap:5,marginBottom:12}}>
          {Array.from({length: total}).map((_,i)=>(
            <div key={i} style={{height:3,flex:1,borderRadius:99,background:i<=step?T.lime:T.border}} />
          ))}
        </div>
        <div style={{fontSize:14.5,fontWeight:700,color:T.white,marginBottom:6,letterSpacing:"-0.01em"}}>{title}</div>
        <div style={{fontSize:12.5,color:T.text,lineHeight:1.55,marginBottom:16}}>{body}</div>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <button onClick={onSkip} style={{background:"none",border:"none",color:T.muted,fontSize:12,cursor:"pointer",fontFamily:T.font,padding:0}}>Skip guide</button>
          <BtnSm onClick={onNext}>{isLast?"Done":"Next"}</BtnSm>
        </div>
      </div>
    </div>
  ), document.body);
}

// ─── PRICING PLAN CARDS ───────────────────────────────────────────────────────
// Shared by the "See Pricing" nav-bar modal and the full-screen post-tour
// paywall intercept — same 3 plans, same billing-aware pricing (mirrors
// checkout.html's PLAN_DATA), just rendered inside different wrappers.
const PRICING_PLANS=(billing)=>([
  {
    key:"free",name:"Free",price:"$0",per:"forever",tag:null,
    desc:"Get organized. No credit card needed.",
    features:["20 AI credits / month","Basic AI chat (Flash model)","Manual flashcards & notes — unlimited","Calendar, tasks & focus timer","Streaks & XP"],
    cta:"Get started free",variant:"subtle",
  },
  {
    key:"pro",name:"Pro",price:billing==="annual"?"$7.99":"$9.99",per:billing==="annual"?"/mo · billed yearly":"/mo",tag:"7 DAYS FREE",
    desc:"Everything on Free is still manual. Pro is where the AI actually does the work.",
    features:["200 AI credits / month (10× more)","All AI models — Flash, Standard & Research","AI flashcards from notes, PDFs & YouTube","Full essay suite — grammar, rewrite & citations","AI note cleanup, syllabus scan & study groups"],
    cta:"Start free trial",variant:"lime",featured:true,
  },
  {
    key:"max",name:"Max",price:billing==="annual"?"$19.99":"$24.99",per:billing==="annual"?"/mo · billed yearly":"/mo",tag:null,
    desc:"For the heaviest workload: every subject, every week, no caps.",
    features:["500 AI credits / month","Everything in Pro","Priority AI — faster responses, no queue","Bulk flashcard generation — 100 at once","3× XP multiplier + advanced analytics"],
    cta:"Upgrade to Max",variant:"ink",
  },
]);
function PlanCards({ billing, onSelect }) {
  return (
    <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:14}}>
      {PRICING_PLANS(billing).map((plan,i)=>(
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
          <div style={{fontSize:18,fontWeight:700,color:plan.featured?T.cream:T.text,letterSpacing:"-0.02em",marginBottom:4}}>{plan.name}</div>
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
          <button onClick={()=>onSelect(plan.key)} style={{
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
  );
}

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
// Custom Hour / Minute / AM-PM dropdown trio — mobile-friendly native
// <select> controls, no typing required. Same 24h "HH:MM" value/onChange
// contract as before, so every call site is unaffected.
const TIME_HOURS_12=Array.from({length:12},(_,i)=>i+1);
const TIME_MINUTES_5=Array.from({length:12},(_,i)=>i*5);
// lockedRanges (optional, default none): array of {start,end} in minutes.
// When given, Hour options whose top-of-hour falls inside any range are
// grayed out — recomputed against the currently-selected AM/PM so flipping
// it updates which hours are locked. Fully backward compatible: every
// existing call site simply doesn't pass it and behaves exactly as before.
const TimeInput = ({value,onChange,style,lockedRanges}) => {
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
  const isHourLocked=(x)=>{
    if(!lockedRanges||lockedRanges.length===0)return false;
    let hh=x%12;
    if(ap==="PM")hh+=12;
    const mins=hh*60;
    return lockedRanges.some(r=>mins>=r.start&&mins<r.end);
  };
  const selStyle={flex:1,minWidth:0,padding:"10px 8px",background:T.card2,border:`1px solid ${T.border}`,borderRadius:8,color:T.text,fontSize:13.5,fontFamily:T.font,outline:"none",cursor:"pointer",boxSizing:"border-box"};
  return (
    <div style={{display:"flex",flexDirection:"row",gap:6,alignItems:"center",...(style||{})}}>
      <select value={h} onChange={e=>commit(+e.target.value,m,ap)} style={selStyle}>
        {TIME_HOURS_12.map(x=><option key={x} value={x} disabled={isHourLocked(x)}>{x}{isHourLocked(x)?" (school)":""}</option>)}
      </select>
      <span style={{color:T.muted,flexShrink:0}}>:</span>
      <select value={m} onChange={e=>commit(h,+e.target.value,ap)} style={selStyle}>
        {TIME_MINUTES_5.map(x=><option key={x} value={x}>{String(x).padStart(2,"0")}</option>)}
      </select>
      <select value={ap} onChange={e=>commit(h,m,e.target.value)} style={selStyle}>
        <option value="AM">AM</option>
        <option value="PM">PM</option>
      </select>
    </div>
  );
};
// Drop-in replacement for a plain numeric <Input type="number">. The bug it
// fixes: `onChange={e=>setX(Math.max(min,+e.target.value||fallback))}` snaps
// back to the fallback on every keystroke (since +"" is 0, a falsy value),
// so a field can never actually be cleared to type a fresh number. This
// keeps a free-typing local draft (including blank) and only ever commits a
// valid, clamped number back to the caller's state on blur — so whatever
// downstream code does real arithmetic on that state never sees a stale or
// invalid value, but the input itself never fights the user mid-keystroke.
const NumField = ({value,onChange,min,max,fallback,style,...rest}) => {
  const [draft,setDraft]=useState(()=>String(value));
  const [focused,setFocused]=useState(false);
  useEffect(()=>{if(!focused)setDraft(String(value));},[value,focused]);
  const commit=()=>{
    setFocused(false);
    let n=parseInt(draft,10);
    if(isNaN(n))n=fallback!==undefined?fallback:(min!==undefined?min:0);
    if(min!==undefined)n=Math.max(min,n);
    if(max!==undefined)n=Math.min(max,n);
    setDraft(String(n));
    if(n!==value)onChange(n);
  };
  return (
    <Input
      type="number"
      min={min}
      max={max}
      value={draft}
      onFocus={()=>setFocused(true)}
      onChange={e=>setDraft(e.target.value)}
      onBlur={commit}
      style={style}
      {...rest}
    />
  );
};
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
// Read the user's AI Tutor preferences (Settings > Study preferences) for
// attaching to genuine chat/tutoring /api/chat calls only — one-shot utility
// generations (citations, grammar, flashcard gen, etc.) never call this, so
// their output is never affected by these style settings.
const getAiPrefs=()=>({verbosity:lsGet("pref-verb","Balanced"),tutorStyle:lsGet("pref-tutorStyle","Socratic")});
const SUBJECT_COLORS=["#D9806B","#7BACDF","#A691DB","#5FCBA8","#DCA64A","#7880A8","#3ECF8E","#FF8A80","#81C784","#CE93D8"];
const DEFAULT_SUBJECTS=[
  {id:"chem",label:"Chemistry",color:"#D9806B"},
  {id:"bio", label:"Biology",  color:"#5FCBA8"},
  {id:"calc",label:"Calculus", color:"#7BACDF"},
  {id:"eng", label:"English",  color:"#A691DB"},
  {id:"hist",label:"History",  color:"#7880A8"},
  {id:"span",label:"Spanish",  color:"#DCA64A"},
];
const getSubjects=()=>lsGet("user-subjects",DEFAULT_SUBJECTS);
const saveSubjects=(s)=>lsSet("user-subjects",s);

// ─── SCHOOL DIRECTORY (mock, for the searchable school picker) ──────────────
// Flat mock list of selectable school names. Exactly two entries
// (DEMO_SCHOOL_COLLEGE, DEMO_SCHOOL_HS — see the institutional demo section)
// are wired to real mock class data; every other entry here is just a
// selectable name with no further behavior.
const SCHOOL_DIRECTORY=[
  "Harvard University","Lincoln High School","Stanford University","New York University",
  "UC Berkeley","UCLA","MIT","Lehigh University","University of Michigan",
  "Ohio State University","Georgia Tech","Boston University",
  "Roosevelt High School","Jefferson High School","Central High School",
  "Riverside High School","Franklin High School","University of Texas at Austin",
  "Penn State University","Arizona State University","Northwestern University",
  "Washington High School","University of Florida","Miami Dade College",
];
// Searchable school picker — type-to-filter + click-to-select, same shape as
// the friend-search pattern used in Studlin Network (text input + filtered
// list). Typing always calls onChange immediately, so a school that isn't in
// the mock directory is never blocked — the "fallback" is structural, not a
// separate confirm step, which matters since most real students' schools
// won't be in this small demo list.
const SchoolSelect=({value,onChange,placeholder,theme})=>{
  const [q,setQ]=useState(value||"");
  const [open,setOpen]=useState(false);
  useEffect(()=>{setQ(value||"");},[value]);
  const matches=(q.trim()?SCHOOL_DIRECTORY.filter(s=>s.toLowerCase().includes(q.toLowerCase())):[]).slice(0,6);
  const th=theme||{bg:T.card2,border:T.border,text:T.text,muted:T.muted};
  const pick=(name)=>{setQ(name);onChange(name);setOpen(false);};
  return (
    <div style={{position:"relative"}}>
      <input
        value={q}
        onChange={e=>{setQ(e.target.value);onChange(e.target.value);setOpen(true);}}
        onFocus={()=>setOpen(true)}
        onBlur={()=>setTimeout(()=>setOpen(false),150)}
        placeholder={placeholder||"Search or type your school"}
        style={{width:"100%",background:th.bg,border:`1px solid ${th.border}`,borderRadius:8,padding:"10px 12px",color:th.text,fontSize:13.5,fontFamily:T.font,outline:"none",boxSizing:"border-box"}}
      />
      {open&&q.trim()&&(
        <div style={{position:"absolute",top:"calc(100% + 4px)",left:0,right:0,zIndex:20,background:th.bg,border:`1px solid ${th.border}`,borderRadius:8,overflow:"hidden",boxShadow:"0 12px 28px -12px rgba(0,0,0,0.35)"}}>
          {matches.length>0
            ? matches.map(name=>(
                <div key={name} onMouseDown={e=>e.preventDefault()} onClick={()=>pick(name)} style={{padding:"9px 12px",fontSize:13,color:th.text,cursor:"pointer",borderBottom:`1px solid ${th.border}`}}>{name}</div>
              ))
            : <div onMouseDown={e=>e.preventDefault()} onClick={()=>setOpen(false)} style={{padding:"9px 12px",fontSize:12.5,color:th.muted,cursor:"pointer"}}>Can't find your school? Use "{q}" instead</div>
          }
        </div>
      )}
    </div>
  );
};

// ─── INSTITUTIONAL LIVE-DEMO CLASS ENGINE ────────────────────────────────────
// Pitch/demo material for university and high-school conversations — wired to
// exactly these two SCHOOL_DIRECTORY entries. Every other school is just a
// name with no further behavior (see ExploreClassesCard's mount point in
// Profile(), gated on an exact affiliation match against these two strings).
const DEMO_SCHOOL_COLLEGE="Harvard University";
const DEMO_SCHOOL_HS="Lincoln High School";

// Event dates are stored as `dayOffset` (days from "today") and resolved to a
// real date only at render/inject time, so the demo never looks stale no
// matter when someone opens the app.
const resolveDemoDate=(dayOffset)=>dayKey(new Date(Date.now()+dayOffset*86400000));
const fmtDemoDate=(k)=>{const p=k.split("-");return MON_SHORT[+p[1]-1]+" "+(+p[2]);};

const DEMO_CLASSES_COLLEGE=[
  {code:"ME 101",title:"Intro to Mechanical Engineering",instructor:"Prof. Alan Reyes",events:[
    {title:"Syllabus Quiz",dayOffset:2,time:"09:00",kind:"deadline"},
    {title:"Problem Set 1 Due",dayOffset:5,time:"23:59",kind:"deadline"},
    {title:"Lab 1 — Statics",dayOffset:7,time:"14:00",kind:"class",duration:120},
    {title:"Midterm Exam 1",dayOffset:14,time:"10:00",kind:"exam",duration:90},
    {title:"Problem Set 2 Due",dayOffset:19,time:"23:59",kind:"deadline"},
    {title:"Lab 2 — Dynamics",dayOffset:21,time:"14:00",kind:"class",duration:120},
    {title:"Problem Set 3 Due",dayOffset:26,time:"23:59",kind:"deadline"},
    {title:"Midterm Exam 2",dayOffset:35,time:"10:00",kind:"exam",duration:90},
    {title:"Lab 3 — Thermodynamics",dayOffset:38,time:"14:00",kind:"class",duration:120},
    {title:"Problem Set 4 Due",dayOffset:42,time:"23:59",kind:"deadline"},
    {title:"Design Project Proposal Due",dayOffset:47,time:"23:59",kind:"deadline"},
    {title:"Lab 4 — Fluid Mechanics",dayOffset:49,time:"14:00",kind:"class",duration:120},
    {title:"Project 1",dayOffset:52,time:"23:59",kind:"deadline"},
    {title:"Final Exam",dayOffset:63,time:"09:00",kind:"exam",duration:120},
    {title:"Final Project Presentation",is_TBD:true,kind:"deadline"},
  ]},
  {code:"BUS 210",title:"Business Management",instructor:"Prof. Diane Cho",events:[
    {title:"Syllabus Acknowledgement",dayOffset:1,time:"23:59",kind:"deadline"},
    {title:"Case Study 1 Due",dayOffset:6,time:"23:59",kind:"deadline"},
    {title:"Group Formation Deadline",dayOffset:8,time:"23:59",kind:"deadline"},
    {title:"Midterm Exam 1",dayOffset:15,time:"11:00",kind:"exam",duration:90},
    {title:"Case Study 2 Due",dayOffset:20,time:"23:59",kind:"deadline"},
    {title:"Guest Speaker Session",dayOffset:23,time:"13:00",kind:"class",duration:75},
    {title:"Case Study 3 Due",dayOffset:27,time:"23:59",kind:"deadline"},
    {title:"Midterm Exam 2",dayOffset:36,time:"11:00",kind:"exam",duration:90},
    {title:"Team Strategy Memo Due",dayOffset:41,time:"23:59",kind:"deadline"},
    {title:"Case Study 4 Due",dayOffset:44,time:"23:59",kind:"deadline"},
    {title:"Project 1",dayOffset:52,time:"23:59",kind:"deadline"},
    {title:"Peer Evaluation Due",dayOffset:55,time:"23:59",kind:"deadline"},
    {title:"Final Exam",dayOffset:64,time:"11:00",kind:"exam",duration:120},
    {title:"Capstone Deck Due",dayOffset:66,time:"23:59",kind:"deadline"},
    {title:"Final Project Presentation",is_TBD:true,kind:"deadline"},
  ]},
  {code:"CS 50",title:"Introduction to Computer Science",instructor:"Prof. Meredith Okoye",events:[
    {title:"Problem Set 0",dayOffset:4,time:"23:59",kind:"deadline"},
    {title:"Problem Set 1",dayOffset:11,time:"23:59",kind:"deadline"},
    {title:"Midterm Exam",dayOffset:22,time:"09:00",kind:"exam",duration:90},
    {title:"Problem Set 2",dayOffset:29,time:"23:59",kind:"deadline"},
    {title:"Final Project Proposal",is_TBD:true,kind:"deadline"},
  ]},
];

// High-school syllabus events are week-scoped, not semester-scoped — framed
// as a "Teacher's Weekly Agenda" that refreshes rather than a fixed plan.
const DEMO_CLASSES_HS=[
  {code:"AP-PHYS",title:"AP Physics",instructor:"Mr. Dale Whitfield",events:[
    {title:"Momentum Problem Set",dayOffset:1,time:"23:59",kind:"deadline"},
    {title:"Lab: Projectile Motion",dayOffset:2,time:"10:00",kind:"class",duration:50},
    {title:"Reading: Ch. 9 Rotational Motion",dayOffset:3,time:"23:59",kind:"deadline"},
    {title:"Quiz: Energy Conservation",dayOffset:4,time:"09:00",kind:"exam",duration:30},
    {title:"Lab Report Due",dayOffset:5,time:"23:59",kind:"deadline"},
  ]},
  {code:"HON-ENG",title:"Honors English",instructor:"Ms. Priya Nair",events:[
    {title:"Reading: The Great Gatsby Ch. 4-6",dayOffset:1,time:"23:59",kind:"deadline"},
    {title:"Socratic Seminar",dayOffset:2,time:"11:00",kind:"class",duration:45},
    {title:"Essay Draft 1 Due",dayOffset:4,time:"23:59",kind:"deadline"},
    {title:"Vocabulary Quiz",dayOffset:5,time:"09:30",kind:"exam",duration:20},
  ]},
];

const DEMO_CLASSES_BY_SCHOOL={[DEMO_SCHOOL_COLLEGE]:DEMO_CLASSES_COLLEGE,[DEMO_SCHOOL_HS]:DEMO_CLASSES_HS};

// ─── WEEKLY ROUTINE ("Time Shields") ─────────────────────────────────────────
// A routine rule is a recurring commitment: {id,title,kind,days,startTime,
// duration,subject}. `days` is Monday-first (0=Mon..6=Sun), matching
// WeeklyPlanner's own weekDays convention below. Rules are never copied into
// the one-off `events` array — they're expanded into virtual occurrences on
// demand for whatever date range is being rendered or scheduled, so editing
// or deleting one rule instantly and correctly applies to every week without
// any bulk-update pass.
const getWeeklyRoutine=()=>lsGet("weeklyRoutine",[]);
const saveWeeklyRoutine=(r)=>lsSet("weeklyRoutine",r);
const ROUTINE_KIND_TO_EVENT_KIND={class:"class",busy:"busy block",free:"free period"};
function expandRoutineOccurrences(routines,startDateKey,endDateKey){
  const out=[];
  if(!routines||routines.length===0)return out;
  const start=new Date(startDateKey+"T00:00:00");
  const end=new Date(endDateKey+"T00:00:00");
  for(let d=new Date(start);d<=end;d.setDate(d.getDate()+1)){
    const dk=dayKey(d);
    const dow=(d.getDay()+6)%7; // JS Sunday=0 → Monday-first 0..6
    routines.forEach(r=>{
      if(!r.days||!r.days.includes(dow))return;
      out.push({
        id:"routine-"+r.id+"-"+dk,
        routineId:r.id,
        title:r.title,
        date:dk,
        time:r.startTime,
        duration:r.duration||30,
        kind:ROUTINE_KIND_TO_EVENT_KIND[r.kind]||"class",
        subject:r.subject||"",
        status:"pending",
        isRoutine:true,
      });
    });
  }
  return out;
}
const getRoutineOccurrencesForDate=(dateKey)=>expandRoutineOccurrences(getWeeklyRoutine(),dateKey,dateKey);
// Scans forward up to 14 days from a desired date/time for the next slot
// that's actually open against both real events and Weekly Routine shields,
// within the user's preferred daily window. Shared by aiArrange's
// deterministic hard-lock enforcement and the Routine Control Center's
// conflict reconciliation (relocating a task that a routine edit now overlaps).
// Flexible catch-up window tacked onto the end of the user's normal work
// hours, reserved for late-dumped or overflow tasks. Dumping something at
// 9pm with a 6pm work-end preference shouldn't have to skip straight to
// tomorrow if there's genuinely still room tonight — this only ever kicks
// in as a last resort, after the normal [workStart, workEnd] window for
// today comes up empty, so it never disturbs how anything already-planned
// in the normal hours gets scheduled.
const CATCHUP_BUFFER_MINS=120;
function findOpenSlotFor(events,routines,prefs,desiredDate,desiredTime,duration,deadlineKey){
  const prefStartMins=timeToMinutes(prefs.workStartTime);
  const prefEndMins=timeToMinutes(prefs.workEndTime);
  // Never hand back a slot that's already passed today. Most callers (Brain
  // Dump, assignment extensions, review sessions, overdue rollover) pass a
  // fixed desiredTime like prefs.workStartTime with no awareness of the
  // actual clock — mirrors the "now + 15min buffer, rounded to the grid"
  // floor that aiArrange already uses for its own AI-planned slots.
  const now=new Date();
  const todayKey=dayKey();
  const nowFloorMins=Math.ceil((now.getHours()*60+now.getMinutes()+15)/15)*15;
  for(let dayOffset=0;dayOffset<14;dayOffset++){
    const d=new Date(desiredDate+"T12:00:00");d.setDate(d.getDate()+dayOffset);
    const dk=dayKey(d);
    // Assignment-linked callers (scheduleAssignmentExtension) pass a deadline
    // so we never place a block past it — plain callers omit it, no-op.
    if(deadlineKey&&dk>deadlineKey)break;
    // Free periods are preferred landing spots, not blocks — never treat them
    // as occupied (matches the Dashboard's scheduling engine).
    // Trailing breathing-room buffer scales with each existing block's own
    // duration, so gap-finding naturally leaves a proportional cooldown
    // after it rather than allowing zero-gap back-to-back placement.
    const occupied=events.filter(e=>e.date===dk&&e.time)
      .concat(expandRoutineOccurrences(routines,dk,dk).filter(o=>o.kind!=="free period"))
      .map(e=>({start:timeToMinutes(e.time),end:timeToMinutes(e.time)+(e.duration||30)+computeBreathingRoom(e.duration||30)}));
    let scanStart=dayOffset===0?Math.max(prefStartMins,timeToMinutes(desiredTime)):prefStartMins;
    if(dk===todayKey)scanStart=Math.max(scanStart,nowFloorMins);
    if(scanStart+duration>prefEndMins){
      // Normal hours are already full or behind us. For today specifically,
      // try the end-of-day catch-up buffer before giving up and pushing to
      // tomorrow — a late brain-dump deserves one more shot at landing
      // today rather than automatically bumping.
      if(dk===todayKey){
        const catchupStart=Math.max(scanStart,prefEndMins);
        const catchupEnd=prefEndMins+CATCHUP_BUFFER_MINS;
        for(let t=catchupStart;t+duration<=catchupEnd;t+=15){
          if(!occupied.some(o=>!(t+duration<=o.start||t>=o.end)))return {date:dk,time:minutesToTime(t)};
        }
      }
      continue; // today's waking hours (plus catch-up) are exhausted — fall through to tomorrow
    }
    for(let t=scanStart;t+duration<=prefEndMins;t+=15){
      if(!occupied.some(o=>!(t+duration<=o.start||t>=o.end)))return {date:dk,time:minutesToTime(t)};
    }
  }
  // Nothing open in two weeks (or the deadline forced an early break before
  // any day was even scanned, e.g. an item due "today" with today already
  // full) — better than silently dropping the task. But this raw fallback
  // must still never hand back a past time for today: a same-day deadline
  // with no room left is a genuine no-good-answer case, so we'd rather
  // return a tight-but-still-in-the-future slot than one that's already
  // passed on the clock.
  if(desiredDate===todayKey&&timeToMinutes(desiredTime)<nowFloorMins)return {date:desiredDate,time:minutesToTime(nowFloorMins)};
  return {date:desiredDate,time:desiredTime};
}
// findOpenSlotFor's fallback ("return the desired slot anyway if nothing's
// open") is the right default for its existing callers, but wrong for a
// Hard Wall that must never be silently violated — used only by "Pause My
// Life" (Tier 3), never changes findOpenSlotFor itself so every other
// caller keeps its current behavior.
function findLegalSlotOrNull(events,routines,prefs,desiredDate,desiredTime,duration,deadlineKey){
  const slot=findOpenSlotFor(events,routines,prefs,desiredDate,desiredTime,duration,deadlineKey);
  if(deadlineKey&&slot.date>deadlineKey)return null;
  const occupied=events.filter(e=>e.date===slot.date&&e.time)
    .concat(expandRoutineOccurrences(routines,slot.date,slot.date).filter(o=>o.kind!=="free period"))
    .map(e=>({start:timeToMinutes(e.time),end:timeToMinutes(e.time)+(e.duration||30)+computeBreathingRoom(e.duration||30)}));
  const tMins=timeToMinutes(slot.time);
  const conflict=occupied.some(o=>!(tMins+duration<=o.start||tMins>=o.end));
  return conflict?null:slot;
}
// Same-day-only room check — unlike findOpenSlotFor this never scans
// forward into later days, used by findSlotWithEviction to decide whether
// a specific day needs eviction at all.
function dayHasRoomFor(events,routines,prefs,dateKey,duration){
  const prefStartMins=timeToMinutes(prefs.workStartTime);
  const prefEndMins=timeToMinutes(prefs.workEndTime);
  const occupied=events.filter(e=>e.date===dateKey&&e.time)
    .concat(expandRoutineOccurrences(routines,dateKey,dateKey).filter(o=>o.kind!=="free period"))
    .map(e=>({start:timeToMinutes(e.time),end:timeToMinutes(e.time)+(e.duration||30)+computeBreathingRoom(e.duration||30)}));
  for(let t=prefStartMins;t+duration<=prefEndMins;t+=15){
    if(!occupied.some(o=>!(t+duration<=o.start||t>=o.end)))return true;
  }
  return false;
}
// Intelligent task swapping — when a task with an imminent deadline (due
// within 3 days) needs to land on a day that's already full, evict that
// day's long-term-project micro-sessions (pending study blocks whose own
// deadline is more than 7 days out, or has none at all) instead of pushing
// the imminent task further into the future the way findOpenSlotFor's
// plain forward-scan would — an emergency task should bump low-urgency
// filler, not get bumped itself. Evicted sessions are re-placed starting
// the day after, via the ordinary findOpenSlotFor, each still respecting
// its own deadline — eviction can shuffle a task later in the week, it can
// never cause it to miss its own due date. Falls back to the plain
// forward-scan if the task isn't imminent, the day already has room, or
// evicting every eligible candidate still isn't enough.
// Returns {events, placement}: events is the full updated array (with any
// evictions relocated) ready to persist; placement is where the task
// itself lands, or null if no legal (non-overlapping, within-deadline) slot
// exists anywhere — callers must treat null as "can't do this" rather than
// committing findOpenSlotFor's own last-resort fallback, which can return
// an already-occupied slot rather than silently dropping the task. That
// tradeoff is fine for callers who already accept it; it is not fine for a
// student-facing reschedule that's supposed to represent a legal move.
function findSlotWithEviction(events,routines,prefs,desiredDate,desiredTime,duration,deadlineKey){
  const daysOut=deadlineKey?Math.ceil((new Date(deadlineKey+"T12:00:00")-new Date(dayKey()+"T12:00:00"))/86400000):null;
  const isImminent=daysOut!==null&&daysOut<=3;

  if(!isImminent||dayHasRoomFor(events,routines,prefs,desiredDate,duration)){
    return {events,placement:findLegalSlotOrNull(events,routines,prefs,desiredDate,desiredTime,duration,deadlineKey)};
  }

  const candidates=events.filter(e=>e.date===desiredDate&&e.kind==="study block"&&e.status==="pending"&&
    (!e.deadline||daysUntilDeadline(e)>7)
  ).sort((a,b)=>{
    const da=a.deadline?daysUntilDeadline(a):Infinity;
    const db=b.deadline?daysUntilDeadline(b):Infinity;
    return db-da; // furthest-out (or no) deadline evicted first
  });

  let working=events.slice();
  const evictedIds=new Set();
  for(const cand of candidates){
    working=working.filter(e=>e.id!==cand.id);
    evictedIds.add(cand.id);
    if(dayHasRoomFor(working,routines,prefs,desiredDate,duration))break;
  }

  if(!dayHasRoomFor(working,routines,prefs,desiredDate,duration)){
    // Evicting every eligible candidate still isn't enough room on this
    // specific day — give the search one more genuine chance on a later
    // (still-legal, pre-deadline) day rather than giving up immediately;
    // only a real null here means no legal placement exists anywhere.
    return {events,placement:findLegalSlotOrNull(events,routines,prefs,desiredDate,desiredTime,duration,deadlineKey)};
  }

  const nextDay=(()=>{const d=new Date(desiredDate+"T12:00:00");d.setDate(d.getDate()+1);return dayKey(d);})();
  let pool=working.slice();
  events.forEach(ev=>{
    if(!evictedIds.has(ev.id))return;
    const newSlot=findOpenSlotFor(pool,routines,prefs,nextDay,prefs.workStartTime,ev.duration||30,ev.deadline||null);
    pool=pool.concat([{...ev,date:newSlot.date,time:newSlot.time}]);
  });

  const placement=findOpenSlotFor(working,routines,prefs,desiredDate,desiredTime,duration,deadlineKey);
  return {events:pool,placement};
}
// Places a student-reported "I need more time" extension for an assignment
// into the next open gap(s) before its deadline. Splits anything over 90min
// into multiple sessions (same chunking ceiling aiArrange uses), each placed
// via findOpenSlotFor with the assignment's deadline as a hard upper bound.
// Reads/writes localStorage directly (not React state) since this can be
// called from outside CalendarTab, same idiom as App's TaskTimerModal
// onComplete handler.
function scheduleAssignmentExtension(task,deadlineKey,totalMins){
  const events=lsGet("events",[]);
  const routines=getWeeklyRoutine();
  const prefs=getSchedulePreferences();
  const CHUNK=90;
  const chunks=[];
  let remaining=totalMins;
  while(remaining>0){const c=Math.min(CHUNK,remaining);chunks.push(c);remaining-=c;}

  let cursorDate=dayKey(),cursorTime=prefs.workStartTime;
  const newEvents=[];
  chunks.forEach((mins,i)=>{
    const slot=findOpenSlotFor(events.concat(newEvents),routines,prefs,cursorDate,cursorTime,mins,deadlineKey);
    newEvents.push({
      id:String(Date.now()+i)+"-"+i,title:task.title,date:slot.date,time:slot.time,
      subject:task.subject,kind:"study block",duration:mins,
      assignmentId:task.assignmentId,status:"pending",deadline:deadlineKey,
    });
    const d=new Date(slot.date+"T12:00:00");d.setDate(d.getDate()+1);
    cursorDate=dayKey(d);cursorTime=prefs.workStartTime;
  });
  lsSet("events",events.concat(newEvents));
}
// Dev-only demo seeder for the (mocked, Coming Soon) Canvas connector —
// creates one course + a few assignments in Firestore, then generates each
// assignment's first "Attack Block" via the same gap-finder real Canvas sync
// would use, so the estimation-engine loop is fully demoable without a real
// Canvas integration. Gated behind DEV_MODE, triggered from Settings >
// Integrations.
async function injectMockCanvasData(){
  const uid=firebase.auth().currentUser?.uid;
  if(!uid)return;
  const now=new Date().toISOString();
  const courseRef=await fsdb().collection('courses').add({
    userId:uid,name:"AP Chemistry",code:"CHEM 301",color:"#7BACDF",source:"mock",createdAt:now,updatedAt:now,
  });
  const mockAssignments=[
    {title:"Problem Set 4: Thermodynamics",daysOut:2},
    {title:"Lab Report: Titration Curves",daysOut:4},
    {title:"Reading Response: Ch. 9",daysOut:6},
  ];
  const events=lsGet("events",[]),routines=getWeeklyRoutine(),prefs=getSchedulePreferences();
  const newEvents=[];
  for(const a of mockAssignments){
    const deadline=new Date();deadline.setDate(deadline.getDate()+a.daysOut);
    const deadlineKey=dayKey(deadline);
    const asgRef=await fsdb().collection('assignments').add({
      userId:uid,courseId:courseRef.id,courseName:"AP Chemistry",title:a.title,
      canvasDeadline:deadline.toISOString(),estimatedMinutes:60,status:"pending",source:"mock",
      createdAt:now,updatedAt:now,
    });
    const attackDate=new Date(deadline);attackDate.setHours(attackDate.getHours()-48);
    const desiredDate=dayKey(attackDate<new Date()?new Date():attackDate);
    const slot=findOpenSlotFor(events.concat(newEvents),routines,prefs,desiredDate,prefs.workStartTime,60,deadlineKey);
    newEvents.push({
      id:String(Date.now())+"-"+Math.random().toString(36).slice(2,7),
      title:"Attack Block: "+a.title,date:slot.date,time:slot.time,
      subject:"Chemistry",kind:"study block",duration:60,
      assignmentId:asgRef.id,isAttackBlock:true,status:"pending",deadline:deadlineKey,
    });
  }
  lsSet("events",events.concat(newEvents));
}
// Subtracts a list of {start,end} "holes" out of a single {start,end} base
// interval, returning the remaining segments — used to punch free-period
// gaps through the WeeklyPlanner's School Hours background tint.
function subtractIntervals(base,holes){
  let segments=[{...base}];
  (holes||[]).forEach(h=>{
    segments=segments.flatMap(seg=>{
      if(h.end<=seg.start||h.start>=seg.end)return [seg];
      const out=[];
      if(h.start>seg.start)out.push({start:seg.start,end:Math.min(h.start,seg.end)});
      if(h.end<seg.end)out.push({start:Math.max(h.end,seg.start),end:seg.end});
      return out;
    });
  });
  return segments.filter(s=>s.end>s.start);
}
const prioLabel=(v)=>{const p=v/10;return p<=20?"Low":p<=40?"Low–Medium":p<=60?"Medium":p<=80?"High":"Urgent";};
const diffLabel=(v)=>{const p=v/10;return p<=20?"Very Easy":p<=40?"Easy":p<=60?"Medium":p<=80?"Hard":"Very Hard";};
async function getAuthToken(){try{const u=firebase.auth().currentUser;if(!u)return null;return await u.getIdToken();}catch(e){return null;}}
async function authFetch(url,opts={}){try{const token=await getAuthToken();const h=Object.assign({},opts.headers||{});if(token)h["Authorization"]="Bearer "+token;return fetch(url,Object.assign({},opts,{headers:h}));}catch(e){return fetch(url,opts);}}
async function fetchUserProfile(){try{const res=await authFetch("/api/me");if(!res.ok)return null;const d=await res.json();lsSet("credits",d.credits);lsSet("plan",d.plan||"Free");return d;}catch(e){return null;}}

// ─── FIRESTORE (client SDK) — live user directory + friend graph ────────────
// Everything privacy-sensitive (credits, plan, email) stays server-only via
// the existing /api/* routes + Admin SDK. This client SDK is used only for
// the public directory (`profiles`) and the `friendships` relationship graph,
// per firestore.rules.
const fsdb=()=>firebase.firestore();
const slugUsername=(name)=>(name||"").toLowerCase().replace(/[^a-z0-9]/g,"").slice(0,24)||"student";
// Creates/refreshes this user's public directory entry so they're searchable
// and their name/school stay current. Safe to call anytime a signed-in user
// is present — merges rather than overwrites, and never touches private data.
async function upsertProfile(extra={}){
  const u=firebase.auth().currentUser;
  if(!u)return;
  const prof=getProfile();
  const name=u.displayName||prof.name||"Student";
  const username=prof.username||slugUsername(name);
  const school=extra.school!==undefined?extra.school:(prof.affiliation||prof.school||"");
  const status=extra.status!==undefined?extra.status:(prof.status||"");
  const data={
    uid:u.uid,
    name,
    username,
    usernameLower:username,
    nameLower:name.toLowerCase(),
    school,
    schoolLower:(school||"").toLowerCase(),
    status,
    total_minutes_focused:getTotalMinutesFocused(),
    streak:getStreak(),
    updatedAt:new Date().toISOString(),
  };
  try{await fsdb().collection('profiles').doc(u.uid).set(data,{merge:true});}catch(e){}
  // name/email intentionally omitted here — the users/{uid} security rules
  // only allow a specific onboarding-field allowlist for client writes (see
  // firestore.rules); name already lives on the public profiles doc above,
  // and email is populated server-side via the Admin SDK (api/me.js).
  try{await fsdb().collection('users').doc(u.uid).set({updatedAt:new Date().toISOString()},{merge:true});}catch(e){}
}
// Top-N public profiles ordered by real XP, straight from Firestore — no
// mock/seed data. Docs that haven't been through upsertProfile() since
// total_minutes_focused started being synced (or ever) simply lack the
// field and are naturally excluded by orderBy, rather than sorting in as a
// false zero.
async function fetchTopProfiles(n=8){
  try{
    const snap=await fsdb().collection('profiles').orderBy('total_minutes_focused','desc').limit(n).get();
    return snap.docs.map(d=>d.data());
  }catch(e){return [];}
}
const LB_GRADIENTS=["linear-gradient(135deg,#FFD7B5,#FFC9D2)","linear-gradient(135deg,#BFE3FF,#E2D0FF)","linear-gradient(135deg,#C4F0D8,#FFE99A)","linear-gradient(135deg,#E2D0FF,#FFD7B5)","linear-gradient(135deg,#FFE99A,#C4F0D8)","linear-gradient(135deg,#BFE3FF,#FFD7B5)","linear-gradient(135deg,#C4F0D8,#E2D0FF)"];
// Merges the signed-in user's own live-accurate minutes/streak/name into a
// fetched top-profiles list (replacing their own possibly-stale doc if it's
// in there), re-sorts by real total_minutes_focused, and assigns rank + a
// rotating avatar gradient. Always keeps "you" visible in the returned slice
// even if your real rank falls outside it, same as the leaderboard has
// always guaranteed.
function mergeLeaderboard(profiles, realName, realMinutes, realStreak, myUid, showCount){
  const others=(profiles||[]).filter(p=>p.uid&&p.uid!==myUid);
  const you={uid:myUid,name:realName||"You",minutes:Math.max(0,realMinutes||0),streak:realStreak||0,you:true};
  const sorted=[...others,you].sort((a,b)=>(b.minutes||b.total_minutes_focused||0)-(a.minutes||a.total_minutes_focused||0)).map((u,i)=>({
    r:i+1,
    n:u.name||"Student",
    minutes:u.minutes||u.total_minutes_focused||0,
    streak:u.streak||0,
    tier:getProfTitle(u.minutes||u.total_minutes_focused||0),
    you:!!u.you,
    grad:LB_GRADIENTS[i%LB_GRADIENTS.length],
  }));
  if(!showCount||showCount>=sorted.length)return sorted;
  const top=sorted.slice(0,showCount);
  if(top.some(u=>u.you))return top;
  return [...sorted.slice(0,showCount-1),sorted.find(u=>u.you)];
}
const dayKey=(d)=>{const x=d||new Date();return x.getFullYear()+"-"+String(x.getMonth()+1).padStart(2,"0")+"-"+String(x.getDate()).padStart(2,"0");};
function daysOverdue(ev){if(!ev.deadline)return 0;if(ev.date<=ev.deadline)return 0;const d1=new Date(ev.date),d2=new Date(ev.deadline);return Math.ceil((d1-d2)/86400000);}
function daysUntilDeadline(ev){if(!ev.deadline)return null;const d1=new Date(ev.deadline),d2=new Date(dayKey());return Math.ceil((d1-d2)/86400000);}
// Per-task one-shot notification scheduling used to live here, but it only
// fired if the tab stayed open uninterrupted from the moment of creation —
// it never survived a refresh, and never re-armed after a drag/rebalance
// moved a task to a new time. Replaced by the polling-based upcomingTask
// reminder effect in App() (checks the live task list every 30s against the
// real clock), which covers every task regardless of when/how it was
// scheduled. See that effect for the single source of truth now.
function requestNotifPermission(){if(!("Notification" in window))return;Notification.requestPermission();}
function stripHtml(html){return(html||"").replace(/<[^>]*>/g," ");}
function sanitizeHtml(html){if(typeof DOMPurify==='undefined')return html||'';return DOMPurify.sanitize(html||'',{ALLOWED_TAGS:['p','br','h1','h2','h3','h4','h5','h6','ul','ol','li','strong','em','b','i','u','s','blockquote','span','a','code','pre','table','thead','tbody','tr','th','td','hr','sub','sup'],ALLOWED_ATTR:['href','target','rel'],FORCE_BODY:true,ALLOW_UNKNOWN_PROTOCOLS:false});}
function wordCountOf(html){var txt=stripHtml(html).trim();return txt?txt.split(/\s+/).length:0;}
function readabilityOf(html){
  var txt=stripHtml(html).trim();
  if(!txt)return{grade:"—",level:""};
  var words=txt.split(/\s+/).filter(Boolean);
  var sentences=txt.split(/[.!?]+/).filter(function(s){return s.trim().length>0;});
  var syllables=words.reduce(function(acc,w){
    var clean=w.toLowerCase().replace(/[^a-z]/g,"");
    var m=clean.match(/[aeiouy]+/g);
    return acc+Math.max(1,m?m.length:1);
  },0);
  var wc=words.length,sc=Math.max(1,sentences.length);
  var ease=206.835-1.015*(wc/sc)-84.6*(syllables/wc);
  var gradeNum=0.39*(wc/sc)+11.8*(syllables/wc)-15.59;
  var letter=ease>=90?"A+":ease>=80?"A":ease>=70?"B+":ease>=60?"B":ease>=50?"C+":ease>=30?"C":"D";
  var lvl=gradeNum<=6?"Grade 6 or below":gradeNum>=16?"College level":"Grade "+Math.max(1,Math.round(gradeNum));
  return{grade:letter,level:lvl};
}
function touchStreak(){const days=lsGet("days",[]);const t=dayKey();if(!days.includes(t)){days.push(t);lsSet("days",days);upsertProfile();}}
function getStreak(){const days=new Set(lsGet("days",[]));let n=0;const d=new Date();while(days.has(dayKey(d))){n++;d.setDate(d.getDate()-1);}return n;}
function logSession(mins,mode){const s=lsGet("sessions",[]);s.push({d:dayKey(),m:mins,t:Date.now(),mode:mode||"Focus"});lsSet("sessions",s);upsertProfile();}
// "Similar tasks usually take you ~Xm" — median of real logged time (not
// the originally-guessed duration) for past completed tasks in the same
// subject+kind. Removes the time-blindness guesswork of estimating a new
// task's length from scratch every time; returns null until there's at
// least one real data point to go on.
// Phase 3 — flashcard review sessions counting down to an exam. Pure
// scheduling math, no AI/credit cost: spacing gets denser the closer the
// exam gets (classic spaced-repetition shape), capped at 4 sessions so a
// far-off exam doesn't flood the calendar. Offsets are "days before the
// exam date"; anything that would land in the past (or on the exam day
// itself) is dropped.
function computeReviewOffsets(daysUntil){
  if(daysUntil<2)return [];
  if(daysUntil<=3)return [1];
  if(daysUntil<=7)return [3,1];
  if(daysUntil<=14)return [8,4,1];
  return [16,10,5,2];
}
function computeReviewDates(examDateKey,todayKey){
  const exam=new Date(examDateKey+"T12:00:00");
  const today=new Date(todayKey+"T12:00:00");
  const daysUntil=Math.round((exam-today)/86400000);
  return computeReviewOffsets(daysUntil).filter(o=>o<daysUntil).map(o=>{
    const d=new Date(exam);d.setDate(d.getDate()-o);return dayKey(d);
  }).sort();
}
function suggestDurationFor(subject,kind){
  const events=lsGet("events",[]).filter(e=>e.status==="done"&&e.timeSpent&&e.subject===subject&&e.kind===kind);
  if(events.length===0)return null;
  const sorted=events.map(e=>e.timeSpent).sort((a,b)=>a-b);
  const mid=Math.floor(sorted.length/2);
  const median=sorted.length%2?sorted[mid]:Math.round((sorted[mid-1]+sorted[mid])/2);
  return Math.max(5,Math.round(median/5)*5);
}
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
function getPlan(){return lsGet("plan","Free");}
function setPlanLS(p){lsSet("plan",p);}
function getCreditLimit(){const p=getPlan();return p==="Max"?500:p==="Pro"?200:20;}
function getCredits(){return lsGet("credits",getCreditLimit());}
function setCreditsLS(n){lsSet("credits",Math.max(0,n));}
const CREDIT_COST={standard:1,flash:1};
// Syllabus scans are capped at 3/month on Free — a separate, more visible
// gate than the general credit pool, since the syllabus feature is the
// centerpiece "aha moment" and deserves its own honest usage counter rather
// than quietly eating into the same 20 AI credits as everything else. Pro
// and Max are uncapped. Purely client-side (same trust model as credits
// everywhere else in this app — no server enforcement exists yet).
const SYLLABUS_SCAN_LIMIT=3;
function getSyllabusScanUsage(){
  const monthKey=new Date().toISOString().slice(0,7);
  const stored=lsGet("syllabusScans",{month:monthKey,count:0});
  return stored.month===monthKey?stored:{month:monthKey,count:0};
}
function canScanSyllabus(){return getPlan()!=="Free"||getSyllabusScanUsage().count<SYLLABUS_SCAN_LIMIT;}
function recordSyllabusScan(){const u=getSyllabusScanUsage();lsSet("syllabusScans",{month:u.month,count:u.count+1});}

// ─── XP · LEVEL · STREAK · PLAN (all derived from real activity) ───────────────
const DOW_FULL=["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
const MON_SHORT=["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
function todayLabel(){const d=new Date();return DOW_FULL[d.getDay()]+" · "+MON_SHORT[d.getMonth()]+" "+d.getDate();}
function weekNo(){const d=new Date();const start=new Date(d.getFullYear(),0,1);return Math.ceil((((d-start)/86400000)+start.getDay()+1)/7);}

// Deterministic, non-AI fallback for syllabus deadline extraction — mirrors
// fallbackSchedule's role for AI Schedule Mode: if the AI call throws or
// returns nothing usable, this guarantees the feature still returns SOMETHING
// rather than dead-ending. Naive regex date-scan, so every match is tagged
// confidence:"low" — the review modal flags these for the student to check.
function regexScanDeadlines(text){
  const lines=(text||"").split("\n");
  const results=[];
  const monthPattern=new RegExp("("+MON_SHORT.join("|")+")[a-z]*\\.?\\s+(\\d{1,2})(?:st|nd|rd|th)?(?:,?\\s*(\\d{4}))?","gi");
  const numericPattern=/\b(\d{1,2})\/(\d{1,2})(?:\/(\d{2,4}))?\b/g;
  const now=new Date();
  const titleFrom=(line)=>{const t=line.replace(/^[\s\-*•\d.)]+/,"").trim().slice(0,60);return t||"Deadline";};
  const kindFrom=(line)=>/exam|midterm|final/i.test(line)?"exam":"deadline";
  const rollYear=(month,day,year)=>{
    if(year)return year.length===2?"20"+year:year;
    const candidate=new Date(now.getFullYear(),month,day);
    return String(candidate<now?now.getFullYear()+1:now.getFullYear());
  };
  lines.forEach(line=>{
    if(results.length>=40)return;
    let m;
    monthPattern.lastIndex=0;
    if((m=monthPattern.exec(line))){
      const monthIdx=MON_SHORT.findIndex(mo=>mo.toLowerCase()===m[1].toLowerCase());
      const day=parseInt(m[2],10);
      const year=rollYear(monthIdx,day,m[3]);
      results.push({title:titleFrom(line),date:year+"-"+String(monthIdx+1).padStart(2,"0")+"-"+String(day).padStart(2,"0"),kind:kindFrom(line),confidence:"low"});
      return;
    }
    numericPattern.lastIndex=0;
    if((m=numericPattern.exec(line))){
      const month=parseInt(m[1],10)-1,day=parseInt(m[2],10);
      if(month<0||month>11||day<1||day>31)return;
      const year=rollYear(month,day,m[3]);
      results.push({title:titleFrom(line),date:year+"-"+String(month+1).padStart(2,"0")+"-"+String(day).padStart(2,"0"),kind:kindFrom(line),confidence:"low"});
    }
  });
  return results;
}
// Deterministic "never dead-end" fallback for the Brain Dump parser (see
// parseBrainDump in CalendarTab) — splits on commas/newlines/" and " and
// treats every fragment as a plain to-do. Deliberately never guesses a
// study duration here: without the AI actually reading the text, inventing
// a number would be a worse failure mode than just asking the student to
// schedule it themselves via the checklist.
function fallbackSplitBrainDump(text){
  return (text||"")
    .split(/[,\n]|(?:\s+and\s+)/i)
    .map(s=>s.trim().replace(/^[\s\-*•.]+/,""))
    .filter(s=>s.length>2)
    .slice(0,15)
    .map(s=>({title:s.charAt(0).toUpperCase()+s.slice(1),kind:"todo",durationMin:null,dueDate:null,needsDuration:false}));
}
// Levels map strictly to real Lock-In Timer minutes — no streak/login/task
// bonuses, no penalty deductions, no starting offset. An honest sum of
// every session actually logged, nothing else.
function getTotalMinutesFocused(){
  const s=lsGet("sessions",[]);
  return s.reduce((acc,x)=>acc+(x.m||0),0);
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
function levelInfo(){const minutes=getTotalMinutesFocused();const per=300;const level=Math.floor(minutes/per)+1;const into=minutes-(level-1)*per;const title=getProfTitle(minutes);const nextTier=PROF_TIERS.find(t=>t.minMinutes>minutes)||null;const curTierMinutes=(PROF_TIERS.slice().reverse().find(t=>minutes>=t.minMinutes)||PROF_TIERS[0]).minMinutes;const tierPct=nextTier?Math.round(Math.max(0,Math.min(100,(minutes-curTierMinutes)/(nextTier.minMinutes-curTierMinutes)*100))):100;return {minutes,level,into,per,toNext:per-into,pct:Math.round(into/per*100),title,nextTier,tierPct};}
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
// Proportional Breathing Room — replaces the old fixed 3-tier break buckets
// with one continuous formula, anchored close to the previous tiers
// (25min->5, 60min->10, 90min->15) but still scaling past 120min instead of
// plateauing there. Used both as the Lock-In Timer's default break length
// and as a trailing buffer after existing blocks during gap-finding.
function computeBreathingRoom(mins){
  return Math.max(5,Math.min(20,Math.round((mins*0.15)/5)*5));
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

// Normalize a stored priority/difficulty value to 0-1.
// New tasks (Phase 3+) store 0-1000; legacy tasks store 0-10.
function normalizeTaskVal(v,defaultVal){
  const n=v!=null?v:defaultVal;
  return n>10?n/1000:n/10;
}

// Weighted scoring formula (returns 0-1000 integer, higher = schedule sooner).
// W_priority=0.35, W_deadline=0.35, W_difficulty=0.20, W_streak=0.10
function scoreTask(task,prefs,streak){
  const p=normalizeTaskVal(task.priority,5);

  const rawDiff=task.difficulty!=null?task.difficulty:500;
  const d=normalizeTaskVal(rawDiff,5);

  let urgency=0.3;
  if(task.deadline){
    const h=(new Date(task.deadline+"T23:59:00").getTime()-Date.now())/3600000;
    if(h<=0)urgency=1.0;
    else if(h<=24)urgency=1.0;
    else if(h<=48)urgency=0.8;
    else if(h<=72)urgency=0.6;
    else urgency=Math.max(0.3,0.6-(h-72)/240);
  }

  const pref=(prefs&&prefs.taskDifficultyPreference)||"NONE";
  const diffWeight=pref==="FIRST"?d:pref==="LAST"?1-d:0.5;

  const streakBoost=(streak||0)>=3?1.0:0.0;

  const raw=0.35*p+0.35*urgency+0.20*diffWeight+0.10*streakBoost;
  return Math.round(Math.min(1,raw)*1000);
}

// Re-score and re-slot all pending flexible tasks on dateKey.
// Returns the full updated events array; does not persist.
function rebalanceDay(dateKey,allEvents,routines,prefs){
  const FIXED=new Set(["exam","class","busy block","reminder"]);
  const streak=getStreak();
  const isFixed=function(e){return FIXED.has(e.kind);};
  const isFlexPending=function(e){return e.date===dateKey&&!isFixed(e)&&!e.checklist&&e.status!=="done"&&e.time;};

  const flex=allEvents.filter(isFlexPending);
  if(flex.length<2)return allEvents;

  const rest=allEvents.filter(function(e){return !isFlexPending(e);});

  const sorted=[...flex].sort(function(a,b){return scoreTask(b,prefs,streak)-scoreTask(a,prefs,streak);});

  let prefStart=timeToMinutes(prefs.workStartTime);
  const prefEnd=timeToMinutes(prefs.workEndTime);
  const isToday=dateKey===dayKey();
  // Same "never re-slot into the past" floor as findOpenSlotFor — without
  // this, saving or editing any second task today silently snapped every
  // flexible task on the day back to workStartTime, clobbering times that
  // aiArrange/findOpenSlotFor had already correctly placed after "now".
  if(isToday){
    const now=new Date();
    const nowFloorMins=Math.ceil((now.getHours()*60+now.getMinutes()+15)/15)*15;
    prefStart=Math.max(prefStart,nowFloorMins);
  }
  // Same end-of-day catch-up buffer as findOpenSlotFor — a rebalance
  // triggered late in the day (e.g. adding a second task at 9pm) shouldn't
  // strand overflow tasks just because normal work hours are full.
  const dayEnd=isToday?prefEnd+CATCHUP_BUFFER_MINS:prefEnd;

  const occupied=rest.filter(function(e){return e.date===dateKey&&e.time;}).map(function(e){
    return{start:timeToMinutes(e.time),end:timeToMinutes(e.time)+(e.duration||30)+computeBreathingRoom(e.duration||30)};
  });
  expandRoutineOccurrences(routines||[],dateKey,dateKey)
    .filter(function(r){return r.kind!=="free period";})
    .forEach(function(r){occupied.push({start:timeToMinutes(r.time),end:timeToMinutes(r.time)+(r.duration||30)});});

  const reassigned=sorted.map(function(task){
    const dur=task.duration||60;
    if(prefStart+dur>dayEnd)return task; // no room left even with the catch-up buffer — leave it where it was rather than force a slot
    for(let t=prefStart;t+dur<=dayEnd;t+=15){
      if(!occupied.some(function(o){return!(t+dur<=o.start||t>=o.end);})){
        occupied.push({start:t,end:t+dur+computeBreathingRoom(dur)});
        return Object.assign({},task,{time:minutesToTime(t)});
      }
    }
    return task;
  });

  return rest.concat(reassigned);
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
// Checks a proposed [startMins, startMins+duration) window against a list of
// already-occupied {start,end} slots. (This used to check `.time`/`.id`/
// `.isFlexible` on entries that never had those fields — always `false`,
// i.e. conflict detection was silently inert. Now it actually does interval
// overlap math against the shape callers actually pass.)
function detectConflicts(task,occupiedSlots,startMins){
  const taskDur=task.duration||30;
  const taskEnd=startMins+taskDur;
  return occupiedSlots.some(slot=>!(taskEnd<=slot.start||startMins>=slot.end));
}

// Feature 2+Features 1,3,4,5: Integrated advanced scheduler
function advancedSchedulePlanner(baseEvents){
  const prefs=getSchedulePreferences();
  const tk=dayKey();
  const done=lsGet("planDone",{});

  // Get all events for today — checklist to-dos are excluded, they have no
  // duration and never belong in the scheduled day plan.
  const events=baseEvents.filter(e=>e.date===tk&&!e.checklist);
  const now=new Date();
  const nowMins=timeToMinutes(String(now.getHours()).padStart(2,"0")+":"+String(now.getMinutes()).padStart(2,"0"));
  // Floor for placing anything today: now + 15min buffer, rounded up to the
  // 15-min grid this planner already steps on. Without this, flexible tasks
  // with no time yet always landed at workStartTime regardless of the clock.
  const nowFloorMins=Math.ceil((nowMins+15)/15)*15;

  // Time window constraints
  const workStart=Math.max(timeToMinutes(prefs.workStartTime),nowFloorMins);
  const workEnd=timeToMinutes(prefs.workEndTime);

  // Separate hard events (fixed time) and flexible tasks
  const hardEvents=events.filter(e=>!e.isFlexible&&e.time);
  const flexibleTasks=events.filter(e=>e.isFlexible||!e.time).sort((a,b)=>calculateTaskPriority(b,events)-calculateTaskPriority(a,events));

  // Chunk long flexible tasks and add breaks
  const flexibleChunked=chunkTasksWithBreaks(flexibleTasks);

  // Sort hard events by time
  hardEvents.sort((a,b)=>(a.time||"")<(b.time||"")?-1:1);

  // Weekly Routine occurrences for today are absolute shields, folded into
  // occupiedSlots right alongside real hard events. "Free period" occurrences
  // are tracked separately as preferred landing spots for short micro-tasks.
  const routineToday=getRoutineOccurrencesForDate(tk);
  const shieldOccurrences=routineToday.filter(r=>r.kind!=="free period");
  const freeWindows=routineToday.filter(r=>r.kind==="free period").map(r=>({start:timeToMinutes(r.time),end:timeToMinutes(r.time)+(r.duration||30)}));

  const scheduled=[];
  const occupiedSlots=[
    ...hardEvents.map(e=>({start:timeToMinutes(e.time),end:timeToMinutes(e.time)+(e.duration||30)+computeBreathingRoom(e.duration||30),event:e})),
    ...shieldOccurrences.map(r=>({start:timeToMinutes(r.time),end:timeToMinutes(r.time)+(r.duration||30),event:r})),
  ];

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

    // Short tasks (flashcards/quick review, ≤20 min) preferentially land
    // inside a free-period/study-hall window before using the general peak
    // window — that's the "Dead Time Activation" the free periods exist for.
    if(dur<=20){
      for(const w of freeWindows){
        const wStart=Math.max(w.start,nowFloorMins);
        for(let timeSlot=wStart;timeSlot+dur<=w.end&&!placed;timeSlot+=15){
          if(!detectConflicts(task,occupiedSlots,timeSlot)){
            occupiedSlots.push({start:timeSlot,end:timeSlot+dur,task:task});
            scheduled.push({...task,time:minutesToTime(timeSlot),done:!!done[task.id],scheduled:true});
            placed=true;
          }
        }
        if(placed)break;
      }
    }

    // Try to find first available slot within work window
    if(!placed){
      for(let timeSlot=workStart;timeSlot+dur<=workEnd;timeSlot+=15){
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
// No more manual Time Zone picker in Settings — always the browser's actual
// current zone, computed fresh rather than trusted from a possibly-stale
// stored value (e.g. a profile saved before a student traveled/moved).
function detectTz(){
  try{return Intl.DateTimeFormat().resolvedOptions().timeZone||"America/New_York";}catch(e){return "America/New_York";}
}
function getProfile(){
  try{
    const u=typeof firebase!=="undefined"?firebase.auth().currentUser:null;
    const def={name:(u&&u.displayName)||"Student",email:(u&&u.email)||"you@studlin.app",school:"",tz:detectTz(),status:"",affiliation:""};
    return {...lsGet("profile",def),tz:detectTz()};
  }catch(e){return{name:"Student",email:"you@studlin.app",school:"",tz:detectTz(),status:"",affiliation:""};}
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
  const [difficulty,setDifficulty]=useState(prefs.difficultyPreference);
  const [saved,setSaved]=useState(false);

  const handleSave=()=>{
    const newPrefs={
      workStartTime:workStart,
      workEndTime:workEnd,
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
          <span style={{display:"inline-flex",width:34,height:34,borderRadius:10,background:T.lime+"20",border:"1px solid "+T.lime+"44",alignItems:"center",justifyContent:"center",color:T.lime}}>{Icon.settings}</span>
          <div style={{fontSize:18,fontWeight:700,color:T.white,letterSpacing:"-0.01em"}}>Study Schedule Preferences</div>
        </div>
        
        <div style={{marginBottom:22}}>
          <label style={{display:"block",fontSize:11,fontWeight:700,letterSpacing:"0.08em",textTransform:"uppercase",color:T.muted,marginBottom:8}}>Peak Work Hours</label>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
            <div>
              <label style={{fontSize:12,color:T.text,marginBottom:4,display:"block"}}>Start time</label>
              <TimeInput value={workStart} onChange={setWorkStart} style={{fontFamily:T.mono}} />
            </div>
            <div>
              <label style={{fontSize:12,color:T.text,marginBottom:4,display:"block"}}>End time</label>
              <TimeInput value={workEnd} onChange={setWorkEnd} style={{fontFamily:T.mono}} />
            </div>
          </div>
          <div style={{fontSize:11,color:T.muted,marginTop:6,lineHeight:1.4}}>Tasks will be scheduled within this window. Your study schedule respects these hours.</div>
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
    {name:"Pro",price:"$9.99",perks:["~6× more AI credits (200/month)","Every AI model + 4 study modes","Unlimited decks + notes scanning"],color:T.lime},
    {name:"Max",price:"$24.99",perks:["500 AI credits / month","Everything in Pro, unlimited","Advanced analytics + learning paths"],color:T.purple},
  ];
  const choose=(name)=>{setPlanLS(name);onClose();if(onUpgraded)onUpgraded(name);};
  return (
    <div onClick={onClose} style={{position:"fixed",inset:0,zIndex:90,background:"rgba(8,12,10,0.72)",backdropFilter:"blur(7px)",display:"flex",alignItems:"center",justifyContent:"center"}}>
      <div onClick={e=>e.stopPropagation()} style={{width:580,maxWidth:"92vw",background:T.surface,border:"1px solid "+T.border,borderRadius:16,padding:28,boxShadow:"0 40px 90px -30px rgba(0,0,0,0.65)"}}>
        <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:6}}>
          <span style={{display:"inline-flex",width:30,height:30,borderRadius:8,background:T.lime+"1c",border:"1px solid "+T.lime+"44",alignItems:"center",justifyContent:"center",color:T.lime}}>{Icon.wand}</span>
          <div style={{fontSize:17,fontWeight:700,color:T.white,letterSpacing:"-0.01em"}}>You have hit your {feature} limit</div>
        </div>
        <div style={{fontSize:12.5,color:T.text,lineHeight:1.6,marginBottom:18}}>{detail}</div>
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
const navIcon = {dashboard:Icon.grid,aichat:Icon.sparkles,writestudio:Icon.pen,essays:Icon.pen,flashcards:Icon.layers,notes:Icon.file,calendar:Icon.cal,friends:Icon.users,lectures:Icon.mic,solve:Icon.zap,aitutor:Icon.brain,grammar:Icon.check,humanizer:Icon.scan,feedback:Icon.heart,settings:Icon.settings,profile:Icon.user};

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

  const [chatId,setChatId]=useState(()=>"chat-"+Date.now());
  const [historyOpen,setHistoryOpen]=useState(false);
  const [chatHistory,setChatHistory]=useState(()=>lsGet("ai-chats",[]));

  useEffect(()=>{
    if(msgs.length===0)return;
    const title=msgs.find(m=>m.r==="user")?.t?.replace(/\n/g," ").slice(0,60)||"Conversation";
    const chats=lsGet("ai-chats",[]);
    const idx=chats.findIndex(c=>c.id===chatId);
    const entry={id:chatId,title,updatedAt:Date.now(),msgs};
    const updated=idx>=0?chats.map((c,i)=>i===idx?entry:c):[entry,...chats];
    const trimmed=updated.slice(0,30);
    lsSet("ai-chats",trimmed);
    setChatHistory(trimmed);
  },[msgs]);

  const newChat=()=>{setChatId("chat-"+Date.now());setMsgs([]);setInput("");setAttachedFile(null);};
  const loadChat=(chat)=>{setChatId(chat.id);setMsgs(chat.msgs);setHistoryOpen(false);};
  const deleteChat=(id,e)=>{e.stopPropagation();const updated=chatHistory.filter(c=>c.id!==id);lsSet("ai-chats",updated);setChatHistory(updated);if(id===chatId)newChat();};
  const relTime=(ts)=>{const d=Date.now()-ts,m=Math.floor(d/60000);if(m<1)return"Just now";if(m<60)return m+"m ago";const h=Math.floor(m/60);if(h<24)return h+"h ago";const dy=Math.floor(h/24);if(dy===1)return"Yesterday";if(dy<7)return dy+"d ago";return new Date(ts).toLocaleDateString("en-US",{month:"short",day:"numeric"});};

  const [shareOpen,setShareOpen]=useState(false);
  const [shareMode,setShareMode]=useState("private");
  const [shareLink,setShareLink]=useState("");
  const [shareCopied,setShareCopied]=useState(false);
  const [shareError,setShareError]=useState("");
  const openShare=()=>{setShareOpen(true);setShareMode("private");setShareLink("");setShareCopied(false);setShareError("");};
  const createShareLink=()=>{
    if(shareMode==="private"){setShareOpen(false);return;}
    setShareError("");
    try{
      const firstUser=msgs.find(function(m){return m.r==="user";});
      const title=firstUser&&firstUser.t?String(firstUser.t).replace(/\n/g," ").slice(0,80):"Shared conversation";
      const safeMsgs=msgs.map(function(m){return{r:m.r,t:m.t||""};});
      const payload=JSON.stringify({msgs:safeMsgs,title,v:1});
      const encoded=btoa(unescape(encodeURIComponent(payload)));
      const link=window.location.origin+"/app?share="+encodeURIComponent(encoded);
      setShareLink(link);
      try{navigator.clipboard.writeText(link);}catch(e){}
      setShareCopied(true);
      setTimeout(function(){setShareCopied(false);},3000);
    }catch(e){
      setShareError("Could not create link — try with a shorter conversation.");
    }
  };
  const copyShareLink=()=>{
    try{navigator.clipboard.writeText(shareLink);}catch(e){}
    setShareCopied(true);setTimeout(()=>setShareCopied(false),2000);
  };

  const chatBg=T.bg;
  const chatPanel=T.mode==="dark"?"#0B0C10":T.surface;
  const historyPanel=(
    <div style={{width:220,flexShrink:0,borderRight:`1px solid ${T.mode==="dark"?"rgba(255,255,255,0.05)":T.border}`,display:"flex",flexDirection:"column",background:chatPanel,overflow:"hidden"}}>
      <div style={{padding:"14px 12px 8px",display:"flex",alignItems:"center",justifyContent:"space-between",borderBottom:`1px solid ${T.border}`,flexShrink:0}}>
        <span style={{fontSize:10,fontWeight:700,letterSpacing:"0.12em",textTransform:"uppercase",color:T.muted}}>Chat history</span>
        <button onClick={newChat} style={{display:"inline-flex",alignItems:"center",gap:5,padding:"5px 9px",borderRadius:7,border:`1px solid ${T.border}`,background:"transparent",color:T.lime,fontSize:11,fontWeight:600,cursor:"pointer",fontFamily:T.font}}>
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          New
        </button>
      </div>
      <div style={{flex:1,overflowY:"auto",padding:"6px 8px"}}>
        {chatHistory.length===0&&(
          <div style={{padding:"32px 12px",textAlign:"center",color:T.faint,fontSize:12,lineHeight:1.5}}>No past chats yet.</div>
        )}
        {chatHistory.map(chat=>(
          <div key={chat.id} onClick={()=>loadChat(chat)} style={{display:"flex",alignItems:"flex-start",gap:6,padding:"9px 10px",borderRadius:8,cursor:"pointer",background:chat.id===chatId?T.lime+"12":"transparent",border:`1px solid ${chat.id===chatId?T.lime+"33":"transparent"}`,marginBottom:2,group:true,position:"relative"}}>
            <div style={{flex:1,minWidth:0}}>
              <div style={{fontSize:12,fontWeight:chat.id===chatId?600:500,color:chat.id===chatId?T.white:T.text,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",lineHeight:1.35}}>{chat.title}</div>
              <div style={{fontSize:10,color:T.faint,marginTop:2}}>{relTime(chat.updatedAt)}</div>
            </div>
            <button onClick={(e)=>deleteChat(chat.id,e)} style={{width:18,height:18,borderRadius:4,border:"none",background:"transparent",color:T.faint,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,marginTop:1,padding:0,opacity:0.6}} title="Delete">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>
        ))}
      </div>
    </div>
  );

  const historyToggle=(
    <button onClick={()=>setHistoryOpen(o=>!o)} title={historyOpen?"Close history":"Chat history"} style={{display:"grid",placeItems:"center",width:32,height:32,borderRadius:8,border:`1px solid ${historyOpen?T.lime+"44":T.border}`,background:historyOpen?T.lime+"10":"transparent",color:historyOpen?T.lime:T.muted,cursor:"pointer",flexShrink:0}}>
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
    </button>
  );

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
      const res=await authFetch("/api/chat",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({messages:apiMsgs,model,...getAiPrefs()})});
      let data;
      try{data=await res.json();}
      catch(parseErr){throw new Error("Studlin AI is having trouble responding right now. Please try again.");}
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
      <div style={{display:"flex",height:"calc(100vh - 80px)",overflow:"hidden",background:chatBg}}>
        {historyOpen&&historyPanel}
        <div style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",minHeight:"calc(100vh - 120px)",padding:"0 24px",position:"relative"}}>
        <div style={{position:"absolute",top:12,left:12}}>{historyToggle}</div>
        {(()=>{const hr=new Date().getHours();const period=hr<5?"late-night":hr<12?"morning":hr<18?"afternoon":hr<22?"evening":"late-night";const fName=(userName||"there").split(" ")[0];return(
        <div style={{display:"flex",alignItems:"center",gap:16,marginBottom:34,animation:"studlinRise 0.5s ease-out"}}>
          <img src="studlin-icon.png" alt="Studlin" style={{width:52,height:52,borderRadius:15,flexShrink:0,boxShadow:"0 6px 20px -8px rgba(0,0,0,0.4)",objectFit:"cover"}} onError={e=>{e.target.style.display="none";}} />
          <h1 style={{fontFamily:T.hand,fontSize:"clamp(32px,4.8vw,52px)",fontWeight:700,color:T.white,letterSpacing:"-0.02em",margin:0,lineHeight:1.02}}>It's {period}, {fName}.</h1>
        </div>
        );})()}
        <div style={{width:"100%",maxWidth:720}}>{inputBar(false)}</div>
        <div style={{display:"flex",gap:8,flexWrap:"wrap",justifyContent:"center",marginTop:22,maxWidth:660,animation:"studlinFade 0.6s ease-out 0.1s both"}}>
          {quickActions.map(a=>(
            <button key={a.label} onClick={()=>{setInput(a.prompt);setTimeout(()=>inputRef.current?.focus(),50);}} style={{display:"inline-flex",alignItems:"center",gap:8,padding:"10px 16px",borderRadius:12,border:`1px solid ${T.border}`,background:T.card,color:T.text,fontSize:13,fontWeight:600,cursor:"pointer",fontFamily:T.font,transition:"all 0.15s"}}>
              <span style={{display:"inline-flex",color:T.lime}}>{a.icon}</span>
              {a.label}
            </button>
          ))}
        </div>
        <div style={{fontSize:11,color:T.faint,marginTop:22}}><span style={{color:T.muted}}>{curModel.name}</span> · {credits} credits remaining</div>
        </div>
      </div>
    );
  }

  return (
    <>
    <div style={{display:"flex",height:"calc(100vh - 80px)",overflow:"hidden",background:chatBg}}>
      {historyOpen&&historyPanel}
      <div style={{flex:1,display:"flex",flexDirection:"column",minWidth:0}}>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"12px 0 16px",flexShrink:0}}>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          {historyToggle}
          <button onClick={newChat} style={{display:"inline-flex",alignItems:"center",gap:6,padding:"6px 12px",borderRadius:8,border:`1px solid ${T.border}`,background:T.card,color:T.muted,fontSize:12,fontWeight:500,cursor:"pointer",fontFamily:T.font}}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            New chat
          </button>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <button onClick={openShare} style={{display:"inline-flex",alignItems:"center",gap:6,padding:"6px 14px",borderRadius:8,border:`1px solid ${T.border}`,background:T.card,color:T.text,fontSize:12,fontWeight:600,cursor:"pointer",fontFamily:T.font}}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>
            Share
          </button>
          <div style={{fontSize:11,color:T.muted}}><span style={{color:credits<(CREDIT_COST[model]||1)?T.red||"#f87171":T.lime,fontWeight:600}}>{credits}</span> credits · {curModel.name}</div>
        </div>
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
    </div>

    {/* Share modal */}
    {shareOpen&&(
      <div onClick={()=>setShareOpen(false)} style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.55)",zIndex:9000,display:"flex",alignItems:"center",justifyContent:"center",padding:24}}>
        <div onClick={e=>e.stopPropagation()} style={{background:T.surface,borderRadius:18,padding:"28px 28px 24px",width:460,maxWidth:"100%",position:"relative",border:`1px solid rgba(255,255,255,0.08)`,boxShadow:"0 32px 64px -16px rgba(0,0,0,0.55)"}}>
          <button onClick={()=>setShareOpen(false)} style={{position:"absolute",top:16,right:16,width:30,height:30,borderRadius:8,border:`1px solid rgba(255,255,255,0.12)`,background:"rgba(255,255,255,0.06)",color:T.cream,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
          <div style={{fontSize:18,fontWeight:700,color:T.cream,marginBottom:4,fontFamily:T.font}}>Share chat</div>
          <div style={{fontSize:13,color:"rgba(246,241,230,0.5)",marginBottom:20,fontFamily:T.font}}>Only messages up to this point will be shared.</div>
          <div style={{display:"flex",flexDirection:"column",gap:8,marginBottom:20}}>
            {[
              {key:"private",Icon:<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>,label:"Keep private",sub:"Only you have access"},
              {key:"public",Icon:<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>,label:"Create public link",sub:"Anyone with the link can view"},
            ].map(opt=>(
              <div key={opt.key} onClick={()=>{setShareMode(opt.key);setShareLink("");}} style={{display:"flex",alignItems:"center",gap:14,padding:"14px 16px",borderRadius:10,border:`1px solid ${shareMode===opt.key?"rgba(255,255,255,0.18)":"rgba(255,255,255,0.07)"}`,background:shareMode===opt.key?"rgba(255,255,255,0.06)":"transparent",cursor:"pointer",transition:"all 0.15s"}}>
                <span style={{color:"rgba(246,241,230,0.6)",flexShrink:0}}>{opt.Icon}</span>
                <div style={{flex:1}}>
                  <div style={{fontSize:14,fontWeight:600,color:T.cream,fontFamily:T.font}}>{opt.label}</div>
                  <div style={{fontSize:12,color:"rgba(246,241,230,0.45)",marginTop:1,fontFamily:T.font}}>{opt.sub}</div>
                </div>
                {shareMode===opt.key&&<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={T.lime} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>}
              </div>
            ))}
          </div>
          {shareLink&&(
            <div onClick={copyShareLink} style={{display:"flex",alignItems:"center",gap:8,padding:"10px 14px",borderRadius:8,background:"rgba(255,255,255,0.05)",border:`1px solid ${shareCopied?T.lime+"44":"rgba(255,255,255,0.08)"}`,marginBottom:12,cursor:"pointer",transition:"border-color 0.2s"}}>
              <span style={{flex:1,fontSize:12,color:"rgba(246,241,230,0.55)",fontFamily:T.mono,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{shareLink}</span>
              <span style={{flexShrink:0,fontSize:11.5,fontWeight:600,color:shareCopied?T.lime:"rgba(246,241,230,0.5)",fontFamily:T.font}}>{shareCopied?"Copied!":"Copy"}</span>
            </div>
          )}
          {shareError&&(
            <div style={{fontSize:12.5,color:"#ff6b6b",background:"rgba(255,107,107,0.12)",border:"1px solid rgba(255,107,107,0.25)",borderRadius:8,padding:"10px 14px",marginBottom:12,fontFamily:T.font}}>{shareError}</div>
          )}
          {shareLink?(
            <button onClick={copyShareLink} style={{width:"100%",padding:"12px 0",borderRadius:10,background:shareCopied?T.lime:"rgba(174,206,94,0.85)",color:"#0E1F18",border:"none",fontSize:14,fontWeight:700,cursor:"pointer",fontFamily:T.font,transition:"background 0.2s",display:"flex",alignItems:"center",justifyContent:"center",gap:7}}>
              {shareCopied
                ?<><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>Link copied</>
                :"Copy link"}
            </button>
          ):(
            <button onClick={createShareLink} style={{width:"100%",padding:"12px 0",borderRadius:10,background:T.cream,color:"#0E1F18",border:"none",fontSize:14,fontWeight:700,cursor:"pointer",fontFamily:T.font,transition:"background 0.2s"}}>
              {shareMode==="private"?"Done":"Create share link"}
            </button>
          )}
        </div>
      </div>
    )}
    </>
  );
}

// ─── ESSAYS ───────────────────────────────────────────────────────────────────
const ESSAY_TEMPLATES={
  "Five-paragraph essay":{target:800,content:"<p><strong>Introduction</strong></p><p><em>Hook, background, and your thesis statement.</em></p><p><strong>Body Paragraph 1</strong></p><p><em>Topic sentence, evidence, analysis.</em></p><p><strong>Body Paragraph 2</strong></p><p><em>Topic sentence, evidence, analysis.</em></p><p><strong>Body Paragraph 3</strong></p><p><em>Topic sentence, evidence, analysis.</em></p><p><strong>Conclusion</strong></p><p><em>Restate thesis, summarize key points, closing thought.</em></p>"},
  "Literary analysis":{target:1200,content:"<p><strong>Introduction</strong></p><p><em>Introduce the text and author, state your interpretive thesis.</em></p><p><strong>Textual Evidence &amp; Analysis</strong></p><p><em>Quote and analyze key passages that support your thesis.</em></p><p><strong>Counterargument</strong></p><p><em>Address an alternate reading and explain why your interpretation holds.</em></p><p><strong>Conclusion</strong></p><p><em>Tie the analysis back to the larger meaning of the work.</em></p>"},
  "Scientific lab report":{target:1000,content:"<p><strong>Objective</strong></p><p><em>What were you testing and why?</em></p><p><strong>Hypothesis</strong></p><p><em>Your prediction before running the experiment.</em></p><p><strong>Materials &amp; Methods</strong></p><p><em>What you used and the steps you followed.</em></p><p><strong>Results</strong></p><p><em>Data and observations, no interpretation yet.</em></p><p><strong>Discussion</strong></p><p><em>What the results mean, sources of error.</em></p><p><strong>Conclusion</strong></p><p><em>Did the results support your hypothesis?</em></p>"},
  "Argumentative essay":{target:1200,content:"<p><strong>Introduction &amp; Claim</strong></p><p><em>Introduce the issue and state your position clearly.</em></p><p><strong>Supporting Argument 1</strong></p><p><em>Evidence and reasoning.</em></p><p><strong>Supporting Argument 2</strong></p><p><em>Evidence and reasoning.</em></p><p><strong>Counterargument &amp; Rebuttal</strong></p><p><em>Acknowledge the opposing view, then refute it.</em></p><p><strong>Conclusion</strong></p><p><em>Reaffirm your claim and its significance.</em></p>"},
  "Compare & contrast":{target:1000,content:"<p><strong>Introduction</strong></p><p><em>Introduce both subjects and your basis for comparison.</em></p><p><strong>Similarities</strong></p><p><em>Key points the two share.</em></p><p><strong>Differences</strong></p><p><em>Key points where they diverge.</em></p><p><strong>Conclusion</strong></p><p><em>What the comparison reveals.</em></p>"},
  "Research paper":{target:2000,content:"<p><strong>Introduction</strong></p><p><em>Research question and why it matters.</em></p><p><strong>Literature Review</strong></p><p><em>What existing sources say.</em></p><p><strong>Methodology</strong></p><p><em>How you investigated the question.</em></p><p><strong>Findings</strong></p><p><em>What you discovered.</em></p><p><strong>Conclusion</strong></p><p><em>Implications and next steps.</em></p><p><strong>References</strong></p><p><em>List your sources here.</em></p>"},
  "Personal statement":{target:650,content:"<p><strong>Opening Hook</strong></p><p><em>A vivid moment that draws the reader in.</em></p><p><strong>Formative Experience</strong></p><p><em>What happened and why it mattered to you.</em></p><p><strong>Growth &amp; Reflection</strong></p><p><em>How it changed your thinking or values.</em></p><p><strong>Why This Path</strong></p><p><em>Connect the experience to your goals.</em></p><p><strong>Closing</strong></p><p><em>Leave the reader with a clear sense of who you are.</em></p>"},
  "Reflective journal":{target:500,content:"<p><strong>What Happened</strong></p><p><em>Describe the experience.</em></p><p><strong>How I Felt</strong></p><p><em>Your honest reaction.</em></p><p><strong>What I Learned</strong></p><p><em>The insight you're taking away.</em></p><p><strong>What's Next</strong></p><p><em>How this changes what you'll do going forward.</em></p>"},
};

function Essays() {
  const [tab,setTab]=useState("library");
  const [essays,setEssays]=useState(()=>lsGet("essays",[]));
  const [activeId,setActiveId]=useState(null);
  const [newOpen,setNewOpen]=useState(false);
  const [eTitle,setETitle]=useState("");
  const [eSubject,setESubject]=useState("English IV");
  const [eTarget,setETarget]=useState("1500");
  const [ePrompt,setEPrompt]=useState("");
  const [eCustom,setECustom]=useState("");
  const [eMode,setEMode]=useState("self");
  const [aiCreating,setAiCreating]=useState(false);
  const [feedbackLoading,setFeedbackLoading]=useState(false);
  const [feedbackIssues,setFeedbackIssues]=useState(null);
  const [toolLoading,setToolLoading]=useState(null);
  const [toolResult,setToolResult]=useState(null);
  const [citeOpen,setCiteOpen]=useState(false);
  const [citeSource,setCiteSource]=useState("");
  const [citeStyle,setCiteStyle]=useState("MLA");
  const [citeLoading,setCiteLoading]=useState(false);
  const [citeResult,setCiteResult]=useState("");
  const [exportOpen,setExportOpen]=useState(false);
  const [copiedMsg,setCopiedMsg]=useState("");
  const [gdocsStep,setGdocsStep]=useState("idle");
  const editorRef=useRef(null);
  const subjects=[{value:"English IV",label:"English IV",color:T.purple},{value:"Biology",label:"Biology",color:T.teal},{value:"History",label:"History",color:T.muted},{value:"Chemistry",label:"Chemistry",color:T.red},{value:"Calculus",label:"Calculus",color:T.blue},{value:"Other",label:"Other",color:T.lime}];
  const subjectColor={"English IV":T.purple,"Biology":T.teal,"History":T.muted,"Chemistry":T.red,"Calculus":T.blue};
  const colorOf=(s)=>subjectColor[s]||T.lime;

  const persist=(next)=>{setEssays(next);lsSet("essays",next);};
  const activeEssay=essays.find(e=>e.id===activeId)||null;
  const statusOf=(e)=>{if(e.submitted)return"Submitted";const wc=wordCountOf(e.content);if(wc===0)return"Outline";return"In progress";};

  const resetNewForm=()=>{setETitle("");setEPrompt("");setECustom("");setEMode("self");setETarget("1500");setNewOpen(false);};

  const createEssay=(prefillTitle,prefillContent,prefillTarget,prefillSubject)=>{
    const subj=eSubject==="Other"&&eCustom.trim()?eCustom.trim():(prefillSubject||eSubject);
    const id=String(Date.now()+Math.random()*1000);
    const essay={
      id,
      title:prefillTitle||eTitle.trim()||"Untitled essay",
      subject:subj,
      target:Math.max(50,+(prefillTarget||eTarget)||1500),
      prompt:ePrompt.trim(),
      content:prefillContent!==undefined?prefillContent:"",
      submitted:false,
      createdAt:Date.now(),
      updatedAt:Date.now(),
    };
    const next=essays.concat([essay]);
    persist(next);
    setActiveId(id);
    setTab("active");
    resetNewForm();
    return essay;
  };

  const aiDraftEssay=async()=>{
    if(!eTitle.trim())return;
    setAiCreating(true);
    const subj=eSubject==="Other"&&eCustom.trim()?eCustom.trim():eSubject;
    const prompt="Hey Studlin, I need you to help me start an essay. Title: \""+eTitle.trim()+"\". Subject: "+subj+". Target length: about "+eTarget+" words."+(ePrompt.trim()?" Prompt/thesis: "+ePrompt.trim():"")+" Can you write an outline plus a first-draft opening (intro and first body paragraph) in a natural student voice? Format it as HTML using <p>, <strong> for section labels, nothing else fancy. Just give me the HTML directly, no markdown fences, no commentary.";
    try{
      const res=await authFetch("/api/chat",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({messages:[{r:"user",t:prompt}],model:"standard"})});
      const data=await res.json();
      const html=data.error?"<p><strong>Introduction</strong></p><p><em>Couldn't generate a draft: "+data.error+"</em></p>":(data.reply||"").replace(/```html?|```/g,"").trim();
      createEssay(eTitle.trim(),html,eTarget,subj);
    }catch(e){createEssay(eTitle.trim(),"",eTarget,subj);}
    setAiCreating(false);
  };

  const submitNewEssay=()=>{
    if(!eTitle.trim())return;
    if(eMode==="ai"){aiDraftEssay();return;}
    createEssay();
  };

  const useTemplate=(name)=>{
    const t=ESSAY_TEMPLATES[name];
    const id=String(Date.now()+Math.random()*1000);
    const essay={id,title:name,subject:"English IV",target:t.target,prompt:"",content:t.content,submitted:false,createdAt:Date.now(),updatedAt:Date.now()};
    persist(essays.concat([essay]));
    setActiveId(id);
    setTab("active");
  };

  const selectEssay=(id)=>{setActiveId(id);setTab("active");setFeedbackIssues(null);setToolResult(null);};
  const deleteEssay=(id)=>{const next=essays.filter(e=>e.id!==id);persist(next);if(activeId===id){setActiveId(null);setTab("library");}};
  const markSubmitted=()=>{if(!activeEssay)return;const next=essays.map(e=>e.id===activeId?{...e,submitted:true,updatedAt:Date.now()}:e);persist(next);};
  const updateContent=(html)=>{if(!activeEssay)return;const next=essays.map(e=>e.id===activeId?{...e,content:html,updatedAt:Date.now()}:e);persist(next);};
  const updateTitle=(title)=>{if(!activeEssay)return;const next=essays.map(e=>e.id===activeId?{...e,title,updatedAt:Date.now()}:e);persist(next);};

  const exec=(cmd,val)=>{if(editorRef.current)editorRef.current.focus();document.execCommand(cmd,false,val);if(editorRef.current)updateContent(editorRef.current.innerHTML);};

  const runFeedback=async()=>{
    if(!activeEssay)return;
    const text=stripHtml(activeEssay.content).trim();
    if(!text){setFeedbackIssues(["Write a bit first, then I can give you real feedback."]);return;}
    setFeedbackLoading(true);setFeedbackIssues(null);
    const prompt="Hey Studlin, can you review this "+activeEssay.subject+" essay draft titled \""+activeEssay.title+"\" and give me 4 short, specific, actionable pieces of feedback to improve it? Respond with ONLY a valid JSON array of short strings, no markdown fences, no commentary. Here's the draft:\n\n"+text.slice(0,6000);
    try{
      const res=await authFetch("/api/chat",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({messages:[{r:"user",t:prompt}],model:"standard"})});
      const data=await res.json();
      if(data.error){setFeedbackIssues(["Couldn't get feedback: "+data.error]);setFeedbackLoading(false);return;}
      var raw=(data.reply||"").replace(/```json?|```/g,"").trim();
      var s=raw.indexOf("[");var en=raw.lastIndexOf("]");
      if(s>=0&&en>s)raw=raw.slice(s,en+1);
      var parsed=JSON.parse(raw);
      setFeedbackIssues(Array.isArray(parsed)?parsed:["Couldn't parse feedback. Try again."]);
    }catch(e){setFeedbackIssues(["Something went wrong. Try again."]);}
    setFeedbackLoading(false);
  };

  const runTool=async(kind)=>{
    if(!activeEssay)return;
    const text=stripHtml(activeEssay.content).trim();
    if(!text){return;}
    setToolLoading(kind);setToolResult(null);
    const instruction=kind==="refine"?"Refine the prose of this essay draft: improve word choice and flow, but keep the same ideas, length, and structure.":"Do a grammar and punctuation pass on this essay draft: fix errors only, don't change the meaning or style.";
    const prompt="Hey Studlin, "+instruction+" Respond with ONLY the corrected text as plain paragraphs, no markdown fences, no commentary, no headers added. Here's the draft:\n\n"+text.slice(0,6000);
    try{
      const res=await authFetch("/api/chat",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({messages:[{r:"user",t:prompt}],model:"standard"})});
      const data=await res.json();
      setToolResult({kind,text:data.error?"Error: "+data.error:(data.reply||"").trim()});
    }catch(e){setToolResult({kind,text:"Something went wrong. Try again."});}
    setToolLoading(null);
  };

  const applyToolResult=()=>{
    if(!toolResult||!activeEssay)return;
    const raw=toolResult.text.split(/\n+/).filter(Boolean).map(p=>"<p>"+p+"</p>").join("");
    const html=sanitizeHtml(raw);
    updateContent(html);
    if(editorRef.current)editorRef.current.innerHTML=html;
    setToolResult(null);
  };

  const generateCitation=async()=>{
    if(!citeSource.trim())return;
    setCiteLoading(true);setCiteResult("");
    const prompt="Hey Studlin, can you format a "+citeStyle+" citation for this source: "+citeSource.trim()+". Respond with ONLY the formatted citation, no commentary.";
    try{
      const res=await authFetch("/api/chat",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({messages:[{r:"user",t:prompt}],model:"flash"})});
      const data=await res.json();
      setCiteResult(data.error?"Error: "+data.error:(data.reply||"").trim());
    }catch(e){setCiteResult("Something went wrong. Try again.");}
    setCiteLoading(false);
  };

  const insertCitation=()=>{
    if(!citeResult||!activeEssay)return;
    const html=sanitizeHtml((activeEssay.content||"")+"<p>"+citeResult+"</p>");
    updateContent(html);
    if(editorRef.current)editorRef.current.innerHTML=html;
    setCiteOpen(false);setCiteSource("");setCiteResult("");
  };

  const copyEssay=()=>{
    if(!activeEssay)return;
    const txt=activeEssay.title+"\n\n"+stripHtml(activeEssay.content).trim();
    navigator.clipboard&&navigator.clipboard.writeText(txt).then(()=>{setCopiedMsg("Copied to clipboard");setTimeout(()=>setCopiedMsg(""),2200);});
  };

  const downloadEssay=()=>{
    if(!activeEssay)return;
    const txt=activeEssay.title+"\n\n"+stripHtml(activeEssay.content).trim();
    const blob=new Blob([txt],{type:"text/plain"});
    const url=URL.createObjectURL(blob);
    const a=document.createElement("a");
    a.href=url;a.download=(activeEssay.title||"essay").replace(/[^a-z0-9]+/gi,"_")+".txt";
    document.body.appendChild(a);a.click();document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const doGoogleDocsExport=async()=>{
    if(!activeEssay)return;
    if(!GDOCS_CONFIGURED){setGdocsStep("unconfigured");return;}
    setGdocsStep("loading");
    try{
      const url=await createGoogleDoc(activeEssay);
      setGdocsStep("done");
      window.open(url,"_blank","noopener,noreferrer");
    }catch(e){
      const msg=e.message||"Unknown error";
      setGdocsStep(msg.includes("popup")?"popup_blocked":msg.includes("configured")?"unconfigured":"apierror");
    }
  };

  const wc=activeEssay?wordCountOf(activeEssay.content):0;
  const target=activeEssay?activeEssay.target:0;
  const pct=target>0?Math.min(100,Math.round(wc/target*100)):0;
  const readability=activeEssay?readabilityOf(activeEssay.content):{grade:"—",level:""};

  return (
    <div>
      <PH title="Essays" sub="Draft, refine, and submit your writing" action={<Btn onClick={()=>setNewOpen(true)}>{React.createElement("span",{style:{display:"flex",alignItems:"center",gap:6}},Icon.plus,"New essay")}</Btn>} />
      <Modal open={newOpen} onClose={resetNewForm} title="Start a new essay" sub="Studlin will scaffold an outline and adapt the AI tutor to your subject."
        footer={<><Btn variant="subtle" onClick={resetNewForm}>Cancel</Btn><Btn onClick={submitNewEssay} disabled={aiCreating} style={{opacity:eTitle.trim()?1:0.45}}>{aiCreating?"Drafting...":React.createElement("span",{style:{display:"flex",alignItems:"center",gap:6}},Icon.pen,"Create essay")}</Btn></>}>
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
              <div style={{fontSize:11.5,color:T.muted}}>Outline plus a first draft in your voice.</div>
            </button>
          </div>
        </Field>
        <Field label="Word target"><Input type="number" value={eTarget} onChange={e=>setETarget(e.target.value)} /></Field>
        <Field label="Prompt or thesis (optional)" hint="Paste the assignment brief or sketch your argument.">
          <Textarea placeholder="e.g. Argue that Macbeth's downfall is caused by ambition, not the witches." value={ePrompt} onChange={e=>setEPrompt(e.target.value)} />
        </Field>
      </Modal>

      <Modal open={citeOpen} onClose={()=>{setCiteOpen(false);setCiteResult("");}} title="Cite a source" sub="AI formats it for you, then you insert it into your essay."
        footer={<><Btn variant="subtle" onClick={()=>{setCiteOpen(false);setCiteResult("");}}>Cancel</Btn>{citeResult?<Btn onClick={insertCitation}>Insert into essay</Btn>:<Btn onClick={generateCitation} disabled={citeLoading||!citeSource.trim()}>{citeLoading?"Formatting...":"Generate citation"}</Btn>}</>}>
        <Field label="Citation style">
          <SelectChip options={[{value:"MLA",label:"MLA"},{value:"APA",label:"APA"},{value:"Chicago",label:"Chicago"}]} value={citeStyle} onChange={setCiteStyle} />
        </Field>
        <Field label="Source details" hint="Author, title, publisher, year, URL — whatever you have.">
          <Textarea placeholder="e.g. Smith, John. 'The Tragedy of Ambition.' Shakespeare Quarterly, 2019, pp. 45-67." value={citeSource} onChange={e=>setCiteSource(e.target.value)} />
        </Field>
        {citeResult&&<div style={{background:T.card2,border:`1px solid ${T.border}`,borderRadius:8,padding:"12px 14px",fontSize:13,color:T.text,lineHeight:1.6}}>{citeResult}</div>}
      </Modal>

      <Modal open={exportOpen} onClose={()=>{setExportOpen(false);setGdocsStep("idle");}} title="Export essay" sub={activeEssay?activeEssay.title:""}>
        <div style={{display:"flex",flexDirection:"column",gap:8}}>
          <BtnSm variant="subtle" onClick={copyEssay}>{Icon.copy} Copy to clipboard</BtnSm>
          <BtnSm variant="subtle" onClick={downloadEssay}>{Icon.file} Download as .txt</BtnSm>
          {copiedMsg&&<div style={{fontSize:12,color:T.lime,fontWeight:600}}>{copiedMsg}</div>}

          <div style={{height:1,background:T.border,margin:"6px 0"}} />

          <Label>Google Docs</Label>
          {(gdocsStep==="idle"||gdocsStep==="loading")&&(
            <Btn onClick={doGoogleDocsExport} disabled={gdocsStep==="loading"||!activeEssay} style={{justifyContent:"center"}}>
              {gdocsStep==="loading"
                ?<><span style={{width:13,height:13,border:"2px solid rgba(255,255,255,0.3)",borderTopColor:"#fff",borderRadius:"50%",animation:"studlinSpin 0.7s linear infinite",display:"inline-block",marginRight:8}} />Creating Google Doc...</>
                :<>{Icon.link} Open in Google Docs</>}
            </Btn>
          )}
          {gdocsStep==="done"&&(
            <>
              <div style={{fontSize:12,color:T.lime,fontWeight:600,display:"flex",alignItems:"center",gap:6}}>{Icon.check} Google Doc created and opened</div>
              <BtnSm variant="ghost" onClick={()=>setGdocsStep("idle")}>Export again</BtnSm>
            </>
          )}
          {gdocsStep==="unconfigured"&&(
            <div style={{fontSize:11,color:T.amber,lineHeight:1.6,background:T.amber+"12",border:"1px solid "+T.amber+"33",borderRadius:8,padding:"10px 12px"}}>
              <strong style={{display:"block",marginBottom:4}}>Google OAuth Client ID not set up yet.</strong>
              To enable one-click Google Docs export, add a <code style={{fontSize:10}}>GOOGLE_OAUTH_CLIENT_ID</code> to your studlin-app.jsx. See the comment near the top of the file for exact steps — it takes about 2 minutes in Google Cloud Console.
            </div>
          )}
          {gdocsStep==="popup_blocked"&&(
            <>
              <div style={{fontSize:12,color:T.red,fontWeight:600}}>Popup was blocked.</div>
              <div style={{fontSize:11,color:T.faint,lineHeight:1.5}}>Allow popups for studlin.vercel.app and try again.</div>
              <BtnSm variant="ghost" onClick={()=>setGdocsStep("idle")}>Try again</BtnSm>
            </>
          )}
          {gdocsStep==="apierror"&&(
            <>
              <div style={{fontSize:12,color:T.red,fontWeight:600}}>Couldn't create the document.</div>
              <div style={{fontSize:11,color:T.faint,lineHeight:1.5}}>Make sure Drive API is enabled in your Google Cloud project and try again.</div>
              <BtnSm variant="ghost" onClick={()=>setGdocsStep("idle")}>Try again</BtnSm>
            </>
          )}
        </div>
      </Modal>

      <Pills tabs={["active","library","templates"]} active={tab} onChange={setTab} />
      <div style={{display:"grid",gridTemplateColumns:"1fr 280px",gap:16}}>
        <div>
          {tab==="active"&&(
            activeEssay?(
            <Card>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:16,gap:12}}>
                <div style={{flex:1,minWidth:0}}>
                  <input value={activeEssay.title} onChange={e=>updateTitle(e.target.value)} style={{fontSize:15,fontWeight:700,color:T.white,marginBottom:3,background:"transparent",border:"none",outline:"none",width:"100%",fontFamily:T.font,padding:0}} />
                  <div style={{fontSize:12,color:T.muted}}>{activeEssay.subject} · {wc.toLocaleString()} / {target.toLocaleString()} words</div>
                </div>
                <div style={{display:"flex",gap:8,alignItems:"center",flexShrink:0}}>
                  <Badge color={statusOf(activeEssay)==="Submitted"?T.teal:statusOf(activeEssay)==="In progress"?T.amber:T.blue}>{statusOf(activeEssay)}</Badge>
                  <button onClick={()=>deleteEssay(activeEssay.id)} title="Delete essay" style={{border:"none",background:"transparent",color:T.faint,cursor:"pointer",fontSize:16,padding:2}}>×</button>
                </div>
              </div>
              <div style={{display:"flex",gap:2,background:T.card2,padding:"6px",borderRadius:"6px 6px 0 0",flexWrap:"wrap",border:`1px solid ${T.border}`,borderBottom:"none"}}>
                {[["B","bold",Icon.bold],["I","italic",Icon.italic],["Link","createLink",Icon.link],["Quote","formatBlock",Icon.quote]].map(([l,cmd,ico])=>(
                  <button key={l} type="button" onClick={()=>{if(cmd==="createLink"){const u=(prompt("Link URL:")||"").trim();if(!u||!((/^https?:\/\//i).test(u)||(/^mailto:/i).test(u)))return;exec(cmd,u);}else{exec(cmd,cmd==="formatBlock"?"blockquote":undefined);}}} style={{display:"flex",alignItems:"center",gap:4,padding:"5px 8px",borderRadius:4,border:"none",background:"transparent",color:T.muted,fontSize:12,cursor:"pointer",fontFamily:T.font}}>{ico} {l}</button>
                ))}
                <div style={{width:1,background:T.border,margin:"2px 4px"}} />
                {["H1","H2","H3"].map(h=><button key={h} type="button" onClick={()=>exec("formatBlock",h.toLowerCase())} style={{padding:"5px 8px",borderRadius:4,border:"none",background:"transparent",color:T.muted,fontSize:12,cursor:"pointer",fontFamily:T.font}}>{h}</button>)}
              </div>
              <div ref={editorRef} contentEditable suppressContentEditableWarning onInput={e=>updateContent(e.currentTarget.innerHTML)}
                dangerouslySetInnerHTML={{__html:activeEssay.content||"<p><br/></p>"}}
                style={{background:T.card2,border:`1px solid ${T.border}`,borderRadius:"0 0 6px 6px",padding:16,minHeight:280,fontSize:14,lineHeight:1.8,color:T.text,outline:"none"}}>
              </div>
              {toolResult&&(
                <div style={{marginTop:12,background:T.card2,border:`1px solid ${T.lime}44`,borderRadius:8,padding:14}}>
                  <Label>{toolResult.kind==="refine"?"Refined version":"Grammar pass result"}</Label>
                  <div style={{fontSize:13,color:T.text,lineHeight:1.7,whiteSpace:"pre-wrap",maxHeight:200,overflowY:"auto",marginBottom:10}}>{toolResult.text}</div>
                  <div style={{display:"flex",gap:8}}>
                    <BtnSm onClick={applyToolResult}>Use this version</BtnSm>
                    <BtnSm variant="ghost" onClick={()=>setToolResult(null)}>Dismiss</BtnSm>
                  </div>
                </div>
              )}
              <div style={{display:"flex",gap:8,marginTop:14,alignItems:"center",flexWrap:"wrap"}}>
                <BtnSm variant="subtle" onClick={()=>runTool("refine")} disabled={toolLoading==="refine"}>{Icon.wand} {toolLoading==="refine"?"Refining...":"Refine prose"}</BtnSm>
                <BtnSm variant="subtle" onClick={()=>runTool("grammar")} disabled={toolLoading==="grammar"}>{Icon.check} {toolLoading==="grammar"?"Checking...":"Grammar pass"}</BtnSm>
                <BtnSm variant="subtle" onClick={()=>setCiteOpen(true)}>{Icon.quote} Cite source</BtnSm>
                <BtnSm variant="subtle" onClick={()=>setExportOpen(true)}>{Icon.file} Export</BtnSm>
                {!activeEssay.submitted&&<BtnSm variant="subtle" onClick={markSubmitted}>{Icon.check} Mark submitted</BtnSm>}
                <div style={{marginLeft:"auto",fontSize:11,color:T.faint}}>Saved automatically</div>
              </div>
            </Card>
            ):(
              <Card style={{textAlign:"center",padding:40}}>
                <div style={{fontSize:14,color:T.muted,marginBottom:14}}>No essay open. Pick one from your library or start a new one.</div>
                <div style={{display:"flex",gap:8,justifyContent:"center"}}>
                  <Btn onClick={()=>setNewOpen(true)}>New essay</Btn>
                  <Btn variant="subtle" onClick={()=>setTab("library")}>View library</Btn>
                </div>
              </Card>
            )
          )}
          {tab==="library"&&(
            <div style={{display:"flex",flexDirection:"column",gap:8}}>
              {essays.length===0&&<Card style={{textAlign:"center",padding:40,color:T.muted,fontSize:13}}>Your library is empty. Create your first essay or start from a template.</Card>}
              {essays.slice().sort((a,b)=>b.updatedAt-a.updatedAt).map((e)=>{
                const st=statusOf(e);const ewc=wordCountOf(e.content);
                return(
                <Card key={e.id} onClick={()=>selectEssay(e.id)} style={{display:"flex",alignItems:"center",gap:16,cursor:"pointer"}}>
                  <div style={{width:3,height:40,borderRadius:2,background:colorOf(e.subject),flexShrink:0}} />
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontSize:13,fontWeight:600,color:T.white,marginBottom:2}}>{e.title}</div>
                    <div style={{fontSize:11,color:T.muted}}>{e.subject} · {ewc.toLocaleString()} / {e.target.toLocaleString()} words</div>
                  </div>
                  <Badge color={st==="Submitted"?T.teal:st==="In progress"?T.amber:T.blue}>{st}</Badge>
                  <button onClick={(ev)=>{ev.stopPropagation();deleteEssay(e.id);}} title="Delete" style={{border:"none",background:"transparent",color:T.faint,cursor:"pointer",fontSize:16,padding:2,flexShrink:0}}>×</button>
                </Card>
              );})}
            </div>
          )}
          {tab==="templates"&&(
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
              {Object.keys(ESSAY_TEMPLATES).map(t=>(
                <Card key={t} onClick={()=>useTemplate(t)} style={{cursor:"pointer",padding:16}}>
                  <div style={{width:32,height:32,borderRadius:6,background:T.card2,border:`1px solid ${T.border}`,display:"flex",alignItems:"center",justifyContent:"center",color:T.muted,marginBottom:10}}>{Icon.file}</div>
                  <div style={{fontSize:13,fontWeight:600,color:T.white,marginBottom:2}}>{t}</div>
                  <div style={{fontSize:11,color:T.muted}}>Structured template · {ESSAY_TEMPLATES[t].target.toLocaleString()} word target</div>
                </Card>
              ))}
            </div>
          )}
        </div>
        <div style={{display:"flex",flexDirection:"column",gap:12}}>
          <Card style={{background:T.lime,border:"none"}}>
            <Label style={{color:T.bg}}>Word count</Label>
            <div style={{fontSize:32,fontWeight:700,color:T.bg,letterSpacing:"-0.03em",lineHeight:1}}>{wc.toLocaleString()}</div>
            <div style={{marginTop:10,height:4,background:T.bg+"22",borderRadius:2,overflow:"hidden"}}><div style={{height:"100%",width:pct+"%",background:T.bg,borderRadius:2}} /></div>
            <div style={{fontSize:12,color:T.bg,opacity:0.7,marginTop:5}}>{activeEssay?(target>wc?(target-wc).toLocaleString()+" words remaining":"Target reached"):"No essay open"}</div>
          </Card>
          <Card>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
              <Label style={{marginBottom:0}}>Writing feedback</Label>
              <BtnSm variant="subtle" onClick={runFeedback} disabled={!activeEssay||feedbackLoading}>{feedbackLoading?"...":"Get feedback"}</BtnSm>
            </div>
            {!feedbackIssues&&<div style={{fontSize:12,color:T.faint,padding:"6px 0"}}>Click "Get feedback" for AI suggestions on your draft.</div>}
            {feedbackIssues&&feedbackIssues.map((s,i)=>(
              <div key={i} style={{display:"flex",gap:8,padding:"8px 0",borderBottom:i<feedbackIssues.length-1?`1px solid ${T.border}`:"none",fontSize:12,color:T.muted}}>
                <div style={{width:5,height:5,borderRadius:"50%",background:T.amber,flexShrink:0,marginTop:5}} />
                {s}
              </div>
            ))}
          </Card>
          <Card>
            <Label>Readability</Label>
            <div style={{fontSize:32,fontWeight:700,color:T.white,letterSpacing:"-0.02em"}}>{readability.grade}</div>
            <div style={{fontSize:12,color:T.muted,marginTop:4}}>{readability.level||"Write something to see your score"}</div>
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
  const [ytTopic,setYtTopic]=useState("");
  const [ytFetching,setYtFetching]=useState(false);
  const [cardCount,setCardCount]=useState(10);
  const [recOn,setRecOn]=useState(false);
  const [recSecs,setRecSecs]=useState(0);
  const [recText,setRecText]=useState("");
  const recRef=useRef(null);
  const [cQ,setCQ]=useState("");
  const [cA,setCA]=useState("");
  const [draft,setDraft]=useState([]);
  const colorMap={Biology:T.teal,"English IV":T.purple,Calculus:T.blue,Spanish:T.amber,Chemistry:T.red};

  // One-shot deep link from Dashboard's "Pick up where you left off" card —
  // matches the pendingTour/pendingRoutineWizard pattern used elsewhere.
  useEffect(()=>{
    const wantId=lsGet("openDeckId",null);
    if(!wantId)return;
    try{localStorage.removeItem("studlin-openDeckId");}catch(e){}
    const d=deckList.find(x=>x.id===wantId);
    if(d){setStudyDeck(d);setTab("study");setIdx(0);setFlipped(false);}
  },[]);

  useEffect(()=>{if(!recOn)return;const id=setInterval(()=>setRecSecs(x=>x+1),1000);return()=>clearInterval(id);},[recOn]);
  const fmtRec=(x)=>String(Math.floor(x/60)).padStart(2,"0")+":"+String(x%60).padStart(2,"0");

  const startRec=()=>{const SR=window.SpeechRecognition||window.webkitSpeechRecognition;if(!SR)return;const r=new SR();r.continuous=true;r.interimResults=true;r.lang="en-US";r.onresult=(e)=>{let t="";for(let i=0;i<e.results.length;i++)t+=e.results[i][0].transcript;setRecText(t);};r.onend=()=>setRecOn(false);recRef.current=r;r.start();setRecOn(true);setRecSecs(0);setRecText("");};
  const stopRec=()=>{if(recRef.current)recRef.current.stop();setRecOn(false);};

  const handleFile=async(e)=>{const file=e.target.files&&e.target.files[0];if(!file)return;e.target.value="";const ext=file.name.split(".").pop().toLowerCase();if(ext==="pdf"){try{const pdfjsLib=await window._pdfjs;const buf=await file.arrayBuffer();const pdf=await pdfjsLib.getDocument({data:buf}).promise;let text="";for(let i=1;i<=pdf.numPages;i++){const pg=await pdf.getPage(i);const tc=await pg.getTextContent();text+=tc.items.map(it=>it.str).join(" ")+"\n\n";}setFileText(text);if(!dName)setDName("Cards from "+file.name);}catch(err){setFileText("Could not read PDF.");}}else{const reader=new FileReader();reader.onload=()=>{setFileText(reader.result);if(!dName)setDName("Cards from "+file.name);};reader.readAsText(file);}};

  const aiGenCards=async(content,context,count=10)=>{
    setAiLoading(true);
    try{
      const prompt="Create "+count+" flashcards from this "+context+". Format as a JSON array where each object has a \"q\" key (question) and \"a\" key (answer). Return only the JSON array, no other text. Material:\n\n"+content.slice(0,15000);
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
      else{cards=await aiGenCards(fileText,"document/notes",cardCount);}
    }
    else if(dSource==="youtube"){
      const topic=(ytTopic||ytInfo||"").trim();
      if(!ytUrl.trim()&&!topic){cards=[{q:"No video provided",a:"Paste a YouTube link or type a topic"}];}
      else{
        const ctx=topic
          ?"YouTube video: \""+topic+"\". Generate "+cardCount+" flashcards covering all key concepts, definitions, formulas, and important facts a student needs to know from this video."
          :"YouTube video at: "+ytUrl+". Generate "+cardCount+" flashcards covering likely key concepts from this video.";
        cards=await aiGenCards(ctx,"YouTube video",cardCount);
      }
    }
    else if(dSource==="record"){
      if(!recText){cards=[{q:"No audio recorded",a:"Record a lecture first"}];}
      else{cards=await aiGenCards("Lecture transcription:\n\n"+recText,"lecture transcription",cardCount);}
    }
    if(cards.length===0){cards=[{q:"No cards were generated",a:"Try again with more content"}];}
    const nd={id:String(Date.now()),name:name,count:cards.length,done:0,color:T.lime,cards:cards,examEventId:null};
    const next=[nd,...deckList];setDeckList(next);lsSet("decks",next);
    setNewOpen(false);setDName("");setDraft([]);setFileText("");setYtUrl("");setYtInfo("");setYtTopic("");setYtFetching(false);stopRec();setRecText("");setDSource("manual");setCardCount(10);
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

  // Phase 3 — link a deck to an exam on the calendar, then propose real
  // spaced-out review sessions counting down to it. No AI/credit cost —
  // computeReviewDates is pure scheduling math — and placement reuses
  // findOpenSlotFor, the same deterministic engine every other scheduling
  // path in the app already trusts.
  const [linkExamDeckId,setLinkExamDeckId]=useState(null);
  const [reviewSchedulePreview,setReviewSchedulePreview]=useState(null); // {deckId,deckName,examTitle,examDate,sessions:[{date,time,duration,include}]}
  const upcomingExams=()=>lsGet("events",[]).filter(e=>e.kind==="exam"&&e.date>=dayKey()).sort((a,b)=>a.date.localeCompare(b.date));
  const linkDeckToExam=(deckId,examEventId)=>{
    const next=deckList.map(d=>d.id===deckId?{...d,examEventId}:d);
    setDeckList(next);lsSet("decks",next);setLinkExamDeckId(null);
  };
  const openReviewSchedule=(deck)=>{
    const exam=lsGet("events",[]).find(e=>e.id===deck.examEventId);
    if(!exam)return;
    const dates=computeReviewDates(exam.date,dayKey());
    if(dates.length===0)return;
    const duration=suggestDurationFor(exam.subject,"study block")||25;
    const events=lsGet("events",[]);
    const routines=getWeeklyRoutine();
    const prefs=getSchedulePreferences();
    let working=events;
    const sessions=dates.map(date=>{
      const slot=findOpenSlotFor(working,routines,prefs,date,prefs.workStartTime,duration,exam.date);
      working=working.concat([{date:slot.date,time:slot.time,duration}]);
      return {date:slot.date,time:slot.time,duration,include:true};
    });
    setReviewSchedulePreview({deckId:deck.id,deckName:deck.name,examTitle:exam.title,examDate:exam.date,sessions});
  };
  const commitReviewSchedule=()=>{
    if(!reviewSchedulePreview)return;
    const included=reviewSchedulePreview.sessions.filter(s=>s.include);
    const events=lsGet("events",[]);
    const newEvents=included.map((s,i)=>({
      id:"deckrev-"+reviewSchedulePreview.deckId+"-"+Date.now()+"-"+i,
      title:"Review: "+reviewSchedulePreview.deckName,date:s.date,time:s.time,
      subject:"",kind:"study block",notes:"",priority:5,difficulty:5,
      deadline:reviewSchedulePreview.examDate,duration:s.duration,
      status:"pending",timeSpent:0,completedAt:null,deckId:reviewSchedulePreview.deckId,
    }));
    lsSet("events",events.concat(newEvents));
    setReviewSchedulePreview(null);
  };

  // Live username autocomplete for "Send deck to a friend" — same
  // prefix-range Firestore query pattern Studlin Network's own search uses,
  // so typing "v" toward "vene" narrows to real registered usernames.
  const [sendDeckResults,setSendDeckResults]=useState([]);
  const [sendDeckSearching,setSendDeckSearching]=useState(false);
  const [sendDeckDropdownOpen,setSendDeckDropdownOpen]=useState(false);
  useEffect(()=>{
    const raw=sendDeckTarget.trim().toLowerCase().replace(/^@/,"");
    if(!raw){setSendDeckResults([]);setSendDeckSearching(false);return;}
    setSendDeckSearching(true);
    let active=true;
    const myUid=firebase.auth().currentUser?.uid||null;
    const t=setTimeout(async()=>{
      try{
        const snap=await fsdb().collection('profiles').where('usernameLower','>=',raw).where('usernameLower','<=',raw+String.fromCharCode(0xf8ff)).limit(6).get();
        if(!active)return;
        setSendDeckResults(snap.docs.map(d=>({uid:d.id,...d.data()})).filter(u=>u.uid!==myUid));
      }catch(e){if(active)setSendDeckResults([]);}
      if(active)setSendDeckSearching(false);
    },250);
    return ()=>{active=false;clearTimeout(t);};
  },[sendDeckTarget]);

  // Edit deck — rename + correct individual front/back card pairs, opened via
  // the card's Edit button or a double-click on its title.
  const [editDeckOpen,setEditDeckOpen]=useState(false);
  const [editDeckId,setEditDeckId]=useState(null);
  const [editDeckName,setEditDeckName]=useState("");
  const [editDeckCards,setEditDeckCards]=useState([]);
  const openEditDeck=(deck)=>{
    setEditDeckId(deck.id);
    setEditDeckName(deck.name);
    setEditDeckCards((deck.cards||[]).map(c=>({...c})));
    setEditDeckOpen(true);
  };
  const updateEditCard=(i,field,value)=>setEditDeckCards(prev=>prev.map((c,idx)=>idx===i?{...c,[field]:value}:c));
  const deleteEditCard=(i)=>setEditDeckCards(prev=>prev.filter((_,idx)=>idx!==i));
  const addEditCard=()=>setEditDeckCards(prev=>[...prev,{q:"",a:""}]);
  const saveEditDeck=()=>{
    const name=editDeckName.trim()||"Untitled deck";
    const cards=editDeckCards.filter(c=>c.q.trim()||c.a.trim());
    const next=deckList.map(d=>d.id===editDeckId?{...d,name,cards,count:cards.length}:d);
    setDeckList(next);lsSet("decks",next);
    if(studyDeck&&studyDeck.id===editDeckId)setStudyDeck({...studyDeck,name,cards});
    setEditDeckOpen(false);
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
                <div style={{position:"relative"}}>
                  <Input placeholder="e.g. @alex or alex@school.edu" value={sendDeckTarget}
                    onChange={e=>{setSendDeckTarget(e.target.value);setSendDeckDropdownOpen(true);}}
                    onFocus={()=>setSendDeckDropdownOpen(true)}
                    onBlur={()=>setTimeout(()=>setSendDeckDropdownOpen(false),150)}
                    autoFocus />
                  {sendDeckDropdownOpen&&sendDeckTarget.trim()&&(
                    <div style={{position:"absolute",top:"calc(100% + 4px)",left:0,right:0,zIndex:20,background:T.card2,border:`1px solid ${T.border}`,borderRadius:8,overflow:"hidden",boxShadow:"0 12px 28px -12px rgba(0,0,0,0.35)"}}>
                      {sendDeckSearching
                        ? <div style={{padding:"10px 12px",fontSize:12,color:T.muted}}>Searching…</div>
                        : sendDeckResults.length>0
                          ? sendDeckResults.map(u=>(
                              <div key={u.uid} onMouseDown={e=>e.preventDefault()} onClick={()=>{setSendDeckTarget("@"+(u.username||u.uid));setSendDeckDropdownOpen(false);}} style={{display:"flex",alignItems:"center",gap:10,padding:"9px 12px",cursor:"pointer",borderBottom:`1px solid ${T.border}`}}>
                                <Av initials={(u.name||"S").split(" ").map(x=>x[0]).join("")} color={T.lime} size={26} picUrl="" />
                                <div style={{minWidth:0}}>
                                  <div style={{fontSize:12.5,fontWeight:600,color:T.white}}>{u.name||"Studlin User"}</div>
                                  <div style={{fontSize:10.5,color:T.muted}}>@{u.username}{u.school?" · "+u.school:""}</div>
                                </div>
                              </div>
                            ))
                          : <div style={{padding:"10px 12px",fontSize:12,color:T.muted}}>No matches.</div>
                      }
                    </div>
                  )}
                </div>
              </Field>
            </>
        }
      </Modal>

      {/* ── LINK DECK TO EXAM ── */}
      <Modal open={!!linkExamDeckId} onClose={()=>setLinkExamDeckId(null)} title="Link to an exam" sub="Studlin will propose review sessions counting down to the exam date." width={440}>
        {upcomingExams().length===0
          ? <div style={{fontSize:13,color:T.muted,padding:"18px 0",textAlign:"center"}}>No upcoming exams on your calendar yet — add one in Calendar first.</div>
          : <div style={{display:"flex",flexDirection:"column",gap:8}}>
              {upcomingExams().map(ex=>(
                <button key={ex.id} onClick={()=>linkDeckToExam(linkExamDeckId,ex.id)} style={{textAlign:"left",padding:"11px 14px",borderRadius:10,border:`1px solid ${T.border}`,background:T.card2,cursor:"pointer",fontFamily:T.font}}>
                  <div style={{fontSize:13,fontWeight:600,color:T.white}}>{ex.title}</div>
                  <div style={{fontSize:11,color:T.muted,marginTop:2}}>{ex.date}{ex.subject?" · "+ex.subject:""}</div>
                </button>
              ))}
            </div>}
      </Modal>

      {/* ── REVIEW SCHEDULE PREVIEW — preview-then-commit, same discipline as syllabus/brain-dump review ── */}
      <Modal open={!!reviewSchedulePreview} onClose={()=>setReviewSchedulePreview(null)} title="Review sessions" sub={reviewSchedulePreview?"Counting down to "+reviewSchedulePreview.examTitle+" on "+reviewSchedulePreview.examDate+".":""} width={480}
        footer={<>
          <Btn variant="subtle" onClick={()=>setReviewSchedulePreview(null)}>Cancel</Btn>
          <Btn disabled={!reviewSchedulePreview||reviewSchedulePreview.sessions.filter(s=>s.include).length===0} onClick={commitReviewSchedule}>
            {"Add "+(reviewSchedulePreview?reviewSchedulePreview.sessions.filter(s=>s.include).length:0)+" to Calendar →"}
          </Btn>
        </>}>
        <div style={{display:"flex",flexDirection:"column",gap:8}}>
          {reviewSchedulePreview&&reviewSchedulePreview.sessions.map((s,i)=>(
            <div key={i} style={{display:"flex",alignItems:"center",gap:10,padding:"10px 12px",borderRadius:10,border:`1px solid ${T.border}`,background:s.include?T.card2:T.card,opacity:s.include?1:0.55}}>
              <input type="checkbox" checked={s.include} onChange={()=>setReviewSchedulePreview(r=>({...r,sessions:r.sessions.map((x,xi)=>xi===i?{...x,include:!x.include}:x)}))} style={{cursor:"pointer"}} />
              <div style={{flex:1,fontSize:13,color:T.text}}>{s.date} · {s.time}</div>
              <div style={{fontSize:11,color:T.muted}}>{s.duration}m</div>
            </div>
          ))}
        </div>
      </Modal>
      <Modal open={editDeckOpen} onClose={()=>setEditDeckOpen(false)} title="Edit deck" sub="Rename the deck or fix any card." width={540}
        footer={<><Btn variant="subtle" onClick={()=>setEditDeckOpen(false)}>Cancel</Btn><Btn onClick={saveEditDeck}>Save changes</Btn></>}>
        <Field label="Deck title"><Input value={editDeckName} onChange={e=>setEditDeckName(e.target.value)} autoFocus /></Field>
        <div style={{fontSize:10,fontWeight:700,letterSpacing:"0.1em",textTransform:"uppercase",color:T.faint,margin:"14px 0 8px"}}>Cards ({editDeckCards.length})</div>
        <div style={{maxHeight:320,overflowY:"auto",display:"flex",flexDirection:"column",gap:8}}>
          {editDeckCards.map((c,i)=>(
            <div key={i} style={{display:"flex",gap:6,alignItems:"flex-start",padding:8,background:T.card2,borderRadius:8,border:`1px solid ${T.border}`}}>
              <div style={{flex:1,display:"flex",flexDirection:"column",gap:6}}>
                <Textarea value={c.q} onChange={e=>updateEditCard(i,"q",e.target.value)} placeholder="Front" style={{minHeight:44}} />
                <Textarea value={c.a} onChange={e=>updateEditCard(i,"a",e.target.value)} placeholder="Back" style={{minHeight:44}} />
              </div>
              <button onClick={()=>deleteEditCard(i)} style={{background:"none",border:"none",color:T.faint,cursor:"pointer",fontSize:15,padding:4,flexShrink:0}}>×</button>
            </div>
          ))}
        </div>
        <BtnSm variant="subtle" onClick={addEditCard} style={{marginTop:10}}>{Icon.plus} Add card</BtnSm>
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
        {dSource!=="manual"&&(
          <Field label="How many cards?">
            <div style={{display:"flex",gap:8}}>
              {[5,10,15,20].map(n=>(
                <button key={n} type="button" onClick={()=>setCardCount(n)} style={{flex:1,padding:"8px 0",borderRadius:8,border:"1px solid "+(cardCount===n?T.lime+"66":T.border),background:cardCount===n?T.lime+"14":T.card2,color:cardCount===n?T.lime:T.text,fontWeight:cardCount===n?700:400,fontSize:13,cursor:"pointer",fontFamily:T.font,transition:"all 0.15s"}}>{n}</button>
              ))}
            </div>
          </Field>
        )}
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
          <>
          <Field label="YouTube link" hint="Paste a link — Studlin detects the title automatically.">
            <Input placeholder="https://youtube.com/watch?v=..." value={ytUrl} onChange={ev=>{setYtUrl(ev.target.value);var v=ev.target.value.trim();if(v&&(v.includes("youtube.com")||v.includes("youtu.be"))){setYtFetching(true);setYtInfo("");authFetch("/api/search-videos",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({url:v})}).then(function(r){return r.json();}).then(function(d){if(d.title){var t=d.title+(d.author?" by "+d.author:"");setYtInfo(t);setYtTopic(t);if(!dName)setDName(d.title+" cards");}setYtFetching(false);}).catch(function(){setYtFetching(false);});}}} />
            {ytFetching&&<div style={{fontSize:11,color:T.lime,marginTop:6}}>Detecting video...</div>}
          </Field>
          <Field label="Topic / subject" hint="Auto-filled from the video — edit or type manually if detection fails.">
            <Input placeholder="e.g. AP Physics 1 — Newton's Laws" value={ytTopic} onChange={e=>setYtTopic(e.target.value)} />
          </Field>
          </>
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
                  <button key={l} onClick={()=>{setFlipped(false);setIdx(i=>(i+1)%studyCards.length);}} style={{flex:1,padding:"9px 0",borderRadius:7,background:c+"14",color:c,border:"1px solid "+c+"33",cursor:"pointer",fontSize:12,fontWeight:600,fontFamily:T.font}}>{l}</button>
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
          {(()=>{
            const renderDeckCard=(d,i)=>(
              <Card key={d.id||i} style={{cursor:"pointer",position:"relative"}}>
                <button onClick={(e)=>{e.stopPropagation();deleteDeck(d.id);}} style={{position:"absolute",top:12,right:12,background:"none",border:"none",color:T.faint,cursor:"pointer",fontSize:14}}>x</button>
                <div onDoubleClick={(e)=>{e.stopPropagation();openEditDeck(d);}} title="Double-click to edit" style={{fontSize:13,fontWeight:700,color:T.white,marginBottom:4}}>{d.name}</div>
                <div style={{fontSize:11,color:T.muted,marginBottom:10}}>{d.cards?d.cards.length:d.count} cards{d.source==="imported"&&<span style={{color:T.teal,fontWeight:600}}> · from {d.importedFrom}</span>}</div>
                {(()=>{
                  const linkedExam=d.examEventId?lsGet("events",[]).find(e=>e.id===d.examEventId):null;
                  return linkedExam ? (
                    <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:10,flexWrap:"wrap"}}>
                      <span style={{fontSize:10.5,fontWeight:700,padding:"3px 8px",borderRadius:99,background:T.lime+"14",color:T.lime,border:`1px solid ${T.lime}33`}}>Exam: {linkedExam.title} · {linkedExam.date}</span>
                      <button onClick={(e)=>{e.stopPropagation();openReviewSchedule(d);}} style={{background:"none",border:"none",color:T.lime,cursor:"pointer",fontFamily:T.font,fontSize:11,fontWeight:600,textDecoration:"underline",padding:0}}>Schedule reviews →</button>
                    </div>
                  ) : (
                    <button onClick={(e)=>{e.stopPropagation();setLinkExamDeckId(d.id);}} style={{background:"none",border:"none",color:T.muted,cursor:"pointer",fontFamily:T.font,fontSize:11,textDecoration:"underline",padding:0,marginBottom:10,display:"block"}}>+ Link to an exam</button>
                  );
                })()}
                <div style={{display:"flex",gap:6}}>
                  <BtnSm onClick={()=>{setStudyDeck(d);setTab("study");setIdx(0);setFlipped(false);}}>Study now</BtnSm>
                  <BtnSm variant="ghost" onClick={(e)=>{e.stopPropagation();openEditDeck(d);}}>{Icon.pen} Edit</BtnSm>
                  <BtnSm variant="ghost" onClick={(e)=>{e.stopPropagation();sendDeck(d);}}>{Icon.send} Send</BtnSm>
                </div>
              </Card>
            );
            const ownDecks=deckList.filter(d=>d.source!=="imported");
            const importedDecks=deckList.filter(d=>d.source==="imported");
            return (<>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>{ownDecks.map(renderDeckCard)}</div>
              {importedDecks.length>0&&<div style={{fontSize:10,fontWeight:700,letterSpacing:"0.1em",textTransform:"uppercase",color:T.faint,margin:"18px 0 10px"}}>Imported Decks</div>}
              {importedDecks.length>0&&<div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>{importedDecks.map(renderDeckCard)}</div>}
            </>);
          })()}
        </div>
      )}
    </div>
  );
}

// ─── NOTES ────────────────────────────────────────────────────────────────────
function Notes(){
  const MicIcon=<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{flexShrink:0,display:"block"}}><rect x="9" y="2" width="6" height="12" rx="3"/><path d="M5 10v1a7 7 0 0 0 14 0v-1"/><line x1="12" y1="18" x2="12" y2="22"/></svg>;

  // Dynamic class sync from user subjects
  const userSubjects=getSubjects();
  const tagOptions=[...userSubjects.map(s=>({value:s.label,label:s.label,color:s.color})),{value:"Other",label:"Other",color:T.lime}];
  const colorOf=(tg)=>{const s=userSubjects.find(x=>x.label===tg);return s?s.color:T.lime;};

  const [notes,setNotes]=useState(()=>{const n=lsGet("notes",null);return(n&&Array.isArray(n))?n.filter(x=>x&&x.title):[];});
  const [sel,setSel]=useState(null);
  const [search,setSearch]=useState("");
  const filtered=notes.filter(n=>n.title.toLowerCase().includes(search.toLowerCase())||(n.body||"").replace(/<[^>]+>/g," ").toLowerCase().includes(search.toLowerCase()));

  // Modal state — metadata only, no body field
  const [newOpen,setNewOpen]=useState(false);
  const [src,setSrc]=useState("write");
  const [newTitle,setNewTitle]=useState("");
  const [newTag,setNewTag]=useState(()=>tagOptions[0]?.value||"Biology");
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
  const [syllabusText,setSyllabusText]=useState("");
  const syllabusFileRef=useRef(null);
  const [syllabusReview,setSyllabusReview]=useState(null); // {noteId, items:[{id,title,date,kind,confidence,include}]}
  const [syllabusToast,setSyllabusToast]=useState("");
  const [deleteNoteConfirm,setDeleteNoteConfirm]=useState(null); // {idx, linked:[events]}

  // One-shot deep link from Dashboard's "Pick up where you left off" card —
  // matches the pendingTour/pendingRoutineWizard pattern used elsewhere.
  // sel is an INDEX into notes (matching the existing setSel(idx) click
  // handler in the note list below), not the note's own id.
  useEffect(()=>{
    const wantId=lsGet("openNoteId",null);
    if(!wantId)return;
    try{localStorage.removeItem("studlin-openNoteId");}catch(e){}
    const i=notes.findIndex(n=>n.id===wantId);
    if(i>=0)setSel(i);
  },[]);

  // Canvas / editor state
  const editorRef=useRef(null);
  const activeSel=useRef(sel); // tracks last sel without re-render side-effects
  const [popover,setPopover]=useState(null); // {x,y,selText}
  const [noteComments,setNoteComments]=useState(()=>lsGet("note-comments",{}));
  const [noteFlags,setNoteFlags]=useState(()=>lsGet("note-flags",{}));
  const [commentDraft,setCommentDraft]=useState("");
  const [commentInputOpen,setCommentInputOpen]=useState(false);
  const [pendingSel,setPendingSel]=useState(null);
  const [pendingSelGlobal,setPendingSelGlobal]=useState(false); // true = document-level comment, no text selected
  const [cleaning,setCleaning]=useState(false);

  // Send note state
  const [sendNoteOpen,setSendNoteOpen]=useState(false);
  const [sendNoteTarget,setSendNoteTarget]=useState("");
  const [sendNoteStatus,setSendNoteStatus]=useState(""); // "" | "sending" | "sent" | "error"
  const [sendNoteError,setSendNoteError]=useState("");

  // Split-screen AI Tutor sidebar
  const [tutorOpen,setTutorOpen]=useState(false);
  const [tutorCtx,setTutorCtx]=useState("");
  const [tutorMsgs,setTutorMsgs]=useState([]);
  const [tutorInput,setTutorInput]=useState("");
  const [tutorSending,setTutorSending]=useState(false);

  // AI study-tools panel — turn the active note into flashcards, a quiz, or a summary
  const [panelLoading,setPanelLoading]=useState(null); // "cards" | "quiz" | "summary" | null
  const [panelMsg,setPanelMsg]=useState("");
  const [quizOverlay,setQuizOverlay]=useState(null); // {questions,idx,picked,score,done}
  const [summaryOverlay,setSummaryOverlay]=useState(null); // array of bullet strings

  useEffect(()=>{if(!rec)return;const id=setInterval(()=>setRecSecs(x=>x+1),1000);return()=>clearInterval(id);},[rec]);
  const fmtRec=(x)=>String(Math.floor(x/60)).padStart(2,"0")+":"+String(x%60).padStart(2,"0");

  // Sync editor DOM whenever the selected note changes
  useEffect(()=>{
    activeSel.current=sel;
    if(sel===null||!editorRef.current||!notes[sel])return;
    const body=notes[sel].body||"";
    const isHtml=body.trim().startsWith("<");
    editorRef.current.innerHTML=isHtml?sanitizeHtml(body):body?body.split("\n\n").map(p=>"<p>"+(p||"<br>")+"</p>").join(""):"<p><br></p>";
  },[sel]); // intentionally omit notes — only fire on note switch

  const onEditorInput=()=>{
    const idx=activeSel.current;
    if(idx===null||!editorRef.current)return;
    const html=editorRef.current.innerHTML;
    setNotes(prev=>{const next=prev.map((n,i)=>i===idx?Object.assign({},n,{body:html}):n);lsSet("notes",next);return next;});
  };

  const execFmt=(cmd,arg=null)=>{if(editorRef.current)editorRef.current.focus();document.execCommand(cmd,false,arg);};

  const handleEditorMouseUp=()=>{
    const s=window.getSelection();
    const text=s?s.toString().trim():"";
    if(text.length<2){setPopover(null);return;}
    if(s.rangeCount>0){
      const range=s.getRangeAt(0);
      const rect=range.getBoundingClientRect();
      const wrap=editorRef.current.parentElement.getBoundingClientRect();
      setPopover({x:rect.left-wrap.left+rect.width/2,y:rect.top-wrap.top-46,selText:text});
    }
  };

  const doAddComment=()=>{
    if(!commentDraft.trim()||sel===null)return;
    if(!pendingSelGlobal&&!pendingSel)return;
    const noteId=notes[sel].id;
    const c={id:String(Date.now()),selectedText:pendingSelGlobal?null:pendingSel,text:commentDraft.trim(),date:new Date().toLocaleDateString()};
    const updated={...noteComments,[noteId]:[...(noteComments[noteId]||[]),c]};
    setNoteComments(updated);lsSet("note-comments",updated);
    setCommentDraft("");setCommentInputOpen(false);setPendingSel(null);setPendingSelGlobal(false);setPopover(null);
  };

  // Document-level comment — attaches a note to the whole file, no highlight required
  const openDocComment=()=>{
    if(sel===null)return;
    setPendingSel(null);setPendingSelGlobal(true);setCommentInputOpen(true);setPopover(null);
  };

  const doAddFlag=(selText)=>{
    if(!selText||sel===null)return;
    const noteId=notes[sel].id;
    const f={id:String(Date.now()),selectedText:selText,date:new Date().toLocaleDateString()};
    const updated={...noteFlags,[noteId]:[...(noteFlags[noteId]||[]),f]};
    setNoteFlags(updated);lsSet("note-flags",updated);
    const all=lsGet("tutor-flags",[]);
    all.push({...f,noteTitle:notes[sel].title,noteId,from:"notes"});
    lsSet("tutor-flags",all);
    setPopover(null);setPendingSel(null);
    openTutorWithContext(selText);
  };

  // Immediately analyze the flagged text via the API and open the sidebar
  const openTutorWithContext=async(selText)=>{
    setTutorCtx(selText);
    setTutorOpen(true);
    setTutorMsgs([{role:"ai",text:"…",loading:true}]);
    const analysisPrompt=
      `A student flagged this passage from their study notes:\n\n"${selText.slice(0,600)}"\n\n`+
      `Respond as their AI tutor. Follow these rules:\n`+
      `- If the passage contains a question (has words like why, how, what, explain, define, or ends with "?"), answer it directly with a clear, engaging explanation. Use an analogy if it helps.\n`+
      `- If the passage is a concept, formula, term, or statement, give a concise 2-sentence explanation of what it means, then ask ONE sharp follow-up question to test whether the student actually understands it.\n`+
      `Be direct. Sound like a smart tutor, not a textbook. Keep it under 150 words.`;
    try{
      const res=await authFetch("/api/chat",{
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body:JSON.stringify({messages:[{r:"user",t:analysisPrompt}],model:"standard",...getAiPrefs()})
      });
      if(!res.ok){
        const errData=await res.json().catch(()=>({}));
        throw new Error(errData.error||"HTTP "+res.status);
      }
      const data=await res.json();
      setTutorMsgs([{role:"ai",text:data.reply||"I'm here to help. What would you like to know about this passage?"}]);
    }catch(e){
      console.error("[openTutorWithContext] error:",e);
      setTutorMsgs([{role:"ai",text:"I'm here to help with \""+selText.slice(0,60)+(selText.length>60?"…":"")+"\". What would you like me to explain?"}]);
    }
  };

  // Document-level tutor — no highlight required. Pulls the whole note as context
  // and opens the sidebar ready for the student's first question.
  const openTutorForDocument=()=>{
    if(sel===null||!editorRef.current)return;
    const tmp=document.createElement("div");tmp.innerHTML=editorRef.current.innerHTML;
    const plain=(tmp.textContent||tmp.innerText||"").trim();
    setTutorCtx(plain);
    setTutorOpen(true);
    setTutorMsgs([{role:"ai",text:plain?"I've got the whole note open — \""+notes[sel].title+"\". Ask me anything about it: a summary, a quiz, or something specific you're stuck on.":"This note is empty — write something first, then I can help you with it."}]);
    setPopover(null);
  };

  const sendTutorMsg=async()=>{
    const txt=tutorInput.trim();
    if(!txt||tutorSending)return;
    setTutorMsgs(m=>[...m,{role:"user",text:txt}]);
    setTutorInput("");
    setTutorSending(true);
    try{
      // Reconstruct conversation for the API. The conversation always starts with
      // the analysis prompt (user) → initial AI response, then the real turns after.
      // api/chat expects {r:"user"|"ai", t:"..."} — "ai" maps to assistant inside the API.
      // Sliced generously since tutorCtx may be an entire note, not just a highlighted passage.
      const ctx=tutorCtx?`[Notes for context: "${tutorCtx.slice(0,6000)}"]\n\n`:"";
      const realMsgs=tutorMsgs.filter(m=>!m.loading);
      // Synthetic opener restores the initial user→ai exchange so the model has context
      const opener={r:"user",t:ctx+"Help me understand these notes and answer my questions about them."};
      // Map existing display messages into API format
      const history=realMsgs.map(m=>({r:m.role==="user"?"user":"ai",t:m.text}));
      // Full sequence: opener → initial AI response → subsequent turns → new user msg
      const apiMsgs=[opener,...history,{r:"user",t:txt}];
      const res=await authFetch("/api/chat",{
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body:JSON.stringify({messages:apiMsgs,model:"standard",...getAiPrefs()})
      });
      if(!res.ok){
        const errData=await res.json().catch(()=>({}));
        console.error("[sendTutorMsg] API error response:",res.status,errData);
        throw new Error(errData.error||"HTTP "+res.status);
      }
      const data=await res.json();
      setTutorMsgs(m=>[...m,{role:"ai",text:data.reply||"No response received."}]);
    }catch(e){
      console.error("[sendTutorMsg] error:",e);
      setTutorMsgs(m=>[...m,{role:"ai",text:"Error: "+e.message+". Please try again."}]);
    }
    setTutorSending(false);
  };

  const cleanNotes=async()=>{
    if(sel===null||cleaning||!editorRef.current)return;
    const html=editorRef.current.innerHTML;
    const tmp=document.createElement("div");tmp.innerHTML=html;
    const plain=(tmp.textContent||tmp.innerText||"").trim();
    if(!plain)return;
    setCleaning(true);
    try{
      const prompt="You are a study note formatter. Fix spelling, grammar, and structure. Organise into scannable sections using <h3>, <p>, <ul>, <li>, <strong>, <em> HTML tags. Do not change any facts. Return only the HTML, no markdown fences.\n\nRaw notes:\n"+plain.slice(0,15000);
      const res=await authFetch("/api/chat",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({messages:[{r:"user",t:prompt}],model:"flash"})});
      const data=await res.json();
      if(data.reply){
        const cleaned=sanitizeHtml(data.reply.replace(/```html?\n?/gi,"").replace(/```/g,"").trim());
        editorRef.current.innerHTML=cleaned;
        onEditorInput();
      }
    }catch(e){
      // Fallback: paragraph-wrap lines
      const fallback=plain.split("\n").filter(l=>l.trim()).map(l=>"<p>"+l+"</p>").join("");
      editorRef.current.innerHTML=fallback;
      onEditorInput();
    }
    setCleaning(false);
  };

  const sources=[
    {id:"write",label:"Write",desc:"Type directly on the canvas",icon:Icon.pen,cost:null},
    {id:"file",label:"Scan a file",desc:"PDF, slides, or photos of the board",icon:Icon.file,cost:"2 credits"},
    {id:"record",label:"Record lecture",desc:"Live transcription + summary",icon:MicIcon,cost:"3 credits"},
    {id:"youtube",label:"YouTube link",desc:"Transcribes and summarises a video",icon:Icon.link,cost:"3 credits"},
    {id:"syllabus",label:"Syllabus",desc:getPlan()==="Free"?Math.max(0,SYLLABUS_SCAN_LIMIT-getSyllabusScanUsage().count)+" free scan"+(SYLLABUS_SCAN_LIMIT-getSyllabusScanUsage().count===1?"":"s")+" left this month":"Paste or upload — Studlin finds every deadline",icon:Icon.cal,cost:"1 credit"},
  ];

  const startRec=()=>{
    const SR=window.SpeechRecognition||window.webkitSpeechRecognition;
    if(!SR){setRecText("Speech recognition not supported. Try Chrome.");return;}
    const r=new SR();r.continuous=true;r.interimResults=true;r.lang="en-US";
    r.onresult=(e)=>{let t="";for(let i=0;i<e.results.length;i++)t+=e.results[i][0].transcript;setRecText(t);};
    r.onerror=()=>setRec(false);r.onend=()=>setRec(false);
    recognitionRef.current=r;r.start();setRec(true);setRecSecs(0);setRecText("");
  };
  const stopRec=()=>{if(recognitionRef.current)recognitionRef.current.stop();setRec(false);};

  const handleFile=async(e)=>{
    const file=e.target.files&&e.target.files[0];if(!file)return;e.target.value="";
    const ext=file.name.split(".").pop().toLowerCase();
    if(ext==="pdf"){
      try{const pdfjsLib=await window._pdfjs;const buf=await file.arrayBuffer();const pdf=await pdfjsLib.getDocument({data:buf}).promise;let text="";for(let i=1;i<=pdf.numPages;i++){const pg=await pdf.getPage(i);const tc=await pg.getTextContent();text+=tc.items.map(it=>it.str).join(" ")+"\n\n";}setFileText(text);if(!newTitle)setNewTitle("Notes from "+file.name);}catch(err){setFileText("Could not read PDF: "+err.message);}
    }else{const reader=new FileReader();reader.onload=()=>{setFileText(reader.result);if(!newTitle)setNewTitle("Notes from "+file.name);};reader.readAsText(file);}
  };

  // Same PDF/text extraction as handleFile, just targeting syllabusText —
  // cloned rather than threading src through handleFile's closure, since
  // the two sources (scanned notes vs. a syllabus) shouldn't share state.
  const handleSyllabusFile=async(e)=>{
    const file=e.target.files&&e.target.files[0];if(!file)return;e.target.value="";
    const ext=file.name.split(".").pop().toLowerCase();
    if(ext==="pdf"){
      try{const pdfjsLib=await window._pdfjs;const buf=await file.arrayBuffer();const pdf=await pdfjsLib.getDocument({data:buf}).promise;let text="";for(let i=1;i<=pdf.numPages;i++){const pg=await pdf.getPage(i);const tc=await pg.getTextContent();text+=tc.items.map(it=>it.str).join(" ")+"\n\n";}setSyllabusText(text);if(!newTitle)setNewTitle("Notes from "+file.name);}catch(err){setSyllabusText("Could not read PDF: "+err.message);}
    }else{const reader=new FileReader();reader.onload=()=>{setSyllabusText(reader.result);if(!newTitle)setNewTitle("Notes from "+file.name);};reader.readAsText(file);}
  };

  const aiSummarize=async(text,context)=>{
    setAiLoading(true);
    try{
      const prompt="Summarize the following "+context+" into well-structured study notes. Use <h3>, <p>, <ul>, <li>, <strong> tags. Be thorough but concise. Return HTML only.\n\n"+text.slice(0,30000);
      const res=await authFetch("/api/chat",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({messages:[{r:"user",t:prompt}],model:"flash"})});
      const data=await res.json();setAiLoading(false);
      return (data.reply||text).replace(/```html?\n?/gi,"").replace(/```/g,"").trim();
    }catch(e){setAiLoading(false);return text;}
  };

  // Extracts every deadline/exam/assignment date from a pasted or scanned
  // syllabus as structured JSON — deliberately model:"standard" not "flash"
  // (a real syllabus can hold 15-30 dates; flash's 512-token cap and
  // brevity-biased system prompt risks truncating a list that long, and
  // standard costs the same 1 credit). Same "AI attempt, then deterministic
  // fallback" shape aiArrange uses for AI Schedule Mode — never dead-ends.
  const extractSyllabusDeadlines=async(text)=>{
    if(!text||!text.trim())return [];
    try{
      const prompt="Extract every deadline, due date, exam date, and assignment date from this course syllabus. "+
        "Today's date is "+dayKey()+" — if a date has no year, infer the most likely upcoming year given today's date. "+
        "For each item return: \"title\" (short, e.g. \"Problem Set 3\" or \"Midterm Exam\"), "+
        "\"date\" (YYYY-MM-DD, your best guess — never omit even if uncertain), "+
        "\"kind\" (either \"deadline\" for assignments/readings/papers or \"exam\" for tests/midterms/finals), "+
        "\"confidence\" (\"high\" if an explicit date was stated, \"low\" if you inferred/guessed it, e.g. from \"the Friday after spring break\"). "+
        "Respond with ONLY valid JSON, no markdown fences, no commentary: "+
        "{\"deadlines\":[{\"title\":\"Problem Set 3\",\"date\":\"2026-09-22\",\"kind\":\"deadline\",\"confidence\":\"high\"}]}. "+
        "If you find no dates at all, respond with {\"deadlines\":[]}.\n\n"+text.slice(0,30000);
      const res=await authFetch("/api/chat",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({messages:[{r:"user",t:prompt}],model:"standard"})});
      const data=await res.json();
      const raw=(data.reply||"").replace(/```json?\n?/gi,"").replace(/```/g,"").trim();
      const parsed=JSON.parse(raw);
      if(parsed&&Array.isArray(parsed.deadlines))return parsed.deadlines;
      return regexScanDeadlines(text);
    }catch(e){return regexScanDeadlines(text);}
  };

  // "Continue to Canvas" — creates note and enters canvas immediately
  const continueToCanvas=async()=>{
    const tag=newTag==="Other"&&customTag.trim()?customTag.trim():newTag;
    let title=newTitle.trim();
    let body="<p><br></p>";
    let syllabusItems=null;
    if(src==="write"){
      if(!title)title="Untitled note";
    }else if(src==="file"){
      if(!title)title="Scanned notes";
      body=fileText.trim()?await aiSummarize(fileText,"document/file"):"<p>No file content.</p>";
    }else if(src==="record"){
      if(!title)title="Lecture notes – "+fmtRec(recSecs);
      body=recText.trim()?await aiSummarize(recText,"lecture transcription"):"<p>No audio captured.</p>";
    }else if(src==="youtube"){
      if(!title)title=ytInfo?"Notes: "+ytInfo:"Notes from video";
      const topic=ytInfo||yt.trim();
      body=topic?await aiSummarize("Create comprehensive study notes on a YouTube video titled: \""+topic+"\". Include headings, definitions, bullet points, summary.","YouTube study notes"):"<p>Paste a YouTube link.</p>";
    }else if(src==="syllabus"){
      if(!title)title="Syllabus";
      if(syllabusText.trim()){
        body=await aiSummarize(syllabusText,"course syllabus");
        if(canScanSyllabus()){
          setAiLoading(true);
          syllabusItems=await extractSyllabusDeadlines(syllabusText);
          setAiLoading(false);
          recordSyllabusScan();
        }else{
          syllabusItems=[];
          setSyllabusToast("You've used all "+SYLLABUS_SCAN_LIMIT+" free syllabus scans this month — the note saved, but deadline extraction needs Pro.");
          setTimeout(()=>setSyllabusToast(""),4200);
        }
      }else{
        body="<p>Paste or upload a syllabus.</p>";
        syllabusItems=[];
      }
    }
    const newNote={id:String(Date.now()),title,body,tag,date:new Date().toLocaleDateString("en-US",{month:"short",day:"numeric"}),createdAt:Date.now()};
    const next=[newNote,...notes];
    setNotes(next);lsSet("notes",next);
    setNewOpen(false);setNewTitle("");setYt("");setYtInfo("");setRec(false);setRecSecs(0);setRecText("");setSrc("write");setFileText("");setSyllabusText("");setSearch("");
    setSel(0);
    setPopover(null);
    if(syllabusItems!==null){
      setSyllabusReview({noteId:newNote.id,tag,items:syllabusItems.map((d,i)=>({id:"si-"+i,...d,include:true}))});
    }
  };

  const updateNote=(idx,updates)=>{const next=notes.map((n,i)=>i===idx?Object.assign({},n,updates):n);setNotes(next);lsSet("notes",next);};
  const doDeleteNote=(idx,alsoDeleteLinkedEvents)=>{
    const note=notes[idx];
    const next=notes.filter((_,i)=>i!==idx);
    setNotes(next);lsSet("notes",next);setSel(s=>s===idx?null:s>idx?s-1:s);
    if(alsoDeleteLinkedEvents&&note){
      const events=lsGet("events",[]);
      lsSet("events",events.filter(e=>e.noteId!==note.id));
    }
  };
  // Deleting a note is normally instant (no confirm) — but a note that
  // generated real calendar deadlines (via the Syllabus source) is the one
  // case where deletion has calendar-visible consequences, so that case
  // alone gets a confirm modal, checkbox defaulting unchecked: an orphaned
  // harmless noteId on a surviving event beats silently vaporizing a
  // student's real deadlines.
  const deleteNote=(idx)=>{
    const note=notes[idx];
    const linked=lsGet("events",[]).filter(e=>e.noteId===note.id);
    if(linked.length>0){setDeleteNoteConfirm({idx,linked});return;}
    doDeleteNote(idx,false);
  };
  const exportNote=(n)=>{const t=document.createElement("div");t.innerHTML=n.body;navigator.clipboard&&navigator.clipboard.writeText(n.title+"\n\n"+(t.textContent||t.innerText));};
  const sendNote=async()=>{
    const t=sendNoteTarget.trim();
    if(!t||sel===null)return;
    setSendNoteStatus("sending");
    setSendNoteError("");
    try{
      console.log("[sendNote] Calling /api/notify for",t);
      const res=await authFetch("/api/notify",{
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body:JSON.stringify({
          type:"note",
          recipientEmail:t,
          noteTitle:notes[sel].title,
          noteBody:notes[sel].body,
          noteTag:notes[sel].tag,
          senderName:getUserName()
        })
      });
      const data=await res.json();
      console.log("[sendNote] Response",res.status,data);
      if(!res.ok||data.error){
        const msg=data.detail||data.error||"Send failed (HTTP "+res.status+")";
        console.error("[sendNote] Error:",msg);
        setSendNoteError(msg);
        setSendNoteStatus("error");
        return;
      }
      setSendNoteStatus("sent");
      setTimeout(()=>{setSendNoteOpen(false);setSendNoteTarget("");setSendNoteStatus("");setSendNoteError("");},2200);
    }catch(e){
      console.error("[sendNote] Network/fetch error:",e.message);
      setSendNoteError("Network error — "+e.message);
      setSendNoteStatus("error");
    }
  };
  const removeComment=(nid,cid)=>{const u={...noteComments,[nid]:(noteComments[nid]||[]).filter(c=>c.id!==cid)};setNoteComments(u);lsSet("note-comments",u);};
  const removeFlag=(nid,fid)=>{
    const u={...noteFlags,[nid]:(noteFlags[nid]||[]).filter(f=>f.id!==fid)};setNoteFlags(u);lsSet("note-flags",u);
    lsSet("tutor-flags",lsGet("tutor-flags",[]).filter(f=>f.id!==fid));
  };

  // Plain-text extraction of the active note's canvas content, for feeding to the AI
  const getNotePlainText=()=>{
    if(sel===null||!editorRef.current)return "";
    const tmp=document.createElement("div");tmp.innerHTML=editorRef.current.innerHTML;
    return (tmp.textContent||tmp.innerText||"").trim();
  };

  const genFlashcardsFromNote=async()=>{
    const text=getNotePlainText();
    if(!text){setPanelMsg("This note is empty — write something first.");return;}
    setPanelLoading("cards");setPanelMsg("");
    try{
      const prompt="Create 10 flashcards from these study notes. Format them as a JSON array where each card has a \"q\" key for the question and an \"a\" key for the answer. Return only the JSON array, no markdown fences.\n\n"+text.slice(0,15000);
      const res=await authFetch("/api/chat",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({messages:[{r:"user",t:prompt}],model:"standard"})});
      const data=await res.json();
      let raw=(data.reply||"").replace(/```json?|```/g,"").trim();
      const s=raw.indexOf("["),e=raw.lastIndexOf("]");
      if(s>=0&&e>s)raw=raw.slice(s,e+1);
      let cards=[];
      try{const parsed=JSON.parse(raw);cards=Array.isArray(parsed)?parsed:[];}catch(pe){cards=[];}
      if(cards.length===0){setPanelMsg("Couldn't generate cards. Try again.");setPanelLoading(null);return;}
      const nd={id:String(Date.now()),name:activeNote.title,count:cards.length,done:0,color:colorOf(activeNote.tag),cards};
      const decks=lsGet("decks",[]);
      lsSet("decks",[nd,...decks]);
      setPanelMsg("✓ Saved "+cards.length+" cards to Flashcards — \""+nd.name+"\"");
    }catch(e){setPanelMsg("Something went wrong. Try again.");}
    setPanelLoading(null);
  };

  const genQuizFromNote=async()=>{
    const text=getNotePlainText();
    if(!text){setPanelMsg("This note is empty — write something first.");return;}
    setPanelLoading("quiz");setPanelMsg("");
    try{
      const prompt="Create a 5-question multiple-choice practice quiz from these study notes. Format as a JSON array where each item has \"question\" (string), \"options\" (array of exactly 4 strings), and \"correct\" (0-based index of the right option). Return only the JSON array, no markdown fences.\n\n"+text.slice(0,15000);
      const res=await authFetch("/api/chat",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({messages:[{r:"user",t:prompt}],model:"standard"})});
      const data=await res.json();
      let raw=(data.reply||"").replace(/```json?|```/g,"").trim();
      const s=raw.indexOf("["),e=raw.lastIndexOf("]");
      if(s>=0&&e>s)raw=raw.slice(s,e+1);
      let qs=[];
      try{const parsed=JSON.parse(raw);qs=Array.isArray(parsed)?parsed.filter(q=>q&&q.question&&Array.isArray(q.options)&&q.options.length>=2):[];}catch(pe){qs=[];}
      if(qs.length===0){setPanelMsg("Couldn't generate a quiz. Try again.");setPanelLoading(null);return;}
      setQuizOverlay({questions:qs,idx:0,picked:null,score:0,done:false});
    }catch(e){setPanelMsg("Something went wrong. Try again.");}
    setPanelLoading(null);
  };

  const genSummaryFromNote=async()=>{
    const text=getNotePlainText();
    if(!text){setPanelMsg("This note is empty — write something first.");return;}
    setPanelLoading("summary");setPanelMsg("");
    try{
      const prompt="Summarize these study notes into a concise, high-level bulleted summary for quick review — no more than 8 bullet points. Return only the bullet points as plain text lines, each starting with \"- \". No markdown headers, no extra commentary.\n\n"+text.slice(0,15000);
      const res=await authFetch("/api/chat",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({messages:[{r:"user",t:prompt}],model:"flash"})});
      const data=await res.json();
      const raw=(data.reply||"").trim();
      const bullets=raw.split("\n").map(l=>l.replace(/^[-*•]\s*/,"").trim()).filter(Boolean);
      setSummaryOverlay(bullets.length?bullets:["No summary available."]);
    }catch(e){setPanelMsg("Something went wrong. Try again.");}
    setPanelLoading(null);
  };

  const activeNote=sel!==null?notes[sel]:null;
  const nid=activeNote?.id;
  const activeComments=nid?noteComments[nid]||[]:[];
  const activeFlags=nid?noteFlags[nid]||[]:[];
  const hasMargin=activeComments.length>0||activeFlags.length>0;

  // Toolbar button style helper
  const tbBtn=(active=false)=>({padding:"5px 9px",borderRadius:5,border:`1px solid ${active?T.lime+"55":T.border}`,background:active?T.lime+"14":"transparent",color:active?T.lime:T.muted,cursor:"pointer",fontFamily:T.font,fontSize:12,fontWeight:600,display:"inline-flex",alignItems:"center",gap:4,transition:"all 0.12s"});

  return (
    <div>
      <PH title="Notes" sub="Write, scan, record, or import" action={<Btn onClick={()=>setNewOpen(true)}>{React.createElement("span",{style:{display:"flex",alignItems:"center",gap:6}},Icon.plus,"New note")}</Btn>} />

      {/* ── SEND NOTE MODAL ── */}
      <Modal open={sendNoteOpen} onClose={()=>{if(sendNoteStatus==="sending")return;setSendNoteOpen(false);setSendNoteTarget("");setSendNoteStatus("");setSendNoteError("");}} title="Send note to a friend" sub="Deliver this note directly to any email address." width={440}
        footer={sendNoteStatus==="sent"?null:(
          <>
            <Btn variant="subtle" onClick={()=>{setSendNoteOpen(false);setSendNoteTarget("");setSendNoteStatus("");setSendNoteError("");}} style={{opacity:sendNoteStatus==="sending"?0.4:1}}>Cancel</Btn>
            <Btn onClick={sendNote} disabled={sendNoteStatus==="sending"||!sendNoteTarget.trim()} style={{opacity:(!sendNoteTarget.trim()||sendNoteStatus==="sending")?0.45:1}}>
              {sendNoteStatus==="sending"?<>{Icon.send} Sending…</>:<>{Icon.send} Send note</>}
            </Btn>
          </>
        )}>
        {sendNoteStatus==="sent"?(
          <div style={{textAlign:"center",padding:"24px 0"}}>
            <div style={{width:48,height:48,borderRadius:"50%",background:T.teal+"18",border:`1px solid ${T.teal}44`,display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 14px",color:T.teal}}>{Icon.check}</div>
            <div style={{fontSize:15,fontWeight:600,color:T.white,marginBottom:4}}>Email sent!</div>
            <div style={{fontSize:13,color:T.muted}}>"{sel!==null&&notes[sel]?notes[sel].title:""}" was emailed to <strong style={{color:T.lime}}>{sendNoteTarget}</strong></div>
          </div>
        ):(
          <>
            <div style={{padding:"12px 14px",background:T.card2,borderRadius:8,border:`1px solid ${T.border}`,marginBottom:14}}>
              <div style={{fontSize:12,fontWeight:600,color:T.white,marginBottom:2}}>{sel!==null&&notes[sel]?notes[sel].title:"Selected note"}</div>
              {sel!==null&&notes[sel]&&<div style={{fontSize:11,color:T.muted}}>{notes[sel].tag} · {notes[sel].date}</div>}
            </div>
            <Field label="Recipient email"><Input placeholder="e.g. alex@school.edu" value={sendNoteTarget} onChange={e=>{setSendNoteTarget(e.target.value);setSendNoteError("");}} autoFocus /></Field>
            {sendNoteStatus==="error"&&(
              <div style={{marginTop:10,padding:"10px 13px",background:T.red+"12",border:`1px solid ${T.red}33`,borderRadius:8,fontSize:12,color:T.red,lineHeight:1.5}}>
                {sendNoteError||"Something went wrong. Check the Vercel function logs."}
              </div>
            )}
          </>
        )}
      </Modal>

      {/* ── NEW NOTE MODAL — metadata only, no body field ── */}
      <Modal open={newOpen} onClose={()=>{setNewOpen(false);stopRec();}} title="New note" sub="Configure your note. You'll write on the canvas next." width={560}
        footer={<><Btn variant="subtle" onClick={()=>{setNewOpen(false);stopRec();}}>Cancel</Btn><Btn onClick={continueToCanvas} disabled={aiLoading}>{aiLoading?"Processing…":"Continue to Canvas →"}</Btn></>}>
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
        <Field label="Title"><Input placeholder="e.g. Macbeth Act IV notes" value={newTitle} onChange={ev=>setNewTitle(ev.target.value)} autoFocus /></Field>
        <Field label="Class"><SelectChip options={tagOptions} value={newTag} onChange={setNewTag} /></Field>
        {newTag==="Other"&&<Field label="Custom class"><Input placeholder="e.g. Physics, SAT prep..." value={customTag} onChange={ev=>setCustomTag(ev.target.value)} /></Field>}
        {/* No body textarea for "write" — canvas is the editor */}
        {src==="file"&&(
          <Field label="Upload" hint="AI reads your file and builds structured notes.">
            <input type="file" ref={fileRef} onChange={handleFile} accept=".txt,.md,.csv,.pdf,.doc,.docx,.rtf" style={{display:"none"}} />
            <div onClick={()=>fileRef.current&&fileRef.current.click()} style={{border:"1px dashed "+T.borderHover,borderRadius:10,padding:26,textAlign:"center",background:T.card2,cursor:"pointer"}}>
              <div style={{color:T.muted,marginBottom:6,display:"flex",justifyContent:"center"}}>{Icon.file}</div>
              <div style={{fontSize:13,color:T.text,fontWeight:500}}>{fileText?"File loaded — "+fileText.length+" chars":"Click to browse or drop a file"}</div>
              <div style={{fontSize:11,color:T.muted,marginTop:4}}>PDF, TXT, MD, CSV, DOCX</div>
            </div>
          </Field>
        )}
        {src==="record"&&(
          <Field label="Lecture recording" hint="Records your microphone and transcribes live.">
            <div style={{border:"1px solid "+(rec?T.red+"55":T.border),borderRadius:10,padding:22,textAlign:"center",background:rec?T.red+"0a":T.card2}}>
              <button type="button" onClick={rec?stopRec:startRec} style={{width:54,height:54,borderRadius:"50%",border:"none",background:rec?T.red:T.lime,color:rec?"#fff":T.ink,cursor:"pointer",display:"inline-flex",alignItems:"center",justifyContent:"center",marginBottom:10}}>{rec?<span style={{width:16,height:16,background:"#fff",borderRadius:3,display:"block"}} />:MicIcon}</button>
              <div style={{fontSize:15,fontWeight:700,color:rec?T.red:T.white,fontVariantNumeric:"tabular-nums"}}>{fmtRec(recSecs)}</div>
              <div style={{fontSize:11.5,color:T.muted,marginTop:3}}>{rec?"Recording… tap to stop":"Tap to start recording"}</div>
              {recText&&<div style={{fontSize:12,color:T.text,marginTop:12,padding:"10px 12px",background:T.card,borderRadius:8,textAlign:"left",maxHeight:120,overflowY:"auto",lineHeight:1.5}}>{recText}</div>}
            </div>
          </Field>
        )}
        {src==="youtube"&&(
          <Field label="YouTube link" hint={ytInfo?"Found: "+ytInfo:"Paste any YouTube video link. Studlin will detect the topic and generate notes."}>
            <Input placeholder="https://youtube.com/watch?v=..." value={yt} onChange={ev=>{setYt(ev.target.value);const v=ev.target.value.trim();if(v&&(v.includes("youtube.com")||v.includes("youtu.be"))){setYtLoading(true);authFetch("/api/search-videos",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({url:v})}).then(r=>r.json()).then(d=>{if(d.title){setYtInfo(d.title+(d.author?" by "+d.author:""));if(!newTitle)setNewTitle(d.title);}setYtLoading(false);}).catch(()=>setYtLoading(false));}}} />
            {ytLoading&&<div style={{fontSize:11,color:T.lime,marginTop:4}}>Detecting video…</div>}
          </Field>
        )}
        {src==="syllabus"&&(
          <Field label="Syllabus" hint="AI reads your syllabus and finds every deadline — you'll get to review before anything is added to your calendar.">
            <input type="file" ref={syllabusFileRef} onChange={handleSyllabusFile} accept=".txt,.md,.csv,.pdf,.doc,.docx,.rtf" style={{display:"none"}} />
            <div onClick={()=>syllabusFileRef.current&&syllabusFileRef.current.click()} style={{border:"1px dashed "+T.borderHover,borderRadius:10,padding:26,textAlign:"center",background:T.card2,cursor:"pointer",marginBottom:10}}>
              <div style={{color:T.muted,marginBottom:6,display:"flex",justifyContent:"center"}}>{Icon.cal}</div>
              <div style={{fontSize:13,color:T.text,fontWeight:500}}>{syllabusText?"File loaded — "+syllabusText.length+" chars":"Click to browse or drop a file"}</div>
              <div style={{fontSize:11,color:T.muted,marginTop:4}}>PDF, TXT, MD, CSV, DOCX</div>
            </div>
            <Textarea placeholder="…or paste the syllabus text directly here" value={syllabusText} onChange={ev=>setSyllabusText(ev.target.value)} style={{minHeight:110}} />
          </Field>
        )}
      </Modal>

      {/* ── SYLLABUS DEADLINE REVIEW — preview-then-commit, never a silent write ── */}
      <Modal open={!!syllabusReview} onClose={()=>setSyllabusReview(null)} title="Review extracted deadlines" sub="AI dates are guesses — check them before they go on your calendar. Low-confidence guesses are flagged." width={620}
        footer={<>
          <Btn variant="subtle" onClick={()=>setSyllabusReview(null)}>Skip — just save the note</Btn>
          <Btn disabled={aiLoading||!syllabusReview||syllabusReview.items.filter(i=>i.include).length===0} onClick={()=>{
            const included=syllabusReview.items.filter(i=>i.include);
            commitSyllabusEvents(syllabusReview.noteId,syllabusReview.tag,included);
            setSyllabusToast(included.length+" deadline"+(included.length!==1?"s":"")+" added to your calendar");
            setTimeout(()=>setSyllabusToast(""),3200);
            setSyllabusReview(null);
          }}>{aiLoading?"Processing…":"Add "+(syllabusReview?syllabusReview.items.filter(i=>i.include).length:0)+" to Calendar →"}</Btn>
        </>}>
        {syllabusReview&&syllabusReview.items.length===0&&(
          <div style={{textAlign:"center",padding:"24px 0",color:T.muted,fontSize:13}}>
            No dates found. Add one manually below, or skip and save just the note.
          </div>
        )}
        <div style={{display:"flex",flexDirection:"column",gap:10,maxHeight:400,overflowY:"auto"}}>
          {syllabusReview&&syllabusReview.items.map((it,i)=>(
            <div key={it.id} style={{padding:"12px 14px",borderRadius:10,border:`1px solid ${T.border}`,background:it.include?T.card2:T.card,opacity:it.include?1:0.55}}>
              <div style={{display:"flex",alignItems:"flex-start",gap:10}}>
                <input type="checkbox" checked={it.include} onChange={()=>setSyllabusReview(r=>({...r,items:r.items.map((x,xi)=>xi===i?{...x,include:!x.include}:x)}))} style={{marginTop:10,cursor:"pointer"}} />
                <div style={{flex:1}}>
                  <div style={{display:"flex",gap:8,marginBottom:8}}>
                    <Input value={it.title} onChange={ev=>setSyllabusReview(r=>({...r,items:r.items.map((x,xi)=>xi===i?{...x,title:ev.target.value}:x)}))} style={{flex:1}} />
                    <Input type="date" value={it.date} onChange={ev=>setSyllabusReview(r=>({...r,items:r.items.map((x,xi)=>xi===i?{...x,date:ev.target.value}:x)}))} style={{width:150}} />
                  </div>
                  <div style={{display:"flex",alignItems:"center",gap:8}}>
                    <SelectChip options={[{value:"deadline",label:"To-Do"},{value:"exam",label:"Exam"}]} value={it.kind} onChange={v=>setSyllabusReview(r=>({...r,items:r.items.map((x,xi)=>xi===i?{...x,kind:v}:x)}))} />
                    {it.confidence==="low"&&<span style={{fontSize:10.5,color:T.amber,fontWeight:600,background:T.amber+"14",border:`1px solid ${T.amber}33`,borderRadius:6,padding:"3px 8px"}}>Low confidence — double-check</span>}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
        <button type="button" onClick={()=>setSyllabusReview(r=>({...r,items:[...r.items,{id:"si-manual-"+Date.now(),title:"",date:dayKey(),kind:"deadline",confidence:"low",include:true}]}))} style={{marginTop:10,width:"100%",padding:"10px",borderRadius:8,border:`1px dashed ${T.borderHover}`,background:"transparent",color:T.muted,cursor:"pointer",fontFamily:T.font,fontSize:12.5}}>
          + Add a deadline manually
        </button>
      </Modal>

      {/* ── DELETE NOTE CONFIRMATION — only shown when the note has linked calendar deadlines ── */}
      <Modal open={!!deleteNoteConfirm} onClose={()=>setDeleteNoteConfirm(null)} title="Delete this note?" sub={deleteNoteConfirm?"This note created "+deleteNoteConfirm.linked.length+" calendar deadline"+(deleteNoteConfirm.linked.length!==1?"s":"")+".":""} width={460}
        footer={<>
          <Btn variant="subtle" onClick={()=>setDeleteNoteConfirm(null)}>Cancel</Btn>
          <Btn variant="danger" onClick={()=>{
            const also=document.getElementById("also-delete-linked-events");
            doDeleteNote(deleteNoteConfirm.idx,also?also.checked:false);
            setDeleteNoteConfirm(null);
          }}>Delete note</Btn>
        </>}>
        <label style={{display:"flex",alignItems:"center",gap:8,fontSize:13,color:T.text,cursor:"pointer"}}>
          <input id="also-delete-linked-events" type="checkbox" defaultChecked={false} />
          Also delete the linked calendar events
        </label>
        <div style={{fontSize:11.5,color:T.muted,marginTop:8,lineHeight:1.5}}>Leave this unchecked to keep those deadlines on your calendar even after the note is gone.</div>
      </Modal>

      {/* ── SYLLABUS COMMIT TOAST ── */}
      {syllabusToast&&(
        <div style={{position:"fixed",bottom:20,right:20,zIndex:999,padding:"11px 18px",borderRadius:10,background:T.teal,color:"#fff",fontSize:13,fontWeight:600,boxShadow:"0 8px 24px rgba(0,0,0,0.35)",animation:"studlinPop 0.2s ease",maxWidth:340}}>
          {syllabusToast}
        </div>
      )}

      {/* ── PRACTICE QUIZ OVERLAY — generated from the active note ── */}
      <Modal open={!!quizOverlay} onClose={()=>setQuizOverlay(null)} title="Practice Quiz" sub={activeNote?activeNote.title:""} width={520}>
        {quizOverlay&&!quizOverlay.done&&(()=>{
          const q=quizOverlay.questions[quizOverlay.idx];
          const picked=quizOverlay.picked;
          return (
            <div>
              <div style={{fontSize:11,color:T.muted,marginBottom:8}}>Question {quizOverlay.idx+1} of {quizOverlay.questions.length}</div>
              <div style={{fontSize:14,fontWeight:600,color:T.white,marginBottom:14,lineHeight:1.5}}>{q.question}</div>
              <div style={{display:"flex",flexDirection:"column",gap:8}}>
                {q.options.map((opt,i)=>{
                  const isCorrect=i===q.correct;
                  const show=picked!==null;
                  let border=T.border,bg=T.card2,color=T.text;
                  if(show&&isCorrect){border=T.teal;bg=T.teal+"18";color=T.teal;}
                  else if(show&&picked===i&&!isCorrect){border=T.red;bg=T.red+"14";color=T.red;}
                  return (
                    <button key={i} disabled={picked!==null} onClick={()=>setQuizOverlay(qo=>({...qo,picked:i,score:qo.score+(i===q.correct?1:0)}))} style={{textAlign:"left",padding:"10px 14px",borderRadius:8,border:`1px solid ${border}`,background:bg,color,cursor:picked!==null?"default":"pointer",fontFamily:T.font,fontSize:13}}>{opt}</button>
                  );
                })}
              </div>
              {picked!==null&&(
                <div style={{marginTop:16,display:"flex",justifyContent:"flex-end"}}>
                  <Btn onClick={()=>{
                    const isLast=quizOverlay.idx>=quizOverlay.questions.length-1;
                    if(isLast)setQuizOverlay(qo=>({...qo,done:true}));
                    else setQuizOverlay(qo=>({...qo,idx:qo.idx+1,picked:null}));
                  }}>{quizOverlay.idx>=quizOverlay.questions.length-1?"See results":"Next question →"}</Btn>
                </div>
              )}
            </div>
          );
        })()}
        {quizOverlay&&quizOverlay.done&&(
          <div style={{textAlign:"center",padding:"20px 0"}}>
            <div style={{fontSize:32,fontWeight:800,color:T.lime,marginBottom:6}}>{quizOverlay.score}/{quizOverlay.questions.length}</div>
            <div style={{fontSize:13,color:T.muted,marginBottom:16}}>Nice work — quiz complete.</div>
            <Btn variant="subtle" onClick={()=>setQuizOverlay(null)}>Close</Btn>
          </div>
        )}
      </Modal>

      {/* ── SUMMARY OVERLAY — generated from the active note ── */}
      <Modal open={!!summaryOverlay} onClose={()=>setSummaryOverlay(null)} title="Summary" sub={activeNote?activeNote.title:""} width={480}>
        <ul style={{margin:0,paddingLeft:18,display:"flex",flexDirection:"column",gap:9}}>
          {(summaryOverlay||[]).map((b,i)=><li key={i} style={{fontSize:13,color:T.text,lineHeight:1.5}}>{b}</li>)}
        </ul>
      </Modal>

      {/* ── MAIN WORKSPACE LAYOUT ── */}
      <div style={{display:"grid",gridTemplateColumns:"240px 1fr",gap:14,alignItems:"start"}}>

        {/* Sidebar — note history */}
        <div>
          <input style={{width:"100%",background:T.card2,border:"1px solid "+T.border,borderRadius:7,padding:"8px 12px",color:T.text,fontSize:12,fontFamily:T.font,outline:"none",marginBottom:10,boxSizing:"border-box"}} placeholder="Search notes…" value={search} onChange={ev=>setSearch(ev.target.value)} />
          {filtered.length===0&&<div style={{padding:"20px 0",textAlign:"center",fontSize:12,color:T.muted}}>No notes yet. Create your first one.</div>}
          {(()=>{
            const renderNoteRow=(n,i)=>{
              const idx=notes.indexOf(n);
              return (
                <div key={n.id||i} onClick={()=>{setSel(idx);setPopover(null);}} style={{background:idx===sel?T.card2:T.card,borderRadius:8,padding:"11px 13px",marginBottom:6,border:"1px solid "+(idx===sel?colorOf(n.tag)+"55":T.border),cursor:"pointer",transition:"all 0.15s"}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:4}}>
                    <div style={{fontSize:12,fontWeight:600,color:T.white,flex:1,marginRight:8,lineHeight:1.3}}>{n.title}</div>
                    <Badge color={colorOf(n.tag)}>{n.tag}</Badge>
                  </div>
                  <div style={{fontSize:10.5,color:T.muted,lineHeight:1.5,maxHeight:36,overflow:"hidden"}}>{(n.body||"").replace(/<[^>]+>/g," ").trim().slice(0,90)}</div>
                  <div style={{fontSize:10,color:T.faint,marginTop:6,display:"flex",justifyContent:"space-between"}}>
                    <span>{n.date}</span>
                    {n.source==="shared"&&<span style={{color:T.blue,fontWeight:600}}>from {n.sharedFrom}</span>}
                  </div>
                </div>
              );
            };
            const ownNotes=filtered.filter(n=>n.source!=="shared");
            const sharedNotes=filtered.filter(n=>n.source==="shared");
            return (<>
              {ownNotes.map(renderNoteRow)}
              {sharedNotes.length>0&&<div style={{fontSize:10,fontWeight:700,letterSpacing:"0.1em",textTransform:"uppercase",color:T.faint,margin:"14px 0 8px"}}>Shared with Me</div>}
              {sharedNotes.map(renderNoteRow)}
            </>);
          })()}
        </div>

        {/* Canvas area: editor + optional margin panel + optional tutor sidebar */}
        <div style={{display:"grid",gridTemplateColumns:tutorOpen?"1fr 340px":hasMargin?"1fr 220px":"1fr",gap:12,alignItems:"start"}}>

          {/* ── RICH TEXT EDITOR CARD ── */}
          <Card style={{padding:0,overflow:"hidden",minHeight:480}}>
            {activeNote?(
              <>
                {/* Formatting toolbar */}
                <div style={{display:"flex",alignItems:"center",gap:4,padding:"8px 14px",borderBottom:`1px solid ${T.border}`,background:T.card2,flexWrap:"wrap"}}>
                  {/* Font family */}
                  <select onMouseDown={e=>e.stopPropagation()} onChange={e=>{if(editorRef.current)editorRef.current.focus();document.execCommand("styleWithCSS",false,true);document.execCommand("fontName",false,e.target.value);}} defaultValue="" style={{padding:"4px 6px",borderRadius:5,border:`1px solid ${T.border}`,background:T.card,color:T.text,fontSize:12,fontFamily:T.font,cursor:"pointer",outline:"none",height:28}}>
                    <option value="" disabled>Font</option>
                    <option value="Inter, sans-serif">Inter</option>
                    <option value="Arial, sans-serif">Arial</option>
                    <option value="Georgia, serif">Georgia</option>
                    <option value="'Courier New', monospace">Courier</option>
                    <option value="'JetBrains Mono', monospace">Mono</option>
                  </select>
                  <div style={{width:1,height:18,background:T.border,margin:"0 2px"}} />
                  {/* Bold */}
                  <button style={tbBtn()} onMouseDown={e=>{e.preventDefault();execFmt("bold");}} title="Bold"><strong style={{fontSize:13}}>B</strong></button>
                  {/* Italic */}
                  <button style={tbBtn()} onMouseDown={e=>{e.preventDefault();execFmt("italic");}} title="Italic"><em style={{fontSize:13}}>I</em></button>
                  {/* Bullet */}
                  <button style={tbBtn()} onMouseDown={e=>{e.preventDefault();execFmt("insertUnorderedList");}} title="Bullet list">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="9" y1="6" x2="20" y2="6"/><line x1="9" y1="12" x2="20" y2="12"/><line x1="9" y1="18" x2="20" y2="18"/><circle cx="4" cy="6" r="2" fill="currentColor"/><circle cx="4" cy="12" r="2" fill="currentColor"/><circle cx="4" cy="18" r="2" fill="currentColor"/></svg>
                  </button>
                  {/* Numbered */}
                  <button style={tbBtn()} onMouseDown={e=>{e.preventDefault();execFmt("insertOrderedList");}} title="Numbered list">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="10" y1="6" x2="21" y2="6"/><line x1="10" y1="12" x2="21" y2="12"/><line x1="10" y1="18" x2="21" y2="18"/><path d="M4 6h1v4"/><path d="M4 10h2"/><path d="M6 18H4c0-1 2-2 2-3s-1-1.5-2-1"/></svg>
                  </button>
                  <div style={{width:1,height:18,background:T.border,margin:"0 2px"}} />
                  {/* Text color */}
                  <label title="Text color" style={{...tbBtn(),padding:"4px 7px",cursor:"pointer",position:"relative",overflow:"hidden"}}>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="4 7 4 4 20 4 20 7"/><line x1="9" y1="20" x2="15" y2="20"/><line x1="12" y1="4" x2="12" y2="20"/></svg>
                    <span style={{fontSize:10,letterSpacing:"0.02em"}}>A</span>
                    <input type="color" defaultValue="#e8efe7" onInput={e=>{if(editorRef.current)editorRef.current.focus();document.execCommand("styleWithCSS",false,true);document.execCommand("foreColor",false,e.target.value);}} style={{position:"absolute",opacity:0,width:"100%",height:"100%",top:0,left:0,cursor:"pointer",border:"none",padding:0}} />
                  </label>
                  {/* Highlight color */}
                  <label title="Highlight color" style={{...tbBtn(),padding:"4px 7px",cursor:"pointer",position:"relative",overflow:"hidden"}}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="m9 11-6 6v3h3l6-6"/><path d="m22 12-4.6 4.6a2 2 0 0 1-2.8 0l-5.2-5.2a2 2 0 0 1 0-2.8L14 4"/></svg>
                    <input type="color" defaultValue="#aece5e" onInput={e=>{if(editorRef.current)editorRef.current.focus();document.execCommand("styleWithCSS",false,true);document.execCommand("hiliteColor",false,e.target.value);}} style={{position:"absolute",opacity:0,width:"100%",height:"100%",top:0,left:0,cursor:"pointer",border:"none",padding:0}} />
                  </label>
                  <div style={{width:1,height:18,background:T.border,margin:"0 2px"}} />
                  <BtnSm variant="subtle" onClick={()=>exportNote(activeNote)}>{Icon.copy} Copy</BtnSm>
                  <BtnSm variant="subtle" onClick={()=>setSendNoteOpen(true)}>{Icon.send} Send</BtnSm>
                  <div style={{flex:1}} />
                  <button onClick={openDocComment} title="Attach a note to the whole document — no highlight needed" style={{padding:"5px 12px",borderRadius:6,border:`1px solid ${T.blue}44`,background:T.blue+"14",color:T.blue,cursor:"pointer",fontFamily:T.font,fontSize:12,fontWeight:700,display:"inline-flex",alignItems:"center",gap:6,transition:"all 0.15s"}}>
                    {Icon.chat} Add Comment
                  </button>
                  <button onClick={openTutorForDocument} title="Ask the AI Tutor about this whole note — no highlight needed" style={{padding:"5px 12px",borderRadius:6,border:`1px solid ${T.amber}44`,background:T.amber+"14",color:T.amber,cursor:"pointer",fontFamily:T.font,fontSize:12,fontWeight:700,display:"inline-flex",alignItems:"center",gap:6,transition:"all 0.15s"}}>
                    {Icon.brain} Ask Tutor
                  </button>
                  <button onClick={cleanNotes} disabled={cleaning} style={{padding:"5px 12px",borderRadius:6,border:`1px solid ${T.lime}44`,background:cleaning?T.card2:T.lime+"14",color:cleaning?T.muted:T.lime,cursor:cleaning?"default":"pointer",fontFamily:T.font,fontSize:12,fontWeight:700,display:"inline-flex",alignItems:"center",gap:6,transition:"all 0.15s"}}>
                    {cleaning?<>Cleaning…</>:<>{Icon.wand} Clean Notes</>}
                  </button>
                  <BtnSm variant="danger" onClick={()=>deleteNote(sel)}>Delete</BtnSm>
                </div>

                {/* Title row */}
                <div style={{padding:"16px 24px 10px",borderBottom:`1px solid ${T.border}`}}>
                  <input value={activeNote.title} onChange={e=>updateNote(sel,{title:e.target.value})} style={{fontSize:20,fontWeight:700,color:T.white,letterSpacing:"-0.02em",background:"transparent",border:"none",outline:"none",fontFamily:T.font,width:"100%",padding:0,marginBottom:8}} placeholder="Note title…" />
                  <div style={{display:"flex",gap:8,alignItems:"center"}}>
                    <Badge color={colorOf(activeNote.tag)}>{activeNote.tag}</Badge>
                    <span style={{fontSize:11,color:T.muted}}>{activeNote.date}</span>
                    {activeFlags.length>0&&<span style={{fontSize:10.5,color:T.amber,fontWeight:600}}>{activeFlags.length} tutor flag{activeFlags.length!==1?"s":""}</span>}
                    {activeComments.length>0&&<span style={{fontSize:10.5,color:T.blue,fontWeight:600}}>{activeComments.length} comment{activeComments.length!==1?"s":""}</span>}
                  </div>
                </div>

                {/* Contextual selection popover */}
                {popover&&(
                  <div style={{position:"absolute",top:popover.y,left:popover.x,transform:"translateX(-50%)",zIndex:30,display:"flex",gap:4,background:T.surface,border:`1px solid ${T.border}`,borderRadius:8,padding:"4px 6px",boxShadow:"0 8px 24px rgba(0,0,0,0.4)",whiteSpace:"nowrap"}}>
                    <button onMouseDown={e=>{e.preventDefault();setPendingSel(popover.selText);setPendingSelGlobal(false);setCommentInputOpen(true);}} style={{padding:"5px 10px",borderRadius:5,border:"none",background:"transparent",color:T.blue,cursor:"pointer",fontSize:12,fontFamily:T.font,fontWeight:600}}>Add Comment</button>
                    <div style={{width:1,background:T.border}} />
                    <button onMouseDown={e=>{e.preventDefault();doAddFlag(popover.selText);}} style={{padding:"5px 10px",borderRadius:5,border:"none",background:"transparent",color:T.amber,cursor:"pointer",fontSize:12,fontFamily:T.font,fontWeight:600}}>Flag for Tutor</button>
                  </div>
                )}

                {/* Comment input strip */}
                {commentInputOpen&&(
                  <div style={{padding:"10px 20px",background:T.blue+"0A",borderBottom:`1px solid ${T.blue}22`,display:"flex",gap:8,alignItems:"center"}}>
                    <input value={commentDraft} onChange={e=>setCommentDraft(e.target.value)} onKeyDown={e=>{if(e.key==="Enter")doAddComment();if(e.key==="Escape"){setCommentInputOpen(false);setPendingSel(null);setPendingSelGlobal(false);}}} placeholder={pendingSelGlobal?"Add a note about this whole document…":`Comment on "${(pendingSel||"").slice(0,30)}…"`} autoFocus style={{flex:1,background:"transparent",border:"none",outline:"none",color:T.text,fontSize:13,fontFamily:T.font}} />
                    <BtnSm onClick={doAddComment} style={{opacity:commentDraft.trim()?1:0.4}}>Save</BtnSm>
                    <BtnSm variant="subtle" onClick={()=>{setCommentInputOpen(false);setPendingSel(null);setPendingSelGlobal(false);}}>✕</BtnSm>
                  </div>
                )}

                {/* contenteditable rich text canvas */}
                <div style={{position:"relative"}}
                  onMouseUp={handleEditorMouseUp}
                  onKeyDown={()=>setPopover(null)}
                  onClick={e=>{if(e.target===e.currentTarget)editorRef.current&&editorRef.current.focus();}}>
                  <div
                    ref={editorRef}
                    contentEditable={true}
                    suppressContentEditableWarning={true}
                    onInput={onEditorInput}
                    style={{minHeight:380,padding:"20px 28px 40px",fontSize:14.5,lineHeight:1.85,color:T.text,outline:"none",fontFamily:T.font,boxSizing:"border-box"}}
                  />
                  {/* Placeholder hint when empty */}
                </div>

                {/* ── AI STUDY TOOLS — turn this note into flashcards, a quiz, or a summary ── */}
                <div style={{display:"flex",alignItems:"center",gap:8,padding:"12px 20px",borderTop:`1px solid ${T.border}`,background:T.card2,flexWrap:"wrap"}}>
                  <span style={{fontSize:9.5,fontWeight:700,letterSpacing:"0.08em",textTransform:"uppercase",color:T.faint,marginRight:2}}>Turn into</span>
                  <BtnSm variant="subtle" onClick={genFlashcardsFromNote} disabled={panelLoading!==null}>{panelLoading==="cards"?"Generating…":<>{Icon.layers} Create Flashcards</>}</BtnSm>
                  <BtnSm variant="subtle" onClick={genQuizFromNote} disabled={panelLoading!==null}>{panelLoading==="quiz"?"Generating…":<>{Icon.check} Create Practice Quiz</>}</BtnSm>
                  <BtnSm variant="subtle" onClick={genSummaryFromNote} disabled={panelLoading!==null}>{panelLoading==="summary"?"Generating…":<>{Icon.file} Generate Summary</>}</BtnSm>
                  {panelMsg&&<span style={{fontSize:11,color:panelMsg.startsWith("✓")?T.teal:T.red,marginLeft:4}}>{panelMsg}</span>}
                </div>
              </>
            ):(
              <div style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",height:380,gap:12}}>
                <div style={{color:T.faint,opacity:0.4}}>{Icon.file}</div>
                <div style={{fontSize:13,color:T.muted,textAlign:"center"}}>Select a note from the sidebar<br/>or create a new one to start writing.</div>
                <Btn onClick={()=>setNewOpen(true)}>{Icon.plus} New note</Btn>
              </div>
            )}
          </Card>

          {/* ── TUTOR SIDEBAR — split-screen AI panel ── */}
          {tutorOpen&&(
            <div style={{display:"flex",flexDirection:"column",height:"100%",background:T.card,border:`1px solid ${T.border}`,borderRadius:12,overflow:"hidden",minHeight:480}}>
              {/* Header */}
              <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"12px 16px",borderBottom:`1px solid ${T.border}`,background:T.card2,flexShrink:0}}>
                <div style={{display:"flex",alignItems:"center",gap:8}}>
                  <div style={{width:26,height:26,borderRadius:7,background:T.amber+"22",border:`1px solid ${T.amber}44`,display:"flex",alignItems:"center",justifyContent:"center",color:T.amber}}>{Icon.brain}</div>
                  <div>
                    <div style={{fontSize:12,fontWeight:700,color:T.white}}>AI Tutor</div>
                    <div style={{fontSize:10,color:T.muted}}>Ask about this note</div>
                  </div>
                </div>
                <button onClick={()=>setTutorOpen(false)} style={{background:"none",border:"none",color:T.faint,cursor:"pointer",fontSize:16,lineHeight:1,padding:4,borderRadius:4,display:"flex",alignItems:"center",justifyContent:"center"}}>{Icon.xmark}</button>
              </div>
              {/* Messages */}
              <div style={{flex:1,overflowY:"auto",padding:"14px 14px 8px",display:"flex",flexDirection:"column",gap:10}}>
                {tutorMsgs.map((m,i)=>(
                  <div key={i} style={{display:"flex",flexDirection:"column",alignItems:m.role==="user"?"flex-end":"flex-start"}}>
                    <div style={{maxWidth:"88%",padding:"9px 12px",borderRadius:m.role==="user"?"10px 10px 3px 10px":"10px 10px 10px 3px",background:m.role==="user"?T.lime+"22":T.card2,border:`1px solid ${m.role==="user"?T.lime+"33":T.border}`,fontSize:12.5,color:m.loading?T.muted:T.text,lineHeight:1.6,whiteSpace:"pre-wrap"}}>
                      {m.loading?<span style={{animation:"studlinPulse 1.2s ease infinite",display:"inline-block"}}>Analyzing…</span>:m.text}
                    </div>
                  </div>
                ))}
                {tutorSending&&(
                  <div style={{display:"flex",alignItems:"flex-start"}}>
                    <div style={{padding:"9px 14px",borderRadius:"10px 10px 10px 3px",background:T.card2,border:`1px solid ${T.border}`,fontSize:12,color:T.muted}}>
                      <span style={{animation:"studlinPulse 1.2s ease infinite",display:"inline-block"}}>Thinking…</span>
                    </div>
                  </div>
                )}
              </div>
              {/* Input */}
              <div style={{padding:"10px 12px",borderTop:`1px solid ${T.border}`,flexShrink:0,display:"flex",gap:8,alignItems:"flex-end"}}>
                <textarea value={tutorInput} onChange={e=>setTutorInput(e.target.value)} onKeyDown={e=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();sendTutorMsg();}}} placeholder="Ask your tutor…" rows={2} style={{flex:1,background:T.card2,border:`1px solid ${T.border}`,borderRadius:8,padding:"8px 10px",color:T.text,fontSize:12.5,fontFamily:T.font,resize:"none",outline:"none",lineHeight:1.5}} />
                <button onClick={sendTutorMsg} disabled={!tutorInput.trim()||tutorSending} style={{padding:"8px 12px",borderRadius:8,border:"none",background:tutorInput.trim()&&!tutorSending?T.amber:T.card2,color:tutorInput.trim()&&!tutorSending?T.ink:T.faint,cursor:tutorInput.trim()&&!tutorSending?"pointer":"default",fontFamily:T.font,fontSize:12,fontWeight:700,transition:"all 0.15s",flexShrink:0}}>{Icon.send}</button>
              </div>
            </div>
          )}

          {/* ── MARGIN PANEL — comments & flags ── */}
          {!tutorOpen&&hasMargin&&(
            <div style={{display:"flex",flexDirection:"column",gap:10}}>
              <div style={{fontSize:10,fontWeight:700,letterSpacing:"0.1em",textTransform:"uppercase",color:T.faint,marginBottom:2}}>Annotations</div>
              {activeComments.map(c=>(
                <div key={c.id} style={{background:T.card,border:`1px solid ${T.blue}33`,borderLeft:`3px solid ${T.blue}`,borderRadius:8,padding:"10px 12px",position:"relative"}}>
                  <div style={{fontSize:10,color:T.blue,fontWeight:600,marginBottom:4,lineHeight:1.4}}>{c.selectedText?`"${c.selectedText.slice(0,48)}${c.selectedText.length>48?"…":""}"`:<span style={{textTransform:"uppercase",letterSpacing:"0.05em"}}>Document note</span>}</div>
                  <div style={{fontSize:12,color:T.text,lineHeight:1.5}}>{c.text}</div>
                  <div style={{fontSize:10,color:T.faint,marginTop:6}}>{c.date}</div>
                  <button onClick={()=>removeComment(nid,c.id)} style={{position:"absolute",top:6,right:6,background:"none",border:"none",color:T.faint,cursor:"pointer",fontSize:13,lineHeight:1,padding:2}}>×</button>
                </div>
              ))}
              {activeFlags.map(f=>(
                <div key={f.id} style={{background:T.card,border:`1px solid ${T.amber}44`,borderLeft:`3px solid ${T.amber}`,borderRadius:8,padding:"10px 12px",position:"relative"}}>
                  <div style={{fontSize:10,fontWeight:700,color:T.amber,marginBottom:4,letterSpacing:"0.05em",textTransform:"uppercase"}}>Tutor Flag</div>
                  <div style={{fontSize:11,color:T.muted,lineHeight:1.5,fontStyle:"italic"}}>"{(f.selectedText||"").slice(0,60)}{f.selectedText&&f.selectedText.length>60?"…":""}"</div>
                  <div style={{display:"flex",gap:8,marginTop:8,alignItems:"center"}}>
                    <div style={{fontSize:10,color:T.faint}}>{f.date}</div>
                    <button onMouseDown={e=>{e.preventDefault();openTutorWithContext(f.selectedText);}} style={{fontSize:10,color:T.amber,background:"none",border:"none",cursor:"pointer",padding:0,fontFamily:T.font,fontWeight:600}}>Open tutor →</button>
                  </div>
                  <button onClick={()=>removeFlag(nid,f.id)} style={{position:"absolute",top:6,right:6,background:"none",border:"none",color:T.faint,cursor:"pointer",fontSize:13,lineHeight:1,padding:2}}>×</button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}



// ─── FRIENDS & CHAT ──────────────────────────────────────────────────────────
// ─── NETWORK: shared data + helpers ──────────────────────────────────────────
// Presence is simulated locally (this app has no realtime multi-user backend yet
// beyond the current user's own online/incognito status).
const GROUP_DURATIONS=[{label:"1 week",days:7},{label:"2 weeks",days:14},{label:"1 month",days:30},{label:"2 months",days:60},{label:"3 months",days:90}];
// Deterministic id for a 1:1 chat room — both sides compute the same id
// from their two uids without a lookup, so the room can be created lazily
// (idempotent merge) the first time either person opens the DM.
const dmRoomId=(a,b)=>"dm_"+[a,b].sort().join('_');
// A room is unread for `myUid` if its last message came from someone else
// and either it's never been opened, or it arrived after the last time it
// was opened. Derived entirely from live chatRooms data — no separate
// unread counter to keep in sync.
const isRoomUnread=(room,myUid)=>{
  if(!room||!room.lastMessage||room.lastMessage.senderId===myUid)return false;
  const readAt=room.lastReadAt&&room.lastReadAt[myUid];
  return !readAt||room.lastMessage.ts>readAt;
};
const isOnlineStatusOn=()=>lsGet("settings",{}).onlineStatus!==false;
const isIncognitoOn=()=>lsGet("settings",{}).incognito===true;
// Short two-tone chat chime — same raw Web Audio oscillator technique as
// TaskTimerModal's playBeep, but a distinct, lighter tone so a new message
// never sounds like the Pomodoro alarm.
const playChatChime=()=>{
  try{
    const ctx=new(window.AudioContext||window.webkitAudioContext)();
    const osc=ctx.createOscillator();const gain=ctx.createGain();
    osc.connect(gain);gain.connect(ctx.destination);
    osc.frequency.setValueAtTime(660,ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(880,ctx.currentTime+0.12);
    gain.gain.setValueAtTime(0.22,ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001,ctx.currentTime+0.22);
    osc.start(ctx.currentTime);osc.stop(ctx.currentTime+0.22);
  }catch(e){}
};
function fmtGroupCountdown(expiresAt){
  if(!expiresAt)return null;
  const ms=expiresAt-Date.now();
  if(ms<=0)return{expired:true,urgent:true,label:"Archiving…"};
  const days=Math.ceil(ms/86400000);
  if(days>60)return{expired:false,urgent:false,label:Math.round(days/30)+" mo"};
  if(days>13)return{expired:false,urgent:false,label:Math.round(days/7)+" wk"};
  if(days>1)return{expired:false,urgent:days<=7,label:days+" days"};
  return{expired:false,urgent:true,label:"today"};
}
// Live study-state sub-label for a friend's presence — masked to offline when
// the friend has incognito on.
function presenceInfo(u,{incognito=false}={}){
  const p=incognito?{state:"offline"}:(u.presence||{state:u.online?"idle":"offline"});
  if(p.state==="locked-in")return{color:T.teal,text:"Locking In: "+p.subject+" ("+p.remainingMin+"m left)",joinable:true};
  if(p.state==="in-class")return{color:T.amber,text:"In Class",joinable:false};
  if(p.state==="idle")return{color:T.muted,text:"Idle",joinable:false};
  return{color:T.faint,text:"Offline",joinable:false};
}

function FriendsChat({onFriendRequestSent,onActiveChatChange}={}){
  const [searchQ,setSearchQ]=useState("");
  const [searchFilter,setSearchFilter]=useState("All");
  const [inviteEmail,setInviteEmail]=useState("");
  const [emailSent,setEmailSent]=useState(false);
  const [copied,setCopied]=useState(false);
  const [inviteOpen,setInviteOpen]=useState(false);
  const [createGroupOpen,setCreateGroupOpen]=useState(false);
  const [chatTarget,setChatTarget]=useState(null);

  // First-run Network tour — fires the first time this tab mounts (i.e. the
  // first manual click into Studlin Network), a simple 3-slide copy-block
  // carousel since there's no single control to anchor to here.
  const [netTourStep,setNetTourStep]=useState(()=>lsGet("seenNetworkTour",false)?null:0);
  const NET_TOUR_STEPS=[
    {title:"Missed Class Protection",body:"Effortlessly share class notes and lecture materials with verified school peers — never fall behind because you missed a lecture."},
    {title:"Peer Sync",body:"Real-time study chats and shared digital study sessions, so you're never studying completely alone."},
    {title:"Flexible Architectures",body:"Spin up agile, temporary study groups for an upcoming exam, or set up a permanent channel for the whole semester."},
  ];
  const advanceNetTour=()=>{
    if(netTourStep>=NET_TOUR_STEPS.length-1){finishNetTour();return;}
    setNetTourStep(s=>s+1);
  };
  const finishNetTour=()=>{lsSet("seenNetworkTour",true);setNetTourStep(null);};

  const me=getUserName()||"You";
  const refCode=me.toLowerCase().replace(/\s+/g,"");
  const inviteLink="https://studlin.app?ref="+refCode;
  const qrUrl="https://api.qrserver.com/v1/create-qr-code/?data="+encodeURIComponent(inviteLink)+"&size=150x150&color=AECE5E&bgcolor=0D120F&margin=10";
  const myUid=firebase.auth().currentUser?.uid||null;

  // Reports which thread (if any) is actively open up to App(), so its
  // cross-tab notification listener can suppress alerts for a thread the
  // user is already looking at (Rule 1 of the notification router).
  const roomIdOf=(target)=>target?(target.kind==="group"?target.group.id:(myUid&&target.user.uid?dmRoomId(myUid,target.user.uid):null)):null;
  useEffect(()=>{
    if(onActiveChatChange)onActiveChatChange(roomIdOf(chatTarget));
    return ()=>{if(onActiveChatChange)onActiveChatChange(null);};
  },[chatTarget,myUid]);

  // ── Live friend graph (Firestore `friendships` + `profiles`) ──────────────
  const [friends,setFriends]=useState([]); // accepted, either direction — {uid,n,h,s,online,presence}
  const [incomingReqs,setIncomingReqs]=useState([]); // pending, received by me — {id,senderId,n,h,s}
  const [outgoingReqIds,setOutgoingReqIds]=useState(()=>new Set()); // uids I've already sent a pending request to
  const [myRooms,setMyRooms]=useState({}); // chatRooms I'm a member of, keyed by id — DM rooms only exist once opened
  const groupRooms=Object.values(myRooms).filter(r=>r.type==="group");
  const activeGroups=groupRooms.filter(g=>!g.expiresAt||g.expiresAt>Date.now());
  const myFriends=friends;

  const profileToFriend=(uid,d)=>({
    uid,
    n:(d&&d.name)||"Studlin User",
    h:"@"+((d&&d.username)||uid.slice(0,6)),
    s:(d&&d.school)||"",
    online:false,
    presence:{state:"idle"},
  });

  // ── Classmates at my school — real, auto-populated, replaces the old
  // hardcoded NETWORK_DIRECTORY mock. Exact-match on schoolLower (not the
  // prefix-range query the manual search box below uses), gated on the
  // current user actually having a school set.
  const mySchool=(getProfile().school||getProfile().affiliation||"").trim();
  const [classmates,setClassmates]=useState([]);
  const [classmatesLoading,setClassmatesLoading]=useState(false);
  useEffect(()=>{
    if(!myUid||!mySchool){setClassmates([]);return;}
    let active=true;
    setClassmatesLoading(true);
    fsdb().collection('profiles').where('schoolLower','==',mySchool.toLowerCase()).limit(20).get()
      .then(snap=>{
        if(!active)return;
        const results=snap.docs.map(d=>profileToFriend(d.id,d.data())).filter(u=>u.uid!==myUid);
        setClassmates(results);
      })
      .catch(()=>{if(active)setClassmates([]);})
      .finally(()=>{if(active)setClassmatesLoading(false);});
    return ()=>{active=false;};
  },[myUid,mySchool]);

  // Incoming pending requests — real-time via onSnapshot.
  useEffect(()=>{
    if(!myUid)return;
    const unsub=fsdb().collection('friendships').where('receiverId','==',myUid).where('status','==','pending')
      .onSnapshot(async snap=>{
        const docs=snap.docs.map(d=>({id:d.id,senderId:d.data().senderId}));
        const withProfiles=await Promise.all(docs.map(async d=>{
          try{
            const p=await fsdb().collection('profiles').doc(d.senderId).get();
            const f=profileToFriend(d.senderId,p.exists?p.data():null);
            return {id:d.id,senderId:d.senderId,n:f.n,h:f.h,s:f.s};
          }catch(e){return {id:d.id,senderId:d.senderId,n:"Studlin User",h:"@"+d.senderId.slice(0,6),s:""};}
        }));
        setIncomingReqs(withProfiles);
      },()=>{});
    return unsub;
  },[myUid]);

  // Outgoing pending requests — just the target uids, so search can show "Pending".
  useEffect(()=>{
    if(!myUid)return;
    const unsub=fsdb().collection('friendships').where('senderId','==',myUid).where('status','==','pending')
      .onSnapshot(snap=>setOutgoingReqIds(new Set(snap.docs.map(d=>d.data().receiverId))),()=>{});
    return unsub;
  },[myUid]);

  // Accepted friendships (either direction) — real-time via onSnapshot, resolved
  // against `profiles` for display. This is what powers "My Friends" live on
  // both sides once the other person accepts, with no manual refresh needed.
  useEffect(()=>{
    if(!myUid)return;
    let asSender=[],asReceiver=[],cancelled=false;
    const rebuild=async()=>{
      const ids=[...new Set([...asSender,...asReceiver])];
      if(ids.length===0){setFriends([]);return;}
      const docs=await Promise.all(ids.map(uid=>fsdb().collection('profiles').doc(uid).get().catch(()=>null)));
      if(cancelled)return;
      setFriends(docs.map((p,i)=>profileToFriend(ids[i],p&&p.exists?p.data():null)));
    };
    const unsub1=fsdb().collection('friendships').where('senderId','==',myUid).where('status','==','accepted')
      .onSnapshot(snap=>{asSender=snap.docs.map(d=>d.data().receiverId);rebuild();},()=>{});
    const unsub2=fsdb().collection('friendships').where('receiverId','==',myUid).where('status','==','accepted')
      .onSnapshot(snap=>{asReceiver=snap.docs.map(d=>d.data().senderId);rebuild();},()=>{});
    return ()=>{cancelled=true;unsub1();unsub2();};
  },[myUid]);

  // Chat rooms (DMs + groups) I belong to — one query drives the whole inbox
  // (list + live previews) plus group membership, the same way the
  // friendship listeners above drive the friend list. This is also what
  // makes a newly-created group show up in a member's inbox live, with no
  // refresh — the group doc itself is what they're subscribed to here.
  useEffect(()=>{
    if(!myUid){setMyRooms({});return;}
    const unsub=fsdb().collection('chatRooms').where('memberUids','array-contains',myUid)
      .onSnapshot(snap=>{
        const next={};
        snap.docs.forEach(d=>{next[d.id]={id:d.id,...d.data()};});
        setMyRooms(next);
      },()=>{});
    return unsub;
  },[myUid]);

  // ── Unified "All" / "Groups" inbox — combined, chronological ──────────────
  const [inboxTab,setInboxTab]=useState("All");
  const previewOf=(m)=>!m?null:(m.kind==="text"?m.text:m.kind==="calendar"?"Shared free time found":m.kind==="note"?"Note shared":m.kind==="deck"?"Deck shared":"New message");
  const inboxDms=myFriends.map(u=>{const room=myRooms[dmRoomId(myUid,u.uid)];const last=room&&room.lastMessage;return{kind:"dm",key:"dm:"+u.uid,user:u,lastTs:last?last.ts:0,preview:previewOf(last),unread:isRoomUnread(room,myUid)};});
  const inboxGroups=activeGroups.map(g=>{const last=g.lastMessage;return{kind:"group",key:"group:"+g.id,group:g,lastTs:last?last.ts:0,preview:previewOf(last),unread:isRoomUnread(g,myUid)};});
  const inboxShown=(inboxTab==="Groups"?inboxGroups:[...inboxDms,...inboxGroups]).slice().sort((a,b)=>b.lastTs-a.lastTs);

  // ── Live search — one-shot Firestore prefix query against `profiles` ──────
  const [searchResults,setSearchResults]=useState([]);
  const [searching,setSearching]=useState(false);
  useEffect(()=>{
    // Strip a leading "@" (people naturally type "@friendname") — usernameLower
    // never has one stored, so leaving it in would silently match nothing.
    const raw=searchQ.trim().toLowerCase().replace(/^@/,"");
    if(!raw){setSearchResults([]);setSearching(false);return;}
    setSearching(true);
    let active=true;
    const runQuery=async(field,value)=>{
      if(!value)return[];
      const snap=await fsdb().collection('profiles').where(field,'>=',value).where(field,'<=',value+String.fromCharCode(0xf8ff)).limit(10).get();
      return snap.docs.map(d=>profileToFriend(d.id,d.data()));
    };
    const t=setTimeout(async()=>{
      try{
        let results;
        if(searchFilter==="@username")results=await runQuery('usernameLower',raw.replace(/\s+/g,""));
        else if(searchFilter==="Name")results=await runQuery('nameLower',raw);
        else if(searchFilter==="School")results=await runQuery('schoolLower',raw);
        else{
          // "All" — a plain search bar has no way to know which field the
          // student meant, so query name/username/school in parallel and
          // merge, deduping by uid.
          const [byUsername,byName,bySchool]=await Promise.all([
            runQuery('usernameLower',raw.replace(/\s+/g,"")),
            runQuery('nameLower',raw),
            runQuery('schoolLower',raw),
          ]);
          const seen=new Set();
          results=[...byUsername,...byName,...bySchool].filter(u=>seen.has(u.uid)?false:(seen.add(u.uid),true));
        }
        if(!active)return;
        setSearchResults(results.filter(u=>u.uid!==myUid).slice(0,10));
      }catch(e){if(active)setSearchResults([]);}
      if(active)setSearching(false);
    },300);
    return ()=>{active=false;clearTimeout(t);};
  },[searchQ,searchFilter,myUid]);
  const noResults=searchQ.trim()&&!searching&&searchResults.length===0;

  const sendEmailInvite=()=>{if(!inviteEmail.trim())return;setEmailSent(true);setTimeout(()=>{setEmailSent(false);setInviteEmail("");},2500);};
  const copyLink=()=>{navigator.clipboard&&navigator.clipboard.writeText(inviteLink);setCopied(true);setTimeout(()=>setCopied(false),2200);};

  // Sending a request when the other person already has a pending request in
  // to us just accepts theirs instead of creating a redundant duplicate doc.
  const sendFriendRequest=async(targetUid)=>{
    if(!myUid||targetUid===myUid)return;
    const theirs=incomingReqs.find(r=>r.senderId===targetUid);
    if(theirs){await acceptReq(theirs.id);return;}
    try{await fsdb().collection('friendships').add({senderId:myUid,receiverId:targetUid,status:'pending',createdAt:new Date().toISOString()});if(onFriendRequestSent)onFriendRequestSent();}catch(e){}
  };
  const acceptReq=async(id)=>{try{await fsdb().collection('friendships').doc(id).update({status:'accepted',updatedAt:new Date().toISOString()});}catch(e){}};
  const declineReq=async(id)=>{try{await fsdb().collection('friendships').doc(id).delete();}catch(e){}};

  // ── Co-op "Join Lock-In" — simulated request/accept, then hands off to the
  // global TaskTimerModal (via the same window._setTimerTask bridge Calendar uses)
  const [joinRevealFor,setJoinRevealFor]=useState(null);
  const [netToast,setNetToast]=useState(null);
  const showNetToast=(msg)=>{setNetToast(msg);setTimeout(()=>setNetToast(null),3200);};
  const joinLockIn=(u)=>{
    setJoinRevealFor(null);
    showNetToast("Request sent to "+u.n+"…");
    setTimeout(()=>{
      showNetToast(u.n+" joined your session!");
      const p=u.presence||{};
      if(window._setTimerTask)window._setTimerTask({
        id:"coop-"+Date.now(),
        title:"Co-op session with "+u.n,
        subject:p.subject||"Study session",
        duration:Math.max(5,p.remainingMin||25),
        kind:"study block",
        coop:{name:u.n,initials:u.n.split(" ").map(x=>x[0]).join("")},
      });
    },1400);
  };

  const [cgName,setCgName]=useState("");
  const [cgMembers,setCgMembers]=useState([]);
  const [cgType,setCgType]=useState("permanent");
  const [cgDuration,setCgDuration]=useState("1 month");
  const [cgCustomDate,setCgCustomDate]=useState("");
  const resetCreateGroup=()=>{setCgName("");setCgMembers([]);setCgType("permanent");setCgDuration("1 month");setCgCustomDate("");};
  const toggleCgMember=(uid)=>setCgMembers(m=>m.includes(uid)?m.filter(x=>x!==uid):[...m,uid]);
  const cgCustomInvalid=cgType==="temporary"&&cgDuration==="Custom date"&&!cgCustomDate;
  const submitCreateGroup=async()=>{
    if(!myUid||!cgName.trim()||cgMembers.length===0||cgCustomInvalid)return;
    let expiresAt=null;
    if(cgType==="temporary"){
      if(cgDuration==="Custom date"&&cgCustomDate)expiresAt=new Date(cgCustomDate+"T23:59:59").getTime();
      else{const dur=GROUP_DURATIONS.find(d=>d.label===cgDuration);expiresAt=dur?Date.now()+dur.days*86400000:null;}
    }
    // Snapshot each member's display name at creation time (keyed by uid,
    // the same id used for security-rule membership checks) so the group
    // settings panel can show names without extra profile reads.
    const memberNames={[myUid]:me};
    cgMembers.forEach(uid=>{const f=myFriends.find(x=>x.uid===uid);memberNames[uid]=f?f.n:uid;});
    const now=new Date().toISOString();
    try{
      await fsdb().collection('chatRooms').add({
        type:"group",memberUids:[myUid,...cgMembers],createdBy:myUid,
        name:cgName.trim(),groupType:cgType,expiresAt,memberNames,
        createdAt:now,updatedAt:now,lastMessage:null,
      });
    }catch(e){}
    setCreateGroupOpen(false);resetCreateGroup();
  };
  const makeGroupPermanent=async(id)=>{
    try{await fsdb().collection('chatRooms').doc(id).update({groupType:"permanent",expiresAt:null,updatedAt:new Date().toISOString()});}catch(e){}
  };
  const deleteGroup=async(id)=>{
    try{await fsdb().collection('chatRooms').doc(id).delete();}catch(e){}
    setChatTarget(t=>(t&&t.kind==="group"&&t.group.id===id)?null:t);
  };

  return (
    <div>
      <PH title="Studlin Network" sub="Study together. Stay in sync." />

      {/* ── ADD FRIENDS / SEARCH ── */}
      <div style={{fontSize:10,fontWeight:700,letterSpacing:"0.1em",textTransform:"uppercase",color:T.faint,marginBottom:8}}>Add Friends</div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 296px",gap:14,marginBottom:24}}>
        <div>
          <div style={{display:"flex",gap:6,marginBottom:10}}>
            {["All","@username","Name","School"].map(f=>(
              <button key={f} onClick={()=>setSearchFilter(f)} style={{padding:"5px 11px",borderRadius:6,fontSize:11,fontWeight:600,cursor:"pointer",fontFamily:T.font,border:`1px solid ${searchFilter===f?T.lime+"44":T.border}`,background:searchFilter===f?T.lime+"14":"transparent",color:searchFilter===f?T.lime:T.muted,transition:"all 0.12s"}}>{f}</button>
            ))}
          </div>
          <div style={{display:"flex",alignItems:"center",gap:10,padding:"9px 13px",background:T.card2,border:`1px solid ${T.border}`,borderRadius:9,marginBottom:12}}>
            <span style={{color:T.muted,display:"flex",flexShrink:0}}><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg></span>
            <input value={searchQ} onChange={e=>{setSearchQ(e.target.value);setEmailSent(false);}} placeholder={searchFilter==="@username"?"Search by @username…":searchFilter==="School"?"Search by university or college…":searchFilter==="Name"?"Search by first or last name…":"Search by name, @username, or school…"} style={{flex:1,background:"none",border:"none",outline:"none",color:T.text,fontSize:13,fontFamily:T.font}} />
            {searchQ&&<button onClick={()=>setSearchQ("")} style={{background:"none",border:"none",color:T.muted,cursor:"pointer",padding:0,display:"flex",lineHeight:1,flexShrink:0}}>{Icon.xmark}</button>}
          </div>
          <Card style={{padding:0,overflow:"hidden"}}>
            {!searchQ.trim()
              ?<div style={{padding:24,textAlign:"center",fontSize:12.5,color:T.muted,lineHeight:1.6}}>Search by username, name, or school to find classmates already on Studlin.</div>
              :searching
                ?<div style={{padding:24,textAlign:"center",fontSize:12.5,color:T.muted}}>Searching…</div>
                :!noResults
                  ?searchResults.map((u,i,arr)=>{
                      const isFriend=friends.some(f=>f.uid===u.uid);
                      const incomingFromThem=incomingReqs.find(r=>r.senderId===u.uid);
                      const isPendingOut=outgoingReqIds.has(u.uid);
                      const label=isFriend?"Following":incomingFromThem?"Accept":isPendingOut?"Pending":"Add";
                      const onClickBtn=isFriend||isPendingOut?undefined:incomingFromThem?()=>acceptReq(incomingFromThem.id):()=>sendFriendRequest(u.uid);
                      return (
                        <div key={u.uid} style={{display:"flex",alignItems:"center",gap:12,padding:"12px 16px",borderBottom:i<arr.length-1?`1px solid ${T.border}`:"none"}}>
                          <div style={{position:"relative",flexShrink:0}}>
                            <Av initials={u.n.split(" ").map(x=>x[0]).join("")} color={T.lime} size={34} picUrl="" />
                          </div>
                          <div style={{flex:1,minWidth:0}}>
                            <div style={{fontSize:13,fontWeight:600,color:T.white}}>{u.n}</div>
                            <div style={{fontSize:11,color:T.muted}}>{u.h}{u.s&&<> · <span style={{color:T.blue}}>{u.s}</span></>}</div>
                          </div>
                          <BtnSm variant={label==="Add"||label==="Accept"?"lime":"subtle"} onClick={onClickBtn} style={{flexShrink:0,opacity:onClickBtn?1:0.7}}>{label}</BtnSm>
                        </div>
                      );
                    })
                  :<div style={{padding:20}}>
                      <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:14}}>
                        <div style={{width:34,height:34,borderRadius:9,background:T.blue+"18",border:`1px solid ${T.blue}30`,display:"flex",alignItems:"center",justifyContent:"center",color:T.blue,flexShrink:0}}>{Icon.mail}</div>
                        <div>
                          <div style={{fontSize:13,fontWeight:700,color:T.white}}>No one found for "{searchQ}"</div>
                          <div style={{fontSize:11,color:T.muted}}>Invite them to join Studlin via email.</div>
                        </div>
                      </div>
                      <input value={inviteEmail} onChange={e=>setInviteEmail(e.target.value)} onKeyDown={e=>{if(e.key==="Enter")sendEmailInvite();}} placeholder="friend@university.edu" style={{width:"100%",background:T.card2,border:`1px solid ${T.border}`,borderRadius:8,padding:"9px 12px",color:T.text,fontSize:13,fontFamily:T.font,outline:"none",boxSizing:"border-box",marginBottom:10}} />
                      {emailSent&&<div style={{fontSize:12,color:T.teal,marginBottom:8}}>Invite sent!</div>}
                      <Btn onClick={sendEmailInvite} style={{width:"100%",justifyContent:"center",opacity:inviteEmail.trim()?1:0.45}}>{Icon.mail} Send invite</Btn>
                    </div>
            }
          </Card>
        </div>

        <div style={{display:"flex",flexDirection:"column"}}>
          <Card style={{padding:18,textAlign:"center",flex:1}}>
            <div style={{fontSize:13,fontWeight:700,color:T.white,marginBottom:4}}>Invite via QR</div>
            <div style={{fontSize:11,color:T.muted,marginBottom:14,lineHeight:1.55}}>Opens Studlin invite for instant sign-up.</div>
            <div style={{display:"flex",alignItems:"center",justifyContent:"center",marginBottom:12}}>
              <div style={{padding:10,background:T.card2,borderRadius:12,border:`1px solid ${T.border}`}}>
                <img src={qrUrl} width={130} height={130} alt="Scan to invite" style={{display:"block",borderRadius:6}}
                  onError={e=>{
                    e.target.style.display="none";
                    if(e.target.nextSibling)e.target.nextSibling.style.display="flex";
                  }}
                />
                {/* SVG fallback QR */}
                <div style={{display:"none",width:130,height:130,alignItems:"center",justifyContent:"center",flexDirection:"column",gap:6}}>
                  <svg width="100" height="100" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <rect x="6" y="6" width="28" height="28" rx="3" fill="none" stroke={T.lime} strokeWidth="3"/>
                    <rect x="11" y="11" width="18" height="18" rx="2" fill={T.lime}/>
                    <rect x="66" y="6" width="28" height="28" rx="3" fill="none" stroke={T.lime} strokeWidth="3"/>
                    <rect x="71" y="11" width="18" height="18" rx="2" fill={T.lime}/>
                    <rect x="6" y="66" width="28" height="28" rx="3" fill="none" stroke={T.lime} strokeWidth="3"/>
                    <rect x="11" y="71" width="18" height="18" rx="2" fill={T.lime}/>
                    {[[40,6],[46,6],[52,6],[58,6],[40,12],[58,12],[40,18],[46,18],[52,18],[58,18],[40,24],[52,24],[40,30],[46,30],[52,30],[58,30],[6,40],[12,40],[18,40],[24,40],[30,40],[40,40],[52,40],[58,40],[64,40],[70,40],[76,40],[82,40],[88,40],[94,40],[6,46],[18,46],[30,46],[40,46],[52,46],[64,46],[76,46],[88,46],[6,52],[12,52],[18,52],[24,52],[30,52],[40,52],[46,52],[52,52],[58,52],[64,52],[76,52],[88,52],[94,52],[6,58],[18,58],[30,58],[40,58],[52,58],[58,58],[64,58],[76,58],[88,58],[40,66],[46,66],[52,66],[58,66],[64,66],[76,66],[82,66],[88,66],[94,66],[40,72],[52,72],[58,72],[64,72],[76,72],[88,72],[40,78],[46,78],[52,78],[58,78],[70,78],[82,78],[94,78],[40,84],[52,84],[64,84],[76,84],[88,84],[40,90],[46,90],[58,90],[70,90],[82,90],[94,90]].map(([x,y],i)=>(
                      <rect key={i} x={x} y={y} width="5" height="5" rx="1" fill={T.lime} opacity="0.78"/>
                    ))}
                  </svg>
                  <div style={{fontSize:8.5,color:T.muted,letterSpacing:"0.04em"}}>studlin.app</div>
                </div>
              </div>
            </div>
            <div style={{fontSize:10,color:T.faint,marginBottom:12,fontFamily:T.mono,padding:"6px 9px",background:T.card2,borderRadius:6,border:`1px solid ${T.border}`,wordBreak:"break-all",textAlign:"left"}}>{inviteLink}</div>
            <Btn onClick={copyLink} style={{width:"100%",justifyContent:"center"}}>{copied?Icon.check:Icon.copy} {copied?"Copied!":"Copy invite link"}</Btn>
          </Card>
        </div>
      </div>

      {/* ── CLASSMATES AT MY SCHOOL — real, auto-populated ── */}
      {mySchool&&(
        <div style={{marginBottom:24}}>
          <div style={{fontSize:10,fontWeight:700,letterSpacing:"0.1em",textTransform:"uppercase",color:T.faint,marginBottom:8}}>Classmates at {mySchool}</div>
          <Card style={{padding:classmates.length===0&&!classmatesLoading?20:0,overflow:"hidden"}}>
            {classmatesLoading
              ?<div style={{padding:24,textAlign:"center",fontSize:12.5,color:T.muted}}>Searching…</div>
              :classmates.length>0
                ?classmates.map((u,i,arr)=>{
                    const isFriend=friends.some(f=>f.uid===u.uid);
                    const incomingFromThem=incomingReqs.find(r=>r.senderId===u.uid);
                    const isPendingOut=outgoingReqIds.has(u.uid);
                    const label=isFriend?"Following":incomingFromThem?"Accept":isPendingOut?"Pending":"Add";
                    const onClickBtn=isFriend||isPendingOut?undefined:incomingFromThem?()=>acceptReq(incomingFromThem.id):()=>sendFriendRequest(u.uid);
                    return (
                      <div key={u.uid} style={{display:"flex",alignItems:"center",gap:12,padding:"12px 16px",borderBottom:i<arr.length-1?`1px solid ${T.border}`:"none"}}>
                        <Av initials={u.n.split(" ").map(x=>x[0]).join("")} color={T.lime} size={34} picUrl="" />
                        <div style={{flex:1,minWidth:0}}>
                          <div style={{fontSize:13,fontWeight:600,color:T.white}}>{u.n}</div>
                          <div style={{fontSize:11,color:T.muted}}>{u.h}</div>
                        </div>
                        <BtnSm variant={label==="Add"||label==="Accept"?"lime":"subtle"} onClick={onClickBtn} style={{flexShrink:0,opacity:onClickBtn?1:0.7}}>{label}</BtnSm>
                      </div>
                    );
                  })
                :<div>
                    <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:14}}>
                      <div style={{width:34,height:34,borderRadius:9,background:T.lime+"18",border:`1px solid ${T.lime}30`,display:"flex",alignItems:"center",justifyContent:"center",color:T.lime,flexShrink:0}}>{Icon.zap}</div>
                      <div>
                        <div style={{fontSize:13,fontWeight:700,color:T.white}}>Be the pioneer on your campus.</div>
                        <div style={{fontSize:11,color:T.muted}}>Invite classmates to auto-sync routines and conquer the leaderboard!</div>
                      </div>
                    </div>
                    <Btn onClick={()=>setInviteOpen(true)} style={{width:"100%",justifyContent:"center"}}>{Icon.mail} Invite classmates</Btn>
                  </div>
            }
          </Card>
        </div>
      )}

      {/* ── GROWTH BANNER ── */}
      <div style={{display:"flex",alignItems:"center",gap:12,padding:"12px 16px",borderRadius:10,background:T.lime+"0C",border:`1px solid ${T.lime}22`,marginBottom:24}}>
        <div style={{width:28,height:28,borderRadius:8,background:T.lime+"1A",border:`1px solid ${T.lime}30`,display:"flex",alignItems:"center",justifyContent:"center",color:T.lime,flexShrink:0}}>{Icon.zap}</div>
        <div style={{flex:1,fontSize:12.5,color:T.muted,lineHeight:1.5}}>
          <span style={{color:T.text,fontWeight:600}}>Invite classmates to unlock collective scheduling.</span>{" "}For every friend who joins, you <strong style={{color:T.lime}}>both</strong> get <span style={{color:T.lime,fontWeight:600}}>50 bonus AI credits</span>.
        </div>
        <button onClick={()=>setInviteOpen(true)} style={{flexShrink:0,padding:"7px 16px",borderRadius:7,background:T.lime,color:T.ink,border:"none",fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:T.font,whiteSpace:"nowrap"}}>
          Invite friends
        </button>
      </div>

      {/* ── UNIFIED INBOX — "All" (DMs + groups, chronological) / "Groups" ── */}
      <div style={{marginBottom:24}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:8}}>
          <div style={{display:"flex",gap:6}}>
            {["All","Groups"].map(t=>(
              <button key={t} onClick={()=>setInboxTab(t)} style={{padding:"5px 13px",borderRadius:99,fontSize:11.5,fontWeight:700,cursor:"pointer",fontFamily:T.font,border:`1px solid ${inboxTab===t?T.lime+"55":T.border}`,background:inboxTab===t?T.lime+"14":"transparent",color:inboxTab===t?T.lime:T.muted,transition:"all 0.12s"}}>{t}</button>
            ))}
          </div>
          <button onClick={()=>{resetCreateGroup();setCreateGroupOpen(true);}} style={{display:"flex",alignItems:"center",gap:5,fontSize:11,fontWeight:700,color:T.lime,background:"none",border:"none",cursor:"pointer",fontFamily:T.font,padding:0}}>{Icon.plus} Create Group</button>
        </div>
        <Card style={{padding:0,overflow:"hidden"}}>
          {inboxShown.length===0
            ?<div style={{padding:20,fontSize:12.5,color:T.muted,lineHeight:1.6}}>{inboxTab==="Groups"?"No groups yet. Create one to start a project chat.":"No friends or groups yet. Search above to add classmates."}</div>
            :inboxShown.map((row,i)=>{
                if(row.kind==="group"){
                  const g=row.group;
                  const expiry=fmtGroupCountdown(g.expiresAt);
                  return (
                    <div key={row.key} onClick={()=>setChatTarget({kind:"group",group:g})} style={{display:"flex",alignItems:"center",gap:12,padding:"12px 16px",borderBottom:i<inboxShown.length-1?`1px solid ${T.border}`:"none",cursor:"pointer"}}>
                      <div style={{width:34,height:34,borderRadius:10,background:T.purple+"18",border:`1px solid ${T.purple}33`,display:"flex",alignItems:"center",justifyContent:"center",color:T.purple,flexShrink:0}}>{Icon.users}</div>
                      <div style={{flex:1,minWidth:0}}>
                        <div style={{fontSize:13,fontWeight:600,color:T.white}}>{g.name}</div>
                        <div style={{fontSize:11,color:T.muted,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{row.preview||g.memberUids.length+" members"}{expiry?<> · <span style={{color:expiry.urgent?T.amber:T.purple}}>Archives in {expiry.label}</span></>:""}</div>
                      </div>
                      {row.unread&&<div style={{width:8,height:8,borderRadius:"50%",background:T.lime,flexShrink:0}} />}
                      <button onClick={e=>{e.stopPropagation();setChatTarget({kind:"group",group:g});}} style={{width:32,height:32,borderRadius:9,border:`1px solid ${T.border}`,background:T.card2,color:T.lime,display:"grid",placeItems:"center",cursor:"pointer",flexShrink:0}}>{Icon.msgSquare}</button>
                    </div>
                  );
                }
                const u=row.user;
                const pr=presenceInfo(u);
                const revealed=joinRevealFor===u.h;
                return (
                  <div key={row.key} style={{display:"flex",alignItems:"center",gap:12,padding:"12px 16px",borderBottom:i<inboxShown.length-1?`1px solid ${T.border}`:"none"}}>
                    <div onClick={()=>setChatTarget({kind:"dm",user:u})} style={{position:"relative",flexShrink:0,cursor:"pointer"}}>
                      <Av initials={u.n.split(" ").map(x=>x[0]).join("")} color={T.lime} size={34} picUrl="" />
                      <div style={{position:"absolute",bottom:0,right:0,width:9,height:9,borderRadius:"50%",background:pr.color,border:`2px solid ${T.card}`}} />
                    </div>
                    <div onClick={()=>setChatTarget({kind:"dm",user:u})} style={{flex:1,minWidth:0,cursor:"pointer"}}>
                      <div style={{fontSize:13,fontWeight:600,color:T.white}}>{u.n}</div>
                      <div onClick={e=>{if(pr.joinable){e.stopPropagation();setJoinRevealFor(revealed?null:u.h);}}} style={{fontSize:11,color:pr.color,fontWeight:pr.joinable?600:400,cursor:pr.joinable?"pointer":"default",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{row.preview&&!pr.joinable?row.preview:pr.text}</div>
                    </div>
                    {row.unread&&<div style={{width:8,height:8,borderRadius:"50%",background:T.lime,flexShrink:0}} />}
                    {revealed&&pr.joinable
                      ?<button onClick={()=>joinLockIn(u)} style={{flexShrink:0,padding:"7px 14px",borderRadius:99,background:T.teal,color:T.ink,border:"none",fontSize:11.5,fontWeight:700,cursor:"pointer",fontFamily:T.font,boxShadow:`0 0 0 4px ${T.teal}22, 0 4px 14px -4px ${T.teal}88`,whiteSpace:"nowrap"}}>Join Lock-In</button>
                      :<button onClick={()=>setChatTarget({kind:"dm",user:u})} style={{width:32,height:32,borderRadius:9,border:`1px solid ${T.border}`,background:T.card2,color:T.lime,display:"grid",placeItems:"center",cursor:"pointer",flexShrink:0}}>{Icon.msgSquare}</button>
                    }
                  </div>
                );
              })
          }
        </Card>
      </div>

      {netToast&&(
        <div style={{position:"fixed",bottom:22,left:"50%",transform:"translateX(-50%)",zIndex:900,padding:"10px 18px",background:T.ink,color:T.cream,borderRadius:99,fontSize:12.5,fontWeight:600,boxShadow:"0 16px 40px -12px rgba(0,0,0,0.5)",animation:"studlinPop 0.2s cubic-bezier(.2,.85,.3,1)"}}>{netToast}</div>
      )}

      {/* ── INCOMING FRIEND REQUESTS ── */}
      {incomingReqs.length>0&&(
        <div style={{marginBottom:16}}>
          <div style={{fontSize:10,fontWeight:700,letterSpacing:"0.1em",textTransform:"uppercase",color:T.faint,marginBottom:8,display:"flex",alignItems:"center",gap:8}}>
            Incoming Requests
            <span style={{background:T.amber,color:T.ink,fontSize:9,fontWeight:800,borderRadius:4,padding:"1px 6px"}}>{incomingReqs.length}</span>
          </div>
          <Card style={{padding:0,overflow:"hidden"}}>
            {incomingReqs.map((req,i)=>(
              <div key={req.id} style={{display:"flex",alignItems:"center",gap:12,padding:"13px 16px",borderBottom:i<incomingReqs.length-1?`1px solid ${T.border}`:"none",transition:"background 0.15s"}}>
                <Av initials={req.n.split(" ").map(x=>x[0]).join("")} color={T.amber} size={36} picUrl="" />
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontSize:13,fontWeight:600,color:T.white}}>{req.n}</div>
                  <div style={{fontSize:11,color:T.muted}}>{req.h} · <span style={{color:T.blue}}>{req.s}</span></div>
                </div>
                <div style={{display:"flex",gap:7,flexShrink:0}}>
                  <button onClick={()=>acceptReq(req.id)} style={{padding:"6px 14px",borderRadius:7,background:T.lime,color:T.ink,border:"none",fontSize:11.5,fontWeight:700,cursor:"pointer",fontFamily:T.font}}>Accept</button>
                  <button onClick={()=>declineReq(req.id)} style={{padding:"6px 13px",borderRadius:7,background:"transparent",color:T.muted,border:`1px solid ${T.border}`,fontSize:11.5,fontWeight:600,cursor:"pointer",fontFamily:T.font}}>Decline</button>
                </div>
              </div>
            ))}
          </Card>
        </div>
      )}

      {/* ── INVITE MODAL ── */}
      {inviteOpen&&(
        <div onClick={()=>setInviteOpen(false)} style={{position:"fixed",inset:0,zIndex:90,background:"rgba(8,12,10,0.78)",backdropFilter:"blur(8px)",display:"flex",alignItems:"center",justifyContent:"center"}}>
          <div onClick={e=>e.stopPropagation()} style={{width:460,maxWidth:"92vw",background:T.surface,border:`1px solid ${T.border}`,borderRadius:18,padding:32,boxShadow:"0 40px 90px -30px rgba(0,0,0,0.65)"}}>
            <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:10}}>
              <div style={{width:42,height:42,borderRadius:12,background:T.lime+"18",border:`1px solid ${T.lime}33`,display:"flex",alignItems:"center",justifyContent:"center",color:T.lime,flexShrink:0}}>{Icon.users}</div>
              <div>
                <div style={{fontSize:18,fontWeight:700,color:T.white,letterSpacing:"-0.02em"}}>Invite your classmates</div>
                <div style={{fontSize:12,color:T.muted}}>Unlock collective calendar syncing.</div>
              </div>
            </div>
            <div style={{fontSize:13,color:T.text,lineHeight:1.7,marginBottom:20}}>
              When your whole class is on Studlin, syncing calendars can automatically find when <em>everyone</em> is free — no more "when can everyone meet?" texts.
            </div>
            <div style={{padding:"11px 14px",background:T.card2,border:`1px solid ${T.border}`,borderRadius:10,marginBottom:14,display:"flex",alignItems:"center",gap:10}}>
              <div style={{flex:1,fontSize:12,color:T.text,fontFamily:T.mono,wordBreak:"break-all"}}>{inviteLink}</div>
              <button onClick={copyLink} style={{flexShrink:0,padding:"7px 13px",borderRadius:7,background:copied?T.teal:T.lime,color:T.ink,border:"none",fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:T.font,transition:"background 0.2s",whiteSpace:"nowrap"}}>
                {copied?"✓ Copied!":"Copy"}
              </button>
            </div>
            <div style={{padding:"10px 14px",background:T.lime+"0A",border:`1px solid ${T.lime}22`,borderRadius:8,fontSize:12,color:T.text,marginBottom:20,lineHeight:1.6}}>
              For every friend who joins via your link, you <strong style={{color:T.lime}}>both</strong> unlock <strong style={{color:T.lime}}>50 bonus AI scheduling credits</strong>.
            </div>
            <div style={{display:"flex",gap:10}}>
              <Btn onClick={()=>setInviteOpen(false)} variant="subtle" style={{flex:1,justifyContent:"center"}}>Close</Btn>
              <Btn onClick={copyLink} style={{flex:1,justifyContent:"center"}}>{copied?<>{Icon.check} Copied!</>:<>{Icon.copy} Copy link</>}</Btn>
            </div>
          </div>
        </div>
      )}

      {/* ── CREATE GROUP MODAL ── */}
      <Modal open={createGroupOpen} onClose={()=>{setCreateGroupOpen(false);resetCreateGroup();}} title="Create a group" sub="Standard chat, or a project group that archives itself." width={480}
        footer={<><Btn variant="subtle" onClick={()=>{setCreateGroupOpen(false);resetCreateGroup();}}>Cancel</Btn><Btn onClick={submitCreateGroup} style={{opacity:cgName.trim()&&cgMembers.length>0&&!cgCustomInvalid?1:0.45}}>{Icon.plus} Create group</Btn></>}>
        <Field label="Group name"><Input placeholder="e.g. Bio Study Group" value={cgName} onChange={e=>setCgName(e.target.value)} autoFocus /></Field>
        <Field label="Members" hint={myFriends.length===0?"Add friends first to start a group.":null}>
          <div style={{display:"flex",flexDirection:"column",gap:6,maxHeight:150,overflowY:"auto"}}>
            {myFriends.map(u=>{
              const sel=cgMembers.includes(u.uid);
              return (
                <div key={u.uid} onClick={()=>toggleCgMember(u.uid)} style={{display:"flex",alignItems:"center",gap:10,padding:"8px 10px",borderRadius:8,cursor:"pointer",background:sel?T.lime+"10":T.card2,border:`1px solid ${sel?T.lime+"44":T.border}`}}>
                  <Av initials={u.n.split(" ").map(x=>x[0]).join("")} color={T.lime} size={26} picUrl="" />
                  <div style={{flex:1,fontSize:12.5,color:T.text,fontWeight:600}}>{u.n}</div>
                  <div style={{width:16,height:16,borderRadius:5,border:`1.5px solid ${sel?T.lime:T.border}`,background:sel?T.lime:"transparent",display:"flex",alignItems:"center",justifyContent:"center"}}>
                    {sel&&<svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke={T.bg} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>}
                  </div>
                </div>
              );
            })}
          </div>
        </Field>
        <Field label="Group type">
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
            <div onClick={()=>setCgType("permanent")} style={{padding:"12px 13px",borderRadius:10,cursor:"pointer",border:`1.5px solid ${cgType==="permanent"?T.lime:T.border}`,background:cgType==="permanent"?T.lime+"0A":T.card2}}>
              <div style={{color:cgType==="permanent"?T.lime:T.muted,marginBottom:6}}>{Icon.users}</div>
              <div style={{fontSize:12.5,fontWeight:700,color:T.white,marginBottom:2}}>Permanent Group</div>
              <div style={{fontSize:11,color:T.muted,lineHeight:1.4}}>Standard ongoing chat.</div>
            </div>
            <div onClick={()=>setCgType("temporary")} style={{padding:"12px 13px",borderRadius:10,cursor:"pointer",border:`1.5px solid ${cgType==="temporary"?T.purple:T.border}`,background:cgType==="temporary"?T.purple+"0A":T.card2}}>
              <div style={{color:cgType==="temporary"?T.purple:T.muted,marginBottom:6}}>{Icon.clock}</div>
              <div style={{fontSize:12.5,fontWeight:700,color:T.white,marginBottom:2}}>Project / Temporary</div>
              <div style={{fontSize:11,color:T.muted,lineHeight:1.4}}>Auto-archives after a set duration.</div>
            </div>
          </div>
        </Field>
        {cgType==="temporary"&&(
          <Field label="Archive after" hint="Pick a preset, or set a custom date — e.g. your final exam day.">
            <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
              {GROUP_DURATIONS.map(d=>(
                <button key={d.label} onClick={()=>setCgDuration(d.label)} style={{padding:"7px 13px",borderRadius:7,fontSize:12,cursor:"pointer",border:`1px solid ${cgDuration===d.label?T.purple+"66":T.border}`,background:cgDuration===d.label?T.purple+"14":"transparent",color:cgDuration===d.label?T.purple:T.muted,fontFamily:T.font,fontWeight:cgDuration===d.label?600:400}}>{d.label}</button>
              ))}
              <button onClick={()=>setCgDuration("Custom date")} style={{padding:"7px 13px",borderRadius:7,fontSize:12,cursor:"pointer",border:`1px solid ${cgDuration==="Custom date"?T.purple+"66":T.border}`,background:cgDuration==="Custom date"?T.purple+"14":"transparent",color:cgDuration==="Custom date"?T.purple:T.muted,fontFamily:T.font,fontWeight:cgDuration==="Custom date"?600:400}}>Custom date</button>
            </div>
            {cgDuration==="Custom date"&&(
              <Input type="date" value={cgCustomDate} onChange={e=>setCgCustomDate(e.target.value)} min={new Date().toISOString().slice(0,10)} style={{marginTop:10}} />
            )}
          </Field>
        )}
      </Modal>

      <ChatDrawer open={!!chatTarget} myUid={myUid} target={chatTarget&&chatTarget.kind==="group"&&myRooms[chatTarget.group.id]?{...chatTarget,group:myRooms[chatTarget.group.id]}:chatTarget} onClose={()=>setChatTarget(null)} onMakePermanent={makeGroupPermanent} onDeleteGroup={deleteGroup} />
      {netTourStep!==null&&(
        <TourStep
          targetRef={null}
          title={NET_TOUR_STEPS[netTourStep].title}
          body={NET_TOUR_STEPS[netTourStep].body}
          step={netTourStep}
          total={NET_TOUR_STEPS.length}
          isLast={netTourStep===NET_TOUR_STEPS.length-1}
          onNext={advanceNetTour}
          onSkip={finishNetTour}
        />
      )}
    </div>
  );
}

// ─── NETWORK: chat message bubble ────────────────────────────────────────────
// Drawer panel is always a dark surface (like the sidebar), regardless of theme —
// so it needs its own light-on-dark palette instead of theme-adaptive T.text/T.muted.
function panelPalette(){
  const isLight=T.mode==="light";
  return {
    text:  isLight?"#F6F1E6":T.text,
    muted: isLight?"rgba(246,241,230,0.55)":T.muted,
    faint: isLight?"rgba(246,241,230,0.35)":T.faint,
    border:isLight?"rgba(246,241,230,0.14)":T.border,
    card2: isLight?"rgba(246,241,230,0.08)":T.card2,
  };
}

// ─── INSTITUTIONAL LIVE-DEMO: class explorer, preview drawer, injection ──────
// Standalone pill switch — the real `Toggle` component (used in Settings) is
// closure-bound to that component's own `toggles` state, so it can't be
// reused here; this is the same 38x20 visual, taking on/onClick directly.
const MiniToggle=({on,onClick})=>(
  <div onClick={onClick} style={{width:38,height:20,borderRadius:10,background:on?T.lime:T.card2,border:`1px solid ${on?T.lime:T.border}`,position:"relative",cursor:"pointer",transition:"all 0.2s",flexShrink:0}}>
    <div style={{width:14,height:14,borderRadius:"50%",background:on?T.bg:"#fff",position:"absolute",top:2,left:on?21:2,transition:"left 0.2s"}} />
  </div>
);

// Injects the non-TBD events of the given classes into the student's real
// events array. Runs outside CalendarTab's React state, so it reads/writes
// localStorage directly (same lsGet→concat→lsSet shape CalendarTab's own
// commitTasks uses). Each event's id is tagged "class-<code>-<index>" so a
// second click for the same class never double-injects. Returns the events
// that were actually newly added (empty array if everything was a dup).
function injectClassEvents(selectedClasses){
  const existing=lsGet("events",[]);
  const existingIds=new Set(existing.map(e=>e.id));
  const newEvents=[];
  selectedClasses.forEach(cls=>{
    cls.events.forEach((ev,idx)=>{
      if(ev.is_TBD)return; // no real date to schedule yet
      const id="class-"+cls.code+"-"+idx;
      if(existingIds.has(id))return;
      newEvents.push({
        id,
        title:ev.title,
        date:resolveDemoDate(ev.dayOffset),
        time:ev.time||"09:00",
        subject:cls.title,
        kind:ev.kind==="exam"?"exam":(ev.kind==="class"?"class":"deadline"),
        notes:"",
        priority:3,
        difficulty:3,
        deadline:null,
        duration:ev.duration||60,
        status:"pending",
        timeSpent:0,
        completedAt:null,
      });
    });
  });
  if(newEvents.length>0)lsSet("events",existing.concat(newEvents));
  return newEvents;
}

// Commits reviewed/confirmed syllabus deadlines as real calendar events,
// linked back to their source note via noteId (the same cross-reference
// shape assignmentId already established for Canvas-linked events). Runs
// outside CalendarTab's React state — called from Notes() — so it reads/
// writes localStorage directly, same lsGet→concat→lsSet shape as
// injectClassEvents above. Deterministic ids mean re-confirming the same
// note's review never double-injects.
function commitSyllabusEvents(noteId,tag,items){
  const existing=lsGet("events",[]);
  const newEvents=items.map((it,i)=>({
    id:"syl-"+noteId+"-"+i,
    title:it.title,
    date:it.date,
    time:it.kind==="exam"?"09:00":"23:59",
    subject:tag,
    kind:it.kind==="exam"?"exam":"deadline",
    notes:"",
    priority:5,
    difficulty:5,
    deadline:it.kind==="deadline"?it.date:null,
    duration:null,
    status:"pending",
    timeSpent:0,
    completedAt:null,
    noteId,
  }));
  lsSet("events",existing.concat(newEvents));
  return newEvents;
}

// How many of the student's existing study blocks now time-overlap the
// newly-injected class events — used to surface a safe, reviewable count
// instead of silently auto-moving the student's real study time.
function countStudyBlockConflicts(newEvents){
  const events=lsGet("events",[]);
  const toMin=(t)=>{const p=(t||"00:00").split(":").map(Number);return p[0]*60+p[1];};
  const overlaps=(a,b)=>{
    if(a.date!==b.date)return false;
    const aStart=toMin(a.time),aEnd=aStart+(a.duration||30);
    const bStart=toMin(b.time),bEnd=bStart+(b.duration||30);
    return aStart<bEnd&&bStart<aEnd;
  };
  return events.filter(e=>e.kind==="study block"&&newEvents.some(ne=>overlaps(e,ne))).length;
}

// Right-side slide-in preview — modeled directly on ChatDrawer's shell
// (portal + backdrop + translateX panel), z-index bumped above it so the two
// never visually collide (they can't both be open in practice).
function ClassPreviewDrawer({open,cls,events,onClose,isHS,simOn,onToggleSimulate}){
  const pp=panelPalette();
  useEffect(()=>{
    if(!open)return;
    const onKey=e=>{if(e.key==="Escape")onClose();};
    window.addEventListener("keydown",onKey);
    return ()=>window.removeEventListener("keydown",onKey);
  },[open]);
  if(!cls)return null;
  return ReactDOM.createPortal(
    <>
      <div onClick={onClose} style={{position:"fixed",inset:0,background:"rgba(8,12,10,0.5)",zIndex:410,opacity:open?1:0,pointerEvents:open?"auto":"none",transition:"opacity 0.25s"}} />
      <div style={{position:"fixed",top:0,right:0,height:"100vh",width:400,maxWidth:"92vw",background:T.surface,borderLeft:`1px solid ${pp.border}`,boxShadow:"-24px 0 60px -20px rgba(0,0,0,0.5)",zIndex:411,display:"flex",flexDirection:"column",transform:open?"translateX(0)":"translateX(100%)",transition:"transform 0.28s cubic-bezier(.2,.85,.3,1)"}}>
        <div style={{padding:"18px 18px 14px",borderBottom:`1px solid ${pp.border}`,display:"flex",alignItems:"center",gap:12}}>
          <div style={{flex:1,minWidth:0}}>
            <div style={{fontSize:14,fontWeight:700,color:pp.text}}>{cls.code}: {cls.title}</div>
            <div style={{fontSize:11,color:pp.muted}}>{cls.instructor}</div>
          </div>
          <button onClick={onClose} style={{width:30,height:30,borderRadius:8,border:`1px solid ${pp.border}`,background:pp.card2,color:pp.muted,display:"grid",placeItems:"center",cursor:"pointer",flexShrink:0}}>{Icon.xmark}</button>
        </div>

        <div style={{padding:"12px 18px",borderBottom:`1px solid ${pp.border}`,display:"flex",alignItems:"center",gap:8,background:T.amber+"0F"}}>
          <span style={{color:T.amber,display:"flex",flexShrink:0}}>{Icon.shield}</span>
          <span style={{fontSize:11.5,color:pp.text,lineHeight:1.4}}>Only <strong>{cls.instructor}</strong> can change these dates.</span>
        </div>

        <div style={{padding:"12px 18px",borderBottom:`1px solid ${pp.border}`,display:"flex",alignItems:"center",justifyContent:"space-between",gap:10}}>
          <div>
            <div style={{fontSize:12.5,fontWeight:600,color:pp.text}}>Simulate Professor Update</div>
            <div style={{fontSize:10.5,color:pp.muted,marginTop:1}}>Preview: move "Project 1" from Friday to Monday</div>
          </div>
          <MiniToggle on={simOn} onClick={onToggleSimulate} />
        </div>

        <div style={{flex:1,overflowY:"auto",padding:"14px 18px"}}>
          {isHS&&<div style={{fontSize:10,fontWeight:700,letterSpacing:"0.08em",textTransform:"uppercase",color:pp.faint,marginBottom:10}}>Teacher's Weekly Agenda</div>}
          {events.map((ev,i)=>(
            <div key={i} style={{display:"flex",alignItems:"center",gap:10,padding:"9px 0",borderBottom:`1px solid ${pp.border}`}}>
              <span style={{color:ev.is_TBD?pp.faint:T.lime,flexShrink:0}}>{ev.is_TBD?Icon.clock:Icon.check}</span>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontSize:12.5,color:pp.text,fontWeight:500}}>{ev.title}</div>
                <div style={{fontSize:10.5,color:pp.muted,marginTop:1}}>
                  {ev.is_TBD?"TBD — coming soon":(isHS?"This week":fmtDemoDate(resolveDemoDate(ev.dayOffset)))+(ev.time?" · "+ev.time:"")}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>,
    document.body
  );
}

// Mounted conditionally in Profile() — only when the student's own
// affiliation exactly matches one of the two seeded demo schools, so the
// ~99% of real users on other schools never see any trace of this.
function ExploreClassesCard({school,classes,setActive}){
  const [selectedCodes,setSelectedCodes]=useState([]);
  const [previewCls,setPreviewCls]=useState(null);
  const [simOn,setSimOn]=useState({});
  const [toast,setToast]=useState("");
  const [reOptModal,setReOptModal]=useState(null);
  const isHS=school===DEMO_SCHOOL_HS;

  const toggleSelect=(code)=>setSelectedCodes(prev=>prev.includes(code)?prev.filter(c=>c!==code):[...prev,code]);
  const showToast=(msg)=>{setToast(msg);setTimeout(()=>setToast(""),2600);};
  const findProjectIdx=(cls)=>cls.events.findIndex(e=>e.title==="Project 1");
  const effectiveEvents=(cls)=>{
    const idx=findProjectIdx(cls);
    if(idx<0||!simOn[cls.code])return cls.events;
    return cls.events.map((e,i)=>i===idx?{...e,dayOffset:e.dayOffset+3}:e);
  };

  const onToggleSimulate=(cls)=>{
    const turningOn=!simOn[cls.code];
    setSimOn(prev=>({...prev,[cls.code]:turningOn}));
    const idx=findProjectIdx(cls);
    if(idx<0)return;
    // Keep any already-injected real calendar event in sync with the toggle
    // in both directions, so switching it back off doesn't leave a stale
    // "moved" date behind on the student's real calendar.
    const injectedId="class-"+cls.code+"-"+idx;
    const evs=lsGet("events",[]);
    const already=evs.some(e=>e.id===injectedId);
    const newDate=resolveDemoDate(cls.events[idx].dayOffset+(turningOn?3:0));
    if(already)lsSet("events",evs.map(e=>e.id===injectedId?{...e,date:newDate}:e));
    if(turningOn){
      showToast(cls.instructor+" moved \"Project 1\" to Monday"+(already?" — your calendar has been updated.":" (preview only — add this class to your plan to sync it)."));
    }
  };

  const onOptimize=()=>{
    const chosen=classes.filter(c=>selectedCodes.includes(c.code)).map(c=>({...c,events:effectiveEvents(c)}));
    const newEvents=injectClassEvents(chosen);
    if(newEvents.length>0)setReOptModal({conflictCount:countStudyBlockConflicts(newEvents)});
  };

  return (
    <Card style={{marginBottom:16}}>
      <div style={{fontSize:14,fontWeight:700,color:T.white,marginBottom:4}}>Explore Classes — {school}</div>
      <div style={{fontSize:12,color:T.muted,marginBottom:16}}>{isHS?"Live demo: sync your teachers' weekly agendas straight into Studlin.":"Live demo: sync your official course syllabus straight into Studlin."}</div>
      {classes.map(cls=>(
        <div key={cls.code} style={{display:"flex",alignItems:"center",gap:12,padding:"11px 2px",borderBottom:`1px solid ${T.border}`}}>
          <input type="checkbox" checked={selectedCodes.includes(cls.code)} onClick={e=>e.stopPropagation()} onChange={()=>toggleSelect(cls.code)} style={{width:16,height:16,cursor:"pointer",flexShrink:0}} />
          <div onClick={()=>setPreviewCls(cls)} style={{flex:1,cursor:"pointer",minWidth:0}}>
            <div style={{fontSize:13,fontWeight:600,color:T.white}}>{cls.code}: {cls.title}</div>
            <div style={{fontSize:11,color:T.muted,marginTop:1}}>{cls.instructor}</div>
          </div>
        </div>
      ))}
      <div style={{marginTop:14}}>
        <Btn onClick={onOptimize} disabled={selectedCodes.length===0}>Optimize Into My Plan</Btn>
      </div>

      <ClassPreviewDrawer open={!!previewCls} cls={previewCls} events={previewCls?effectiveEvents(previewCls):[]} onClose={()=>setPreviewCls(null)} isHS={isHS}
        simOn={previewCls?!!simOn[previewCls.code]:false} onToggleSimulate={()=>previewCls&&onToggleSimulate(previewCls)} />

      <Modal open={!!reOptModal} onClose={()=>setReOptModal(null)} title="Studlin AI detected new course events"
        footer={<Btn onClick={()=>{setReOptModal(null);if(setActive)setActive("calendar");}}>Let's Re-Optimize</Btn>}>
        <div style={{fontSize:13.5,color:T.text,lineHeight:1.6}}>
          Studlin AI detected new course events from your synchronized classes. Would you like to automatically re-route your daytime study blocks to accommodate these updates and maximize your free time?
        </div>
        {reOptModal&&reOptModal.conflictCount>0&&(
          <div style={{marginTop:14,fontSize:12.5,color:T.amber}}>We've flagged {reOptModal.conflictCount} study block{reOptModal.conflictCount!==1?"s":""} that now conflict — open Calendar to review.</div>
        )}
      </Modal>

      {toast&&(
        <div style={{position:"fixed",bottom:24,left:"50%",transform:"translateX(-50%)",zIndex:80,background:T.lime,color:T.ink,padding:"10px 18px",borderRadius:99,fontSize:12.5,fontWeight:600,boxShadow:"0 12px 28px -10px rgba(0,0,0,0.4)"}}>{toast}</div>
      )}
    </Card>
  );
}

function ChatBubble({m,myUid,onRespond,onSchedule}){
  const pp=panelPalette();
  const mine=m.senderId===myUid;
  const align=mine?"flex-end":"flex-start";
  const bg=mine?T.lime+"1F":pp.card2;
  const border=mine?T.lime+"40":pp.border;
  // Local "just clicked" state — gives instant feedback on the exact button
  // clicked, then the real commit (onSchedule, which writes to Firestore and
  // collapses this whole block to its final "scheduled" layout) fires after
  // a beat so the click doesn't feel like it vanished into an abrupt cut.
  const [justChosen,setJustChosen]=useState(null);
  if(m.kind==="calendar"){
    // options falls back to [m.meta] for messages sent before the
    // multi-slot refactor, which stored a single flat window as meta.
    const options=m.meta.options||[m.meta];
    const chosen=options[m.scheduledOption||0];
    return (
      <div style={{alignSelf:"center",width:"100%",padding:"14px 15px",background:T.purple+"1A",border:`1px solid ${T.purple}40`,borderRadius:12}}>
        <div style={{display:"flex",alignItems:"center",gap:7,marginBottom:8,color:T.purple,fontSize:11,fontWeight:700}}>🤖 Studlin Match</div>
        {m.status==="scheduled"?(
          <>
            <div style={{fontSize:12.5,color:pp.text,lineHeight:1.55,marginBottom:8}}>Booked <strong>{chosen.duration}-minute</strong> session <strong>{chosen.dayLabel} at {chosen.timeLabel}</strong>.</div>
            <div style={{fontSize:11.5,color:T.lime,fontWeight:600}}>✓ Scheduled — added to your calendar</div>
          </>
        ):(
          <>
            <div style={{fontSize:12.5,color:pp.text,lineHeight:1.55,marginBottom:10}}>{options.length>1?`Found ${options.length} windows where everyone's free — pick one:`:<>Found an optimal <strong>{options[0].duration}-minute</strong> study window <strong>{options[0].dayLabel} at {options[0].timeLabel}</strong> where everyone is free!</>}</div>
            <div style={{display:"flex",flexDirection:"column",gap:8}}>
              {options.map((w,i)=>(
                <div key={i} style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:10,padding:"9px 11px",borderRadius:8,background:w.isBest?T.lime+"14":pp.card2,border:`1px solid ${w.isBest?T.lime+"55":pp.border}`}}>
                  <div style={{minWidth:0}}>
                    {w.isBest&&<div style={{fontSize:9,fontWeight:800,letterSpacing:"0.08em",color:T.lime,marginBottom:2}}>BEST CHOICE</div>}
                    <div style={{fontSize:12,fontWeight:600,color:pp.text}}>{w.dayLabel} · {w.timeLabel} · {w.duration}m</div>
                  </div>
                  <button onClick={()=>{
                    if(justChosen!==null)return;
                    setJustChosen(i);
                    setTimeout(()=>onSchedule(m.id,i),1500);
                  }} disabled={justChosen!==null} style={{flexShrink:0,padding:"7px 12px",borderRadius:7,background:justChosen===i?T.lime:(w.isBest?T.lime:pp.card2),color:justChosen===i?T.bg:(w.isBest?T.bg:pp.text),border:w.isBest||justChosen===i?"none":`1px solid ${pp.border}`,fontSize:11.5,fontWeight:700,cursor:justChosen!==null?"default":"pointer",fontFamily:T.font,opacity:justChosen!==null&&justChosen!==i?0.45:1,transition:"opacity 0.15s"}}>{justChosen===i?"✓ Scheduled":"Choose"}</button>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    );
  }
  if(m.kind==="note"||m.kind==="deck"){
    const isNote=m.kind==="note";
    const incoming=m.senderId!==myUid;
    const pending=m.status==="pending";
    return (
      <div style={{alignSelf:align,maxWidth:"86%",padding:"10px 12px",background:bg,border:`1px solid ${border}`,borderRadius:12}}>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <span style={{color:isNote?T.amber:T.teal,flexShrink:0}}>{isNote?Icon.file:Icon.layers}</span>
          <div style={{minWidth:0,flex:1}}>
            <div style={{fontSize:12,fontWeight:700,color:pp.text,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{isNote?m.meta.title:m.meta.name}</div>
            <div style={{fontSize:10.5,color:pp.muted}}>{isNote?"Note":m.meta.count+" cards"}{incoming?" · shared with you":" · you shared this"}</div>
          </div>
        </div>
        {pending&&(
          <div style={{display:"flex",gap:8,marginTop:10}}>
            <button onClick={()=>onRespond(m.id,"approved")} style={{flex:1,padding:"7px 0",borderRadius:7,background:T.lime,color:T.bg,border:"none",fontSize:11.5,fontWeight:700,cursor:"pointer",fontFamily:T.font}}>{incoming?"Approve & Accept":"Approve & Send"}</button>
            <button onClick={()=>onRespond(m.id,"declined")} style={{flex:1,padding:"7px 0",borderRadius:7,background:"transparent",color:pp.muted,border:`1px solid ${pp.border}`,fontSize:11.5,fontWeight:600,cursor:"pointer",fontFamily:T.font}}>Decline</button>
          </div>
        )}
        {m.status==="approved"&&<div style={{fontSize:10,color:T.lime,marginTop:8,fontWeight:600}}>{incoming?"✓ Added to your workspace":"✓ Sent"}</div>}
        {m.status==="declined"&&<div style={{fontSize:10,color:pp.faint,marginTop:8,fontWeight:600}}>Declined</div>}
      </div>
    );
  }
  return (
    <div style={{alignSelf:align,maxWidth:"78%",padding:"9px 13px",background:bg,border:`1px solid ${border}`,borderRadius:12,fontSize:13,color:pp.text,lineHeight:1.5}}>{m.text}</div>
  );
}

// ─── NETWORK: sliding chat drawer (DM + Group, w/ Quick Actions) ─────────────
function ChatDrawer({open,target,myUid,onClose,onMakePermanent,onDeleteGroup}){
  const isGroup=!!(target&&target.kind==="group");
  const roomId=target?(isGroup?target.group.id:(myUid&&target.user.uid?dmRoomId(myUid,target.user.uid):null)):null;
  const [messages,setMessages]=useState([]);
  const [input,setInput]=useState("");
  const [quickOpen,setQuickOpen]=useState(false);
  const [notePicker,setNotePicker]=useState(false);
  const [deckPicker,setDeckPicker]=useState(false);
  const [syncRunning,setSyncRunning]=useState(false);
  const [settingsOpen,setSettingsOpen]=useState(false);
  const [findWindowOpen,setFindWindowOpen]=useState(false);
  const [fwTimeMode,setFwTimeMode]=useState("anytime");
  const [fwTimeFrom,setFwTimeFrom]=useState("15:00");
  const [fwTimeTo,setFwTimeTo]=useState("17:00");
  const [fwDayScope,setFwDayScope]=useState("tomorrow");
  const [fwCustomDays,setFwCustomDays]=useState(5);
  const [fwDuration,setFwDuration]=useState(90);
  const [fwDurationCustom,setFwDurationCustom]=useState(false);
  const scrollRef=useRef(null);

  // Live message thread — a DM room is created lazily (idempotent merge) the
  // first time it's opened; a group room already exists from creation, so
  // this is a no-op merge for groups. Only after the room doc exists can the
  // messages subcollection's security rules (which look up its memberUids)
  // resolve for reads/writes.
  useEffect(()=>{
    setInput("");setQuickOpen(false);setNotePicker(false);setDeckPicker(false);setSyncRunning(false);setSettingsOpen(false);setFindWindowOpen(false);
    if(!roomId||!myUid){setMessages([]);return;}
    let cancelled=false;
    if(!isGroup){
      const now=new Date().toISOString();
      fsdb().collection('chatRooms').doc(roomId).set({
        type:"dm",memberUids:[myUid,target.user.uid].sort(),createdBy:myUid,
        createdAt:now,updatedAt:now,lastMessage:null,
      },{merge:true}).catch(()=>{});
    }
    // Marks the room read the moment it's opened — the sidebar badge and
    // inbox dots clear on their own via their own onSnapshot listeners,
    // nothing to manually decrement.
    fsdb().collection('chatRooms').doc(roomId).update({['lastReadAt.'+myUid]:Date.now()}).catch(()=>{});
    const unsub=fsdb().collection('chatRooms').doc(roomId).collection('messages').orderBy('ts','asc')
      .onSnapshot(snap=>{if(!cancelled)setMessages(snap.docs.map(d=>({id:d.id,...d.data()})));},()=>{});
    return ()=>{cancelled=true;unsub();};
  },[roomId]);

  useEffect(()=>{if(scrollRef.current)scrollRef.current.scrollTop=scrollRef.current.scrollHeight;},[messages]);

  useEffect(()=>{
    if(!open)return;
    const onKey=e=>{if(e.key==="Escape")onClose();};
    window.addEventListener("keydown",onKey);
    return ()=>window.removeEventListener("keydown",onKey);
  },[open]);

  // Every send does two writes: the message itself, then a bump of the
  // parent room's lastMessage/updatedAt so the inbox preview/sort (driven by
  // the single chatRooms listener in FriendsChat) updates live for everyone
  // in the room, not just the sender.
  const sendMessage=(fields)=>{
    if(!roomId||!myUid)return;
    const ts=Date.now();
    const roomRef=fsdb().collection('chatRooms').doc(roomId);
    roomRef.collection('messages').add({senderId:myUid,ts,...fields}).catch(()=>{});
    roomRef.update({lastMessage:{text:fields.text||null,kind:fields.kind,ts,senderId:myUid},updatedAt:new Date().toISOString()}).catch(()=>{});
    // Server-side push — checks the recipient's own preference before
    // sending, so this is a request to try, not a guarantee it fires.
    const preview=fields.text||(fields.kind==="calendar"?"Shared free time found":fields.kind==="note"?"Note shared":fields.kind==="deck"?"Deck shared":"New message");
    authFetch("/api/notify",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({type:"push",roomId,preview})}).catch(()=>{});
  };

  const sendText=()=>{if(!input.trim())return;sendMessage({kind:"text",text:input.trim()});setInput("");};
  const fmtTimeLabel=(t)=>{const p=t.split(":");let h=+p[0];const ap=h>=12?"PM":"AM";h=h%12||12;return h+":"+p[1]+" "+ap;};
  // There's no real shared-schedule backend behind these friends — this
  // client can't see the other person's calendar, only the sender's own
  // (localStorage `events`, never synced to Firestore). So the "match" still
  // can't confirm mutual availability, but it's no longer arbitrary either:
  // it genuinely scans for a slot in the chosen window/day-range that's free
  // on the sender's own calendar, same overlap check the real "Group Sync"
  // free-slot finder in CalendarTab uses (runGroupSync).
  // Returns {options: [...]}, ranked best-first and capped at 3 distinct
  // days. Scoring favors daytime slots (before 6pm, "saves evening free
  // time") that fill a gap between two existing events ("dead time") over
  // slots that just carve into an otherwise wide-open evening block.
  const findSharedStudyWindow=(params)=>{
    const prefStart=params.timeMode==="custom"?timeToMinutes(params.timeFrom):timeToMinutes("08:00");
    const prefEnd=params.timeMode==="custom"?timeToMinutes(params.timeTo):timeToMinutes("22:00");
    const scanDays=Math.max(1,params.lookAheadDayRange||1);
    const duration=params.durationInMinutes;
    const events=lsGet("events",[]);
    const today=new Date();
    const EVENING_START=18*60;
    const dayEvents=(dk)=>events.filter(e=>e.date===dk).map(e=>({s:timeToMinutes(e.time||"0:00"),e:timeToMinutes(e.time||"0:00")+(e.duration||60)})).sort((a,b)=>a.s-b.s);
    const isFree=(occupied,start,end)=>!occupied.some(o=>!(end<=o.s||start>=o.e));
    const labelFor=(offset,d)=>offset===1?"tomorrow":d.toLocaleDateString("en-US",{weekday:"long",month:"short",day:"numeric"});
    const candidates=[];
    for(let offset=1;offset<=scanDays;offset++){
      const d=new Date(today);d.setDate(today.getDate()+offset);
      const dk=dayKey(d);
      const occupied=dayEvents(dk);
      for(let start=prefStart;start+duration<=prefEnd;start+=30){
        const end=start+duration;
        if(!isFree(occupied,start,end))continue;
        const before=occupied.filter(o=>o.e<=start).sort((a,b)=>b.e-a.e)[0];
        const after=occupied.filter(o=>o.s>=end).sort((a,b)=>a.s-b.s)[0];
        const gapBefore=before?start-before.e:null;
        const gapAfter=after?after.s-end:null;
        const fillsDeadTimeGap=gapBefore!==null&&gapAfter!==null&&gapBefore<=120&&gapAfter<=120;
        let score=0;
        score+=start<EVENING_START?100:-40;
        score+=fillsDeadTimeGap?60:0;
        score-=Math.floor((start-prefStart)/30);
        score-=offset*2;
        const time=minutesToTime(start);
        candidates.push({date:dk,time,duration,dayLabel:labelFor(offset,d),timeLabel:fmtTimeLabel(time),score});
      }
    }
    if(candidates.length===0){
      // Nothing fully free anywhere in range — fall back to the start of the
      // preferred window on the last scanned day, so the feature never
      // dead-ends with no suggestion at all.
      const d=new Date(today);d.setDate(today.getDate()+scanDays);
      const time=minutesToTime(prefStart);
      return{options:[{date:dayKey(d),time,duration,dayLabel:labelFor(scanDays,d),timeLabel:fmtTimeLabel(time),isBest:true}]};
    }
    candidates.sort((a,b)=>b.score-a.score);
    // Cap at one suggestion per day so the options presented are genuinely
    // distinct choices, not the same day at three slightly different times.
    const seenDays=new Set();
    const top=[];
    for(const c of candidates){
      if(seenDays.has(c.date))continue;
      seenDays.add(c.date);
      top.push(c);
      if(top.length>=3)break;
    }
    top[0].isBest=true;
    return{options:top};
  };
  const submitFindWindow=()=>{
    setFindWindowOpen(false);setSyncRunning(true);
    const lookAheadDayRange=fwDayScope==="custom"?fwCustomDays:fwDayScope==="tomorrow"?1:fwDayScope==="3days"?3:7;
    const params={timeMode:fwTimeMode,timeFrom:fwTimeFrom,timeTo:fwTimeTo,lookAheadDayRange,durationInMinutes:fwDuration};
    setTimeout(()=>{setSyncRunning(false);sendMessage({kind:"calendar",status:"unscheduled",meta:findSharedStudyWindow(params)});},2100);
  };
  // Injects the chosen window into the current user's own calendar as a
  // study block. (Only this browser's calendar can actually be written to —
  // there's no backend to push the event into other members' accounts too.)
  // optionIndex picks which suggested slot the user chose; msg.meta.options
  // falls back to [msg.meta] for older messages sent before the multi-slot
  // refactor, which had a single flat window object as meta.
  const scheduleGroupSession=(id,optionIndex=0)=>{
    const msg=messages.find(x=>x.id===id);
    if(!msg||!roomId)return;
    const w=(msg.meta.options||[msg.meta])[optionIndex];
    if(!w)return;
    const events=lsGet("events",[]);
    const ev={id:"netsync-"+Date.now(),date:w.date,time:w.time,duration:w.duration,title:peerName+" study session",subject:peerName,kind:"study block"};
    lsSet("events",[...events,ev]);
    fsdb().collection('chatRooms').doc(roomId).collection('messages').doc(id).update({status:"scheduled",scheduledOption:optionIndex}).catch(()=>{});
  };
  // Sharing a note/deck posts a pending card first — a lightweight one-click
  // confirmation before it actually goes out (mirrors the same verification
  // loop used for incoming shares below).
  // Flags/comments live in separate note-flags/note-comments localStorage
  // maps keyed by note id (see Notes' doAddFlag/doAddComment) — body alone
  // doesn't carry them, so they're pulled in explicitly here and carried
  // through respondToShare below so a shared note keeps its tutor context.
  const attachNote=(note)=>{
    const flags=lsGet("note-flags",{})[note.id]||[];
    const comments=lsGet("note-comments",{})[note.id]||[];
    sendMessage({kind:"note",status:"pending",meta:{title:note.title,id:note.id,body:note.body,flags,comments}});
    setNotePicker(false);
  };
  const attachDeck=(deck)=>{sendMessage({kind:"deck",status:"pending",meta:{name:deck.name,count:deck.cards?deck.cards.length:(deck.count||0),id:deck.id,cards:deck.cards}});setDeckPicker(false);};

  const peerName=target?(isGroup?target.group.name:target.user.n):"";
  const peerFirst=peerName.split(" ")[0];

  // Approve/decline for both directions. Incoming approvals do the real work:
  // copy the shared resource into the recipient's own Notes/Flashcards workspace.
  const respondToShare=(id,decision)=>{
    const msg=messages.find(x=>x.id===id);
    if(!msg||!roomId)return;
    if(decision==="approved"&&msg.senderId!==myUid){
      if(msg.kind==="note"){
        const notes=lsGet("notes",[]);
        const copy={id:String(Date.now()),title:msg.meta.title,body:sanitizeHtml(msg.meta.body||"<p>Shared from "+peerName+".</p>"),tag:"Shared",date:new Date().toLocaleDateString("en-US",{month:"short",day:"numeric"}),createdAt:Date.now(),source:"shared",sharedFrom:peerName};
        lsSet("notes",[copy,...notes]);
        // Carry the sender's flags/comments over onto the recipient's own
        // copy (re-keyed to its new id) so tutor context survives the share.
        if(msg.meta.flags&&msg.meta.flags.length){
          const nf=lsGet("note-flags",{});
          lsSet("note-flags",{...nf,[copy.id]:msg.meta.flags});
        }
        if(msg.meta.comments&&msg.meta.comments.length){
          const nc=lsGet("note-comments",{});
          lsSet("note-comments",{...nc,[copy.id]:msg.meta.comments});
        }
      }else if(msg.kind==="deck"){
        const decks=lsGet("decks",[]);
        const copy={id:String(Date.now()),name:msg.meta.name,count:(msg.meta.cards||[]).length,done:0,color:T.teal,cards:msg.meta.cards||[],source:"imported",importedFrom:peerName};
        lsSet("decks",[copy,...decks]);
      }
    }
    fsdb().collection('chatRooms').doc(roomId).collection('messages').doc(id).update({status:decision}).catch(()=>{});
  };

  // Ask the other person to share a note/deck. There's no way to make them
  // actually respond, so this just sends the request text — no fabricated
  // reply. (Faking a message "from" them would be spoofing, and the security
  // rules block a client from writing a message with someone else's senderId
  // anyway.)
  const requestNote=()=>{setQuickOpen(false);sendMessage({kind:"text",text:"Requested notes from "+peerFirst+"."});};
  const requestDeck=()=>{setQuickOpen(false);sendMessage({kind:"text",text:"Requested a flashcard deck from "+peerFirst+"."});};

  const notesList=lsGet("notes",[]);
  const decksList=lsGet("decks",[]);
  const expiry=isGroup?fmtGroupCountdown(target.group.expiresAt):null;
  const title=peerName;
  const subtitle=target?(isGroup?target.group.memberUids.length+" members":target.user.h+" · "+target.user.s):"";
  const pp=panelPalette(); // drawer is a permanently-dark panel (like the sidebar) — needs its own light-on-dark text colors
  const qaBtn={display:"flex",alignItems:"center",gap:10,width:"100%",padding:"10px 11px",borderRadius:9,border:"none",background:"transparent",cursor:"pointer",fontFamily:T.font,fontSize:12.5,fontWeight:600,color:pp.text,textAlign:"left"};

  return ReactDOM.createPortal(
    <>
      <div onClick={onClose} style={{position:"fixed",inset:0,background:"rgba(8,12,10,0.5)",zIndex:400,opacity:open?1:0,pointerEvents:open?"auto":"none",transition:"opacity 0.25s"}} />
      <div style={{position:"fixed",top:0,right:0,height:"100vh",width:400,maxWidth:"92vw",background:T.surface,borderLeft:`1px solid ${pp.border}`,boxShadow:"-24px 0 60px -20px rgba(0,0,0,0.5)",zIndex:401,display:"flex",flexDirection:"column",transform:open?"translateX(0)":"translateX(100%)",transition:"transform 0.28s cubic-bezier(.2,.85,.3,1)"}}>
        {target&&(<>
          <div style={{padding:"18px 18px 14px",borderBottom:`1px solid ${pp.border}`,display:"flex",alignItems:"center",gap:12}}>
            {isGroup
              ?<div style={{width:40,height:40,borderRadius:12,background:T.purple+"18",border:`1px solid ${T.purple}33`,display:"flex",alignItems:"center",justifyContent:"center",color:T.purple,flexShrink:0}}>{Icon.users}</div>
              :<div style={{position:"relative",flexShrink:0}}><Av initials={target.user.n.split(" ").map(x=>x[0]).join("")} color={T.lime} size={40} picUrl="" /><div style={{position:"absolute",bottom:0,right:0,width:10,height:10,borderRadius:"50%",background:target.user.online?T.teal:pp.faint,border:`2px solid ${T.surface}`}} /></div>
            }
            <div style={{flex:1,minWidth:0}}>
              <div style={{fontSize:14,fontWeight:700,color:pp.text,letterSpacing:"-0.01em"}}>{title}</div>
              <div style={{fontSize:11,color:pp.muted}}>{subtitle}</div>
            </div>
            <button onClick={onClose} style={{width:30,height:30,borderRadius:8,border:`1px solid ${pp.border}`,background:pp.card2,color:pp.muted,display:"grid",placeItems:"center",cursor:"pointer",flexShrink:0}}>{Icon.xmark}</button>
          </div>

          {isGroup&&(
            <div onClick={()=>setSettingsOpen(true)} style={{display:"flex",alignItems:"center",gap:8,padding:"9px 18px",borderBottom:`1px solid ${pp.border}`,cursor:"pointer",background:pp.card2}}>
              <span style={{color:expiry?(expiry.urgent?T.amber:T.purple):pp.muted,display:"flex"}}>{Icon.clock}</span>
              <span style={{fontSize:11.5,color:pp.muted,flex:1}}>
                {expiry?(expiry.expired?"Archiving now…":<>Archives in <strong style={{color:expiry.urgent?T.amber:pp.text}}>{expiry.label}</strong></>):"Permanent group"}
              </span>
              <span style={{fontSize:10.5,color:pp.faint}}>Group settings ›</span>
            </div>
          )}

          <div ref={scrollRef} style={{flex:1,overflowY:"auto",padding:"16px 18px",display:"flex",flexDirection:"column",gap:10}}>
            {messages.length===0&&<div style={{textAlign:"center",color:pp.faint,fontSize:12,marginTop:40}}>No messages yet. Say hi.</div>}
            {messages.map(m=><ChatBubble key={m.id} m={m} myUid={myUid} onRespond={respondToShare} onSchedule={scheduleGroupSession} />)}
          </div>

          {notePicker&&(
            <div style={{borderTop:`1px solid ${pp.border}`,padding:"12px 18px",maxHeight:180,overflowY:"auto"}}>
              <div style={{fontSize:10,fontWeight:700,letterSpacing:"0.08em",textTransform:"uppercase",color:pp.faint,marginBottom:8}}>Send a note</div>
              {notesList.length===0
                ?<div style={{fontSize:12,color:pp.muted}}>No notes yet.</div>
                :notesList.slice(0,8).map(n=>(
                  <div key={n.id} onClick={()=>attachNote(n)} style={{display:"flex",alignItems:"center",gap:9,padding:"8px 9px",borderRadius:8,cursor:"pointer"}}>
                    <span style={{color:T.amber,flexShrink:0}}>{Icon.file}</span>
                    <div style={{fontSize:12,color:pp.text,fontWeight:600,flex:1,minWidth:0,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{n.title}</div>
                  </div>
                ))
              }
            </div>
          )}
          {deckPicker&&(
            <div style={{borderTop:`1px solid ${pp.border}`,padding:"12px 18px",maxHeight:180,overflowY:"auto"}}>
              <div style={{fontSize:10,fontWeight:700,letterSpacing:"0.08em",textTransform:"uppercase",color:pp.faint,marginBottom:8}}>Send a deck</div>
              {decksList.length===0
                ?<div style={{fontSize:12,color:pp.muted}}>No decks yet.</div>
                :decksList.slice(0,8).map(d=>(
                  <div key={d.id} onClick={()=>attachDeck(d)} style={{display:"flex",alignItems:"center",gap:9,padding:"8px 9px",borderRadius:8,cursor:"pointer"}}>
                    <span style={{color:T.teal,flexShrink:0}}>{Icon.layers}</span>
                    <div style={{fontSize:12,color:pp.text,fontWeight:600,flex:1}}>{d.name}</div>
                    <div style={{fontSize:10.5,color:pp.muted}}>{d.cards?d.cards.length:(d.count||0)} cards</div>
                  </div>
                ))
              }
            </div>
          )}
          {syncRunning&&(
            <div style={{borderTop:`1px solid ${pp.border}`,padding:"14px 18px"}}>
              <div style={{fontSize:11,color:pp.muted,marginBottom:8,textAlign:"center"}}>Scanning calendars for overlap…</div>
              <div style={{height:4,background:pp.card2,borderRadius:2,overflow:"hidden"}}><div style={{height:"100%",background:`linear-gradient(90deg,${T.purple},${T.lime})`,borderRadius:2,animation:"gwBarDrawer 2s ease-out forwards",transform:"scaleX(0)",transformOrigin:"left"}}/></div>
              <style>{`@keyframes gwBarDrawer{to{transform:scaleX(1)}}`}</style>
            </div>
          )}
          {quickOpen&&(
            <div style={{borderTop:`1px solid ${pp.border}`,padding:"8px",display:"flex",flexDirection:"column",gap:2}}>
              <button onClick={()=>{setQuickOpen(false);setFindWindowOpen(true);}} style={qaBtn}><span style={{color:T.purple,display:"flex"}}>{Icon.cal}</span><span style={{flex:1}}>Find Shared Study Window</span><span style={{fontSize:10.5,color:pp.faint,fontWeight:400}}>Find free time</span></button>
              <button onClick={()=>{setNotePicker(true);setDeckPicker(false);setQuickOpen(false);}} style={qaBtn}><span style={{color:T.amber,display:"flex"}}>{Icon.file}</span><span style={{flex:1}}>Send Notes</span><span style={{fontSize:10.5,color:pp.faint,fontWeight:400}}>Drop a note link</span></button>
              <button onClick={()=>{setDeckPicker(true);setNotePicker(false);setQuickOpen(false);}} style={qaBtn}><span style={{color:T.teal,display:"flex"}}>{Icon.layers}</span><span style={{flex:1}}>Send Flashcard Deck</span><span style={{fontSize:10.5,color:pp.faint,fontWeight:400}}>Share a deck</span></button>
              <button onClick={requestNote} style={qaBtn}><span style={{color:T.amber,display:"flex"}}>{Icon.file}</span><span style={{flex:1}}>Request a Note</span><span style={{fontSize:10.5,color:pp.faint,fontWeight:400}}>Ask {peerFirst||"them"}</span></button>
              <button onClick={requestDeck} style={qaBtn}><span style={{color:T.teal,display:"flex"}}>{Icon.layers}</span><span style={{flex:1}}>Request a Deck</span><span style={{fontSize:10.5,color:pp.faint,fontWeight:400}}>Ask {peerFirst||"them"}</span></button>
            </div>
          )}

          <div style={{display:"flex",alignItems:"center",gap:8,padding:"12px 16px",borderTop:`1px solid ${pp.border}`}}>
            <button onClick={()=>{setQuickOpen(q=>!q);setNotePicker(false);setDeckPicker(false);}} style={{width:34,height:34,borderRadius:9,border:`1px solid ${quickOpen?T.lime+"55":pp.border}`,background:quickOpen?T.lime+"20":pp.card2,color:quickOpen?T.lime:pp.muted,display:"grid",placeItems:"center",cursor:"pointer",flexShrink:0}}>{Icon.plus}</button>
            <input value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>{if(e.key==="Enter")sendText();}} placeholder="Message…" style={{flex:1,background:pp.card2,border:`1px solid ${pp.border}`,borderRadius:9,padding:"9px 12px",color:pp.text,fontSize:13,fontFamily:T.font,outline:"none"}} />
            <button onClick={sendText} style={{width:34,height:34,borderRadius:9,border:"none",background:input.trim()?T.lime:pp.card2,color:input.trim()?T.bg:pp.faint,display:"grid",placeItems:"center",cursor:input.trim()?"pointer":"default",flexShrink:0}}>{Icon.send}</button>
          </div>
        </>)}
      </div>

      {isGroup&&(
        <Modal open={settingsOpen} onClose={()=>setSettingsOpen(false)} title={target.group.name} sub="Group settings" width={420}>
          <Label>Members</Label>
          <div style={{display:"flex",flexDirection:"column",gap:8,marginBottom:18}}>
            <div style={{display:"flex",alignItems:"center",gap:9}}>
              <Av initials="ME" color={T.lime} size={28} picUrl="" />
              <div style={{fontSize:12.5,color:T.text,fontWeight:600}}>You</div>
              <div style={{width:7,height:7,borderRadius:"50%",background:isOnlineStatusOn()&&!isIncognitoOn()?T.teal:T.faint,marginLeft:"auto"}} />
            </div>
            {target.group.memberUids.filter(uid=>uid!==myUid).map(uid=>{
              const name=(target.group.memberNames&&target.group.memberNames[uid])||"Studlin User";
              return (
                <div key={uid} style={{display:"flex",alignItems:"center",gap:9}}>
                  <Av initials={name.split(" ").map(x=>x[0]).join("")} color={T.lime} size={28} picUrl="" />
                  <div style={{fontSize:12.5,color:T.text,fontWeight:600}}>{name}</div>
                </div>
              );
            })}
          </div>
          <div style={{paddingTop:16,borderTop:`1px solid ${T.border}`}}>
            <Label>Expiration</Label>
            {target.group.groupType==="temporary"
              ?(<>
                  <div style={{fontSize:12.5,color:T.text,marginBottom:10,lineHeight:1.5}}>
                    {expiry&&expiry.expired?"This group has expired and will archive shortly.":<>Auto-archives on <strong>{new Date(target.group.expiresAt).toLocaleDateString("en-US",{month:"short",day:"numeric",year:"numeric"})}</strong> — {expiry&&expiry.label} left.</>}
                  </div>
                  <Btn variant="subtle" onClick={()=>onMakePermanent(target.group.id)} style={{width:"100%",justifyContent:"center",marginBottom:8}}>{Icon.users} Make permanent</Btn>
                </>)
              :<div style={{fontSize:12.5,color:T.muted,marginBottom:10}}>This is a standard ongoing group — it will never auto-archive.</div>
            }
            {target.group.createdBy===myUid&&<Btn variant="danger" onClick={()=>{setSettingsOpen(false);onDeleteGroup(target.group.id);}} style={{width:"100%",justifyContent:"center"}}>{Icon.xmark} Delete group</Btn>}
          </div>
        </Modal>
      )}

      <Modal open={findWindowOpen} onClose={()=>setFindWindowOpen(false)} title="Find Shared Study Window" sub="Studlin Match scans for mutual free time within these constraints." width={420}
        footer={<><Btn variant="subtle" onClick={()=>setFindWindowOpen(false)}>Cancel</Btn><Btn onClick={submitFindWindow}>{Icon.cal} Find Window</Btn></>}>
        <Field label="Preferred Time">
          <div style={{display:"flex",gap:6,marginBottom:fwTimeMode==="custom"?10:0}}>
            {[{v:"anytime",label:"Anytime"},{v:"custom",label:"Custom range"}].map(o=>(
              <button key={o.v} onClick={()=>setFwTimeMode(o.v)} style={{padding:"7px 13px",borderRadius:7,fontSize:12,cursor:"pointer",border:`1px solid ${fwTimeMode===o.v?T.purple+"66":T.border}`,background:fwTimeMode===o.v?T.purple+"14":"transparent",color:fwTimeMode===o.v?T.purple:T.muted,fontFamily:T.font,fontWeight:fwTimeMode===o.v?600:400}}>{o.label}</button>
            ))}
          </div>
          {fwTimeMode==="custom"&&(
            <div style={{display:"flex",gap:10}}>
              <TimeInput value={fwTimeFrom} onChange={setFwTimeFrom} />
              <TimeInput value={fwTimeTo} onChange={setFwTimeTo} />
            </div>
          )}
        </Field>
        <Field label="Look Ahead">
          {fwDayScope==="custom"?(
            <div style={{display:"flex",alignItems:"center",gap:8}}>
              <NumField min={1} max={30} fallback={1} value={fwCustomDays} onChange={setFwCustomDays} style={{width:70}} />
              <span style={{fontSize:12.5,color:T.muted}}>Days</span>
              <button onClick={()=>setFwDayScope("tomorrow")} style={{marginLeft:"auto",background:"none",border:"none",color:T.purple,fontSize:11.5,cursor:"pointer",fontFamily:T.font}}>‹ presets</button>
            </div>
          ):(
            <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
              {[{v:"tomorrow",label:"Tomorrow"},{v:"3days",label:"Next 3 Days"},{v:"week",label:"Full Week"},{v:"custom",label:"Custom..."}].map(o=>(
                <button key={o.v} onClick={()=>setFwDayScope(o.v)} style={{padding:"7px 13px",borderRadius:7,fontSize:12,cursor:"pointer",border:`1px solid ${fwDayScope===o.v?T.purple+"66":T.border}`,background:fwDayScope===o.v?T.purple+"14":"transparent",color:fwDayScope===o.v?T.purple:T.muted,fontFamily:T.font,fontWeight:fwDayScope===o.v?600:400}}>{o.label}</button>
              ))}
            </div>
          )}
        </Field>
        <Field label="Duration">
          {fwDurationCustom?(
            <div style={{display:"flex",alignItems:"center",gap:8}}>
              <NumField min={15} step={15} fallback={15} value={fwDuration} onChange={setFwDuration} style={{width:70}} />
              <span style={{fontSize:12.5,color:T.muted}}>Minutes</span>
              <button onClick={()=>{setFwDurationCustom(false);setFwDuration(90);}} style={{marginLeft:"auto",background:"none",border:"none",color:T.purple,fontSize:11.5,cursor:"pointer",fontFamily:T.font}}>‹ presets</button>
            </div>
          ):(
            <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
              {[{v:60,label:"60 min"},{v:90,label:"90 min"},{v:120,label:"2 hours"}].map(o=>(
                <button key={o.v} onClick={()=>setFwDuration(o.v)} style={{padding:"7px 13px",borderRadius:7,fontSize:12,cursor:"pointer",border:`1px solid ${fwDuration===o.v?T.purple+"66":T.border}`,background:fwDuration===o.v?T.purple+"14":"transparent",color:fwDuration===o.v?T.purple:T.muted,fontFamily:T.font,fontWeight:fwDuration===o.v?600:400}}>{o.label}</button>
              ))}
              <button onClick={()=>setFwDurationCustom(true)} style={{padding:"7px 13px",borderRadius:7,fontSize:12,cursor:"pointer",border:`1px solid ${T.border}`,background:"transparent",color:T.muted,fontFamily:T.font}}>Custom...</button>
            </div>
          )}
        </Field>
      </Modal>
    </>,
    document.body
  );
}

// ─── CALENDAR ─────────────────────────────────────────────────────────────────
// ─── TASK TIMER MODAL ────────────────────────────────────────────────────────
function TaskTimerModal({task,onClose,onComplete,onAssignmentComplete,onAssignmentExtend}){
  // Snapshot of live leaderboard profiles, fetched once on mount — used for
  // the before/after rank comparison in the completion screen. A snapshot
  // is fine here (rather than re-fetching mid-session): competitors' XP
  // won't meaningfully change in the couple minutes a focus session runs.
  const [lbProfiles,setLbProfiles]=useState([]);
  useEffect(()=>{
    let cancelled=false;
    fetchTopProfiles(8).then(rows=>{if(!cancelled)setLbProfiles(rows);});
    return ()=>{cancelled=true;};
  },[]);
  const totalMins=task.duration||25;
  const quoteRef=useRef(QUOTES[Math.floor(Math.random()*QUOTES.length)]);
  const breakIdeaRef=useRef(BREAK_IDEAS[Math.floor(Math.random()*BREAK_IDEAS.length)]);
  const focusElapsed=useRef(0);
  // No-Lie guard: a second, independent elapsed-time tracker using
  // performance.now() (a monotonic clock immune to system-clock changes),
  // mirroring focusElapsed/focusStartRef exactly but on a clock a student
  // can't fake by rolling Date.now() forward/back while backgrounded.
  const focusElapsedMono=useRef(0);
  const focusStartMonoRef=useRef(null);
  const barRef=useRef(null);
  const endTimeRef=useRef(null);
  const focusStartRef=useRef(null);
  // Holds the real focus minutes once focus2 hits zero for an
  // assignment-linked block, while the student answers the binary
  // finished/not-finished check — completeSession only actually runs once
  // they answer, so the value has to survive that detour.
  const pendingMinsRef=useRef(0);

  const initBreakMins=computeBreathingRoom(totalMins);
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
  const [completion,setCompletion]=useState(null);
  const [barFilled,setBarFilled]=useState(false);
  const [rankRisen,setRankRisen]=useState(false);
  // Collapsible floating widget — tucks itself away during a focus block so
  // it doesn't block the dashboard/calendar, and auto-expands the moment a
  // break starts so the student notices they can step away.
  const [collapsed,setCollapsed]=useState(false);
  useEffect(()=>{ if(phase==="break"||phase==="breakDone")setCollapsed(false); },[phase]);
  // Draggable floating widget — reuses the same pointer-capture pattern as
  // the break-position bar below, just applied to the whole container
  // instead of one scrubber. dragPos===null means "use the default
  // bottom-right CSS anchor"; once dragged, left/top pixel coordinates take
  // over (clamped so the widget can never be dragged off-screen).
  const [dragPos,setDragPos]=useState(null);
  const dragStateRef=useRef({active:false,startX:0,startY:0,origX:0,origY:0});
  const widgetPointerDown=(e)=>{
    if(e.target.closest("button"))return; // let buttons inside the widget work normally
    const rect=e.currentTarget.getBoundingClientRect();
    dragStateRef.current={active:true,startX:e.clientX,startY:e.clientY,origX:rect.left,origY:rect.top};
    e.currentTarget.setPointerCapture(e.pointerId);
  };
  const widgetPointerMove=(e)=>{
    if(!dragStateRef.current.active)return;
    const rect=e.currentTarget.getBoundingClientRect();
    const dx=e.clientX-dragStateRef.current.startX;
    const dy=e.clientY-dragStateRef.current.startY;
    const nx=Math.max(4,Math.min(window.innerWidth-rect.width-4,dragStateRef.current.origX+dx));
    const ny=Math.max(4,Math.min(window.innerHeight-rect.height-4,dragStateRef.current.origY+dy));
    setDragPos({x:nx,y:ny});
  };
  const widgetPointerUp=()=>{dragStateRef.current.active=false;};
  // Third widget state, alongside collapsed/expanded — a full-viewport focus
  // overlay, entered via a distinct square button (never the round
  // collapse/expand toggle, which stays a two-state control).
  const [fullscreen,setFullscreen]=useState(false);
  // Fades the overlay out (rather than an instant unmount) before dropping
  // back to the widget, which lands directly in its collapsed circular
  // state per the minimize affordance — never the full expanded card.
  const [focusExiting,setFocusExiting]=useState(false);
  const minimizeFocus=()=>{
    setFocusExiting(true);
    setTimeout(()=>{setFullscreen(false);setCollapsed(true);setFocusExiting(false);},220);
  };

  // ── Assignment binary-completion + extension-slider sub-state (only used
  // when phase==="assignmentCheck", i.e. task.assignmentId is set) ─────────
  const [asgStep,setAsgStep]=useState("choice"); // choice | confirmWipe | slider
  const [asgPct,setAsgPct]=useState(50);
  const [asgOverride,setAsgOverride]=useState(""); // "" = use the computed recommendation
  const asgRecMins=(()=>{
    const raw=pendingMinsRef.current*(100-asgPct)/asgPct;
    return Math.max(5,Math.min(480,Math.round(raw/5)*5));
  })();
  const asgFinalMins=asgOverride!==""?Math.max(5,Math.min(480,parseInt(asgOverride,10)||asgRecMins)):asgRecMins;
  const asgRemainingCount=phase==="assignmentCheck"
    ?lsGet("events",[]).filter(e=>e.assignmentId===task.assignmentId&&e.id!==task.id&&e.status!=="done").length
    :0;

  // A soft three-note ascending chime (C5-E5-G5) rather than a single sharp
  // sweep — noticeable enough that a session-end never gets missed, but
  // pleasant enough that finishing a focus block doesn't feel like an alarm
  // going off.
  const playBeep=()=>{try{
    const ctx=new(window.AudioContext||window.webkitAudioContext)();
    [523.25,659.25,783.99].forEach((freq,i)=>{
      const t=ctx.currentTime+i*0.15;
      const osc=ctx.createOscillator();
      const gain=ctx.createGain();
      osc.type="sine";
      osc.connect(gain);gain.connect(ctx.destination);
      osc.frequency.setValueAtTime(freq,t);
      gain.gain.setValueAtTime(0,t);
      gain.gain.linearRampToValueAtTime(0.22,t+0.02);
      gain.gain.exponentialRampToValueAtTime(0.001,t+0.5);
      osc.start(t);osc.stop(t+0.5);
    });
  }catch(e){}};

  const focus2Mins=Math.max(1,totalMins-breakPos-breakMins);
  const fmt=s=>String(Math.floor(s/60)).padStart(2,"0")+":"+String(s%60).padStart(2,"0");

  // Logs the session, awards XP, then reveals the reward summary — the modal
  // stays open (as the "done" screen) until the student dismisses it.
  const completeSession=(mins)=>{
    // No-Lie guard: a session can never claim more focus minutes than its
    // own block's stated duration, regardless of what the caller computed.
    const safeMins=Math.min(mins,totalMins);
    const name=getUserName();
    const streak=getStreak();
    const myUid=firebase.auth().currentUser?.uid||null;
    const minutesBefore=getTotalMinutesFocused();
    const rowsBefore=mergeLeaderboard(lbProfiles,name,minutesBefore,streak,myUid,5);
    const rankBefore=(rowsBefore.find(u=>u.you)||{}).r||rowsBefore.length;
    // onComplete (App's handler) is what actually logs the session
    // (logSession -> sessions array), so minutesAfter only reflects the gain
    // once this has run — levels are strictly real logged minutes now, no
    // co-op or other synthetic bonus inflates the number.
    if(onComplete)onComplete(safeMins);
    const minutesAfter=getTotalMinutesFocused();
    const rowsAfter=mergeLeaderboard(lbProfiles,name,minutesAfter,streak,myUid,5);
    const rankAfter=(rowsAfter.find(u=>u.you)||{}).r||rowsAfter.length;
    setCompletion({
      mins:safeMins,
      gain:Math.max(0,minutesAfter-minutesBefore),
      minutesAfter,
      tierBefore:getProfTitle(minutesBefore),
      tierAfter:getProfTitle(minutesAfter),
      rankBefore,rankAfter,rows:rowsAfter,
    });
    setPhase("done");
    setRunning(false);
  };

  // No-Lie guard: elapsed time is the smaller of two independent clocks —
  // Date.now() (what the rest of the app uses) and performance.now() (a
  // monotonic clock a system-clock change can't move). Whichever direction
  // the wall clock was tampered, the untampered one caps the result.
  const verifiedMins=()=>Math.max(1,Math.min(totalMins,Math.round(Math.min(focusElapsed.current,focusElapsedMono.current)/60)));

  useEffect(()=>{
    if(!running)return;
    endTimeRef.current=Date.now()+secs*1000;
    if(phase!=="break"){focusStartRef.current=Date.now();focusStartMonoRef.current=performance.now();}
    const id=setInterval(()=>{
      const remaining=Math.max(0,Math.round((endTimeRef.current-Date.now())/1000));
      setSecs(remaining);
      if(remaining<=0){
        if(phase==="focus1"){setPhase("break");setRunning(false);if(soundOn)playBeep();}
        else if(phase==="break"){setPhase("breakDone");setRunning(false);if(soundOn)playBeep();}
        else if(phase==="focus2"){
          // Bank the current segment's real elapsed time NOW — the effect's
          // own cleanup below only runs after the setPhase() calls further
          // down trigger a re-render, which is too late for verifiedMins()
          // to see it (it would otherwise read a value one segment behind).
          if(focusStartRef.current){focusElapsed.current+=(Date.now()-focusStartRef.current)/1000;focusStartRef.current=null;}
          if(focusStartMonoRef.current){focusElapsedMono.current+=(performance.now()-focusStartMonoRef.current)/1000;focusStartMonoRef.current=null;}
          const mins=verifiedMins();
          // Assignment-linked blocks pause here for the binary finished/not
          // check instead of going straight to the reward screen. Every
          // existing caller (real events without assignmentId, FriendsChat's
          // synthetic co-op task) never sets this field, so they take the
          // untouched completeSession(mins) path exactly as before.
          if(task.assignmentId){
            pendingMinsRef.current=mins;
            setRunning(false);
            setPhase("assignmentCheck");
          }else{
            completeSession(mins);
          }
        }
      }
    },250);
    return()=>{
      clearInterval(id);
      if(phase!=="break"&&focusStartRef.current){
        focusElapsed.current+=(Date.now()-focusStartRef.current)/1000;
        focusElapsedMono.current+=(performance.now()-focusStartMonoRef.current)/1000;
        focusStartRef.current=null;
        focusStartMonoRef.current=null;
      }
    };
  },[running,phase,totalMins]);

  // Break no longer auto-starts the instant focus time ends — the chime
  // plays, the widget shows "Start Break" as a deliberate action the
  // student takes, instead of silently flipping into a running countdown
  // they didn't consciously begin.
  useEffect(()=>{
    if(phase==="break"){setSecs(breakMins*60);setRunning(false);}
  },[phase,breakMins]);

  // ── Warn before closing the tab mid-session ───────────────────────────────
  useEffect(()=>{
    const sessionLive=phase==="focus1"||phase==="break"||phase==="breakDone"||phase==="focus2";
    if(!sessionLive)return;
    const onBeforeUnload=(e)=>{e.preventDefault();e.returnValue="";return"";};
    window.addEventListener("beforeunload",onBeforeUnload);
    return()=>window.removeEventListener("beforeunload",onBeforeUnload);
  },[phase]);

  // ── Reward reveal sequence: XP bar fills first, then (if the student
  // passed classmates) their leaderboard position climbs into view ─────────
  useEffect(()=>{
    if(phase!=="done"||!completion)return;
    setBarFilled(false);setRankRisen(false);
    const t1=setTimeout(()=>setBarFilled(true),80);
    const t2=setTimeout(()=>setRankRisen(true),950);
    return()=>{clearTimeout(t1);clearTimeout(t2);};
  },[phase,completion]);

  const startLockIn=()=>{
    focusElapsed.current=0;
    if(breakOn&&totalMins>=15&&focus2Mins>0){
      setPhase("focus1");setSecs(breakPos*60);setRunning(true);
    }else{
      setPhase("focus2");setSecs(totalMins*60);setRunning(true);
    }
  };

  const resume=()=>{setPhase("focus2");setSecs(focus2Mins*60);setRunning(true);setCollapsed(true);};

  const finishEarly=()=>{
    if(phase!=="break"&&focusStartRef.current){
      focusElapsed.current+=(Date.now()-focusStartRef.current)/1000;
      focusElapsedMono.current+=(performance.now()-focusStartMonoRef.current)/1000;
      focusStartRef.current=null;
      focusStartMonoRef.current=null;
    }
    completeSession(verifiedMins());
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
              <div>
                <div style={{fontSize:11,fontWeight:600,color:T.muted,letterSpacing:"0.06em",textTransform:"uppercase"}}>Add Break Time</div>
                <div style={{fontSize:10,color:T.faint,marginTop:2}}>Toggle on to include a timed break.</div>
              </div>
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
                <span>Break at <strong style={{color:T.amber}}>{breakPos}m</strong> · {breakMins}m · <strong style={{color:T.lime}}>{focus2Mins}m</strong> after</span>
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

  // ── ASSIGNMENT BINARY COMPLETION + EXTENSION SLIDER ───────────────────────
  // Mandatory — no backdrop-dismiss — the student must answer before the
  // reward flow (completeSession, unchanged below) continues.
  if(phase==="assignmentCheck"){
    const onConfirmWipe=()=>{
      if(onAssignmentComplete)onAssignmentComplete();
      completeSession(pendingMinsRef.current);
    };
    const onScheduleExtension=()=>{
      if(onAssignmentExtend)onAssignmentExtend(pendingMinsRef.current,asgPct,asgFinalMins);
      completeSession(pendingMinsRef.current);
    };
    return(
      <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.7)",backdropFilter:"blur(10px)",zIndex:1000,display:"flex",alignItems:"center",justifyContent:"center",padding:24}}>
        <div style={{width:"100%",maxWidth:480,background:T.card,borderRadius:20,border:`1px solid ${T.border}`,padding:"36px 32px",textAlign:"center"}}>
          {asgStep==="choice"&&(<>
            <div style={{fontSize:17,fontWeight:700,color:T.white,marginBottom:8}}>Time's up on "{task.title}"</div>
            <div style={{fontSize:13,color:T.text,marginBottom:28,lineHeight:1.6}}>Did you finish the assignment?</div>
            <div style={{display:"flex",flexDirection:"column",gap:10}}>
              <Btn onClick={()=>setAsgStep("confirmWipe")} style={{width:"100%",justifyContent:"center"}}>Yes, I am finished</Btn>
              <Btn variant="subtle" onClick={()=>setAsgStep("slider")} style={{width:"100%",justifyContent:"center"}}>No, I need more time</Btn>
            </div>
          </>)}

          {asgStep==="confirmWipe"&&(<>
            <div style={{fontSize:17,fontWeight:700,color:T.white,marginBottom:8}}>Mark as complete?</div>
            <div style={{fontSize:13,color:T.text,marginBottom:28,lineHeight:1.6}}>
              {asgRemainingCount>0
                ?`This removes your ${asgRemainingCount} remaining scheduled session${asgRemainingCount===1?"":"s"} for this assignment.`
                :"This marks the assignment as complete."}
            </div>
            <div style={{display:"flex",gap:10}}>
              <Btn variant="subtle" onClick={()=>setAsgStep("choice")} style={{flex:1,justifyContent:"center"}}>Cancel</Btn>
              <Btn onClick={onConfirmWipe} style={{flex:1,justifyContent:"center"}}>Confirm</Btn>
            </div>
          </>)}

          {asgStep==="slider"&&(<>
            <div style={{fontSize:17,fontWeight:700,color:T.white,marginBottom:8}}>How far did you get?</div>
            <div style={{fontSize:13,color:T.text,marginBottom:24,lineHeight:1.6}}>Drag to estimate how much of the assignment is done.</div>
            <input type="range" min={5} max={95} step={1} value={asgPct}
              onChange={e=>{setAsgPct(parseInt(e.target.value,10));setAsgOverride("");}}
              style={{width:"100%",marginBottom:8}} />
            <div style={{fontSize:13,fontWeight:600,color:T.lime,marginBottom:20}}>{asgPct}% complete</div>
            <div style={{fontSize:13,color:T.text,marginBottom:10}}>AI Recommended Extension: <strong>+{asgRecMins}m</strong></div>
            <div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:8,marginBottom:24}}>
              <span style={{fontSize:12,color:T.muted}}>Adjust:</span>
              <input type="number" min={5} max={480} value={asgOverride!==""?asgOverride:asgRecMins}
                onChange={e=>setAsgOverride(e.target.value)}
                style={{width:70,padding:"6px 8px",borderRadius:6,border:`1px solid ${T.border}`,background:T.card2,color:T.text,fontSize:13,fontFamily:T.font,textAlign:"center"}} />
              <span style={{fontSize:12,color:T.muted}}>min</span>
            </div>
            <div style={{display:"flex",gap:10}}>
              <Btn variant="subtle" onClick={()=>setAsgStep("choice")} style={{flex:1,justifyContent:"center"}}>Back</Btn>
              <Btn onClick={onScheduleExtension} style={{flex:1,justifyContent:"center"}}>Schedule +{asgFinalMins}m</Btn>
            </div>
          </>)}
        </div>
      </div>
    );
  }

  // ── XP + LEADERBOARD REWARD SCREEN ────────────────────────────────────────
  if(phase==="done"){
    if(!completion)return null;
    const {mins,gain,minutesAfter,tierBefore,tierAfter,rankBefore,rankAfter,rows}=completion;
    const tieredUp=tierBefore!==tierAfter;
    const rankRose=rankAfter<rankBefore;
    const prog=tierProgressFor(minutesAfter);
    const ROW_H=42;
    const deltaRows=Math.max(0,rankBefore-rankAfter);
    return(
      <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.7)",backdropFilter:"blur(10px)",zIndex:1000,display:"flex",alignItems:"center",justifyContent:"center",padding:24}}>
        <div style={{width:"100%",maxWidth:440,background:T.card,borderRadius:22,border:`1px solid ${T.border}`,padding:"36px 32px",textAlign:"center",position:"relative",overflow:"hidden",animation:"studlinPop 0.25s cubic-bezier(.2,.85,.3,1)"}}>
          {tieredUp&&<div style={{position:"absolute",inset:0,background:`radial-gradient(circle at 50% 15%, ${T.lime}40, transparent 62%)`,pointerEvents:"none"}}/>}
          <div style={{position:"relative"}}>
            <div style={{fontSize:11,fontWeight:700,letterSpacing:"0.12em",textTransform:"uppercase",color:T.lime,marginBottom:10}}>Session complete</div>
            <h2 style={{fontSize:23,fontWeight:700,color:T.white,margin:"0 0 4px"}}>{mins} min focused</h2>
            <div style={{fontSize:13,color:T.muted,marginBottom:22}}>{task.title}</div>

            <div style={{display:"grid",gridTemplateColumns:task.coop?"1fr 1fr":"1fr",gap:10,marginBottom:tieredUp||rankRose?16:22}}>
              <div style={{background:T.card2,borderRadius:14,padding:"18px 20px",textAlign:"left"}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"baseline",marginBottom:9}}>
                  <span style={{fontSize:12,color:T.muted,fontWeight:600}}>{task.coop?"You":tierAfter}</span>
                  <span style={{fontFamily:T.mono,fontSize:16,fontWeight:700,color:T.lime}}>+{gain}m</span>
                </div>
                <div style={{height:6,background:T.border,borderRadius:99,overflow:"hidden"}}>
                  <div style={{height:"100%",width:(barFilled?prog.pct:0)+"%",background:T.lime,borderRadius:99,transition:"width 1.1s cubic-bezier(.2,.8,.2,1)"}}/>
                </div>
                <div style={{fontSize:11,color:T.faint,marginTop:7}}>{task.coop?tierAfter:(prog.next?`${(prog.next.minMinutes-minutesAfter).toLocaleString()}m to ${prog.next.title}`:"Maximum rank achieved")}</div>
              </div>
              {task.coop&&(
                <div style={{background:T.card2,borderRadius:14,padding:"18px 20px",textAlign:"left"}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"baseline",marginBottom:9}}>
                    <span style={{fontSize:12,color:T.muted,fontWeight:600}}>{task.coop.name}</span>
                    <span style={{fontFamily:T.mono,fontSize:16,fontWeight:700,color:T.teal}}>+{gain}m</span>
                  </div>
                  <div style={{height:6,background:T.border,borderRadius:99,overflow:"hidden"}}>
                    <div style={{height:"100%",width:(barFilled?prog.pct:0)+"%",background:T.teal,borderRadius:99,transition:"width 1.1s cubic-bezier(.2,.8,.2,1)"}}/>
                  </div>
                  <div style={{fontSize:11,color:T.faint,marginTop:7}}>Locked in together</div>
                </div>
              )}
            </div>

            {tieredUp&&(
              <div style={{fontSize:13,fontWeight:700,color:T.lime,marginBottom:rankRose?14:22,display:"flex",alignItems:"center",justifyContent:"center",gap:6}}>
                {Icon.star}Ranked up to {tierAfter}
              </div>
            )}

            {rankRose&&(
              <div style={{background:T.card2,borderRadius:14,padding:"14px 16px",marginBottom:22,textAlign:"left",overflow:"hidden"}}>
                <div style={{fontSize:10,fontWeight:700,letterSpacing:"0.08em",textTransform:"uppercase",color:T.muted,marginBottom:10}}>Leaderboard</div>
                <div style={{display:"flex",flexDirection:"column",gap:6}}>
                  {rows.map((u)=>(
                    <div key={u.n} style={{display:"flex",alignItems:"center",gap:10,padding:"7px 9px",borderRadius:9,background:u.you?T.lime+"14":"transparent",border:`1px solid ${u.you?T.lime+"33":"transparent"}`,transform:u.you&&!rankRisen?`translateY(${deltaRows*ROW_H}px)`:"translateY(0)",transition:"transform 0.9s cubic-bezier(.2,.85,.25,1.05)"}}>
                      <span style={{width:18,fontFamily:T.mono,fontSize:11,fontWeight:700,color:u.you?T.lime:T.faint}}>{u.r}</span>
                      <span style={{flex:1,fontSize:12,fontWeight:u.you?700:500,color:u.you?T.white:T.muted,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{u.n}</span>
                      <span style={{fontFamily:T.mono,fontSize:11,color:u.you?T.lime:T.faint}}>{u.minutes.toLocaleString()}m</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div style={{display:"flex",gap:10}}>
              <Btn variant="ghost" onClick={onClose} style={{flex:1,justifyContent:"center"}}>Skip</Btn>
              <Btn onClick={onClose} style={{flex:1,justifyContent:"center"}}>Back to dashboard</Btn>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── ACTIVE TIMER (focus1 | break | breakDone | focus2) — a persistent
  // floating widget, not a fullscreen takeover, so the rest of the app stays
  // visible and interactive while the session keeps ticking in the background.
  const isBreak=phase==="break"||phase==="breakDone";
  const timerColor=isBreak?T.amber:T.lime;
  const phaseLabel=phase==="focus1"?"Time until break":phase==="break"?"Break":phase==="breakDone"?"Break complete":"Time remaining";
  const phaseDuration=phase==="focus1"?breakPos*60:phase==="break"?breakMins*60:focus2Mins*60;
  const phasePct=Math.max(0,Math.min(1,phaseDuration>0?1-secs/phaseDuration:1));
  const widgetR=26;
  const widgetCirc=2*Math.PI*widgetR;

  // ── FULL-SCREEN FOCUS OVERLAY — entered via the square button below.
  // Fades + scales down on minimize (focusExiting) instead of hard-cutting,
  // then unmounts once minimizeFocus's timeout lands the widget back in its
  // collapsed circular state.
  if(fullscreen){
    return(
      <div style={{position:"fixed",inset:0,zIndex:600,background:T.bg,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:40,textAlign:"center",fontFamily:T.font,opacity:focusExiting?0:1,transform:focusExiting?"scale(0.97)":"scale(1)",transition:"opacity 0.22s ease, transform 0.22s ease"}}>
        <button onClick={minimizeFocus} title="Minimize" style={{position:"absolute",top:24,right:24,width:40,height:40,borderRadius:12,border:`1px solid ${T.border}`,background:T.card2,color:T.muted,display:"grid",placeItems:"center",cursor:"pointer"}}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="4 14 10 14 10 20"/><polyline points="20 10 14 10 14 4"/><line x1="14" y1="10" x2="21" y2="3"/><line x1="3" y1="21" x2="10" y2="14"/></svg>
        </button>
        <div style={{fontFamily:T.mono,fontSize:64,fontWeight:800,color:timerColor,letterSpacing:"-0.02em",marginBottom:28}}>{fmt(secs)}</div>
        <div style={{fontSize:16,color:T.text,maxWidth:480,lineHeight:1.65}}>Studlin is running in the background. Minimize this window when you are ready to execute, or leave it open to stay completely zeroed in.</div>
      </div>
    );
  }

  return(<>
    <div onPointerDown={widgetPointerDown} onPointerMove={widgetPointerMove} onPointerUp={widgetPointerUp}
      style={{position:"fixed",...(dragPos?{left:dragPos.x,top:dragPos.y,right:"auto",bottom:"auto"}:{bottom:20,right:collapsed?8:20}),zIndex:500,width:collapsed?64:284,background:T.card,border:`1px solid ${T.border}`,borderRadius:18,boxShadow:"0 20px 50px -14px rgba(0,0,0,0.5)",padding:collapsed?"30px 8px 14px":"14px 16px",fontFamily:T.font,animation:"studlinPop 0.22s cubic-bezier(.2,.85,.3,1)",transition:"width 0.28s cubic-bezier(.2,.85,.3,1), padding 0.28s cubic-bezier(.2,.85,.3,1)",overflow:"hidden",boxSizing:"border-box",cursor:"grab",touchAction:"none"}}>
      <button onClick={()=>setFullscreen(true)} title="Full-screen focus" style={{position:"absolute",top:10,right:38,width:22,height:22,borderRadius:6,border:`1px solid ${T.border}`,background:T.card2,color:T.muted,display:"grid",placeItems:"center",cursor:"pointer",zIndex:1,padding:0}}>
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><rect x="3" y="3" width="18" height="18" rx="2"/></svg>
      </button>
      <button onClick={()=>setCollapsed(c=>!c)} title={collapsed?"Expand timer":"Collapse timer"} style={{position:"absolute",top:10,right:10,width:22,height:22,borderRadius:"50%",border:`1px solid ${T.border}`,background:T.card2,color:T.muted,display:"grid",placeItems:"center",cursor:"pointer",zIndex:1,padding:0}}>
        <span style={{display:"inline-flex",transform:collapsed?"rotate(180deg)":"none",transition:"transform 0.22s ease"}}>{Icon.arrowR}</span>
      </button>

      {collapsed ? (
        <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:6}}>
          <div style={{position:"relative",width:40,height:40}}>
            <svg viewBox="0 0 64 64" style={{width:40,height:40,transform:"rotate(-90deg)"}}>
              <circle cx="32" cy="32" r={widgetR} fill="none" stroke={T.border} strokeWidth="5"/>
              <circle cx="32" cy="32" r={widgetR} fill="none" stroke={timerColor} strokeWidth="5" strokeLinecap="round"
                strokeDasharray={widgetCirc}
                strokeDashoffset={widgetCirc*(1-phasePct)}
                style={{transition:"stroke-dashoffset 0.5s"}}/>
            </svg>
          </div>
          <div style={{fontFamily:T.mono,fontSize:11,fontWeight:800,color:timerColor,letterSpacing:"-0.02em"}}>{fmt(secs)}</div>
        </div>
      ) : (<>
        <div style={{display:"flex",alignItems:"center",gap:12,paddingRight:26}}>
          <div style={{position:"relative",width:48,height:48,flexShrink:0}}>
            <svg viewBox="0 0 64 64" style={{width:48,height:48,transform:"rotate(-90deg)"}}>
              <circle cx="32" cy="32" r={widgetR} fill="none" stroke={T.border} strokeWidth="5"/>
              <circle cx="32" cy="32" r={widgetR} fill="none" stroke={timerColor} strokeWidth="5" strokeLinecap="round"
                strokeDasharray={widgetCirc}
                strokeDashoffset={widgetCirc*(1-phasePct)}
                style={{transition:"stroke-dashoffset 0.5s"}}/>
            </svg>
            {task.coop&&(
              <div title={"Locked in with "+task.coop.name} style={{position:"absolute",bottom:-3,right:-3,width:20,height:20,borderRadius:"50%",background:T.teal,border:`2px solid ${T.card}`,display:"grid",placeItems:"center",fontSize:8.5,fontWeight:800,color:T.ink}}>{task.coop.initials}</div>
            )}
          </div>
          <div style={{flex:1,minWidth:0}}>
            <div style={{fontSize:9.5,fontWeight:700,letterSpacing:"0.09em",textTransform:"uppercase",color:timerColor,marginBottom:2}}>{phaseLabel}</div>
            <div style={{fontFamily:T.mono,fontSize:19,fontWeight:800,color:T.white,letterSpacing:"-0.02em"}}>{fmt(secs)}</div>
            <div style={{fontSize:11,color:T.muted,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{task.coop?"With "+task.coop.name:task.title}</div>
          </div>
          <button onClick={()=>setSoundOn(s=>!s)} title={soundOn?"Mute alarm":"Unmute alarm"} style={{width:28,height:28,borderRadius:8,border:`1px solid ${T.border}`,background:T.card2,color:soundOn?T.text:T.faint,display:"grid",placeItems:"center",cursor:"pointer",flexShrink:0}}>{soundOn?Icon.volume:Icon.volOff}</button>
        </div>

        {isBreak&&(
          <div style={{fontSize:11.5,color:T.amber,margin:"10px 0 0",padding:"9px 11px",background:T.amber+"12",borderRadius:9,lineHeight:1.5}}>
            {breakIdeaRef.current}
          </div>
        )}

        <div style={{display:"flex",gap:8,marginTop:12}}>
          {phase==="break"&&!running&&<BtnSm onClick={()=>setRunning(true)} style={{flex:1,justifyContent:"center"}}>Start Break</BtnSm>}
          {phase==="break"&&running&&<BtnSm variant="ghost" onClick={()=>setRunning(false)} style={{flex:1,justifyContent:"center"}}>Pause</BtnSm>}
          {phase==="breakDone"&&<BtnSm onClick={resume} style={{flex:1,justifyContent:"center"}}>Resume</BtnSm>}
          {phase!=="break"&&phase!=="breakDone"&&<BtnSm variant="ghost" onClick={()=>setRunning(r=>!r)} style={{flex:1,justifyContent:"center"}}>{running?"Pause":"Resume"}</BtnSm>}
          {phase!=="breakDone"&&<BtnSm variant="danger" onClick={finishEarly} style={{flex:1,justifyContent:"center"}}>Finish</BtnSm>}
        </div>
        {phase==="break"&&(
          <button onClick={resume} style={{background:"none",border:"none",color:T.faint,fontSize:11,fontFamily:T.font,cursor:"pointer",padding:"8px 0 0",width:"100%",textAlign:"center"}}>Skip break, keep working →</button>
        )}
      </>)}
    </div>
  </>);
}

// ─── WEEKLY PLANNER ───────────────────────────────────────────────────────────
// WK_PX_HR (pixels per hour) now lives inside WeeklyPlanner as a local const
// driven by isAgendaCollapsed, so the grid gains height (not just width) when
// the Today panel is hidden — see the component body below.

// Lays out same-day events that overlap in time side-by-side instead of
// fully stacking on top of each other at full column width — previously any
// two things landing in the same window (e.g. a class overlapping a
// manually-added study block) would render on top of one another, clipping
// whichever card ended up underneath.
function layoutDayEvents(evs) {
  const items = evs.map(ev => {
    const [hh, mm] = ev.time.split(":").map(Number);
    const start = hh * 60 + mm;
    return { ev, start, end: start + (ev.duration || 30) };
  }).sort((a, b) => a.start - b.start || a.end - b.end);

  const clusters = [];
  let current = [], currentEnd = -Infinity;
  items.forEach(item => {
    if (current.length && item.start >= currentEnd) {
      clusters.push(current);
      current = [];
      currentEnd = -Infinity;
    }
    current.push(item);
    currentEnd = Math.max(currentEnd, item.end);
  });
  if (current.length) clusters.push(current);

  const laidOut = [];
  clusters.forEach(cluster => {
    const columnEnds = [];
    cluster.forEach(item => {
      let col = columnEnds.findIndex(end => item.start >= end);
      if (col === -1) { col = columnEnds.length; columnEnds.push(item.end); }
      else columnEnds[col] = item.end;
      item.col = col;
    });
    const totalCols = columnEnds.length;
    cluster.forEach(item => laidOut.push({ ...item, totalCols }));
  });
  return laidOut;
}

function WeeklyPlanner({events, setEvents, moveEvent, weekOffset, setWeekOffset, todayK, colorOf, fmtTime, openNew, openEdit, routines, editRoutineMode, hoveredRoutineId, setHoveredRoutineId, onEditRoutine, onDeleteRoutine, schoolWindow, selDay, setSelDay, isAgendaCollapsed}) {
  // Taller per-hour scale when the Today agenda panel is hidden, so the grid
  // gains height (not just the width the freed-up column would otherwise
  // just stretch into) and doesn't flatten out.
  const WK_PX_HR = isAgendaCollapsed ? 92 : 76;
  const wkColRefs = useRef({});
  const weekScrollRef = useRef(null);
  const [wkDragId, setWkDragId] = useState(null);
  useEffect(()=>{
    if(weekScrollRef.current){
      const hour = new Date().getHours();
      weekScrollRef.current.scrollTop = Math.max(0, hour - 1) * WK_PX_HR;
    }
  },[]);
  // Google-Calendar-style "now" line — minutes-since-midnight, refreshed
  // every 60s. Only today's column ever reads this (see isToday below), so
  // there's no work wasted redrawing six other days every tick.
  const [nowMins, setNowMins] = useState(()=>{const n=new Date();return n.getHours()*60+n.getMinutes();});
  useEffect(()=>{
    const tick=()=>{const n=new Date();setNowMins(n.getHours()*60+n.getMinutes());};
    const id=setInterval(tick,60000);
    return ()=>clearInterval(id);
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
  // Merge in virtual Weekly Routine occurrences for the visible week — same
  // never-persisted expansion CalendarTab does for the Monthly grid.
  expandRoutineOccurrences(routines||[], dayKey(weekDays[0]), dayKey(weekDays[6]))
    .forEach(ev => { (byDay[ev.date] = byDay[ev.date] || []).push(ev); });

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
    // Routed through the same guarded moveEvent the Monthly grid uses, so
    // the deadline Hard Wall (Tier 2) has one enforcement point, not two.
    moveEvent(wkDragId, dk, time);
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
          const isSel = selDay!=null && dk === selDay;
          return (
            <div key={i} onClick={()=>{if(setSelDay)setSelDay(dk);}} style={{textAlign:"center",padding:"7px 4px 9px",borderLeft:`1px solid ${T.border}`,cursor:setSelDay?"pointer":"default",background:isSel?T.card2:"transparent"}}>
              <div style={{fontSize:9,fontWeight:700,letterSpacing:"0.1em",color:T.muted,marginBottom:4}}>{DAY_NAMES[i]}</div>
              <div onDoubleClick={(e)=>{e.stopPropagation();openNew(dk);}} style={{width:28,height:28,borderRadius:"50%",background:isToday?T.lime:"transparent",color:isToday?T.ink:T.white,fontSize:13,fontWeight:700,display:"inline-flex",alignItems:"center",justifyContent:"center",cursor:"pointer"}}>{d.getDate()}</div>
            </div>
          );
        })}
      </div>
      <div ref={weekScrollRef} style={{display:"flex",overflowY:"auto",maxHeight:isAgendaCollapsed?"calc(100vh - 200px)":"calc(100vh - 260px)"}} onDragEnd={handleDragEnd}>
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
            // Free periods are an open window, not a task — they only ever
            // render as the transparent punch-out in the School Hours mask
            // below, never as their own block. The reserved "hs-school" block
            // itself is also excluded here for the same reason: its entire
            // span is already drawn by the School Hours mask below, so
            // rendering it AGAIN as its own solid card would sit on top of
            // that mask and visually cover the free-period gap it just
            // punched out.
            const visibleEvs = colEvs.filter(ev => ev.kind !== "free period" && ev.routineId !== "hs-school");
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
                {/* School Hours background mask (High School accounts only,
                    Mon–Fri) — free periods "punch through" it via
                    subtractIntervals, so those windows show the normal clear
                    background instead of the tint. */}
                {schoolWindow && colIdx<5 && subtractIntervals(schoolWindow, colEvs.filter(ev=>ev.kind==="free period").map(ev=>{const p=ev.time.split(":").map(Number);const start=p[0]*60+p[1];return {start,end:start+(ev.duration||30)};})).map((seg,si)=>(
                  <div key={"sh"+si} style={{position:"absolute",top:seg.start*(WK_PX_HR/60),left:0,right:0,height:(seg.end-seg.start)*(WK_PX_HR/60),background:T.muted+"0C",pointerEvents:"none",display:"flex",alignItems:"center",justifyContent:"center",overflow:"hidden"}}>
                    {(seg.end-seg.start)>=45 && <span style={{fontSize:9,fontWeight:800,letterSpacing:"0.12em",color:T.muted+"88"}}>SCHOOL HOURS</span>}
                  </div>
                ))}
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
                {dk===todayK && (
                  <div style={{position:"absolute",top:nowMins*(WK_PX_HR/60),left:0,right:0,zIndex:6,pointerEvents:"none"}}>
                    <div style={{position:"absolute",left:-4,top:-4,width:8,height:8,borderRadius:"50%",background:"#E5484D"}} />
                    <div style={{borderTop:"2px solid #E5484D"}} />
                  </div>
                )}
                {layoutDayEvents(visibleEvs).map(({ev, col, totalCols}) => {
                  const timeParts = ev.time.split(":").map(Number);
                  const hh = timeParts[0]; const mm = timeParts[1];
                  const topPx = (hh * 60 + mm) * (WK_PX_HR / 60);
                  const dur = ev.duration || 30;
                  const heightPx = Math.max(22, dur * (WK_PX_HR / 60));
                  const isDone = ev.status === "done";
                  const over = daysOverdue(ev);
                  const color = over > 0 ? T.red : colorOf(ev.subject);
                  const isStudy = ev.kind === "study block";
                  const isExam = ev.kind === "exam";
                  const isRoutine = !!ev.isRoutine;
                  // Study blocks: solid subject-color fill. Exams: dark canvas with a
                  // thick glowing subject-color border. Everything else (class,
                  // deadline, reminder): the original thin left-accent strip.
                  const kindStyle = isStudy
                    ? {background:color,borderLeft:"none",color:T.ink}
                    : isExam
                      ? {background:T.ink,border:`2px solid ${color}`,borderLeft:`2px solid ${color}`,boxShadow:`0 0 10px -1px ${color}, inset 0 0 10px ${color}22`,color:T.cream}
                      : {background:color+"1E",borderLeft:`3px solid ${color}`,color};
                  const dimmedByRoutineMode = editRoutineMode && !isRoutine;
                  const highlightedByRoutineMode = editRoutineMode && isRoutine;
                  const leftPct = (col / totalCols) * 100;
                  const widthPct = 100 / totalCols;
                  return (
                    <div key={ev.id}
                      draggable={!isRoutine}
                      onDragStart={()=>{ if(!isRoutine){setWkDragId(ev.id); setWkDragDeadline(ev.deadline||null);} }}
                      onDoubleClick={()=>{ if(!isRoutine)openEdit(ev); }}
                      onClick={()=>{ if(isRoutine&&editRoutineMode&&onEditRoutine)onEditRoutine(ev.routineId); }}
                      onMouseEnter={()=>{ if(isRoutine&&setHoveredRoutineId)setHoveredRoutineId(ev.routineId); }}
                      onMouseLeave={()=>{ if(isRoutine&&setHoveredRoutineId)setHoveredRoutineId(null); }}
                      title={isRoutine?"Repeats weekly":"Double-click to edit · Drag to reschedule"}
                      style={{position:"absolute",top:topPx,left:`calc(${leftPct}% + 2px)`,width:`calc(${widthPct}% - 4px)`,height:heightPx,borderRadius:5,padding:"2px 5px",cursor:isRoutine?(editRoutineMode?"pointer":"default"):"grab",overflow:"hidden",zIndex:3,opacity:dimmedByRoutineMode?0.3:(isDone?0.4:1),boxSizing:"border-box",userSelect:"none",...kindStyle,...(highlightedByRoutineMode?{outline:`2px solid ${T.lime}`,outlineOffset:1}:{})}}>
                      <div style={{fontSize:9.5,fontWeight:700,color:kindStyle.color,lineHeight:1.25,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{isExam?"EXAM · ":""}{ev.title}</div>
                      {heightPx > 34 && <div style={{fontSize:8.5,color:isStudy?T.ink+"aa":isExam?color:T.muted,marginTop:1}}>{fmtTime(ev.time)}{dur ? " · "+dur+"m" : ""}</div>}
                      {isRoutine&&editRoutineMode&&hoveredRoutineId===ev.routineId&&(
                        <button onClick={(e)=>{e.stopPropagation();if(onDeleteRoutine)onDeleteRoutine(ev.routineId);if(setHoveredRoutineId)setHoveredRoutineId(null);}} title="Delete this routine block (every week)"
                          style={{position:"absolute",top:-8,right:-8,width:18,height:18,borderRadius:"50%",border:`1px solid ${T.border}`,background:T.card,color:T.red,fontSize:11,lineHeight:1,cursor:"pointer",display:"grid",placeItems:"center",boxShadow:"0 4px 10px -2px rgba(0,0,0,0.4)"}}>×</button>
                      )}
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

// ─── DEFERRED WEEKLY ROUTINE WIZARD (Calendar tab, first-visit) ─────────────
const ROUTINE_DOW=["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];
const fmtTimeShort=(t)=>{if(!t)return "";const p=t.split(":");let h=+p[0];const ap=h>=12?"PM":"AM";h=h%12||12;return h+":"+p[1]+" "+ap;};
const wizardChipStyle=(sel)=>({padding:"7px 12px",borderRadius:8,fontSize:12,fontWeight:sel?600:400,cursor:"pointer",border:`1px solid ${sel?T.lime+"66":T.border}`,background:sel?T.lime+"14":"transparent",color:sel?T.lime:T.muted,fontFamily:T.font});
const wizardStatusChipStyle=(sel)=>({flex:1,padding:"16px",borderRadius:12,fontSize:14,fontWeight:600,cursor:"pointer",border:`1.5px solid ${sel?T.lime:T.border}`,background:sel?T.lime+"14":T.card2,color:sel?T.lime:T.muted,fontFamily:T.font,textAlign:"center"});
const wizardSelectStyle={padding:"10px 8px",borderRadius:8,border:`1px solid ${T.border}`,background:T.card2,fontSize:13,color:T.text,fontFamily:T.font,outline:"none"};
const wizardAddBtnStyle={padding:"10px 16px",borderRadius:8,border:"none",background:T.lime,color:T.ink,fontSize:13,fontWeight:600,cursor:"pointer",whiteSpace:"nowrap"};

function WizardRoutineList({items,onRemove}){
  if(items.length===0)return null;
  return (
    <div style={{display:"flex",flexDirection:"column",gap:8,marginTop:14}}>
      {items.map(it=>(
        <div key={it.id} style={{display:"flex",alignItems:"center",gap:10,padding:"9px 12px",background:T.card2,border:`1px solid ${T.border}`,borderRadius:10}}>
          <div style={{flex:1,minWidth:0}}>
            <div style={{fontSize:13,fontWeight:600,color:T.text}}>{it.title}</div>
            <div style={{fontSize:11,color:T.muted,marginTop:2}}>{it.days.map(d=>ROUTINE_DOW[d]).join(", ")} · {fmtTimeShort(it.startTime)} · {it.duration}m</div>
          </div>
          <button type="button" onClick={()=>onRemove(it.id)} style={{background:"none",border:"none",color:T.muted,cursor:"pointer",fontSize:18,lineHeight:1,padding:"2px 6px"}}>×</button>
        </div>
      ))}
    </div>
  );
}

// After-School Shield List — day-specific (unlike a single Mon–Fri
// assumption), since sports/rehearsals/shifts don't all repeat every
// weekday the way core school hours do.
function WizardHsBuilder({schoolStart,setSchoolStart,schoolEnd,setSchoolEnd,items,addItem,removeItem}){
  const [title,setTitle]=useState("");
  const [kind,setKind]=useState("busy"); // "busy" (after-school shield) or "free" (free period / study hall — punches through the School Hours tint)
  const [days,setDays]=useState([]);
  const [start,setStart]=useState("15:30");
  const [duration,setDuration]=useState(60);
  const toggleDay=(i)=>setDays(days.includes(i)?days.filter(d=>d!==i):[...days,i]);
  const isFree=kind==="free";
  const add=()=>{
    if((!isFree&&!title.trim())||days.length===0)return;
    addItem({title:isFree?(title.trim()||"Free Period"):title.trim(),kind,days:[...days],startTime:start,duration});
    setTitle("");setDays([]);
  };
  return (
    <div>
      <div style={{fontSize:12.5,fontWeight:600,color:T.text,marginBottom:10}}>Base School Block (Mon–Fri)</div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:22}}>
        <Field label="School starts"><TimeInput value={schoolStart} onChange={setSchoolStart} /></Field>
        <Field label="School ends"><TimeInput value={schoolEnd} onChange={setSchoolEnd} /></Field>
      </div>
      <div style={{fontSize:12.5,fontWeight:600,color:T.text,marginBottom:2}}>Free Periods &amp; After-School Shields</div>
      <div style={{fontSize:11,color:T.muted,marginBottom:12}}>Study halls and lunch clear the School Hours background; sports, rehearsals, and shifts stay shielded like a class. Pick the days each one repeats.</div>
      {!isFree&&<Field label="Name"><Input value={title} onChange={e=>setTitle(e.target.value)} style={{flexGrow:1}} /></Field>}
      <div style={{display:"flex",gap:8,marginBottom:10}}>
        <button type="button" onClick={()=>setKind("free")} style={wizardChipStyle(kind==="free")}>Free Period</button>
        <button type="button" onClick={()=>setKind("busy")} style={wizardChipStyle(kind==="busy")}>After-School Activity</button>
      </div>
      <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:10}}>
        {ROUTINE_DOW.map((d,i)=><button key={i} type="button" onClick={()=>toggleDay(i)} style={wizardChipStyle(days.includes(i))}>{d}</button>)}
      </div>
      <div style={{display:"flex",gap:8,alignItems:"center",justifyContent:"flex-end"}}>
        <TimeInput value={start} onChange={setStart} style={{width:"fit-content"}} />
        <select value={duration} onChange={e=>setDuration(+e.target.value)} style={wizardSelectStyle}>
          {[30,45,60,90,120].map(m=><option key={m} value={m}>{m} min</option>)}
        </select>
        <button type="button" onClick={add} style={wizardAddBtnStyle}>+ Add</button>
      </div>
      <WizardRoutineList items={items} onRemove={removeItem} />
    </div>
  );
}

function WizardCollegeBuilder({items,addItem,removeItem}){
  const [title,setTitle]=useState("");
  const [kind,setKind]=useState("class");
  const [days,setDays]=useState([]);
  const [time,setTime]=useState("10:00");
  const [duration,setDuration]=useState(50);
  const toggleDay=(i)=>setDays(days.includes(i)?days.filter(d=>d!==i):[...days,i]);
  const add=()=>{
    if(!title.trim()||days.length===0)return;
    addItem({title:title.trim(),kind,days:[...days],startTime:time,duration});
    setTitle("");setDays([]);
  };
  return (
    <div>
      <div style={{fontSize:12.5,fontWeight:600,color:T.text,marginBottom:10}}>Add a class or recurring activity</div>
      <Field label="Title"><Input value={title} onChange={e=>setTitle(e.target.value)} style={{flexGrow:1}} /></Field>
      <div style={{display:"flex",gap:8,marginBottom:10}}>
        <button type="button" onClick={()=>setKind("class")} style={wizardChipStyle(kind==="class")}>Class</button>
        <button type="button" onClick={()=>setKind("busy")} style={wizardChipStyle(kind==="busy")}>Activity</button>
      </div>
      <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:10}}>
        {ROUTINE_DOW.map((d,i)=><button key={i} type="button" onClick={()=>toggleDay(i)} style={wizardChipStyle(days.includes(i))}>{d}</button>)}
      </div>
      <div style={{display:"flex",gap:8,alignItems:"center",justifyContent:"flex-end"}}>
        <TimeInput value={time} onChange={setTime} style={{width:"fit-content"}} />
        <select value={duration} onChange={e=>setDuration(+e.target.value)} style={wizardSelectStyle}>
          {[30,45,50,60,75,90,120].map(m=><option key={m} value={m}>{m} min</option>)}
        </select>
        <button type="button" onClick={add} style={wizardAddBtnStyle}>+ Add</button>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:6,marginTop:18}}>
        {ROUTINE_DOW.map((d,i)=>{
          const dayItems=items.filter(r=>r.days.includes(i)).sort((a,b)=>a.startTime<b.startTime?-1:1);
          return (
            <div key={i} style={{minHeight:50}}>
              <div style={{fontSize:10,fontWeight:700,color:T.muted,textAlign:"center",marginBottom:6,letterSpacing:"0.05em"}}>{d}</div>
              <div style={{display:"flex",flexDirection:"column",gap:4}}>
                {dayItems.map(it=>(
                  <div key={it.id} onClick={()=>removeItem(it.id)} title="Click to remove" style={{fontSize:9.5,fontWeight:600,padding:"4px 6px",borderRadius:6,background:it.kind==="class"?T.lime+"22":T.lime+"0F",border:`1px solid ${T.border}`,color:T.text,cursor:"pointer",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{it.title}</div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Multi-step wizard: status fork → HS/College builder → preferred focus
// window. Deferred to the Calendar tab's first visit rather than living in
// onboarding, and reopenable anytime via "Manage Routine" (Calendar header
// or Settings > Calendar Preferences) with existing routines pre-filled.
function RoutineWizardModal({open,initialStatus,existingRoutines,onFinish,onSkip}){
  const [wizStep,setWizStep]=useState("status");
  const [status,setStatus]=useState(initialStatus||"");
  const [schoolStart,setSchoolStart]=useState("08:00");
  const [schoolEnd,setSchoolEnd]=useState("15:00");
  const [items,setItems]=useState([]);
  const [workStart,setWorkStart]=useState("10:00");
  const [workEnd,setWorkEnd]=useState("18:00");

  useEffect(()=>{
    if(!open)return;
    setWizStep("status");
    setStatus(initialStatus||"");
    const hsRule=(existingRoutines||[]).find(r=>r.id==="hs-school");
    if(hsRule){
      setSchoolStart(hsRule.startTime||"08:00");
      const startMins=timeToMinutes(hsRule.startTime||"08:00")+(hsRule.duration||420);
      setSchoolEnd(minutesToTime(Math.min(23*60+45,startMins)));
    }else{setSchoolStart("08:00");setSchoolEnd("15:00");}
    setItems((existingRoutines||[]).filter(r=>r.id!=="hs-school").map(r=>({...r})));
    const prefs=getSchedulePreferences();
    setWorkStart(prefs.workStartTime||"10:00");
    setWorkEnd(prefs.workEndTime||"18:00");
  },[open]);

  const addItem=(item)=>setItems(prev=>[...prev,{id:String(Date.now()+Math.random()*1000),...item}]);
  const removeItem=(id)=>setItems(prev=>prev.filter(x=>x.id!==id));

  const goToWindowStep=()=>{
    if(status==="highschool"&&workStart==="10:00"){
      const suggested=Math.min(23*60+45,timeToMinutes(schoolEnd)+60);
      setWorkStart(minutesToTime(suggested));
    }
    setWizStep("window");
  };

  const finish=()=>{
    const routine=[...items];
    if(status==="highschool"){
      routine.push({id:"hs-school",title:"School",kind:"class",days:[0,1,2,3,4],startTime:schoolStart,duration:Math.max(15,timeToMinutes(schoolEnd)-timeToMinutes(schoolStart))});
    }
    onFinish(routine,{workStartTime:workStart,workEndTime:workEnd});
  };

  const lockedRanges=status==="highschool"?[{start:timeToMinutes(schoolStart),end:timeToMinutes(schoolEnd)}]:[];

  return (
    <>
      <Modal open={open} onClose={onSkip}
        title={wizStep==="status"?"Set up your Weekly Routine?":wizStep==="build"?"Map your schedule":"Preferred Focus Windows"}
        sub={wizStep==="status"?"Add your classes, sports, or work shifts once, and our AI will automatically shield those times every single week.":wizStep==="window"?"When do you typically prefer to study?":undefined}
        width={620}
        footer={
          <div style={{display:"flex",width:"100%",justifyContent:"space-between",alignItems:"center"}}>
            <Btn variant="subtle" onClick={onSkip}>Skip and Setup Later</Btn>
            <div style={{display:"flex",gap:10}}>
              {wizStep!=="status"&&<Btn variant="subtle" onClick={()=>setWizStep(wizStep==="window"?"build":"status")}>Back</Btn>}
              {wizStep==="status"&&<Btn onClick={()=>setWizStep("build")} disabled={!status} style={{opacity:status?1:0.45}}>Map Routine Now</Btn>}
              {wizStep==="build"&&<Btn onClick={goToWindowStep}>Continue</Btn>}
              {wizStep==="window"&&<Btn onClick={finish}>Finish</Btn>}
            </div>
          </div>
        }>
        {wizStep==="status"&&(
          <div style={{display:"flex",gap:10}}>
            <button type="button" onClick={()=>setStatus("highschool")} style={wizardStatusChipStyle(status==="highschool")}>High School</button>
            <button type="button" onClick={()=>setStatus("college")} style={wizardStatusChipStyle(status==="college")}>College</button>
          </div>
        )}
        {wizStep==="build"&&status==="highschool"&&<WizardHsBuilder schoolStart={schoolStart} setSchoolStart={setSchoolStart} schoolEnd={schoolEnd} setSchoolEnd={setSchoolEnd} items={items.filter(i=>i.id!=="hs-school")} addItem={addItem} removeItem={removeItem} />}
        {wizStep==="build"&&status==="college"&&<WizardCollegeBuilder items={items} addItem={addItem} removeItem={removeItem} />}
        {wizStep==="window"&&(
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
            <Field label="Preferred study start"><TimeInput value={workStart} onChange={setWorkStart} lockedRanges={lockedRanges} /></Field>
            <Field label="Preferred study end"><TimeInput value={workEnd} onChange={setWorkEnd} /></Field>
          </div>
        )}
      </Modal>
    </>
  );
}

// The "Today"/selected-day + Upcoming agenda column — shared by Monthly and
// Weekly views so the collapsible panel behaves identically in both.
function AgendaColumn({selDay, dayEvents, upcoming, relDay, niceDate, fmtTime, colorOf, openNew, openEdit, editRoutineMode, hoveredRoutineId, setHoveredRoutineId, routines, openRoutineEdit, deleteRoutineItem, markDone, removeEvent, setSelDay, setYm, dragId, setDragId, openReschedule}) {
  return (
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
            const color=over>0?T.red:colorOf(ev.subject);
            const isStudy=ev.kind==="study block";
            const isExam=ev.kind==="exam";
            const isRoutine=!!ev.isRoutine;
            // Study blocks: solid subject-color container. Exams: dark canvas
            // with a thick glowing subject-color border + an explicit tag.
            // Classes (and everything else): the original thin left strip.
            const rowStyle=isStudy
              ? {background:color,borderRadius:9,padding:"9px 12px",marginBottom:6}
              : isExam
                ? {background:T.ink,border:`2px solid ${color}`,boxShadow:`0 0 12px -2px ${color}`,borderRadius:9,padding:"9px 12px",marginBottom:6}
                : {borderBottom:"1px solid "+T.border,padding:"9px 0"};
            const titleColor=isStudy?T.ink:isExam?T.cream:(isDone?T.muted:T.white);
            const subColor=isStudy?"rgba(14,31,24,0.65)":isExam?color:T.muted;
            const badgeBg=isStudy?"rgba(14,31,24,0.14)":isExam?color+"22":T.card2;
            const dimmedByRoutineMode=editRoutineMode&&!isRoutine;
            const highlightedByRoutineMode=editRoutineMode&&isRoutine;
            return(
            <div key={ev.id} draggable={!isRoutine} onDragStart={()=>{if(!isRoutine)setDragId(ev.id);}}
              onMouseEnter={()=>isRoutine&&setHoveredRoutineId(ev.routineId)} onMouseLeave={()=>isRoutine&&setHoveredRoutineId(null)}
              onClick={()=>{if(editRoutineMode&&isRoutine){const rule=routines.find(r=>r.id===ev.routineId);if(rule)openRoutineEdit(rule);}}}
              style={{position:"relative",display:"flex",gap:10,alignItems:"flex-start",opacity:dimmedByRoutineMode?0.3:(isDone?0.5:1),cursor:isRoutine?(editRoutineMode?"pointer":"default"):"grab",...rowStyle,...(highlightedByRoutineMode?{outline:`2px solid ${T.lime}`,outlineOffset:2}:{})}}>
              {!isStudy&&!isExam&&<div style={{width:3,alignSelf:"stretch",borderRadius:2,background:color,flexShrink:0}} />}
              <div style={{flex:1,minWidth:0}}>
                <div style={{display:"flex",alignItems:"center",gap:6,minWidth:0}}>
                  {ev.priority&&<span style={{width:7,height:7,borderRadius:"50%",background:PRIORITY_COLORS[ev.priority||3],flexShrink:0}} />}
                  {isExam&&<span style={{display:"inline-flex",alignItems:"center",gap:4,fontSize:9.5,fontWeight:800,letterSpacing:"0.04em",color,background:color+"1E",border:`1px solid ${color}55`,borderRadius:5,padding:"1px 6px",flexShrink:0}}><span style={{width:4,height:4,borderRadius:"50%",background:color,flexShrink:0}} />EXAM</span>}
                  {isRoutine&&<span style={{fontSize:9,fontWeight:800,letterSpacing:"0.04em",color,background:color+"14",border:`1px solid ${color}44`,borderRadius:5,padding:"1px 6px",flexShrink:0}}>WEEKLY</span>}
                  <span style={{fontSize:12.5,fontWeight:600,color:titleColor,lineHeight:1.35,textDecoration:isDone?"line-through":"none",minWidth:0,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",display:"block"}} title={ev.title}>{ev.title}</span>
                </div>
                <div style={{fontSize:11,color:subColor,marginTop:2,display:"flex",gap:6,flexWrap:"wrap",alignItems:"center"}}>
                  <span>{fmtTime(ev.time)}</span>
                  {ev.duration&&<span style={{background:badgeBg,padding:"1px 6px",borderRadius:4,fontSize:10,fontWeight:600,color:titleColor}}>{ev.duration>=60?Math.floor(ev.duration/60)+"h"+(ev.duration%60?" "+ev.duration%60+"m":""):ev.duration+"m"}</span>}
                  <span>{ev.subject}</span>
                  {over>0&&<span style={{color:T.red,fontWeight:600}}>{over}d overdue</span>}
                </div>
              </div>
              {!isRoutine&&(
                <div style={{display:"flex",gap:4,flexShrink:0,alignItems:"center"}}>
                  {!isDone&&ev.duration&&(ev.kind==="study block"||ev.kind==="deadline")&&<BtnSm onClick={()=>{if(window._setTimerTask)window._setTimerTask(ev);}} style={{flexShrink:0,boxShadow:`0 2px 10px -3px ${T.lime}88`}}>Begin</BtnSm>}
                  {!isDone&&(ev.kind==="exam"||ev.kind==="class"||ev.kind==="reminder")&&<button onClick={()=>openEdit(ev)} title="View details" style={{padding:"4px 8px",borderRadius:6,border:`1px solid ${T.border}`,background:T.card2,color:T.muted,fontSize:10,fontWeight:600,cursor:"pointer",fontFamily:T.font}}>Details</button>}
                  {!isDone&&ev.duration&&(ev.kind==="study block"||ev.kind==="deadline")&&<button onClick={()=>openReschedule(ev)} title="Reschedule" style={{padding:"4px 8px",borderRadius:6,border:`1px solid ${T.border}`,background:T.card2,color:T.muted,fontSize:10,fontWeight:600,cursor:"pointer",fontFamily:T.font}}>Reschedule</button>}
                  {!isDone&&<button onClick={()=>markDone(ev.id)} title="Mark done" style={{border:"none",background:"transparent",color:T.faint,cursor:"pointer",display:"flex"}}>{Icon.check}</button>}
                  <button onClick={()=>removeEvent(ev.id)} title="Delete" style={{border:"none",background:"transparent",color:T.faint,cursor:"pointer",fontSize:14,lineHeight:1,padding:2}}>×</button>
                </div>
              )}
              {isRoutine&&editRoutineMode&&hoveredRoutineId===ev.routineId&&(
                <button onClick={(e)=>{e.stopPropagation();deleteRoutineItem(ev.routineId);setHoveredRoutineId(null);}} title="Delete this routine block (every week)"
                  style={{position:"absolute",top:-8,right:-8,width:22,height:22,borderRadius:"50%",border:`1px solid ${T.border}`,background:T.card,color:T.red,fontSize:13,lineHeight:1,cursor:"pointer",display:"grid",placeItems:"center",boxShadow:"0 4px 10px -2px rgba(0,0,0,0.4)"}}>×</button>
              )}
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
  );
}

// Collapsible wrapper: places `left` (the month grid or weekly planner) next
// to a shared AgendaColumn, with a chevron toggle pinned to the seam that
// smoothly collapses the panel to width:0 rather than unmounting it.
function CollapsibleAgendaLayout({isAgendaCollapsed, setIsAgendaCollapsed, children, agendaProps}) {
  return (
    <div style={{display:"flex",gap:isAgendaCollapsed?8:16,position:"relative",alignItems:"flex-start"}}>
      <div style={{flex:1,minWidth:0}}>{children}</div>
      <div style={{width:isAgendaCollapsed?0:300,flexShrink:0,opacity:isAgendaCollapsed?0:1,overflow:"hidden",pointerEvents:isAgendaCollapsed?"none":"auto",transition:"width 0.28s cubic-bezier(.2,.85,.3,1), opacity 0.2s ease"}}>
        <div style={{width:300}}><AgendaColumn {...agendaProps} /></div>
      </div>
      <button onClick={()=>setIsAgendaCollapsed(c=>!c)} title={isAgendaCollapsed?"Show agenda":"Hide agenda"}
        style={{width:26,height:26,marginTop:8,borderRadius:"50%",border:`1px solid ${T.border}`,background:T.card,color:T.muted,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",flexShrink:0,boxShadow:"0 4px 10px -2px rgba(0,0,0,0.35)"}}>
        <span style={{display:"inline-flex",transform:isAgendaCollapsed?"rotate(90deg)":"rotate(-90deg)",transition:"transform 0.22s ease"}}>{Icon.chevDown}</span>
      </button>
    </div>
  );
}

// Ongoing routine management dashboard (as opposed to RoutineWizardModal,
// which is only the first-run setup flow). Lists every locked recurring
// block with Edit/Delete, plus an inline expandable "+ Add Recurring
// Activity" form — reuses the same fields/components as the existing "Edit
// routine block" modal for visual consistency.
function RoutineControlCenterModal({open, onClose, routines, fmtTime, onEditRoutine, onDeleteRoutine, onAddRoutine, onEditOnCalendar}) {
  const [addingRoutine,setAddingRoutine]=useState(false);
  const [title,setTitle]=useState("");
  const [kind,setKind]=useState("class");
  const [days,setDays]=useState([]);
  const [startTime,setStartTime]=useState("15:30");
  const [duration,setDuration]=useState(60);
  useEffect(()=>{ if(!open)setAddingRoutine(false); },[open]);
  const resetForm=()=>{setTitle("");setKind("class");setDays([]);setStartTime("15:30");setDuration(60);};
  const toggleDay=(i)=>setDays(d=>d.includes(i)?d.filter(x=>x!==i):[...d,i]);
  const isFree=kind==="free";
  const submitAdd=()=>{
    if((!isFree&&!title.trim())||days.length===0)return;
    onAddRoutine({title:isFree?(title.trim()||"Free Period"):title.trim(),kind,days:[...days],startTime,duration});
    resetForm();
    setAddingRoutine(false);
  };
  const formatDays=(ds)=>{
    const sorted=[...(ds||[])].sort((a,b)=>a-b);
    if(sorted.length===7)return "Every day";
    if(sorted.length===5&&sorted.every((v,i)=>v===i))return "Mon–Fri";
    return sorted.map(i=>ROUTINE_DOW[i]).join(", ");
  };
  return (
    <Modal open={open} onClose={onClose} title="Manage your Weekly Routine" sub="Locked recurring blocks Studlin always schedules around. Add, edit, or clear one anytime." width={560}>
      {routines.length===0&&!addingRoutine&&(
        <div style={{fontSize:12.5,color:T.muted,padding:"10px 0 16px",textAlign:"center"}}>No recurring blocks yet.</div>
      )}
      {routines.length>0&&(
        <div style={{display:"flex",flexDirection:"column",gap:8,marginBottom:16}}>
          {routines.map(r=>(
            <div key={r.id} style={{display:"flex",alignItems:"center",gap:10,padding:"10px 12px",borderRadius:10,border:`1px solid ${T.border}`,background:T.card2}}>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontSize:13,fontWeight:600,color:T.white}}>{r.title}</div>
                <div style={{fontSize:11,color:T.muted,marginTop:2}}>{formatDays(r.days)} · {fmtTime(r.startTime)} – {fmtTime(minutesToTime(timeToMinutes(r.startTime)+(r.duration||30)))}</div>
              </div>
              <BtnSm variant="subtle" onClick={()=>onEditRoutine(r)}>Edit</BtnSm>
              <BtnSm variant="danger" onClick={()=>onDeleteRoutine(r.id)}>Delete</BtnSm>
            </div>
          ))}
        </div>
      )}
      {routines.length>0&&onEditOnCalendar&&(
        <button type="button" onClick={onEditOnCalendar} style={{background:"none",border:"none",color:T.lime,fontSize:12.5,fontFamily:T.font,cursor:"pointer",padding:"0 0 16px",textDecoration:"underline"}}>Edit directly on the calendar instead</button>
      )}
      {!addingRoutine
        ? <Btn variant="subtle" onClick={()=>setAddingRoutine(true)} style={{width:"100%",justifyContent:"center"}}>+ Add Recurring Activity</Btn>
        : (
          <div style={{border:`1px solid ${T.border}`,borderRadius:10,padding:14}}>
            {!isFree&&<Field label="Name"><Input value={title} onChange={e=>setTitle(e.target.value)} placeholder="e.g. Track Practice" autoFocus /></Field>}
            <Field label="Type"><SelectChip options={[{value:"class",label:"Class"},{value:"busy",label:"Activity"},{value:"free",label:"Free Period"}]} value={kind} onChange={setKind} /></Field>
            <Field label="Repeats on" hint={days.length===0?"Pick at least one day":undefined}>
              <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
                {ROUTINE_DOW.map((d,i)=>{
                  const sel=days.includes(i);
                  return <button key={i} type="button" onClick={()=>toggleDay(i)} style={{padding:"6px 12px",borderRadius:7,fontSize:12,fontWeight:sel?600:400,cursor:"pointer",border:`1px solid ${sel?T.lime+"66":T.border}`,background:sel?T.lime+"14":"transparent",color:sel?T.lime:T.muted,fontFamily:T.font}}>{d}</button>;
                })}
              </div>
            </Field>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:14}}>
              <Field label="Start time"><TimeInput value={startTime} onChange={setStartTime} /></Field>
              <Field label="Duration (minutes)"><NumField min={5} max={480} fallback={30} value={duration} onChange={setDuration} /></Field>
            </div>
            <div style={{display:"flex",gap:10,justifyContent:"flex-end"}}>
              <Btn variant="subtle" onClick={()=>{resetForm();setAddingRoutine(false);}}>Cancel</Btn>
              <Btn onClick={submitAdd} disabled={(!isFree&&!title.trim())||days.length===0} style={{opacity:(!isFree&&!title.trim())||days.length===0?0.45:1}}>Add</Btn>
            </div>
          </div>
        )}
    </Modal>
  );
}

const fmtMinsDur=(m)=>m>=60?Math.floor(m/60)+"h"+(m%60?" "+(m%60)+"m":""):m+"m";

// Velocity Impact Display — shown as the confirmation step whenever a
// student reschedules a single task, so the trade-off (rest reclaimed
// today vs. the workload it adds to tomorrow) is a conscious choice
// instead of a silent one-click action.
function computeVelocityImpact(task,events){
  const tomorrow=(()=>{const d=new Date();d.setDate(d.getDate()+1);return dayKey(d);})();
  const taskMins=task.duration||30;
  const tomorrowEvents=events.filter(e=>e.date===tomorrow&&e.status!=="done"&&e.id!==task.id);
  let baseMins=tomorrowEvents.reduce((a,e)=>a+(e.duration||0),0);
  if(baseMins<=0){
    // Tomorrow's empty — a single task would otherwise read as an
    // undefined/infinite jump, so fall back to the rolling 7-day daily
    // average scheduled load as the baseline instead.
    const today=dayKey();
    const start=(()=>{const d=new Date();d.setDate(d.getDate()-7);return dayKey(d);})();
    const recent=events.filter(e=>e.date>=start&&e.date<today&&e.status!=="done");
    baseMins=Math.round(recent.reduce((a,e)=>a+(e.duration||0),0)/7);
  }
  const pct=baseMins>0?Math.round((taskMins/baseMins)*100):100;
  return {tomorrow,taskMins,baseMins,pct,isHigh:pct>=15};
}

function RescheduleModal({task,events,commit,onClose}){
  const [err,setErr]=useState("");
  const {tomorrow,taskMins,pct,isHigh}=computeVelocityImpact(task,events);

  const confirm=()=>{
    if(task.deadline&&tomorrow>task.deadline){setErr("Can't reschedule past "+task.deadline+" — that's the deadline.");return;}
    const prefs=getSchedulePreferences();
    const routines=getWeeklyRoutine();
    const {events:relocated,placement}=findSlotWithEviction(events,routines,prefs,tomorrow,prefs.workStartTime,taskMins,task.deadline||null);
    if(!placement){setErr("No open slot before its deadline, even after freeing up what we can — try a manual edit instead.");return;}
    const finalEvents=relocated.map(e=>e.id===task.id?{...e,date:placement.date,time:placement.time}:e);
    const evictedCount=relocated.filter(e=>{const orig=events.find(o=>o.id===e.id);return orig&&orig.date===tomorrow&&e.date!==tomorrow;}).length;
    commit(finalEvents,evictedCount);
    onClose();
  };

  return (
    <div onClick={onClose} style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.6)",backdropFilter:"blur(6px)",zIndex:1000,display:"flex",alignItems:"center",justifyContent:"center",padding:24,animation:"studlinFade 0.18s ease-out"}}>
      <div onClick={e=>e.stopPropagation()} style={{width:"100%",maxWidth:420,background:T.card,border:`1px solid ${T.border}`,borderRadius:18,padding:24,animation:"studlinPop 0.22s cubic-bezier(.2,.85,.3,1)"}}>
        <div style={{fontSize:15,fontWeight:700,color:T.white,marginBottom:10}}>Reschedule "{task.title}"?</div>
        <div style={{fontSize:13.5,color:T.text,lineHeight:1.65,marginBottom:18}}>
          Rescheduling this gives you <strong>{fmtMinsDur(taskMins)}</strong> of rest right now, but increases tomorrow's active workload by <strong style={{color:isHigh?T.amber:T.muted}}>{pct}%</strong>.
        </div>
        {err&&<div style={{fontSize:12.5,color:T.red,marginBottom:14,padding:"10px 12px",background:T.red+"14",borderRadius:9}}>{err}</div>}
        <div style={{display:"flex",gap:8}}>
          <Btn onClick={confirm} style={{flex:1,justifyContent:"center"}}>Confirm Reschedule</Btn>
          <Btn variant="subtle" onClick={onClose} style={{flex:1,justifyContent:"center"}}>Cancel</Btn>
        </div>
      </div>
    </div>
  );
}

function CalendarTab({onTaskSaved,openWizardOnMount,onWizardOpenedFromSettings}={}){
  const [userSubjects,setUserSubjectsState]=useState(()=>getSubjects());
  const SUBJ=[{value:"None",label:"None",color:T.muted},...userSubjects.map(s=>({value:s.label,label:s.label,color:s.color})),{value:"Other",label:"Other",color:T.lime}];
  const colorOf=(sub)=>{if(!sub||sub==="None"||sub==="")return T.muted;const x=userSubjects.find(s=>s.label===sub);return x?x.color:T.lime;};
  const [subjOnboardOpen,setSubjOnboardOpen]=useState(()=>!lsGet("subjects-configured",false));
  const [onbSubjs,setOnbSubjs]=useState(()=>getSubjects().map(s=>({...s})));

  // Deferred Weekly Routine wizard — used to block on the very first Calendar
  // mount for every new account, before the student had done anything at
  // all. Now it only auto-opens once they've actually saved a real task
  // (i.e. on a *later* visit to Calendar, never the first) — the setup ask
  // comes after they've seen the app do something, not before. Still gated
  // by the same one-shot "hasConfiguredRoutine" flag, and still reachable
  // any time via the "Routine" button or Settings > Calendar Preferences
  // (the latter arrives via openWizardOnMount, since Settings is a separate
  // top-level tab with no direct access to this component's state).
  const [routineWizardOpen,setRoutineWizardOpen]=useState(()=>!lsGet("hasConfiguredRoutine",false)&&lsGet("events",[]).some(e=>!e.id.startsWith("seed-")));
  // Routine Control Center — the ongoing management dashboard reached via the
  // gear icon on the Calendar toolbar (as opposed to routineWizardOpen, which
  // is only the first-run setup flow).
  const [routineCenterOpen,setRoutineCenterOpen]=useState(false);
  useEffect(()=>{
    if(openWizardOnMount){setRoutineWizardOpen(true);if(onWizardOpenedFromSettings)onWizardOpenedFromSettings();}
  },[openWizardOnMount]);
  const finishRoutineWizard=(routine,prefs)=>{
    persistRoutines(routine);
    setSchedulePreferences(prefs);
    lsSet("hasConfiguredRoutine",true);
    setRoutineWizardOpen(false);
  };
  const skipRoutineWizard=()=>{
    // Marks the wizard "handled" so it doesn't keep re-intercepting on every
    // future Calendar visit — the user can still reopen it anytime via
    // "Routine".
    lsSet("hasConfiguredRoutine",true);
    setRoutineWizardOpen(false);
  };

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
  const [evDate,setEvDate]=useState("");
  const [evTime,setEvTime]=useState("");
  const [evPrefillDate,setEvPrefillDate]=useState(dayKey());
  const [evSubject,setEvSubject]=useState("None");
  const [evCustom,setEvCustom]=useState("");
  const [evKind,setEvKind]=useState("study block");
  const [evNotes,setEvNotes]=useState("");
  const [evPriority,setEvPriority]=useState(500); // 0-1000 continuous scale
  // Difficulty slider removed from the UI entirely — deciding "how hard is
  // this really" is friction with no payoff for a procrastination-prone
  // brain at the exact moment they're avoiding a task. Stays at a flat
  // Medium under the hood so calculateTaskPriority's difficulty-preference
  // scoring doesn't break, it's just neutral for everyone now.
  const [evDifficulty,setEvDifficulty]=useState(500);
  const [evMoreOpen,setEvMoreOpen]=useState(false);
  const [evDeadline,setEvDeadline]=useState("");
  const [evDeadlineTime,setEvDeadlineTime]=useState("23:59");
  // To-Do items can skip scheduling entirely — a checkbox with no inherent
  // duration ("send AP scores to college") shouldn't be forced onto a
  // calendar time slot. Only offered for the "deadline"/To-Do kind; exams,
  // classes, study blocks etc. all have a real duration and stay scheduled.
  const [asChecklist,setAsChecklist]=useState(false);
  // Brain Dump — tell Studlin everything at once instead of one task at a
  // time. One AI call splits it into items; anything with a real duration
  // gets slotted deterministically via findOpenSlotFor (same placement
  // engine as everything else), anything without one becomes a checklist
  // to-do instead of forcing a guessed time onto it.
  const [brainDumpOpen,setBrainDumpOpen]=useState(false);
  const [brainDumpText,setBrainDumpText]=useState("");
  const [brainDumpLoading,setBrainDumpLoading]=useState(false);
  const [brainDumpReview,setBrainDumpReview]=useState(null); // {items:[{id,title,kind,durationMin,dueDate,needsDuration,include}]}
  // One-shot deep link from Dashboard's empty-Today's-Plan "Brain dump
  // everything" button — matches the openDeckId/openNoteId pattern used
  // elsewhere for cross-tab one-shot triggers.
  useEffect(()=>{
    if(!lsGet("pendingBrainDump",false))return;
    try{localStorage.removeItem("studlin-pendingBrainDump");}catch(e){}
    setBrainDumpOpen(true);
  },[]);
  // Explicit AI-Schedule vs Manual-Placement fork for task-kind entries —
  // replaces the old implicit "fill in Target Date to go manual" behavior,
  // which showed both the Target Date and Deadline fields at once and left
  // users unsure which one they were supposed to fill in.
  const [taskMode,setTaskMode]=useState("ai");
  const [evDuration,setEvDuration]=useState(60);
  const [evSaveToRoutine,setEvSaveToRoutine]=useState(false);
  const [evSplitEnabled,setEvSplitEnabled]=useState(false);
  const [evSplitCount,setEvSplitCount]=useState(2);
  const [aiLoading,setAiLoading]=useState(false);
  const [toast,setToast]=useState(false);
  // Hard-Wall rejection message (Tier 2 of the rescheduling engine) — a
  // reschedule attempt past a task's own deadline never silently succeeds.
  const [deadlineToast,setDeadlineToast]=useState("");
  const showDeadlineToast=(deadline)=>{setDeadlineToast("Can't reschedule past "+deadline+" — that's the deadline.");setTimeout(()=>setDeadlineToast(""),2800);};
  const [reconcileToast,setReconcileToast]=useState("");
  // Velocity Impact reschedule confirmation — set to the task being
  // rescheduled, null when closed.
  const [rescheduleTask,setRescheduleTask]=useState(null);
  const [rescheduleToast,setRescheduleToast]=useState("");
  // Tier 3 — Global Emergency "Studlin Reschedule". pausePreview holds the
  // computed (not-yet-committed) plan: {label, moved:[...], couldntMove:[...]}.
  const [pauseOpen,setPauseOpen]=useState(false);
  const [pauseText,setPauseText]=useState("");
  const [pauseLoading,setPauseLoading]=useState(false);
  const [pauseError,setPauseError]=useState("");
  const [pausePreview,setPausePreview]=useState(null);
  const [dragId,setDragId]=useState(null);
  // Sticky across tab switches — CalendarTab fully remounts every time the
  // user navigates away and back (key={active} at the App level), so plain
  // useState would silently reset this to "monthly" every time.
  const [calView,setCalViewState]=useState(()=>lsGet("calView","monthly"));
  const setCalView=(v)=>{setCalViewState(v);lsSet("calView",v);};
  const [weekOffset,setWeekOffset]=useState(0);
  // Collapsible right-hand agenda column — shared across Monthly and Weekly.
  const [isAgendaCollapsed,setIsAgendaCollapsed]=useState(false);
  const [editOpen,setEditOpen]=useState(false);
  const [editEv,setEditEv]=useState(null);
  // Weekly Routine ("Time Shields") — recurring rules, kept in React state so
  // add/edit/delete re-renders immediately, mirrored to localStorage on every
  // change via saveWeeklyRoutine.
  const [routines,setRoutinesState]=useState(()=>getWeeklyRoutine());
  // Bounded conflict reconciliation: whenever routines change, relocate any
  // already-scheduled *pending*, non-fixed task in the next 14 days that now
  // overlaps a routine occurrence, using the same conflict/slot logic aiArrange
  // trusts. Fixed real-world blocks (exam/class/busy block) and done tasks are
  // never touched — mirrors aiArrange's own "never touch fixed blocks" rule.
  const reconcileRoutineConflicts=(nextRoutines)=>{
    const prefs=getSchedulePreferences();
    const now=new Date();
    // No lower bound on date: a still-pending task dated in the past (never
    // marked done) that overlaps a routine block stays visibly stuck there
    // forever otherwise — e.g. still rendered mid-"SCHOOL HOURS" in the
    // current week's grid the day after it was created. findOpenSlotFor
    // searches forward from the task's own date, so it naturally lands on a
    // later opening the same day if one exists, or a future day otherwise —
    // never further in the past.
    const horizonEnd=(()=>{const d=new Date(now);d.setDate(d.getDate()+13);return dayKey(d);})();
    let changed=false;
    const movedTitles=[];
    const next=events.map(ev=>{
      if(ev.status==="done"||!ev.time)return ev;
      if(ev.kind==="exam"||ev.kind==="class"||ev.kind==="busy block")return ev;
      if(ev.date>horizonEnd)return ev;
      const duration=ev.duration||30;
      const tMins=timeToMinutes(ev.time);
      // Free periods are open windows, not locked blocks — a task inside one
      // is never a conflict to shuffle away from.
      const occupied=expandRoutineOccurrences(nextRoutines,ev.date,ev.date)
        .filter(o=>o.kind!=="free period")
        .map(o=>({start:timeToMinutes(o.time),end:timeToMinutes(o.time)+(o.duration||30)}));
      const conflict=occupied.some(o=>!(tMins+duration<=o.start||tMins>=o.end));
      if(!conflict)return ev;
      const slot=findOpenSlotFor(events.filter(e=>e.id!==ev.id),nextRoutines,prefs,ev.date,ev.time,duration);
      if(slot.date===ev.date&&slot.time===ev.time)return ev;
      changed=true;
      movedTitles.push(ev.title);
      return {...ev,date:slot.date,time:slot.time};
    });
    if(changed){
      setEvents(next);lsSet("events",next);
      // This runs automatically (on mount, and whenever routines change) —
      // unlike every other reschedule path in the app, nothing here is a
      // direct response to a click, so it's the one place a task can move
      // with no visible trigger. Always surface it, matching the app's own
      // "successful async actions get a toast, not silence" convention.
      setReconcileToast(movedTitles.length===1
        ? `"${movedTitles[0]}" moved — it conflicted with your schedule.`
        : `${movedTitles.length} tasks moved — they conflicted with your schedule.`);
      setTimeout(()=>setReconcileToast(""),3400);
    }
  };
  const persistRoutines=(r)=>{setRoutinesState(r);saveWeeklyRoutine(r);reconcileRoutineConflicts(r);};
  // Reconciliation above only fires on a routine *change* — it never touches
  // tasks that were already conflicting before this logic existed, or that
  // drifted into conflict for any other reason. Run it once on every Calendar
  // visit too, so stale conflicts don't sit there forever.
  useEffect(()=>{ reconcileRoutineConflicts(routines); },[]);
  // The reserved "hs-school" rule (synthesized by the Weekly Routine wizard
  // for High School accounts) doubles as the School Hours grid-tint window —
  // no separate profile-status prop needed, since only HS accounts ever get
  // this rule created for them.
  const schoolWindow=(()=>{const r=routines.find(x=>x.id==="hs-school");if(!r)return null;return {start:timeToMinutes(r.startTime),end:timeToMinutes(r.startTime)+(r.duration||0)};})();
  const deleteRoutineItem=(routineId)=>persistRoutines(routines.filter(r=>r.id!==routineId));
  const [editRoutineMode,setEditRoutineMode]=useState(false);
  const [hoveredRoutineId,setHoveredRoutineId]=useState(null);
  const [routineEditItem,setRoutineEditItem]=useState(null); // the underlying rule being edited, or null
  const [riTitle,setRiTitle]=useState("");
  const [riKind,setRiKind]=useState("class");
  const [riDays,setRiDays]=useState([]);
  const [riStartTime,setRiStartTime]=useState("09:00");
  const [riDuration,setRiDuration]=useState(50);
  const [riSubject,setRiSubject]=useState("None");
  const openRoutineEdit=(rule)=>{
    setRoutineEditItem(rule);
    setRiTitle(rule.title||"");
    setRiKind(rule.kind||"class");
    setRiDays(rule.days||[]);
    setRiStartTime(rule.startTime||"09:00");
    setRiDuration(rule.duration||50);
    setRiSubject(rule.subject||"None");
  };
  const closeRoutineEdit=()=>setRoutineEditItem(null);
  const saveRoutineEdit=()=>{
    if(!routineEditItem||!riTitle.trim()||riDays.length===0)return;
    persistRoutines(routines.map(r=>r.id===routineEditItem.id?{...r,title:riTitle.trim(),kind:riKind,days:riDays,startTime:riStartTime,duration:riDuration,subject:riSubject==="None"?"":riSubject}:r));
    closeRoutineEdit();
  };
  const deleteRoutineEdit=()=>{
    if(!routineEditItem)return;
    deleteRoutineItem(routineEditItem.id);
    closeRoutineEdit();
  };
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
  const [editDeadlineErr,setEditDeadlineErr]=useState("");
  const [editPriority,setEditPriority]=useState(500);
  // Difficulty is still preserved on the underlying task if it already had
  // one (older data, or AI-set), but there's no slider to change it anymore
  // — same reasoning as the Add Task flow.
  const [editDifficulty,setEditDifficulty]=useState(500);
  const [editMoreOpen,setEditMoreOpen]=useState(false);
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
  const byDay={};events.forEach(ev=>{if(ev.checklist)return;(byDay[ev.date]=byDay[ev.date]||[]).push(ev);});
  // Merge in virtual Weekly Routine occurrences for the visible grid range —
  // never persisted, just expanded fresh every render so editing/deleting a
  // rule instantly reflects across every week without any migration pass.
  if(cells.length>0){
    expandRoutineOccurrences(routines,cells[0].key,cells[cells.length-1].key)
      .forEach(ev=>{(byDay[ev.date]=byDay[ev.date]||[]).push(ev);});
  }
  const todayK=dayKey();
  const fmtTime=(t)=>{const p=t.split(":");let h=+p[0];const ap=h>=12?"PM":"AM";h=h%12||12;return h+":"+p[1]+" "+ap;};
  const niceDate=(k)=>{const p=k.split("-");return new Date(+p[0],+p[1]-1,+p[2]).toLocaleDateString("en-US",{weekday:"long",month:"long",day:"numeric"});};
  const relDay=(k)=>{if(k===todayK)return "Today";const t=new Date();t.setDate(t.getDate()+1);if(k===dayKey(t))return "Tomorrow";const p=k.split("-");return new Date(+p[0],+p[1]-1,+p[2]).toLocaleDateString("en-US",{month:"short",day:"numeric"});};
  const upcoming=events.filter(ev=>!ev.checklist&&ev.date>=todayK).sort((a,b)=>a.date===b.date?(a.time<b.time?-1:1):(a.date<b.date?-1:1)).slice(0,6);
  // Computed straight from `events`/routines for `selDay` (rather than the
  // month-grid-scoped `byDay`) so the agenda column stays correct even when
  // `selDay` falls in a week outside the visible month grid (Weekly view).
  // Checklist items are excluded everywhere here — they deliberately have no
  // calendar presence, only a Dashboard checklist entry.
  const dayEvents=events.filter(ev=>!ev.checklist&&ev.date===selDay).concat(getRoutineOccurrencesForDate(selDay).filter(o=>o.kind!=="free period")).sort((a,b)=>a.time<b.time?-1:1);
  // Target Date/Start Time start blank — for tasks/study blocks, blank means
  // "let AI schedule this". The clicked day is remembered so fixed-time kinds
  // (exam/class/reminder), which always need a real date, can still default
  // to it once the user picks one of those types.
  const openNew=(dateK)=>{setEvPrefillDate(dateK||selDay);setEvTime("");setEvSubject("None");setEvDate("");setEvDeadline("");setEvPriority(500);setEvDifficulty(500);setEvMoreOpen(false);setEvDuration(60);setEvSaveToRoutine(false);setEvSplitEnabled(false);setEvSplitCount(2);setNewOpen(true);};
  const resetForm=()=>{setNewOpen(false);setEvTitle("");setEvNotes("");setEvCustom("");setEvDate("");setEvTime("");setEvPriority(500);setEvDifficulty(500);setEvMoreOpen(false);setEvDeadline("");setEvDeadlineTime("23:59");setTaskMode("ai");setEvDuration(60);setEvSaveToRoutine(false);setEvSplitEnabled(false);setEvSplitCount(2);setAiLoading(false);setAsChecklist(false);};
  const onEvKindChange=(k)=>{setEvKind(k);if((k==="exam"||k==="class"||k==="reminder"||k==="busy block")&&!evDate)setEvDate(evPrefillDate);};
  const buildTask=(date,time,titleSuffix,splitInfo)=>{
    const subj=evSubject==="None"?"":(evSubject==="Other"&&evCustom.trim()?evCustom.trim():evSubject);
    return {id:String(Date.now()+Math.random()*1000),title:evTitle.trim()+(titleSuffix||""),date,time,subject:subj,kind:evKind,notes:evNotes,priority:evPriority,difficulty:evDifficulty,deadline:evDeadline||null,duration:splitInfo?Math.round(evDuration/evSplitCount):evDuration,status:"pending",timeSpent:0,completedAt:null,...(splitInfo||{})};
  };
  const commitTasks=(newTasks)=>{
    const prefs=getSchedulePreferences();
    const datesAffected=new Set(newTasks.map(function(t){return t.date;}).filter(Boolean));
    let next=events.concat(newTasks);
    datesAffected.forEach(function(dk){next=rebalanceDay(dk,next,routines,prefs);});
    setEvents(next);lsSet("events",next);
    resetForm();
    // Checklist items can have no date at all (a to-do with no due date) —
    // skip the day/month-jump entirely rather than feeding an empty string
    // into the date math below, which would produce NaN.
    const d=newTasks[0].date;
    if(d){
      setSelDay(d);
      if(d.slice(0,7)!==(ym.y+"-"+String(ym.m+1).padStart(2,"0"))){const p=d.split("-");setYm({y:+p[0],m:+p[1]-1});}
    }
    setToast(true);setTimeout(()=>setToast(false),2200);
    if(onTaskSaved)onTaskSaved();
  };
  // A checklist item is deliberately minimal — title and an optional due
  // date, nothing else. It's flagged checklist:true and carries no `time`,
  // so it's excluded from the calendar grid, agenda, and AI day-planning
  // (advancedSchedulePlanner) everywhere those filter on that flag, and
  // instead only ever shows up in the Dashboard checklist.
  const saveChecklistItem=()=>{
    if(!evTitle.trim())return;
    const subj=evSubject==="None"?"":(evSubject==="Other"&&evCustom.trim()?evCustom.trim():evSubject);
    const item={id:String(Date.now()+Math.random()*1000),title:evTitle.trim(),date:evDeadline||"",time:"",subject:subj,kind:"deadline",notes:evNotes,checklist:true,deadline:evDeadline||null,priority:5,difficulty:5,duration:0,status:"pending",timeSpent:0,completedAt:null};
    commitTasks([item]);
  };
  // 1 credit, same as every other /api/chat call site — splits the whole
  // brain dump into items in one shot rather than one call per task. Same
  // "AI attempt, then deterministic fallback" shape as extractSyllabusDeadlines.
  const parseBrainDump=async(text)=>{
    if(!text||!text.trim())return [];
    try{
      const prompt="A student just brain-dumped everything they need to do, in their own words, in one go. Break it into separate individual items. "+
        "Today's date is "+dayKey()+" ("+new Date().toLocaleDateString("en-US",{weekday:"long"})+"). "+
        "For each item return: \"title\" (short, e.g. \"Chem homework\" or \"Email counselor\"), "+
        "\"kind\" (\"study\" for anything that takes real focused work time — homework, studying, a project — or \"todo\" for a quick task with no real duration, like sending an email, a form, or a phone call), "+
        "\"durationMin\" (your best-guess minutes needed, ONLY for kind:\"study\" — null for kind:\"todo\"), "+
        "\"dueDate\" (YYYY-MM-DD if a deadline was stated or clearly implied like \"Friday\", else null), "+
        "\"needsDuration\" (true ONLY if kind is \"study\" and you genuinely can't make a reasonable guess from context — be generous, most things can get a rough estimate). "+
        "Respond with ONLY valid JSON, no markdown fences, no commentary: "+
        "{\"items\":[{\"title\":\"Chem homework\",\"kind\":\"study\",\"durationMin\":45,\"dueDate\":null,\"needsDuration\":false}]}. "+
        "If nothing usable is in the text, respond {\"items\":[]}.\n\n"+text.slice(0,4000);
      const res=await authFetch("/api/chat",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({messages:[{r:"user",t:prompt}],model:"standard"})});
      const data=await res.json();
      const raw=(data.reply||"").replace(/```json?\n?/gi,"").replace(/```/g,"").trim();
      const parsed=JSON.parse(raw);
      if(parsed&&Array.isArray(parsed.items)&&parsed.items.length>0)return parsed.items;
      return fallbackSplitBrainDump(text);
    }catch(e){return fallbackSplitBrainDump(text);}
  };
  const submitBrainDump=async()=>{
    if(!brainDumpText.trim()||brainDumpLoading)return;
    setBrainDumpLoading(true);
    const items=await parseBrainDump(brainDumpText);
    setBrainDumpLoading(false);
    setBrainDumpOpen(false);
    setBrainDumpReview({items:items.map((it,i)=>({id:"bd-"+i,title:it.title,kind:it.kind==="study"?"study":"todo",durationMin:it.durationMin||30,dueDate:it.dueDate||"",needsDuration:!!it.needsDuration,include:true}))});
  };
  // Study-kind items get a real slot via the same deterministic placement
  // engine every other scheduling path trusts — no separate AI call per
  // item, the one parseBrainDump call above already did the understanding.
  // Todo-kind items skip scheduling entirely, same shape as saveChecklistItem.
  const commitBrainDump=(items)=>{
    const prefs=getSchedulePreferences();
    const today=dayKey();
    let working=events;
    const newTasks=[];
    items.filter(it=>it.kind==="study").forEach(it=>{
      const duration=Math.max(5,it.durationMin||30);
      const slot=findOpenSlotFor(working,routines,prefs,today,prefs.workStartTime,duration,it.dueDate||null);
      const task={id:String(Date.now()+Math.random()*1000),title:it.title,date:slot.date,time:slot.time,subject:"",kind:"study block",notes:"",priority:5,difficulty:5,deadline:it.dueDate||null,duration,status:"pending",timeSpent:0,completedAt:null};
      newTasks.push(task);working=working.concat([task]);
    });
    items.filter(it=>it.kind==="todo").forEach(it=>{
      newTasks.push({id:String(Date.now()+Math.random()*1000),title:it.title,date:it.dueDate||"",time:"",subject:"",kind:"deadline",notes:"",checklist:true,deadline:it.dueDate||null,priority:5,difficulty:5,duration:0,status:"pending",timeSpent:0,completedAt:null});
    });
    commitTasks(newTasks);
  };
  // Turns the current form into a recurring routine rule instead of a
  // one-off event — used when "Save to my Weekly Routine" is checked. Only
  // the single day-of-week the picked date falls on is captured; it then
  // materializes on every matching weekday going forward (today included),
  // so no separate one-off `events` entry is created alongside it.
  const saveToRoutineFromForm=()=>{
    const d=new Date(evDate+"T00:00:00");
    const dow=(d.getDay()+6)%7;
    const subj=evSubject==="None"?"":(evSubject==="Other"&&evCustom.trim()?evCustom.trim():evSubject);
    const rule={id:String(Date.now()+Math.random()*1000),title:evTitle.trim(),kind:evKind==="class"?"class":"busy",days:[dow],startTime:evTime,duration:evDuration,subject:subj};
    saveWeeklyRoutine([...getWeeklyRoutine(),rule]);
    resetForm();setSelDay(evDate);
    setToast(true);setTimeout(()=>setToast(false),2200);
    if(onTaskSaved)onTaskSaved();
  };
  // Manual entry skipped conflict-avoidance entirely — a hand-typed time that
  // landed inside school hours (or another locked routine block) just saved
  // as-is. This mirrors the same hard-lock check aiArrange already trusts,
  // so a manual pick that collides gets bumped to the nearest open slot
  // (preferring a free period, then whatever's next) instead of overlapping.
  // Fixed real-world blocks (exam/class/busy block) are exempt, matching
  // every other auto-shuffle path in this file.
  const resolveManualSlot=(date,time,duration)=>{
    if(evKind==="exam"||evKind==="class"||evKind==="busy block")return {date,time};
    const occupied=events.filter(e=>e.date===date&&e.time)
      .map(e=>({start:timeToMinutes(e.time),end:timeToMinutes(e.time)+(e.duration||30)+computeBreathingRoom(e.duration||30)}))
      .concat(expandRoutineOccurrences(routines,date,date).filter(o=>o.kind!=="free period")
        .map(o=>({start:timeToMinutes(o.time),end:timeToMinutes(o.time)+(o.duration||30)})));
    const tMins=timeToMinutes(time);
    const conflict=occupied.some(o=>!(tMins+duration<=o.start||tMins>=o.end));
    return conflict?findOpenSlotFor(events,routines,getSchedulePreferences(),date,time,duration):{date,time};
  };
  const saveManual=()=>{
    if(!evTitle.trim()||!evDate.trim()||!evTime.trim())return;
    if(evSaveToRoutine&&(evKind==="exam"||evKind==="class"||evKind==="busy block")){saveToRoutineFromForm();return;}
    if(!evSplitEnabled){
      const slot=resolveManualSlot(evDate,evTime,evDuration);
      commitTasks([buildTask(slot.date,slot.time)]);
      return;
    }
    const groupId="split-"+Date.now();
    const perSession=Math.round(evDuration/evSplitCount);
    const tasks=[];
    for(let i=0;i<evSplitCount;i++){
      const d=new Date(evDate);d.setDate(d.getDate()+i);
      const slot=resolveManualSlot(dayKey(d),evTime,perSession);
      tasks.push(buildTask(slot.date,slot.time," ("+(i+1)+"/"+evSplitCount+")",{splitGroup:groupId,splitIndex:i+1,splitTotal:evSplitCount,duration:perSession}));
    }
    commitTasks(tasks);
  };
  const aiArrange=async()=>{
    if(!evTitle.trim())return;
    if(evKind==="exam"||evKind==="class"||evKind==="busy block")return; // fixed real-world blocks — AI never touches these
    if(taskMode==="manual")return; // Manual Placement is active — use Save to Calendar instead
    setAiLoading(true);
    const now=new Date();
    const tk=dayKey();
    const nowH=String(now.getHours()).padStart(2,"0");
    const nowM=String(now.getMinutes()).padStart(2,"0");
    const nowTime=nowH+":"+nowM;
    const prefs=getSchedulePreferences();
    const prefStartMins=timeToMinutes(prefs.workStartTime);
    const prefEndMins=timeToMinutes(prefs.workEndTime);
    // Earliest bookable time today: the later of (user's preferred start) or (now + 15-min buffer)
    const bufMins=now.getHours()*60+now.getMinutes()+15;
    const earliestTodayMins=Math.max(prefStartMins,Math.ceil(bufMins/15)*15);
    const earliestTodayTime=minutesToTime(earliestTodayMins);
    const perSession=Math.round(evDuration/(evSplitEnabled?evSplitCount:1));
    const splitCount=evSplitEnabled?evSplitCount:1;
    // Respect the date the user clicked on — if evPrefillDate is today or future, use it as the anchor
    const desiredStartDate=(evPrefillDate&&evPrefillDate>=tk)?evPrefillDate:tk;
    const isDesiredToday=desiredStartDate===tk;
    const windowStart=isDesiredToday?earliestTodayMins:prefStartMins;
    const windowStartTime=isDesiredToday?earliestTodayTime:minutesToTime(prefStartMins);
    const windowMins=Math.max(0,prefEndMins-windowStart);
    const firstAvailDate=windowMins>=perSession?desiredStartDate:(()=>{const d=new Date(desiredStartDate+"T12:00:00");d.setDate(d.getDate()+1);return dayKey(d);})();
    const horizonEnd=(()=>{const d=new Date(desiredStartDate+"T12:00:00");d.setDate(d.getDate()+13);return dayKey(d);})();
    const routineAhead=expandRoutineOccurrences(routines,tk,horizonEnd);
    // Free periods are preferred landing spots (see freeAhead below), not hard
    // blocks — excluding them here also resolves the prompt's prior internal
    // contradiction (telling the AI to prefer free windows while also listing
    // those same windows as forbidden-to-overlap).
    const existing=events.filter(ev=>ev.date>=tk).concat(routineAhead.filter(r=>r.kind!=="free period")).map(ev=>({title:ev.title,date:ev.date,time:ev.time,duration:ev.duration||60}));
    const freeAhead=routineAhead.filter(r=>r.kind==="free period").map(r=>({date:r.date,time:r.time,duration:r.duration}));
    const priorityLabel=evPriority<200?"Low":evPriority<400?"Medium-Low":evPriority<600?"Medium":evPriority<800?"High":"Urgent";
    // Deterministic hard-lock enforcement — the prompt below asks the LLM to
    // avoid conflicts and prefer free-period windows, but "strictly
    // forbidden" needs a real guarantee, not just advisory text.
    const findOpenSlot=(desiredDate,desiredTime,duration)=>findOpenSlotFor(events,routines,prefs,desiredDate,desiredTime,duration);
    const prompt="You are a scheduling AI. The user's LIVE clock reads "+nowTime+" on "+tk+". Schedule "+splitCount+" session(s) of "+perSession+" minutes each for the task: \""+evTitle.trim()+"\". Priority: "+priorityLabel+(evDeadline?". Deadline: "+evDeadline+" "+(evDeadlineTime||"23:59"):"")+". Existing schedule, including recurring classes/activities that repeat weekly — treat every one of these as a hard block you may NEVER overlap: "+JSON.stringify(existing)+". Free/open windows (free periods or study halls) good for short sub-20-minute sessions specifically: "+JSON.stringify(freeAhead)+". The user's preferred daily study window is "+prefs.workStartTime+"–"+prefs.workEndTime+" — always fill that window first, chronologically from the start, before ever using time outside it. CRITICAL USER INTENT: The user explicitly selected "+desiredStartDate+" on the calendar. Start scheduling on "+desiredStartDate+" — do NOT place any session before this date. STRICT RULES (violations are forbidden): 1) NEVER schedule before "+desiredStartDate+". 2) The first available slot on "+desiredStartDate+" starts at "+windowStartTime+". 3) If "+desiredStartDate+" has no open window at or after "+windowStartTime+", start from "+firstAvailDate+" instead. 4) Prefer sessions within "+prefs.workStartTime+"-"+prefs.workEndTime+"; only expand outside that range (up to 08:00-22:00) if the preferred window is fully booked that day. 5) Higher priority = earlier slots within the allowed date range. 6) Must be before deadline. 7) NEVER overlap anything in the existing schedule, including recurring blocks — this is non-negotiable. 8) If this session is 20 minutes or less, prefer placing it inside one of the free/open windows listed above. 9) Spread splits across consecutive days starting from "+desiredStartDate+". Respond with ONLY valid JSON: {\"sessions\":[{\"date\":\"YYYY-MM-DD\",\"time\":\"HH:MM\"}]}";
    // If the AI call fails or returns nothing usable, fall back to a fully
    // deterministic placement — evDate/evTime are blank in AI mode, so
    // saveManual() isn't usable here.
    const fallbackSchedule=()=>{
      const groupId=splitCount>1?"split-"+Date.now():null;
      const tasks=[];
      let cursorDate=firstAvailDate,cursorTime=windowStartTime;
      for(let i=0;i<splitCount;i++){
        const slot=findOpenSlot(cursorDate,cursorTime,perSession);
        tasks.push(buildTask(slot.date,slot.time,splitCount>1?" ("+(i+1)+"/"+splitCount+")":"",(groupId?{splitGroup:groupId,splitIndex:i+1,splitTotal:splitCount,duration:perSession}:{duration:evDuration})));
        const d=new Date(slot.date+"T12:00:00");d.setDate(d.getDate()+1);
        cursorDate=dayKey(d);cursorTime=prefs.workStartTime;
      }
      commitTasks(tasks);
    };
    try{
      const res=await authFetch("/api/chat",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({messages:[{r:"user",t:prompt}],model:"flash"})});
      const data=await res.json();
      const raw=data.reply.replace(/```json?|```/g,"").trim();
      const parsed=JSON.parse(raw);
      if(parsed.sessions&&parsed.sessions.length>0){
        const sanitized=parsed.sessions.map(s=>{
          let date=s.date,time=s.time;
          // Client-side guardrail: if the AI returned a slot before the user's desired start date, push forward
          if(date<desiredStartDate){date=firstAvailDate;time=windowStartTime;}
          else if(date===tk&&timeToMinutes(time)<earliestTodayMins){
            const d=new Date(desiredStartDate+"T12:00:00");d.setDate(d.getDate()+1);
            date=dayKey(d);time=minutesToTime(prefStartMins);
          }
          // Deterministic conflict check — reject/reshift anything that
          // actually overlaps a real event or routine shield, rather than
          // trusting the LLM followed the prompt's rules.
          const occupied=events.filter(e=>e.date===date&&e.time)
            .concat(getRoutineOccurrencesForDate(date).filter(o=>o.kind!=="free period"))
            .map(e=>({start:timeToMinutes(e.time),end:timeToMinutes(e.time)+(e.duration||30)}));
          const tMins=timeToMinutes(time);
          const conflict=occupied.some(o=>!(tMins+perSession<=o.start||tMins>=o.end));
          return conflict?findOpenSlot(date,time,perSession):{date,time};
        });
        const groupId=splitCount>1?"split-"+Date.now():null;
        const tasks=sanitized.slice(0,splitCount).map((s,i)=>buildTask(s.date,s.time,splitCount>1?" ("+(i+1)+"/"+splitCount+")":"",(groupId?{splitGroup:groupId,splitIndex:i+1,splitTotal:splitCount,duration:perSession}:{duration:evDuration})));
        commitTasks(tasks);
      }else{fallbackSchedule();}
    }catch(e){fallbackSchedule();}
    setAiLoading(false);
  };
  const removeEvent=(id)=>{
    const ev=events.find(e=>e.id===id);
    const next=events.filter(e=>e.id!==id);
    setEvents(next);lsSet("events",next);
    // If that was the last block tied to an assignment, the assignment doc
    // would otherwise silently orphan in "pending" forever — mark it
    // abandoned instead. No-op for the overwhelming majority of deletes,
    // which have no assignmentId at all.
    if(ev&&ev.assignmentId&&!next.some(e=>e.assignmentId===ev.assignmentId)){
      fsdb().collection('assignments').doc(ev.assignmentId)
        .update({status:"abandoned",updatedAt:new Date().toISOString()}).catch(()=>{});
    }
    // ev.noteId (syllabus-extracted deadlines) needs no equivalent cleanup:
    // unlike assignmentId, a note has no status enum anything else reads, so
    // there's no orphan *state* to clean up on the note side — just a
    // noteId on a now-deleted event, which disappears with the event.
  };
  const moveEvent=(id,newDate,newTime)=>{
    const ev=events.find(e=>e.id===id);
    if(ev&&ev.deadline&&newDate>ev.deadline){showDeadlineToast(ev.deadline);return;}
    const next=events.map(e=>e.id===id?{...e,date:newDate,...(newTime?{time:newTime}:{})}:e);setEvents(next);lsSet("events",next);
  };
  const markDone=(id)=>{const next=events.map(ev=>ev.id===id?{...ev,status:"done",completedAt:Date.now()}:ev);setEvents(next);lsSet("events",next);};
  const nav=(d)=>setYm(c=>{const m2=c.m+d;return {y:c.y+Math.floor(m2/12),m:((m2%12)+12)%12};});
  const toSliderVal=(v,def)=>{const n=v!=null?v:def;return n>10?n:n*100;};
  const openEdit=(ev)=>{setEditEv(ev);setEditTitle(ev.title||"");setEditDate(ev.date||dayKey());setEditTime(ev.time||"14:30");setEditDuration(ev.duration||60);setEditDeadline(ev.deadline||"");setEditDeadlineErr("");setEditPriority(toSliderVal(ev.priority,5));setEditDifficulty(toSliderVal(ev.difficulty,5));setEditMoreOpen(!!(ev.priority&&(ev.priority>10?ev.priority!==500:ev.priority!==5)));setEditSubject(ev.subject||"Chemistry");setEditKind(ev.kind||"deadline");setEditNotes(ev.notes||"");setEditOpen(true);};
  const runGroupSync=()=>{
    if(!gsDueDate.trim())return;
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
  const saveEdit=()=>{
    if(!editEv||!editTitle.trim())return;
    // Hard Wall (Tier 2) — the Edit modal must never silently save a date
    // past the task's own deadline, same rule enforced on every drag path.
    if(editDeadline&&editDate>editDeadline){setEditDeadlineErr("Can't schedule past the deadline ("+editDeadline+").");return;}
    const updated=events.map(e=>e.id===editEv.id?{...e,title:editTitle.trim(),date:editDate,time:editTime,duration:editDuration,deadline:editDeadline||null,priority:editPriority,difficulty:editDifficulty,subject:editSubject,kind:editKind,notes:editNotes}:e);
    const prefs=getSchedulePreferences();
    const next=editDate?rebalanceDay(editDate,updated,routines,prefs):updated;
    setEvents(next);lsSet("events",next);closeEdit();
  };

  // ── Tier 3: Global Emergency "Studlin Reschedule" ──────────────────────────
  // Deterministic execution engine shared by both the AI-classified path and
  // the one-click fallback presets — the model (when used at all) only ever
  // picks one of a few known intents, it never proposes dates/times itself,
  // so a misclassification can only ever result in "the wrong known action
  // ran," never an invented/hallucinated calendar change.
  const PAUSE_QUALIFYING_KINDS=new Set(["study block","deadline","reminder"]);
  const computePausePlan=(intent)=>{
    const today=dayKey();
    const isQualifying=(ev)=>ev.status==="pending"&&PAUSE_QUALIFYING_KINDS.has(ev.kind);
    let label,inWindow,computeNewDate;
    if(intent.intent==="shift"){
      const days=Math.max(1,Math.min(14,intent.days||1));
      label="Push everything back "+days+" day"+(days!==1?"s":"");
      inWindow=(ev)=>isQualifying(ev)&&ev.date>=today;
      computeNewDate=(ev)=>{const d=new Date(ev.date+"T12:00:00");d.setDate(d.getDate()+days);return dayKey(d);};
    }else if(intent.intent==="clear_day"){
      const date=intent.date||today;
      label="Clear "+date;
      inWindow=(ev)=>isQualifying(ev)&&ev.date===date;
      computeNewDate=()=>{const d=new Date(date+"T12:00:00");d.setDate(d.getDate()+1);return dayKey(d);};
    }else{
      const end=(()=>{const d=new Date();d.setDate(d.getDate()+6);return dayKey(d);})();
      label="Clear this week";
      inWindow=(ev)=>isQualifying(ev)&&ev.date>=today&&ev.date<=end;
      computeNewDate=()=>{const d=new Date();d.setDate(d.getDate()+7);return dayKey(d);};
    }
    const all=lsGet("events",[]);
    const routinesNow=getWeeklyRoutine();
    const prefsNow=getSchedulePreferences();
    const affected=all.filter(inWindow).sort((a,b)=>a.date===b.date?((a.time||"")<(b.time||"")?-1:1):(a.date<b.date?-1:1));
    let working=all.filter(ev=>!inWindow(ev));
    const moved=[],couldntMove=[];
    affected.forEach(ev=>{
      const desiredDate=computeNewDate(ev);
      const slot=findLegalSlotOrNull(working,routinesNow,prefsNow,desiredDate,ev.time||prefsNow.workStartTime,ev.duration||30,ev.deadline||null);
      if(slot){
        moved.push({id:ev.id,title:ev.title,oldDate:ev.date,oldTime:ev.time,newDate:slot.date,newTime:slot.time});
        working=working.concat([{...ev,date:slot.date,time:slot.time}]);
      }else{
        couldntMove.push({id:ev.id,title:ev.title,deadline:ev.deadline});
        working=working.concat([ev]);
      }
    });
    return {label,moved,couldntMove};
  };

  const applyPausePreset=(intent)=>{setPauseError("");setPausePreview(computePausePlan(intent));};

  const submitPauseCommand=async()=>{
    if(!pauseText.trim()||pauseLoading)return;
    setPauseLoading(true);setPauseError("");
    const today=dayKey();
    const tomorrow=dayKey(new Date(Date.now()+86400000));
    const weekday=new Date().toLocaleDateString("en-US",{weekday:"long"});
    const prompt="You are a scheduling-intent classifier for a student calendar app. Today is "+weekday+", "+today+". The student typed: \""+pauseText.trim()+"\". Classify this into EXACTLY one of these intents and respond with ONLY this JSON, no markdown fences, no explanation:\n"+
      "{\"intent\":\"shift\"|\"clear_day\"|\"clear_week\"|\"unsupported\",\"days\":<integer 1-14 or null>,\"date\":\"YYYY-MM-DD or null\"}\n"+
      "Rules: \"shift\" pushes everything from today onward back by a number of days — only use it if the student gave (or clearly implied) an explicit day count; never invent a number. \"clear_day\" empties one specific date — resolve relative phrases like \"tomorrow\" against today's date above. \"clear_week\" clears the next 7 days starting today, no parameters. If the request is ambiguous, asks for more than one action, implies permanently deleting/cancelling things, or doesn't clearly match one of these, respond \"unsupported\".\n"+
      "Examples:\n"+
      "\"I'm sick, push everything back 3 days\" -> {\"intent\":\"shift\",\"days\":3,\"date\":null}\n"+
      "\"clear my day tomorrow\" -> {\"intent\":\"clear_day\",\"days\":null,\"date\":\""+tomorrow+"\"}\n"+
      "\"I need a break this week\" -> {\"intent\":\"clear_week\",\"days\":null,\"date\":null}\n"+
      "\"push things back a couple days\" -> {\"intent\":\"unsupported\",\"days\":null,\"date\":null}\n"+
      "\"cancel everything forever\" -> {\"intent\":\"unsupported\",\"days\":null,\"date\":null}";
    try{
      const res=await authFetch("/api/chat",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({messages:[{r:"user",t:prompt}],model:"flash"})});
      const data=await res.json();
      const raw=(data.reply||"").replace(/```json?|```/g,"").trim();
      const parsed=JSON.parse(raw);
      if(!parsed||!["shift","clear_day","clear_week"].includes(parsed.intent))throw new Error("unsupported");
      if(parsed.intent==="shift"&&!(parsed.days>=1&&parsed.days<=14))throw new Error("bad-days");
      setPausePreview(computePausePlan(parsed));
    }catch(e){
      setPauseError("Couldn't understand that — try rephrasing, or use one of the quick actions below.");
    }
    setPauseLoading(false);
  };

  const confirmPausePlan=()=>{
    if(!pausePreview)return;
    const movedById=new Map(pausePreview.moved.map(m=>[m.id,m]));
    const all=lsGet("events",[]);
    const next=all.map(ev=>movedById.has(ev.id)?{...ev,date:movedById.get(ev.id).newDate,time:movedById.get(ev.id).newTime}:ev);
    setEvents(next);lsSet("events",next);
    setPausePreview(null);setPauseOpen(false);setPauseText("");
    setToast(true);setTimeout(()=>setToast(false),2200);
  };
  // Fixed real-world blocks (exam/class) only take Day/Start Time/Duration and
  // are never AI-scheduled. Reminders are simple Date/Time markers. Everything
  // else (deadline/study block) is a "task" that can be placed manually or by AI.
  const isFixedKind=evKind==="exam"||evKind==="class"||evKind==="busy block";
  const isReminderKind=evKind==="reminder";
  const isTaskKind=!isFixedKind&&!isReminderKind;
  const isChecklistMode=evKind==="deadline"&&asChecklist;
  const manualMode=isTaskKind&&!isChecklistMode&&taskMode==="manual";
  // Switching modes clears whichever fields the other path owns, so a stale
  // value left over from the previous mode can't accidentally satisfy a
  // guard (e.g. aiArrange bailing because evDate still held an old value).
  const selectTaskMode=(m)=>{
    setTaskMode(m);
    if(m==="ai"){setEvDate("");setEvTime("");}
  };
  return (
    <>
    {/* Main content — this is data-page's direct child, so it's the element
        [data-page] > * applies the (never-cleared) studlinChild entrance
        animation to. That leaves it a permanent CSS containing block for any
        position:fixed descendant (see the Dashboard modal fix for the same
        bug one level up). Every overlay below is rendered as a sibling of
        this div instead of nested inside it, so it centers against the real
        viewport regardless of scroll position or animation state. */}
    <div>
      <PH title="Studlin Calendar" sub={monthNames[ym.m]+" "+ym.y} action={<div style={{display:"flex",gap:8}}><Btn variant="danger" onClick={()=>{setPauseOpen(true);setPauseError("");setPausePreview(null);}}>Studlin Reschedule</Btn><Btn variant={editRoutineMode?"lime":"ghost"} onClick={()=>setRoutineCenterOpen(true)}>Routine</Btn><Btn onClick={()=>openNew(selDay)}>{React.createElement("span",{style:{display:"flex",alignItems:"center",gap:6}},Icon.plus,"Add task")}</Btn></div>} />
      {editRoutineMode&&(
        <div style={{display:"flex",alignItems:"center",gap:12,padding:"9px 14px",background:T.lime+"10",border:`1px solid ${T.lime}33`,borderRadius:10,marginBottom:14,fontSize:12.5,color:T.text}}>
          <span style={{flex:1}}>Editing your Weekly Routine — one-off tasks are dimmed. Click a routine block to edit it, or hover and tap × to delete it everywhere it repeats.</span>
          <BtnSm variant="subtle" onClick={()=>{setEditRoutineMode(false);setHoveredRoutineId(null);}}>Done</BtnSm>
        </div>
      )}
      <div style={{display:"flex",gap:6,marginBottom:20}}>
        {["monthly","weekly"].map(v=>(
          <button key={v} onClick={()=>setCalView(v)} style={{padding:"6px 14px",borderRadius:7,fontSize:12,fontWeight:600,cursor:"pointer",background:calView===v?T.lime+"14":"transparent",color:calView===v?T.lime:T.muted,border:`1px solid ${calView===v?T.lime+"44":T.border}`,fontFamily:T.font,transition:"all 0.15s",textTransform:"capitalize"}}>{v}</button>
        ))}
      </div>
      {calView==="monthly"&&(<CollapsibleAgendaLayout isAgendaCollapsed={isAgendaCollapsed} setIsAgendaCollapsed={setIsAgendaCollapsed}
        agendaProps={{selDay,dayEvents,upcoming,relDay,niceDate,fmtTime,colorOf,openNew,openEdit,editRoutineMode,hoveredRoutineId,setHoveredRoutineId,routines,openRoutineEdit,deleteRoutineItem,markDone,removeEvent,setSelDay,setYm,dragId,setDragId,openReschedule:setRescheduleTask}}>
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
              const evs=(byDay[c.key]||[]).filter(ev=>ev.kind!=="free period");
              const isToday=c.key===todayK;
              const isSel=c.key===selDay;
              return (
                <div key={i} onClick={()=>{setSelDay(c.key);}} onDoubleClick={()=>openNew(c.key)}
                  onDragOver={e=>e.preventDefault()} onDrop={e=>{e.preventDefault();if(dragId){moveEvent(dragId,c.key);setDragId(null);}}}
                  style={{minHeight:64,minWidth:0,borderRadius:9,padding:"6px 7px",cursor:"pointer",background:isSel?T.card2:"transparent",border:"1px solid "+(isSel?T.lime+"55":"transparent"),transition:"all 0.12s",opacity:c.out?0.35:1}}>
                  <div style={{display:"flex",justifyContent:"flex-start"}}>
                    <span style={{width:22,height:22,borderRadius:"50%",display:"inline-flex",alignItems:"center",justifyContent:"center",fontSize:12,fontWeight:isToday?700:500,background:isToday?T.lime:"transparent",color:isToday?T.ink:c.out?T.faint:T.text}}>{c.d}</span>
                  </div>
                  <div style={{display:"flex",flexDirection:"column",gap:2,marginTop:3,minWidth:0}}>
                    {evs.slice(0,2).map((ev,j)=>{
                      const over=daysOverdue(ev);
                      const tagColor=over>0?T.red:colorOf(ev.subject);
                      const isExam=ev.kind==="exam";
                      const isRoutine=!!ev.isRoutine;
                      const dimmedByRoutineMode=editRoutineMode&&!isRoutine;
                      return <div key={j} style={{fontSize:9,fontWeight:600,color:tagColor,background:tagColor+(isExam?"22":"16"),border:isRoutine&&editRoutineMode?`1px solid ${T.lime}`:isExam?`1px solid ${tagColor}`:"none",borderRadius:4,padding:"2px 5px",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis",maxWidth:"100%",display:"flex",alignItems:"center",gap:3,opacity:dimmedByRoutineMode?0.3:1}}>
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
      </CollapsibleAgendaLayout>)}
      {calView==="weekly"&&(<CollapsibleAgendaLayout isAgendaCollapsed={isAgendaCollapsed} setIsAgendaCollapsed={setIsAgendaCollapsed}
        agendaProps={{selDay,dayEvents,upcoming,relDay,niceDate,fmtTime,colorOf,openNew,openEdit,editRoutineMode,hoveredRoutineId,setHoveredRoutineId,routines,openRoutineEdit,deleteRoutineItem,markDone,removeEvent,setSelDay,setYm,dragId,setDragId,openReschedule:setRescheduleTask}}>
        <WeeklyPlanner events={events} setEvents={setEvents} moveEvent={moveEvent} weekOffset={weekOffset} setWeekOffset={setWeekOffset} todayK={todayK} colorOf={colorOf} fmtTime={fmtTime} openNew={openNew} openEdit={openEdit}
          routines={routines} editRoutineMode={editRoutineMode} hoveredRoutineId={hoveredRoutineId} setHoveredRoutineId={setHoveredRoutineId}
          onEditRoutine={(routineId)=>{const rule=routines.find(r=>r.id===routineId);if(rule)openRoutineEdit(rule);}} onDeleteRoutine={deleteRoutineItem} schoolWindow={schoolWindow}
          selDay={selDay} setSelDay={setSelDay} isAgendaCollapsed={isAgendaCollapsed} />
      </CollapsibleAgendaLayout>)}
    </div>
      {subjOnboardOpen&&(
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.72)",zIndex:200,display:"flex",alignItems:"center",justifyContent:"center"}}>
          <div style={{background:T.card,border:`1px solid ${T.border}`,borderRadius:20,padding:28,width:520,maxWidth:"90vw",maxHeight:"82vh",overflowY:"auto",boxShadow:"0 32px 64px -16px rgba(0,0,0,0.6)"}}>
            <div style={{fontSize:20,fontWeight:700,color:T.white,letterSpacing:"-0.02em",marginBottom:4}}>Set up your subjects</div>
            <div style={{fontSize:13,color:T.muted,marginBottom:20}}>Add your classes and pick a color for each. You can always manage these in Settings.</div>
            {onbSubjs.map((s,i)=>(
              <div key={i} style={{display:"flex",alignItems:"center",gap:10,marginBottom:10}}>
                <div style={{display:"flex",gap:4,flexShrink:0,flexWrap:"wrap",maxWidth:120}}>
                  {SUBJECT_COLORS.map(c=>(
                    <div key={c} onClick={()=>setOnbSubjs(a=>a.map((x,j)=>j===i?{...x,color:c}:x))} title={c} style={{width:14,height:14,borderRadius:"50%",background:c,cursor:"pointer",border:s.color===c?`2.5px solid ${T.white}`:`2px solid transparent`,boxSizing:"border-box",flexShrink:0,transition:"transform 0.12s",transform:s.color===c?"scale(1.25)":"scale(1)"}} />
                  ))}
                </div>
                <div style={{width:10,height:10,borderRadius:"50%",background:s.color,flexShrink:0}} />
                <input value={s.label} onChange={e=>setOnbSubjs(a=>a.map((x,j)=>j===i?{...x,label:e.target.value}:x))} placeholder={`Class ${i+1} (e.g. Calculus)`} style={{flex:1,background:T.card2,border:`1px solid ${T.border}`,borderRadius:8,padding:"8px 12px",color:T.text,fontSize:13,fontFamily:T.font,outline:"none"}} />
                <button onClick={()=>setOnbSubjs(a=>a.filter((_,j)=>j!==i))} style={{background:"none",border:"none",color:T.muted,cursor:"pointer",fontSize:18,padding:"2px 6px",fontFamily:T.font,lineHeight:1}}>×</button>
              </div>
            ))}
            <button onClick={()=>setOnbSubjs(a=>[...a,{id:String(Date.now()),label:"",color:SUBJECT_COLORS[a.length%SUBJECT_COLORS.length]}])} style={{background:"none",border:`1px dashed ${T.border}`,color:T.muted,cursor:"pointer",borderRadius:8,padding:"8px 14px",fontSize:12,fontFamily:T.font,marginTop:4,width:"100%"}}>+ Add another class</button>
            <div style={{display:"flex",gap:10,marginTop:20}}>
              <Btn onClick={()=>{const valid=onbSubjs.filter(s=>s.label.trim());if(valid.length>0)saveSubjects(valid);lsSet("subjects-configured",true);setUserSubjectsState(getSubjects());setSubjOnboardOpen(false);}}>Save my classes</Btn>
              <Btn variant="subtle" onClick={()=>{lsSet("subjects-configured",true);setSubjOnboardOpen(false);}}>Skip / I'm not a student</Btn>
            </div>
          </div>
        </div>
      )}
      {toast&&(
        <div style={{position:"fixed",bottom:24,left:"50%",transform:"translateX(-50%)",zIndex:80,background:T.lime,color:T.ink,fontSize:12.5,fontWeight:600,padding:"10px 18px",borderRadius:99,boxShadow:"0 14px 30px -10px rgba(0,0,0,0.5)",display:"flex",alignItems:"center",gap:8}}>{Icon.check} Task added</div>
      )}
      {deadlineToast&&(
        <div style={{position:"fixed",bottom:24,left:"50%",transform:"translateX(-50%)",zIndex:80,background:T.red,color:"#fff",fontSize:12.5,fontWeight:600,padding:"10px 18px",borderRadius:99,boxShadow:"0 14px 30px -10px rgba(0,0,0,0.5)"}}>{deadlineToast}</div>
      )}
      {rescheduleToast&&(
        <div style={{position:"fixed",bottom:24,left:"50%",transform:"translateX(-50%)",zIndex:80,background:T.lime,color:T.ink,fontSize:12.5,fontWeight:600,padding:"10px 18px",borderRadius:99,boxShadow:"0 14px 30px -10px rgba(0,0,0,0.5)",display:"flex",alignItems:"center",gap:8}}>{Icon.check} {rescheduleToast}</div>
      )}
      {reconcileToast&&(
        <div style={{position:"fixed",bottom:24,left:"50%",transform:"translateX(-50%)",zIndex:80,background:T.amber,color:T.ink,fontSize:12.5,fontWeight:600,padding:"10px 18px",borderRadius:99,boxShadow:"0 14px 30px -10px rgba(0,0,0,0.5)",display:"flex",alignItems:"center",gap:8}}>{Icon.check} {reconcileToast}</div>
      )}
      {rescheduleTask&&(
        <RescheduleModal task={rescheduleTask} events={events} onClose={()=>setRescheduleTask(null)} commit={(next,evictedCount)=>{
          setEvents(next);lsSet("events",next);
          setRescheduleToast(evictedCount>0?`Task rescheduled — ${evictedCount} other${evictedCount!==1?"s":""} shifted to make room.`:"Task rescheduled.");
          setTimeout(()=>setRescheduleToast(""),2800);
        }} />
      )}
      <Modal open={newOpen} onClose={resetForm} title="New task" sub="Add details and let Studlin schedule it, or place it manually." width={580}
        footer={
          isChecklistMode
            ? <><Btn variant="subtle" onClick={resetForm}>Cancel</Btn><Btn onClick={saveChecklistItem} disabled={!evTitle.trim()} style={{flex:1,justifyContent:"center",opacity:evTitle.trim()?1:0.45}}>Add to Checklist</Btn></>
            : isReminderKind||isFixedKind
              ? <><Btn variant="subtle" onClick={resetForm}>Cancel</Btn><Btn onClick={saveManual} disabled={!(evTitle.trim()&&evDate.trim()&&evTime.trim())} style={{opacity:evTitle.trim()&&evDate.trim()&&evTime.trim()?1:0.45}}>{isReminderKind?"Save reminder":"Save"}</Btn></>
              : taskMode==="manual"
                ? <><Btn variant="subtle" onClick={resetForm}>Cancel</Btn><Btn onClick={saveManual} disabled={!evTitle.trim()||!evDate.trim()||!evTime.trim()} style={{flex:1,justifyContent:"center",opacity:evTitle.trim()&&evDate.trim()&&evTime.trim()?1:0.45}}>Save to Calendar</Btn></>
                : <><Btn variant="subtle" onClick={resetForm}>Cancel</Btn><Btn onClick={aiArrange} disabled={aiLoading||!evTitle.trim()} style={{flex:1,justifyContent:"center",opacity:aiLoading?1:(!evTitle.trim()?0.45:1)}}>{aiLoading?"Scheduling...":"Add Task with AI"}</Btn></>
        }>
        <button type="button" onClick={()=>{resetForm();setBrainDumpOpen(true);}} style={{display:"block",width:"100%",textAlign:"left",background:T.lime+"0d",border:`1px solid ${T.lime}33`,borderRadius:10,padding:"10px 12px",marginBottom:16,cursor:"pointer",fontFamily:T.font,fontSize:12.5,color:T.lime,fontWeight:600}}>
          Got more than one thing on your plate? Brain dump it all at once →
        </button>
        <Field label="Title"><Input placeholder="e.g. Study Bio chapter 4-6" value={evTitle} onChange={ev=>setEvTitle(ev.target.value)} autoFocus /></Field>

        <Field label="Type" hint={isFixedKind?"Fixed real-world block — Studlin will never move or reschedule this.":"Choose what kind of entry this is"}>
          <SelectChip options={["study block",{value:"deadline",label:"To-Do"},"exam","class","reminder","busy block"]} value={evKind} onChange={onEvKindChange} />
        </Field>

        {evKind==="deadline"&&(
          <label className="checkbox" onClick={()=>setAsChecklist(s=>!s)} style={{display:"flex",alignItems:"center",gap:8,cursor:"pointer",marginBottom:14,fontSize:12.5,color:T.text}}>
            <span style={{width:16,height:16,borderRadius:4,border:`1.5px solid ${asChecklist?T.lime:T.border}`,background:asChecklist?T.lime:"transparent",display:"grid",placeItems:"center",flexShrink:0,color:T.ink}}>{asChecklist&&Icon.check}</span>
            No specific time — add to checklist instead
            <span style={{color:T.muted,fontWeight:400}}>— skips the calendar, shows up as a checkbox on your Dashboard</span>
          </label>
        )}

        <Field label="Subject"><SelectChip options={SUBJ} value={evSubject} onChange={setEvSubject} /></Field>
        {evSubject==="Other"&&<Field label="Custom subject"><Input placeholder="e.g. Drivers ed, SAT prep, club..." value={evCustom} onChange={ev=>setEvCustom(ev.target.value)} /></Field>}

        {isChecklistMode&&(
          <Field label="Due date (optional)"><Input type="date" value={evDeadline} onChange={ev=>setEvDeadline(ev.target.value)} /></Field>
        )}

        {isTaskKind&&!isChecklistMode&&(
          <Field label="Scheduling">
            <div style={{display:"flex",gap:6,padding:3,background:T.card2,border:`1px solid ${T.border}`,borderRadius:10,marginBottom:2}}>
              <button type="button" onClick={()=>selectTaskMode("ai")} style={{flex:1,padding:"8px 10px",borderRadius:7,border:"none",background:taskMode==="ai"?T.lime:"transparent",color:taskMode==="ai"?T.ink:T.muted,fontSize:12.5,fontWeight:taskMode==="ai"?700:500,cursor:"pointer",fontFamily:T.font,transition:"all 0.15s"}}>AI Schedule Mode</button>
              <button type="button" onClick={()=>selectTaskMode("manual")} style={{flex:1,padding:"8px 10px",borderRadius:7,border:"none",background:taskMode==="manual"?T.lime:"transparent",color:taskMode==="manual"?T.ink:T.muted,fontSize:12.5,fontWeight:taskMode==="manual"?700:500,cursor:"pointer",fontFamily:T.font,transition:"all 0.15s"}}>Manual Placement</button>
            </div>
          </Field>
        )}

        {!isTaskKind&&(
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
            <Field label="Date"><Input type="date" value={evDate} onChange={ev=>setEvDate(ev.target.value)} /></Field>
            <Field label={isReminderKind?"Reminder time":"Start time"}><TimeInput value={evTime} onChange={setEvTime} /></Field>
          </div>
        )}

        {isFixedKind&&(
          <>
            <Field label="Duration (minutes)" hint="How long this occupies on your calendar"><NumField min={5} max={480} fallback={5} value={evDuration} onChange={setEvDuration} /></Field>
            <label className="checkbox" onClick={()=>setEvSaveToRoutine(s=>!s)} style={{display:"flex",alignItems:"center",gap:8,cursor:"pointer",marginBottom:14,fontSize:12.5,color:T.text}}>
              <span style={{width:16,height:16,borderRadius:4,border:`1.5px solid ${evSaveToRoutine?T.lime:T.border}`,background:evSaveToRoutine?T.lime:"transparent",display:"grid",placeItems:"center",flexShrink:0,color:T.ink}}>{evSaveToRoutine&&Icon.check}</span>
              Save to my Weekly Routine
              <span style={{color:T.muted,fontWeight:400}}>— repeats every week on this day instead of just once</span>
            </label>
          </>
        )}

        {isTaskKind&&!isChecklistMode&&taskMode==="manual"&&(
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
            <Field label="Date"><Input type="date" value={evDate} onChange={ev=>setEvDate(ev.target.value)} /></Field>
            <Field label="Start Time"><TimeInput value={evTime} onChange={setEvTime} /></Field>
          </div>
        )}

        {isTaskKind&&!isChecklistMode&&taskMode==="ai"&&(
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
            <Field label="Due Date & Time" hint="When this must be done by">
              <Input type="date" value={evDeadline} onChange={ev=>setEvDeadline(ev.target.value)} />
            </Field>
            <Field label="Due time"><TimeInput value={evDeadlineTime} onChange={setEvDeadlineTime} /></Field>
          </div>
        )}

        {isTaskKind&&!isChecklistMode&&(
          <Field label="Duration (minutes)" hint="How long you plan to spend">
            <NumField min={5} max={480} fallback={5} value={evDuration} onChange={setEvDuration} />
            {(()=>{const s=suggestDurationFor(evSubject,evKind);return s&&s!==evDuration&&(
              <div style={{fontSize:11.5,color:T.muted,marginTop:6}}>Similar tasks usually take you ~{s}m — <button type="button" onClick={()=>setEvDuration(s)} style={{background:"none",border:"none",color:T.lime,cursor:"pointer",fontSize:11.5,fontFamily:T.font,padding:0,textDecoration:"underline"}}>use this</button></div>
            );})()}
          </Field>
        )}

        {isTaskKind&&!isChecklistMode&&taskMode==="ai"&&(
          evMoreOpen ? (
            <>
              <Field label={`Impact: ${Math.round(evPriority/10)}%`} hint="How critical this is, independent of its due date — higher-impact tasks get scheduled earlier">
                <div style={{display:"flex",alignItems:"center",gap:12}}>
                  <span style={{fontSize:11,color:T.muted,width:28}}>Low</span>
                  <div style={{flex:1,position:"relative",paddingTop:24}}>
                    <div style={{position:"absolute",top:0,left:`${evPriority/10}%`,transform:"translateX(-50%)",fontSize:10,fontWeight:700,color:T.lime,background:T.lime+"18",border:`1px solid ${T.lime}44`,borderRadius:5,padding:"2px 7px",whiteSpace:"nowrap",pointerEvents:"none"}}>{prioLabel(evPriority)}</div>
                    <input type="range" min={0} max={1000} value={evPriority} onChange={ev=>setEvPriority(+ev.target.value)} style={{width:"100%",accentColor:T.lime,height:6,borderRadius:3,cursor:"pointer"}} />
                  </div>
                  <span style={{fontSize:11,color:T.muted,width:40,textAlign:"right"}}>Urgent</span>
                </div>
              </Field>
              <Field label={`Difficulty: ${diffLabel(evDifficulty)}`} hint="How hard this task is for you — helps Studlin schedule it when your energy matches">
                <div style={{display:"flex",alignItems:"center",gap:12}}>
                  <span style={{fontSize:11,color:T.muted,width:28}}>Easy</span>
                  <div style={{flex:1,position:"relative",paddingTop:24}}>
                    <div style={{position:"absolute",top:0,left:`${evDifficulty/10}%`,transform:"translateX(-50%)",fontSize:10,fontWeight:700,color:T.lime,background:T.lime+"18",border:`1px solid ${T.lime}44`,borderRadius:5,padding:"2px 7px",whiteSpace:"nowrap",pointerEvents:"none"}}>{diffLabel(evDifficulty)}</div>
                    <input type="range" min={0} max={1000} value={evDifficulty} onChange={ev=>setEvDifficulty(+ev.target.value)} style={{width:"100%",accentColor:T.lime,height:6,borderRadius:3,cursor:"pointer"}} />
                  </div>
                  <span style={{fontSize:11,color:T.muted,width:40,textAlign:"right"}}>Hard</span>
                </div>
              </Field>
            </>
          ) : (
            <button type="button" onClick={()=>setEvMoreOpen(true)} style={{background:"none",border:"none",color:T.muted,fontSize:12.5,fontFamily:T.font,cursor:"pointer",padding:"4px 0",marginBottom:14,textDecoration:"underline"}}>+ More details (impact &amp; difficulty)</button>
          )
        )}

        {isTaskKind&&!isChecklistMode&&(
          <div style={{background:T.card2,border:`1px solid ${T.border}`,borderRadius:10,padding:"12px 14px",marginBottom:14}}>
            <div onClick={()=>setEvSplitEnabled(s=>!s)} style={{display:"flex",justifyContent:"space-between",alignItems:"center",cursor:"pointer"}}>
              <div><div style={{fontSize:12.5,fontWeight:600,color:T.text}}>Split into sessions</div><div style={{fontSize:11,color:T.muted,marginTop:2}}>Spread this task across multiple days</div></div>
              <div style={{width:36,height:20,borderRadius:10,background:evSplitEnabled?T.lime:T.faint,position:"relative",transition:"background 0.2s",cursor:"pointer"}}><div style={{width:16,height:16,borderRadius:"50%",background:"#fff",position:"absolute",top:2,left:evSplitEnabled?18:2,transition:"left 0.2s"}} /></div>
            </div>
            {evSplitEnabled&&(
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginTop:12,paddingTop:12,borderTop:`1px solid ${T.border}`}}>
                <Field label="Number of sessions"><NumField min={2} max={10} fallback={2} value={evSplitCount} onChange={setEvSplitCount} /></Field>
                <Field label="Per session"><div style={{fontSize:14,fontWeight:600,color:T.lime,padding:"10px 0"}}>{Math.round(evDuration/evSplitCount)} min each</div></Field>
              </div>
            )}
          </div>
        )}

        <Field label="Notes (optional)"><Textarea placeholder="e.g. Bring calculator, covers chapters 4 to 6." value={evNotes} onChange={ev=>setEvNotes(ev.target.value)} /></Field>
      </Modal>

      {/* ── BRAIN DUMP — tell Studlin everything at once instead of one task at a time ── */}
      <Modal open={brainDumpOpen} onClose={()=>{setBrainDumpOpen(false);setBrainDumpText("");}} title="Brain dump" sub="Tell Studlin everything you need to do — it'll sort out the rest." width={560}
        footer={<><Btn variant="subtle" onClick={()=>{setBrainDumpOpen(false);setBrainDumpText("");}}>Cancel</Btn><Btn onClick={submitBrainDump} disabled={brainDumpLoading||!brainDumpText.trim()} style={{flex:1,justifyContent:"center",opacity:brainDumpLoading?1:(!brainDumpText.trim()?0.45:1)}}>{brainDumpLoading?"Sorting it out...":"Sort it out →"}</Btn></>}>
        <Textarea placeholder="e.g. I have chem homework, need to email my counselor about my schedule, and my bio project is due Friday..." value={brainDumpText} onChange={e=>setBrainDumpText(e.target.value)} style={{minHeight:140}} autoFocus />
      </Modal>

      {/* ── BRAIN DUMP REVIEW — preview-then-commit, same discipline as the syllabus review in Notes ── */}
      <Modal open={!!brainDumpReview} onClose={()=>setBrainDumpReview(null)} title="Review your plan" sub="Studlin sorted these out — check them before they're added." width={620}
        footer={<>
          <Btn variant="subtle" onClick={()=>setBrainDumpReview(null)}>Cancel</Btn>
          <Btn disabled={!brainDumpReview||brainDumpReview.items.filter(i=>i.include).length===0} onClick={()=>{
            const included=brainDumpReview.items.filter(i=>i.include);
            commitBrainDump(included);
            setBrainDumpReview(null);
          }}>{"Add "+(brainDumpReview?brainDumpReview.items.filter(i=>i.include).length:0)+" to your plan →"}</Btn>
        </>}>
        {brainDumpReview&&brainDumpReview.items.length===0&&(
          <div style={{textAlign:"center",padding:"24px 0",color:T.muted,fontSize:13}}>Couldn't find anything in that — try rephrasing.</div>
        )}
        <div style={{display:"flex",flexDirection:"column",gap:10,maxHeight:400,overflowY:"auto"}}>
          {brainDumpReview&&brainDumpReview.items.map((it,i)=>(
            <div key={it.id} style={{padding:"12px 14px",borderRadius:10,border:`1px solid ${T.border}`,background:it.include?T.card2:T.card,opacity:it.include?1:0.55}}>
              <div style={{display:"flex",alignItems:"flex-start",gap:10}}>
                <input type="checkbox" checked={it.include} onChange={()=>setBrainDumpReview(r=>({...r,items:r.items.map((x,xi)=>xi===i?{...x,include:!x.include}:x)}))} style={{marginTop:10,cursor:"pointer"}} />
                <div style={{flex:1}}>
                  <div style={{display:"flex",gap:8,marginBottom:8}}>
                    <Input value={it.title} onChange={ev=>setBrainDumpReview(r=>({...r,items:r.items.map((x,xi)=>xi===i?{...x,title:ev.target.value}:x)}))} style={{flex:1}} />
                  </div>
                  <div style={{display:"flex",alignItems:"center",gap:8,flexWrap:"wrap"}}>
                    <SelectChip options={[{value:"study",label:"Study Session"},{value:"todo",label:"To-Do"}]} value={it.kind} onChange={v=>setBrainDumpReview(r=>({...r,items:r.items.map((x,xi)=>xi===i?{...x,kind:v}:x)}))} />
                    {it.kind==="study"&&(
                      <div style={{display:"flex",alignItems:"center",gap:6}}>
                        <NumField min={5} max={480} fallback={30} value={it.durationMin} onChange={v=>setBrainDumpReview(r=>({...r,items:r.items.map((x,xi)=>xi===i?{...x,durationMin:v}:x)}))} />
                        <span style={{fontSize:11.5,color:T.muted}}>min</span>
                      </div>
                    )}
                    {it.kind==="study"&&it.needsDuration&&<span style={{fontSize:10.5,color:T.amber,fontWeight:600,background:T.amber+"14",border:`1px solid ${T.amber}33`,borderRadius:6,padding:"3px 8px"}}>Wasn't sure how long this takes — check the estimate</span>}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Modal>
      <Modal open={editOpen} onClose={closeEdit} title="Edit task" sub="Update this task's details." width={580}
        footer={<><Btn variant="subtle" onClick={closeEdit}>Cancel</Btn><Btn onClick={saveEdit} disabled={!editTitle.trim()} style={{opacity:editTitle.trim()?1:0.45}}>Save changes</Btn></>}>
        <Field label="Title"><Input value={editTitle} onChange={e=>setEditTitle(e.target.value)} autoFocus /></Field>
        <Field label="Type"><SelectChip options={["study block",{value:"deadline",label:"To-Do"},"exam","class","reminder","busy block"]} value={editKind} onChange={setEditKind} /></Field>
        <Field label="Subject"><SelectChip options={SUBJ} value={editSubject} onChange={setEditSubject} /></Field>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
          <Field label="Scheduled date"><Input type="date" value={editDate} onChange={e=>{setEditDate(e.target.value);setEditDeadlineErr("");}} /></Field>
          <Field label={editKind==="reminder"?"Reminder time":"Start time"}><TimeInput value={editTime} onChange={setEditTime} /></Field>
        </div>
        {editDeadlineErr&&<div style={{fontSize:12,color:T.red,marginTop:-8,marginBottom:14}}>{editDeadlineErr}</div>}
        {editKind!=="reminder"&&(
          <Field label="Duration (minutes)"><NumField min={5} max={480} fallback={5} value={editDuration} onChange={setEditDuration} /></Field>
        )}
        {editKind!=="exam"&&editKind!=="class"&&editKind!=="reminder"&&(
          <>
            <Field label="Deadline" hint="When this must be done by"><Input type="date" value={editDeadline} onChange={e=>{setEditDeadline(e.target.value);setEditDeadlineErr("");}} /></Field>
            {editMoreOpen ? (
              <>
                <Field label={`Impact: ${Math.round(editPriority/10)}%`} hint="How critical this is, independent of its due date — higher-impact tasks get scheduled earlier">
                  <div style={{display:"flex",alignItems:"center",gap:12}}>
                    <span style={{fontSize:11,color:T.muted,width:28}}>Low</span>
                    <div style={{flex:1,position:"relative",paddingTop:24}}>
                      <div style={{position:"absolute",top:0,left:`${editPriority/10}%`,transform:"translateX(-50%)",fontSize:10,fontWeight:700,color:T.lime,background:T.lime+"18",border:`1px solid ${T.lime}44`,borderRadius:5,padding:"2px 7px",whiteSpace:"nowrap",pointerEvents:"none"}}>{prioLabel(editPriority)}</div>
                      <input type="range" min={0} max={1000} value={editPriority} onChange={e=>setEditPriority(+e.target.value)} style={{width:"100%",accentColor:T.lime,height:6,borderRadius:3,cursor:"pointer"}} />
                    </div>
                    <span style={{fontSize:11,color:T.muted,width:40,textAlign:"right"}}>Urgent</span>
                  </div>
                </Field>
                <Field label={`Difficulty: ${diffLabel(editDifficulty)}`} hint="How hard this task is for you — helps Studlin schedule it when your energy matches">
                  <div style={{display:"flex",alignItems:"center",gap:12}}>
                    <span style={{fontSize:11,color:T.muted,width:28}}>Easy</span>
                    <div style={{flex:1,position:"relative",paddingTop:24}}>
                      <div style={{position:"absolute",top:0,left:`${editDifficulty/10}%`,transform:"translateX(-50%)",fontSize:10,fontWeight:700,color:T.lime,background:T.lime+"18",border:`1px solid ${T.lime}44`,borderRadius:5,padding:"2px 7px",whiteSpace:"nowrap",pointerEvents:"none"}}>{diffLabel(editDifficulty)}</div>
                      <input type="range" min={0} max={1000} value={editDifficulty} onChange={e=>setEditDifficulty(+e.target.value)} style={{width:"100%",accentColor:T.lime,height:6,borderRadius:3,cursor:"pointer"}} />
                    </div>
                    <span style={{fontSize:11,color:T.muted,width:40,textAlign:"right"}}>Hard</span>
                  </div>
                </Field>
              </>
            ) : (
              <button type="button" onClick={()=>setEditMoreOpen(true)} style={{background:"none",border:"none",color:T.muted,fontSize:12.5,fontFamily:T.font,cursor:"pointer",padding:"4px 0",marginBottom:14,textDecoration:"underline"}}>+ More details (impact &amp; difficulty)</button>
            )}
          </>
        )}
        <Field label="Notes (optional)"><Textarea value={editNotes} onChange={e=>setEditNotes(e.target.value)} /></Field>
      </Modal>
      <Modal open={pauseOpen} onClose={()=>{setPauseOpen(false);setPausePreview(null);setPauseError("");}}
        title={pausePreview?pausePreview.label:"Studlin Reschedule"}
        sub={pausePreview?(pausePreview.moved.length+" task"+(pausePreview.moved.length!==1?"s":"")+" affected"):"Tell Studlin what's going on — it'll reschedule around it."}
        width={520}
        footer={pausePreview?(
          <><Btn variant="subtle" onClick={()=>setPausePreview(null)}>Cancel</Btn><Btn onClick={confirmPausePlan}>Confirm</Btn></>
        ):null}>
        {!pausePreview&&(<>
          <Textarea placeholder={'e.g. "I\'m sick, push everything back 3 days" or "clear my day tomorrow"'} value={pauseText} onChange={e=>setPauseText(e.target.value)} />
          {pauseError&&<div style={{fontSize:12,color:T.red,marginTop:8}}>{pauseError}</div>}
          <Btn onClick={submitPauseCommand} disabled={!pauseText.trim()||pauseLoading} style={{marginTop:12,width:"100%",justifyContent:"center",opacity:!pauseText.trim()||pauseLoading?0.5:1}}>{pauseLoading?"Thinking…":"Go"}</Btn>
          <div style={{fontSize:11,color:T.muted,marginTop:20,marginBottom:8,textTransform:"uppercase",letterSpacing:"0.06em",fontWeight:600}}>Or pick one</div>
          <div style={{display:"flex",flexDirection:"column",gap:8}}>
            <Btn variant="subtle" onClick={()=>applyPausePreset({intent:"shift",days:1})}>Push everything back 1 day</Btn>
            <Btn variant="subtle" onClick={()=>applyPausePreset({intent:"shift",days:3})}>Push everything back 3 days</Btn>
            <Btn variant="subtle" onClick={()=>applyPausePreset({intent:"clear_day",date:dayKey()})}>Clear today</Btn>
            <Btn variant="subtle" onClick={()=>applyPausePreset({intent:"clear_week"})}>Clear this week</Btn>
          </div>
        </>)}
        {pausePreview&&(<>
          {pausePreview.moved.length>0&&(
            <div style={{display:"flex",flexDirection:"column",gap:7,marginBottom:pausePreview.couldntMove.length?18:0,maxHeight:220,overflowY:"auto"}}>
              {pausePreview.moved.map(m=>(
                <div key={m.id} style={{display:"flex",alignItems:"center",gap:10,padding:"9px 12px",background:T.card2,borderRadius:8,border:`1px solid ${T.border}`}}>
                  <div style={{flex:1,fontSize:13,color:T.text,fontWeight:500}}>{m.title}</div>
                  <div style={{fontSize:11,color:T.muted,flexShrink:0}}>{m.oldDate} {m.oldTime} → <strong style={{color:T.lime}}>{m.newDate} {m.newTime}</strong></div>
                </div>
              ))}
            </div>
          )}
          {pausePreview.couldntMove.length>0&&(
            <div>
              <div style={{fontSize:11,fontWeight:700,color:T.red,textTransform:"uppercase",letterSpacing:"0.06em",marginBottom:8}}>Couldn't reschedule — deadline conflict ({pausePreview.couldntMove.length})</div>
              <div style={{display:"flex",flexDirection:"column",gap:7,maxHeight:160,overflowY:"auto"}}>
                {pausePreview.couldntMove.map(m=>(
                  <div key={m.id} style={{display:"flex",alignItems:"center",gap:10,padding:"9px 12px",background:T.red+"0d",borderRadius:8,border:`1px solid ${T.red}33`}}>
                    <div style={{flex:1,fontSize:13,color:T.text,fontWeight:500}}>{m.title}</div>
                    <div style={{fontSize:11,color:T.red,flexShrink:0}}>Deadline {m.deadline}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
          {pausePreview.moved.length===0&&pausePreview.couldntMove.length===0&&(
            <div style={{fontSize:13,color:T.muted}}>Nothing to reschedule.</div>
          )}
        </>)}
      </Modal>
      <RoutineWizardModal open={routineWizardOpen&&!subjOnboardOpen} initialStatus={getProfile().status} existingRoutines={routines} onFinish={finishRoutineWizard} onSkip={skipRoutineWizard} />
      <RoutineControlCenterModal open={routineCenterOpen} onClose={()=>setRoutineCenterOpen(false)} routines={routines} fmtTime={fmtTime}
        onEditRoutine={openRoutineEdit} onDeleteRoutine={deleteRoutineItem}
        onAddRoutine={(rule)=>persistRoutines([...routines,{id:String(Date.now()+Math.random()*1000),...rule,subject:""}])}
        onEditOnCalendar={()=>{setRoutineCenterOpen(false);setEditRoutineMode(true);}} />
      <Modal open={!!routineEditItem} onClose={closeRoutineEdit} title="Edit routine block" sub="Changes apply to every week this repeats." width={480}
        footer={
          <div style={{display:"flex",width:"100%",justifyContent:"space-between",alignItems:"center"}}>
            <Btn variant="danger" onClick={deleteRoutineEdit}>Delete</Btn>
            <div style={{display:"flex",gap:10}}>
              <Btn variant="subtle" onClick={closeRoutineEdit}>Cancel</Btn>
              <Btn onClick={saveRoutineEdit} disabled={!riTitle.trim()||riDays.length===0} style={{opacity:!riTitle.trim()||riDays.length===0?0.45:1}}>Save changes</Btn>
            </div>
          </div>
        }>
        <Field label="Title"><Input value={riTitle} onChange={e=>setRiTitle(e.target.value)} autoFocus /></Field>
        <Field label="Type"><SelectChip options={[{value:"class",label:"Class"},{value:"busy",label:"Activity"},{value:"free",label:"Free Period"}]} value={riKind} onChange={setRiKind} /></Field>
        <Field label="Repeats on" hint={riDays.length===0?"Pick at least one day":undefined}>
          <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
            {["Mon","Tue","Wed","Thu","Fri","Sat","Sun"].map((d,i)=>{
              const sel=riDays.includes(i);
              return <button key={i} type="button" onClick={()=>setRiDays(sel?riDays.filter(x=>x!==i):[...riDays,i])} style={{padding:"6px 12px",borderRadius:7,fontSize:12,fontWeight:sel?600:400,cursor:"pointer",border:`1px solid ${sel?T.lime+"66":T.border}`,background:sel?T.lime+"14":"transparent",color:sel?T.lime:T.muted,fontFamily:T.font}}>{d}</button>;
            })}
          </div>
        </Field>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
          <Field label="Start time"><TimeInput value={riStartTime} onChange={setRiStartTime} /></Field>
          <Field label="Duration (minutes)"><NumField min={5} max={480} fallback={30} value={riDuration} onChange={setRiDuration} /></Field>
        </div>
        <Field label="Subject"><SelectChip options={SUBJ} value={riSubject} onChange={setRiSubject} /></Field>
      </Modal>
      <Modal open={groupSyncOpen} onClose={()=>setGroupSyncOpen(false)} title="Group Smart Match" sub="Find a time slot when everyone is free." width={540}
        footer={gsStep===1?<><Btn variant="subtle" onClick={()=>setGroupSyncOpen(false)}>Cancel</Btn><Btn onClick={runGroupSync} disabled={!gsDueDate.trim()} style={{opacity:gsDueDate.trim()?1:0.45}}>Find slots</Btn></>:<><Btn variant="subtle" onClick={()=>{setGsStep(1);setGsResults(null);}}>← Back</Btn><Btn variant="subtle" onClick={()=>setGroupSyncOpen(false)}>Done</Btn></>}>
        {gsStep===1&&(
          <>
            <Field label="Project due date"><Input type="date" value={gsDueDate} onChange={e=>setGsDueDate(e.target.value)} /></Field>
            <Field label="Total meeting duration (minutes)" hint="e.g. 120 for a 2-hour session"><NumField min={15} max={480} fallback={60} value={gsDuration} onChange={setGsDuration} /></Field>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
              <Field label="Preferred window — start"><TimeInput value={gsStartTime} onChange={setGsStartTime} /></Field>
              <Field label="Preferred window — end"><TimeInput value={gsEndTime} onChange={setGsEndTime} /></Field>
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
    </>
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
      const res=await authFetch("/api/chat",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({messages:[{r:"user",t:prompt}],model:"standard",...getAiPrefs()})});
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
      const res=await authFetch("/api/chat",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({messages:[{r:"user",t:kickoff}],model:"standard",...getAiPrefs()})});
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
      const res=await authFetch("/api/chat",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({messages:apiMsgs,model:"standard",...getAiPrefs()})});
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

// ─── WRITE STUDIO ─────────────────────────────────────────────────────────────
function WriteStudio(){
  const [essays,setEssays]=useState(()=>lsGet("essays",[]));
  const [activeId,setActiveId]=useState(null);
  const [aiMode,setAiMode]=useState("feedback");
  const [newOpen,setNewOpen]=useState(false);
  const [eTitle,setETitle]=useState("");const [eSubject,setESubject]=useState("English IV");const [eTarget,setETarget]=useState("1500");const [ePrompt,setEPrompt]=useState("");const [eMode,setEMode]=useState("self");const [eCustom,setECustom]=useState("");const [aiCreating,setAiCreating]=useState(false);
  const [tutorMode,setTutorMode]=useState("lesson");const [topic,setTopic]=useState("");const [lesson,setLesson]=useState(null);const [lessonLoading,setLessonLoading]=useState(false);const [showAnswer,setShowAnswer]=useState(false);const [socMsgs,setSocMsgs]=useState([]);const [socActive,setSocActive]=useState(false);const [socInput,setSocInput]=useState("");const [socLoading,setSocLoading]=useState(false);
  const [checkLoading,setCheckLoading]=useState(false);const [issues,setIssues]=useState([]);const [grade,setGrade]=useState(null);const [grammarStats,setGrammarStats]=useState(null);
  const [rewriteLoading,setRewriteLoading]=useState(false);const [rewriteResult,setRewriteResult]=useState("");const [activeRW,setActiveRW]=useState(null);
  const [feedbackLoading,setFeedbackLoading]=useState(false);const [feedbackIssues,setFeedbackIssues]=useState(null);
  const [copiedMsg,setCopiedMsg]=useState("");
  const [exportOpen,setExportOpen]=useState(false);const [gdocsStep,setGdocsStep]=useState("idle");
  const [citeOpen,setCiteOpen]=useState(false);const [citeSource,setCiteSource]=useState("");const [citeStyle,setCiteStyle]=useState("MLA");const [citeLoading,setCiteLoading]=useState(false);const [citeResult,setCiteResult]=useState("");
  const editorRef=useRef(null);
  const subjects=[{value:"English IV",label:"English IV",color:T.purple},{value:"Biology",label:"Biology",color:T.teal},{value:"History",label:"History",color:T.muted},{value:"Chemistry",label:"Chemistry",color:T.red},{value:"Calculus",label:"Calculus",color:T.blue},{value:"Other",label:"Other",color:T.lime}];
  const persist=(next)=>{setEssays(next);lsSet("essays",next);};
  const activeEssay=essays.find(e=>e.id===activeId)||null;
  const statusOf=(e)=>{if(e.submitted)return"Submitted";const wc=wordCountOf(e.content);if(wc===0)return"Outline";return"In progress";};
  const scOf={Submitted:T.teal,"In progress":T.amber,Outline:T.blue};
  const subjectColor={"English IV":T.purple,"Biology":T.teal,"History":T.muted,"Chemistry":T.red,"Calculus":T.blue};
  const colorOf=(s)=>subjectColor[s]||T.lime;
  const wc=activeEssay?wordCountOf(activeEssay.content):0;
  const target=activeEssay?activeEssay.target:0;
  const pct=target>0?Math.min(100,Math.round(wc/target*100)):0;
  const essayText=activeEssay?stripHtml(activeEssay.content).trim():"";

  const createDoc=(prefillTitle,prefillContent,prefillTarget,prefillSubject)=>{
    const id=String(Date.now()+Math.random()*999);
    const subj=eSubject==="Other"&&eCustom.trim()?eCustom.trim():(prefillSubject||eSubject);
    const doc={id,title:prefillTitle||eTitle.trim()||"Untitled",subject:subj,target:+(prefillTarget||eTarget)||1500,prompt:ePrompt.trim(),content:prefillContent||"",submitted:false,createdAt:Date.now(),updatedAt:Date.now()};
    persist(essays.concat([doc]));setActiveId(id);setNewOpen(false);setETitle("");setEPrompt("");setECustom("");setAiCreating(false);
    return doc;
  };
  const aiDraft=async()=>{
    if(!eTitle.trim())return;setAiCreating(true);
    const subj=eSubject==="Other"&&eCustom.trim()?eCustom.trim():eSubject;
    const p="Hey Studlin, help me start an essay. Title: \""+eTitle.trim()+"\". Subject: "+subj+"."+(ePrompt?" Prompt: "+ePrompt:"")+" Write an HTML outline + opening draft (intro + first body paragraph). Format with <p> and <strong> for headers only. Give me the HTML directly.";
    try{const res=await authFetch("/api/chat",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({messages:[{r:"user",t:p}],model:"standard"})});const d=await res.json();createDoc(eTitle.trim(),(d.reply||"").replace(/```html?|```/g,"").trim(),eTarget,subj);}
    catch(e){createDoc(eTitle.trim(),"",eTarget,subj);}
  };
  const useTemplate=(name)=>{const t=ESSAY_TEMPLATES[name];const id=String(Date.now()+Math.random()*999);const doc={id,title:name,subject:"English IV",target:t.target,prompt:"",content:t.content,submitted:false,createdAt:Date.now(),updatedAt:Date.now()};persist(essays.concat([doc]));setActiveId(id);};
  const deleteDoc=(id)=>{persist(essays.filter(e=>e.id!==id));if(activeId===id)setActiveId(null);};
  const updateContent=(html)=>{if(!activeEssay)return;persist(essays.map(e=>e.id===activeId?{...e,content:html,updatedAt:Date.now()}:e));};
  const updateTitle=(title)=>{if(!activeEssay)return;persist(essays.map(e=>e.id===activeId?{...e,title,updatedAt:Date.now()}:e));};
  const exec=(cmd,val)=>{if(editorRef.current)editorRef.current.focus();document.execCommand(cmd,false,val);if(editorRef.current)updateContent(editorRef.current.innerHTML);};
  const markSubmitted=()=>{if(!activeEssay)return;persist(essays.map(e=>e.id===activeId?{...e,submitted:true}:e));};

  const runGrammarCheck=async()=>{
    if(!essayText||essayText.length<10)return;
    setCheckLoading(true);setIssues([]);setGrade(null);setGrammarStats(null);
    try{const p="Hey Studlin, check my writing. Return ONLY valid JSON: {\"grade\":\"B+\",\"readingLevel\":\"Grade 11\",\"issues\":[{\"type\":\"Grammar\",\"orig\":\"wrong text\",\"fix\":\"fixed\",\"desc\":\"explanation\"}],\"grammarCount\":0,\"styleCount\":0,\"clarityCount\":0,\"summary\":\"one sentence\"}\n\nText:\n"+essayText.slice(0,6000);const res=await authFetch("/api/chat",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({messages:[{r:"user",t:p}],model:"standard"})});const d=await res.json();var raw=(d.reply||"").replace(/```json?|```/g,"").trim();var s=raw.indexOf("{");var en=raw.lastIndexOf("}");if(s>=0&&en>s)raw=raw.slice(s,en+1);try{var parsed=JSON.parse(raw);setGrade(parsed.grade||"?");setGrammarStats({grammar:parsed.grammarCount||0,style:parsed.styleCount||0,clarity:parsed.clarityCount||0,reading:parsed.readingLevel||"",summary:parsed.summary||""});setIssues(Array.isArray(parsed.issues)?parsed.issues:[]);}catch(pe){setGrade("?");setGrammarStats({grammar:0,style:0,clarity:0,reading:"",summary:"Couldn't parse. Try again."});}}
    catch(e){setGrade("?");}setCheckLoading(false);
  };
  const acceptFix=(issue)=>{if(!activeEssay)return;const fix=issue.fix;const html=sanitizeHtml((activeEssay.content||"").replace(issue.orig,()=>fix));updateContent(html);if(editorRef.current)editorRef.current.innerHTML=html;setIssues(arr=>arr.filter(x=>x!==issue));};
  const acceptAllFixes=()=>{if(!activeEssay)return;let html=activeEssay.content||"";issues.forEach(issue=>{const fix=issue.fix;html=html.replace(issue.orig,()=>fix);});html=sanitizeHtml(html);updateContent(html);if(editorRef.current)editorRef.current.innerHTML=html;setIssues([]);};
  const typeColor={"Grammar":T.red,"Spelling":T.red,"Punctuation":T.amber,"Style":T.amber,"Clarity":T.teal};

  const runRewrite=async(mode)=>{
    if(!essayText)return;setActiveRW(mode);setRewriteLoading(true);setRewriteResult("");
    const prompts={clarity:"Rewrite for maximum clarity.",academic:"Elevate to a formal academic register.",simplify:"Simplify. Aim for Grade 8 reading level.",transitions:"Add transitional phrases to improve flow.",vary:"Vary sentence length and structure for rhythm.",humanize:"Rewrite this AI-generated text to sound natural and human — remove robotic phrasing, vary sentence length, add natural imperfections."};
    try{const p="Hey Studlin, "+prompts[mode]+"\n\nText:\n"+essayText.slice(0,6000)+"\n\nGive me the rewritten text only, nothing else.";const res=await authFetch("/api/chat",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({messages:[{r:"user",t:p}],model:"standard"})});const d=await res.json();setRewriteResult(d.reply||"No result.");}
    catch(e){setRewriteResult("Error: "+e.message);}setRewriteLoading(false);
  };
  const applyRewrite=()=>{if(!rewriteResult||!activeEssay)return;const html=sanitizeHtml(rewriteResult.split(/\n+/).filter(Boolean).map(p=>"<p>"+p+"</p>").join(""));updateContent(html);if(editorRef.current)editorRef.current.innerHTML=html;setRewriteResult("");setActiveRW(null);};

  const runFeedback=async()=>{
    if(!essayText)return;setFeedbackLoading(true);setFeedbackIssues(null);
    try{const p="Hey Studlin, give me 4 short, specific, actionable feedback points to improve this "+( activeEssay?.subject||"")+" essay. Respond ONLY as a JSON array of strings.\n\n"+essayText.slice(0,6000);const res=await authFetch("/api/chat",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({messages:[{r:"user",t:p}],model:"standard"})});const d=await res.json();var raw=(d.reply||"").replace(/```json?|```/g,"").trim();var s=raw.indexOf("[");var en=raw.lastIndexOf("]");if(s>=0&&en>s)raw=raw.slice(s,en+1);setFeedbackIssues(JSON.parse(raw));}
    catch(e){setFeedbackIssues(["Something went wrong. Try again."]);}setFeedbackLoading(false);
  };

  const genLesson=async()=>{if(!topic.trim())return;setLessonLoading(true);setLesson(null);setShowAnswer(false);const p="Hey Studlin, mini-lesson on \""+topic.trim()+"\". Respond ONLY with valid JSON: {\"concept\":\"3-5 sentence explanation\",\"example\":\"one worked example\",\"mistakes\":[\"mistake1\",\"mistake2\",\"mistake3\"],\"question\":\"one practice question\",\"answer\":\"answer with explanation\"}";try{const res=await authFetch("/api/chat",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({messages:[{r:"user",t:p}],model:"standard"})});const d=await res.json();var raw=(d.reply||"").replace(/```json?|```/g,"").trim();var s=raw.indexOf("{");var en=raw.lastIndexOf("}");if(s>=0&&en>s)raw=raw.slice(s,en+1);setLesson(JSON.parse(raw));}catch(e){setLesson({concept:"Couldn't generate. Try again.",example:"",mistakes:[],question:"",answer:""});}setLessonLoading(false);};
  const startSocratic=async()=>{if(!topic.trim())return;setSocActive(true);setSocLoading(true);setSocMsgs([]);try{const res=await authFetch("/api/chat",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({messages:[{r:"user",t:"I want to learn about \""+topic.trim()+"\" using the Socratic method. Don't explain it directly — ask me one guiding question to start."}],model:"standard"})});const d=await res.json();setSocMsgs([{r:"ai",t:d.reply||"What do you already know about "+topic+"?"}]);}catch(e){setSocMsgs([{r:"ai",t:"Let's start: what do you know about "+topic+"?"}]);}setSocLoading(false);};
  const sendSocratic=async()=>{if(!socInput.trim()||socLoading)return;const userMsg={r:"user",t:socInput.trim()};const next=socMsgs.concat([userMsg]);setSocMsgs(next);setSocInput("");setSocLoading(true);const apiMsgs=next.concat([{r:"user",t:"(Keep using Socratic method on \""+topic+"\" — guiding questions only, no direct answers unless they've clearly got it.)"}]);try{const res=await authFetch("/api/chat",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({messages:apiMsgs,model:"standard"})});const d=await res.json();setSocMsgs(m=>m.concat([{r:"ai",t:d.reply||"Keep going — what else do you know?"}]));}catch(e){setSocMsgs(m=>m.concat([{r:"ai",t:"Something went wrong. Try again?"}]));}setSocLoading(false);};

  const generateCitation=async()=>{if(!citeSource.trim())return;setCiteLoading(true);setCiteResult("");try{const res=await authFetch("/api/chat",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({messages:[{r:"user",t:"Format a "+citeStyle+" citation for: "+citeSource.trim()+". Respond with ONLY the formatted citation."}],model:"flash"})});const d=await res.json();setCiteResult(d.reply||"");}catch(e){setCiteResult("Error. Try again.");}setCiteLoading(false);};
  const insertCitation=()=>{if(!citeResult||!activeEssay)return;const html=sanitizeHtml((activeEssay.content||"")+"<p>"+citeResult+"</p>");updateContent(html);if(editorRef.current)editorRef.current.innerHTML=html;setCiteOpen(false);setCiteSource("");setCiteResult("");};

  const copyEssay=()=>{if(!activeEssay)return;const txt=activeEssay.title+"\n\n"+essayText;navigator.clipboard&&navigator.clipboard.writeText(txt).then(()=>{setCopiedMsg("Copied");setTimeout(()=>setCopiedMsg(""),2000);});};
  const downloadEssay=()=>{if(!activeEssay)return;const blob=new Blob([activeEssay.title+"\n\n"+essayText],{type:"text/plain"});const a=Object.assign(document.createElement("a"),{href:URL.createObjectURL(blob),download:(activeEssay.title||"essay").replace(/[^a-z0-9]+/gi,"_")+".txt"});document.body.appendChild(a);a.click();document.body.removeChild(a);};
  const doGoogleDocsExport=async()=>{if(!activeEssay)return;if(!GDOCS_CONFIGURED){setGdocsStep("unconfigured");return;}setGdocsStep("loading");try{const url=await createGoogleDoc(activeEssay);setGdocsStep("done");window.open(url,"_blank","noopener,noreferrer");}catch(e){setGdocsStep(e.message?.includes("popup")?"popup_blocked":e.message?.includes("configured")?"unconfigured":"apierror");}};

  const AiPanel=()=>(
    <div style={{display:"flex",flexDirection:"column",height:"100%",overflowY:"auto"}}>
      <div style={{display:"flex",gap:3,background:T.card2,borderRadius:10,padding:3,marginBottom:14,flexShrink:0}}>
        {[["feedback","Feedback"],["check","Grammar"],["rewrite","Rewrite"],["tutor","Tutor"]].map(([m,l])=>(
          <button key={m} onClick={()=>setAiMode(m)} style={{flex:1,padding:"6px 4px",borderRadius:7,border:"none",background:aiMode===m?T.lime:"transparent",color:aiMode===m?T.ink:T.muted,fontSize:11,fontWeight:aiMode===m?700:400,cursor:"pointer",fontFamily:T.font,transition:"all 0.15s"}}>{l}</button>
        ))}
      </div>

      {aiMode==="feedback"&&(
        <div>
          <Btn onClick={runFeedback} disabled={feedbackLoading||!essayText} style={{width:"100%",justifyContent:"center",marginBottom:12}}>{feedbackLoading?"Analyzing...":Icon.wand+" Get feedback"}</Btn>
          {!feedbackIssues&&<div style={{fontSize:12,color:T.faint,textAlign:"center",padding:"20px 0"}}>{activeEssay?"Click to get AI suggestions on your draft.":"Open or create a doc first."}</div>}
          {feedbackIssues&&feedbackIssues.map((s,i)=>(
            <div key={i} style={{display:"flex",gap:8,padding:"9px 0",borderBottom:i<feedbackIssues.length-1?"1px solid "+T.border:"none",fontSize:12,color:T.muted}}>
              <div style={{width:5,height:5,borderRadius:"50%",background:T.amber,flexShrink:0,marginTop:5}} />{s}
            </div>
          ))}
          {activeEssay&&(<>
            <div style={{height:1,background:T.border,margin:"14px 0"}} />
            <Label>Readability</Label>
            <div style={{fontSize:32,fontWeight:700,color:T.white,letterSpacing:"-0.02em"}}>{readabilityOf(activeEssay.content).grade}</div>
            <div style={{fontSize:11,color:T.muted,marginTop:3}}>{readabilityOf(activeEssay.content).level||"Write something first"}</div>
          </>)}
        </div>
      )}

      {aiMode==="check"&&(
        <div>
          <Btn onClick={runGrammarCheck} disabled={checkLoading||!essayText} style={{width:"100%",justifyContent:"center",marginBottom:12}}>{checkLoading?"Checking...":"Run grammar check"}</Btn>
          {grade&&<div style={{background:T.lime,borderRadius:10,padding:"12px 14px",marginBottom:12,display:"flex",justifyContent:"space-between",alignItems:"center"}}><div><div style={{fontSize:11,fontWeight:600,color:T.bg,opacity:0.7,letterSpacing:"0.06em",textTransform:"uppercase"}}>Grade</div><div style={{fontSize:36,fontWeight:800,color:T.bg,letterSpacing:"-0.04em",lineHeight:1}}>{grade}</div></div><div style={{textAlign:"right"}}><div style={{fontSize:11,color:T.bg,opacity:0.7}}>{grammarStats?.reading}</div>{grammarStats&&<div style={{fontSize:10,color:T.bg,opacity:0.6,marginTop:4}}>{grammarStats.summary}</div>}</div></div>}
          {issues.length>0&&(<><div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}><div style={{fontSize:12,fontWeight:600,color:T.white}}>{issues.length} issue{issues.length!==1?"s":""}</div><BtnSm onClick={acceptAllFixes}>Accept all</BtnSm></div>
          {issues.map((issue,i)=>(
            <div key={i} style={{background:T.card2,border:"1px solid "+(typeColor[issue.type]||T.amber)+"44",borderRadius:8,padding:10,marginBottom:6}}>
              <div style={{display:"flex",gap:6,alignItems:"center",marginBottom:6}}><Badge color={typeColor[issue.type]||T.amber}>{issue.type}</Badge><span style={{fontSize:10,color:T.muted,flex:1}}>{issue.desc}</span></div>
              <div style={{fontSize:12,display:"flex",flexWrap:"wrap",gap:6,alignItems:"center",marginBottom:8}}>
                <span style={{color:T.red,textDecoration:"line-through",background:T.red+"10",padding:"1px 6px",borderRadius:4}}>{issue.orig}</span>
                <span style={{color:T.faint}}>→</span>
                <span style={{color:T.lime,fontWeight:600,background:T.lime+"10",padding:"1px 6px",borderRadius:4}}>{issue.fix}</span>
              </div>
              <div style={{display:"flex",gap:6}}><BtnSm onClick={()=>acceptFix(issue)}>Apply</BtnSm><BtnSm variant="ghost" onClick={()=>setIssues(arr=>arr.filter(x=>x!==issue))}>Dismiss</BtnSm></div>
            </div>
          ))}</>)}
          {!grade&&!issues.length&&<div style={{fontSize:12,color:T.faint,textAlign:"center",padding:"20px 0"}}>{activeEssay?"Click to check grammar and style.":"Open or create a doc first."}</div>}
        </div>
      )}

      {aiMode==="rewrite"&&(
        <div>
          {[["clarity","Rephrase for clarity"],["academic","Academic register"],["simplify","Simplify language"],["transitions","Add transitions"],["vary","Vary sentences"],["humanize","Humanize (remove AI tone)"]].map(([mode,label])=>(
            <button key={mode} onClick={()=>runRewrite(mode)} disabled={rewriteLoading||!essayText} style={{display:"flex",alignItems:"center",gap:8,width:"100%",textAlign:"left",padding:"10px 12px",borderRadius:8,marginBottom:6,fontSize:12.5,cursor:"pointer",border:"1px solid "+(activeRW===mode?T.purple+"66":T.border),background:activeRW===mode?T.purple+"10":"transparent",color:activeRW===mode?T.purple:T.muted,fontFamily:T.font,fontWeight:activeRW===mode?600:400,transition:"all 0.15s"}}>{Icon.wand} {rewriteLoading&&activeRW===mode?"Working...":label}</button>
          ))}
          {rewriteResult&&(
            <div style={{marginTop:10,background:T.card2,border:"1px solid "+T.purple+"44",borderRadius:8,padding:12}}>
              <div style={{fontSize:12,color:T.text,lineHeight:1.7,maxHeight:200,overflowY:"auto",marginBottom:8}}>{rewriteResult}</div>
              <div style={{display:"flex",gap:6}}><BtnSm onClick={applyRewrite}>Apply to doc</BtnSm><BtnSm variant="ghost" onClick={()=>setRewriteResult("")}>Dismiss</BtnSm></div>
            </div>
          )}
          {!essayText&&<div style={{fontSize:12,color:T.faint,textAlign:"center",padding:"20px 0"}}>Open or create a doc first.</div>}
        </div>
      )}

      {aiMode==="tutor"&&(
        <div>
          <div style={{display:"flex",gap:4,background:T.card2,borderRadius:8,padding:3,marginBottom:12}}>
            <button onClick={()=>{setTutorMode("lesson");setSocActive(false);setSocMsgs([]);}} style={{flex:1,padding:"5px",borderRadius:6,border:"none",background:tutorMode==="lesson"?T.card:"transparent",color:tutorMode==="lesson"?T.white:T.muted,fontSize:11,fontWeight:tutorMode==="lesson"?600:400,cursor:"pointer",fontFamily:T.font}}>Mini-lesson</button>
            <button onClick={()=>setTutorMode("socratic")} style={{flex:1,padding:"5px",borderRadius:6,border:"none",background:tutorMode==="socratic"?T.card:"transparent",color:tutorMode==="socratic"?T.white:T.muted,fontSize:11,fontWeight:tutorMode==="socratic"?600:400,cursor:"pointer",fontFamily:T.font}}>Socratic</button>
          </div>
          <div style={{display:"flex",gap:6,marginBottom:10}}>
            <input value={topic} onChange={e=>setTopic(e.target.value)} onKeyDown={e=>{if(e.key==="Enter")tutorMode==="lesson"?genLesson():startSocratic();}} placeholder="What topic?" style={{flex:1,background:T.card2,border:"1px solid "+T.border,borderRadius:7,padding:"8px 10px",color:T.text,fontSize:12,fontFamily:T.font,outline:"none"}} />
            <BtnSm onClick={tutorMode==="lesson"?genLesson:startSocratic} disabled={(tutorMode==="lesson"?lessonLoading:socLoading)||!topic.trim()}>{tutorMode==="lesson"?(lessonLoading?"...":"Go"):(socActive?"Restart":"Go")}</BtnSm>
          </div>
          {tutorMode==="lesson"&&lesson&&(
            <div style={{display:"flex",flexDirection:"column",gap:8}}>
              <div style={{background:T.card2,border:"1px solid "+T.border,borderRadius:8,padding:12}}><div style={{fontSize:10,fontWeight:700,color:T.lime,textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:6}}>Concept</div><div style={{fontSize:12.5,color:T.text,lineHeight:1.6}}>{lesson.concept}</div></div>
              {lesson.example&&<div style={{background:T.card2,border:"1px solid "+T.border,borderRadius:8,padding:12}}><div style={{fontSize:10,fontWeight:700,color:T.blue,textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:6}}>Example</div><div style={{fontSize:12,color:T.text,lineHeight:1.6,whiteSpace:"pre-wrap"}}>{lesson.example}</div></div>}
              {lesson.mistakes?.length>0&&<div style={{background:T.card2,border:"1px solid "+T.border,borderRadius:8,padding:12}}><div style={{fontSize:10,fontWeight:700,color:T.amber,textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:6}}>Common mistakes</div><ul style={{margin:0,paddingLeft:16,fontSize:12,color:T.text,lineHeight:1.7}}>{lesson.mistakes.map((m,i)=><li key={i}>{m}</li>)}</ul></div>}
              {lesson.question&&<div style={{background:T.card2,border:"1px solid "+T.border,borderRadius:8,padding:12}}><div style={{fontSize:10,fontWeight:700,color:T.purple,textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:6}}>Quick check</div><div style={{fontSize:12.5,color:T.text,marginBottom:8}}>{lesson.question}</div>{showAnswer?<div style={{fontSize:12,color:T.lime,background:T.lime+"0e",padding:"8px 10px",borderRadius:6}}>{lesson.answer}</div>:<BtnSm variant="subtle" onClick={()=>setShowAnswer(true)}>Reveal answer</BtnSm>}</div>}
              <BtnSm variant="ghost" onClick={()=>{setLesson(null);setShowAnswer(false);}}>Clear</BtnSm>
            </div>
          )}
          {tutorMode==="socratic"&&socActive&&(
            <div>
              <div style={{maxHeight:260,overflowY:"auto",display:"flex",flexDirection:"column",gap:10,marginBottom:10}}>
                {socMsgs.map((m,i)=>(
                  <div key={i} style={{display:"flex",gap:8,alignItems:"flex-start"}}>
                    <div style={{width:22,height:22,borderRadius:6,background:m.r==="ai"?T.lime:T.card2,display:"grid",placeItems:"center",fontSize:10,fontWeight:700,color:m.r==="ai"?T.ink:T.muted,flexShrink:0}}>{m.r==="ai"?"S":"Y"}</div>
                    <div style={{fontSize:12,color:T.text,lineHeight:1.6,paddingTop:2}}>{m.t}</div>
                  </div>
                ))}
                {socLoading&&<div style={{fontSize:11,color:T.muted,paddingLeft:30}}>Thinking...</div>}
              </div>
              <div style={{display:"flex",gap:6}}>
                <input value={socInput} onChange={e=>setSocInput(e.target.value)} onKeyDown={e=>{if(e.key==="Enter")sendSocratic();}} placeholder="Your answer..." style={{flex:1,background:T.card2,border:"1px solid "+T.border,borderRadius:7,padding:"7px 9px",color:T.text,fontSize:12,fontFamily:T.font,outline:"none"}} />
                <BtnSm onClick={sendSocratic} disabled={socLoading||!socInput.trim()}>Send</BtnSm>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );

  return(
    <div style={{display:"grid",gridTemplateColumns:"200px 1fr 280px",gap:14,height:"calc(100vh - 72px)"}}>
      {/* ── LEFT: Library */}
      <div style={{display:"flex",flexDirection:"column",gap:0,overflowY:"auto"}}>
        <Btn onClick={()=>setNewOpen(true)} style={{width:"100%",justifyContent:"center",marginBottom:10,fontSize:12}}>{Icon.plus} New doc</Btn>
        <div style={{fontSize:10,fontWeight:700,letterSpacing:"0.12em",color:T.muted,textTransform:"uppercase",marginBottom:6,paddingLeft:2}}>Your docs</div>
        {essays.length===0&&<div style={{fontSize:12,color:T.faint,padding:"10px 0",textAlign:"center"}}>No docs yet.</div>}
        {essays.slice().sort((a,b)=>b.updatedAt-a.updatedAt).map(e=>{
          const st=statusOf(e);const isActive=e.id===activeId;
          return(
            <div key={e.id} onClick={()=>setActiveId(e.id)} style={{padding:"9px 10px",borderRadius:8,marginBottom:3,cursor:"pointer",background:isActive?T.lime+"10":"transparent",border:"1px solid "+(isActive?T.lime+"44":"transparent"),display:"flex",alignItems:"center",gap:8,transition:"all 0.1s"}}>
              <div style={{width:3,height:30,borderRadius:2,background:colorOf(e.subject),flexShrink:0}} />
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontSize:12,fontWeight:isActive?600:400,color:isActive?T.white:T.text,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{e.title}</div>
                <div style={{fontSize:10,color:T.faint,marginTop:1}}>{wordCountOf(e.content).toLocaleString()} words</div>
              </div>
              <button onClick={ev=>{ev.stopPropagation();deleteDoc(e.id);}} style={{border:"none",background:"transparent",color:T.faint,cursor:"pointer",fontSize:13,padding:2,flexShrink:0,lineHeight:1}}>×</button>
            </div>
          );
        })}
        <div style={{height:1,background:T.border,margin:"10px 0"}} />
        <div style={{fontSize:10,fontWeight:700,letterSpacing:"0.12em",color:T.muted,textTransform:"uppercase",marginBottom:6,paddingLeft:2}}>Templates</div>
        {Object.keys(ESSAY_TEMPLATES).map(name=>(
          <div key={name} onClick={()=>useTemplate(name)} style={{padding:"7px 10px",borderRadius:7,marginBottom:2,cursor:"pointer",fontSize:11,color:T.muted,display:"flex",alignItems:"center",gap:7,transition:"all 0.1s",border:"1px solid transparent"}}
            onMouseEnter={e=>e.currentTarget.style.background=T.card2}
            onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
            {Icon.file}<span>{name}</span>
          </div>
        ))}
      </div>

      {/* ── CENTER: Editor */}
      <div style={{display:"flex",flexDirection:"column",overflow:"hidden",background:T.card,borderRadius:16,border:"1px solid "+T.border}}>
        {activeEssay?(
          <>
            <div style={{padding:"14px 18px",borderBottom:"1px solid "+T.border,display:"flex",alignItems:"center",gap:12,flexShrink:0}}>
              <input value={activeEssay.title} onChange={e=>updateTitle(e.target.value)} style={{flex:1,fontSize:15,fontWeight:700,color:T.white,background:"transparent",border:"none",outline:"none",fontFamily:T.font}} />
              <div style={{display:"flex",gap:6,alignItems:"center",flexShrink:0}}>
                <span style={{fontSize:11,color:T.muted,fontFamily:T.mono}}>{wc.toLocaleString()} / {target.toLocaleString()} words</span>
                <div style={{width:60,height:4,background:T.card2,borderRadius:99,overflow:"hidden"}}><div style={{height:"100%",width:pct+"%",background:T.lime,borderRadius:99}} /></div>
                <BtnSm variant="subtle" onClick={()=>setExportOpen(true)}>{Icon.file}</BtnSm>
                <BtnSm variant="subtle" onClick={()=>setCiteOpen(true)}>{Icon.quote}</BtnSm>
                {!activeEssay.submitted&&<BtnSm variant="subtle" onClick={markSubmitted}>Submit</BtnSm>}
              </div>
            </div>
            <div style={{display:"flex",gap:1,background:T.card2,padding:"5px 10px",borderBottom:"1px solid "+T.border,flexWrap:"wrap",flexShrink:0}}>
              {[["B","bold",Icon.bold],["I","italic",Icon.italic],["Q","formatBlock",Icon.quote]].map(([l,cmd,ico])=>(
                <button key={l} type="button" onClick={()=>exec(cmd,cmd==="formatBlock"?"blockquote":undefined)} style={{display:"flex",alignItems:"center",gap:3,padding:"4px 8px",borderRadius:4,border:"none",background:"transparent",color:T.muted,fontSize:11,cursor:"pointer",fontFamily:T.font}}>{ico}</button>
              ))}
              <div style={{width:1,background:T.border,margin:"2px 4px"}} />
              {["H1","H2","H3"].map(h=><button key={h} type="button" onClick={()=>exec("formatBlock",h.toLowerCase())} style={{padding:"4px 8px",borderRadius:4,border:"none",background:"transparent",color:T.muted,fontSize:11,cursor:"pointer",fontFamily:T.font}}>{h}</button>)}
            </div>
            <div ref={editorRef} contentEditable suppressContentEditableWarning onInput={e=>updateContent(e.currentTarget.innerHTML)} dangerouslySetInnerHTML={{__html:activeEssay.content||"<p><br/></p>"}}
              style={{flex:1,overflowY:"auto",padding:"24px 28px",fontSize:14.5,lineHeight:1.85,color:T.text,outline:"none"}} />
          </>
        ):(
          <div style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:16,padding:40,textAlign:"center"}}>
            <div style={{width:56,height:56,borderRadius:14,background:T.lime+"14",border:"1px solid "+T.lime+"33",display:"grid",placeItems:"center",color:T.lime}}>{Icon.pen}</div>
            <div><div style={{fontSize:17,fontWeight:700,color:T.white,marginBottom:6}}>Writing Suite</div><div style={{fontSize:13,color:T.text,maxWidth:280,lineHeight:1.6}}>Your essays, AI tutor, grammar check, and rewrite tools — all in one place. Create a doc or pick a template to get started.</div></div>
            <Btn onClick={()=>setNewOpen(true)}>{Icon.plus} New doc</Btn>
          </div>
        )}
      </div>

      {/* ── RIGHT: AI Panel */}
      <div style={{background:T.card,borderRadius:16,border:"1px solid "+T.border,padding:14,overflowY:"auto"}}>
        <AiPanel />
      </div>

      {/* ── Modals */}
      <Modal open={newOpen} onClose={()=>{setNewOpen(false);setETitle("");setEPrompt("");setECustom("");setAiCreating(false);}} title="New document" sub="Start blank or get an AI-assisted first draft."
        footer={<><Btn variant="subtle" onClick={()=>setNewOpen(false)}>Cancel</Btn><Btn onClick={eMode==="ai"?aiDraft:()=>createDoc()} disabled={aiCreating} style={{opacity:eTitle.trim()?1:0.45}}>{aiCreating?"Drafting...":<>{Icon.pen} Create</>}</Btn></>}>
        <Field label="Title"><Input placeholder="e.g. Power & Corruption in Macbeth" value={eTitle} onChange={e=>setETitle(e.target.value)} autoFocus /></Field>
        <Field label="Subject"><SelectChip options={subjects} value={eSubject} onChange={setESubject} /></Field>
        {eSubject==="Other"&&<Field label="Custom subject"><Input placeholder="e.g. Physics..." value={eCustom} onChange={e=>setECustom(e.target.value)} /></Field>}
        <Field label="Mode">
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
            <button type="button" onClick={()=>setEMode("self")} style={{padding:12,borderRadius:9,border:"1px solid "+(eMode==="self"?T.lime+"55":T.border),background:eMode==="self"?T.lime+"10":T.card2,color:T.text,cursor:"pointer",textAlign:"left",fontFamily:T.font}}><div style={{fontSize:12,fontWeight:600,color:eMode==="self"?T.lime:T.white}}>Write myself</div><div style={{fontSize:11,color:T.muted}}>Blank editor</div></button>
            <button type="button" onClick={()=>setEMode("ai")} style={{padding:12,borderRadius:9,border:"1px solid "+(eMode==="ai"?T.lime+"55":T.border),background:eMode==="ai"?T.lime+"10":T.card2,color:T.text,cursor:"pointer",textAlign:"left",fontFamily:T.font}}><div style={{fontSize:12,fontWeight:600,color:eMode==="ai"?T.lime:T.white}}>AI draft</div><div style={{fontSize:11,color:T.muted}}>Outline + opening</div></button>
          </div>
        </Field>
        <Field label="Word target"><Input type="number" value={eTarget} onChange={e=>setETarget(e.target.value)} /></Field>
        <Field label="Prompt (optional)"><Textarea placeholder="Paste the assignment brief or your thesis..." value={ePrompt} onChange={e=>setEPrompt(e.target.value)} /></Field>
      </Modal>

      <Modal open={citeOpen} onClose={()=>{setCiteOpen(false);setCiteResult("");}} title="Cite a source"
        footer={<><Btn variant="subtle" onClick={()=>{setCiteOpen(false);setCiteResult("");}}>Cancel</Btn>{citeResult?<Btn onClick={insertCitation}>Insert into doc</Btn>:<Btn onClick={generateCitation} disabled={citeLoading||!citeSource.trim()}>{citeLoading?"Formatting...":"Generate"}</Btn>}</>}>
        <Field label="Style"><SelectChip options={[{value:"MLA",label:"MLA"},{value:"APA",label:"APA"},{value:"Chicago",label:"Chicago"}]} value={citeStyle} onChange={setCiteStyle} /></Field>
        <Field label="Source details"><Textarea placeholder="Author, title, publication, year, URL — whatever you have." value={citeSource} onChange={e=>setCiteSource(e.target.value)} /></Field>
        {citeResult&&<div style={{background:T.card2,border:"1px solid "+T.border,borderRadius:8,padding:"12px 14px",fontSize:13,color:T.text}}>{citeResult}</div>}
      </Modal>

      <Modal open={exportOpen} onClose={()=>{setExportOpen(false);setGdocsStep("idle");}} title="Export doc" sub={activeEssay?.title||""}>
        <div style={{display:"flex",flexDirection:"column",gap:8}}>
          <BtnSm variant="subtle" onClick={copyEssay}>{Icon.copy} Copy to clipboard {copiedMsg&&<span style={{color:T.lime,marginLeft:8}}>{copiedMsg}</span>}</BtnSm>
          <BtnSm variant="subtle" onClick={downloadEssay}>{Icon.file} Download as .txt</BtnSm>
          <div style={{height:1,background:T.border,margin:"4px 0"}} />
          <Label>Google Docs</Label>
          {(gdocsStep==="idle"||gdocsStep==="loading")&&<Btn onClick={doGoogleDocsExport} disabled={gdocsStep==="loading"||!activeEssay} style={{justifyContent:"center"}}>{gdocsStep==="loading"?<><span style={{width:13,height:13,border:"2px solid rgba(255,255,255,0.3)",borderTopColor:"#fff",borderRadius:"50%",animation:"studlinSpin 0.7s linear infinite",display:"inline-block",marginRight:8}} />Creating...</>:<>{Icon.link} Open in Google Docs</>}</Btn>}
          {gdocsStep==="done"&&<div style={{fontSize:12,color:T.lime,fontWeight:600,display:"flex",alignItems:"center",gap:6}}>{Icon.check} Doc created and opened</div>}
          {gdocsStep==="unconfigured"&&<div style={{fontSize:11,color:T.amber,background:T.amber+"12",border:"1px solid "+T.amber+"33",borderRadius:8,padding:"10px 12px",lineHeight:1.6}}>Google OAuth Client ID needs to be configured. See the comment at the top of studlin-app.jsx.</div>}
          {gdocsStep==="apierror"&&<><div style={{fontSize:12,color:T.red}}>Couldn't create doc. Make sure Drive API is enabled.</div><BtnSm variant="ghost" onClick={()=>setGdocsStep("idle")}>Try again</BtnSm></>}
        </div>
      </Modal>
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


// ─── SETTINGS ─────────────────────────────────────────────────────────────────
function SettingsTab({theme="dark", setTheme=()=>{}, accent="Lime", setAccent=()=>{}, density="Comfortable", setDensity=()=>{}, seriousMode=false, setSeriousMode=()=>{}, onOpenRoutineWizard=()=>{}}) {
  const [active,setActive]=useState("General");
  const [canvasTipOpen,setCanvasTipOpen]=useState(false);
  const [canvasSeeding,setCanvasSeeding]=useState(false);
  const [toggles,setToggles]=useState(()=>({...{push:true,sound:true,streak:true,deadline:true,sr:true,auto:true,analytics:false,onlineStatus:true,incognito:false,emails:false,profile:true,share:true,twofa:false,collect:false,motion:false,hand:true,wrapped:true,squad:true,autoSession:false,block:false,notifMaster:true,sysPush:false,chatChimes:true},...lsGet("settings",{})}));
  const tog=k=>setToggles(t=>{const n={...t,[k]:!t[k]};lsSet("settings",n);return n;});
  const [sysPushStatus,setSysPushStatus]=useState(()=>{
    if(typeof Notification==="undefined")return "unsupported";
    if(Notification.permission==="granted")return "granted";
    if(Notification.permission==="denied")return "denied";
    return "default";
  });
  const myUid=firebase.auth().currentUser?.uid||null;
  // Mirrors the local toggle into Firestore so the server-side push sender
  // (api/notify.js) can gate on it — local state stays the source of
  // truth for the UI (instant, no round-trip), this write is fire-and-forget.
  const syncPushPref=(enabled)=>{
    if(!myUid)return;
    fsdb().collection('users').doc(myUid).update({'preferences.pushNotificationsEnabled':enabled,updatedAt:new Date().toISOString()}).catch(()=>{});
  };
  const handleSysPushToggle=()=>{
    if(toggles.sysPush){
      tog("sysPush");syncPushPref(false);return;
    }
    if(typeof Notification==="undefined"){return;}
    if(Notification.permission==="granted"){
      tog("sysPush");setSysPushStatus("granted");syncPushPref(true);
      new Notification("Studlin",{body:"Desktop notifications are on. We'll keep you in sync."});
      return;
    }
    if(Notification.permission==="denied"){setSysPushStatus("denied");return;}
    Notification.requestPermission().then(perm=>{
      setSysPushStatus(perm);
      if(perm==="granted"){tog("sysPush");syncPushPref(true);new Notification("Studlin",{body:"Desktop notifications are on. We'll keep you in sync."});}
    });
  };
  const [profile,setProfileState]=useState(()=>getProfile());
  const updProfile=(patch)=>{const n={...profile,...patch};setProfileState(n);saveProfile(n);};

  // Gathers every studlin-* localStorage key into one JSON file and downloads
  // it — same blob pattern as downloadEssay (Essays/WriteStudio).
  const exportAllData=()=>{
    const out={};
    Object.keys(localStorage).forEach(k=>{
      if(k.indexOf("studlin-")===0){
        try{out[k.slice(8)]=JSON.parse(localStorage.getItem(k));}catch(e){}
      }
    });
    const blob=new Blob([JSON.stringify(out,null,2)],{type:"application/json"});
    const a=Object.assign(document.createElement("a"),{href:URL.createObjectURL(blob),download:"studlin-data-export.json"});
    document.body.appendChild(a);a.click();document.body.removeChild(a);
  };
  const [chatHistoryLoading,setChatHistoryLoading]=useState(false);
  const [deleteAccountOpen,setDeleteAccountOpen]=useState(false);
  const confirmDeleteAccount=()=>{
    Object.keys(localStorage).forEach(k=>{if(k.indexOf("studlin-")===0)localStorage.removeItem(k);});
    firebase.auth().signOut().then(()=>{window.location.href="/";});
  };
  const downloadChatHistory=async()=>{
    const myUid=firebase.auth().currentUser?.uid;
    if(!myUid||chatHistoryLoading)return;
    setChatHistoryLoading(true);
    try{
      const roomsSnap=await fsdb().collection('chatRooms').where('memberUids','array-contains',myUid).get();
      const rooms=await Promise.all(roomsSnap.docs.map(async d=>{
        const msgsSnap=await fsdb().collection('chatRooms').doc(d.id).collection('messages').orderBy('ts','asc').get();
        return {roomId:d.id,type:d.data().type||"dm",messages:msgsSnap.docs.map(m=>m.data())};
      }));
      const blob=new Blob([JSON.stringify({rooms},null,2)],{type:"application/json"});
      const a=Object.assign(document.createElement("a"),{href:URL.createObjectURL(blob),download:"studlin-chat-history.json"});
      document.body.appendChild(a);a.click();document.body.removeChild(a);
    }catch(e){}
    setChatHistoryLoading(false);
  };

  const [calGoogleLinked,setCalGoogleLinked]=useState(()=>lsGet("cal-google",false));
  const [calAppleLinked,setCalAppleLinked]=useState(()=>lsGet("cal-apple",false));
  const [googleSyncing,setGoogleSyncing]=useState(false);
  const [integrationToast,setIntegrationToast]=useState(null);

  const showToast=(msg,type="success")=>{
    setIntegrationToast({msg,type});
    setTimeout(()=>setIntegrationToast(null),3500);
  };

  const connectGoogle=()=>{
    if(typeof google==="undefined"||!google.accounts||!google.accounts.oauth2){
      showToast("Google sign-in not ready. Try refreshing the page.","error");return;
    }
    const tokenClient=google.accounts.oauth2.initTokenClient({
      client_id:"16831354472-e2vauavtunm3ot771cg7pgline10i9rk.apps.googleusercontent.com",
      scope:"https://www.googleapis.com/auth/calendar.events.readonly",
      callback:async(resp)=>{
        if(resp.error){showToast("Google Calendar connection failed.","error");return;}
        setGoogleSyncing(true);
        try{
          const now=new Date().toISOString();
          const res=await fetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events?maxResults=50&orderBy=startTime&singleEvents=true&timeMin=${encodeURIComponent(now)}`,{headers:{Authorization:`Bearer ${resp.access_token}`}});
          const data=await res.json();
          if(data.error) throw new Error(data.error.message);
          const gcalEvents=(data.items||[]).map(item=>({
            id:"gcal-"+item.id,
            date:(item.start.dateTime||item.start.date).slice(0,10),
            time:item.start.dateTime?item.start.dateTime.slice(11,16):"",
            title:item.summary||"Untitled",
            subject:"General",
            kind:"deadline"
          }));
          const existing=lsGet("events",[]).filter(e=>!e.id.startsWith("gcal-"));
          lsSet("events",[...existing,...gcalEvents]);
          lsSet("cal-google",true);
          setCalGoogleLinked(true);
          showToast(`Google Calendar connected · ${gcalEvents.length} event${gcalEvents.length===1?"":"s"} imported`);
        }catch(e){
          showToast("Failed to fetch calendar events. Check permissions and try again.","error");
        }finally{
          setGoogleSyncing(false);
        }
      }
    });
    tokenClient.requestAccessToken();
  };

  const disconnectGoogle=()=>{
    const ev=lsGet("events",[]).filter(e=>!e.id.startsWith("gcal-"));
    lsSet("events",ev);
    lsSet("cal-google",false);
    setCalGoogleLinked(false);
    showToast("Google Calendar disconnected.");
  };

  const toggleApple=()=>{
    const n=!calAppleLinked;
    setCalAppleLinked(n);
    lsSet("cal-apple",n);
    showToast(n?"Apple Calendar connected.":"Apple Calendar disconnected.");
  };

  const sections=[
    {id:"General",icon:Icon.settings},
    {id:"Appearance",icon:Icon.wand},
    {id:"Notifications",icon:Icon.send},
    {id:"Privacy",icon:Icon.shield},
    {id:"Study preferences",icon:Icon.brain},
    {id:"Subjects & Labels",icon:Icon.layers},
    {id:"Calendar Preferences",icon:Icon.cal},
    {id:"Integrations",icon:Icon.link},
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
        <div style={{height:90,borderRadius:8,overflow:"hidden",background:isLight?"#FAF6EC":"#0D120F",border:`1px solid ${isLight?"rgba(14,31,24,0.08)":"rgba(255,255,255,0.06)"}`,marginBottom:12,display:"flex"}}>
          <div style={{width:24,background:"#14342A",display:"flex",flexDirection:"column",alignItems:"center",padding:"6px 0",gap:4}}>
            <div style={{width:10,height:10,background:"#AECE5E",borderRadius:2}} />
            <div style={{width:14,height:3,background:"rgba(255,255,255,0.2)",borderRadius:1,marginTop:4}} />
            <div style={{width:14,height:3,background:"rgba(255,255,255,0.12)",borderRadius:1}} />
            <div style={{width:14,height:3,background:"rgba(255,255,255,0.12)",borderRadius:1}} />
          </div>
          <div style={{flex:1,padding:8,display:"flex",flexDirection:"column",gap:5}}>
            <div style={{display:"flex",gap:4}}>
              <div style={{flex:1,height:18,background:isLight?"#14342A":"#212A24",borderRadius:3}} />
              <div style={{width:24,height:18,background:"#AECE5E",borderRadius:3}} />
              <div style={{width:24,height:18,background:isLight?"#fff":"#212A24",borderRadius:3,border:isLight?"1px solid rgba(14,31,24,0.08)":"none"}} />
            </div>
            <div style={{display:"flex",gap:4}}>
              <div style={{flex:1,height:14,background:isLight?"#fff":"#212A24",borderRadius:3,border:isLight?"1px solid rgba(14,31,24,0.08)":"none"}} />
              <div style={{flex:1,height:14,background:isLight?"#fff":"#212A24",borderRadius:3,border:isLight?"1px solid rgba(14,31,24,0.08)":"none"}} />
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
  const [verb,setVerb]=useState(()=>lsGet("pref-verb","Balanced"));
  const [tutorStyle,setTutorStyle]=useState(()=>lsGet("pref-tutorStyle","Socratic"));
  const accents=[{n:"Lime",c:"#AECE5E"},{n:"Forest",c:"#3E9576"},{n:"Sky",c:"#4F95D6"},{n:"Lilac",c:"#9474C9"},{n:"Peach",c:"#D07C4C"}];
  const [mgmtSubjs,setMgmtSubjs]=useState(()=>getSubjects().map(s=>({...s})));
  const [mgmtSaved,setMgmtSaved]=useState(false);
  const saveMgmtSubjs=()=>{const valid=mgmtSubjs.filter(s=>s.label.trim());saveSubjects(valid);lsSet("subjects-configured",true);setMgmtSaved(true);setTimeout(()=>setMgmtSaved(false),2500);};

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
              <Field label="School or affiliation"><SchoolSelect value={profile.school} onChange={v=>updProfile({school:v})} placeholder="Search or type your school" /></Field>
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
              {[["Google Calendar","Synced",true,true],["Apple Calendar","Connect",false,false],["Notion workspace","Connect",false,false],["Dropbox","Connect",false,false]].map(([n,st,on,live],i)=>(
                <div key={i} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"12px 0",borderBottom:i<3?`1px solid ${T.border}`:"none"}}>
                  <div style={{fontSize:13,color:T.text,fontWeight:500}}>{n}{!live&&<span style={{marginLeft:8,fontSize:10.5,fontWeight:600,color:T.faint}}>(Coming Soon)</span>}</div>
                  <BtnSm variant={on?"subtle":"lime"} disabled={!live} style={!live?{opacity:0.4,cursor:"not-allowed"}:undefined}>{st}</BtnSm>
                </div>
              ))}
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
                  <span style={{fontSize:12,color:theme==="light"?T.lime:T.muted,fontWeight:theme==="light"?600:400}}>Light</span>
                  <div onClick={()=>setTheme(theme==="dark"?"light":"dark")} style={{width:46,height:24,borderRadius:12,background:theme==="dark"?T.lime:T.card2,border:`1.5px solid ${theme==="dark"?T.lime:T.border}`,position:"relative",cursor:"pointer",transition:"all 0.2s",flexShrink:0}}>
                    <div style={{width:18,height:18,borderRadius:"50%",background:"#ffffff",border:`1px solid rgba(0,0,0,0.10)`,position:"absolute",top:2,left:theme==="dark"?24:2,transition:"left 0.2s",boxShadow:"0 1px 4px rgba(0,0,0,0.18)"}} />
                  </div>
                  <span style={{fontSize:12,color:theme==="dark"?T.lime:T.muted,fontWeight:theme==="dark"?600:400}}>Dark</span>
                </div>
              </div>
              <div style={{display:"flex",gap:10}}>
                <ThemeCard mode="light" label="Light" sub="Bone white · muted slate" />
                <ThemeCard mode="dark"  label="Dark"  sub="Midnight matte · slate blue" />
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
              <div style={{fontSize:14,fontWeight:700,color:T.white,marginBottom:4}}>Notification Preferences</div>
              <div style={{fontSize:12,color:T.muted,marginBottom:10}}>Control how incoming chat messages reach you — a soft chime, a native desktop alert, or both, depending on what you're doing.</div>
              <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",gap:14,padding:"13px 0",borderBottom:`1px solid ${T.border}`}}>
                <div style={{flex:1,marginRight:14}}>
                  <div style={{fontSize:13,color:T.text,fontWeight:500}}>Enable Desktop Notifications</div>
                  <div style={{fontSize:11.5,color:T.muted,marginTop:2,lineHeight:1.45}}>Native desktop alerts for incoming chat messages and study session updates — even when this tab is closed or in the background.</div>
                </div>
                <div onClick={handleSysPushToggle} style={{width:38,height:20,borderRadius:10,background:toggles.sysPush?T.lime:T.card2,border:`1px solid ${toggles.sysPush?T.lime:T.border}`,position:"relative",cursor:sysPushStatus==="denied"?"not-allowed":"pointer",transition:"all 0.2s",flexShrink:0,opacity:sysPushStatus==="unsupported"?0.45:1}}>
                  <div style={{width:14,height:14,borderRadius:"50%",background:toggles.sysPush?T.bg:"#fff",position:"absolute",top:2,left:toggles.sysPush?21:2,transition:"left 0.2s"}} />
                </div>
              </div>
              {sysPushStatus==="denied"&&(
                <div style={{fontSize:11.5,color:T.amber,background:T.amber+"10",border:`1px solid ${T.amber}22`,borderRadius:7,padding:"9px 12px",lineHeight:1.5,marginTop:10}}>
                  Notifications are blocked in your browser. Open browser site settings and allow notifications for this site, then refresh.
                </div>
              )}
              {sysPushStatus==="unsupported"&&(
                <div style={{fontSize:11.5,color:T.muted,lineHeight:1.5,marginTop:10}}>Your browser does not support desktop push notifications.</div>
              )}
              {sysPushStatus==="granted"&&toggles.sysPush&&(
                <div style={{fontSize:11.5,color:T.teal,background:T.teal+"10",border:`1px solid ${T.teal}22`,borderRadius:7,padding:"9px 12px",lineHeight:1.5,marginTop:10}}>
                  Active · Studlin will send alerts to your desktop even when this tab is in the background.
                </div>
              )}
              <Row label="Enable Message Audio Chimes" sub="A soft chime when a message arrives while you're elsewhere in Studlin. Muted automatically during a lock-in session." k="chatChimes" />
            </Card>
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
              <div style={{fontSize:12,color:T.muted,marginBottom:10}}>Strip gamification and go heads-down. Focus minutes, levels, and Weekly Wrapped are hidden. Chat, calendar sharing, and notes stay fully accessible.</div>
              <Row label="Private Account / Serious Mode" sub="Hides focus minutes, tiers, leaderboard, and Weekly Wrapped. Dashboard shows clean calendar + task grid only." k="_" right={
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
              <Row label="Show Online Status" sub="When off, your presence dot is hidden from friends and you'll appear offline in the Studlin Network." k="onlineStatus" />
              <Row label="Incognito Mode" sub="Completely masks your live study status — you'll appear offline everywhere and won't receive Join Lock-In requests." k="incognito" />
            </Card>
            <Card style={{marginBottom:12}}>
              <div style={{fontSize:14,fontWeight:700,color:T.white,marginBottom:4}}>Data &amp; AI</div>
              <div style={{fontSize:12,color:T.muted,marginBottom:10}}>You own your notes, essays, and recordings.</div>
              <Row label="Use my work to train Studlin AI" sub="Off by default. We will never share your raw content." k="collect" />
              <Row label="Anonymous usage analytics" sub="Helps us fix bugs and prioritise features." k="analytics" />
              <div style={{display:"flex",gap:8,marginTop:14,flexWrap:"wrap"}}>
                <Btn variant="subtle" onClick={exportAllData}>{React.createElement("span",{style:{display:"flex",alignItems:"center",gap:6}},Icon.copy,"Export all data")}</Btn>
                <Btn variant="subtle" onClick={downloadChatHistory} disabled={chatHistoryLoading}>{chatHistoryLoading?"Preparing…":"Download chat history"}</Btn>
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
              <div style={{fontSize:14,fontWeight:700,color:T.white,marginBottom:16}}>AI tutor</div>
              <Field label="Response verbosity"><div style={{display:"flex",gap:6}}>{["Concise","Balanced","Comprehensive"].map(t=><Chip key={t} active={verb===t} onClick={()=>{setVerb(t);lsSet("pref-verb",t);}}>{t}</Chip>)}</div></Field>
              <Field label="Tutor style">
                <SelectChip options={["Socratic","Direct","Encouraging","Strict"]} value={tutorStyle} onChange={v=>{setTutorStyle(v);lsSet("pref-tutorStyle",v);}} />
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

          {active==="Subjects & Labels" && (<>
            <Card>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:16}}>
                <div>
                  <div style={{fontSize:14,fontWeight:700,color:T.white,marginBottom:3}}>Manage Subjects & Labels</div>
                  <div style={{fontSize:12,color:T.muted}}>Color-code your classes. These labels appear on your calendar and tasks globally.</div>
                </div>
                <Btn onClick={()=>setMgmtSubjs(s=>[...s,{id:String(Date.now()),label:"",color:SUBJECT_COLORS[s.length%SUBJECT_COLORS.length]}])}>+ Add</Btn>
              </div>
              {mgmtSubjs.length===0&&(
                <div style={{fontSize:12.5,color:T.muted,padding:"20px 0",textAlign:"center",borderTop:`1px solid ${T.border}`}}>No subjects yet. Click "+ Add" to create your first label.</div>
              )}
              {mgmtSubjs.map((sub,i)=>(
                <div key={sub.id||i} style={{display:"flex",alignItems:"center",gap:10,padding:"12px 0",borderBottom:`1px solid ${T.border}`}}>
                  <div style={{display:"flex",gap:4,flexWrap:"wrap",flexShrink:0,maxWidth:120}}>
                    {SUBJECT_COLORS.map(c=>(
                      <div key={c} onClick={()=>setMgmtSubjs(s=>s.map((x,j)=>j===i?{...x,color:c}:x))} title={c} style={{width:14,height:14,borderRadius:"50%",background:c,cursor:"pointer",boxSizing:"border-box",border:sub.color===c?`2.5px solid ${T.white}`:`2px solid transparent`,transition:"transform 0.12s",transform:sub.color===c?"scale(1.25)":"scale(1)",flexShrink:0}} />
                    ))}
                  </div>
                  <div style={{width:10,height:10,borderRadius:"50%",background:sub.color,flexShrink:0}} />
                  <input value={sub.label} onChange={e=>setMgmtSubjs(s=>s.map((x,j)=>j===i?{...x,label:e.target.value}:x))} placeholder="Subject name..." style={{flex:1,background:T.card2,border:`1px solid ${T.border}`,borderRadius:7,padding:"7px 10px",color:T.text,fontSize:13,fontFamily:T.font,outline:"none"}} />
                  <button onClick={()=>setMgmtSubjs(s=>s.filter((_,j)=>j!==i))} style={{background:"none",border:`1px solid ${T.border}`,color:T.muted,cursor:"pointer",borderRadius:6,padding:"4px 10px",fontSize:12,fontFamily:T.font}}>Remove</button>
                </div>
              ))}
              <div style={{display:"flex",gap:10,marginTop:16,alignItems:"center"}}>
                <Btn onClick={saveMgmtSubjs}>Save changes</Btn>
                <Btn variant="subtle" onClick={()=>setMgmtSubjs(DEFAULT_SUBJECTS.map(s=>({...s})))}>Reset to defaults</Btn>
                {mgmtSaved&&<span style={{fontSize:12,color:T.lime,fontWeight:600}}>✓ Saved</span>}
              </div>
            </Card>
          </>)}

          {active==="Calendar Preferences" && (<>
            <Card>
              <div style={{fontSize:14,fontWeight:700,color:T.white,marginBottom:3}}>Weekly Routine</div>
              <div style={{fontSize:12,color:T.muted,marginBottom:16}}>Your classes, sports, and shifts — the times the AI treats as absolute and never schedules over.</div>
              <Btn onClick={onOpenRoutineWizard}>Manage Routine</Btn>
            </Card>
          </>)}

          {active==="Integrations" && (<>
            {integrationToast&&(
              <div style={{position:"fixed",top:20,right:20,zIndex:999,padding:"11px 18px",borderRadius:10,background:integrationToast.type==="error"?T.red:T.teal,color:"#fff",fontSize:13,fontWeight:600,boxShadow:"0 8px 24px rgba(0,0,0,0.35)",animation:"studlinPop 0.2s ease",maxWidth:340}}>
                {integrationToast.msg}
              </div>
            )}
            <Card style={{marginBottom:12}}>
              <div style={{fontSize:14,fontWeight:700,color:T.white,marginBottom:4}}>Calendar Integrations</div>
              <div style={{fontSize:12,color:T.text,marginBottom:16,lineHeight:1.6}}>Pull your existing events into Studlin. Your data is never stored on our servers — events are cached locally on this device only.</div>
              <div style={{display:"flex",flexDirection:"column",gap:10}}>
                <div style={{display:"flex",alignItems:"center",gap:14,padding:"14px 16px",borderRadius:10,background:T.card2,border:`1px solid ${calGoogleLinked?T.teal+"44":T.border}`,transition:"border-color 0.2s"}}>
                  <div style={{width:40,height:40,borderRadius:10,background:"rgba(66,133,244,0.10)",border:"1px solid rgba(66,133,244,0.22)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
                  </div>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontSize:13,fontWeight:600,color:T.white}}>Google Calendar</div>
                    <div style={{fontSize:11,color:calGoogleLinked?T.teal:(googleSyncing?T.amber:T.muted),marginTop:2}}>
                      {googleSyncing?"Importing events from Google…":calGoogleLinked?"Connected · events synced to your calendar":"Read-only · imports your upcoming events"}
                    </div>
                  </div>
                  <BtnSm variant={calGoogleLinked?"subtle":"lime"} onClick={calGoogleLinked?disconnectGoogle:connectGoogle} style={{flexShrink:0,opacity:googleSyncing?0.55:1}}>
                    {googleSyncing?"Syncing…":calGoogleLinked?"Disconnect":"Connect"}
                  </BtnSm>
                </div>
                <div style={{display:"flex",alignItems:"center",gap:14,padding:"14px 16px",borderRadius:10,background:T.card2,border:`1px solid ${T.border}`,opacity:0.5}}>
                  <div style={{width:40,height:40,borderRadius:10,background:"rgba(255,255,255,0.06)",border:`1px solid ${T.border}`,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill={T.text}><path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/></svg>
                  </div>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontSize:13,fontWeight:600,color:T.white}}>Apple Calendar<span style={{marginLeft:8,fontSize:10.5,fontWeight:600,color:T.faint}}>(Coming Soon)</span></div>
                    <div style={{fontSize:11,color:T.muted,marginTop:2}}>Import iCloud events into Studlin</div>
                  </div>
                  <BtnSm variant="subtle" disabled style={{flexShrink:0,cursor:"not-allowed"}}>Connect</BtnSm>
                </div>
                <div style={{position:"relative"}}
                  onMouseEnter={()=>setCanvasTipOpen(true)} onMouseLeave={()=>setCanvasTipOpen(false)}>
                  <div style={{display:"flex",alignItems:"center",gap:14,padding:"14px 16px",borderRadius:10,background:T.card2,border:`1px solid ${T.border}`,opacity:0.5}}>
                    <div style={{width:40,height:40,borderRadius:10,background:"rgba(226,80,45,0.10)",border:"1px solid rgba(226,80,45,0.22)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#E2502D" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></svg>
                    </div>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{fontSize:13,fontWeight:600,color:T.white}}>Canvas LMS<span style={{marginLeft:8,fontSize:10.5,fontWeight:600,color:T.faint}}>(Coming Soon)</span></div>
                      <div style={{fontSize:11,color:T.muted,marginTop:2}}>Institutional Partner Feature</div>
                    </div>
                    <BtnSm variant="subtle" disabled style={{flexShrink:0,cursor:"not-allowed"}}>Connect</BtnSm>
                  </div>
                  {canvasTipOpen&&(
                    <div style={{position:"absolute",top:"100%",left:0,right:0,marginTop:8,padding:"12px 14px",borderRadius:10,background:T.card,border:`1px solid ${T.border}`,boxShadow:"0 8px 24px rgba(0,0,0,0.35)",fontSize:11.5,color:T.muted,lineHeight:1.6,zIndex:10}}>
                      Studlin integrates securely via enterprise OAuth 2.0 developer keys issued directly by university IT administrations to ensure strict FERPA compliance and data security.
                    </div>
                  )}
                </div>
              </div>
              {(calGoogleLinked||calAppleLinked)&&(
                <div style={{marginTop:14,padding:"10px 14px",borderRadius:8,background:T.teal+"10",border:`1px solid ${T.teal}25`,fontSize:12,color:T.teal,lineHeight:1.6}}>
                  Calendar sync active. Events appear in read-only mode on your Studlin calendar and are stored locally on this device.
                </div>
              )}
              {DEV_MODE&&(
                <BtnSm variant="subtle" disabled={canvasSeeding} style={{marginTop:14}} onClick={async()=>{
                  setCanvasSeeding(true);
                  try{await injectMockCanvasData();}catch(e){}
                  setCanvasSeeding(false);
                }}>{canvasSeeding?"Seeding…":"Seed mock Canvas data (dev only)"}</BtnSm>
              )}
            </Card>
            <Card>
              <div style={{fontSize:14,fontWeight:700,color:T.white,marginBottom:4}}>Coming soon</div>
              <div style={{fontSize:12,color:T.muted,lineHeight:1.6}}>Notion and Outlook integrations are in development. They'll appear here when ready.</div>
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
              <div style={{fontSize:12,color:T.muted,marginBottom:14}}>Wipe your streak, focus minutes, level, and Wrapped history. Notes and essays are kept.</div>
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
              <Btn variant="danger" onClick={()=>setDeleteAccountOpen(true)}>Delete my account</Btn>
            </Card>
            <Modal open={deleteAccountOpen} onClose={()=>setDeleteAccountOpen(false)} title="Delete your account?" sub="Are you sure? This will permanently delete your schedules, notes, and optimized plans."
              footer={<>
                <Btn variant="subtle" onClick={()=>setDeleteAccountOpen(false)}>Cancel</Btn>
                <Btn variant="danger" onClick={confirmDeleteAccount}>Delete my account</Btn>
              </>}>
              <div style={{fontSize:12.5,color:T.text,lineHeight:1.6}}>This cannot be undone. You'll be signed out immediately.</div>
            </Modal>
          </>)}
        </div>
      </div>
    </div>
  );
}


// ─── PROFILE ──────────────────────────────────────────────────────────────────
function Profile({setActive}={}) {
  const [prof,setProfState]=useState(()=>getProfile());
  const [picUrl,setPicUrl]=useState(()=>getUserPicUrl());
  const [status,setStatus]=useState(prof.status||"");
  const [affiliation,setAffiliation]=useState(prof.affiliation||prof.school||"");
  const [picSaved,setPicSaved]=useState(false);
  const fileInputRef=useRef(null);
  const camInputRef=useRef(null);
  const prefs=getSchedulePreferences();
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
    const updatedPrefs={...getSchedulePreferences(),difficultyPreference:difficulty};
    setSchedulePreferences(updatedPrefs);
    setPrefSaved(true);
    setTimeout(()=>setPrefSaved(false),2200);
  };

  const affiliationLabel = status==="highschool"?"School name":status==="college"?"University":"School / affiliation";
  const affiliationPlaceholder = status==="highschool"?"e.g. Lincoln High School":status==="college"?"e.g. UCLA, NYU...":"Your school or company";


  const StatusChip=({value,label,active})=>(
    <button type="button" onClick={()=>setStatus(value)} style={{padding:"8px 16px",borderRadius:8,fontSize:12,fontWeight:active?600:400,cursor:"pointer",border:`1.5px solid ${active?T.lime+"66":T.border}`,background:active?T.lime+"14":"transparent",color:active?T.lime:T.muted,fontFamily:T.font,transition:"all 0.15s"}}>{label}</button>
  );

  return (
    <div>
      {/* ── Header card */}
      <Card style={{display:"flex",alignItems:"center",gap:28,marginBottom:16,padding:28}}>
        {/* Profile picture — click anywhere to change */}
        <div style={{position:"relative",flexShrink:0,cursor:"pointer"}} onClick={()=>fileInputRef.current&&fileInputRef.current.click()}
          onMouseEnter={e=>{const ov=e.currentTarget.querySelector(".pic-overlay");if(ov)ov.style.opacity="1";}}
          onMouseLeave={e=>{const ov=e.currentTarget.querySelector(".pic-overlay");if(ov)ov.style.opacity="0";}}>
          {picUrl
            ? <img src={picUrl} style={{width:96,height:96,borderRadius:"50%",objectFit:"cover",border:`3px solid ${T.lime}`,display:"block"}} alt="Profile" />
            : <div style={{width:96,height:96,borderRadius:"50%",background:`linear-gradient(135deg,${T.forest},${T.limeDk})`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:32,fontWeight:700,color:"#fff",border:`3px solid ${T.lime}`,letterSpacing:"-0.02em"}}>{initials}</div>
          }
          <div className="pic-overlay" style={{position:"absolute",inset:0,borderRadius:"50%",background:"rgba(0,0,0,0.55)",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:4,opacity:0,transition:"opacity 0.18s"}}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>
            <span style={{fontSize:9,fontWeight:700,color:"#fff",letterSpacing:"0.04em"}}>CHANGE</span>
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
            {status&&<Badge color={T.teal}>{status==="highschool"?"High School":"College"}</Badge>}
          </div>
          {picSaved&&<div style={{marginTop:8,fontSize:11.5,color:T.lime,fontWeight:600}}>Profile picture updated.</div>}
        </div>
        <div style={{textAlign:"right"}}>
          <div style={{fontSize:42,fontWeight:700,color:T.lime,letterSpacing:"-0.04em",lineHeight:1}}>{lvl.minutes.toLocaleString()}m</div>
          <div style={{fontSize:12,color:T.muted,marginTop:3}}>Focused · {lvl.title}</div>
          <div style={{marginTop:10,width:160}}><Prog pct={lvl.tierPct} /></div>
          <div style={{fontSize:11,color:T.muted,marginTop:4}}>{lvl.nextTier?`${(lvl.nextTier.minMinutes-lvl.minutes).toLocaleString()}m to ${lvl.nextTier.title}`:"Maximum rank achieved"}</div>
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
          </div>
        </Field>

        {status&&(
          <Field label={affiliationLabel} hint="Visible to classmates on leaderboards.">
            <SchoolSelect value={affiliation} onChange={setAffiliation} placeholder={affiliationPlaceholder} />
          </Field>
        )}

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

      {/* ── Explore Classes — institutional live-demo, gated to exactly the
          two seeded demo schools (see DEMO_CLASSES_BY_SCHOOL). Renders
          nothing at all for every other school. */}
      {DEMO_CLASSES_BY_SCHOOL[affiliation] && (
        <ExploreClassesCard school={affiliation} classes={DEMO_CLASSES_BY_SCHOOL[affiliation]} setActive={setActive} />
      )}

      {/* ── Stats (real data only) */}
      {(()=>{
        const allDecks=lsGet("decks",[]);
        const cardsMastered=allDecks.reduce((a,d)=>a+(d.done||0),0);
        const stats=[
          ["Total study time",fmtH(ps.totalMin)||"0m",T.lime],
          ["Focus sessions",String(ps.focusSessions),T.teal],
          ["Cards mastered",String(cardsMastered),T.blue],
          ["Day streak",String(streak),T.amber],
          ["Level",lvl.title,T.red],
        ];
        return(
          <div style={{display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:10,marginBottom:16}}>
            {stats.map(([l,v,c],i)=>(
              <Card key={i} style={{textAlign:"center",padding:16}}>
                <div style={{fontSize:26,fontWeight:700,color:c,letterSpacing:"-0.02em",lineHeight:1}}>{v}</div>
                <div style={{fontSize:11,color:T.muted,marginTop:6}}>{l}</div>
              </Card>
            ))}
          </div>
        );
      })()}

      {/* ── Weekly activity */}
      {(()=>{
        const allSessions=lsGet("sessions",[]);
        const now=new Date();
        const dow=(now.getDay()+6)%7;
        const monDate=new Date(now);monDate.setDate(now.getDate()-dow);
        const days=["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];
        const weekData=days.map((lab,i)=>{
          const d=new Date(monDate);d.setDate(monDate.getDate()+i);
          const k=dayKey(d);
          const mins=allSessions.filter(s=>s.d===k).reduce((a,s)=>a+(s.m||0),0);
          return{lab,mins,isToday:k===dayKey(now),future:d>now&&k!==dayKey(now)};
        });
        const maxMins=Math.max(1,...weekData.map(d=>d.mins));
        const totalWeekMins=weekData.reduce((a,d)=>a+d.mins,0);
        return(
          <div style={{display:"grid",gridTemplateColumns:"1fr",gap:12}}>
            <Card>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:14}}>
                <div>
                  <Label>Hours Focused</Label>
                  <div style={{fontSize:22,fontWeight:700,color:T.white,letterSpacing:"-0.02em",lineHeight:1}}>{fmtH(totalWeekMins)||"0m"}</div>
                  <div style={{fontSize:11,color:T.muted,marginTop:2}}>this week</div>
                </div>
              </div>
              <div style={{display:"flex",gap:4,alignItems:"flex-end",height:100}}>
                {weekData.map((d,i)=>{
                  const h=maxMins>0?Math.max(2,Math.round((d.mins/maxMins)*90)):2;
                  return(
                    <div key={i} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:5,opacity:d.future?0.3:1}}>
                      {d.mins>0&&<div style={{fontSize:8,color:d.isToday?T.lime:T.faint,fontFamily:T.mono}}>{d.mins>=60?Math.floor(d.mins/60)+"h":d.mins+"m"}</div>}
                      <div style={{width:"100%",height:h,background:d.isToday?T.lime:T.card2,borderRadius:"4px 4px 0 0",transition:"height 0.4s",border:d.isToday?`1px solid ${T.limeDk}`:"none"}} />
                      <div style={{fontSize:9,color:d.isToday?T.lime:T.faint,fontWeight:d.isToday?700:400,fontFamily:T.mono}}>{d.lab.slice(0,1)}</div>
                    </div>
                  );
                })}
              </div>
            </Card>
          </div>
        );
      })()}
    </div>
  );
}

// ─── LEVEL ROADMAP MODAL ─────────────────────────────────────────────────────
function LevelRoadmapModal({open,onClose,currentMinutes}){
  if(!open)return null;
  return(
    <div onClick={onClose} style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.6)",backdropFilter:"blur(8px)",WebkitBackdropFilter:"blur(8px)",zIndex:1000,display:"flex",alignItems:"center",justifyContent:"center",padding:24,animation:"studlinFade 0.18s ease-out"}}>
      <div onClick={e=>e.stopPropagation()} style={{width:"100%",maxWidth:460,maxHeight:"80vh",background:T.card,borderRadius:18,border:`1px solid ${T.border}`,overflow:"hidden",display:"flex",flexDirection:"column",boxShadow:"0 28px 70px -20px rgba(0,0,0,0.55)",animation:"studlinPop 0.22s cubic-bezier(.2,.85,.3,1)"}}>
        <div style={{padding:"20px 22px 14px",borderBottom:`1px solid ${T.border}`,display:"flex",alignItems:"center",justifyContent:"space-between",flexShrink:0}}>
          <div>
            <div style={{fontSize:16,fontWeight:700,color:T.white,letterSpacing:"-0.01em"}}>Career Rank Roadmap</div>
            <div style={{fontSize:12.5,color:T.muted,marginTop:3}}>11 tiers · Intern to CEO</div>
          </div>
          <button onClick={onClose} style={{width:30,height:30,borderRadius:8,border:`1px solid ${T.border}`,background:T.card2,color:T.muted,display:"grid",placeItems:"center",cursor:"pointer",fontSize:15}}>×</button>
        </div>
        <div style={{padding:"18px 22px",overflowY:"auto",flex:1,minHeight:0}}>
          {PROF_TIERS.map((tier,i)=>{
            const next=PROF_TIERS[i+1]||null;
            const unlocked=currentMinutes>=tier.minMinutes;
            const isCurrent=unlocked&&(!next||currentMinutes<next.minMinutes);
            const pct=isCurrent&&next?Math.round(Math.max(0,Math.min(100,(currentMinutes-tier.minMinutes)/(next.minMinutes-tier.minMinutes)*100))):unlocked?100:0;
            return(
              <div key={tier.title} style={{display:"flex",gap:14,position:"relative",paddingBottom:i<PROF_TIERS.length-1?8:0}}>
                {i<PROF_TIERS.length-1&&<div style={{position:"absolute",left:19,top:40,width:2,height:"calc(100% - 12px)",background:unlocked?T.lime+"66":T.card2,zIndex:0}}/>}
                <div style={{width:40,height:40,borderRadius:"50%",background:isCurrent?T.lime:unlocked?T.lime+"22":T.card2,border:`2px solid ${isCurrent?T.lime:unlocked?T.lime+"55":T.faint}`,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,zIndex:1,fontSize:15,fontWeight:700,color:isCurrent?T.ink:unlocked?T.lime:T.faint}}>
                  {isCurrent?"★":unlocked?"✓":""}
                </div>
                <div style={{flex:1,paddingBottom:i<PROF_TIERS.length-1?18:0,minWidth:0}}>
                  <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:8}}>
                    <div style={{fontSize:13.5,fontWeight:isCurrent?700:600,color:isCurrent?T.lime:unlocked?T.text:T.muted,letterSpacing:"-0.01em"}}>{tier.title}</div>
                    <div style={{fontFamily:T.mono,fontSize:10,color:unlocked?T.lime:T.faint,fontWeight:600,flexShrink:0}}>{tier.minMinutes.toLocaleString()}m</div>
                  </div>
                  {isCurrent&&next&&(
                    <div style={{marginTop:7}}>
                      <div style={{height:4,background:T.card2,borderRadius:99,overflow:"hidden"}}><div style={{height:"100%",width:pct+"%",background:T.lime,borderRadius:99,transition:"width 0.5s ease"}}/></div>
                      <div style={{fontSize:11,color:T.muted,marginTop:4}}>{(next.minMinutes-currentMinutes).toLocaleString()}m until {next.title}</div>
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
function LeaderboardModal({open,onClose,currentMinutes,currentName,currentStreak}){
  // Hooks must run unconditionally on every render (this component stays
  // mounted with `open` just toggling as a prop, not conditionally
  // rendered) — so the "closed" bail-out has to come after all of them.
  const [filter,setFilter]=useState("global");
  const [profiles,setProfiles]=useState([]);
  useEffect(()=>{
    if(!open)return;
    let cancelled=false;
    fetchTopProfiles(30).then(rows=>{if(!cancelled)setProfiles(rows);});
    return ()=>{cancelled=true;};
  },[open]);
  if(!open)return null;
  const userTier=getProfTitle(currentMinutes);
  const myUid=firebase.auth().currentUser?.uid||null;
  const allUsers=mergeLeaderboard(profiles, currentName, currentMinutes, currentStreak, myUid);
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
                <div style={{fontFamily:T.mono,fontSize:13,fontWeight:700,color:rankColor(u.r)||T.text}}>{u.minutes.toLocaleString()}</div>
                <div style={{fontSize:10,color:T.faint}}>min</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── DASHBOARD ────────────────────────────────────────────────────────────────
// Disabled "for now" per request — flip back to true to restore the inline
// Global Leaderboard card on the dashboard.
const SHOW_GLOBAL_LEADERBOARD=false;
function Dashboard({setActive, setScheduleSettingsOpen=()=>{}, seriousMode=false, rescheduleTask, setRescheduleTask, dashToast, setDashToast}) {
  const realStats=sessionStats();
  const realStreak=Math.max(1,getStreak());
  const lvl=levelInfo();
  const wk=weekStreak();
  // Live top profiles from Firestore, ranked by real XP — fetched once per
  // mount; "you" is always merged in fresh on every render below so your own
  // row never lags behind what you just earned.
  const [topProfiles,setTopProfiles]=useState([]);
  useEffect(()=>{
    let cancelled=false;
    fetchTopProfiles(8).then(rows=>{if(!cancelled)setTopProfiles(rows);});
    return ()=>{cancelled=true;};
  },[]);
  const [,forcePlan]=useState(0);
  const [levelRoadmapOpen,setLevelRoadmapOpen]=useState(false);
  const [leaderboardOpen,setLeaderboardOpen]=useState(false);
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
    kind:"deck",
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
    kind:"note",
  }));
  const pickUpItems=[...realDecks,...noteCards];
  // Real upcoming events (next 14 days)
  const allEvents=lsGet("events",[]);
  const today=dayKey();
  const in14days=new Date();in14days.setDate(in14days.getDate()+14);
  const upcomingEvents=allEvents
    .filter(ev=>!ev.checklist&&ev.date>=today&&ev.date<=dayKey(in14days)&&ev.status!=="done")
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
  // Checklist to-dos — no duration, no calendar slot, just a checkbox. Kept
  // in the same `events` localStorage array as everything else (same
  // id/status shape markDone-style toggles already expect), just flagged
  // and filtered out of every calendar/planner surface above.
  const checklistItems=allEvents.filter(ev=>ev.checklist&&ev.status!=="done").sort((a,b)=>(a.date||"9999").localeCompare(b.date||"9999"));
  const [checklistDraft,setChecklistDraft]=useState("");
  const toggleChecklistItem=(id)=>{
    const all=lsGet("events",[]);
    const next=all.map(ev=>ev.id===id?{...ev,status:ev.status==="done"?"pending":"done",completedAt:ev.status==="done"?null:Date.now()}:ev);
    lsSet("events",next);forcePlan(x=>x+1);
  };
  const addChecklistItem=()=>{
    if(!checklistDraft.trim())return;
    const all=lsGet("events",[]);
    const item={id:String(Date.now()+Math.random()*1000),title:checklistDraft.trim(),date:"",time:"",subject:"",kind:"deadline",notes:"",checklist:true,deadline:null,priority:5,difficulty:5,duration:0,status:"pending",timeSpent:0,completedAt:null};
    lsSet("events",[...all,item]);
    setChecklistDraft("");forcePlan(x=>x+1);
  };
  // Real weekly wrapped stats
  const weeklyFocusMin=realStats.weekMin;
  // Real cards mastered + words written totals
  const cardsMasteredTotal=rawDecks.reduce((a,d)=>a+(d.done||0),0);
  const stripHtml=(html)=>(html||"").replace(/<[^>]*>/g," ");
  const rawEssays=lsGet("essays",[]);
  const wordsWrittenTotal=rawEssays.reduce((a,e)=>{
    if(typeof e.words==="number")return a+e.words;
    const txt=stripHtml(e.content).trim();
    return a+(txt?txt.split(/\s+/).length:0);
  },0);
  // Real session activity for the last 7 days
  const allSessions=lsGet("sessions",[]);
  const weekDays7=(()=>{const arr=[];const now=new Date();const dow=(now.getDay()+6)%7;const mon=new Date(now);mon.setDate(now.getDate()-dow);for(let i=0;i<7;i++){const d=new Date(mon);d.setDate(mon.getDate()+i);arr.push(d);}return arr;})();
  // Top subject this week — from completed plan tasks' subject field
  const subjCounts={};
  allEvents.filter(ev=>ev.status==="done"&&ev.date>=dayKey(weekDays7[0])).forEach(ev=>{subjCounts[ev.subject]=(subjCounts[ev.subject]||0)+1;});
  const topSubjectEntry=Object.entries(subjCounts).sort((a,b)=>b[1]-a[1])[0];
  const topSubjectThisWeek=topSubjectEntry?topSubjectEntry[0]:null;
  // Real 91-day streak heatmap from login days + session minutes
  const loginDaysSet=new Set(lsGet("days",[]));
  const minsByDay={};
  allSessions.forEach(s=>{minsByDay[s.d]=(minsByDay[s.d]||0)+(s.m||0);});
  const heatmapCells=(()=>{const cells=[];const now=new Date();for(let i=90;i>=0;i--){const d=new Date(now);d.setDate(now.getDate()-i);const k=dayKey(d);const mins=minsByDay[k]||0;let lvl=0;if(loginDaysSet.has(k)||mins>0){lvl=mins>=120?4:mins>=60?3:mins>=30?2:1;}cells.push(lvl);}return cells;})();
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
  // Weekly Wrapped is no longer a permanent dashboard card — it now surfaces
  // once as a full-screen popup during the Sunday/Monday evening window
  // (>=6pm), gated by a per-week localStorage flag so it doesn't reappear
  // once dismissed, but comes back fresh next week.
  const wrappedWeekKey=today.slice(0,4)+"-"+weekNo();
  const isWrappedWindow=(()=>{const d=new Date();const day=d.getDay();return(day===0||day===1)&&d.getHours()>=18;})();
  const [wrappedOpen,setWrappedOpen]=useState(()=>isWrappedWindow&&!lsGet("wrapped-dismissed-"+wrappedWeekKey,false));
  const dismissWrapped=()=>{lsSet("wrapped-dismissed-"+wrappedWeekKey,true);setWrappedOpen(false);};
  // Dynamic leaderboard — real Firestore profiles ranked by actual focus minutes, "you" merged in live
  const myUid=firebase.auth().currentUser?.uid||null;
  const lbUsers=mergeLeaderboard(topProfiles, firstName, lvl.minutes, realStreak, myUid, 5);
  const lbRankColor=(r)=>r===1?"#FFD700":r===2?"#C0C0C0":r===3?"#CD7F32":T.muted;
  const lbRankBg=(r)=>r===1?"rgba(255,215,0,0.10)":r===2?"rgba(192,192,192,0.07)":r===3?"rgba(205,127,50,0.07)":"transparent";
  return (
    <>
    <div style={{display:"flex",flexDirection:"column",gap:16,paddingBottom:40}}>

      {/* GREETING STRIP — full 3-col in normal mode, single card in Serious Mode */}
      {seriousMode ? (
        <div style={{background:`linear-gradient(135deg, ${T.forest} 0%, #1B4536 100%)`,color:T.cream,borderRadius:22,padding:"28px 34px",position:"relative",overflow:"hidden"}}>
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
        <div style={{background:`linear-gradient(135deg, ${T.forest} 0%, #1B4536 100%)`,color:T.cream,borderRadius:22,padding:"26px 30px",position:"relative",overflow:"hidden"}}>
          <div style={{position:"absolute",right:-40,top:-40,width:240,height:240,background:"radial-gradient(circle,rgba(200,255,90,0.18),transparent 70%)",pointerEvents:"none"}} />
          <div style={{position:"relative"}}>
            <div style={{fontFamily:T.mono,fontSize:11,letterSpacing:"0.14em",textTransform:"uppercase",color:"rgba(246,241,230,0.55)",marginBottom:6}}>{todayLabel()} · Week {weekNo()}</div>
            <div style={{fontFamily:T.hand,fontSize:54,lineHeight:0.95,fontWeight:600,color:T.cream,margin:"0 0 4px",animation:"studlinRise 0.5s ease-out"}}>{greet}, <span style={{color:T.lime}}>{firstName}.</span></div>
            <p style={{fontSize:13.5,color:"rgba(246,241,230,0.7)",margin:"8px 0 16px",lineHeight:1.5,maxWidth:380}}>{planLeft>0?<>You've got <strong style={{color:T.cream}}>{planLeft} task{planLeft===1?"":"s"} left</strong> on today's plan. Let's lock in.</>:plan.length>0?<>All <strong style={{color:T.cream}}>{plan.length} tasks done</strong> today. Outstanding work.</>:<>Nothing scheduled yet. Add a few tasks and let's lock in.</>}</p>
            <div style={{display:"flex",gap:10,flexWrap:"wrap"}}>
              <button onClick={()=>setActive("aichat")} style={{display:"inline-flex",alignItems:"center",gap:8,padding:"9px 16px",background:T.lime,color:T.ink,borderRadius:99,fontSize:13,fontWeight:600,border:"none",cursor:"pointer",fontFamily:T.font}}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" stroke="none"><path d="M12 3c-4.97 0-9 3.185-9 7.115 0 2.557 1.522 4.82 3.889 6.115L6 21l4.339-2.308C11.536 18.888 12.746 19 14 19c4.97 0 9-3.185 9-7.115S16.97 3 12 3z"/></svg>
                Ask Studlin AI
              </button>
              <button onClick={()=>setActive("calendar")} style={{display:"inline-flex",alignItems:"center",gap:8,padding:"9px 16px",color:T.cream,border:"1px solid rgba(246,241,230,0.18)",background:"transparent",borderRadius:99,fontSize:13,fontWeight:600,cursor:"pointer",fontFamily:T.font}}>View today's plan</button>
              <button onClick={()=>setScheduleSettingsOpen(true)} style={{display:"inline-flex",alignItems:"center",gap:8,padding:"9px 16px",color:T.cream,border:"1px solid rgba(246,241,230,0.18)",background:"transparent",borderRadius:99,fontSize:13,fontWeight:600,cursor:"pointer",fontFamily:T.font}}>Customize schedule</button>
            </div>
          </div>
        </div>

        {/* Streak — medium green card matching design */}
        <div onClick={()=>setActive("profile")} style={{background:isLight?"#5B8C2A":"#78BC2A",borderRadius:22,padding:22,cursor:"pointer",display:"flex",flexDirection:"column",position:"relative",overflow:"hidden"}}>
          <div style={{position:"absolute",right:-20,top:-20,width:120,height:120,background:"radial-gradient(circle,rgba(174,206,94,0.15),transparent 70%)",pointerEvents:"none"}} />
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",position:"relative"}}>
            <span style={{fontFamily:T.mono,fontSize:10.5,letterSpacing:"0.14em",textTransform:"uppercase",color:"rgba(246,241,230,0.55)",fontWeight:600}}>Day Streak</span>
            <svg width="22" height="22" viewBox="0 0 24 24" stroke="none">
              <defs><linearGradient id="streakFlameGrad2" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#FFB347"/><stop offset="100%" stopColor="#FF6B00"/></linearGradient></defs>
              <path fill="url(#streakFlameGrad2)" d="M12 2s4 5 4 9a4 4 0 0 1-8 0c0-2 1-3 1-3s-3 2-3 6a6 6 0 0 0 12 0c0-5-6-12-6-12z"/>
            </svg>
          </div>
          <div style={{fontFamily:T.hand,fontSize:60,lineHeight:0.85,fontWeight:600,color:T.cream,margin:"10px 0 2px",position:"relative"}}>{realStreak}<span style={{fontSize:20,color:"rgba(246,241,230,0.55)",marginLeft:6}}>days</span></div>
            <div style={{fontSize:12,color:"rgba(246,241,230,0.65)",marginBottom:4}}>Today{wk.find(d=>d.today)?.on?" · active":" · keep going!"}</div>
            <div style={{display:"flex",gap:5,marginTop:"auto"}}>
              {wk.map((d,i)=>{
                const isToday=d.today, on=d.on;
                return(
                  <div key={i} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:3}}>
                    <div style={{width:"100%",height:28,borderRadius:7,background:isToday?"rgba(174,206,94,0.25)":on?"rgba(246,241,230,0.12)":"rgba(246,241,230,0.05)",color:on?"#FF8C38":"rgba(246,241,230,0.25)",opacity:d.future?0.4:1,display:"flex",alignItems:"center",justifyContent:"center",boxShadow:isToday?`0 0 0 1.5px ${T.lime}`:"none"}}>
                      {on||isToday
                        ?<svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" stroke="none"><path d="M12 2s4 5 4 9a4 4 0 0 1-8 0c0-2 1-3 1-3s-3 2-3 6a6 6 0 0 0 12 0c0-5-6-12-6-12z"/></svg>
                        :<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="4"/></svg>
                      }
                    </div>
                    <span style={{fontSize:9,fontFamily:T.mono,fontWeight:isToday?700:400,color:isToday?T.lime:"rgba(246,241,230,0.35)"}}>{d.lab}</span>
                  </div>
                );
              })}
            </div>
        </div>

        {/* Focus & Rank */}
        <div onClick={()=>setLevelRoadmapOpen(true)} style={{background:T.card,borderRadius:22,padding:22,cursor:"pointer",display:"flex",flexDirection:"column"}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
            <span style={{fontFamily:T.mono,fontSize:10.5,letterSpacing:"0.14em",textTransform:"uppercase",color:T.muted,fontWeight:600}}>Focus &amp; Rank</span>
            <span style={{fontFamily:T.mono,fontSize:9.5,letterSpacing:"0.10em",background:T.lime+"33",padding:"3px 9px",borderRadius:99,color:T.limeDk,border:`1px solid ${T.lime}55`,fontWeight:700}}>{lvl.title.toUpperCase()}</span>
          </div>
          <div style={{fontFamily:T.hand,fontSize:60,lineHeight:0.85,fontWeight:600,color:T.text,margin:"10px 0 2px"}}>{lvl.minutes.toLocaleString()}<span style={{fontSize:18,color:T.muted,marginLeft:6,fontFamily:T.font,fontWeight:400}}>min</span></div>
          <div style={{fontSize:12,color:T.muted,marginBottom:4}}>{lvl.nextTier?`${(lvl.nextTier.minMinutes-lvl.minutes).toLocaleString()} min to ${lvl.nextTier.title}`:"Maximum rank achieved"}</div>
          <div style={{height:6,background:T.card2,borderRadius:99,overflow:"hidden",marginTop:"auto"}}>
            <div style={{height:"100%",width:lvl.tierPct+"%",background:`linear-gradient(90deg,${T.limeDk},${T.lime})`,borderRadius:99,transition:"width 0.5s ease"}}/>
          </div>
          <div style={{fontSize:11,color:T.muted,marginTop:8,display:"flex",alignItems:"center",gap:4}}>
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>
            View career roadmap
          </div>
        </div>
      </div>
      )} {/* end seriousMode ternary */}

      {/* Quote of the Day */}
      {!seriousMode&&(()=>{
        const QUOTES=[
          {text:"Your future self will thank you for the work you put in today.",author:"Anonymous"},
          {text:"The secret of getting ahead is getting started.",author:"Mark Twain"},
          {text:"You don't have to be great to start, but you have to start to be great.",author:"Zig Ziglar"},
          {text:"Education is not the filling of a pail, but the lighting of a fire.",author:"W.B. Yeats"},
          {text:"Success is the sum of small efforts repeated day in and day out.",author:"Robert Collier"},
          {text:"The expert in anything was once a beginner.",author:"Helen Hayes"},
          {text:"Push yourself, because no one else is going to do it for you.",author:"Anonymous"},
          {text:"Don't watch the clock; do what it does. Keep going.",author:"Sam Levenson"},
          {text:"Believe you can and you're halfway there.",author:"Theodore Roosevelt"},
          {text:"It always seems impossible until it's done.",author:"Nelson Mandela"},
          {text:"Hard work beats talent when talent doesn't work hard.",author:"Tim Notke"},
          {text:"The more that you read, the more things you will know.",author:"Dr. Seuss"},
          {text:"An investment in knowledge pays the best interest.",author:"Benjamin Franklin"},
          {text:"Learning is not attained by chance — it must be sought with ardor.",author:"Abigail Adams"},
        ];
        const todayStr=new Date().toISOString().slice(0,10);
        const stored=lsGet("quote-of-day",null);
        let qIdx;
        if(stored&&stored.date===todayStr){
          qIdx=stored.idx;
        }else{
          const prev=stored?stored.idx:-1;
          let next=Math.floor(Math.random()*QUOTES.length);
          if(next===prev)next=(next+1)%QUOTES.length;
          qIdx=next;
          lsSet("quote-of-day",{date:todayStr,idx:qIdx});
        }
        const q=QUOTES[qIdx];
        return(
          <div style={{background:"#F5EE90",borderRadius:22,padding:"28px 32px",position:"relative",overflow:"hidden",display:"flex",alignItems:"flex-start",gap:24}}>
            <div style={{flex:1,minWidth:0}}>
              <div style={{fontFamily:T.mono,fontSize:10,letterSpacing:"0.14em",textTransform:"uppercase",color:"rgba(14,31,24,0.4)",marginBottom:10,fontWeight:600}}>Quote of the day</div>
              <p style={{fontFamily:"Georgia,serif",fontSize:18,fontStyle:"italic",lineHeight:1.55,color:"#0E1F18",margin:"0 0 12px",maxWidth:680}}>"{q.text}"</p>
              <div style={{fontSize:12,color:"rgba(14,31,24,0.45)",letterSpacing:"0.04em"}}>— {q.author.toUpperCase()}</div>
            </div>
            <button onClick={()=>{if(navigator.share)navigator.share({text:'"'+q.text+'" — '+q.author+'\n\nStudlin'});else if(navigator.clipboard)navigator.clipboard.writeText('"'+q.text+'" — '+q.author);}} style={{display:"inline-flex",alignItems:"center",gap:7,padding:"11px 18px",background:"#0E1F18",border:"none",borderRadius:99,fontSize:13,fontWeight:600,color:"#F6F1E6",cursor:"pointer",fontFamily:T.font,flexShrink:0,boxShadow:"0 4px 14px rgba(0,0,0,0.18)"}}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>
              Share Quote
            </button>
          </div>
        );
      })()}

      {/* ROW 2: Today's plan + Jump back in + Ask Studlin */}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:16}}>
        {/* Today's plan */}
        <div style={{background:T.card,borderRadius:22,padding:24,display:"flex",flexDirection:"column"}}>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:14,gap:8,flexWrap:"wrap"}}>
            <span style={{fontFamily:T.hand,fontSize:22,fontWeight:700,color:T.text}}>Today's plan</span>
            <div style={{display:"flex",alignItems:"center",gap:8}}>
              <span style={{fontFamily:T.mono,fontSize:10,letterSpacing:"0.1em",padding:"4px 9px",borderRadius:99,background:T.card2,color:T.muted,fontWeight:600}}>{planDoneCount} / {plan.length} DONE</span>
              <button onClick={()=>setActive("calendar")} style={{fontSize:12,color:T.muted,display:"inline-flex",alignItems:"center",gap:3,cursor:"pointer",background:"none",border:"none",fontFamily:T.font,fontWeight:500}}>Calendar <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg></button>
            </div>
          </div>
          {plan.length>0&&<div style={{height:3,background:T.card2,borderRadius:99,marginBottom:14,overflow:"hidden"}}><div style={{height:"100%",width:Math.round(planDoneCount/Math.max(plan.length,1)*100)+"%",background:`linear-gradient(90deg,${T.limeDk},${T.lime})`,borderRadius:99,transition:"width 0.5s ease"}} /></div>}
          {plan.length===0
            ?<div style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"24px 8px",textAlign:"center"}}>
              <div style={{fontSize:13,color:T.muted,marginBottom:18,lineHeight:1.6}}>Nothing scheduled for today. Add events to your calendar and they appear here automatically.</div>
              <div style={{display:"flex",gap:8,justifyContent:"center",flexWrap:"wrap"}}>
                <button onClick={()=>setActive("calendar")} style={{display:"inline-flex",alignItems:"center",gap:7,padding:"10px 20px",background:T.lime,color:T.ink,border:"none",borderRadius:99,fontSize:13,fontWeight:600,cursor:"pointer",fontFamily:T.font}}>Add a task</button>
                <button onClick={()=>{lsSet("pendingBrainDump",true);setActive("calendar");}} style={{display:"inline-flex",alignItems:"center",gap:7,padding:"10px 20px",background:"transparent",color:T.text,border:`1px solid ${T.border}`,borderRadius:99,fontSize:13,fontWeight:600,cursor:"pointer",fontFamily:T.font}}>Brain dump everything</button>
              </div>
            </div>
            :plan.map((t)=>{
              const c=scOf(t.subject);
              return(
                <div key={t.id} onClick={()=>{togglePlanDone(t.id);forcePlan(x=>x+1);}} style={{display:"flex",alignItems:"center",gap:12,padding:"11px 14px",borderRadius:12,border:`1px solid ${T.border}`,marginBottom:8,cursor:"pointer",background:T.card2}}>
                  <div style={{width:20,height:20,borderRadius:"50%",border:`1.5px solid ${t.done?T.text:T.border}`,background:t.done?T.text:"transparent",flex:"none",display:"grid",placeItems:"center"}}>
                    {t.done&&<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke={T.lime} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>}
                  </div>
                  <div style={{flex:1,minWidth:0}}>
                    <span style={{fontSize:13.5,color:t.done?T.faint:T.text,textDecoration:t.done?"line-through":"none",fontWeight:500}}>{t.title}</span>
                    <div style={{fontSize:11,color:T.muted,marginTop:1}}>{t.subject}{t.kind?" · "+t.kind:""}</div>
                  </div>
                  <span style={{fontFamily:T.mono,fontSize:10,color:T.faint}}>{fmtClock(t.time)}</span>
                  {!t.done&&t.duration&&(t.kind==="study block"||t.kind==="deadline")&&(
                    <button onClick={(e)=>{e.stopPropagation();setRescheduleTask(t);}} style={{flexShrink:0,padding:"3px 7px",borderRadius:6,border:`1px solid ${T.border}`,background:"transparent",color:T.muted,fontSize:10,fontWeight:600,cursor:"pointer",fontFamily:T.font}}>Reschedule</button>
                  )}
                </div>
              );
            })}
        </div>

        {/* Checklist — plain to-dos with no inherent duration/time (e.g.
            "send AP scores to college"). Deliberately kept out of the
            calendar/Today's-plan entirely; this is the only place they live.
            Restored here after briefly being removed — replaces "Jump back
            in", which just duplicated what the sidebar nav already does. */}
        <div style={{background:T.card,border:`1px solid ${T.border}`,borderRadius:22,padding:22}}>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:14,gap:8}}>
            <div style={{display:"flex",alignItems:"center",gap:10}}>
              <span style={{fontFamily:T.hand,fontSize:22,fontWeight:700,color:T.text}}>Checklist</span>
              <span style={{fontFamily:T.mono,fontSize:9.5,letterSpacing:"0.12em",padding:"3px 8px",border:`1px solid ${T.border}`,borderRadius:99,color:T.muted}}>{checklistItems.length} OPEN</span>
            </div>
          </div>
          <div style={{display:"flex",gap:8,marginBottom:14}}>
            <input value={checklistDraft} onChange={e=>setChecklistDraft(e.target.value)} onKeyDown={e=>{if(e.key==="Enter")addChecklistItem();}}
              placeholder="e.g. Send AP scores" style={{flex:1,minWidth:0,background:T.card2,border:`1px solid ${T.border}`,borderRadius:10,padding:"9px 10px",color:T.text,fontSize:12.5,fontFamily:T.font,outline:"none"}} />
            <button onClick={addChecklistItem} disabled={!checklistDraft.trim()} style={{padding:"9px 12px",background:T.lime,color:T.ink,border:"none",borderRadius:10,fontSize:12.5,fontWeight:600,cursor:checklistDraft.trim()?"pointer":"default",fontFamily:T.font,opacity:checklistDraft.trim()?1:0.45,flexShrink:0}}>Add</button>
          </div>
          {checklistItems.length===0
            ? <div style={{fontSize:12.5,color:T.muted,padding:"6px 0 4px",textAlign:"center"}}>Nothing on your checklist.</div>
            : checklistItems.map(item=>(
              <div key={item.id} onClick={()=>toggleChecklistItem(item.id)} style={{display:"flex",alignItems:"center",gap:10,padding:"9px 12px",borderRadius:12,border:`1px solid ${T.border}`,marginBottom:8,cursor:"pointer"}}>
                <div style={{width:18,height:18,borderRadius:"50%",border:`1.5px solid ${T.faint}`,background:"transparent",flex:"none",display:"grid",placeItems:"center"}} />
                <div style={{flex:1,minWidth:0,fontSize:12.5,color:T.text,fontWeight:500,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{item.title}</div>
              </div>
            ))}
        </div>

        {/* Ask Studlin */}
        <div style={{background:T.ink,color:T.cream,borderRadius:22,padding:24,display:"flex",flexDirection:"column"}}>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:12}}>
            <span style={{fontFamily:T.hand,fontSize:22,fontWeight:700,color:T.cream}}>Ask Studlin</span>
            <div style={{display:"flex",alignItems:"center",gap:8}}>
              <span style={{fontFamily:T.mono,fontSize:9,letterSpacing:"0.12em",padding:"4px 9px",borderRadius:99,background:"rgba(246,241,230,0.10)",color:"rgba(246,241,230,0.6)",fontWeight:700,border:"1px solid rgba(246,241,230,0.12)"}}>AI TUTOR</span>
              <button onClick={()=>setActive("aichat")} style={{fontSize:12,color:"rgba(246,241,230,0.5)",display:"inline-flex",alignItems:"center",gap:2,cursor:"pointer",background:"none",border:"none",fontFamily:T.font}}>Open <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg></button>
            </div>
          </div>
          {(()=>{const nt=plan.find(t=>!t.done);const tc=nt?(nt.subject||nt.title):"your subjects";const sug=nt?["Explain "+tc+" concepts","Quiz me on "+tc,"Help me outline this"]:["Summarize my notes","Build a study schedule","Quiz me on any topic"];const ctx=nt?`You have "${nt.title}" up next — want a quick summary, practice quiz, or step-by-step explanation?`:`What are you studying today? I can quiz you, explain concepts, or help you plan your session.`;return(<><div style={{fontSize:13,color:"rgba(246,241,230,0.65)",marginBottom:14,lineHeight:1.6}}>{ctx}</div><div style={{display:"flex",flexWrap:"wrap",gap:6,marginBottom:14}}>{sug.map(s=>(<button key={s} onClick={()=>setActive("aichat")} style={{fontSize:11.5,padding:"6px 11px",background:"rgba(246,241,230,0.06)",border:"1px solid rgba(246,241,230,0.12)",borderRadius:99,color:"rgba(246,241,230,0.8)",cursor:"pointer",fontFamily:T.font}}>{s}</button>))}</div></>);})()}
          <div style={{display:"flex",alignItems:"center",gap:10,background:"rgba(246,241,230,0.05)",border:"1px solid rgba(246,241,230,0.10)",borderRadius:14,padding:"10px 12px",marginTop:"auto"}}>
            <input placeholder="Ask anything · paste a problem" style={{flex:1,background:"none",border:"none",outline:"none",color:T.cream,fontSize:13,fontFamily:T.font,minWidth:0}}/>
            <button onClick={()=>setActive("aichat")} style={{display:"grid",placeItems:"center",width:30,height:30,borderRadius:8,background:T.lime,color:T.ink,border:"none",cursor:"pointer",flex:"none"}}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" stroke="none"><polygon points="22 2 15 22 11 13 2 9"/></svg>
            </button>
          </div>
        </div>

      </div>

      {/* ROW 3: Study streak — used to share this row with "Quick tools"
          (removed: every one of those shortcuts already exists in the
          sidebar nav, one click away). Full width now that it's on its own.
          The day-by-day focus bar chart that used to sit here, and the
          duplicate "Weekly Wrapped" summary card next to it, were both
          removed too — see the wrappedOpen popup below for where that
          content now lives instead of being repeated permanently on the
          dashboard. */}
      {!seriousMode&&(()=>{
        var longest=0,cur=0;
        heatmapCells.forEach((v)=>{if(v>0){cur++;if(cur>longest)longest=cur;}else{cur=0;}});
        return(
          <div style={{background:T.card,borderRadius:22,padding:"26px 28px",border:`1px solid ${T.border}`,display:"flex",flexDirection:"column"}}>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:16}}>
              <span style={{fontFamily:T.hand,fontSize:26,fontWeight:600,color:T.text}}>Study streak</span>
              <span style={{fontFamily:T.mono,fontSize:10,letterSpacing:"0.12em",padding:"4px 10px",borderRadius:99,background:T.card2,color:T.muted,fontWeight:600}}>LAST 91 DAYS</span>
            </div>
            <div style={{marginBottom:16}}>
              <div style={{display:"flex",alignItems:"baseline",gap:6}}>
                <span style={{fontFamily:T.hand,fontSize:38,fontWeight:600,color:T.text}}>{realStreak}</span>
                <span style={{fontSize:13,color:T.muted}}>day streak</span>
              </div>
              <div style={{fontFamily:T.mono,fontSize:10.5,letterSpacing:"0.10em",color:T.muted,marginTop:4}}>LONGEST: {longest}</div>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(26,1fr)",gap:3}}>
              {heatmapCells.map((lv,i)=>(
                <div key={i} style={{aspectRatio:"1",borderRadius:3,background:cellColor(lv)}} />
              ))}
            </div>
          </div>
        );
      })()}

      {/* ROW 5: Upcoming + Pick up where you left off */}
      <div style={{display:"grid",gridTemplateColumns:"5fr 7fr",gap:16}}>
        <div style={{background:T.card,borderRadius:22,padding:22,border:`1px solid ${T.border}`}}>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:14,gap:8}}>
            <div style={{display:"flex",alignItems:"center",gap:10}}>
              <span style={{fontFamily:T.hand,fontSize:22,fontWeight:600,color:T.text}}>Upcoming</span>
              <span style={{fontFamily:T.mono,fontSize:9.5,letterSpacing:"0.12em",padding:"3px 8px",border:`1px solid ${T.border}`,borderRadius:99,color:T.muted}}>NEXT 14 DAYS</span>
            </div>
            <button onClick={()=>setActive("calendar")} style={{fontSize:12,color:T.muted,display:"inline-flex",alignItems:"center",gap:3,cursor:"pointer",background:"none",border:"none",fontFamily:T.font}}>Calendar <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg></button>
          </div>
          {upcomingEvents.length===0
            ?<div style={{fontSize:13,color:T.muted,padding:"18px 0",textAlign:"center"}}>Nothing on the horizon. Add deadlines to your calendar.</div>
            :upcomingEvents.map((ev,i)=>(
              <div key={ev.id} onClick={()=>setActive("calendar")} style={{display:"flex",alignItems:"center",gap:14,padding:"12px 0",borderBottom:i<upcomingEvents.length-1?`1px solid ${T.border}`:"none",cursor:"pointer"}}>
                <div style={{width:44,height:44,borderRadius:10,background:ev.urgent?T.lime:T.card2,color:ev.urgent?T.ink:T.text,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                  <span style={{fontSize:15,fontWeight:800,lineHeight:1}}>{ev.d}</span>
                  <span style={{fontSize:8.5,fontWeight:700,letterSpacing:"0.04em"}}>{ev.mo}</span>
                </div>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontSize:13,fontWeight:600,color:T.text}}>{ev.t}</div>
                  <div style={{fontSize:11,color:T.muted,marginTop:1}}>{ev.sub}</div>
                </div>
                <span style={{fontSize:10.5,fontWeight:700,padding:"4px 9px",borderRadius:99,background:ev.urgent?"rgba(224,48,48,0.10)":T.card2,color:ev.urgent?"#E03030":T.muted,flexShrink:0}}>{ev.cd}</span>
              </div>
            ))}
        </div>
        <div style={{background:T.card,borderRadius:22,padding:22,border:`1px solid ${T.border}`}}>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:14,gap:8}}>
            <div style={{display:"flex",alignItems:"center",gap:10}}>
              <span style={{fontFamily:T.hand,fontSize:22,fontWeight:600,color:T.text}}>Pick up where you left off</span>
              <span style={{fontFamily:T.mono,fontSize:9.5,letterSpacing:"0.12em",padding:"3px 8px",border:`1px solid ${T.border}`,borderRadius:99,color:T.muted}}>RECENT</span>
            </div>
          </div>
          {pickUpItems.length===0
            ?<div style={{fontSize:13,color:T.muted,padding:"18px 0",textAlign:"center"}}>Create a deck, note, or essay and it'll show up here.</div>
            :<div style={{display:"grid",gridTemplateColumns:"repeat(2,1fr)",gap:10}}>
              {pickUpItems.slice(0,4).map((it,i)=>{
                const bgColors=["#B8E4C0","#FFD6A5","#B8D4FF","#E0C4FF"];
                return (
                  <div key={i} onClick={()=>{
                    if(it.kind==="deck"){lsSet("openDeckId",it.id);setActive("flashcards");}
                    else if(it.kind==="note"){lsSet("openNoteId",it.id);setActive("notes");}
                  }} style={{background:bgColors[i%4],borderRadius:14,padding:14,cursor:"pointer"}}>
                    <div style={{fontSize:9.5,fontWeight:700,letterSpacing:"0.06em",color:"rgba(8,12,40,0.65)",marginBottom:8}}>{it.subj}</div>
                    <div style={{fontSize:13,fontWeight:700,color:"#0D120F",marginBottom:10,lineHeight:1.3}}>{it.title}</div>
                    <div style={{height:4,background:"rgba(8,12,40,0.15)",borderRadius:99,marginBottom:8,overflow:"hidden"}}><div style={{height:"100%",width:it.pct+"%",background:"#0D120F",borderRadius:99}}/></div>
                    <div style={{fontSize:10.5,color:"rgba(8,12,40,0.6)",display:"flex",justifyContent:"space-between"}}><span>{it.a}</span><span>{it.b}</span></div>
                  </div>
                );
              })}
            </div>}
        </div>
      </div>

      {/* ROW 4: GLOBAL LEADERBOARD — conditionally hidden (SHOW_GLOBAL_LEADERBOARD)
          rather than deleted, per request to disable it "for now." Flip the
          flag back to true to restore it; lbUsers/lbRankColor/lbRankBg and
          LeaderboardModal are left fully intact. */}
      {/* "This week, you..." — the second Weekly Wrapped duplicate, removed.
          Same content (focus hours, streak) as the Sunday wrappedOpen popup
          below; the popup is the one real weekly-summary surface now. */}

      {SHOW_GLOBAL_LEADERBOARD && !seriousMode && <div style={{background:T.card,border:`1px solid ${T.border}`,borderRadius:22,padding:22}}>
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
                <div style={{fontFamily:T.mono,fontSize:14,fontWeight:700,color:lbRankColor(u.r)||T.text}}>{u.minutes.toLocaleString()}</div>
                <div style={{fontSize:10,color:T.faint,marginTop:2}}>min</div>
              </div>
            </div>
          ))}
        </div>
      </div>}

    </div>
    {/* NOTE (corrected — see App-level "PRICING MODAL"/"PAYWALL" comments for
        the actual root cause): being a sibling of the content div here is
        NOT enough. [data-page] itself carries the transform-bearing
        studlinRise entrance animation, so it's a containing block for any
        position:fixed descendant *anywhere* inside it, including these two
        modals, regardless of nesting depth. RescheduleModal/its toast were
        moved out to the App level (true siblings of [data-page] itself) to
        fix the reported "have to scroll up to see the reschedule confirm"
        bug. LevelRoadmapModal/LeaderboardModal below still have the same
        underlying issue — not fixed yet, flagged for a follow-up pass. */}
    <LevelRoadmapModal open={levelRoadmapOpen} onClose={()=>setLevelRoadmapOpen(false)} currentMinutes={lvl.minutes} />
    <LeaderboardModal open={leaderboardOpen} onClose={()=>setLeaderboardOpen(false)} currentMinutes={lvl.minutes} currentName={firstName} currentStreak={realStreak} />
    {wrappedOpen&&!seriousMode&&(
      <div onClick={dismissWrapped} style={{position:"fixed",inset:0,background:"rgba(8,12,10,0.72)",zIndex:1000,display:"flex",alignItems:"center",justifyContent:"center",padding:24,animation:"studlinFade 0.18s ease-out"}}>
        <div onClick={e=>e.stopPropagation()} style={{width:"100%",maxWidth:420,background:T.forest,color:T.cream,borderRadius:22,padding:28,boxShadow:"0 24px 60px -16px rgba(0,0,0,0.5)",animation:"studlinPop 0.22s cubic-bezier(.2,.85,.3,1)"}}>
          <CardHead title="Weekly Wrapped" label={"WEEK "+weekNo()} light />
          {/* Day-by-day breakdown — used to be its own permanent "This
              week's focus" dashboard card; folded in here instead since
              this is the one place a week-in-review actually belongs. */}
          {(()=>{
            const barData=weekDays7.map((d)=>{const key=dayKey(d);const mins=minsByDay[key]||0;const isToday=key===dayKey(new Date());const lab=d.toLocaleDateString("en-US",{weekday:"short"}).slice(0,1).toUpperCase();return {mins,isToday,lab};});
            const maxMins=Math.max.apply(null,barData.map((d)=>d.mins).concat([1]));
            return(
              <div style={{display:"flex",alignItems:"flex-end",gap:6,height:52,marginTop:10,marginBottom:4}}>
                {barData.map((d,i)=>{
                  const h=d.mins>0?Math.max(4,Math.round(d.mins/maxMins*40)):0;
                  return(
                    <div key={i} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:4}}>
                      <div style={{width:"100%",display:"flex",flexDirection:"column",justifyContent:"flex-end",height:40}}>
                        {d.mins>0
                          ?<div style={{width:"100%",height:h,background:d.isToday?T.lime:"rgba(246,241,230,0.25)",borderRadius:"3px 3px 0 0"}} />
                          :<div style={{width:"100%",height:3,background:"rgba(246,241,230,0.10)",borderRadius:2}} />
                        }
                      </div>
                      <span style={{fontSize:9,fontFamily:T.mono,color:d.isToday?T.lime:"rgba(246,241,230,0.4)",fontWeight:d.isToday?700:400}}>{d.lab}</span>
                    </div>
                  );
                })}
              </div>
            );
          })()}
          <div style={{display:"flex",flexDirection:"column",gap:8,marginTop:14}}>
            {[
              {ln:"Focus hours",vn:fmtH(weeklyFocusMin)||"0m"},
              {ln:"Cards mastered",vn:cardsMasteredTotal},
              {ln:"Words written",vn:wordsWrittenTotal.toLocaleString()},
            ].map((ins,i)=>(
              <div key={i} style={{background:"rgba(246,241,230,0.05)",borderRadius:10,padding:"9px 12px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                <span style={{fontSize:11,color:"rgba(246,241,230,0.55)",fontFamily:T.mono,letterSpacing:"0.04em",textTransform:"uppercase"}}>{ins.ln}</span>
                <span style={{fontFamily:T.hand,fontSize:20,fontWeight:600,color:T.lime}}>{ins.vn}</span>
              </div>
            ))}
          </div>
          <div style={{display:"flex",gap:6,flexWrap:"wrap",marginTop:12,marginBottom:20}}>
            <span style={{fontSize:10.5,padding:"5px 10px",background:"rgba(246,241,230,0.08)",border:"1px solid rgba(246,241,230,0.14)",borderRadius:99,color:T.cream,fontWeight:600}}>{realStreak}-day streak</span>
            {topSubjectThisWeek&&<span style={{fontSize:10.5,padding:"5px 10px",background:"rgba(246,241,230,0.08)",border:"1px solid rgba(246,241,230,0.14)",borderRadius:99,color:T.cream,fontWeight:600}}>{topSubjectThisWeek} focus</span>}
          </div>
          <button onClick={dismissWrapped} style={{width:"100%",padding:"11px 0",borderRadius:99,background:T.lime,color:T.ink,border:"none",fontSize:13,fontWeight:700,cursor:"pointer",fontFamily:T.font}}>Done</button>
        </div>
      </div>
    )}
    </>
  );
}

// ─── FEEDBACK ─────────────────────────────────────────────────────────────────
function FeedbackPage() {
  const [category,setCategory]=useState(null);
  const [msg,setMsg]=useState("");
  const [sent,setSent]=useState(false);
  const [sending,setSending]=useState(false);

  const CATS=[
    {id:"love",label:"I love something",icon:Icon.heart,color:"#E05757"},
    {id:"bug",label:"Bug report",icon:Icon.zap,color:T.amber},
    {id:"feature",label:"Feature request",icon:Icon.sparkles,color:T.lime},
    {id:"other",label:"Other",icon:Icon.msgSquare,color:T.muted},
  ];

  const submit=async()=>{
    if(!category||!msg.trim())return;
    setSending(true);
    // Store in localStorage so nothing is lost; best-effort server send
    const entry={id:Date.now().toString(),category,msg:msg.trim(),created:Date.now()};
    lsSet("feedback-log",[entry,...lsGet("feedback-log",[])].slice(0,50));
    try{
      const tok=firebase.auth().currentUser?await firebase.auth().currentUser.getIdToken():null;
      if(tok){
        await fetch("/api/notify",{method:"POST",headers:{"Content-Type":"application/json","Authorization":"Bearer "+tok},body:JSON.stringify({type:"note",subject:"App Feedback: "+category,body:msg.trim()})}).catch(()=>{});
      }
    }catch(e){}
    setSending(false);
    setSent(true);
  };

  if(sent) return (
    <div style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",minHeight:400,gap:16,textAlign:"center"}}>
      <div style={{width:64,height:64,borderRadius:"50%",background:T.lime+"18",display:"grid",placeItems:"center",color:T.lime}}>
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
      </div>
      <div style={{fontFamily:T.hand,fontSize:36,fontWeight:700,color:T.white,letterSpacing:"-0.02em"}}>Thanks for the feedback.</div>
      <div style={{fontSize:14,color:T.text,maxWidth:360,lineHeight:1.6}}>Every note goes straight to the team. We read them all and use them to build what matters to you.</div>
      <button onClick={()=>{setSent(false);setCategory(null);setMsg("");}} style={{marginTop:8,padding:"10px 22px",background:T.lime,color:T.ink,border:"none",borderRadius:99,fontSize:13,fontWeight:600,cursor:"pointer",fontFamily:T.font}}>Send another</button>
    </div>
  );

  return (
    <div style={{display:"flex",flexDirection:"column",gap:16,paddingBottom:40,maxWidth:680}}>
      <div>
        <h1 style={{fontFamily:T.hand,fontSize:42,fontWeight:700,color:T.white,margin:"0 0 4px",letterSpacing:"-0.02em",lineHeight:1}}>Feedback</h1>
        <p style={{fontSize:14,color:T.muted,margin:0}}>Help shape Studlin. Every message goes straight to the founders.</p>
      </div>

      {/* Category */}
      <div style={{background:T.card,border:`1px solid ${T.border}`,borderRadius:22,padding:24}}>
        <div style={{fontFamily:T.mono,fontSize:10,letterSpacing:"0.14em",textTransform:"uppercase",color:T.muted,marginBottom:14}}>What kind of feedback?</div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
          {CATS.map(c=>(
            <button key={c.id} onClick={()=>setCategory(c.id)} style={{display:"flex",alignItems:"center",gap:12,padding:"14px 16px",borderRadius:14,border:`1.5px solid ${category===c.id?c.color+"80":T.border}`,background:category===c.id?c.color+"0e":T.card2,cursor:"pointer",fontFamily:T.font,textAlign:"left",transition:"all 0.15s"}}>
              <span style={{width:32,height:32,borderRadius:8,background:c.color+"18",display:"grid",placeItems:"center",color:c.color,flexShrink:0}}>{c.icon}</span>
              <span style={{fontSize:13,fontWeight:category===c.id?700:500,color:category===c.id?T.white:T.muted}}>{c.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Message */}
      <div style={{background:T.card,border:`1px solid ${T.border}`,borderRadius:22,padding:24}}>
        <div style={{fontFamily:T.mono,fontSize:10,letterSpacing:"0.14em",textTransform:"uppercase",color:T.muted,marginBottom:14}}>Tell us more</div>
        <textarea
          value={msg}
          onChange={e=>setMsg(e.target.value)}
          placeholder={category==="bug"?"Describe the bug — what happened, what did you expect?":category==="feature"?"What would you like to see? Describe the problem it solves.":category==="love"?"What specifically made your day?":"Anything on your mind..."}
          rows={6}
          style={{width:"100%",background:T.card2,border:`1px solid ${T.border}`,borderRadius:12,padding:"14px 16px",color:T.text,fontSize:14,fontFamily:T.font,outline:"none",resize:"vertical",boxSizing:"border-box",lineHeight:1.6}}
        />
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginTop:14}}>
          <span style={{fontSize:12,color:T.faint}}>{msg.length} chars</span>
          <button onClick={submit} disabled={!category||!msg.trim()||sending} style={{padding:"10px 24px",background:category&&msg.trim()?T.lime:T.card2,color:category&&msg.trim()?T.ink:T.faint,border:"none",borderRadius:99,fontSize:13,fontWeight:700,cursor:category&&msg.trim()?"pointer":"default",fontFamily:T.font,transition:"all 0.2s"}}>
            {sending?"Sending...":"Send feedback"}
          </button>
        </div>
      </div>

      {/* Footer note */}
      <div style={{padding:"14px 18px",background:T.card2,border:`1px solid ${T.border}`,borderRadius:14,display:"flex",gap:12,alignItems:"flex-start"}}>
        <span style={{color:T.lime,flexShrink:0,marginTop:2}}>{Icon.heart}</span>
        <div style={{fontSize:12.5,color:T.text,lineHeight:1.6}}>Studlin is built by students, for students. Your feedback directly influences what we build next. We read every message.</div>
      </div>
    </div>
  );
}

// ─── LECTURES ─────────────────────────────────────────────────────────────────
function Lectures({setActive=()=>{},setPricingOpen=()=>{}}) {
  const [recording,setRecording]=useState(false);
  const [transcript,setTranscript]=useState("");
  const [ytUrl,setYtUrl]=useState("");
  const [bars,setBars]=useState(()=>Array(32).fill(3));
  const [saved,setSaved]=useState(()=>lsGet("lectures",[]));
  const [selectedLec,setSelectedLec]=useState(null);
  const recRef=useRef(null);
  const recogRef=useRef(null);
  const animRef=useRef(null);
  const analyserRef=useRef(null);
  const audioCtxRef=useRef(null);
  const streamRef=useRef(null);

  const stopAll=()=>{
    if(recRef.current){try{recRef.current.stop();}catch(e){}recRef.current=null;}
    if(recogRef.current){try{recogRef.current.stop();}catch(e){}recogRef.current=null;}
    if(animRef.current){cancelAnimationFrame(animRef.current);animRef.current=null;}
    if(audioCtxRef.current){try{audioCtxRef.current.close();}catch(e){}audioCtxRef.current=null;}
    if(streamRef.current){streamRef.current.getTracks().forEach(t=>t.stop());streamRef.current=null;}
    analyserRef.current=null;
    setRecording(false);
    setBars(Array(32).fill(3));
  };
  useEffect(()=>()=>{stopAll();},[]);

  const drawBars=()=>{
    if(!analyserRef.current)return;
    const d=new Uint8Array(analyserRef.current.frequencyBinCount);
    analyserRef.current.getByteFrequencyData(d);
    const step=Math.floor(d.length/32);
    setBars(Array.from({length:32},(_,i)=>Math.max(3,Math.min(d[i*step]/255*36,36))));
    animRef.current=requestAnimationFrame(drawBars);
  };

  const startRecording=async()=>{
    try{
      const stream=await navigator.mediaDevices.getUserMedia({audio:true,video:false});
      streamRef.current=stream;
      const ctx=new(window.AudioContext||window.webkitAudioContext)();
      const src=ctx.createMediaStreamSource(stream);
      const an=ctx.createAnalyser();
      an.fftSize=256;
      src.connect(an);
      audioCtxRef.current=ctx;
      analyserRef.current=an;
      const mr=new MediaRecorder(stream);
      recRef.current=mr;
      mr.start();
      setRecording(true);
      animRef.current=requestAnimationFrame(drawBars);
      const SR=window.webkitSpeechRecognition||window.SpeechRecognition;
      if(SR){
        const r=new SR();
        r.continuous=true;
        r.interimResults=true;
        r.onresult=(ev)=>{
          let txt="";
          for(let i=0;i<ev.results.length;i++)txt+=ev.results[i][0].transcript+" ";
          setTranscript(txt.trim());
        };
        r.onerror=()=>{};
        r.start();
        recogRef.current=r;
      }
    }catch(e){stopAll();}
  };

  const stopRecording=()=>{
    if(transcript.trim()){
      const lec={id:Date.now().toString(),title:"Lecture "+new Date().toLocaleDateString("en",{month:"short",day:"numeric",hour:"2-digit",minute:"2-digit"}),transcript:transcript.trim(),created:Date.now()};
      const list=[lec,...lsGet("lectures",[])].slice(0,20);
      lsSet("lectures",list);
      setSaved(list);
      setSelectedLec(lec);
    }
    stopAll();
  };

  const importYt=()=>{if(ytUrl.trim())setActive("notes");};
  const curTx=selectedLec?selectedLec.transcript:transcript;

  return (
    <div style={{display:"flex",flexDirection:"column",gap:16,paddingBottom:40}}>
      <div>
        <h1 style={{fontFamily:T.hand,fontSize:42,fontWeight:700,color:T.white,margin:"0 0 4px",letterSpacing:"-0.02em",lineHeight:1}}>Lectures</h1>
        <p style={{fontSize:14,color:T.muted,margin:0}}>Record, import, and turn every lecture into a study kit</p>
      </div>

      {/* Record / import card */}
      <div style={{background:T.card,border:`1px solid ${T.border}`,borderRadius:22,padding:"24px 26px"}}>
        <div style={{display:"flex",alignItems:"center",gap:18,marginBottom:18}}>
          <button onClick={recording?stopRecording:startRecording} style={{width:60,height:60,borderRadius:"50%",background:recording?T.red:T.lime,border:"none",cursor:"pointer",display:"grid",placeItems:"center",flexShrink:0,transition:"all 0.2s ease",boxShadow:recording?`0 0 0 10px ${T.red}22,0 8px 24px -8px ${T.red}60`:`0 8px 24px -8px ${T.lime}70`}}>
            {recording
              ?<svg width="20" height="20" viewBox="0 0 24 24" fill={T.ink}><rect x="6" y="6" width="12" height="12" rx="2"/></svg>
              :<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={T.ink} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" fill={T.ink} stroke="none"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>
            }
          </button>
          <div style={{minWidth:0}}>
            <div style={{fontSize:15,fontWeight:700,color:T.white,marginBottom:3}}>{recording?"Recording — tap to stop":"Record a lecture"}</div>
            <div style={{fontFamily:T.mono,fontSize:10.5,letterSpacing:"0.12em",color:T.muted}}>Audio is saved exactly as spoken</div>
          </div>
          <div style={{flex:1,display:"flex",alignItems:"flex-end",gap:2,height:36,overflow:"hidden",paddingLeft:8}}>
            {bars.map((h,i)=>(
              <div key={i} style={{flex:1,background:recording?T.lime:T.border,borderRadius:2,height:h,transition:"height 0.08s ease"}}/>
            ))}
          </div>
        </div>

        <div style={{display:"flex",gap:8}}>
          <div style={{flex:1,display:"flex",alignItems:"center",gap:10,background:T.card2,border:`1px solid ${T.border}`,borderRadius:10,padding:"9px 12px"}}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={T.muted} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-1.96C18.88 4 12 4 12 4s-6.88 0-8.6.46A2.78 2.78 0 0 0 1.46 6.42 29 29 0 0 0 1 12a29 29 0 0 0 .46 5.58A2.78 2.78 0 0 0 3.4 19.54C5.12 20 12 20 12 20s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-1.96A29 29 0 0 0 23 12a29 29 0 0 0-.46-5.58z"/><polygon points="9.75 15.02 15.5 12 9.75 8.98 9.75 15.02" fill={T.muted} stroke="none"/></svg>
            <input value={ytUrl} onChange={e=>setYtUrl(e.target.value)} onKeyDown={e=>{if(e.key==="Enter")importYt();}} placeholder="Paste a YouTube link" style={{flex:1,background:"none",border:"none",outline:"none",color:T.text,fontSize:13,fontFamily:T.font}}/>
          </div>
          <button onClick={importYt} style={{padding:"9px 16px",background:ytUrl.trim()?T.lime:T.card2,color:ytUrl.trim()?T.ink:T.muted,border:`1px solid ${ytUrl.trim()?T.lime:T.border}`,borderRadius:10,fontSize:13,fontWeight:600,cursor:"pointer",fontFamily:T.font,transition:"all 0.18s"}}>Import</button>
          <label style={{padding:"9px 16px",background:T.card2,color:T.text,border:`1px solid ${T.border}`,borderRadius:10,fontSize:13,fontWeight:500,cursor:"pointer",fontFamily:T.font,display:"flex",alignItems:"center",gap:7}}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
            Upload file
            <input type="file" accept="audio/*,.pdf,.txt,.doc" style={{display:"none"}} onChange={e=>{const f=e.target.files&&e.target.files[0];if(f&&(f.type==="text/plain"||f.name.endsWith(".txt")))f.text().then(txt=>{setTranscript(txt);setSelectedLec(null);});e.target.value="";}}/>
          </label>
        </div>
      </div>

      {/* Saved lectures */}
      {saved.length>0&&!selectedLec&&(
        <div style={{background:T.card,border:`1px solid ${T.border}`,borderRadius:22,padding:20}}>
          <div style={{fontFamily:T.mono,fontSize:10,letterSpacing:"0.14em",textTransform:"uppercase",color:T.muted,marginBottom:12}}>Saved lectures</div>
          <div style={{display:"flex",flexDirection:"column",gap:6}}>
            {saved.slice(0,5).map(l=>(
              <div key={l.id} onClick={()=>{setSelectedLec(l);}} style={{display:"flex",alignItems:"center",gap:12,padding:"11px 14px",borderRadius:12,border:`1px solid ${T.border}`,cursor:"pointer",background:T.card2}}>
                <div style={{width:32,height:32,borderRadius:8,background:T.lime+"18",display:"grid",placeItems:"center",color:T.lime,flexShrink:0}}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>
                </div>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontSize:13,fontWeight:600,color:T.white,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{l.title}</div>
                  <div style={{fontSize:11,color:T.muted,marginTop:1,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{l.transcript.slice(0,70)}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Transcript area */}
      <div style={{background:T.card,border:`1px solid ${T.border}`,borderRadius:22,padding:22}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
          <span style={{fontFamily:T.mono,fontSize:11,letterSpacing:"0.14em",textTransform:"uppercase",color:T.muted}}>Live transcript</span>
          <div style={{display:"flex",gap:8,alignItems:"center"}}>
            {recording&&<span style={{fontFamily:T.mono,fontSize:10,color:T.red,display:"flex",alignItems:"center",gap:5,letterSpacing:"0.08em"}}><span style={{width:6,height:6,borderRadius:"50%",background:T.red,display:"inline-block",animation:"studlinPulse 1s infinite"}}/>LIVE</span>}
            {(curTx||selectedLec)&&<button onClick={()=>{setSelectedLec(null);setTranscript("");}} style={{fontSize:11,color:T.muted,background:"none",border:"none",cursor:"pointer",fontFamily:T.font}}>Clear</button>}
          </div>
        </div>
        {curTx
          ?<p style={{fontSize:14,lineHeight:1.8,color:T.text,margin:0,whiteSpace:"pre-wrap",maxHeight:280,overflowY:"auto"}}>{curTx}</p>
          :<div style={{padding:"36px 20px",textAlign:"center"}}>
            <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke={T.faint} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{margin:"0 auto 10px",display:"block"}}><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>
            <div style={{fontSize:13.5,color:T.muted}}>Hit record, paste a link, or drop a file.</div>
            <div style={{fontSize:12,color:T.faint,marginTop:4}}>Your transcript appears here in real time.</div>
          </div>
        }
      </div>

      {/* Output action cards */}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:14}}>
        {[
          {title:"Flashcards",desc:"Turn key concepts into a spaced-rep deck",icon:Icon.layers,action:()=>setActive("flashcards"),badge:null,color:T.teal},
          {title:"Practice quiz",desc:"Generate MCQs and short-answer questions",icon:Icon.zap,action:()=>setPricingOpen(true),badge:"PRO",color:T.purple},
          {title:"Summary",desc:"Get a concise outline of the full lecture",icon:Icon.file,action:()=>setActive("aichat"),badge:null,color:T.amber},
        ].map((it,i)=>(
          <div key={i} onClick={()=>it.action()} style={{background:T.card,border:`1px solid ${T.border}`,borderRadius:18,padding:20,cursor:"pointer",position:"relative"}}>
            {it.badge&&<span style={{position:"absolute",top:14,right:14,fontFamily:T.mono,fontSize:9,letterSpacing:"0.08em",padding:"3px 8px",borderRadius:99,background:T.purple+"22",color:T.purple,border:`1px solid ${T.purple}44`,fontWeight:700}}>{it.badge}</span>}
            <div style={{width:36,height:36,borderRadius:10,background:it.color+"18",border:`1px solid ${it.color}33`,display:"grid",placeItems:"center",color:it.color,marginBottom:12}}>{it.icon}</div>
            <div style={{fontSize:14,fontWeight:700,color:T.white,marginBottom:4}}>{it.title}</div>
            <div style={{fontSize:12,color:T.muted,lineHeight:1.4}}>{it.desc}</div>
          </div>
        ))}
      </div>
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
  const [difficulty, setDifficulty] = useState(prefs.difficultyPreference||"balanced");

  const affiliationLabel = status==="highschool" ? "School name" : status==="college" ? "University name" : "Affiliation";
  const affiliationPlaceholder = status==="highschool" ? "e.g. Lincoln High School" : status==="college" ? "e.g. UCLA, NYU..." : "Your school or company";

  const save = () => {
    const updatedPrefs = {...prefs, workStartTime:workStart, difficultyPreference:difficulty};
    setSchedulePreferences(updatedPrefs);
    const updatedProf = {...getProfile(), status, affiliation, school:affiliation};
    lsSet("profile", updatedProf);
    lsSet("onboarded", true);

    // Live write to the authenticated user's own Firestore document (allowed
    // directly from the client — firestore.rules restricts this write to
    // exactly these onboarding fields, nothing private like credits/plan).
    const u=firebase.auth().currentUser;
    if(u){
      fsdb().collection('users').doc(u.uid).set({
        status, affiliation, school:affiliation,
        workStartTime:workStart, difficultyPreference:difficulty,
        onboarded:true,
        updatedAt:new Date().toISOString(),
      },{merge:true}).catch(()=>{});
      upsertProfile({status, school:affiliation});
    }

    // Fire welcome email — best-effort, non-blocking
    authFetch("/api/notify", {
      method:"POST",
      headers:{"Content-Type":"application/json"},
      body:JSON.stringify({type:"welcome", name:updatedProf.name||"", email:updatedProf.email||""})
    }).catch(()=>{});
    onComplete();
  };

  const skip = () => {
    lsSet("onboarded", true);
    const u=firebase.auth().currentUser;
    if(u){
      fsdb().collection('users').doc(u.uid).set({onboarded:true,updatedAt:new Date().toISOString()},{merge:true}).catch(()=>{});
      upsertProfile();
    }
    onComplete();
  };

  const STEPS = [
    {key:"status"},
    {key:"workStart"},
    {key:"difficulty"},
  ];
  const isLast = step === STEPS.length - 1;

  const next = () => {
    if (isLast) { save(); return; }
    setStep(s => s + 1);
  };

  const bg = "#FAF6EC";
  const forest = "#14342A";
  const lime = "#9EC83D";
  const ink = "#0E1F18";
  const muted = "rgba(14,31,24,0.5)";
  const border = "rgba(14,31,24,0.18)";
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
        <div style={{width:36,height:36,borderRadius:10,background:"linear-gradient(135deg,#14342A,#0E1F18)",display:"grid",placeItems:"center",boxShadow:"0 0 16px 4px rgba(158,200,61,0.35)"}}>
            <div style={{width:11,height:11,borderRadius:"50%",background:"radial-gradient(circle at 35% 35%, #CBDF92, #9EC83D)",boxShadow:"0 0 10px 3px rgba(158,200,61,0.6)"}} />
          </div>
        <span style={{fontSize:22,fontWeight:700,color:ink,letterSpacing:"-0.02em"}}>Studlin</span>
      </div>

      {/* Card */}
      <div style={{width:"100%",maxWidth:520,background:card,borderRadius:20,padding:"36px 40px",border:`1.5px solid ${border}`,boxShadow:"0 24px 60px -24px rgba(14,31,24,0.18)"}}>
        {/* Pre-question header (shown on all steps) */}
        <div style={{background:"rgba(158,200,61,0.10)",border:`1px solid ${lime}44`,borderRadius:10,padding:"10px 14px",marginBottom:28,fontSize:12.5,color:ink,lineHeight:1.5,fontWeight:500}}>
          The following questions are used to customize and train your calendar scheduling algorithm.
        </div>

        {/* Progress dots */}
        <div style={{display:"flex",gap:6,marginBottom:28}}>
          {STEPS.map((_,i) => (
            <div key={i} style={{height:4,flex:1,borderRadius:99,background:i<=step?lime:"rgba(14,31,24,0.12)",transition:"background 0.3s"}} />
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
            </div>
            {status && (
              <div style={{marginTop:4}}>
                <label style={{display:"block",fontSize:11,fontWeight:700,letterSpacing:"0.08em",textTransform:"uppercase",color:muted,marginBottom:8}}>{affiliationLabel}</label>
                <SchoolSelect value={affiliation} onChange={setAffiliation} placeholder={affiliationPlaceholder} theme={{bg:"#F0EBE0",border,text:ink,muted}} />
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
            <TimeInput value={workStart} onChange={setWorkStart} style={{background:"#F0EBE0",border:`1.5px solid ${border}`,borderRadius:9,padding:"11px 14px",color:ink,fontSize:14,fontFamily:`"Geist",system-ui,sans-serif`,maxWidth:200}} />
          </div>
        )}

        {step===2 && (
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
    <div style={{minHeight:"100vh",background:"#0D120F",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:20}}>
      <div style={{display:"flex",alignItems:"center",gap:10}}>
        <div style={{width:36,height:36,borderRadius:10,background:"linear-gradient(135deg,#14342A,#0E1F18)",display:"grid",placeItems:"center",boxShadow:"0 0 16px 4px rgba(174,206,94,0.38)"}}>
          <div style={{width:11,height:11,borderRadius:"50%",background:"radial-gradient(circle at 35% 35%, #CBDF92, #AECE5E)",boxShadow:"0 0 10px 3px rgba(174,206,94,0.65)"}} />
        </div>
        <span style={{fontSize:22,fontWeight:700,color:"#E8EFE7"}}>Studlin</span>
      </div>
      <p style={{fontSize:15,color:"rgba(232,239,231,0.6)",margin:0}}>Sign in to access your workspace.</p>
      <div style={{display:"flex",gap:12,marginTop:8}}>
        <a href="/signin" style={{padding:"12px 28px",borderRadius:10,background:"#AECE5E",color:"#0E1F18",fontSize:14,fontWeight:600,textDecoration:"none"}}>Sign in</a>
        <a href="/onboarding" style={{padding:"12px 28px",borderRadius:10,border:"1px solid rgba(174,206,94,0.3)",background:"transparent",color:"#AECE5E",fontSize:14,fontWeight:600,textDecoration:"none"}}>Create account</a>
      </div>
    </div>
  );
}


// ─── OTP INPUT — six boxes, auto-advance, paste-friendly. Shared shape used
// by both the main app's VerifyEmailScreen and onboarding.jsx's StepVerify.
function OtpBoxes({value,onChange,disabled,autoFocus}){
  const refs=useRef([]);
  const setDigit=(i,d)=>{
    const digits=value.split("");
    digits[i]=d;
    onChange(digits.join("").slice(0,6));
  };
  const onKeyDown=(i,e)=>{
    if(e.key==="Backspace"&&!value[i]&&i>0)refs.current[i-1]?.focus();
  };
  const onInput=(i,e)=>{
    const raw=e.target.value.replace(/\D/g,"");
    if(!raw){setDigit(i,"");return;}
    setDigit(i,raw[raw.length-1]);
    if(i<5)refs.current[i+1]?.focus();
  };
  const onPaste=(e)=>{
    const raw=(e.clipboardData.getData("text")||"").replace(/\D/g,"").slice(0,6);
    if(!raw)return;
    e.preventDefault();
    onChange(raw.padEnd(value.length,"").slice(0,6));
    refs.current[Math.min(raw.length,5)]?.focus();
  };
  return(
    <div style={{display:"flex",gap:8,justifyContent:"center"}} onPaste={onPaste}>
      {[0,1,2,3,4,5].map(i=>(
        <input key={i} ref={el=>refs.current[i]=el} value={value[i]||""} onChange={e=>onInput(i,e)} onKeyDown={e=>onKeyDown(i,e)}
          disabled={disabled} autoFocus={autoFocus&&i===0} inputMode="numeric" maxLength={1}
          style={{width:42,height:52,textAlign:"center",fontSize:22,fontWeight:700,borderRadius:10,border:"1.5px solid rgba(174,206,94,0.25)",background:"#0D120F",color:"#E8EFE7",outline:"none"}}
          onFocus={e=>e.target.style.borderColor="#AECE5E"}
          onBlur={e=>e.target.style.borderColor="rgba(174,206,94,0.25)"} />
      ))}
    </div>
  );
}

// ─── VERIFY EMAIL SCREEN — blocks the dashboard until a password account
// enters the 6-digit code emailed to them. Google accounts never see this
// (see isPasswordAccount).
function VerifyEmailScreen({user}){
  const [sendStatus,setSendStatus]=useState("idle"); // idle | sending | sent
  const [code,setCode]=useState("");
  const [checking,setChecking]=useState(false);
  const [err,setErr]=useState("");
  const resend=async()=>{
    setSendStatus("sending");setErr("");
    try{
      const res=await authFetch("/api/send-verification",{method:"POST"});
      const d=await res.json();
      if(d.ok){setSendStatus("sent");setTimeout(()=>setSendStatus("idle"),30000);}
      else{setErr(d.error||"Couldn't send the email. Try again shortly.");setSendStatus("idle");}
    }catch(e){setErr("Couldn't send the email. Try again shortly.");setSendStatus("idle");}
  };
  const submitCode=async()=>{
    if(code.length!==6||checking)return;
    setChecking(true);setErr("");
    try{
      const res=await authFetch("/api/send-verification",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({code})});
      const d=await res.json();
      if(d.ok){window.location.reload();return;}
      setErr(d.error||"Incorrect code. Try again.");
    }catch(e){setErr("Couldn't verify right now. Try again.");}
    setChecking(false);
  };
  return(
    <div style={{minHeight:"100vh",background:"#0D120F",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:20,padding:24}}>
      <div style={{display:"flex",alignItems:"center",gap:10}}>
        <div style={{width:36,height:36,borderRadius:10,background:"linear-gradient(135deg,#14342A,#0E1F18)",display:"grid",placeItems:"center",boxShadow:"0 0 16px 4px rgba(174,206,94,0.38)"}}>
          <div style={{width:11,height:11,borderRadius:"50%",background:"radial-gradient(circle at 35% 35%, #CBDF92, #AECE5E)",boxShadow:"0 0 10px 3px rgba(174,206,94,0.65)"}} />
        </div>
        <span style={{fontSize:22,fontWeight:700,color:"#E8EFE7"}}>Studlin</span>
      </div>
      <div style={{width:"100%",maxWidth:380,background:"#111A15",border:"1px solid rgba(174,206,94,0.16)",borderRadius:16,padding:"28px 26px",textAlign:"center"}}>
        <div style={{fontSize:17,fontWeight:700,color:"#E8EFE7",marginBottom:8}}>Enter your code</div>
        <p style={{fontSize:13.5,color:"rgba(232,239,231,0.6)",lineHeight:1.6,margin:"0 0 20px"}}>
          We sent a 6-digit code to<br/><strong style={{color:"#E8EFE7"}}>{user.email}</strong>.
        </p>
        <OtpBoxes value={code} onChange={v=>{setCode(v);setErr("");}} disabled={checking} autoFocus />
        {err&&<div style={{fontSize:12,color:"#E05A47",marginTop:14}}>{err}</div>}
        <button onClick={submitCode} disabled={code.length!==6||checking} style={{width:"100%",padding:"12px 0",borderRadius:10,background:"#AECE5E",color:"#0E1F18",border:"none",fontSize:14,fontWeight:600,cursor:code.length!==6||checking?"not-allowed":"pointer",opacity:code.length!==6||checking?0.5:1,marginTop:18,marginBottom:10}}>
          {checking?"Verifying…":"Verify email"}
        </button>
        <button onClick={resend} disabled={sendStatus==="sending"||sendStatus==="sent"} style={{width:"100%",padding:"11px 0",borderRadius:10,border:"1px solid rgba(174,206,94,0.3)",background:"transparent",color:"#AECE5E",fontSize:13.5,fontWeight:600,cursor:sendStatus==="sending"||sendStatus==="sent"?"not-allowed":"pointer",opacity:sendStatus==="sending"||sendStatus==="sent"?0.6:1}}>
          {sendStatus==="sending"?"Sending…":sendStatus==="sent"?"Sent — check your inbox":"Resend code"}
        </button>
      </div>
      <button onClick={()=>firebase.auth().signOut()} style={{background:"none",border:"none",color:"rgba(232,239,231,0.4)",fontSize:12.5,cursor:"pointer",textDecoration:"underline"}}>Sign out</button>
    </div>
  );
}

// ─── SHARED CHAT VIEW ─────────────────────────────────────────────────────────
function SharedChatView({shareId}){
  const [chat,setChat]=useState(null);
  const [status,setStatus]=useState("loading");
  useEffect(()=>{
    // Try to decode as base64-encoded payload first (new format)
    try{
      const decoded=decodeURIComponent(escape(atob(decodeURIComponent(shareId))));
      const parsed=JSON.parse(decoded);
      if(parsed&&Array.isArray(parsed.msgs)){setChat(parsed);setStatus("ok");return;}
    }catch(e2){}
    // Fall back to API for old server-generated share IDs
    fetch("/api/get-shared-chat?id="+encodeURIComponent(shareId))
      .then(function(r){if(r.status===404)throw new Error("notfound");if(!r.ok)throw new Error("error");return r.json();})
      .then(function(data){setChat(data);setStatus("ok");})
      .catch(function(e){setStatus(e.message==="notfound"?"notfound":"error");});
  },[shareId]);
  const bg=T.bg||"#0D120F",card=T.card||"#19211C",text=T.text||"#E8EFE7",muted=T.muted||"#849389",lime=T.lime||"#AECE5E",font=T.font||"system-ui";
  if(status==="loading")return(<div style={{minHeight:"100vh",background:bg,display:"grid",placeItems:"center"}}><div style={{width:14,height:14,borderRadius:"50%",border:`2px solid ${lime}`,borderTopColor:"transparent",animation:"studlinSpin 0.7s linear infinite"}}/></div>);
  if(status!=="ok")return(<div style={{minHeight:"100vh",background:bg,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:12,fontFamily:font}}><div style={{fontSize:18,fontWeight:700,color:text}}>{status==="notfound"?"This chat doesn't exist.":"Failed to load chat."}</div><a href="/app" style={{color:lime,fontSize:14,textDecoration:"none"}}>Go to Studlin</a></div>);
  return(
    <div style={{minHeight:"100vh",background:bg,fontFamily:font,color:text}}>
      <div style={{borderBottom:`1px solid rgba(255,255,255,0.07)`,padding:"14px 24px",display:"flex",alignItems:"center",justifyContent:"space-between",background:bg,position:"sticky",top:0,zIndex:10}}>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <div style={{width:28,height:28,background:lime,borderRadius:7,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:800,color:"#0E1F18",fontSize:14}}>S</div>
          <span style={{fontSize:15,fontWeight:700,color:text,letterSpacing:"-0.02em"}}>Studlin</span>
        </div>
        <a href="/app" style={{display:"inline-flex",alignItems:"center",gap:6,padding:"7px 16px",borderRadius:99,background:lime,color:"#0E1F18",fontSize:13,fontWeight:700,textDecoration:"none"}}>Try Studlin AI</a>
      </div>
      <div style={{maxWidth:720,margin:"0 auto",padding:"32px 24px 80px"}}>
        <div style={{fontSize:13,color:muted,marginBottom:28,fontWeight:500}}>Shared conversation</div>
        {(chat.msgs||[]).map((m,i)=>(
          <div key={i} style={{display:"flex",gap:12,alignItems:"flex-start",marginBottom:24,flexDirection:m.r==="user"?"row-reverse":"row"}}>
            {m.r==="ai"
              ?<div style={{width:28,height:28,borderRadius:7,background:lime,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:800,color:"#0E1F18",fontSize:13,flexShrink:0,marginTop:2}}>S</div>
              :<div style={{width:28,height:28,borderRadius:"50%",background:lime+"22",border:`1px solid ${lime}44`,display:"flex",alignItems:"center",justifyContent:"center",color:lime,flexShrink:0,marginTop:2}}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg></div>
            }
            <div style={{maxWidth:"80%",fontSize:14,lineHeight:1.75,color:text,background:m.r==="user"?card:"transparent",padding:m.r==="user"?"12px 16px":0,borderRadius:m.r==="user"?12:0,whiteSpace:"pre-wrap"}}>{m.t}</div>
          </div>
        ))}
        <div style={{marginTop:40,padding:"28px 24px",borderRadius:16,background:card,border:`1px solid rgba(255,255,255,0.07)`,textAlign:"center"}}>
          <div style={{fontSize:17,fontWeight:700,color:text,marginBottom:8}}>Study smarter with Studlin AI</div>
          <div style={{fontSize:13,color:muted,marginBottom:20,lineHeight:1.6}}>Your AI study assistant, flashcards, notes, and calendar — all in one place.</div>
          <a href="/app" style={{display:"inline-flex",padding:"11px 28px",borderRadius:99,background:lime,color:"#0E1F18",fontSize:14,fontWeight:700,textDecoration:"none"}}>Get started free</a>
        </div>
      </div>
    </div>
  );
}

// ─── AUTH GATE ────────────────────────────────────────────────────────────────
const isPasswordAccount=(u)=>!!(u.providerData&&u.providerData.some(p=>p.providerId==="password"));
function AuthGate(){
  const shareId=new URLSearchParams(window.location.search).get("share");
  const [user,setUser]=useState(undefined);
  useEffect(()=>{
    if(shareId)return;
    return firebase.auth().onAuthStateChanged(u=>{
      setUser(u||null);
      if(u&&(!isPasswordAccount(u)||u.emailVerified)){fetchUserProfile();upsertProfile();}
    });
  },[shareId]);
  if(shareId)return <SharedChatView shareId={shareId} />;
  if(user===undefined)return(<div style={{minHeight:"100vh",background:"#0D120F",display:"grid",placeItems:"center"}}><div style={{display:"flex",alignItems:"center",gap:10}}><div style={{width:36,height:36,borderRadius:10,background:"linear-gradient(135deg,#14342A,#0E1F18)",display:"grid",placeItems:"center",boxShadow:"0 0 16px 4px rgba(174,206,94,0.38)"}}><div style={{width:11,height:11,borderRadius:"50%",background:"radial-gradient(circle at 35% 35%, #CBDF92, #AECE5E)",boxShadow:"0 0 10px 3px rgba(174,206,94,0.65)"}}/></div><span style={{fontSize:22,fontWeight:700,color:"#E8EFE7"}}>Studlin</span></div></div>);
  if(!user)return <AuthScreen />;
  if(isPasswordAccount(user)&&!user.emailVerified)return <VerifyEmailScreen user={user} />;
  return <App />;
}

// ─── NOTIFICATION PERMISSION MODAL ────────────────────────────────────────────
function NotifPermModal({onAllow=()=>{},onDeny=()=>{}}) {
  return (
    <div style={{position:"fixed",inset:0,zIndex:9999,background:"rgba(0,0,0,0.55)",display:"flex",alignItems:"center",justifyContent:"center",padding:24}}>
      <div style={{background:T.bg,borderRadius:24,padding:"36px 32px 28px",maxWidth:360,width:"100%",boxShadow:"0 24px 80px rgba(0,0,0,0.35)",border:`1px solid ${T.border}`,textAlign:"center"}}>
        <div style={{width:64,height:64,borderRadius:18,background:`linear-gradient(135deg,${T.lime}30,${T.lime}10)`,border:`1px solid ${T.lime}40`,display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 20px",color:T.lime}}>{ic(<><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></>,28)}</div>
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
  // Upcoming-task reminders — polls the live task list every 30s against
  // the real clock, rather than the old approach of arming a single
  // setTimeout at task-creation time. That old approach silently died on
  // page refresh and never re-armed after a drag/rebalance moved a task,
  // so most tasks never actually notified anyone. Lives here at the App
  // shell level (not inside CalendarTab) so it keeps running no matter
  // which tab is active. notifiedRef survives across polls for the life
  // of the tab so each task+lead-time combo only fires once per session;
  // it intentionally resets on reload — a reminder whose window already
  // passed before a refresh isn't worth reconstructing.
  const notifiedRef=useRef(new Set());
  useEffect(()=>{
    if(typeof Notification==="undefined")return;
    const LEAD_TIMES=[10,5]; // minutes before start
    const check=()=>{
      if(Notification.permission!=="granted")return;
      const events=lsGet("events",[]);
      const todayK=dayKey();
      const now=Date.now();
      events.forEach(ev=>{
        if(!ev.time||ev.date!==todayK||ev.checklist||ev.status==="done")return;
        const startMs=new Date(ev.date+"T"+ev.time).getTime();
        const minsUntil=(startMs-now)/60000;
        LEAD_TIMES.forEach(lead=>{
          const key=ev.id+"-"+lead;
          if(notifiedRef.current.has(key))return;
          // Fires once minsUntil drops to/below the lead time, but only
          // within a 1-minute trailing window — past that it's stale (the
          // task started while the tab was closed) and firing late would
          // be more confusing than useful.
          if(minsUntil<=lead&&minsUntil>lead-1){
            notifiedRef.current.add(key);
            try{new Notification("Studlin",{body:ev.title+" starts in "+lead+" minutes"});}catch(e){}
          }
        });
      });
    };
    check();
    const id=setInterval(check,30000);
    return ()=>clearInterval(id);
  },[]);
  const [onboarded,setOnboarded]=useState(()=>!!lsGet("onboarded",false));
  // A freshly-completed onboarding.jsx signup leaves a one-shot flag asking
  // to land directly on a specific tab (with its first-run tour active)
  // instead of the default dashboard — consumed once, then cleared.
  const [active,setActive]=useState(()=>{
    const pending=lsGet("pendingTour",null);
    if(pending){try{localStorage.removeItem("studlin-pendingTour");}catch(e){}return pending;}
    return localStorage.getItem("studlin-active-tab")||"dashboard";
  });
  const [theme,setThemeState]=useState(()=>(typeof localStorage!=="undefined" && localStorage.getItem("studlin-theme"))||"light");
  const [accent,setAccentState]=useState(()=>{
    if(typeof localStorage!=="undefined"){
      if(!localStorage.getItem("studlin-accent-reset5")){localStorage.setItem("studlin-accent","Lime");localStorage.setItem("studlin-accent-reset5","1");}
      return localStorage.getItem("studlin-accent")||"Lime";
    }
    return "Lime";
  });
  const [density,setDensityState]=useState(()=>(typeof localStorage!=="undefined" && localStorage.getItem("studlin-density"))||"Comfortable");
  applyTheme(theme, accent, density); // mutate T on every render so all child components re-read
  const setTheme=(name)=>{ setThemeState(name); if(typeof localStorage!=="undefined") localStorage.setItem("studlin-theme",name); };
  const setAccent=(name)=>{ setAccentState(name); if(typeof localStorage!=="undefined") localStorage.setItem("studlin-accent",name); };
  const setDensity=(name)=>{ setDensityState(name); if(typeof localStorage!=="undefined") localStorage.setItem("studlin-density",name); };
  const [timerTask,setTimerTask]=useState(null);
  // Tier 1 of the rescheduling engine — detects yesterday-or-earlier
  // pending tasks and prompts (a dismissible banner, not a blocking modal)
  // rather than moving them silently; the actual move only happens once
  // the student clicks "Roll over".
  const [rolloverPending,setRolloverPending]=useState([]);
  const [rolloverToast,setRolloverToast]=useState("");
  const fmtRolloverClock=(t)=>{if(!t)return"";const p=t.split(":");let h=+p[0];const ap=h>=12?"PM":"AM";h=h%12||12;return h+":"+p[1]+ap;};
  // Preview of exactly where each pending task would land — computed once
  // per rolloverPending change (not re-derived on every render) so what the
  // student sees in the banner and what "Roll over" actually commits are
  // always the same batch of slots, never silently recomputed between them.
  const rolloverPreview=useMemo(()=>{
    if(rolloverPending.length===0)return[];
    const today=dayKey();
    const routines=getWeeklyRoutine();
    const prefs=getSchedulePreferences();
    let working=lsGet("events",[]);
    const preview=[];
    rolloverPending.forEach(ev=>{
      const slot=findOpenSlotFor(working,routines,prefs,today,prefs.workStartTime,ev.duration||30);
      working=working.map(e=>e.id===ev.id?{...e,date:slot.date,time:slot.time}:e);
      preview.push({id:ev.id,title:ev.title,slot});
    });
    return preview;
  },[rolloverPending]);
  const applyRollover=()=>{
    if(rolloverPending.length===0)return;
    const all=lsGet("events",[]);
    const working=all.map(e=>{
      const p=rolloverPreview.find(x=>x.id===e.id);
      return p?{...e,date:p.slot.date,time:p.slot.time}:e;
    });
    lsSet("events",working);
    setRolloverToast(rolloverPending.length+" overdue task"+(rolloverPending.length!==1?"s":"")+" moved to today.");
    setTimeout(()=>setRolloverToast(""),3200);
    setRolloverPending([]);
  };
  const [scheduleSettingsOpen,setScheduleSettingsOpen]=useState(false);
  const [navCollapsed,setNavCollapsed]=useState(()=>lsGet("navCollapsed",false));
  const toggleNavCollapsed=()=>{setNavCollapsed(v=>{lsSet("navCollapsed",!v);return !v;});};
  // A gentle heads-up a few minutes before a scheduled study block/deadline
  // starts — the "I knew I had to be locked in at that time" cue a mental
  // notepad gives you for free, which a calendar you have to remember to
  // check doesn't. Fires once per event per session (notifiedHeadsUpRef),
  // never re-nags for the same block.
  const [headsUpEvent,setHeadsUpEvent]=useState(null);
  const notifiedHeadsUpRef=useRef(new Set());
  useEffect(()=>{
    const HEADS_UP_MINS=10;
    const check=()=>{
      if(timerTask)return; // already locked in, no need to be reminded
      const today=dayKey();
      const nowMins=(()=>{const d=new Date();return d.getHours()*60+d.getMinutes();})();
      const events=lsGet("events",[]);
      const upcoming=events.find(e=>{
        if(e.date!==today||!e.time||e.status!=="pending")return false;
        if(e.kind!=="study block"&&e.kind!=="deadline")return false;
        if(notifiedHeadsUpRef.current.has(e.id))return false;
        const em=timeToMinutes(e.time);
        return em>nowMins&&em-nowMins<=HEADS_UP_MINS;
      });
      if(upcoming){notifiedHeadsUpRef.current.add(upcoming.id);setHeadsUpEvent(upcoming);setTimeout(()=>setHeadsUpEvent(h=>h&&h.id===upcoming.id?null:h),12000);}
    };
    check();
    const id=setInterval(check,60000);
    return()=>clearInterval(id);
  },[timerTask]);
  window._setTimerTask=setTimerTask;
  const [creditsOpen,setCreditsOpen]=useState(false);
  const [pricingOpen,setPricingOpen]=useState(false);
  // Dashboard's "Reschedule" confirm + its toast — lifted up from Dashboard
  // itself (same fix pattern as PRICING MODAL/PAYWALL below): [data-page]'s
  // own entrance animation makes it a containing block for any
  // position:fixed descendant anywhere inside it, so a modal opened from
  // Dashboard rendered relative to the scrolled [data-page] box instead of
  // the real viewport. Rendering it as a true sibling of [data-page] here
  // fixes that.
  const [rescheduleTask,setRescheduleTask]=useState(null);
  const [dashToast,setDashToast]=useState("");
  // Strategic paywall intercept — shown once, right after the student's first
  // real task save (not during signup, and not behind a forced walkthrough —
  // this is the actual "aha moment": they just watched Studlin place their
  // first task). Gated so it only ever auto-fires this one time.
  const [paywallOpen,setPaywallOpen]=useState(false);
  const [paywallBilling,setPaywallBilling]=useState("monthly");
  const [notifOpen,setNotifOpen]=useState(false);
  const [seriousMode,setSeriousMode]=useState(()=>lsGet("settings",{}).seriousMode||false);
  const [calOnboardDone,setCalOnboardDone]=useState(()=>!!lsGet("cal-onboard-done",false));
  const [calOnboardGoogleSyncing,setCalOnboardGoogleSyncing]=useState(false);
  const [obGoogleLinked,setObGoogleLinked]=useState(()=>!!lsGet("cal-google",false));
  const [notifPermModal,setNotifPermModal]=useState(false);
  const handleNotifAllow=()=>{
    if(Notification&&Notification.requestPermission)Notification.requestPermission();
    const s=lsGet("settings",{});lsSet("settings",{...s,notifMaster:true});
    lsSet("notifAsked",true);setNotifPermModal(false);
  };
  const handleNotifDeny=()=>{
    lsSet("notifAsked",true);setNotifPermModal(false);
  };
  // Notification permission is asked contextually now, not generically right
  // after onboarding — the first time it's actually relevant (a task with a
  // reminder was just saved, or a friend request was just sent), not before.
  const askNotifIfNeeded=()=>{ if(!lsGet("notifAsked",false)) setNotifPermModal(true); };
  // Fires on every task save. The paywall and the notification-permission ask
  // used to both be gated off this same event, which meant a student's very
  // first save could trigger both at once — right after doing the thing you
  // wanted, get hit with two separate asks. Made them mutually exclusive: the
  // first-ever save shows only the paywall (the real "aha moment"), and the
  // notification ask is deferred to the save after that.
  const handleTaskSaved=()=>{
    if(!lsGet("paywallShown",false)){
      lsSet("paywallShown",true);
      setPaywallOpen(true);
    }else{
      askNotifIfNeeded();
    }
  };
  // Cross-tab deep link for Settings > Calendar Preferences' "Manage Routine"
  // link — CalendarTab owns the wizard's actual open/closed state, so this
  // just switches tabs and leaves a one-shot flag for it to pick up on mount.
  const [pendingRoutineWizard,setPendingRoutineWizard]=useState(false);
  const openRoutineWizardOnCalendar=()=>{setActive("calendar");setPendingRoutineWizard(true);};
  const myUid=firebase.auth().currentUser?.uid||null;

  // Global unread count for the sidebar badge — mounted here (not inside
  // FriendsChat) so it stays live even while the user is on a different tab,
  // the same chatRooms query FriendsChat uses for its own inbox. This same
  // listener also drives the context-aware chat notification/chime router
  // below, since it's the only Firestore subscription that survives tab
  // switches (FriendsChat's own listeners tear down the moment the user
  // navigates away).
  const [unreadCount,setUnreadCount]=useState(0);
  // Which thread (if any) FriendsChat currently has open — reported up via
  // onActiveChatChange, since chatTarget itself is local to FriendsChat and
  // unmounts with it.
  const [openChatRoomId,setOpenChatRoomId]=useState(null);
  // This effect's dependency array is [myUid] only, by design (re-subscribing
  // to Firestore on every tab switch or lock-in start/stop would be
  // wasteful) — so active/timerTask/openChatRoomId must never be read
  // directly inside the onSnapshot callback below, or they'd be frozen at
  // whatever they were when the listener was created. Mirror each into a
  // ref, updated inline every render, and read .current inside the callback.
  const activeRef=useRef(active);activeRef.current=active;
  const timerTaskRef=useRef(timerTask);timerTaskRef.current=timerTask;
  const openChatRoomIdRef=useRef(openChatRoomId);openChatRoomIdRef.current=openChatRoomId;
  const lastMsgRef=useRef({}); // roomId -> last seen lastMessage.ts, for new-message dedup
  useEffect(()=>{
    if(!myUid){setUnreadCount(0);return;}
    const unsub=fsdb().collection('chatRooms').where('memberUids','array-contains',myUid)
      .onSnapshot(snap=>{
        let n=0;
        snap.docs.forEach(d=>{
          const room=d.data();
          if(isRoomUnread(room,myUid))n++;
          const last=room.lastMessage;
          if(!last||last.senderId===myUid)return;
          const prevTs=lastMsgRef.current[d.id];
          if(prevTs===undefined){
            // First time we've ever seen this room — just seed the
            // baseline. Without this guard, every pre-existing unread
            // message would fire a notification the moment the app loads.
            lastMsgRef.current[d.id]=last.ts;
            return;
          }
          if(last.ts<=prevTs)return;
          lastMsgRef.current[d.id]=last.ts;
          // ── Context-aware notification/chime router (4 rules) ──────────
          if(timerTaskRef.current)return; // Rule 4: lock-in overrules everything
          const settings=lsGet("settings",{});
          const chimesOn=settings.chatChimes!==false;
          const away=document.visibilityState!=="visible";
          if(!away&&activeRef.current==="friends"&&openChatRoomIdRef.current===d.id)return; // Rule 1: viewing this exact thread
          if(chimesOn)playChatChime(); // Rules 2 & 3 both chime
          if(away&&settings.sysPush===true&&typeof Notification!=="undefined"&&Notification.permission==="granted"){
            // Rule 3 only: away/background also gets the desktop overlay
            const body=room.type==="group"?"New message in "+(room.name||"group chat"):"New message";
            new Notification("Studlin",{body});
          }
        });
        setUnreadCount(n);
      },()=>{});
    return unsub;
  },[myUid]);

  // First time the user opens Studlin Network, ask for desktop notification
  // permission and (if granted) register a device token for real push. A
  // second Notification.requestPermission() call when already granted/denied
  // is a harmless no-op — browsers only ever show the native prompt once.
  useEffect(()=>{
    if(active!=="friends"||!myUid||!FCM_CONFIGURED)return;
    if(lsGet("networkPushAsked",false))return;
    lsSet("networkPushAsked",true);
    if(typeof Notification==="undefined")return;
    Notification.requestPermission().then(perm=>{
      if(perm!=="granted"||!("serviceWorker"in navigator))return;
      navigator.serviceWorker.ready.then(reg=>
        firebase.messaging().getToken({vapidKey:FCM_VAPID_KEY,serviceWorkerRegistration:reg})
      ).then(token=>{
        if(!token)return;
        fsdb().collection('users').doc(myUid).update({
          fcmTokens:firebase.firestore.FieldValue.arrayUnion(token),
          updatedAt:new Date().toISOString(),
        }).catch(()=>{});
      }).catch(()=>{});
    });
  },[active,myUid]);

  // Foreground push handler — FCM routes here (instead of the service
  // worker's background handler) whenever a Studlin tab already has focus.
  // Since the recipient's onSnapshot listeners already update the chat live
  // in that case, showing a duplicate OS notification would be redundant —
  // this intentionally no-ops rather than popping a native alert.
  useEffect(()=>{
    if(!FCM_CONFIGURED||typeof firebase==="undefined"||!firebase.messaging)return;
    try{
      const unsub=firebase.messaging().onMessage(()=>{});
      return unsub;
    }catch(e){}
  },[]);
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
  useEffect(()=>{ touchStreak(); },[]);
  useEffect(()=>{ try{localStorage.setItem("studlin-active-tab",active);}catch(e){} },[active]);
  useEffect(()=>{
    const lastDay=lsGet("lastLoginDay","");
    const today=dayKey();
    if(lastDay===today)return;
    lsSet("lastLoginDay",today);
    applyOverduePenalties();
    const evs=lsGet("events",[]);
    const cleaned=evs.filter(ev=>!(ev.status==="pending"&&ev.deadline&&ev.deadline<today));
    if(cleaned.length!==evs.length)lsSet("events",cleaned);
    // Detect yesterday-or-earlier pending tasks and prompt — the actual
    // move (via the same conflict-aware gap-finder AI-arrange/extension-
    // scheduling use, instead of the old naive back-to-back stacking) only
    // runs when the student clicks "Roll over" on the prompt below.
    const od=cleaned.filter(ev=>ev.status==="pending"&&ev.date<today&&!(ev.deadline&&ev.deadline<today));
    if(od.length>0)setRolloverPending(od);
  },[]);
  const navSections=[
    {label:"Workspace",items:[
      {id:"dashboard",label:"Dashboard"},
      {id:"calendar",label:"Calendar"},
      {id:"aichat",label:"Studlin AI"},
      {id:"flashcards",label:"Flashcards"},
      {id:"notes",label:"Notes"},
      {id:"friends",label:"Studlin Network",badge:String(unreadCount||"")},
      {id:"feedback",label:"Feedback"},
      {id:"settings",label:"Settings"},
      {id:"profile",label:"Profile"},
    ]},
  ];
  const bottomItems=[];
  const pages={aichat:AiChat,writestudio:WriteStudio,flashcards:Flashcards,notes:Notes,calendar:CalendarTab,friends:FriendsChat,solve:Solve,profile:Profile,lectures:Lectures,feedback:FeedbackPage};
  const labelOf={dashboard:"Dashboard",aichat:"Studlin AI",writestudio:"Writing Suite",flashcards:"Flashcards",notes:"Notes",calendar:"Calendar",friends:"Studlin Network",settings:"Settings",profile:"Profile",solve:"Solve",lectures:"Lectures",feedback:"Feedback"};
  const sectionOf={dashboard:"Workspace",aichat:"Workspace",writestudio:"Workspace",flashcards:"Workspace",notes:"Workspace",calendar:"Workspace",friends:"Workspace",lectures:"Workspace",feedback:"Workspace",solve:"Tools",settings:"Account",profile:"Account"};
  const ActivePage=pages[active];
  const isLight=T.mode==="light";
  if (!onboarded) return <InitWizard onComplete={()=>{setOnboarded(true);}} />;
  const sidebarText=isLight?"#F6F1E6":T.text;
  const sidebarMuted=isLight?"rgba(246,241,230,0.55)":T.muted;
  const sidebarFaint=isLight?"rgba(246,241,230,0.35)":T.faint;
  const sidebarBorder=isLight?"rgba(246,241,230,0.10)":T.border;
  const sidebarCardBg=isLight?"rgba(246,241,230,0.06)":T.card;
  const NavItem=({item})=>{
    const act=active===item.id;
    return (
      <div onClick={()=>setActive(item.id)} title={navCollapsed?item.label:undefined} style={{display:"flex",alignItems:"center",gap:10,padding:navCollapsed?"9px 0":"9px 11px",justifyContent:navCollapsed?"center":"flex-start",borderRadius:9,cursor:"pointer",fontSize:12.5,background:act?(isLight?"rgba(246,241,230,0.95)":`linear-gradient(100deg, ${T.lime}1c, ${T.lime}08)`):"transparent",color:act?(isLight?T.ink:T.lime):sidebarMuted,fontWeight:act?600:400,marginBottom:2,border:`1px solid ${act?(isLight?"transparent":T.lime+"30"):"transparent"}`,boxShadow:act&&!isLight?`0 4px 14px -8px ${T.lime}70`:"none",transition:"all 0.18s cubic-bezier(.2,.8,.2,1)"}}>
        <span style={{width:16,height:16,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,color:act?(isLight?T.ink:T.lime):sidebarFaint}}>{navIcon[item.id]}</span>
        {!navCollapsed&&<span style={{flex:1,letterSpacing:"0.01em",whiteSpace:"nowrap"}}>{item.label}</span>}
        {!navCollapsed&&item.badge&&<span style={{background:T.lime+(act?"":"18"),color:act?T.ink:T.lime,fontSize:9,fontWeight:700,padding:"2px 6px",borderRadius:4,letterSpacing:"0.03em"}}>{item.badge}</span>}
      </div>
    );
  };
  return (
    <div style={{display:"flex",height:"100vh",overflow:"hidden",background:isLight?T.bg:`radial-gradient(1200px 600px at 78% -8%, ${T.glow}, transparent 60%), ${T.bg}`,fontFamily:T.font,color:T.text}}>
      {/* SIDEBAR */}
      <div style={{width:navCollapsed?68:230,flexShrink:0,background:isLight?T.surface:"linear-gradient(180deg, #18241D 0%, #0D120F00 60%)",backgroundColor:isLight?T.surface:T.surface,display:"flex",flexDirection:"column",padding:navCollapsed?"20px 10px":"20px 12px",borderRight:`1px solid ${isLight?"transparent":T.border}`,overflowY:"auto",overflowX:"hidden",transition:"width 0.22s cubic-bezier(.2,.8,.2,1), padding 0.22s cubic-bezier(.2,.8,.2,1)"}}>
        <div style={{display:"flex",alignItems:"center",gap:10,padding:"0 6px",marginBottom:20,justifyContent:navCollapsed?"center":"space-between"}}>
          {!navCollapsed&&(
            <div style={{display:"flex",alignItems:"center",gap:10,minWidth:0}}>
              <div style={{width:28,height:28,background:T.lime,borderRadius:7,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                <span style={{fontSize:15,fontWeight:800,color:T.ink,fontFamily:T.font}}>S</span>
              </div>
              <span style={{fontSize:16,fontWeight:700,color:sidebarText,letterSpacing:"-0.02em",fontFamily:T.font,whiteSpace:"nowrap"}}>Studlin</span>
            </div>
          )}
          <button onClick={toggleNavCollapsed} title={navCollapsed?"Expand sidebar":"Collapse sidebar"} style={{width:28,height:28,flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center",background:"transparent",border:`1px solid ${sidebarBorder}`,borderRadius:7,color:sidebarMuted,cursor:"pointer",padding:0}}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{transform:navCollapsed?"rotate(180deg)":"none",transition:"transform 0.22s"}}>
              <polyline points="11 17 6 12 11 7" /><polyline points="18 17 13 12 18 7" />
            </svg>
          </button>
        </div>
        <div onClick={()=>setActive("profile")} title={navCollapsed?getUserName():undefined} style={{background:sidebarCardBg,borderRadius:8,padding:navCollapsed?"8px":"10px 12px",marginBottom:16,display:"flex",alignItems:"center",justifyContent:navCollapsed?"center":"flex-start",gap:10,cursor:"pointer",border:`1px solid ${sidebarBorder}`}}>
          <Av initials={getUserInitials()} color={T.lime} size={30} />
          {!navCollapsed&&<div><div style={{fontSize:12,fontWeight:600,color:sidebarText,whiteSpace:"nowrap"}}>{getUserName()}</div><div style={{fontSize:10,color:sidebarMuted}}>{getPlan()}</div></div>}
        </div>
        {navSections.map(sec=>(
          <div key={sec.label}>
            {!navCollapsed&&<div style={{fontSize:9,fontWeight:700,letterSpacing:"0.1em",color:sidebarFaint,textTransform:"uppercase",padding:"0 6px",margin:"14px 0 5px"}}>{sec.label}</div>}
            {navCollapsed&&<div style={{height:1,background:sidebarBorder,margin:"14px 4px 10px"}} />}
            {sec.items.map(item=><NavItem key={item.id} item={item} />)}
          </div>
        ))}
        <div style={{margin:"14px 0 5px"}}>
          {bottomItems.map(item=><NavItem key={item.id} item={item} />)}
        </div>
        {/* AI credits card */}
        {(()=>{const cr=getCredits();const lim=Math.max(cr,getCreditLimit());const plan=getPlan();const daysLeft=(()=>{const n=new Date();const e=new Date(n.getFullYear(),n.getMonth()+1,1);return Math.ceil((e-n)/86400000);})();const pct=Math.min(100,Math.round(cr/lim*100));
        if(navCollapsed){return(
        <div onClick={()=>setCreditsOpen(true)} title={cr+" / "+getCreditLimit()+" AI credits"} style={{background:T.lime,borderRadius:10,padding:"8px 0",marginTop:"auto",border:`1px solid ${T.limeDk}`,cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",gap:2}}>
          <span style={{fontFamily:T.hand,fontSize:18,fontWeight:700,color:T.ink,lineHeight:1}}>{cr}</span>
          <div style={{width:"60%",height:3,background:"rgba(8,12,40,0.15)",borderRadius:99,overflow:"hidden"}}><div style={{height:"100%",width:pct+"%",background:T.ink,borderRadius:99}} /></div>
        </div>);}
        return(
        <div onClick={()=>setCreditsOpen(true)} style={{background:T.lime,borderRadius:12,padding:"12px 14px",marginTop:"auto",border:`1px solid ${T.limeDk}`,cursor:"pointer",position:"relative",overflow:"hidden",boxShadow:`0 12px 24px -12px ${T.lime}80`}}>
          <div style={{position:"absolute",right:-30,top:-30,width:90,height:90,background:"radial-gradient(circle,rgba(255,255,255,0.5),transparent 70%)",pointerEvents:"none"}} />
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",position:"relative"}}>
            <span style={{fontFamily:T.mono,fontSize:9,letterSpacing:"0.14em",fontWeight:600,color:"rgba(8,12,40,0.65)"}}>AI CREDITS</span>
            <span style={{fontFamily:T.mono,fontSize:9,letterSpacing:"0.14em",fontWeight:700,background:T.ink,color:T.lime,padding:"2px 6px",borderRadius:4}}>{plan.toUpperCase()}</span>
          </div>
          <div style={{fontFamily:T.hand,fontSize:36,fontWeight:700,color:T.ink,lineHeight:0.85,marginTop:6}}>{cr}<span style={{fontFamily:T.font,fontSize:13,fontWeight:500,color:"rgba(8,12,40,0.5)",marginLeft:2}}>/ {getCreditLimit()}</span></div>
          <div style={{fontSize:10.5,color:"rgba(8,12,40,0.6)",marginTop:2,position:"relative"}}>Resets in {daysLeft} day{daysLeft===1?"":"s"}</div>
          <div style={{height:4,background:"rgba(8,12,40,0.15)",borderRadius:99,marginTop:10,overflow:"hidden"}}><div style={{height:"100%",width:pct+"%",background:T.ink,borderRadius:99}} /></div>
        </div>);})()}
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
        {/* onAnimationEnd clears the animation once the tab-switch entrance
            plays out. A CSS animation that touches `transform` (studlinRise
            does, for the rise motion) makes this element a containing block
            for any `position:fixed` descendant — e.g. a modal opened from a
            page nested in here — for as long as the animation stays
            attached, even after it's visually finished and the scrolled
            container is no longer at the top. That silently breaks every
            such modal's centering into being relative to this scrolled
            container instead of the real viewport. Clearing it once done
            keeps the entrance animation but stops that side effect. */}
        <div key={active} data-page onAnimationEnd={e=>{e.currentTarget.style.animation="none";}} style={{flex:1,overflowY:"auto",padding:"24px 32px",animation:"studlinRise 0.45s cubic-bezier(.2,.8,.2,1) both",background:active==="dashboard"?T.bg:undefined}}>
          {active==="dashboard"?<Dashboard setActive={setActive} setScheduleSettingsOpen={setScheduleSettingsOpen} seriousMode={seriousMode} rescheduleTask={rescheduleTask} setRescheduleTask={setRescheduleTask} dashToast={dashToast} setDashToast={setDashToast} />:
           active==="settings"?<SettingsTab theme={theme} setTheme={setTheme} accent={accent} setAccent={setAccent} density={density} setDensity={setDensity} seriousMode={seriousMode} setSeriousMode={setSeriousMode} onOpenRoutineWizard={openRoutineWizardOnCalendar} />:
           active==="calendar"?<CalendarTab onTaskSaved={handleTaskSaved} openWizardOnMount={pendingRoutineWizard} onWizardOpenedFromSettings={()=>setPendingRoutineWizard(false)} />:
           active==="friends"?<FriendsChat onFriendRequestSent={askNotifIfNeeded} onActiveChatChange={setOpenChatRoomId} />:
           active==="lectures"?<Lectures setActive={setActive} setPricingOpen={setPricingOpen} />:
           active==="profile"?<Profile setActive={setActive} />:
           ActivePage?<ActivePage />:null}
        </div>
      </div>

      {/* DASHBOARD RESCHEDULE CONFIRM + TOAST — true sibling of [data-page],
          see the state declaration above for why. */}
      {rescheduleTask&&(
        <RescheduleModal task={rescheduleTask} events={lsGet("events",[])} onClose={()=>setRescheduleTask(null)} commit={(next,evictedCount)=>{
          lsSet("events",next);
          setDashToast(evictedCount>0?`Task rescheduled — ${evictedCount} other${evictedCount!==1?"s":""} shifted to make room.`:"Task rescheduled.");
          setTimeout(()=>setDashToast(""),2800);
        }} />
      )}
      {dashToast&&(
        <div style={{position:"fixed",bottom:24,left:"50%",transform:"translateX(-50%)",zIndex:1001,background:T.lime,color:T.ink,fontSize:12.5,fontWeight:600,padding:"10px 18px",borderRadius:99,boxShadow:"0 14px 30px -10px rgba(0,0,0,0.5)",display:"flex",alignItems:"center",gap:8}}>{Icon.check} {dashToast}</div>
      )}

      {/* PRICING MODAL */}
      <Modal open={pricingOpen} onClose={()=>setPricingOpen(false)} title="Studlin plans" sub="Start free. Upgrade when you're ready. Cancel anytime." width={820}>
        <PlanCards billing="monthly" onSelect={(key)=>{
          setPricingOpen(false);
          if(key!=="free")window.location.href="checkout.html?plan="+key+"&billing=monthly";
        }} />
        <div style={{marginTop:20,padding:"16px 18px",background:T.card2,borderRadius:12,border:`1px solid ${T.border}`,display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:12}}>
          <div style={{fontSize:13,color:T.text,fontWeight:500}}>
            Grammarly + Quizlet + ChatGPT + Notion = <span style={{color:T.red,fontWeight:700}}>$55/mo</span>.&nbsp;&nbsp;Pro is <span style={{color:T.lime,fontWeight:700}}>$9.99</span>.
          </div>
          <div style={{fontSize:12,color:T.muted}}>All plans include a 14-day money-back guarantee. No credit card for Free or trial.</div>
        </div>
      </Modal>
      {/* PAYWALL INTERCEPT — full-screen, shown once right after the first Calendar tour finishes/skips */}
      {paywallOpen && (
        <div style={{position:"fixed",inset:0,zIndex:1000,background:"rgba(8,12,10,0.82)",backdropFilter:"blur(10px)",display:"flex",alignItems:"center",justifyContent:"center",padding:"24px 16px",overflowY:"auto"}}>
          <div style={{width:"100%",maxWidth:900,background:T.surface,border:`1px solid ${T.border}`,borderRadius:22,padding:"40px 40px 32px",boxShadow:"0 48px 100px -30px rgba(0,0,0,0.7)",animation:"studlinPop 0.25s ease",margin:"24px 0"}}>
            <div style={{textAlign:"center",marginBottom:24}}>
              <div style={{fontSize:24,fontWeight:700,color:T.cream,letterSpacing:"-0.02em",marginBottom:6}}>Unlock your full potential</div>
              <div style={{fontSize:13.5,color:"rgba(246,241,230,0.65)"}}>Students on Pro study 2.4× more and report a full letter-grade jump. Try it free for 7 days.</div>
            </div>
            <div style={{display:"flex",justifyContent:"center",marginBottom:24}}>
              <div style={{display:"inline-flex",background:T.card2,border:`1px solid ${T.border}`,borderRadius:99,padding:3,gap:2}}>
                {["monthly","annual"].map(b=>(
                  <button key={b} onClick={()=>setPaywallBilling(b)} style={{padding:"8px 18px",borderRadius:99,border:"none",fontSize:12.5,fontWeight:600,cursor:"pointer",fontFamily:T.font,background:paywallBilling===b?T.lime:"transparent",color:paywallBilling===b?T.ink:T.muted,textTransform:"capitalize",display:"flex",alignItems:"center",gap:6}}>
                    {b}{b==="annual"&&<span style={{fontSize:10,fontWeight:700,color:paywallBilling===b?T.ink:T.lime}}>Save 20%</span>}
                  </button>
                ))}
              </div>
            </div>
            <PlanCards billing={paywallBilling} onSelect={(key)=>{
              setPaywallOpen(false);
              if(key!=="free")window.location.href="checkout.html?plan="+key+"&billing="+paywallBilling;
            }} />
            <div style={{textAlign:"center",marginTop:22}}>
              <button onClick={()=>setPaywallOpen(false)} style={{background:"none",border:"none",color:T.muted,fontSize:13,cursor:"pointer",fontFamily:T.font,textDecoration:"underline"}}>Maybe later — continue with free plan</button>
            </div>
          </div>
        </div>
      )}
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

      {timerTask&&<TaskTimerModal task={timerTask} onClose={()=>setTimerTask(null)}
        onAssignmentComplete={()=>{
          const aid=timerTask.assignmentId;
          fsdb().collection('assignments').doc(aid).update({status:"completed",updatedAt:new Date().toISOString()}).catch(()=>{});
          const next=lsGet("events",[]).filter(ev=>!(ev.assignmentId===aid&&ev.id!==timerTask.id&&ev.status!=="done"));
          lsSet("events",next);
        }}
        onAssignmentExtend={(mins,pct,extensionMins)=>{
          scheduleAssignmentExtension(timerTask,timerTask.deadline,extensionMins);
        }}
        onComplete={(mins)=>{
        logSession(mins,"Task: "+timerTask.title);
        const next=lsGet("events",[]).map(ev=>ev.id===timerTask.id?{...ev,status:"done",timeSpent:mins,completedAt:Date.now()}:ev);
        lsSet("events",next);
        // Modal stays open to show the XP/leaderboard reward summary — it
        // closes itself (setTimerTask(null) via onClose) once dismissed.
      }} />}

      {rolloverPending.length>0&&(
        <div style={{position:"fixed",top:76,right:20,zIndex:999,padding:"14px 16px",borderRadius:12,background:T.card,border:`1px solid ${T.border}`,boxShadow:"0 8px 24px rgba(0,0,0,0.35)",animation:"studlinPop 0.2s ease",maxWidth:340}}>
          <div style={{fontSize:13,color:T.white,marginBottom:10}}>
            <strong style={{color:T.amber}}>{rolloverPending.length} unfinished task{rolloverPending.length!==1?"s":""}</strong> from yesterday — here's where they'd go:
          </div>
          <div style={{display:"flex",flexDirection:"column",gap:6,marginBottom:12,maxHeight:160,overflowY:"auto"}}>
            {rolloverPreview.map(p=>(
              <div key={p.id} style={{display:"flex",justifyContent:"space-between",gap:10,fontSize:12,padding:"6px 9px",background:T.card2,borderRadius:8}}>
                <span style={{color:T.text,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{p.title}</span>
                <span style={{color:T.muted,flexShrink:0,fontFamily:T.mono}}>{p.slot.date===dayKey()?"Today":p.slot.date} {fmtRolloverClock(p.slot.time)}</span>
              </div>
            ))}
          </div>
          <div style={{display:"flex",gap:8}}>
            <Btn onClick={applyRollover} style={{padding:"7px 14px",fontSize:12,flex:1,justifyContent:"center"}}>Roll over</Btn>
            <Btn variant="ghost" onClick={()=>setRolloverPending([])} style={{padding:"7px 14px",fontSize:12,flex:1,justifyContent:"center"}}>Dismiss</Btn>
          </div>
        </div>
      )}
      {rolloverToast&&(
        <div style={{position:"fixed",top:76,right:20,zIndex:999,padding:"11px 18px",borderRadius:10,background:T.teal,color:"#fff",fontSize:13,fontWeight:600,boxShadow:"0 8px 24px rgba(0,0,0,0.35)",animation:"studlinPop 0.2s ease",maxWidth:340}}>
          {rolloverToast}
        </div>
      )}
      {headsUpEvent&&(
        <div style={{position:"fixed",bottom:20,left:20,zIndex:999,padding:"12px 16px",borderRadius:12,background:T.card,border:`1px solid ${T.border}`,boxShadow:"0 8px 24px rgba(0,0,0,0.35)",animation:"studlinPop 0.2s ease",maxWidth:300,display:"flex",alignItems:"center",gap:12}}>
          <div style={{fontSize:12.5,color:T.text,flex:1}}>
            <strong>{headsUpEvent.title}</strong> starts soon — {fmtRolloverClock(headsUpEvent.time)}.
          </div>
          <div style={{display:"flex",flexDirection:"column",gap:6,flexShrink:0}}>
            <BtnSm onClick={()=>{setTimerTask(headsUpEvent);setHeadsUpEvent(null);}} style={{padding:"6px 12px",fontSize:11}}>Begin now</BtnSm>
            <button onClick={()=>setHeadsUpEvent(null)} style={{background:"none",border:"none",color:T.faint,fontSize:11,cursor:"pointer",fontFamily:T.font}}>Dismiss</button>
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
          border-color: rgba(14,31,24,0.45) !important;
          box-shadow: 0 0 0 3px rgba(158,200,61,0.18);
        }
        body[data-theme="light"] [data-card]:hover {
          box-shadow: 0 8px 24px -10px rgba(14,31,24,0.14);
        }
      `}</style>
      {notifPermModal && <NotifPermModal onAllow={handleNotifAllow} onDeny={handleNotifDeny} />}
      {!calOnboardDone&&(
        <div style={{position:"fixed",inset:0,zIndex:200,background:"rgba(8,12,10,0.82)",backdropFilter:"blur(10px)",display:"flex",alignItems:"center",justifyContent:"center",padding:"24px 16px"}}>
          <div style={{width:"100%",maxWidth:480,background:T.surface,border:`1px solid ${T.border}`,borderRadius:20,padding:"36px 36px 28px",boxShadow:"0 48px 100px -30px rgba(0,0,0,0.7)",animation:"studlinPop 0.25s ease"}}>
            <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:6}}>
              <div style={{width:44,height:44,borderRadius:12,background:T.lime+"18",border:`1px solid ${T.lime}33`,display:"flex",alignItems:"center",justifyContent:"center",color:T.lime,fontSize:20}}>{Icon.cal}</div>
              <div>
                <div style={{fontSize:19,fontWeight:700,color:"rgba(255,255,255,0.95)",letterSpacing:"-0.02em"}}>Connect your calendar</div>
                <div style={{fontSize:12,color:"rgba(255,255,255,0.6)"}}>Pull existing events into Studlin · takes 10 seconds</div>
              </div>
            </div>
            <p style={{fontSize:13,color:"rgba(255,255,255,0.65)",lineHeight:1.7,margin:"18px 0 20px"}}>
              Studlin can read your upcoming events so you never double book a study block. Your calendar data is cached locally and never stored on our servers.
            </p>
            <div style={{display:"flex",flexDirection:"column",gap:10,marginBottom:24}}>
              <div style={{display:"flex",alignItems:"center",gap:14,padding:"13px 16px",borderRadius:10,background:T.card2,border:`1px solid ${obGoogleLinked?T.teal+"44":T.border}`}}>
                <div style={{width:36,height:36,borderRadius:9,background:"rgba(66,133,244,0.10)",border:"1px solid rgba(66,133,244,0.22)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
                </div>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontSize:13,fontWeight:600,color:T.white}}>Google Calendar</div>
                  <div style={{fontSize:11,color:obGoogleLinked?T.teal:(calOnboardGoogleSyncing?T.amber:T.muted),marginTop:1}}>{calOnboardGoogleSyncing?"Importing events…":obGoogleLinked?"Connected · events imported":"Read-only · your events, no editing"}</div>
                </div>
                {obGoogleLinked
                  ?<div style={{display:"flex",alignItems:"center",gap:6,color:T.teal,fontSize:12,fontWeight:600}}>{Icon.check} Connected</div>
                  :<BtnSm variant="lime" style={{flexShrink:0,opacity:calOnboardGoogleSyncing?0.55:1}} onClick={()=>{
                    if(typeof google==="undefined"||!google.accounts||!google.accounts.oauth2){alert("Google sign-in not ready. Try refreshing.");return;}
                    const tc=google.accounts.oauth2.initTokenClient({
                      client_id:"16831354472-e2vauavtunm3ot771cg7pgline10i9rk.apps.googleusercontent.com",
                      scope:"https://www.googleapis.com/auth/calendar.events.readonly",
                      callback:async(resp)=>{
                        if(resp.error)return;
                        setCalOnboardGoogleSyncing(true);
                        try{
                          const now=new Date().toISOString();
                          const res=await fetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events?maxResults=50&orderBy=startTime&singleEvents=true&timeMin=${encodeURIComponent(now)}`,{headers:{Authorization:`Bearer ${resp.access_token}`}});
                          const data=await res.json();
                          const gcalEvents=(data.items||[]).map(item=>({id:"gcal-"+item.id,date:(item.start.dateTime||item.start.date).slice(0,10),time:item.start.dateTime?item.start.dateTime.slice(11,16):"",title:item.summary||"Untitled",subject:"General",kind:"deadline"}));
                          const existing=lsGet("events",[]).filter(e=>!e.id.startsWith("gcal-"));
                          lsSet("events",[...existing,...gcalEvents]);
                          lsSet("cal-google",true);
                          setObGoogleLinked(true);
                        }catch(e){}finally{setCalOnboardGoogleSyncing(false);}
                      }
                    });
                    tc.requestAccessToken();
                  }}>{calOnboardGoogleSyncing?"Syncing…":"Connect"}</BtnSm>
                }
              </div>
              <div style={{display:"flex",flexDirection:"column",gap:8}}>
                {/* Locked during onboarding specifically — Google stays the
                    single active path here so first-time signup has no extra
                    friction from the iCloud link-paste flow. Apple Calendar
                    is still fully functional later, in Settings > Integrations
                    (also shown as Coming Soon there per the same product call,
                    but the underlying import code is untouched either place). */}
                <div style={{display:"flex",alignItems:"center",gap:14,padding:"13px 16px",borderRadius:10,background:T.card2,border:`1px solid ${T.border}`,opacity:0.5}}>
                  <div style={{width:36,height:36,borderRadius:9,background:T.faint,border:`1px solid ${T.border}`,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill={T.text}><path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/></svg>
                  </div>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontSize:13,fontWeight:600,color:T.white}}>Apple Calendar<span style={{marginLeft:8,fontSize:10.5,fontWeight:600,color:"rgba(255,255,255,0.35)"}}>(Coming Soon)</span></div>
                    <div style={{fontSize:11,color:T.muted,marginTop:1}}>Import iCloud events</div>
                  </div>
                  <BtnSm variant="subtle" disabled style={{flexShrink:0,cursor:"not-allowed"}}>Connect</BtnSm>
                </div>
              </div>
            </div>
            <div style={{display:"flex",gap:10}}>
              <Btn style={{flex:1,justifyContent:"center"}} onClick={()=>{lsSet("cal-onboard-done",true);setCalOnboardDone(true);}}>Done</Btn>
              <Btn variant="subtle" style={{flex:1,justifyContent:"center"}} onClick={()=>{lsSet("cal-onboard-done",true);setCalOnboardDone(true);}}>Skip for now</Btn>
            </div>
            <div style={{fontSize:11,color:"rgba(255,255,255,0.35)",textAlign:"center",marginTop:14,lineHeight:1.5}}>You can connect or disconnect calendars anytime in Settings → Integrations.</div>
          </div>
        </div>
      )}
    </div>
  );
}


// Mount
ReactDOM.createRoot(document.getElementById('root')).render(<AuthGate />);
