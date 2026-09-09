# Vision API Test Baseline

This document records the narrow subset of historical review evidence that can
guide future vision API tests. It does not change the current product scope,
user, or P0/P1/P2 priorities. Those remain governed by the latest project
context and decisions.

## Provenance and Limits

The source material is the historical multi-agent migration package supplied
outside this repository. It is reference material, not a model benchmark and
not a source of current product decisions.

No historical images, user data, credentials, provider responses, AI-origin
verdicts, or old 18-dimension taxonomy are copied into this repository. A
future integration test must use a separately approved local image and a fresh
human annotation before it is treated as an acceptance case.

## Retained Baseline

The executable metadata lives in
`src/features/analyze/vision-api-baseline.ts`.

| Case                       | Historical evidence                                                           | Future API expectation                                                            |
| -------------------------- | ----------------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| Symmetric eye highlights   | A human correction established that symmetry alone is not an eye defect.      | Return no eye issue solely because highlights are symmetric.                      |
| Hidden or uncertain region | A human correction revoked an uncertain left/right claim.                     | Return no issue instead of guessing a location or side.                           |
| Ambiguous image            | A human correction rejected fabricated findings used to reach a target count. | Return `no_issue` when no supported candidate exists; never force an issue count. |

For every returned issue, require a specific object, location, visual concern,
and actionable suggestion. The response must never determine whether the image
was AI-generated.

## Excluded Historical Material

- AI-origin classifications, confidence percentages, and global risk verdicts.
- Pixel-space AI detectors that historical testing found unreliable for anime
  images.
- The previous 18-dimension taxonomy and unverified model combinations.
- Historical visual examples not backed by a clear human-review correction.

The migration package includes a hand-structure sample, but its source does
not provide an independently traceable human-review correction. It remains a
candidate for a future freshly annotated test image, not a current baseline
case.

## Future Integration Procedure

1. Obtain one approved local test image and create a fresh human annotation.
2. Record the image only in an ignored local test-fixture directory; do not
   commit it or a provider response.
3. Run the provider manually with the baseline prompt and validate its result
   through `sanitizeAnalysisOutput`.
4. Compare the result against the fresh annotation, including bbox overlap and
   the no-issue counterexamples.
5. Record only aggregate pass/fail results and non-sensitive failure reasons in
   project documentation.
