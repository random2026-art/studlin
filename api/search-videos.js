const VIDEOS = [
  {id:"QnQe0xW_JY4",title:"Biology: Cell Structure",channel:"Nucleus Biology",duration:622,views:4200000,tags:"biology cell structure organelle membrane"},
  {id:"GcjgWov7mTM",title:"Photosynthesis — Light Reactions & Calvin Cycle",channel:"Bozeman Science",duration:723,views:3100000,tags:"biology photosynthesis light reactions calvin cycle plant"},
  {id:"fR3NxCR9z2U",title:"What is Natural Selection?",channel:"Stated Clearly",duration:573,views:5600000,tags:"biology evolution natural selection darwin"},
  {id:"_qgSz1UmcBM",title:"Mitosis vs Meiosis — Side by Side",channel:"Amoeba Sisters",duration:495,views:7800000,tags:"biology mitosis meiosis cell division"},
  {id:"0Bt6RPP2ANI",title:"DNA Structure and Replication",channel:"Amoeba Sisters",duration:478,views:6200000,tags:"biology dna replication double helix nucleotide"},
  {id:"CpY4o8OHMhM",title:"The Krebs Cycle Made Simple",channel:"Ninja Nerd",duration:1117,views:2400000,tags:"biology krebs cycle citric acid cellular respiration"},
  {id:"WUvTyaaNkzM",title:"The Essence of Calculus",channel:"3Blue1Brown",duration:1024,views:12000000,tags:"calculus math derivatives limits introduction"},
  {id:"riXcZT2ICjA",title:"The Paradox of the Derivative",channel:"3Blue1Brown",duration:1077,views:7400000,tags:"calculus math derivative differentiation"},
  {id:"rfG8ce4nNh0",title:"Integration and the Fundamental Theorem",channel:"3Blue1Brown",duration:1246,views:5200000,tags:"calculus math integration integral fundamental theorem"},
  {id:"kfF40MiS7zA",title:"Chain Rule — Calculus Made Easy",channel:"Professor Leonard",duration:852,views:2100000,tags:"calculus chain rule differentiation composite function"},
  {id:"HfACrKJ_Y2w",title:"Limits — Intuitive Introduction",channel:"The Organic Chemistry Tutor",duration:735,views:4300000,tags:"calculus limits approaching continuity"},
  {id:"ObHJJYvu3RE",title:"L'Hôpital's Rule with Examples",channel:"PatrickJMT",duration:405,views:3800000,tags:"calculus lhopital rule limits indeterminate form"},
  {id:"pXSSKBNDnRY",title:"How to Write the Perfect Essay",channel:"TED-Ed",duration:276,views:8900000,tags:"english essay writing thesis paragraph structure"},
  {id:"OV5J6BfToSw",title:"Essay Structure — Introduction Body Conclusion",channel:"First Rate Tutors",duration:614,views:3200000,tags:"english essay structure writing academic"},
  {id:"MSYw502dJNY",title:"Literary Devices You Need to Know",channel:"GCFGlobal",duration:582,views:2700000,tags:"english literary devices metaphor simile imagery"},
  {id:"3jVcp4mN7JE",title:"How to Write a Thesis Statement",channel:"Scribbr",duration:317,views:4100000,tags:"english thesis statement essay writing argument"},
  {id:"GlhJ61mhTnc",title:"Shakespeare's Macbeth — Full Summary",channel:"SparkNotes",duration:531,views:5600000,tags:"english macbeth shakespeare tragedy summary"},
  {id:"HeZ4hVsmTtc",title:"How to Analyze Literature Like a Pro",channel:"Course Hero",duration:279,views:1800000,tags:"english literature analysis reading comprehension"},
  {id:"FSyAehMdpyI",title:"Introduction to Chemistry — Basic Concepts",channel:"The Organic Chemistry Tutor",duration:1116,views:9200000,tags:"chemistry introduction atoms molecules basics"},
  {id:"Rd4a1X3B61w",title:"How to Balance Chemical Equations",channel:"Tyler DeWitt",duration:652,views:6100000,tags:"chemistry balancing equations reactions stoichiometry"},
  {id:"cWn1szJVseE",title:"Stoichiometry — Mole Ratios Made Easy",channel:"CrashCourse",duration:766,views:4500000,tags:"chemistry stoichiometry moles ratios calculations"},
  {id:"pBZ-RiT5nEE",title:"Acids and Bases — pH Scale Explained",channel:"Bozeman Science",duration:555,views:3300000,tags:"chemistry acids bases ph scale solution"},
  {id:"X9ypXXT3KJc",title:"Periodic Table Trends Explained",channel:"Professor Dave Explains",duration:500,views:4800000,tags:"chemistry periodic table trends electronegativity ionization"},
  {id:"QXT4OVM4vXI",title:"Intro to Organic Chemistry",channel:"The Organic Chemistry Tutor",duration:1330,views:7200000,tags:"chemistry organic carbon bonds functional groups"},
  {id:"xuCn8ux2gbs",title:"World War I — Summary on a Map",channel:"Geo History",duration:1094,views:18000000,tags:"history world war 1 wwi europe trench warfare"},
  {id:"DwKPFT-RioU",title:"World War II — Every Day Animated",channel:"Emperor Tigerstar",duration:993,views:24000000,tags:"history world war 2 wwii pacific europe"},
  {id:"Yocja_N5s1I",title:"The Cold War — Full Summary",channel:"CrashCourse",duration:735,views:11000000,tags:"history cold war usa soviet union communism capitalism"},
  {id:"wHVQbi3vVKA",title:"The French Revolution — In a Nutshell",channel:"Kurzgesagt",duration:582,views:8200000,tags:"history french revolution france napoleon bastille"},
  {id:"UpkGaSo3cYE",title:"Rise and Fall of the Roman Empire",channel:"Kings and Generals",duration:1218,views:6700000,tags:"history roman empire rome ancient caesar"},
  {id:"3PYdMC8VDiA",title:"The Civil Rights Movement — Key Events",channel:"CrashCourse",duration:824,views:4100000,tags:"history civil rights movement mlk rosa parks segregation"},
  {id:"DAp_v7EH9AA",title:"100 Essential Spanish Phrases for Beginners",channel:"SpanishPod101",duration:1505,views:9800000,tags:"spanish phrases beginner conversation vocabulary"},
  {id:"2VaM3Bl0OkA",title:"Ser vs Estar — Learn the Difference",channel:"Butterfly Spanish",duration:692,views:5400000,tags:"spanish ser estar verbs grammar conjugation"},
  {id:"PZHprCR1XzA",title:"Spanish Verb Conjugation — Present Tense",channel:"Butterfly Spanish",duration:798,views:3700000,tags:"spanish verb conjugation present tense grammar"},
  {id:"4jGwlagStec",title:"Preterite vs Imperfect — When to Use Each",channel:"SpanishPod101",duration:590,views:2900000,tags:"spanish preterite imperfect past tense grammar"},
  {id:"s2Qz_KJ38As",title:"Subjunctive in Spanish — Made Simple",channel:"Butterfly Spanish",duration:764,views:2100000,tags:"spanish subjunctive mood grammar advanced"},
  {id:"G6UPknLkYHo",title:"Spanish Listening Practice for Beginners",channel:"Real Fast Spanish",duration:1320,views:3600000,tags:"spanish listening comprehension practice conversation"},
  {id:"HEfHFsfGXjs",title:"Algebra — Solving Linear Equations",channel:"The Organic Chemistry Tutor",duration:908,views:8300000,tags:"math algebra linear equations solving variables"},
  {id:"NybHckSEQBI",title:"The Pythagorean Theorem — Explained",channel:"Math Antics",duration:510,views:11000000,tags:"math geometry pythagorean theorem triangles"},
  {id:"WqJ3cVAeENY",title:"Fractions — Addition Subtraction Multiplication",channel:"Math Antics",duration:622,views:7500000,tags:"math fractions arithmetic addition multiplication"},
  {id:"dQw4w9WgXcQ",title:"Probability Explained — From Basics to Bayes",channel:"Veritasium",duration:574,views:5600000,tags:"math probability statistics bayes theorem"},
  {id:"GmL3Y2GFN3k",title:"Trigonometry — Sin Cos Tan Explained",channel:"The Organic Chemistry Tutor",duration:1184,views:6900000,tags:"math trigonometry sin cos tan angles"},
  {id:"JnTa9XtvmfI",title:"Quadratic Formula — Easy Explanation",channel:"Mario's Math Tutoring",duration:387,views:4200000,tags:"math algebra quadratic formula equation roots"},
  {id:"ewjkJEEz03w",title:"Physics — Newton's Laws of Motion",channel:"Professor Dave Explains",duration:673,views:3800000,tags:"physics newton laws motion force acceleration"},
  {id:"AEIn3T6nDAo",title:"Electricity — Voltage Current Resistance",channel:"The Engineering Mindset",duration:842,views:5200000,tags:"physics electricity voltage current resistance ohm"},
  {id:"p_o4aY7xkXg",title:"Quantum Physics for Beginners",channel:"Domain of Science",duration:924,views:7100000,tags:"physics quantum mechanics particles wave"},
  {id:"kKKM8Y-u7ds",title:"Thermodynamics — Laws and Concepts",channel:"CrashCourse",duration:656,views:4400000,tags:"physics thermodynamics energy heat entropy laws"},
  {id:"_bJeKUosqoY",title:"Computer Science — Binary Explained",channel:"CS Dojo",duration:485,views:3200000,tags:"computer science cs binary numbers programming coding"},
  {id:"zOjov-2OZ0E",title:"How the Internet Works in 5 Minutes",channel:"Aaron",duration:305,views:8900000,tags:"computer science internet networking web protocol"},
  {id:"rfscVS0vtbw",title:"Python Tutorial for Beginners — Full Course",channel:"freeCodeCamp",duration:16080,views:42000000,tags:"computer science python programming coding beginner tutorial"},
  {id:"PkZNo7MFNFg",title:"JavaScript Full Course for Beginners",channel:"Bro Code",duration:28800,views:18000000,tags:"computer science javascript programming coding web development"},
  {id:"68BjP5f0ccE",title:"AP Psychology — Full Review",channel:"Heimler's History",duration:1845,views:2800000,tags:"psychology ap review brain behavior mental"},
  {id:"vo4pMVb0R6M",title:"Economics — Supply and Demand Explained",channel:"Jacob Clifford",duration:472,views:5300000,tags:"economics supply demand market price microeconomics"},
  {id:"wLGHRzXTjFc",title:"Macroeconomics — GDP and Economic Growth",channel:"Jacob Clifford",duration:538,views:3100000,tags:"economics macro gdp growth inflation unemployment"},
];

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const q = (req.query.q || '').toLowerCase().trim();
  if (!q) return res.status(400).json({ error: 'Missing ?q= parameter' });

  const words = q.split(/\s+/).filter(Boolean);

  const shuffle = req.query.shuffle === '1';

  const scored = VIDEOS.map(v => {
    const haystack = (v.title + ' ' + v.channel + ' ' + v.tags).toLowerCase();
    let score = 0;
    for (const w of words) {
      if (haystack.includes(w)) score += 10;
      if (v.title.toLowerCase().includes(w)) score += 5;
      if (v.tags.includes(w)) score += 3;
    }
    if (score > 0) score += Math.log10(v.views || 1);
    if (shuffle) score += Math.random() * 15;
    return { ...v, score };
  }).filter(v => v.score > 0).sort((a, b) => b.score - a.score).slice(0, 12);

  const videos = scored.map(v => ({
    id: v.id,
    title: v.title,
    channel: v.channel,
    thumbnail: 'https://img.youtube.com/vi/' + v.id + '/mqdefault.jpg',
    duration: v.duration,
    views: v.views,
  }));

  return res.status(200).json({ videos });
};
