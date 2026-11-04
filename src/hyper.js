// A real hypercube. Four rotation planes, one perspective drop from 4D to 3D, drawn as glass rods.
import * as THREE from 'three';
import { GLASS_VERT, GLASS_FRAG, PANE_VERT, PANE_FRAG } from './shaders.js';

const V4 = [], E4 = [], F4 = [];
for (let i = 0; i < 16; i++) V4.push([i & 1 ? 1 : -1, i & 2 ? 1 : -1, i & 4 ? 1 : -1, i & 8 ? 1 : -1]);
for (let a = 0; a < 16; a++) for (let b = 0; b < 4; b++) if (!(a & (1 << b))) E4.push([a, a | (1 << b), b]);
for (let p = 0; p < 4; p++) for (let q = p + 1; q < 4; q++) for (let b = 0; b < 16; b++)
  if (!(b & (1 << p)) && !(b & (1 << q))) F4.push([b, b | (1 << p), b | (1 << p) | (1 << q), b | (1 << q), p, q]);

export const AXIS = ['#8fe6ff', '#ffb07c', '#6ff0c0', '#b4bcff'].map((h) => new THREE.Color(h));
const ICE = new THREE.Color('#d9f7ff'), CYAN = new THREE.Color('#58cfee');
const UP = new THREE.Vector3(0, 1, 0), HALF = Math.PI / 2;
const ISO = new THREE.Euler(Math.atan(1 / Math.SQRT2), Math.PI / 4, 0, 'XYZ');
const lerp = (a, b, t) => a + (b - a) * t, clamp = (v, a, b) => Math.min(b, Math.max(a, v));

const rodGeo = new THREE.CylinderGeometry(1, 1, 1, 6, 1, true);
const gemGeo = new THREE.IcosahedronGeometry(1, 1);

export class Hyper {
  constructor(shared) {
    this.group = new THREE.Group();
    this.ang = [0.55, 0.15, 0.3];
    this.spin = 1; this.settle = 0; this.tumble = 0; this.hi = [0, 0, 0, 0];
    this.thick = 0.035; this.energy = 1; this.hexOnly = 0; this.sealT = 0.078;
    this.u = {
      tBg: shared.tBg, uRes: shared.uRes, uTime: shared.uTime,
      uInk: { value: 0 }, uSolid: { value: 0 }, uAlpha: { value: 1 }, uRefract: { value: 0.05 }, uBar: { value: 0 }, uFade: { value: 0 },
    };
    const mat = new THREE.ShaderMaterial({ vertexShader: GLASS_VERT, fragmentShader: GLASS_FRAG, uniforms: this.u, transparent: true, side: THREE.DoubleSide, extensions: { derivatives: true } });
    this.rods = new THREE.InstancedMesh(rodGeo.clone(), mat, 32);
    this.gems = new THREE.InstancedMesh(gemGeo.clone(), mat, 16);
    for (const m of [this.rods, this.gems]) { m.frustumCulled = false; m.renderOrder = 4; }
    this.aRod = this._attrs(this.rods, 32); this.aGem = this._attrs(this.gems, 16);
    for (let i = 0; i < 32; i++) this.aRod.ph.array[i] = (i * 0.137) % 1;
    for (let i = 0; i < 16; i++) this.aGem.ph.array[i] = -5;

    const n = F4.length * 6;
    const g = new THREE.BufferGeometry();
    this.pPos = new THREE.BufferAttribute(new Float32Array(n * 3), 3); this.pPos.setUsage(THREE.DynamicDrawUsage);
    this.pTint = new THREE.BufferAttribute(new Float32Array(n * 3), 3); this.pTint.setUsage(THREE.DynamicDrawUsage);
    const uvs = new Float32Array(n * 2), c = [[-1, -1], [1, -1], [1, 1], [-1, -1], [1, 1], [-1, 1]];
    for (let i = 0; i < n; i++) { uvs[i * 2] = c[i % 6][0]; uvs[i * 2 + 1] = c[i % 6][1]; }
    g.setAttribute('position', this.pPos); g.setAttribute('aTint', this.pTint); g.setAttribute('aUv', new THREE.BufferAttribute(uvs, 2));
    this.uP = { uAlpha: { value: 1 }, uInk: this.u.uInk, uTime: shared.uTime };
    this.panes = new THREE.Mesh(g, new THREE.ShaderMaterial({ vertexShader: PANE_VERT, fragmentShader: PANE_FRAG, uniforms: this.uP, transparent: true, depthWrite: false, side: THREE.DoubleSide, blending: THREE.CustomBlending, blendSrc: THREE.OneFactor, blendDst: THREE.OneFactor, extensions: { derivatives: true } }));
    this.panes.frustumCulled = false; this.panes.renderOrder = 3;
    this.group.add(this.panes, this.rods, this.gems);

    this._m = new THREE.Matrix4(); this._q = new THREE.Quaternion(); this._p = new THREE.Vector3(); this._s = new THREE.Vector3(); this._d = new THREE.Vector3();
    this._e = new THREE.Euler(); this._qa = new THREE.Quaternion(); this._qb = new THREE.Quaternion();
    this.pts = V4.map(() => ({ x: 0, y: 0, z: 0, w: 0 }));
    this._c = new THREE.Color();
  }
  _attrs(mesh, n) {
    const col = new THREE.InstancedBufferAttribute(new Float32Array(n * 3).fill(1), 3); col.setUsage(THREE.DynamicDrawUsage);
    const en = new THREE.InstancedBufferAttribute(new Float32Array(n).fill(1), 1); en.setUsage(THREE.DynamicDrawUsage);
    const ph = new THREE.InstancedBufferAttribute(new Float32Array(n), 1);
    mesh.geometry.setAttribute('aColor', col); mesh.geometry.setAttribute('aEnergy', en); mesh.geometry.setAttribute('aPhase', ph);
    return { col, en, ph };
  }
  step(dt, kick = 0) {
    const sp = this.spin * (1 - this.settle);
    this.ang[0] += dt * 0.3 * sp + kick; this.ang[1] += dt * 0.19 * sp + kick * 0.6; this.ang[2] += dt * 0.12 * sp + kick * 0.4;
    this.tumble += dt * 0.07 * sp;
  }
  update() {
    const s = this.settle, ang = this.ang.map((a) => (s > 0 ? lerp(a, Math.round(a / HALF) * HALF, s) : a));
    const [c0, c1, c2] = ang.map(Math.cos), [s0, s1, s2] = ang.map(Math.sin);
    for (let i = 0; i < 16; i++) {
      let [x, y, z, w] = V4[i], t;
      t = x * c0 - w * s0; w = x * s0 + w * c0; x = t;
      t = y * c1 - w * s1; w = y * s1 + w * c1; y = t;
      t = z * c2 - w * s2; w = z * s2 + w * c2; z = t;
      const k = 3 / (3 - w) / 1.5, q = this.pts[i];
      q.x = x * k; q.y = y * k; q.z = z * k; q.w = clamp((w + 1.4) / 2.8, 0, 1);
    }
    // orientation: isometric at rest (the Tesseract mark), tumbling otherwise
    this._e.set(ISO.x, ISO.y + this.tumble * (1 - s), 0, 'XYZ');
    this.group.quaternion.setFromEuler(this._e);

    const hi = this.hi, any = Math.max(hi[0], hi[1], hi[2], hi[3]), base = lerp(this.thick, this.sealT, s);
    for (let i = 0; i < 32; i++) {
      const [a, b, ax] = E4[i], P = this.pts[a], Q = this.pts[b], h = hi[ax];
      this._d.set(Q.x - P.x, Q.y - P.y, Q.z - P.z);
      const L = this._d.length(); this._d.divideScalar(L || 1);
      this._q.setFromUnitVectors(UP, this._d);
      let keep = 1;
      if (s > 0) {
        // keep only the lines the mark draws (depth in the group's frame)
        const dz = (q) => (-q.x * Math.sin(ISO.y) + q.z * Math.cos(ISO.y)) * Math.cos(ISO.x) + q.y * Math.sin(ISO.x);
        const zP = dz(P), zQ = dz(Q), oP = P.w > 0.5, oQ = Q.w > 0.5; let k;
        if (oP && oQ) k = zP > -1.5 && zQ > -1.5;
        else if (!oP && !oQ) k = Math.abs(zP) < 0.6 && Math.abs(zQ) < 0.6;
        else { const zo = oP ? zP : zQ; k = zo > -1.5 && zo < -0.05; }
        keep = k ? 1 : 1 - s;
        if (this.hexOnly > 0 && !(oP && oQ && Math.abs(zP) < 1.2 && Math.abs(zQ) < 1.2)) keep = Math.min(keep, 1 - this.hexOnly);
      }
      const r = base * (0.55 + 0.75 * (P.w + Q.w) * 0.5) * (1 + h * 0.5) * keep;
      this._p.set((P.x + Q.x) / 2, (P.y + Q.y) / 2, (P.z + Q.z) / 2);
      this._s.set(Math.max(r, 1e-4), L, Math.max(r, 1e-4));
      this.rods.setMatrixAt(i, this._m.compose(this._p, this._q, this._s));
      this._c.copy(CYAN).lerp(ICE, (P.w + Q.w) * 0.5).lerp(AXIS[ax], h * 0.95);
      this.aRod.col.setXYZ(i, this._c.r, this._c.g, this._c.b);
      this.aRod.en.array[i] = lerp(1, 0.1, any * (1 - h)) * (1 + h * 1.6) * this.energy;
    }
    this._q.identity();
    for (let i = 0; i < 16; i++) {
      const q = this.pts[i], r = base * (1.05 + q.w * 0.55) * (1 - s);
      this._p.set(q.x, q.y, q.z); this._s.setScalar(Math.max(r, 1e-4));
      this.gems.setMatrixAt(i, this._m.compose(this._p, this._q, this._s));
      this._c.copy(ICE); this.aGem.col.setXYZ(i, this._c.r, this._c.g, this._c.b);
      this.aGem.en.array[i] = lerp(1, 0.3, any) * this.energy;
    }
    let o = 0; const pa = this.pPos.array, ta = this.pTint.array, ord = [0, 1, 2, 0, 2, 3];
    for (const f of F4) {
      const h = Math.max(hi[f[4]], hi[f[5]]), ax = hi[f[4]] > hi[f[5]] ? f[4] : f[5];
      const dw = (this.pts[f[0]].w + this.pts[f[1]].w + this.pts[f[2]].w + this.pts[f[3]].w) / 4;
      this._c.copy(CYAN).lerp(ICE, dw).lerp(AXIS[ax], h).multiplyScalar(lerp(1, 0.25, any * (1 - h)) * (1 - s));
      for (let j = 0; j < 6; j++) {
        const q = this.pts[f[ord[j]]];
        pa[o * 3] = q.x; pa[o * 3 + 1] = q.y; pa[o * 3 + 2] = q.z;
        ta[o * 3] = this._c.r; ta[o * 3 + 1] = this._c.g; ta[o * 3 + 2] = this._c.b; o++;
      }
    }
    this.pPos.needsUpdate = true; this.pTint.needsUpdate = true;
    this.rods.instanceMatrix.needsUpdate = true; this.gems.instanceMatrix.needsUpdate = true;
    this.aRod.col.needsUpdate = true; this.aRod.en.needsUpdate = true; this.aGem.col.needsUpdate = true; this.aGem.en.needsUpdate = true;
  }
}
