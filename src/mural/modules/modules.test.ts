import { describe, expect, it } from 'vitest';
import { expectEmbedSafeSvg } from '../../test-support/expect-embed-safe-svg.js';
import {
  MODULE_PATH_BUDGET,
  MURAL_OUTLINE,
  type ModuleFill,
} from '../mural-vocabulary.js';
import { bannerModule } from './banner.js';
import { bridgeModule } from './bridge.js';
import { crowdModule } from './crowd.js';
import { crownGateModule } from './crown-gate.js';
import { markerModule } from './marker.js';
import { noticeBoardModule } from './notice-board.js';
import { propModule } from './prop.js';
import { sideRoadModule } from './side-road.js';
import { structureModule } from './structure.js';
import { tentModule } from './tent.js';

type Module = (opts: { fill: ModuleFill; heightScale: number }) => string;

const MODULES: { name: keyof typeof MODULE_PATH_BUDGET; render: Module }[] = [
  { name: 'structure', render: structureModule },
  { name: 'tent', render: tentModule },
  { name: 'marker', render: markerModule },
  { name: 'prop', render: propModule },
  { name: 'banner', render: bannerModule },
  { name: 'crownGate', render: crownGateModule },
  { name: 'sideRoad', render: sideRoadModule },
  { name: 'crowd', render: crowdModule },
  { name: 'bridge', render: bridgeModule },
  { name: 'noticeBoard', render: noticeBoardModule },
];

const FILL_A: ModuleFill = { body: '#101010', accent: '#202020' };
const FILL_B: ModuleFill = { body: '#303030', accent: '#404040' };

function countElements(svg: string): number {
  return (svg.match(/<(path|rect|circle|polygon)\b/g) ?? []).length;
}

function fillValues(svg: string): string[] {
  return [...svg.matchAll(/fill="([^"]*)"/g)].map((match) => match[1]);
}

function localCoordinates(svg: string): number[] {
  const numbers: number[] = [];
  const attributePattern = /(?:x|y|width|height|cx|cy|r)="(-?\d+(?:\.\d+)?)"/g;
  for (const match of svg.matchAll(attributePattern)) {
    numbers.push(Number(match[1]));
  }
  const pointsPattern = /points="([^"]*)"/g;
  for (const match of svg.matchAll(pointsPattern)) {
    for (const token of match[1].split(/[\s,]+/).filter(Boolean)) {
      numbers.push(Number(token));
    }
  }
  return numbers;
}

function neutralizeFills(svg: string, fill: ModuleFill): string {
  const withBody = svg.split(fill.body).join('__BODY__');
  return fill.accent === undefined ? withBody : withBody.split(fill.accent).join('__ACCENT__');
}

describe.each(MODULES)('$name module', ({ name, render }) => {
  it('renders valid SVG elements', () => {
    const svg = render({ fill: FILL_A, heightScale: 1 });
    expect(countElements(svg)).toBeGreaterThan(0);
  });

  it('stays inside the normalized local box (no absolute canvas coordinates)', () => {
    const svg = render({ fill: FILL_A, heightScale: 1 });
    for (const coordinate of localCoordinates(svg)) {
      expect(Math.abs(coordinate)).toBeLessThanOrEqual(1.0001);
    }
  });

  it('takes every fill from the param, hardcodes none', () => {
    const svg = render({ fill: FILL_A, heightScale: 1 });
    const allowed = new Set([FILL_A.body, FILL_A.accent, 'none']);
    for (const fill of fillValues(svg)) {
      expect(allowed.has(fill)).toBe(true);
    }
    expect(svg).not.toContain(MURAL_OUTLINE.replace('#', 'fill="#'));
  });

  it('draws the fixed outline as stroke, not fill', () => {
    const svg = render({ fill: FILL_A, heightScale: 1 });
    expect(svg).toContain(`stroke="${MURAL_OUTLINE}"`);
  });

  it('recoloring changes only fill tokens, not geometry', () => {
    const svgA = render({ fill: FILL_A, heightScale: 1 });
    const svgB = render({ fill: FILL_B, heightScale: 1 });
    expect(neutralizeFills(svgA, FILL_A)).toBe(neutralizeFills(svgB, FILL_B));
  });

  it('respects its declared per-module path budget', () => {
    const svg = render({ fill: FILL_A, heightScale: 1 });
    expect(countElements(svg)).toBeLessThanOrEqual(MODULE_PATH_BUDGET[name]);
  });

  it('is embed-safe', () => {
    expectEmbedSafeSvg(render({ fill: FILL_A, heightScale: 1 }));
  });
});
