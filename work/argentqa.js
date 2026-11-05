// Fifth crystal QA: node work/argentqa.js (server running; real browser window). Writes to work/s/
const { chromium } = require('C:/Users/Graph/litvm-mobile-qa/node_modules/playwright-core');
(async () => {
  const b = await chromium.launch({ channel: 'msedge', headless: false, args: ['--use-angle=d3d11', '--ignore-gpu-blocklist', '--window-position=0,0'] });
  const c = await b.newContext({ viewport: { width: 1440, height: 810 }, deviceScaleFactor: 2 }); const p = await c.newPage();
  p.on('pageerror', (e) => console.log('PAGEERROR', e.message));
  await p.goto('http://127.0.0.1:4178/', { waitUntil: 'load' }); await p.waitForTimeout(3500);
  await p.evaluate(() => { const e = document.querySelector('#cohort'), y = e.getBoundingClientRect().top + scrollY + 0.3 * Math.max(e.offsetHeight - innerHeight, 0); if (window.__tx && window.__tx.lenis) window.__tx.lenis.scrollTo(y, { immediate: true }); else scrollTo(0, y); });
  await p.waitForTimeout(4000);
  await p.screenshot({ path: 'work/s/a-full.jpg', type: 'jpeg', quality: 88, scale: 'css' });
  const r = await p.evaluate(() => [...document.querySelectorAll('.tx-chamber')].map((e) => { const q = e.getBoundingClientRect(); return { t: e.querySelector('h3').textContent, x: Math.round(q.x), y: Math.round(q.y), w: Math.round(q.width), o: getComputedStyle(e).opacity }; }));
  console.log(JSON.stringify(r));
  const x = r[4].x + r[4].w / 2;
  await p.screenshot({ path: 'work/s/a-zoom.jpg', type: 'jpeg', quality: 90, clip: { x: Math.max(0, x - 170), y: Math.max(0, r[4].y - 470), width: 340, height: 250 } });
  await p.mouse.move(x, r[4].y - 345);
  for (let i = 0; i < 3; i++) { await p.waitForTimeout(400); await p.screenshot({ path: `work/s/a-hover-${i}.jpg`, type: 'jpeg', quality: 85, clip: { x: Math.max(0, x - 170), y: Math.max(0, r[4].y - 470), width: 340, height: 250 } }); }
  await b.close();
})().catch((e) => { console.error(e); process.exit(1); });
