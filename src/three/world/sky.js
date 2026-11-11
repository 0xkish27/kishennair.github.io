/* The night sky over KL: a dome with stars and tonight's real moon, and a sea of clouds lit red from below by the city. */
import * as THREE from 'three';
import { NOISE } from './glsl.js';

export function buildSky(scene, U, moonPhase){
  // the moon sits low in the east-north-east, where the camera looks on the way down
  const moonDir = new THREE.Vector3(.35, .32, -1).normalize();
  // light direction across the moon's face from the phase: 0 new, .5 full
  const a = moonPhase * Math.PI * 2;
  const dome = new THREE.Mesh(new THREE.SphereGeometry(1800, 48, 24), new THREE.ShaderMaterial({
    side: THREE.BackSide, depthWrite: false,
    uniforms: { uTime: U.uTime, uMoonDir: { value: moonDir }, uPhase: { value: new THREE.Vector2(Math.sin(a), -Math.cos(a)) }, uFogColor: U.uFogColor },
    vertexShader: `varying vec3 vDir; void main(){ vDir = normalize((modelMatrix * vec4(position, 1.)).xyz - cameraPosition); gl_Position = projectionMatrix * viewMatrix * modelMatrix * vec4(position, 1.); gl_Position.z = gl_Position.w; }`,
    fragmentShader: `uniform float uTime; uniform vec3 uMoonDir; uniform vec2 uPhase; uniform vec3 uFogColor; varying vec3 vDir;
      ${NOISE}
      void main(){
        vec3 d = normalize(vDir); float h = d.y;
        vec3 zen = vec3(.002, .0015, .006), hor = vec3(.045, .007, .012);
        vec3 col = mix(hor, zen, smoothstep(-.05, .55, h));
        col += vec3(.16, .018, .02) * exp(-max(h, 0.) * 10.) * .55;            // city glow on the horizon
        col = mix(uFogColor, col, smoothstep(-.12, .06, h));                 // horizon melts into the fog
        // stars: a hashed grid on the sphere, twinkling
        vec3 sp = d * 260.; vec3 cell = floor(sp); float s = h31(cell);
        if (s > .985 && h > .04){ vec3 c = cell + .5 + (vec3(h31(cell + 1.), h31(cell + 2.), h31(cell + 3.)) - .5) * .6; float g = smoothstep(.55, 0., length(sp - c));
          col += vec3(1., .92, .85) * g * (1.2 + 1.5 * fract(s * 97.)) * (.6 + .4 * sin(uTime * (1. + s * 3.) + s * 50.)) * smoothstep(.04, .3, h); }
        // the moon: a lit sphere seen face on, shaded by tonight's phase, with a halo
        float md = acos(clamp(dot(d, uMoonDir), -1., 1.)); float R = .045;
        vec3 right = normalize(cross(uMoonDir, vec3(0., 1., 0.))), up = cross(right, uMoonDir);
        vec2 q = vec2(dot(d - uMoonDir, right), dot(d - uMoonDir, up)) / R;
        if (md < R * 1.02){ float z = sqrt(max(0., 1. - dot(q, q))); vec3 n = vec3(q, z);
          float lit = clamp(dot(n, normalize(vec3(uPhase.x, 0., uPhase.y))) * 4. + .5, 0., 1.);
          float mar = fbm3(vec3(q * 3., 1.)) ; vec3 mc = mix(vec3(2.2, 2.05, 1.85), vec3(1.4, 1.3, 1.2), smoothstep(.45, .7, mar));
          col = mix(col, mc * lit + vec3(.02, .015, .02), smoothstep(R * 1.02, R * .96, md)); }
        col += vec3(1., .82, .7) * .35 * exp(-md * 18.) * (.25 + .75 * smoothstep(-1., 1., uPhase.y * -1.));
        gl_FragColor = vec4(col, 1.);
      }`
  }));
  dome.renderOrder = -10; dome.frustumCulled = false; scene.add(dome);

  // two layers of cloud: holes reveal the city, undersides glow crimson from its light
  const clouds = [];
  [[118, .0, 1.], [134, 7.3, .75]].forEach(([y, seed, op]) => {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(2600, 2600, 1, 1), new THREE.ShaderMaterial({
      transparent: true, depthWrite: false, side: THREE.DoubleSide,
      uniforms: { uTime: U.uTime, uSeed: { value: seed }, uOp: { value: op }, uMoonDir: { value: moonDir } },
      vertexShader: `varying vec3 vW; void main(){ vec4 w = modelMatrix * vec4(position, 1.); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }`,
      fragmentShader: `uniform float uTime, uSeed, uOp; uniform vec3 uMoonDir; varying vec3 vW; ${NOISE}
        void main(){
          vec2 p = vW.xz * .0055 + vec2(uTime * .006, uTime * .002) + uSeed;
          float n = fbm(vec3(p, uTime * .01 + uSeed));
          float a = smoothstep(.46, .78, n);
          float r = length(vW.xz);
          float glow = exp(-r * .004);                                        // the city lights the cloud from below
          bool below = cameraPosition.y < vW.y;
          vec3 under = vec3(.42, .04, .035) * glow * 1.2 + vec3(.025, .01, .02);
          vec3 top = vec3(.07, .065, .09) + vec3(.3, .27, .25) * smoothstep(.55, .85, n) * .6;   // moonlit tops
          vec3 col = below ? under : mix(top * .55, under * .8, .35);
          col *= .55 + .9 * smoothstep(.5, .9, n);
          float fade = exp(-length(vW - cameraPosition) * .0011);
          float near = smoothstep(4., 30., abs(cameraPosition.y - vW.y));     // thin out as we pass through
          gl_FragColor = vec4(col, a * uOp * fade * mix(.25, 1., near) * .92);
        }`
    }));
    m.rotation.x = -Math.PI / 2; m.position.y = y; m.renderOrder = 5; scene.add(m); clouds.push(m);
  });
  return { dome, clouds, moonDir };
}
