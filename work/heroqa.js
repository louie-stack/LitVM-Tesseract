// Hero beam QA: node work/heroqa.js  (server running; opens a real browser window). Writes to work/s/
const { chromium } = require('C:/Users/Graph/litvm-mobile-qa/node_modules/playwright-core');
(async () => {
  const b = await chromium.launch({ channel: 'msedge', headless: false, args: ['--use-angle=d3d11', '--ignore-gpu-blocklist', '--window-position=0,0'] });
  const open = async (opts) => {
    const c = await b.newContext(opts); const p = await c.newPage();
    p.on('pageerror', (e) => console.log('PAGEERROR', e.message));
    p.on('console', (m) => { if (m.type() === 'error' || /THREE\.|GL_/.test(m.text())) console.log('CONSOLE', m.text().slice(0, 400)); });
    return p;
  };
  // the load: beam climbs, then lights the object
  let p = await open({ viewport: { width: 1440, height: 810 }, deviceScaleFactor: 2 });
  await p.goto('http://127.0.0.1:4178/', { waitUntil: 'commit' });
  await p.waitForFunction(() => document.documentElement.classList.contains('tx-live'), null, { timeout: 30000 });
  for (let i = 0; i < 5; i++) { await p.screenshot({ path: `work/s/h-load-${i}.jpg`, type: 'jpeg', quality: 78, scale: 'css', clip: { x: 860, y: 60, width: 560, height: 750 } }); await p.waitForTimeout(280); }
  await p.waitForTimeout(2500);
  await p.screenshot({ path: 'work/s/h-zoom.jpg', type: 'jpeg', quality: 90, clip: { x: 960, y: 110, width: 340, height: 360 } });
  await p.context().close();
  // phone
  p = await open({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, hasTouch: true, isMobile: true });
  await p.goto('http://127.0.0.1:4178/', { waitUntil: 'load' }); await p.waitForTimeout(4000);
  await p.screenshot({ path: 'work/s/h-phone.jpg', type: 'jpeg', quality: 80, scale: 'css' });
  await p.context().close();
  // reduced motion: lit straight away, logos present
  p = await open({ viewport: { width: 1280, height: 720 }, reducedMotion: 'reduce' });
  await p.goto('http://127.0.0.1:4178/', { waitUntil: 'load' }); await p.waitForTimeout(2500);
  await p.screenshot({ path: 'work/s/h-rm.jpg', type: 'jpeg', quality: 78 });
  await p.evaluate(() => { const e = document.querySelector('#cohort'); scrollTo(0, e.getBoundingClientRect().top + scrollY + (e.offsetHeight - innerHeight) * 0.3); }); await p.waitForTimeout(1500);
  await p.screenshot({ path: 'work/s/h-rm2.jpg', type: 'jpeg', quality: 78 });
  await b.close();
})().catch((e) => { console.error(e); process.exit(1); });
