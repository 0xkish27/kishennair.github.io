/* sound, toasts, glow bursts, scroll reveals and the mist-in text effect */
import { $, reduce } from '../lib/util.js';
import { onTilt } from './motion.js';

export function burst(x,y,n=50,spread=160){ if(reduce) return; const d=document.createElement('span'); const sz=spread*2.4; d.style.cssText=`position:fixed;left:${x-sz/2}px;top:${y-sz/2}px;width:${sz}px;height:${sz}px;border-radius:50%;pointer-events:none;z-index:95;background:radial-gradient(circle,rgba(255,248,225,.55),rgba(200,68,63,.18) 35%,rgba(200,68,63,0) 68%)`; document.body.appendChild(d);
  d.animate([{transform:'scale(.2)',opacity:0},{transform:'scale(.7)',opacity:1,offset:.25},{transform:'scale(1.15)',opacity:0}],{duration:1800,easing:'cubic-bezier(.2,.7,.2,1)'}).onfinish=()=>d.remove(); }
export function burstAt(el,n,spread){ if(!el) return; const r=el.getBoundingClientRect(); burst(r.left+r.width/2,r.top+r.height/2,n,spread); }
export function armReveals(){ const io=new IntersectionObserver(es=>es.forEach(e=>{ if(e.isIntersecting){ e.target.classList.add('in'); io.unobserve(e.target);} }),{rootMargin:'0px 0px -8% 0px'});
  document.querySelectorAll('main .head, .door, .how > div, .deck, .tier, .key, .brow, .budget > *, .closing').forEach(el=>{ if(el.classList.contains('rv')) return; const sib=[...el.parentElement.children].indexOf(el); el.classList.add('rv'); el.style.setProperty('--d',(Math.min(sib,6)*.08)+'s'); const r=el.getBoundingClientRect(); if(r.top>innerHeight) io.observe(el); }); }

export function decrypt(el){ if(reduce||el.dataset.done) return; el.dataset.done=1; el.animate([{filter:'blur(10px)',opacity:.15},{filter:'blur(0)',opacity:1}],{duration:1800,easing:'cubic-bezier(.2,.7,.2,1)'}); }
const dio=new IntersectionObserver(es=>es.forEach(e=>{ if(e.isIntersecting){ decrypt(e.target); dio.unobserve(e.target);} }),{threshold:.6});
export function armDecrypt(){ document.querySelectorAll('[data-decrypt], main .sc.eyebrow').forEach(el=>{ if(!el.dataset.done) dio.observe(el); }); }
let AC=null;
export function sfx(kind){
  try{
    AC = AC || new (window.AudioContext||window.webkitAudioContext)();
    const now=AC.currentTime, o=AC.createOscillator(), g=AC.createGain(); o.connect(g); g.connect(AC.destination);
    const map={crack:[180,.25,'triangle',.18], ok:[880,.35,'sine',.12], bad:[160,.25,'sawtooth',.05], tap:[620,.08,'sine',.06], p0:[392,.3,'sine',.15], p1:[494,.3,'sine',.15], p2:[587,.3,'sine',.15], p3:[740,.3,'sine',.15]};
    const [f,d,type,vol]=map[kind]||map.tap; o.type=type; o.frequency.setValueAtTime(f,now);
    if(kind==='ok'){o.frequency.setValueAtTime(660,now);o.frequency.setValueAtTime(990,now+.12);}
    if(kind==='crack'){o.frequency.exponentialRampToValueAtTime(40,now+d);}
    g.gain.setValueAtTime(vol,now); g.gain.exponentialRampToValueAtTime(.0001,now+d); o.start(now); o.stop(now+d+.02);
  }catch(e){}
}

/* ---------------- toast ---------------- */
let toastT;
export function toast(msg){ const t=$('#toast'); t.textContent=msg; t.classList.add('show'); clearTimeout(toastT); toastT=setTimeout(()=>t.classList.remove('show'),2200); }

export function initFx(){
  if(!reduce){ let raf=0, tx=0, ty=0; onTilt((x,y)=>{ tx=x; ty=y; if(raf) return; raf=requestAnimationFrame(()=>{ raf=0; const r=document.documentElement.style; r.setProperty('--tx',tx.toFixed(3)); r.setProperty('--ty',ty.toFixed(3)); }); }); }
  setTimeout(armReveals,50);
  document.addEventListener('pointermove',e=>{ if(reduce) return; const c=e.target.closest&&e.target.closest('.tcard'); document.querySelectorAll('.tcard[data-tilted]').forEach(o=>{ if(o!==c){ o.style.transform=''; o.removeAttribute('data-tilted'); } }); if(!c||c.closest('.fan')) return; const r=c.getBoundingClientRect(), x=(e.clientX-r.left)/r.width, y=(e.clientY-r.top)/r.height; c.dataset.tilted=1; c.style.transform=`perspective(800px) rotateX(${(.5-y)*16}deg) rotateY(${(x-.5)*18}deg) translateZ(10px)`; c.style.setProperty('--gx',x*100+'%'); c.style.setProperty('--gy',y*100+'%'); },{passive:true});
  armDecrypt();
}
