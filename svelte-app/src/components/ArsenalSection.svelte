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

  <section class="section" aria-labelledby="arsenal-heading">

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
    <!-- Layout (3-col, 3-row grid):
         [ HERO 2×2    ] [ TALL 1×2 ]
         [ HERO 2×2    ] [ TALL 1×2 ]
         [ WIDE 2×1    ] [ STAT 1×1 ]
    -->
    <div class="bento-grid" role="list">

      <!-- Card 1: HERO — Build Speed (2 col × 2 row) -->
      <article class="feature-box bento-hero" id="box1" role="listitem">
        <div class="feature-header">
          <div class="feature-icon" aria-hidden="true">
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
            </svg>
          </div>
          <h3 class="feature-title">
            <!-- Each char pre-rendered for GSAP typewriter -->
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
        <div class="feature-header">
          <div class="feature-icon" aria-hidden="true">
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
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
        <div class="feature-header">
          <div class="feature-icon" aria-hidden="true">
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
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
/* ─── Bento grid ─────────────────────────────────────────── */
.bento-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  grid-template-rows: 240px 240px 180px;
  gap: 16px;
}

/* Span definitions — the "secret sauce" */
.bento-hero { grid-column: 1 / 3; grid-row: 1 / 3; }  /* 2×2 hero */
.bento-tall { grid-column: 3 / 4; grid-row: 1 / 3; }  /* 1×2 tall */
.bento-wide { grid-column: 1 / 3; grid-row: 3 / 4; }  /* 2×1 wide */
.bento-stat { grid-column: 3 / 4; grid-row: 3 / 4; }  /* 1×1 accent */

/* ─── Base card ──────────────────────────────────────────── */
.feature-box {
  padding: 24px;
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
  position: relative;
}
.feature-box:hover {
  border-color: rgba(0, 255, 204, 0.4);
  box-shadow:
    0 16px 50px rgba(0, 3, 18, 0.85),
    0 0 25px rgba(0, 255, 204, 0.08);
  transform: translateY(-3px);
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
  gap: 10px;
  margin-top: auto;
  padding-top: 20px;
  border-top: 1px solid rgba(0, 255, 204, 0.12);
}
.stat-number {
  font-family: 'Clash Display', sans-serif;
  font-size: 2.8rem;
  font-weight: 700;
  color: #00ffcc;
  text-shadow: 0 0 20px rgba(0, 255, 204, 0.5);
  line-height: 1;
}
.stat-label { font-size: 0.78rem; color: var(--muted); letter-spacing: 0.5px; }

/* ─── Tall card extras ───────────────────────────────────── */
.bento-tall {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.stack-list {
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: auto;
}
.stack-list li {
  font-size: 0.78rem;
  color: var(--muted);
  padding: 6px 12px;
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
  gap: 24px;
  padding: 20px 28px;
}
.bento-wide .feature-header { flex-shrink: 0; flex-direction: column; align-items: flex-start; }
.bento-wide p { margin: 0; font-size: 0.82rem; }

/* ─── Stat accent card ───────────────────────────────────── */
.bento-stat {
  background: rgba(0, 255, 204, 0.04);
  border: 1px solid rgba(0, 255, 204, 0.2);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  gap: 12px;
}
.stat-accent {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
}
.big-number {
  font-family: 'Clash Display', sans-serif;
  font-size: 3.2rem;
  font-weight: 700;
  color: #00ffcc;
  text-shadow: 0 0 25px rgba(0, 255, 204, 0.6), 0 0 50px rgba(0, 255, 204, 0.3);
  line-height: 1;
}
.stat-desc {
  font-size: 0.72rem;
  color: var(--muted);
  letter-spacing: 0.5px;
  line-height: 1.5;
}
.zero-risk-badge {
  font-size: 0.6rem;
  font-weight: 700;
  letter-spacing: 3px;
  color: rgba(0, 255, 204, 0.6);
  border: 1px solid rgba(0, 255, 204, 0.25);
  padding: 3px 8px;
  border-radius: 10px;
  text-transform: uppercase;
}

/* ─── Feature header shared ──────────────────────────────── */
.feature-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}
.feature-icon { color: var(--neon); flex-shrink: 0; }
.feature-title {
  font-size: 0.95rem;
  margin: 0;
  color: #fff;
  text-transform: uppercase;
  letter-spacing: 1px;
  min-height: 1.5em;
}
.feature-box p { font-size: 0.85rem; line-height: 1.6; }

/* ─── Mobile stacking ────────────────────────────────────── */
@media (max-width: 768px) {
  .bento-grid {
    grid-template-columns: 1fr;
    grid-template-rows: auto;
    gap: 14px;
  }
  .bento-hero,
  .bento-tall,
  .bento-wide,
  .bento-stat { grid-column: 1; grid-row: auto; }
  .bento-wide { flex-direction: column; }
  .stat-number { font-size: 2rem; }
  .big-number  { font-size: 2.4rem; }
}
</style>
