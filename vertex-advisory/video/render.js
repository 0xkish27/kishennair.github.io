const {chromium}=require('playwright');const {spawn}=require('child_process');
(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:1920,height:1080}});
await p.goto('file://'+__dirname+'/film.html');await p.evaluate(()=>document.fonts.ready);await p.waitForTimeout(300);
const ff=spawn('ffmpeg',['-loglevel','error','-y','-f','image2pipe','-framerate','30','-c:v','mjpeg','-i','-','-c:v','libx264','-crf','18','-preset','veryfast','-pix_fmt','yuv420p','-movflags','+faststart','tmp_v.mp4'],{stdio:['pipe','inherit','inherit']});
const N=39*30;for(let i=0;i<N;i++){await p.evaluate(t=>seek(t),i/30);const buf=await p.screenshot({type:'jpeg',quality:92});if(!ff.stdin.write(buf))await new Promise(r=>ff.stdin.once('drain',r))}
ff.stdin.end();await new Promise(r=>ff.on('close',c=>{console.log('ffmpeg',c);r()}));await b.close()})();
