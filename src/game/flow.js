/* moving through tasks and stops, and the one delegated click handler for every data-a action */
import { $, norm, store, reduce } from '../lib/util.js';
import { J } from '../data/journeys.js';
import { S, stopGame } from './state.js';
import { col, render, go, award, closeApp, elapsed } from './shell.js';
import { curStop, curTask } from './views.js';
import { renderArcana, renderDecks } from '../landing.js';
import { Relic } from '../three/relic.js';
import { toast, sfx, burstAt } from '../ui/fx.js';
import { loPress, loDraw, rot, beamCells, beamWin, runCatch, runRhythm, CONS, consPts, consShow } from './minigames.js';

export function nextTask(){
  const s=curStop();
  S.hintShown=false; S.wrong=0; S.sub=null; S.dare=0; S.seq=null; S.checks=[]; S.rating=0; S.lo=null; S.beam=null; S.mem=null; S.menuSel=[]; S.cons=null; stopGame();
  if(S.task<s.tasks.length-1){ S.task++; render(); }
  else { if(!S.cards.includes(S.stop)) S.cards.push(S.stop); if(S.clean&&!S.rares.includes(S.stop)) S.rares.push(S.stop); S.letters.push(s.letter); go('card'); }
}
export function solved(n,msg,delay=350){ award(n,msg); const l=document.getElementById('lock'); if(l){ l.classList.add('open'); setTimeout(nextTask,700);} else setTimeout(nextTask,delay); }
export function wrongAns(el){ Relic.pulse('bad'); S.wrong++; S.clean=false; if(S.step==='task'&&curTask().type==='knowme') S.kmMiss=true; sfx('bad'); if(el){el.classList.remove('bad'); void el.offsetWidth; el.classList.add('bad');} toast(S.wrong>=2?'Not quite. You can reveal it now.':'Not quite. Try again.'); if(S.wrong===2) render(); }
function playSeq(){
  const pads=[...col.querySelectorAll('.pad')]; let i=0; S.inp=[]; S.playing=true;
  const msg=document.getElementById('simonMsg'); if(msg) msg.textContent='Listen…';
  const seq=S.seq;
  const tick=()=>{ if(S.seq!==seq){ S.playing=false; return; } // task changed mid-playback
    if(i>=S.seq.length){ S.playing=false; if(msg) msg.textContent='Your turn'; return; }
    const p=pads[S.seq[i]]; p.classList.add('lit'); sfx('p'+S.seq[i]); setTimeout(()=>p.classList.remove('lit'),380); i++; setTimeout(tick,620); };
  setTimeout(tick,300);
}

function onward(){ const j=J[S.j]; if(S.stop<j.stops.length-1){ S.stop++; S.task=0; go('travel'); } else { S.picked=[]; S.scr=null; go('final'); } }

export function initFlow(){
col.addEventListener('change', e => {
  if(e.target.id==='ph-in' && e.target.files && e.target.files[0]){
    const fr=new FileReader(); fr.onload=()=>{ S.photos.push({src:fr.result, cap:curStop().name}); award(50,'Photo saved to your scrapbook'); setTimeout(nextTask,400); }; fr.readAsDataURL(e.target.files[0]);
  }
});
col.addEventListener('input', e => {
  const d=e.target.closest('[data-dig]'); if(!d) return;
  d.value=d.value.replace(/\D/g,'').slice(-1);
  if(d.value){ const n=col.querySelector(`[data-dig="${+d.dataset.dig+1}"]`); if(n) n.focus(); }
});
col.addEventListener('keydown', e => {
  const d=e.target.closest('[data-dig]');
  if(d && e.key==='Backspace' && !d.value){ const p=col.querySelector(`[data-dig="${+d.dataset.dig-1}"]`); if(p) p.focus(); }
  if(e.key==='Enter' && e.target.matches('#ans,#amt,#otp,[data-dig]')){ e.preventDefault(); const b=col.querySelector('.actions .btn-gold'); if(b) b.click(); }
});

col.addEventListener('click', e => {
  const b=e.target.closest('[data-a]'); if(!b) return;
  const a=b.dataset.a, v=b.dataset.v, j=J[S.j];
  sfx('tap');
  switch(a){
    case 'close': closeApp(); break;
    case 'back': go({book:'brief',pay:'book',register:'paid'}[S.step]); break;
    case 'skip':
      if(S.step==='travel'){ go('checkin'); S.sub='ok'; render(); }
      else if(S.step==='checkin'){ S.task=0; go('task'); }
      else if(S.step==='task'){ S.clean=false; nextTask(); }
      else if(S.step==='card'){ onward(); }
      else if(S.step==='final'){ go('ending'); }
      break;
    case 'to-book': go('book'); break;
    case 'date': S.date=+v; render(); break;
    case 'slot': S.slot=v; render(); break;
    case 'to-pay':
      S.names.a=$('#na').value.trim()||'You'; S.names.b=$('#nb').value.trim()||'Your person';
      S.vows={dreamTrip:$('#v1').value, firstDate:$('#v2').value, lateFood:$('#v3').value, song:$('#v4').value};
      go('pay'); break;
    case 'paym': S.pay=v; render(); break;
    case 'do-pay': go('paying'); break;
    case 'to-register': go('register'); break;
    case 'sendotp': { const ph=$('#ph').value.replace(/\D/g,''); if(ph.length<9||ph.length>10){ toast('Enter 9 or 10 digits, without the leading 0'); return; } S.sub='otp'; render(); break; }
    case 'otp': { if(!/^\d{6}$/.test($('#otp').value)){ toast('Enter all six digits'); return; } go('seal'); break; }
    case 'signed': toast('Signed in'); go('seal'); break;
    case 'break': b.classList.add('broken'); sfx('crack'); burstAt(b,90,240); setTimeout(()=>go('prologue'), reduce?0:1100); break;
    case 'begin': S.started=Date.now(); S.stop=0; go('travel'); break;
    case 'showplace': S.sub='shown'; render(); break;
    case 'checkin': go('checkin'); break;
    case 'start-tasks': S.task=0; S.clean=true; go('task'); break;
    case 'hint': if(S.hints<=0){ toast('No hints left'); return; } S.hints--; S.clean=false; S.points=Math.max(0,S.points-30); S.hintShown=true; render(); break;
    case 'reveal': { S.clean=false; const t=curTask(); const ans=t.type==='knowme'?S.vows[t.key]:(t.code||t.answers[0]); toast('The answer: '+ans); setTimeout(nextTask,1200); break; }
    case 'answer': { const t=curTask(), el=$('#ans'), val=norm(el.value); if(val && t.answers.some(x=>val===x||val.includes(x)||(x.length>3&&x.includes(val)&&val.length>3))) solved(S.hintShown?70:100); else wrongAns(el); break; }
    case 'code': { const t=curTask(); const val=[...col.querySelectorAll('[data-dig]')].map(i=>i.value).join(''); if(val===t.code) solved(S.hintShown?70:100,'Unlocked'); else wrongAns(col.querySelector('.digits')); break; }
    case 'half': S.sub = (S.sub && S.sub!==v) ? 'both' : v; render(); break;
    case 'knowme': { const t=curTask(), el=$('#ans'); const val=norm(el.value), target=norm(S.vows[t.key]); if(val && target && (val===target||val.includes(target)||target.includes(val))) solved(150,'You know them'); else wrongAns(el); break; }
    case 'photo-skip': S.photos.push({src:null, cap:curStop().name}); award(30,'Noted in your scrapbook'); setTimeout(nextTask,350); break;
    case 'dare-done': award(80,'Dare complete'); setTimeout(nextTask,350); break;
    case 'dare-next': S.dare++; render(); break;
    case 'spend': { const t=curTask(); const n=Math.max(0,Math.round(parseFloat(($('#amt').value||'0').replace(',','.'))||0)); S.spent+=n; const under=n<=t.cap; award(under?50:10, under?`Logged RM ${n}, under the limit`:`Logged RM ${n}, over the limit`); setTimeout(nextTask,400); break; }
    case 'rate': S.rating=+v; render(); break;
    case 'rate-done': award(S.rating*20, `${S.rating} star order`); setTimeout(nextTask,350); break;
    case 'purse-done': { const left=j.purse-S.spent; award(left>=0?150:20, left>=0?'Under budget':'Purse closed'); setTimeout(nextTask,350); break; }
    case 'capsule': S.capsule=[$('#ca').value,$('#cb').value]; award(100,'Letters sealed for a year'); setTimeout(nextTask,400); break;
    case 'check': { const i=+v; S.checks=S.checks.includes(i)?S.checks.filter(x=>x!==i):[...S.checks,i]; render(); break; }
    case 'check-done': solved(100,'Echo caught'); break;
    case 'hum-hit': { const h=S.hum, guesser=h.turn%2?'a':'b'; h[guesser]++; h.turn++; sfx('ok'); render(); break; }
    case 'hum-miss': S.hum.turn++; render(); break;
    case 'hum-done': solved(100,'Echo caught'); break;
    case 'listen': if(!S.playing) playSeq(); break;
    case 'pad': { if(S.playing||!S.seq) return; const i=+v; b.classList.add('lit'); sfx('p'+i); setTimeout(()=>b.classList.remove('lit'),220);
      if(S.seq[S.inp.length]===i){ S.inp.push(i); const m=document.getElementById('simonMsg'); if(m) m.textContent=`${S.inp.length} of ${S.seq.length}`; if(S.inp.length===S.seq.length){ S.seq=null; solved(150,'The last echo answers'); } }
      else { S.inp=[]; sfx('bad'); toast('Wrong note. Listen again.'); const m=document.getElementById('simonMsg'); if(m) m.textContent='Press listen to hear it again'; }
      break; }
    case 'to-board': closeApp(); setTimeout(()=>document.getElementById('season').scrollIntoView({behavior:reduce?'auto':'smooth'}),100); break;
    case 'lo': { const i=+v; loPress(S.lo,i); S.moves++; sfx(S.lo[i]?'p1':'p0'); loDraw(); if(S.lo.every(Boolean)) solved(Math.max(60,180-Math.max(0,S.moves-3)*12),'Every lantern lit',900); break; }
    case 'lo-reset': S.lo=[...S.lo0]; S.moves=0; loDraw(); break;
    case 'beam': { const i=+v; S.beam[i]=rot(S.beam[i]); document.getElementById('beamGrid').innerHTML=beamCells(); if(beamWin(S.beam)) solved(170,'The beam reaches the lantern',1000); break; }
    case 'cs-start': { const A=document.getElementById('gA'); A.innerHTML='<p class="small" style="text-align:center;margin:0">Tap the stars!</p>'; runCatch(curTask()); break; }
    case 'rh-start': { const A=document.getElementById('gA'); A.innerHTML='<button class="btn btn-gold" type="button" id="tapBtn" style="height:90px;font-size:1.2rem">Tap on the beat</button><p class="small" style="text-align:center;margin:0">Or tap the circle, or press space</p>'; runRhythm(curTask()); break; }
    case 'g-retry': render(); break;
    case 'g-accept': award(30,'Moving on'); setTimeout(nextTask,350); break;
    case 'cons': { if(!S.cons) return; const idx=+v, exp=CONS.order[S.cons.i]; const tr=document.getElementById('trace');
      if(idx===exp){ S.cons.i++; tr.setAttribute('points',consPts(CONS.order.slice(0,S.cons.i))); sfx('p'+(S.cons.i%4)); if(S.cons.i===CONS.order.length){ S.cons=null; solved(170,'The star gate opens',1000);} }
      else { S.cons.i=0; tr.setAttribute('points',''); sfx('bad'); S.clean=false; toast('The shape breaks. Start again at the glowing star.'); }
      break; }
    case 'cons-show': S.clean=false; stopGame(); consShow(2600); break;
    case 'mem': { const i=+v; if(S.memLock||S.memGot.includes(i)||S.memUp.includes(i)) return; b.classList.add('up'); S.memUp.push(i);
      if(S.memUp.length===2){ S.moves++; document.getElementById('gM').textContent=S.moves; const [x,y]=S.memUp; const btns=col.querySelectorAll('[data-a="mem"]');
        if(S.mem[x]===S.mem[y]){ S.memGot.push(x,y); btns[x].classList.add('got'); btns[y].classList.add('got'); S.memUp=[]; sfx('ok'); document.getElementById('gP').textContent=S.memGot.length/2; if(S.memGot.length===12) solved(Math.max(60,220-Math.max(0,S.moves-6)*15),'All six charms found',900); }
        else { S.memLock=true; setTimeout(()=>{ btns[x].classList.remove('up'); btns[y].classList.remove('up'); S.memUp=[]; S.memLock=false; },800); } }
      break; }
    case 'menu': { const t=curTask(), i=+v; if(S.menuSel.includes(i)) S.menuSel=S.menuSel.filter(x=>x!==i); else { if(S.menuSel.length>=3){ toast('Three dishes only'); return; } S.menuSel.push(i); }
      b.classList.toggle('on',S.menuSel.includes(i)); const sum=S.menuSel.reduce((a,k)=>a+t.items[k][1],0); document.getElementById('gS').textContent='RM '+sum; document.getElementById('offerBtn').disabled=S.menuSel.length!==3; break; }
    case 'menu-offer': { const t=curTask(); const sum=S.menuSel.reduce((a,k)=>a+t.items[k][1],0); if(sum===t.target) solved(S.wrong?100:160,'The spirit is satisfied',800); else { S.wrong++; S.clean=false; sfx('bad'); toast(`The spirit wants exactly RM ${t.target}. You offered RM ${sum}.`); } break; }
    case 'deck': S.deck=v; store.set('arc-deck',v); renderDecks(); renderArcana(); render(); break;
    case 'onward': onward(); break;
    case 'tile': { if(S.picked.includes(+v)) return; S.picked.push(+v); const word=S.picked.map(i=>S.scr[i]).join('');
      if(S.picked.length===j.word.length){ if(word===j.word){ award(200,'The final lock opens'); S.final=elapsed(); } else { sfx('bad'); toast('That is not the word. Try again.'); setTimeout(()=>{S.picked=[];render();},700); } }
      render(); break; }
    case 'tiles-reset': S.picked=[]; render(); break;
    case 'ending': go('ending'); break;
    case 'scrapbook': go('scrapbook'); break;
    case 'share': { const txt=`We just finished ${j.name} with Arcanum. ${S.cards.length} cards, ${S.points} points, ${S.final||elapsed()} on the clock. Some doors only open for two.`;
      if(navigator.clipboard) navigator.clipboard.writeText(txt).then(()=>toast('Recap copied'),()=>toast('Copy blocked here. Recap: '+txt.slice(0,40)+'…')); else toast('Copy not available here'); break; }
  }
});
}
