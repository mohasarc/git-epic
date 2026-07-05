import { describe, expect, it } from 'vitest';
import type { Chapter } from '../chapters/chapter.js';
import type { MuralEra } from './mural-scene.js';
import { ERA_BASE_WIDTH, MURAL_MARGIN_X, layOutEras } from './era-widths.js';

function era(kind: Chapter['kind'] | null, tier: MuralEra['tier']): MuralEra {
  const chapter = kind === null ? null : ({ kind } as unknown as Chapter);
  return { chapter, startDate: '2020-01-01', endDate: '2021-01-01', tier };
}

const ERAS: MuralEra[] = [era('origin', 'ancient'), era('flagship-rise', 'classical'), era(null, 'modern')];

describe('layOutEras offsets', () => {
  it('places eras contiguously left to right after the left margin', () => {
    const { placements } = layOutEras(ERAS, 'town');
    expect(placements[0].x).toBe(MURAL_MARGIN_X);
    for (let index = 0; index + 1 < placements.length; index++) {
      expect(placements[index].x + placements[index].width).toBeCloseTo(placements[index + 1].x, 6);
    }
  });

  it('sums W from the widths plus both margins', () => {
    const { placements, width } = layOutEras(ERAS, 'town');
    const sumWidths = placements.reduce((total, placement) => total + placement.width, 0);
    expect(width).toBeCloseTo(sumWidths + MURAL_MARGIN_X * 2, 6);
  });

  it('gives the present-day era the reserved present-day width', () => {
    const { placements } = layOutEras(ERAS, 'town');
    expect(placements[2].width).toBeCloseTo(ERA_BASE_WIDTH['present-day'], 6);
  });
});

describe('layOutEras worldScale modulation', () => {
  it('keeps every width within +/-15% of the per-kind base', () => {
    for (const worldScale of ['camp', 'town', 'metropolis'] as const) {
      const { placements } = layOutEras(ERAS, worldScale);
      const bases = [ERA_BASE_WIDTH.origin, ERA_BASE_WIDTH['flagship-rise'], ERA_BASE_WIDTH['present-day']];
      placements.forEach((placement, index) => {
        expect(Math.abs(placement.width - bases[index])).toBeLessThanOrEqual(bases[index] * 0.15 + 1e-9);
      });
    }
  });

  it('shrinks camp below town below metropolis on the same eras', () => {
    const camp = layOutEras(ERAS, 'camp').width;
    const town = layOutEras(ERAS, 'town').width;
    const metropolis = layOutEras(ERAS, 'metropolis').width;
    expect(camp).toBeLessThan(town);
    expect(town).toBeLessThan(metropolis);
  });
});
