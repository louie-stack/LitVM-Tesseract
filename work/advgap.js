const { chromium } = require('C:/Users/Graph/litvm-mobile-qa/node_modules/playwright-core');
(async () => { const b = await chromium.launch({ channel: 'msedge', headless: true });
 for (const [w,h] of [[1440,810],[390,844]]) { const p = await b.newPage({ viewport: { width: w, height: h } }); await p.goto('http://127.0.0.1:4178/', { waitUntil: 'load' }); await p.waitForTimeout(500);
 console.log(w, JSON.stringify(await p.evaluate(() => { const g=document.querySelector('.tx-team-grid'),t=document.querySelector('.tx-advisors-title'),a=document.querySelector('.tx-advisors'),c=getComputedStyle(t); const top=(e)=>e.offsetTop+0; return { gridBottom:g.offsetTop+g.offsetHeight, titleTop:t.offsetTop, titleH:t.offsetHeight, advTop:a.offsetTop, mt:c.marginTop, mb:c.marginBottom, pos:c.position, tr:c.transform, gridParent:g.parentElement.className }; }))); await p.close(); }
 await b.close(); })();
