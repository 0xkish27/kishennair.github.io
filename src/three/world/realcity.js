/* The real Kuala Lumpur: Google's photorealistic 3D tiles, streamed in as you fly, and re-lit as night.
   The capture is daytime, so every tile gets a night shader: moonlight from above, the city's crimson glow
   from below, lit windows on tall facades, sodium light at street level, and the four landmarks floodlit
   the way they are in real night photographs. World units are 10 m, like the rest of the scene. */
import * as THREE from 'three';
import { TilesRenderer } from '3d-tiles-renderer';
import { GoogleCloudAuthPlugin, ReorientationPlugin, TilesFadePlugin, TileCompressionPlugin, UnloadTilesPlugin } from '3d-tiles-renderer/plugins';
import { NOISE, FOG } from './glsl.js';

export const ORIGIN = { lat: 3.1500, lon: 101.7030 };
const D2R = Math.PI / 180, UNIT = 10;
export function toLocal(lat, lon){
  return [(lon - ORIGIN.lon) * 111320 * Math.cos(ORIGIN.lat * D2R) / UNIT, -(lat - ORIGIN.lat) * 110574 / UNIT];
}
// real landmark positions (lat, lon), in world units
export const REAL = {
  petronas: toLocal(3.15785, 101.71165), kltower: toLocal(3.15278, 101.70389), merdeka: toLocal(3.14185, 101.70056),
  samad: toLocal(3.14868, 101.69444), bintang: toLocal(3.14879, 101.71335)
};
// floodlights: [x, z, radius, minHeight, maxHeight, r, g, b, mode]  mode 0 steady, 1 colour-cycling
const FLOODS = [
  [...REAL.petronas, 8.5, 2, 60, 1.6, 1.75, 2.2, 0],
  [...REAL.kltower, 2.6, 8, 60, .4, 1.6, 1.5, 1],
  [...REAL.merdeka, 6.5, 2, 90, 1.9, 1.5, .9, 0],
  [...REAL.samad, 8, 0, 6, 1.7, .95, .45, 0]
];

function nightMaterial(map, U){
  return new THREE.ShaderMaterial({
    uniforms: { map: { value: map }, uTime: U.uTime, uFogColor: U.uFogColor, uFogDensity: U.uFogDensity, uGround: U.uGround,
      uF: { value: FLOODS.map(f => new THREE.Vector4(f[0], f[1], f[2], f[3])) }, uFH: { value: FLOODS.map(f => new THREE.Vector4(f[4], f[5], f[6], f[7])) }, uFM: { value: FLOODS.map(f => f[8]) } },
    vertexShader: `varying vec2 vUv; varying vec3 vW; void main(){ vUv = uv; vec4 w = modelMatrix * vec4(position, 1.); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }`,
    fragmentShader: `uniform sampler2D map; uniform float uTime, uGround; uniform vec4 uF[4]; uniform vec4 uFH[4]; uniform float uFM[4];
      varying vec2 vUv; varying vec3 vW; ${NOISE} ${FOG}
      void main(){
        vec3 tex = texture2D(map, vUv).rgb;
        float lum = dot(tex, vec3(.3, .59, .11));
        vec3 n = normalize(cross(dFdx(vW), dFdy(vW)));
        float up = clamp(n.y, 0., 1.), vert = 1. - up, h = vW.y - uGround;
        // ambient night: cool moonlight on roofs, the city's red glow on walls
        vec3 col = tex * (vec3(.05, .046, .075) * up + vec3(.085, .024, .022) * vert) * 1.2;
        // sodium light pooling at street level, strongest on flat ground
        col += tex * vec3(.55, .2, .07) * exp(-max(h, 0.) * .55) * (.35 + .65 * up);
        // lit windows on the walls of tall buildings
        if (vert > .6 && h > .6){
          float u = abs(n.x) > abs(n.z) ? vW.z : vW.x;
          vec2 g = vec2(u / .32, h / .36), c = floor(g), f = fract(g);
          float win = step(.18, f.x) * step(f.x, .82) * step(.22, f.y) * step(f.y, .72);
          float r = h21(c + floor(vW.xz * .02) * 17.);
          float lit = step(.72, r) * step(1.4, h);
          vec3 wc = r > .97 ? vec3(.8, .95, 1.8) : vec3(1.7, 1.05, .55);
          float far = smoothstep(80., 300., length(vW - cameraPosition));
          col += mix(wc * lit * win * (.45 + .9 * lum), wc * .07, far) * smoothstep(.6, .9, vert);
        }
        // the landmarks, floodlit: their real facades glow
        for (int i = 0; i < 4; i++){
          float d = length(vW.xz - uF[i].xy);
          float m = (1. - smoothstep(uF[i].z * .7, uF[i].z, d)) * step(uF[i].w, h) * step(h, uFH[i].x);
          vec3 fc = uFH[i].yzw;
          if (uFM[i] > .5) fc = mix(vec3(.2, 1.6, 1.4), vec3(1.3, .4, 1.8), .5 + .5 * sin(uTime * .25 + h * .08));
          col += fc * m * (.25 + 1.6 * lum) * (.35 + .65 * smoothstep(0., 40., h));
        }
        gl_FragColor = vec4(applyFog(col, vW), 1.);
      }`
  });
}

export function buildRealCity(scene, U, camera, renderer, { key, viaProxy, low }){
  const tiles = viaProxy ? new TilesRenderer('https://tile.googleapis.com/v1/3dtiles/root.json') : new TilesRenderer();
  if (!viaProxy) tiles.registerPlugin(new GoogleCloudAuthPlugin({ apiToken: key, autoRefreshToken: true }));
  tiles.registerPlugin(new TileCompressionPlugin());
  tiles.registerPlugin(new UnloadTilesPlugin());
  tiles.registerPlugin(new TilesFadePlugin());
  tiles.registerPlugin(new ReorientationPlugin({ lat: ORIGIN.lat * D2R, lon: ORIGIN.lon * D2R, height: 0, recenter: true }));
  tiles.errorTarget = low ? 22 : 12;
  // if the key is refused or the service is down, use the drawn city for the rest of this session
  let rootLoaded = false;
  tiles.addEventListener('load-root-tileset', () => { rootLoaded = true; });
  tiles.addEventListener('load-error', ({ tile }) => {
    if (rootLoaded && tile) return;
    console.warn('3D tiles unavailable, falling back to the drawn city');
    let saved = false; try { sessionStorage.setItem('arc-notiles', '1'); saved = sessionStorage.getItem('arc-notiles') === '1'; } catch (e) {}
    if (saved) location.reload();   // never loop: only reload when the fallback flag stuck
  });
  tiles.setCamera(camera); tiles.setResolutionFromRenderer(camera, renderer);

  // a holder converts metres to world units and lifts the ground to y = 0 once we know where it is
  const holder = new THREE.Group(); holder.scale.setScalar(1 / UNIT); holder.add(tiles.group); scene.add(holder);
  tiles.addEventListener('load-model', ({ scene: model }) => {
    model.traverse(o => { if (o.isMesh && o.material){ const map = o.material.map || null; o.material.dispose(); o.material = nightMaterial(map, U); } });
  });

  let groundFound = false, tries = 0;
  const ray = new THREE.Raycaster(new THREE.Vector3(0, 400, 0), new THREE.Vector3(0, -1, 0));
  function findGround(){
    if (groundFound || ++tries % 20) return;
    holder.updateMatrixWorld(true);
    const hits = [[0, 0], [20, 10], [-20, -10], [10, -25]].map(([x, z]) => { ray.ray.origin.set(x, 600, z); return ray.intersectObject(tiles.group, true)[0]; }).filter(Boolean);
    if (hits.length >= 3){ const ys = hits.map(h => h.point.y).sort((a, b) => a - b); holder.position.y -= ys[1]; groundFound = true; }
  }

  return {
    tiles,
    get ready(){ return groundFound; },
    update(){ camera.updateMatrixWorld(); tiles.setResolutionFromRenderer(camera, renderer); tiles.update(); findGround(); },
    attributions(){ return tiles.getAttributions ? tiles.getAttributions() : []; }
  };
}
