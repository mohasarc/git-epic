import { describe, expect, it } from 'vitest';
import type { ChapterSceneSegment } from '../../timeline/timeline.js';
import { PALETTE } from '../visual-vocabulary.js';
import { flagshipRiseScene } from './flagship-rise-scene.js';

const flagshipSegment: ChapterSceneSegment = {
  kind: 'chapter-scene',
  startSeconds: 6.5,
  durationSeconds: 3.5,
  chapter: {
    kind: 'flagship-rise',
    date: '2021-06-01',
    repoName: 'stellar-forge',
    starCount: 4200,
  },
  narration: 'And lo, stellar-forge rose among the constellations.',
};

describe('flagshipRiseScene', () => {
  it('raises the flagship body in a one-shot ascent offset from the segment start', () => {
    const scene = flagshipRiseScene(flagshipSegment);
    expect(scene).toContain(
      '<animateTransform attributeName="transform" type="translate" begin="6.7s"',
    );
    expect(scene).toContain('to="0 -46" fill="freeze"');
  });

  it('converges gold stars inward toward the risen body', () => {
    const scene = flagshipRiseScene(flagshipSegment);
    const stars = scene.match(new RegExp(`<circle[^>]*r="1.7" fill="${PALETTE.spark}"`, 'g')) ?? [];
    expect(stars.length).toBe(6);
    expect(scene).toContain('values="533;431" fill="freeze"');
  });

  it('settles every animation before the segment fade-out at 88%', () => {
    const scene = flagshipRiseScene(flagshipSegment);
    const fadeOutSeconds = flagshipSegment.startSeconds + flagshipSegment.durationSeconds * 0.88;
    const animations = scene.match(/begin="[\d.]+s" dur="[\d.]+s"/g) ?? [];
    expect(animations.length).toBeGreaterThan(0);
    for (const animation of animations) {
      const [begin, duration] = (animation.match(/[\d.]+/g) ?? []).map(Number);
      expect(begin).toBeGreaterThanOrEqual(flagshipSegment.startSeconds + 0.2);
      expect(begin + duration).toBeLessThanOrEqual(fadeOutSeconds);
    }
  });

  it('contains no text and no milestone burst stars', () => {
    const scene = flagshipRiseScene(flagshipSegment);
    expect(scene).not.toContain('<text');
    expect(scene).not.toContain('r="1.8"');
  });
});
