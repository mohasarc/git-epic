# Phase 4 output preview — deriveBadges

`deriveBadges(scoreStrengths(snapshot))` per profile fixture. Deterministic: same snapshot in, same badges out.

| fixture | top dimension (tier) | dominant language | badges |
| --- | --- | --- | --- |
| rich-history | pullRequests (t3) | JavaScript @ 0.50 | `JavaScript Specialist` · `Heavy PR Contributor` · `Followed` · `Star Magnet` |
| star-heavy | stars (t4) | TypeScript @ 0.75 | `TypeScript Specialist` · `Star Magnet` · `Followed` · `Heavy PR Contributor` |
| polyglot | languageBreadth (t3) | TypeScript @ 0.11 | `Polyglot Explorer` · `Prolific Builder` · `Star Magnet` · `Relentless` |
| pr-heavy | pullRequests (t3) | TypeScript @ 0.33 | `Heavy PR Contributor` · `Relentless` · `Star Magnet` · `Polyglot Explorer` |
| modest | languageBreadth (t2) | TypeScript @ 0.40 | `Polyglot Explorer` · `Star Magnet` · `Relentless` · `Heavy PR Contributor` |
| brand-new | stars (t0) | none | `The Journey Begins` |
| single-contribution | stars (t0) | none | `The Journey Begins` |

Raw:

```
rich-history: ["JavaScript Specialist","Heavy PR Contributor","Followed","Star Magnet"]
star-heavy: ["TypeScript Specialist","Star Magnet","Followed","Heavy PR Contributor"]
polyglot: ["Polyglot Explorer","Prolific Builder","Star Magnet","Relentless"]
pr-heavy: ["Heavy PR Contributor","Relentless","Star Magnet","Polyglot Explorer"]
modest: ["Polyglot Explorer","Star Magnet","Relentless","Heavy PR Contributor"]
brand-new: ["The Journey Begins"]
single-contribution: ["The Journey Begins"]
```
