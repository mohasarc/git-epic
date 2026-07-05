import { PALETTE } from './visual-vocabulary.js';

/** The gradient palette the whole universe paints with — shared by the epic and the cards. */
export function renderUniverseGradients(): string {
  return (
    `<defs>` +
    `<radialGradient id="nebula" cx="50%" cy="45%" r="65%">` +
    `<stop offset="0%" stop-color="${PALETTE.nebulaCore}" stop-opacity="0.85"/>` +
    `<stop offset="45%" stop-color="${PALETTE.nebulaEdge}" stop-opacity="0.45"/>` +
    `<stop offset="100%" stop-color="${PALETTE.background}" stop-opacity="0"/>` +
    `</radialGradient>` +
    `<radialGradient id="spark-glow" cx="50%" cy="50%" r="50%">` +
    `<stop offset="0%" stop-color="${PALETTE.spark}" stop-opacity="0.9"/>` +
    `<stop offset="40%" stop-color="${PALETTE.sparkWarm}" stop-opacity="0.35"/>` +
    `<stop offset="100%" stop-color="${PALETTE.sparkWarm}" stop-opacity="0"/>` +
    `</radialGradient>` +
    `<linearGradient id="gilded" x1="0" y1="0" x2="0" y2="1">` +
    `<stop offset="0%" stop-color="${PALETTE.gildedLight}"/>` +
    `<stop offset="100%" stop-color="${PALETTE.gildedDeep}"/>` +
    `</linearGradient>` +
    `<linearGradient id="rule-fade" x1="0" y1="0" x2="1" y2="0">` +
    `<stop offset="0%" stop-color="${PALETTE.gildedDeep}" stop-opacity="0"/>` +
    `<stop offset="50%" stop-color="${PALETTE.gildedDeep}" stop-opacity="0.8"/>` +
    `<stop offset="100%" stop-color="${PALETTE.gildedDeep}" stop-opacity="0"/>` +
    `</linearGradient>` +
    `</defs>`
  );
}
