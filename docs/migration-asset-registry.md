# Migration Asset Registry

This registry is the durable inventory of useful material from the historical
multi-agent migration package. It defines what may be reused, how it is used,
and what must not be copied into the public application.

## Private Source Assets

| Asset                                | Approved use                                                                | Handling                                                                     |
| ------------------------------------ | --------------------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| `all_tells_v10.jsonl`                | Dimension frequency, candidate inspection language, annotation backlog      | User-managed private source; never committed, served, or sent to a provider. |
| 18-dimension table and `dim_meta.py` | Canonical historical A/B/C vocabulary and dimension order                   | Reproduced as the typed `LEGACY_VISUAL_DIMENSIONS` map.                      |
| `踩坑_B_人眼判定与语料引用.md`       | Human-correction counterexamples and output discipline                      | Referenced by executable `VISION_API_BASELINE_CASES`.                        |
| `踩坑_C_模型工具与工程环境.md`       | Provider-key and failed-model-route constraints                             | Architecture and environment guidance only.                                  |
| Historical output samples            | Field-shape comparison for `bbox`, dimension id, observation, clue, and fix | Schema reference only; no legacy verdicts or raw provider responses.         |

## Local Asset Pipeline

`src/features/analyze/migration-corpus.ts` is the typed source of truth for
the historical A/B/C dimensions. It builds an index that only includes:

- source and retained record counts;
- known, non-noise dimension IDs; and
- unique `hit_element` values per dimension.

It intentionally excludes comments, authors, URLs, titles, platform IDs, and
all source metadata. The generated file belongs under `private-assets/`, which
is Git-ignored and must never be exposed through Next.js `public/`.

Build a local index from a user-authorized source file:

```powershell
pnpm migration:corpus:index <input.jsonl> private-assets/migration-corpus-v10.index.json
```

The index is a planning and evaluation asset. It is not an image-label dataset:
only a human-annotated image with an expected bbox can validate a model's visual
recognition behavior.

## Backend Use Order

1. Use `LEGACY_VISUAL_DIMENSIONS` to create a dimension-by-dimension inspection
   checklist.
2. Use the private index to prioritize annotation and provider tests by evidence
   volume, not to assert that a candidate is true.
3. Run human-annotated Good/Bad cases through the provider and contract parser.
4. Promote a dimension to user-visible behavior only after reproducible results.

The backend must not submit the corpus, original image assets, historical
verdicts, or raw evidence to a third-party VLM.
