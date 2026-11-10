/* one 3D stage drawn over the page: the shattering wax seal and a landmark inside every mirror */
import * as THREE from 'three';
import { reduce } from '../lib/util.js';
import { buildLandmark, animateLandmark } from './landmarks.js';

export function createStage(){
  const T=THREE; let R;
  try{ R=new T.WebGLRenderer({antialias:true,alpha:true,powerPreference:'high-performance'}); }catch(e){ return null; }
  R.setPixelRatio(Math.min(1.75,devicePixelRatio||1)); R.outputEncoding=T.sRGBEncoding; R.toneMapping=T.ACESFilmicToneMapping; R.toneMappingExposure=.85; R.setClearColor(0,0);
  const cvs=R.domElement; cvs.id='stage3d'; document.body.appendChild(cvs);
  const pm=new T.PMREMGenerator(R), es=new T.Scene(); es.background=new T.Color(0x08060c);
  [[0xffd7b0,3,4,2,3],[0x7a5cff,-4,1,1,4],[0xff2a3a,2,-3,-3,3],[0xffffff,0,0,6,2],[0x2ad0b0,-3,-2,-4,3]].forEach(([c,x,y,z,s])=>{ const m=new T.Mesh(new T.PlaneGeometry(s,s),new T.MeshBasicMaterial({color:c,side:T.DoubleSide})); m.position.set(x,y,z); m.lookAt(0,0,0); es.add(m); });
  const ENV=pm.fromScene(es,.04).texture;
  const glowTex=(()=>{ const c=document.createElement('canvas'); c.width=c.height=128; const g=c.getContext('2d'); const r=g.createRadialGradient(64,64,0,64,64,64); r.addColorStop(0,'rgba(255,255,255,1)'); r.addColorStop(.25,'rgba(255,255,255,.35)'); r.addColorStop(1,'rgba(255,255,255,0)'); g.fillStyle=r; g.fillRect(0,0,128,128); return new T.CanvasTexture(c); })();
  const glow=(color,size,op=1)=>{ const s=new T.Sprite(new T.SpriteMaterial({map:glowTex,color,transparent:true,opacity:op,blending:T.CustomBlending,blendEquation:T.AddEquation,blendSrc:T.SrcAlphaFactor,blendDst:T.OneFactor,blendSrcAlpha:T.ZeroFactor,blendDstAlpha:T.OneFactor,depthWrite:false})); s.scale.setScalar(size); return s; };
  const items=[];
  const P={x:0,y:0};
  addEventListener('pointermove',e=>{ P.x=e.clientX; P.y=e.clientY; },{passive:true});

  /* the seal: nine wax wedges that fly apart */
  function sealScene(el){
    const scene=new T.Scene(); scene.environment=ENV;
    const cam=new T.PerspectiveCamera(30,1,.1,60); cam.position.set(0,0,9.2);
    scene.add(new T.AmbientLight(0x402030,.6));
    const key=new T.DirectionalLight(0xffd6b8,1.1); key.position.set(2,3,5); scene.add(key);
    const rim=new T.PointLight(0x7a5cff,4,12,2); rim.position.set(-3,2,-2); scene.add(rim);
    const blood=new T.PointLight(0xff2030,6,10,2); blood.position.set(0,0,-1.5); scene.add(blood);
    const root=new T.Group(); scene.add(root);
    const halo=glow(0xff2a2a,6.5,.55); halo.position.z=-1; root.add(halo);
    const wax=new T.MeshPhysicalMaterial({color:0x3a0604,roughness:.3,metalness:0,clearcoat:1,clearcoatRoughness:.12,envMapIntensity:.7,emissive:0x0e0000,emissiveIntensity:.4,transparent:true});
    const dark=new T.MeshPhysicalMaterial({color:0x2a0504,roughness:.5,clearcoat:.6,envMapIntensity:.5,transparent:true});
    const rOf=a=>1.25+.08*Math.sin(a*12)+.035*Math.sin(a*29+1.3);
    const N=9, wedges=[];
    for(let i=0;i<N;i++){
      const a0=i/N*Math.PI*2, a1=(i+1)/N*Math.PI*2, sh=new T.Shape(); sh.moveTo(0,0);
      for(let k=0;k<=14;k++){ const a=a0+(a1-a0)*k/14; sh.lineTo(Math.cos(a)*rOf(a),Math.sin(a)*rOf(a)); } sh.lineTo(0,0);
      const geo=new T.ExtrudeGeometry(sh,{depth:.26,bevelEnabled:true,bevelThickness:.07,bevelSize:.05,bevelSegments:3,curveSegments:6}); geo.translate(0,0,-.13);
      const m=new T.Mesh(geo,wax); const mid=(a0+a1)/2; m.userData={dir:new T.Vector3(Math.cos(mid),Math.sin(mid),0),spin:new T.Vector3(Math.random()-.5,Math.random()-.5,Math.random()-.5).multiplyScalar(6)};
      root.add(m); wedges.push(m);
    }
    const emb=new T.Group(); emb.position.z=.22; root.add(emb);
    const ring=new T.Mesh(new T.TorusGeometry(.82,.035,12,90),dark); emb.add(ring);
    const ring2=new T.Mesh(new T.TorusGeometry(.74,.012,8,90),dark); emb.add(ring2);
    [-.2,.2].forEach(x=>{ [[.1,.66,-.12],[.085,.14,.28],[.065,.1,.4],[.045,.08,.49]].forEach(([w,h,y])=>{ const bb=new T.Mesh(new T.BoxGeometry(w,h,.07),dark); bb.position.set(x,y,0); emb.add(bb); }); const sp=new T.Mesh(new T.ConeGeometry(.016,.24,6),dark); sp.position.set(x,.64,0); emb.add(sp); });
    const br=new T.Mesh(new T.BoxGeometry(.32,.03,.07),dark); br.position.set(0,.03,0); emb.add(br);
    // obsidian shards circling the seal
    const shards=[]; const obs=new T.MeshPhysicalMaterial({color:0x050507,metalness:.6,roughness:.12,clearcoat:1,envMapIntensity:.9});
    for(let i=0;i<22;i++){ const s=new T.Mesh(new T.TetrahedronGeometry(.06+Math.random()*.1,0),obs); s.userData={a:Math.random()*6.283,r:1.8+Math.random()*.9,y:(Math.random()-.5)*1.6,sp:.15+Math.random()*.35}; scene.add(s); shards.push(s); }
    const embers=new T.Group(); scene.add(embers);
    for(let i=0;i<14;i++){ const g=glow(i%3?0xff5a3a:0xb48cff,.18+Math.random()*.2,.9); g.userData={a:Math.random()*6.283,r:1.4+Math.random()*1.4,y:(Math.random()-.5)*2,sp:.2+Math.random()*.4}; embers.add(g); }
    let breakT=-1e9;
    const tilt={x:0,y:0};
    function update(t,rect){
      const s=t/1000, k=(t-breakT)/1000;
      const cxp=rect.left+rect.width/2, cyp=rect.top+rect.height/2; const dx=(P.x-cxp)/innerWidth, dy=(P.y-cyp)/innerHeight;
      tilt.x+=(dx-tilt.x)*.06; tilt.y+=(dy-tilt.y)*.06;
      root.rotation.y=tilt.x*1.4+Math.sin(s*.6)*.12; root.rotation.x=tilt.y*1.1+Math.cos(s*.5)*.08; root.position.y=Math.sin(s*1.1)*.06;
      const near=Math.max(0,1-Math.hypot(P.x-cxp,P.y-cyp)/(rect.width*.7));
      blood.intensity=5+3*Math.sin(s*3.4)*Math.sin(s*1.7)+near*10; halo.material.opacity=.4+near*.35+.1*Math.sin(s*2);
      const brk=k>=0&&k<3.2;
      wedges.forEach(w=>{ if(brk){ const e=Math.min(k,1.6); const out=k<2.2?e:Math.max(0,1.6*(1-(k-2.2)));
          w.position.copy(w.userData.dir).multiplyScalar(out*2.4); w.position.z=out*1.6; w.rotation.set(w.userData.spin.x*out,w.userData.spin.y*out,w.userData.spin.z*out*.4); }
        else { w.position.set(0,0,0); w.rotation.set(0,0,0); } });
      wax.opacity=brk?(k<1.4?1:k<2.2?Math.max(0,1-(k-1.4)/.8):Math.min(1,(k-2.2)/.8)):1; dark.opacity=wax.opacity;
      emb.position.z=.22+(brk&&k<2.2?Math.min(k,1)*1.5:0);
      if(brk&&k<.5){ blood.intensity=40*(1-k*2); halo.scale.setScalar(6.5+k*20); halo.material.opacity=1-k*2; } else halo.scale.setScalar(6.5);
      shards.forEach(sd=>{ const u=sd.userData; u.a+=u.sp*.01*(brk&&k<1?6:1); sd.position.set(Math.cos(u.a)*u.r,u.y+Math.sin(s+u.a)*.1,Math.sin(u.a)*u.r*.6); sd.rotation.x+=.02; sd.rotation.y+=.03; });
      embers.children.forEach(g=>{ const u=g.userData; u.a+=u.sp*.01; g.position.set(Math.cos(u.a)*u.r,u.y+Math.sin(s*.7+u.a)*.3,Math.sin(u.a)*u.r*.5); g.material.opacity=.5+.5*Math.sin(s*3+u.a*5); });
    }
    items.push({el,scene,cam,update});
    return ()=>{ breakT=performance.now(); };
  }

  /* a relic for each journey, floating inside its mirror */
  const CFG={lantern:'#FFB65C',starfall:'#9FB0FF',feast:'#FF4D5E',echo:'#5FE0C8'};
  function relicScene(el,kind){
    const scene=new T.Scene(); scene.environment=ENV;
    const cam=new T.PerspectiveCamera(30,1,.1,60); cam.position.set(0,0,6.8);
    const col=new T.Color(CFG[kind]);
    scene.add(new T.AmbientLight(0x404060,.5)); const key=new T.DirectionalLight(0xffffff,1); key.position.set(2,3,4); scene.add(key);
    const core=new T.PointLight(col,7,8,2); scene.add(core);
    const g=new T.Group(); scene.add(g);
    const lm=buildLandmark(T,kind,col,glow); g.add(lm.group); const parts=lm.parts;
    const heart=glow(col,2.4,.45); heart.position.z=-1; g.add(heart);
    function update(t,rect){ const s=t/1000; const hover=rect.left<P.x&&P.x<rect.right&&rect.top<P.y&&P.y<rect.bottom;
      g.rotation.y=s*.35+(hover?(P.x-rect.left)/rect.width-.5:0)*1.2; g.rotation.x=Math.sin(s*.5)*.06+(hover?(P.y-rect.top)/rect.height-.5:0)*.5; g.position.y=Math.sin(s*.9+kind.length)*.06;
      const sc=hover?1.12:1; g.scale.lerp(new T.Vector3(sc,sc,sc),.08);
      core.intensity=6+3*Math.sin(s*2+kind.length)+(hover?8:0); heart.material.opacity=.6+.3*Math.sin(s*2.4)+(hover?.3:0);
      animateLandmark(parts,s);
    }
    items.push({el,scene,cam,update});
  }

  function resize(){ R.setSize(innerWidth,innerHeight,false); }
  addEventListener('resize',resize); resize();
  function frame(t){
    R.setScissorTest(false); R.clear(); R.setScissorTest(true);
    if(!document.body.classList.contains('app-open')) items.forEach(it=>{ const r=it.el.getBoundingClientRect(); if(r.bottom<-50||r.top>innerHeight+50||r.width<2) return;
      const pad=it.pad||0, x=r.left-pad, y=innerHeight-r.bottom-pad, w=r.width+pad*2, h=r.height+pad*2;
      R.setViewport(x,y,w,h); R.setScissor(x,y,w,h); it.cam.aspect=w/h; it.cam.updateProjectionMatrix(); it.update(t,r); R.render(it.scene,it.cam); });
    if(!reduce) requestAnimationFrame(frame);
  }
  return {
    seal(el){ const b=sealScene(el); items[items.length-1].pad=Math.round(el.getBoundingClientRect().width*.35); return b; },
    relic(el,kind){ relicScene(el,kind); },
    start(){ requestAnimationFrame(frame); }
  };
}
