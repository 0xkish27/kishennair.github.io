/* KL's landmarks at full scale, lit the way they are at night:
   the Petronas Twin Towers, KL Tower, Merdeka 118, and the Sultan Abdul Samad Building beside Dataran Merdeka. */
import * as THREE from 'three';
import { NOISE, FOG } from './glsl.js';
import { KL } from './city.js';

// one lighting shader with a few patterns; geometry stays simple, light does the work
function litMat(U, mode, base, glow){
  return new THREE.ShaderMaterial({
    uniforms: { uTime: U.uTime, uFogColor: U.uFogColor, uFogDensity: U.uFogDensity, uMode: { value: mode }, uBase: { value: new THREE.Color(...base) }, uGlow: { value: new THREE.Color(...glow) } },
    vertexShader: `varying vec3 vW, vL; void main(){ vL = position; vec4 w = modelMatrix * vec4(position, 1.); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }`,
    fragmentShader: `uniform float uTime, uMode; uniform vec3 uBase, uGlow; varying vec3 vW, vL; ${NOISE} ${FOG}
      void main(){
        float ang = atan(vL.z, vL.x); vec3 col = uBase;
        if (uMode < .5){                       // Petronas: vertical steel ribs and floor bands, brighter toward the top
          float ribs = pow(abs(sin(ang * 8.)), 28.), floors = smoothstep(.82, 1., fract(vW.y * 1.15));
          col += uGlow * (ribs * 1.1 + floors * .32 + .14) * (.4 + .9 * smoothstep(0., 60., vW.y));
        } else if (uMode < 1.5){               // KL Tower: light strips that drift through colours
          vec3 c = mix(vec3(.2, 1.6, 1.4), vec3(1.2, .4, 1.8), .5 + .5 * sin(uTime * .25 + vW.y * .06));
          col += c * (pow(abs(sin(ang * 6.)), 30.) * 1.4 + .12);
        } else if (uMode < 2.5){               // Merdeka 118: a lattice of faceted diamonds
          vec2 q = vec2(ang * 1.91, vW.y * .32); float dl = min(abs(fract(q.x + q.y) - .5), abs(fract(q.x - q.y) - .5));
          col += uGlow * (smoothstep(.07, .0, dl) * .9 + .06) * (.35 + .9 * smoothstep(0., 80., vW.y));
        } else if (uMode < 3.5){               // Sultan Abdul Samad: warm floodlit facade with arched windows
          float u = abs(vL.z) > abs(vL.x) * .6 ? vW.x : vW.z;
          float f = fract(u / 1.6), g = fract(vW.y / 2.4);
          float arch = step(.3, f) * step(f, .7) * step(.15, g) * step(g, .7) * step(length(vec2((f - .5) * 2.4, (g - .55) * 1.6)), 1.);
          col += uGlow * (.25 + .6 * exp(-vW.y * .16)) + vec3(1.6, .9, .38) * arch * .45;
        } else col += uGlow;                   // plain glow: domes, caps, spires
        gl_FragColor = vec4(applyFog(col, vW), 1.);
      }`
  });
}

function starPrism(R, h){
  // the towers' floor plan: an eight-pointed star softened into scallops
  const sh = new THREE.Shape();
  for (let i = 0; i <= 32; i++){ const a = i / 32 * Math.PI * 2, r = i % 2 ? R * .8 : R; const x = Math.cos(a) * r, y = Math.sin(a) * r; i ? sh.lineTo(x, y) : sh.moveTo(x, y); }
  const g = new THREE.ExtrudeGeometry(sh, { depth: h, bevelEnabled: false, curveSegments: 1 }); g.rotateX(-Math.PI / 2); return g;
}

export function buildSkyline(scene, U){
  const add = (geo, mat, x, y, z) => { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); scene.add(m); return m; };

  /* Petronas Twin Towers */
  const steel = litMat(U, 0, [.02, .022, .03], [1.15, 1.3, 1.7]);
  const glowW = litMat(U, 4, [0, 0, 0], [2.6, 2.6, 3]);
  const [px, pz] = KL.petronas;
  [-7.5, 7.5].forEach(o => {
    let y = 0;
    [[4.8, 32], [4.3, 4.2], [3.8, 3.8], [3.2, 3.4], [2.5, 3], [1.8, 2.6]].forEach(([r, h]) => { add(starPrism(r, h), steel, px + o, y, pz); y += h; });
    add(new THREE.CylinderGeometry(.55, .9, 4, 12), steel, px + o, y + 2, pz);
    add(new THREE.CylinderGeometry(.08, .45, 10, 8), glowW, px + o, y + 9, pz);
  });
  add(new THREE.BoxGeometry(10, 1.1, 1.6), litMat(U, 4, [0, 0, 0], [2, 1.5, 1]), px, 17.5, pz);   // the skybridge
  [-1, 1].forEach(sd => { const leg = add(new THREE.BoxGeometry(.35, 7, .35), steel, px + sd * 2.6, 14.5, pz); leg.rotation.z = sd * .6; });

  /* KL Tower on its hill */
  const [kx, kz] = KL.kltower;
  const hill = add(new THREE.SphereGeometry(18, 28, 12, 0, Math.PI * 2, 0, Math.PI / 2), litMat(U, 4, [.004, .01, .006], [.0, .015, .008]), kx, 0, kz); hill.scale.y = .38;
  const shaft = litMat(U, 1, [.015, .02, .03], [0, 0, 0]);
  add(new THREE.CylinderGeometry(.85, 1.35, 32, 16), shaft, kx, 6.8 + 16, kz);
  const pod = add(new THREE.SphereGeometry(4, 32, 16), litMat(U, 0, [.02, .03, .04], [.4, 1.6, 1.5]), kx, 41, kz); pod.scale.y = .5;
  add(new THREE.SphereGeometry(2.4, 24, 12), litMat(U, 0, [.02, .03, .04], [.8, 1.6, 1.9]), kx, 44.2, kz);
  add(new THREE.CylinderGeometry(.16, .4, 14, 8), glowW, kx, 53, kz);

  /* Merdeka 118: the tallest, faceted, with a spire */
  const [mx, mz] = KL.merdeka;
  add(new THREE.CylinderGeometry(2.6, 6.8, 66, 6), litMat(U, 2, [.012, .013, .018], [1.5, 1.25, .8]), mx, 33, mz);
  add(new THREE.ConeGeometry(1.3, 22, 6), litMat(U, 2, [.01, .01, .014], [1.8, 1.5, 1]), mx, 77, mz);

  /* Sultan Abdul Samad Building, its clock tower, and the wide field in front */
  const [sx, sz] = KL.samad;
  const facade = litMat(U, 3, [.016, .006, .003], [.2, .08, .03]);
  const copper = litMat(U, 4, [0, 0, 0], [.9, .45, .2]);
  add(new THREE.BoxGeometry(34, 6, 7), facade, sx, 3, sz);
  add(new THREE.BoxGeometry(3.4, 17, 3.4), facade, sx, 8.5, sz);
  const dome = add(new THREE.SphereGeometry(2.5, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2), copper, sx, 17, sz); dome.scale.y = 1.35;
  add(new THREE.ConeGeometry(.2, 3, 6), glowW, sx, 21.6, sz);
  [-13, 13].forEach(o => { add(new THREE.BoxGeometry(2.6, 10, 2.6), facade, sx + o, 5, sz); const d = add(new THREE.SphereGeometry(1.6, 18, 10, 0, Math.PI * 2, 0, Math.PI / 2), copper, sx + o, 10, sz); d.scale.y = 1.3; });
  const clock = add(new THREE.CircleGeometry(1.15, 32), litMat(U, 4, [0, 0, 0], [3, 2.2, 1.3]), sx, 13.8, sz + 1.72);
  clock.rotation.y = 0;
  const [dx, dz] = KL.dataran;
  const field = add(new THREE.PlaneGeometry(36, 26), litMat(U, 4, [0, 0, 0], [.012, .03, .016]), dx, .04, dz); field.rotation.x = -Math.PI / 2;
  add(new THREE.CylinderGeometry(.1, .2, 30, 6), litMat(U, 4, [0, 0, 0], [.05, .045, .04]), dx + 10, 15, dz + 4);
  add(new THREE.SphereGeometry(.45, 10, 8), glowW, dx + 10, 30.3, dz + 4);
}
