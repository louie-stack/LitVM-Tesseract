// Catches any black frames while scrolling out of the hero: node work/scrollblack.js [w] [h] [mobile]. Writes frames to work/s/sb/ and prints each frame's position.
const { chromium } = require('C:/Users/Graph/litvm-mobile-qa/node_modules/playwright-core');
const fs = require('fs');
(async () => {
  const w = +(process.argv[2] || 1440), h = +(process.argv[3] || 810), mob = process.argv[4] === 'mobile';
  fs.mkdirSync('work/s/sb', { recursive: true });
  const b = await chromium.launch({ channel: 'msedge', headless: false, args: ['--use-angle=d3d11', '--ignore-gpu-blocklist', '--window-position=0,0'] });
  const c = await b.newContext({ viewport: { width: w, height: h }, ...(mob ? { hasTouch: true, isMobile: true, deviceScaleFactor: 2 } : {}) });
  const p = await c.newPage();
  p.on('pageerror', (e) => console.log('PAGEERROR', e.message));
  await p.goto('http://127.0.0.1:4178/', { waitUntil: 'load' }); await p.waitForTimeout(3500);
  const end = await p.evaluate(() => { const e = document.querySelector('#mission'); return e.getBoundingClientRect().top + scrollY + innerHeight * 0.5; });
  const N = 24;
  for (let i = 0; i <= N; i++) {
    const y = end * i / N;
    await p.evaluate((v) => { if (window.__tx && window.__tx.lenis) window.__tx.lenis.scrollTo(v, { immediate: true }); else scrollTo(0, v); }, y);
    await p.waitForTimeout(220);
    await p.screenshot({ path: `work/s/sb/${String(i).padStart(2, '0')}.jpg`, type: 'jpeg', quality: 70, scale: 'css' });
  }
  await b.close();
})().catch((e) => { console.error(e); process.exit(1); });
