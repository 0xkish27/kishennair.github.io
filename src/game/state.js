import { store } from '../lib/util.js';
import { omenTonight } from './nightly.js';

export const S = { deck: store.get('arc-deck','celestial') };
export function fresh(id){
  const omen = omenTonight();
  Object.assign(S, { j:id, step:'brief', stop:0, task:0, names:{a:'Aiman', b:'Sofia'},
    vows:{dreamTrip:'Iceland', firstDate:'Pavilion', lateFood:'Maggi goreng', song:'Yellow'},
    date:0, slot:'7:30 pm', pay:'tng', hints:Math.max(0,3+(omen.hints||0)), hintShown:false, wrong:0, points:0, spent:0,
    started:null, photos:[], cards:[], letters:[], capsule:null, rating:0, checks:[], hum:{a:0,b:0,turn:0}, picked:[], dare:0, sub:null, rares:[], clean:true, kmMiss:false, legend:false, saved:false, lo:null, beam:null, mem:null, menuSel:[], cons:null,
    savedRun:null, final:null, scr:null, seq:null, inp:[], playing:false,
    omen, res:0, peakRes:0, taskDirty:false, boon:null, boonOrder:null, forgiveUsed:false, stopForgiven:false });
}

/* the 1-second HUD clock */
let timerId = null;
export function clearTimer(){ clearInterval(timerId); timerId = null; }
export function setTimer(fn, ms){ clearInterval(timerId); timerId = setInterval(fn, ms); }

/* the running mini game registers a cleanup so render() can stop it */
let cleanup = null;
export function setCleanup(fn){ cleanup = fn; }
export function stopGame(){ if(cleanup){ try{cleanup();}catch(e){} cleanup=null; } }

/* resonance: clean solves in a row raise a multiplier that one mistake breaks */
export const RES_MULT = [1, 1.2, 1.5, 1.8, 2.2];
export const resMult = () => RES_MULT[S.res || 0];
export const MINI_GAMES = ['lightsout','beam','catchstars','constellation','memory','scale','rhythm','tilt'];
