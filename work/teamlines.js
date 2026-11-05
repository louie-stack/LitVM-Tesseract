// Team bio line counts per width: node work/teamlines.js (server running)
const { chromium } = require('C:/Users/Graph/litvm-mobile-qa/node_modules/playwright-core');
(async () => {
  const b = await chromium.launch({ channel: 'msedge', headless: true });
  for (const w of [2560, 1920, 1728, 1680, 1536, 1512, 1440, 1366, 1280, 1100, 1024, 820, 430, 390, 360]) {
    const p = await b.newPage({ viewport: { width: w, height: 900 } });
    await p.goto('http://127.0.0.1:4178/', { waitUntil: 'load' }); await p.evaluate(() => document.fonts.ready); await p.waitForTimeout(300);
    const r = await p.evaluate(() => [...document.querySelectorAll('.tx-person-bio')].map((e) => { const g = document.createRange(); g.selectNodeContents(e); return new Set([...g.getClientRects()].map((q) => Math.round(q.top))).size; }));
    console.log(w, r.join(' ')); await p.close();
  }
  await b.close();
})().catch((e) => { console.error(e); process.exit(1); });
