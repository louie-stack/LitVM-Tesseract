// Which part of Four Dimensions costs frames? Repeats each state so a slow first moment is not blamed on a feature. node work/dimfps.js
const { chromium } = require('C:/Users/Graph/litvm-mobile-qa/node_modules/playwright-core');
(async () => {
  const b = await chromium.launch({ channel: 'msedge', headless: false, args: ['--use-angle=d3d11', '--ignore-gpu-blocklist', '--window-position=0,0', '--disable-frame-rate-limit', '--disable-gpu-vsync'] });
  const c = await b.newContext({ viewport: { width: 1440, height: 810 }, deviceScaleFactor: 2 }); const p = await c.newPage();
  await p.goto('http://127.0.0.1:4178/', { waitUntil: 'load' }); await p.waitForTimeout(3000);
  const to = (sel, prog) => p.evaluate(([sel, prog]) => { const e = document.querySelector(sel), y = e.getBoundingClientRect().top + scrollY + prog * (e.offsetHeight - innerHeight); window.__tx.lenis.scrollTo(y, { immediate: true }); }, [sel, prog]);
  const fps = () => p.evaluate(() => new Promise((r) => { let n = 0; const t0 = performance.now(); (function f() { n++; if (performance.now() - t0 > 2000) r(Math.round(n / 2)); else requestAnimationFrame(f); })(); }));
  const three = async (label) => { const a = []; for (let i = 0; i < 3; i++) a.push(await fps()); console.log(label, a.join(' ')); };
  await to('#mission', 0.5); await p.waitForTimeout(1000); await three('mission baseline   ');
  await to('#dimensions', 0.85); await p.waitForTimeout(800); await three('dimensions, all on ');
  const edge = await p.addStyleTag({ content: '.tx-edge{display:none}' }); await p.waitForTimeout(300); await three('edge light off     ');
  await edge.evaluate((n) => n.remove()); await p.waitForTimeout(300); await three('edge light back on ');
  await p.mouse.move(1240, 680); await p.waitForTimeout(400); await p.mouse.move(1250, 660); await three('hovering a card    ');
  await b.close();
})().catch((e) => { console.error(e); process.exit(1); });
