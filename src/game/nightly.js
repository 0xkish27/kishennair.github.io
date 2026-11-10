/* Things that change every night: the Omen (a rule that bends tonight's play) and the Nightly Riddle
   (a free riddle on the landing page with a streak, so there is a reason to come back tomorrow). */
import { $, esc, norm, store } from '../lib/util.js';
import { em } from '../data/emblems.js';
import { phase, illum } from '../three/fog.js';

const dayNo = (d = new Date()) => Math.floor((Date.UTC(d.getFullYear(), d.getMonth(), d.getDate())) / 864e5);
const dayKey = (n = dayNo()) => String(n);

/* ---------------- the omen ---------------- */
// mult: points multiplier · hints: hint change · hintCost · resStep: resonance per clean solve
// forgive: first mistake at each stop is forgiven · gameMult: extra for mini games · swift: bonus for a fast night
const OMENS = [
  { id: 'generous', name: 'The Generous Moon', em: 'moon',    line: 'Every point tonight is worth a fifth more.', mult: 1.2 },
  { id: 'miser',    name: 'The Miser\'s Night', em: 'scales', line: 'Hints cost double, but every solve pays 40% more.', mult: 1.4, hintCost: 60 },
  { id: 'whisper',  name: 'The Whispering Night', em: 'ghost', line: 'The Keepers lend you a fourth hint.', hints: 1 },
  { id: 'restless', name: 'The Restless Spirits', em: 'rings', line: 'Resonance rises twice as fast tonight.', resStep: 2 },
  { id: 'thin',     name: 'The Thin Veil', em: 'keyhole',     line: 'Your first mistake at every stop is forgiven.', forgive: true },
  { id: 'ember',    name: 'The Ember Night', em: 'flame',     line: 'Mini games pay half again.', gameMult: 1.5 },
  { id: 'swift',    name: 'The Swift Hour', em: 'clock',      line: 'Finish within 90 minutes for 300 bonus points.', swift: 300 }
];
const FULL = { id: 'full', name: 'The Full Moon', em: 'moon', line: 'The veil is at its thinnest. Every point is worth 30% more, and your first mistake at every stop is forgiven.', mult: 1.3, forgive: true };
const DARK = { id: 'dark', name: 'The Dark Moon', em: 'eye',  line: 'No hints at all tonight, but every solve pays double.', mult: 2, hints: -99 };

export function omenTonight(){
  if (illum > .96) return FULL;
  if (illum < .04) return DARK;
  const n = dayNo(); return OMENS[((n * 7 + 3) % OMENS.length + OMENS.length) % OMENS.length];
}

/* ---------------- the nightly riddle ---------------- */
const RIDDLES = [
  ['The more of me you take, the more you leave behind.', ['footsteps', 'steps', 'footprints'], 'You are making them right now, walking.'],
  ['I can fill a room but take up no space. Every lantern in this city is made to hold me.', ['light'], 'Switch it on.'],
  ['What has many keys but cannot open a single lock?', ['piano', 'keyboard'], 'It makes music.'],
  ['What goes up and down but never moves?', ['stairs', 'staircase', 'steps', 'escalator'], 'You climb it at every LRT station.'],
  ['I speak without a mouth and answer without ears. Shout in an empty lane and I reply.', ['echo', 'anecho'], 'The name of a journey.'],
  ['The more of me there is, the less you see.', ['darkness', 'dark', 'thedark', 'fog', 'mist'], 'It falls every evening.'],
  ['I have cities but no houses, rivers but no water, and roads but no cars.', ['map', 'amap'], 'You open one to find each stop.'],
  ['I run but never walk, I have a mouth but never talk. In this city, two of me meet.', ['river', 'rivers'], 'Where KL was born.'],
  ['It belongs to you, but other people use it far more than you do.', ['name', 'yourname', 'myname'], 'Someone just said it.'],
  ['Two towers, one bridge, 88 floors each. Add up all the floors.', ['176'], 'Eighty-eight, twice.'],
  ['What has a neck but no head, and wears a cap?', ['bottle', 'abottle'], 'You might share one at a stall.'],
  ['What gets bigger the more you take away from it?', ['hole', 'ahole'], 'Dig.'],
  ['What can you keep after giving it to someone?', ['promise', 'apromise', 'word', 'yourword'], 'You make one and you keep one.'],
  ['I shine all night without a flame, and I am only full once a month.', ['moon', 'themoon'], 'Look up.'],
  ['Forward I am heavy. Backward I am not.', ['ton'], 'Three letters.'],
  ['What has one eye but cannot see?', ['needle', 'aneedle', 'storm', 'hurricane'], 'It sews.'],
  ['I am so fragile that saying my name breaks me.', ['silence'], 'Shh.'],
  ['What comes once in a minute, twice in a moment, but never in a thousand years?', ['m', 'theletterm', 'letterm'], 'Spell the words.'],
  ['I have hands that wave you goodbye, yet I never leave the tower.', ['clock', 'aclock', 'clocktower'], 'It keeps the hour over Merdeka.'],
  ['What can you catch but never throw?', ['cold', 'acold', 'breath', 'yourbreath', 'feelings'], 'Bring a jacket.'],
  ['What is always in front of you but can never be seen?', ['future', 'thefuture'], 'Tomorrow lives there.']
];

const blank = () => ({ days: {}, streak: 0, best: 0, last: null, pts: 0, tries: {} });
export function loadNightly(){ try { const o = JSON.parse(store.get('arc-nightly', 'null')); return o && o.days ? o : blank(); } catch (e) { return blank(); } }
const saveNightly = o => store.set('arc-nightly', JSON.stringify(o));
export const nightlyPoints = () => loadNightly().pts || 0;

const riddleTonight = () => RIDDLES[((dayNo() * 5 + 2) % RIDDLES.length + RIDDLES.length) % RIDDLES.length];

function liveStreak(o){
  // a streak survives until a whole night is missed
  if (!o.last) return 0; const gap = dayNo() - Number(o.last);
  return gap <= 1 ? o.streak : 0;
}

function untilMidnight(){
  const d = new Date(), m = new Date(d); m.setHours(24, 0, 0, 0);
  const s = Math.max(0, Math.floor((m - d) / 1000));
  return `${Math.floor(s / 3600)}h ${String(Math.floor(s % 3600 / 60)).padStart(2, '0')}m ${String(s % 60).padStart(2, '0')}s`;
}

let onPoints = () => {};
let tickId = 0;

export function renderTonight(){
  const host = $('#tonight'); if (!host) return;
  const om = omenTonight(), o = loadNightly(), [q, , hint] = riddleTonight();
  const solved = !!o.days[dayKey()], streak = liveStreak(o), tries = o.tries[dayKey()] || 0;
  const moonTxt = illum < .04 ? 'New moon' : illum > .96 ? 'Full moon' : `${Math.round(illum * 100)}% lit, ${phase < .5 ? 'waxing' : 'waning'}`;
  const flames = Array.from({ length: 7 }, (_, i) => `<i class="${i < Math.min(7, solved ? streak : streak) ? 'lit' : ''}" aria-hidden="true">${em('flame', 4)}</i>`).join('');
  host.innerHTML = `
    <article class="omen" data-tilt3d>
      <div class="omen-moon" style="--lit:${illum.toFixed(3)};--wax:${phase < .5 ? 1 : -1}" aria-hidden="true"><i></i></div>
      <p class="sc" style="margin:0">tonight's omen · ${esc(moonTxt.toLowerCase())}</p>
      <h3>${esc(om.name)}</h3>
      <p class="omen-line">${esc(om.line)}</p>
      <p class="small" style="margin:0">Every journey started tonight plays under this omen. It changes at midnight.</p>
      <div class="omen-em" aria-hidden="true">${em(om.em, 1.4)}</div>
    </article>
    <article class="nightly ${solved ? 'done' : ''}" data-tilt3d>
      <p class="sc" style="margin:0">the nightly riddle</p>
      <p class="riddle" style="margin:0">${esc(q)}</p>
      ${solved ? `<p class="nightly-ok">Solved. The Keepers have noted it. <b>+${o.lastGain || 40}</b> season points.</p>`
        : `${tries >= 2 ? `<p class="hintbox" style="margin:0">${esc(hint)}</p>` : ''}
      <form class="nightly-form" id="nightlyForm" autocomplete="off"><label class="lbl" for="nightlyAns">Your answer</label><div class="nightly-row"><input class="inp" id="nightlyAns" placeholder="Speak it…"><button class="btn btn-gold" type="submit">Answer</button></div></form>`}
      <div class="streak"><div class="flames" aria-label="${streak} night streak">${flames}</div><span><b>${streak}</b> ${streak === 1 ? 'night' : 'nights'} in a row${o.best > streak ? ` · best ${o.best}` : ''}</span></div>
      <p class="small" style="margin:0">A new riddle in <b id="nightlyClock">${untilMidnight()}</b>. Each night in a row is worth 10 more points, up to 100.</p>
    </article>`;
  const f = $('#nightlyForm');
  if (f) f.addEventListener('submit', e => { e.preventDefault(); answer($('#nightlyAns')); });
  clearInterval(tickId);
  tickId = setInterval(() => { const c = $('#nightlyClock'); if (c) c.textContent = untilMidnight(); if (dayKey() !== host.dataset.day){ host.dataset.day = dayKey(); renderTonight(); } }, 1000);
  host.dataset.day = dayKey();
}

function answer(input){
  const o = loadNightly(), k = dayKey(), [, answers] = riddleTonight(), v = norm(input.value);
  if (!v) return;
  if (answers.some(a => v === a || (a.length > 3 && v.includes(a)))){
    const streak = liveStreak(o) + 1, gain = Math.min(100, 40 + (streak - 1) * 10);
    o.days[k] = true; o.streak = streak; o.best = Math.max(o.best || 0, streak); o.last = k; o.pts = (o.pts || 0) + gain; o.lastGain = gain;
    saveNightly(o); renderTonight(); onPoints(gain, streak);
  } else {
    o.tries[k] = (o.tries[k] || 0) + 1; saveNightly(o);
    input.classList.remove('bad'); void input.offsetWidth; input.classList.add('bad');
    if (o.tries[k] === 2) renderTonight(); else onPoints(0, 0, true);
  }
}

export function initTonight(cb){ onPoints = cb || onPoints; renderTonight(); }
