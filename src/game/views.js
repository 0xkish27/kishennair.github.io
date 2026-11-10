/* every screen of the journey: brief, book, pay, register, seal, prologue, travel, checkin, task, card, final, ending, scrapbook */
import { esc } from '../lib/util.js';
import { em } from '../data/emblems.js';
import { J } from '../data/journeys.js';
import { DECKS, LEG } from '../data/cards.js';
import { S, clearTimer } from './state.js';
import { stopCard, legCard, cardHTML, saveRun } from './collection.js';
import { go, render, mapSVG, gmaps, elapsed } from './shell.js';
import { TASKS } from './tasks.js';
import { GAME_TASKS } from './minigames.js';

export const curStop = () => J[S.j].stops[S.stop];
export const curTask = () => curStop().tasks[S.task];
export const nameOf = w => esc(S.names[w]);
export function days(){ const out=[]; const d=new Date(); for(let i=0;i<6;i++){const x=new Date(d); x.setDate(d.getDate()+i); out.push(i===0?'Tonight':i===1?'Tomorrow':x.toLocaleDateString('en-GB',{weekday:'short',day:'numeric',month:'short'}));} return out; }

export const VIEWS = {
  brief(){ const j=J[S.j]; return `
    <div class="mirror" style="--c:${j.hc};--bf:${j.bf};width:min(230px,68%);margin:8px auto 0;cursor:default"><div class="mist m1"></div><div class="mist m2"></div><div class="em">${em(j.em,1.8)}</div><div class="glass"></div></div>
    <p class="sc" style="margin:0">${esc(j.tag.toLowerCase())}</p>
    <h2>${esc(j.name)}</h2>
    <p class="lede">${esc(j.blurb)}</p>
    <div class="statgrid"><div><span class="lbl">Walk</span><b>${j.walk}</b></div><div><span class="lbl">Time</span><b>${j.time}</b></div><div><span class="lbl">Spend on the night</span><b>${j.spend}</b></div><div><span class="lbl">Stops</span><b>${j.stops.length} sealed</b></div></div>
    <div class="panel"><span class="lbl">Your route</span><div style="margin-top:10px">${mapSVG(false)}</div>
      <ul class="stops" style="margin-top:14px">${j.stops.map((s,i)=>`<li class="${i===0?'known':''}">${i===0?esc(s.place):'Sealed until you get there'}</li>`).join('')}</ul></div>
    <div class="panel"><span class="lbl">Getting there</span><p style="margin:8px 0 0">Start at <b>${esc(j.start)}</b>. Finish near <b>${esc(j.end)}</b>.</p><p class="small" style="margin:8px 0 0">${esc(j.best)}. GOKL city buses are free for Malaysians.</p></div>
    <div class="panel"><span class="lbl">Bring</span><p style="margin:8px 0 0">Both phones, charged. Comfortable shoes. ${j.purse?`RM ${j.purse} for food tasks, tracked in the game.`:'Nothing else. Everything on this route is free.'}</p></div>
    <div class="actions"><button class="btn btn-gold" type="button" data-a="to-book">Begin the journey · RM ${j.ticket}</button></div>`; },

  book(){ const ds=days(); return `
    <p class="sc" style="margin:0">reserve</p><h2>When will the <em>veil open?</em></h2>
    <div class="field"><span class="lbl">Date</span><div class="chips">${ds.map((d,i)=>`<button type="button" class="chip ${S.date===i?'on':''}" data-a="date" data-v="${i}">${d}</button>`).join('')}</div></div>
    <div class="field"><span class="lbl">Start time</span><div class="chips">${['7:00 pm','7:30 pm','8:00 pm','8:30 pm'].map(t=>`<button type="button" class="chip ${S.slot===t?'on':''}" data-a="slot" data-v="${t}">${t}</button>`).join('')}</div></div>
    <div class="row2"><div class="field"><label class="lbl" for="na">You</label><input class="inp" id="na" value="${esc(S.names.a)}"></div><div class="field"><label class="lbl" for="nb">Your person</label><input class="inp" id="nb" value="${esc(S.names.b)}"></div></div>
    <div class="panel hi"><span class="lbl">The vows</span><p class="small" style="margin:6px 0 14px">Answer these privately. Some locks tonight will only open with your person's answers. Examples are filled in.</p>
      <div style="display:grid;gap:12px">
        <div class="field"><label class="lbl" for="v1">You · dream trip, anywhere</label><input class="inp" id="v1" value="${esc(S.vows.dreamTrip)}"></div>
        <div class="field"><label class="lbl" for="v2">Your person · where was your first date?</label><input class="inp" id="v2" value="${esc(S.vows.firstDate)}"></div>
        <div class="field"><label class="lbl" for="v3">Your person · go-to late-night food</label><input class="inp" id="v3" value="${esc(S.vows.lateFood)}"></div>
        <div class="field"><label class="lbl" for="v4">You · a song that reminds you of us</label><input class="inp" id="v4" value="${esc(S.vows.song)}"></div>
      </div></div>
    <div class="actions"><button class="btn btn-gold" type="button" data-a="to-pay">Continue to payment</button></div>`; },

  pay(){ const j=J[S.j]; const m=[['fpx','FPX','Online banking','#E8E1CC'],['duitnow','QR','DuitNow QR','#E86F8A'],['tng','TNG',"Touch 'n Go eWallet",'#4C8FE0'],['card','CARD','Credit or debit card','#C8443F']]; return `
    <p class="sc" style="margin:0">checkout</p><h2>One ticket, <em>two adventurers.</em></h2>
    <div class="panel"><div style="display:flex;justify-content:space-between;gap:12px;align-items:baseline"><div><h3 style="font-size:1.4rem">${esc(j.name)}</h3><p class="small" style="margin:4px 0 0">${esc(S.names.a)} &amp; ${esc(S.names.b)} · ${days()[S.date]}, ${S.slot}</p></div><span class="price">RM ${j.ticket}</span></div></div>
    <div class="field"><span class="lbl">Pay with</span><div style="display:grid;gap:10px">${m.map(([k,ic,n,c])=>`<button type="button" class="method ${S.pay===k?'on':''}" data-a="paym" data-v="${k}"><span class="ic" style="background:${c}">${ic}</span>${n}<span class="rd"></span></button>`).join('')}</div></div>
    <div class="actions"><button class="btn btn-gold" type="button" data-a="do-pay">Pay RM ${j.ticket}</button><p class="small" style="text-align:center;margin:0">Payments would run through a Malaysian gateway such as Billplz or iPay88.</p></div>`; },

  paying(){ setTimeout(()=>S.step==='paying'&&go('paid'),1400); return `<div class="checkin"><div class="radar"><i></i></div><h3>Confirming payment…</h3></div>`; },

  paid(){ return `<div class="checkin"><div class="okmark"><svg viewBox="0 0 100 100" fill="none" stroke="#8FD9B6" stroke-width="4" stroke-linecap="round"><circle cx="50" cy="50" r="44"/><path d="M30 52l13 13 27-29"/></svg></div><h2 style="text-align:center">Payment <em>received.</em></h2><p class="lede" style="text-align:center">Your sealed letter is ready. One more thing: sign the pact so we can keep your cards and photos.</p></div>
    <div class="actions"><button class="btn btn-gold" type="button" data-a="to-register">Sign the pact</button></div>`; },

  register(){ const otp=S.sub==='otp'; return `
    <p class="sc" style="margin:0">the pact</p><h2>One account <em>for two.</em></h2>
    <p class="lede">We keep your cards, photos and level so every journey picks up where the last one ended.</p>
    <button class="btn btn-ghost" type="button" data-a="signed" style="border-color:var(--line)">Continue with Google</button>
    <div class="small" style="text-align:center;letter-spacing:.14em;text-transform:uppercase">or with your phone</div>
    <div class="field"><label class="lbl" for="ph">Mobile number</label><div style="display:flex;gap:8px"><span class="inp" style="width:auto;flex:none;color:var(--candle-hi)">+60</span><input class="inp" id="ph" inputmode="numeric" value="12 345 6789"></div></div>
    ${otp?`<div class="field"><label class="lbl" for="otp">Six-digit code (any six digits work)</label><input class="inp" id="otp" inputmode="numeric" maxlength="6" placeholder="••••••" autofocus style="letter-spacing:.6em;text-align:center;font-size:1.4rem"></div>`:''}
    <div class="actions"><button class="btn btn-gold" type="button" data-a="${otp?'otp':'sendotp'}">${otp?'Sign the pact':'Send my code'}</button></div>
    <p class="small" style="margin:0">Your photos stay private to your account, and you can delete everything at any time under Malaysia's PDPA.</p>`; },

  seal(){ return `
    <p class="sc" style="margin:0;text-align:center">for ${esc(S.names.a.toLowerCase())} &amp; ${esc(S.names.b.toLowerCase())}</p>
    <h2 style="text-align:center">Your letter <em>has arrived.</em></h2>
    <p class="lede" style="text-align:center;margin:0 auto">Break the seal together when you are standing at ${esc(J[S.j].start)}.</p>
    <button class="bigseal" type="button" data-a="break" aria-label="Break the seal"><div class="burst"></div><svg class="half l" viewBox="0 0 200 200"><use href="#waxseal"/></svg><svg class="half r" viewBox="0 0 200 200"><use href="#waxseal"/></svg></button>
    <p style="text-align:center;font-family:var(--f-accent);font-style:italic;color:var(--candle-hi);margin:0">Press the seal</p>`; },

  prologue(){ const j=J[S.j]; return `
    <div class="relic-stage" data-relic></div>
    <div class="letter"><div class="to">To ${esc(S.names.a)} and ${esc(S.names.b)},</div>${j.prologue.map(p=>`<p>${esc(p)}</p>`).join('')}<p class="sign">The Keepers of Arcanum</p></div>
    <div class="panel"><span class="lbl">How to play</span><p class="small" style="margin:8px 0 0">Solve the riddle to find each place, check in together, then break its locks. Each stop gives you a card and a letter. You have three hints, and each one costs points.</p></div>
    <div class="actions"><button class="btn btn-gold" type="button" data-a="begin">Begin the journey</button></div>`; },

  travel(){ const s=curStop(), j=J[S.j], shown=S.sub==='shown'; return `
    <div class="relic-stage" data-relic></div>
    <p class="sc" style="margin:0">find the next place</p>
    <p class="riddle" style="margin:0">${esc(s.find)}</p>
    ${mapSVG(false)}
    ${shown?`<div class="panel hi"><span class="lbl">The place</span><h3 style="margin-top:6px">${esc(s.place)}</h3><p style="margin:10px 0 0"><a class="txt-btn" href="${gmaps(s.q)}" target="_blank" rel="noopener">Open in Google Maps</a></p></div>`:''}
    <div class="actions">
      <button class="btn btn-gold" type="button" data-a="checkin">We are here</button>
      ${shown?'':'<button class="btn btn-ghost" type="button" data-a="showplace">Show us where (no penalty)</button>'}
    </div>`; },

  checkin(){ const ok=S.sub==='ok'; if(!ok) setTimeout(()=>{ if(S.step==='checkin'&&S.sub!=='ok'){S.sub='ok';render();} },1500); const s=curStop(); return ok?`
    <div class="checkin"><div class="okmark"><svg viewBox="0 0 100 100" fill="none" stroke="#8FD9B6" stroke-width="4" stroke-linecap="round"><circle cx="50" cy="50" r="44"/><path d="M30 52l13 13 27-29"/></svg></div>
    <p class="sc" style="margin:0">checked in</p><h2 style="text-align:center">${esc(s.name)}</h2><p class="small" style="margin:0">${esc(s.place)} · ${s.tasks.length} ${s.tasks.length>1?'challenges':'challenge'} unsealed</p></div>
    <div class="actions"><button class="btn btn-gold" type="button" data-a="start-tasks" autofocus>Unseal the challenge</button></div>`
    :`<div class="checkin"><div class="radar"><i></i></div><h3>Reading your location…</h3><p class="small" style="margin:0">Both phones need to be within 60 metres.</p></div>`; },

  task(){ const t=curTask(), s=curStop(); const head=`<div class="relic-stage sm" data-relic></div><p class="sc" style="margin:0">${esc(s.name.toLowerCase())} · challenge ${S.task+1} of ${s.tasks.length}</p>`; return head + (TASKS[t.type]||GAME_TASKS[t.type])(t); },

  card(){ const j=J[S.j], s=curStop(); return `
    <p class="sc" style="margin:0;text-align:center">a card for your deck</p>
    <div class="reveal-card">${stopCard(S.j,S.stop,230,'flip',S.rares.includes(S.stop)?'rare':'')}</div>
    <p class="small" style="text-align:center;margin:0;color:${S.rares.includes(S.stop)?'var(--candle-hi)':'var(--muted)'}">${S.rares.includes(S.stop)?'Rare. You played this stop clean: no hints, no wrong answers.':'Play a stop with no hints and no wrong answers to win its Rare.'}</p>
    <p class="small" style="text-align:center;margin:0">Tap the card to turn it.</p>
    <div class="deckswitch">${DECKS.map(([k,n])=>`<button type="button" class="chip ${S.deck===k?'on':''}" data-a="deck" data-v="${k}">${n}</button>`).join('')}</div>
    <div style="display:flex;gap:16px;align-items:center;justify-content:center"><span class="letter-earned">${s.letter}</span><p style="margin:0;max-width:24ch;color:var(--dim)">You earned a letter. Keep it. The final lock needs every one.</p></div>
    <div class="actions"><button class="btn btn-gold" type="button" data-a="onward">${S.stop<j.stops.length-1?'Onward to the next place':'Face the final lock'}</button></div>`; },

  final(){ const j=J[S.j]; const letters=S.letters.length===j.word.length?S.letters:j.word.split('');
    if(!S.scr){ const a=[...letters]; for(let i=a.length-1;i>0;i--){const k=Math.floor(Math.random()*(i+1));[a[i],a[k]]=[a[k],a[i]];} if(a.join('')===j.word) a.reverse(); S.scr=a; }
    const placed=S.picked.map(i=>S.scr[i]); const done=placed.join('')===j.word;
    return `
    <div class="relic-stage" data-relic></div>
    <p class="sc" style="margin:0">the final lock</p><h2>Speak the <em>word.</em></h2>
    <p class="riddle" style="margin:0">${esc(j.wordRiddle)}</p>
    <div class="tiles" aria-label="Your answer">${j.word.split('').map((_,i)=>`<span class="slot ${done?'ok':''}">${placed[i]||''}</span>`).join('')}</div>
    <div class="tiles">${S.scr.map((l,i)=>`<button type="button" class="tile ${S.picked.includes(i)?'used':''}" data-a="tile" data-v="${i}">${l}</button>`).join('')}</div>
    <div class="actions">${done?'<button class="btn btn-gold" type="button" data-a="ending" autofocus>Open the last door</button>':'<button class="btn btn-ghost" type="button" data-a="tiles-reset">Clear and try again</button>'}</div>`; },

  ending(){ const j=J[S.j]; S.legend=S.rares.length===j.stops.length; return `
    <div class="mirror" style="--c:${j.hc};--bf:${j.bf};width:min(230px,68%);margin:8px auto 0;cursor:default"><div class="mist m1"></div><div class="mist m2"></div><div class="em">${em(j.em,1.8)}</div><div class="glass"></div></div>
    <p class="sc" style="margin:0">the journey is complete</p><h2>${esc(j.word.charAt(0)+j.word.slice(1).toLowerCase())}.</h2>
    <div class="letter"><p>${esc(j.ending)}</p><p class="sign">The Keepers of Arcanum</p></div>
    ${S.legend?`<p class="sc" style="margin:0;text-align:center">every stop played clean · a legendary appears</p><div class="reveal-card">${legCard(S.j,230,'flip')}</div>`:`<p class="small" style="margin:0">${S.rares.length} of ${j.stops.length} stops played clean. Play them all clean to win the Legendary, ${esc(LEG[S.j].card)}.</p>`}
    ${S.capsule?`<div class="panel"><span class="lbl">Sealed for one year</span><p class="small" style="margin:8px 0 0">Two letters, locked until ${new Date(Date.now()+365*864e5).toLocaleDateString('en-GB',{day:'numeric',month:'long',year:'numeric'})}.</p></div>`:''}
    <div class="actions"><button class="btn btn-gold" type="button" data-a="scrapbook">Open your scrapbook</button></div>`; },

  scrapbook(){ const j=J[S.j]; clearTimer(); const run=saveRun(); const lvl=S.points>=900?'Keepers of the Veil':S.points>=600?'Seasoned Wanderers':'New Wanderers'; return `
    <div style="text-align:center"><p class="sc" style="margin:0">the scrapbook of</p><h2 style="margin-top:6px">${esc(S.names.a)} &amp; <em>${esc(S.names.b)}</em></h2><p class="small" style="margin:6px 0 0">${esc(j.name)} · ${days()[S.date]} · Level: ${lvl}</p></div>
    <div class="statgrid"><div><span class="lbl">Time</span><b>${S.final||elapsed()}</b></div><div><span class="lbl">Points</span><b>${S.points}</b></div><div><span class="lbl">Cards</span><b>${S.cards.length} of ${j.stops.length}</b></div><div><span class="lbl">${j.purse?'Spent of RM '+j.purse:'Spent'}</span><b>RM ${S.spent}</b></div></div>
    <div class="panel"><span class="lbl">Your cards · ${DECKS.find(d=>d[0]===S.deck)[1]} deck</span><div class="thumbs" style="margin-top:14px">${S.legend?legCard(S.j,110):''}${S.cards.map(i=>stopCard(S.j,i,110,'',S.rares.includes(i)?'rare':'')).join('')||'<p class="small">No cards yet.</p>'}</div></div>
    <div class="panel hi"><span class="lbl">Season I standing</span><div class="statgrid" style="margin-top:10px"><div><span class="lbl">Season points</span><b>${run.score.toLocaleString('en-US')}</b></div><div><span class="lbl">Rank</span><b>${run.rank?'#'+run.rank:'·'}</b></div></div>
      ${run.newSecrets.length?`<p class="sc" style="margin:14px 0 8px">secret card unlocked</p><div class="thumbs">${run.newSecrets.map(x=>cardHTML(S.deck,'secret card',x,'Secret',110,'','legendary')).join('')}</div>`:''}
      <p class="small" style="margin:12px 0 0">${run.rank&&run.rank<=3?'You are in Key territory. Hold on until the full moon.':`${run.gap>0?run.gap.toLocaleString('en-US')+' points behind the Bronze Key.':''} Play another journey clean to climb.`}</p>
      <div style="margin-top:12px"><button class="txt-btn" type="button" data-a="to-board">See the leaderboard</button></div></div>
    <div class="panel"><span class="lbl">Photos</span><div class="photos" style="margin-top:14px">${(S.photos.length?S.photos:[{cap:'Add photos as you play'}]).map((p,i)=>`<figure style="--r:${[-3,2,-1,3,-2][i%5]}deg">${p.src?`<img src="${p.src}" alt="">`:`<div class="ph"></div>`}<figcaption>${esc(p.cap)}</figcaption></figure>`).join('')}</div></div>
    <div class="actions"><button class="btn btn-gold" type="button" data-a="share">Copy recap for Instagram</button><button class="btn btn-ghost" type="button" data-a="close">Choose another door</button></div>`; }
};
