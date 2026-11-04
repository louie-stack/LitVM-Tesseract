// usage: node shot.js <outdir> <w> <h> label:selector:progress[:offsetVh] ...   (uses the real GPU)
const { chromium } = require('C:/Users/Graph/litvm-mobile-qa/node_modules/playwright-core');
(async () => {
  const [out, w, h, ...shots] = process.argv.slice(2);
  const b = await chromium.launch({ channel: 'msedge', headless: false, args: ['--use-angle=d3d11', '--ignore-gpu-blocklist', '--window-position=0,0'] });
  const c = await b.newContext({ viewport: { width: +w, height: +h } });
  const p = await c.newPage();
  p.on('pageerror', (e) => console.log('PAGEERROR', e.message));
  p.on('console', (m) => { const t = m.text(); if (m.type() === 'error' || /THREE|GL_|WebGL|shader/i.test(t)) console.log('CONSOLE', t.slice(0, 700)); });
  await p.goto('http://127.0.0.1:4178/', { waitUntil: 'load' });
  await p.waitForTimeout(4000);
  console.log('gl', await p.evaluate(() => { const g = document.createElement('canvas').getContext('webgl2'); const e = g.getExtension('WEBGL_debug_renderer_info'); return e ? g.getParameter(e.UNMASKED_RENDERER_WEBGL) : '?'; }));
  for (const s of shots) {
    const [label, sel, prog, off] = s.split(':');
    const y = await p.evaluate(([sel, prog, off]) => { const e = document.querySelector(sel); const t = e.getBoundingClientRect().top + scrollY; return t + (+prog) * Math.max(e.offsetHeight - innerHeight, 0) + (+off || 0) * innerHeight; }, [sel, prog, off]);
    await p.evaluate((v) => { if (window.__tx && window.__tx.lenis) window.__tx.lenis.scrollTo(v, { immediate: true }); else window.scrollTo(0, v); }, y);
    await p.waitForTimeout(1500);
    await p.screenshot({ path: `${out}/${label}.jpg`, type: 'jpeg', quality: 82 });
  }
  const fps = await p.evaluate(() => new Promise((r) => { let n = 0; const t0 = performance.now(); (function f() { n++; if (performance.now() - t0 > 2000) r(n / 2); else requestAnimationFrame(f); })(); }));
  console.log('fps', fps, JSON.stringify(await p.evaluate(() => ({ w: document.documentElement.scrollWidth, h: document.documentElement.scrollHeight }))));
  await b.close();
})().catch((e) => { console.error(e); process.exit(1); });
