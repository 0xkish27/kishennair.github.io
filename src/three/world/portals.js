/* Four portals floating over the city, one per journey: a brass-ringed oval holding a slow vortex of the journey's colour.
   Hover makes one wake up; touching it pulls the camera through. */
import * as THREE from 'three';
import { NOISE } from './glsl.js';

export function buildPortals(scene, U, defs){
  const list = [];
  defs.forEach(d => {
    const g = new THREE.Group(); g.position.copy(d.pos); g.lookAt(d.face); scene.add(g);
    const col = new THREE.Color(d.color);
    const uHover = { value: 0 }, uWake = { value: 0 };
    const surf = new THREE.Mesh(new THREE.CircleGeometry(6, 96), new THREE.ShaderMaterial({
      transparent: true, depthWrite: false, side: THREE.DoubleSide,
      uniforms: { uTime: U.uTime, uCol: { value: col }, uHover, uWake },
      vertexShader: `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.); }`,
      fragmentShader: `uniform float uTime, uHover, uWake; uniform vec3 uCol; varying vec2 vUv; ${NOISE}
        void main(){
          vec2 p = vUv * 2. - 1.; float r = length(p), a = atan(p.y, p.x);
          float t = uTime * (.12 + uHover * .2);
          // a spiral drawn inward: domain-warped noise in polar space
          // seamless: sample the noise on a twisted circle instead of the raw angle
          float sp = log(r + .02) * 1.1 - t * 1.3, ang = a + sp * 1.8 + t * .6;
          vec3 pp = vec3(cos(ang) * 1.3, sin(ang) * 1.3, sp * 1.2);
          float n = fbm(pp * 1.3 + vec3(0., 0., t * .2));
          float m = fbm(pp * 2.6 + n * 1.5 + vec3(t * .1));
          vec3 deep = vec3(.006, .002, .01);
          vec3 cc = uCol * uCol * 1.3;
          vec3 col = mix(deep, cc, smoothstep(.4, .9, m) * (.3 + .7 * r));
          col += uCol * uCol * .9 * smoothstep(.62, .95, n) * r;
          col += uCol * pow(1. - r, 6.) * (.9 + uHover * 2.);                       // light at the heart of the vortex
          col += uCol * smoothstep(.88, 1., r) * (.9 + uHover);  // the mirror's lip
          col *= .55 + .45 * uWake + uHover * .5;
          float alpha = smoothstep(1., .985, r);
          gl_FragColor = vec4(col, alpha);
        }`
    }));
    surf.scale.y = 1.42; surf.userData.id = d.id; g.add(surf);
    const brass = new THREE.MeshBasicMaterial({ color: new THREE.Color(.42, .27, .14) });
    const rim = new THREE.Mesh(new THREE.TorusGeometry(6.15, .22, 10, 120), brass); rim.scale.y = 1.42; g.add(rim);
    const outer = new THREE.Mesh(new THREE.TorusGeometry(6.75, .07, 6, 120), new THREE.MeshBasicMaterial({ color: col.clone().multiplyScalar(2.2) })); outer.scale.y = 1.42; g.add(outer);
    // a crown of small lights around the frame, like candles set into brass
    const studs = new THREE.Group(); g.add(studs);
    for (let i = 0; i < 28; i++){ const an = i / 28 * Math.PI * 2; const s = new THREE.Mesh(new THREE.SphereGeometry(i % 7 ? .13 : .26, 8, 6), new THREE.MeshBasicMaterial({ color: i % 7 ? col.clone().multiplyScalar(2) : new THREE.Color(3, 2.4, 1.6) }));
      s.position.set(Math.cos(an) * 7.25, Math.sin(an) * 7.25 * 1.42, 0); studs.add(s); }
    // obsidian shards circling it
    const shards = [];
    const obs = new THREE.MeshBasicMaterial({ color: new THREE.Color(.02, .015, .02) });
    const edge = new THREE.LineBasicMaterial({ color: col.clone().multiplyScalar(1.6), transparent: true, opacity: .8 });
    for (let i = 0; i < 9; i++){ const geo = new THREE.TetrahedronGeometry(.35 + Math.random() * .5); const sh = new THREE.Mesh(geo, obs); sh.add(new THREE.LineSegments(new THREE.EdgesGeometry(geo), edge));
      sh.userData = { a: Math.random() * 6.283, r: 9 + Math.random() * 3, y: (Math.random() - .5) * 14, sp: .1 + Math.random() * .25 }; g.add(sh); shards.push(sh); }
    list.push({ id: d.id, group: g, surf, uHover, uWake, shards, studs, base: d.pos.clone(), hover: 0 });
  });

  return {
    list,
    meshes: list.map(p => p.surf),
    update(t, focusId, hoverId){
      list.forEach((p, i) => {
        const hv = p.id === hoverId ? 1 : 0, wake = p.id === focusId ? 1 : 0;
        p.uHover.value += (hv - p.uHover.value) * .08; p.uWake.value += (wake - p.uWake.value) * .05;
        p.group.position.y = p.base.y + Math.sin(t * .6 + i * 1.7) * .6;
        p.studs.rotation.z = t * .05;
        p.shards.forEach(s => { const u = s.userData; u.a += u.sp * .01 * (1 + p.uHover.value * 3); s.position.set(Math.cos(u.a) * u.r, u.y + Math.sin(t + u.a) * .4, Math.sin(u.a) * u.r * .35); s.rotation.x += .01; s.rotation.y += .013; });
      });
    }
  };
}
