import { describe, expect, it } from 'vitest';
import type { ChapterSceneSegment } from '../../timeline/timeline.js';
import { PALETTE } from '../visual-vocabulary.js';
import { originScene } from './origin-scene.js';

const originSegment: ChapterSceneSegment = {
  kind: 'chapter-scene',
  startSeconds: 3,
  durationSeconds: 3.5,
  chapter: { kind: 'origin', date: '2019-03-20' },
  narration: 'In the year 2019, the epic began.',
};

describe('originScene', () => {
  it('draws the spark nucleus and its glow at scene center', () => {
    const scene = originScene(originSegment);
    expect(scene).toContain('<circle cx="415" cy="186" r="5" fill="' + PALETTE.spark + '"/>');
    expect(scene).toContain('r="34" fill="url(#spark-glow)"');
  });

  it('expands two one-shot rings offset from the segment start', () => {
    const scene = originScene(originSegment);
    const rings = scene.match(/<animate attributeName="r"[^/]*fill="freeze"\/>/g) ?? [];
    expect(rings.length).toBe(2);
    expect(scene).toContain('begin="3.2s"');
    expect(scene).toContain('begin="3.5s"');
  });

  it('distinguishes itself from the placeholder glow', () => {
    const scene = originScene(originSegment);
    expect(scene).toContain(`stroke="${PALETTE.orbitIndigo}"`);
    expect(scene).not.toContain('r="40"');
  });
});
