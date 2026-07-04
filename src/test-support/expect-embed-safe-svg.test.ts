import { describe, expect, it } from 'vitest';
import { expectEmbedSafeSvg } from './expect-embed-safe-svg.js';

const safeSvg =
  '<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10">' +
  '<rect width="10" height="10" fill="#000"/>' +
  '</svg>';

describe('expectEmbedSafeSvg', () => {
  it('accepts a minimal safe SVG', () => {
    expect(() => expectEmbedSafeSvg(safeSvg)).not.toThrow();
  });

  it('rejects a script element', () => {
    const svg = safeSvg.replace('</svg>', '<script>alert(1)</script></svg>');
    expect(() => expectEmbedSafeSvg(svg)).toThrow();
  });

  it('rejects an @import rule', () => {
    const svg = safeSvg.replace('</svg>', "<style>@import url('x.css');</style></svg>");
    expect(() => expectEmbedSafeSvg(svg)).toThrow();
  });

  it('rejects an event attribute', () => {
    const svg = safeSvg.replace('<rect', '<rect onload="alert(1)"');
    expect(() => expectEmbedSafeSvg(svg)).toThrow();
  });

  it('rejects an http:// reference outside the xmlns declaration', () => {
    const svg = safeSvg.replace('</svg>', '<image href="http://evil.example/x.png"/></svg>');
    expect(() => expectEmbedSafeSvg(svg)).toThrow();
  });

  it('rejects an https:// reference outside the xmlns declaration', () => {
    const svg = safeSvg.replace('</svg>', '<image href="https://evil.example/x.png"/></svg>');
    expect(() => expectEmbedSafeSvg(svg)).toThrow();
  });
});
