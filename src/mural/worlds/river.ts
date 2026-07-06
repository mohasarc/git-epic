import { boatModule } from '../modules/boat.js';
import { dockHutModule } from '../modules/dock-hut.js';
import type { World } from './world.js';

/**
 * The river world: cool blue-green palette, harbor→port materials, a flowing water spine. Same
 * scene reads the same as in desert — only these colors and the two signature silhouettes change.
 */
export const river: World = {
  name: 'river',
  sky: [
    { offset: 0, color: '#4a7f96' },
    { offset: 1, color: '#cfe6ea' },
  ],
  distantTerrain: '#5f93a0',
  groundTint: {
    ancient: '#3f6f74',
    classical: '#4f8a8a',
    modern: '#6fb0aa',
  },
  structureFill: {
    ancient: { body: '#3d6f78', accent: '#274a50' },
    classical: { body: '#417f8a', accent: '#2b565c' },
    modern: { body: '#5aa0a0', accent: '#356a6c' },
  },
  spine: { kind: 'river', color: '#3f7f96', highlight: '#8fc9d6' },
  ribbonRamp: ['#cfeaea', '#94c9c9', '#5aa0a8', '#3d7a86', '#2a5560'],
  goldAccent: '#f0d27a',
  structureBody: '#417f8a',
  structureAccent: '#2b565c',
  languageAccent: {
    TypeScript: '#3f6f96',
    JavaScript: '#8fa05a',
    Python: '#4a7fa0',
    Go: '#3f97a3',
    Rust: '#7a5f6a',
    Java: '#6a7f96',
    Ruby: '#9a5560',
    C: '#6f8090',
    'C++': '#6a6a9a',
    'C#': '#5f8a70',
    PHP: '#5f6a9a',
    Swift: '#7f7050',
    Kotlin: '#7a6aa0',
    Shell: '#5f8a6a',
    HTML: '#5f7f8a',
    CSS: '#6a7aa8',
  },
  languageAccentFallback: '#2b565c',
  panelFill: '#cfe6ea',
  modules: { camp: dockHutModule, prop: boatModule },
};
