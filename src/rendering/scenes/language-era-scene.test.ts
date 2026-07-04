import { describe, expect, it } from 'vitest';
import type { ChapterSceneSegment } from '../../timeline/timeline.js';
import { PALETTE } from '../visual-vocabulary.js';
import { languageEraScene } from './language-era-scene.js';

function languageEraSegment(fromLanguage: string, toLanguage: string): ChapterSceneSegment {
  return {
    kind: 'chapter-scene',
    startSeconds: 6.5,
    durationSeconds: 3.5,
    chapter: { kind: 'language-era', date: '2022-01-01', year: 2022, fromLanguage, toLanguage },
    narration: 'In the year 2022, the developer forsook JavaScript, and there was much refactoring.',
  };
}

describe('languageEraScene', () => {
  it('fades the indigo body while the blue body rises with opposing opacity', () => {
    const scene = languageEraScene(languageEraSegment('JavaScript', 'TypeScript'));
    expect(scene).toMatch(
      new RegExp(`<circle[^>]*fill="${PALETTE.orbitIndigo}"[^>]*>` + '[^<]*<animate attributeName="opacity"[^>]*values="0.9;0.15"'),
    );
    expect(scene).toMatch(
      new RegExp(`<circle[^>]*fill="${PALETTE.orbitBlue}"[^>]*>` + '[^<]*<animate attributeName="opacity"[^>]*values="0.15;0.9"'),
    );
    expect(scene).toContain('<animateTransform attributeName="transform" type="translate"');
  });

  it('draws the same fixed pair regardless of the chapter languages', () => {
    expect(languageEraScene(languageEraSegment('Ruby', 'Python'))).toBe(
      languageEraScene(languageEraSegment('JavaScript', 'TypeScript')),
    );
  });

  it('settles every one-shot animation before the segment fade-out at 88%', () => {
    const segment = languageEraSegment('JavaScript', 'TypeScript');
    const scene = languageEraScene(segment);
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
    expect(languageEraScene(languageEraSegment('JavaScript', 'TypeScript'))).not.toContain('<text');
  });
});
