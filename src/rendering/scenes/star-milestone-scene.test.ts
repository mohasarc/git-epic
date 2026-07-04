import { describe, expect, it } from 'vitest';
import type { ChapterSceneSegment } from '../../timeline/timeline.js';
import { PALETTE } from '../visual-vocabulary.js';
import { starMilestoneScene } from './star-milestone-scene.js';

function milestoneSegment(threshold: 100 | 1000 | 10000): ChapterSceneSegment {
  return {
    kind: 'chapter-scene',
    startSeconds: 6.5,
    durationSeconds: 3.5,
    chapter: { kind: 'star-milestone', date: '2022-01-05', threshold },
    narration: 'A hundred stars now sang the name.',
  };
}

function burstStars(scene: string): string[] {
  return scene.match(new RegExp(`<circle[^>]*r="1.8" fill="${PALETTE.spark}"`, 'g')) ?? [];
}

describe('starMilestoneScene', () => {
  it('bursts more stars at each higher threshold', () => {
    const at100 = burstStars(starMilestoneScene(milestoneSegment(100))).length;
    const at1000 = burstStars(starMilestoneScene(milestoneSegment(1000))).length;
    const at10000 = burstStars(starMilestoneScene(milestoneSegment(10000))).length;
    expect(at100).toBe(6);
    expect(at1000).toBe(10);
    expect(at10000).toBe(14);
  });

  it('radiates stars outward from the scene center in one shot', () => {
    const scene = starMilestoneScene(milestoneSegment(100));
    expect(scene).toContain('values="415;511" fill="freeze"');
    expect(scene).toContain('begin="6.8s"');
    expect(scene).not.toContain('repeatCount');
  });

  it('settles every animation before the segment fade-out at 88%', () => {
    const segment = milestoneSegment(10000);
    const scene = starMilestoneScene(segment);
    const fadeOutSeconds = segment.startSeconds + segment.durationSeconds * 0.88;
    const animations = scene.match(/begin="[\d.]+s" dur="[\d.]+s"/g) ?? [];
    expect(animations.length).toBeGreaterThan(0);
    for (const animation of animations) {
      const [begin, duration] = (animation.match(/[\d.]+/g) ?? []).map(Number);
      expect(begin).toBeGreaterThanOrEqual(segment.startSeconds + 0.2);
      expect(begin + duration).toBeLessThanOrEqual(fadeOutSeconds);
    }
  });

  it('contains no text', () => {
    expect(starMilestoneScene(milestoneSegment(1000))).not.toContain('<text');
  });

  it('rejects a segment whose chapter is not a star milestone', () => {
    const wrongSegment: ChapterSceneSegment = {
      ...milestoneSegment(100),
      chapter: { kind: 'origin', date: '2019-03-20' },
    };
    expect(() => starMilestoneScene(wrongSegment)).toThrow('star-milestone');
  });
});
