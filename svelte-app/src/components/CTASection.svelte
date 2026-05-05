<script>
  import { modalOpen } from '../lib/stores.js';
  export let grabBarOpacity = 1;
</script>

<!-- ─── SECTION 3: CTA ───────────────────────────────────── -->
<div class="content-section-wrapper" id="section-3">
  <div class="grab-bar" style:opacity={grabBarOpacity}>
    <div class="grab-handle left"></div>
    <div class="grab-handle right"></div>
  </div>

  <section class="cta-section" id="cta" aria-label="Call to action">
    <h2>Ready to Unleash Your Genius?</h2>
    <p>Stop waiting for a dream developer. I'm here now.</p>
    <button
      class="initiate-btn"
      id="initiate-btn"
      on:click={() => modalOpen.set(true)}
      aria-haspopup="dialog"
    >
      ⚡ INITIATE BUILD SEQUENCE
    </button>
  </section>
</div>

<style>
.cta-section h2 {
  font-size: 2rem;
  margin-bottom: 20px;
  text-shadow: 0 0 10px rgba(0, 255, 204, 0.5);
}
.cta-section p { margin-top: -8px; }
</style>
