import { describe, expect, it } from 'vitest';
import type { ChapterSceneSegment } from '../../timeline/timeline.js';
import { PALETTE } from '../visual-vocabulary.js';
import { darkAgeScene } from './dark-age-scene.js';

function darkAgeSegment(): ChapterSceneSegment {
  return {
    kind: 'chapter-scene',
    startSeconds: 6.5,
    durationSeconds: 3.5,
    chapter: { kind: 'dark-age', date: '2019-09-02', endDate: '2020-03-31', lengthDays: 212 },
    narration: 'Then came the Dark Age: two hundred and twelve days, and not a single commit.',
  };
}

describe('darkAgeScene', () => {
  it('dims the cosmos with a partially opaque background veil inside the scene output', () => {
    const scene = darkAgeScene(darkAgeSegment());
    const veil = scene.match(
      new RegExp(`<rect[^>]*fill="${PALETTE.background}"[^>]*opacity="([\\d.]+)"`),
    );
    expect(veil).not.toBeNull();
    const veilOpacity = Number(veil?.[1]);
    expect(veilOpacity).toBeGreaterThan(0);
    expect(veilOpacity).toBeLessThan(1);
  });

  it('leaves a cold indigo ember and a fading ring in the gloom', () => {
    const scene = darkAgeScene(darkAgeSegment());
    expect(scene).toMatch(new RegExp(`<circle[^>]*r="2.5" fill="${PALETTE.orbitIndigo}"`));
    expect(scene).toMatch(
      new RegExp(`<circle[^>]*fill="none" stroke="${PALETTE.orbitIndigo}"[^>]*opacity="0">`),
    );
  });

  it('settles every one-shot animation before the segment fade-out at 88%', () => {
    const segment = darkAgeSegment();
    const scene = darkAgeScene(segment);
    const fadeOutSeconds = segment.startSeconds + segment.durationSeconds * 0.88;
    const animations = scene.match(/begin="[\d.]+s" dur="[\d.]+s"/g) ?? [];
    expect(animations.length).toBeGreaterThan(0);
    for (const animation of animations) {
      const [begin, duration] = (animation.match(/[\d.]+/g) ?? []).map(Number);
      expect(begin).toBeGreaterThanOrEqual(segment.startSeconds + 0.2);
      expect(begin + duration).toBeLessThanOrEqual(fadeOutSeconds);
    }
    expect(scene).not.toContain('repeatCount');
  });

  it('contains no text', () => {
    expect(darkAgeScene(darkAgeSegment())).not.toContain('<text');
  });
});
