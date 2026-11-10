/* the landing page: journey mirrors, card decks, collection, leaderboard, Keys and the hero seal */
import { $, esc, store, reduce } from './lib/util.js';
import { em } from './data/emblems.js';
import { J } from './data/journeys.js';
import { DECKS } from './data/cards.js';
import { S } from './game/state.js';
import { stopCard, legCard, cardHTML, loadColl, scoreOf, standings } from './game/collection.js';
import { openApp } from './game/shell.js';
import { toast, sfx, burstAt, armReveals } from './ui/fx.js';
import { fogBurst, phase, illum } from './three/fog.js';
import { initTonight, omenTonight } from './game/nightly.js';
import { startAmbience, swell } from './ui/ambience.js';
import { haptic, requestMotion } from './ui/motion.js';
import { soundBtn } from './game/shell.js';

let breakSeal3D = null;

export function renderArcana(){
  $('#fan').innerHTML=[stopCard('lantern',0,170,'hoverflip',''),stopCard('starfall',4,170,'hoverflip','rare'),legCard('lantern',190,'hoverflip'),stopCard('feast',1,170,'hoverflip','rare'),stopCard('echo',3,170,'hoverflip','')].join('');
  const o=loadColl();
  const tiers=[['Common',19,o.c.length,'One for every stop on every journey. Earned the moment you finish a stop.'],['Rare',19,o.r.length,'The same card in holographic foil. Play the stop with no hints and no wrong answers.'],['Legendary',4,o.l.length,'One per journey: The Lamplighter, The Wishing Star, The Hungry Spirit and The City\'s Song. Play every stop of a journey clean.'],['Secret',5,o.x.length,'Hidden cards for unusual nights. Nobody is told how to earn them, but here is one hint: the Night Owl starts late.']];
  $('#tiers').innerHTML=tiers.map(([n,t,h,d])=>`<div class="tier"><span class="sc">${n.toLowerCase()}</span><span class="cnt">${t}</span><p>${d}</p></div>`).join('');
  const have=o.c.length+o.r.length+o.l.length+o.x.length;
  $('#mycoll').innerHTML=`<div><span class="lbl">Your collection on this device</span><div style="font-family:var(--f-display);font-size:1.5rem">${have} of 47 cards · ${scoreOf(o).toLocaleString('en-US')} season points</div></div><div class="bar"><i style="width:${Math.max(2,have/47*100)}%"></i></div><button class="btn btn-gold" type="button" data-open="lantern" style="padding:10px 20px">${have?'Keep collecting':'Start collecting'}</button>`;
}
export function renderBoard(){ setTimeout(()=>armReveals(),0);
  const {rows}=standings(); const shown=rows.slice(0,10); const you=rows.find(r=>r.you);
  if(you && !shown.includes(you)) shown.push(you);
  $('#board').innerHTML=`<div class="bh"><span class="sc">season i · standings</span><span class="small">Closes 31 Jan 2027 · sample couples</span></div>`+
    shown.map(r=>{const k=rows.indexOf(r)+1; return `<div class="brow ${k<=3?'top g'+k:''} ${r.you?'you':''}"><span class="rk">${k}</span><span class="nm">${esc(r.n)}${r.you?' (you)':''}<small>${r.c} cards${k===1?' · the Obsidian Key':k===2?' · the Silver Key':k===3?' · the Bronze Key':''}</small></span><span style="font-family:var(--f-display);font-size:1.15rem">${r.p.toLocaleString('en-US')}</span></div>`}).join('')+
    (you?'':`<div class="brow"><span class="rk">·</span><span class="nm">You two<small>Finish any journey to enter the season</small></span><button class="txt-btn" type="button" data-open="starfall">Play</button></div>`);
}
const NFC='<svg class="nfc" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"><path d="M8 7a7 7 0 0 1 0 10M11.5 4.5a11 11 0 0 1 0 15M4.5 9.5a3.5 3.5 0 0 1 0 5"/></svg>';
export function renderKeys(){
  const K=[['obsidian','The Obsidian Key','First place','I of III',['A lifetime pass. Every journey, every season, free for both of you.','Opens The Midnight Door: a secret journey released once a season that only Key holders can play, ending at a real sealed box hidden somewhere in KL.','Write the riddle. Your riddle goes into next season\'s journey, signed with your names.','Tap it on any phone to open your couple scrapbook.','Your names carved into the Hall of Keepers on the site, for good.']],
    ['silver','The Silver Key','Second place','II of III',['A full year of journeys, free for both of you.','Opens The Midnight Door for one season.','Tap it on any phone to open your couple scrapbook.','Your names in the Hall of Keepers.']],
    ['bronze','The Bronze Key','Third place','III of III',['Six free journeys to use any time.','Play every new journey a week before anyone else.','Tap it on any phone to open your couple scrapbook.','Your names in the Hall of Keepers.']]];
  $('#keys').innerHTML=K.map(([cls,n,place,num,perks])=>`<div class="key"><div class="metal ${cls}" data-tilt><div class="mt"><span>arcanum</span>${NFC}</div><div><div class="mn">${n}</div></div><div class="mb"><span>Season I · ${place}</span><span>${num}</span></div></div><h3>${n}</h3><ul>${perks.map(x=>`<li><span>${x}</span></li>`).join('')}</ul></div>`).join('');
  document.querySelectorAll('[data-tilt]').forEach(el=>{
    el.addEventListener('pointermove',e=>{ if(reduce) return; const r=el.getBoundingClientRect(); const x=(e.clientX-r.left)/r.width, y=(e.clientY-r.top)/r.height; el.style.transform=`perspective(800px) rotateY(${(x-.5)*18}deg) rotateX(${(.5-y)*14}deg)`; el.style.setProperty('--mx',x*100+'%'); el.style.setProperty('--my',y*100+'%'); });
    el.addEventListener('pointerleave',()=>{ el.style.transform=''; });
  });
}
export function renderDecks(){
  $('#deckList').innerHTML = DECKS.map(([k,n,d]) => `
    <div class="deck ${S.deck===k?'chosen':''}">
      <div class="pair">${cardHTML(k,J.lantern.name,J.lantern.stops[0],'1 of 5',190,'hoverflip')}</div>
      <h3>${n}</h3><p>${d}</p>
      <button class="btn btn-ghost pick" type="button" data-deckpick="${k}">${S.deck===k?'Chosen deck':'Use this deck'}</button>
    </div>`).join('');
}

function breakHero(){
  const st=$('#sealStage'); if(st.classList.contains('broken')) return;
  st.classList.add('broken'); sfx('crack'); haptic('crack'); requestMotion(); startAmbience('landing'); fogBurst(); if(breakSeal3D) breakSeal3D(); else burstAt($('#sealBtn'),90,200);
  setTimeout(()=>{ document.getElementById('doors').scrollIntoView({behavior: reduce?'auto':'smooth'}); }, reduce?0:1900);
  setTimeout(()=>st.classList.remove('broken'), 4200);
}

export function setSealBreaker(fn){ breakSeal3D = fn || null; }

export function initLanding(){
  $('#navSound').outerHTML = soundBtn();
  const on=$('#omenName'); if(on) on.textContent=omenTonight().name;
  initTonight((gain,streak,miss)=>{
    if(miss){ sfx('bad'); haptic('bad'); toast('Not quite. The riddle waits.'); return; }
    sfx('ok'); haptic('win'); fogBurst(); startAmbience('landing'); swell(2); burstAt($('#tonight .nightly'),70,220);
    toast(`Solved · +${gain} season points · ${streak} ${streak===1?'night':'nights'} in a row`); renderArcana(); renderBoard();
  });
$('#doorList').innerHTML = Object.entries(J).map(([id,j]) => `
  <article class="door">
    <div class="mirror" style="--c:${j.hc};--bf:${j.bf}" data-open="${id}" role="button" tabindex="0" aria-label="Open ${esc(j.name)}"><div class="mist m1"></div><div class="mist m2"></div><div class="em">${em(j.em,1.8)}</div><div class="glass"></div></div>
    <div class="mstat" style="--c:${j.hc}"><span class="live">Open</span><span>Difficulty <span class="diff">${[1,2,3,4,5].map(n=>`<i class="${n<=j.diff?'on':''}"></i>`).join('')}</span></span></div>
    <h3 data-decrypt>${esc(j.name)}</h3>
    <p class="sc" style="margin:0" data-decrypt>${esc(j.tag)}</p>
    <p>${esc(j.blurb)}</p>
    <dl class="facts"><div><dt>Walk</dt><dd>${j.walk}</dd></div><div><dt>Time</dt><dd>${j.time}</dd></div><div><dt>Spend</dt><dd>${j.spend}</dd></div></dl>
    <div class="door-foot"><span class="price">RM ${j.ticket} <small>per couple</small></span><button class="btn btn-gold" type="button" data-open="${id}" style="padding:10px 20px">Begin</button></div>
  </article>`).join('');
  renderDecks(); renderArcana(); renderBoard(); renderKeys();
document.addEventListener('click', e => {
  const dp = e.target.closest('[data-deckpick]');
  if (dp){ S.deck = dp.dataset.deckpick; store.set('arc-deck',S.deck); renderDecks(); renderArcana(); toast('Deck chosen: '+DECKS.find(d=>d[0]===S.deck)[1]); return; }
  const tc = e.target.closest('.tcard');
  if (tc) tc.classList.toggle('flip');
  const op = e.target.closest('[data-open]');
  if (op){ openApp(op.dataset.open); }
});
document.addEventListener('keydown', e => { if ((e.key==='Enter'||e.key===' ') && e.target.matches('.mirror')){ e.preventDefault(); openApp(e.target.dataset.open); } });
  $('#sealBtn').addEventListener('click', breakHero);
  $('#heroBreak').addEventListener('click', breakHero);
  const mp=document.getElementById('moonpct'); if(mp) mp.textContent=illum<.04?'a new moon, darkest night':illum>.96?'full and bright':`${Math.round(illum*100)}% lit, ${phase<.5?'waxing':'waning'}`;
}
