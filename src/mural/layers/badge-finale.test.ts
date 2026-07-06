import { describe, expect, it } from 'vitest';
import { detectChapters } from '../../chapters/detect-chapters.js';
import { narrateChapter } from '../../narration/narrate-chapter.js';
import { scoreStrengths } from '../../strengths/score-strengths.js';
import { buildHistorySnapshot } from '../../test-support/build-history-snapshot.js';
import { loadHistorySnapshotFixture } from '../../test-support/load-history-snapshot-fixture.js';
import { expectEmbedSafeSvg } from '../../test-support/expect-embed-safe-svg.js';
import type { HistorySnapshot } from '../../history-snapshot.js';
import type { NarratedChapter } from '../../timeline/build-timeline.js';
import { buildMuralScene } from '../build-mural-scene.js';
import { deriveBadges } from '../derive-badges.js';
import type { Badge, MuralScene } from '../mural-scene.js';
import { MURAL_HEIGHT } from '../mural-vocabulary.js';
import { desert } from '../worlds/desert.js';
import { renderBadgeFinale } from './badge-finale.js';

function narrate(snapshot: HistorySnapshot): NarratedChapter[] {
  return detectChapters(snapshot).map((chapter) => ({ chapter, narration: narrateChapter(chapter) }));
}

// Badge derivation is wired into scene.badges in Phase 9; inject it here to pin the render.
function sceneOf(snapshot: HistorySnapshot): MuralScene {
  const strengths = scoreStrengths(snapshot);
  return { ...buildMuralScene(snapshot, narrate(snapshot), strengths), badges: deriveBadges(strengths) };
}

function fakeScene(overrides: Partial<MuralScene>): MuralScene {
  return {
    handle: 'someone',
    width: 800,
    height: MURAL_HEIGHT,
    worldScale: 'town',
    eras: [],
    badges: [{ label: 'Star Magnet' }],
    subtitle: '',
    presentDayLabel: '',
    accessibleTitle: '',
    accessibleDescription: '',
    ...overrides,
  };
}

const PANEL_RECT = /<rect x="([-\d.]+)" y="([-\d.]+)" width="([\d.]+)" height="([\d.]+)" rx=/;

function panelGeometry(svg: string): { x: number; y: number; width: number; height: number } {
  const match = svg.match(PANEL_RECT);
  if (!match) throw new Error('no badge panel rect');
  return { x: Number(match[1]), y: Number(match[2]), width: Number(match[3]), height: Number(match[4]) };
}

const brandNewScene = sceneOf(
  buildHistorySnapshot({
    handle: 'unwritten-legend',
    firstPublicActivityDate: null,
    accountCreatedDate: '2026-06-30',
    capturedAtDate: '2026-07-04',
  }),
);
const richScene = sceneOf(loadHistorySnapshotFixture('rich-history-account.json'));

describe('renderBadgeFinale panel presence', () => {
  it('draws a panel for a rich profile', () => {
    expect(renderBadgeFinale(richScene, desert)).toMatch(PANEL_RECT);
  });

  it('draws a panel for a brand-new profile with the journey-begins badge', () => {
    const svg = renderBadgeFinale(brandNewScene, desert);
    expect(brandNewScene.badges).toEqual([{ label: 'The Journey Begins' }]);
    expect(svg).toMatch(PANEL_RECT);
    expect(svg).toContain('The Journey Begins');
  });
});

describe('renderBadgeFinale badge text', () => {
  it('renders every badge label and separates two badges with a middle dot', () => {
    const badges: Badge[] = [{ label: 'Star Magnet' }, { label: 'Polyglot Explorer' }];
    const svg = renderBadgeFinale(fakeScene({ badges }), desert);
    expect(svg).toContain('Star Magnet');
    expect(svg).toContain('Polyglot Explorer');
    expect(svg).toContain('·');
  });

  it('renders one badge with no dangling separator', () => {
    const svg = renderBadgeFinale(fakeScene({ badges: [{ label: 'Relentless' }] }), desert);
    expect(svg).toContain('Relentless');
    expect(svg).not.toContain('·');
  });

  it('appends a per-badge plaque after its label', () => {
    const svg = renderBadgeFinale(fakeScene({ badges: [{ label: 'Star Magnet', plaque: '1.2k ★' }] }), desert);
    expect(svg).toContain('Star Magnet 1.2k ★');
  });
});

describe('renderBadgeFinale geometry', () => {
  it('anchors the panel in the strip right region', () => {
    const scene = fakeScene({ width: 800, badges: [{ label: 'Star Magnet' }] });
    const panel = panelGeometry(renderBadgeFinale(scene, desert));
    expect(panel.x).toBeGreaterThan(scene.width / 2);
    expect(panel.x + panel.width).toBeLessThanOrEqual(scene.width);
  });

  it('keeps the panel below era titles and above metropolis rooftops', () => {
    const panel = panelGeometry(renderBadgeFinale(richScene, desert));
    expect(panel.y).toBeGreaterThan(52);
    expect(panel.y + panel.height).toBeLessThan(172);
  });

  it('keeps a long badge line on a narrow mural inside the canvas', () => {
    const badges: Badge[] = [
      { label: 'Polyglot Explorer' },
      { label: 'Prolific Builder' },
      { label: 'Star Magnet' },
      { label: 'Relentless' },
    ];
    const scene = fakeScene({ width: 368, badges });
    const svg = renderBadgeFinale(scene, desert);
    const panel = panelGeometry(svg);
    expect(panel.x).toBeGreaterThanOrEqual(0);
    expect(panel.x + panel.width).toBeLessThanOrEqual(scene.width);
    const fontSize = Number(svg.match(/font-size="([\d.]+)"/)![1]);
    expect(fontSize).toBeLessThan(12);
    expect(fontSize).toBeGreaterThanOrEqual(7);
  });

  it('sizes the panel to its content, not to an era', () => {
    const narrow = panelGeometry(renderBadgeFinale(fakeScene({ badges: [{ label: 'Followed' }] }), desert));
    const wide = panelGeometry(
      renderBadgeFinale(fakeScene({ badges: [{ label: 'Heavy PR Contributor' }, { label: 'Polyglot Explorer' }] }), desert),
    );
    expect(wide.width).toBeGreaterThan(narrow.width);
  });
});

describe('renderBadgeFinale anchor width', () => {
  it('defaults anchorWidth to scene.width, byte-identical', () => {
    expect(renderBadgeFinale(richScene, desert)).toBe(renderBadgeFinale(richScene, desert, { anchorWidth: richScene.width }));
  });

  it('anchors to the given width, not scene.width', () => {
    const scene = fakeScene({ width: 2000, badges: [{ label: 'Star Magnet' }] });
    const panel = panelGeometry(renderBadgeFinale(scene, desert, { anchorWidth: 640 }));
    expect(panel.x + panel.width).toBeLessThanOrEqual(640);
  });
});

describe('renderBadgeFinale escaping', () => {
  it('escapes an XML-hostile badge label and plaque', () => {
    const badges: Badge[] = [{ label: '<b>&"Legend"</b>', plaque: "9 & <> '★'" }];
    expectEmbedSafeSvg(renderBadgeFinale(fakeScene({ badges }), desert));
  });
});
