<script>
  import { onMount, onDestroy } from 'svelte';
  import { scrollVelocity } from '../lib/stores.js';

  // ── Canvas ref
  let canvas;
  let ctx;
  let animId;

  // ── Scroll input (from store)
  let velocity = 0;
  const unsubVel = scrollVelocity.subscribe(v => { velocity = v; });

  // ─────────────────────────────────────────────────────────
  // DRIFT STATE
  // Stars ALWAYS drift. Scroll changes direction + speed.
  // ─────────────────────────────────────────────────────────
  const BASE_DRIFT    = 0.18;   // idle drift speed (px/frame) — always rolling
  const VELOCITY_DEAD = 0.6;    // below this = "no active scroll input"
  const WARP_THRESHOLD = 40;    // px/frame → warp colour mode

  let driftVelocity = BASE_DRIFT;  // starts drifting upward by default

  // ── Star count + array
  const STAR_COUNT = 220;
  const stars      = [];

  // ─────────────────────────────────────────────────────────
  // STAR FACTORY
  // Each star gets:
  //  - Random position
  //  - Depth layer (driftMult) → different speeds → NO straight lines
  //  - Twinkle personality
  // ─────────────────────────────────────────────────────────
  function createStar(w, h) {
    const twinkleType = Math.floor(Math.random() * 4);
    const speeds = [0.005, 0.026, 0.008, 0.003];
    const depths = [0.50,  0.85,  0.90,  0.15 ];

    return {
      // Random scatter — NO grid, NO lines
      x: Math.random() * w,
      y: Math.random() * h,

      // Size & base brightness
      size:        Math.random() * 1.8 + 0.2,
      baseOpacity: Math.random() * 0.6 + 0.2,

      // Depth layer: 0.5 (far/slow) → 1.6 (close/fast)
      // This creates parallax so stars never appear in sync straight lines
      driftMult: 0.5 + Math.random() * Math.random() * 1.1,

      // Twinkle personality
      twinkleType,
      twinkleSpeed: speeds[twinkleType] * (0.6 + Math.random() * 0.7),
      twinkleDepth: depths[twinkleType],
      twinklePhase: Math.random() * Math.PI * 2,

      // ~20% neon blue accents
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
  // STRETCH STATE (for trail effect)
  // ─────────────────────────────────────────────────────────
  let stretch       = 1;
  let stretchTarget = 1;

  // ─────────────────────────────────────────────────────────
  // MAIN RENDER LOOP
  // ─────────────────────────────────────────────────────────
  function loop() {
    animId = requestAnimationFrame(loop);
    if (!ctx || !canvas) return;

    const W    = canvas.width;
    const H    = canvas.height;
    const absV = Math.abs(velocity);
    const isWarp = absV > WARP_THRESHOLD;

    // ── DRIFT VELOCITY UPDATE ─────────────────────────────
    const scrollActive = absV > VELOCITY_DEAD;

    if (scrollActive) {
      // Active scroll: INSTANTLY set direction, amplify speed
      const dir = Math.sign(velocity);             // -1 or +1
      const mag = Math.min(absV, 80);              // cap at 80px/frame
      driftVelocity = dir * (BASE_DRIFT + mag * 0.22);
    } else {
      // No scroll input: decay back toward base drift
      // Preserves current direction — always keeps rolling
      const targetBase = Math.sign(driftVelocity) * BASE_DRIFT;
      driftVelocity += (targetBase - driftVelocity) * 0.04;
      // Floor to base speed so it never fully stops
      if (Math.abs(driftVelocity) < BASE_DRIFT * 0.95) {
        driftVelocity = Math.sign(driftVelocity) * BASE_DRIFT;
      }
    }

    // ── STRETCH (trail physics) ───────────────────────────
    if (!scrollActive) {
      // Snap back fast when not scrolling
      stretch = 1 + (stretch - 1) * 0.70;
      if (stretch < 1.015) stretch = 1;
      stretchTarget = 1;
    } else {
      let target;
      if (absV < WARP_THRESHOLD) {
        target = 1 + absV * 0.065;
      } else {
        target = 1 + WARP_THRESHOLD * 0.065 + (absV - WARP_THRESHOLD) * 0.10;
      }
      stretchTarget = Math.min(target, 7);
      stretch += (stretchTarget - stretch) * 0.50;
    }

    // ── CLEAR ─────────────────────────────────────────────
    ctx.clearRect(0, 0, W, H);

    // ── DRAW EACH STAR ────────────────────────────────────
    for (const s of stars) {

      // ── DRIFT — each star moves at its own depth rate ────
      // driftMult breaks up any straight-line synchronization
      s.y += driftVelocity * s.driftMult;

      // Seamless vertical wrap
      if (s.y > H + 20) s.y = -20;
      if (s.y < -20)    s.y = H + 20;

      // ── TWINKLE ───────────────────────────────────────────
      s.twinklePhase += s.twinkleSpeed;
      const rawTwinkle = 0.5 + 0.5 * Math.sin(s.twinklePhase); // 0→1

      let alpha;
      if (!scrollActive) {
        // IDLE: amplify each star's personality
        const depthMix = s.twinkleDepth * rawTwinkle + (1 - s.twinkleDepth) * 0.4;
        alpha = s.baseOpacity * (0.25 + 0.75 * depthMix);
      } else {
        // SCROLLING: suppress twinkle — trails dominate
        alpha = s.baseOpacity * (0.85 + 0.15 * rawTwinkle);
      }

      // ── COLOUR ────────────────────────────────────────────
      let colour;
      if (isWarp && s.neon) {
        colour = `rgba(0, 243, 255, ${alpha})`;
      } else if (isWarp) {
        colour = `rgba(180, 220, 255, ${alpha})`;
      } else if (s.neon) {
        colour = `rgba(0, 243, 255, ${alpha * 0.6})`;
      } else {
        colour = `rgba(255, 255, 255, ${alpha})`;
      }

      // ── DRAW ──────────────────────────────────────────────
      ctx.save();
      ctx.translate(s.x, s.y);

      if (stretch > 1.05) {
        // TRAIL MODE: vertical ellipse, length scaled by depth
        const trailStretch = 1 + (stretch - 1) * s.driftMult;
        ctx.beginPath();
        ctx.ellipse(0, 0, s.size * 0.5, s.size * trailStretch * 0.5, 0, 0, Math.PI * 2);
        ctx.fillStyle = colour;
        if (absV > 15) {
          ctx.shadowColor = s.neon ? '#00f3ff' : '#ffffff';
          ctx.shadowBlur  = Math.min(absV * 0.28, 10);
        }
        ctx.fill();
        ctx.shadowBlur = 0;

      } else {
        // DOT MODE: crisp point with twinkle glow
        ctx.beginPath();
        ctx.arc(0, 0, s.size * 0.5, 0, Math.PI * 2);
        ctx.fillStyle = colour;

        if (!scrollActive) {
          // Enhanced glow cycles with twinkle
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
  }

  onMount(() => {
    ctx = canvas.getContext('2d');
    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight;

    // Seed stars with randomized positions + personalities
    for (let i = 0; i < STAR_COUNT; i++) {
      stars.push(createStar(canvas.width, canvas.height));
    }

    window.addEventListener('resize', resize, { passive: true });
    animId = requestAnimationFrame(loop);
  });

  onDestroy(() => {
    cancelAnimationFrame(animId);
    window.removeEventListener('resize', resize);
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
