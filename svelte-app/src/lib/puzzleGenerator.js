/**
 * ── Phase 6-B: Puzzle Fragment Generator ──────────────────────────────
 * Generates unique jigsaw clip-path SVG paths per window.
 * Each window/box gets its own seeded random connections so
 * no two boxes share the same puzzle pattern.
 *
 * Key exports:
 *   generatePuzzlePieces(w, h, cols, rows, seed) → piece[]
 *   buildFragments(boxEl, boxId, pieces)           → fragEl[]
 *   cleanupFragments(boxId)
 *   PUZZLE_CONFIG                                  → per-box seed map
 */

// ── Seeded 32-bit LCG pseudo-random number generator ──────────────────
function seededRNG(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967295;
  };
}

function f(n) { return n.toFixed(2); }

// ── Horizontal jigsaw edge  (x0,y) → (x1,y) ──────────────────────────
// Works for L→R (x0<x1) AND R→L (x0>x1) traversal directions.
// tabUp: true = bump goes UP (−y screen)   false = DOWN (+y screen)
function hJigsaw(x0, x1, y, tabUp, tabH) {
  const ty = tabUp ? -tabH : tabH;
  const mx = (x0 + x1) / 2;
  const s  = x0 < x1 ? 1 : -1;         // travel sign
  const r  = Math.abs(x1 - x0) * 0.14; // half-base of tab/blank bulge
  return (
    `L ${f(mx - s * r)} ${f(y)} ` +
    `Q ${f(mx)} ${f(y + ty)} ${f(mx + s * r)} ${f(y)} ` +
    `L ${f(x1)} ${f(y)}`
  );
}

// ── Vertical jigsaw edge  (x,y0) → (x,y1) ───────────────────────────
// Works for T→B (y0<y1) AND B→T (y0>y1) traversal.
// tabRight: true = bump goes RIGHT (+x)   false = LEFT (−x)
function vJigsaw(x, y0, y1, tabRight, tabW) {
  const tx = tabRight ? tabW : -tabW;
  const my = (y0 + y1) / 2;
  const s  = y0 < y1 ? 1 : -1;
  const r  = Math.abs(y1 - y0) * 0.14;
  return (
    `L ${f(x)} ${f(my - s * r)} ` +
    `Q ${f(x + tx)} ${f(my)} ${f(x)} ${f(my + s * r)} ` +
    `L ${f(x)} ${f(y1)}`
  );
}

/**
 * Generate jigsaw puzzle piece SVG paths for a box of w×h pixels.
 * Returns an array of piece objects: { path, col, row, cx, cy }
 *   path — SVG path string (absolute coords, origin = box top-left)
 *   cx/cy — piece center coordinate (used for transform-origin)
 *
 * Adjacent shared edges are automatically mirrored (tab ↔ blank).
 *
 * @param {number} w     box pixel width
 * @param {number} h     box pixel height
 * @param {number} cols  horizontal piece count  (2 or 3)
 * @param {number} rows  vertical piece count    (2)
 * @param {number} seed  unique per-box RNG seed
 */
export function generatePuzzlePieces(w, h, cols, rows, seed) {
  const rng  = seededRNG(seed);
  const pw   = w / cols;
  const ph   = h / rows;
  const tabH = ph * 0.23; // horizontal edge tab/blank depth
  const tabW = pw * 0.23; // vertical   edge tab/blank depth

  // hEdge[r][c]: +1 = DOWN, −1 = UP  — direction for edge BELOW row r at col c
  const hEdge = Array.from({ length: rows - 1 }, () =>
    Array.from({ length: cols }, () => (rng() > 0.5 ? 1 : -1))
  );

  // vEdge[r][c]: +1 = RIGHT, −1 = LEFT — direction for edge RIGHT-OF col c at row r
  const vEdge = Array.from({ length: rows }, () =>
    Array.from({ length: cols - 1 }, () => (rng() > 0.5 ? 1 : -1))
  );

  const pieces = [];

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const x0 = c * pw,   y0 = r * ph;
      const x1 = x0 + pw,  y1 = y0 + ph;

      let d = `M ${f(x0)} ${f(y0)} `;

      // ── TOP  (L → R) ────────────────────────────────────────────────
      // Both the piece above (bottom edge) and this piece (top edge)
      // share the same hEdge direction value.
      if (r > 0) {
        d += hJigsaw(x0, x1, y0, hEdge[r - 1][c] === -1, tabH) + ' ';
      } else {
        d += `L ${f(x1)} ${f(y0)} `;
      }

      // ── RIGHT  (T → B) ──────────────────────────────────────────────
      if (c < cols - 1) {
        d += vJigsaw(x1, y0, y1, vEdge[r][c] === 1, tabW) + ' ';
      } else {
        d += `L ${f(x1)} ${f(y1)} `;
      }

      // ── BOTTOM  (R → L, reversed traversal) ────────────────────────
      if (r < rows - 1) {
        d += hJigsaw(x1, x0, y1, hEdge[r][c] === -1, tabH) + ' ';
      } else {
        d += `L ${f(x0)} ${f(y1)} `;
      }

      // ── LEFT  (B → T, reversed traversal) ──────────────────────────
      if (c > 0) {
        d += vJigsaw(x0, y1, y0, vEdge[r][c - 1] === 1, tabW) + ' ';
      } else {
        d += `L ${f(x0)} ${f(y0)} `;
      }

      d += 'Z';

      pieces.push({
        path: d,
        col:  c,
        row:  r,
        cx:   x0 + pw / 2, // piece center x (for transform-origin)
        cy:   y0 + ph / 2, // piece center y
      });
    }
  }

  return pieces;
}

// ─────────────────────────────────────────────────────────────────────
// Per-window puzzle configuration — each box gets its own seed
// so connections are UNIQUE to each window.
// ─────────────────────────────────────────────────────────────────────
export const PUZZLE_CONFIG = {
  // Arsenal bento boxes
  box1:  { seed: 0x1A2B3C4D, cols: 3, rows: 2 }, // HERO  2×2 → 6 pieces
  box2:  { seed: 0x4D5E6F7A, cols: 2, rows: 2 }, // TALL  1×2 → 4 pieces
  box3:  { seed: 0x7A8B9CDE, cols: 3, rows: 2 }, // WIDE  2×1 → 6 pieces
  box4:  { seed: 0xDEF01234, cols: 2, rows: 2 }, // STAT  1×1 → 4 pieces

  // Blueprint timeline items
  time1: { seed: 0xABCDEF01, cols: 2, rows: 2 }, // Step 1
  time2: { seed: 0x13572468, cols: 2, rows: 2 }, // Step 2
  time3: { seed: 0x86420135, cols: 2, rows: 2 }, // Step 3
};

/**
 * Build fixed-position puzzle fragment elements over a target box.
 * Each fragment is a clipped clone of the box's full visual.
 * Uses CSS clip-path: path() for the jigsaw outline.
 *
 * Returns an array of fragment <div> elements appended to <body>,
 * ready for GSAP animation.  They start at opacity:0.
 *
 * @param {HTMLElement} boxEl   the box to fragment
 * @param {string}      boxId   unique id key, e.g. 'box1'
 * @param {Array}       pieces  from generatePuzzlePieces()
 */
export function buildFragments(boxEl, boxId, pieces) {
  const rect = boxEl.getBoundingClientRect();

  return pieces.map((piece, i) => {
    const frag = document.createElement('div');
    frag.className   = 'puzz-frag';
    frag.dataset.fragBox = boxId;

    // Position fixed at exact screen location of the box
    frag.style.cssText = [
      'position:fixed',
      `left:${rect.left.toFixed(1)}px`,
      `top:${rect.top.toFixed(1)}px`,
      `width:${rect.width.toFixed(1)}px`,
      `height:${rect.height.toFixed(1)}px`,
      `clip-path:path('${piece.path}')`,
      'will-change:transform,opacity',
      'pointer-events:none',
      'opacity:0',
      'z-index:300',
      // GSAP will use this to rotate around the piece's own center
      `transform-origin:${piece.cx.toFixed(1)}px ${piece.cy.toFixed(1)}px`,
    ].join(';');

    // Clone the box content (full visual replica)
    const clone = boxEl.cloneNode(true);
    // Clear GSAP inline styles and IDs so clones don't conflict
    clone.removeAttribute('id');
    clone.querySelectorAll('[id]').forEach(el => el.removeAttribute('id'));
    Object.assign(clone.style, {
      position:      'absolute',
      left:          '0',
      top:           '0',
      width:         `${rect.width.toFixed(1)}px`,
      height:        `${rect.height.toFixed(1)}px`,
      margin:        '0',
      opacity:       '1',
      transform:     'none',
      pointerEvents: 'none',
      willChange:    'auto',
    });

    frag.appendChild(clone);
    document.body.appendChild(frag);
    return frag;
  });
}

/**
 * Remove all fragment elements previously created for a box.
 * @param {string} boxId
 */
export function cleanupFragments(boxId) {
  document.querySelectorAll(`.puzz-frag[data-frag-box="${boxId}"]`)
    .forEach(el => el.remove());
}
