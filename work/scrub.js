// Walks the whole page in small steps and saves frames, to catch pops between worlds.
// usage: node scrub.js <outdir> <w> <h> <frames> [mobile]
const { chromium } = require('C:/Users/Graph/litvm-mobile-qa/node_modules/playwright-core');
(async () => {
  const [out, w, h, n, mob] = process.argv.slice(2);
  const b = await chromium.launch({ channel: 'msedge', headless: false, args: ['--use-angle=d3d11', '--ignore-gpu-blocklist'] });
  const opts = { viewport: { width: +w, height: +h } };
  if (mob) Object.assign(opts, { hasTouch: true, isMobile: true, deviceScaleFactor: 2 });
  const c = await b.newContext(opts);
  const p = await c.newPage();
  p.on('pageerror', (e) => console.log('PAGEERROR', e.message));
  await p.goto('http://127.0.0.1:4178/', { waitUntil: 'load' });
  await p.waitForTimeout(3500);
  const H = await p.evaluate(() => document.documentElement.scrollHeight - innerHeight);
  for (let i = 0; i < +n; i++) {
    const y = H * i / (+n - 1);
    await p.evaluate((v) => { if (window.__tx && window.__tx.lenis) window.__tx.lenis.scrollTo(v, { immediate: true }); else window.scrollTo(0, v); }, y);
    await p.waitForTimeout(350);
    await p.screenshot({ path: `${out}/f${String(i).padStart(3, '0')}.jpg`, type: 'jpeg', quality: 62 });
  }
  console.log(JSON.stringify(await p.evaluate(() => ({ sw: document.documentElement.scrollWidth, iw: innerWidth, h: document.documentElement.scrollHeight }))));
  await b.close();
})().catch((e) => { console.error(e); process.exit(1); });
