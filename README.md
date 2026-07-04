# git-epic

Your GitHub history replayed as an animated cinematic SVG — "The Epic of `<handle>`" — living in your profile README.

Spec: [`plans/000/git-epic-functional-spec.md`](plans/000/git-epic-functional-spec.md)

## Usage

```ts
import { renderEpic, type HistorySnapshot } from 'git-epic';

const snapshot: HistorySnapshot = {
  handle: 'first-spark',
  accountCreatedDate: '2019-03-14',
  firstPublicActivityDate: '2019-03-20',
  capturedAtDate: '2026-07-04',
};

const svg = renderEpic(snapshot);
// write svg somewhere, embed in a README — animation is baked in (SMIL)
```

Output is deterministic: same snapshot in, byte-identical SVG out.

### Render a fixture locally

```sh
pnpm render-fixture test-fixtures/single-contribution-account.json
# writes temp/single-contribution-account.svg — open it in a browser to watch the replay
```

Optional second arg sets the output path.
