// Team-to-Cohort 2 gap: node work/applyscroll.js <outdir> (server running; real browser window)
const { chromium } = require('C:/Users/Graph/litvm-mobile-qa/node_modules/playwright-core');
(async () => { const b = await chromium.launch({ channel: 'msedge', headless: false, args: ['--use-angle=d3d11', '--ignore-gpu-blocklist', '--window-position=0,0'] });
 const W = +process.argv[3] || 1440, H = +process.argv[4] || 810; const p = await b.newPage({ viewport: { width: W, height: H } }); p.on('pageerror', (e) => console.log('PAGEERROR', e.message));
 await p.goto('http://127.0.0.1:4178/', { waitUntil: 'load' }); await p.waitForTimeout(3000);
 const m = await p.evaluate(() => { const r = (s) => { const q = document.querySelector(s).getBoundingClientRect(); return { top: Math.round(q.top + scrollY), bottom: Math.round(q.bottom + scrollY) }; }; return { collab: r('.tx-team-collab'), team: r('#team'), apply: r('#apply'), card: r('.tx-apply-card'), footer: r('footer') }; });
 console.log(JSON.stringify(m), 'gap collab->card', m.card.top - m.collab.bottom, 'card->section end', m.apply.bottom - m.card.bottom);
 const go = async (y) => { await p.evaluate((y) => { if (window.__tx && window.__tx.lenis) window.__tx.lenis.scrollTo(y, { immediate: true }); else scrollTo(0, y); }, y); await p.waitForTimeout(1600); };
 const out = process.argv[2] || 'work/s';
 const tag = `${W}`; await go(m.collab.bottom - H + 120); await p.screenshot({ path: `${out}/ap-${tag}-0.jpg`, type: 'jpeg', quality: 82 }); await go(m.card.top - H + 200); await p.screenshot({ path: `${out}/ap-${tag}-1.jpg`, type: 'jpeg', quality: 82 });
 await go(m.apply.bottom - H); await p.screenshot({ path: `${out}/ap-${tag}-2.jpg`, type: 'jpeg', quality: 82 });
 await b.close(); })().catch((e) => { console.error(e); process.exit(1); });
