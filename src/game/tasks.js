/* challenge types that need no canvas: riddle, code, split, knowme, photo, dare, spend, blind, rate, purse, capsule, checklist, hum, simon */
import { esc } from '../lib/util.js';
import { em } from '../data/emblems.js';
import { J } from '../data/journeys.js';
import { S } from './state.js';
import { nameOf } from './views.js';

const hintBlock = t => S.hintShown?`<p class="hintbox" style="margin:0">${esc(t.hint)}</p>`:'';
const hintBtn = t => t.hint && !S.hintShown ? `<button class="btn btn-ghost" type="button" data-a="hint">Use a hint (${S.hints} left · −30)</button>`:'';
const revealBtn = () => S.wrong>=2 ? `<button class="btn btn-ghost" type="button" data-a="reveal">Reveal the answer (no points)</button>`:'';
export const TASKS = {
  riddle:t=>`<h2>A riddle.</h2><p class="riddle" style="margin:0">${esc(t.prompt)}</p>${hintBlock(t)}
    <div class="field"><label class="lbl" for="ans">Your answer</label><input class="inp" id="ans" autocomplete="off" autofocus></div>
    <div class="actions"><button class="btn btn-gold" type="button" data-a="answer">Speak it</button>${hintBtn(t)}${revealBtn()}</div>`,
  code:t=>`<h2>A code lock.</h2>${lockSVG()}<p class="riddle" style="margin:0">${esc(t.prompt)}</p>${hintBlock(t)}
    <div class="digits">${t.code.split('').map((_,i)=>`<input inputmode="numeric" maxlength="1" data-dig="${i}" aria-label="Digit ${i+1}" ${i===0?'autofocus':''}>`).join('')}</div>
    <div class="actions"><button class="btn btn-gold" type="button" data-a="code">Turn the lock</button>${hintBtn(t)}${revealBtn()}</div>`,
  split:t=>{const sh=S.sub||'none'; return `<h2>A split clue.</h2><p class="small" style="margin:0">Each phone only shows half. In the real game, ${nameOf('a')}'s phone shows the left and ${nameOf('b')}'s shows the right. Tap a half to read it.</p>
    <div class="halves"><button type="button" class="half-card ${sh==='a'||sh==='both'?'':'sealed'}" data-a="half" data-v="a" style="text-align:left;background:none;cursor:pointer"><div class="who">${nameOf('a')}'s phone</div><div class="txt">${esc(t.a)}</div></button>
    <button type="button" class="half-card ${sh==='b'||sh==='both'?'':'sealed'}" data-a="half" data-v="b" style="text-align:left;background:none;cursor:pointer"><div class="who">${nameOf('b')}'s phone</div><div class="txt">${esc(t.b)}</div></button></div>${hintBlock(t)}
    ${lockSVG()}<div class="digits">${t.code.split('').map((_,i)=>`<input inputmode="numeric" maxlength="1" data-dig="${i}" aria-label="Digit ${i+1}">`).join('')}</div>
    <div class="actions"><button class="btn btn-gold" type="button" data-a="code">Turn the lock</button>${hintBtn(t)}${revealBtn()}</div>`},
  knowme:t=>`<h2>The know-me lock.</h2><p class="riddle" style="margin:0">${esc(t.prompt)}</p><p class="small" style="margin:0">${t.who==='a'?nameOf('b')+' answers. The lock checks against what '+nameOf('a')+' wrote in the vows.':nameOf('a')+' answers. The lock checks against what '+nameOf('b')+' wrote in the vows.'}</p>
    <div class="field"><label class="lbl" for="ans">Your answer</label><input class="inp" id="ans" autocomplete="off" autofocus></div>
    <div class="actions"><button class="btn btn-gold" type="button" data-a="knowme">Open the lock</button>${S.wrong>=2?`<button class="btn btn-ghost" type="button" data-a="reveal">Show what they wrote</button>`:''}</div>`,
  photo:t=>`<h2>A moment to keep.</h2><p class="riddle" style="margin:0">${esc(t.prompt)}</p>
    <label class="btn btn-gold" for="ph-in" style="cursor:pointer">Take or choose a photo</label><input id="ph-in" type="file" accept="image/*" capture="environment" hidden>
    <div class="actions"><button class="btn btn-ghost" type="button" data-a="photo-skip">We took it on our own phone</button></div>`,
  dare:t=>`<h2>A dare card.</h2><div class="dare">${esc(t.dares[S.dare%t.dares.length])}</div>
    <div class="actions"><button class="btn btn-gold" type="button" data-a="dare-done">Done it</button>${t.dares.length>1?'<button class="btn btn-ghost" type="button" data-a="dare-next">Draw another</button>':''}</div>`,
  spend:t=>`<h2>The purse.</h2><p class="riddle" style="margin:0">${esc(t.prompt)}</p>
    <div class="field"><label class="lbl" for="amt">What did you spend? Enter 0 to skip.</label><div style="display:flex;gap:8px"><span class="inp" style="width:auto;flex:none;color:var(--candle-hi)">RM</span><input class="inp" id="amt" inputmode="decimal" placeholder="0" autofocus></div></div>
    <p class="small" style="margin:0">Limit for this task: RM ${t.cap}. Stay under it for bonus points.</p>
    <div class="actions"><button class="btn btn-gold" type="button" data-a="spend">Log it</button></div>`,
  blind:t=>`<h2>The blind order.</h2><p class="riddle" style="margin:0">${esc(t.prompt)}</p>
    <div class="panel"><span class="lbl">A whisper from the vows</span><p style="margin:8px 0 0">${nameOf('b')}'s late-night food is <em>${esc(S.vows[t.key]||'a mystery')}</em>. Use it, or surprise them.</p></div>
    <div class="field"><label class="lbl" for="amt">What did the order cost?</label><div style="display:flex;gap:8px"><span class="inp" style="width:auto;flex:none;color:var(--candle-hi)">RM</span><input class="inp" id="amt" inputmode="decimal" placeholder="0" autofocus></div></div>
    <div class="actions"><button class="btn btn-gold" type="button" data-a="spend">Served</button></div>`,
  rate:t=>`<h2>The verdict.</h2><p class="riddle" style="margin:0">${esc(t.prompt)}</p>
    <div class="stars-rate">${[1,2,3,4,5].map(n=>`<button type="button" class="${S.rating>=n?'on':''}" data-a="rate" data-v="${n}" aria-label="${n} stars">★</button>`).join('')}</div>
    <div class="actions"><button class="btn btn-gold" type="button" data-a="rate-done" ${S.rating?'':'disabled'}>Give the verdict</button></div>`,
  purse:t=>{const j=J[S.j]; const left=j.purse-S.spent; return `<h2>The spirit counts your purse.</h2>
    <div class="purse"><div class="row"><span>You started with</span><span>RM ${j.purse}</span></div><div class="row"><span>You spent</span><span>RM ${S.spent}</span></div><div class="row"><span>Left in the purse</span><span>RM ${left}</span></div></div>
    <p class="lede">${left>=0?'Under budget. The spirit is impressed and doubles your purse bonus.':'Over budget. The spirit forgives you, but it noticed.'}</p>
    <div class="actions"><button class="btn btn-gold" type="button" data-a="purse-done">Close the purse</button></div>`},
  capsule:t=>`<h2>A sealed letter.</h2><p class="riddle" style="margin:0">${esc(t.prompt)}</p>
    <div class="field"><label class="lbl" for="ca">${nameOf('a')} writes</label><textarea class="inp" id="ca" rows="3" placeholder="Next year, I hope we…"></textarea></div>
    <div class="field"><label class="lbl" for="cb">${nameOf('b')} writes</label><textarea class="inp" id="cb" rows="3" placeholder="Next year, I hope we…"></textarea></div>
    <div class="actions"><button class="btn btn-gold" type="button" data-a="capsule">Seal both letters</button></div>`,
  checklist:t=>`<h2>A sound hunt.</h2><p class="riddle" style="margin:0">${esc(t.prompt)}</p>
    <div class="checks">${t.items.map((it,i)=>`<button type="button" class="${S.checks.includes(i)?'on':''}" data-a="check" data-v="${i}"><span class="bx">${S.checks.includes(i)?'✓':''}</span>${esc(it)}</button>`).join('')}</div>
    <div class="actions"><button class="btn btn-gold" type="button" data-a="check-done" ${S.checks.length>=t.need?'':'disabled'}>${S.checks.length>=t.need?'Catch the echo':`${t.need-S.checks.length} more to go`}</button></div>`,
  hum:t=>{const h=S.hum, cats=['a song from a movie','a song from your school days','the first song you think of',`"${S.vows.song}", or a song like it`]; const turns=4;
    if(h.turn>=turns) return `<h2>The duel is over.</h2><div class="purse"><div class="row"><span>${nameOf('a')}</span><span>${h.a}</span></div><div class="row"><span>${nameOf('b')}</span><span>${h.b}</span></div></div><p class="lede">${h.a===h.b?'A tie. The echo likes you both.':(h.a>h.b?nameOf('a'):nameOf('b'))+' wins the duel.'}</p><div class="actions"><button class="btn btn-gold" type="button" data-a="hum-done">Catch the echo</button></div>`;
    const hummer=h.turn%2?'b':'a', guesser=hummer==='a'?'b':'a';
    return `<h2>The hum duel.</h2><p class="small" style="margin:0">Round ${Math.floor(h.turn/2)+1} of 2 · ${nameOf(hummer)} hums, ${nameOf(guesser)} guesses. No words allowed.</p>
    <div class="dare">Hum ${esc(cats[h.turn])}.</div>
    <div class="actions"><button class="btn btn-gold" type="button" data-a="hum-hit">${nameOf(guesser)} guessed it</button><button class="btn btn-ghost" type="button" data-a="hum-miss">Nobody got it</button></div>`},
  simon:t=>{ if(!S.seq){S.seq=Array.from({length:t.len},()=>Math.floor(Math.random()*4)); S.inp=[];}
    const pads=[['moon','#7d6cf0'],['star','#e6bf78'],['flame','#e0604f'],['waves','#4fc9b5']];
    return `<h2>The echo lock.</h2><p class="riddle" style="margin:0">The last echo plays a pattern of ${t.len} notes. Play it back together, one of you on the left pads and one on the right.</p>
    <div class="pads">${pads.map(([e,c],i)=>`<button type="button" class="pad" data-a="pad" data-v="${i}" style="background:${c};--c:${c}" aria-label="Pad ${e}">${em(e,4)}</button>`).join('')}</div>
    <p class="small" id="simonMsg" style="text-align:center;margin:0">${S.inp.length?`${S.inp.length} of ${t.len}`:'Press listen first'}</p>
    <div class="actions"><button class="btn btn-gold" type="button" data-a="listen">Listen to the echo</button></div>`}
};
export function lockSVG(open){ return `<svg class="lock ${open?'open':''}" id="lock" viewBox="0 0 120 140" aria-hidden="true"><g class="shackle"><path d="M32 66V42a28 28 0 0 1 56 0v24" fill="none" stroke="#C8443F" stroke-width="10"/></g><rect x="14" y="62" width="92" height="72" rx="14" fill="url(#lg)"/><defs><linearGradient id="lg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#F0D8C0"/><stop offset="1" stop-color="#5a1414"/></linearGradient></defs><circle cx="60" cy="92" r="8" fill="#0E0C1C"/><path d="M56 96h8l-2 18h-4z" fill="#0E0C1C"/></svg>`; }
