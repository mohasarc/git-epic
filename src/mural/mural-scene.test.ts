import { describe, expect, it } from 'vitest';
import type { Badge, MuralMotif, MuralMotifKind } from './mural-scene.js';

describe('motif and badge scene types', () => {
  it('a motif carries its dimension, kind, tier, geometry, count, and standout flag', () => {
    const motif: MuralMotif = {
      dimension: 'stars',
      kind: 'crownGate',
      tier: 3,
      x: 40,
      width: 60,
      baselineY: 172,
      count: 4800,
      standout: true,
      plaque: '4.8k ★',
    };

    expect(motif.dimension).toBe('stars');
    expect(motif.kind).toBe('crownGate');
    expect(motif.standout).toBe(true);
    expect(motif.plaque).toBe('4.8k ★');
    expect(motif.label).toBeUndefined();
  });

  it('a banner motif carries its dominant-language label', () => {
    const banner: MuralMotif = {
      dimension: 'languageBreadth',
      kind: 'banner',
      tier: 2,
      x: 0,
      width: 30,
      baselineY: 172,
      count: 8,
      standout: false,
      label: 'Rust',
    };

    expect(banner.label).toBe('Rust');
  });

  it('a badge carries a label and optional plaque', () => {
    const titled: Badge = { label: 'Star Magnet', plaque: '4.8k ★' };
    const generic: Badge = { label: 'The Journey Begins' };

    expect(titled.plaque).toBe('4.8k ★');
    expect(generic.plaque).toBeUndefined();
  });

  it('every motif kind is a valid MuralMotifKind', () => {
    const kinds: MuralMotifKind[] = [
      'banner',
      'crownGate',
      'sideRoad',
      'crowd',
      'bridge',
      'noticeBoard',
    ];

    expect(kinds).toHaveLength(6);
  });
});
