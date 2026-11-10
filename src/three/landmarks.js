/* KL landmarks in glass and brass, one per journey. T is the three.js namespace */
export function buildLandmark(T,kind,col,glowFn){
  const g=new T.Group(), parts={spin:[],waves:[],hands:[]};
  const glass=new T.MeshPhysicalMaterial({color:col.clone().lerp(new T.Color('#ffffff'),.25),roughness:.05,metalness:0,transmission:.85,transparent:true,opacity:.82,clearcoat:1,envMapIntensity:2.2,emissive:col,emissiveIntensity:.22,side:T.DoubleSide});
  const brass=new T.MeshStandardMaterial({color:0xd6b98a,metalness:1,roughness:.24,envMapIntensity:1.6});
  const copper=new T.MeshStandardMaterial({color:0xb8734a,metalness:1,roughness:.3,envMapIntensity:1.4});
  const lines=(geo,o=.7)=>new T.LineSegments(new T.EdgesGeometry(geo),new T.LineBasicMaterial({color:0xe8d2a8,transparent:true,opacity:o}));
  const add=(geo,mat,x,y,z=0,edge=false)=>{ const m=new T.Mesh(geo,mat); m.position.set(x,y,z); g.add(m); if(edge){ const l=lines(geo,.55); l.position.copy(m.position); g.add(l); } return m; };
  const beacon=(x,y,z=0)=>{ if(!glowFn) return; const b=glowFn(0xff2a2a,.45,1); b.position.set(x,y,z); b.userData.beacon=true; g.add(b); parts.beacons=(parts.beacons||[]).concat(b); };
  if(kind==='starfall'){ // Petronas Twin Towers
    [-.36,.36].forEach(x=>{
      [[.27,1.5,-.55],[.23,.34,.37],[.19,.24,.66],[.14,.18,.87],[.09,.12,1.02]].forEach(([r,h,y])=>add(new T.CylinderGeometry(r*.92,r,h,8),glass,x,y,0,true));
      add(new T.ConeGeometry(.035,.5,8),brass,x,1.33); beacon(x,1.6);
    });
    add(new T.BoxGeometry(.5,.05,.1),brass,0,.05);
    [-1,1].forEach(sd=>{ const l=add(new T.BoxGeometry(.03,.32,.03),brass,sd*.12,-.08); l.rotation.z=sd*.6; });
    g.position.y=-.15; g.scale.setScalar(1.05);
  } else if(kind==='lantern'){ // Sultan Abdul Samad clock tower
    add(new T.BoxGeometry(1.9,.55,.5),glass,0,-.95,0,true);
    for(let i=-3;i<=3;i++){ if(i===0) continue; add(new T.TorusGeometry(.08,.012,6,16,Math.PI),brass,i*.25,-.95,.26); }
    add(new T.BoxGeometry(.36,1.1,.36),glass,0,-.15,0,true);
    const face=add(new T.CylinderGeometry(.13,.13,.02,32),brass,0,.2,.19); face.rotation.x=Math.PI/2;
    const hand=add(new T.BoxGeometry(.015,.1,.01),new T.MeshBasicMaterial({color:0x1a0a06}),0,.2,.205); hand.geometry.translate(0,.05,0); parts.hands.push(hand);
    if(glowFn){ const fg=glowFn(col,.9,.8); fg.position.set(0,.2,.25); g.add(fg); }
    add(new T.CylinderGeometry(.22,.22,.12,16),glass,0,.48,0,true);
    const dome=add(new T.SphereGeometry(.24,24,16,0,Math.PI*2,0,Math.PI/2),copper,0,.54); dome.scale.y=1.25;
    add(new T.ConeGeometry(.03,.3,8),brass,0,.98);
    [-.75,.75].forEach(x=>{ add(new T.BoxGeometry(.2,.35,.2),glass,x,-.5,0,true); const d=add(new T.SphereGeometry(.13,16,12,0,Math.PI*2,0,Math.PI/2),copper,x,-.33); d.scale.y=1.3; });
    g.position.y=.05;
  } else if(kind==='feast'){ // a Jalan Alor paper lantern
    const body=add(new T.SphereGeometry(.68,40,30),glass,0,0); body.scale.set(1,.82,1);
    for(let i=0;i<8;i++){ const r=new T.Mesh(new T.TorusGeometry(.685,.01,6,60),brass); r.rotation.y=i/8*Math.PI; r.scale.set(1,.82,1); g.add(r); }
    add(new T.CylinderGeometry(.26,.3,.12,24),brass,0,.6); add(new T.CylinderGeometry(.3,.26,.12,24),brass,0,-.6);
    add(new T.CylinderGeometry(.008,.008,.8,6),brass,0,1.05);
    for(let i=0;i<5;i++){ const tt=add(new T.CylinderGeometry(.012,.004,.45,6),new T.MeshStandardMaterial({color:0xc8241f,roughness:.6}),(i-2)*.035,-.92); }
    g.position.y=-.05;
  } else { // Menara Kuala Lumpur, the KL Tower
    add(new T.ConeGeometry(.42,.5,6),glass,0,-1.3,0,true);
    add(new T.CylinderGeometry(.075,.11,1.7,12),glass,0,-.3,0,true);
    const pod=add(new T.SphereGeometry(.36,32,20),glass,0,.66); pod.scale.set(1,.55,1);
    [.58,.66,.74].forEach(y=>{ const r=new T.Mesh(new T.TorusGeometry(.355,.012,8,60),brass); r.rotation.x=Math.PI/2; r.position.y=y; g.add(r); });
    add(new T.CylinderGeometry(.05,.07,.2,12),brass,0,.92);
    add(new T.CylinderGeometry(.012,.02,.9,8),brass,0,1.45); beacon(0,1.92);
    for(let i=0;i<3;i++){ const w=new T.Mesh(new T.TorusGeometry(.2,.008,6,64),new T.MeshBasicMaterial({color:col,transparent:true,opacity:.8})); w.rotation.x=Math.PI/2; w.position.y=1.85; w.userData.ph=i/3; g.add(w); parts.waves.push(w); }
    g.position.y=-.1; g.scale.setScalar(.95);
  }
  return {group:g,parts};
}
export function animateLandmark(parts,s){
  if(parts.hands) parts.hands.forEach(h=>h.rotation.z=-s*.6);
  if(parts.waves) parts.waves.forEach(w=>{ const k=(s*.45+w.userData.ph)%1; w.scale.setScalar(1+k*5); w.material.opacity=.8*(1-k); });
  if(parts.beacons) parts.beacons.forEach((b,i)=>{ b.material.opacity=Math.sin(s*3.2+i)>.2?1:.12; });
}
