/**
 * Inverse Kinematics solver for the robot arm system.
 * Two-bone IK using law of cosines.
 * @param {number} sx  - Shoulder X
 * @param {number} sy  - Shoulder Y
 * @param {number} tx  - Target (wrist) X
 * @param {number} ty  - Target (wrist) Y
 * @param {number} L1  - Upper arm length
 * @param {number} L2  - Lower arm length
 * @param {number} flip - +1 or -1 to choose elbow bend direction
 * @returns {{ ex, ey, wx, wy }} Elbow and clamped wrist positions
 */
export function solveIK(sx, sy, tx, ty, L1, L2, flip) {
  const dx = tx - sx;
  const dy = ty - sy;
  const d  = Math.hypot(dx, dy);

  // Clamp target to max reach
  const maxR = L1 + L2 - 0.1;
  const dc   = Math.min(d, maxR);
  const tx2  = d > maxR ? sx + (dx / d) * dc : tx;
  const ty2  = d > maxR ? sy + (dy / d) * dc : ty;

  const dx2 = tx2 - sx;
  const dy2 = ty2 - sy;
  const d2  = Math.hypot(dx2, dy2);

  const base = Math.atan2(dy2, dx2);
  const cosA = Math.max(-1, Math.min(1, (d2*d2 + L1*L1 - L2*L2) / (2 * d2 * L1)));
  const ea   = base + flip * Math.acos(cosA);

  let ex = sx + L1 * Math.cos(ea);
  let ey = sy + L1 * Math.sin(ea);

  // Floor clamp — elbow can't go above shoulder by more than 28%
  const MIN_EY = sy - L1 * 0.28;
  if (ey < MIN_EY) {
    ey = MIN_EY;
    const dh = Math.sqrt(Math.max(0, L1*L1 - (ey - sy)*(ey - sy)));
    ex = sx - flip * dh;
  }

  return { ex, ey, wx: tx2, wy: ty2 };
}

// ── 5-finger hand geometry (open pose)
export const F_OPEN = [
  { b: [-22, 40], m: [-30, 65], t: [-34, 82] },
  { b: [-11, 43], m: [-14, 70], t: [-15, 88] },
  { b: [ -1, 45], m: [ -1, 73], t: [  -1, 92] },
  { b: [  9, 43], m: [ 13, 70], t: [  15, 88] },
  { b: [ 21, 30], m: [ 33, 48], t: [  40, 64] },
];

// ── 5-finger hand geometry (fist pose)
export const F_FIST = [
  { b: [-22, 40], m: [-20, 55], t: [-16, 49] },
  { b: [-11, 43], m: [ -8, 57], t: [ -4, 51] },
  { b: [ -1, 45], m: [  0, 59], t: [  2, 53] },
  { b: [  9, 43], m: [  9, 57], t: [  7, 51] },
  { b: [ 21, 30], m: [ 12, 47], t: [  2, 54] },
];

/** Linear interpolation */
export function lrp(a, b, t) {
  return a * (1 - t) + b * t;
}

/**
 * Rotate a 2D point around origin.
 * @param {number} px
 * @param {number} py
 * @param {number} a  - angle in radians
 * @returns {[number, number]}
 */
export function rPt(px, py, a) {
  const c = Math.cos(a);
  const s = Math.sin(a);
  return [px * c - py * s, px * s + py * c];
}
