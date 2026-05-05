import { writable, derived } from 'svelte/store';

// ─── Auth (memory-only — cleared on page refresh, never persisted)
export const authToken = writable(null);

// ─── Modal state
export const modalOpen     = writable(false);
export const adminOpen     = writable(false);
export const jumpscareOpen = writable(false);

// ─── Scroll physics
export const scrollY        = writable(0);
export const scrollVelocity = writable(0);  // px/frame

// ─── Derived: scroll progress 0..1
// Populated by App.svelte after TOTAL_H is known
export const scrollProgress = writable(0);

// ─── Star trail — stretched from 1x (no trail) to ~8x (warp)
export const starStretch = writable(1);

// ─── Admin inbox state
export const currentTab    = writable('new');
export const showAll       = writable(false);
export const currentPage   = writable(1);
export const messages      = writable([]);
export const selectedMsg   = writable(null);
export const intrusionCount = writable(0);
export const livePing      = writable(false);  // triggers live-dot animation

// ─── Grab bar opacity (driven by GSAP timeline)
export const grabBarOp = writable({ b1: 1, b2: 1, b3: 1 });
