/* Arcanum entry point. Boot order matches the original single-file prototype. */
import './styles/main.css';
import { $ } from './lib/util.js';
import { J } from './data/journeys.js';
import { initLanding, setSealBreaker } from './landing.js';
import { initFog } from './three/fog.js';
import { createStage } from './three/stage.js';
import { initFx } from './ui/fx.js';
import { initShell, openApp } from './game/shell.js';
import { initFlow } from './game/flow.js';
import { initMotion } from './ui/motion.js';

initMotion();
initLanding();
initFog();

const Stage = createStage();
if (Stage) {
  document.body.classList.add('has3d');
  setSealBreaker(Stage.seal($('#sealStage')));
  document.querySelectorAll('#doorList .mirror').forEach((m, i) => Stage.relic(m, Object.keys(J)[i]));
  Stage.start();
}

initFx();
initShell();
initFlow();

if (location.hash === '#play') openApp('lantern');
