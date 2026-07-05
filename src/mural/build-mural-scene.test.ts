import { describe, expect, it } from 'vitest';
import { detectChapters } from '../chapters/detect-chapters.js';
import { narrateChapter } from '../narration/narrate-chapter.js';
import { scoreStrengths } from '../strengths/score-strengths.js';
import { buildHistorySnapshot } from '../test-support/build-history-snapshot.js';
import { loadHistorySnapshotFixture } from '../test-support/load-history-snapshot-fixture.js';
import type { HistorySnapshot } from '../history-snapshot.js';
import type { NarratedChapter } from '../timeline/build-timeline.js';
import { MURAL_HEIGHT } from './mural-vocabulary.js';
import { buildMuralScene } from './build-mural-scene.js';

function narrate(snapshot: HistorySnapshot): NarratedChapter[] {
  return detectChapters(snapshot).map((chapter) => ({ chapter, narration: narrateChapter(chapter) }));
}

function scene(snapshot: HistorySnapshot) {
  return buildMuralScene(snapshot, narrate(snapshot), scoreStrengths(snapshot));
}

describe('buildMuralScene over the rich fixture', () => {
  const snapshot = loadHistorySnapshotFixture('rich-history-account.json');
  const built = scene(snapshot);

  it('sizes the strip from the summed era widths at the mural height', () => {
    expect(built.height).toBe(MURAL_HEIGHT);
    expect(built.worldScale).toBe('metropolis');
    expect(built.width).toBeGreaterThan(0);
    expect(built.handle).toBe(snapshot.handle);
  });

  it('lays eras out contiguously across the strip', () => {
    const eras = built.eras;
    for (let index = 0; index + 1 < eras.length; index++) {
      expect(eras[index].x + eras[index].width).toBeCloseTo(eras[index + 1].x, 6);
    }
  });

  it('gives every era slots, a ribbon, and a title', () => {
    for (const era of built.eras) {
      expect(era.slots.length).toBeGreaterThan(0);
      expect(era.ribbon.length).toBeGreaterThan(0);
      expect(era.title.length).toBeGreaterThan(0);
    }
  });

  it('exposes a subtitle, present-day label, and accessible prose', () => {
    expect(built.subtitle).toContain(snapshot.handle);
    expect(built.presentDayLabel.length).toBeGreaterThan(0);
    expect(built.accessibleTitle).toContain(snapshot.handle);
    expect(built.accessibleDescription.length).toBeGreaterThan(0);
  });
});

describe('buildMuralScene grace floor', () => {
  it('gives a single-contribution account a camp with a structure, present-day stretch, title, subtitle', () => {
    const snapshot = buildHistorySnapshot({
      handle: 'first-spark',
      firstPublicActivityDate: '2019-03-20',
      contributionDays: [{ date: '2019-03-20', count: 1 }],
    });
    const built = scene(snapshot);
    expect(built.worldScale).toBe('camp');
    expect(built.eras[built.eras.length - 1].chapter).toBeNull();
    const structures = built.eras.flatMap((era) => era.slots).filter((slot) => slot.type === 'structure');
    expect(structures.length).toBeGreaterThanOrEqual(1);
    expect(built.subtitle.length).toBeGreaterThan(0);
    expect(built.eras.every((era) => era.title.length > 0)).toBe(true);
  });

  it('gives a brand-new account the same minimum', () => {
    const snapshot = buildHistorySnapshot({
      handle: 'unwritten-legend',
      firstPublicActivityDate: null,
      accountCreatedDate: '2026-06-30',
      capturedAtDate: '2026-07-04',
    });
    const built = scene(snapshot);
    expect(built.worldScale).toBe('camp');
    expect(built.eras).toHaveLength(1);
    expect(built.eras[0].slots.some((slot) => slot.type === 'structure')).toBe(true);
    expect(built.subtitle.length).toBeGreaterThan(0);
  });
});

describe('buildMuralScene determinism and seed independence', () => {
  it('produces an identical scene for identical inputs', () => {
    const snapshot = loadHistorySnapshotFixture('rich-history-account.json');
    expect(scene(snapshot)).toEqual(scene(snapshot));
  });

  it('keeps slot geometry, ribbon, and widths independent of the handle seed', () => {
    const base = buildHistorySnapshot({
      handle: 'aaa',
      contributionDays: [{ date: '2019-03-20', count: 3 }],
    });
    const built = scene(base);
    const reseeded = scene({ ...base, handle: 'zzz' });
    expect(reseeded.width).toBe(built.width);
    expect(reseeded.eras.map((era) => ({ x: era.x, width: era.width, slots: era.slots, ribbon: era.ribbon }))).toEqual(
      built.eras.map((era) => ({ x: era.x, width: era.width, slots: era.slots, ribbon: era.ribbon })),
    );
  });
});
