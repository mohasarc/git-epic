import { describe, expect, it } from 'vitest';
import { expectEmbedSafeSvg } from '../../test-support/expect-embed-safe-svg.js';
import { CREDIT_LINE } from '../../timeline/attribution.js';
import { centeredText, CENTER_X } from '../scene-primitives.js';
import { PALETTE } from '../visual-vocabulary.js';
import { renderStillBeingWrittenCard } from './still-being-written-card.js';

describe('renderStillBeingWrittenCard', () => {
  it('renders an 830x415 root with matching viewBox', () => {
    const svg = renderStillBeingWrittenCard();
    expect(svg).toContain('width="830"');
    expect(svg).toContain('height="415"');
    expect(svg).toContain('viewBox="0 0 830 415"');
  });

  it('renders the primary line and asks the viewer to return shortly', () => {
    const svg = renderStillBeingWrittenCard();
    expect(svg).toContain('>The epic is still being written</text>');
    expect(svg).toContain('shortly');
  });

  it('carries the credit line with the ambient treatment and no epic title', () => {
    const svg = renderStillBeingWrittenCard();
    expect(svg).toContain(
      centeredText(CREDIT_LINE, CENTER_X, 391, { fontSize: 13, fill: PALETTE.dimText }),
    );
    expect(svg).not.toContain('THE EPIC OF');
    expect(svg).not.toContain('The Epic of');
  });

  it('renders byte-identically across repeated calls', () => {
    expect(renderStillBeingWrittenCard()).toBe(renderStillBeingWrittenCard());
  });

  it('is embed-safe and carries an indefinite twinkle animation', () => {
    const svg = renderStillBeingWrittenCard();
    expectEmbedSafeSvg(svg);
    expect(svg).toContain('repeatCount="indefinite"');
  });
});
