const VIDEOS = [
  // Biology
  {id:"QnQe0xW_JY4",title:"Biology: Cell Structure",channel:"Nucleus Biology",duration:622,views:4200000,tags:"biology cell structure organelle membrane"},
  {id:"GcjgWov7mTM",title:"Photosynthesis — Light Reactions & Calvin Cycle",channel:"Bozeman Science",duration:723,views:3100000,tags:"biology photosynthesis light reactions calvin cycle plant"},
  {id:"fR3NxCR9z2U",title:"What is Natural Selection?",channel:"Stated Clearly",duration:573,views:5600000,tags:"biology evolution natural selection darwin"},
  {id:"_qgSz1UmcBM",title:"Mitosis vs Meiosis — Side by Side",channel:"Amoeba Sisters",duration:495,views:7800000,tags:"biology mitosis meiosis cell division"},
  {id:"0Bt6RPP2ANI",title:"DNA Structure and Replication",channel:"Amoeba Sisters",duration:478,views:6200000,tags:"biology dna replication double helix nucleotide"},
  {id:"8m6hHRlKwxY",title:"Human Body Systems Overview",channel:"Amoeba Sisters",duration:680,views:5100000,tags:"biology human body systems organs anatomy"},
  // Calculus
  {id:"WUvTyaaNkzM",title:"The Essence of Calculus",channel:"3Blue1Brown",duration:1024,views:12000000,tags:"calculus math derivatives limits introduction"},
  {id:"riXcZT2ICjA",title:"The Paradox of the Derivative",channel:"3Blue1Brown",duration:1077,views:7400000,tags:"calculus math derivative differentiation"},
  {id:"rfG8ce4nNh0",title:"Integration and the Fundamental Theorem",channel:"3Blue1Brown",duration:1246,views:5200000,tags:"calculus math integration integral fundamental theorem"},
  {id:"TdLD2Zh-nUQ",title:"Limits — Intuitive Introduction",channel:"The Organic Chemistry Tutor",duration:735,views:4300000,tags:"calculus limits approaching continuity math"},
  {id:"HfACrKJ_Y2w",title:"Chain Rule for Derivatives",channel:"The Organic Chemistry Tutor",duration:852,views:2100000,tags:"calculus chain rule differentiation composite function math"},
  {id:"ObHJJYvu3RE",title:"L'Hôpital's Rule with Examples",channel:"PatrickJMT",duration:405,views:3800000,tags:"calculus lhopital rule limits indeterminate form math"},
  // English
  {id:"OV5J6BfToSw",title:"Essay Structure — Introduction Body Conclusion",channel:"First Rate Tutors",duration:614,views:3200000,tags:"english essay structure writing academic"},
  {id:"MSYw502dJNY",title:"Literary Devices You Need to Know",channel:"GCFGlobal",duration:582,views:2700000,tags:"english literary devices metaphor simile imagery"},
  {id:"hFAOXdXZ5TM",title:"How to Write an Argumentative Essay",channel:"Scribbr",duration:420,views:4100000,tags:"english thesis statement essay writing argument"},
  {id:"SzjdcPbjaR4",title:"Shakespeare — Understanding the Language",channel:"TED-Ed",duration:290,views:3500000,tags:"english shakespeare literature analysis language"},
  {id:"URUJD5NEXC8",title:"Parts of Speech — Grammar Basics",channel:"English Lessons with Adam",duration:650,views:6300000,tags:"english grammar parts speech noun verb adjective"},
  {id:"O-6f5wQXSu8",title:"How to Analyze Poetry",channel:"TED-Ed",duration:310,views:2900000,tags:"english poetry analysis literature reading comprehension"},
  // Chemistry
  {id:"FSyAehMdpyI",title:"Introduction to Chemistry — Basic Concepts",channel:"The Organic Chemistry Tutor",duration:1116,views:9200000,tags:"chemistry introduction atoms molecules basics"},
  {id:"Rd4a1X3B61w",title:"How to Balance Chemical Equations",channel:"Tyler DeWitt",duration:652,views:6100000,tags:"chemistry balancing equations reactions stoichiometry"},
  {id:"qPQQwqGWktE",title:"Stoichiometry — Mole Ratios Made Easy",channel:"CrashCourse Chemistry",duration:766,views:4500000,tags:"chemistry stoichiometry moles ratios calculations"},
  {id:"pBZ-RiT5nEE",title:"Acids and Bases — pH Scale Explained",channel:"Bozeman Science",duration:555,views:3300000,tags:"chemistry acids bases ph scale solution"},
  {id:"ak06MSETeo4",title:"Periodic Table — Understanding Trends",channel:"Tyler DeWitt",duration:480,views:4800000,tags:"chemistry periodic table trends electronegativity ionization"},
  {id:"QXT4OVM4vXI",title:"Intro to Organic Chemistry",channel:"The Organic Chemistry Tutor",duration:1330,views:7200000,tags:"chemistry organic carbon bonds functional groups"},
  // History
  {id:"xuCn8ux2gbs",title:"World War I — Summary on a Map",channel:"Geo History",duration:1094,views:18000000,tags:"history world war 1 wwi europe trench warfare"},
  {id:"DwKPFT-RioU",title:"World War II — Every Day Animated",channel:"Emperor Tigerstar",duration:993,views:24000000,tags:"history world war 2 wwii pacific europe"},
  {id:"Yocja_N5s1I",title:"The Cold War — Full Summary",channel:"CrashCourse",duration:735,views:11000000,tags:"history cold war usa soviet union communism capitalism"},
  {id:"GVsUOuSjvcg",title:"The French Revolution — Explained",channel:"Oversimplified",duration:1020,views:42000000,tags:"history french revolution france napoleon bastille"},
  {id:"TitrRpMUt0I",title:"The Roman Empire — Rise and Fall",channel:"Kings and Generals",duration:1218,views:6700000,tags:"history roman empire rome ancient caesar"},
  {id:"cSohjlYQI2A",title:"American Civil War — Overview",channel:"Oversimplified",duration:960,views:35000000,tags:"history civil war america north south slavery lincoln"},
  // Spanish
  {id:"DAp_v7EH9AA",title:"100 Essential Spanish Phrases for Beginners",channel:"SpanishPod101",duration:1505,views:9800000,tags:"spanish phrases beginner conversation vocabulary"},
  {id:"hJbRpHZr_d0",title:"Spanish for Beginners — Full Lesson",channel:"SpanishPod101",duration:1800,views:5400000,tags:"spanish beginner lesson grammar vocabulary intro"},
  {id:"R13BD8qKeTg",title:"Common Spanish Mistakes to Avoid",channel:"SpanishPod101",duration:590,views:2900000,tags:"spanish mistakes grammar conjugation tips"},
  {id:"sXPXpJ5vMnU",title:"Spanish Listening Practice — Slow and Clear",channel:"SpanishPod101",duration:1320,views:3600000,tags:"spanish listening comprehension practice conversation"},
  {id:"sRTKSzAOBr4",title:"How to Roll Your R's in Spanish",channel:"SpanishPod101",duration:340,views:4100000,tags:"spanish pronunciation rolling r speaking"},
  {id:"H0K2dvB-7WY",title:"50 Spanish Verbs You Need to Know",channel:"SpanishPod101",duration:870,views:3200000,tags:"spanish verbs conjugation present past grammar"},
  // Math
  {id:"HEfHFsfGXjs",title:"Algebra — Solving Linear Equations",channel:"The Organic Chemistry Tutor",duration:908,views:8300000,tags:"math algebra linear equations solving variables"},
  {id:"NybHckSEQBI",title:"The Pythagorean Theorem — Explained",channel:"Math Antics",duration:510,views:11000000,tags:"math geometry pythagorean theorem triangles"},
  {id:"KZnGSVwIhvU",title:"Probability — From Basics to Bayes",channel:"Veritasium",duration:574,views:5600000,tags:"math probability statistics bayes theorem"},
  {id:"JnTa9XtvmfI",title:"Quadratic Formula — Easy Explanation",channel:"Mario's Math Tutoring",duration:387,views:4200000,tags:"math algebra quadratic formula equation roots"},
  {id:"E-d9mgo8FGk",title:"Fractions Made Easy",channel:"Math Antics",duration:520,views:7500000,tags:"math fractions arithmetic addition multiplication division"},
  {id:"z_KmNZNT5xw",title:"Trigonometry — SOH CAH TOA",channel:"The Organic Chemistry Tutor",duration:1184,views:6900000,tags:"math trigonometry sin cos tan angles sohcahtoa"},
  // Physics
  {id:"PHe0bXAIuk0",title:"Newton's Laws of Motion",channel:"Professor Dave Explains",duration:673,views:3800000,tags:"physics newton laws motion force acceleration"},
  {id:"AEIn3T6nDAo",title:"Electricity — Voltage Current Resistance",channel:"The Engineering Mindset",duration:842,views:5200000,tags:"physics electricity voltage current resistance ohm circuit"},
  {id:"UPA3bwVVzGI",title:"Quantum Physics for Beginners",channel:"Domain of Science",duration:924,views:7100000,tags:"physics quantum mechanics particles wave function"},
  {id:"jS4aFq5-91M",title:"Thermodynamics — Laws Explained",channel:"CrashCourse",duration:656,views:4400000,tags:"physics thermodynamics energy heat entropy laws"},
  {id:"ZfKMq-rYtnc",title:"Gravity — How Does it Work?",channel:"Veritasium",duration:580,views:8200000,tags:"physics gravity mass acceleration earth newton"},
  {id:"HXNhEYqFo0o",title:"Special Relativity — Einstein Simplified",channel:"Fermilab",duration:720,views:3100000,tags:"physics relativity einstein speed light spacetime"},
  // Computer Science
  {id:"rfscVS0vtbw",title:"Python Tutorial for Beginners",channel:"freeCodeCamp",duration:16080,views:42000000,tags:"computer science python programming coding beginner tutorial"},
  {id:"PkZNo7MFNFg",title:"JavaScript Full Course for Beginners",channel:"Bro Code",duration:28800,views:18000000,tags:"computer science javascript programming coding web development"},
  {id:"1SMmc9gQmHQ",title:"What is an Algorithm?",channel:"TED-Ed",duration:300,views:5200000,tags:"computer science algorithm programming logic problem solving"},
  {id:"hT_nvWreIhg",title:"How Computers Work — Binary",channel:"CS Dojo",duration:485,views:3200000,tags:"computer science binary numbers data bits bytes"},
  // Economics / Psychology
  {id:"68BjP5f0ccE",title:"AP Psychology — Full Review",channel:"Heimler's History",duration:1845,views:2800000,tags:"psychology ap review brain behavior mental health"},
  {id:"vo4pMVb0R6M",title:"Economics — Supply and Demand",channel:"Jacob Clifford",duration:472,views:5300000,tags:"economics supply demand market price microeconomics"},
  {id:"BKorP55Aqvg",title:"GDP and Economic Growth Explained",channel:"Jacob Clifford",duration:538,views:3100000,tags:"economics macro gdp growth inflation unemployment"},
  {id:"2tM1LFFxeKg",title:"Microeconomics vs Macroeconomics",channel:"Jacob Clifford",duration:420,views:2800000,tags:"economics micro macro differences overview introduction"},
];

const { setCors, verifyAuth } = require('./_lib/auth');
const { withSentry } = require('./_lib/sentry');

module.exports = withSentry(async (req, res) => {
  setCors(req, res);
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  if (req.method === 'OPTIONS') return res.status(200).end();

  // POST /api/search-videos — fetch YouTube video info via oEmbed (replaces youtube-info endpoint)
  if (req.method === 'POST') {
    const user = await verifyAuth(req);
    if (!user) return res.status(401).json({ error: 'Sign in required.' });
    try {
      const { url } = req.body;
      if (!url) return res.status(400).json({ error: 'URL is required.' });
      const oembed = await fetch('https://www.youtube.com/oembed?url=' + encodeURIComponent(url) + '&format=json');
      if (!oembed.ok) return res.status(400).json({ error: 'Could not fetch video info. Check the URL.' });
      const data = await oembed.json();
      return res.status(200).json({ title: data.title || '', author: data.author_name || '' });
    } catch (err) {
      return res.status(500).json({ error: 'Failed to fetch video info.' });
    }
  }

  const user = await verifyAuth(req);
  if (!user) return res.status(401).json({ error: 'Sign in required.' });

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
});
