/* Renders the teaser's title cards as transparent 1080×1920 PNGs in the Arcanum fonts, plus the end card.
   Usage: node tools/teaser/titles.cjs <outDir> */
const { chromium } = require('playwright');
const { cues: CUES } = require('./timeline.json');
const out = process.argv[2];
const W = 1080, H = 1920;

const page = (body, bg = 'transparent') => `<!doctype html><html><head><meta charset="utf-8">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,500;1,300&family=Schibsted+Grotesk:wght@500&display=swap">
<style>html,body{margin:0;width:${W}px;height:${H}px;background:${bg};overflow:hidden}
.cue{position:absolute;left:0;right:0;padding:0 9%;text-align:center;font-family:"Cormorant Garamond",serif;color:#EDE4DA;text-shadow:0 4px 40px rgba(0,0,0,.95),0 0 3px rgba(0,0,0,.7)}
.cue::before{content:"";position:absolute;left:-10%;right:-10%;top:-60%;bottom:-60%;z-index:-1;background:radial-gradient(50% 50% at 50% 50%,rgba(5,3,6,.7),rgba(5,3,6,.35) 55%,rgba(5,3,6,0))}
.top{top:13%}.bottom{bottom:13%}
.sc{font-family:"Schibsted Grotesk",sans-serif;font-size:30px;letter-spacing:.42em;text-transform:uppercase;color:#E0584F;margin:0 0 30px}
.h{font-weight:300;font-size:98px;line-height:1;margin:0}.h em{font-style:italic;color:#F0D8C0;display:block}
.end{position:absolute;inset:0;display:grid;place-content:center;justify-items:center;gap:42px;text-align:center;font-family:"Cormorant Garamond",serif;color:#EDE4DA}
.end svg{width:180px;height:180px;color:#C8443F;filter:drop-shadow(0 0 26px rgba(200,68,63,.7))}
.word{font-size:128px;letter-spacing:.32em;font-weight:500;margin:0 0 0 .32em}
.line{width:150px;height:1px;background:#C8443F}
.tag{font-size:66px;font-style:italic;font-weight:300;color:#F0D8C0;margin:0}
.small{font-family:"Schibsted Grotesk",sans-serif;font-size:28px;letter-spacing:.34em;text-transform:uppercase;color:#B5A89E;margin:50px 0 0}
</style></head><body>${body}</body></html>`;

// the key-and-moon mark from the site
const SIGIL = '<svg viewBox="0 0 40 40"><circle cx="13" cy="13" r="8.5" fill="none" stroke="currentColor" stroke-width="1.5"/><path d="M16.2 8.6a5.6 5.6 0 1 0 0 8.8 4.4 4.4 0 1 1 0-8.8z" fill="currentColor"/><path d="M19 19l16 16M28.5 28.5l-3.6 3.6M32 32l-3 3" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/><path d="M31 4.5l.9 2.4 2.4.9-2.4.9L31 11.1l-.9-2.4-2.4-.9 2.4-.9z" fill="currentColor"/></svg>';

(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: W, height: H } });
  for (const [i, c] of CUES.entries()){
    await p.setContent(page(`<div class="cue ${c.pos}">${c.label ? `<p class="sc">${c.label}</p>` : ''}<p class="h">${c.text}</p></div>`), { waitUntil: 'networkidle' });
    await p.evaluate(() => document.fonts.ready);
    await p.screenshot({ path: `${out}/cue${i}.png`, omitBackground: true });
  }
  await p.setContent(page(`<div class="end">${SIGIL}<p class="word">ARCANUM</p><div class="line"></div><p class="tag">Some doors only open for two.</p><p class="small">Kuala Lumpur · Season I</p></div>`, '#050306'), { waitUntil: 'networkidle' });
  await p.evaluate(() => document.fonts.ready);
  await p.screenshot({ path: `${out}/end.png` });
  await b.close();
  console.log('titles ->', out);
})();
