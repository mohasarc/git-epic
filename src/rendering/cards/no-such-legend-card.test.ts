import { describe, expect, it } from 'vitest';
import { expectEmbedSafeSvg } from '../../test-support/expect-embed-safe-svg.js';
import { CREDIT_LINE } from '../../timeline/attribution.js';
import { centeredText, CENTER_X } from '../scene-primitives.js';
import { PALETTE } from '../visual-vocabulary.js';
import { renderNoSuchLegendCard } from './no-such-legend-card.js';

describe('renderNoSuchLegendCard', () => {
  it('renders an 830x415 root with matching viewBox', () => {
    const svg = renderNoSuchLegendCard('ghost-handle');
    expect(svg).toContain('width="830"');
    expect(svg).toContain('height="415"');
    expect(svg).toContain('viewBox="0 0 830 415"');
  });

  it('renders the canonical primary line and names the requested handle', () => {
    const svg = renderNoSuchLegendCard('ghost-handle');
    expect(svg).toContain('>No such legend</text>');
    expect(svg).toContain('ghost-handle');
  });

  it('escapes an XML-hostile handle so the body stays embed-safe', () => {
    const svg = renderNoSuchLegendCard('<script>&"');
    expect(svg).toContain('&lt;script&gt;&amp;&quot;');
    expect(svg).not.toContain('<script>&"');
    expectEmbedSafeSvg(svg);
  });

  it('carries the credit line with the ambient treatment and no epic title', () => {
    const svg = renderNoSuchLegendCard('ghost-handle');
    expect(svg).toContain(
      centeredText(CREDIT_LINE, CENTER_X, 391, { fontSize: 13, fill: PALETTE.dimText }),
    );
    expect(svg).not.toContain('THE EPIC OF');
    expect(svg).not.toContain('The Epic of');
  });

  it('renders byte-identically across repeated calls', () => {
    expect(renderNoSuchLegendCard('ghost-handle')).toBe(renderNoSuchLegendCard('ghost-handle'));
  });

  it('seeds its starfield from the handle', () => {
    expect(renderNoSuchLegendCard('one')).not.toBe(renderNoSuchLegendCard('two'));
  });

  it('is embed-safe and carries an indefinite twinkle animation', () => {
    const svg = renderNoSuchLegendCard('ghost-handle');
    expectEmbedSafeSvg(svg);
    expect(svg).toContain('repeatCount="indefinite"');
  });
});
