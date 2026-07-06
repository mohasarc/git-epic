import { escapeXmlText } from '../../rendering/escape-xml-text.js';
import type { MuralScene } from '../mural-scene.js';

/**
 * The accessibility surface the cosmic path lacks: <title> naming the epic and <desc>
 * carrying the assembled narration prose. Both strings are escaped; the <desc> is pure
 * narration and never interpolates a URL. Emitted first so assistive tech reads them
 * before the visual body.
 */
export function renderAccessibility(scene: MuralScene): string {
  return (
    `<title>${escapeXmlText(scene.accessibleTitle)}</title>` +
    `<desc>${escapeXmlText(scene.accessibleDescription)}</desc>`
  );
}
