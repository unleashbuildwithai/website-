<script>
  import { onMount, onDestroy } from 'svelte';
  import gsap from 'gsap';
  import ScrollTrigger from 'gsap/ScrollTrigger';

  import { scrollVelocity, scrollProgress, adminOpen, modalOpen } from './lib/stores.js';

  import StarField       from './components/StarField.svelte';
  import RobotBackground from './components/RobotBackground.svelte';
  import HeroCard        from './components/HeroCard.svelte';
  import ArsenalSection  from './components/ArsenalSection.svelte';
  import BlueprintSection from './components/BlueprintSection.svelte';
  import CTASection      from './components/CTASection.svelte';
  import InitiateModal   from './components/InitiateModal.svelte';
  import AdminInbox      from './components/AdminInbox.svelte';

  // ── Page geometry
  const VH      = window.innerHeight;
  const TOTAL_H = VH * 5;
  const MAX_S   = TOTAL_H - VH;

  // ── Section offsets
  const isMobileView   = window.innerWidth <= 768;
  const SECTION_OFFSET = isMobileView ? 30 : 119;
  const BP_OFFSET      = isMobileView ? 30 : 10;

  // ── GSAP timing anchors (0–1 progress)
  const AP = 0.08;           // Arsenal
  const PP = AP + 0.30;      // Blueprint
  const CP = PP + 0.28;      // CTA
  const MOUTH_DY = -(VH * 0.55);

  // ── Arm physics state (objects mutated by GSAP)
  const LP     = { wx: 175, wy: 560, grip: 0 };
  const RP     = { wx: 1025, wy: 560, grip: 0 };
  const gearL  = { rot: 0 };
  const gearR  = { rot: 0 };
  const gProxy = { y: 0 };
  const barOp  = { b1: 1, b2: 1, b3: 1 };
  let   gearScrollAccum = 0;

  // ── Arm position constants
  const L_INIT = { wx: 175, wy: 560 };
  const R_INIT = { wx: 1025, wy: 560 };
  const L_DOWN = { wx: 575, wy: 820 };
  const R_DOWN = { wx: 625, wy: 820 };
  const L_UP   = { wx: 220, wy: 500 };
  const R_UP   = { wx: 980, wy: 500 };
  const ARM_L  = 270;

  // ── Component refs
  let robotBg;       // RobotBackground — exposes updateAll()

  // ── Scroll velocity tracking (feeds StarField physics)
  let lastScrollY = 0;
  let lastScrollTime = performance.now();

  function onScroll() {
    const now  = performance.now();
    const dy   = window.scrollY - lastScrollY;
    const dt   = Math.max(1, now - lastScrollTime);
    const vel  = dy / dt * 16; // normalize to ~px/frame at 60fps

    scrollVelocity.set(vel);
    scrollProgress.set(window.scrollY / MAX_S);

    // Gear rotation from scroll
    gearScrollAccum += dy * 0.6;

    lastScrollY    = window.scrollY;
    lastScrollTime = now;
  }

  // ── Central update function (called by every GSAP tick)
  function updateAll() {
    if (robotBg) robotBg.updateAll();
    // Grab bar opacity propagation is handled via Svelte reactive props (barOp)
  }

  // ── Grab bar reactive vars (Svelte binds to these)
  let grabBar1Op = 1;
  let grabBar2Op = 1;
  let grabBar3Op = 1;

  // Proxy barOp → Svelte vars each frame
  function syncBarOp() {
    grabBar1Op = barOp.b1;
    grabBar2Op = barOp.b2;
    grabBar3Op = barOp.b3;
  }

  onMount(() => {
    gsap.registerPlugin(ScrollTrigger);

    // ── Set body height (5x viewport scroll space)
    document.body.style.height = TOTAL_H + 'px';

    // ── Scroll listener
    window.addEventListener('scroll', onScroll, { passive: true });

    // ── Initial arm state
    updateAll();

    // ─────────────────────────────────────────────────────
    // GSAP MASTER TIMELINE (scroll-driven, 0→1 = 0→MAX_S)
    // ─────────────────────────────────────────────────────
    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: 'body',
        start:   'top top',
        end:     `+=${MAX_S}`,
        scrub:   true,
      },
      defaults: { ease: 'none' },
    });

    // Helper: updateAll + sync bar opacity on every tick
    const UA = () => { updateAll(); syncBarOp(); };

    // ── Hero card exits (0→0.07)
    const heroCard = document.getElementById('hero-card');
    if (heroCard) {
      gsap.set(heroCard, { opacity: 1, scale: 1, x: 0, y: 0, transformOrigin: 'center center' });
      tl.to(heroCard, { duration: 0.07, opacity: 0, scale: 0, y: MOUTH_DY }, 0);
    }

    // Gear kick
    tl.to(gearL, { duration: 0.04, rot: -80, onUpdate: UA }, 0);
    tl.to(gearR, { duration: 0.04, rot:  80, onUpdate: UA }, 0);

    // ── Hand dance intro (0→0.07)
    tl.to(LP, { duration: 0.0031, wx: 439, wy: 635, grip: 1, onUpdate: UA }, 0);
    tl.to(RP, { duration: 0.0031, wx: 777, wy: 635, grip: 1, onUpdate: UA }, 0);
    tl.to(LP, { duration: 0.0061, wx: 450, wy: 593, grip: 1, onUpdate: UA }, 0.0031);
    tl.to(RP, { duration: 0.0061, wx: 775, wy: 585, grip: 1, onUpdate: UA }, 0.0031);
    tl.to(LP, { duration: 0.0031, wx: 437, wy: 561, grip: 1, onUpdate: UA }, 0.0092);
    tl.to(RP, { duration: 0.0031, wx: 769, wy: 554, grip: 1, onUpdate: UA }, 0.0092);
    tl.to(LP, { duration: 0.0061, wx: 459, wy: 502, grip: 1, onUpdate: UA }, 0.0123);
    tl.to(RP, { duration: 0.0061, wx: 750, wy: 506, grip: 1, onUpdate: UA }, 0.0123);
    tl.to(LP, { duration: 0.0031, wx: 462, wy: 473, grip: 1, onUpdate: UA }, 0.0184);
    tl.to(RP, { duration: 0.0031, wx: 740, wy: 466, grip: 1, onUpdate: UA }, 0.0184);
    tl.to(LP, { duration: 0.003,  wx: 465, wy: 470, grip: 1, onUpdate: UA }, 0.0215);
    tl.to(RP, { duration: 0.003,  wx: 750, wy: 474, grip: 1, onUpdate: UA }, 0.0215);
    tl.to(LP, { duration: 0.0031, wx: 495, wy: 419, grip: 0.24, onUpdate: UA }, 0.0245);
    tl.to(RP, { duration: 0.0031, wx: 722, wy: 416, grip: 0.24, onUpdate: UA }, 0.0245);
    tl.to(LP, { duration: 0.0031, wx: 544, wy: 371, grip: 0.27, onUpdate: UA }, 0.0276);
    tl.to(RP, { duration: 0.0031, wx: 676, wy: 374, grip: 0.27, onUpdate: UA }, 0.0276);
    tl.to(LP, { duration: 0.003,  wx: 568, wy: 342, grip: 0.3,  onUpdate: UA }, 0.0307);
    tl.to(RP, { duration: 0.003,  wx: 655, wy: 343, grip: 0.3,  onUpdate: UA }, 0.0307);
    tl.to(LP, { duration: 0.0031, wx: 580, wy: 287, grip: 0.44, onUpdate: UA }, 0.0337);
    tl.to(RP, { duration: 0.0031, wx: 628, wy: 292, grip: 0.44, onUpdate: UA }, 0.0337);
    tl.to(LP, { duration: 0.0031, wx: 590, wy: 260, grip: 0.48, onUpdate: UA }, 0.0368);
    tl.to(RP, { duration: 0.0031, wx: 598, wy: 254, grip: 0.48, onUpdate: UA }, 0.0368);
    tl.to(LP, { duration: 0.003,  wx: 583, wy: 282, grip: 0.71, onUpdate: UA }, 0.0399);
    tl.to(RP, { duration: 0.003,  wx: 606, wy: 284, grip: 0.71, onUpdate: UA }, 0.0399);
    tl.to(LP, { duration: 0.0031, wx: 513, wy: 378, grip: 0.56, onUpdate: UA }, 0.0429);
    tl.to(RP, { duration: 0.0031, wx: 687, wy: 378, grip: 0.56, onUpdate: UA }, 0.0429);
    tl.to(LP, { duration: 0.0031, wx: 519, wy: 367, grip: 0.6,  onUpdate: UA }, 0.046);
    tl.to(RP, { duration: 0.0031, wx: 681, wy: 367, grip: 0.6,  onUpdate: UA }, 0.046);
    tl.to(LP, { duration: 0.003,  wx: 524, wy: 356, grip: 0.64, onUpdate: UA }, 0.0491);
    tl.to(RP, { duration: 0.003,  wx: 676, wy: 356, grip: 0.64, onUpdate: UA }, 0.0491);
    tl.to(LP, { duration: 0.0031, wx: 530, wy: 346, grip: 0.68, onUpdate: UA }, 0.0521);
    tl.to(RP, { duration: 0.0031, wx: 670, wy: 346, grip: 0.68, onUpdate: UA }, 0.0521);
    tl.to(LP, { duration: 0.0031, wx: 536, wy: 335, grip: 0.72, onUpdate: UA }, 0.0552);
    tl.to(RP, { duration: 0.0031, wx: 664, wy: 335, grip: 0.72, onUpdate: UA }, 0.0552);
    tl.to(LP, { duration: 0.003,  wx: 542, wy: 324, grip: 0.76, onUpdate: UA }, 0.0583);
    tl.to(RP, { duration: 0.003,  wx: 662, wy: 364, grip: 0.76, onUpdate: UA }, 0.0583);
    tl.to(LP, { duration: 0.0031, wx: 561, wy: 362, grip: 0.8,  onUpdate: UA }, 0.0613);
    tl.to(RP, { duration: 0.0031, wx: 669, wy: 488, grip: 0.8,  onUpdate: UA }, 0.0613);
    tl.to(LP, { duration: 0.0031, wx: 555, wy: 470, grip: 0.84, onUpdate: UA }, 0.0644);
    tl.to(RP, { duration: 0.0031, wx: 733, wy: 646, grip: 0.84, onUpdate: UA }, 0.0644);
    tl.to(LP, { duration: 0.0031, wx: 274, wy: 449, grip: 0,    onUpdate: UA }, 0.0675);
    tl.to(RP, { duration: 0.0031, wx: 835, wy: 785, grip: 0,    onUpdate: UA }, 0.0675);

    // ─────────────────────────────────────────────────────
    // ARSENAL SECTION (AP)
    // ─────────────────────────────────────────────────────
    const s1 = document.getElementById('section-1');
    const arsenalChs = Array.from(document.querySelectorAll('.a-char:not(.spacer)'));
    const arsenalUL  = document.getElementById('arsenal-underline');
    const boxes      = ['box1','box2','box3','box4'].map(id => document.getElementById(id));

    if (s1) {
      gsap.set(s1, { opacity: 0, y: 0 });
      gsap.set(arsenalChs[0], { opacity: 0, y: 400, scale: 0.4 });
      gsap.set(arsenalChs.slice(1), { opacity: 0, y: 120 });
      gsap.set(arsenalUL, { opacity: 0, width: '0%' });
      boxes.forEach(b => b && gsap.set(b, { opacity: 0, y: 40 }));
    }

    tl.to(gearR, { duration: 0.03, rot: 280, onUpdate: UA }, AP - 0.01);
    tl.to(s1,    { duration: 0.015, opacity: 1 }, AP);
    tl.to(arsenalChs[0], { duration: 0.04, opacity: 1, y: 0, scale: 1, ease: 'back.out(1.7)' }, AP);
    tl.to(arsenalChs.slice(1), { duration: 0.03, opacity: 1, y: 0, stagger: 0.008 }, AP + 0.025);
    tl.to(arsenalUL, { duration: 0.05, opacity: 1, width: '100%' }, AP + 0.04);
    tl.to(RP,  { duration: 0.015, grip: 1, onUpdate: UA }, AP + 0.03);
    tl.to(barOp, { duration: 0.015, b1: 0.2, onUpdate: syncBarOp }, AP + 0.03);
    tl.to(LP,  { duration: 0.08, wx: L_DOWN.wx, wy: L_DOWN.wy, grip: 0, onUpdate: UA }, AP + 0.04);
    tl.to(gearL, { duration: 0.08, rot: -360, onUpdate: UA }, AP + 0.04);
    tl.to(RP,  { duration: 0.10, wx: R_UP.wx, wy: R_UP.wy, grip: 1, onUpdate: UA }, AP + 0.04);
    tl.to(gProxy, { duration: 0.10, y: -175, onUpdate: UA }, AP + 0.04);
    tl.to(gearR,  { duration: 0.10, rot: -120, onUpdate: UA }, AP + 0.04);
    tl.to(s1, { duration: 0.10, y: -(VH - SECTION_OFFSET) }, AP + 0.04);
    // Bento cards stagger in
    tl.to(boxes[0], { duration: 0.03, opacity: 1, y: 0 }, AP + 0.05);
    tl.to(boxes[1], { duration: 0.03, opacity: 1, y: 0 }, AP + 0.065);
    tl.to(boxes[2], { duration: 0.03, opacity: 1, y: 0 }, AP + 0.08);
    tl.to(boxes[3], { duration: 0.025, opacity: 1, y: 0 }, AP + 0.09);
    tl.to(LP, { duration: 0.02, wx: 380, wy: 600, grip: 0, onUpdate: UA }, 0.138);
    tl.to(RP, { duration: 0.02, wx: 953, wy: 699, grip: 0, onUpdate: UA }, 0.138);
    // Hold
    tl.to(RP,    { duration: 0.015, grip: 0, onUpdate: UA }, AP + 0.14);
    tl.to(barOp, { duration: 0.015, b1: 1,   onUpdate: syncBarOp }, AP + 0.14);
    tl.to(RP,    { duration: 0.05, wx: R_INIT.wx, wy: R_INIT.wy, onUpdate: UA }, AP + 0.155);
    tl.to(gearR, { duration: 0.05, rot: 0, onUpdate: UA }, AP + 0.155);
    tl.to(LP,    { duration: 0.05, wx: 490, wy: 680, onUpdate: UA }, AP + 0.14);
    tl.to(gearL, { duration: 0.05, rot: -420, onUpdate: UA }, AP + 0.14);
    tl.to(LP,    { duration: 0.05, wx: 380, wy: 600, onUpdate: UA }, AP + 0.19);
    tl.to(gearL, { duration: 0.05, rot: -540, onUpdate: UA }, AP + 0.19);
    // Deconstruct
    tl.to(arsenalUL, { duration: 0.04, opacity: 0, width: '0%' }, AP + 0.205);
    [...arsenalChs].reverse().forEach((el, i) => {
      tl.to(el, { duration: 0.03, opacity: 0, y: -220, scale: 0.03, ease: 'power3.in' }, AP + 0.22 + i * 0.012);
    });
    [boxes[3], boxes[2], boxes[1], boxes[0]].forEach((b, i) => {
      if (b) tl.to(b, { duration: 0.035, opacity: 0, y: -120, scale: 0.06 }, AP + 0.22 + i * 0.02);
    });
    tl.to(s1, { duration: 0.04, opacity: 0 }, AP + 0.29);

    // ─────────────────────────────────────────────────────
    // BLUEPRINT SECTION (PP)
    // ─────────────────────────────────────────────────────
    const s2 = document.getElementById('section-2');
    const processChs = Array.from(document.querySelectorAll('.p-char:not(.spacer)'));
    const processUL  = document.getElementById('process-underline');
    const times = [1,2,3].map(n => document.getElementById(`time${n}`));

    if (s2) {
      gsap.set(s2, { opacity: 0, y: 0 });
      gsap.set(processChs[0], { opacity: 0, y: 400, scale: 0.4 });
      gsap.set(processChs.slice(1), { opacity: 0, y: 120 });
      gsap.set(processUL, { opacity: 0, scaleX: 0 });
      times.forEach(t => t && gsap.set(t, { opacity: 0, y: 70, scale: 0.88 }));
    }

    tl.to(LP,    { duration: 0.03, wx: L_DOWN.wx, wy: L_DOWN.wy + 50, grip: 0, onUpdate: UA }, PP - 0.01);
    tl.to(gearL, { duration: 0.03, rot: -200, onUpdate: UA }, PP - 0.01);
    tl.to(s2,    { duration: 0.015, opacity: 1 }, PP);
    tl.to(LP,    { duration: 0.015, grip: 1, onUpdate: UA }, PP);
    tl.to(barOp, { duration: 0.015, b2: 0.2, onUpdate: syncBarOp }, PP);
    tl.to(processChs[0], { duration: 0.04, opacity: 1, y: 0, scale: 1, ease: 'back.out(1.7)' }, PP);
    tl.to(processChs.slice(1), { duration: 0.03, opacity: 1, y: 0, stagger: 0.008 }, PP + 0.025);
    tl.to(processUL, { duration: 0.05, opacity: 1, scaleX: 1 }, PP + 0.04);
    tl.to(RP,    { duration: 0.08, wx: R_DOWN.wx, wy: R_DOWN.wy, grip: 0, onUpdate: UA }, PP + 0.035);
    tl.to(gearR, { duration: 0.08, rot: 240, onUpdate: UA }, PP + 0.035);
    tl.to(LP,    { duration: 0.10, wx: L_UP.wx, wy: L_UP.wy, grip: 1, onUpdate: UA }, PP + 0.04);
    tl.to(gProxy,{ duration: 0.10, y: -350, onUpdate: UA }, PP + 0.04);
    tl.to(gearL, { duration: 0.10, rot: 150, onUpdate: UA }, PP + 0.04);
    tl.to(s2,    { duration: 0.10, y: -(VH - BP_OFFSET) }, PP + 0.04);
    times.forEach((t, i) => {
      if (t) tl.to(t, { duration: 0.03, opacity: 1, y: 0, scale: 1 }, PP + 0.13 + i * 0.03);
    });
    // Hold
    tl.to(LP,    { duration: 0.015, grip: 0, onUpdate: UA }, PP + 0.14);
    tl.to(barOp, { duration: 0.015, b2: 1, onUpdate: syncBarOp }, PP + 0.14);
    tl.to(LP,    { duration: 0.05, wx: L_INIT.wx, wy: L_INIT.wy, onUpdate: UA }, PP + 0.155);
    tl.to(gearL, { duration: 0.05, rot: 0, onUpdate: UA }, PP + 0.155);
    tl.to(RP,    { duration: 0.04, wx: R_DOWN.wx - 60, wy: R_DOWN.wy - 50, onUpdate: UA }, PP + 0.14);
    tl.to(gearR, { duration: 0.04, rot: 380, onUpdate: UA }, PP + 0.14);
    tl.to(RP,    { duration: 0.04, wx: R_DOWN.wx, wy: R_DOWN.wy, onUpdate: UA }, PP + 0.18);
    // Deconstruct
    tl.to(processUL, { duration: 0.04, opacity: 0, scaleX: 0 }, PP + 0.24);
    [...processChs].reverse().forEach((el, i) => {
      tl.to(el, { duration: 0.03, opacity: 0, y: -220, scale: 0.03, ease: 'power3.in' }, PP + 0.26 + i * 0.012);
    });
    [...times].reverse().forEach((t, i) => {
      if (t) tl.to(t, { duration: 0.035, opacity: 0, y: -120, scale: 0.06 }, PP + 0.28 + i * 0.02);
    });
    tl.to('.p-char', { duration: 0.03, opacity: 0, force3D: true }, PP + 0.34);
    tl.to(s2, { duration: 0.04, opacity: 0 }, PP + 0.36);

    // ─────────────────────────────────────────────────────
    // CTA SECTION (CP)
    // ─────────────────────────────────────────────────────
    const s3  = document.getElementById('section-3');
    const cta = document.getElementById('cta');

    if (s3 && cta) {
      gsap.set(s3,  { opacity: 0, y: 0 });
      gsap.set(cta, { opacity: 0, y: 45 });
    }

    tl.to(RP,    { duration: 0.02, grip: 1, onUpdate: UA }, CP);
    tl.to(barOp, { duration: 0.02, b3: 0.2, onUpdate: syncBarOp }, CP);
    tl.to(s3,    { duration: 0.02, opacity: 1 }, CP);
    tl.to(cta,   { duration: 0.06, opacity: 1, y: 0 }, CP);
    tl.to(RP,    { duration: 0.08, wx: R_UP.wx, wy: R_UP.wy, grip: 1, onUpdate: UA }, CP + 0.02);
    tl.to(gProxy,{ duration: 0.08, y: -490, onUpdate: UA }, CP + 0.02);
    tl.to(gearR, { duration: 0.08, rot: -280, onUpdate: UA }, CP + 0.02);
    tl.to(s3,    { duration: 0.08, y: -(VH - SECTION_OFFSET) }, CP + 0.02);
    tl.to(RP,    { duration: 0.015, grip: 0, onUpdate: UA }, CP + 0.10);
    tl.to(barOp, { duration: 0.03, b3: 1, onUpdate: syncBarOp }, CP + 0.10);
    // Offering pose
    tl.to(LP,    { duration: 0.12, wx: 520, wy: 600, grip: 0, onUpdate: UA }, CP + 0.10);
    tl.to(RP,    { duration: 0.12, wx: 680, wy: 600, grip: 0, onUpdate: UA }, CP + 0.10);
    tl.to(gearL, { duration: 0.12, rot: -60, onUpdate: UA }, CP + 0.10);
    tl.to(gearR, { duration: 0.12, rot:  60, onUpdate: UA }, CP + 0.10);

    // ─────────────────────────────────────────────────────
    // TYPEWRITER SCROLL TRIGGERS
    // ─────────────────────────────────────────────────────
    let b1done = false, b2done = false, b3done = false, b4done = false;

    ScrollTrigger.create({
      trigger: 'body',
      start: `${Math.round(MAX_S * (AP + 0.06))} top`,
      onEnter: () => {
        if (!b1done) {
          b1done = true;
          const chars = document.querySelectorAll('#box1 .tw-char');
          gsap.to(chars, { opacity: 1, duration: 0.035, stagger: 0.045, ease: 'none', delay: 0.05 });
        }
      },
      onLeaveBack: () => {
        b1done = false;
        document.querySelectorAll('#box1 .tw-char').forEach(c => { c.style.opacity = '0'; });
      },
    });
    ScrollTrigger.create({
      trigger: 'body',
      start: `${Math.round(MAX_S * (AP + 0.075))} top`,
      onEnter: () => {
        if (!b2done) {
          b2done = true;
          const chars = document.querySelectorAll('#box2 .tw-char');
          gsap.to(chars, { opacity: 1, duration: 0.035, stagger: 0.04, ease: 'none', delay: 0.05 });
        }
      },
      onLeaveBack: () => {
        b2done = false;
        document.querySelectorAll('#box2 .tw-char').forEach(c => { c.style.opacity = '0'; });
      },
    });
    ScrollTrigger.create({
      trigger: 'body',
      start: `${Math.round(MAX_S * (AP + 0.09))} top`,
      onEnter: () => {
        if (!b3done) {
          b3done = true;
          const chars = document.querySelectorAll('#box3 .tw-char');
          gsap.to(chars, { opacity: 1, duration: 0.035, stagger: 0.045, ease: 'none', delay: 0.05 });
        }
      },
      onLeaveBack: () => {
        b3done = false;
        document.querySelectorAll('#box3 .tw-char').forEach(c => { c.style.opacity = '0'; });
      },
    });

    // Mobile modal scroll fix
    const isMobile = window.matchMedia('(max-width:768px)').matches;
    if (isMobile) {
      const modalEl = document.querySelector('.modal-overlay');
      if (modalEl) {
        const observer = new MutationObserver(() => {
          document.body.style.overflow = modalEl.classList.contains('open') ? 'hidden' : '';
        });
        observer.observe(modalEl, { attributes: true, attributeFilter: ['class'] });
      }
    }

    return () => {
      ScrollTrigger.getAll().forEach(t => t.kill());
    };
  });

  onDestroy(() => {
    window.removeEventListener('scroll', onScroll);
    ScrollTrigger.getAll().forEach(t => t.kill());
  });
</script>

<!-- ─── TOP NAV ────────────────────────────────────────────── -->
<nav class="ver-nav" aria-label="Site navigation">
  <span>🌍 ARDY W | COSMIC</span>
</nav>

<!-- ─── TOP INITIATE BUTTON ─────────────────────────────────── -->
<button
  class="initiate-btn-top"
  on:click={() => modalOpen.set(true)}
  aria-haspopup="dialog"
>
  ⚡ INITIATE BUILD SEQUENCE
  <span class="btn-helper">click here to send a message</span>
</button>

<!-- ─── ADMIN BUTTON ─────────────────────────────────────────── -->
<button
  class="admin-btn"
  title="Admin"
  aria-label="Open admin panel"
  on:click={() => adminOpen.set(true)}
>
  🔐
</button>

<!-- ─── STAR FIELD (canvas, physics-driven) ──────────────────── -->
<StarField />

<!-- ─── ROBOT + ARMS (IK system) ─────────────────────────────── -->
<RobotBackground
  bind:this={robotBg}
  {LP} {RP} {gearL} {gearR} {gProxy}
  {gearScrollAccum}
/>

<!-- ─── HERO CARD ────────────────────────────────────────────── -->
<HeroCard maxScroll={MAX_S} />

<!-- ─── CONTENT LAYER ────────────────────────────────────────── -->
<div class="content-layer" id="content-layer">
  <ArsenalSection  grabBarOpacity={grabBar1Op} />
  <BlueprintSection grabBarOpacity={grabBar2Op} />
  <CTASection      grabBarOpacity={grabBar3Op} />
</div>

<!-- ─── MODALS ────────────────────────────────────────────────── -->
<InitiateModal />
<AdminInbox />

<style>
  /* App-level: body height is set by JS (5× viewport) */
  :global(body) { overflow-x: hidden; }
</style>
