import { describe, expect, it } from 'vitest';
import type { ChapterSceneSegment } from '../../timeline/timeline.js';
import { PALETTE } from '../visual-vocabulary.js';
import { prolificacyScene } from './prolificacy-scene.js';

const prolificacySegment: ChapterSceneSegment = {
  kind: 'chapter-scene',
  startSeconds: 6.5,
  durationSeconds: 3.5,
  chapter: {
    kind: 'prolificacy',
    date: '2023-01-01',
    year: 2023,
    contributionCount: 1900,
    priorYearContributionCount: 400,
  },
  narration: 'In 2023 the forge never cooled.',
};

describe('prolificacyScene', () => {
  it('blooms a ring of sparks with ascending begin offsets', () => {
    const scene = prolificacyScene(prolificacySegment);
    const sparks = scene.match(new RegExp(`<circle[^>]*r="2" fill="${PALETTE.spark}"`, 'g')) ?? [];
    expect(sparks.length).toBe(8);
    const begins = (scene.match(/begin="([\d.]+)s" dur="[\d.]+s" values="0;/g) ?? []).map(
      (match) => Number(match.match(/[\d.]+/)?.[0]),
    );
    expect(begins.length).toBe(8);
    for (let index = 1; index < begins.length; index += 1) {
      expect(begins[index]).toBeGreaterThan(begins[index - 1] ?? Number.NaN);
    }
  });

  it('moves each spark outward from the inner ring in one shot', () => {
    const scene = prolificacyScene(prolificacySegment);
    expect(scene).toContain('values="170;120" fill="freeze"');
    expect(scene).not.toContain('repeatCount');
  });

  it('settles every animation before the segment fade-out at 88%', () => {
    const scene = prolificacyScene(prolificacySegment);
    const fadeOutSeconds =
      prolificacySegment.startSeconds + prolificacySegment.durationSeconds * 0.88;
    const animations = scene.match(/begin="[\d.]+s" dur="[\d.]+s"/g) ?? [];
    expect(animations.length).toBeGreaterThan(0);
    for (const animation of animations) {
      const [begin, duration] = (animation.match(/[\d.]+/g) ?? []).map(Number);
      expect(begin).toBeGreaterThanOrEqual(prolificacySegment.startSeconds + 0.2);
      expect(begin + duration).toBeLessThanOrEqual(fadeOutSeconds);
    }
  });

  it('contains no text', () => {
    expect(prolificacyScene(prolificacySegment)).not.toContain('<text');
  });
});
