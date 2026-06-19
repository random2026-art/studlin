'use client'

import { useEffect } from 'react'
import './landing.css'

export default function Home() {
  useEffect(() => {
    // nav scroll state
    const nav = document.getElementById('nav')
    const onNavScroll = () => {
      if (nav) nav.classList.toggle('scrolled', window.scrollY > 20)
    }
    window.addEventListener('scroll', onNavScroll, { passive: true })

    // reveal on scroll
    const io = new IntersectionObserver(
      (es) => {
        es.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add('in')
            io.unobserve(e.target)
          }
        })
      },
      { threshold: 0.12 }
    )
    document.querySelectorAll('.landing-page .reveal').forEach((el) => io.observe(el))

    // count up
    const cio = new IntersectionObserver(
      (es) => {
        es.forEach((e) => {
          if (!e.isIntersecting) return
          const el = e.target as HTMLElement
          const target = parseFloat(el.dataset.count!)
          const suf = el.dataset.suffix || ''
          const isInt = Number.isInteger(target)
          const dur = 1500
          const st = performance.now()
          const u = el.querySelector('.u')
          function tick(now: number) {
            const t = Math.min(1, (now - st) / dur)
            const k = 1 - Math.pow(1 - t, 3)
            const v = target * k
            const txt = (isInt ? Math.round(v).toLocaleString() : v.toFixed(1)) + suf
            if (u) {
              u.textContent = txt
            } else {
              el.textContent = txt
            }
            if (t < 1) requestAnimationFrame(tick)
          }
          requestAnimationFrame(tick)
          cio.unobserve(el)
        })
      },
      { threshold: 0.4 }
    )
    document.querySelectorAll('[data-count]').forEach((el) => cio.observe(el))

    // equalizer bars
    const eq = document.getElementById('eqBars')
    if (eq) {
      const hs = [30, 55, 80, 45, 65, 90, 70, 35, 55, 75, 50, 25, 60, 85, 40]
      hs.forEach((h, i) => {
        const b = document.createElement('i')
        b.style.height = h + '%'
        if (h > 72) b.classList.add('hi')
        b.style.animation = `eqp ${0.7 + (i % 5) * 0.12}s ease-in-out ${i * 0.05}s infinite alternate`
        eq.appendChild(b)
      })
    }

    // FAQ
    document.querySelectorAll('.qitem').forEach((it) => {
      const btn = it.querySelector('.qq')
      if (btn) {
        btn.addEventListener('click', () => {
          const o = it.classList.contains('open')
          document.querySelectorAll('.qitem').forEach((x) => x.classList.remove('open'))
          if (!o) it.classList.add('open')
        })
      }
    })

    // pricing toggle
    const bills = document.querySelectorAll('.toggle button')
    bills.forEach((b) =>
      b.addEventListener('click', () => {
        bills.forEach((x) => x.classList.remove('active'))
        b.classList.add('active')
        const annual = (b as HTMLElement).dataset.bill === 'annual'
        document.querySelectorAll<HTMLElement>('.num[data-monthly]').forEach((n) => {
          n.textContent = annual ? n.dataset.annual! : n.dataset.monthly!
        })
        const proPer = document.getElementById('proPer')
        const elitePer = document.getElementById('elitePer')
        if (proPer) proPer.textContent = annual ? '/mo billed yearly' : '/month'
        if (elitePer) elitePer.textContent = annual ? '/mo billed yearly' : '/month'
      })
    )

    // magnetic buttons — pull + lift
    const magneticBtns = document.querySelectorAll<HTMLElement>('.magnetic')
    const magneticHandlers: Array<{
      el: HTMLElement
      move: (e: MouseEvent) => void
      leave: () => void
    }> = []
    magneticBtns.forEach((btn) => {
      const move = (e: MouseEvent) => {
        const r = btn.getBoundingClientRect()
        const x = e.clientX - r.left - r.width / 2
        const y = e.clientY - r.top - r.height / 2
        btn.style.transform = `translate(${x * 0.28}px,${y * 0.4}px) scale(1.045)`
      }
      const leave = () => {
        btn.style.transform = ''
      }
      btn.addEventListener('mousemove', move)
      btn.addEventListener('mouseleave', leave)
      magneticHandlers.push({ el: btn, move, leave })
    })

    // scroll progress rail
    const scrollBar = document.getElementById('scrollBar')
    const updScrollBar = () => {
      if (!scrollBar) return
      const max = document.documentElement.scrollHeight - window.innerHeight
      scrollBar.style.width = (max > 0 ? (window.scrollY / max) * 100 : 0) + '%'
    }
    if (scrollBar) {
      window.addEventListener('scroll', updScrollBar, { passive: true })
      window.addEventListener('resize', updScrollBar)
      updScrollBar()
    }

    // hero fragment parallax — scroll + mouse, combined
    const frags = document.querySelectorAll<HTMLElement>('.frag')
    const hero = document.querySelector<HTMLElement>('.hero')
    let pmx = 0
    let pmy = 0
    function setFrags() {
      const y = Math.min(window.scrollY, 900)
      frags.forEach((f) => {
        const d = parseFloat(f.dataset.depth!)
        f.style.transform = `translate3d(${pmx * d * 220}px,${y * d * -1 + pmy * d * 160}px,0)`
      })
    }
    window.addEventListener('scroll', setFrags, { passive: true })

    let heroMoveHandler: ((e: MouseEvent) => void) | null = null
    let heroLeaveHandler: (() => void) | null = null

    if (hero && window.matchMedia('(prefers-reduced-motion: no-preference)').matches) {
      const heroSpot = document.getElementById('heroSpot')
      heroMoveHandler = (e: MouseEvent) => {
        const r = hero.getBoundingClientRect()
        pmx = (e.clientX - r.left) / r.width - 0.5
        pmy = (e.clientY - r.top) / r.height - 0.5
        if (heroSpot) {
          heroSpot.style.setProperty('--sx', e.clientX - r.left + 'px')
          heroSpot.style.setProperty('--sy', e.clientY - r.top + 'px')
          heroSpot.style.opacity = '1'
        }
        setFrags()
      }
      heroLeaveHandler = () => {
        pmx = 0
        pmy = 0
        if (heroSpot) heroSpot.style.opacity = '0'
        setFrags()
      }
      hero.addEventListener('mousemove', heroMoveHandler)
      hero.addEventListener('mouseleave', heroLeaveHandler)
    }

    // live focus timer fragment
    const fragTimer = document.getElementById('fragTimer')
    const fragBar = document.getElementById('fragBar')
    let timerInterval: ReturnType<typeof setInterval> | null = null
    if (fragTimer) {
      let secs = 24 * 60 + 59
      timerInterval = setInterval(() => {
        secs = secs > 0 ? secs - 1 : 25 * 60
        const m = String(Math.floor(secs / 60)).padStart(2, '0')
        const s = String(secs % 60).padStart(2, '0')
        fragTimer.textContent = m + ':' + s
        if (fragBar) fragBar.style.width = ((1 - secs / (25 * 60)) * 100) + '%'
      }, 1000)
    }

    // hero flashcard — click to flip; auto-flip stops once you interact
    const heroCard = document.getElementById('heroCard')
    let autoFlip: ReturnType<typeof setInterval> | null = null
    let heroCardClickHandler: (() => void) | null = null
    if (heroCard) {
      heroCardClickHandler = () => {
        heroCard.classList.toggle('flip')
        if (autoFlip) {
          clearInterval(autoFlip)
          autoFlip = null
        }
      }
      heroCard.addEventListener('click', heroCardClickHandler)
      if (window.matchMedia('(prefers-reduced-motion: no-preference)').matches) {
        autoFlip = setInterval(() => heroCard.classList.toggle('flip'), 5200)
      }
    }

    // card spotlight follow
    const spotCards = document.querySelectorAll<HTMLElement>('[data-spot]')
    const spotHandlers: Array<{ el: HTMLElement; handler: (e: MouseEvent) => void }> = []
    spotCards.forEach((c) => {
      const handler = (e: MouseEvent) => {
        const r = c.getBoundingClientRect()
        c.style.setProperty('--mx', e.clientX - r.left + 'px')
        c.style.setProperty('--my', e.clientY - r.top + 'px')
      }
      c.addEventListener('mousemove', handler)
      spotHandlers.push({ el: c, handler })
    })

    // seamless marquee loop — duplicate track content so it never runs out
    document.querySelectorAll('.marq-track').forEach((t) => {
      t.innerHTML += t.innerHTML
    })

    // HOW IT WORKS — scroll driven kinetic section
    const hiwTrack = document.getElementById('hiwTrack')
    const hiwMega = document.getElementById('hiwMega')
    const hiwSteps = [...document.querySelectorAll<HTMLElement>('.hiw-step')]
    const hiwDots = [...document.querySelectorAll<HTMLElement>('#hiwDots i')]
    let curStep = -1
    function hiwUpdate() {
      if (!hiwTrack) return
      const r = hiwTrack.getBoundingClientRect()
      const total = hiwTrack.offsetHeight - window.innerHeight
      const p = Math.min(1, Math.max(0, -r.top / total))
      if (hiwMega) {
        hiwMega.style.transform = `translateY(-50%) translateX(${-p * 42}vw)`
      }
      const n = hiwSteps.length
      const idx = Math.min(n - 1, Math.floor(p * n * 0.999))
      if (idx !== curStep) {
        curStep = idx
        hiwSteps.forEach((s, i) => s.classList.toggle('on', i === idx))
        hiwDots.forEach((d, i) => d.classList.toggle('on', i === idx))
      }
    }
    window.addEventListener('scroll', hiwUpdate, { passive: true })
    window.addEventListener('resize', hiwUpdate)
    hiwUpdate()

    // Cleanup
    return () => {
      window.removeEventListener('scroll', onNavScroll)
      io.disconnect()
      cio.disconnect()
      if (scrollBar) {
        window.removeEventListener('scroll', updScrollBar)
        window.removeEventListener('resize', updScrollBar)
      }
      window.removeEventListener('scroll', setFrags)
      if (hero && heroMoveHandler) hero.removeEventListener('mousemove', heroMoveHandler)
      if (hero && heroLeaveHandler) hero.removeEventListener('mouseleave', heroLeaveHandler)
      if (timerInterval) clearInterval(timerInterval)
      if (autoFlip) clearInterval(autoFlip)
      if (heroCard && heroCardClickHandler) heroCard.removeEventListener('click', heroCardClickHandler)
      magneticHandlers.forEach(({ el, move, leave }) => {
        el.removeEventListener('mousemove', move)
        el.removeEventListener('mouseleave', leave)
      })
      spotHandlers.forEach(({ el, handler }) => {
        el.removeEventListener('mousemove', handler)
      })
      window.removeEventListener('scroll', hiwUpdate)
      window.removeEventListener('resize', hiwUpdate)
    }
  }, [])

  return (
    <div className="landing-page">
      {/* scroll progress rail */}
      <div className="scroll-rail"><i id="scrollBar"></i></div>

      {/* ============ NAV ============ */}
      <nav className="nav" id="nav">
        <div className="row">
          <a href="#" className="brand"><img src="/studlin-icon.png" alt="Studlin" /><span>Studlin</span></a>
          <div className="nav-links">
            <a href="#features">Features</a>
            <a href="#how">How it works</a>
            <a href="#showcase">The app</a>
            <a href="#loved">Students</a>
            <a href="#pricing">Pricing</a>
            <a href="#faq">FAQ</a>
          </div>
          <div className="nav-cta">
            <a href="/sign-in" className="btn btn-ghost">Sign in</a>
            <a href="/onboarding" className="btn btn-lime magnetic">Start free <span className="ar">{'→'}</span></a>
          </div>
        </div>
      </nav>

      {/* ============ HERO ============ */}
      <header className="hero">
        <div className="aurora"><i className="a1"></i><i className="a2"></i><i className="a3"></i></div>
        <div className="hero-grid"></div>
        <div className="hero-spot" id="heroSpot"></div>

        {/* floating fragments — mini live UI */}
        <div className="frag f1" data-depth="0.04"><div className="fin">
          <div className="fl">Day streak</div><div className="fv">12</div>
          <div className="fdays"><i className="on"></i><i className="on"></i><i className="on"></i><i className="on"></i><i className="on"></i><i></i><i></i></div>
        </div></div>
        <div className="frag f2" data-depth="-0.05"><div className="fin">
          <div className="fl"><span className="livepip"></span>Focus session</div><div className="fv mono-num" id="fragTimer">24:59</div>
          <div className="fbar"><i id="fragBar"></i></div>
        </div></div>
        <div className="frag f3 fcardwrap" data-depth="0.06"><div className="fin">
          <div className="fcard3d" id="heroCard">
            <div className="face front"><div className="fl">Flashcard · Bio 201</div><div className="fq">What carries oxygen in blood?</div><div className="fhint">tap to flip</div></div>
            <div className="face back"><div className="fl">Answer</div><div className="fq">Hemoglobin</div><div className="fhint good">+1 mastered</div></div>
          </div>
        </div></div>
        <div className="frag f4" data-depth="-0.035"><div className="fin">
          <div className="fl">Grade avg</div>
          <div className="frow"><div className="fv">A{'−'}</div><div className="fbars"><b style={{height:'40%'}}></b><b style={{height:'55%'}}></b><b style={{height:'48%'}}></b><b style={{height:'70%'}}></b><b style={{height:'88%'}}></b></div></div>
        </div></div>
        <div className="frag f5" data-depth="0.045"><div className="fin">
          <div className="fl">AI Tutor</div>
          <div className="fchat">Explain entropy like I&apos;m 12</div>
          <div className="fchat ai">Imagine your room getting messy on its own{'…'}</div>
        </div></div>
        <div className="frag f6" data-depth="-0.04"><div className="fin">
          <div className="fl">Up next</div>
          <div className="fevent"><span className="edot"></span><div><div className="fq sm">Bio midterm review</div><div className="fhint">Fri · 9:00 AM</div></div></div>
        </div></div>

        <div className="wrap hero-inner">
          <span className="tag" style={{opacity:1,transform:'none'}}><span className="pip"></span> One workspace · every subject</span>
          <h1>
            <span className="line"><span className="reveal-up">Everything you</span></span>
            <span className="line"><span className="reveal-up">study, in one</span></span>
            <span className="line"><span className="reveal-up"><span className="hl-modern rotor"><span className="col"><span>place.</span><span>flow.</span><span>app.</span><span>tab.</span><span>OS.</span><span>place.</span></span></span></span></span>
          </h1>
          <p className="sub">Writing tools, AI tutoring, flashcards, smart scheduling, focus mode and gamified streaks, fused into one calm command center built for how you actually study.</p>
          <div className="hero-ctas">
            <a href="/onboarding" className="btn btn-lime btn-lg magnetic">Start free</a>
            <a href="#showcase" className="btn btn-ghost btn-lg">See it move</a>
          </div>
          <div className="hero-trust">
            <div className="avstack">
              <div className="av" style={{background:'linear-gradient(135deg,#E9B98C,#FFC9D2)'}}></div>
              <div className="av" style={{background:'linear-gradient(135deg,#8FBEDB,#B6A4D9)'}}></div>
              <div className="av" style={{background:'linear-gradient(135deg,#8FCBA9,#FFE99A)'}}></div>
              <div className="av" style={{background:'linear-gradient(135deg,#B6A4D9,#E9B98C)'}}></div>
            </div>
            <div className="txt">Loved by <b>24,000+ students</b> at <b>600+ universities</b></div>
          </div>
        </div>

        <div className="scroll-cue">Scroll<div className="ln"></div></div>
      </header>

      {/* ============ REPLACES MARQUEE ============ */}
      <section className="strip">
        <div className="lab">One subscription · replaces your entire stack</div>
        <div className="marq">
          <div className="marq-track" id="replaceMarq">
            <span className="marq-item">Writing Suite <span className="x">{'×'}</span></span>
            <span className="marq-item">Flashcard Generator <span className="x">{'×'}</span></span>
            <span className="marq-item">AI Tutor <span className="x">{'×'}</span></span>
            <span className="marq-item">Focus Timer <span className="x">{'×'}</span></span>
            <span className="marq-item">Smart Calendar <span className="x">{'×'}</span></span>
            <span className="marq-item">Grade Tracker <span className="x">{'×'}</span></span>
            <span className="marq-item">Study Planner <span className="x">{'×'}</span></span>
          </div>
        </div>
      </section>

      {/* ============ STATS ============ */}
      <section className="sec" style={{paddingBottom:0}}>
        <div className="wrap">
          <div className="stats reveal">
            <div className="stat"><div className="n" data-count="24000">0</div><div className="l">Active students</div></div>
            <div className="stat"><div className="n" data-count="1.4" data-suffix="M"><span className="u">0</span></div><div className="l">Flashcards mastered</div></div>
            <div className="stat"><div className="n" data-count="92" data-suffix="%">0</div><div className="l">Higher grade avg</div></div>
            <div className="stat"><div className="n" data-count="38" data-suffix="K">0</div><div className="l">Essays polished</div></div>
          </div>
        </div>
      </section>

      {/* ============ FEATURES BENTO ============ */}
      <section className="sec" id="features">
        <div className="wrap">
          <div className="head">
            <div>
              <span className="sec-eyebrow">{'// Everything you need'}</span>
              <h2>Eight tools.<br /><span className="dim">One tab.</span></h2>
            </div>
            <p className="lead">Stop paying for six apps that ignore each other. Studlin replaces the whole stack, and every tool knows what the others are doing.</p>
          </div>

          <div className="bento">
            {/* writing */}
            <div className="card col-7 reveal" data-spot="">
              <div className="knum">01 · AI Writing Suite</div>
              <h3>Write, polish, humanize and cite, without leaving the page.</h3>
              <p>Grammar checker, AI detector, plagiarism scan, citation generator, word counter. The full writing stack, live on every doc.</p>
              <div className="canvas">
                <div className="mini">
                  <div className="mono" style={{fontSize:'10px',color:'var(--lime)',letterSpacing:'0.1em',marginBottom:'10px'}}>DRAFT · ESSAY · 1,247 WORDS</div>
                  In <em>Macbeth</em>, Shakespeare shows how unchecked <span className="hl" style={{background:'rgba(233,185,140,0.22)',borderBottom:'2px solid var(--peach)'}}>ambition corodes</span> moral judgment. The protagonist&apos;s <span className="hl" style={{background:'rgba(143,203,169,0.22)',borderBottom:'2px solid var(--mint)'}}>descent into tyranny</span> is foreshadowed in Act I{'…'}
                  <div className="chiprow">
                    <span className="ck" style={{background:'var(--peach)',color:'var(--ink)'}}>{'Spelling → corrodes'}</span>
                    <span className="ck" style={{background:'var(--mint)',color:'var(--ink)'}}>Strong thesis</span>
                    <span className="ck" style={{background:'var(--lime)',color:'var(--ink)'}}>0% AI detected</span>
                  </div>
                </div>
              </div>
            </div>

            {/* reschedule */}
            <div className="card col-5 lime reveal d1">
              <div className="knum">02 · Smart Reschedule</div>
              <h3>{'"I have a chem test Friday." Done.'}</h3>
              <p>Describe a conflict in plain English. Studlin re-plans your week, blocks focus time, reshuffles every deadline.</p>
              <div className="canvas">
                <div style={{background:'var(--ink)',color:'var(--cream)',borderRadius:'13px',padding:'13px 15px',fontFamily:'var(--mono)',fontSize:'12.5px'}}>
                  <div style={{opacity:0.55,fontSize:'10px',marginBottom:'5px'}}>YOU</div>move my history essay so i can study for chem
                </div>
                <div style={{background:'#fff',color:'var(--ink)',borderRadius:'13px',padding:'13px 15px',marginTop:'8px',fontSize:'12.5px',lineHeight:1.5}}>
                  <div className="mono" style={{opacity:0.5,fontSize:'10px',marginBottom:'5px'}}>STUDLIN</div>Pushed essay to <strong>Sat 10am</strong>. Added 4{'×'}45m chem blocks. Synced to Google Cal.
                </div>
              </div>
            </div>

            {/* flashcards */}
            <div className="card col-5 reveal" data-spot="">
              <div className="knum">03 · Flashcards</div>
              <h3>Drop a PDF. Get a deck.</h3>
              <p>Upload notes, lectures, textbooks. AI builds spaced-repetition cards tuned to your exam.</p>
              <div className="canvas deckwrap deckgen" aria-hidden="true">
                <div className="dg-doc"><i className="l1"></i><i className="l2"></i><i className="l3"></i><span className="mono">notes.pdf</span></div>
                <div className="dg-stream"><i></i><i></i><i></i></div>
                <div className="dg-card c1">What is osmosis?</div>
                <div className="dg-card c2">Define entropy</div>
                <div className="dg-card c3">Mitosis vs meiosis?</div>
                <div className="dg-progress"><i></i></div>
              </div>
            </div>

            {/* tutor */}
            <div className="card col-7 reveal d1" data-spot="">
              <div className="knum">04 · AI Tutor for every subject</div>
              <h3>Upload anything. Ask anything.</h3>
              <p>Snap a worksheet, drop a recording, paste a problem. The tutor walks you through it Socratically. It never just hands over answers.</p>
              <div className="canvas">
                <div style={{display:'flex',flexDirection:'column',gap:'8px'}}>
                  <div style={{alignSelf:'flex-end',background:'var(--bg)',border:'1px solid var(--line)',padding:'10px 14px',borderRadius:'14px 14px 4px 14px',fontSize:'13px',maxWidth:'78%'}}>why is sin(2x) = 2sin(x)cos(x)?</div>
                  <div style={{alignSelf:'flex-start',background:'var(--panel-2)',border:'1px solid var(--line)',padding:'10px 14px',borderRadius:'14px 14px 14px 4px',fontSize:'13px',maxWidth:'82%',lineHeight:1.5}}>Start with sin(A+B) = sin A cos B + cos A sin B. Now set A = B = x{'…'} <span className="mono" style={{background:'var(--lime)',color:'var(--ink)',padding:'1px 6px',borderRadius:'4px'}}>{'your turn →'}</span></div>
                </div>
              </div>
            </div>

            {/* streaks */}
            <div className="card col-4 reveal" data-spot="">
              <div className="knum">05 · Streaks</div>
              <h3>The reason you&apos;ll show up.</h3>
              <p>Daily streaks, milestones, and a Weekly Wrapped that&apos;s actually fun to share.</p>
              <div className="canvas" style={{display:'flex',alignItems:'flex-end',gap:'12px'}}>
                <span className="streakbig" style={{color:'var(--lime)'}}>12</span>
                <div style={{paddingBottom:'10px'}}><div style={{fontWeight:600,fontSize:'13px'}}>day streak</div><div style={{fontSize:'11.5px',color:'var(--cream-faint)'}}>longest: 31</div></div>
              </div>
            </div>

            {/* music */}
            <div className="card col-4 reveal d1" data-spot="">
              <div className="knum">06 · Focus Music</div>
              <h3>Sounds your brain agrees with.</h3>
              <p>AI-curated soundscapes. Lo-fi for reading, binaural for math.</p>
              <div className="canvas">
                <div className="bars" id="eqBars"></div>
                <div className="mono" style={{fontSize:'11px',marginTop:'10px',color:'var(--cream-dim)'}}>{'▶ Deep Focus · 45 min left'}</div>
              </div>
            </div>

            {/* wrapped */}
            <div className="card col-4 reveal d2" data-spot="">
              <div className="knum">07 · Wrapped</div>
              <h3>Spotify Wrapped, for studying.</h3>
              <p>Weekly recaps of your wins, focus hours, and exactly where you slipped.</p>
              <div className="canvas">
                <div className="mini" style={{background:'var(--bg-deep)'}}>
                  <div className="mono" style={{fontSize:'10px',color:'var(--cream-faint)',letterSpacing:'0.1em'}}>WEEK 18 · WRAPPED</div>
                  <div style={{fontFamily:'var(--display)',fontWeight:700,fontSize:'36px',color:'var(--lime)',margin:'4px 0',letterSpacing:'-0.03em'}}>14h 22m</div>
                  <div style={{fontSize:'12px',color:'var(--cream-dim)'}}>+3.2h vs last week</div>
                </div>
              </div>
            </div>

            {/* focus music wide */}
            <div className="card col-12 reveal" style={{padding:'44px'}} data-spot="">
              <div style={{display:'grid',gridTemplateColumns:'1fr 1.15fr',gap:'48px',alignItems:'center'}}>
                <div>
                  <div className="knum">08 · Focus, scored.</div>
                  <h3 style={{fontSize:'46px',lineHeight:1.0}}>Sounds your brain agrees with.</h3>
                  <p>AI-curated soundscapes tuned to what you&apos;re working on. Lo-fi for reading, binaural for math, brown noise when it&apos;s crunch time. One tap and you&apos;re in the zone.</p>
                  <a href="/onboarding" className="btn btn-lime magnetic">Start a focus session <span className="ar">{'→'}</span></a>
                </div>
                <div style={{background:'var(--bg-deep)',border:'1px solid var(--line)',borderRadius:'18px',padding:'22px'}}>
                  <div className="mono" style={{fontSize:'10.5px',color:'var(--cream-faint)',letterSpacing:'0.1em',textTransform:'uppercase',marginBottom:'16px'}}>Now playing · Deep Focus</div>
                  <div style={{display:'flex',alignItems:'flex-end',gap:'4px',height:'90px',marginBottom:'18px'}}>
                    <div style={{flex:1,background:'var(--lime)',borderRadius:'3px 3px 0 0',height:'30%'}}></div>
                    <div style={{flex:1,background:'var(--lime)',borderRadius:'3px 3px 0 0',height:'55%'}}></div>
                    <div style={{flex:1,background:'var(--lime)',borderRadius:'3px 3px 0 0',height:'80%'}}></div>
                    <div style={{flex:1,background:'var(--lime)',borderRadius:'3px 3px 0 0',height:'45%'}}></div>
                    <div style={{flex:1,background:'var(--lime)',borderRadius:'3px 3px 0 0',height:'70%'}}></div>
                    <div style={{flex:1,background:'var(--lime)',borderRadius:'3px 3px 0 0',height:'95%'}}></div>
                    <div style={{flex:1,background:'var(--lime)',borderRadius:'3px 3px 0 0',height:'60%'}}></div>
                    <div style={{flex:1,background:'rgba(244,239,227,0.18)',borderRadius:'3px 3px 0 0',height:'35%'}}></div>
                    <div style={{flex:1,background:'rgba(244,239,227,0.18)',borderRadius:'3px 3px 0 0',height:'50%'}}></div>
                    <div style={{flex:1,background:'rgba(244,239,227,0.18)',borderRadius:'3px 3px 0 0',height:'25%'}}></div>
                    <div style={{flex:1,background:'rgba(244,239,227,0.18)',borderRadius:'3px 3px 0 0',height:'65%'}}></div>
                    <div style={{flex:1,background:'rgba(244,239,227,0.18)',borderRadius:'3px 3px 0 0',height:'40%'}}></div>
                  </div>
                  <div style={{display:'flex',gap:'8px',flexWrap:'wrap'}}>
                    <span className="mono" style={{fontSize:'10px',background:'var(--lime)',color:'var(--ink)',padding:'6px 12px',borderRadius:'99px',fontWeight:700}}>LO-FI</span>
                    <span className="mono" style={{fontSize:'10px',background:'rgba(244,239,227,0.06)',color:'var(--cream-dim)',padding:'6px 12px',borderRadius:'99px',border:'1px solid var(--line)'}}>BINAURAL</span>
                    <span className="mono" style={{fontSize:'10px',background:'rgba(244,239,227,0.06)',color:'var(--cream-dim)',padding:'6px 12px',borderRadius:'99px',border:'1px solid var(--line)'}}>BROWN NOISE</span>
                    <span className="mono" style={{fontSize:'10px',background:'rgba(244,239,227,0.06)',color:'var(--cream-dim)',padding:'6px 12px',borderRadius:'99px',border:'1px solid var(--line)'}}>NATURE</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============ SHOWCASE ============ */}
      <section className="sec showcase" id="showcase">
        <div className="wrap">
          <div className="head center">
            <span className="sec-eyebrow">{'// In your pocket'}</span>
            <h2>It moves with <span className="dim">you.</span></h2>
            <p className="lead">The whole command center on your phone. Move your cursor and feel it tilt.</p>
            <span className="coming-pill"><span className="pulse"></span> iOS &amp; Android app · Coming soon</span>
          </div>
          <div className="show-stage">
            <div className="show-float s1 reveal"><div className="mono" style={{fontSize:'9.5px',color:'var(--cream-faint)',letterSpacing:'0.12em'}}>NEXT UP</div><div style={{fontSize:'13px',fontWeight:600,marginTop:'4px'}}>Macbeth essay · 45m</div></div>
            <div className="show-float s2 reveal d1"><div style={{display:'flex',alignItems:'center',gap:'8px'}}><span style={{width:'8px',height:'8px',borderRadius:'50%',background:'var(--lime)',boxShadow:'0 0 8px var(--lime)'}}></span><span style={{fontSize:'13px',fontWeight:600}}>Focus active</span></div></div>
            <div className="device reveal" id="device">
              <div className="screen">
                <div className="notch"></div>
                <div className="scr-pad">
                  <div className="scr-h">
                    <div><div className="mono" style={{fontSize:'9.5px',color:'var(--cream-faint)',letterSpacing:'0.14em'}}>FRI · MAY 17</div><div className="scr-title">Hey Maya.</div></div>
                    <div className="scr-av"></div>
                  </div>
                  <div className="scr-card dark">
                    <div className="mono" style={{fontSize:'9.5px',color:'var(--cream-faint)',letterSpacing:'0.12em'}}>FOCUS · SESSION 3 OF 4</div>
                    <div className="scr-timer">22:14</div>
                    <div style={{fontSize:'11.5px',color:'var(--cream-dim)',marginTop:'6px'}}>English IV · Macbeth essay</div>
                    <div style={{height:'5px',background:'rgba(244,239,227,0.14)',borderRadius:'99px',marginTop:'12px',overflow:'hidden'}}><div style={{height:'100%',width:'55%',background:'var(--lime)'}}></div></div>
                  </div>
                  <div className="scr-card">
                    <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}><div style={{fontWeight:600,fontSize:'13px'}}>Today&apos;s plan</div><div className="mono" style={{fontSize:'10px',color:'var(--cream-faint)'}}>3 / 5</div></div>
                    <div style={{marginTop:'12px',display:'flex',flexDirection:'column',gap:'9px'}}>
                      <div style={{display:'flex',gap:'10px',alignItems:'center',fontSize:'12px',color:'var(--cream-faint)'}}><span style={{width:'16px',height:'16px',borderRadius:'50%',background:'var(--lime)',display:'grid',placeItems:'center',color:'var(--ink)'}}>{'✓'}</span><span style={{textDecoration:'line-through'}}>Cell respiration cards</span></div>
                      <div style={{display:'flex',gap:'10px',alignItems:'center',fontSize:'12px'}}><span style={{width:'16px',height:'16px',borderRadius:'50%',border:'1.5px solid var(--lime)'}}></span>Draft Macbeth essay</div>
                      <div style={{display:'flex',gap:'10px',alignItems:'center',fontSize:'12px',color:'var(--cream-dim)'}}><span style={{width:'16px',height:'16px',borderRadius:'50%',border:'1.5px solid var(--cream-faint)'}}></span>Practice integrals</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============ HOW IT WORKS ============ */}
      <section className="hiw" id="how">
        <div className="hiw-track" id="hiwTrack">
          <div className="hiw-pin">
            <div className="hiw-mega" id="hiwMega">
              <span>How</span><span className="lit">It</span><span>Works</span><span>How</span><span className="lit">It</span><span>Works</span>
            </div>
            <div className="hiw-panel">
              <div className="hiw-eyebrow">{'// From zero to locked-in, in four moves'}</div>
              <div className="hiw-steps" id="hiwSteps">
                <div className="hiw-step on" data-step="0">
                  <div className="si">01<small>SET UP</small></div>
                  <div>
                    <h3>Tell it what you&apos;re studying.</h3>
                    <p>Pick your subjects, drop your syllabus, link your calendar. Studlin reads it all and builds a plan around your real deadlines in seconds.</p>
                    <span className="stip">Imports from all major study tools</span>
                  </div>
                </div>
                <div className="hiw-step" data-step="1">
                  <div className="si">02<small>PLAN</small></div>
                  <div>
                    <h3>Wake up to a plan that already works.</h3>
                    <p>Every morning Studlin lays out the day: what to review, what to write, when to focus. Change one thing and the whole week reshuffles on its own.</p>
                    <span className="stip">Smart Reschedule built in</span>
                  </div>
                </div>
                <div className="hiw-step" data-step="2">
                  <div className="si">03<small>LOCK IN</small></div>
                  <div>
                    <h3>Do the work without leaving the page.</h3>
                    <p>Writing tools, AI tutor, flashcards and focus music all live in one window. Hit the timer, drop on the music, and let the streak count climb.</p>
                    <span className="stip">One tab replaces eight apps</span>
                  </div>
                </div>
                <div className="hiw-step" data-step="3">
                  <div className="si">04<small>LEVEL UP</small></div>
                  <div>
                    <h3>Watch the grades follow.</h3>
                    <p>Weekly Wrapped shows the wins, the streak graph keeps you honest, and your grades quietly climb. Studying that finally compounds.</p>
                    <span className="stip">Wrapped insights every Sunday</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="hiw-dots" id="hiwDots"><i className="on"></i><i></i><i></i><i></i></div>
          </div>
        </div>
      </section>

      {/* ============ TESTIMONIALS ============ */}
      <section className="sec" id="loved" style={{background:'var(--bg-2)',borderTop:'1px solid var(--line)',borderBottom:'1px solid var(--line)'}}>
        <div className="wrap">
          <div className="head center">
            <span className="sec-eyebrow">{'// Loved by'}</span>
            <h2>Real students. <span className="dim">Real grades.</span></h2>
          </div>
        </div>
        <div className="tmarq">
          <div className="trow marq">
            <div className="marq-track">
              <div className="tcard lime"><div className="stars">{'★★★★★'}</div><div className="tq">{'"I went from cramming the night before to actually '}<em>knowing</em>{' the material. The streaks are addictive in a good way."'}</div><div className="tm"><div className="tav">MR</div><div><div className="tn">Maya</div><div className="tr">Pre-med, UCLA</div></div></div></div>
              <div className="tcard"><div className="stars">{'★★★★★'}</div><div className="tq">{'"I switched from a stack of five different apps and saved $50/month. Everything\'s in one place now."'}</div><div className="tm"><div className="tav">DK</div><div><div className="tn">Devon</div><div className="tr">Junior, NYU Stern</div></div></div></div>
              <div className="tcard"><div className="stars">{'★★★★★'}</div><div className="tq">{'"Told it I caught the flu and it just… fixed my whole week. No anxiety spiral. Unreal."'}</div><div className="tm"><div className="tav">PS</div><div><div className="tn">Priya</div><div className="tr">IB Senior, Singapore</div></div></div></div>
              <div className="tcard"><div className="stars">{'★★★★★'}</div><div className="tq">{'"My GPA went from 3.2 to 3.8 in a semester. The tutor explains things the way my professor never could."'}</div><div className="tm"><div className="tav">JT</div><div><div className="tn">Jordan</div><div className="tr">Sophomore, UT Austin</div></div></div></div>
              <div className="tcard lime"><div className="stars">{'★★★★★'}</div><div className="tq">{'"I went from cramming the night before to actually '}<em>knowing</em>{' the material. The streaks are addictive in a good way."'}</div><div className="tm"><div className="tav">MR</div><div><div className="tn">Maya</div><div className="tr">Pre-med, UCLA</div></div></div></div>
              <div className="tcard"><div className="stars">{'★★★★★'}</div><div className="tq">{'"I switched from a stack of five different apps and saved $50/month. Everything\'s in one place now."'}</div><div className="tm"><div className="tav">DK</div><div><div className="tn">Devon</div><div className="tr">Junior, NYU Stern</div></div></div></div>
            </div>
          </div>
          <div className="trow rev marq">
            <div className="marq-track">
              <div className="tcard"><div className="stars">{'★★★★★'}</div><div className="tq">{'"Weekly Wrapped is the only social media I post anymore. My friends roast my focus hours."'}</div><div className="tm"><div className="tav">AC</div><div><div className="tn">Aisha</div><div className="tr">Freshman, Cornell</div></div></div></div>
              <div className="tcard lime"><div className="stars">{'★★★★★'}</div><div className="tq">{'"The flashcard generator turned my 80-page bio PDF into a deck in ten seconds. I almost cried."'}</div><div className="tm"><div className="tav">LW</div><div><div className="tn">Leo</div><div className="tr">Pre-vet, UC Davis</div></div></div></div>
              <div className="tcard"><div className="stars">{'★★★★★'}</div><div className="tq">{'"Finally something built for how my brain actually works. The focus timer plus music combo is unbeatable."'}</div><div className="tm"><div className="tav">NR</div><div><div className="tn">Nadia</div><div className="tr">Law, Georgetown</div></div></div></div>
              <div className="tcard"><div className="stars">{'★★★★★'}</div><div className="tq">{'"I run my whole study group off the streak graph now. Nobody wants to break their streak on Sunday night."'}</div><div className="tm"><div className="tav">TK</div><div><div className="tn">Theo</div><div className="tr">CS, Waterloo</div></div></div></div>
              <div className="tcard"><div className="stars">{'★★★★★'}</div><div className="tq">{'"Weekly Wrapped is the only social media I post anymore. My friends roast my focus hours."'}</div><div className="tm"><div className="tav">AC</div><div><div className="tn">Aisha</div><div className="tr">Freshman, Cornell</div></div></div></div>
              <div className="tcard lime"><div className="stars">{'★★★★★'}</div><div className="tq">{'"The flashcard generator turned my 80-page bio PDF into a deck in ten seconds. I almost cried."'}</div><div className="tm"><div className="tav">LW</div><div><div className="tn">Leo</div><div className="tr">Pre-vet, UC Davis</div></div></div></div>
            </div>
          </div>
        </div>
        <div className="wrap" style={{marginTop:'64px'}}>
          <div style={{display:'flex',alignItems:'center',gap:'38px',justifyContent:'center',flexWrap:'wrap'}}>
            <span className="mono" style={{fontSize:'11px',letterSpacing:'0.16em',textTransform:'uppercase',color:'var(--cream-faint)'}}>Used at</span>
            <span className="display" style={{fontWeight:600,fontSize:'22px',color:'var(--cream-dim)'}}>Stanford</span>
            <span className="display" style={{fontWeight:600,fontSize:'22px',color:'var(--cream-dim)'}}>MIT</span>
            <span className="display" style={{fontWeight:600,fontSize:'22px',color:'var(--cream-dim)'}}>Berkeley</span>
            <span className="display" style={{fontWeight:600,fontSize:'22px',color:'var(--cream-dim)'}}>Cambridge</span>
            <span className="display" style={{fontWeight:600,fontSize:'22px',color:'var(--cream-dim)'}}>Yale</span>
            <span className="display" style={{fontWeight:600,fontSize:'22px',color:'var(--cream-dim)'}}>NUS</span>
          </div>
        </div>
      </section>

      {/* ============ PRICING ============ */}
      <section className="sec" id="pricing">
        <div className="wrap">
          <div className="head center">
            <span className="sec-eyebrow">{'// Pricing'}</span>
            <h2>One subscription.<br /><span className="dim">Replaces six.</span></h2>
            <div className="toggle">
              <button className="active" data-bill="monthly">Monthly</button>
              <button data-bill="annual">Annual <span className="save">{'−25%'}</span></button>
            </div>
          </div>
          <div className="plans">
            <div className="plan reveal">
              <h3>Free</h3>
              <div className="price"><span className="num">$0</span><span className="per">/forever</span></div>
              <p className="pdesc">For getting your feet wet. No card needed.</p>
              <ul>
                <li><span className="ck2">{'✓'}</span> 50 AI credits / month</li>
                <li><span className="ck2">{'✓'}</span> Basic grammar checker</li>
                <li><span className="ck2">{'✓'}</span> Manual flashcards</li>
                <li><span className="ck2">{'✓'}</span> Pomodoro focus timer</li>
                <li><span className="ck2">{'✓'}</span> Streaks &amp; basic stats</li>
              </ul>
              <a href="/onboarding" className="btn btn-ghost">Start free</a>
            </div>
            <div className="plan feat reveal d1">
              <div className="plan-tag">7 DAYS FREE</div>
              <h3>Scholar Pro</h3>
              <div className="price"><span className="num" data-monthly="$15" data-annual="$11">$15</span><span className="per" id="proPer">/month</span></div>
              <p className="pdesc">Unlimited everything. Built for serious students.</p>
              <ul>
                <li><span className="ck2">{'✓'}</span> 500 AI credits / month</li>
                <li><span className="ck2">{'✓'}</span> Full writing suite + Humanizer</li>
                <li><span className="ck2">{'✓'}</span> AI flashcards from any file</li>
                <li><span className="ck2">{'✓'}</span> Smart Reschedule + AI Tutor</li>
                <li><span className="ck2">{'✓'}</span> AI focus music &amp; soundscapes</li>
                <li><span className="ck2">{'✓'}</span> Weekly Wrapped insights</li>
              </ul>
              <a href="/onboarding" className="btn btn-lime magnetic">Start free trial <span className="ar">{'→'}</span></a>
            </div>
            <div className="plan reveal d2">
              <h3>Academic</h3>
              <div className="price"><span className="num" data-monthly="$30" data-annual="$22">$30</span><span className="per" id="elitePer">/month</span></div>
              <p className="pdesc">Unlimited credits. For the obsessive.</p>
              <ul>
                <li><span className="ck2">{'✓'}</span> Unlimited AI credits</li>
                <li><span className="ck2">{'✓'}</span> AI Detector + grade analytics</li>
                <li><span className="ck2">{'✓'}</span> Subject-specific tutors</li>
                <li><span className="ck2">{'✓'}</span> Exam prep + study plans</li>
                <li><span className="ck2">{'✓'}</span> Predictive grade analytics</li>
                <li><span className="ck2">{'✓'}</span> Sync with your calendar and task manager</li>
              </ul>
              <a href="/onboarding" className="btn btn-ghost">Go Academic</a>
            </div>
          </div>
          <div style={{textAlign:'center',marginTop:'30px',fontSize:'14px',color:'var(--cream-faint)'}}>{'Most students juggle 4–6 apps. Studlin is all of them in one. Starts at just '}<span style={{color:'var(--cream)'}}>$14.99/mo</span>.</div>
        </div>
      </section>

      {/* ============ FAQ ============ */}
      <section className="sec" id="faq" style={{paddingTop:0}}>
        <div className="wrap">
          <div className="head center">
            <span className="sec-eyebrow">{'// FAQ'}</span>
            <h2>Ask us <span className="dim">anything.</span></h2>
          </div>
          <div className="faq">
            <div className="qitem open"><button className="qq">Will my professors know I used AI?<span className="ic">+</span></button><div className="qa"><div className="qa-in">Studlin&apos;s AI Detector is the same one most universities deploy, and the Humanizer rewrites in your voice from your past writing. You can also toggle AI off entirely for honor-code-strict assignments.</div></div></div>
            <div className="qitem"><button className="qq">How does Studlin compare to other study tools?<span className="ic">+</span></button><div className="qa"><div className="qa-in">Most competing tools do one thing well. Studlin integrates writing, flashcards, scheduling, AI tutoring, and focus tracking into a single workspace designed for real student workflows.</div></div></div>
            <div className="qitem"><button className="qq">What subjects does the AI Tutor support?<span className="ic">+</span></button><div className="qa"><div className="qa-in">All of them. Math with full LaTeX, sciences, humanities, languages, coding, business, including IB, AP, A Levels, IGCSE, SAT and MCAT exam boards.</div></div></div>
            <div className="qitem"><button className="qq">Can I import my existing notes and flashcards?<span className="ic">+</span></button><div className="qa"><div className="qa-in">Yes. Studlin imports from all major study platforms and file formats {'—'} PDFs, spreadsheets, audio files, and more.</div></div></div>
            <div className="qitem"><button className="qq">Is there a student discount?<span className="ic">+</span></button><div className="qa"><div className="qa-in">Studlin is already built for students. Scholar Pro is $11/mo billed annually, cheaper than most single-purpose tools it replaces.</div></div></div>
          </div>
        </div>
      </section>

      {/* ============ CTA ============ */}
      <section className="sec" style={{paddingBottom:0}}>
        <div className="cta reveal">
          <span className="tag">{'// Final exam season starts now'}</span>
          <h2>Stop juggling tabs.<br />Start locking in.</h2>
          <p>Join 24,000+ students who study smarter, not harder.</p>
          <a href="/onboarding" className="btn btn-ink btn-lg magnetic">Start free, 7 days of Pro <span className="ar">{'→'}</span></a>
        </div>
      </section>

      {/* ============ MOBILE APP COMING SOON ============ */}
      <section style={{position:'relative',padding:'90px 0',background:'var(--bg-2)',borderTop:'1px solid var(--line)',overflow:'hidden'}}>
        <div style={{position:'absolute',inset:0,background:'radial-gradient(600px circle at 50% 60%,rgba(184,224,74,0.06),transparent 70%)',pointerEvents:'none'}}></div>
        <div className="wrap" style={{textAlign:'center',position:'relative',zIndex:1}}>
          <div className="mono" style={{fontSize:'11px',letterSpacing:'0.15em',textTransform:'uppercase',color:'var(--lime)',marginBottom:'14px'}}>Coming Soon</div>
          <h2 style={{fontSize:'clamp(32px,5.2vw,56px)',fontWeight:700,lineHeight:1.06,margin:'0 0 14px',color:'var(--cream)',letterSpacing:'-0.03em'}}>The Studlin mobile app</h2>
          <p style={{fontSize:'17px',lineHeight:1.55,color:'var(--cream-dim)',maxWidth:'520px',margin:'0 auto'}}>Everything you love on desktop, optimized for your pocket. Be the first to know when we launch.</p>
          <div style={{marginTop:'24px',display:'flex',gap:'10px',justifyContent:'center',flexWrap:'wrap'}}>
            <input type="email" placeholder="your@email.com" style={{flex:'0 1 300px',padding:'12px 18px',border:'1px solid var(--line)',borderRadius:'99px',background:'rgba(244,239,227,0.04)',color:'var(--cream)',fontFamily:'inherit',fontSize:'14px',outline:'none'}} />
            <button style={{padding:'12px 26px',border:'none',background:'var(--lime)',color:'var(--ink)',borderRadius:'99px',fontWeight:700,fontFamily:'inherit',fontSize:'14px',cursor:'pointer',transition:'all .2s'}}>Notify me</button>
          </div>
        </div>
      </section>

      {/* ============ FOOTER ============ */}
      <footer className="foot">
        <div className="wrap">
          <div className="foot-grid">
            <div>
              <a href="#" className="brand" style={{marginBottom:'18px'}}><img src="/studlin-icon.png" alt="Studlin" /><span>Studlin</span></a>
              <p style={{fontSize:'14px',lineHeight:1.6,color:'var(--cream-dim)',maxWidth:'280px',margin:'0 0 20px'}}>Your entire study life in one calm command center. Built by students, for students.</p>
              <div className="foot-social"><a href="#">X</a><a href="#">IG</a><a href="#">TT</a><a href="#">in</a></div>
            </div>
            <div><h4>Product</h4><ul><li><a href="#features">Features</a></li><li><a href="#pricing">Pricing</a></li><li><a href="#">Changelog</a></li><li><a href="#">Roadmap</a></li></ul></div>
            <div><h4>Tools</h4><ul><li><a href="#">Writing Suite</a></li><li><a href="#">Flashcards</a></li><li><a href="#">AI Tutor</a></li><li><a href="#">Focus Timer</a></li></ul></div>
            <div><h4>For</h4><ul><li><a href="#">Students</a></li><li><a href="#">Teachers</a></li><li><a href="#">Professionals</a></li><li><a href="#">Schools</a></li></ul></div>
            <div><h4>Company</h4><ul><li><a href="#">About</a></li><li><a href="#">Blog</a></li><li><a href="#">Careers</a></li><li><a href="#">Contact</a></li></ul></div>
          </div>
          <div className="foot-bottom">
            <span>{'©'} 2026 Studlin Labs, Inc. · Made in Brooklyn</span>
            <span style={{display:'flex',gap:'18px'}}><a href="#">Terms</a><a href="#">Privacy</a><a href="#">Cookies</a></span>
          </div>
        </div>
      </footer>
    </div>
  )
}
