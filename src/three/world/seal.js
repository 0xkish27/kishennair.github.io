/* The crimson wax seal that floats in front of the camera at the gate. Holding it splits the wax along its cracks
   and molten light bleeds through; at full pressure it bursts outward. */
import * as THREE from 'three';

export function buildSeal(camera){
  const root = new THREE.Group(); root.position.set(0, 0, -9); camera.add(root);
  const key = new THREE.DirectionalLight(0xffd6b8, .75); key.position.set(-3, 4, 6); root.add(key); key.target = root;
  const rim = new THREE.PointLight(0x7a5cff, 3*Math.PI, 14, 2); rim.position.set(3.5, 2, -1.5); root.add(rim);
  const fill = new THREE.PointLight(0xff3020, 1.5*Math.PI, 12, 2); fill.position.set(-2, -2, 3); root.add(fill);
  root.add(new THREE.AmbientLight(0x301018, .25*Math.PI));

  // molten core, seen through the cracks as they open
  const coreTex = (() => { const c = document.createElement('canvas'); c.width = c.height = 128; const g = c.getContext('2d'); const r = g.createRadialGradient(64, 64, 0, 64, 64, 64);
    r.addColorStop(0, 'rgba(255,240,210,1)'); r.addColorStop(.3, 'rgba(255,120,60,.8)'); r.addColorStop(1, 'rgba(255,40,20,0)'); g.fillStyle = r; g.fillRect(0, 0, 128, 128); return new THREE.CanvasTexture(c); })();
  const core = new THREE.Sprite(new THREE.SpriteMaterial({ map: coreTex, color: new THREE.Color(3, 1.4, .8), transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending }));
  core.scale.setScalar(3.2); core.position.z = -.05; root.add(core);
  const halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: coreTex, color: new THREE.Color(.9, .06, .05), transparent: true, opacity: .2, depthWrite: false, blending: THREE.AdditiveBlending }));
  halo.scale.setScalar(6.5); halo.position.z = -1; root.add(halo);

  const wax = new THREE.MeshStandardMaterial({ color: 0x3c0604, roughness: .3, metalness: .05, emissive: 0x0a0000, transparent: true });
  const dark = new THREE.MeshStandardMaterial({ color: 0x240403, roughness: .45, transparent: true });
  const rOf = a => 1.55 + .1 * Math.sin(a * 12) + .045 * Math.sin(a * 29 + 1.3);
  const N = 9, wedges = [];
  for (let i = 0; i < N; i++){
    const a0 = i / N * Math.PI * 2, a1 = (i + 1) / N * Math.PI * 2, sh = new THREE.Shape(); sh.moveTo(0, 0);
    for (let k = 0; k <= 14; k++){ const a = a0 + (a1 - a0) * k / 14; sh.lineTo(Math.cos(a) * rOf(a), Math.sin(a) * rOf(a)); }
    sh.lineTo(0, 0);
    const geo = new THREE.ExtrudeGeometry(sh, { depth: .3, bevelEnabled: true, bevelThickness: .08, bevelSize: .06, bevelSegments: 3, curveSegments: 6 }); geo.translate(0, 0, -.15);
    const m = new THREE.Mesh(geo, wax); const mid = (a0 + a1) / 2;
    m.userData = { dir: new THREE.Vector3(Math.cos(mid), Math.sin(mid), 0), spin: new THREE.Vector3(Math.random() - .5, Math.random() - .5, Math.random() - .5).multiplyScalar(7) };
    root.add(m); wedges.push(m);
  }
  // the pressed emblem: a ring and the twin towers
  const emb = new THREE.Group(); emb.position.z = .27; root.add(emb);
  emb.add(new THREE.Mesh(new THREE.TorusGeometry(1.02, .045, 12, 90), dark));
  emb.add(new THREE.Mesh(new THREE.TorusGeometry(.92, .015, 8, 90), dark));
  [-.25, .25].forEach(x => { [[.12, .8, -.15], [.1, .17, .34], [.08, .12, .48], [.055, .1, .59]].forEach(([w, h, y]) => { const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, .08), dark); b.position.set(x, y, 0); emb.add(b); });
    const sp = new THREE.Mesh(new THREE.ConeGeometry(.02, .3, 6), dark); sp.position.set(x, .78, 0); emb.add(sp); });
  const br = new THREE.Mesh(new THREE.BoxGeometry(.4, .035, .08), dark); br.position.y = .04; emb.add(br);

  let hold = 0, burstT = -1, gone = false;
  const P = { x: 0, y: 0 };
  return {
    root, wedges,
    point(x, y){ P.x = x; P.y = y; },
    setHold(p){ hold = p; },
    burst(){ burstT = performance.now(); },
    get gone(){ return gone; },
    update(t){
      if (gone) return;
      const s = t / 1000;
      root.rotation.y += ((P.x * .5 + Math.sin(s * .6) * .12) - root.rotation.y) * .06;
      root.rotation.x += ((P.y * .35 + Math.cos(s * .5) * .07) - root.rotation.x) * .06;
      root.position.y = Math.sin(s * 1.1) * .08;
      const k = burstT > 0 ? (performance.now() - burstT) / 1000 : -1;
      if (k < 0){
        // pressure: wedges part along their cracks, the core shows, the seal trembles
        const tr = hold * hold * .05;
        root.position.x = (Math.random() - .5) * tr; root.position.y += (Math.random() - .5) * tr;
        wedges.forEach(w => { w.position.copy(w.userData.dir).multiplyScalar(hold * .09); w.position.z = 0; w.rotation.set(0, 0, 0); });
        core.material.opacity = Math.min(1, hold * 1.4); core.scale.setScalar(2.6 + hold * 1.8);
        wax.emissive.setRGB(.03 + hold * .35, hold * .05, 0); fill.intensity = (1.5 + hold * 14) * Math.PI;
        halo.material.opacity = .16 + hold * .45 + .04 * Math.sin(s * 2);
      } else {
        const e = Math.min(k, 1.6);
        wedges.forEach(w => { w.position.copy(w.userData.dir).multiplyScalar(e * 5); w.position.z = e * 4; w.rotation.set(w.userData.spin.x * e, w.userData.spin.y * e, w.userData.spin.z * e * .4); });
        emb.position.z = .27 + e * 3; emb.rotation.z = e * .8;
        const fade = Math.max(0, 1 - k / 1.1); wax.opacity = fade; dark.opacity = fade;
        core.material.opacity = Math.max(0, 1 - k * 2); core.scale.setScalar(4.4 + k * 30);
        halo.material.opacity = Math.max(0, .9 - k); halo.scale.setScalar(9 + k * 20);
        if (k > 1.7){ gone = true; root.visible = false; }
      }
    }
  };
}
