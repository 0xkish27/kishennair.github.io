/* the floating glass landmark shown inside the game screens (three.js + bloom) */
import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { reduce } from '../lib/util.js';
import { buildLandmark, animateLandmark } from './landmarks.js';

function createRelic(){
  const NOOP={set(){},mount(){},unmount(){},pulse(){},point(){}};
  const T=THREE;
  let renderer;
  try{ renderer=new T.WebGLRenderer({antialias:true,alpha:false,powerPreference:'high-performance'}); }catch(e){ return NOOP; }
  renderer.setPixelRatio(Math.min(2,devicePixelRatio||1));
  renderer.outputEncoding=T.sRGBEncoding; renderer.toneMapping=T.ACESFilmicToneMapping; renderer.toneMappingExposure=.95; renderer.setClearColor(0x05050d,1);
  const el=renderer.domElement; el.className='relic-canvas';
  const scene=new T.Scene(); scene.fog=new T.FogExp2(0x05050d,.07);
  const cam=new T.PerspectiveCamera(32,1,.1,50); cam.position.set(0,.1,6.9);
  // a small studio of coloured light panels, baked into reflections
  const pm=new T.PMREMGenerator(renderer), es=new T.Scene(); es.background=new T.Color(0x0a0a18);
  [[0xffe9c0,3,4,2,3],[0x8f7dff,-4,1,1,4],[0x50d0c0,2,-3,-3,3],[0xffffff,0,0,6,2],[0xff9a70,-3,-2,-4,3]].forEach(([c,x,y,z,s])=>{ const m=new T.Mesh(new T.PlaneGeometry(s,s),new T.MeshBasicMaterial({color:c,side:T.DoubleSide})); m.position.set(x,y,z); m.lookAt(0,0,0); es.add(m); });
  scene.environment=pm.fromScene(es,.04).texture;
  scene.add(new T.AmbientLight(0x6060a0,.35));
  const key=new T.DirectionalLight(0xfff0d0,1.1); key.position.set(3,4,5); scene.add(key);
  const core=new T.PointLight(0xffb65c,6,9,2); scene.add(core);
  const group=new T.Group(); scene.add(group);
  // drifting dust around the artefact
  const N=480, pos=new Float32Array(N*3);
  for(let i=0;i<N;i++){ const r=1.9+Math.random()*2.8, a=Math.random()*6.283, b=Math.acos(2*Math.random()-1); pos[i*3]=r*Math.sin(b)*Math.cos(a); pos[i*3+1]=r*Math.cos(b)*.55; pos[i*3+2]=r*Math.sin(b)*Math.sin(a); }
  const pg=new T.BufferGeometry(); pg.setAttribute('position',new T.BufferAttribute(pos,3));
  const dust=new T.Points(pg,new T.PointsMaterial({size:.03,color:0xfff2d0,transparent:true,opacity:.85,blending:T.AdditiveBlending,depthWrite:false})); scene.add(dust);
  const useComp=true;
  let composer=null, bloom=null;
  if(useComp){ composer=new EffectComposer(renderer); composer.addPass(new RenderPass(scene,cam)); bloom=new UnrealBloomPass(new T.Vector2(256,256),.95,.6,.24); composer.addPass(bloom); }
  const CFG={lantern:'#FFB65C',starfall:'#9FB0FF',feast:'#FF7A86',echo:'#7FD6C8'};
  let parts={}, accent=new T.Color('#C8443F'), kind='';
  function clear(){ while(group.children.length){ const c=group.children.pop(); c.traverse(o=>{ if(o.geometry) o.geometry.dispose(); if(o.material) o.material.dispose(); }); } parts={}; }
  function build(k){
    clear(); kind=k; const col=new T.Color(CFG[k]||'#C8443F'); accent=col.clone();
    const dot=(c,size,op)=>new T.Mesh(new T.SphereGeometry(Math.max(.03,size*.07),12,12),new T.MeshBasicMaterial({color:new T.Color(c).multiplyScalar(2),transparent:true,opacity:op}));
    const lm=buildLandmark(T,k,col,dot); group.add(lm.group); parts=lm.parts;
    const heart=new T.Mesh(new T.SphereGeometry(.1,16,16),new T.MeshBasicMaterial({color:col.clone().multiplyScalar(2.4)})); heart.position.z=-.6; group.add(heart); parts.heart=heart;
    core.color.copy(col); dust.material.color.copy(col.clone().lerp(new T.Color('#fff4dc'),.6));
  }
  let host=null, ro=null, raf=0, running=false, kick=0, shake=0;
  const tilt={x:0,y:0}, tt={x:0,y:0}, red=new T.Color('#ff3b3b');
  function size(){ if(!host) return; const w=Math.max(1,host.clientWidth), h=Math.max(1,host.clientHeight); renderer.setSize(w,h,false); if(composer){ composer.setSize(w,h); } cam.aspect=w/h; cam.updateProjectionMatrix(); draw(performance.now()); }
  function draw(t){
    const s=t/1000; kick*=.94; shake*=.9; tilt.x+=(tt.x-tilt.x)*.06; tilt.y+=(tt.y-tilt.y)*.06;
    group.rotation.y=s*.32+tilt.x*.7; group.rotation.x=Math.sin(s*.4)*.05+tilt.y*.3; group.position.y=Math.sin(s*.9)*.07; group.position.x=(Math.random()-.5)*shake*.18;
    group.scale.setScalar(1+kick*.32);
    animateLandmark(parts,s);
    if(parts.heart) parts.heart.scale.setScalar(1+.14*Math.sin(s*2.2)+kick*1.5);
    core.intensity=5+2*Math.sin(s*2.2)+kick*30; core.color.copy(accent).lerp(red,Math.min(1,shake*1.6));
    if(bloom) bloom.strength=1+kick*2.4+shake*.8;
    dust.rotation.y=s*.05; dust.scale.setScalar(1+kick*.45);
    composer?composer.render():renderer.render(scene,cam);
  }
  function frame(t){ if(!running) return; raf=requestAnimationFrame(frame); if(!document.hidden) draw(t); }
  return {
    set(k){ if(k!==kind) build(k); },
    mount(container){
      if(host!==container){ host=container; host.appendChild(el); if(ro) ro.disconnect(); ro=new ResizeObserver(size); ro.observe(host); size(); }
      if(reduce){ draw(2000); return; }
      if(!running){ running=true; raf=requestAnimationFrame(frame); }
    },
    unmount(){ running=false; cancelAnimationFrame(raf); if(ro) ro.disconnect(); ro=null; if(el.parentNode) el.parentNode.removeChild(el); host=null; },
    pulse(type){ if(type==='ok') kick=1; else shake=1; if(reduce&&host) draw(2000); },
    point(x,y){ tt.x=x; tt.y=y; }
  };
}

export const Relic = createRelic();
