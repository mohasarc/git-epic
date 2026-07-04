const XML_ESCAPES: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
};

export function escapeXmlText(text: string): string {
  return text.replace(/[&<>"']/g, (character) => XML_ESCAPES[character]);
}
