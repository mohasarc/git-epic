import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

import { expectEmbedSafeSvg } from '../test-support/expect-embed-safe-svg.js';
import { CREDIT_LINE } from '../timeline/attribution.js';

const PROTOTYPE_STYLE_NAMES = [
  'universe-from-first-commit',
  'illuminated-manuscript',
  'constellation-cartography',
] as const;

const NARRATION_CAPTION =
  'In the year 2011, the developer first set foot upon the public forge, and the epic began.';

const DARK_BACKGROUND_LUMINANCE_CEILING = 0.2;

const prototypesDirectoryUrl = new URL('../../examples/stage-0-prototypes/', import.meta.url);

function loadPrototypeSvg(styleName: string): string {
  const prototypePath = fileURLToPath(new URL(`${styleName}.svg`, prototypesDirectoryUrl));
  try {
    return readFileSync(prototypePath, 'utf8');
  } catch {
    throw new Error(`Prototype SVG not found: ${prototypePath}`);
  }
}

function backgroundFill(svg: string): string {
  const canvasRect = svg.match(
    /<rect[^>]*width="830"[^>]*height="415"[^>]*fill="(#[0-9a-fA-F]{6})"/,
  );
  if (!canvasRect) throw new Error('No full-canvas rect with a hex fill found');
  return canvasRect[1];
}

function relativeLuminance(hexColor: string): number {
  const linearChannel = (offset: number): number => {
    const channel = parseInt(hexColor.slice(offset, offset + 2), 16) / 255;
    return channel <= 0.03928 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * linearChannel(1) + 0.7152 * linearChannel(3) + 0.0722 * linearChannel(5);
}

describe.each(PROTOTYPE_STYLE_NAMES)('%s prototype', (styleName) => {
  it('is a single-root 830x415 svg document', () => {
    const svg = loadPrototypeSvg(styleName);
    expect(svg.match(/<svg/g)).toHaveLength(1);
    const rootTag = svg.slice(0, svg.indexOf('>') + 1);
    expect(rootTag).toContain('width="830"');
    expect(rootTag).toContain('height="415"');
    expect(rootTag).toContain('viewBox="0 0 830 415"');
    expect(svg.trimEnd().endsWith('</svg>')).toBe(true);
  });

  it('has a dark background', () => {
    const svg = loadPrototypeSvg(styleName);
    expect(relativeLuminance(backgroundFill(svg))).toBeLessThan(
      DARK_BACKGROUND_LUMINANCE_CEILING,
    );
  });

  it('animates with SMIL and loops the ambient state', () => {
    const svg = loadPrototypeSvg(styleName);
    expect(svg).toContain('<animate');
    expect(svg).toContain('repeatCount="indefinite"');
  });

  it('shows title card, narration caption, and ambient attribution', () => {
    const svg = loadPrototypeSvg(styleName);
    expect(svg).toContain('THE EPIC OF');
    expect(svg).toContain(NARRATION_CAPTION);
    expect(svg).toContain('The Epic of');
    expect(svg).toContain(CREDIT_LINE);
  });

  it('is embed-safe', () => {
    const svg = loadPrototypeSvg(styleName);
    expectEmbedSafeSvg(svg);
  });
});
