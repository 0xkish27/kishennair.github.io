/* Shared GLSL: noise, the city's height fog, and the final film grade.
   Everything in the world is rendered in linear HDR; the grade pass tone-maps it once at the end. */

export const NOISE = /* glsl */`
float h21(vec2 p){ p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
float h31(vec3 p){ p = fract(p * .3183099 + .1); p *= 17.; return fract(p.x * p.y * p.z * (p.x + p.y + p.z)); }
float n3(vec3 x){ vec3 i = floor(x), f = fract(x); f = f * f * (3. - 2. * f);
  return mix(mix(mix(h31(i), h31(i + vec3(1,0,0)), f.x), mix(h31(i + vec3(0,1,0)), h31(i + vec3(1,1,0)), f.x), f.y),
             mix(mix(h31(i + vec3(0,0,1)), h31(i + vec3(1,0,1)), f.x), mix(h31(i + vec3(0,1,1)), h31(i + vec3(1,1,1)), f.x), f.y), f.z); }
float fbm(vec3 p){ float v = 0., a = .5; for (int i = 0; i < 5; i++){ v += a * n3(p); p = p * 2.03 + vec3(1.7, 9.2, 3.1); a *= .5; } return v; }
float fbm3(vec3 p){ float v = 0., a = .5; for (int i = 0; i < 3; i++){ v += a * n3(p); p = p * 2.03 + vec3(1.7, 9.2, 3.1); a *= .5; } return v; }
`;

// height fog: thick near the ground, thinning with altitude, tinted with the city's crimson glow
export const FOG = /* glsl */`
uniform vec3 uFogColor; uniform float uFogDensity;
vec3 applyFog(vec3 col, vec3 wp){
  float d = length(wp - cameraPosition);
  float hf = exp(-max(wp.y, 0.) * .03);
  float f = 1. - exp(-d * uFogDensity * (.45 + 1.4 * hf));
  return mix(col, uFogColor, clamp(f, 0., 1.));
}`;

export const GRADE_VS = /* glsl */`varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.); }`;
export const GRADE_FS = /* glsl */`
uniform sampler2D tDiffuse; uniform float uTime, uFlash, uDim, uAberr; uniform vec2 uRes; uniform vec3 uFlashCol;
varying vec2 vUv;
float h(vec2 p){ return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }
vec3 aces(vec3 x){ return clamp((x * (2.51 * x + .03)) / (x * (2.43 * x + .59) + .14), 0., 1.); }
void main(){
  vec2 c = vUv - .5; float r = dot(c, c);
  vec2 off = c * r * uAberr;
  vec3 col = vec3(texture2D(tDiffuse, vUv + off).r, texture2D(tDiffuse, vUv).g, texture2D(tDiffuse, vUv - off).b);
  col = aces(col * 1.1);
  float l = dot(col, vec3(.299, .587, .114));
  col = mix(col, col * vec3(1.06, .94, .97), .6) + vec3(.012, 0., .003) * (1. - l) * (1. - l);
  col = pow(col, vec3(1. / 2.2));
  col *= mix(1., .18, smoothstep(.12, .62, r * 1.5));
  col = mix(col, uFlashCol, uFlash);
  col *= 1. - uDim;
  col += (h(vUv * uRes + fract(uTime * 7.) * 91.) - .5) * .04;
  gl_FragColor = vec4(col, 1.);
}`;
