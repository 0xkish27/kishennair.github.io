import { store } from '../lib/util.js';

export const S = { deck: store.get('arc-deck','celestial') };
export function fresh(id){
  const d = new Date();
  Object.assign(S, { j:id, step:'brief', stop:0, task:0, names:{a:'Aiman', b:'Sofia'},
    vows:{dreamTrip:'Iceland', firstDate:'Pavilion', lateFood:'Maggi goreng', song:'Yellow'},
    date:0, slot:'7:30 pm', pay:'tng', hints:3, hintShown:false, wrong:0, points:0, spent:0,
    started:null, photos:[], cards:[], letters:[], capsule:null, rating:0, checks:[], hum:{a:0,b:0,turn:0}, picked:[], dare:0, sub:null, rares:[], clean:true, kmMiss:false, legend:false, saved:false, lo:null, beam:null, mem:null, menuSel:[], cons:null });
}

/* the 1-second HUD clock */
let timerId = null;
export function clearTimer(){ clearInterval(timerId); timerId = null; }
export function setTimer(fn, ms){ clearInterval(timerId); timerId = setInterval(fn, ms); }

/* the running mini game registers a cleanup so render() can stop it */
let cleanup = null;
export function setCleanup(fn){ cleanup = fn; }
export function stopGame(){ if(cleanup){ try{cleanup();}catch(e){} cleanup=null; } }
