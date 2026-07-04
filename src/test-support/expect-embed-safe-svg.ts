import { expect } from 'vitest';

/** Vitest assertion: SVG contains no scripts, external references, or event attributes. */
export function expectEmbedSafeSvg(svg: string): void {
  expect(svg).not.toContain('<script');
  expect(svg).not.toContain('@import');
  expect(svg).not.toMatch(/\son\w+=/i);
  const withoutSvgNamespace = svg.replace('xmlns="http://www.w3.org/2000/svg"', '');
  expect(withoutSvgNamespace).not.toContain('http://');
  expect(withoutSvgNamespace).not.toContain('https://');
}
