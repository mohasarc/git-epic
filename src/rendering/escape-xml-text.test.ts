import { describe, expect, it } from 'vitest';
import { escapeXmlText } from './escape-xml-text.js';

describe('escapeXmlText', () => {
  it('escapes & < > " \'', () => {
    expect(escapeXmlText(`&<>"'`)).toBe('&amp;&lt;&gt;&quot;&#39;');
  });

  it('escapes each occurrence, not only the first', () => {
    expect(escapeXmlText('a&b&c')).toBe('a&amp;b&amp;c');
  });

  it('passes plain text through', () => {
    expect(escapeXmlText('The Epic of first-spark')).toBe('The Epic of first-spark');
  });
});
