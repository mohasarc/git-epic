import { cairnModule } from '../modules/cairn.js';
import { pineModule } from '../modules/pine.js';
import type { World } from './world.js';

/**
 * The mountain world: cool grey-green palette, stone→terraced materials, a recolored road spine.
 * Same scene reads the same as in desert — only these colors and the two signature silhouettes change.
 */
export const mountain: World = {
  name: 'mountain',
  sky: [
    { offset: 0, color: '#6f8a86' },
    { offset: 1, color: '#d7e2dc' },
  ],
  distantTerrain: '#7d938a',
  groundTint: {
    ancient: '#5f6f64',
    classical: '#71856f',
    modern: '#8aa287',
  },
  structureFill: {
    ancient: { body: '#5c6b60', accent: '#3c4740' },
    classical: { body: '#6d7f6a', accent: '#44533f' },
    modern: { body: '#86997f', accent: '#4f6050' },
  },
  spine: { kind: 'road', color: '#8a9186' },
  ribbonRamp: ['#d7e2d7', '#a8bda3', '#7f9a76', '#5f7554', '#43563a'],
  goldAccent: '#e6cf82',
  structureBody: '#6d7f6a',
  structureAccent: '#44533f',
  languageAccent: {
    TypeScript: '#4f6f7a',
    JavaScript: '#8a9a5f',
    Python: '#4f7f74',
    Go: '#4f8a80',
    Rust: '#7a6a55',
    Java: '#5f7a6a',
    Ruby: '#8a5f5a',
    C: '#6a7a70',
    'C++': '#66708a',
    'C#': '#5f8a6a',
    PHP: '#66708f',
    Swift: '#7f7a55',
    Kotlin: '#70709a',
    Shell: '#5f8a5f',
    HTML: '#6a8a7a',
    CSS: '#707a9a',
  },
  languageAccentFallback: '#3c4740',
  panelFill: '#d7e2dc',
  modules: { camp: cairnModule, prop: pineModule },
};
