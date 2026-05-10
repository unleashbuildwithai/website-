<script>
  import { authToken, adminOpen, jumpscareOpen, intrusionCount, livePing } from '../lib/stores.js';
  import {
    adminLogin, fetchMessages, updateMessageStatus, deleteMessage,
    emptyTrash, fetchFailedAttempts, clearFailedAttempts, keepAlivePing,
    threadMessages, archiveToGitHub, API_URL
  } from '../lib/api.js';
  import gsap from 'gsap';

  // ── Login state
  let loginUser = '';
  let loginPass = '';
  let loginError = '';
  let loginBoxEl;

  // ── Inbox state
  let currentTab  = 'new';
  let showAll     = false;
  let currentPage = 1;
  const PER_PAGE  = 10;

  let threads      = [];
  let selectedMsg  = null;
  let loadingMsgs  = false;
  let msgError     = '';

  // ── GitHub archive state
  let archiving     = false;
  let archiveToast  = null;   // { type: 'success'|'error', text, url? }
  let toastTimer;

  // ── Intrusions
  let intrusions          = [];
  let intrusionsOpen      = false;
  let intrusionsPanelOpen = false;

  // ── Trash confirm
  let trashConfirmOpen = false;
  let trashCount       = 0;

  // ── Live dot ping (glitch animation)
  let liveDotPing = false;

  // ── Token reactive
  let token;
  const unsubToken = authToken.subscribe(v => { token = v; });

  // ─── Admin login ────────────────────────────────────────
  async function handleLogin() {
    if (!loginUser || !loginPass) {
      loginError = 'Please enter your credentials.';
      return;
    }
    try {
      const data = await adminLogin(loginUser, loginPass);
      if (data.success && data.token) {
        authToken.set(data.token);
        loginUser = '';
        loginPass = '';
        loginError = '';
        adminOpen.set(false);
        intrusionsOpen = true;
        await loadMessages();
        await loadIntrusions();
        // Start keep-alive timer ONLY — no immediate ping on login
        keepAliveInterval = setInterval(() => keepAlivePing(), 10 * 60 * 1000);
      } else {
        loginError = data.error || 'Invalid credentials';
        if (loginBoxEl) gsap.to(loginBoxEl, { x: [-6, 6, -4, 4, -2, 2, 0], duration: 0.3, ease: 'none' });
      }
    } catch (e) {
      loginError = 'Connection error — is backend running?';
      if (loginBoxEl) gsap.to(loginBoxEl, { x: [-6, 6, -4, 4, -2, 2, 0], duration: 0.3, ease: 'none' });
    }
  }

  let keepAliveInterval;

  // ─── Load messages ──────────────────────────────────────
  async function loadMessages() {
    if (!token) return;
    loadingMsgs = true;
    msgError    = '';
    try {
      const data = await fetchMessages(token, showAll ? null : currentTab, showAll);
      const msgs = (data.messages || []).filter(m => m.email !== 'keepalive@system.internal');
      threads = threadMessages(msgs);
      currentPage = Math.max(1, Math.min(currentPage, Math.ceil(threads.length / PER_PAGE) || 1));
    } catch (e) {
      if (e.message === 'UNAUTHORIZED') {
        authToken.set(null);
        intrusionsOpen = false;
        adminOpen.set(true);
      }
      msgError = 'Failed to load messages.';
    } finally {
      loadingMsgs = false;
    }
  }

  // ─── Load intrusions ─────────────────────────────────────
  async function loadIntrusions() {
    if (!token) return;
    try {
      const data = await fetchFailedAttempts(token);
      intrusions = data.attempts || [];
      intrusionCount.set(data.count || 0);
    } catch (_) {}
  }

  // ─── Simple status update (no GitHub) ───────────────────
  async function updateStatus(id, status) {
    try {
      await updateMessageStatus(token, id, status);
      selectedMsg = null;
      await loadMessages();
    } catch (_) {}
  }

  // ─── Archive/Complete to GitHub ──────────────────────────
  async function doGitHubArchive(id, folder) {
    archiving = true;
    clearTimeout(toastTimer);
    archiveToast = null;
    try {
      const result = await archiveToGitHub(token, id, folder);
      // Update selectedMsg to reflect new status + github_archived flag
      if (selectedMsg && selectedMsg.id === id) {
        selectedMsg = { ...selectedMsg, status: folder, github_archived: true, github_path: result.jsonPath };
      }
      await loadMessages();
      archiveToast = {
        type: 'success',
        text: `✅ Saved to GitHub as ${folder}`,
        url:  result.githubUrl
      };
    } catch (err) {
      archiveToast = {
        type: 'error',
        text: `❌ GitHub archive failed: ${err.message}`
      };
    } finally {
      archiving = false;
      // Auto-clear toast after 6 seconds
      toastTimer = setTimeout(() => { archiveToast = null; }, 6000);
    }
  }

  async function permDelete(id) {
    try {
      await deleteMessage(token, id);
      selectedMsg = null;
      await loadMessages();
    } catch (_) {}
  }

  async function doEmptyTrash() {
    try {
      await emptyTrash(token);
      trashConfirmOpen = false;
      selectedMsg = null;
      await loadMessages();
    } catch (_) {}
  }

  // ─── Tab switching ───────────────────────────────────────
  function switchTab(tab) {
    currentTab  = tab;
    showAll     = false;
    selectedMsg = null;
    currentPage = 1;
    loadMessages();
  }

  function toggleShowAll() {
    showAll     = !showAll;
    selectedMsg = null;
    currentPage = 1;
    loadMessages();
  }

  // ─── Pagination ──────────────────────────────────────────
  $: pagedThreads = threads.slice((currentPage - 1) * PER_PAGE, currentPage * PER_PAGE);
  $: totalPages   = Math.max(1, Math.ceil(threads.length / PER_PAGE));

  // ─── Status colours ─────────────────────────────────────
  const STATUS_COLORS = {
    new:       'rgba(0,255,204,.8)',
    accepted:  '#ffa040',
    archived:  '#8888cc',
    completed: '#40ff80',
    trash:     '#ff6060',
  };

  // ─── Close / cleanup ─────────────────────────────────────
  function closeInbox() {
    intrusionsOpen = false;
    selectedMsg = null;
    archiveToast = null;
    clearTimeout(toastTimer);
    clearInterval(keepAliveInterval);
  }

  import { onDestroy, onMount } from 'svelte';

  onMount(() => {
    const id = setInterval(() => {
      if (intrusionsOpen && token) loadIntrusions();
    }, 30000);
    return () => clearInterval(id);
  });

  onDestroy(() => {
    clearInterval(keepAliveInterval);
    clearTimeout(toastTimer);
    unsubToken();
  });
</script>

<!-- ─── ADMIN LOGIN OVERLAY ──────────────────────────────── -->
{#if $adminOpen}
  <div class="overlay admin-overlay open"
    on:click|self={() => adminOpen.set(false)}
    on:keydown={e => e.key === 'Escape' && adminOpen.set(false)}
    role="dialog" aria-modal="true" aria-label="Admin Login" tabindex="-1">
    <div class="admin-login-box" bind:this={loginBoxEl}>
      <div class="admin-login-title">Admin Access</div>

      <div class="modal-field">
        <label class="modal-label" for="a-user">Username</label>
        <input class="modal-input" id="a-user" type="text" placeholder="Username"
          autocomplete="off" bind:value={loginUser}
          on:keydown={e => e.key === 'Enter' && handleLogin()} />
      </div>
      <div class="modal-field">
        <label class="modal-label" for="a-pass">Password</label>
        <input class="modal-input" id="a-pass" type="password" placeholder="Password"
          bind:value={loginPass}
          on:keydown={e => e.key === 'Enter' && handleLogin()} />
      </div>

      {#if loginError}
        <p class="login-err" role="alert">{loginError}</p>
      {/if}

      <div class="modal-actions" style="margin-top:20px;">
        <button class="modal-submit" on:click={handleLogin}>Enter Inbox</button>
        <button class="modal-close-btn" on:click={() => adminOpen.set(false)}>Cancel</button>
      </div>
    </div>
  </div>
{/if}

<!-- ─── ADMIN INBOX ───────────────────────────────────────── -->
{#if intrusionsOpen}
  <div class="admin-inbox open" role="main" aria-label="Admin Inbox">

    <!-- Header -->
    <header class="inbox-header">
      <div class="inbox-title">
        📥 Build Requests
        <span class="live-indicator">
          <span class="live-dot" class:ping={liveDotPing}></span>
          LIVE
        </span>
      </div>

      <!-- Tabs -->
      <div class="inbox-tabs" role="tablist">
        {#each ['new','accepted','archived','completed'] as tab}
          <button
            class="inbox-tab"
            class:active={currentTab === tab && !showAll}
            role="tab"
            aria-selected={currentTab === tab && !showAll}
            on:click={() => switchTab(tab)}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        {/each}
        <button
          class="inbox-tab trash-tab"
          class:active={currentTab === 'trash' && !showAll}
          role="tab"
          aria-selected={currentTab === 'trash' && !showAll}
          on:click={() => switchTab('trash')}
        >
          🗑 Trash
        </button>
        <button class="inbox-filter-btn" class:active={showAll} on:click={toggleShowAll}>
          {showAll ? 'Filter' : 'Show All'}
        </button>

        <!-- Intrusions -->
        <button
          class="intrusions-btn"
          class:expanded={intrusionsPanelOpen}
          on:click={() => { intrusionsPanelOpen = !intrusionsPanelOpen; if (intrusionsPanelOpen) loadIntrusions(); }}
          aria-expanded={intrusionsPanelOpen}
        >
          ⚠️ Intrusions
          <span class="intrusion-count">{$intrusionCount}</span>
        </button>

        {#if currentTab === 'trash' && !showAll}
          <button class="empty-trash-btn" on:click={() => { trashCount = threads.length; trashConfirmOpen = true; }}>
            🗑 Empty Trash
          </button>
        {/if}
      </div>

      <button class="inbox-close" on:click={closeInbox} aria-label="Close inbox">Close</button>
    </header>

    <!-- Intrusions panel -->
    {#if intrusionsPanelOpen}
      <div class="intrusions-panel open" role="region" aria-label="Intrusion attempts">
        {#if intrusions.length === 0}
          <p class="intrusion-empty">No intrusion attempts detected</p>
        {:else}
          {#each intrusions as att}
            <div class="intrusion-item">
              <div>
                <span class="intrusion-user">{att.username || 'unknown'}</span>
                — failed login
              </div>
              <div class="intrusion-ip">IP: {att.ip_address || 'unknown'}</div>
              <div class="intrusion-time">
                {new Date(att.ts).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              </div>
            </div>
          {/each}
          <button class="intrusion-clear" on:click={async () => { await clearFailedAttempts(token); loadIntrusions(); }}>
            Clear All Intrusions
          </button>
        {/if}
      </div>
    {/if}

    <!-- GitHub Archive Toast -->
    {#if archiveToast}
      <div class="archive-toast" class:toast-success={archiveToast.type === 'success'} class:toast-error={archiveToast.type === 'error'} role="status">
        <span>{archiveToast.text}</span>
        {#if archiveToast.url}
          <a href={archiveToast.url} target="_blank" rel="noopener" class="toast-link">View on GitHub →</a>
        {/if}
        <button class="toast-close" on:click={() => archiveToast = null}>✕</button>
      </div>
    {/if}

    <!-- Body: message list + detail -->
    <div class="inbox-body">
      <!-- Message list -->
      <nav class="msg-list" aria-label="Messages">
        {#if loadingMsgs}
          <p class="list-empty">Loading…</p>
        {:else if msgError}
          <p class="list-empty" role="alert">{msgError}</p>
        {:else if pagedThreads.length === 0}
          <p class="list-empty">{showAll ? 'No messages yet' : 'No messages in this folder'}</p>
        {:else}
          {#each pagedThreads as thread (thread.email + thread.latest.id)}
            {@const m = thread.latest}
            {@const color = STATUS_COLORS[m.status] || STATUS_COLORS.new}
            <button
              class="msg-item"
              class:active={selectedMsg?.id === m.id}
              on:click={() => { selectedMsg = m; }}
              aria-current={selectedMsg?.id === m.id ? 'true' : undefined}
            >
              <div class="msg-item-name">
                {m.name || 'Unknown'}
                <span class="msg-status-badge" style:color={color} style:border-color={color + '44'}>
                  {m.status || 'new'}
                </span>
                {#if thread.count > 1}
                  <span class="msg-thread-count">({thread.count})</span>
                {/if}
                {#if m.github_archived}
                  <span class="github-badge" title="Backed up to GitHub">⬆ GH</span>
                {/if}
              </div>
              <div class="msg-item-email">{m.email || ''}</div>
              <div class="msg-item-date">
                {new Date(m.ts || Date.now()).toLocaleDateString()}
                {new Date(m.ts || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
            </button>
          {/each}

          <!-- Pagination -->
          {#if totalPages > 1}
            <div class="inbox-pagination" role="navigation" aria-label="Page navigation">
              {#each Array(totalPages) as _, i}
                <button
                  class="page-btn"
                  class:active={currentPage === i + 1}
                  on:click={() => { currentPage = i + 1; }}
                  aria-current={currentPage === i + 1 ? 'page' : undefined}
                >
                  {i + 1}
                </button>
              {/each}
            </div>
          {/if}
        {/if}
      </nav>

      <!-- Message detail -->
      <article class="msg-detail" aria-label="Message detail">
        {#if !selectedMsg}
          <div class="msg-detail-empty">Select a message to view details</div>
        {:else}
          {@const status = selectedMsg.status || 'new'}

          <!-- GitHub backup indicator -->
          {#if selectedMsg.github_archived}
            <div class="github-indicator">
              <span class="github-dot"></span>
              Backed up to GitHub
              {#if selectedMsg.github_path}
                · <a
                    href={`https://github.com/${import.meta.env.VITE_GITHUB_OWNER || 'unleashbuildwithai'}/website-/blob/main/${selectedMsg.github_path}`}
                    target="_blank" rel="noopener" class="github-link">View file →</a>
              {/if}
            </div>
          {/if}

          <div class="msg-detail-name">{selectedMsg.name || 'Unknown'}</div>
          <div class="msg-detail-email">{selectedMsg.email || ''}</div>

          <div class="msg-detail-label">Vision / Description</div>
          <div class="msg-detail-text">{selectedMsg.vision || 'No description provided'}</div>

          {#if selectedMsg.features}
            <div class="msg-detail-label">Core Features</div>
            <div class="msg-detail-text">{selectedMsg.features}</div>
          {/if}

          <div class="msg-detail-label">Timeline</div>
          <div class="msg-detail-text">{selectedMsg.timeline || 'Not specified'}</div>

          {#if selectedMsg.discord}
            <div class="msg-detail-label">Discord</div>
            <div class="msg-detail-text">{selectedMsg.discord}</div>
          {/if}

          {#if selectedMsg.referral}
            <div class="msg-detail-label">Referral</div>
            <div class="msg-detail-text">{selectedMsg.referral}</div>
          {/if}

          <div class="msg-detail-label">Received</div>
          <div class="msg-detail-text">{new Date(selectedMsg.ts || Date.now()).toLocaleString()}</div>

          <!-- Action buttons -->
          <div class="msg-action-row" role="group" aria-label="Message actions">
            {#if status === 'trash'}
              <button class="msg-action-btn msg-action-restore" on:click={() => updateStatus(selectedMsg.id, 'new')}>↩️ Restore</button>
              <button class="msg-action-btn msg-action-perm"    on:click={() => permDelete(selectedMsg.id)}>💀 Delete Forever</button>
            {:else}
              {#if status === 'new'}
                <button class="msg-action-btn msg-action-accept" on:click={() => updateStatus(selectedMsg.id, 'accepted')}>
                  ✅ Accept
                </button>
                <!-- Archive → GitHub -->
                <button
                  class="msg-action-btn msg-action-gh-archive"
                  disabled={archiving}
                  on:click={() => doGitHubArchive(selectedMsg.id, 'archived')}
                >
                  {archiving ? '⏳ Saving…' : '📁 Archive → GitHub'}
                </button>

              {:else if status === 'accepted'}
                <!-- Complete → GitHub -->
                <button
                  class="msg-action-btn msg-action-gh-complete"
                  disabled={archiving}
                  on:click={() => doGitHubArchive(selectedMsg.id, 'completed')}
                >
                  {archiving ? '⏳ Saving…' : '🏆 Complete → GitHub'}
                </button>
                <!-- Archive → GitHub -->
                <button
                  class="msg-action-btn msg-action-gh-archive"
                  disabled={archiving}
                  on:click={() => doGitHubArchive(selectedMsg.id, 'archived')}
                >
                  {archiving ? '⏳ Saving…' : '📁 Archive → GitHub'}
                </button>

              {:else if status === 'archived' || status === 'completed'}
                <!-- Already in final state — offer re-backup or reopen -->
                {#if !selectedMsg.github_archived}
                  <button
                    class="msg-action-btn msg-action-gh-archive"
                    disabled={archiving}
                    on:click={() => doGitHubArchive(selectedMsg.id, status)}
                  >
                    {archiving ? '⏳ Saving…' : '⬆ Back up to GitHub'}
                  </button>
                {/if}
              {/if}

              {#if status !== 'new'}
                <button class="msg-action-btn msg-action-reopen" on:click={() => updateStatus(selectedMsg.id, 'new')}>↩️ Reopen</button>
              {/if}
              <button class="msg-action-btn msg-action-delete" on:click={() => updateStatus(selectedMsg.id, 'trash')}>🗑 Delete</button>
            {/if}
          </div>

          {#if status !== 'trash'}
            <a
              class="msg-detail-reply"
              href={`mailto:${selectedMsg.email}?subject=Re: Your Build Request — ${selectedMsg.name}&body=Hi ${selectedMsg.name},%0D%0A%0D%0AThank you for reaching out!%0D%0A%0D%0A— Ardy W`}
              rel="noopener"
              style="margin-top:16px; display:inline-flex; align-items:center; gap:8px;"
            >
              ✉️ Reply via Email
            </a>
          {/if}
        {/if}
      </article>
    </div>
  </div>
{/if}

<!-- ─── TRASH CONFIRM DIALOG ─────────────────────────────── -->
{#if trashConfirmOpen}
  <div class="overlay"
    on:click|self={() => trashConfirmOpen = false}
    on:keydown={e => e.key === 'Escape' && (trashConfirmOpen = false)}
    role="dialog" aria-modal="true" aria-label="Confirm empty trash" tabindex="-1"
    style="display:flex;">
    <div class="trash-confirm-box">
      <div class="trash-confirm-icon" aria-hidden="true">🗑</div>
      <div class="trash-confirm-title">Empty Trash</div>
      <p class="trash-confirm-sub">
        Permanently delete {trashCount} item{trashCount !== 1 ? 's' : ''}? This cannot be undone.
      </p>
      <div class="trash-confirm-actions">
        <button class="trash-btn-delete" on:click={doEmptyTrash}>🗑 Delete Trash</button>
        <button class="trash-btn-view"   on:click={() => trashConfirmOpen = false}>Cancel</button>
      </div>
    </div>
  </div>
{/if}

<!-- ─── JUMP SCARE ────────────────────────────────────────── -->
<div class="jumpscare" class:open={$jumpscareOpen} aria-live="assertive" role="alert">
  <div class="js-emoji" aria-hidden="true">💀</div>
  <div class="js-text">⚠️ INTRUDER DETECTED ⚠️</div>
  <p class="js-msg">Nice try, script kiddie. 👁 Your attempt has been logged.</p>
</div>

<style>
/* ─── Admin login overlay ────────────────────────────────── */
.overlay {
  position: fixed;
  inset: 0;
  z-index: 99990;
  background: rgba(0,0,0,.88);
  backdrop-filter: blur(16px);
  align-items: center;
  justify-content: center;
}
.admin-overlay.open { display: flex; }
.admin-login-box {
  background: rgba(4,6,10,.97);
  border: 1px solid rgba(0,255,204,.35);
  border-top: 2px solid rgba(0,255,204,.85);
  border-radius: 20px;
  padding: 40px 36px;
  max-width: 380px;
  width: 92%;
  box-shadow: 0 0 60px rgba(0,255,204,.1), 0 30px 80px rgba(0,0,0,.9);
}
.admin-login-title {
  font-size: 1.1rem;
  font-weight: 900;
  color: #00ffcc;
  text-transform: uppercase;
  letter-spacing: 4px;
  margin-bottom: 24px;
  text-align: center;
}
.login-err { color: #ff4a4a; font-size: .75rem; letter-spacing: 1px; margin-top: 8px; }

/* ─── Admin inbox panel ──────────────────────────────────── */
.admin-inbox {
  position: fixed;
  inset: 0;
  z-index: 99990;
  background: rgba(3,5,10,.97);
  backdrop-filter: blur(20px);
  display: flex;
  flex-direction: column;
}
.inbox-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 30px;
  border-bottom: 1px solid rgba(0,255,204,.2);
  flex-wrap: wrap;
  gap: 10px;
}
.inbox-title {
  font-size: 1.1rem;
  font-weight: 900;
  color: #00ffcc;
  text-transform: uppercase;
  letter-spacing: 4px;
}
.inbox-tabs { display: flex; gap: 7px; align-items: center; flex-wrap: wrap; }
.inbox-tab {
  padding: 7px 15px;
  background: transparent;
  color: rgba(0,255,204,.4);
  border: 1px solid rgba(0,255,204,.18);
  border-radius: 20px;
  font-size: .7rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 1.5px;
  cursor: pointer;
  transition: all .2s;
  font-family: inherit;
}
.inbox-tab:hover  { color: #00ffcc; border-color: rgba(0,255,204,.5); }
.inbox-tab.active { color: #00ffcc; border-color: rgba(0,255,204,.8); background: rgba(0,255,204,.1); box-shadow: 0 0 10px rgba(0,255,204,.15); }
.trash-tab        { color: rgba(255,96,96,.5); border-color: rgba(255,96,96,.22); }
.trash-tab.active { color: #ff6060; border-color: rgba(255,96,96,.8); background: rgba(255,96,96,.1); }
.inbox-filter-btn { padding: 7px 15px; background: transparent; color: rgba(0,255,204,.4); border: 1px solid rgba(0,255,204,.2); border-radius: 20px; font-size: .68rem; text-transform: uppercase; letter-spacing: 1px; cursor: pointer; transition: all .2s; font-family: inherit; }
.inbox-filter-btn:hover, .inbox-filter-btn.active { background: rgba(0,255,204,.1); color: #00ffcc; border-color: rgba(0,255,204,.6); }
.intrusions-btn { padding: 7px 15px; background: rgba(255,32,32,.08); color: #ff6060; border: 1px solid rgba(255,32,32,.5); border-radius: 20px; font-size: .7rem; font-weight: 700; text-transform: uppercase; letter-spacing: 1.5px; cursor: pointer; transition: all .2s; font-family: inherit; }
.intrusions-btn:hover { background: rgba(255,32,32,.18); }
.intrusions-btn.expanded { background: rgba(255,32,32,.15); }
.intrusion-count { display: inline-block; background: rgba(255,32,32,.25); border: 1px solid rgba(255,32,32,.7); border-radius: 10px; padding: 1px 6px; margin-left: 5px; font-size: .65rem; font-weight: 900; color: #ff2020; }
.empty-trash-btn { padding: 7px 15px; background: transparent; color: rgba(255,96,96,.5); border: 1px solid rgba(255,96,96,.25); border-radius: 20px; font-size: .68rem; text-transform: uppercase; letter-spacing: 1px; cursor: pointer; transition: all .2s; font-family: inherit; }
.empty-trash-btn:hover { background: rgba(255,96,96,.1); color: #ff6060; }
.inbox-close { padding: 8px 20px; background: transparent; color: rgba(0,255,204,.5); border: 1px solid rgba(0,255,204,.2); border-radius: 20px; font-size: .75rem; text-transform: uppercase; letter-spacing: 1px; cursor: pointer; transition: all .2s; font-family: inherit; }
.inbox-close:hover { color: #00ffcc; border-color: rgba(0,255,204,.6); }

/* ─── GitHub Archive Toast ───────────────────────────────── */
.archive-toast {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 20px;
  margin: 8px 30px 0;
  border-radius: 10px;
  font-size: .8rem;
  font-weight: 600;
  letter-spacing: .5px;
  flex-wrap: wrap;
}
.toast-success { background: rgba(64,255,128,.1); border: 1px solid rgba(64,255,128,.4); color: #40ff80; }
.toast-error   { background: rgba(255,80,80,.1);  border: 1px solid rgba(255,80,80,.4);  color: #ff6060; }
.toast-link { color: #00ffcc; text-decoration: underline; font-size: .75rem; }
.toast-close { margin-left: auto; background: transparent; border: none; color: inherit; opacity: .6; cursor: pointer; font-size: 1rem; padding: 0 4px; }
.toast-close:hover { opacity: 1; }

/* ─── Intrusions panel ───────────────────────────────────── */
.intrusions-panel { background: rgba(10,5,5,.96); border: 1px solid rgba(255,32,32,.4); border-radius: 12px; padding: 12px 14px; max-height: 220px; overflow-y: auto; margin: 8px 30px; }
.intrusion-item { padding: 10px 12px; border-bottom: 1px solid rgba(255,32,32,.15); font-size: .72rem; color: #e2e8f0; line-height: 1.6; }
.intrusion-item:last-child { border-bottom: none; }
.intrusion-user { color: #ff6060; font-weight: 700; font-family: monospace; }
.intrusion-ip { color: rgba(255,160,64,.7); font-size: .68rem; font-family: monospace; }
.intrusion-time { color: rgba(255,255,255,.4); font-size: .65rem; margin-top: 2px; }
.intrusion-empty { text-align: center; color: rgba(255,96,96,.3); font-size: .7rem; padding: 20px 0; }
.intrusion-clear { display: inline-block; margin-top: 8px; padding: 6px 14px; background: rgba(255,32,32,.1); color: #ff6060; border: 1px solid rgba(255,32,32,.4); border-radius: 15px; font-size: .65rem; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; cursor: pointer; transition: all .2s; font-family: inherit; }

/* ─── Inbox body ─────────────────────────────────────────── */
.inbox-body { display: flex; flex: 1; overflow: hidden; }
.msg-list { width: 340px; border-right: 1px solid rgba(0,255,204,.15); overflow-y: auto; padding: 16px; display: flex; flex-direction: column; gap: 0; }
.list-empty { color: rgba(0,255,204,.2); text-align: center; padding: 40px 0; font-size: .8rem; letter-spacing: 2px; text-transform: uppercase; }
.msg-item { display: block; width: 100%; text-align: left; padding: 14px 16px; border-radius: 10px; border: 1px solid rgba(0,255,204,.12); background: rgba(0,255,204,.03); margin-bottom: 10px; cursor: pointer; transition: all .2s; font-family: inherit; color: inherit; }
.msg-item:hover  { border-color: rgba(0,255,204,.4); background: rgba(0,255,204,.07); }
.msg-item.active { border-color: #00ffcc; background: rgba(0,255,204,.1); }
.msg-item-name  { font-size: .9rem; font-weight: 700; color: #fff; text-transform: uppercase; letter-spacing: 1px; }
.msg-item-email { font-size: .72rem; color: rgba(0,255,204,.6); margin-top: 2px; }
.msg-item-date  { font-size: .65rem; color: rgba(255,255,255,.35); margin-top: 4px; }
.msg-status-badge { display: inline-block; font-size: .58rem; font-weight: 700; letter-spacing: 1.5px; text-transform: uppercase; padding: 2px 7px; border-radius: 10px; margin-left: 6px; vertical-align: middle; border: 1px solid transparent; }
.msg-thread-count { display: inline-block; background: rgba(0,255,204,.15); border: 1px solid rgba(0,255,204,.5); border-radius: 10px; padding: 2px 7px; margin-left: 6px; font-size: .58rem; font-weight: 700; color: #00ffcc; }

/* ─── GitHub badge on message list item ──────────────────── */
.github-badge { display: inline-block; background: rgba(100,200,100,.12); border: 1px solid rgba(100,200,100,.45); border-radius: 8px; padding: 1px 6px; margin-left: 6px; font-size: .55rem; font-weight: 700; color: #6fdb6f; letter-spacing: 1px; vertical-align: middle; }

/* ─── GitHub indicator in detail pane ───────────────────── */
.github-indicator {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  padding: 6px 14px;
  background: rgba(64,200,64,.08);
  border: 1px solid rgba(64,200,64,.35);
  border-radius: 20px;
  font-size: .7rem;
  color: #6fdb6f;
  letter-spacing: 1px;
  margin-bottom: 16px;
}
.github-dot { width: 7px; height: 7px; background: #6fdb6f; border-radius: 50%; box-shadow: 0 0 6px #6fdb6f; }
.github-link { color: #00ffcc; text-decoration: underline; }

.inbox-pagination { display: flex; justify-content: center; gap: 8px; padding: 12px 0; }
.page-btn { padding: 6px 12px; background: rgba(0,255,204,.05); border: 1px solid rgba(0,255,204,.2); border-radius: 8px; color: rgba(0,255,204,.6); font-size: .7rem; font-weight: 700; cursor: pointer; transition: all .2s; font-family: inherit; }
.page-btn:hover  { background: rgba(0,255,204,.12); border-color: rgba(0,255,204,.5); color: #00ffcc; }
.page-btn.active { background: rgba(0,255,204,.18); border-color: rgba(0,255,204,.8); color: #00ffcc; }

/* ─── Detail pane ────────────────────────────────────────── */
.msg-detail       { flex: 1; padding: 30px 36px; overflow-y: auto; }
.msg-detail-empty { display: flex; align-items: center; justify-content: center; height: 100%; color: rgba(0,255,204,.25); font-size: .9rem; letter-spacing: 2px; text-transform: uppercase; }
.msg-detail-name  { font-size: 1.5rem; font-weight: 900; color: #fff; text-transform: uppercase; letter-spacing: 3px; margin-bottom: 6px; }
.msg-detail-email { font-size: .85rem; color: #00ffcc; margin-bottom: 24px; }
.msg-detail-label { font-size: .65rem; color: rgba(0,255,204,.5); text-transform: uppercase; letter-spacing: 2px; margin-bottom: 6px; margin-top: 16px; }
.msg-detail-text  { color: #e2e8f0; font-size: .9rem; line-height: 1.6; background: rgba(0,255,204,.03); border: 1px solid rgba(0,255,204,.12); border-radius: 8px; padding: 14px 16px; white-space: pre-wrap; word-break: break-word; }
.msg-detail-reply { padding: 12px 24px; background: rgba(0,255,204,.1); color: #00ffcc; border: 1px solid rgba(0,255,204,.4); border-radius: 20px; font-size: .82rem; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; cursor: pointer; text-decoration: none; transition: all .2s; }
.msg-detail-reply:hover { background: rgba(0,255,204,.2); }

/* ─── Action buttons ─────────────────────────────────────── */
.msg-action-row { display: flex; gap: 10px; margin-top: 18px; flex-wrap: wrap; }
.msg-action-btn  { padding: 10px 18px; background: transparent; border-radius: 20px; font-size: .77rem; font-weight: 700; text-transform: uppercase; letter-spacing: 1.5px; cursor: pointer; transition: all .2s; font-family: inherit; }
.msg-action-btn:disabled { opacity: .5; cursor: not-allowed; }

.msg-action-accept        { color: #ffa040; border: 1px solid rgba(255,160,64,.5); }
.msg-action-accept:hover  { background: rgba(255,160,64,.12); }

/* GitHub Archive button (purple-ish) */
.msg-action-gh-archive        { color: #b58cff; border: 1px solid rgba(181,140,255,.5); }
.msg-action-gh-archive:hover:not(:disabled)  { background: rgba(181,140,255,.12); }

/* GitHub Complete button (gold) */
.msg-action-gh-complete        { color: #ffd700; border: 1px solid rgba(255,215,0,.55); }
.msg-action-gh-complete:hover:not(:disabled) { background: rgba(255,215,0,.1); }

.msg-action-reopen        { color: rgba(0,255,204,.65); border: 1px solid rgba(0,255,204,.3); }
.msg-action-reopen:hover  { background: rgba(0,255,204,.08); }
.msg-action-delete        { color: #ff6060; border: 1px solid rgba(255,96,96,.45); }
.msg-action-delete:hover  { background: rgba(255,96,96,.1); }
.msg-action-restore       { color: #40ffaa; border: 1px solid rgba(64,255,170,.45); }
.msg-action-restore:hover { background: rgba(64,255,170,.1); }
.msg-action-perm          { color: #ff2020; border: 2px solid rgba(255,32,32,.6); font-weight: 900; }
.msg-action-perm:hover    { background: rgba(255,32,32,.15); }

/* ─── Trash confirm ──────────────────────────────────────── */
.trash-confirm-box { background: rgba(4,6,10,.97); border: 1px solid rgba(255,96,96,.4); border-top: 2px solid rgba(255,96,96,.85); border-radius: 20px; padding: 40px 36px; max-width: 420px; width: 92%; box-shadow: 0 0 60px rgba(255,96,96,.08), 0 30px 80px rgba(0,0,0,.9); text-align: center; animation: modal-in .4s cubic-bezier(.175,.885,.32,1.275) forwards; }
.trash-confirm-icon  { font-size: 2.8rem; margin-bottom: 14px; }
.trash-confirm-title { font-size: 1.05rem; font-weight: 900; color: #ff6060; text-transform: uppercase; letter-spacing: 3px; margin-bottom: 10px; }
.trash-confirm-sub   { font-size: .82rem; color: rgba(226,232,240,.55); margin-bottom: 28px; line-height: 1.7; }
.trash-confirm-actions { display: flex; gap: 12px; justify-content: center; }
.trash-btn-delete { padding: 13px 24px; background: rgba(255,96,96,.1); color: #ff6060; border: 2px solid rgba(255,96,96,.7); border-radius: 25px; font-size: .85rem; font-weight: 900; text-transform: uppercase; letter-spacing: 1.5px; cursor: pointer; transition: all .2s; font-family: inherit; }
.trash-btn-delete:hover { background: rgba(255,96,96,.22); }
.trash-btn-view { padding: 13px 22px; background: transparent; color: rgba(0,255,204,.5); border: 1px solid rgba(0,255,204,.22); border-radius: 25px; font-size: .82rem; text-transform: uppercase; letter-spacing: 1px; cursor: pointer; transition: all .2s; font-family: inherit; }
.trash-btn-view:hover { border-color: rgba(0,255,204,.5); color: #00ffcc; }

/* ─── Mobile inbox ───────────────────────────────────────── */
@media (max-width: 768px) {
  .inbox-header { flex-direction: column; align-items: flex-start; padding: 14px 16px; }
  .inbox-body   { flex-direction: column; overflow: auto; }
  .msg-list     { width: 100%; border-right: none; border-bottom: 1px solid rgba(0,255,204,.15); max-height: 220px; }
  .msg-detail   { padding: 18px 16px; }
  .archive-toast { margin: 6px 16px 0; }
}
</style>
