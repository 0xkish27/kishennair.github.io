/* the full-screen play overlay: open and close, top bar, HUD, render() and the route map */
import { $, esc, reduce } from '../lib/util.js';
import { J } from '../data/journeys.js';
import { S, fresh, clearTimer, setTimer, stopGame, resMult } from './state.js';
import { startAmbience, setAmbienceKey, setAmbienceResonance, swell, soundOn, toggleSound, onSoundChange } from '../ui/ambience.js';
import { onTilt, haptic } from '../ui/motion.js';
import { fogBurst } from '../three/fog.js';
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
    fresh(id); app.style.setProperty('--accent-glow', J[id].accent); Relic.set(id); Relic.resonance(0); startAmbience(id); setAmbienceResonance(0); document.body.classList.add('app-open');
    app.hidden=false; document.body.style.overflow='hidden'; render();
    v.classList.remove('close');
  }, reduce?0:650);
}
export function closeApp(){ stopGame(); setAmbienceKey('landing'); Relic.unmount(); document.body.classList.remove('app-open'); app.hidden=true; document.body.style.overflow=''; clearTimer(); if(lastFocus) lastFocus.focus(); }

const PRE = ['brief','book','pay','paying','paid','register','seal','prologue','boon'];
export function elapsed(){ if(!S.started) return '0:00'; const s=Math.floor((Date.now()-S.started)/1000); return `${Math.floor(s/60)}:${String(s%60).padStart(2,'0')}`; }
function hud(){
  const j=J[S.j];
  const dots=j.stops.map((_,i)=>`<i class="${i<S.stop?'done':i===S.stop&&!['final','ending','scrapbook'].includes(S.step)?'now':['final','ending','scrapbook'].includes(S.step)?'done':''}"></i>`).join('');
  const fourth = j.purse ? `<div><b>RM ${j.purse - S.spent}</b><span>Purse left</span></div>` : `<div><b>${S.hints}</b><span>Hints left</span></div>`;
  return `<div class="hud"><div><b id="tm">${elapsed()}</b><span>Time</span></div><div><b class="pts">${S.points}</b><span>Points</span></div><div><b>${S.letters.join('')||'·'}</b><span>Letters</span></div>${fourth}</div><div class="dots">${dots}</div><div class="resbar" id="resbar" data-lv="${S.res}" style="--r:${S.res/4}"><span>Resonance</span><i></i><b>×${resMult()}</b></div>`;
}
let lastKey='';
export function render(){
  stopGame();
  const key=`${S.j}:${S.step}:${S.stop}:${S.task}`, moved=key!==lastKey; lastKey=key;
  const j=J[S.j], inGame=!PRE.includes(S.step);
  const back = ['book','pay','register'].includes(S.step);
  col.innerHTML = `
    <div class="topbar">
      <button class="iconbtn" type="button" data-a="${back?'back':'close'}" aria-label="${back?'Back':'Leave the journey'}">${back?'←':'×'}</button>
      <span class="ttl">${esc(j.name.toLowerCase())}</span>
      ${soundBtn()}
    </div>
    ${inGame?hud():''}
    <div class="view ${moved?'enter':'still'}" id="view">${VIEWS[S.step]()}</div>
    <p class="proto">Prototype · ${inGame&&!['ending','scrapbook'].includes(S.step)?'<button type="button" data-a="skip">Skip this step</button> ·':''} no real payment, GPS or account</p>`;
  app.scrollTop=0;
  clearTimer();
  if(S.started && inGame && S.step!=='scrapbook'){ setTimer(()=>{const t=document.getElementById('tm'); if(t) t.textContent=elapsed();},1000); }
  const f=col.querySelector('[autofocus]'); if(f) setTimeout(()=>f.focus(),80);
  const slot=col.querySelector('[data-relic]'); if(slot) Relic.mount(slot); else Relic.unmount();
  if(S.step==='task'){ const t=curTask(); if(GAMEINIT[t.type]) GAMEINIT[t.type](t); }
  col.querySelectorAll('.reveal-card .tcard.flip').forEach((c,i)=>setTimeout(()=>{ c.classList.remove('flip'); burstAt(c, c.classList.contains('legendary')?120:60, c.classList.contains('legendary')?300:200); sfx('ok'); }, 700+i*400));
}
export function setResonance(n){ S.res=Math.max(0,Math.min(4,n)); S.peakRes=Math.max(S.peakRes||0,S.res); Relic.resonance(S.res); setAmbienceResonance(S.res); const r=document.getElementById('resbar'); if(r){ r.style.setProperty('--r',S.res/4); r.dataset.lv=S.res; const b=r.querySelector('b'); if(b) b.textContent='×'+resMult(); } }
export function go(step){ S.step=step; S.hintShown=false; S.wrong=0; S.sub=null; render(); }
export function award(n,msg,extra=1){ const pts=Math.round(n*(S.omen?.mult||1)*resMult()*extra); Relic.pulse('ok'); fogBurst(); swell(); haptic('ok'); S.points+=pts; sfx('ok'); toast(`${msg||'Solved'} · +${pts}${resMult()>1?' · resonance ×'+resMult():''}`); const p=document.querySelector('#app .hud .pts'); if(p){ p.textContent=S.points; p.classList.remove('tick'); void p.offsetWidth; p.classList.add('tick'); } }

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

const SPK_ON='<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"><path d="M4 9h4l5-4v14l-5-4H4z"/><path d="M16.5 8.5a5 5 0 0 1 0 7M19 6a8.5 8.5 0 0 1 0 12"/></svg>';
const SPK_OFF='<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"><path d="M4 9h4l5-4v14l-5-4H4z"/><path d="M17 9l5 6M22 9l-5 6"/></svg>';
export const soundBtn=()=>`<button class="iconbtn sound ${soundOn()?'on':''}" type="button" data-sound aria-pressed="${soundOn()}" aria-label="Sound">${soundOn()?SPK_ON:SPK_OFF}</button>`;

export function initShell(){
  document.addEventListener('click',e=>{ const b=e.target.closest('[data-sound]'); if(!b) return; e.stopPropagation(); toggleSound(); if(soundOn()) startAmbience(app.hidden?'landing':S.j); });
  onSoundChange(on=>document.querySelectorAll('[data-sound]').forEach(b=>{ b.classList.toggle('on',on); b.setAttribute('aria-pressed',on); b.innerHTML=on?SPK_ON:SPK_OFF; }));
  onTilt((x,y,src)=>{ if(src==='gyro'&&!app.hidden) Relic.point(x*.6,y*.6); });
  addEventListener('keydown',e=>{ if(e.key==='Escape' && !app.hidden) closeApp(); });
  app.addEventListener('pointermove',e=>Relic.point(e.clientX/innerWidth-.5,e.clientY/innerHeight-.5),{passive:true});
}
