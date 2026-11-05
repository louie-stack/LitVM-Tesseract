// Cohort 1 logo QA: node work/logoqa.js  (server running; opens a real browser window). Writes to work/s/
const { chromium } = require('C:/Users/Graph/litvm-mobile-qa/node_modules/playwright-core');
(async () => {
  const b = await chromium.launch({ channel: 'msedge', headless: false, args: ['--use-angle=d3d11', '--ignore-gpu-blocklist', '--window-position=0,0'] });
  const open = async (opts) => {
    const c = await b.newContext(opts); const p = await c.newPage();
    p.on('pageerror', (e) => console.log('PAGEERROR', e.message));
    p.on('console', (m) => { if (m.type() === 'error' || /THREE\.|GL_/.test(m.text())) console.log('CONSOLE', m.text().slice(0, 400)); });
    await p.goto('http://127.0.0.1:4178/', { waitUntil: 'load' }); await p.waitForTimeout(3500); return p;
  };
  const to = (p, prog, off = 0) => p.evaluate(([prog, off]) => { const e = document.querySelector('#cohort'), t = e.getBoundingClientRect().top + scrollY, y = t + prog * Math.max(e.offsetHeight - innerHeight, 0) + off * innerHeight; if (window.__tx && window.__tx.lenis) window.__tx.lenis.scrollTo(y, { immediate: true }); else scrollTo(0, y); }, [prog, off]);

  let p = await open({ viewport: { width: 1440, height: 810 }, deviceScaleFactor: 2 });
  await to(p, 0.3); await p.waitForTimeout(1500);
  await p.screenshot({ path: 'work/s/q-zoom.jpg', type: 'jpeg', quality: 88, clip: { x: 90, y: 270, width: 960, height: 210 } });
  await p.waitForTimeout(2500);
  await p.screenshot({ path: 'work/s/q-zoom2.jpg', type: 'jpeg', quality: 88, clip: { x: 90, y: 270, width: 960, height: 210 } });
  // arrival: slices condensing as the crystals rise
  for (const [n, off] of [['a', -0.2], ['b', -0.08], ['c', 0.02]]) { await to(p, 0, off); await p.waitForTimeout(600); await p.screenshot({ path: `work/s/q-rise-${n}.jpg`, type: 'jpeg', quality: 80, scale: 'css' }); }
  // hover: one full turn
  await to(p, 0.3); await p.waitForTimeout(800); await p.mouse.move(460, 380);
  for (let i = 0; i < 4; i++) { await p.waitForTimeout(350); await p.screenshot({ path: `work/s/q-hover-${i}.jpg`, type: 'jpeg', quality: 85, clip: { x: 300, y: 250, width: 320, height: 240 } }); }
  await p.context().close();

  p = await open({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, hasTouch: true, isMobile: true });
  for (const [n, pr] of [['0', 0.1], ['1', 0.5], ['2', 0.9]]) { await to(p, pr); await p.waitForTimeout(900); await p.screenshot({ path: `work/s/q-m${n}.jpg`, type: 'jpeg', quality: 80, scale: 'css' }); }
  await b.close();
})().catch((e) => { console.error(e); process.exit(1); });
