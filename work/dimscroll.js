// Frame rate while really scrolling through Four Dimensions with the wheel (not a jump). node work/dimscroll.js
const { chromium } = require('C:/Users/Graph/litvm-mobile-qa/node_modules/playwright-core');
(async () => {
  const b = await chromium.launch({ channel: 'msedge', headless: false, args: ['--use-angle=d3d11', '--ignore-gpu-blocklist', '--window-position=0,0'] });
  const c = await b.newContext({ viewport: { width: 1440, height: 810 }, deviceScaleFactor: 2 }); const p = await c.newPage();
  await p.goto('http://127.0.0.1:4178/', { waitUntil: 'load' }); await p.waitForTimeout(3000);
  await p.evaluate(() => { const e = document.querySelector('#dimensions'); window.__tx.lenis.scrollTo(e.getBoundingClientRect().top + scrollY - 40, { immediate: true }); }); await p.waitForTimeout(2500);
  await p.mouse.move(720, 120);
  await p.evaluate(() => { window.__ft = []; let l = performance.now(); (function f(n) { window.__ft.push(n - l); l = n; requestAnimationFrame(f); })(l); });
  for (let i = 0; i < 70; i++) { await p.mouse.wheel(0, 40); await p.waitForTimeout(70); }
  const r = await p.evaluate(() => { const a = window.__ft.slice(2).sort((x, y) => x - y), n = a.length; return { frames: n, avgFps: Math.round(1000 / (a.reduce((s, v) => s + v, 0) / n)), p95ms: Math.round(a[Math.floor(n * 0.95)]), worstMs: Math.round(a[n - 1]) }; });
  console.log(JSON.stringify(r), 'section progress', await p.evaluate(() => { const e = document.querySelector('#dimensions'); return ((scrollY - (e.getBoundingClientRect().top + scrollY)) / (e.offsetHeight - innerHeight)).toFixed(2); }));
  await b.close();
})().catch((e) => { console.error(e); process.exit(1); });
