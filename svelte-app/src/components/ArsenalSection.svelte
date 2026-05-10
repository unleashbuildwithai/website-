<script>
  // ── Props: opacity driven by GSAP via App.svelte (grab bar)
  export let grabBarOpacity = 1;
</script>

<!-- ─── SECTION 1: THE ARSENAL ────────────────────────────── -->
<div class="content-section-wrapper" id="section-1">
  <!-- Grab bar (GSAP dims this while arm holds it) -->
  <div class="grab-bar" style:opacity={grabBarOpacity}>
    <div class="grab-handle left"></div>
    <div class="grab-handle right"></div>
  </div>

  <section class="section arsenal-section" aria-labelledby="arsenal-heading">

    <!-- ── Animated header ─────────────────────────────────── -->
    <header class="arsenal-header-wrap">
      <h2 class="arsenal-header" id="arsenal-heading">
        <!-- T H E  A R S E N A L — each char animated by GSAP -->
        <span class="a-char" data-i="0">T</span>
        <span class="a-char" data-i="1">H</span>
        <span class="a-char" data-i="2">E</span>
        <span class="a-char spacer">&nbsp;</span>
        <span class="a-char" data-i="3">A</span>
        <span class="a-char" data-i="4">R</span>
        <span class="a-char" data-i="5">S</span>
        <span class="a-char" data-i="6">E</span>
        <span class="a-char" data-i="7">N</span>
        <span class="a-char" data-i="8">A</span>
        <span class="a-char" data-i="9">L</span>
      </h2>
      <div class="arsenal-underline" id="arsenal-underline"></div>
    </header>

    <!-- ── Elite Bento Grid ────────────────────────────────── -->
    <div class="bento-grid" role="list">

      <!-- Card 1: HERO — Build Speed (2 col × 2 row) -->
      <article class="feature-box bento-hero" id="box1" role="listitem">
        <!-- Phase 6-A: SVG wireframe border draw animation -->
        <svg class="box-wire" id="wire1" aria-hidden="true" xmlns="http://www.w3.org/2000/svg">
          <rect class="wire-rect" pathLength="1"
                x="1.5" y="1.5" width="99%" height="98%" rx="16"
                fill="none" stroke="#00ffcc" stroke-width="1.5"
                style="stroke-dasharray:1;stroke-dashoffset:1;filter:drop-shadow(0 0 5px #00ffcc)"/>
        </svg>
        <div class="feature-header">
          <div class="feature-icon" aria-hidden="true">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
            </svg>
          </div>
          <h3 class="feature-title">
            {#each 'Reality'.split('') as ch}<span class="tw-char">{ch === ' ' ? '\u00a0' : ch}</span>{/each}
          </h3>
        </div>
        <p>While traditional devs spend weeks on boilerplate, I use AI to lay the foundation in hours — straight to the custom logic that makes your idea unique.</p>
        <div class="hero-stat" aria-label="10x faster">
          <span class="stat-number">10×</span>
          <span class="stat-label">Faster than agency timelines</span>
        </div>
      </article>

      <!-- Card 2: TALL — Architecture (1 col × 2 row) -->
      <article class="feature-box bento-tall" id="box2" role="listitem">
        <!-- Phase 6-A: SVG wireframe border draw animation -->
        <svg class="box-wire" id="wire2" aria-hidden="true" xmlns="http://www.w3.org/2000/svg">
          <rect class="wire-rect" pathLength="1"
                x="1.5" y="1.5" width="99%" height="98%" rx="16"
                fill="none" stroke="#00ffcc" stroke-width="1.5"
                style="stroke-dasharray:1;stroke-dashoffset:1;filter:drop-shadow(0 0 5px #00ffcc)"/>
        </svg>
        <div class="feature-header">
          <div class="feature-icon" aria-hidden="true">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
            </svg>
          </div>
          <h3 class="feature-title">
            {#each 'Full-Stack'.split('') as ch}<span class="tw-char">{ch === ' ' ? '\u00a0' : ch}</span>{/each}
            <br/>
            {#each 'Architecture'.split('') as ch}<span class="tw-char">{ch === ' ' ? '\u00a0' : ch}</span>{/each}
          </h3>
        </div>
        <p>From database to sleek frontend. I build scalable, modern applications designed to handle real users from day one.</p>
        <ul class="stack-list" aria-label="Tech stack">
          <li>React / Svelte / Vue</li>
          <li>Node.js / PostgreSQL</li>
          <li>Cloudflare / Vercel</li>
          <li>AI integration layer</li>
        </ul>
      </article>

      <!-- Card 3: WIDE — Risk Model (2 col × 1 row) -->
      <article class="feature-box bento-wide" id="box3" role="listitem">
        <!-- Phase 6-A: SVG wireframe border draw animation -->
        <svg class="box-wire" id="wire3" aria-hidden="true" xmlns="http://www.w3.org/2000/svg">
          <rect class="wire-rect" pathLength="1"
                x="1.5" y="1.5" width="99%" height="97%" rx="16"
                fill="none" stroke="#00ffcc" stroke-width="1.5"
                style="stroke-dasharray:1;stroke-dashoffset:1;filter:drop-shadow(0 0 5px #00ffcc)"/>
        </svg>
        <div class="feature-header">
          <div class="feature-icon" aria-hidden="true">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2"/>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
            </svg>
          </div>
          <h3 class="feature-title">
            {#each 'Risk Model'.split('') as ch}<span class="tw-char">{ch === ' ' ? '\u00a0' : ch}</span>{/each}
          </h3>
        </div>
        <p>You shouldn't pay for promises. I deliver a functional MVP before you pay the flat $1,000 fee. If I don't build it, you don't pay.</p>
      </article>

      <!-- Card 4: STAT accent (1 col × 1 row) -->
      <article class="feature-box bento-stat" id="box4" role="listitem" aria-label="Flat fee: $1,000">
        <!-- Phase 6-A: SVG wireframe border draw animation -->
        <svg class="box-wire" id="wire4" aria-hidden="true" xmlns="http://www.w3.org/2000/svg">
          <rect class="wire-rect" pathLength="1"
                x="1.5" y="1.5" width="99%" height="97%" rx="16"
                fill="none" stroke="#00f3ff" stroke-width="1.5"
                style="stroke-dasharray:1;stroke-dashoffset:1;filter:drop-shadow(0 0 5px #00f3ff)"/>
        </svg>
        <div class="stat-accent">
          <span class="big-number">$1K</span>
          <span class="stat-desc">Flat fee.<br/>Only on delivery.</span>
        </div>
        <div class="zero-risk-badge" aria-hidden="true">ZERO RISK</div>
      </article>

    </div>
  </section>
</div>

<style>
/* Arsenal section: tighter top padding (scoped > global) */
.arsenal-section { padding-top: 10px; padding-bottom: 30px; }

/* ─── Bento grid ─────────────────────────────────────────── */
.bento-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  grid-template-rows: 140px 140px 84px;
  gap: 12px;
}

/* Span definitions */
.bento-hero { grid-column: 1 / 3; grid-row: 1 / 3; }
.bento-tall { grid-column: 3 / 4; grid-row: 1 / 3; }
.bento-wide { grid-column: 1 / 3; grid-row: 3 / 4; }
.bento-stat { grid-column: 3 / 4; grid-row: 3 / 4; }

/* ─── Base card ──────────────────────────────────────────── */
.feature-box {
  padding: 18px 20px;
  border-radius: 18px;
  border: 1px solid rgba(0, 255, 204, 0.14);
  border-top: 1px solid rgba(255, 255, 255, 0.09);
  background: rgba(8, 14, 30, 0.88);
  box-shadow:
    0 12px 40px rgba(0, 3, 18, 0.7),
    inset 0 1px 0 rgba(255, 255, 255, 0.05);
  will-change: opacity, transform;
  opacity: 0;                /* GSAP reveals */
  transition: border-color 0.4s var(--ease-spring), box-shadow 0.4s, transform 0.4s var(--ease-spring);
  overflow: hidden;
  position: relative;       /* needed for .box-wire absolute positioning */
}
.feature-box:hover {
  border-color: rgba(0, 255, 204, 0.4);
  box-shadow:
    0 16px 50px rgba(0, 3, 18, 0.85),
    0 0 25px rgba(0, 255, 204, 0.08);
  transform: translateY(-3px);
}

/* ─── Phase 6-A: Wireframe border SVG ───────────────────── */
.box-wire {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 10;
  overflow: visible;
  /* starts invisible — GSAP animates stroke-dashoffset → 0 */
}

/* ─── Hero card extras ───────────────────────────────────── */
.bento-hero {
  background: rgba(6, 12, 26, 0.94);
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}
.hero-stat {
  display: flex;
  align-items: baseline;
  gap: 8px;
  margin-top: auto;
  padding-top: 10px;
  border-top: 1px solid rgba(0, 255, 204, 0.12);
}
.stat-number {
  font-family: 'Clash Display', sans-serif;
  font-size: 2.2rem;
  font-weight: 700;
  color: #00ffcc;
  text-shadow: 0 0 20px rgba(0, 255, 204, 0.5);
  line-height: 1;
}
.stat-label { font-size: 0.7rem; color: var(--muted); letter-spacing: 0.5px; }

/* ─── Tall card extras ───────────────────────────────────── */
.bento-tall {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.stack-list {
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 5px;
  margin-top: auto;
}
.stack-list li {
  font-size: 0.7rem;
  color: var(--muted);
  padding: 4px 10px;
  background: rgba(0, 255, 204, 0.04);
  border: 1px solid rgba(0, 255, 204, 0.1);
  border-radius: 8px;
  letter-spacing: 0.5px;
  transition: border-color 0.3s;
}
.bento-tall:hover .stack-list li { border-color: rgba(0, 255, 204, 0.2); }

/* ─── Wide card ──────────────────────────────────────────── */
.bento-wide {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 20px;
  padding: 16px 22px;
}
.bento-wide .feature-header { flex-shrink: 0; flex-direction: column; align-items: flex-start; }
.bento-wide p { margin: 0; font-size: 0.74rem; }

/* ─── Stat accent card ───────────────────────────────────── */
.bento-stat {
  background: rgba(0, 255, 204, 0.04);
  border: 1px solid rgba(0, 255, 204, 0.2);
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: center;
  text-align: center;
  gap: 10px;
  padding: 10px 14px;
}
.stat-accent {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 2px;
}
.big-number {
  font-family: 'Clash Display', sans-serif;
  font-size: 2rem;
  font-weight: 700;
  color: #00ffcc;
  text-shadow: 0 0 25px rgba(0, 255, 204, 0.6), 0 0 50px rgba(0, 255, 204, 0.3);
  line-height: 1;
}
.stat-desc {
  font-size: 0.62rem;
  color: var(--muted);
  letter-spacing: 0.3px;
  line-height: 1.4;
  text-align: left;
}
.zero-risk-badge {
  font-size: 0.52rem;
  font-weight: 700;
  letter-spacing: 2px;
  color: rgba(0, 255, 204, 0.7);
  border: 1px solid rgba(0, 255, 204, 0.3);
  padding: 2px 7px;
  border-radius: 8px;
  text-transform: uppercase;
  white-space: nowrap;
  flex-shrink: 0;
}

/* ─── Feature header shared ──────────────────────────────── */
.feature-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 8px;
}
.feature-icon { color: var(--neon); flex-shrink: 0; }
.feature-title {
  font-size: 0.72rem;
  font-weight: 700;
  margin: 0;
  color: #fff;
  text-transform: uppercase;
  letter-spacing: 1px;
  line-height: 1.3;
}
.feature-box p { font-size: 0.76rem; line-height: 1.5; }

/* ─── Mobile: Reality + Full-Stack side by side ──────────── */
@media (max-width: 768px) {
  .bento-grid {
    grid-template-columns: 1fr 1fr;
    grid-template-rows: auto auto auto;
    gap: 10px;
  }
  /* Reality + Full-Stack: side by side in row 1 */
  .bento-hero { grid-column: 1; grid-row: 1; }
  .bento-tall { grid-column: 2; grid-row: 1; }
  /* Risk Model: full width in row 2 */
  .bento-wide { grid-column: 1 / 3; grid-row: 2; flex-direction: column; align-items: flex-start; gap: 8px; }
  /* $1K stat: full width in row 3 */
  .bento-stat { grid-column: 1 / 3; grid-row: 3; }

  /* Compact text for side-by-side cards */
  .bento-hero p, .bento-tall p { font-size: 0.68rem; }
  .stat-number { font-size: 1.6rem; }
  .big-number  { font-size: 1.8rem; }
  .stack-list li { font-size: 0.62rem; padding: 3px 8px; }
  .feature-title { font-size: 0.65rem; }
  .bento-wide p  { font-size: 0.72rem; }
}

/* ─── Short-screen desktop fix ───────────────────────────── */
@media (min-width: 769px) and (max-height: 700px) {
  .bento-grid {
    grid-template-rows: 110px 110px 70px;
    gap: 8px;
  }
  .arsenal-section { padding-top: 5px; padding-bottom: 15px; }
  .feature-box { padding: 12px 14px; }
}
</style>
