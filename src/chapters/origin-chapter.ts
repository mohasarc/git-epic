import type { HistorySnapshot } from '../history-snapshot.js';
import type { OriginChapter } from './chapter.js';

export function detectOriginChapter(snapshot: HistorySnapshot): OriginChapter {
  return { kind: 'origin', date: snapshot.firstPublicActivityDate };
}
