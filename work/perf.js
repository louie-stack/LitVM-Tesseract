// Frame rate inside the tunnel at 1920, and whether the stop counter keeps up, with generous waits.
const { chromium } = require('C:/Users/Graph/litvm-mobile-qa/node_modules/playwright-core');
(async () => {
  const b = await chromium.launch({ channel: 'msedge', headless: false, args: ['--use-angle=d3d11', '--ignore-gpu-blocklist'] });
  const p = await b.newPage({ viewport: { width: 1920, height: 1080 } });
  p.on('pageerror', (e) => console.log('PAGEERROR', e.message));
  await p.goto('http://127.0.0.1:4178/', { waitUntil: 'load' });
  await p.waitForTimeout(2500);
  const goto = (y) => p.evaluate((v) => window.__tx.lenis.scrollTo(v, { immediate: true }), y);
  const fps = () => p.evaluate(() => new Promise((r) => { let n = 0; const t0 = performance.now(); (function f() { n++; if (performance.now() - t0 > 1500) r(Math.round(n / 1.5)); else requestAnimationFrame(f); })(); }));
  const tr = await p.evaluate(() => { const e = document.querySelector('#track'); return { t: e.getBoundingClientRect().top + scrollY, h: e.offsetHeight - innerHeight }; });
  for (const f of [0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.86]) {
    await goto(tr.t + tr.h * f); await p.waitForTimeout(900);
    const n = await p.evaluate(() => document.querySelector('#tx-count').textContent.slice(0, 2));
    console.log('p', f, 'stop', n, 'fps', await fps(), 'canvasPx', await p.evaluate(() => document.querySelector('#tx-gl').width));
  }
  await b.close();
})().catch((e) => { console.error(e); process.exit(1); });
