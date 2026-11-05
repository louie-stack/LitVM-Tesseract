// Four Dimensions QA: node work/dimqa.js  (server running; opens a real browser window). Writes to work/s/
const { chromium } = require('C:/Users/Graph/litvm-mobile-qa/node_modules/playwright-core');
(async () => {
  const b = await chromium.launch({ channel: 'msedge', headless: false, args: ['--use-angle=d3d11', '--ignore-gpu-blocklist', '--window-position=0,0'] });
  const open = async (opts) => {
    const c = await b.newContext(opts); const p = await c.newPage();
    p.on('pageerror', (e) => console.log('PAGEERROR', e.message));
    p.on('console', (m) => { if (m.type() === 'error' || /THREE\.|GL_/.test(m.text())) console.log('CONSOLE', m.text().slice(0, 400)); });
    await p.goto('http://127.0.0.1:4178/', { waitUntil: 'load' }); await p.waitForTimeout(3500); return p;
  };
  const to = (p, prog) => p.evaluate((prog) => { const e = document.querySelector('#dimensions'), y = e.getBoundingClientRect().top + scrollY + prog * (e.offsetHeight - innerHeight); if (window.__tx && window.__tx.lenis) window.__tx.lenis.scrollTo(y, { immediate: true }); else scrollTo(0, y); }, prog);
  let p = await open({ viewport: { width: 1440, height: 810 }, deviceScaleFactor: 2 });
  await to(p, 0.85); await p.waitForTimeout(2200);
  await p.screenshot({ path: 'work/s/dq-all.jpg', type: 'jpeg', quality: 88, scale: 'css' });
  await p.screenshot({ path: 'work/s/dq-zoom.jpg', type: 'jpeg', quality: 88, clip: { x: 70, y: 210, width: 800, height: 280 } });
  await p.mouse.move(1000, 640); await p.waitForTimeout(150); await p.mouse.move(1240, 680); await p.waitForTimeout(1300);
  await p.screenshot({ path: 'work/s/dq-hover.jpg', type: 'jpeg', quality: 86, scale: 'css' });
  console.log('fps', await p.evaluate(() => new Promise((r) => { let n = 0; const t0 = performance.now(); (function f() { n++; if (performance.now() - t0 > 2000) r(n / 2); else requestAnimationFrame(f); })(); })));
  await p.context().close();
  p = await open({ viewport: { width: 1920, height: 1080 } });
  await to(p, 0.85); await p.waitForTimeout(2000);
  await p.screenshot({ path: 'work/s/dq-1920.jpg', type: 'jpeg', quality: 80 });
  await p.context().close();
  p = await open({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, hasTouch: true, isMobile: true });
  for (const [n, pr] of [['0', 0.2], ['1', 0.55]]) { await to(p, pr); await p.waitForTimeout(1300); await p.screenshot({ path: `work/s/dq-m${n}.jpg`, type: 'jpeg', quality: 80, scale: 'css' }); }
  await p.context().close();
  p = await open({ viewport: { width: 1280, height: 720 }, reducedMotion: 'reduce' });
  await to(p, 0.85); await p.waitForTimeout(1500);
  await p.screenshot({ path: 'work/s/dq-rm.jpg', type: 'jpeg', quality: 78 });
  await b.close();
})().catch((e) => { console.error(e); process.exit(1); });
