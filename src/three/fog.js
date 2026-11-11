/* Tonight's real moon phase, and a pulse that anything can fire when something magical happens
   (a solve, a broken seal). The 3D world listens and flares. */
const SYN = 29.530588853;
export const phase = (((Date.now() / 864e5 - Date.UTC(2000, 0, 6, 18, 14) / 864e5) % SYN) + SYN) % SYN / SYN;
export const illum = (1 - Math.cos(2 * Math.PI * phase)) / 2;

const subs = new Set();
export function onBurst(fn){ subs.add(fn); }
export function fogBurst(strength = 1){ subs.forEach(fn => fn(strength)); }
