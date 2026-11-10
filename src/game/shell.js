/* the full-screen play overlay: open and close, top bar, HUD, render() and the route map */
import { $, esc, reduce } from '../lib/util.js';
import { J } from '../data/journeys.js';
import { S, fresh, clearTimer, setTimer, stopGame } from './state.js';
import { Relic } from '../three/relic.js';
import { VIEWS, curTask } from './views.js';
import { GAMEINIT } from './minigames.js';
import { toast, sfx, burstAt } from '../ui/fx.js';

export const app = $('#app'), col = $('#appCol');
let lastFocus=null;
export function openApp(id){
  if(!J[id]) return;
  lastFocus=document.activeElement;
  const v=$('#veil'); v.classList.add('close');
  setTimeout(()=>{
    fresh(id); app.style.setProperty('--accent-glow', J[id].accent); Relic.set(id); document.body.classList.add('app-open');
    app.hidden=false; document.body.style.overflow='hidden'; render();
    v.classList.remove('close');
  }, reduce?0:650);
}
export function closeApp(){ stopGame(); Relic.unmount(); document.body.classList.remove('app-open'); app.hidden=true; document.body.style.overflow=''; clearTimer(); if(lastFocus) lastFocus.focus(); }

const PRE = ['brief','book','pay','paying','paid','register','seal','prologue'];
export function elapsed(){ if(!S.started) return '0:00'; const s=Math.floor((Date.now()-S.started)/1000); return `${Math.floor(s/60)}:${String(s%60).padStart(2,'0')}`; }
function hud(){
  const j=J[S.j];
  const dots=j.stops.map((_,i)=>`<i class="${i<S.stop?'done':i===S.stop&&!['final','ending','scrapbook'].includes(S.step)?'now':['final','ending','scrapbook'].includes(S.step)?'done':''}"></i>`).join('');
  const fourth = j.purse ? `<div><b>RM ${j.purse - S.spent}</b><span>Purse left</span></div>` : `<div><b>${S.hints}</b><span>Hints left</span></div>`;
  return `<div class="hud"><div><b id="tm">${elapsed()}</b><span>Time</span></div><div><b>${S.points}</b><span>Points</span></div><div><b>${S.letters.join('')||'·'}</b><span>Letters</span></div>${fourth}</div><div class="dots">${dots}</div>`;
}
export function render(){
  stopGame();
  const j=J[S.j], inGame=!PRE.includes(S.step);
  const back = ['book','pay','register'].includes(S.step);
  col.innerHTML = `
    <div class="topbar">
      <button class="iconbtn" type="button" data-a="${back?'back':'close'}" aria-label="${back?'Back':'Leave the journey'}">${back?'←':'×'}</button>
      <span class="ttl">${esc(j.name.toLowerCase())}</span>
      <svg width="30" height="30" style="color:var(--candle);flex:none" aria-hidden="true"><use href="#sigil"/></svg>
    </div>
    ${inGame?hud():''}
    <div class="view" id="view">${VIEWS[S.step]()}</div>
    <p class="proto">Prototype · ${inGame&&!['ending','scrapbook'].includes(S.step)?'<button type="button" data-a="skip">Skip this step</button> ·':''} no real payment, GPS or account</p>`;
  app.scrollTop=0;
  clearTimer();
  if(S.started && inGame && S.step!=='scrapbook'){ setTimer(()=>{const t=document.getElementById('tm'); if(t) t.textContent=elapsed();},1000); }
  const f=col.querySelector('[autofocus]'); if(f) setTimeout(()=>f.focus(),80);
  const slot=col.querySelector('[data-relic]'); if(slot) Relic.mount(slot); else Relic.unmount();
  if(S.step==='task'){ const t=curTask(); if(GAMEINIT[t.type]) GAMEINIT[t.type](t); }
  col.querySelectorAll('.reveal-card .tcard.flip').forEach((c,i)=>setTimeout(()=>{ c.classList.remove('flip'); burstAt(c, c.classList.contains('legendary')?120:60, c.classList.contains('legendary')?300:200); sfx('ok'); }, 700+i*400));
}
export function go(step){ S.step=step; S.hintShown=false; S.wrong=0; S.sub=null; render(); }
export function award(n,msg){ Relic.pulse('ok'); S.points+=n; sfx('ok'); toast(`${msg||'Solved'} · +${n}`); }

/* ---------------- map ---------------- */
export function mapSVG(showAll){
  const j=J[S.j], W=460,H=330, P=s=>[20+s.x*(W-40),20+s.y*(H-40)];
  const pts=j.stops.map(P);
  let d=`M${pts[0][0]} ${pts[0][1]}`; for(let i=1;i<pts.length;i++){const a=pts[i-1],b=pts[i]; d+=` Q${(a[0]+b[0])/2+(i%2?30:-30)} ${(a[1]+b[1])/2} ${b[0]} ${b[1]}`;}
  let s=7; const R=()=>(s=(s*16807)%2147483647,(s-1)/2147483646);
  const streets=Array.from({length:16},()=>{const x=R()*W,y=R()*H,a=R()<.5?.4:2,l=60+R()*160;return `<path d="M${x-Math.cos(a)*l/2} ${y-Math.sin(a)*l/2}L${x+Math.cos(a)*l/2} ${y+Math.sin(a)*l/2}"/>`}).join('');
  const marks=j.stops.map((st,i)=>{const [x,y]=pts[i]; const known=showAll||i<S.stop||(i===S.stop&&S.step!=='travel')||(i===S.stop&&S.sub==='shown'); const cur=i===S.stop&&!showAll;
    return `<g transform="translate(${x} ${y})">${cur?'<circle r="16" fill="none" stroke="#F0D8C0" stroke-opacity=".6"><animate attributeName="r" values="8;22" dur="1.6s" repeatCount="indefinite"/><animate attributeName="stroke-opacity" values=".8;0" dur="1.6s" repeatCount="indefinite"/></circle>':''}
      <rect x="-6" y="-6" width="12" height="12" transform="rotate(45)" fill="${i<S.stop?'#C8443F':cur?'#F0D8C0':'#0b0a17'}" stroke="#C8443F"/>
      <text x="12" y="4" font-family="Newsreader, Georgia, serif" font-style="italic" font-size="14" fill="${known?'#ECEAF5':'#7D789F'}">${known?esc(st.place.split(',')[0]):'Sealed'}</text></g>`}).join('');
  return `<svg class="map" viewBox="0 0 ${W} ${H}" role="img" aria-label="Route map">
    <g stroke="#ADA8C8" stroke-opacity=".12">${Array.from({length:10},(_,i)=>`<path d="M${i*50} 0V${H}M0 ${i*40}H${W}"/>`).join('')}</g>
    <g stroke="#ADA8C8" stroke-opacity=".28" stroke-width="1.2">${streets}</g>
    <path d="${d}" fill="none" stroke="#C8443F" stroke-width="2" stroke-dasharray="2 8" stroke-linecap="round"/>
    ${marks}
    <g transform="translate(${W-40} ${H-40})" stroke="#C8443F" fill="none"><circle r="16"/><path d="M0-22L4 0 0 22-4 0z" fill="#C8443F"/><text y="-26" x="-4" font-size="10" fill="#C8443F" stroke="none" font-family="Georgia">N</text></g>
  </svg>`;
}
export const gmaps = q => `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}`;

export function initShell(){
  addEventListener('keydown',e=>{ if(e.key==='Escape' && !app.hidden) closeApp(); });
  app.addEventListener('pointermove',e=>Relic.point(e.clientX/innerWidth-.5,e.clientY/innerHeight-.5),{passive:true});
}
