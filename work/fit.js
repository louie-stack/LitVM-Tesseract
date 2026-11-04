// Do any cards clip their text? How evenly do the stops pass? Is the ending clear of the coin?
const { chromium } = require('C:/Users/Graph/litvm-mobile-qa/node_modules/playwright-core');
(async () => {
  const b = await chromium.launch({ channel: 'msedge', headless: false, args: ['--use-angle=d3d11', '--ignore-gpu-blocklist'] });
  for (const [w, h, mob] of [[1920, 1080], [1440, 810], [1366, 700], [1280, 720], [390, 844, 1]]) {
    const c = await b.newContext(mob ? { viewport: { width: w, height: h }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 } : { viewport: { width: w, height: h } });
    const p = await c.newPage();
    p.on('pageerror', (e) => console.log('PAGEERROR', e.message));
    await p.goto('http://127.0.0.1:4178/', { waitUntil: 'load' });
    await p.waitForTimeout(2000);
    const goto = (y) => p.evaluate((v) => { if (window.__tx.lenis) window.__tx.lenis.scrollTo(v, { immediate: true }); else scrollTo(0, v); }, y);
    const clip = await p.evaluate(() => [...document.querySelectorAll('.tx-card-inner')].map((e) => { const t = e.querySelector('.tx-card-text').getBoundingClientRect(), o = e.getBoundingClientRect(); return Math.round(t.height - (o.height - 2 * parseFloat(getComputedStyle(e).paddingTop))); }));
    // sample stop counter across the run
    const tr = await p.evaluate(() => { const e = document.querySelector('#track'); return { t: e.getBoundingClientRect().top + scrollY, h: e.offsetHeight - innerHeight }; });
    const seq = [];
    for (const f of [0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8]) { await goto(tr.t + tr.h * f); await p.waitForTimeout(220); seq.push(await p.evaluate(() => document.querySelector('#tx-count').textContent.slice(0, 2))); }
    const a = await p.evaluate(() => { const e = document.querySelector('#apply'); return e.getBoundingClientRect().top + scrollY; });
    await goto(a); await p.waitForTimeout(1300);
    await p.screenshot({ path: `work/s/end-${w}.jpg`, type: 'jpeg', quality: 80 });
    const card = await p.evaluate(() => { const r = document.querySelector('.tx-apply-card').getBoundingClientRect(); return { top: Math.round(r.top), bottom: Math.round(r.bottom), vh: innerHeight }; });
    console.log(`${w}x${h}`, 'cardOverflowPx', JSON.stringify(clip), 'stops', seq.join(' '), 'applyCard', JSON.stringify(card));
    await c.close();
  }
  await b.close();
})().catch((e) => { console.error(e); process.exit(1); });
