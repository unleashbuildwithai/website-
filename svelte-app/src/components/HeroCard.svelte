<script>
  import { onMount, onDestroy } from 'svelte';
  import { modalOpen } from '../lib/stores.js';
  import gsap from 'gsap';

  // ── Props
  export let maxScroll = 1;  // MAX_S — set by App.svelte after setup

  // ── Refs
  let flipCardEl;
  let flipInnerEl;
  let scrollPromptEl;

  // ── State
  let cardRot           = 0;
  let mouseX            = 0;
  let isHovering        = false;
  let hoverSpinVelocity = 0;
  let scrollSpinAccum   = 0;
  let animId;

  // ── Mobile flip
  let mobileFlipped = false;
  let tapFlipping   = false;
  const mcp = { r: 0 };
  let tapHintVisible = true;

  const isTouchDevice = () =>
    typeof window !== 'undefined' && (('ontouchstart' in window) || navigator.maxTouchPoints > 0);

  // ── Mouse tilt + hover spin loop
  function cardLoop() {
    animId = requestAnimationFrame(cardLoop);
    if (!flipInnerEl || !maxScroll) return;
    if (window.scrollY / maxScroll > 0.09) return;

    isHovering
      ? (hoverSpinVelocity += 0.4)
      : (hoverSpinVelocity *= 0.95);

    const centerX   = window.innerWidth / 2;
    const offsetX   = mouseX - centerX;
    const tiltTarget = (offsetX / centerX) * 15;
    const targetRot  = tiltTarget + hoverSpinVelocity + scrollSpinAccum;

    cardRot += (targetRot - cardRot) * 0.08;
    flipInnerEl.style.transform = `rotateY(${cardRot}deg)`;

    scrollSpinAccum *= 0.98;
  }

  function handleMouseMove(e) {
    if (window.scrollY / maxScroll > 0.09) return;
    mouseX = e.clientX;
  }
  function handleMouseEnter() {
    if (window.scrollY / maxScroll <= 0.09) isHovering = true;
  }
  function handleMouseLeave() { isHovering = false; }

  function handleWheel(e) {
    if (window.scrollY / maxScroll > 0.09) return;
    e.preventDefault();
    scrollSpinAccum += e.deltaY * 0.3;
  }

  // ── Mobile tap flip
  function handleTouchEnd(e) {
    if (tapFlipping) return;
    if (window.scrollY / maxScroll > 0.09) return;
    e.preventDefault();
    tapFlipping     = true;
    tapHintVisible  = false;

    const currentRot = mcp.r;
    const targetRot  = mobileFlipped
      ? Math.round(currentRot / 360) * 360
      : Math.round(currentRot / 360) * 360 + 180;

    mobileFlipped = !mobileFlipped;

    gsap.to(mcp, {
      r: targetRot,
      duration: 0.7,
      ease: 'power2.inOut',
      onUpdate: () => { if (flipInnerEl) flipInnerEl.style.transform = `rotateY(${mcp.r}deg)`; },
      onComplete: () => { tapFlipping = false; },
    });
  }

  // ── Orange scroll prompt: hide on first scroll
  function promptFade() {
    if (window.scrollY > 8 && scrollPromptEl) {
      gsap.set(scrollPromptEl, { opacity: 0 });
    }
    window.removeEventListener('scroll', promptFade);
  }

  onMount(() => {
    mouseX = window.innerWidth / 2;
    if (flipInnerEl) flipInnerEl.style.transition = 'none';

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    window.addEventListener('scroll',    promptFade,     { passive: true });

    if (!isTouchDevice()) {
      animId = requestAnimationFrame(cardLoop);
    }
  });

  onDestroy(() => {
    cancelAnimationFrame(animId);
    window.removeEventListener('mousemove', handleMouseMove);
    window.removeEventListener('scroll',    promptFade);
  });
</script>

<!-- Hero wrapper — centred, fixed, perspective -->
<div class="hero-wrapper">
  <section class="hero-section" id="hero-card">

    <!-- Flip card -->
    <div
      class="flip-card"
      bind:this={flipCardEl}
      role="button"
      tabindex="0"
      aria-label="Profile card — hover or scroll wheel to interact"
      on:mouseenter={handleMouseEnter}
      on:mouseleave={handleMouseLeave}
      on:wheel|passive={handleWheel}
      on:touchend={isTouchDevice() ? handleTouchEnd : null}
      on:keydown={e => e.key === 'Enter' && (isTouchDevice() ? handleTouchEnd(e) : null)}
    >
      <div class="flip-card-inner" bind:this={flipInnerEl}>

        <!-- ── FRONT ── -->
        <div class="flip-card-front">
          <div class="pitch-section">
            <div class="pitch-headline">Got a vision, but blocked by development costs?</div>
            <p class="pitch-body">Skip the $150/hr agency fees and heavy retainers. I leverage cutting-edge AI to build smarter, faster, and leaner.</p>
            <div class="pitch-highlight">Zero risk. Pay a flat $1,000 only when I deliver your working MVP.</div>
          </div>
          <div class="contact-section">
            <div class="name">ardy W</div>
            <div class="info-group">
              <div class="label">Email</div>
              <div class="value">unleashbuildwithai@gmail.com</div>
            </div>
          </div>
        </div>

        <!-- ── BACK ── -->
        <div class="flip-card-back">
          <div class="back-content">
            <div class="neon-text">
              <span class="letter-g">G
                <div class="robot-wrapper">
                  <!-- Inline mini-robot SVG -->
                  <svg class="robot-svg" viewBox="0 0 140 140" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                    <defs>
                      <filter id="pt3" x="-10%" y="-10%" width="120%" height="120%">
                        <feTurbulence type="fractalNoise" baseFrequency="0.08" numOctaves="4" result="n"/>
                        <feDisplacementMap in="SourceGraphic" in2="n" scale="1.5" xChannelSelector="R" yChannelSelector="G"/>
                      </filter>
                    </defs>
                    <line x1="22" y1="133" x2="118" y2="133" class="sketch-line"/>
                    <rect x="36" y="127" width="20" height="7" rx="2" class="sketch-line-thick"/>
                    <rect x="84" y="127" width="20" height="7" rx="2" class="sketch-line-thick"/>
                    <line x1="52" y1="97" x2="46" y2="114" class="sketch-line-thick" stroke-width="5"/>
                    <circle cx="46" cy="114" r="6" class="sketch-line"/><circle cx="46" cy="114" r="3" class="sketch-line-thick"/><circle cx="46" cy="114" r="1.5" class="neon-fill" opacity="0.6"/>
                    <line x1="46" y1="114" x2="45" y2="127" class="sketch-line-thick" stroke-width="4"/>
                    <line x1="88" y1="97" x2="94" y2="114" class="sketch-line-thick" stroke-width="5"/>
                    <circle cx="94" cy="114" r="6" class="sketch-line"/><circle cx="94" cy="114" r="3" class="sketch-line-thick"/><circle cx="94" cy="114" r="1.5" class="neon-fill" opacity="0.6"/>
                    <line x1="94" y1="114" x2="95" y2="127" class="sketch-line-thick" stroke-width="4"/>
                    <polygon points="42,50 100,50 106,97 36,97" class="sketch-line-thick"/>
                    <circle cx="70" cy="61" r="9" class="sketch-line"/><circle cx="70" cy="61" r="3.5" class="neon-fill" opacity="0.85"/>
                    <rect x="48" y="87" width="44" height="6" rx="2" class="sketch-line"/>
                    <path d="M 42 52 L 24 52 L 20 65 L 24 76 L 42 76 L 44 68 Z" class="sketch-line-thick"/>
                    <circle cx="22" cy="74" r="2.5" class="neon-fill" opacity="0.5"/>
                    <path d="M 98 52 L 116 52 L 120 65 L 116 76 L 98 76 L 96 68 Z" class="sketch-line-thick"/>
                    <circle cx="118" cy="74" r="2.5" class="neon-fill" opacity="0.5"/>
                    <line x1="22" y1="74" x2="14" y2="56" class="sketch-line-thick" stroke-width="5"/>
                    <line x1="14" y1="56" x2="8" y2="36" class="sketch-line-thick" stroke-width="4"/>
                    <circle cx="8" cy="36" r="2" class="neon-fill" opacity="0.65"/>
                    <line x1="7" y1="26" x2="8" y2="18" class="neon-accent" stroke-width="2.5"/>
                    <circle cx="8" cy="16" r="5" class="welding-spark"/>
                    <line x1="118" y1="74" x2="128" y2="88" class="sketch-line-thick" stroke-width="5"/>
                    <line x1="128" y1="88" x2="134" y2="76" class="sketch-line-thick" stroke-width="4"/>
                    <path d="M 44 14 L 92 14 L 101 22 L 102 40 L 94 46 L 42 46 L 34 40 L 34 22 Z" class="sketch-line-thick"/>
                    <rect x="42" y="20" width="52" height="17" rx="4" class="sketch-line-thick"/>
                    <circle cx="57" cy="29" r="3.5" class="neon-fill"/>
                    <circle cx="77" cy="29" r="3.5" class="neon-fill"/>
                    <circle cx="68" cy="4" r="2.5" class="neon-fill"/>
                  </svg>
                  <!-- Welding sparks -->
                  <div class="falling-sparks" aria-hidden="true">
                    <i></i><i></i><i></i><i></i>
                  </div>
                </div>
              </span>enius
            </div>

            <div class="sub-text-container">
              <div class="neon-line"></div>
              <div class="small-robot-wrapper" aria-hidden="true">
                <svg viewBox="0 0 50 60" xmlns="http://www.w3.org/2000/svg">
                  <defs>
                    <filter id="pts3" x="-20%" y="-20%" width="140%" height="140%">
                      <feTurbulence type="fractalNoise" baseFrequency="0.09" numOctaves="3" result="n"/>
                      <feDisplacementMap in="SourceGraphic" in2="n" scale="1" xChannelSelector="R" yChannelSelector="G"/>
                    </filter>
                  </defs>
                  <line x1="25" y1="4" x2="25" y2="1" class="slt4"/><circle cx="25" cy="1" r="1.5" class="nc4"/>
                  <rect x="14" y="4" width="22" height="15" rx="4" class="slt4"/>
                  <rect x="17" y="7" width="16" height="9" rx="2" class="sl4"/>
                  <path d="M 18 12 Q 21 9 23 12" fill="none" stroke="#00ffcc" stroke-width="1.5"/>
                  <path d="M 27 12 Q 30 9 32 12" fill="none" stroke="#00ffcc" stroke-width="1.5"/>
                  <rect x="13" y="19" width="24" height="9" rx="3" class="slt4"/>
                  <circle cx="25" cy="24" r="1.5" class="nc4"/>
                  <path d="M 13 22 Q 8 24 7 27" class="slt4"/><circle cx="7" cy="27" r="1.5" class="nc4"/>
                  <path d="M 37 22 Q 42 24 43 27" class="slt4"/><circle cx="43" cy="27" r="1.5" class="nc4"/>
                  <line x1="17" y1="28" x2="33" y2="28" class="sl4" opacity="0.5"/>
                  <g>
                    <line x1="19" y1="28" x2="17" y2="40" class="slt4">
                      <animateTransform attributeName="transform" type="rotate" values="-20 19 28; 24 19 28; -20 19 28" dur="1.4s" repeatCount="indefinite"/>
                    </line>
                    <circle cx="17" cy="40" r="1.8" class="sl4">
                      <animateTransform attributeName="transform" type="rotate" values="-20 19 28; 24 19 28; -20 19 28" dur="1.4s" repeatCount="indefinite"/>
                    </circle>
                    <line x1="17" y1="40" x2="13" y2="50" class="slt4">
                      <animateTransform attributeName="transform" type="rotate" values="-20 19 28; 24 19 28; -20 19 28" dur="1.4s" repeatCount="indefinite"/>
                    </line>
                    <line x1="10" y1="50" x2="16" y2="50" class="slt4">
                      <animateTransform attributeName="transform" type="rotate" values="-20 19 28; 24 19 28; -20 19 28" dur="1.4s" repeatCount="indefinite"/>
                    </line>
                  </g>
                  <g>
                    <line x1="31" y1="28" x2="33" y2="40" class="slt4">
                      <animateTransform attributeName="transform" type="rotate" values="24 31 28; -20 31 28; 24 31 28" dur="1.4s" repeatCount="indefinite"/>
                    </line>
                    <circle cx="33" cy="40" r="1.8" class="sl4">
                      <animateTransform attributeName="transform" type="rotate" values="24 31 28; -20 31 28; 24 31 28" dur="1.4s" repeatCount="indefinite"/>
                    </circle>
                    <line x1="33" y1="40" x2="37" y2="50" class="slt4">
                      <animateTransform attributeName="transform" type="rotate" values="24 31 28; -20 31 28; 24 31 28" dur="1.4s" repeatCount="indefinite"/>
                    </line>
                    <line x1="34" y1="50" x2="40" y2="50" class="slt4">
                      <animateTransform attributeName="transform" type="rotate" values="24 31 28; -20 31 28; 24 31 28" dur="1.4s" repeatCount="indefinite"/>
                    </line>
                  </g>
                </svg>
              </div>
              <div class="sub-text">Unleashed</div>
            </div>
          </div>
        </div>

      </div>
    </div>

    <!-- Scroll indicator -->
    <div class="scroll-indicator" bind:this={scrollPromptEl} aria-live="polite">
      ▼ Scroll to Initiate Build Sequence ▼
    </div>

    <!-- Touch hint -->
    {#if isTouchDevice() && tapHintVisible}
      <div class="tap-hint" aria-hidden="true">👆 Tap card to flip</div>
    {/if}

  </section>
</div>

<style>
/* ─── Hero wrapper ───────────────────────────────────────── */
.hero-wrapper {
  position: fixed;
  top: 0; left: 0;
  width: 100vw; height: 100vh;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  perspective: 1200px;
  z-index: 10;
  pointer-events: none;
}
.hero-section {
  transform-origin: center;
  will-change: transform, opacity;
  pointer-events: auto;
  position: relative;
}

/* ─── Flip card ──────────────────────────────────────────── */
.flip-card {
  background-color: transparent;
  width: 350px;
  height: 480px;
  perspective: 1000px;
  cursor: pointer;
}
.flip-card-inner {
  position: relative;
  width: 100%; height: 100%;
  text-align: center;
  transform-style: preserve-3d;
}
.flip-card-front,
.flip-card-back {
  position: absolute;
  width: 100%; height: 100%;
  -webkit-backface-visibility: hidden;
  backface-visibility: hidden;
  border-radius: 20px;
  overflow: hidden;
}
.flip-card-front {
  background: rgba(8, 12, 24, 0.94);
  backdrop-filter: blur(30px);
  border: 1px solid rgba(0, 255, 204, 0.45);
  border-top:  1px solid rgba(0, 255, 204, 0.85);
  border-left: 1px solid rgba(0, 255, 204, 0.85);
  box-shadow: inset 0 0 50px rgba(0,255,204,.12), 0 25px 60px rgba(0,5,20,.97), 0 0 25px rgba(0,255,204,.2);
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  align-items: flex-start;
  padding: 35px 25px;
  text-align: left;
}
.flip-card-back {
  background-color: #0c1424;
  transform: rotateY(180deg);
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  box-shadow: 0 25px 50px rgba(0,3,18,.95), 0 0 30px rgba(0,255,204,.15);
  border: 1px solid rgba(255,255,255,0.06);
}

/* ─── Front content ──────────────────────────────────────── */
.pitch-section { z-index: 2; display: flex; flex-direction: column; gap: 12px; }
.pitch-headline { color: #fff; font-size: 1.15rem; font-weight: 800; line-height: 1.3; text-transform: uppercase; letter-spacing: 1px; text-shadow: 0 0 10px rgba(0,255,204,.4); }
.pitch-body     { color: #e2e8f0; font-size: .85rem; line-height: 1.5; opacity: .9; }
.pitch-highlight { color: #00ffcc; font-size: .9rem; font-weight: 700; border-left: 3px solid #00ffcc; padding-left: 12px; margin-top: 5px; line-height: 1.4; }
.contact-section { z-index: 2; display: flex; flex-direction: column; align-items: flex-start; gap: 12px; width: 100%; }
.name { font-size: 1.8rem; font-weight: 900; color: #fff; text-transform: uppercase; letter-spacing: 3px; text-shadow: 0 0 15px rgba(0,255,204,.8), 0 0 30px rgba(0,255,204,.4); margin-bottom: 5px; width: 100%; border-bottom: 1px solid rgba(0,255,204,.3); padding-bottom: 10px; }
.info-group { display: flex; flex-direction: column; align-items: flex-start; gap: 2px; }
.label { font-size: .7rem; color: #00ffcc; text-transform: uppercase; letter-spacing: 2px; font-weight: bold; opacity: .8; }
.value { font-size: .95rem; color: #e2e8f0; font-weight: 500; letter-spacing: 1px; }

/* ─── Back content ───────────────────────────────────────── */
.back-content { position: relative; z-index: 2; display: flex; flex-direction: column; align-items: center; }
.neon-text { font-size: 3.5rem; font-weight: 900; color: #fff; text-transform: uppercase; letter-spacing: 4px; text-shadow: 0 0 5px #fff, 0 0 10px #fff, 0 0 20px #00ffcc, 0 0 40px #00ffcc, 0 0 80px #00ffcc; margin-bottom: 25px; display: flex; align-items: center; justify-content: center; }
.letter-g { position: relative; display: inline-block; z-index: 1; }
.robot-wrapper { position: absolute; bottom: -5px; left: 50%; transform: translateX(-50%); width: 90px; height: 90px; pointer-events: none; z-index: -1; }
.robot-svg { width: 100%; height: 100%; }

/* SVG sketch styles */
:global(.sketch-line)       { fill: none; stroke: #b0c4de; stroke-width: 1.5; stroke-linecap: round; stroke-linejoin: round; }
:global(.sketch-line-thick) { fill: none; stroke: #8a9cb5; stroke-width: 3;   stroke-linecap: round; stroke-linejoin: round; }
:global(.neon-accent)       { fill: none; stroke: #00ffcc; stroke-width: 2;   stroke-linecap: round; filter: drop-shadow(0 0 5px #00ffcc); }
:global(.neon-fill)         { fill: #00ffcc; filter: drop-shadow(0 0 8px #00ffcc); }
:global(.welding-spark)     { fill: #00ffcc; filter: drop-shadow(0 0 8px #00ffcc); animation: weld-pulse .3s ease-in-out infinite alternate; }
:global(.sl4)  { fill: none; stroke: #b0c4de; stroke-width: 1; stroke-linecap: round; }
:global(.slt4) { fill: none; stroke: #8a9cb5; stroke-width: 1.5; }
:global(.nc4)  { fill: #00ffcc; filter: drop-shadow(0 0 3px #00ffcc); }

@keyframes weld-pulse { from { r: 4; opacity: .7; } to { r: 8; opacity: 1; } }

/* Falling sparks */
.falling-sparks { position: absolute; top: 6px; left: 50%; transform: translateX(-50%); width: 1px; height: 1px; pointer-events: none; }
.falling-sparks :global(i) { display: block; position: absolute; width: 2px; height: 2px; background: #00ffcc; border-radius: 50%; box-shadow: 0 0 4px #00ffcc; animation: spark-fall .7s ease-in infinite; }
.falling-sparks :global(i:nth-child(1)) { left: -12px; animation-delay: 0s; }
.falling-sparks :global(i:nth-child(2)) { left:  -4px; animation-delay: .18s; }
.falling-sparks :global(i:nth-child(3)) { left:   4px; animation-delay: .07s; }
.falling-sparks :global(i:nth-child(4)) { left:  12px; animation-delay: .28s; }
@keyframes spark-fall { 0% { transform: translateY(0) scale(1); opacity: 1; } 100% { transform: translateY(28px) scale(0); opacity: 0; } }

/* Sub-text */
.sub-text-container { position: relative; display: flex; flex-direction: column; align-items: center; width: 82%; }
.neon-line { width: 100%; height: 2px; background: #00ffcc; box-shadow: 0 0 5px #00ffcc, 0 0 15px #00ffcc; margin-bottom: 18px; }
.sub-text { color: #00ffcc; font-size: .95rem; letter-spacing: 6px; text-transform: uppercase; font-weight: bold; opacity: .8; }
.small-robot-wrapper { position: absolute; top: -25px; left: 50%; transform: translateX(-50%); width: 38px; height: 52px; pointer-events: none; z-index: 1; }

/* Touch hint */
.tap-hint { position: absolute; bottom: -36px; left: 50%; transform: translateX(-50%); color: rgba(0,255,204,.55); font-size: .62rem; letter-spacing: 2px; text-transform: uppercase; white-space: nowrap; pointer-events: none; }

/* ─── Mobile ─────────────────────────────────────────────── */
@media (max-width: 768px) {
  .flip-card { width: min(340px, 88vw); height: 520px; min-height: 520px; }
  .flip-card-front { padding: 28px 20px; }
  .pitch-headline { font-size: 1.05rem; }
  .name { font-size: 1.6rem; }
}
@media (max-width: 480px) {
  .flip-card { width: min(320px, 93vw); height: 480px; min-height: 480px; }
  .flip-card-front { padding: 24px 16px; }
  .pitch-headline { font-size: .92rem; }
  .name { font-size: 1.3rem; }
  .neon-text { font-size: 1.9rem; }
}
@media (max-width: 360px) {
  .flip-card { width: 96vw; height: 450px; min-height: 450px; }
  .neon-text { font-size: 1.6rem; }
}
</style>
