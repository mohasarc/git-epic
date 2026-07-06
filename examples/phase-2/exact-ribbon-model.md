# Phase 2 output preview — exact per-day export ribbon

`buildExactRibbon(row, contributionDays)` is a pure model, not SVG. It turns one
`ExportRow` and the raw contribution days into render-ready `RibbonColumn[]`: one
column per real day of the row's date span, mapped time-linearly, then adjacent
equal-density days merged to bound rect count.

## Input

Row spanning two eras, `2024-01-01 → 2024-01-25` (24 day columns), row width 270:

```
contributions: 2024-01-04=2 2024-01-05=2 2024-01-06=2 2024-01-07=6 2024-01-08=6 2024-01-09=6 2024-01-10=6
```

## Output

```
sum(input counts): 30
conservation sum(column.count): 30      # exact: every in-span contribution lands in one column
per-day columns: 24 -> merged columns: 4

merged (render-ready RibbonColumn[]):
  x=0      width=33.75   density=0.08    # quiet run, floored + merged into one band
  x=33.75  width=33.75   density=0.4     # three days at count 2
  x=67.5   width=45      density=1       # burst days at count 6, saturated
  x=112.5  width=157.5   density=0.08    # trailing quiet run, one band
```

Width per day is uniform (`row.width / spanDays`), decoupled from era pixel width —
the honest time axis. Quiet days floor at `RIBBON_MIN_DENSITY = 0.08` so the ribbon
is never empty. Counts are conserved before the merge, which is what makes it "exact"
rather than the SVG's compressed `bucketRibbon`.
