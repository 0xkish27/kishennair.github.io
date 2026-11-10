/* canvas and tile mini games: lightsout, beam, catchstars, constellation, memory, scale, rhythm */
import { esc } from '../lib/util.js';
import { em } from '../data/emblems.js';
import { S, setCleanup, stopGame } from './state.js';
import { col, setResonance } from './shell.js';
import { solved } from './flow.js';
import { sfx } from '../ui/fx.js';

export function gameEnd(ok,msg,pts,okMsg){
  if(ok){ solved(pts,okMsg,900); return; }
  S.clean=false; S.taskDirty=true; setResonance(0);
  const A=document.getElementById('gA'); if(!A) return;
  A.innerHTML=`<p class="small" style="text-align:center;margin:0">${esc(msg)}</p><button class="btn btn-gold" type="button" data-a="g-retry">Try again</button><button class="btn btn-ghost" type="button" data-a="g-accept">Keep going anyway</button>`;
}
function setupCanvas(id,h){ const c=document.getElementById(id); const w=c.getBoundingClientRect().width; const d=Math.min(2,devicePixelRatio||1); c.width=w*d; c.height=h*d; c.style.height=h+'px'; const g=c.getContext('2d'); g.setTransform(d,0,0,d,0,0); return {c,g,w,h}; }
function drawStar(g,x,y,r,rot){ g.save(); g.translate(x,y); g.rotate(rot); const gr=g.createRadialGradient(0,0,0,0,0,r*2.6); gr.addColorStop(0,'rgba(240,216,192,.45)'); gr.addColorStop(1,'rgba(240,216,192,0)'); g.fillStyle=gr; g.fillRect(-r*2.6,-r*2.6,r*5.2,r*5.2); g.fillStyle='#FFF1C9'; g.beginPath(); for(let i=0;i<10;i++){const a=i*Math.PI/5-1.57, rr=i%2?r*.42:r; g.lineTo(Math.cos(a)*rr,Math.sin(a)*rr);} g.closePath(); g.fill(); g.restore(); }

/* lights out */
export const loN=i=>{const r=Math.floor(i/3),c=i%3;return [[r,c],[r-1,c],[r+1,c],[r,c-1],[r,c+1]].filter(([a,b])=>a>=0&&a<3&&b>=0&&b<3).map(([a,b])=>a*3+b)};
export const loPress=(st,i)=>loN(i).forEach(k=>st[k]=!st[k]);
export function loDraw(){ col.querySelectorAll('[data-a="lo"]').forEach((b,i)=>{b.classList.toggle('on',S.lo[i]); b.setAttribute('aria-label',`Lantern ${i+1}, ${S.lo[i]?'lit':'dark'}`);}); const m=document.getElementById('gM'); if(m) m.textContent=S.moves; const l=document.getElementById('gL'); if(l) l.textContent=S.lo.filter(Boolean).length; }

/* beam */
export const BEAM_SOL={4:10,5:9,1:6,2:12,6:5,10:3,11:9,7:6};
export const rot=m=>((m<<1)|(m>>3))&15;
export function beamLit(g){ const lit=new Set(); if(!(g[4]&8)) return lit; const q=[4]; lit.add(4); const D=[[1,0,-1,4],[2,1,0,8],[4,0,1,1],[8,-1,0,2]];
  while(q.length){ const i=q.shift(), x=i%4, y=Math.floor(i/4); for(const [b,dx,dy,opp] of D){ if(!(g[i]&b)) continue; const nx=x+dx, ny=y+dy; if(nx<0||nx>3||ny<0||ny>2) continue; const n=ny*4+nx; if((g[n]&opp)&&!lit.has(n)){ lit.add(n); q.push(n);} } } return lit; }
export const beamWin=g=>{ const l=beamLit(g); return l.has(7)&&(g[7]&2); };
function tileSVG(m,lit){ const c=lit?'#F0D8C0':'#4a4478'; return `<svg viewBox="0 0 60 60"><rect x="1" y="1" width="58" height="58" rx="9" fill="${lit?'#2b1f12':'#0c0b18'}"/>${[[1,'M30 30V0'],[2,'M30 30H60'],[4,'M30 30V60'],[8,'M30 30H0']].filter(([b])=>m&b).map(([,d])=>`<path d="${d}" stroke="${c}" stroke-width="9" stroke-linecap="round"/>`).join('')}<circle cx="30" cy="30" r="7" fill="${c}"/></svg>`; }
export function beamCells(){ const lit=beamLit(S.beam), win=beamWin(S.beam); let h=''; for(let r=0;r<3;r++){ h+=`<span class="end">${r===1?em('star',3):''}</span>`; for(let c=0;c<4;c++){const i=r*4+c; h+=`<button type="button" class="cell" data-a="beam" data-v="${i}" aria-label="Tile ${i+1}" style="${lit.has(i)?'filter:drop-shadow(0 0 8px rgba(240,216,192,.6))':''}">${tileSVG(S.beam[i],lit.has(i))}</button>`;} h+=`<span class="end" style="color:${win?'#F0D8C0':'#4a4478'}">${r===1?em('flame',3):''}</span>`; } return h; }

/* constellation */
export const CONS={pts:[[150,112],[112,72],[68,86],[62,138],[150,232],[238,138],[232,86],[188,72],[40,44],[262,250],[150,30],[44,238],[270,40],[150,170],[100,190]],order:[0,1,2,3,4,5,6,7,0]};
export const consPts=ids=>ids.map(i=>CONS.pts[i].join(',')).join(' ');
export function consShow(ms){ const g=document.getElementById('guide'), m=document.getElementById('gMsg'); if(!g) return; g.style.opacity=1; if(m) m.textContent='Memorise the shape…'; const id=setTimeout(()=>{ g.style.opacity=0; if(m) m.textContent='Now trace it from memory, starting at the glowing star.'; },ms); setCleanup(()=>clearTimeout(id)); }

/* runners */
export function runCatch(t){
  const {c,g,w,h}=setupCanvas('gc',360); let stars=[],caught=0,spark=[],t0=performance.now(),last=t0,spawn=0,raf;
  const tap=e=>{ const r=c.getBoundingClientRect(); const x=e.clientX-r.left,y=e.clientY-r.top; let hit=-1,best=42; stars.forEach((s,i)=>{const d=Math.hypot(s.x-x,s.y-y); if(d<best){best=d;hit=i;}});
    if(hit>=0){ const s=stars.splice(hit,1)[0]; caught++; sfx('p'+(caught%4)); for(let k=0;k<12;k++) spark.push({x:s.x,y:s.y,vx:(Math.random()-.5)*5,vy:(Math.random()-.5)*5,l:1}); const el=document.getElementById('gC'); if(el) el.textContent=caught; } };
  c.addEventListener('pointerdown',tap);
  const end=()=>{ c.removeEventListener('pointerdown',tap); gameEnd(caught>=t.need,`You caught ${caught}. You need ${t.need}.`,Math.min(220,60+caught*10),`${caught} stars caught`); };
  const step=now=>{ const dt=Math.min(.05,(now-last)/1000); last=now; const el=(now-t0)/1000, left=Math.max(0,t.secs-el); const T=document.getElementById('gT'); if(T) T.textContent=Math.ceil(left);
    spawn-=dt; if(spawn<=0&&left>0){ spawn=.4+Math.random()*.32; stars.push({x:22+Math.random()*(w-44),y:-12,v:100+Math.random()*110+el*5,r:10+Math.random()*5,rot:Math.random()*6}); }
    g.clearRect(0,0,w,h); g.fillStyle='rgba(143,227,207,.12)'; g.fillRect(0,h-6,w,6);
    stars=stars.filter(s=>{ s.y+=s.v*dt; s.rot+=dt*2; if(s.y>h) return false; drawStar(g,s.x,s.y,s.r,s.rot); return true; });
    spark=spark.filter(p=>{ p.x+=p.vx; p.y+=p.vy; p.l-=dt*2.2; if(p.l<=0) return false; g.globalAlpha=p.l; g.fillStyle='#F0D8C0'; g.beginPath(); g.arc(p.x,p.y,2.2,0,6.283); g.fill(); g.globalAlpha=1; return true; });
    if(left<=0){ end(); return; } raf=requestAnimationFrame(step); };
  raf=requestAnimationFrame(step);
  setCleanup(()=>{ cancelAnimationFrame(raf); c.removeEventListener('pointerdown',tap); });
}
export function runRhythm(t){
  const {c,g,w,h}=setupCanvas('gc',320); const N=10, gap=820, travel=1500, start=performance.now()+700;
  const rings=Array.from({length:N},(_,k)=>({hit:start+travel+k*gap,done:false,ok:false}));
  let hits=0, fx=null, raf, prev=performance.now(); const cxx=w/2, cyy=h/2, R0=44;
  const judge=()=>{ const now=performance.now(); let best=null; rings.forEach(r=>{ if(!r.done&&(!best||Math.abs(now-r.hit)<Math.abs(now-best.hit))) best=r; });
    if(!best) return; const d=Math.abs(now-best.hit); if(d<170){ best.done=true; best.ok=true; hits++; sfx('ok'); fx={txt:d<80?'Perfect':'Good',t:now,ok:true}; const el=document.getElementById('gC'); if(el) el.textContent=hits; }
    else if(d<400){ best.done=true; sfx('bad'); fx={txt:now<best.hit?'Too early':'Too late',t:now,ok:false}; } };
  const key=e=>{ if(e.code==='Space'){ e.preventDefault(); judge(); } };
  c.addEventListener('pointerdown',judge); addEventListener('keydown',key);
  const tb=document.getElementById('tapBtn'); if(tb) tb.onclick=judge;
  const step=now=>{ g.clearRect(0,0,w,h);
    rings.forEach(r=>{ if(prev<r.hit&&now>=r.hit) sfx('tap'); if(!r.done&&now>r.hit+220){ r.done=true; fx={txt:'Missed',t:now,ok:false}; } });
    prev=now;
    const gl=g.createRadialGradient(cxx,cyy,0,cxx,cyy,R0*2); gl.addColorStop(0,'rgba(100,220,200,.25)'); gl.addColorStop(1,'rgba(100,220,200,0)'); g.fillStyle=gl; g.fillRect(0,0,w,h);
    g.strokeStyle='#8FE3CF'; g.lineWidth=3; g.beginPath(); g.arc(cxx,cyy,R0,0,6.283); g.stroke();
    rings.forEach(r=>{ if(r.done||now<r.hit-travel) return; const rad=R0+(r.hit-now)/travel*150; g.strokeStyle=`rgba(240,216,192,${Math.min(1,.3+(1-(r.hit-now)/travel))})`; g.lineWidth=2.5; g.beginPath(); g.arc(cxx,cyy,Math.max(4,rad),0,6.283); g.stroke(); });
    if(fx&&now-fx.t<600){ g.globalAlpha=1-(now-fx.t)/600; g.fillStyle=fx.ok?'#F0D8C0':'#E58C80'; g.font='italic 26px Newsreader, Georgia, serif'; g.textAlign='center'; g.fillText(fx.txt,cxx,cyy+R0+44); g.globalAlpha=1; }
    if(now>rings[N-1].hit+400){ stopGame(); gameEnd(hits>=t.need,`You caught ${hits} of ${N} beats. You need ${t.need}.`,60+hits*14,`${hits} beats caught`); return; }
    raf=requestAnimationFrame(step); };
  raf=requestAnimationFrame(step);
  setCleanup(()=>{ cancelAnimationFrame(raf); c.removeEventListener('pointerdown',judge); removeEventListener('keydown',key); });
}

export const GAMEINIT={
  catchstars(){ const {g,w,h}=setupCanvas('gc',360); [[.2,.3],[.5,.5],[.8,.25],[.35,.75],[.7,.7]].forEach(([x,y],i)=>drawStar(g,x*w,y*h,10+i,i)); g.fillStyle='#ADA8C8'; g.font='italic 20px Newsreader, Georgia, serif'; g.textAlign='center'; g.fillText('Press start, then tap the stars',w/2,h-24); },
  rhythm(){ const {g,w,h}=setupCanvas('gc',320); g.strokeStyle='#8FE3CF'; g.lineWidth=3; g.beginPath(); g.arc(w/2,h/2,44,0,6.283); g.stroke(); g.strokeStyle='rgba(240,216,192,.5)'; g.lineWidth=2; g.beginPath(); g.arc(w/2,h/2,110,0,6.283); g.stroke(); g.fillStyle='#ADA8C8'; g.font='italic 20px Newsreader, Georgia, serif'; g.textAlign='center'; g.fillText('Press start',w/2,h-20); },
  constellation(){ consShow(3600); }
};
export const GAME_TASKS = {
  lightsout:t=>{ if(!S.lo){ const st=Array(9).fill(true), picks=[]; while(picks.length<3){const k=Math.floor(Math.random()*9); if(!picks.includes(k)) picks.push(k);} picks.forEach(k=>loPress(st,k)); if(st.every(Boolean)) loPress(st,4); S.lo=st; S.lo0=[...st]; S.moves=0; }
    return `<h2>Light the lanterns.</h2><p class="riddle" style="margin:0">${esc(t.prompt)}</p>
    <div class="lo">${S.lo.map((on,i)=>`<button type="button" class="${on?'on':''}" data-a="lo" data-v="${i}" aria-label="Lantern ${i+1}, ${on?'lit':'dark'}">${em('flame',4)}</button>`).join('')}</div>
    <div class="gamebar"><span>Moves <b id="gM">${S.moves}</b></span><span>Lit <b id="gL">${S.lo.filter(Boolean).length}</b> of 9</span></div>
    <div class="actions"><button class="btn btn-ghost" type="button" data-a="lo-reset">Start over</button></div>`; },
  beam:t=>{ if(!S.beam){ const g=[]; for(let i=0;i<12;i++){ let m=BEAM_SOL[i]??(Math.random()<.5?5:3); const n=BEAM_SOL[i]?1+Math.floor(Math.random()*3):Math.floor(Math.random()*4); for(let k=0;k<n;k++) m=rot(m); g.push(m);} if(beamWin(g)) g[4]=rot(g[4]); S.beam=g; }
    return `<h2>Carry the light.</h2><p class="riddle" style="margin:0">${esc(t.prompt)}</p><p class="small" style="margin:0">Tap a tile to turn it. The glow shows how far the beam reaches.</p>
    <div class="beam" id="beamGrid">${beamCells()}</div>`; },
  catchstars:t=>`<h2>Catch the falling stars.</h2><p class="riddle" style="margin:0">${esc(t.prompt)}</p>
    <div class="gamebar"><span>Caught <b id="gC">0</b> of ${t.need}</span><span>Time <b id="gT">${t.secs}</b>s</span></div>
    <div class="gamebox"><canvas id="gc"></canvas></div>
    <div class="actions" id="gA"><button class="btn btn-gold" type="button" data-a="cs-start">Start</button></div>`,
  constellation:t=>{ S.cons=S.cons||{i:0}; return `<h2>Trace the gate.</h2><p class="riddle" style="margin:0">${esc(t.prompt)}</p>
    <div class="gamebox"><svg class="cons" viewBox="0 0 300 280" role="img" aria-label="Star field">
      <polyline id="guide" points="${consPts(CONS.order)}" fill="none" stroke="#C8443F" stroke-width="2" stroke-dasharray="4 6" style="transition:opacity .8s;opacity:1"/>
      <polyline id="trace" points="" fill="none" stroke="#F0D8C0" stroke-width="2.5" stroke-linejoin="round" style="filter:drop-shadow(0 0 6px #F0D8C0)"/>
      <circle cx="${CONS.pts[0][0]}" cy="${CONS.pts[0][1]}" r="10" fill="none" stroke="#F0D8C0"><animate attributeName="r" values="6;18" dur="1.4s" repeatCount="indefinite"/><animate attributeName="stroke-opacity" values="1;0" dur="1.4s" repeatCount="indefinite"/></circle>
      ${CONS.pts.map(([x,y],i)=>`<g class="st" data-a="cons" data-v="${i}"><circle cx="${x}" cy="${y}" r="16" fill="transparent"/><circle cx="${x}" cy="${y}" r="${i===0?6:4.5}" fill="${i===0?'#F0D8C0':'#ECEAF5'}"/></g>`).join('')}
    </svg></div>
    <p class="small" id="gMsg" style="text-align:center;margin:0">Memorise the shape…</p>
    <div class="actions"><button class="btn btn-ghost" type="button" data-a="cons-show">Show the shape again</button></div>`; },
  memory:t=>{ if(!S.mem){ const k=['bowl','skewer','snow','flame','moon','star']; const a=[...k,...k]; for(let i=a.length-1;i>0;i--){const r=Math.floor(Math.random()*(i+1));[a[i],a[r]]=[a[r],a[i]];} S.mem=a; S.memUp=[]; S.memGot=[]; S.moves=0; S.memLock=false; }
    return `<h2>Find the cold charms.</h2><p class="riddle" style="margin:0">${esc(t.prompt)}</p>
    <div class="mem">${S.mem.map((k,i)=>`<button type="button" class="${S.memGot.includes(i)?'got':''}" data-a="mem" data-v="${i}" aria-label="Plate ${i+1}">${em(k,4)}</button>`).join('')}</div>
    <div class="gamebar"><span>Turns <b id="gM">${S.moves}</b></span><span>Pairs <b id="gP">${S.memGot.length/2}</b> of 6</span></div>`; },
  scale:t=>{ const sum=S.menuSel.reduce((a,i)=>a+t.items[i][1],0); return `<h2>The spirit's scale.</h2><p class="riddle" style="margin:0">${esc(t.prompt)}</p>
    <div class="menu">${t.items.map(([n,p],i)=>`<button type="button" class="${S.menuSel.includes(i)?'on':''}" data-a="menu" data-v="${i}"><span>${esc(n)}</span><b>RM ${p}</b></button>`).join('')}</div>
    <div class="tally"><span>Your offering</span><span id="gS">RM ${sum}</span></div>
    <div class="actions"><button class="btn btn-gold" type="button" data-a="menu-offer" id="offerBtn" ${S.menuSel.length===3?'':'disabled'}>Offer three dishes</button></div>`; },
  rhythm:t=>`<h2>Catch the beat.</h2><p class="riddle" style="margin:0">${esc(t.prompt)}</p>
    <div class="gamebar"><span>Caught <b id="gC">0</b> of 10</span><span>Need <b>${t.need}</b></span></div>
    <div class="gamebox"><canvas id="gc"></canvas></div>
    <div class="actions" id="gA"><button class="btn btn-gold" type="button" data-a="rh-start">Start</button></div>`
};

/* ---------------- the wandering light: tilt the phone (or drag) to guide a light through the lanes ---------------- */
// walls are [x, y, w, h] in 0..1 of the board; a = start, b = goal, m = motes worth bonus points
export const TILT_LAYOUTS = {
  field: { h: 400, a: [.1, .88], b: [.88, .1], m: [[.5, .86], [.5, .6], [.5, .35]],
    walls: [[0, .7, .7, .06], [.3, .45, .7, .06], [0, .2, .7, .06]] },
  lanes: { h: 400, a: [.1, .1], b: [.9, .88], m: [[.38, .82], [.62, .16], [.9, .3]],
    walls: [[.24, 0, .06, .66], [.5, .34, .06, .66], [.76, 0, .06, .66]] }
};
const TILT_COL = { lantern: '#FFB65C', echo: '#7FD6C8', starfall: '#9FB0FF', feast: '#FF7A86' };

function tiltBoard(g, w, h, L, col, motes, glowT){
  g.clearRect(0, 0, w, h);
  // faint street grid under the lanes
  g.strokeStyle = 'rgba(237,228,218,.05)'; g.lineWidth = 1;
  for (let x = 0; x < w; x += 24){ g.beginPath(); g.moveTo(x, 0); g.lineTo(x, h); g.stroke(); }
  for (let y = 0; y < h; y += 24){ g.beginPath(); g.moveTo(0, y); g.lineTo(w, y); g.stroke(); }
  L.walls.forEach(([x, y, ww, hh]) => {
    const X = x * w, Y = y * h, W = ww * w, H = hh * h;
    const gr = g.createLinearGradient(X, Y, X, Y + H); gr.addColorStop(0, '#3a1a1c'); gr.addColorStop(1, '#170a0c');
    g.fillStyle = gr; g.fillRect(X, Y, W, H);
    g.strokeStyle = 'rgba(214,185,138,.55)'; g.lineWidth = 1.2; g.strokeRect(X + .5, Y + .5, W - 1, H - 1);
  });
  // the goal: a lantern-shaped glow that breathes
  const [bx, by] = [L.b[0] * w, L.b[1] * h], pulse = 1 + .15 * Math.sin(glowT * 3);
  const gg = g.createRadialGradient(bx, by, 0, bx, by, 42 * pulse); gg.addColorStop(0, col + 'cc'); gg.addColorStop(1, col + '00');
  g.fillStyle = gg; g.fillRect(bx - 50, by - 50, 100, 100);
  g.strokeStyle = col; g.lineWidth = 1.5; g.beginPath(); g.arc(bx, by, 16, 0, 6.283); g.stroke();
  motes.forEach(m => { if (m.got) return; const x = m.x * w, y = m.y * h; drawStar(g, x, y, 6 + Math.sin(glowT * 4 + x) * 1.2, glowT); });
}

export function runTilt(t, journey, haptic, tiltNow){
  const L = TILT_LAYOUTS[t.layout] || TILT_LAYOUTS.field, col = TILT_COL[journey] || '#F0D8C0';
  const { c, g, w, h } = setupCanvas('gc', L.h);
  const motes = L.m.map(([x, y]) => ({ x, y, got: false }));
  const R = 10, orb = { x: L.a[0] * w, y: L.a[1] * h, vx: 0, vy: 0 }, trail = [];
  let touches = 0, lastHit = 0, got = 0, raf, last = performance.now(), drag = null, keys = { x: 0, y: 0 }, done = false;
  const rects = L.walls.map(([x, y, ww, hh]) => [x * w, y * h, ww * w, hh * h]);
  const pd = e => { const r = c.getBoundingClientRect(); drag = { x: e.clientX - r.left, y: e.clientY - r.top }; c.setPointerCapture(e.pointerId); };
  const pm = e => { if (!drag) return; const r = c.getBoundingClientRect(); drag.x = e.clientX - r.left; drag.y = e.clientY - r.top; };
  const pu = () => { drag = null; };
  const kd = e => { const k = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] }[e.key]; if (k){ e.preventDefault(); keys = { x: k[0], y: k[1] }; } };
  const ku = e => { if (e.key.startsWith('Arrow')) keys = { x: 0, y: 0 }; };
  c.addEventListener('pointerdown', pd); c.addEventListener('pointermove', pm); c.addEventListener('pointerup', pu); c.addEventListener('pointercancel', pu);
  addEventListener('keydown', kd); addEventListener('keyup', ku);
  const setInfo = () => { const a = document.getElementById('gC'); if (a) a.textContent = got; const b = document.getElementById('gT'); if (b) b.textContent = touches; };
  const step = now => {
    const dt = Math.min(.033, (now - last) / 1000); last = now; const tt = now / 1000;
    let ax = 0, ay = 0; const tl = tiltNow();
    if (drag){ ax = (drag.x - orb.x) * 9; ay = (drag.y - orb.y) * 9; }
    else if (tl.source === 'gyro'){ ax = tl.x * 1300; ay = tl.y * 1300; }
    if (keys.x || keys.y){ ax = keys.x * 900; ay = keys.y * 900; }
    orb.vx = (orb.vx + ax * dt) * Math.exp(-dt * 1.6); orb.vy = (orb.vy + ay * dt) * Math.exp(-dt * 1.6);
    const sp = Math.hypot(orb.vx, orb.vy); if (sp > 380){ orb.vx *= 380 / sp; orb.vy *= 380 / sp; }
    orb.x += orb.vx * dt; orb.y += orb.vy * dt;
    // the board's edges
    if (orb.x < R){ orb.x = R; orb.vx *= -.4; } if (orb.x > w - R){ orb.x = w - R; orb.vx *= -.4; }
    if (orb.y < R){ orb.y = R; orb.vy *= -.4; } if (orb.y > h - R){ orb.y = h - R; orb.vy *= -.4; }
    // walls: push the light out along the shortest axis and count the touch
    rects.forEach(([X, Y, W, H]) => {
      const nx = Math.max(X, Math.min(orb.x, X + W)), ny = Math.max(Y, Math.min(orb.y, Y + H));
      const dx = orb.x - nx, dy = orb.y - ny, d = Math.hypot(dx, dy);
      if (d < R){
        if (d > 0){ orb.x = nx + dx / d * R; orb.y = ny + dy / d * R; if (Math.abs(dx) > Math.abs(dy)) orb.vx *= -.4; else orb.vy *= -.4; }
        else { orb.y = Y - R; orb.vy = -Math.abs(orb.vy) * .4; }
        if (now - lastHit > 450 && Math.hypot(orb.vx, orb.vy) > 40){ lastHit = now; touches++; sfx('bad'); haptic('tick'); setInfo(); }
      }
    });
    motes.forEach(m => { if (!m.got && Math.hypot(m.x * w - orb.x, m.y * h - orb.y) < R + 10){ m.got = true; got++; sfx('p' + (got % 4)); haptic('tap'); setInfo(); } });
    tiltBoard(g, w, h, L, col, motes, tt);
    trail.push([orb.x, orb.y]); if (trail.length > 14) trail.shift();
    trail.forEach(([x, y], i) => { g.globalAlpha = i / trail.length * .35; g.fillStyle = col; g.beginPath(); g.arc(x, y, R * (i / trail.length), 0, 6.283); g.fill(); });
    g.globalAlpha = 1;
    const og = g.createRadialGradient(orb.x, orb.y, 0, orb.x, orb.y, R * 3.2); og.addColorStop(0, 'rgba(255,248,230,1)'); og.addColorStop(.3, col + 'aa'); og.addColorStop(1, col + '00');
    g.fillStyle = og; g.beginPath(); g.arc(orb.x, orb.y, R * 3.2, 0, 6.283); g.fill();
    if (!done && Math.hypot(L.b[0] * w - orb.x, L.b[1] * h - orb.y) < 18){
      done = true; stopGame(); haptic('win');
      const pts = Math.max(60, 170 - touches * 12 + got * 25);
      if (touches > 3){ S.clean = false; S.taskDirty = true; }
      gameEnd(true, '', pts, touches <= 3 ? `The light arrives · ${got} of 3 motes` : `The light arrives, a little bruised`);
      return;
    }
    raf = requestAnimationFrame(step);
  };
  raf = requestAnimationFrame(step);
  setCleanup(() => { cancelAnimationFrame(raf); c.removeEventListener('pointerdown', pd); c.removeEventListener('pointermove', pm); c.removeEventListener('pointerup', pu); c.removeEventListener('pointercancel', pu); removeEventListener('keydown', kd); removeEventListener('keyup', ku); });
}

GAMEINIT.tilt = t => {
  const L = TILT_LAYOUTS[t.layout] || TILT_LAYOUTS.field, { g, w, h } = setupCanvas('gc', L.h);
  tiltBoard(g, w, h, L, TILT_COL[S.j] || '#F0D8C0', L.m.map(([x, y]) => ({ x, y })), 0);
  drawStar(g, L.a[0] * w, L.a[1] * h, 9, 0);
};
GAME_TASKS.tilt = t => `<h2>The wandering light.</h2><p class="riddle" style="margin:0">${esc(t.prompt)}</p>
    <p class="small" style="margin:0">Hold your phone flat, then tilt it to roll the light. On a computer, press and drag, or use the arrow keys. Gather the three motes on the way for bonus points.</p>
    <div class="gamebar"><span>Motes <b id="gC">0</b> of 3</span><span>Wall touches <b id="gT">0</b></span></div>
    <div class="gamebox"><canvas id="gc" style="touch-action:none"></canvas></div>
    <div class="actions" id="gA"><button class="btn btn-gold" type="button" data-a="tilt-start">Release the light</button></div>`;
