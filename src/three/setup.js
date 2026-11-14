/* Loaded before anything else touches three.js: keep the colour handling the scenes were designed with
   (no automatic sRGB conversion of colours), as three.js r128 did. */
import * as THREE from 'three';
THREE.ColorManagement.enabled = false;
