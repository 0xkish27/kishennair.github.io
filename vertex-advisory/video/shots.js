const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:1920,height:1080}});
await p.goto('file://'+__dirname+'/film.html');await p.evaluate(()=>document.fonts.ready);await p.waitForTimeout(300);
for(const t of process.argv.slice(2).map(Number)){await p.evaluate(t=>seek(t),t);await p.screenshot({path:`f_${t}.jpg`,type:'jpeg',quality:80})}
await b.close()})();
