# git-epic

Your GitHub history replayed as an animated cinematic SVG — "The Epic of `<handle>`" — living in your profile README.

![The Epic of saga-weaver](examples/stage-3-phase-5/rich-history-account.svg)

Rendered from [`test-fixtures/rich-history-account.json`](test-fixtures/rich-history-account.json) — title card, chapter replay, then a living ambient state. Animation is baked in (SMIL); it plays right here on github.com.

Spec: [`plans/000/git-epic-functional-spec.md`](plans/000/git-epic-functional-spec.md)

## Usage

```ts
import { renderEpic, type HistorySnapshot } from 'git-epic';

const snapshot: HistorySnapshot = {
  handle: 'first-spark',
  accountCreatedDate: '2019-03-14',
  firstPublicActivityDate: '2019-03-20',
  capturedAtDate: '2026-07-04',
  contributionDays: [],
  repositories: [],
};

const svg = renderEpic(snapshot);
// write svg somewhere, embed in a README — animation is baked in (SMIL)
```

Output is deterministic: same snapshot in, byte-identical SVG out.

### Chapters without rendering

`detectChapters` finds the career's chapters from a snapshot; `narrateChapter` turns one into its caption. Same functions `renderEpic` uses internally.

```ts
import { detectChapters, narrateChapter, type Chapter } from 'git-epic';
import { readFileSync } from 'node:fs';

const snapshot = JSON.parse(readFileSync('test-fixtures/rich-history-account.json', 'utf8'));

const chapters: Chapter[] = detectChapters(snapshot);
// [{ kind: 'origin', date: '2018-01-10' },
//  { kind: 'prolificacy', date: '2019-01-01', year: 2019, ... },
//  ...8 chapters total — display-ordered, capped at the 8 most dramatic]

narrateChapter(chapters[0]);
// 'In the year 2018, the developer first set foot upon the public forge, and the epic began.'
```

Seven chapter kinds: origin, dark age, great streak, prolificacy, flagship rise, star milestone, language era. Detection is mechanical — thresholds and precedence live in the spec.

### Render a fixture locally

```sh
pnpm render-fixture test-fixtures/rich-history-account.json
# writes temp/rich-history-account.svg — open it in a browser to watch the replay
```

Optional second arg sets the output path.
