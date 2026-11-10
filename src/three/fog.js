/* volumetric fog: a raymarched tunnel of colour-shifting smoke and the KL skyline behind the whole site (raw WebGL) */
import { $, reduce } from '../lib/util.js';

const SYN=29.530588853;
export const phase=(((Date.now()/864e5-Date.UTC(2000,0,6,18,14)/864e5)%SYN)+SYN)%SYN/SYN;
export const illum=(1-Math.cos(2*Math.PI*phase))/2;

let burstT=-1e9;
export function fogBurst(){ burstT=performance.now(); }
let W=0,H=0,SC=1,mx=.5,my=.5,tmx=.5,tmy=.5,mood=0;
const VS='attribute vec2 a;void main(){gl_Position=vec4(a,0.,1.);}';
const FS=`precision highp float;
uniform vec2 uRes;uniform float uTime;uniform vec2 uMouse;uniform float uScroll;uniform float uMood;uniform float uBurst;
float h3(vec3 p){p=fract(p*.3183099+.1);p*=17.;return fract(p.x*p.y*p.z*(p.x+p.y+p.z));}
float n3(vec3 x){vec3 i=floor(x),f=fract(x);f=f*f*(3.-2.*f);
 return mix(mix(mix(h3(i),h3(i+vec3(1,0,0)),f.x),mix(h3(i+vec3(0,1,0)),h3(i+vec3(1,1,0)),f.x),f.y),
            mix(mix(h3(i+vec3(0,0,1)),h3(i+vec3(1,0,1)),f.x),mix(h3(i+vec3(0,1,1)),h3(i+vec3(1,1,1)),f.x),f.y),f.z);}
float fbm(vec3 p){float v=0.,a=.5;for(int i=0;i<4;i++){v+=a*n3(p);p=p*2.03+vec3(1.7,9.2,3.1);a*=.5;}return v;}
vec3 pal(float t){return .5+.5*cos(6.2831*(t+vec3(0.,.33,.67)));}
float hs1(float n){return fract(sin(n*91.345)*47453.1);}
float bx(vec2 p,vec2 c,vec2 h){vec2 d=abs(p-c)-h;return step(max(d.x,d.y),0.);}
float beac(vec2 p,vec2 c,float ph){vec2 d=p-c;return exp(-dot(d,d)*7000.)*step(0.,sin(uTime*2.8+ph));}
float sky(vec2 p,float A,out float win,out float bc,out float mono){
  float m=0.;bc=0.;
  float cw=.05;float ci=floor(p.x/cw);float fx=fract(p.x/cw);float hh=.03+hs1(ci)*hs1(ci+7.)*.2;
  m=max(m,step(0.,p.y)*step(p.y,hh)*step(.06,fx)*step(fx,.94));
  float PX=-.3*A;
  for(int i=0;i<2;i++){float c=PX+(i==0?-.055:.055);
    m=max(m,bx(p,vec2(c,.2),vec2(.026,.2)));m=max(m,bx(p,vec2(c,.43),vec2(.021,.03)));m=max(m,bx(p,vec2(c,.485),vec2(.016,.025)));m=max(m,bx(p,vec2(c,.525),vec2(.011,.015)));m=max(m,bx(p,vec2(c,.6),vec2(.0022,.06)));
    bc+=beac(p,vec2(c,.662),float(i));}
  m=max(m,bx(p,vec2(PX,.255),vec2(.05,.005)));
  float KX=.1*A;
  m=max(m,bx(p,vec2(KX,.17),vec2(.0065,.17)));m=max(m,step(length((p-vec2(KX,.36))/vec2(.034,.02)),1.));m=max(m,bx(p,vec2(KX,.335),vec2(.012,.012)));m=max(m,bx(p,vec2(KX,.45),vec2(.0016,.07)));
  bc+=beac(p,vec2(KX,.522),1.3);
  float MX=.33*A;float yy=clamp(p.y/.58,0.,1.);
  m=max(m,step(abs(p.x-MX),mix(.04,.01,yy))*step(0.,p.y)*step(p.y,.58));m=max(m,bx(p,vec2(MX,.68),vec2(.0018,.1)));
  bc+=beac(p,vec2(MX,.783),2.6);
  float SX=-.08*A;
  m=max(m,bx(p,vec2(SX,.035),vec2(.06,.035)));m=max(m,bx(p,vec2(SX,.1),vec2(.011,.04)));
  m=max(m,step(length((p-vec2(SX,.14))/vec2(.015,.022)),1.)*step(.14,p.y));
  m=max(m,step(length((p-vec2(SX-.045,.07))/vec2(.01,.015)),1.)*step(.07,p.y));
  m=max(m,step(length((p-vec2(SX+.045,.07))/vec2(.01,.015)),1.)*step(.07,p.y));
  vec2 wc=floor(p/vec2(.007,.011));vec2 wf=fract(p/vec2(.007,.011));
  float lit=step(.8,fract(sin(dot(wc,vec2(12.9898,78.233))+floor(uTime*.12+hs1(wc.x)*9.)*1.7)*43758.5453));
  win=m*lit*step(.2,wf.x)*step(wf.x,.8)*step(.25,wf.y)*step(wf.y,.75)*step(.012,p.y);
  float tx=fract(uTime*.03)*A*1.4-A*.7;
  mono=exp(-pow((p.x-tx)/.03,2.)-pow((p.y-.077)/.004,2.))+exp(-pow((p.x-tx-.05)/.012,2.)-pow((p.y-.077)/.003,2.))*.6;
  m=max(m,step(abs(p.y-.071),.0016));
  return m;
}
void main(){
  vec2 uv=(gl_FragCoord.xy-.5*uRes)/uRes.y;float T=uTime;
  vec2 m=(uMouse-.5)*vec2(1.3,.9);
  vec3 ro=vec3(sin(T*.07)*.3,cos(T*.05)*.2,T*.32+uScroll*.0035);
  vec3 rd=normalize(vec3(uv+m*.22,1.15));
  float a=sin(T*.045)*.25;rd.xy=mat2(cos(a),-sin(a),sin(a),cos(a))*rd.xy;
  vec3 col=vec3(0.);float tr=1.;float t=.3;
  for(int i=0;i<34;i++){
    vec3 p=ro+rd*t;
    float tun=length(p.xy)-.95-.35*sin(p.z*.6+T*.25);
    float d=fbm(p*1.15+vec3(0.,T*.09,T*.03));
    float dens=smoothstep(.42,.86,d)*smoothstep(-.7,.5,tun+d*.7);
    if(dens>.01){
      float hue=fract(p.z*.045+T*.03+uMood*.7+d*.25);
      vec3 c=pal(hue);
      c=mix(c*c*1.4,vec3(.55,.02,.06),.3);
      vec3 lp=vec3(m*1.6,ro.z+2.2);
      float l=1.4/(1.+dot(p-lp,p-lp)*1.8);
      vec3 lit=c*(.18+l)+vec3(1.,.25,.12)*pow(d,7.)*1.6;
      float ab=dens*.2;col+=tr*ab*lit;tr*=1.-ab;
      if(tr<.04)break;
    }
    t+=.13+t*.045;
  }
  float A=uRes.x/uRes.y;
  vec2 kp=vec2(uv.x+(uMouse.x-.5)*.035,uv.y+.5+min(uScroll*.00045,.38)-(uMouse.y-.5)*.015);
  float win,bc,mono;float sk=sky(kp,A,win,bc,mono);
  float front=1.-tr;
  vec3 city=vec3(.006,.003,.006)+vec3(1.,.74,.45)*win*.6;
  col=mix(col,city+col*.1,sk*(1.-front*.5));
  col+=vec3(1.,.1,.06)*bc*1.3+vec3(1.,.86,.62)*mono*1.4*(1.-front*.4);
  col+=vec3(.4,.1,.16)*exp(-max(kp.y,0.)*12.)*.16;
  float beat=pow(max(0.,sin(T*1.7)),14.)+pow(max(0.,sin(T*1.7-.45)),14.)*.55;
  float fl=fract(T*.37);float flash=step(.93,fract(sin(floor(T*.37)*12.989)*43758.5))*exp(-fl*14.)*(1.-step(.2,fl));
  col+=vec3(.45,0.,.03)*beat*.09;
  col+=vec3(.75,.7,1.)*flash*.45*(1.-sk*.97);
  col+=vec3(1.,.3,.15)*uBurst*.25;
  vec2 q=gl_FragCoord.xy/uRes;float v=smoothstep(1.15,.2,length((q-.5)*vec2(uRes.x/uRes.y*.75,1.)));
  col*=mix(.12,1.,v)*(1.-beat*.05);
  col=pow(col,vec3(.92));
  col+=(fract(sin(dot(gl_FragCoord.xy+fract(T)*97.,vec2(12.9898,78.233)))*43758.5453)-.5)*.045;
  gl_FragColor=vec4(col,1.);
}`;

export function initFog(){
const cv=$('#cosmos');
const gl=cv.getContext('webgl',{antialias:false,alpha:false,powerPreference:'high-performance'});
let prog=null,U={};
if(gl){
  const sh=(type,src)=>{const s=gl.createShader(type);gl.shaderSource(s,src);gl.compileShader(s);return gl.getShaderParameter(s,gl.COMPILE_STATUS)?s:null;};
  const vs=sh(gl.VERTEX_SHADER,VS), fs=sh(gl.FRAGMENT_SHADER,FS);
  if(vs&&fs){ prog=gl.createProgram(); gl.attachShader(prog,vs); gl.attachShader(prog,fs); gl.linkProgram(prog); if(!gl.getProgramParameter(prog,gl.LINK_STATUS)) prog=null; }
  if(prog){ gl.useProgram(prog); const b=gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER,b); gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,3,-1,-1,3]),gl.STATIC_DRAW);
    const loc=gl.getAttribLocation(prog,'a'); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc,2,gl.FLOAT,false,0,0);
    ['uRes','uTime','uMouse','uMood','uScroll','uBurst'].forEach(k=>U[k]=gl.getUniformLocation(prog,k)); }
}
if(!prog) cv.style.display='none';
function sizeCosmos(){ W=innerWidth; H=innerHeight; SC=(W<700?.32:.42)*Math.min(1.5,devicePixelRatio||1); cv.width=Math.round(W*SC); cv.height=Math.round(H*SC); if(prog) gl.viewport(0,0,cv.width,cv.height); }
function drawCosmos(t){
  if(!prog) return;
  tmx+=(mx-tmx)*.04; tmy+=(my-tmy)*.04;
  const docH=Math.max(1,document.documentElement.scrollHeight-H); mood+=((scrollY/docH)-mood)*.05;
  const k=(performance.now()-burstT)/1400, bu=k>0&&k<1?Math.sin(k*Math.PI)*(1-k):0;
  gl.uniform2f(U.uRes,cv.width,cv.height); gl.uniform1f(U.uTime,t/1000); gl.uniform2f(U.uMouse,tmx,tmy);
  gl.uniform1f(U.uMood,mood); gl.uniform1f(U.uScroll,scrollY); gl.uniform1f(U.uBurst,bu);
  gl.drawArrays(gl.TRIANGLES,0,3);
}
addEventListener('pointermove',e=>{ mx=e.clientX/W; my=1-e.clientY/H; },{passive:true});
addEventListener('resize',()=>{ sizeCosmos(); drawCosmos(performance.now()); });
sizeCosmos();
if(reduce){ drawCosmos(6000); addEventListener('scroll',()=>drawCosmos(6000),{passive:true}); }
else { const loop=t=>{ if(!document.hidden) drawCosmos(t); requestAnimationFrame(loop); }; requestAnimationFrame(loop); }
}
