/* The city at night: thousands of lit buildings, wet streets that reflect the landmarks,
   moving traffic, the blue River of Life, the monorail, and motes of light in the air. */
import * as THREE from 'three';
import { NOISE, FOG } from './glsl.js';

// where things are, in world units (roughly 10 m each); north is -z
export const KL = {
  petronas: [60, -82], kltower: [-12, -42], merdeka: [-20, 74], samad: [-95, 12], dataran: [-95, 36],
  bintang: [46, 40], alor: [30, 54], saloma: [100, -112]
};
export const RIVER = [[-128, -240], [-112, -120], [-104, -40], [-112, 10], [-104, 60], [-86, 130], [-96, 240]];
const ROAD = 20, EXTENT = 260;

function rng(seed){ return () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
const d2 = (x, z, p) => Math.hypot(x - p[0], z - p[1]);

export function buildCity(scene, U, low, ceiling = () => 1e9){
  const R = rng(118);
  const riverCurve = new THREE.CatmullRomCurve3(RIVER.map(([x, z]) => new THREE.Vector3(x, 0, z)));
  const riverPts = riverCurve.getSpacedPoints(80);
  const nearRiver = (x, z) => riverPts.some(p => Math.hypot(p.x - x, p.z - z) < 13);
  const excluded = (x, z) => d2(x, z, KL.petronas) < 30 || d2(x, z, KL.kltower) < 20 || d2(x, z, KL.merdeka) < 15 ||
    d2(x, z, KL.samad) < 24 || d2(x, z, KL.dataran) < 20 || d2(x, z, KL.saloma) < 10 || nearRiver(x, z);
  const density = (x, z) => {
    let d = .35 + .65 * Math.exp(-Math.pow(d2(x, z, KL.petronas) / 95, 2)) + .55 * Math.exp(-Math.pow(d2(x, z, KL.bintang) / 70, 2)) + .4 * Math.exp(-Math.pow(d2(x, z, KL.merdeka) / 60, 2));
    d *= 1 - .7 * Math.exp(-Math.pow(d2(x, z, KL.samad) / 55, 2));          // the old town stays low
    return d * Math.max(0, 1 - Math.hypot(x, z) / (EXTENT + 30));
  };

  /* ---------------- buildings, one instanced draw call ---------------- */
  const lots = [];
  for (let bx = -EXTENT; bx < EXTENT; bx += ROAD) for (let bz = -EXTENT; bz < EXTENT; bz += ROAD) {
    const x0 = bx + 2.5, z0 = bz + 2.5, size = ROAD - 5;
    const split = R() < .55 ? 2 : 1, splitZ = R() < .5 ? 2 : 1;
    for (let i = 0; i < split; i++) for (let j = 0; j < splitZ; j++) {
      const w = size / split, dd = size / splitZ;
      const cx = x0 + w * (i + .5), cz = z0 + dd * (j + .5);
      if (Math.hypot(cx, cz) > EXTENT || excluded(cx, cz)) continue;
      const den = density(cx, cz); if (R() > .35 + den) continue;
      const lim = ceiling(cx, cz); if (lim < 2) continue;
      const h = Math.min(lim, 2.5 + R() * 5 + Math.pow(R(), 1.6) * den * 30);
      lots.push([cx + (R() - .5) * 1.5, cz + (R() - .5) * 1.5, w * (.62 + R() * .3), dd * (.62 + R() * .3), h]);
    }
  }
  const max = low ? 1300 : 2800; if (lots.length > max){ lots.sort(() => R() - .5); lots.length = max; }
  const box = new THREE.BoxGeometry(1, 1, 1); box.translate(0, .5, 0);
  const seeds = new Float32Array(lots.length * 3);
  const bMat = new THREE.ShaderMaterial({
    uniforms: { uTime: U.uTime, uFogColor: U.uFogColor, uFogDensity: U.uFogDensity },
    vertexShader: `attribute vec3 aSeed; varying vec3 vW, vN, vS; varying float vTop;
      void main(){ mat4 m = modelMatrix * instanceMatrix; vec4 w = m * vec4(position, 1.); vW = w.xyz; vN = normalize(mat3(m) * normal); vS = aSeed; vTop = (m * vec4(0., 1., 0., 1.)).y; gl_Position = projectionMatrix * viewMatrix * w; }`,
    fragmentShader: `uniform float uTime; varying vec3 vW, vN, vS; varying float vTop; ${NOISE} ${FOG}
      void main(){
        vec3 n = normalize(vN); vec3 col = vec3(.008, .007, .013);
        float dist = length(vW - cameraPosition);
        if (abs(n.y) < .5){
          float u = abs(n.x) > .5 ? vW.z : vW.x;
          vec2 cell = vec2(floor(u / .9), floor(vW.y / 1.15)); vec2 f = vec2(fract(u / .9), fract(vW.y / 1.15));
          float win = step(.16, f.x) * step(f.x, .84) * step(.2, f.y) * step(f.y, .74) * step(1.15, vW.y) * step(vW.y, vTop - .5);
          float r = h21(cell + vS.x * 91.7 + n.x * 3.1 + n.z * 7.3);
          float lit = step(1. - vS.y, r);
          lit = mix(lit, step(1. - vS.y, h21(cell * 1.3 + floor(uTime * .08 + r * 20.))), step(.94, r));   // a few windows switch on and off
          vec3 wc = vS.z < .72 ? vec3(1.7, 1.08, .58) : (vS.z < .92 ? vec3(.7, .95, 1.7) : vec3(1.8, .32, .28));
          wc *= .5 + .9 * h21(cell + 3.3);
          float far = smoothstep(110., 360., dist);
          col += mix(wc * lit * win, wc * vS.y * .2, far);
          col += vec3(.018, .018, .03) * win * (1. - lit) * (1. - far);
          col += vec3(.3, .09, .035) * exp(-vW.y * .45) * .55;                                         // street light on the ground floor
          col += vec3(.5, .09, .08) * smoothstep(vTop - .22, vTop, vW.y) * .35;                         // a faint red rim on the roof line
        } else col = vec3(.005, .004, .008) + vec3(.03, .006, .008) * h21(floor(vW.xz));
        gl_FragColor = vec4(applyFog(col, vW), 1.);
      }`
  });
  const city = new THREE.InstancedMesh(box, bMat, lots.length);
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), s = new THREE.Vector3(), p = new THREE.Vector3();
  const tops = [];
  lots.forEach(([x, z, w, dd, h], i) => {
    m4.compose(p.set(x, 0, z), q, s.set(w, h, dd)); city.setMatrixAt(i, m4);
    seeds[i * 3] = R(); seeds[i * 3 + 1] = .14 + R() * .3 + (h > 18 ? .1 : 0); seeds[i * 3 + 2] = R();
    if (h > 17) tops.push([x, h + .4, z]);
  });
  box.setAttribute('aSeed', new THREE.InstancedBufferAttribute(seeds, 3));
  city.frustumCulled = false; scene.add(city);

  /* ---------------- wet streets: the ground reflects the landmarks as long streaks toward the viewer ---------------- */
  const LIGHTS = [[KL.petronas[0] - 7.5, KL.petronas[1], 18, 1.3, 1.45, 1.9], [KL.petronas[0] + 7.5, KL.petronas[1], 18, 1.3, 1.45, 1.9],
    [KL.kltower[0], KL.kltower[1], 10, .3, 1.5, 1.3], [KL.merdeka[0], KL.merdeka[1], 22, 1.5, 1.2, .7],
    [KL.samad[0], KL.samad[1], 30, 1.6, .9, .45], [KL.bintang[0], KL.bintang[1], 26, 1.4, .3, 1.1]];
  const gMat = new THREE.ShaderMaterial({
    uniforms: { uTime: U.uTime, uFogColor: U.uFogColor, uFogDensity: U.uFogDensity,
      uL: { value: LIGHTS.map(l => new THREE.Vector3(l[0], l[1], l[2])) }, uLC: { value: LIGHTS.map(l => new THREE.Vector3(l[3], l[4], l[5])) } },
    vertexShader: `varying vec3 vW; void main(){ vec4 w = modelMatrix * vec4(position, 1.); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }`,
    fragmentShader: `uniform float uTime; uniform vec3 uL[6]; uniform vec3 uLC[6]; varying vec3 vW; ${NOISE} ${FOG}
      void main(){
        vec2 g = abs(fract(vW.xz / ${ROAD}. + .5) - .5) * ${ROAD}.;
        float road = 1. - smoothstep(1.6, 2.8, min(g.x, g.y));
        float lane = road * step(.6, fract((abs(g.x) < abs(g.y) ? vW.z : vW.x) * .25)) * (1. - smoothstep(.06, .14, min(g.x, g.y)));
        float wet = smoothstep(.38, .72, fbm3(vec3(vW.xz * .045, 0.)));
        vec3 col = vec3(.006, .005, .008) + vec3(.13, .055, .02) * road * .55 + vec3(.25, .2, .12) * lane * .25;
        for (int i = 0; i < 6; i++){
          vec2 dir = normalize(cameraPosition.xz - uL[i].xy); vec2 d = vW.xz - uL[i].xy;
          float along = dot(d, dir); float perp = dot(d, vec2(-dir.y, dir.x));
          perp += (n3(vec3(vW.xz * .35, uTime * .6)) - .5) * 2.2 * wet;                                // ripples break up the reflection
          col += uLC[i] * exp(-perp * perp / uL[i].z) * exp(-max(along, 0.) * .011) * step(0., along) * (.12 + .5 * wet);
        }
        col += vec3(.18, .05, .05) * wet * .05;
        gl_FragColor = vec4(applyFog(col, vW), 1.);
      }`
  });
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(1400, 1400), gMat); ground.rotation.x = -Math.PI / 2; scene.add(ground);

  /* ---------------- traffic: head and tail lights flowing along every road ---------------- */
  const roads = []; for (let k = -EXTENT; k <= EXTENT; k += ROAD) roads.push(k);
  const perRoad = low ? 9 : 16, carCount = roads.length * 2 * perRoad * 2;
  const car = new Float32Array(carCount * 4), kind = new Float32Array(carCount), cpos = new Float32Array(carCount * 3);
  let ci = 0;
  roads.forEach(k => [0, 1].forEach(axis => [-1, 1].forEach(dir => { for (let i = 0; i < perRoad; i++){
    car.set([k + dir * 1.1, R() * 600, dir * (5 + R() * 7), axis], ci * 4); kind[ci] = dir > 0 ? 0 : 1; ci++; } })));
  const tg = new THREE.BufferGeometry();
  tg.setAttribute('position', new THREE.BufferAttribute(cpos, 3)); tg.setAttribute('aCar', new THREE.BufferAttribute(car, 4)); tg.setAttribute('aKind', new THREE.BufferAttribute(kind, 1));
  const traffic = new THREE.Points(tg, new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    uniforms: { uTime: U.uTime, uPx: U.uPx },
    vertexShader: `attribute vec4 aCar; attribute float aKind; uniform float uTime, uPx; varying vec3 vC; varying float vF;
      void main(){ float s = mod(aCar.y + uTime * aCar.z, ${EXTENT * 2}.) - ${EXTENT}.;
        vec3 p = aCar.w < .5 ? vec3(aCar.x, .5, s) : vec3(s, .5, aCar.x);
        vec4 mv = viewMatrix * vec4(p, 1.); float d = -mv.z;
        gl_PointSize = clamp(uPx * 2.4 / d * 40., 1., 9.); gl_Position = projectionMatrix * mv;
        vC = aKind > .5 ? vec3(2.4, 2., 1.5) : vec3(2.8, .28, .14); vF = exp(-d * .006) * (1. - smoothstep(${EXTENT - 30}., ${EXTENT}., abs(s))); }`,
    fragmentShader: `varying vec3 vC; varying float vF; void main(){ float r = length(gl_PointCoord - .5); gl_FragColor = vec4(vC * smoothstep(.5, 0., r) * vF, 1.); }`
  }));
  traffic.frustumCulled = false; scene.add(traffic);

  /* ---------------- the River of Life: a ribbon of blue light ---------------- */
  const rp = riverCurve.getSpacedPoints(160), rv = [], ruv = [], ri = [];
  rp.forEach((pt, i) => { const t = riverCurve.getTangentAt(i / 160); const side = new THREE.Vector3(-t.z, 0, t.x).normalize().multiplyScalar(5);
    rv.push(pt.x + side.x, .06, pt.z + side.z, pt.x - side.x, .06, pt.z - side.z); ruv.push(0, i / 160, 1, i / 160);
    if (i < 160) ri.push(i * 2, i * 2 + 1, i * 2 + 2, i * 2 + 1, i * 2 + 3, i * 2 + 2); });
  const rg = new THREE.BufferGeometry(); rg.setAttribute('position', new THREE.Float32BufferAttribute(rv, 3)); rg.setAttribute('uv', new THREE.Float32BufferAttribute(ruv, 2)); rg.setIndex(ri);
  const river = new THREE.Mesh(rg, new THREE.ShaderMaterial({
    side: THREE.DoubleSide, uniforms: { uTime: U.uTime, uFogColor: U.uFogColor, uFogDensity: U.uFogDensity },
    vertexShader: `varying vec2 vUv; varying vec3 vW; void main(){ vUv = uv; vec4 w = modelMatrix * vec4(position, 1.); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }`,
    fragmentShader: `uniform float uTime; varying vec2 vUv; varying vec3 vW; ${NOISE} ${FOG}
      void main(){ float e = abs(vUv.x * 2. - 1.);
        float flow = n3(vec3(vUv.x * 4., vUv.y * 90. - uTime * 1.6, uTime * .2));
        vec3 col = vec3(.01, .04, .16) + vec3(.15, .5, 2.2) * pow(flow, 3.) * .9;
        col += vec3(.35, .8, 2.6) * smoothstep(.82, 1., e) * (.7 + .3 * sin(vUv.y * 400. + uTime * 2.));    // the blue lights along the banks
        gl_FragColor = vec4(applyFog(col, vW), 1.); }`
  }));
  scene.add(river);

  /* ---------------- glowing points: aviation beacons, Jalan Alor's street lights, motes in the air ---------------- */
  const pts = [], pcol = [], pkind = [];
  tops.forEach(([x, y, z]) => { pts.push(x, y, z); pcol.push(3, .2, .15); pkind.push(1); });
  for (let i = 0; i < 90; i++){ const z = KL.alor[1] - 16 + i * .36; [-1.6, 1.6].forEach(o => { pts.push(KL.alor[0] + o + (R() - .5) * .3, 2.2 + R() * 1.4, z); pcol.push(2.6, .7 + R() * .5, .25); pkind.push(2); }); }
  rp.forEach((pt, i) => { if (i % 2) return; pts.push(pt.x + (R() - .5) * 8, 1 + R() * 4, pt.z); pcol.push(.4, .9, 2.4); pkind.push(3); });
  const motes = low ? 700 : 1500;
  for (let i = 0; i < motes; i++){ pts.push((R() - .5) * 340, 2 + R() * 100, (R() - .5) * 420 + 20); const w = R(); pcol.push(w < .6 ? 1.8 : .9, w < .6 ? 1.2 : .7, w < .6 ? .7 : 1.8); pkind.push(4); }
  const pg = new THREE.BufferGeometry();
  pg.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3)); pg.setAttribute('aCol', new THREE.Float32BufferAttribute(pcol, 3)); pg.setAttribute('aKind', new THREE.Float32BufferAttribute(pkind, 1)); pg.setAttribute('aId', new THREE.Float32BufferAttribute(pkind.map((_, i) => i), 1));
  const glows = new THREE.Points(pg, new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, uniforms: { uTime: U.uTime, uPx: U.uPx },
    vertexShader: `attribute vec3 aCol; attribute float aKind; attribute float aId; uniform float uTime, uPx; varying vec3 vC; varying float vA;
      float hh(float n){ return fract(sin(n) * 43758.5453); }
      void main(){ vec3 p = position; float id = aId; float sz = 1.;
        vA = 1.;
        if (aKind == 1.){ vA = step(.55, fract(uTime * .55 + hh(id) * 3.)) * .9 + .1; sz = 1.6; }
        else if (aKind == 2.){ vA = .75 + .25 * sin(uTime * 3. + id); sz = .7; }
        else if (aKind == 3.){ p.y += sin(uTime * .4 + id) * .8; vA = .35 + .3 * sin(uTime + id); sz = 3.2; }
        else { p.y = mod(p.y + uTime * (.6 + hh(id) * .8), 100.) + 2.; p.x += sin(uTime * .2 + id) * 2.; vA = (.4 + .6 * sin(uTime * 1.3 + id * 7.)) * .7; sz = .55 + hh(id + 1.) * .5; }
        vec4 mv = viewMatrix * vec4(p, 1.); float d = -mv.z;
        gl_PointSize = clamp(uPx * sz * 110. / d, 1., 26.); gl_Position = projectionMatrix * mv; vC = aCol; vA *= exp(-d * .004); }`,
    fragmentShader: `varying vec3 vC; varying float vA; void main(){ float r = length(gl_PointCoord - .5); gl_FragColor = vec4(vC * vA * smoothstep(.5, 0., r) * smoothstep(.5, .1, r), 1.); }`
  }));
  glows.frustumCulled = false; scene.add(glows);

  /* ---------------- the monorail gliding over Bukit Bintang ---------------- */
  const mono = new THREE.CatmullRomCurve3([[110, 82], [70, 66], [46, 54], [20, 30], [-2, 0], [10, -30], [52, -40], [96, -20], [126, 30]].map(([x, z]) => new THREE.Vector3(x, 7, z)), true);
  const track = new THREE.Mesh(new THREE.TubeGeometry(mono, 240, .35, 6, true), new THREE.MeshBasicMaterial({ color: 0x0b0709 }));
  scene.add(track);
  const trackLights = new THREE.Points(new THREE.BufferGeometry().setFromPoints(mono.getSpacedPoints(160).map(v => v.clone().setY(6.4))),
    new THREE.PointsMaterial({ color: new THREE.Color(2.2, 1.2, .6), size: .5, sizeAttenuation: true, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false }));
  scene.add(trackLights);
  const train = [];
  const tMat = new THREE.ShaderMaterial({ uniforms: {}, vertexShader: `varying vec3 vP; void main(){ vP = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.); }`,
    fragmentShader: `varying vec3 vP; void main(){ float band = step(.05, vP.y) * step(vP.y, .45) * step(.25, fract(vP.z * 1.4)); gl_FragColor = vec4(vec3(.04, .03, .05) + vec3(2.4, 1.7, 1.) * band, 1.); }` });
  for (let i = 0; i < 3; i++){ const c = new THREE.Mesh(new THREE.BoxGeometry(1.5, 1.3, 4.6), tMat); scene.add(c); train.push(c); }

  /* ---------------- Bukit Bintang's giant screens ---------------- */
  const sMat = new THREE.ShaderMaterial({ side: THREE.DoubleSide, uniforms: { uTime: U.uTime },
    vertexShader: `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.); }`,
    fragmentShader: `uniform float uTime; varying vec2 vUv; void main(){ float t = uTime * .25; vec3 a = vec3(1.6, .2, .9), b = vec3(.2, .9, 1.8), c = vec3(1.9, .9, .3);
      float k = .5 + .5 * sin(vUv.x * 3. + t * 2. + sin(vUv.y * 4. + t)); vec3 col = mix(mix(a, b, k), c, .5 + .5 * sin(t * .7 + vUv.y * 2.));
      col *= .55 + .45 * step(.5, fract(vUv.y * 60.)); gl_FragColor = vec4(col * .9, 1.); }` });
  [[KL.bintang[0] - 8, 9, KL.bintang[1] + 2, 9, 6, .3], [KL.bintang[0] + 6, 12, KL.bintang[1] - 7, 7, 9, -1.1], [KL.bintang[0] + 2, 7, KL.bintang[1] + 12, 10, 5, 2.6]].forEach(([x, y, z, w, h, ry]) => {
    const scr = new THREE.Mesh(new THREE.PlaneGeometry(w, h), sMat); scr.position.set(x, y, z); scr.rotation.y = ry; scene.add(scr);
  });

  /* ---------------- Saloma Link: a bridge whose light keeps changing colour ---------------- */
  const sal = new THREE.CatmullRomCurve3([new THREE.Vector3(KL.saloma[0] - 14, 2, KL.saloma[1] + 4), new THREE.Vector3(KL.saloma[0], 9, KL.saloma[1]), new THREE.Vector3(KL.saloma[0] + 14, 2, KL.saloma[1] - 4)]);
  const salMesh = new THREE.Mesh(new THREE.TubeGeometry(sal, 60, .9, 8, false), new THREE.ShaderMaterial({ uniforms: { uTime: U.uTime },
    vertexShader: `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.); }`,
    fragmentShader: `uniform float uTime; varying vec2 vUv; void main(){ vec3 c = .5 + .5 * cos(6.283 * (vUv.x * .6 + uTime * .08 + vec3(0., .33, .67))); gl_FragColor = vec4(c * 2. * (.6 + .4 * step(.5, fract(vUv.x * 40.))), 1.); }` }));
  scene.add(salMesh);

  return {
    update(t){
      const u = (t * .012) % 1;
      train.forEach((c, i) => { const k = (u - i * .0085 + 1) % 1; c.position.copy(mono.getPointAt(k)); c.position.y += .9; c.lookAt(mono.getPointAt((k + .002) % 1).setY(c.position.y)); });
    }
  };
}
