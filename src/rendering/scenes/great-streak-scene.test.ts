import { describe, expect, it } from 'vitest';
import type { ChapterSceneSegment } from '../../timeline/timeline.js';
import { PALETTE } from '../visual-vocabulary.js';
import { greatStreakScene } from './great-streak-scene.js';

function greatStreakSegment(): ChapterSceneSegment {
  return {
    kind: 'chapter-scene',
    startSeconds: 6.5,
    durationSeconds: 3.5,
    chapter: { kind: 'great-streak', date: '2019-03-01', endDate: '2019-04-04', lengthDays: 35 },
    narration: 'Then began the relentless campaign: thirty-five days of unbroken toil.',
  };
}

describe('greatStreakScene', () => {
  it('draws a comet head trailed by fading sparks', () => {
    const scene = greatStreakScene(greatStreakSegment());
    expect(scene).toMatch(new RegExp(`<circle[^>]*r="3.5" fill="${PALETTE.spark}"`));
    const trail = scene.match(new RegExp(`<circle[^>]*fill="${PALETTE.sparkWarm}"`, 'g')) ?? [];
    expect(trail.length).toBeGreaterThanOrEqual(3);
  });

  it('traverses the scene in one shot, settling before the fade-out at 88%', () => {
    const segment = greatStreakSegment();
    const scene = greatStreakScene(segment);
    const traverse = scene.match(
      /<animateTransform attributeName="transform" type="translate" begin="([\d.]+)s" dur="([\d.]+)s"[^>]*fill="freeze"/,
    );
    expect(traverse).not.toBeNull();
    const beginSeconds = Number(traverse?.[1]);
    const durationSeconds = Number(traverse?.[2]);
    const fadeOutSeconds = segment.startSeconds + segment.durationSeconds * 0.88;
    expect(beginSeconds).toBeGreaterThanOrEqual(segment.startSeconds + 0.2);
    expect(beginSeconds + durationSeconds).toBeLessThanOrEqual(fadeOutSeconds);
    expect(scene).not.toContain('repeatCount');
  });

  it('contains no text', () => {
    expect(greatStreakScene(greatStreakSegment())).not.toContain('<text');
  });
});
