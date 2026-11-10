/* line-art SVG emblems used on cards, mirrors and pads */
export const EM = {
  mist:'<path d="M64 20a20 20 0 1 0 10 36 16 16 0 1 1-10-36z"/><path d="M16 66c8-5 16 5 24 0s16 5 24 0 16 5 24 0M16 76c8-5 16 5 24 0s16 5 24 0 16 5 24 0M26 86c8-5 16 5 24 0s16 5 24 0"/>',
  clock:'<circle cx="50" cy="50" r="32"/><circle cx="50" cy="50" r="26" stroke-dasharray="1 5"/><path d="M50 50V30M50 50l14 9M50 14v5M50 81v5M14 50h5M81 50h5"/><circle cx="50" cy="50" r="2.5" fill="currentColor"/>',
  star:'<path d="M50 16l7 16 17 2-13 11 4 17-15-9-15 9 4-17-13-11 17-2z"/><path d="M14 82h72M24 74h52"/><circle cx="20" cy="30" r="1.6" fill="currentColor"/><circle cx="82" cy="24" r="1.6" fill="currentColor"/>',
  ghost:'<path d="M32 80V46a18 18 0 0 1 36 0v34l-6-6-6 6-6-6-6 6-6-6z"/><circle cx="43" cy="48" r="2.4" fill="currentColor"/><circle cx="57" cy="48" r="2.4" fill="currentColor"/><path d="M76 20v10M71 25h10M24 22v8M20 26h8"/>',
  scales:'<path d="M50 16v66M32 82h36M20 32h60M20 32l-10 24h20zM80 32l-10 24h20zM10 56a10 6 0 0 0 20 0M70 56a10 6 0 0 0 20 0"/><circle cx="50" cy="16" r="3"/>',
  towers:'<path d="M30 86V32l6-16 6 16v54M58 86V32l6-16 6 16v54M42 48h16M42 52h16M22 86h56"/><circle cx="80" cy="20" r="1.6" fill="currentColor"/><circle cx="18" cy="28" r="1.6" fill="currentColor"/>',
  fountain:'<path d="M50 72V30M50 30c-8-12-22-10-26 6M50 30c8-12 22-10 26 6M50 42c-6-8-15-6-17 3M50 42c6-8 15-6 17 3M22 72h56M28 72v8h44v-8"/><circle cx="50" cy="24" r="2" fill="currentColor"/>',
  path:'<path d="M22 88C40 72 30 58 50 48s28-20 28-34M34 88c16-14 10-28 28-38s22-20 22-34"/><circle cx="30" cy="26" r="1.8" fill="currentColor"/><circle cx="20" cy="44" r="1.4" fill="currentColor"/><circle cx="76" cy="66" r="1.6" fill="currentColor"/>',
  keyhole:'<circle cx="50" cy="50" r="34"/><path d="M50 34a9 9 0 0 1 4.5 16.8L58 68H42l3.5-17.2A9 9 0 0 1 50 34z"/>',
  bridge:'<path d="M8 68c22-28 62-28 84 0M8 68h84M20 60v8M34 52v16M50 49v19M66 52v16M80 60v8"/><path d="M50 18l3 6 6 1-4.5 4 1 6-5.5-3-5.5 3 1-6-4.5-4 6-1z"/>',
  compass:'<circle cx="50" cy="50" r="34"/><path d="M50 22l7 28-7 28-7-28z"/><path d="M22 50h56"/>',
  skewer:'<path d="M18 82L82 18"/><circle cx="40" cy="60" r="8"/><circle cx="52" cy="48" r="8"/><circle cx="64" cy="36" r="8"/>',
  eye:'<path d="M10 50c14-20 66-20 80 0-14 20-66 20-80 0z"/><circle cx="50" cy="50" r="11"/><circle cx="50" cy="50" r="4" fill="currentColor"/>',
  snow:'<path d="M50 14v72M19 32l62 36M19 68l62-36M42 20l8 8 8-8M42 80l8-8 8 8"/>',
  bowl:'<path d="M16 52h68c0 18-16 30-34 30S16 70 16 52z"/><path d="M36 42c-5-6 5-10 0-17M50 42c-5-6 5-10 0-17M64 42c-5-6 5-10 0-17"/>',
  rings:'<circle cx="50" cy="50" r="6"/><path d="M36 36a20 20 0 0 1 28 0M64 64a20 20 0 0 1-28 0M26 26a34 34 0 0 1 48 0M74 74a34 34 0 0 1-48 0"/>',
  note:'<path d="M40 72V26l34-8v46M40 36l34-8"/><ellipse cx="32" cy="72" rx="9" ry="7"/><ellipse cx="66" cy="64" rx="9" ry="7"/>',
  waves:'<path d="M10 50h8l6-16 8 32 8-40 8 48 8-36 8 24 6-12h16"/>',
  moon:'<path d="M62 18a32 32 0 1 0 0 64 26 26 0 1 1 0-64z"/>',
  flame:'<path d="M50 86c-16 0-24-12-24-24 0-16 14-22 16-40 10 8 12 18 10 26 6-4 8-10 8-14 8 8 14 18 14 28 0 12-8 24-24 24z"/>',
  heart:'<path d="M50 82S16 62 16 38a17 17 0 0 1 34-4 17 17 0 0 1 34 4c0 24-34 44-34 44z"/><path d="M50 40v20M42 52h16"/>'
};
export const em = (k, sw=2) => `<svg viewBox="0 0 100 100" fill="none" stroke="currentColor" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${EM[k]}</svg>`;
