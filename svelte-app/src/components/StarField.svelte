<script>
  import { onMount, onDestroy } from 'svelte';
  import { scrollVelocity } from '../lib/stores.js';

  // ── 10% star shower prop (set by App.svelte on load)
  export let showStarShower = false;

  // ── Canvas ref
  let canvas;
  let ctx;
  let animId;

  // ── Scroll input (from store)
  let velocity = 0;
  const unsubVel = scrollVelocity.subscribe(v => { velocity = v; });

  // ── Mouse position (for magnet + astigmatism glow on background stars)
  let mouseX = -9999;
  let mouseY = -9999;
  function onMouseMove(e) {
    mouseX = e.clientX;
    mouseY = e.clientY;
  }

  // ─────────────────────────────────────────────────────────
  // DRIFT STATE — regular background stars always drift
  // ─────────────────────────────────────────────────────────
  const BASE_DRIFT     = 0.18;
  const VELOCITY_DEAD  = 0.6;
  const WARP_THRESHOLD = 40;
  const DIR_FLIP_MIN   = 3.0;
  let driftVelocity    = BASE_DRIFT;

  // ── Background star array
  const STAR_COUNT = 220;
  const stars      = [];

  function createStar(w, h) {
    const twinkleType = Math.floor(Math.random() * 4);
    const speeds = [0.005, 0.026, 0.008, 0.003];
    const depths = [0.50,  0.85,  0.90,  0.15 ];
    return {
      x: Math.random() * w,
      y: Math.random() * h,
      size:         Math.random() * 1.8 + 0.2,
      baseOpacity:  Math.random() * 0.6 + 0.2,
      driftMult:    0.5 + Math.random() * Math.random() * 1.1,
      twinkleType,
      twinkleSpeed: speeds[twinkleType] * (0.6 + Math.random() * 0.7),
      twinkleDepth: depths[twinkleType],
      twinklePhase: Math.random() * Math.PI * 2,
      neon: Math.random() > 0.8,
    };
  }

  function resize() {
    if (!canvas) return;
    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight;
    for (const s of stars) {
      s.x = Math.random() * canvas.width;
      s.y = Math.random() * canvas.height;
    }
  }

  // ─────────────────────────────────────────────────────────
  // COSMIC SHOOTING STAR SYSTEM
  // ─────────────────────────────────────────────────────────
  const showerStars   = [];
  const impactFlashes = [];

  // ── 15-second shooting star timer
  let showerStartTime = 0;
  const SHOWER_DURATION = 15000; // 15 seconds then stop spawning

  const COSMIC_COLOURS = [
    { r: 0,   g: 243, b: 255 },  // neon cyan
    { r: 120, g: 80,  b: 255 },  // electric violet
    { r: 255, g: 60,  b: 180 },  // hot pink
    { r: 255, g: 200, b: 80  },  // gold
    { r: 180, g: 220, b: 255 },  // ice blue
    { r: 255, g: 255, b: 255 },  // pure white
  ];

  function randomColour() {
    return COSMIC_COLOURS[Math.floor(Math.random() * COSMIC_COLOURS.length)];
  }

  function spawnShootingStar(w, h) {
    const edge = Math.random();
    let x, y, angle;

    if (edge < 0.55) {
      x     = Math.random() * w * 1.3 - w * 0.15;
      y     = -20 - Math.random() * 150;
      angle = (Math.PI * 0.28) + (Math.random() - 0.5) * 0.55;
    } else if (edge < 0.8) {
      x     = -20 - Math.random() * 80;
      y     = Math.random() * h * 0.45;
      angle = (Math.PI * 0.12) + (Math.random() - 0.5) * 0.3;
    } else {
      x     = w + 20 + Math.random() * 80;
      y     = Math.random() * h * 0.35;
      angle = (Math.PI * 0.65) + (Math.random() - 0.5) * 0.3;
    }

    const speed    = 5 + Math.random() * 9;
    const colour   = randomColour();
    const trailLen = 55 + Math.random() * 120;

    return {
      x, y,
      vx:          Math.cos(angle) * speed,
      vy:          Math.sin(angle) * speed,
      size:        1.2 + Math.random() * 2.6,
      alpha:       0.7 + Math.random() * 0.3,
      colour,
      trailLen,
      glowRadius:  6 + Math.random() * 18,
      wobble:      (Math.random() - 0.5) * 0.012,
      angle,
      isColliding: false,
      collisionTarget: null,
      onImpact:    null,
    };
  }

  // ── Spawn cooldown
  let spawnCooldown         = 0;
  const SPAWN_INTERVAL_MIN  = 4;
  const SPAWN_INTERVAL_MAX  = 18;
  const MAX_SHOWER_STARS    = 40;

  // ─────────────────────────────────────────────────────────
  // PUBLIC API — called by App.svelte to redirect a live star
  // toward a breaking box. The star causes the break.
  // onImpact() callback fires the actual launchPuzzleFall.
  // ─────────────────────────────────────────────────────────
  export function fireCollisionStar(targetX, targetY, onImpact) {
    if (!canvas) { if (onImpact) onImpact(); return; }

    let star = null;
    let minDist = Infinity;
    for (const s of showerStars) {
      if (s.isColliding) continue;
      const d = Math.hypot(s.x - targetX, s.y - targetY);
      if (d < minDist) { minDist = d; star = s; }
    }

    if (!star) {
      star = {
        x:           targetX + (Math.random() - 0.5) * 320,
        y:           -80 - Math.random() * 60,
        vx:          0,
        vy:          0,
        size:        2.2 + Math.random() * 1.6,
        alpha:       1.0,
        colour:      randomColour(),
        trailLen:    90 + Math.random() * 70,
        glowRadius:  14 + Math.random() * 10,
        wobble:      0,
        angle:       0,
        isColliding: false,
        collisionTarget: null,
        onImpact:    null,
      };
      showerStars.push(star);
    }

    const dx    = targetX - star.x;
    const dy    = targetY - star.y;
    const dist  = Math.hypot(dx, dy) || 1;
    const speed = 18 + Math.random() * 8;
    star.vx     = (dx / dist) * speed;
    star.vy     = (dy / dist) * speed;
    star.angle  = Math.atan2(dy, dx);
    star.wobble = 0;
    star.trailLen = Math.max(star.trailLen, 100);

    star.isColliding    = true;
    star.collisionTarget = { x: targetX, y: targetY };
    star.onImpact        = onImpact || null;
  }

  // ─────────────────────────────────────────────────────────
  // STRETCH STATE (scroll trail on regular stars)
  // ─────────────────────────────────────────────────────────
  let stretch       = 1;
  let stretchTarget = 1;

  // ─────────────────────────────────────────────────────────
  // MAIN RENDER LOOP
  // ─────────────────────────────────────────────────────────
  function loop() {
    animId = requestAnimationFrame(loop);
    if (!ctx || !canvas) return;

    const W      = canvas.width;
    const H      = canvas.height;
    const absV   = Math.abs(velocity);
    const isWarp = absV > WARP_THRESHOLD;

    // ── DRIFT VELOCITY UPDATE ─────────────────────────────
    const scrollActive = absV > VELOCITY_DEAD;
    if (scrollActive) {
      const dir       = Math.sign(velocity);
      const mag       = Math.min(absV, 80);
      const targetVel = dir * (BASE_DRIFT + mag * 0.22);
      const isFlip    = Math.sign(targetVel) !== Math.sign(driftVelocity);
      if (isFlip && absV < DIR_FLIP_MIN) {
        driftVelocity = Math.sign(driftVelocity) * Math.max(BASE_DRIFT, Math.abs(driftVelocity) * 0.96);
      } else {
        driftVelocity = targetVel;
      }
    } else {
      const targetBase = Math.sign(driftVelocity) * BASE_DRIFT;
      driftVelocity   += (targetBase - driftVelocity) * 0.04;
      if (Math.abs(driftVelocity) < BASE_DRIFT * 0.95)
        driftVelocity = Math.sign(driftVelocity) * BASE_DRIFT;
    }

    // ── STRETCH ───────────────────────────────────────────
    if (!scrollActive) {
      stretch = 1 + (stretch - 1) * 0.70;
      if (stretch < 1.015) stretch = 1;
      stretchTarget = 1;
    } else {
      let target = absV < WARP_THRESHOLD
        ? 1 + absV * 0.065
        : 1 + WARP_THRESHOLD * 0.065 + (absV - WARP_THRESHOLD) * 0.10;
      stretchTarget = Math.min(target, 7);
      stretch += (stretchTarget - stretch) * 0.50;
    }

    // ── CLEAR ─────────────────────────────────────────────
    ctx.clearRect(0, 0, W, H);

    // ── BACKGROUND STARS ──────────────────────────────────
    const MAGNET_R = 230; // radius of cursor influence

    for (const s of stars) {
      // Regular drift
      s.y += driftVelocity * s.driftMult;
      if (s.y > H + 20) s.y = -20;
      if (s.y < -20)    s.y = H + 20;

      // ── CURSOR MAGNET: gentle pull toward mouse ────────
      const mdx   = mouseX - s.x;
      const mdy   = mouseY - s.y;
      const mdist = Math.hypot(mdx, mdy);
      let magnetT = 0;
      if (mdist < MAGNET_R && mdist > 0.5) {
        magnetT = 1 - mdist / MAGNET_R;         // 0→1 as star approaches cursor
        const pull = magnetT * magnetT * 0.42;  // very gentle pull
        s.x += (mdx / mdist) * pull;
        s.y += (mdy / mdist) * pull;
      }

      // Twinkle
      s.twinklePhase += s.twinkleSpeed;
      const rawTwinkle = 0.5 + 0.5 * Math.sin(s.twinklePhase);

      let alpha;
      if (!scrollActive) {
        const depthMix = s.twinkleDepth * rawTwinkle + (1 - s.twinkleDepth) * 0.4;
        alpha = s.baseOpacity * (0.25 + 0.75 * depthMix);
      } else {
        alpha = s.baseOpacity * (0.85 + 0.15 * rawTwinkle);
      }

      let colour;
      if      (isWarp && s.neon)  colour = `rgba(0,243,255,${alpha})`;
      else if (isWarp)            colour = `rgba(180,220,255,${alpha})`;
      else if (s.neon)            colour = `rgba(0,243,255,${alpha * 0.6})`;
      else                        colour = `rgba(255,255,255,${alpha})`;

      ctx.save();
      ctx.translate(s.x, s.y);

      // ── ASTIGMATISM RAINBOW DIFFRACTION GLOW (near cursor) ──
      // Like looking at starlight through astigmatic eyes — rainbow laser cross
      if (magnetT > 0.04) {
        const armLen = s.size * (5 + 32 * magnetT);
        const glowA  = magnetT * 0.22 * (0.35 + s.baseOpacity * 0.65);
        const brite  = Math.min(glowA * 2.4, 0.85);

        // Horizontal spike — warm rainbow l→r
        const hGrad = ctx.createLinearGradient(-armLen, 0, armLen, 0);
        hGrad.addColorStop(0,    `rgba(255, 20,160,${glowA})`);
        hGrad.addColorStop(0.25, `rgba( 50,110,255,${glowA * 0.9})`);
        hGrad.addColorStop(0.50, `rgba(255,255,255,${brite})`);
        hGrad.addColorStop(0.75, `rgba(  0,230,175,${glowA * 0.9})`);
        hGrad.addColorStop(1,    `rgba(255,130,  0,${glowA})`);
        ctx.fillStyle = hGrad;
        ctx.fillRect(-armLen, -s.size * 0.6, armLen * 2, s.size * 1.2);

        // Vertical spike — cool rainbow t→b
        const vGrad = ctx.createLinearGradient(0, -armLen, 0, armLen);
        vGrad.addColorStop(0,    `rgba(160,  0,255,${glowA})`);
        vGrad.addColorStop(0.25, `rgba(  0,200,255,${glowA * 0.9})`);
        vGrad.addColorStop(0.50, `rgba(255,255,255,${brite})`);
        vGrad.addColorStop(0.75, `rgba(255,220,  0,${glowA * 0.9})`);
        vGrad.addColorStop(1,    `rgba(255, 50, 50,${glowA})`);
        ctx.fillStyle = vGrad;
        ctx.fillRect(-s.size * 0.6, -armLen, s.size * 1.2, armLen * 2);
      }

      // ── STAR DOT (ellipse on warp, circle at rest) ────────
      if (stretch > 1.05) {
        const ts = 1 + (stretch - 1) * s.driftMult;
        ctx.beginPath();
        ctx.ellipse(0, 0, s.size * 0.5, s.size * ts * 0.5, 0, 0, Math.PI * 2);
        ctx.fillStyle = colour;
        if (absV > 15) {
          ctx.shadowColor = s.neon ? '#00f3ff' : '#ffffff';
          ctx.shadowBlur  = Math.min(absV * 0.28, 10);
        }
        ctx.fill();
        ctx.shadowBlur = 0;
      } else {
        ctx.beginPath();
        ctx.arc(0, 0, s.size * 0.5, 0, Math.PI * 2);
        ctx.fillStyle = colour;
        if (!scrollActive) {
          if (s.neon) {
            ctx.shadowColor = '#00f3ff';
            ctx.shadowBlur  = 3 + rawTwinkle * 10;
          } else if (rawTwinkle > 0.65) {
            ctx.shadowColor = '#ffffff';
            ctx.shadowBlur  = rawTwinkle * 7;
          }
        } else if (s.neon) {
          ctx.shadowColor = '#00f3ff';
          ctx.shadowBlur  = 4;
        }
        ctx.fill();
        ctx.shadowBlur = 0;
      }
      ctx.restore();
    }

    // ── IMPACT FLASHES (shockwave rings) ──────────────────
    for (let fi = impactFlashes.length - 1; fi >= 0; fi--) {
      const f = impactFlashes[fi];
      f.r1    = Math.min(f.r1 + 7, f.maxR);
      f.r2    = Math.min(f.r2 + 4, f.maxR * 0.55);
      f.alpha *= 0.80;
      if (f.alpha < 0.01) { impactFlashes.splice(fi, 1); continue; }

      const { r, g, b } = f.colour;

      ctx.beginPath();
      ctx.arc(f.x, f.y, f.r1, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(${r},${g},${b},${f.alpha * 0.75})`;
      ctx.lineWidth   = 2.5;
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(f.x, f.y, f.r2, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(255,255,255,${f.alpha * 0.55})`;
      ctx.lineWidth   = 1.5;
      ctx.stroke();

      if (f.alpha > 0.35) {
        const bg = ctx.createRadialGradient(f.x, f.y, 0, f.x, f.y, f.r2);
        bg.addColorStop(0,   `rgba(255,255,255,${f.alpha * 0.7})`);
        bg.addColorStop(0.4, `rgba(${r},${g},${b},${f.alpha * 0.4})`);
        bg.addColorStop(1,   `rgba(${r},${g},${b},0)`);
        ctx.beginPath();
        ctx.arc(f.x, f.y, f.r2, 0, Math.PI * 2);
        ctx.fillStyle = bg;
        ctx.fill();
      }
    }

    // ── COSMIC SHOOTING STARS (10% chance, 15-second window) ─
    if (showStarShower) {
      // ── Start timer on first frame ─────────────────────
      if (!showerStartTime) showerStartTime = performance.now();
      const showerActive = (performance.now() - showerStartTime) < SHOWER_DURATION;

      // Spawn new stars only within the 15-second window
      if (showerActive) {
        spawnCooldown--;
        if (spawnCooldown <= 0 && showerStars.length < MAX_SHOWER_STARS) {
          const count = Math.random() < 0.25 ? 2 : 1;
          for (let i = 0; i < count; i++) showerStars.push(spawnShootingStar(W, H));
          spawnCooldown = SPAWN_INTERVAL_MIN +
            Math.floor(Math.random() * (SPAWN_INTERVAL_MAX - SPAWN_INTERVAL_MIN));
        }
      }

      // Always draw & update existing stars (even after timer expires)
      let si = showerStars.length;
      while (si--) {
        const ss = showerStars[si];

        if (ss.isColliding && ss.collisionTarget) {
          // ── COLLISION PATH: home in on target ────────────
          const dx   = ss.collisionTarget.x - ss.x;
          const dy   = ss.collisionTarget.y - ss.y;
          const dist = Math.hypot(dx, dy);

          if (dist < 55) {
            impactFlashes.push({
              x: ss.collisionTarget.x,
              y: ss.collisionTarget.y,
              r1: 0, r2: 0, maxR: 105,
              alpha: 1.0,
              colour: ss.colour,
            });
            if (ss.onImpact) ss.onImpact();
            showerStars.splice(si, 1);
            continue;
          }

          const speed = Math.hypot(ss.vx, ss.vy);
          ss.vx = (dx / dist) * speed;
          ss.vy = (dy / dist) * speed;
          ss.angle = Math.atan2(ss.vy, ss.vx);

        } else {
          // ── FREE PATH: natural wobble ─────────────────────
          ss.angle += ss.wobble;
          ss.vx = Math.cos(ss.angle) * Math.hypot(ss.vx, ss.vy);
          ss.vy = Math.sin(ss.angle) * Math.hypot(ss.vx, ss.vy);
        }

        ss.x += ss.vx;
        ss.y += ss.vy;

        if (
          !ss.isColliding && (
            ss.y > H + ss.trailLen + 60 ||
            ss.x < -ss.trailLen - 60 ||
            ss.x > W + ss.trailLen + 60
          )
        ) {
          showerStars.splice(si, 1);
          continue;
        }

        // ── Fade in/out at edges ──────────────────────────
        const fadeInY    = Math.min(1, Math.max(0, (ss.y + 80) / 100));
        const fadeOutX   = Math.min(1, Math.max(0, Math.min(ss.x / 60, (W - ss.x) / 60)));
        const fadeOutB   = Math.min(1, Math.max(0, (H + 60 - ss.y) / 80));
        const finalAlpha = ss.isColliding
          ? ss.alpha
          : ss.alpha * fadeInY * fadeOutX * fadeOutB;

        const { r, g, b } = ss.colour;

        ctx.save();
        ctx.translate(ss.x, ss.y);
        ctx.rotate(ss.angle - Math.PI / 2);

        // Outer glow halo
        const haloGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, ss.glowRadius * 2.2);
        haloGrad.addColorStop(0,   `rgba(${r},${g},${b},${finalAlpha * 0.35})`);
        haloGrad.addColorStop(0.5, `rgba(${r},${g},${b},${finalAlpha * 0.12})`);
        haloGrad.addColorStop(1,   `rgba(${r},${g},${b},0)`);
        ctx.beginPath();
        ctx.arc(0, 0, ss.glowRadius * 2.2, 0, Math.PI * 2);
        ctx.fillStyle = haloGrad;
        ctx.fill();

        // Trail
        const trailGrad = ctx.createLinearGradient(0, 0, 0, -ss.trailLen);
        trailGrad.addColorStop(0,    `rgba(${r},${g},${b},${finalAlpha})`);
        trailGrad.addColorStop(0.2,  `rgba(${r},${g},${b},${finalAlpha * 0.65})`);
        trailGrad.addColorStop(0.55, `rgba(${r},${g},${b},${finalAlpha * 0.25})`);
        trailGrad.addColorStop(1,    `rgba(${r},${g},${b},0)`);
        const hw = ss.size, tw = ss.size * 0.18;
        ctx.beginPath();
        ctx.moveTo(-hw * 0.5, 0);
        ctx.lineTo(-tw * 0.5, -ss.trailLen);
        ctx.lineTo( tw * 0.5, -ss.trailLen);
        ctx.lineTo( hw * 0.5, 0);
        ctx.closePath();
        ctx.fillStyle = trailGrad;
        ctx.fill();

        // Bright core
        const coreGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, ss.size * 1.6);
        coreGrad.addColorStop(0,   `rgba(255,255,255,${finalAlpha})`);
        coreGrad.addColorStop(0.3, `rgba(${r},${g},${b},${finalAlpha * 0.9})`);
        coreGrad.addColorStop(0.7, `rgba(${r},${g},${b},${finalAlpha * 0.4})`);
        coreGrad.addColorStop(1,   `rgba(${r},${g},${b},0)`);
        ctx.beginPath();
        ctx.arc(0, 0, ss.size * 1.6, 0, Math.PI * 2);
        ctx.fillStyle    = coreGrad;
        ctx.shadowColor  = `rgb(${r},${g},${b})`;
        ctx.shadowBlur   = ss.isColliding ? ss.glowRadius * 1.8 : ss.glowRadius;
        ctx.fill();
        ctx.shadowBlur = 0;

        // Lens-flare cross on big stars
        if (ss.size > 2.8) {
          ctx.strokeStyle = `rgba(255,255,255,${finalAlpha * 0.6})`;
          ctx.lineWidth   = 0.8;
          const arm = ss.size * 4.5;
          ctx.beginPath();
          ctx.moveTo(-arm, 0); ctx.lineTo(arm, 0);
          ctx.moveTo(0, -arm); ctx.lineTo(0, arm);
          ctx.stroke();
        }

        ctx.restore();
      }
    }
  }

  onMount(() => {
    ctx = canvas.getContext('2d');
    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight;

    for (let i = 0; i < STAR_COUNT; i++) {
      stars.push(createStar(canvas.width, canvas.height));
    }

    // Pre-seed shooting stars immediately on load
    if (showStarShower) {
      for (let i = 0; i < 8; i++) {
        const ss = spawnShootingStar(canvas.width, canvas.height);
        ss.y = Math.random() * canvas.height * 0.6;
        showerStars.push(ss);
      }
    }

    window.addEventListener('resize', resize, { passive: true });
    window.addEventListener('mousemove', onMouseMove, { passive: true });
    animId = requestAnimationFrame(loop);
  });

  onDestroy(() => {
    cancelAnimationFrame(animId);
    window.removeEventListener('resize', resize);
    window.removeEventListener('mousemove', onMouseMove);
    unsubVel();
  });
</script>

<canvas
  bind:this={canvas}
  aria-hidden="true"
></canvas>

<style>
  canvas {
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    z-index: -1;
    pointer-events: none;
  }
</style>
