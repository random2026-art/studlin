const { useState, useEffect, useRef } = React;

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
  card2:  "#F3EEE2",
  border: "rgba(14,31,24,0.09)",
  borderHover: "rgba(14,31,24,0.16)",
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
  Lime:  {dk:{lime:"#AECE5E",limeDk:"#8BAE3C",limeLt:"#CBDF92"}, lt:{lime:"#9EC83D",limeDk:"#7FA82A",limeLt:"#CBDF92"}},
  Forest:{dk:{lime:"#6FC1A0",limeDk:"#4E9C7B",limeLt:"#A9E0CB"}, lt:{lime:"#2E8E6E",limeDk:"#22705680".slice(0,7),limeLt:"#A9E0CB"}},
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
  }
}
applyTheme(
  (typeof localStorage !== 'undefined' && localStorage.getItem('studlin-theme')) || 'dark',
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

const CHARACTERS=[
  {id:"spark",name:"Spark",emoji:"⚡",desc:"Just getting started. Three days in — most people don't even make it this far.",type:"streak",threshold:3},
  {id:"ember",name:"Ember",emoji:"🔥",desc:"One week locked in. The habit is forming. Don't stop now.",type:"streak",threshold:7},
  {id:"flicker",name:"Flicker",emoji:"🕯",desc:"Two weeks of showing up. You're building something real.",type:"streak",threshold:14},
  {id:"blaze",name:"Blaze",emoji:"🌟",desc:"30 days. A full month of discipline. You're not the same person who started.",type:"streak",threshold:30},
  {id:"torch",name:"Torch",emoji:"🔦",desc:"50 days. Most people dream about consistency like this.",type:"streak",threshold:50},
  {id:"inferno",name:"Inferno",emoji:"💎",desc:"100 days. You've outlasted 99% of students. This is elite.",type:"streak",threshold:100},
  {id:"phoenix",name:"Phoenix",emoji:"🦅",desc:"200 days. You rose from nothing and built an empire of knowledge.",type:"streak",threshold:200},
  {id:"titan",name:"Titan",emoji:"👑",desc:"One full year. 365 days of relentless dedication. You are legendary.",type:"streak",threshold:365},
  {id:"eternal",name:"Eternal",emoji:"🌌",desc:"Two years. Studying isn't something you do — it's who you are.",type:"streak",threshold:730},
  {id:"ascended",name:"Ascended",emoji:"✨",desc:"1,000 days. There are no words. You have transcended.",type:"streak",threshold:1000},
  {id:"seedling",name:"Seedling",emoji:"🌱",desc:"Level 5. You planted the seed. Now water it.",type:"level",threshold:5},
  {id:"sprout",name:"Sprout",emoji:"🌿",desc:"Level 10. Growing stronger every session.",type:"level",threshold:10},
  {id:"sapling",name:"Sapling",emoji:"🌳",desc:"Level 15. Your roots run deep now.",type:"level",threshold:15},
  {id:"scholar2",name:"Scholar",emoji:"📚",desc:"Level 20. Knowledge is becoming your superpower.",type:"level",threshold:20},
  {id:"sage",name:"Sage",emoji:"🧠",desc:"Level 30. You don't just study — you understand.",type:"level",threshold:30},
  {id:"architect",name:"Architect",emoji:"🏛",desc:"Level 40. Building a cathedral of knowledge, one brick at a time.",type:"level",threshold:40},
  {id:"maestro",name:"Maestro",emoji:"🎯",desc:"Level 50. Precision. Discipline. Mastery.",type:"level",threshold:50},
  {id:"oracle",name:"Oracle",emoji:"🔮",desc:"Level 75. You see connections others miss.",type:"level",threshold:75},
  {id:"luminary",name:"Luminary",emoji:"⭐",desc:"Level 100. A beacon for everyone around you.",type:"level",threshold:100},
  {id:"sovereign",name:"Sovereign",emoji:"🏔",desc:"Level 150. You stand at the peak. The view is earned.",type:"level",threshold:150},
  {id:"mythic",name:"Mythic",emoji:"🐉",desc:"Level 200. They'll tell stories about your grind.",type:"level",threshold:200},
  {id:"infinite",name:"Infinite",emoji:"♾",desc:"Level 300. Beyond measure. Beyond limits. Beyond.",type:"level",threshold:300},
];
function getCharacterData(){return lsGet("characters",{unlocked:[],unlockedAt:{},seen:[]});}
function saveCharacterData(d){lsSet("characters",d);}
function getUnlockedCharacterIds(){var streak=getStreak();var lvl=levelInfo().level;return CHARACTERS.filter(function(c){return(c.type==="streak"&&streak>=c.threshold)||(c.type==="level"&&lvl>=c.threshold);}).map(function(c){return c.id;});}
function checkNewUnlocks(){var data=getCharacterData();var should=getUnlockedCharacterIds();var fresh=should.filter(function(id){return data.unlocked.indexOf(id)===-1;});if(fresh.length>0){fresh.forEach(function(id){data.unlocked.push(id);data.unlockedAt[id]=Date.now();});saveCharacterData(data);}return fresh.map(function(id){return CHARACTERS.find(function(c){return c.id===id;});});}

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

const Av = ({initials,color=T.lime,size=36}) => (
  <div style={{width:size,height:size,borderRadius:"50%",background:color+"22",border:`1.5px solid ${color}44`,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:700,color,fontSize:Math.round(size*0.33),flexShrink:0,letterSpacing:"0.02em"}}>{initials}</div>
);

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
  const s=lsGet("sessions",[]);const totalMin=s.reduce((a,x)=>a+(x.m||0),0);
  const base=lsGet("xpBase",1850);
  const first60=Math.min(totalMin,60)*5;
  const next60=Math.min(Math.max(totalMin-60,0),60)*4;
  const rest=Math.max(totalMin-120,0)*3;
  const focusXP=first60+next60+rest;
  const streakXP=getStreak()*30;
  const loginXP=lsGet("days",[]).length*15;
  const taskXP=Object.values(lsGet("planDone",{})).filter(Boolean).length*20;
  return base+focusXP+streakXP+loginXP+taskXP+lsGet("xpBonus",0);
}
function levelInfo(){const xp=getXP();const per=300;const level=Math.floor(xp/per)+1;const into=xp-(level-1)*per;return {xp,level,into,per,toNext:per-into,pct:Math.round(into/per*100)};}
function weekStreak(){const days=new Set(lsGet("days",[]));const now=new Date();const dow=(now.getDay()+6)%7;const mon=new Date(now);mon.setDate(now.getDate()-dow);return ["M","T","W","T","F","S","S"].map((lab,i)=>{const d=new Date(mon);d.setDate(mon.getDate()+i);const k=dayKey(d);const today=k===dayKey(now);return {lab,on:days.has(k),today,future:d>now&&!today};});}
function todaysPlan(){const events=lsGet("events",[]);const tk=dayKey();const done=lsGet("planDone",{});return events.filter(e=>e.date===tk).sort((a,b)=>(a.time||"")<(b.time||"")?-1:1).map(e=>({...e,done:!!done[e.id]}));}
function togglePlanDone(id){const done=lsGet("planDone",{});done[id]=!done[id];lsSet("planDone",done);return done;}
function profileStats(){const s=lsGet("sessions",[]);const totalMin=s.reduce((a,x)=>a+(x.m||0),0);const st=sessionStats();return {totalMin,focusSessions:s.length,weekMin:st.weekMin,avg:st.avg};}
function getProfile(){
  try{
    const u=typeof firebase!=="undefined"?firebase.auth().currentUser:null;
    const def={name:(u&&u.displayName)||"Student",email:(u&&u.email)||"you@studlin.app",school:"",tz:"America/New_York"};
    return lsGet("profile",def);
  }catch(e){return{name:"Student",email:"you@studlin.app",school:"",tz:"America/New_York"};}
}
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
const navIcon = {dashboard:Icon.grid,aichat:Icon.chat,essays:Icon.pen,flashcards:Icon.layers,notes:Icon.file,focustimer:Icon.clock,calendar:Icon.cal,collection:Icon.award,aitutor:Icon.brain,grammar:Icon.check,humanizer:Icon.scan,music:Icon.music,settings:Icon.settings,profile:Icon.user};

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
  const [flipped,setFlipped]=useState(false);
  const [idx,setIdx]=useState(0);
  const [newOpen,setNewOpen]=useState(false);
  const [dName,setDName]=useState("");
  const [dSubject,setDSubject]=useState("Biology");
  const [dSource,setDSource]=useState("manual");
  const dSubjects=[{value:"Biology",label:"Biology",color:T.teal},{value:"English IV",label:"English IV",color:T.purple},{value:"Calculus",label:"Calculus",color:T.blue},{value:"Spanish",label:"Spanish",color:T.amber},{value:"Chemistry",label:"Chemistry",color:T.red},{value:"Other",label:"Other",color:T.lime}];
  const [dCustom,setDCustom]=useState("");
  const [tab,setTab]=useState("study");
  const cards=[
    {q:"What does ATP stand for and what is its primary cellular function?",a:"Adenosine Triphosphate. It is the primary energy currency of the cell, providing the energy required to drive cellular processes including muscle contraction, nerve impulse propagation, and chemical synthesis."},
    {q:"Describe the location and primary function of the mitochondria.",a:"The mitochondrion is a membrane-bound organelle found in the cytoplasm of eukaryotic cells. Its primary function is the production of ATP through the process of cellular respiration, specifically oxidative phosphorylation."},
    {q:"State the principle of natural selection in one concise sentence.",a:"Natural selection is the process by which heritable traits that increase an organism's fitness in its environment become more common in a population over successive generations."},
  ];
  const seedDecks=[
    {name:"Cell respiration",course:"Biology",count:30,done:24,color:T.teal},
    {name:"Macbeth · themes & quotes",course:"English IV",count:45,done:12,color:T.purple},
    {name:"Differentiation rules",course:"Calculus",count:20,done:20,color:T.lime},
    {name:"Subjunctive mood",course:"Spanish",count:28,done:8,color:T.amber},
  ];
  const [deckList,setDeckList]=useState(()=>lsGet("decks",seedDecks));
  const colorMap={Biology:T.teal,"English IV":T.purple,Calculus:T.blue,Spanish:T.amber,Chemistry:T.red,History:T.muted};
  const createDeck=()=>{
    const subj=dSubject==="Other"&&dCustom.trim()?dCustom.trim():dSubject;
    const name=dName.trim()||(subj+" deck");
    const nd={name,course:subj,count:0,done:0,color:colorMap[subj]||T.lime,cards:[]};
    const next=[nd,...deckList];setDeckList(next);lsSet("decks",next);
    setNewOpen(false);setDName("");setDCustom("");setDSubject("Biology");setTab("decks");
  };
  const [cName,setCName]=useState("");
  const [cSubj,setCSubj]=useState("");
  const [cQ,setCQ]=useState("");
  const [cA,setCA]=useState("");
  const [draft,setDraft]=useState([]);
  const addCard=()=>{if(!cQ.trim()&&!cA.trim())return;setDraft(d=>[...d,{q:cQ.trim()||"(no question)",a:cA.trim()||"(no answer)"}]);setCQ("");setCA("");};
  const saveDraftDeck=()=>{const subj=cSubj.trim()||"General";const nd={name:cName.trim()||"New deck",course:subj,count:draft.length,done:0,color:colorMap[subj]||T.lime,cards:draft};const next=[nd,...deckList];setDeckList(next);lsSet("decks",next);setDraft([]);setCName("");setCSubj("");setCQ("");setCA("");setTab("decks");};
  const next=()=>{setFlipped(false);setIdx(i=>(i+1)%cards.length);};
  const prev=()=>{setFlipped(false);setIdx(i=>Math.max(0,i-1));};
  return (
    <div>
      <PH title="Flashcards" sub="Spaced-repetition study system" action={<Btn onClick={()=>setNewOpen(true)}>{React.createElement("span",{style:{display:"flex",alignItems:"center",gap:6}},Icon.plus,"New deck")}</Btn>} />
      <Modal open={newOpen} onClose={()=>setNewOpen(false)} title="Create a flashcard deck" sub="Build manually or drop a file and Studlin will generate spaced-repetition cards for you."
        footer={<><Btn variant="subtle" onClick={()=>setNewOpen(false)}>Cancel</Btn><Btn onClick={createDeck}>{React.createElement("span",{style:{display:"flex",alignItems:"center",gap:6}},Icon.layers,"Create deck")}</Btn></>}>
        <Field label="Deck name"><Input placeholder="e.g. Chem 14B · Periodic trends" value={dName} onChange={e=>setDName(e.target.value)} autoFocus /></Field>
        <Field label="Subject"><SelectChip options={dSubjects} value={dSubject} onChange={setDSubject} /></Field>
        {dSubject==="Other"&&<Field label="Custom subject"><Input placeholder="e.g. Physics, AP Gov, driving theory..." value={dCustom} onChange={ev=>setDCustom(ev.target.value)} /></Field>}
        <Field label="Source">
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
            <button type="button" onClick={()=>setDSource("manual")} style={{padding:14,borderRadius:10,border:`1px solid ${dSource==="manual"?T.lime+"66":T.border}`,background:dSource==="manual"?T.lime+"10":T.card2,color:T.text,cursor:"pointer",textAlign:"left",fontFamily:T.font}}>
              <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:4}}><span style={{color:dSource==="manual"?T.lime:T.muted}}>{Icon.pen}</span><span style={{fontSize:13,fontWeight:600}}>Build manually</span></div>
              <div style={{fontSize:11.5,color:T.muted}}>Type each question and answer yourself.</div>
            </button>
            <button type="button" onClick={()=>setDSource("file")} style={{padding:14,borderRadius:10,border:`1px solid ${dSource==="file"?T.lime+"66":T.border}`,background:dSource==="file"?T.lime+"10":T.card2,color:T.text,cursor:"pointer",textAlign:"left",fontFamily:T.font}}>
              <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:4}}><span style={{color:dSource==="file"?T.lime:T.muted}}>{Icon.file}</span><span style={{fontSize:13,fontWeight:600}}>Generate from file</span></div>
              <div style={{fontSize:11.5,color:T.muted}}>Drop a PDF or notes. Costs 2 credits.</div>
            </button>
          </div>
        </Field>
        {dSource==="file" && (
          <Field label="Upload" hint="Accepts PDF, DOCX, images, or audio recordings.">
            <div style={{border:`1px dashed ${T.borderHover}`,borderRadius:10,padding:24,textAlign:"center",background:T.card2,cursor:"pointer"}}>
              <div style={{color:T.muted,marginBottom:6,display:"flex",justifyContent:"center"}}>{Icon.file}</div>
              <div style={{fontSize:13,color:T.text,fontWeight:500}}>Drop a file here or click to browse</div>
              <div style={{fontSize:11,color:T.muted,marginTop:4}}>Up to 25MB</div>
            </div>
          </Field>
        )}
      </Modal>
      <Pills tabs={["study","decks","create"]} active={tab} onChange={setTab} />
      {tab==="study"&&(
        <div style={{display:"grid",gridTemplateColumns:"1fr 260px",gap:16}}>
          <div>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
              <div style={{fontSize:12,color:T.muted}}>Biology · Cell respiration</div>
              <div style={{fontSize:12,color:T.muted}}>Card {idx+1} of {cards.length}</div>
            </div>
            <div onClick={()=>setFlipped(f=>!f)} style={{cursor:"pointer",userSelect:"none"}}>
              {!flipped
                ?<Card style={{minHeight:200,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",textAlign:"center",padding:32,background:T.card2}}>
                    <div style={{fontSize:15,fontWeight:600,color:T.white,lineHeight:1.6,marginBottom:12}}>{cards[idx].q}</div>
                    <div style={{fontSize:11,color:T.faint,letterSpacing:"0.03em"}}>CLICK TO REVEAL</div>
                  </Card>
                :<div style={{background:T.lime,borderRadius:10,minHeight:200,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",textAlign:"center",padding:32}}>
                    <div style={{fontSize:14,fontWeight:600,color:T.bg,lineHeight:1.7,marginBottom:10}}>{cards[idx].a}</div>
                    <div style={{fontSize:11,color:T.bg,opacity:0.5,letterSpacing:"0.03em"}}>RATE YOUR RECALL</div>
                  </div>
              }
            </div>
            <div style={{display:"flex",gap:8,marginTop:14,justifyContent:"center"}}>
              {flipped
                ?[["Missed",T.red],["Hard",T.amber],["Good",T.teal],["Mastered",T.lime]].map(([l,c])=>(
                    <button key={l} onClick={next} style={{flex:1,padding:"9px 0",borderRadius:7,background:c+"14",color:c,border:`1px solid ${c}33`,cursor:"pointer",fontSize:12,fontWeight:600,fontFamily:T.font}}>{l}</button>
                  ))
                :<><Btn variant="ghost" onClick={prev}>← Prev</Btn><Btn onClick={()=>setFlipped(true)}>Reveal answer</Btn><Btn variant="ghost" onClick={next}>Next →</Btn></>
              }
            </div>
          </div>
          <div style={{display:"flex",flexDirection:"column",gap:12}}>
            <Card>
              <Label>Session progress</Label>
              <div style={{fontSize:32,fontWeight:700,color:T.white,letterSpacing:"-0.02em",marginBottom:10}}>24<span style={{fontSize:18,color:T.muted}}>/30</span></div>
              <Prog pct={80} />
              <div style={{fontSize:12,color:T.muted,marginTop:8}}>Recall accuracy: 86%</div>
            </Card>
            <Card>
              <Label>Due today</Label>
              {deckList.map((d,i)=>(
                <div key={i} style={{display:"flex",alignItems:"center",gap:10,padding:"9px 0",borderBottom:i<deckList.length-1?`1px solid ${T.border}`:"none"}}>
                  <div style={{width:6,height:6,borderRadius:"50%",background:d.color,flexShrink:0}} />
                  <span style={{fontSize:12,flex:1,color:T.text}}>{d.name}</span>
                  <span style={{fontSize:11,color:T.muted}}>{d.done}/{d.count}</span>
                </div>
              ))}
            </Card>
          </div>
        </div>
      )}
      {tab==="decks"&&(
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
          {deckList.map((d,i)=>(
            <Card key={i} style={{cursor:"pointer"}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:4}}>
                <div style={{fontSize:13,fontWeight:700,color:T.white}}>{d.name}</div>
                <span style={{fontSize:11,color:T.muted}}>{d.count}</span>
              </div>
              <div style={{fontSize:11,color:T.muted,marginBottom:14}}>{d.course}</div>
              <Prog pct={d.count?Math.round((d.done/d.count)*100):0} color={d.color} />
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginTop:10}}>
                <span style={{fontSize:11,color:T.muted}}>{d.done} mastered</span>
                <BtnSm onClick={()=>setTab("study")}>Study now</BtnSm>
              </div>
            </Card>
          ))}
        </div>
      )}
      {tab==="create"&&(
        <Card>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16,marginBottom:16}}>
            <div><Label>Deck name</Label><input value={cName} onChange={e=>setCName(e.target.value)} style={{width:"100%",background:T.card2,border:`1px solid ${T.border}`,borderRadius:7,padding:"9px 12px",color:T.text,fontSize:13,fontFamily:T.font,outline:"none",boxSizing:"border-box"}} placeholder="e.g. Chem · Periodic table" /></div>
            <div><Label>Subject</Label><input value={cSubj} onChange={e=>setCSubj(e.target.value)} style={{width:"100%",background:T.card2,border:`1px solid ${T.border}`,borderRadius:7,padding:"9px 12px",color:T.text,fontSize:13,fontFamily:T.font,outline:"none",boxSizing:"border-box"}} placeholder="e.g. Chemistry" /></div>
          </div>
          <div style={{marginBottom:14}}><Label>Question (front)</Label><textarea value={cQ} onChange={e=>setCQ(e.target.value)} style={{width:"100%",background:T.card2,border:`1px solid ${T.border}`,borderRadius:7,padding:"9px 12px",color:T.text,fontSize:13,fontFamily:T.font,outline:"none",resize:"vertical",minHeight:80,boxSizing:"border-box"}} placeholder="Enter question..." /></div>
          <div style={{marginBottom:16}}><Label>Answer (back)</Label><textarea value={cA} onChange={e=>setCA(e.target.value)} style={{width:"100%",background:T.card2,border:`1px solid ${T.border}`,borderRadius:7,padding:"9px 12px",color:T.text,fontSize:13,fontFamily:T.font,outline:"none",resize:"vertical",minHeight:100,boxSizing:"border-box"}} placeholder="Enter answer..." /></div>
          <div style={{display:"flex",gap:8,alignItems:"center"}}>
            <Btn onClick={addCard}>Add card</Btn>
            {draft.length>0&&<Btn variant="subtle" onClick={saveDraftDeck}>Save deck · {draft.length} card{draft.length===1?"":"s"}</Btn>}
            <span style={{marginLeft:"auto",fontSize:11.5,color:T.muted}}>{draft.length} card{draft.length===1?"":"s"} added</span>
          </div>
          {draft.length>0&&(
            <div style={{marginTop:16,display:"flex",flexDirection:"column",gap:6}}>
              {draft.map((c,i)=>(
                <div key={i} style={{display:"flex",gap:12,padding:"9px 12px",background:T.card2,borderRadius:8,border:`1px solid ${T.border}`,fontSize:12,alignItems:"center"}}>
                  <span style={{fontFamily:T.mono,fontSize:10,color:T.muted,flexShrink:0}}>{String(i+1).padStart(2,"0")}</span>
                  <span style={{color:T.text,flex:1,minWidth:0}}>{c.q}</span>
                  <span style={{color:T.muted,flex:1,minWidth:0}}>{c.a}</span>
                  <button onClick={()=>setDraft(d=>d.filter((_,j)=>j!==i))} style={{background:"none",border:"none",color:T.faint,cursor:"pointer",flexShrink:0,display:"flex"}}>{Icon.xmark}</button>
                </div>
              ))}
            </div>
          )}
        </Card>
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
      const res=await fetch("/api/chat",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({messages:[{r:"user",t:prompt}],model:"flash"})});
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
      if(!title)title="Notes from video";
      if(yt.trim()){body=await aiSummarize("Summarize this YouTube video for study notes. URL: "+yt,"YouTube video");}else{body="No YouTube link provided.";}
    }

    const next=[{id:String(Date.now()),title:title,body:body,tag:tag,date:new Date().toLocaleDateString("en-US",{month:"short",day:"numeric"}),createdAt:Date.now()}].concat(notes);
    setNotes(next);lsSet("notes",next);
    setNewOpen(false);setNewTitle("");setNewBody("");setYt("");setRec(false);setRecSecs(0);setRecText("");setSrc("write");setFileText("");setSel(0);setSearch("");
  };

  const updateNote=(idx,updates)=>{const next=notes.map((n,i)=>i===idx?Object.assign({},n,updates):n);setNotes(next);lsSet("notes",next);};
  const deleteNote=(idx)=>{const next=notes.filter((_,i)=>i!==idx);setNotes(next);lsSet("notes",next);if(sel===idx)setSel(null);else if(sel>idx)setSel(sel-1);};
  const exportNote=(n)=>{navigator.clipboard&&navigator.clipboard.writeText(n.title+"\n\n"+n.body);};

  return (
    <div>
      <PH title="Notes" sub="Write, scan, record, or import" action={<Btn onClick={()=>setNewOpen(true)}>{React.createElement("span",{style:{display:"flex",alignItems:"center",gap:6}},Icon.plus,"New note")}</Btn>} />
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
          <Field label="YouTube link" hint="Studlin uses AI to generate notes from the video topic.">
            <Input placeholder="https://youtube.com/watch?v=..." value={yt} onChange={ev=>setYt(ev.target.value)} />
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

// ─── FOCUS TIMER ──────────────────────────────────────────────────────────────
function FocusTimer({focusSecs,setFocusSecs,focusRunning,setFocusRunning,focusMode,setFocusMode,focusTotal,setFocusTotal}){
  const time=focusSecs??25*60;
  const setTime=setFocusSecs||(()=>{});
  const running=focusRunning??false;
  const setRunning=setFocusRunning||(()=>{});
  const mode=focusMode||"Focus";
  const setMode=setFocusMode||(()=>{});
  const total=focusTotal||25*60;
  const setTotal=setFocusTotal||(()=>{});
  const modeMap={"Focus":25*60,"Short break":5*60,"Long break":15*60};
  const [customOpen,setCustomOpen]=useState(false);
  const [customMin,setCustomMin]=useState(45);
  const [target,setTarget]=useState(()=>lsGet("sessionTarget",4));
  const [warnOpen,setWarnOpen]=useState(false);
  const [pendingTarget,setPendingTarget]=useState(5);
  const [,bump]=useState(0);
  const stats=sessionStats();
  const streak=getStreak();
  const fmt=s=>String(Math.floor(s/60)).padStart(2,"0")+":"+String(s%60).padStart(2,"0");
  const pct=Math.min(100,Math.round(((total-time)/total)*100));
  const r=88;const circ=2*Math.PI*r;
  const isCustom=!Object.values(modeMap).includes(total)&&mode==="Focus";
  const pick=(m)=>{setMode(m);setTime(modeMap[m]);setTotal(modeMap[m]);setRunning(false);setCustomOpen(false);};
  const applyCustom=()=>{const m=Math.max(1,Math.min(180,Math.round(+customMin)||25));setMode("Focus");setTotal(m*60);setTime(m*60);setRunning(false);setCustomOpen(false);};
  const requestTarget=(n)=>{if(n<1||n>8)return;if(n>4){setPendingTarget(n);setWarnOpen(true);}else{setTarget(n);lsSet("sessionTarget",n);}};
  const finishEarly=()=>{const elapsed=Math.round((total-time)/60);if(mode==="Focus"&&elapsed>=1)logSession(elapsed,"Focus");setTime(total);setRunning(false);bump(x=>x+1);};
  const doneToday=stats.todayCount;
  return (
    <div>
      <PH title="Focus Timer" sub={"Pomodoro · session "+Math.min(doneToday+1,target)+" of "+target+" today"} />
      <Modal open={warnOpen} onClose={()=>setWarnOpen(false)} title="That is a lot of focus" sub="More than 4 deep-work sessions a day raises burnout risk. Research favours fewer, fully-rested blocks."
        footer={<><Btn variant="subtle" onClick={()=>setWarnOpen(false)}>Keep it at 4</Btn><Btn onClick={()=>{setTarget(pendingTarget);lsSet("sessionTarget",pendingTarget);setWarnOpen(false);}}>Set {pendingTarget} anyway</Btn></>}>
        <div style={{fontSize:13,color:T.text,lineHeight:1.7,background:T.card2,border:"1px solid "+T.border,borderRadius:8,padding:"12px 14px"}}>Studlin will space your sessions with longer breaks and watch your average session quality if you go above four. You can change this anytime.</div>
      </Modal>
      <div style={{display:"grid",gridTemplateColumns:"1fr 280px",gap:16}}>
        <Card style={{display:"flex",flexDirection:"column",alignItems:"center",padding:"40px 24px"}}>
          <div style={{display:"flex",gap:4,marginBottom:14,background:T.card2,padding:4,borderRadius:8,border:"1px solid "+T.border}}>
            {Object.keys(modeMap).map(m=>(
              <button key={m} onClick={()=>pick(m)} style={{padding:"6px 16px",borderRadius:5,fontSize:12,cursor:"pointer",border:"none",background:mode===m&&!isCustom?T.lime+"1f":"transparent",color:mode===m&&!isCustom?T.lime:T.muted,fontFamily:T.font,fontWeight:mode===m&&!isCustom?600:400,transition:"all 0.15s"}}>{m}</button>
            ))}
            <button onClick={()=>setCustomOpen(o=>!o)} style={{padding:"6px 16px",borderRadius:5,fontSize:12,cursor:"pointer",border:"none",background:isCustom?T.lime+"1f":"transparent",color:isCustom?T.lime:T.muted,fontFamily:T.font,fontWeight:isCustom?600:400,transition:"all 0.15s"}}>{isCustom?Math.round(total/60)+" min":"Custom"}</button>
          </div>
          {customOpen&&(
            <div style={{display:"flex",gap:8,alignItems:"center",marginBottom:16,background:T.card2,border:"1px solid "+T.border,borderRadius:8,padding:"8px 10px"}}>
              <input type="number" min="1" max="180" value={customMin} onChange={e=>setCustomMin(e.target.value)} onKeyDown={e=>{if(e.key==="Enter")applyCustom();}} style={{width:64,background:T.card2,border:"1px solid "+T.border,borderRadius:6,padding:"7px 9px",color:T.text,fontSize:13,fontFamily:T.font,outline:"none",textAlign:"center"}} autoFocus />
              <span style={{fontSize:12,color:T.muted}}>minutes</span>
              <BtnSm onClick={applyCustom}>Set</BtnSm>
            </div>
          )}
          <div style={{position:"relative",width:200,height:200,margin:"14px 0 32px"}}>
            <svg width="200" height="200" style={{position:"absolute",top:0,left:0,transform:"rotate(-90deg)"}}>
              <circle cx="100" cy="100" r={r} fill="none" stroke={T.card2} strokeWidth="6"/>
              <circle cx="100" cy="100" r={r} fill="none" stroke={T.lime} strokeWidth="6" strokeDasharray={circ} strokeDashoffset={circ*(1-pct/100)} strokeLinecap="round" style={{transition:"stroke-dashoffset 1s linear"}}/>
            </svg>
            <div style={{position:"absolute",inset:0,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center"}}>
              <div style={{fontSize:52,fontWeight:700,color:T.white,letterSpacing:"-3px",lineHeight:1,fontVariantNumeric:"tabular-nums"}}>{fmt(time)}</div>
              <div style={{fontSize:11,color:T.muted,marginTop:8,letterSpacing:"0.08em",textTransform:"uppercase"}}>{mode==="Focus"?"Focused":"Rest"}</div>
            </div>
          </div>
          <div style={{display:"flex",gap:14,alignItems:"center",marginBottom:24}}>
            <button onClick={()=>{setTime(total);setRunning(false);}} title="Reset" style={{width:40,height:40,borderRadius:"50%",border:"1px solid "+T.border,background:T.card2,color:T.muted,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>{Icon.refresh}</button>
            <button onClick={()=>setRunning(r2=>!r2)} style={{width:56,height:56,borderRadius:"50%",border:"none",background:T.lime,color:T.bg,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>{running?Icon.pause:Icon.play}</button>
            <button onClick={finishEarly} title="Finish session now" style={{width:40,height:40,borderRadius:"50%",border:"1px solid "+T.border,background:T.card2,color:T.muted,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>{Icon.skip}</button>
          </div>
          <div style={{display:"flex",alignItems:"center",gap:8,fontSize:12,color:T.muted}}>
            <div style={{width:6,height:6,borderRadius:"50%",background:T.teal}} />
            This timer stays live in the top bar wherever you go
          </div>
        </Card>
        <div style={{display:"flex",flexDirection:"column",gap:12}}>
          <Card style={{background:T.lime,border:"none"}}>
            <Label>Today&apos;s focus</Label>
            <div style={{fontSize:32,fontWeight:700,color:T.bg,letterSpacing:"-0.02em",lineHeight:1}}>{fmtH(stats.todayMin)}</div>
            <div style={{fontSize:12,color:T.bg,opacity:0.65,marginTop:5}}>{doneToday} session{doneToday===1?"":"s"} logged today</div>
          </Card>
          <Card>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:4}}>
              <Label>Sessions</Label>
              <div style={{display:"flex",alignItems:"center",gap:8}}>
                <button onClick={()=>requestTarget(target-1)} style={{width:22,height:22,borderRadius:6,border:"1px solid "+T.border,background:T.card2,color:T.muted,cursor:"pointer",fontSize:13,lineHeight:1}}>−</button>
                <span style={{fontSize:12,color:T.white,fontWeight:600,minWidth:12,textAlign:"center"}}>{target}</span>
                <button onClick={()=>requestTarget(target+1)} style={{width:22,height:22,borderRadius:6,border:"1px solid "+T.border,background:T.card2,color:T.muted,cursor:"pointer",fontSize:13,lineHeight:1}}>+</button>
              </div>
            </div>
            {Array.from({length:target}).map((_,i)=>{
              const st=i<doneToday?"done":(i===doneToday&&running?"active":"pending");
              return (
                <div key={i} style={{display:"flex",alignItems:"center",gap:10,padding:"9px 0",borderBottom:i<target-1?"1px solid "+T.border:"none"}}>
                  <div style={{width:6,height:6,borderRadius:"50%",background:st==="done"?T.lime:st==="active"?T.teal:T.faint,flexShrink:0}} />
                  <span style={{fontSize:12,flex:1,color:st==="pending"?T.muted:T.text}}>Session {i+1}</span>
                  <span style={{fontSize:11,color:st==="active"?T.teal:T.muted}}>{st==="done"?"Done":st==="active"?"Running":Math.round(total/60)+":00"}</span>
                </div>
              );
            })}
          </Card>
          <Card>
            <Label>This week</Label>
            {[["Streak",streak+(streak===1?" day":" days")],["Weekly total",fmtH(stats.weekMin)],["Average session",stats.avg+" min"],["Sessions completed",String(stats.weekCount)]].map(([k,v],i)=>(
              <div key={i} style={{display:"flex",justifyContent:"space-between",padding:"8px 0",borderBottom:i<3?"1px solid "+T.border:"none",fontSize:12}}>
                <span style={{color:T.muted}}>{k}</span>
                <span style={{color:T.white,fontWeight:500}}>{v}</span>
              </div>
            ))}
            <div style={{fontSize:10.5,color:T.faint,marginTop:10,lineHeight:1.5}}>Tracked automatically from finished sessions and daily logins.</div>
          </Card>
        </div>
      </div>
    </div>
  );
}

// ─── CALENDAR ─────────────────────────────────────────────────────────────────
// ─── TASK TIMER MODAL ────────────────────────────────────────────────────────
function TaskTimerModal({task,onClose,onComplete}){
  const [phase,setPhase]=useState("quote");
  const [breakOn,setBreakOn]=useState(true);
  const [breakMins,setBreakMins]=useState(5);
  const [secs,setSecs]=useState((task.duration||25)*60);
  const [running,setRunning]=useState(false);
  const [breakSecs,setBreakSecs]=useState(0);
  const [breakIdea,setBreakIdea]=useState("");
  const [elapsed,setElapsed]=useState(0);
  const totalSecs=(task.duration||25)*60;
  const quote=QUOTES[Math.floor(Math.random()*QUOTES.length)];
  const breakInterval=breakOn?Math.min(25*60,totalSecs):totalSecs;

  useEffect(()=>{
    if(!running)return;
    const id=setInterval(()=>{
      if(phase==="focus"){
        setSecs(s=>{
          if(s<=1){
            if(breakOn&&elapsed+totalSecs-0<totalSecs){
              setPhase("break");setBreakSecs(breakMins*60);setBreakIdea(BREAK_IDEAS[Math.floor(Math.random()*BREAK_IDEAS.length)]);setRunning(true);
              return 0;
            }
            setPhase("done");setRunning(false);
            if(onComplete)onComplete(Math.round(totalSecs/60));
            return 0;
          }
          return s-1;
        });
        setElapsed(e=>e+1);
      }else if(phase==="break"){
        setBreakSecs(s=>{
          if(s<=1){setPhase("focus");setSecs(Math.max(0,totalSecs-elapsed-1));return 0;}
          return s-1;
        });
      }
    },1000);
    return()=>clearInterval(id);
  },[running,phase,breakOn,breakMins,elapsed,totalSecs]);

  const fm=String(Math.floor(secs/60)).padStart(2,"0"),fs=String(secs%60).padStart(2,"0");
  const bm=String(Math.floor(breakSecs/60)).padStart(2,"0"),bs=String(breakSecs%60).padStart(2,"0");
  const pct=totalSecs>0?Math.round(((totalSecs-secs)/totalSecs)*100):0;
  const circumference=2*Math.PI*52;

  if(phase==="quote")return(
    <div onClick={onClose} style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.7)",backdropFilter:"blur(10px)",zIndex:1000,display:"flex",alignItems:"center",justifyContent:"center",padding:24}}>
      <div onClick={e=>e.stopPropagation()} style={{width:"100%",maxWidth:480,background:T.card,borderRadius:20,border:`1px solid ${T.border}`,padding:"40px 36px",textAlign:"center"}}>
        <div style={{fontSize:48,marginBottom:20}}>✨</div>
        <div style={{fontSize:18,fontStyle:"italic",color:T.text,lineHeight:1.6,marginBottom:8,fontFamily:T.serif}}>"{quote.text}"</div>
        <div style={{fontSize:13,color:T.muted,marginBottom:28}}>— {quote.author}</div>
        <div style={{fontSize:14,fontWeight:600,color:T.white,marginBottom:6}}>{task.title}</div>
        <div style={{fontSize:12,color:T.muted,marginBottom:24}}>{task.duration||25} minutes · {task.subject||"Study session"}</div>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"12px 16px",background:T.card2,borderRadius:10,marginBottom:20,border:`1px solid ${T.border}`}}>
          <div style={{display:"flex",alignItems:"center",gap:8,cursor:"pointer"}} onClick={()=>setBreakOn(b=>!b)}>
            <div style={{width:32,height:18,borderRadius:9,background:breakOn?T.lime:T.faint,position:"relative",transition:"background 0.2s"}}><div style={{width:14,height:14,borderRadius:"50%",background:"#fff",position:"absolute",top:2,left:breakOn?16:2,transition:"left 0.2s"}} /></div>
            <span style={{fontSize:12,color:T.text}}>Breaks</span>
          </div>
          {breakOn&&<div style={{display:"flex",alignItems:"center",gap:6}}><input type="number" min={1} max={30} value={breakMins} onChange={e=>setBreakMins(Math.max(1,+e.target.value||5))} style={{width:48,padding:"4px 8px",borderRadius:6,border:`1px solid ${T.border}`,background:T.card,color:T.text,fontSize:12,fontFamily:T.font,textAlign:"center"}} /><span style={{fontSize:11,color:T.muted}}>min break</span></div>}
        </div>
        <Btn onClick={()=>{setPhase("focus");setRunning(true);}} style={{width:"100%",justifyContent:"center",padding:"14px 24px",fontSize:15}}>Lock in</Btn>
      </div>
    </div>
  );

  if(phase==="done")return(
    <div onClick={onClose} style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.7)",backdropFilter:"blur(10px)",zIndex:1000,display:"flex",alignItems:"center",justifyContent:"center",padding:24}}>
      <div onClick={e=>e.stopPropagation()} style={{width:"100%",maxWidth:420,background:T.card,borderRadius:20,border:`1px solid ${T.border}`,padding:"40px 36px",textAlign:"center"}}>
        <div style={{fontSize:48,marginBottom:16}}>🎉</div>
        <h2 style={{fontSize:24,fontWeight:700,color:T.white,margin:"0 0 8px"}}>Session complete</h2>
        <p style={{fontSize:14,color:T.muted,margin:"0 0 8px"}}>{task.title}</p>
        <div style={{fontSize:28,fontWeight:700,color:T.lime,fontFamily:T.mono,marginBottom:20}}>{Math.round(elapsed/60)} min focused</div>
        <Btn onClick={onClose} style={{width:"100%",justifyContent:"center"}}>Done</Btn>
      </div>
    </div>
  );

  const isBreak=phase==="break";
  return(
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.85)",backdropFilter:"blur(12px)",zIndex:1000,display:"flex",alignItems:"center",justifyContent:"center",padding:24}}>
      <div style={{width:"100%",maxWidth:400,textAlign:"center"}}>
        <div style={{fontSize:11,fontWeight:700,letterSpacing:"0.12em",textTransform:"uppercase",color:isBreak?T.amber:T.lime,marginBottom:16}}>{isBreak?"Break time":"Focused"}</div>
        <div style={{position:"relative",width:180,height:180,margin:"0 auto 20px"}}>
          <svg viewBox="0 0 120 120" style={{width:180,height:180,transform:"rotate(-90deg)"}}>
            <circle cx="60" cy="60" r="52" fill="none" stroke={T.card2} strokeWidth="6" />
            <circle cx="60" cy="60" r="52" fill="none" stroke={isBreak?T.amber:T.lime} strokeWidth="6" strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={isBreak?circumference*(1-breakSecs/(breakMins*60)):circumference*(1-pct/100)} style={{transition:"stroke-dashoffset 0.5s"}} />
          </svg>
          <div style={{position:"absolute",inset:0,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center"}}>
            <div style={{fontSize:42,fontWeight:700,color:T.white,fontFamily:T.mono,letterSpacing:"-0.02em"}}>{isBreak?bm+":"+bs:fm+":"+fs}</div>
            <div style={{fontSize:11,color:T.muted,marginTop:4}}>{isBreak?"break":"remaining"}</div>
          </div>
        </div>
        <div style={{fontSize:15,fontWeight:600,color:T.white,marginBottom:4}}>{task.title}</div>
        {isBreak&&<div style={{fontSize:13,color:T.amber,marginTop:12,padding:"12px 16px",background:T.amber+"12",borderRadius:10,lineHeight:1.5}}>{breakIdea}</div>}
        <div style={{display:"flex",gap:10,justifyContent:"center",marginTop:24}}>
          <Btn variant="ghost" onClick={()=>setRunning(r=>!r)}>{running?"Pause":"Resume"}</Btn>
          <Btn variant="danger" onClick={()=>{setPhase("done");setRunning(false);if(onComplete)onComplete(Math.round(elapsed/60));}}>Finish early</Btn>
        </div>
      </div>
    </div>
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
  const [evPriority,setEvPriority]=useState(3);
  const [evDeadline,setEvDeadline]=useState("");
  const [evDuration,setEvDuration]=useState(60);
  const [evSplitEnabled,setEvSplitEnabled]=useState(false);
  const [evSplitCount,setEvSplitCount]=useState(2);
  const [aiLoading,setAiLoading]=useState(false);
  const [toast,setToast]=useState(false);
  const [dragId,setDragId]=useState(null);
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
  const openNew=(dateK)=>{setEvDate(dateK||selDay);setEvDeadline("");setEvPriority(3);setEvDuration(60);setEvSplitEnabled(false);setEvSplitCount(2);setNewOpen(true);};
  const resetForm=()=>{setNewOpen(false);setEvTitle("");setEvNotes("");setEvCustom("");setEvPriority(3);setEvDeadline("");setEvDuration(60);setEvSplitEnabled(false);setEvSplitCount(2);setAiLoading(false);};
  const buildTask=(date,time,titleSuffix,splitInfo)=>{
    const subj=evSubject==="Other"&&evCustom.trim()?evCustom.trim():evSubject;
    return {id:String(Date.now()+Math.random()*1000),title:evTitle.trim()+(titleSuffix||""),date,time,subject:subj,kind:evKind,notes:evNotes,priority:evPriority,deadline:evDeadline||null,duration:splitInfo?Math.round(evDuration/evSplitCount):evDuration,status:"pending",timeSpent:0,completedAt:null,...(splitInfo||{})};
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
    const tk=dayKey();
    const existing=events.filter(ev=>ev.date>=tk).map(ev=>({title:ev.title,date:ev.date,time:ev.time,duration:ev.duration||60}));
    const splitCount=evSplitEnabled?evSplitCount:1;
    const perSession=Math.round(evDuration/splitCount);
    const prompt="You are a scheduling AI. Schedule "+splitCount+" session(s) of "+perSession+" minutes each for the task: \""+evTitle.trim()+"\". Priority: "+PRIORITY_LABELS[evPriority]+(evDeadline?". Deadline: "+evDeadline:"")+". Today is "+tk+". Existing schedule: "+JSON.stringify(existing)+". RULES: Higher priority = earlier slots. Must be before deadline. Avoid conflicts. Hours 8:00-22:00. Spread splits across days. Respond with ONLY valid JSON: {\"sessions\":[{\"date\":\"YYYY-MM-DD\",\"time\":\"HH:MM\"}]}";
    try{
      const res=await authFetch("/api/chat",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({messages:[{r:"user",t:prompt}],model:"flash"})});
      const data=await res.json();
      const raw=data.reply.replace(/```json?|```/g,"").trim();
      const parsed=JSON.parse(raw);
      if(parsed.sessions&&parsed.sessions.length>0){
        const groupId=splitCount>1?"split-"+Date.now():null;
        const tasks=parsed.sessions.slice(0,splitCount).map((s,i)=>buildTask(s.date,s.time,splitCount>1?" ("+(i+1)+"/"+splitCount+")":"",(groupId?{splitGroup:groupId,splitIndex:i+1,splitTotal:splitCount,duration:perSession}:{duration:evDuration})));
        commitTasks(tasks);
      }else{saveManual();}
    }catch(e){saveManual();}
    setAiLoading(false);
  };
  const removeEvent=(id)=>{const next=events.filter(ev=>ev.id!==id);setEvents(next);lsSet("events",next);};
  const moveEvent=(id,newDate)=>{const next=events.map(ev=>ev.id===id?{...ev,date:newDate}:ev);setEvents(next);lsSet("events",next);};
  const markDone=(id)=>{const next=events.map(ev=>ev.id===id?{...ev,status:"done",completedAt:Date.now()}:ev);setEvents(next);lsSet("events",next);};
  const nav=(d)=>setYm(c=>{const m2=c.m+d;return {y:c.y+Math.floor(m2/12),m:((m2%12)+12)%12};});
  return (
    <div>
      <PH title="Calendar" sub={monthNames[ym.m]+" "+ym.y} action={<Btn onClick={()=>openNew(selDay)}>{React.createElement("span",{style:{display:"flex",alignItems:"center",gap:6}},Icon.plus,"Add task")}</Btn>} />
      {toast&&(
        <div style={{position:"fixed",bottom:24,left:"50%",transform:"translateX(-50%)",zIndex:80,background:T.lime,color:T.ink,fontSize:12.5,fontWeight:600,padding:"10px 18px",borderRadius:99,boxShadow:"0 14px 30px -10px rgba(0,0,0,0.5)",display:"flex",alignItems:"center",gap:8}}>{Icon.check} Task added</div>
      )}
      <Modal open={newOpen} onClose={resetForm} title="New task" sub="Add details and let Studlin schedule it, or place it manually." width={580}
        footer={<><Btn variant="subtle" onClick={resetForm}>Cancel</Btn><Btn variant="ghost" onClick={saveManual} style={{opacity:evTitle.trim()?1:0.45}}>Save manually</Btn><Btn onClick={aiArrange} style={{opacity:evTitle.trim()?1:0.45}} disabled={aiLoading}>{aiLoading?"Scheduling...":React.createElement("span",{style:{display:"flex",alignItems:"center",gap:6}},Icon.wand,"AI arrange")}</Btn></>}>
        <Field label="Title"><Input placeholder="e.g. Study Bio chapter 4-6" value={evTitle} onChange={ev=>setEvTitle(ev.target.value)} autoFocus /></Field>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
          <Field label="Scheduled date"><Input type="date" value={evDate} onChange={ev=>setEvDate(ev.target.value)} /></Field>
          <Field label="Start time"><Input type="time" value={evTime} onChange={ev=>setEvTime(ev.target.value)} /></Field>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
          <Field label="Deadline" hint="When this must be done by"><Input type="date" value={evDeadline} onChange={ev=>setEvDeadline(ev.target.value)} /></Field>
          <Field label="Duration (minutes)" hint="How long you plan to spend"><Input type="number" min={5} max={480} value={evDuration} onChange={ev=>setEvDuration(Math.max(5,+ev.target.value||5))} /></Field>
        </div>
        <Field label={"Priority · "+PRIORITY_LABELS[evPriority]}>
          <div style={{display:"flex",alignItems:"center",gap:12}}>
            <span style={{fontSize:11,color:T.muted,width:24}}>Low</span>
            <input type="range" min={1} max={5} value={evPriority} onChange={ev=>setEvPriority(+ev.target.value)} style={{flex:1,accentColor:PRIORITY_COLORS[evPriority]}} />
            <span style={{fontSize:11,color:T.muted,width:40,textAlign:"right"}}>Urgent</span>
          </div>
        </Field>
        <Field label="Subject"><SelectChip options={SUBJ} value={evSubject} onChange={setEvSubject} /></Field>
        {evSubject==="Other"&&<Field label="Custom subject"><Input placeholder="e.g. Drivers ed, SAT prep, club..." value={evCustom} onChange={ev=>setEvCustom(ev.target.value)} /></Field>}
        <Field label="Type"><SelectChip options={["deadline","exam","class","study block","reminder"]} value={evKind} onChange={setEvKind} /></Field>
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
        <Field label="Notes (optional)"><Textarea placeholder="e.g. Bring calculator, covers chapters 4 to 6." value={evNotes} onChange={ev=>setEvNotes(ev.target.value)} /></Field>
      </Modal>
      <div style={{display:"grid",gridTemplateColumns:"1fr 300px",gap:16}}>
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
      </div>
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
  const [q,setQ]=useState("");
  const [playing,setPlaying]=useState(null);
  const [subjectVideos,setSubjectVideos]=useState([]);
  const [searchResults,setSearchResults]=useState(null);
  const [loading,setLoading]=useState(false);
  const [searchLoading,setSearchLoading]=useState(false);
  const subColor={"English IV":T.purple,"Biology":T.teal,"Calculus":T.blue,"Spanish":T.amber,"Chemistry":T.red,"History":T.muted};
  const colorOf=(sb)=>subColor[sb]||T.lime;

  const fmtDur=(secs)=>{if(!secs)return"";const m=Math.floor(secs/60);const s=secs%60;return m+":"+(s<10?"0":"")+s;};
  const fmtViews=(n)=>{if(!n)return"";if(n>=1e6)return(n/1e6).toFixed(1)+"M views";if(n>=1e3)return(n/1e3).toFixed(1)+"K views";return n+" views";};

  const fetchVideos=async(query,shuffle)=>{
    try{
      const res=await fetch("/api/search-videos?q="+encodeURIComponent(query+" tutorial explained")+(shuffle?"&shuffle=1":""));
      const data=await res.json();
      return data.videos||[];
    }catch(e){return[];}
  };

  const loadSubjectVideos=async(sub,shuffle)=>{
    setLoading(true);setPlaying(null);setSubjectVideos([]);
    const vids=await fetchVideos(sub,shuffle);
    setSubjectVideos(vids);setLoading(false);
  };

  useEffect(()=>{if(subject)loadSubjectVideos(subject);},[subject]);

  const search=async()=>{
    if(!q.trim())return;
    setSearchLoading(true);setPlaying(null);
    const vids=await fetchVideos(q.trim());
    setSearchResults(vids);setSearchLoading(false);
  };

  const addSubject=()=>{const v=newSub.trim();if(!v)return;if(!subjects.includes(v)){const next=subjects.concat([v]);setSubjects(next);lsSet("subjects",next);}setSubject(v);setNewSub("");setAdding(false);};
  const removeSubject=(sb)=>{const next=subjects.filter(x=>x!==sb);setSubjects(next);lsSet("subjects",next);if(subject===sb)setSubject(next[0]||"");};

  const VideoCard=({v})=>{
    const thumb=v.thumbnail||("https://img.youtube.com/vi/"+v.id+"/mqdefault.jpg");
    return (
      <div onClick={()=>setPlaying(v)} style={{borderRadius:12,overflow:"hidden",background:T.card2,border:"1px solid "+T.border,cursor:"pointer",transition:"all 0.15s"}}>
        <div style={{position:"relative",paddingBottom:"56.25%",height:0,background:"#000"}}>
          <img src={thumb} alt={v.title} loading="lazy"
            style={{position:"absolute",top:0,left:0,width:"100%",height:"100%",objectFit:"cover"}} />
          <div style={{position:"absolute",inset:0,display:"flex",alignItems:"center",justifyContent:"center",background:"rgba(0,0,0,0.25)"}}>
            <div style={{width:44,height:44,borderRadius:"50%",background:"rgba(255,255,255,0.95)",display:"flex",alignItems:"center",justifyContent:"center",boxShadow:"0 4px 12px rgba(0,0,0,0.3)"}}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="#0E1F18"><polygon points="6 3 20 12 6 21"/></svg>
            </div>
          </div>
          {v.duration>0&&<span style={{position:"absolute",bottom:6,right:6,fontSize:10,fontFamily:T.mono,fontWeight:600,background:"rgba(0,0,0,0.85)",color:"#fff",padding:"2px 6px",borderRadius:4}}>{fmtDur(v.duration)}</span>}
        </div>
        <div style={{padding:"10px 12px"}}>
          <div style={{fontSize:12.5,fontWeight:600,color:T.white,lineHeight:1.4,marginBottom:4,display:"-webkit-box",WebkitLineClamp:2,WebkitBoxOrient:"vertical",overflow:"hidden"}}>{v.title}</div>
          <div style={{display:"flex",alignItems:"center",gap:6,fontSize:11,color:T.muted}}>
            <span style={{whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{v.channel}</span>
            {v.views>0&&<><span>·</span><span style={{whiteSpace:"nowrap"}}>{fmtViews(v.views)}</span></>}
          </div>
        </div>
      </div>
    );
  };

  const VideoPlayer=()=>{
    if(!playing)return null;
    return (
      <Card style={{padding:0,overflow:"hidden",marginBottom:14,border:"1px solid "+T.lime+"44"}}>
        <div style={{position:"relative",paddingBottom:"56.25%",height:0,background:"#000"}}>
          <iframe src={"https://www.youtube.com/embed/"+playing.id+"?autoplay=1&rel=0&modestbranding=1"}
            title={playing.title} style={{position:"absolute",top:0,left:0,width:"100%",height:"100%",border:"none"}}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen />
        </div>
        <div style={{padding:"14px 18px",display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:12}}>
          <div style={{flex:1,minWidth:0}}>
            <div style={{fontSize:15,fontWeight:700,color:T.white,lineHeight:1.4,marginBottom:4}}>{playing.title}</div>
            <div style={{display:"flex",alignItems:"center",gap:8,fontSize:12,color:T.muted}}>
              <span>{playing.channel}</span>
              {playing.views>0&&<><span>·</span><span>{fmtViews(playing.views)}</span></>}
              {playing.duration>0&&<><span>·</span><span>{fmtDur(playing.duration)}</span></>}
            </div>
          </div>
          <button onClick={()=>setPlaying(null)} style={{background:T.card2,border:"1px solid "+T.border,borderRadius:8,padding:"8px 14px",color:T.text,fontSize:12,fontWeight:600,cursor:"pointer",fontFamily:T.font,whiteSpace:"nowrap"}}>✕ Close</button>
        </div>
      </Card>
    );
  };

  const VideoGrid=({videos,loading:isLoading,empty})=>{
    if(isLoading)return <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:10}}>{[0,1,2,3,4,5].map(i=><div key={i} style={{borderRadius:12,overflow:"hidden",background:T.card2,border:"1px solid "+T.border}}><div style={{paddingBottom:"56.25%",background:T.card,animation:"studlinPulse 1.5s infinite"}}/><div style={{padding:"10px 12px"}}><div style={{height:12,background:T.card,borderRadius:4,marginBottom:6,width:"80%"}}/><div style={{height:10,background:T.card,borderRadius:4,width:"50%"}}/></div></div>)}</div>;
    if(!videos||videos.length===0)return <div style={{fontSize:13,color:T.muted,padding:"30px 0",textAlign:"center"}}>{empty||"No videos found."}</div>;
    return <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:10}}>{videos.map((v,i)=><VideoCard key={v.id||i} v={v} />)}</div>;
  };

  return (
    <div>
      <PH title="Tutor" sub="Search any topic. Watch videos. Learn in-app." />
      <div style={{display:"grid",gridTemplateColumns:"190px 1fr",gap:16}}>
        <div>
          <Label>Subjects</Label>
          {subjects.map(sb=>(
            <div key={sb} onClick={()=>{setSubject(sb);setSearchResults(null);setQ("");}} style={{display:"flex",alignItems:"center",gap:10,padding:"9px 11px",borderRadius:7,marginBottom:3,fontSize:12,cursor:"pointer",background:subject===sb?T.lime+"10":"transparent",color:subject===sb?T.lime:T.muted,fontWeight:subject===sb?600:400,border:"1px solid "+(subject===sb?T.lime+"33":"transparent"),transition:"all 0.15s",position:"relative"}}>
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
            <div style={{display:"flex",gap:10,alignItems:"center"}}>
              <span style={{color:T.muted,display:"flex"}}>{Icon.search||Icon.brain}</span>
              <input value={q} onChange={ev=>setQ(ev.target.value)} onKeyDown={ev=>{if(ev.key==="Enter")search();}} placeholder="Search any topic · e.g. how photosynthesis works, quadratic formula, WWI causes" style={{flex:1,background:"transparent",border:"none",outline:"none",color:T.text,fontSize:13.5,fontFamily:T.font}} />
              {searchLoading
                ?<span style={{fontSize:12,color:T.muted}}>Searching...</span>
                :<Btn onClick={search} style={{opacity:q.trim()?1:0.45}}>Search</Btn>}
            </div>
          </Card>

          {searchResults&&(
            <Card style={{padding:"14px 18px"}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
                <Label>Results for "{q}"</Label>
                <div style={{display:"flex",gap:6}}>
                  <BtnSm variant="subtle" onClick={search}>↻ Refresh</BtnSm>
                  <BtnSm variant="subtle" onClick={()=>{setSearchResults(null);setQ("");setPlaying(null);}}>✕ Clear</BtnSm>
                </div>
              </div>
              <VideoGrid videos={searchResults} loading={searchLoading} empty={"No results for \""+q+"\". Try different keywords."} />
            </Card>
          )}

          <VideoPlayer />

          {!searchResults&&(
            <>
              {!playing&&(
                <Card style={{padding:24}}>
                  <div style={{display:"flex",alignItems:"center",gap:14,marginBottom:16}}>
                    <div style={{width:44,height:44,borderRadius:10,background:colorOf(subject)+"18",border:"1px solid "+colorOf(subject)+"33",display:"flex",alignItems:"center",justifyContent:"center",color:colorOf(subject)}}>{Icon.brain}</div>
                    <div>
                      <div style={{fontSize:16,fontWeight:700,color:T.white,letterSpacing:"-0.01em"}}>Studlin</div>
                      <div style={{fontSize:12,color:T.muted}}>{subject} · Socratic method</div>
                    </div>
                  </div>
                  <div style={{fontSize:14,color:T.text,lineHeight:1.75,padding:"14px 16px",background:T.card2,borderRadius:8,border:"1px solid "+T.border}}>
                    Ask me anything about <strong style={{color:T.lime,fontWeight:600}}>{subject}</strong> · I will walk you through it step by step, quiz you, or build a study plan. Watch the videos below or search any topic above.
                  </div>
                </Card>
              )}

              <Card style={{padding:"14px 18px"}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
                  <Label>{subject} videos</Label>
                  <BtnSm variant="subtle" onClick={()=>loadSubjectVideos(subject,true)}>↻ Refresh</BtnSm>
                </div>
                <VideoGrid videos={subjectVideos} loading={loading} empty={"Couldn't load videos right now. Hit refresh to try again."} />
              </Card>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── GRAMMAR & POLISH ─────────────────────────────────────────────────────────
function GrammarPolish() {
  const [text,setText]=useState("Shakespeare use of metaphors in Macbeth is very important for showing themes. The play have many example of this. Lady Macbeth she is a complex character who influence her husband decisions greatly.");
  const [checked,setChecked]=useState(false);
  const issues=[
    {type:"Grammar",orig:"Shakespeare use",fix:"Shakespeare's use",color:T.red,desc:"Missing possessive apostrophe"},
    {type:"Grammar",orig:"The play have",fix:"The play has",color:T.red,desc:"Subject-verb agreement"},
    {type:"Style",orig:"very important",fix:"crucial / significant",color:T.amber,desc:"Weak intensifier · use stronger vocabulary"},
    {type:"Grammar",orig:"Lady Macbeth she",fix:"Lady Macbeth",color:T.red,desc:"Pronoun redundancy"},
    {type:"Grammar",orig:"influence her husband decisions",fix:"influences her husband's decisions",color:T.red,desc:"Tense error and missing possessive"},
  ];
  return (
    <div>
      <PH title="Grammar &amp; Polish" sub="Identify errors and elevate your academic writing" />
      <div style={{display:"grid",gridTemplateColumns:"1fr 270px",gap:16}}>
        <div>
          <Card>
            <Label>Your text</Label>
            <textarea style={{width:"100%",background:T.card2,border:`1px solid ${T.border}`,borderRadius:7,padding:"12px 14px",color:T.text,fontSize:13,fontFamily:T.font,outline:"none",resize:"vertical",minHeight:140,lineHeight:1.75,boxSizing:"border-box",marginBottom:12}} value={text} onChange={e=>setText(e.target.value)} />
            <div style={{display:"flex",gap:8}}>
              <Btn onClick={()=>setChecked(true)}>Run grammar check</Btn>
              <Btn variant="subtle">Elevate prose</Btn>
              <Btn variant="subtle">Tone analysis</Btn>
            </div>
          </Card>
          {checked&&(
            <div style={{marginTop:14}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
                <div style={{fontSize:13,fontWeight:600,color:T.white}}>{issues.length} issues found</div>
                <BtnSm variant="subtle">Accept all</BtnSm>
              </div>
              {issues.map((issue,i)=>(
                <Card key={i} style={{borderLeft:`2px solid ${issue.color}`,marginBottom:8,padding:14}}>
                  <div style={{display:"flex",gap:8,alignItems:"center",marginBottom:8}}>
                    <Badge color={issue.color}>{issue.type}</Badge>
                    <span style={{fontSize:12,color:T.muted}}>{issue.desc}</span>
                  </div>
                  <div style={{display:"flex",gap:10,alignItems:"center",fontSize:13}}>
                    <span style={{color:T.red,textDecoration:"line-through",opacity:0.8}}>{issue.orig}</span>
                    <span style={{color:T.muted}}>→</span>
                    <span style={{color:T.lime,fontWeight:600}}>{issue.fix}</span>
                    <BtnSm style={{marginLeft:"auto"}}>Accept</BtnSm>
                    <BtnSm variant="ghost">Dismiss</BtnSm>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
        <div style={{display:"flex",flexDirection:"column",gap:12}}>
          <Card style={{background:T.lime,border:"none"}}>
            <Label>Overall grade</Label>
            <div style={{fontSize:40,fontWeight:700,color:T.bg,letterSpacing:"-0.03em",lineHeight:1}}>{checked?"B+":"—"}</div>
            <div style={{fontSize:12,color:T.bg,opacity:0.65,marginTop:5}}>Grade 11 reading level</div>
          </Card>
          <Card>
            <Label>Rewrite tools</Label>
            {["Rephrase for clarity","Elevate to academic register","Simplify sentence structure","Add transitional phrases","Vary sentence length"].map((a,i)=>(
              <button key={i} style={{display:"flex",alignItems:"center",gap:8,width:"100%",textAlign:"left",padding:"9px 10px",borderRadius:6,marginBottom:4,fontSize:12,cursor:"pointer",border:`1px solid ${T.border}`,background:"transparent",color:T.muted,fontFamily:T.font,transition:"all 0.15s"}}>{Icon.wand} {a}</button>
            ))}
          </Card>
          {checked&&(
            <Card>
              <Label>Error breakdown</Label>
              {[["Grammar errors",3,T.red],["Style issues",2,T.amber],["Clarity flags",0,T.teal]].map(([k,v,c],i)=>(
                <div key={i} style={{display:"flex",justifyContent:"space-between",padding:"8px 0",borderBottom:i<2?`1px solid ${T.border}`:"none",fontSize:12}}>
                  <span style={{color:T.muted}}>{k}</span>
                  <span style={{color:c,fontWeight:600}}>{v}</span>
                </div>
              ))}
            </Card>
          )}
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
function SettingsTab({theme="dark", setTheme=()=>{}, accent="Lime", setAccent=()=>{}, density="Comfortable", setDensity=()=>{}}) {
  const [active,setActive]=useState("General");
  const [toggles,setToggles]=useState(()=>({...{push:true,sound:true,streak:true,deadline:true,sr:true,auto:true,analytics:false,sync:true,emails:false,profile:true,share:true,twofa:false,collect:false,motion:false,hand:true,wrapped:true,squad:true,autoSession:false,block:false},...lsGet("settings",{})}));
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
        <div style={{height:90,borderRadius:8,overflow:"hidden",background:isLight?"#FBF7EE":"#0F1411",border:`1px solid ${isLight?"rgba(14,31,24,0.08)":"rgba(255,255,255,0.06)"}`,marginBottom:12,display:"flex"}}>
          <div style={{width:24,background:"#14342A",display:"flex",flexDirection:"column",alignItems:"center",padding:"6px 0",gap:4}}>
            <div style={{width:10,height:10,background:"#9EC83D",borderRadius:2}} />
            <div style={{width:14,height:3,background:"rgba(255,255,255,0.2)",borderRadius:1,marginTop:4}} />
            <div style={{width:14,height:3,background:"rgba(255,255,255,0.12)",borderRadius:1}} />
            <div style={{width:14,height:3,background:"rgba(255,255,255,0.12)",borderRadius:1}} />
          </div>
          <div style={{flex:1,padding:8,display:"flex",flexDirection:"column",gap:5}}>
            <div style={{display:"flex",gap:4}}>
              <div style={{flex:1,height:18,background:isLight?"#14342A":"#1c2420",borderRadius:3}} />
              <div style={{width:24,height:18,background:"#9EC83D",borderRadius:3}} />
              <div style={{width:24,height:18,background:isLight?"#fff":"#1c2420",borderRadius:3,border:isLight?"1px solid rgba(14,31,24,0.08)":"none"}} />
            </div>
            <div style={{display:"flex",gap:4}}>
              <div style={{flex:1,height:14,background:isLight?"#fff":"#1c2420",borderRadius:3,border:isLight?"1px solid rgba(14,31,24,0.08)":"none"}} />
              <div style={{flex:1,height:14,background:isLight?"#fff":"#1c2420",borderRadius:3,border:isLight?"1px solid rgba(14,31,24,0.08)":"none"}} />
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
  const accents=[{n:"Lime",c:"#9EC83D"},{n:"Forest",c:"#3E9576"},{n:"Sky",c:"#4F95D6"},{n:"Lilac",c:"#9474C9"},{n:"Peach",c:"#D07C4C"}];

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
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:14}}>
                <div>
                  <div style={{fontSize:14,fontWeight:700,color:T.white,marginBottom:4}}>Theme</div>
                  <div style={{fontSize:12,color:T.muted}}>Switch between light and dark. Your choice persists across sessions.</div>
                </div>
                <Badge color={T.lime}>{theme==="light"?"Light mode":"Dark mode"}</Badge>
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


// ─── COLLECTION ──────────────────────────────────────────────────────────────
function Collection() {
  const [sel,setSel]=useState(null);
  const data=getCharacterData();
  const streak=getStreak();
  const lvl=levelInfo();
  const isUnlocked=function(id){return data.unlocked.indexOf(id)!==-1;};
  const streakChars=CHARACTERS.filter(function(c){return c.type==="streak";});
  const levelChars=CHARACTERS.filter(function(c){return c.type==="level";});
  const totalU=CHARACTERS.filter(function(c){return isUnlocked(c.id);}).length;
  const nextStreak=streakChars.find(function(c){return !isUnlocked(c.id);});
  const nextLevel=levelChars.find(function(c){return !isUnlocked(c.id);});

  useEffect(function(){
    var d=getCharacterData();
    var unseen=d.unlocked.filter(function(id){return d.seen.indexOf(id)===-1;});
    if(unseen.length>0){d.seen=d.seen.concat(unseen);saveCharacterData(d);}
  },[]);

  var CharCard=function(props){
    var c=props.c;
    var u=isUnlocked(c.id);
    var prog=c.type==="streak"?Math.min(100,Math.round(streak/c.threshold*100)):Math.min(100,Math.round(lvl.level/c.threshold*100));
    var isNew=u&&data.unlockedAt[c.id]&&(Date.now()-data.unlockedAt[c.id])<7*86400000;
    return(
      <div onClick={function(){if(u)setSel(c);}} style={{background:u?T.card:T.card2,border:"1px solid "+(u?T.lime+"44":T.border),borderRadius:16,padding:18,cursor:u?"pointer":"default",opacity:u?1:0.5,transition:"all 0.2s",position:"relative"}}>
        {isNew&&<span style={{position:"absolute",top:8,right:10,fontSize:9,fontWeight:700,background:T.lime,color:T.ink,padding:"2px 6px",borderRadius:99}}>NEW</span>}
        <div style={{fontSize:36,marginBottom:10,filter:u?"none":"grayscale(1)"}}>{c.emoji}</div>
        <div style={{fontSize:13,fontWeight:700,color:u?T.white:T.muted,marginBottom:2}}>{c.name}</div>
        <div style={{fontSize:10,color:T.muted,marginBottom:8}}>{c.type==="streak"?c.threshold+"-day streak":"Level "+c.threshold}</div>
        {!u&&<Prog pct={prog} color={T.faint} height={3} />}
        {u&&<div style={{fontSize:10,color:T.lime,fontWeight:600}}>Unlocked</div>}
      </div>
    );
  };

  return(
    <div>
      <PH title="Collection" sub={totalU+" / "+CHARACTERS.length+" characters collected"} />
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16,marginBottom:24}}>
        {nextStreak&&(
          <Card style={{borderLeft:"3px solid "+T.amber}}>
            <Label>Next streak unlock</Label>
            <div style={{display:"flex",alignItems:"center",gap:12}}>
              <span style={{fontSize:28,filter:"grayscale(1)",opacity:0.5}}>{nextStreak.emoji}</span>
              <div style={{flex:1}}>
                <div style={{fontSize:14,fontWeight:600,color:T.white}}>{nextStreak.name}</div>
                <div style={{fontSize:11,color:T.muted}}>{nextStreak.threshold}-day streak — you are at {streak} days</div>
                <Prog pct={Math.min(100,Math.round(streak/nextStreak.threshold*100))} color={T.amber} height={4} />
              </div>
            </div>
          </Card>
        )}
        {nextLevel&&(
          <Card style={{borderLeft:"3px solid "+T.purple}}>
            <Label>Next level unlock</Label>
            <div style={{display:"flex",alignItems:"center",gap:12}}>
              <span style={{fontSize:28,filter:"grayscale(1)",opacity:0.5}}>{nextLevel.emoji}</span>
              <div style={{flex:1}}>
                <div style={{fontSize:14,fontWeight:600,color:T.white}}>{nextLevel.name}</div>
                <div style={{fontSize:11,color:T.muted}}>Level {nextLevel.threshold} — you are at {lvl.level}</div>
                <Prog pct={Math.min(100,Math.round(lvl.level/nextLevel.threshold*100))} color={T.purple} height={4} />
              </div>
            </div>
          </Card>
        )}
      </div>
      <div style={{marginBottom:20}}>
        <Label>Streak Characters</Label>
        <div style={{display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:10}}>{streakChars.map(function(c){return <CharCard key={c.id} c={c} />;})}</div>
      </div>
      <div>
        <Label>Level Characters</Label>
        <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:10}}>{levelChars.map(function(c){return <CharCard key={c.id} c={c} />;})}</div>
      </div>
      <Modal open={!!sel} onClose={function(){setSel(null);}} title={sel?sel.name:""} width={400}>
        {sel&&(
          <div style={{textAlign:"center",padding:"20px 0"}}>
            <div style={{fontSize:72,marginBottom:16}}>{sel.emoji}</div>
            <h2 style={{fontSize:24,fontWeight:700,color:T.white,margin:"0 0 8px"}}>{sel.name}</h2>
            <div style={{fontSize:10,fontWeight:700,letterSpacing:"0.1em",color:T.lime,textTransform:"uppercase",marginBottom:16}}>{sel.type==="streak"?sel.threshold+"-day streak":"Level "+sel.threshold}</div>
            <p style={{fontSize:15,color:T.muted,lineHeight:1.6,fontStyle:"italic",margin:0}}>"{sel.desc}"</p>
            {data.unlockedAt[sel.id]&&<div style={{fontSize:11,color:T.faint,marginTop:16}}>Unlocked {new Date(data.unlockedAt[sel.id]).toLocaleDateString()}</div>}
          </div>
        )}
      </Modal>
    </div>
  );
}

// ─── PROFILE ──────────────────────────────────────────────────────────────────
function Profile() {
  const prof=getProfile();
  const lvl=levelInfo();
  const streak=Math.max(1,getStreak());
  const ps=profileStats();
  const initials=((prof.name||"").split(" ").map(x=>x[0]).join("").slice(0,2).toUpperCase())||"S";
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
  return (
    <div>
      <Card style={{display:"flex",alignItems:"center",gap:24,marginBottom:16,padding:28}}>
        <Av initials={initials} color={T.lime} size={80} />
        <div style={{flex:1}}>
          <div style={{fontSize:22,fontWeight:700,color:T.white,letterSpacing:"-0.02em",marginBottom:3}}>{prof.name}</div>
          <div style={{fontSize:13,color:T.muted,marginBottom:12}}>{prof.school}</div>
          <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
            <Badge color={T.lime}>Pro</Badge>
            <Badge color={T.amber}>{streak}-day streak</Badge>
            <Badge color={T.blue}>Level {lvl.level}</Badge>
          </div>
        </div>
        <div style={{textAlign:"right"}}>
          <div style={{fontSize:42,fontWeight:700,color:T.lime,letterSpacing:"-0.04em",lineHeight:1}}>{lvl.xp.toLocaleString()}</div>
          <div style={{fontSize:12,color:T.muted,marginTop:3}}>XP · Level {lvl.level}</div>
          <div style={{marginTop:10,width:160}}><Prog pct={lvl.pct} /></div>
          <div style={{fontSize:11,color:T.muted,marginTop:4}}>{lvl.toNext} XP to Level {lvl.level+1}</div>
        </div>
      </Card>
      <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:10,marginBottom:16}}>
        {[["Total study time",fmtH(ps.totalMin),T.lime],["Essays submitted","8",T.purple],["Cards mastered","147",T.teal],["Quizzes completed","23",T.amber],["Chat sessions","89",T.blue],["Focus sessions",String(ps.focusSessions),T.red]].map(([l,v,c],i)=>(
          <Card key={i} style={{textAlign:"center",padding:16}}>
            <div style={{fontSize:26,fontWeight:700,color:c,letterSpacing:"-0.02em",lineHeight:1}}>{v}</div>
            <div style={{fontSize:11,color:T.muted,marginTop:6}}>{l}</div>
          </Card>
        ))}
      </div>
      <div style={{fontSize:12,fontWeight:700,color:T.muted,letterSpacing:"0.08em",textTransform:"uppercase",marginBottom:10}}>Achievements</div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:8,marginBottom:16}}>
        {badges.map((b,i)=>(
          <Card key={i} style={{display:"flex",flexDirection:"column",alignItems:"center",gap:8,padding:14,cursor:"pointer"}}>
            <div style={{width:36,height:36,borderRadius:8,background:b.color+"14",border:`1px solid ${b.color}33`,display:"flex",alignItems:"center",justifyContent:"center",color:b.color}}>{b.icon}</div>
            <div style={{fontSize:10,color:T.muted,textAlign:"center",lineHeight:1.3}}>{b.name}</div>
          </Card>
        ))}
      </div>
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

// ─── DASHBOARD ────────────────────────────────────────────────────────────────
function Dashboard({setActive, focusSecs=22*60+10, focusRunning=true, setFocusRunning=()=>{}}) {
  const realStats=sessionStats();
  const realStreak=Math.max(1,getStreak());
  const lvl=levelInfo();
  const wk=weekStreak();
  const [,forcePlan]=useState(0);
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
  const fm=String(Math.floor(focusSecs/60)).padStart(2,"0");
  const fs=String(focusSecs%60).padStart(2,"0");
  const fmtTime=`${fm}:${fs}`;
  const totalSecs=25*60; // pomodoro session
  const pct=Math.max(0,Math.min(100,((totalSecs-focusSecs)/totalSecs)*100));
  const tasks=[
    {task:"Bio · Cell respiration flashcards",sub:"Reviewed 24 / 30 cards · 86% accuracy",tag:"Bio",tagBg:T.mint,done:true,time:"30m"},
    {task:"Read Ch. 4 · Macbeth Act III",sub:"Notes synced to \"English IV\"",tag:"Eng",tagBg:T.lilac,done:true,time:"25m"},
    {task:"Spanish · review subjunctive",sub:"8 / 12 verbs mastered",tag:"Esp",tagBg:T.peach,done:true,time:"20m"},
    {task:'Draft essay · "Power & corruption"',sub:"1,247 / 1,500 words · grammar pass pending",tag:"NOW",tagBg:T.ink,tagColor:T.cream,now:true,time:"45m"},
    {task:"Calc · practice integrals",sub:"Set 4.2 · problems 1–14",tag:"Calc",tagBg:T.sky,time:"25m"},
  ];
  const decks=[
    {subj:"BIO · DECK",title:"Cellular respiration",pct:80,a:"24 / 30",b:"86%",bg:T.mint},
    {subj:"ENG · ESSAY",title:"Power & corruption (Macbeth)",pct:60,a:"1,247 wd",b:"DRAFT",bg:T.peach},
    {subj:"CALC · NOTES",title:"Integration techniques",pct:45,a:"14 pages",b:"Mon",bg:T.sky},
    {subj:"CHEM · DECK",title:"Stoichiometry · quiz prep",pct:35,a:"9 / 26",b:"QUIZ MON",bg:T.lilac},
    {subj:"ESP · DECK",title:"Subjunctive verbs",pct:67,a:"8 / 12",b:"92%",bg:T.card2},
    {subj:"HIST · NOTES",title:"Cold War timeline",pct:25,a:"6 pages",b:"3d ago",bg:T.card2},
  ];
  const lb=[
    {r:1,n:"Maya R.",m:"14h 22m · 12-day streak",s:"2,140",you:true,grad:"linear-gradient(135deg,#FFD7B5,#FFC9D2)"},
    {r:2,n:"Devon K.",m:"12h 08m · 8-day streak",s:"1,840",grad:"linear-gradient(135deg,#BFE3FF,#E2D0FF)"},
    {r:3,n:"Priya S.",m:"10h 41m · 5-day streak",s:"1,602",grad:"linear-gradient(135deg,#C4F0D8,#FFE99A)"},
    {r:4,n:"Jordan T.",m:"7h 15m · streak broken",s:"1,088",grad:"linear-gradient(135deg,#E2D0FF,#FFD7B5)"},
  ];
  const dl=[
    {d:"20",mo:"MON",t:"Chem quiz · stoichiometry",sub:"CHEM 14B · weighs 12%",cd:"3d",urgent:true},
    {d:"22",mo:"WED",t:"Macbeth essay due",sub:"1,500 words · 60% draft",cd:"5d"},
    {d:"25",mo:"SAT",t:"Calc problem set 4.2",sub:"Integrals · 14 problems",cd:"8d"},
    {d:"29",mo:"WED",t:"Bio midterm",sub:"Cell + molecular · 40 MCQ",cd:"12d"},
  ];
  // streak heatmap data
  const seed=[0,1,2,0,3,4,2,1,0,3,2,4,1,0,2,3,1,4,2,3,0,1,2,4,3,2,1,3,4,2,3,1,4,3,2,4,3,2,1,2,3,4,3,2,3,4,2,3,2,4,3,2,3,4,3,4,2,3,4,3,4,3,2,3,4,3,4,3,4,3,4,3,4,3,4,3,4,3,4,3,4,3,4,3,4,3,4,3,4,3,4];
  const cellColor=(lvl)=>{
    if(!lvl) return T.mode==="light"?"rgba(14,31,24,0.06)":"rgba(255,255,255,0.06)";
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
  return (
    <div style={{display:"flex",flexDirection:"column",gap:16,paddingBottom:40}}>

      {/* GREETING STRIP · greet + streak + xp */}
      <div style={{display:"grid",gridTemplateColumns:"1.5fr 1fr 1fr",gap:16}}>
        {/* Greeting */}
        <div style={{background:`linear-gradient(135deg, ${T.forest} 0%, #1B4536 100%)`,color:T.cream,borderRadius:22,padding:"26px 30px",position:"relative",overflow:"hidden",minHeight:200}}>
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
            </div>
          </div>
        </div>

        {/* Streak */}
        <div onClick={()=>setActive("profile")} style={{background:T.lime,borderRadius:22,padding:22,cursor:"pointer",border:"none",display:"flex",flexDirection:"column"}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
            <span style={{fontFamily:T.mono,fontSize:10.5,letterSpacing:"0.14em",textTransform:"uppercase",color:"rgba(14,31,24,0.6)",fontWeight:600}}>Day Streak</span>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={T.ink} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{opacity:0.6}}><path d="M12 2s4 5 4 9a4 4 0 0 1-8 0c0-2 1-3 1-3s-3 2-3 6a6 6 0 0 0 12 0c0-5-6-12-6-12z"/></svg>
          </div>
          <div style={{fontFamily:T.hand,fontSize:60,lineHeight:0.85,fontWeight:600,color:T.ink,margin:"10px 0 2px"}}>{realStreak}<span style={{fontSize:20,color:"rgba(14,31,24,0.55)",marginLeft:6}}>days</span></div>
          <div style={{fontSize:12,color:"rgba(14,31,24,0.7)"}}>Longest: 31 · +10 credits unlocked</div>
          <div style={{display:"flex",gap:5,marginTop:"auto",paddingTop:14}}>
            {wk.map((d,i)=>{
              const today=d.today, on=d.on;
              return <div key={i} style={{flex:1,height:26,borderRadius:6,background:today?T.ink:on?T.forest:"rgba(14,31,24,0.10)",color:today?T.lime:on?T.lime:"rgba(14,31,24,0.4)",opacity:d.future?0.45:1,display:"grid",placeItems:"center",fontSize:10,fontFamily:T.mono,fontWeight:today?700:400,boxShadow:today?"0 0 0 2px "+T.ink:"none"}}>{d.lab}</div>;
            })}
          </div>
        </div>

        {/* XP / Level */}
        <div onClick={()=>setActive("profile")} style={{background:T.card,borderRadius:22,padding:22,cursor:"pointer",border:`1px solid ${T.border}`,display:"flex",flexDirection:"column"}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
            <span style={{fontFamily:T.mono,fontSize:10.5,letterSpacing:"0.14em",textTransform:"uppercase",color:T.muted,fontWeight:600}}>XP &amp; Level</span>
            <span style={{fontFamily:T.mono,fontSize:10,letterSpacing:"0.12em",background:T.card2,padding:"3px 8px",borderRadius:99,color:T.text}}>LVL {lvl.level}</span>
          </div>
          <div style={{fontFamily:T.hand,fontSize:60,lineHeight:0.85,fontWeight:600,color:T.text,margin:"10px 0 2px"}}>{lvl.xp.toLocaleString()}<span style={{fontSize:20,color:T.muted,marginLeft:6}}>xp</span></div>
          <div style={{fontSize:12,color:T.muted}}>{lvl.toNext} XP to Level {lvl.level+1}</div>
          <div style={{height:6,background:T.card2,borderRadius:99,marginTop:"auto",overflow:"hidden"}}>
            <div style={{height:"100%",width:lvl.pct+"%",background:T.lime}} />
          </div>
        </div>
      </div>

      {/* ROW 2: Today's plan + Focus + Chat (5/3/4) */}
      <div style={{display:"grid",gridTemplateColumns:"5fr 3fr 4fr",gap:16}}>
        {/* Today's plan */}
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

        {/* Focus Pomodoro */}
        <div style={{background:`linear-gradient(180deg, ${T.forest} 0%, #0B201A 100%)`,color:T.cream,borderRadius:22,padding:22,position:"relative",overflow:"hidden",display:"flex",flexDirection:"column"}}>
          <div style={{position:"absolute",right:-60,bottom:-60,width:220,height:220,background:"radial-gradient(circle,rgba(200,255,90,0.15),transparent 65%)"}} />
          <div style={{position:"relative",zIndex:1}}>
            <CardHead title="Focus" label="POMODORO" light />
            <div style={{fontFamily:T.mono,fontSize:10.5,letterSpacing:"0.14em",textTransform:"uppercase",color:"rgba(246,241,230,0.55)"}}>Session 3 of 4</div>
            <div style={{fontFamily:T.hand,fontSize:88,lineHeight:0.85,fontWeight:700,color:T.lime,margin:"8px 0 4px",fontVariantNumeric:"tabular-nums"}}>{fmtTime}</div>
            <div style={{fontSize:12.5,color:"rgba(246,241,230,0.7)",marginBottom:16}}>{focusRunning?`Break in ${fm} min · then 5 min off`:"Session paused · tap play to resume"}</div>
            <div style={{height:6,background:"rgba(246,241,230,0.12)",borderRadius:99,marginBottom:18,overflow:"hidden"}}><div style={{height:"100%",width:pct+"%",background:T.lime,transition:"width 1s linear"}}/></div>
            <div style={{display:"flex",gap:8}}>
              <button onClick={()=>setFocusRunning(r=>!r)} style={{width:48,height:48,borderRadius:"50%",background:T.lime,color:T.ink,border:"none",display:"grid",placeItems:"center",cursor:"pointer"}}>
                {focusRunning
                  ?<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="5" width="4" height="14" rx="1"/><rect x="14" y="5" width="4" height="14" rx="1"/></svg>
                  :<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21"/></svg>
                }
              </button>
              {[
                <svg key="s" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="5 4 15 12 5 20 5 4"/><line x1="19" y1="5" x2="19" y2="19"/></svg>,
                <svg key="m" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>,
              ].map((ic,i)=>(
                <button key={i} style={{width:38,height:38,borderRadius:"50%",background:"rgba(246,241,230,0.08)",color:T.cream,border:"1px solid rgba(246,241,230,0.14)",display:"grid",placeItems:"center",cursor:"pointer"}}>{ic}</button>
              ))}
            </div>
            <div style={{display:"inline-flex",alignItems:"center",gap:8,padding:"7px 12px",background:"rgba(246,241,230,0.06)",border:"1px solid rgba(246,241,230,0.14)",borderRadius:99,fontSize:12,marginTop:14}}>
              <span style={{width:8,height:8,borderRadius:"50%",background:T.butter}}/>
              English IV · Macbeth essay
            </div>
          </div>
        </div>

        {/* Ask Studlin */}
        <div style={{background:T.ink,color:T.cream,borderRadius:22,padding:22,display:"flex",flexDirection:"column"}}>
          <CardHead title="Ask Studlin" label="AI TUTOR" more="Open" light />
          <div style={{fontSize:13,color:"rgba(246,241,230,0.7)",marginBottom:14,lineHeight:1.5}}>I noticed you're stuck on Macbeth Act III · want me to walk through the dagger soliloquy or pull quotes for your essay?</div>
          <div style={{display:"flex",flexWrap:"wrap",gap:6,marginBottom:14}}>
            {["Explain dagger soliloquy","Find quotes for essay","Quiz me on Act III"].map(s=>(
              <button key={s} onClick={()=>setActive("aichat")} style={{fontSize:11.5,padding:"6px 11px",background:"rgba(246,241,230,0.06)",border:"1px solid rgba(246,241,230,0.14)",borderRadius:99,color:"rgba(246,241,230,0.85)",cursor:"pointer",fontFamily:T.font}}>{s}</button>
            ))}
          </div>
          <div style={{display:"flex",alignItems:"center",gap:10,background:"rgba(246,241,230,0.06)",border:"1px solid rgba(246,241,230,0.14)",borderRadius:14,padding:"10px 12px",marginTop:"auto"}}>
            <input placeholder="Ask anything · paste a problem" style={{flex:1,background:"none",border:"none",outline:"none",color:T.cream,fontSize:13,fontFamily:T.font,minWidth:0}}/>
            <button onClick={()=>setActive("aichat")} style={{display:"grid",placeItems:"center",width:30,height:30,borderRadius:8,background:T.lime,color:T.ink,border:"none",cursor:"pointer",flex:"none"}}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" stroke="none"><polygon points="22 2 15 22 11 13 2 9"/></svg>
            </button>
          </div>
          <div style={{fontFamily:T.mono,fontSize:10,letterSpacing:"0.1em",textTransform:"uppercase",color:"rgba(246,241,230,0.45)",marginTop:10,display:"flex",justifyContent:"space-between"}}>
            <span>1 credit per message</span>
            <span>{getCredits()} credits left</span>
          </div>
        </div>
      </div>

      {/* ROW 3: Weekly chart (7) + Wrapped (5) */}
      <div style={{display:"grid",gridTemplateColumns:"7fr 5fr",gap:16}}>
        <div style={{background:T.card,border:`1px solid ${T.border}`,borderRadius:22,padding:22}}>
          <CardHead title="This week's focus" label={(fmtH(realStats.weekMin)||"0m").toUpperCase()+" THIS WEEK · TRACKED LIVE"} more="View Wrapped" />
          <div style={{display:"flex",alignItems:"flex-end",gap:10,height:140,padding:"0 4px"}}>
            {[
              {segs:[{c:T.limeDk,h:18},{c:T.forest,h:32}],d:"Mon"},
              {segs:[{c:T.butter,h:10},{c:T.limeDk,h:25},{c:T.forest,h:40}],d:"Tue"},
              {segs:[{c:T.limeDk,h:20},{c:T.forest,h:35}],d:"Wed"},
              {segs:[{c:T.butter,h:15},{c:T.limeDk,h:30},{c:T.forest,h:45}],d:"Thu"},
              {segs:[{c:T.butter,h:8},{c:T.limeDk,h:22},{c:T.forest,h:38}],d:"Fri",today:true},
              {segs:[],d:"Sat"},
              {segs:[],d:"Sun"},
            ].map((bar,i)=>(
              <div key={i} style={{flex:1,display:"flex",flexDirection:"column-reverse",gap:2,height:"100%",position:"relative"}}>
                {bar.segs.map((s,j)=><div key={j} style={{width:"100%",height:s.h+"%",background:s.c,borderRadius:j===bar.segs.length-1?"4px 4px 0 0":0}}/>)}
                <div style={{position:"absolute",bottom:-22,left:0,right:0,textAlign:"center",fontFamily:T.mono,fontSize:10,color:bar.today?T.text:T.faint,fontWeight:bar.today?700:400}}>{bar.d}</div>
              </div>
            ))}
          </div>
          <div style={{display:"flex",gap:14,fontSize:11,color:T.muted,marginTop:36}}>
            <span><span style={{width:10,height:10,borderRadius:3,background:T.forest,display:"inline-block",verticalAlign:"middle",marginRight:5}}/>Reading &amp; notes</span>
            <span><span style={{width:10,height:10,borderRadius:3,background:T.limeDk,display:"inline-block",verticalAlign:"middle",marginRight:5}}/>Flashcards</span>
            <span><span style={{width:10,height:10,borderRadius:3,background:T.butter,display:"inline-block",verticalAlign:"middle",marginRight:5}}/>Writing</span>
            <span style={{marginLeft:"auto",color:T.text,fontWeight:500}}>Top subject: <span style={{fontFamily:T.mono}}>BIO</span></span>
          </div>
        </div>

        <div style={{background:T.forest,color:T.cream,borderRadius:22,padding:22}}>
          <CardHead title="Weekly Wrapped" label="WEEK 20" more="View full" light />
          <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:10,marginBottom:14}}>
            {[{l:"Focus hours",v:"14h 22m",d:"+3.2h"},{l:"Cards mastered",v:"142",d:"+38"},{l:"Words written",v:"3,840",d:"+1,200"}].map((s,i)=>(
              <div key={i} style={{background:"rgba(246,241,230,0.05)",borderRadius:12,padding:"12px 14px"}}>
                <div style={{fontFamily:T.mono,fontSize:10,letterSpacing:"0.06em",textTransform:"uppercase",color:"rgba(246,241,230,0.55)"}}>{s.l}</div>
                <div style={{fontFamily:T.hand,fontSize:28,fontWeight:700,color:T.lime,lineHeight:1,marginTop:4}}>{s.v}</div>
                <div style={{fontSize:11,color:T.lime,fontWeight:600,marginTop:2,opacity:0.85}}>{s.d} vs last wk</div>
              </div>
            ))}
          </div>
          <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
            {["12-day streak","Bio top 1%","Early bird"].map((b,i)=>(
              <span key={i} style={{display:"inline-flex",alignItems:"center",gap:6,padding:"6px 12px",background:"rgba(246,241,230,0.06)",border:"1px solid rgba(246,241,230,0.12)",borderRadius:99,fontSize:11.5,color:T.cream}}>
                <span style={{width:18,height:18,borderRadius:"50%",background:T.lime,display:"grid",placeItems:"center",color:T.ink,fontSize:10,fontWeight:700,flex:"none"}}>{["12","*","4"][i]}</span>
                {b}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* ROW 4: Quick tools (8) + Streak heatmap (4) */}
      <div style={{display:"grid",gridTemplateColumns:"8fr 4fr",gap:16}}>
        <div style={{background:T.card,border:`1px solid ${T.border}`,borderRadius:22,padding:22}}>
          <CardHead title="Quick tools" label="JUMP RIGHT IN" more="Browse all" />
          <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:10}}>
            {[
              {ic:Icon.pen,h:"Essay Writer",p:"Draft, outline, intro & conclusion from a prompt",pg:"essays"},
              {ic:Icon.layers,h:"Flashcards from file",p:"Drop a PDF · spaced-rep deck in 10s",pg:"flashcards"},
              {ic:Icon.scan,h:"Plagiarism check",p:"Scan against academic databases",pg:"grammar"},
              {ic:Icon.quote,h:"Citation generator",p:"MLA · APA · Chicago · from a URL",pg:"grammar"},
              {ic:Icon.wand,h:"AI Humanizer",p:"Rewrite in your voice · beat detectors",lock:"SCHOLAR",pg:"humanizer"},
              {ic:Icon.zap,h:"Equation solver",p:"Step-by-step math with explanations",pg:"aitutor"},
              {ic:Icon.chat,h:"YouTube summarizer",p:"Paste a lecture URL · get key points",lock:"ELITE",pg:"aichat"},
              {ic:Icon.brain,h:"Exam prep mode",p:"Practice tests & MCQs from your notes",lock:"ELITE",pg:"aitutor"},
            ].map((tool,i)=>(
              <div key={i} onClick={()=>setActive(tool.pg)} style={{background:T.bg,border:`1px solid ${T.border}`,borderRadius:14,padding:16,display:"flex",flexDirection:"column",gap:4,cursor:"pointer",position:"relative",overflow:"hidden",transition:"transform 0.18s"}}>
                <div style={{width:32,height:32,borderRadius:9,background:T.card,display:"grid",placeItems:"center",color:T.forest,marginBottom:6,border:`1px solid ${T.border}`}}>{tool.ic}</div>
                <div style={{fontSize:13,fontWeight:600,color:T.text,letterSpacing:"-0.01em"}}>{tool.h}</div>
                <div style={{fontSize:11.5,color:T.muted,lineHeight:1.4}}>{tool.p}</div>
                {tool.lock&&<span style={{position:"absolute",top:12,right:12,fontFamily:T.mono,fontSize:9,letterSpacing:"0.1em",textTransform:"uppercase",background:T.ink,color:T.lime,padding:"2px 6px",borderRadius:4,fontWeight:600}}>{tool.lock}</span>}
              </div>
            ))}
          </div>
        </div>

        <div style={{background:T.card,border:`1px solid ${T.border}`,borderRadius:22,padding:22}}>
          <CardHead title="Study streak" label="LAST 91 DAYS" />
          <div style={{display:"flex",gap:14,alignItems:"flex-end",marginBottom:14}}>
            <div>
              <div style={{fontFamily:T.hand,fontSize:54,lineHeight:0.85,fontWeight:700,color:T.text}}>{realStreak}</div>
              <div style={{fontSize:11.5,color:T.muted,fontFamily:T.mono,letterSpacing:"0.06em",textTransform:"uppercase"}}>day streak</div>
            </div>
            <div style={{marginLeft:"auto",textAlign:"right"}}>
              <div style={{fontSize:11.5,color:T.muted,fontFamily:T.mono,letterSpacing:"0.06em",textTransform:"uppercase"}}>longest</div>
              <div style={{fontFamily:T.hand,fontSize:30,lineHeight:0.9,color:T.muted}}>31</div>
            </div>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(13,1fr)",gap:4}}>
            {seed.map((lvl,i)=>(
              <div key={i} style={{aspectRatio:"1",background:cellColor(lvl),borderRadius:4,boxShadow:i===seed.length-1?`0 0 0 1.5px ${T.ink}`:"none"}}/>
            ))}
          </div>
        </div>
      </div>

      {/* ROW 5: Upcoming + Quote + Decks rows split */}
      <div style={{display:"grid",gridTemplateColumns:"4fr 4fr 8fr",gap:16}}>
        {/* Upcoming */}
        <div style={{background:T.card,border:`1px solid ${T.border}`,borderRadius:22,padding:22}}>
          <CardHead title="Upcoming" label="NEXT 14 DAYS" more="Calendar" />
          {dl.map((d,i)=>(
            <div key={i} style={{display:"flex",alignItems:"center",gap:12,padding:"10px 0",borderBottom:i<dl.length-1?`1px solid ${T.border}`:"none"}}>
              <div style={{width:44,flex:"none",textAlign:"center",padding:"6px 0",background:d.urgent?T.lime:T.card2,borderRadius:8}}>
                <div style={{fontFamily:T.hand,fontSize:22,fontWeight:700,lineHeight:1,color:T.text}}>{d.d}</div>
                <div style={{fontFamily:T.mono,fontSize:9,letterSpacing:"0.1em",textTransform:"uppercase",color:T.muted}}>{d.mo}</div>
              </div>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontSize:13,fontWeight:600,color:T.text}}>{d.t}</div>
                <div style={{fontSize:11.5,color:T.muted}}>{d.sub}</div>
              </div>
              <span style={{fontFamily:T.mono,fontSize:11,padding:"3px 8px",background:d.urgent?T.butter:T.bg,borderRadius:6,color:T.text,border:d.urgent?"none":`1px solid ${T.border}`,fontWeight:d.urgent?600:400}}>{d.cd}</span>
            </div>
          ))}
        </div>

        {/* Pre-session quote */}
        <div style={{background:T.butter,borderRadius:22,padding:22,position:"relative",overflow:"hidden",border:"none"}}>
          <CardHead title="Pre-session" label="DAILY" />
          <span style={{fontFamily:T.serif,fontSize:140,lineHeight:0.7,color:"rgba(14,31,24,0.12)",position:"absolute",top:0,left:12,fontStyle:"italic"}}>"</span>
          <div style={{fontFamily:T.serif,fontStyle:"italic",fontSize:22,lineHeight:1.25,color:T.ink,margin:"14px 0 14px",position:"relative",zIndex:1}}>It is not that I'm so smart. It's just that I stay with problems longer.</div>
          <div style={{fontFamily:T.mono,fontSize:11,letterSpacing:"0.12em",textTransform:"uppercase",color:"rgba(14,31,24,0.55)"}}>— Albert Einstein</div>
        </div>

        {/* Pick up where you left off */}
        <div style={{background:T.card,border:`1px solid ${T.border}`,borderRadius:22,padding:22}}>
          <CardHead title="Pick up where you left off" label="FLASHCARDS · NOTES · ESSAYS" more="All library" />
          <div style={{display:"flex",gap:10,overflowX:"auto",padding:"0 4px 4px"}}>
            {decks.map((d,i)=>(
              <div key={i} style={{flex:"none",width:160,background:d.bg,border:`1px solid ${T.border}`,borderRadius:14,padding:14,cursor:"pointer"}}>
                <div style={{fontFamily:T.mono,fontSize:10,letterSpacing:"0.12em",textTransform:"uppercase",color:"rgba(14,31,24,0.55)"}}>{d.subj}</div>
                <h5 style={{fontSize:14,margin:"6px 0 12px",lineHeight:1.2,color:T.ink,minHeight:34,fontWeight:600}}>{d.title}</h5>
                <div style={{height:4,background:"rgba(14,31,24,0.10)",borderRadius:99,overflow:"hidden"}}><div style={{height:"100%",width:d.pct+"%",background:T.forest}}/></div>
                <div style={{display:"flex",justifyContent:"space-between",marginTop:6,fontSize:10.5,color:"rgba(14,31,24,0.6)",fontFamily:T.mono}}>
                  <span>{d.a}</span><span>{d.b}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ROW 6: Wrapped (full) */}
      <div style={{background:T.forest,color:T.cream,borderRadius:22,padding:22}}>
        <CardHead title="This week, you…" label="WRAPPED · DROPS SUNDAY" more="Share my Wrapped" light />
        <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:10,marginTop:14}}>
          {[
            {ln:"Focus hours",vn:"14h 22m",ch:"+3h 12m vs last wk"},
            {ln:"Cards mastered",vn:"142",ch:"+38 vs last wk"},
            {ln:"Words written",vn:"3,840",ch:"+1,200 vs last wk"},
          ].map((ins,i)=>(
            <div key={i} style={{background:"rgba(246,241,230,0.05)",borderRadius:12,padding:"12px 14px"}}>
              <div style={{fontSize:11,color:"rgba(246,241,230,0.55)",fontFamily:T.mono,letterSpacing:"0.06em",textTransform:"uppercase"}}>{ins.ln}</div>
              <div style={{fontFamily:T.hand,fontSize:32,lineHeight:1,fontWeight:600,color:T.lime,marginTop:4}}>{ins.vn}</div>
              <div style={{fontSize:11,color:T.lime,fontWeight:600,marginTop:2,opacity:0.85}}>{ins.ch}</div>
            </div>
          ))}
        </div>
        <div style={{display:"flex",gap:10,flexWrap:"wrap",marginTop:18}}>
          {[
            {m:"12",t:"12-day streak"},{m:"★",t:"Bio top 1%"},{m:"W",t:"1st place · Bio Cram Squad"},
            {m:"⚡",t:"Early bird (4 AM sessions)"},
            {m:"30",t:"30-day streak · 18 to go",locked:true},{m:"∞",t:"Cram master · 20h / wk",locked:true},
          ].map((a,i)=>(
            <div key={i} style={{display:"flex",alignItems:"center",gap:8,padding:"8px 12px",background:a.locked?"rgba(246,241,230,0.04)":"rgba(246,241,230,0.06)",border:`1px solid rgba(246,241,230,${a.locked?0.06:0.12})`,borderRadius:99,fontSize:12,fontWeight:500,opacity:a.locked?0.5:1,color:T.cream}}>
              <span style={{width:22,height:22,borderRadius:"50%",background:a.locked?"rgba(246,241,230,0.1)":T.lime,display:"grid",placeItems:"center",fontFamily:T.hand,fontWeight:700,fontSize:13,color:T.ink,flex:"none"}}>{a.m}</span>
              {a.t}
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}

// ─── AUTH SCREEN — minimal gate, links to designed pages ────────────────────
function AuthScreen(){
  return(
    <div style={{minHeight:"100vh",background:"#0D120F",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:20}}>
      <div style={{display:"flex",alignItems:"center",gap:10}}>
        <div style={{width:36,height:36,borderRadius:10,background:"#AECE5E",display:"grid",placeItems:"center",fontSize:18,fontWeight:800,color:"#0D120F"}}>S</div>
        <span style={{fontSize:22,fontWeight:700,color:"#E8EFE7"}}>Studlin</span>
      </div>
      <p style={{fontSize:15,color:"rgba(232,239,231,0.6)",margin:0}}>Sign in to access your workspace.</p>
      <div style={{display:"flex",gap:12,marginTop:8}}>
        <a href="Studlin Sign In.html" style={{padding:"12px 28px",borderRadius:10,background:"#AECE5E",color:"#0D120F",fontSize:14,fontWeight:600,textDecoration:"none"}}>Sign in</a>
        <a href="Studlin Onboarding.html" style={{padding:"12px 28px",borderRadius:10,border:"1px solid rgba(174,206,94,0.3)",background:"transparent",color:"#AECE5E",fontSize:14,fontWeight:600,textDecoration:"none"}}>Create account</a>
      </div>
    </div>
  );
}


// ─── AUTH GATE ────────────────────────────────────────────────────────────────
function AuthGate(){
  const [user,setUser]=useState(undefined);
  useEffect(()=>{return firebase.auth().onAuthStateChanged(u=>{setUser(u||null);if(u)fetchUserProfile();});},[]);
  if(user===undefined)return(<div style={{minHeight:"100vh",background:"#0D120F",display:"grid",placeItems:"center"}}><div style={{display:"flex",alignItems:"center",gap:10}}><div style={{width:36,height:36,borderRadius:10,background:"#AECE5E",display:"grid",placeItems:"center",fontSize:18,fontWeight:800,color:"#0D120F"}}>S</div><span style={{fontSize:22,fontWeight:700,color:"#E8EFE7"}}>Studlin</span></div></div>);
  if(!user)return <AuthScreen />;
  return <App />;
}

// ─── APP SHELL ────────────────────────────────────────────────────────────────
function App() {
  seedEventsIfStale();
  const [active,setActive]=useState("dashboard");
  const [theme,setThemeState]=useState(()=>(typeof localStorage!=="undefined" && localStorage.getItem("studlin-theme"))||"dark");
  const [accent,setAccentState]=useState(()=>{
    if(typeof localStorage!=="undefined"){
      if(!localStorage.getItem("studlin-accent-reset3")){localStorage.setItem("studlin-accent","Lime");localStorage.setItem("studlin-accent-reset3","1");}
      return localStorage.getItem("studlin-accent")||"Lime";
    }
    return "Lime";
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
  const [newUnlock,setNewUnlock]=useState(null);
  useEffect(function(){var u=checkNewUnlocks();if(u.length>0)setNewUnlock(u[0]);},[]);
  window._setTimerTask=setTimerTask;
  const [creditsOpen,setCreditsOpen]=useState(false);
  const [pricingOpen,setPricingOpen]=useState(false);
  const [notifOpen,setNotifOpen]=useState(false);
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
    const cardEl=el.create("card",{style:{base:{fontSize:"15px",fontFamily:"'Geist',sans-serif",color:"#E8EFE7","::placeholder":{color:"rgba(255,255,255,0.35)"}},invalid:{color:"#D9806B"}}});
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
    const id=setInterval(()=>setFocusSecs(s=>s>0?s-1:0),1000);
    return ()=>clearInterval(id);
  },[focusRunning]);
  useEffect(()=>{ touchStreak(); },[]);
  useEffect(()=>{
    if(focusSecs===0&&focusRunning){
      setFocusRunning(false);
      if(focusMode==="Focus"){ logSession(Math.max(1,Math.round(focusTotal/60)),"Focus"); }
      setFocusSecs(focusTotal);
    }
  },[focusSecs,focusRunning,focusMode,focusTotal]);
  const fm=String(Math.floor(focusSecs/60)).padStart(2,"0"), fs=String(focusSecs%60).padStart(2,"0");
  const navSections=[
    {label:"Workspace",items:[
      {id:"dashboard",label:"Dashboard"},
      {id:"aichat",label:"Chat"},
      {id:"essays",label:"Essays",badge:"3"},
      {id:"flashcards",label:"Flashcards"},
      {id:"notes",label:"Notes"},
      {id:"focustimer",label:"Focus timer"},
      {id:"calendar",label:"Calendar"},
      {id:"collection",label:"Collection"},
    ]},
    {label:"Tools",items:[
      {id:"aitutor",label:"Tutor"},
      {id:"grammar",label:"Grammar & Polish"},
      {id:"humanizer",label:"Rewrite"},
    ]},

  ];
  const bottomItems=[{id:"settings",label:"Settings"},{id:"profile",label:"Profile"}];
  const pages={aichat:AiChat,essays:Essays,flashcards:Flashcards,notes:Notes,calendar:CalendarTab,collection:Collection,aitutor:AiTutor,grammar:GrammarPolish,humanizer:AiHumanizer,profile:Profile};
  const labelOf={dashboard:"Dashboard",aichat:"AI Chat",essays:"Essays",flashcards:"Flashcards",notes:"Notes",focustimer:"Focus Timer",calendar:"Calendar",aitutor:"AI Tutor",grammar:"Grammar & Polish",humanizer:"Rewrite",settings:"Settings",profile:"Profile"};
  const sectionOf={dashboard:"Workspace",aichat:"Workspace",essays:"Workspace",flashcards:"Workspace",notes:"Workspace",focustimer:"Workspace",calendar:"Workspace",aitutor:"Tools",grammar:"Tools",humanizer:"Tools",settings:"Account",profile:"Account"};
  const ActivePage=pages[active];
  const isLight=T.mode==="light";
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
      <div style={{width:230,flexShrink:0,background:isLight?T.surface:"linear-gradient(180deg, #16201B 0%, #11181400 60%)",backgroundColor:isLight?T.surface:T.surface,display:"flex",flexDirection:"column",padding:"20px 12px",borderRight:`1px solid ${isLight?"transparent":T.border}`,overflowY:"auto"}}>
        <div style={{display:"flex",alignItems:"center",gap:10,padding:"0 6px",marginBottom:20}}>
          <div style={{width:28,height:28,background:T.lime,borderRadius:7,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:800,color:T.ink,letterSpacing:"-0.02em",fontFamily:T.font,fontSize:13}}>S</div>
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
            <span style={{fontFamily:T.mono,fontSize:9,letterSpacing:"0.14em",fontWeight:600,color:"rgba(14,31,24,0.65)"}}>AI CREDITS</span>
            <span style={{fontFamily:T.mono,fontSize:9,letterSpacing:"0.14em",fontWeight:700,background:T.ink,color:T.lime,padding:"2px 6px",borderRadius:4}}>PRO</span>
          </div>
          <div style={{fontFamily:T.hand,fontSize:36,fontWeight:700,color:T.ink,lineHeight:0.85,marginTop:6}}>{getCredits()}<span style={{fontFamily:T.font,fontSize:13,fontWeight:500,color:"rgba(14,31,24,0.5)",marginLeft:2}}>/ {getCreditLimit()}</span></div>
          <div style={{fontSize:10.5,color:"rgba(14,31,24,0.6)",marginTop:2,position:"relative"}}>Resets in 12 days</div>
          <div style={{height:4,background:"rgba(14,31,24,0.15)",borderRadius:99,marginTop:10,overflow:"hidden"}}><div style={{height:"100%",width:Math.min(100,Math.round(getCredits()/getCreditLimit()*100))+"%",background:T.ink,borderRadius:99}} /></div>
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
          <div onClick={()=>setActive("focustimer")} title={focusRunning?"Focus active · click to manage":"Focus paused · click to resume"} style={{display:"inline-flex",alignItems:"center",gap:8,padding:"7px 13px",background:isLight?T.ink:T.card,color:isLight?T.cream:T.text,border:`1px solid ${T.border}`,borderRadius:99,fontSize:12.5,fontWeight:500,flexShrink:0,cursor:"pointer"}}>
            <span style={{width:6,height:6,borderRadius:"50%",background:focusRunning?T.lime:T.muted,boxShadow:focusRunning?`0 0 8px ${T.lime}`:"none",animation:focusRunning?"studlinPulse 1.6s infinite":"none"}} />
            {focusRunning?"Focus active · ":"Focus paused · "}<span style={{fontFamily:T.mono,fontVariantNumeric:"tabular-nums"}}>{fm}:{fs}</span>
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
          {active==="dashboard"?<Dashboard setActive={setActive} focusSecs={focusSecs} focusRunning={focusRunning} setFocusRunning={setFocusRunning} />:
           active==="settings"?<SettingsTab theme={theme} setTheme={setTheme} accent={accent} setAccent={setAccent} density={density} setDensity={setDensity} />:
           active==="focustimer"?<FocusTimer focusSecs={focusSecs} setFocusSecs={setFocusSecs} focusRunning={focusRunning} setFocusRunning={setFocusRunning} focusMode={focusMode} setFocusMode={setFocusMode} focusTotal={focusTotal} setFocusTotal={setFocusTotal} />:
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
                <div style={{fontFamily:T.mono,fontSize:10,letterSpacing:"0.14em",fontWeight:600,color:"rgba(14,31,24,0.6)"}}>YOU'RE BUYING</div>
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
                  <div style={{fontFamily:T.mono,fontSize:10,letterSpacing:"0.14em",fontWeight:600,color:"rgba(14,31,24,0.6)"}}>CURRENT BALANCE</div>
                  <div style={{fontFamily:T.hand,fontSize:54,fontWeight:700,color:T.ink,lineHeight:0.9,marginTop:4}}>{getCredits()}<span style={{fontFamily:T.font,fontSize:18,fontWeight:500,color:"rgba(14,31,24,0.55)",marginLeft:4}}>/ {getCreditLimit()}</span></div>
                  <div style={{fontSize:12,color:"rgba(14,31,24,0.65)",marginTop:4}}>Resets in 12 days · {getCreditLimit()-getCredits()} used this cycle</div>
                </div>
                <span style={{fontFamily:T.mono,fontSize:10,letterSpacing:"0.16em",fontWeight:700,background:T.ink,color:T.lime,padding:"4px 8px",borderRadius:5}}>PRO</span>
              </div>
              <div style={{height:5,background:"rgba(14,31,24,0.15)",borderRadius:99,marginTop:14,overflow:"hidden",position:"relative"}}><div style={{height:"100%",width:Math.min(100,Math.round(getCredits()/getCreditLimit()*100))+"%",background:T.ink,borderRadius:99}} /></div>
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
        setTimeout(()=>{const u=checkNewUnlocks();if(u.length>0)setNewUnlock(u[0]);},500);
      }} />}

      {newUnlock&&(
        <div onClick={()=>setNewUnlock(null)} style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.8)",backdropFilter:"blur(12px)",zIndex:1100,display:"flex",alignItems:"center",justifyContent:"center",padding:24,animation:"studlinFade 0.3s ease"}}>
          <div onClick={e=>e.stopPropagation()} style={{width:"100%",maxWidth:400,background:T.card,borderRadius:24,border:"2px solid "+T.lime,padding:"48px 36px",textAlign:"center",animation:"studlinPop 0.5s cubic-bezier(.2,.85,.3,1)"}}>
            <div style={{fontSize:12,fontWeight:700,letterSpacing:"0.12em",color:T.lime,textTransform:"uppercase",marginBottom:16}}>Character unlocked</div>
            <div style={{fontSize:80,marginBottom:16}}>{newUnlock.emoji}</div>
            <h2 style={{fontSize:28,fontWeight:700,color:T.white,margin:"0 0 6px"}}>{newUnlock.name}</h2>
            <div style={{fontSize:11,fontWeight:600,letterSpacing:"0.08em",color:T.lime,textTransform:"uppercase",marginBottom:16}}>{newUnlock.type==="streak"?newUnlock.threshold+"-day streak":"Level "+newUnlock.threshold}</div>
            <p style={{fontSize:15,color:T.muted,lineHeight:1.6,fontStyle:"italic",margin:"0 0 28px"}}>"{newUnlock.desc}"</p>
            <div style={{display:"flex",gap:10,justifyContent:"center"}}>
              <Btn onClick={()=>{setNewUnlock(null);setActive("collection");}}>View collection</Btn>
              <Btn variant="ghost" onClick={()=>setNewUnlock(null)}>Nice</Btn>
            </div>
          </div>
        </div>
      )}

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
      `}</style>
    </div>
  );
}


// Mount
ReactDOM.createRoot(document.getElementById('root')).render(<AuthGate />);
