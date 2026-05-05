<script>
  import { onMount, onDestroy } from 'svelte';
  import { solveIK, F_OPEN, F_FIST, lrp, rPt } from '../lib/ikSolver.js';

  // ── Arm state (mutated directly by App.svelte GSAP timeline)
  export let LP = { wx: 175, wy: 560, grip: 0 };
  export let RP = { wx: 1025, wy: 560, grip: 0 };
  export let gearL = { rot: 0 };
  export let gearR = { rot: 0 };
  export let gProxy = { y: 0 };
  export let gearScrollAccum = 0;

  // ── Constants
  const LS_X = 338, LS_Y = 402;
  const RS_X = 862, RS_Y = 402;
  const ARM_L = 270;

  // ── DOM refs (arm SVG elements)
  let armSVG;
  // Left arm
  let loLUpper, loLUpperN, loLElbow, loLElbowD, loLGear, loLLower, loLLowerN, loLWrist, loLPalm;
  let loLF = Array(5).fill(null).map(() => ({ s1: null, s2: null, n1: null, n2: null, j: null, t: null }));
  // Right arm
  let loRUpper, loRUpperN, loRElbow, loRElbowD, loRGear, loRLower, loRLowerN, loRWrist, loRPalm;
  let loRF = Array(5).fill(null).map(() => ({ s1: null, s2: null, n1: null, n2: null, j: null, t: null }));
  // Pistons
  let lPistonRod, lPistonRod2, rPistonRod, rPistonRod2;

  // ── Globe scene (road / terrain)
  let globeScene;

  // ── Helper: set line attributes
  function ln(el, x1, y1, x2, y2) {
    if (!el) return;
    el.setAttribute('x1', x1); el.setAttribute('y1', y1);
    el.setAttribute('x2', x2); el.setAttribute('y2', y2);
  }
  function cxy(el, x, y) {
    if (!el) return;
    el.setAttribute('cx', x); el.setAttribute('cy', y);
  }

  // ── Update hand geometry
  function updateHand(fingerRefs, wx, wy, grip, angle, mirror) {
    if (!fingerRefs[0]?.s1) return;
    const pL = [[-26,0],[26,0],[28,46],[-28,46]];
    if (loLPalm && mirror === -1) {
      loLPalm.setAttribute('points', pL.map(p => {
        const [rx,ry] = rPt(p[0]*mirror, p[1], angle);
        return `${(wx+rx).toFixed(1)},${(wy+ry).toFixed(1)}`;
      }).join(' '));
    }
    if (loRPalm && mirror === 1) {
      loRPalm.setAttribute('points', pL.map(p => {
        const [rx,ry] = rPt(p[0]*mirror, p[1], angle);
        return `${(wx+rx).toFixed(1)},${(wy+ry).toFixed(1)}`;
      }).join(' '));
    }

    for (let i = 0; i < 5; i++) {
      const fo = F_OPEN[i], ff = F_FIST[i];
      const bx = lrp(fo.b[0], ff.b[0], grip), by = lrp(fo.b[1], ff.b[1], grip);
      const mx = lrp(fo.m[0], ff.m[0], grip), my = lrp(fo.m[1], ff.m[1], grip);
      const tx = lrp(fo.t[0], ff.t[0], grip), ty = lrp(fo.t[1], ff.t[1], grip);
      const [brx, bry] = rPt(bx*mirror, by, angle);
      const [mrx, mry] = rPt(mx*mirror, my, angle);
      const [trx, try_] = rPt(tx*mirror, ty, angle);
      const Bx = wx+brx, By = wy+bry;
      const Mx = wx+mrx, My = wy+mry;
      const Tx = wx+trx, Ty = wy+try_;
      const f = fingerRefs[i];
      ln(f.s1, Bx, By, Mx, My); ln(f.s2, Mx, My, Tx, Ty);
      ln(f.n1, Bx, By, Mx, My); ln(f.n2, Mx, My, Tx, Ty);
      cxy(f.j, Mx, My); cxy(f.t, Tx, Ty);
    }
  }

  /**
   * Main update — called every GSAP tick via App.svelte.
   * Computes IK and updates all SVG arm elements.
   */
  export function updateAll() {
    if (globeScene) {
      globeScene.setAttribute('transform', `translate(0,${900 + gProxy.y})`);
    }

    const L = solveIK(LS_X, LS_Y, LP.wx, LP.wy, ARM_L, ARM_L, 1);
    const R = solveIK(RS_X, RS_Y, RP.wx, RP.wy, ARM_L, ARM_L, -1);

    // Left arm
    ln(loLUpper, LS_X, LS_Y, L.ex, L.ey);
    ln(loLUpperN, LS_X, LS_Y, L.ex, L.ey);
    cxy(loLElbow, L.ex, L.ey); cxy(loLElbowD, L.ex, L.ey); cxy(loLGear, L.ex, L.ey);
    ln(loLLower, L.ex, L.ey, L.wx, L.wy);
    ln(loLLowerN, L.ex, L.ey, L.wx, L.wy);
    if (loLWrist) { loLWrist.setAttribute('x', L.wx - 22); loLWrist.setAttribute('y', L.wy - 11); }

    // Right arm
    ln(loRUpper, RS_X, RS_Y, R.ex, R.ey);
    ln(loRUpperN, RS_X, RS_Y, R.ex, R.ey);
    cxy(loRElbow, R.ex, R.ey); cxy(loRElbowD, R.ex, R.ey); cxy(loRGear, R.ex, R.ey);
    ln(loRLower, R.ex, R.ey, R.wx, R.wy);
    ln(loRLowerN, R.ex, R.ey, R.wx, R.wy);
    if (loRWrist) { loRWrist.setAttribute('x', R.wx - 22); loRWrist.setAttribute('y', R.wy - 11); }

    // Gears
    const totalGL = gearL.rot + gearScrollAccum;
    const totalGR = gearR.rot - gearScrollAccum;
    if (loLGear) loLGear.setAttribute('transform', `rotate(${totalGL},${L.ex},${L.ey})`);
    if (loRGear) loRGear.setAttribute('transform', `rotate(${totalGR},${R.ex},${R.ey})`);

    // Hands
    const lAng = Math.atan2(L.wy - L.ey, L.wx - L.ex) - Math.PI / 2;
    const rAng = Math.atan2(R.wy - R.ey, R.wx - R.ex) - Math.PI / 2;
    updateHand(loLF, L.wx, L.wy, LP.grip, lAng, -1);
    updateHand(loRF, R.wx, R.wy, RP.grip, rAng,  1);

    // Pistons
    const pExtL = Math.max(0, Math.min(1, (LP.wy - 500) / 320)) * 38;
    const pExtR = Math.max(0, Math.min(1, (RP.wy - 500) / 320)) * 38;
    if (lPistonRod)  lPistonRod.setAttribute('x',  258 - pExtL);
    if (lPistonRod2) lPistonRod2.setAttribute('x', 260 - pExtL * 0.6);
    if (rPistonRod)  rPistonRod.setAttribute('x',  920 + pExtR);
    if (rPistonRod2) rPistonRod2.setAttribute('x', 914 + pExtR * 0.6);
  }

  onMount(() => {
    updateAll();
  });
</script>

<!-- ─── ROBOT BODY SVG (fixed background) ─────────────────── -->
<div class="bg-robot-container" aria-hidden="true">
  <svg id="mainSVG" class="bg-robot-svg" viewBox="0 0 1200 950" preserveAspectRatio="xMidYMin meet" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <filter id="nf" x="-10%" y="-10%" width="120%" height="120%">
        <feTurbulence type="fractalNoise" baseFrequency="0.04" numOctaves="3" result="n"/>
        <feDisplacementMap in="SourceGraphic" in2="n" scale="2" xChannelSelector="R" yChannelSelector="G"/>
      </filter>
      <radialGradient id="nebula" cx="50%" cy="22%" r="45%">
        <stop offset="0%"   stop-color="#080820" stop-opacity="0.9"/>
        <stop offset="60%"  stop-color="#04060f" stop-opacity="0.5"/>
        <stop offset="100%" stop-color="#03050a" stop-opacity="0"/>
      </radialGradient>
      <radialGradient id="mouth-glow" cx="50%" cy="50%" r="50%">
        <stop offset="0%"   stop-color="#000000" stop-opacity="1"/>
        <stop offset="70%"  stop-color="#050508" stop-opacity="0.95"/>
        <stop offset="100%" stop-color="#000"    stop-opacity="0.6"/>
      </radialGradient>
      <style>
        .neon-dot{fill:#00ffcc;filter:drop-shadow(0 0 10px #00ffcc);}
      </style>
    </defs>

    <!-- Background fill -->
    <rect x="0" y="0" width="1200" height="950" fill="#080d1a"/>
    <rect x="0" y="0" width="1200" height="950" fill="url(#nebula)"/>

    <!-- ROBOT BODY -->
    <g id="robot-body" opacity="0.70" filter="url(#nf)">
      <!-- Head -->
      <polygon points="487,8 713,8 745,38 752,95 740,155 706,175 494,175 460,155 448,95 455,38" fill="#05080c" stroke="#7a8fa8" stroke-width="3"/>
      <polygon points="497,16 703,16 732,44 738,92 727,148 698,166 502,166 472,148 462,92 468,44" fill="#05080c" stroke="#b0c4de" stroke-width="1.5"/>
      <line x1="452" y1="125" x2="748" y2="125" stroke="#b0c4de" stroke-width="1.5" opacity="0.6"/>
      <rect x="433" y="58" width="18" height="48" rx="4" fill="#05080c" stroke="#7a8fa8" stroke-width="2"/>
      <line x1="435" y1="68" x2="450" y2="68" stroke="#b0c4de" stroke-width="1" opacity=".7"/>
      <line x1="435" y1="76" x2="450" y2="76" stroke="#b0c4de" stroke-width="1" opacity=".7"/>
      <line x1="435" y1="84" x2="450" y2="84" stroke="#b0c4de" stroke-width="1" opacity=".7"/>
      <line x1="435" y1="92" x2="450" y2="92" stroke="#b0c4de" stroke-width="1" opacity=".7"/>
      <line x1="435" y1="100" x2="450" y2="100" stroke="#b0c4de" stroke-width="1" opacity=".7"/>
      <rect x="749" y="58" width="18" height="48" rx="4" fill="#05080c" stroke="#7a8fa8" stroke-width="2"/>
      <line x1="751" y1="68" x2="766" y2="68" stroke="#b0c4de" stroke-width="1" opacity=".7"/>
      <line x1="751" y1="76" x2="766" y2="76" stroke="#b0c4de" stroke-width="1" opacity=".7"/>
      <line x1="751" y1="84" x2="766" y2="84" stroke="#b0c4de" stroke-width="1" opacity=".7"/>
      <line x1="751" y1="92" x2="766" y2="92" stroke="#b0c4de" stroke-width="1" opacity=".7"/>
      <line x1="751" y1="100" x2="766" y2="100" stroke="#b0c4de" stroke-width="1" opacity=".7"/>
      <!-- Antenna -->
      <line x1="600" y1="8" x2="600" y2="-8" stroke="#7a8fa8" stroke-width="3.5"/>
      <circle cx="600" cy="-12" r="7" fill="#05080c" stroke="#b0c4de" stroke-width="1.8"/>
      <circle cx="600" cy="-12" r="4" class="neon-dot"/>
      <line x1="576" y1="4" x2="569" y2="-4" stroke="#b0c4de" stroke-width="1.5"/>
      <circle cx="567" cy="-6" r="3.5" fill="#05080c" stroke="#b0c4de" stroke-width="1.2"/><circle cx="567" cy="-6" r="1.8" class="neon-dot"/>
      <line x1="624" y1="4" x2="631" y2="-4" stroke="#b0c4de" stroke-width="1.5"/>
      <circle cx="633" cy="-6" r="3.5" fill="#05080c" stroke="#b0c4de" stroke-width="1.2"/><circle cx="633" cy="-6" r="1.8" class="neon-dot"/>
      <!-- Eyes -->
      <rect x="494" y="50" width="212" height="58" rx="8" fill="#05080c" stroke="#00ffcc" stroke-width="1.5" opacity="0.4"/>
      <circle cx="547" cy="79" r="22" fill="#05080c" stroke="#b0c4de" stroke-width="2"/>
      <circle cx="547" cy="79" r="15" fill="#00ffcc" style="filter:drop-shadow(0 0 20px #00ffcc)"/>
      <circle cx="540" cy="73" r="5" fill="#fff" opacity=".9"/>
      <circle cx="547" cy="79" r="6" fill="#004433" opacity="0.6"/>
      <circle cx="653" cy="79" r="22" fill="#05080c" stroke="#b0c4de" stroke-width="2"/>
      <circle cx="653" cy="79" r="15" fill="#00ffcc" style="filter:drop-shadow(0 0 20px #00ffcc)"/>
      <circle cx="646" cy="73" r="5" fill="#fff" opacity=".9"/>
      <circle cx="653" cy="79" r="6" fill="#004433" opacity="0.6"/>
      <!-- Jaw bar -->
      <rect x="455" y="130" width="290" height="24" rx="3" fill="#080d12" stroke="#7a8fa8" stroke-width="1.5"/>
      <line x1="462" y1="140" x2="738" y2="140" stroke="#00ffcc" stroke-width="1" opacity="0.3"/>
      <!-- Upper jaw -->
      <rect x="460" y="154" width="280" height="22" fill="#080c10" stroke="#7a8fa8" stroke-width="2"/>
      <polygon points="467,176 484,176 480,193 471,193" fill="#c8d0da" stroke="#8a9aaa" stroke-width="1"/>
      <polygon points="490,176 507,176 503,194 494,194" fill="#c8d0da" stroke="#8a9aaa" stroke-width="1"/>
      <polygon points="514,176 530,176 527,195 518,195" fill="#d0d8e2" stroke="#8a9aaa" stroke-width="1"/>
      <polygon points="537,176 554,176 551,196 542,196" fill="#c8d0da" stroke="#8a9aaa" stroke-width="1"/>
      <polygon points="562,176 578,176 575,196 566,196" fill="#d0d8e2" stroke="#8a9aaa" stroke-width="1"/>
      <polygon points="621,176 638,176 635,196 625,196" fill="#d0d8e2" stroke="#8a9aaa" stroke-width="1"/>
      <polygon points="646,176 663,176 659,195 650,195" fill="#c8d0da" stroke="#8a9aaa" stroke-width="1"/>
      <polygon points="670,176 687,176 683,194 674,194" fill="#d0d8e2" stroke="#8a9aaa" stroke-width="1"/>
      <polygon points="693,176 710,176 706,193 697,193" fill="#c8d0da" stroke="#8a9aaa" stroke-width="1"/>
      <polygon points="716,176 732,176 728,192 719,192" fill="#c8d0da" stroke="#8a9aaa" stroke-width="1"/>
      <!-- Mouth void -->
      <rect x="460" y="193" width="280" height="44" fill="url(#mouth-glow)"/>
      <rect x="462" y="193" width="276" height="44" fill="#000000"/>
      <ellipse cx="600" cy="210" rx="130" ry="16" fill="#050508" opacity="0.8"/>
      <!-- Lower jaw -->
      <polygon points="477,237 493,237 489,222 480,222" fill="#b8c0ca" stroke="#8a9aaa" stroke-width="1"/>
      <polygon points="500,237 517,237 513,221 504,221" fill="#c0c8d2" stroke="#8a9aaa" stroke-width="1"/>
      <polygon points="524,237 540,237 537,220 528,220" fill="#b8c0ca" stroke="#8a9aaa" stroke-width="1"/>
      <polygon points="548,237 564,237 561,220 552,220" fill="#c0c8d2" stroke="#8a9aaa" stroke-width="1"/>
      <polygon points="635,237 651,237 648,220 639,220" fill="#b8c0ca" stroke="#8a9aaa" stroke-width="1"/>
      <polygon points="658,237 675,237 671,221 662,221" fill="#c0c8d2" stroke="#8a9aaa" stroke-width="1"/>
      <polygon points="682,237 699,237 695,222 686,222" fill="#b8c0ca" stroke="#8a9aaa" stroke-width="1"/>
      <polygon points="706,237 722,237 718,222 709,222" fill="#c0c8d2" stroke="#8a9aaa" stroke-width="1"/>
      <rect x="460" y="237" width="280" height="24" fill="#080c10" stroke="#7a8fa8" stroke-width="2"/>
      <path d="M 460,261 Q 600,285 740,261 L 740,268 Q 600,294 460,268 Z" fill="#05080c" stroke="#7a8fa8" stroke-width="1.5"/>
      <!-- Neck -->
      <rect x="569" y="268" width="62" height="28" rx="5" fill="#05080c" stroke="#7a8fa8" stroke-width="2"/>
      <line x1="580" y1="268" x2="580" y2="296" stroke="#b0c4de" stroke-width="1" opacity=".6"/>
      <line x1="592" y1="268" x2="592" y2="296" stroke="#b0c4de" stroke-width="1" opacity=".6"/>
      <line x1="608" y1="268" x2="608" y2="296" stroke="#b0c4de" stroke-width="1" opacity=".6"/>
      <line x1="620" y1="268" x2="620" y2="296" stroke="#b0c4de" stroke-width="1" opacity=".6"/>
      <!-- Torso -->
      <polygon points="460,296 740,296 712,490 488,490" fill="#05080c" stroke="#7a8fa8" stroke-width="3.5"/>
      <polygon points="472,308 728,308 704,480 496,480" fill="#05080c" stroke="#b0c4de" stroke-width="1.5"/>
      <line x1="462" y1="348" x2="738" y2="348" stroke="#b0c4de" stroke-width="1.5"/>
      <line x1="470" y1="390" x2="730" y2="390" stroke="#b0c4de" stroke-width="1.5" stroke-dasharray="6 4" opacity=".6"/>
      <line x1="480" y1="432" x2="720" y2="432" stroke="#b0c4de" stroke-width="1" opacity=".4"/>
      <!-- Chest arc reactor -->
      <circle cx="600" cy="395" r="44" fill="#05080c" stroke="#b0c4de" stroke-width="1.8"/>
      <circle cx="600" cy="395" r="28" fill="#05080c" stroke="#b0c4de" stroke-width="1.2" stroke-dasharray="5 3"/>
      <circle cx="600" cy="395" r="16" fill="#00ffcc" style="filter:drop-shadow(0 0 22px #00ffcc)"/>
      <circle cx="600" cy="395" r="6" fill="#fff"/>
      <path d="M 588,372 L 600,360 L 596,366 L 612,360 L 600,372 L 604,367 Z" stroke="#00ffcc" stroke-width="1.8" fill="none" style="filter:drop-shadow(0 0 5px #00ffcc)"/>
      <rect x="496" y="470" width="208" height="18" rx="5" fill="#05080c" stroke="#b0c4de" stroke-width="1.5"/>
      <rect x="572" y="470" width="56" height="18" rx="4" fill="none" stroke="#00ffcc" stroke-width="1.5" opacity=".5"/>
      <!-- Left shoulder pad -->
      <path d="M 460,296 L 325,296 L 298,342 L 305,400 L 360,420 L 460,408 L 468,350 Z" fill="#05080c" stroke="#7a8fa8" stroke-width="2.5"/>
      <circle cx="338" cy="402" r="26" fill="#05080c" stroke="#b0c4de" stroke-width="3"/>
      <circle cx="338" cy="402" r="13" class="neon-dot"/>
      <rect id="l-piston-housing" x="278" y="360" width="60" height="22" rx="4" fill="#05080c" stroke="#7a8fa8" stroke-width="2"/>
      <rect bind:this={lPistonRod}  id="l-piston-rod"  x="248" y="366" width="32" height="10" rx="3" fill="#8a9cb5" stroke="#6a7c95" stroke-width="1"/>
      <rect x="278" y="363" width="4" height="16" rx="1" fill="#00ffcc" opacity="0.5"/>
      <rect x="285" y="390" width="55" height="18" rx="3" fill="#05080c" stroke="#7a8fa8" stroke-width="1.5"/>
      <rect bind:this={lPistonRod2} id="l-piston-rod2" x="258" y="395" width="28" height="8" rx="2" fill="#6a7c95" stroke="#4a5c75" stroke-width="1"/>
      <!-- Right shoulder pad -->
      <path d="M 740,296 L 875,296 L 902,342 L 895,400 L 840,420 L 740,408 L 732,350 Z" fill="#05080c" stroke="#7a8fa8" stroke-width="2.5"/>
      <circle cx="862" cy="402" r="26" fill="#05080c" stroke="#b0c4de" stroke-width="3"/>
      <circle cx="862" cy="402" r="13" class="neon-dot"/>
      <rect id="r-piston-housing" x="862" y="360" width="60" height="22" rx="4" fill="#05080c" stroke="#7a8fa8" stroke-width="2"/>
      <rect bind:this={rPistonRod}  id="r-piston-rod"  x="920" y="366" width="32" height="10" rx="3" fill="#8a9cb5" stroke="#6a7c95" stroke-width="1"/>
      <rect x="918" y="363" width="4" height="16" rx="1" fill="#00ffcc" opacity="0.5"/>
      <rect x="860" y="390" width="55" height="18" rx="3" fill="#05080c" stroke="#7a8fa8" stroke-width="1.5"/>
      <rect bind:this={rPistonRod2} id="r-piston-rod2" x="914" y="395" width="28" height="8" rx="2" fill="#6a7c95" stroke="#4a5c75" stroke-width="1"/>
    </g>
  </svg>
</div>

<!-- ─── ARM OVERLAY SVG (dynamic, IK-driven) ────────────── -->
<svg
  bind:this={armSVG}
  id="armSVG"
  aria-hidden="true"
  style="position:fixed;top:0;left:50%;transform:translateX(-50%);width:100%;max-width:1200px;height:120%;z-index:20;pointer-events:none;overflow:visible;"
  viewBox="0 0 1200 950"
  preserveAspectRatio="xMidYMin meet"
  xmlns="http://www.w3.org/2000/svg"
>
  <!-- Left arm -->
  <line bind:this={loLUpper}  class="as"/><line bind:this={loLUpperN} class="an"/>
  <circle bind:this={loLElbow}  class="aj" r="18"/>
  <circle bind:this={loLElbowD} class="ad" r="9"/>
  <circle bind:this={loLGear}   class="ag" r="22"/>
  <line bind:this={loLLower}  class="as"/><line bind:this={loLLowerN} class="an"/>
  <rect  bind:this={loLWrist}  class="aw" width="44" height="22" rx="6"/>
  <polygon bind:this={loLPalm} class="ap"/>
  <!-- Left fingers (5 each: s1 s2 n1 n2 joint tip) -->
  {#each loLF as f, i}
    <line bind:this={loLF[i].s1} class="af"/>
    <line bind:this={loLF[i].s2} class="af"/>
    <line bind:this={loLF[i].n1} class="afn"/>
    <line bind:this={loLF[i].n2} class="afn"/>
    <circle bind:this={loLF[i].j} class="afj" r="5.5"/>
    <circle bind:this={loLF[i].t} class="aft" r="4"/>
  {/each}

  <!-- Right arm -->
  <line bind:this={loRUpper}  class="as"/><line bind:this={loRUpperN} class="an"/>
  <circle bind:this={loRElbow}  class="aj" r="18"/>
  <circle bind:this={loRElbowD} class="ad" r="9"/>
  <circle bind:this={loRGear}   class="ag" r="22"/>
  <line bind:this={loRLower}  class="as"/><line bind:this={loRLowerN} class="an"/>
  <rect  bind:this={loRWrist}  class="aw" width="44" height="22" rx="6"/>
  <polygon bind:this={loRPalm} class="ap"/>
  <!-- Right fingers -->
  {#each loRF as f, i}
    <line bind:this={loRF[i].s1} class="af"/>
    <line bind:this={loRF[i].s2} class="af"/>
    <line bind:this={loRF[i].n1} class="afn"/>
    <line bind:this={loRF[i].n2} class="afn"/>
    <circle bind:this={loRF[i].j} class="afj" r="5.5"/>
    <circle bind:this={loRF[i].t} class="aft" r="4"/>
  {/each}
</svg>

<style>
/* ─── Robot background container ───────────────────────────── */
.bg-robot-container {
  position: fixed;
  top: 0; left: 0;
  width: 100vw; height: 100vh;
  z-index: -2;
  pointer-events: none;
  display: flex;
  justify-content: center;
  align-items: flex-start;
}
.bg-robot-svg {
  width: 100%;
  height: 120%;
  max-width: 1200px;
  overflow: visible;
}

/* ─── Arm SVG class definitions ─────────────────────────────── */
:global(.as)  { fill:none; stroke:#7a8fa8; stroke-width:9;   stroke-linecap:round; }
:global(.an)  { fill:none; stroke:#00ffcc; stroke-width:2.5; stroke-linecap:round; filter:drop-shadow(0 0 6px #00ffcc); }
:global(.aj)  { fill:#05080c; stroke:#b0c4de; stroke-width:3; }
:global(.ad)  { fill:#00ffcc; filter:drop-shadow(0 0 8px #00ffcc); }
:global(.ag)  { fill:none; stroke:#8a9cb5; stroke-width:4; stroke-dasharray:9 6; }
:global(.aw)  { fill:#05080c; stroke:#b0c4de; stroke-width:2.5; }
:global(.ap)  { fill:#05080c; stroke:#8a9cb5; stroke-width:2.5; stroke-linejoin:round; }
:global(.af)  { fill:none; stroke:#7a8fa8; stroke-width:5.5; stroke-linecap:round; }
:global(.afn) { fill:none; stroke:#00ffcc; stroke-width:1.8; stroke-linecap:round; filter:drop-shadow(0 0 4px #00ffcc); opacity:0.7; }
:global(.afj) { fill:#05080c; stroke:#8a9cb5; stroke-width:1.8; }
:global(.aft) { fill:#00ffcc; filter:drop-shadow(0 0 6px #00ffcc); }
</style>
