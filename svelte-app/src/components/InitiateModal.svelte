<script>
  import { modalOpen } from '../lib/stores.js';
  import { submitMessage } from '../lib/api.js';
  import gsap from 'gsap';

  // Form state
  let name     = '';
  let email    = '';
  let vision   = '';
  let features = '';
  let discord  = '';
  let referral = '';
  let timeline = '';

  // UI state
  let submitted = false;
  let error     = null;
  let loading   = false;

  let modalBoxEl;

  // Close on Escape
  function handleKeydown(e) {
    if (e.key === 'Escape') modalOpen.set(false);
  }

  // Close on backdrop click
  function handleBackdrop(e) {
    if (e.target === e.currentTarget) modalOpen.set(false);
  }

  async function handleSubmit() {
    if (!name.trim() || !email.trim() || !vision.trim()) {
      // Spring-shake animation (no innerHTML)
      if (modalBoxEl) {
        gsap.to(modalBoxEl, { x: [-8, 8, -6, 6, -3, 3, 0], duration: 0.35, ease: 'none' });
      }
      return;
    }

    loading = true;
    error   = null;

    try {
      const data = await submitMessage({ name: name.trim(), email: email.trim(), vision: vision.trim(), features: features.trim(), discord: discord.trim(), referral: referral.trim(), timeline: timeline || 'Not specified' });
      if (data.success) {
        submitted = true;
      } else {
        throw new Error(data.error || 'Submission failed');
      }
    } catch (err) {
      error = err.message || 'Connection error — is the backend running?';
    } finally {
      loading = false;
    }
  }

  function resetAndClose() {
    name = email = vision = features = discord = referral = timeline = '';
    submitted = false;
    error = null;
    modalOpen.set(false);
  }
</script>

<svelte:window on:keydown={handleKeydown} />

<!-- ─── INITIATE MODAL ───────────────────────────────────── -->
<div
  class="modal-overlay"
  class:open={$modalOpen}
  on:click={handleBackdrop}
  on:keydown={e => e.key === 'Escape' && modalOpen.set(false)}
  role="dialog"
  aria-modal="true"
  aria-labelledby="modal-title"
  tabindex="-1"
>
  <div class="modal-box" bind:this={modalBoxEl}>

    {#if submitted}
      <!-- ── Success state ───────────────────────────────── -->
      <div class="success-state" role="status" aria-live="polite">
        <div class="success-icon" aria-hidden="true">✅</div>
        <div class="modal-title" id="modal-title">Build Request Sent!</div>
        <p>Your packet is in my inbox — I'll review and reach out ASAP.</p>
        <small>— Ardy W</small>
        <button class="modal-close-btn" on:click={resetAndClose} style="width:100%;margin-top:24px;">
          Close
        </button>
      </div>

    {:else if error}
      <!-- ── Error state ─────────────────────────────────── -->
      <div class="error-state" role="alert">
        <div class="error-icon" aria-hidden="true">⚠️</div>
        <div class="modal-title" id="modal-title" style="color:#ff6060;">Connection Error</div>
        <p>Failed to send message. Is the backend server running?</p>
        <small>{error}</small>
        <div class="modal-actions" style="margin-top:24px;">
          <button class="modal-submit" on:click={() => { error = null; }}>Try Again</button>
          <button class="modal-close-btn" on:click={resetAndClose}>Cancel</button>
        </div>
      </div>

    {:else}
      <!-- ── Form ─────────────────────────────────────────── -->
      <div class="modal-title" id="modal-title">⚡ Initiate Build Sequence</div>
      <div class="modal-sub">Zero risk — Flat $1,000 only when I deliver your MVP</div>
      <div class="modal-divider"></div>

      <form on:submit|preventDefault={handleSubmit} novalidate>
        <div class="modal-field">
          <label class="modal-label" for="m-name">Your Name</label>
          <input
            class="modal-input"
            id="m-name"
            type="text"
            placeholder="Full name"
            autocomplete="off"
            required
            bind:value={name}
          />
        </div>

        <div class="modal-field">
          <label class="modal-label" for="m-email">Email Address</label>
          <input
            class="modal-input"
            id="m-email"
            type="email"
            placeholder="you@example.com"
            autocomplete="off"
            required
            bind:value={email}
          />
        </div>

        <div class="modal-field">
          <label class="modal-label" for="m-vision">Describe Your Vision</label>
          <textarea
            class="modal-textarea"
            id="m-vision"
            placeholder="What are you building? What problem does it solve?"
            required
            bind:value={vision}
          ></textarea>
        </div>

        <div class="modal-field">
          <label class="modal-label" for="m-features">Core Features Needed</label>
          <textarea
            class="modal-textarea"
            id="m-features"
            placeholder="List the 3–5 must-have features for your MVP..."
            style="min-height:60px"
            bind:value={features}
          ></textarea>
        </div>

        <div class="modal-field">
          <label class="modal-label" for="m-discord">
            Discord
            <span class="optional-note">(Optional — quick call to align on your vision)</span>
          </label>
          <input
            class="modal-input"
            id="m-discord"
            type="text"
            placeholder="YourUsername#0000"
            autocomplete="off"
            bind:value={discord}
          />
        </div>

        <div class="modal-field">
          <label class="modal-label" for="m-referral">
            Referral
            <span class="optional-note">(Optional — who sent you?)</span>
          </label>
          <input
            class="modal-input"
            id="m-referral"
            type="text"
            placeholder="Who helped you get here?"
            autocomplete="off"
            bind:value={referral}
          />
        </div>

        <div class="modal-field">
          <label class="modal-label" for="m-timeline">Timeline</label>
          <select class="modal-select" id="m-timeline" bind:value={timeline}>
            <option value="">Select timeline...</option>
            <option>ASAP — I needed this yesterday</option>
            <option>2–4 weeks</option>
            <option>1–2 months</option>
            <option>Flexible</option>
          </select>
        </div>

        <div class="modal-actions">
          <button
            type="submit"
            class="modal-submit"
            disabled={loading}
            aria-busy={loading}
          >
            {loading ? 'Sending…' : '🚀 Launch My Build'}
          </button>
          <button type="button" class="modal-close-btn" on:click={resetAndClose}>
            Cancel
          </button>
        </div>
      </form>
    {/if}

  </div>
</div>

<style>
.success-state,
.error-state {
  text-align: center;
  padding: 10px 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}
.success-icon,
.error-icon { font-size: 2.5rem; margin-bottom: 6px; }
.success-state p,
.error-state p { color: #e2e8f0; font-size: 0.95rem; line-height: 1.7; }
.success-state small { color: rgba(0, 255, 204, 0.6); font-size: 0.8rem; }
.error-state small { color: rgba(255, 96, 96, 0.7); font-size: 0.78rem; }

.optional-note {
  font-size: 0.68rem;
  color: rgba(0, 255, 204, 0.7);
  font-weight: 400;
  letter-spacing: 0;
  text-transform: none;
}
.modal-submit:disabled { opacity: 0.6; cursor: not-allowed; }

@media (max-width: 768px) {
  :global(.modal-overlay.open) { align-items: flex-start; overflow-y: auto; padding: 20px; }
}
</style>
