/* Arcanum entry point. */
import './styles/main.css';
import { initLanding, setDiveHook } from './landing.js';
import { initWorld } from './three/world/world.js';
import { initFx } from './ui/fx.js';
import { initShell, openApp } from './game/shell.js';
import { initFlow } from './game/flow.js';
import { initMotion } from './ui/motion.js';

initMotion();
initLanding();

// the 3D city; without WebGL the page falls back to a plain layout of the same chapters
const world = initWorld();
if (world){
  world.onEnter(id => world.dive(id, () => openApp(id)));
  setDiveHook((id, cb) => world.dive(id, cb));
} else {
  document.getElementById('gate')?.remove();
  document.documentElement.classList.remove('gated');
}

initFx();
initShell();
initFlow();

if (location.hash === '#play') openApp('lantern');
