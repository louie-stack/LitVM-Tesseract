/* LitVM Tesseract Accelerator.
   Site-style sections around one immersive stretch: you enter the tesseract, fly the Track,
   and come out at the Cohort 1 line-up.
   Fill in Cohort 1 in COHORT. To swap art see HANDOFF.md. */
import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import Lenis from 'lenis';
import { FS_VERT, BG_FRAG, GLASS_VERT, GLASS_FRAG, DUST_VERT, DUST_FRAG, FINAL_FRAG } from './shaders.js';
import { TUNNEL_FRAG, WORLD_FRAG, STREAK_VERT, STREAK_FRAG } from './tunnel.js';
import { Hyper } from './hyper.js';

/* ---------- content ---------- */
const COHORT = [1, 2, 3, 4, 5].map((n) => ({ name: `Project 0${n}`, note: 'To be announced' }));
const STAGES = ['Awareness', 'Integration', 'Consideration', 'Conversion', 'Nurture'];
const STOPS = [['New Cohort', 0], ['Intake', 0], ['Account Exec', 1], ['First Call', 1], ['Identify Goals', 1], ['Roadmap', 1], ['Intro Tesseract Network', 1], ['Audits', 2], ['Pitching', 2], ['Prompt Classes', 2], ['Second Call', 3], ['Amplification', 3], ['Campaign', 3], ['Transported', 4]];
const ART = {
  hero: { aspect: 1696 / 1184, x: 0.773, y: 0.67, beamV: 0.19 },
  net: { aspect: 3096 / 2160, x: 0.51, y: 0.73 },
};
const GATE = 8, ZEND = GATE * (STOPS.length + 1), ZK = 1.968;

/* ---------- helpers ---------- */
const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
const clamp = (v, a, b) => Math.min(b, Math.max(a, v)), lerp = (a, b, t) => a + (b - a) * t;
const sstep = (a, b, v) => { const t = clamp((v - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
const RM = matchMedia('(prefers-reduced-motion: reduce)').matches;
const COARSE = matchMedia('(pointer: coarse)').matches || innerWidth < 768;
const tunnelR = (z) => { let t = clamp(z / ZEND, 0, 1); t = t * t * (3 - 2 * t); return lerp(7.5, 3.1, t); };

function fsQuad(frag, uniforms, defines = {}) {
  const m = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), new THREE.ShaderMaterial({ vertexShader: FS_VERT, fragmentShader: frag, uniforms, defines, depthTest: false, depthWrite: false }));
  m.frustumCulled = false; return m;
}
const stageColor = (z) => {
  const s = clamp(z / ZEND, 0, 1) * 4, c = [[0.42, 0.82, 1], [0.16, 0.86, 0.98], [0.16, 0.98, 0.78], [0.42, 1, 0.6], [1, 0.74, 0.42]];
  const i = Math.min(Math.floor(s), 3); let t = s - i; if (i === 3) t = sstep(0.72, 1, t); return c[i].map((v, k) => lerp(v, c[i + 1][k], t));
};

/* ---------- DOM built from data ---------- */
function buildDom() {
  $('#tx-progress').innerHTML = STAGES.map((n, i) => `<div class="tx-seg s${i}" style="flex:${STOPS.filter((x) => x[1] === i).length}"><i><b></b></i><span>${n}</span></div>`).join('');
  $('#tx-chambers').innerHTML = COHORT.map((c) => `<article class="tx-chamber"><h3>${c.name}</h3><p>${c.note}</p></article>`).join('');
  $$('[data-words]').forEach((el) => { let out = ''; el.childNodes.forEach((n) => { const st = n.nodeType === 1; n.textContent.split(/(\s+)/).forEach((w) => { out += w.trim() ? `<span class="tx-w${st ? ' is-strong' : ''}">${w}</span>` : w; }); }); el.innerHTML = out; });
  $$('[data-rise]').forEach((el) => { el.innerHTML = el.innerHTML.split(/<br\s*\/?>/i).map((l) => `<span class="tx-line"><span>${l}</span></span>`).join(''); });
}

function boot() {
  buildDom();
  document.documentElement.classList.add('tx-ready');
  const canvas = $('#tx-gl');
  let renderer;
  try { renderer = new THREE.WebGLRenderer({ canvas, antialias: false, powerPreference: 'high-performance', alpha: false }); }
  catch (e) { document.documentElement.classList.add('tx-nogl'); return; }
  renderer.outputColorSpace = THREE.LinearSRGBColorSpace; renderer.toneMapping = THREE.NoToneMapping;
  let dpr = Math.min(devicePixelRatio || 1, COARSE ? 1.5 : 2), latScale = COARSE ? 0.6 : 1;

  /* textures */
  const loader = new THREE.TextureLoader();
  const tex = (u) => { const t = loader.load(u); t.colorSpace = THREE.NoColorSpace; t.minFilter = t.magFilter = THREE.LinearFilter; t.generateMipmaps = false; return t; };
  const sm = COARSE ? '-sm' : '';
  const T_ = { heroC: tex(`assets/art/portal${sm}.webp`), heroD: tex('assets/art/portal-depth.webp'), netC: tex(`assets/art/sky${sm}.webp`), netD: tex('assets/art/sky-depth.webp') };

  /* targets and shared uniforms */
  const latRT = new THREE.WebGLRenderTarget(4, 4, { type: THREE.HalfFloatType, depthBuffer: false });
  const bgRT = new THREE.WebGLRenderTarget(4, 4, { type: THREE.HalfFloatType, depthBuffer: false });
  const maskRT = new THREE.WebGLRenderTarget(4, 4, { depthBuffer: false, samples: COARSE ? 0 : 4 });
  const shared = { tBg: { value: bgRT.texture }, uRes: { value: new THREE.Vector2(1, 1) }, uTime: { value: 0 } };

  /* tunnel */
  const latU = { uTime: shared.uTime, uAspect: { value: 1 }, uZ: { value: 0 }, uRoll: { value: 0 }, uLen: { value: ZEND }, uCam: { value: new THREE.Vector2() } };
  const latScene = new THREE.Scene(); latScene.add(fsQuad(TUNNEL_FRAG, latU, { STEPS: COARSE ? 32 : 56 }));
  const fsCam = new THREE.Camera();

  /* world composite */
  const wU = {
    tPaintA: { value: T_.heroC }, tDepthA: { value: T_.heroD }, tPaintB: { value: T_.netC }, tDepthB: { value: T_.netD }, tLat: { value: latRT.texture }, tMask: { value: maskRT.texture }, uSplit: { value: 0 }, uScrollA: { value: 0 }, uHeroDesk: { value: 1 }, uMaskOn: { value: 0 }, uMaskFull: { value: 0 },
    uPaintA: { value: 1 }, uPaintB: { value: 0 }, uLat: { value: 0 }, uGrad: { value: 0 }, uVault: { value: 0 }, uTime: shared.uTime, uAspect: { value: 1 }, uAspA: { value: ART.hero.aspect }, uAspB: { value: ART.net.aspect },
    uDolly: { value: 0 }, uLatGain: { value: 1 }, uVaultBeams: { value: 1 }, uOff: { value: new THREE.Vector2() }, uFocus: { value: new THREE.Vector2(0.5, 0.5) }, uGlowPos: { value: new THREE.Vector2(0.5, 0.5) }, uBeam: { value: new THREE.Vector2(0.77, 0.19) }, uPosA: { value: new THREE.Vector2(0.5, 0.5) }, uPosB: { value: new THREE.Vector2(0.5, 0.5) },
    uGlowAmt: { value: 0.5 }, uBeamAmt: { value: 0.5 }, uBeamW: { value: 1 }, uGlowCol: { value: new THREE.Color('#57d8ff') }, uVaultCol: { value: new THREE.Color('#6fdcff') }, uBeamsX: { value: [0, 0, 0, 0, 0] }, uBeamHot: { value: [0, 0, 0, 0, 0] },
  };
  const worldScene = new THREE.Scene(); worldScene.add(fsQuad(WORLD_FRAG, wU));

  /* main scene */
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 200);
  const D = 10, halfH = Math.tan(THREE.MathUtils.degToRad(17.5)) * D;
  const bgQuad = fsQuad(BG_FRAG, { tBg: shared.tBg }); bgQuad.renderOrder = -10; scene.add(bgQuad);
  const hero = new Hyper(shared); hero.group.position.z = -D; scene.add(hero.group);
  const maskScene = new THREE.Scene(), maskMesh = new THREE.Mesh(hero.panes.geometry, new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.DoubleSide, toneMapped: false }));
  maskMesh.frustumCulled = false; maskMesh.matrixAutoUpdate = false; maskScene.add(maskMesh);

  const glassMat = (u) => new THREE.ShaderMaterial({ vertexShader: GLASS_VERT, fragmentShader: GLASS_FRAG, uniforms: u, transparent: true, side: THREE.DoubleSide });
  const instAttrs = (geo, n, col, ph = 0.083) => {
    const c = new THREE.InstancedBufferAttribute(new Float32Array(n * 3), 3); for (let i = 0; i < n; i++) c.setXYZ(i, col[0], col[1], col[2]); c.setUsage(THREE.DynamicDrawUsage);
    const e = new THREE.InstancedBufferAttribute(new Float32Array(n).fill(1), 1); e.setUsage(THREE.DynamicDrawUsage);
    geo.setAttribute('aColor', c); geo.setAttribute('aEnergy', e); geo.setAttribute('aPhase', new THREE.InstancedBufferAttribute(new Float32Array(n).map((_, i) => i * ph), 1));
    return { c, e };
  };

  /* the gates: real glass frames, one per stop plus the way out */
  const gateCount = STOPS.length + 1, gateU = { tBg: shared.tBg, uRes: shared.uRes, uTime: shared.uTime, uInk: { value: 0 }, uSolid: { value: 0 }, uAlpha: { value: 1 }, uRefract: { value: 0.09 }, uBar: { value: 1 }, uFade: { value: 0 } };
  const gateGeo = new THREE.CylinderGeometry(1, 1, 1, 6, 1, true), gateMesh = new THREE.InstancedMesh(gateGeo, glassMat(gateU), gateCount * 6);
  const gateA = instAttrs(gateGeo, gateCount * 6, [1, 1, 1], 0.041); gateMesh.frustumCulled = false; gateMesh.renderOrder = 3; scene.add(gateMesh);
  const gateCornerGeo = new THREE.IcosahedronGeometry(1, 1), cornerMesh = new THREE.InstancedMesh(gateCornerGeo, glassMat(gateU), gateCount * 6);
  const cornerA = instAttrs(gateCornerGeo, gateCount * 6, [1, 1, 1], 0); cornerMesh.frustumCulled = false; cornerMesh.renderOrder = 3; scene.add(cornerMesh);

  /* speed lines */
  const SN = COARSE ? 70 : 150, sPos = new Float32Array(SN * 6), sSeed = new Float32Array(SN * 6), sEnd = new Float32Array(SN * 2);
  for (let i = 0; i < SN; i++) { const a = Math.random(), b = Math.random(), c = Math.random(); for (let j = 0; j < 2; j++) { sSeed.set([a, b, c], (i * 2 + j) * 3); sEnd[i * 2 + j] = j; } }
  const sG = new THREE.BufferGeometry(); sG.setAttribute('position', new THREE.BufferAttribute(sPos, 3)); sG.setAttribute('aSeed', new THREE.BufferAttribute(sSeed, 3)); sG.setAttribute('aEnd', new THREE.BufferAttribute(sEnd, 1));
  const sU = { uZ: { value: 0 }, uLen: { value: ZEND }, uStretch: { value: 0 }, uRoll: { value: 0 }, uR: { value: 1 }, uCam: { value: new THREE.Vector2() }, uAlpha: { value: 0 }, uGain: { value: 0.9 } };
  const streaks = new THREE.LineSegments(sG, new THREE.ShaderMaterial({ vertexShader: STREAK_VERT, fragmentShader: STREAK_FRAG, uniforms: sU, transparent: true, depthWrite: false, blending: THREE.CustomBlending, blendSrc: THREE.OneFactor, blendDst: THREE.OneFactor }));
  streaks.frustumCulled = false; streaks.renderOrder = 2; scene.add(streaks);

  /* five sealed tesseracts and their reflections */
  const FLIP = new THREE.Matrix4(), SCALEY = new THREE.Matrix4().makeScale(1, -1, 1);
  const minis = COHORT.map((c, i) => {
    const h = new Hyper(shared); h.ang = [0.5 + i * 0.16, 0.2 + i * 0.1, 0.35 + i * 0.06]; h.tumble = 0.2; h.thick = 0.042; h.boost = 0; h.group.position.z = -D; h.group.visible = false; scene.add(h.group);
    const rm = glassMat({ ...h.u, uAlpha: { value: 0.2 }, uFade: { value: 0.5 } }); rm.depthWrite = false;
    const mirror = new THREE.Group(); mirror.matrixAutoUpdate = false;
    const mr = new THREE.InstancedMesh(h.rods.geometry, rm, 32), mg = new THREE.InstancedMesh(h.gems.geometry, rm, 16);
    mr.instanceMatrix = h.rods.instanceMatrix; mg.instanceMatrix = h.gems.instanceMatrix; mr.frustumCulled = mg.frustumCulled = false; mr.renderOrder = mg.renderOrder = 2;
    mirror.add(mr, mg); mirror.visible = false; scene.add(mirror); h.mirror = mirror; h.mirrorU = rm.uniforms;
    return h;
  });

  /* dust */
  const N = COARSE ? 900 : 2800, dustG = new THREE.BufferGeometry(), seeds = new Float32Array(N * 3); for (let i = 0; i < N * 3; i++) seeds[i] = Math.random();
  dustG.setAttribute('aSeed', new THREE.BufferAttribute(seeds, 3)); dustG.setAttribute('position', new THREE.BufferAttribute(new Float32Array(N * 3), 3));
  const dU = { uTime: shared.uTime, uSize: { value: 24 }, uSwarm: { value: 0 }, uRadius: { value: 2 }, uCenter: { value: new THREE.Vector3(0, 0, -D) }, uColor: { value: new THREE.Color('#bfefff') }, uAlpha: { value: 0.4 } };
  const dust = new THREE.Points(dustG, new THREE.ShaderMaterial({ vertexShader: DUST_VERT, fragmentShader: DUST_FRAG, uniforms: dU, transparent: true, depthWrite: false, blending: THREE.CustomBlending, blendSrc: THREE.OneFactor, blendDst: THREE.OneFactor }));
  dust.frustumCulled = false; dust.renderOrder = 5; scene.add(dust);

  /* post */
  const composerRT = new THREE.WebGLRenderTarget(4, 4, { type: THREE.HalfFloatType, samples: COARSE ? 0 : 4 });
  const composer = new EffectComposer(renderer, composerRT);
  composer.addPass(new RenderPass(scene, camera));
  const bloom = new UnrealBloomPass(new THREE.Vector2(256, 256), 0.15, 0.38, 1.05); composer.addPass(bloom);
  const finalU = { tDiffuse: { value: null }, uWarp: { value: 0 }, uWhite: { value: 0 }, uVig: { value: 0.7 }, uCA: { value: 0.012 }, uTime: shared.uTime, uTint: { value: new THREE.Color(1, 1, 1) }, uScrim: { value: 0 }, uScrimDesk: { value: 1 }, uDim: { value: 1 }, uTone: { value: 0 } };
  composer.addPass(new ShaderPass(new THREE.ShaderMaterial({ vertexShader: 'varying vec2 vUv;void main(){vUv=uv;gl_Position=vec4(position.xy,0.,1.);}', fragmentShader: FINAL_FRAG, uniforms: finalU, depthTest: false, depthWrite: false })));

  /* ---------- layout and the keyframed story ---------- */
  let vw = 1, vh = 1, aspect = 1, desk = true, keys = [], T = {}, closePos = 0.62, netFocus = [0.5, 0.5], heroFocus = [0.5, 0.5];
  const sec = { hero: $('#hero'), mission: $('#mission'), dims: $('#dimensions'), track: $('#track'), cohort: $('#cohort'), team: $('#team'), apply: $('#apply') };
  const top = (el) => el.getBoundingClientRect().top + scrollY;
  const box = (el) => ({ t: top(el), h: el.offsetHeight });

  function layout() {
    vw = document.documentElement.clientWidth; vh = innerHeight; aspect = vw / vh; desk = vw >= 992;
    renderer.setPixelRatio(dpr); renderer.setSize(vw, vh, true); composer.setPixelRatio(dpr); composer.setSize(vw, vh);
    const W = Math.round(vw * dpr), H = Math.round(vh * dpr);
    shared.uRes.value.set(W, H); bgRT.setSize(W, H); maskRT.setSize(Math.round(W * 0.75), Math.round(H * 0.75)); latRT.setSize(Math.round(W * latScale), Math.round(H * latScale));
    camera.aspect = aspect; camera.updateProjectionMatrix();
    latU.uAspect.value = aspect; wU.uAspect.value = aspect; wU.uBeamW.value = aspect < 1 ? 0.7 : 1;

    const cover = (a) => (aspect > a ? [1, a / aspect] : [aspect / a, 1]);
    const k = cover(ART.hero.aspect);
    let posX = 0.5; if (k[0] < 1 && !desk) posX = clamp(0.5 + (ART.hero.x - 0.5) / (1 - k[0]), 0, 1);
    wU.uPosA.value.set(posX, 0.5);
    const toS = (ka, pos, u, v, posY = 0.5) => { const sx = (u - 0.5 - (1 - ka[0]) * (pos - 0.5)) / ka[0] + 0.5, sy = (v - 0.5 - (1 - ka[1]) * (posY - 0.5)) / ka[1] + 0.5; return [0.5 + (sx - 0.5) / 0.92, 0.5 + (sy - 0.5) / 0.92]; };
    const obj = toS(k, posX, ART.hero.x, ART.hero.y), bm = toS(k, posX, ART.hero.x, ART.hero.beamV);
    const heroX = obj[0] * 2 - 1, heroY = (desk ? obj[1] : Math.max(obj[1], 0.68)) * 2 - 1;
    wU.uBeam.value.set(bm[0], bm[1]); heroFocus = obj;
    const kn = cover(ART.net.aspect); let posN = 0.5; if (kn[0] < 1) posN = clamp(0.5 + (ART.net.x - 0.5) / (1 - kn[0]), 0, 1);
    const coin = toS(kn, posN, ART.net.x, ART.net.y, 0.2); netFocus = coin; T.posN = posN;
    const coinX = coin[0] * 2 - 1, coinY = coin[1] * 2 - 1;

    const m = box(sec.mission), d = box(sec.dims), tr = box(sec.track), co = box(sec.cohort), te = box(sec.team), a = box(sec.apply);
    Object.assign(T, { m, d, tr, co, te, a });
    const mE = m.t + m.h - vh, dE = d.t + d.h - vh, trE = tr.t + tr.h - vh, coE = co.t + co.h - vh;
    const tp = (p) => tr.t + (trE - tr.t) * p;
    T.tp = tp; T.mE = mE;
    // measured from the real layout, so the object sits exactly where the page says it should
    const pinRect = (el) => { const e = el.getBoundingClientRect(), p = el.closest('.tx-pin').getBoundingClientRect(); return { t: e.top - p.top, b: e.bottom - p.top }; };
    const toNdcY = (py) => 1 - (py / vh) * 2;
    const titleB = pinRect($('.tx-dim-stage .tx-title')).b, cardR = pinRect($('.tx-cards'));
    const dimObj = desk ? { x: 0, y: toNdcY((cardR.t + cardR.b) / 2), r: Math.min((cardR.b - cardR.t) * 0.3 / vh, 0.17) } : { x: 0, y: toNdcY((titleB + cardR.t) / 2), r: Math.min((cardR.t - titleB) * 0.4 / vh, 0.14) };
    const midObj = desk ? { x: 0.5, y: 0 } : { x: 0, y: 0.56 };
    const midR = desk ? 0.3 : 0.17;
    const headB = pinRect($('.tx-track-head')).b, entryCy = (headB + vh) / 2, entryR = Math.min((vh - headB) * 0.43 / vh, desk ? 0.34 : 0.24, (vw * 0.42) / (0.866 * vh));
    const sealR = Math.min(0.1, (ART.net.coin || 0.1));

    const base = { paintA: 1, paintB: 0, grad: 0, lat: 0, vault: 0, dolly: 0, x: heroX, y: heroY, r: 0.21, alpha: 1, settle: 0, hexOnly: 0, sealT: 0.05, spin: 1, energy: 1.35, solid: 0, latZ: 1, white: 0, warp: 0, bloom: 0.1, vig: 0.28, tone: 0, glow: 0.16, beam: 0.3, dust: 0, mini: 0, thick: 0.04, streak: 0, ref: 0.06 };
    const raw = [
      [0, {}],
      // the painting recedes into the site's gradient; Mission holds while the cube turns
      [m.t, { paintA: 0, grad: 1, ...midObj, r: midR * 0.9, glow: 0, beam: 0.2, vig: 0.12, bloom: 0.1, spin: 0.25 }],
      [mE, { ...midObj, beam: 0, r: midR * 1.08, spin: 0.25 }],
      [d.t, { ...dimObj, spin: 1, energy: 1.15, bloom: 0.1 }],
      [dE - vh * 0.25, { ...dimObj }],
      // the cube comes to centre with the tunnel visible through its faces
      [tr.t, { x: 0, y: toNdcY(entryCy), r: entryR, spin: 0.8, lat: 1, latZ: 1, energy: 1.2, bloom: 0.12 }],
      [tp(0.04), { latZ: 1.2, r: entryR * 1.08, spin: 0.6 }],
      // ...and you go through it
      [tp(0.105), { y: 0, r: 5, alpha: 0, latZ: 5, spin: 0.2 }],
      [tp(0.107), { grad: 0, tone: 1, vig: 0.75, r: 0.05, bloom: 0.16, streak: 0 }],
      [tp(0.16), { latZ: 10, streak: 1 }],
      [tp(0.88), { latZ: GATE * (STOPS.length - 0.25) }],
      [tp(0.9), { latZ: GATE * (STOPS.length - 0.05), vault: 0 }],
      // the way out opens onto the line-up
      [tp(0.905), { vault: 1 }],
      [trE, { latZ: ZEND + 0.5, streak: 0, spin: 1, vig: 0.7, bloom: 0.12, energy: 1 }],
      [co.t - vh * 0.3, { lat: 0 }],
      [co.t, { mini: 1 }],
      [coE, { mini: 1 }],
      [te.t - vh * 0.5, { mini: 0 }],
      [te.t + vh * 0.05, { vault: 0, grad: 1, tone: 0, vig: 0.15 }],
      // the sealed mark sits inside the Litecoin coin
      [a.t - vh * 0.75, { paintB: 0, x: coinX, y: coinY, r: sealR, settle: 1, spin: 0, alpha: 0, solid: 1, sealT: 0.05 }],
      [a.t - vh * 0.05, { grad: 0, paintB: 1, alpha: 1, glow: 0.05, bloom: 0.1, vig: 0.22, dolly: 0 }],
    ];
    let prev = base;
    keys = raw.map(([at, v]) => { prev = { ...prev, ...v, at }; return prev; }).sort((p, q) => p.at - q.at);
  }
  function stateAt(y) {
    let a = keys[0], b = keys[keys.length - 1];
    if (y <= a.at) b = a; else if (y >= b.at) a = b; else for (let i = 0; i < keys.length - 1; i++) if (y >= keys[i].at && y <= keys[i + 1].at) { a = keys[i]; b = keys[i + 1]; break; }
    const t = a === b ? 0 : sstep(a.at, b.at, y), o = {};
    for (const k in a) o[k] = lerp(a[k], b[k], t);
    return o;
  }

  /* ---------- scroll, reveal, nav ---------- */
  const lenis = RM ? null : new Lenis({ lerp: 0.085, smoothWheel: true });
  $$('a[href^="#"]').forEach((a) => a.addEventListener('click', (e) => { const t = $(a.getAttribute('href')); if (!t) return; e.preventDefault(); lenis ? lenis.scrollTo(t, { duration: 2.6 }) : t.scrollIntoView(); }));
  const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { threshold: 0.2, rootMargin: '0px 0px -6% 0px' });
  $$('.rv,[data-rise]').forEach((el) => io.observe(el));
  const nav = $('.nav-wrap'); let lastY = 0;
  addEventListener('scroll', () => { const y = scrollY; nav.classList.toggle('tx-nav-tucked', y > 80 && y > lastY); lastY = y; }, { passive: true });
  const mouse = { x: 0, y: 0, sx: 0, sy: 0, moved: false };
  addEventListener('pointermove', (e) => { mouse.x = e.clientX / vw * 2 - 1; mouse.y = e.clientY / vh * 2 - 1; if (e.pointerType === 'mouse') mouse.moved = true; }, { passive: true });
  addEventListener('resize', layout); addEventListener('load', layout);
  document.fonts && document.fonts.ready.then(layout);
  layout();

  /* ---------- per-frame DOM ---------- */
  const missionInner = $('.tx-mission-inner'), words = $$('.tx-w'), cards = $$('.tx-card'), dimStage = $('.tx-dim-stage'), segs = $$('.tx-seg'), stopName = $('#tx-stop'), stopNum = $('#tx-count'), chambers = $$('.tx-chamber'), hud = $('#tx-hud'), heroCopy = $('.tx-hero-copy'), trackHead = $('.tx-track-head');
  let hoverCard = -1; cards.forEach((c, i) => { c.addEventListener('pointerenter', () => { if (desk) hoverCard = i; }); c.addEventListener('pointerleave', () => { if (hoverCard === i) hoverCard = -1; }); });
  const bootT = performance.now(); let lastM = 0, active = -2, stageNow = -1, last = performance.now(), lastS = scrollY, hiNow = [0, 0, 0, 0], frames = 0, acc = 0, seen = false, speed = 0;
  const v3 = new THREE.Vector3(), dummy = new THREE.Object3D(), up = new THREE.Vector3(0, 1, 0), tv = new THREE.Vector3(), dirV = new THREE.Vector3(), rq = new THREE.Quaternion();
  const toWorld = (nx, ny, t) => t.set(nx * aspect * halfH, ny * halfH, -D);
  const scaleOf = (r) => (r * 2 * halfH) / 1.732;
  const hexV = []; for (let k = 0; k < 6; k++) { const a = Math.PI / 2 + k * Math.PI / 3; hexV.push([Math.cos(a) / 0.866, Math.sin(a) / 0.866]); }

  function frame(now) {
    requestAnimationFrame(frame);
    const dt = Math.min((now - last) / 1000, 0.05); last = now;
    if (lenis) lenis.raf(now);
    const time = now / 1000; shared.uTime.value = time;
    const y = lenis ? lenis.animatedScroll : scrollY, dS = y - lastS; lastS = y;
    speed += (Math.abs(dS) - speed) * 0.12;
    const S = stateAt(y);
    mouse.sx += (mouse.x - mouse.sx) * 0.05; mouse.sy += (mouse.y - mouse.sy) * 0.05;

    wU.uPosB.value.set(T.posN, 0.2);
    const foc = S.paintB > S.paintA ? netFocus : heroFocus; wU.uFocus.value.set(foc[0], foc[1]);

    /* world */
    wU.uPaintA.value = S.paintA; wU.uPaintB.value = S.paintB; wU.uLat.value = S.lat; wU.uGrad.value = S.grad; wU.uVault.value = S.vault;
    wU.uDolly.value = S.dolly + (RM ? 0 : Math.sin(time * 0.1) * 0.012); wU.uOff.value.set(mouse.sx * 0.012, -mouse.sy * 0.008);
    wU.uBeamAmt.value = S.beam; wU.uGlowAmt.value = S.glow;

    /* flight path: a slow weave and bank through the tunnel */
    const runA = T.tp(0.16), runB = T.tp(0.88), z = y > runA && y < runB ? lerp(10, GATE * (STOPS.length - 0.25), (y - runA) / (runB - runA)) : S.latZ, inTun = S.lat > 0.002, weave = clamp((z - 2) / 8, 0, 1) * (1 - sstep(ZEND - 18, ZEND - 3, z));
    const Rz = tunnelR(z), camX = Math.sin(z * 0.09) * Rz * 0.2 * weave + mouse.sx * 0.25 * weave, camY = Math.sin(z * 0.063 + 1) * Rz * 0.13 * weave - mouse.sy * 0.18 * weave, roll = Math.sin(z * 0.05) * 0.14 * weave;
    latU.uZ.value = z; latU.uCam.value.set(camX, camY); latU.uRoll.value = roll;
    sU.uZ.value = z; sU.uCam.value.set(camX, camY); sU.uRoll.value = roll; sU.uAlpha.value = S.streak * sstep(6, 40, speed); sU.uStretch.value = clamp(speed * 0.09, 0, 5);
    streaks.visible = S.streak > 0.01;

    /* the gates */
    const entered = y >= T.tp(0.107), gatesOn = inTun && (entered || S.r > 1.3) && z < ZEND + 2;
    gateU.uAlpha.value = entered ? 1 : sstep(1.3, 2.2, S.r);
    gateMesh.visible = gatesOn; cornerMesh.visible = false;
    if (gatesOn) {
      const c = Math.cos(roll), s = -Math.sin(roll);
      for (let i = 0; i < gateCount; i++) {
        const gz = GATE * (i + 1), dz = gz - z, R = tunnelR(gz), sc = stageColor(gz), vis = dz > 2.2 && dz < 70;
        const glowNear = sstep(26, 6, dz), isOut = i === gateCount - 1;
        for (let k = 0; k < 6; k++) {
          const idx = i * 6 + k, A = hexV[k], B = hexV[(k + 1) % 6];
          if (!vis) { dummy.scale.setScalar(0.00001); dummy.position.set(0, 0, 0); dummy.quaternion.identity(); dummy.updateMatrix(); gateMesh.setMatrixAt(idx, dummy.matrix); cornerMesh.setMatrixAt(idx, dummy.matrix); continue; }
          const ax0 = A[0] * R - camX, ay0 = A[1] * R - camY, bx0 = B[0] * R - camX, by0 = B[1] * R - camY;
          const ax = ax0 * c - ay0 * s, ay = ax0 * s + ay0 * c, bx = bx0 * c - by0 * s, by = bx0 * s + by0 * c, vz = -dz * ZK;
          dirV.set(bx - ax, by - ay, 0); const L = dirV.length(); dirV.divideScalar(L); rq.setFromUnitVectors(up, dirV);
          const th = isOut ? 0.075 : 0.042;
          dummy.position.set((ax + bx) / 2, (ay + by) / 2, vz); dummy.quaternion.copy(rq); dummy.scale.set(th, L + th * 1.2, th); dummy.updateMatrix(); gateMesh.setMatrixAt(idx, dummy.matrix);
          dummy.position.set(ax, ay, vz); dummy.quaternion.identity(); dummy.scale.setScalar(th * 1.7); dummy.updateMatrix(); cornerMesh.setMatrixAt(idx, dummy.matrix);
          gateA.c.setXYZ(idx, sc[0], sc[1], sc[2]); gateA.e.array[idx] = (0.3 + glowNear * 0.85) * (isOut ? 1.6 : 1) * sstep(2.2, 5, dz);
          cornerA.c.setXYZ(idx, sc[0], sc[1], sc[2]); cornerA.e.array[idx] = 0.3 + glowNear * 0.9;
        }
      }
      gateMesh.instanceMatrix.needsUpdate = cornerMesh.instanceMatrix.needsUpdate = true; gateA.c.needsUpdate = gateA.e.needsUpdate = cornerA.c.needsUpdate = cornerA.e.needsUpdate = true;
    }

    /* the object */
    const objOn = S.alpha > 0.003 && S.r > 0.001;
    hero.group.visible = objOn;
    const intro = RM ? 1 : sstep(0.5, 2.4, (now - bootT) / 1000); hero.spin = S.spin; hero.settle = Math.max(S.settle, 1 - intro); hero.hexOnly = S.hexOnly; hero.sealT = S.sealT; const heroFade = 1 - sstep(0.55, 1, S.hexOnly); hero.energy = S.energy * (1 - sstep(0.5, 1.6, S.r) * 0.75); hero.thick = S.thick / Math.max(1, S.r * 2.4);
    hero.u.uSolid.value = S.solid; hero.u.uAlpha.value = S.alpha * heroFade; hero.u.uRefract.value = S.ref; hero.uP.uAlpha.value = S.alpha * heroFade * (1 - sstep(0.45, 1.3, S.r));
    if (!RM) hero.step(dt, y > T.m.t && y < T.mE ? 0 : clamp(dS, -60, 60) * 0.0009);
    const pM = clamp((y - T.m.t) / Math.max(T.mE - T.m.t, 1), 0, 1), dM = pM - lastM; lastM = pM;
    if (!RM && dM) { hero.ang[0] += dM * Math.PI * 2; hero.ang[1] += dM * Math.PI; hero.ang[2] += dM * Math.PI * 0.5; hero.tumble += dM * 0.9; }
    missionInner.style.opacity = 1 - sstep(T.mE - vh * 0.02, T.mE + vh * 0.22, y);
    const wHead = pM * 1.25 * words.length;
    words.forEach((w, i) => { const o = RM ? 1 : lerp(0.16, 1, clamp(wHead - i, 0, 1)); if (w._o !== o) { w.style.opacity = o; w._o = o; } });

    /* Four dimensions: cards arrive as their edge family lights */
    const pD = clamp((y - T.d.t) / Math.max(T.d.h - vh, 1), 0, 1), inD = y > T.d.t - vh * 0.6 && y < T.d.t + T.d.h - vh * 0.3;
    let act = -1, tgt = [0, 0, 0, 0];
    if (inD) {
      act = pD < 0.06 ? -1 : Math.floor((pD - 0.06) / 0.17);
      if (act >= 4) { act = 4; tgt = hoverCard >= 0 ? [0, 0, 0, 0].map((_, i) => (i === hoverCard ? 1 : 0)) : [1, 1, 1, 1]; }
      else if (act >= 0) tgt[act] = 1;
    } else if (y >= T.d.t + T.d.h - vh * 0.3) act = 4;
    const hk = 1 - Math.pow(0.003, dt);
    for (let i = 0; i < 4; i++) hiNow[i] += (tgt[i] - hiNow[i]) * hk;
    hero.hi = hiNow;
    if (act !== active) { active = act; cards.forEach((c, i) => { c.classList.toggle('seen', i <= act); c.classList.toggle('on', i === act); }); }
    dimStage.classList.toggle('leaving', pD > 0.96);

    if (objOn) {
      toWorld(S.x, S.y, hero.group.position);
      const bob = RM ? 0 : Math.sin(time * 0.6) * 0.035 * (1 - S.settle);
      hero.group.position.y += bob + mouse.sy * -0.04 * (1 - S.settle); hero.group.position.x += mouse.sx * 0.05 * (1 - S.settle);
      hero.group.scale.setScalar(scaleOf(S.r)); hero.update();
      v3.copy(hero.group.position).project(camera); wU.uGlowPos.value.set(v3.x * 0.5 + 0.5, v3.y * 0.5 + 0.5);
    }
    wU.uLatGain.value = lerp(2.2, 1, sstep(T.tp(0.045), T.tp(0.085), y));
    wU.uMaskOn.value = y < T.tp(0.107) ? 1 : 0; wU.uMaskFull.value = sstep(1.1, 1.9, S.r);
    if (objOn) { hero.group.updateMatrix(); maskMesh.matrix.copy(hero.group.matrix); maskMesh.matrixWorldNeedsUpdate = true; }

    dU.uAlpha.value = S.dust; dU.uCenter.value.copy(hero.group.position); dU.uRadius.value = scaleOf(S.r) * 1.9; dust.visible = S.dust > 0.01;

    /* the track: one readout, on the page's centre line */
    const headO = sstep(T.tr.t - vh * 0.35, T.tr.t, y) * (1 - sstep(T.tp(0.018), T.tp(0.036), y));
    trackHead.style.opacity = headO; trackHead.style.visibility = headO > 0.01 ? 'visible' : 'hidden';
    const hudO = sstep(T.tp(0.125), T.tp(0.16), y) * (1 - sstep(T.tp(0.925), T.tp(0.955), y)); hud.style.opacity = hudO; sec.track.style.setProperty('--hud', hudO.toFixed(3)); hud.style.visibility = hudO > 0.01 ? 'visible' : 'hidden';
    if (hudO > 0.01) {
      const passed = clamp((z - GATE * 0.5) / GATE, 0, STOPS.length), cur = clamp(Math.floor(passed), 0, STOPS.length - 1);
      if (cur !== stageNow) {
        stageNow = cur; const st = STOPS[cur][1];
        stopName.textContent = STOPS[cur][0]; stopNum.textContent = `${String(cur + 1).padStart(2, '0')} / ${STOPS.length}`;
        hud.className = 's' + st; stopName.style.animation = 'none'; void stopName.offsetWidth; stopName.style.animation = '';
        segs.forEach((g, i) => g.classList.toggle('on', i === st));
      }
      let from = 0;
      segs.forEach((g, i) => { const n = STOPS.filter((x) => x[1] === i).length, f = clamp((passed - from) / n, 0, 1); if (g._f !== f) { g.firstChild.firstChild.style.transform = `scaleX(${f.toFixed(3)})`; g._f = f; } from += n; });
    }

    /* the vault */
    wU.uVaultBeams.value = S.mini;
    if (S.mini > 0.01) {
      const pC = clamp((y - T.co.t) / Math.max(T.co.h - vh, 1), 0, 1), gut = parseFloat(getComputedStyle(sec.cohort).getPropertyValue('--gutter')) * (desk ? vw / 100 : 16), step = desk ? (vw - gut * 2) / 5 / (vw / 2) : 1.7, pan = desk ? 0 : lerp(2, -2, pC) * step;
      let hover = -1;
      minis.forEach((h, i) => {
        const floorNdc = -0.2, rise = desk ? sstep(T.co.t - vh * 0.25 + i * vh * 0.05, T.co.t + vh * 0.1 + i * vh * 0.05, y) : 1;
        const ndx = (i - 2) * step + pan, ndy = (desk ? 0.1 : 0.12) - (1 - rise) * 0.14, r = desk ? Math.min(0.105, step * aspect * 0.145) : 0.115;
        toWorld(ndx, ndy, h.group.position); h.group.position.y += Math.sin(time * 0.6 + i * 0.5) * 0.018;
        h.group.scale.setScalar(scaleOf(r)); h.group.visible = true; h.mirror.visible = true;
        if (mouse.moved && Math.abs(mouse.sx - ndx) < step * 0.48 && desk && mouse.sy < 0.8) hover = i;
        h.boost += ((hover === i ? 1 : 0) - h.boost) * (1 - Math.pow(0.004, dt));
        if (!RM) h.step(dt * 0.6);
        h.energy = 0.75 + h.boost * 1.1;
        const ma = S.mini * rise; h.u.uAlpha.value = ma; h.uP.uAlpha.value = ma; h.mirrorU.uAlpha.value = ma * 0.22; h.mirrorU.uFade.value = (-floorNdc * 0 + 0.5 * floorNdc + 0.5) * 1; h.update();
        const floor = floorNdc * halfH;
        h.group.updateMatrix(); FLIP.makeTranslation(0, floor * 2, 0).multiply(SCALEY); h.mirror.matrix.copy(FLIP).multiply(h.group.matrix); h.mirror.matrixWorldNeedsUpdate = true;
        wU.uBeamsX.value[i] = ndx * aspect; wU.uBeamHot.value[i] = h.boost;
        const c = chambers[i]; tv.copy(h.group.position); tv.y = -halfH * (desk ? 0.7 : 0.66); tv.project(camera);
        c.style.transform = `translate3d(${((tv.x * 0.5 + 0.5) * vw).toFixed(1)}px,${((-tv.y * 0.5 + 0.5) * vh).toFixed(1)}px,0) translateX(-50%)`;
        c.style.opacity = (ma * (desk ? 1 : clamp(1.4 - Math.abs(ndx) * 1.6, 0, 1))).toFixed(3); c.classList.toggle('hot', h.boost > 0.5);
      });
    } else minis.forEach((h) => { if (h.group.visible) { h.group.visible = false; h.mirror.visible = false; } });

    /* post */
    const speedWarp = inTun && entered ? clamp(speed * 0.0008, 0, 0.14) : 0;
    bloom.strength = S.bloom; finalU.uWarp.value = RM ? 0 : S.warp + speedWarp; finalU.uWhite.value = S.white; finalU.uVig.value = S.vig; finalU.uTone.value = S.tone; finalU.uScrimDesk.value = desk ? 1 : 0;
    const heroH = sec.hero.offsetHeight; wU.uSplit.value = y < heroH * 1.05 ? (y / heroH) * 1.48 - 0.24 : 2; wU.uScrollA.value = RM ? 0 : (y / vh) * 0.3; wU.uHeroDesk.value = desk ? 1 : 0;

    /* render */
    if (S.lat > 0.002) { renderer.setRenderTarget(latRT); renderer.render(latScene, fsCam); if (wU.uMaskOn.value > 0.5) { renderer.setRenderTarget(maskRT); renderer.render(maskScene, camera); } }
    renderer.setRenderTarget(bgRT); renderer.render(worldScene, fsCam);
    renderer.setRenderTarget(null); composer.render(dt);

    frames++; acc += dt;
    if (acc > 1.5) { const avg = acc / frames; frames = 0; acc = 0; if (avg > 0.024 && dpr > 0.9) { dpr = Math.max(0.9, dpr * 0.85); latScale = Math.max(0.45, latScale * 0.88); layout(); } }
    if (!seen) { seen = true; document.documentElement.classList.add('tx-live'); }
  }
  requestAnimationFrame(frame);
  window.__tx = { lenis, state: () => stateAt(lenis ? lenis.animatedScroll : scrollY) };
}
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
