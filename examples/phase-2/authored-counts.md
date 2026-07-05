# Phase 2 — search-based opened counts and graceful degradation

Phase 2 adds two search-API totals to the snapshot: PRs opened and issues opened by
the user. Both are `number | null`; `null` means the search API was unavailable (the
dimension goes quiet), `0` means a genuine zero. A search failure never aborts the
snapshot and never yields a top-level `rate-limited` result.

Every output below mirrors a committed test case (deterministic, `FakeTransport`
inputs) — the numbers are traceable, not hand-picked.

## `fetchAuthoredCounts` — both searches return 200

Queries `GET /search/issues?q=author:{login}+type:pr&per_page=1` and the matching
`type:issue`, reading `total_count` from each. Mirrors
`fetch-authored-counts.test.ts` ("queries opened PRs and issues by author"):

```json
{
  "pullRequestsOpenedCount": 37,
  "issuesOpenedCount": 12
}
```

## Per-request degradation — PR search 403, issue search 200

Any non-200, rate-limit, missing body, or thrown transport error maps only that count
to `null`; the other still resolves. Mirrors `fetch-authored-counts.test.ts`
("degrades one count to null on a non-200 response"):

```json
{
  "pullRequestsOpenedCount": null,
  "issuesOpenedCount": 9
}
```

## `fetchGitHubSnapshot` — search available

Serializer tail (`stableHistorySnapshotJson`), counts pinned after `repositories`.
Mirrors `fetch-github-snapshot.test.ts` ("enriches the snapshot with opened PR and
issue counts from search"):

```json
  "pullRequestsOpenedCount": 128,
  "issuesOpenedCount": 44
}
```

## `fetchGitHubSnapshot` — search unavailable, still `kind: success`

Search failure degrades to `null` counts; the snapshot stays a success, profile and
calendar untouched. Mirrors `fetch-github-snapshot.test.ts` ("stays successful with
null opened counts when search is unavailable"):

```
kind: success
  "pullRequestsOpenedCount": null,
  "issuesOpenedCount": null
}
```
