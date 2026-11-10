/* cards and the season collection, stored on this device */
import { esc, store } from '../lib/util.js';
import { em } from '../data/emblems.js';
import { J } from '../data/journeys.js';
import { LEG, SECRETS, SAMPLE } from '../data/cards.js';
import { S } from './state.js';
import { renderArcana, renderBoard } from '../landing.js';

export function cardHTML(deck, kicker, c, label, w=210, cls='', rar=''){
  return `<button type="button" class="tcard ${cls} ${rar}" data-deck="${deck}" style="--w:${w}px" aria-label="${esc(c.card)} card${rar?', '+rar:''}">
    <span class="in">
      <span class="tface front">${rar?`<span class="rar">${rar}</span><span class="holo"></span>`:''}<span class="kicker">${esc(kicker.toLowerCase())}</span><span class="art">${em(c.em,1.8)}</span><span class="nm">${esc(c.card)}</span><span class="ln">${esc(c.frag)}</span><span class="no">${esc(label)}</span></span>
      <span class="glare"></span><span class="tface back"><svg class="backsig" viewBox="0 0 100 100" style="color:${deck==='celestial'?'#F3DE9C':''}"><use href="#cardback"/></svg></span>
    </span></button>`;
}
export const stopCard=(id,i,w,cls,rar)=>cardHTML(S.deck,J[id].name,J[id].stops[i],`${i+1} of ${J[id].stops.length}`,w,cls,rar);
export const legCard=(id,w,cls='')=>cardHTML(S.deck,J[id].name,LEG[id],'Legendary',w,cls,'legendary');
export const blankColl=()=>({c:[],r:[],l:[],x:[],best:{}});
export function loadColl(){ try{ const o=JSON.parse(localStorage.getItem('arc-coll')); return o&&o.c?o:blankColl(); }catch(e){ return blankColl(); } }
export function saveColl(o){ try{ localStorage.setItem('arc-coll',JSON.stringify(o)); }catch(e){} }
export const scoreOf=o=>Object.values(o.best).reduce((a,b)=>a+b,0)+25*o.c.length+75*o.r.length+300*o.l.length;
export function standings(){
  const o=loadColl(), me=scoreOf(o), names=store.get('arc-names','You two');
  const rows=SAMPLE.map(([n,p,c])=>({n,p,c}));
  if(me>0) rows.push({n:names,p:me,c:o.c.length+o.r.length+o.l.length+o.x.length,you:true});
  rows.sort((a,b)=>b.p-a.p);
  return {rows,me,rank:me>0?rows.findIndex(r=>r.you)+1:0};
}

/* record a finished run, unlock secrets and work out the season rank */
export function saveRun(){
  if(S.savedRun) return S.savedRun;
  const o=loadColl(), j=J[S.j], add=(arr,k)=>{ if(!arr.includes(k)){ arr.push(k); return true;} return false; };
  S.cards.forEach(i=>add(o.c,`${S.j}:${i}`)); S.rares.forEach(i=>add(o.r,`${S.j}:${i}`)); if(S.legend) add(o.l,S.j);
  o.best[S.j]=Math.max(o.best[S.j]||0,S.points);
  store.set('arc-names',`${S.names.a} & ${S.names.b}`);
  const fresh=[];
  const hasKnow=j.stops.some(st=>st.tasks.some(t=>t.type==='knowme'));
  if(S.started && new Date(S.started).getHours()>=21 && add(o.x,'owl')) fresh.push('owl');
  if(S.j==='feast' && S.spent<20 && add(o.x,'thrift')) fresh.push('thrift');
  if(hasKnow && !S.kmMiss && add(o.x,'mind')) fresh.push('mind');
  if(Object.keys(J).every(k=>o.best[k]) && add(o.x,'lovers')) fresh.push('lovers');
  saveColl(o);
  let st=standings();
  if(st.rank && st.rank<=10 && add(o.x,'veil')){ fresh.push('veil'); saveColl(o); st=standings(); }
  const third=st.rows.filter(r=>!r.you)[2].p;
  S.savedRun={score:st.me, rank:st.rank, gap:third-st.me, newSecrets:SECRETS.filter(x=>fresh.includes(x.id))};
  renderArcana(); renderBoard();
  return S.savedRun;
}
