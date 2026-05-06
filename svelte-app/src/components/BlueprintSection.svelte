<script>
  export let grabBarOpacity = 1;
</script>

<!-- ─── SECTION 2: THE BLUEPRINT ────────────────────────── -->
<div class="content-section-wrapper" id="section-2">
  <div class="grab-bar" style:opacity={grabBarOpacity}>
    <div class="grab-handle left"></div>
    <div class="grab-handle right"></div>
  </div>

  <section class="section" aria-labelledby="blueprint-heading">

    <header class="process-header-wrap">
      <h2 class="process-header" id="blueprint-heading">
        <span class="p-char" data-i="0">T</span>
        <span class="p-char" data-i="1">H</span>
        <span class="p-char" data-i="2">E</span>
        <span class="p-char spacer">&nbsp;</span>
        <span class="p-char" data-i="3">B</span>
        <span class="p-char" data-i="4">L</span>
        <span class="p-char" data-i="5">U</span>
        <span class="p-char" data-i="6">E</span>
        <span class="p-char" data-i="7">P</span>
        <span class="p-char" data-i="8">R</span>
        <span class="p-char" data-i="9">I</span>
        <span class="p-char" data-i="10">N</span>
        <span class="p-char" data-i="11">T</span>
      </h2>
      <div class="process-underline" id="process-underline"></div>
    </header>

    <ol class="timeline" aria-label="Build process steps">

      <!-- Step 1 -->
      <li class="timeline-item left" id="time1">
        <article class="timeline-content">
          <!-- Phase 6-A: SVG wireframe border draw animation -->
          <svg class="box-wire" id="wire-t1" aria-hidden="true" xmlns="http://www.w3.org/2000/svg">
            <rect class="wire-rect" pathLength="1"
                  x="1.5" y="1.5" width="99%" height="97%" rx="11"
                  fill="none" stroke="#00ffcc" stroke-width="1.2"
                  style="stroke-dasharray:1;stroke-dashoffset:1;filter:drop-shadow(0 0 4px #00ffcc)"/>
          </svg>
          <h3>01. Discord Updates</h3>
          <p>Want to be extra specific? A quick Discord call to walk through your vision and make sure we're aligned — so I build exactly what you need.</p>
        </article>
      </li>

      <!-- Step 2 -->
      <li class="timeline-item right" id="time2">
        <article class="timeline-content">
          <!-- Phase 6-A: SVG wireframe border draw animation -->
          <svg class="box-wire" id="wire-t2" aria-hidden="true" xmlns="http://www.w3.org/2000/svg">
            <rect class="wire-rect" pathLength="1"
                  x="1.5" y="1.5" width="99%" height="97%" rx="11"
                  fill="none" stroke="#00ffcc" stroke-width="1.2"
                  style="stroke-dasharray:1;stroke-dashoffset:1;filter:drop-shadow(0 0 4px #00ffcc)"/>
          </svg>
          <h3>02. The Forge</h3>
          <p>After I accept your message via email, I get straight to work. If no data inquiry is needed — product is <em class="neon-em">immediately underway.</em></p>
        </article>
      </li>

      <!-- Step 3 -->
      <li class="timeline-item left" id="time3">
        <article class="timeline-content">
          <!-- Phase 6-A: SVG wireframe border draw animation -->
          <svg class="box-wire" id="wire-t3" aria-hidden="true" xmlns="http://www.w3.org/2000/svg">
            <rect class="wire-rect" pathLength="1"
                  x="1.5" y="1.5" width="99%" height="97%" rx="11"
                  fill="none" stroke="#00ffcc" stroke-width="1.2"
                  style="stroke-dasharray:1;stroke-dashoffset:1;filter:drop-shadow(0 0 4px #00ffcc)"/>
          </svg>
          <h3>03. The Reveal</h3>
          <p>We meet up so you have live access to the app and see it work in real-time. After payment, I'll distribute it with a USB of your providing.</p>
        </article>
      </li>

    </ol>
  </section>
</div>

<style>
/* ─── Timeline ───────────────────────────────────────────── */
.timeline {
  position: relative;
  max-width: 800px;
  margin: 0 auto;
  list-style: none;
  padding: 0;
}
.timeline::after {
  content: '';
  position: absolute;
  width: 2px;
  background: rgba(0, 255, 204, 0.3);
  top: 0; bottom: 0;
  left: 50%;
  margin-left: -1px;
}
.timeline-item {
  padding: 10px 28px;
  position: relative;
  background: inherit;
  width: 50%;
  will-change: opacity, transform;
  opacity: 0;
}
.timeline-item.left  { left: 0; }
.timeline-item.right { left: 50%; }
.timeline-item::after {
  content: '';
  position: absolute;
  width: 20px;
  height: 20px;
  right: -10px;
  background: var(--bg);
  border: 3px solid var(--neon);
  top: 18px;
  border-radius: 50%;
  z-index: 1;
  box-shadow: 0 0 10px var(--neon);
}
.timeline-item.right::after { left: -10px; }

.timeline-content {
  padding: 14px 18px;
  background: rgba(8, 14, 30, 0.85);
  border-radius: 12px;
  border: 1px solid rgba(0, 255, 204, 0.14);
  border-top: 1px solid rgba(255, 255, 255, 0.07);
  box-shadow: 0 8px 28px rgba(0, 3, 18, 0.6), inset 0 1px 0 rgba(255, 255, 255, 0.04);
  position: relative; /* needed for .box-wire absolute positioning */
  overflow: hidden;
}

/* Phase 6-A: wireframe SVG */
:global(.timeline-content .box-wire) {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 5;
  overflow: visible;
}
.timeline-content h3 {
  margin-bottom: 6px;
  color: var(--neon);
  font-size: 0.9rem;
}
.timeline-content p { font-size: 0.78rem; line-height: 1.5; }
.neon-em { color: #00ffcc; font-style: normal; }

/* Mobile */
@media (max-width: 768px) {
  .timeline-item        { width: 100%; left: 0 !important; padding: 8px 16px 8px 44px; }
  .timeline::after      { left: 16px; }
  .timeline-item::after { left: 8px !important; right: auto !important; }
}
</style>
