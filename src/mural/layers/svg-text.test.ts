import { describe, expect, it } from 'vitest';
import { escapeXmlText } from '../../rendering/escape-xml-text.js';
import { svgText } from './svg-text.js';

const FONT_STACK = "system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif";
const OUTLINE = '#3a2417';

describe('svgText', () => {
  it('emits the subtitle combination (start anchor, no weight)', () => {
    expect(svgText('The Epic', 24, 28, { fontSize: 13, anchor: 'start', letterSpacing: 0.5 })).toBe(
      `<text x="24" y="28" font-family="${FONT_STACK}" font-size="13" fill="${OUTLINE}" text-anchor="start" letter-spacing="0.5">The Epic</text>`,
    );
  });

  it('emits the era-title combination (middle anchor, bold weight)', () => {
    expect(svgText('ORIGINS', 100, 52, { fontSize: 14, anchor: 'middle', fontWeight: 'bold', letterSpacing: 1.5 })).toBe(
      `<text x="100" y="52" font-family="${FONT_STACK}" font-size="14" fill="${OUTLINE}" text-anchor="middle" letter-spacing="1.5" font-weight="bold">ORIGINS</text>`,
    );
  });

  it('emits the present-day combination (middle anchor, no weight)', () => {
    expect(svgText('present day', 100, 156, { fontSize: 11, anchor: 'middle', letterSpacing: 1 })).toBe(
      `<text x="100" y="156" font-family="${FONT_STACK}" font-size="11" fill="${OUTLINE}" text-anchor="middle" letter-spacing="1">present day</text>`,
    );
  });

  it('escapes XML-hostile content', () => {
    const svg = svgText('<b>&"weird', 0, 0, { fontSize: 12, anchor: 'start', letterSpacing: 0 });
    expect(svg).not.toContain('<b>&');
    expect(svg).toContain(escapeXmlText('<b>&"weird'));
  });
});
