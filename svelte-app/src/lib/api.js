/**
 * API configuration and helper functions.
 * All dynamic content uses .textContent / createElement — never innerHTML.
 */

// ─── Endpoint selection based on hostname ─────────────────
export const API_URL =
  typeof window !== 'undefined' &&
  (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
    ? 'http://localhost:3000/api'
    : 'https://website-5nvl.onrender.com/api';

// ─── XSS-safe string escaper ──────────────────────────────
export function esc(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// ─── POST a new build request message ─────────────────────
export async function submitMessage({ name, email, vision, features, discord, referral, timeline }) {
  // Client-side validation (server validates too — defence in depth)
  if (!name?.trim() || !email?.trim() || !vision?.trim()) {
    throw new Error('Name, email, and vision are required');
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
    throw new Error('Please enter a valid email address');
  }
  const LIMITS = { name: 100, email: 254, vision: 3000, features: 2000, discord: 100, referral: 200 };
  for (const [field, max] of Object.entries(LIMITS)) {
    const val = { name, email, vision, features, discord, referral }[field];
    if (val && val.length > max) throw new Error(`${field} is too long (max ${max} chars)`);
  }

  const res = await fetch(`${API_URL}/messages`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: name.trim(), email: email.trim(), vision: vision.trim(),
      features: features?.trim() || '',
      discord: discord?.trim() || '',
      referral: referral?.trim() || '',
      timeline: timeline || 'Not specified'
    }),
  });
  if (!res.ok) {
    const errBody = await res.json().catch(() => ({}));
    throw new Error(errBody.error || `HTTP ${res.status}`);
  }
  return res.json();
}

// ─── Admin: login → returns JWT token ─────────────────────
export async function adminLogin(username, password) {
  const res = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

// ─── Admin: fetch messages (optionally filtered by status) ─
export async function fetchMessages(token, status = null, all = false) {
  const url = all
    ? `${API_URL}/admin/messages`
    : `${API_URL}/admin/messages${status ? `?status=${status}` : ''}`;
  const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
  if (res.status === 401 || res.status === 403) throw new Error('UNAUTHORIZED');
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

// ─── Admin: update message status ─────────────────────────
export async function updateMessageStatus(token, id, status) {
  const res = await fetch(`${API_URL}/admin/messages/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ status }),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

// ─── Admin: permanently delete a message ──────────────────
export async function deleteMessage(token, id) {
  const res = await fetch(`${API_URL}/admin/messages/${id}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

// ─── Admin: empty the trash ───────────────────────────────
export async function emptyTrash(token) {
  const res = await fetch(`${API_URL}/admin/trash`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

// ─── Admin: archive message to GitHub + update status ─────
/**
 * @param {string} token  - JWT token
 * @param {string} id     - Message ID
 * @param {'archived'|'completed'} folder
 * @returns {{ success, jsonPath, mdPath, githubUrl }}
 */
export async function archiveToGitHub(token, id, folder = 'archived') {
  const res = await fetch(`${API_URL}/admin/messages/${id}/archive-to-github`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ folder }),
  });
  if (res.status === 401 || res.status === 403) throw new Error('UNAUTHORIZED');
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `HTTP ${res.status}`);
  }
  return res.json();
}

// ─── Admin: list GitHub archives ──────────────────────────
export async function fetchGitHubArchives(token, folder = 'archived') {
  const res = await fetch(`${API_URL}/admin/github-archives?folder=${folder}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

// ─── Admin: fetch failed login attempts ───────────────────
export async function fetchFailedAttempts(token) {
  const res = await fetch(`${API_URL}/admin/failed-attempts`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (res.status === 401 || res.status === 403) throw new Error('UNAUTHORIZED');
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

// ─── Admin: clear all failed attempts ─────────────────────
export async function clearFailedAttempts(token) {
  const res = await fetch(`${API_URL}/admin/failed-attempts`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

// ─── Keep-alive: ping the health endpoint to prevent backend sleep ──
// Uses GET /health — does NOT create fake DB entries
export async function keepAlivePing() {
  try {
    await fetch(`${API_URL}/health`, { method: 'GET' });
  } catch {
    // silently ignore — keep-alive is best-effort
  }
}

// ─── Group messages by email (threading) ──────────────────
export function threadMessages(msgs) {
  const map = {};
  for (const m of msgs) {
    const key = m.email || 'unknown';
    if (!map[key]) map[key] = [];
    map[key].push(m);
  }
  return Object.values(map)
    .map(arr => {
      arr.sort((a, b) => (b.ts || 0) - (a.ts || 0));
      return { email: arr[0].email, count: arr.length, latest: arr[0], all: arr };
    })
    .sort((a, b) => (b.latest.ts || 0) - (a.latest.ts || 0));
}
