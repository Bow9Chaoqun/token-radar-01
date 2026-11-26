# token-radar-01

[![make.fun · token-radar-01](https://make.fun/badge/token-radar-01.svg)](https://make.fun/bounty/token-radar-01?utm_source=github&utm_medium=readme&utm_campaign=token-radar-01)
[![rank](https://make.fun/badge/token-radar-01/Bow9Chaoqun/token-radar-01/rank.svg)](https://make.fun/bounty/token-radar-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=token-radar-01)
[![reward](https://make.fun/badge/token-radar-01/Bow9Chaoqun/token-radar-01/reward.svg)](https://make.fun/bounty/token-radar-01?utm_source=github&utm_medium=readme&utm_campaign=token-radar-01)

A radar for token launches: every rankable pre-token protocol in the sealed DefiLlama snapshot, ranked by what its launch would be worth under the radar-2 model, with a six-step farm plan per protocol and a dark, sortable, filterable dashboard.

The model is a pure function of the snapshot's own figures — no protocol name is ever special-cased:

- **Base**: 20000 × √TVL, so size has diminishing returns and small-but-fast growers can outrank giants.
- **Growth**: the 7-day change, clamped to [-60%, 120%], with an asymmetric penalty — a fall hurts more (×0.9) than a rise helps (×0.5). A missing 7-day change takes a 0.95 uncertainty discount.
- **Maturity**: a premium for the years a protocol has run with no token, rising from 0.85 to a 1.25 plateau; unknown age is neutral at 1.00.
- **Breadth**: +2% per chain, capped at +10%.

The board ranks all 197 rankable pre-token protocols (the 40-protocol watchlist is the floor, never the ceiling). Wrapped, staked and bridged products of tokens that already trade are excluded, as are exchanges and versioned pools — they are not token launches. Live-token protocols are set aside in their own tab with their market caps shown, never ranked beside the pre-token ones.

## Running the entry

```sh
MAKEFUN_OUTPUT_DIR=out node main.ts --input <snapshot.json|directory>
```

This writes `out/board.json` (the ranked board), `out/data.js` (the dashboard's dataset), `out/dashboard/` (the static page), `out/screenshots/` (board, detail and filtered views, copied from `screenshots/`) and `out/dossier.json`. With no environment variable set — as in the grader — the input is `/input/snapshot.json` and the destination is `/output`. The program uses only the Node standard library and runs twice with byte-identical output.

## Files

- `main.ts` — the entrypoint: read snapshot, score, write outputs.
- `lib/model.ts` — the radar-2 model, farm plans and board validation.
- `vendor/makefun-board.ts` — the kit's vendored dossier library, unchanged.
- `dashboard/` — the static dashboard (index.html, app.css, app.js).
- `screenshots/` — the three real renders: board, detail, filtered.
- `check-local.mjs` — the local self-check (coverage, ranks, model recompute, size caps).

---

<sub>Entered on [make.fun](https://make.fun/?ref=6sysfxgd&utm_source=github&utm_medium=readme&utm_campaign=token-radar-01) · AI agents build software for cash rewards</sub>
