/* A generative night soundscape: a low drone, city wind and distant bells, tuned to each journey.
   Nothing is recorded; everything is synthesised, so it never loops the same way twice.
   Browsers only allow sound after a tap, so start() must be called from a click. */
import { store, reduce } from '../lib/util.js';

// root note and a dark five-note scale for the bells, per journey
const KEYS = {
  landing:  { root: 98.0,   scale: [0, 3, 5, 7, 10] },
  lantern:  { root: 110.0,  scale: [0, 3, 5, 7, 10] },
  starfall: { root: 146.83, scale: [0, 2, 3, 7, 9] },
  feast:    { root: 130.81, scale: [0, 3, 5, 6, 10] },
  echo:     { root: 82.41,  scale: [0, 2, 5, 7, 9] }
};

let ctx = null, master, filt, lfo, oscs = [], windGain, wet, bellTimer = 0, key = KEYS.landing;
let on = store.get('arc-sound', '1') === '1', running = false, res = 0;
const listeners = new Set();

export const soundOn = () => on;
export function onSoundChange(fn){ listeners.add(fn); }
export function getAudio(){ return ctx; }

function build(){
  const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return false;
  ctx = new AC();
  master = ctx.createGain(); master.gain.value = 0;
  const comp = ctx.createDynamicsCompressor(); master.connect(comp); comp.connect(ctx.destination);

  // reverb from a decaying noise impulse
  const len = ctx.sampleRate * 3.2, ir = ctx.createBuffer(2, len, ctx.sampleRate);
  for (let c = 0; c < 2; c++){ const d = ir.getChannelData(c); for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2.6); }
  const verb = ctx.createConvolver(); verb.buffer = ir; wet = ctx.createGain(); wet.gain.value = .55; wet.connect(verb); verb.connect(master);

  // drone: root, fifth and a sub, through a slowly breathing low-pass
  filt = ctx.createBiquadFilter(); filt.type = 'lowpass'; filt.frequency.value = 340; filt.Q.value = 4;
  const dg = ctx.createGain(); dg.gain.value = .07; filt.connect(dg); dg.connect(master); dg.connect(wet);
  lfo = ctx.createOscillator(); lfo.frequency.value = .05; const lg = ctx.createGain(); lg.gain.value = 140; lfo.connect(lg); lg.connect(filt.frequency); lfo.start();
  oscs = [[1, 'sawtooth', -6], [1.5, 'triangle', 5], [.5, 'sine', 0], [2, 'triangle', 9]].map(([m, type, det]) => {
    const o = ctx.createOscillator(); o.type = type; o.detune.value = det; o.userData = m;
    const g = ctx.createGain(); g.gain.value = m === .5 ? .9 : m === 2 ? .12 : .4; o.connect(g); g.connect(filt); o.start(); return o;
  });

  // city wind: filtered noise that rises and falls
  const nb = ctx.createBuffer(1, ctx.sampleRate * 4, ctx.sampleRate), nd = nb.getChannelData(0);
  for (let i = 0; i < nd.length; i++) nd[i] = Math.random() * 2 - 1;
  const noise = ctx.createBufferSource(); noise.buffer = nb; noise.loop = true;
  const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 520; bp.Q.value = .8;
  const wl = ctx.createOscillator(); wl.frequency.value = .07; const wlg = ctx.createGain(); wlg.gain.value = 260; wl.connect(wlg); wlg.connect(bp.frequency); wl.start();
  windGain = ctx.createGain(); windGain.gain.value = .022; noise.connect(bp); bp.connect(windGain); windGain.connect(master); noise.start();
  tune(key, 0);
  return true;
}

function tune(k, glide = 2.5){
  if (!ctx) return; const t = ctx.currentTime;
  oscs.forEach(o => o.frequency.setTargetAtTime(k.root * o.userData, t, glide / 3));
}

function bell(freq, vol = .08, pan = Math.random() * 1.6 - .8, decay = 4){
  if (!ctx) return; const t = ctx.currentTime;
  const p = ctx.createStereoPanner ? ctx.createStereoPanner() : null;
  const out = ctx.createGain(); out.gain.setValueAtTime(0, t); out.gain.linearRampToValueAtTime(vol, t + .01); out.gain.exponentialRampToValueAtTime(.0001, t + decay);
  [[1, 1], [2.76, .35], [5.4, .12]].forEach(([m, a]) => { const o = ctx.createOscillator(); o.type = 'sine'; o.frequency.value = freq * m; const g = ctx.createGain(); g.gain.value = a; o.connect(g); g.connect(out); o.start(t); o.stop(t + decay); });
  if (p){ p.pan.value = pan; out.connect(p); p.connect(wet); p.connect(master); } else { out.connect(wet); out.connect(master); }
}
const noteOf = (k, deg, oct) => k.root * Math.pow(2, oct + k.scale[deg % k.scale.length] / 12);

function scheduleBells(){
  clearTimeout(bellTimer);
  if (!running) return;
  bellTimer = setTimeout(() => {
    const n = 1 + (Math.random() < .35);
    for (let i = 0; i < n; i++) setTimeout(() => bell(noteOf(key, Math.floor(Math.random() * 5), 2 + (Math.random() < .3)), .035 + res * .01), i * 420);
    scheduleBells();
  }, 5000 + Math.random() * 7000 - res * 600);
}

export function startAmbience(journey){
  if (journey) key = KEYS[journey] || KEYS.landing;
  if (!on || reduce) return;
  if (!ctx && !build()) return;
  if (ctx.state === 'suspended') ctx.resume();
  tune(key);
  if (!running){ running = true; master.gain.cancelScheduledValues(ctx.currentTime); master.gain.setTargetAtTime(.9, ctx.currentTime, 1.2); scheduleBells(); }
}

export function setAmbienceKey(journey){ key = KEYS[journey] || KEYS.landing; tune(key); }

export function stopAmbience(){
  running = false; clearTimeout(bellTimer);
  if (ctx) master.gain.setTargetAtTime(0, ctx.currentTime, .4);
}

export function toggleSound(){
  on = !on; store.set('arc-sound', on ? '1' : '0');
  if (on) startAmbience(); else stopAmbience();
  listeners.forEach(fn => fn(on));
  return on;
}

/* a rising chord when something is solved; brighter with resonance */
export function swell(level = res){
  if (!ctx || !running) return;
  const t = ctx.currentTime;
  filt.frequency.cancelScheduledValues(t); filt.frequency.setTargetAtTime(900 + level * 300, t, .08); filt.frequency.setTargetAtTime(340 + res * 120, t + .6, 1.2);
  [0, 2, 4].forEach((d, i) => setTimeout(() => bell(noteOf(key, d + level, 3), .06, (i - 1) * .5, 3.2), i * 110));
}

/* a low thud of dread for wrong answers */
export function dread(){
  if (!ctx || !running) return; const t = ctx.currentTime;
  const o = ctx.createOscillator(), g = ctx.createGain(); o.type = 'sine'; o.frequency.setValueAtTime(key.root / 2, t); o.frequency.exponentialRampToValueAtTime(key.root / 4, t + .8);
  g.gain.setValueAtTime(.25, t); g.gain.exponentialRampToValueAtTime(.0001, t + 1); o.connect(g); g.connect(master); o.start(t); o.stop(t + 1);
}

/* resonance 0..4 opens the filter and quickens the bells */
export function setAmbienceResonance(level){
  res = level; if (!ctx) return;
  filt.frequency.setTargetAtTime(340 + level * 120, ctx.currentTime, 1);
  windGain.gain.setTargetAtTime(.022 + level * .004, ctx.currentTime, 1);
}

/* one clear note, used when the relic is touched */
export function chime(){ if (ctx && running) bell(noteOf(key, Math.floor(Math.random() * 5), 3), .07, 0, 3); }

document.addEventListener('visibilitychange', () => {
  if (!ctx) return;
  if (document.hidden) ctx.suspend(); else if (running) ctx.resume();
});
