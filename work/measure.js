// Numeric layout audit: left edges, centre lines, equal card sizes, text centred in boxes, and the 3D vs DOM centre.
const { chromium } = require('C:/Users/Graph/litvm-mobile-qa/node_modules/playwright-core');
(async () => {
  const b = await chromium.launch({ channel: 'msedge', headless: false, args: ['--use-angle=d3d11', '--ignore-gpu-blocklist'] });
  for (const [w, h] of [[1920, 1080], [1440, 810], [1280, 720], [1100, 800]]) {
    const p = await b.newPage({ viewport: { width: w, height: h } });
    p.on('pageerror', (e) => console.log('PAGEERROR', e.message));
    await p.goto('http://127.0.0.1:4178/', { waitUntil: 'load' });
    await p.waitForTimeout(2200);
    const r = await p.evaluate(() => {
      const q = (s) => document.querySelector(s), R = (s) => { const e = typeof s === 'string' ? q(s) : s; return e.getBoundingClientRect(); };
      const cw = document.documentElement.clientWidth, c = (s) => { const x = R(s); return +(((x.left + x.right) / 2) - cw / 2).toFixed(1); };
      const left = {}; for (const s of ['#hero h1', '#hero .tx-lede', '.tx-collab', '.tx-mission-inner h2', '.tx-mission-inner .tx-lede', '.tx-cards', '#tx-hud', '.tx-team-grid']) left[s] = +R(s).left.toFixed(1);
      const centre = {}; for (const s of ['.tx-dim-stage .tx-title', '.tx-track-head', '.tx-cohort-head', '.tx-team-head', '.tx-apply-card', '.tx-team-grid']) centre[s] = c(s);
      const cards = [...document.querySelectorAll('.tx-card')].map((e) => { const x = e.getBoundingClientRect(); return [Math.round(x.width), Math.round(x.height)]; });
      const people = [...document.querySelectorAll('.tx-person')].map((e) => Math.round(e.getBoundingClientRect().height));
      const rules = [...document.querySelectorAll('.tx-person ul')].map((e) => +(e.getBoundingClientRect().top).toFixed(1));
      const rg = document.createRange(); let worst = 0;
      document.querySelectorAll('.tx-btn,.tx-funnel-row span').forEach((e) => { rg.selectNodeContents(e); const a = rg.getBoundingClientRect(), o = e.getBoundingClientRect(); if (o.width) worst = Math.max(worst, Math.abs((a.left + a.right - o.left - o.right) / 2), Math.abs((a.top + a.bottom - o.top - o.bottom) / 2)); });
      const can = R('#tx-gl');
      return { left, distinctLeft: new Set(Object.values(left)).size, centre, cards, people, rules, worstOffCentre: +worst.toFixed(2), canvasW: can.width, cw, sw: document.documentElement.scrollWidth };
    });
    console.log(w + 'x' + h, JSON.stringify(r));
    await p.close();
  }
  await b.close();
})().catch((e) => { console.error(e); process.exit(1); });
