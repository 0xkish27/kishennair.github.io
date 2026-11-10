/* One tilt signal for the whole site: the phone's gyroscope when there is one, the pointer otherwise.
   Subscribers get x and y in -1..1 (x: right is positive, y: down is positive). Also haptics. */
import { reduce } from '../lib/util.js';

const subs = new Set();
const tilt = { x: 0, y: 0, source: 'pointer' };
let base = null;           // the phone's resting angle when tilt started, so "level" is however they hold it
let asked = false;

export function onTilt(fn){ subs.add(fn); return () => subs.delete(fn); }
export const getTilt = () => tilt;
export const hasGyro = () => tilt.source === 'gyro';

function emit(x, y, source){
  tilt.x = Math.max(-1, Math.min(1, x)); tilt.y = Math.max(-1, Math.min(1, y)); tilt.source = source;
  subs.forEach(fn => fn(tilt.x, tilt.y, source));
}

function onOrient(e){
  if (e.beta == null || e.gamma == null) return;
  if (!base) base = { b: e.beta, g: e.gamma };
  // landscape phones swap the axes
  const ang = (screen.orientation && screen.orientation.angle) || window.orientation || 0;
  let gx = (e.gamma - base.g) / 28, gy = (e.beta - base.b) / 28;
  if (ang === 90) [gx, gy] = [gy, -gx]; else if (ang === -90 || ang === 270) [gx, gy] = [-gy, gx];
  emit(gx, gy, 'gyro');
}

/* iOS only grants motion after a tap, so call this from a click handler */
export function requestMotion(){
  if (asked || reduce || !('DeviceOrientationEvent' in window)) return;
  asked = true;
  const go = () => addEventListener('deviceorientation', onOrient, { passive: true });
  const D = window.DeviceOrientationEvent;
  if (typeof D.requestPermission === 'function') D.requestPermission().then(s => { if (s === 'granted') go(); }).catch(() => {});
  else go();
}

/* re-level the phone, for games that start from "hold it flat" */
export function recalibrate(){ base = null; }

export function initMotion(){
  addEventListener('pointermove', e => {
    if (tilt.source === 'gyro' || e.pointerType === 'touch') return;
    emit(e.clientX / innerWidth * 2 - 1, e.clientY / innerHeight * 2 - 1, 'pointer');
  }, { passive: true });
  // the first tap anywhere asks for motion, so tilt works without a separate prompt
  addEventListener('pointerdown', requestMotion, { once: true, passive: true });
}

const PATTERNS = { tap: 6, ok: [14, 40, 22], bad: [40, 50, 40], crack: [10, 20, 10, 20, 60], tick: 4, win: [20, 60, 20, 60, 80] };
export function haptic(kind){
  if (reduce || !navigator.vibrate) return;
  try { navigator.vibrate(PATTERNS[kind] ?? kind); } catch (e) { /* not allowed here */ }
}
