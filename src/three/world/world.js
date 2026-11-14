/* The landing page as a place, not a page.
   You arrive above a sea of clouds with a wax seal in front of you. Hold it until it bursts, and the camera dives
   through the clouds into Kuala Lumpur at night. Scrolling flies you across the city to four portals, one per
   journey. Touch a portal (or press Begin) and you are pulled through it into the journey. */
import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import { reduce } from '../../lib/util.js';
import { GRADE_VS, GRADE_FS } from './glsl.js';
import { buildSky } from './sky.js';
import { buildCity, buildAir } from './city.js';
import { buildRealCity } from './realcity.js';
import { buildSkyline } from './skyline.js';
import { buildPortals } from './portals.js';
import { buildSeal } from './seal.js';
import { phase, onBurst } from '../fog.js';
import { onTilt, haptic, requestMotion } from '../../ui/motion.js';
import { startAmbience, swell } from '../../ui/ambience.js';
import { sfx } from '../../ui/fx.js';

const V = (x, y, z) => new THREE.Vector3(x, y, z);
// the flight: where the camera is, and what it looks at, at each chapter
// one sweep across the city with no doubling back: west (Lantern) → centre (Echo) → north-east (Starfall) → south-east (Feast) → up over it all
const DRAWN = {   // the procedural city
  CAM:  [V(0, 205, 250), V(-34, 74, 176), V(-64, 23, 50), V(16, 36, 0), V(22, 30, -20), V(70, 20, 70), V(8, 100, 186)],
  LOOK: [V(0, 168, -40), V(-8, 6, -10), V(-80, 14, 17), V(-6, 30, -27), V(40, 25, -60), V(50, 11, 41), V(0, 12, -40)],
  PORTALS: { lantern: [V(-79, 19, 18), 1], echo: [V(-5, 31, -25), 1], starfall: [V(35, 24, -46), 1], feast: [V(51, 16, 43), 1] }
};
const REALKL = {   // Google's 3D tiles of the real city: positions follow the landmarks' real coordinates (10 m units)
  CAM:  [V(0, 205, 250), V(-40, 70, 170), V(-64, 18, 58), V(32, 30, 8), V(60, 27, -38), V(122, 18, 62), V(20, 95, 190)],
  LOOK: [V(0, 168, -40), V(-10, 8, 0), V(-84, 10, 20), V(12, 25, -24), V(86, 22, -78), V(108, 9, 22), V(30, 10, -30)],
  PORTALS: { lantern: [V(-78, 13, 26), .62], echo: [V(15, 26, -20), .62], starfall: [V(80, 21, -66), .7], feast: [V(106, 11, 27), .62] }
};
const KEY = import.meta.env.VITE_GOOGLE_MAPS_KEY || '';
const VIA_PROXY = new URLSearchParams(location.search).get('tiles') === 'proxy';   // testing: the network proxy adds the key
let noTiles = false; try { noTiles = sessionStorage.getItem('arc-notiles') === '1'; } catch (e) {}
export const REAL_CITY = (!!KEY || VIA_PROXY) && !noTiles;   // falls back to the drawn city if Google's tiles failed this session
const SET = REAL_CITY ? REALKL : DRAWN, CAM = SET.CAM, LOOK = SET.LOOK;
const COLORS = { lantern: '#FFB65C', echo: '#6FE6D0', starfall: '#9FB0FF', feast: '#FF6A78' };
const ORDER = { lantern: 2 / 6, echo: 3 / 6, starfall: 4 / 6, feast: 5 / 6 };
export const PORTALS = Object.keys(ORDER).map(id => ({ id, u: ORDER[id], pos: SET.PORTALS[id][0], scale: SET.PORTALS[id][1], color: COLORS[id] }));
// scroll (0..1 through the descent) → flight position, with pauses at every chapter
const SK = [0, .06, .14, .22, .32, .40, .50, .58, .68, .76, .86, .94, 1];
const UK = [0, 1 / 6, 1 / 6, 2 / 6, 2 / 6, 3 / 6, 3 / 6, 4 / 6, 4 / 6, 5 / 6, 5 / 6, 1, 1];
const ss = x => x * x * (3 - 2 * x);
function mapScroll(s){ for (let i = 1; i < SK.length; i++) if (s <= SK[i]){ const k = (s - SK[i - 1]) / (SK[i] - SK[i - 1] || 1); return UK[i - 1] + (UK[i] - UK[i - 1]) * ss(Math.max(0, Math.min(1, k))); } return 1; }

export function initWorld(){
  let renderer;
  try { renderer = new THREE.WebGLRenderer({ antialias: false, powerPreference: 'high-performance' }); } catch (e) { return null; }
  if (!renderer.getContext()) return null;
  const low = Math.min(innerWidth, innerHeight) < 620 || (navigator.hardwareConcurrency || 4) <= 4;
  const PR = Math.min(devicePixelRatio || 1, low ? 1.3 : 1.6);
  renderer.setPixelRatio(PR); renderer.setSize(innerWidth, innerHeight); renderer.outputColorSpace = THREE.LinearSRGBColorSpace;
  const cvs = renderer.domElement; cvs.id = 'world'; cvs.setAttribute('aria-hidden', 'true'); document.body.prepend(cvs);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(55, innerWidth / innerHeight, .5, 4200); scene.add(camera);
  const U = { uTime: { value: 0 }, uFogColor: { value: new THREE.Color(.018, .004, .007) }, uFogDensity: { value: REAL_CITY ? .0026 : .0036 }, uPx: { value: PR * innerHeight / 900 }, uGround: { value: 0 } };

  buildSky(scene, U, phase);
  const flight = new THREE.CatmullRomCurve3(CAM, false, 'centripetal').getSpacedPoints(260).filter(p => p.y < 120);
  const ceiling = (x, z) => { let h = 1e9;
    flight.forEach(p => { const d = Math.hypot(p.x - x, p.z - z); if (d < 34) h = Math.min(h, p.y - 15 + d * .3); });
    PORTALS.forEach(p => { const d = Math.hypot(p.pos.x - x, p.pos.z - z); if (d < 24) h = Math.min(h, p.pos.y - 13 + d * .2); });
    return h; };
  let city, real = null;
  if (REAL_CITY){ real = buildRealCity(scene, U, camera, renderer, { key: KEY, viaProxy: VIA_PROXY, low }); city = buildAir(scene, U, low); }
  else { city = buildCity(scene, U, low, ceiling); buildSkyline(scene, U); }
  const portals = buildPortals(scene, U, PORTALS.map(p => { const i = Math.round(p.u * 6); return { ...p, face: CAM[i] }; }));
  const seal = buildSeal(camera);

  // HDR render targets so bright windows keep their energy for the bloom and the grade
  const hdr = true;
  const rt = new THREE.WebGLRenderTarget(innerWidth * PR, innerHeight * PR, { minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter, format: THREE.RGBAFormat, type: hdr ? THREE.HalfFloatType : THREE.UnsignedByteType });
  const composer = new EffectComposer(renderer, rt); composer.setPixelRatio(PR); composer.setSize(innerWidth, innerHeight);
  composer.addPass(new RenderPass(scene, camera));
  const bloom = new UnrealBloomPass(new THREE.Vector2(innerWidth / 2, innerHeight / 2), .95, .72, hdr ? .62 : .5); composer.addPass(bloom);
  const grade = new ShaderPass({ uniforms: { tDiffuse: { value: null }, uTime: U.uTime, uFlash: { value: 0 }, uDim: { value: 0 }, uAberr: { value: .008 },
    uRes: { value: new THREE.Vector2(innerWidth, innerHeight) }, uFlashCol: { value: new THREE.Color(1, .9, .82) } }, vertexShader: GRADE_VS, fragmentShader: GRADE_FS });
  composer.addPass(grade);

  /* ---------------- state ---------------- */
  const descent = document.getElementById('descent');
  const chapters = [...document.querySelectorAll('.chapter[data-u]')].map(el => ({ el, u: +el.dataset.u, on: -1 }));
  const gate = document.getElementById('gate');
  let entered = false; try { entered = sessionStorage.getItem('arc-entered') === '1'; } catch (e) {}
  let mode = entered || reduce ? 'scroll' : 'gate';
  let uCur = mode === 'gate' ? 0 : mapScroll(progress()), hold = 0, holding = false, diveT = 0, portalDive = null, flash = 0, hoverId = null, kick = 0;
  const tilt = { x: 0, y: 0 }, tiltS = { x: 0, y: 0 };
  onTilt((x, y) => { tilt.x = x; tilt.y = y; seal.point(x, y); });
  onBurst(s => { flash = Math.max(flash, .18 * s); kick = 1; });

  if (mode === 'gate'){ document.documentElement.classList.add('gated'); scrollTo(0, 0); } else gate?.remove();
  document.body.classList.add('has-world');

  function progress(){
    if (!descent) return 1;
    const top = descent.offsetTop, range = Math.max(1, descent.offsetHeight - innerHeight);
    return Math.max(0, Math.min(1, (scrollY - top) / range));
  }
  const scrollForU = s => descent.offsetTop + s * Math.max(1, descent.offsetHeight - innerHeight);

  /* ---------------- the gate: hold the seal ---------------- */
  function breakGate(){
    if (mode !== 'gate') return;
    mode = 'breaking'; seal.burst(); flash = .55; sfx('crack'); haptic('crack'); requestMotion(); startAmbience('landing');
    gate?.classList.add('gone');
    setTimeout(() => { mode = 'dive'; diveT = performance.now(); swell(2); }, reduce ? 0 : 650);
    try { sessionStorage.setItem('arc-entered', '1'); } catch (e) {}
  }
  if (mode === 'gate'){
    const isUI = t => t.closest && t.closest('a,button,input,textarea,label,.nav');
    addEventListener('pointerdown', e => { if (mode === 'gate' && !isUI(e.target)){ holding = true; e.preventDefault?.(); } });
    addEventListener('pointerup', () => { holding = false; }); addEventListener('pointercancel', () => { holding = false; });
    addEventListener('keydown', e => { if (mode === 'gate' && (e.key === 'Enter' || e.key === ' ')){ e.preventDefault(); breakGate(); } });
    document.getElementById('gateEnter')?.addEventListener('click', breakGate);
    addEventListener('contextmenu', e => { if (mode === 'gate') e.preventDefault(); });
  }

  /* ---------------- portals: hover and touch ---------------- */
  const ray = new THREE.Raycaster(), ndc = new THREE.Vector2();
  const pick = (x, y) => { ndc.set(x / innerWidth * 2 - 1, -(y / innerHeight) * 2 + 1); ray.setFromCamera(ndc, camera); const h = ray.intersectObjects(portals.meshes, false)[0]; return h ? h.object.userData.id : null; };
  const overUI = t => t.closest && t.closest('a,button,input,textarea,label,.nav,.chapter-card,#app,.codex-panel,.toast');
  addEventListener('pointermove', e => { if (mode !== 'scroll' || overUI(e.target)) { if (hoverId){ hoverId = null; document.body.style.cursor = ''; } return; }
    hoverId = pick(e.clientX, e.clientY); document.body.style.cursor = hoverId ? 'pointer' : ''; }, { passive: true });
  let onEnter = null;
  addEventListener('click', e => { if (mode !== 'scroll' || overUI(e.target) || document.body.classList.contains('app-open')) return; const id = pick(e.clientX, e.clientY); if (id && onEnter) onEnter(id); });

  /* ---------------- render loop ---------------- */
  const camPath = new THREE.CatmullRomCurve3(CAM, false, 'centripetal'), lookPath = new THREE.CatmullRomCurve3(LOOK, false, 'centripetal');
  const tmpL = new THREE.Vector3(), side = new THREE.Vector3(), upv = new THREE.Vector3(0, 1, 0);
  let last = performance.now(), frozen = false;
  function frame(now){
    requestAnimationFrame(frame);
    if (document.body.classList.contains('app-open')){
      // freeze on a clean, dimmed frame (never on the white of a portal flash) while the game is open
      if (!frozen){ frozen = true; grade.uniforms.uFlash.value = 0; grade.uniforms.uDim.value = .82; composer.render(); }
      last = now; return;
    }
    frozen = false;
    if (document.hidden) { last = now; return; }
    const rawDt = Math.min(.3, (now - last) / 1000), dt = Math.min(.05, rawDt); last = now;
    U.uTime.value = now / 1000;

    // where the flight should be
    if (mode === 'gate' || mode === 'breaking'){
      hold = holding ? Math.min(1, hold + rawDt / 1.35) : Math.max(0, hold - rawDt * 1.8);
      if (holding && Math.random() < hold * .5) haptic('tick');
      seal.setHold(hold); gate?.style.setProperty('--hold', hold.toFixed(3));
      if (hold >= 1) breakGate();
      uCur = 0;
    } else if (mode === 'dive'){
      const k = Math.min(1, (now - diveT) / (reduce ? 1 : 3600)); uCur = (1 / 6) * (k < .5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2);
      if (k >= 1){ mode = 'scroll'; document.documentElement.classList.remove('gated'); gate?.remove(); scrollTo({ top: scrollForU(.10), behavior: 'instant' }); }
    } else if (mode === 'scroll'){
      const target = mapScroll(progress()); uCur += (target - uCur) * (reduce ? 1 : Math.min(1, dt * 3.2));
    }

    // the camera, with a slow drift and the phone's tilt
    tiltS.x += (tilt.x - tiltS.x) * .05; tiltS.y += (tilt.y - tiltS.y) * .05;
    camPath.getPoint(Math.max(0, Math.min(1, uCur)), camera.position); lookPath.getPoint(Math.max(0, Math.min(1, uCur)), tmpL);
    const dist = camera.position.distanceTo(tmpL), tt = now / 1000;
    side.subVectors(tmpL, camera.position).cross(upv).normalize();
    tmpL.addScaledVector(side, (tiltS.x * .16 + Math.sin(tt * .13) * .015) * dist);
    tmpL.y += (-tiltS.y * .1 + Math.sin(tt * .17) * .01) * dist;
    if (innerWidth < innerHeight && uCur > .25) tmpL.y -= dist * .22;   // portrait: aim lower so portals sit above the card
    camera.position.y += Math.sin(tt * .5) * .25;
    if (portalDive){
      const k = Math.min(1, (now - portalDive.t) / 1150), e = k * k * k;
      camera.position.lerp(portalDive.target, e); tmpL.lerp(portalDive.through, Math.min(1, k * 1.4));
      flash = Math.max(flash, Math.max(0, (k - .55) / .45));
      if (k >= 1 && !portalDive.done){ portalDive.done = true; const cb = portalDive.cb; setTimeout(() => { portalDive = null; flash = 0; }, 900); cb(); }
    }
    camera.lookAt(tmpL);

    // which chapter we are in
    let focus = null;
    chapters.forEach(c => { const d = Math.abs(uCur - c.u), on = mode === 'scroll' && d < .035 ? 1 : 0; const op = mode === 'scroll' ? Math.max(0, 1 - Math.max(0, d - .012) / .03) : 0;
      if (Math.abs(op - c.on) > .01){ c.on = op; c.el.style.opacity = op.toFixed(3); c.el.classList.toggle('live', op > .5); c.el.style.transform = `translateY(${((1 - op) * 24).toFixed(1)}px)`; }
      if (on){ const p = PORTALS.find(p => Math.abs(p.u - c.u) < .01); if (p) focus = p.id; } });

    // past the descent, the world dims behind the rest of the page
    if (descent){ const r = descent.getBoundingClientRect(); grade.uniforms.uDim.value = Math.max(0, Math.min(.62, (innerHeight - r.bottom) / innerHeight * .9)); }

    portals.update(tt, focus, hoverId || (portalDive && portalDive.id));
    city.update(tt);
    if (real) real.update();
    seal.update(now);
    kick *= .95; bloom.strength = .95 + kick * .5 + (portalDive ? .8 : 0);
    flash = portalDive ? flash : flash * Math.pow(.18, dt); grade.uniforms.uFlash.value = Math.min(1, flash);
    composer.render();
  }
  requestAnimationFrame(frame);
  window.__arcWorld = { scene, camera, bloom, grade, seal, real };
  if (real){
    const credit = document.createElement('div'); credit.id = 'mapCredit'; credit.setAttribute('aria-label', 'Map data attribution'); document.body.appendChild(credit);
    setInterval(() => { const a = real.attributions().filter(x => x.type === 'string').map(x => x.value).join('; ');
      credit.innerHTML = `<b>Google</b><span>${(a || 'Map data ©Google').replace(/[<>&]/g, '')}</span>`; credit.hidden = document.body.classList.contains('app-open'); }, 1500);
  }   // handle for debugging and capture tools

  addEventListener('resize', () => {
    camera.aspect = innerWidth / innerHeight; camera.fov = innerWidth < innerHeight ? 68 : 55; camera.updateProjectionMatrix();
    renderer.setSize(innerWidth, innerHeight); composer.setSize(innerWidth, innerHeight); bloom.resolution.set(innerWidth / 2, innerHeight / 2);
    grade.uniforms.uRes.value.set(innerWidth, innerHeight); U.uPx.value = PR * innerHeight / 900;
  });
  camera.fov = innerWidth < innerHeight ? 68 : 55; camera.updateProjectionMatrix();

  return {
    onEnter(fn){ onEnter = fn; },
    /* fly through a portal, then call cb; falls back to cb at once when not on the landing world */
    dive(id, cb){
      const p = PORTALS.find(x => x.id === id);
      if (!p || mode !== 'scroll' || reduce){ cb(); return; }
      const dir = new THREE.Vector3().subVectors(p.pos, camera.position).normalize();
      portalDive = { id, t: performance.now(), target: p.pos.clone().addScaledVector(dir, -1.5), through: p.pos.clone().addScaledVector(dir, 20), cb, done: false };
      sfx('crack'); haptic('ok'); swell(3);
    }
  };
}
