import { propModule } from '../modules/prop.js';
import { tentModule } from '../modules/tent.js';
import type { World } from './world.js';

/**
 * The desert world: warm palette, mudbrick→glass materials, a road spine. The exact style
 * the mural shipped with before worlds existed — its literals moved here verbatim.
 */
export const desert: World = {
  name: 'desert',
  sky: [
    { offset: 0, color: '#f6b26b' },
    { offset: 1, color: '#fbe3bd' },
  ],
  distantTerrain: '#d98b4a',
  groundTint: {
    ancient: '#b9793d',
    classical: '#cf9b57',
    modern: '#e6bd7f',
  },
  structureFill: {
    ancient: { body: '#a86a3a', accent: '#6f3f20' },
    classical: { body: '#c07f3f', accent: '#7d4a22' },
    modern: { body: '#d69a54', accent: '#8a5228' },
  },
  spine: { kind: 'road', color: '#caa268' },
  ribbonRamp: ['#f0d5a8', '#e3b877', '#d18f4b', '#b3672f', '#8a4a22'],
  goldAccent: '#f2c14e',
  structureBody: '#c8763c',
  structureAccent: '#8f4a24',
  languageAccent: {
    TypeScript: '#4e6a8f',
    JavaScript: '#c9a84e',
    Python: '#5a7fa0',
    Go: '#4f97a3',
    Rust: '#a8593a',
    Java: '#9c6b3f',
    Ruby: '#a5433a',
    C: '#6f7a8a',
    'C++': '#7a5a86',
    'C#': '#5f7a55',
    PHP: '#6b6a9a',
    Swift: '#c07145',
    Kotlin: '#8a6aa0',
    Shell: '#6f8a5a',
    HTML: '#bd6440',
    CSS: '#6a6f9a',
  },
  languageAccentFallback: '#8f4a24',
  panelFill: '#fbe3bd',
  modules: { camp: tentModule, prop: propModule },
};
