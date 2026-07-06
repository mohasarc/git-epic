import { describe, expect, it } from 'vitest';
import { formatSvgNumber } from '../../rendering/format-svg-number.js';
import { Y_BANDS } from '../mural-vocabulary.js';
import { desert } from '../worlds/desert.js';
import { river } from '../worlds/river.js';
import { renderRoad, renderSpineFlow } from './road.js';

const WIDTH = 800;

describe('renderRoad spine dispatch', () => {
  it('draws a road polyline at the baseline for a road spine', () => {
    const svg = renderRoad(WIDTH, desert);
    const baseline = formatSvgNumber(Y_BANDS.roadBaseline);
    expect(svg).toContain(`<polyline points="0,${baseline} ${formatSvgNumber(WIDTH)},${baseline}"`);
    expect(svg).toContain(`stroke="${desert.spine.color}"`);
    expect(svg).not.toContain('<rect');
  });

  it('draws a continuous water band whose bottom edge holds the ribbon-top baseline for a river spine', () => {
    const svg = renderRoad(WIDTH, river);
    const top = formatSvgNumber(Y_BANDS.roadBaseline - 10);
    expect(svg).toContain('<rect');
    expect(svg).not.toContain('<polyline');
    expect(svg).toContain(`x="0" y="${top}" width="${formatSvgNumber(WIDTH)}" height="${formatSvgNumber(10)}"`);
    expect(svg).toContain(`fill="${river.spine.color}"`);
  });
});

describe('renderSpineFlow', () => {
  it('loops a drifting current line along the river waterline', () => {
    const svg = renderSpineFlow(WIDTH, river);
    expect(svg).toContain('<line');
    expect(svg).toContain(`stroke="${river.spine.highlight}"`);
    expect(svg).toContain('stroke-dasharray');
    expect(svg).toContain('attributeName="stroke-dashoffset"');
    expect(svg).toContain('repeatCount="indefinite"');
  });

  it('is empty for a road spine — desert and mountain carry no flow', () => {
    expect(renderSpineFlow(WIDTH, desert)).toBe('');
  });
});
