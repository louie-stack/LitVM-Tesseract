// Brought-to-you-by line count at each width; ending card clearances; strip alignment.
const { chromium } = require('C:/Users/Graph/litvm-mobile-qa/node_modules/playwright-core');
(async () => {
  const b = await chromium.launch({ channel: 'msedge', headless: false, args: ['--use-angle=d3d11', '--ignore-gpu-blocklist'] });
  for (const [w, h] of [[1920, 1080], [1440, 810], [1366, 700], [1280, 720], [1100, 800], [390, 844]]) {
    const p = await b.newPage({ viewport: { width: w, height: h } });
    p.on('pageerror', (e) => console.log('PAGEERROR', e.message));
    await p.goto('http://127.0.0.1:4178/', { waitUntil: 'load' });
    await p.waitForTimeout(1800);
    const r = await p.evaluate(() => {
      const lede = document.querySelector('.tx-team-head .tx-lede'), rg = document.createRange(); rg.selectNodeContents(lede);
      const tops = new Set([...rg.getClientRects()].map((x) => Math.round(x.top)));
      const q = (s) => document.querySelector(s).getBoundingClientRect();
      const strip = q('.tx-strip'), hero = q('#hero'), card = q('.tx-apply-card'), apply = q('#apply');
      return { ledeLines: tops.size, stripH: Math.round(strip.height), stripAtBottom: Math.round(hero.bottom - strip.bottom), collabL: Math.round(q('.tx-strip .tx-collab').left), h1L: Math.round(q('#hero h1').left), dateR: Math.round(q('.tx-date').right), gridR: Math.round(q('.tx-team-grid').right), cardGapToFooter: Math.round(apply.bottom - card.bottom), cardH: Math.round(card.height), cardTopInSection: Math.round(card.top - apply.top) };
    });
    console.log(w + 'x' + h, JSON.stringify(r));
    await p.close();
  }
  await b.close();
})().catch((e) => { console.error(e); process.exit(1); });
