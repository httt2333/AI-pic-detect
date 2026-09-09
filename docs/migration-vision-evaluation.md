# Migration Vision Evaluation

## Purpose

This document defines the approved reuse of the historical multi-agent
migration package. It preserves the user's accumulated visual-review evidence
and failure lessons as a candidate pool for VLM evaluation, prompts, and
automated Good/Bad cases. Current product scope remains governed by
`PROJECT_CONTEXT.md` and `DECISIONS.md`.

The package must not be used to make AI-origin, copyright, author, or identity
claims.

## Candidate Dimensions

The historical framework groups concerns by image scale:

| Group                | Historical dimensions                                                                       | API evaluation use                                                          |
| -------------------- | ------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------- |
| A: overall           | style impression, template feel, lighting, color, line quality                              | Context only; do not emit AI-origin-style conclusions.                      |
| B: subject structure | hand, eye, hair, face, body structure, perspective                                          | Candidate pool; prioritize hand, eye, hair, and body structure.             |
| C: local detail      | boundary adhesion, clothing folds, background objects, completion, penetration, accessories | Candidate pool; prioritize boundary adhesion, penetration, and accessories. |

The source calls this an "18-dimension" framework, but its active table names
five A dimensions, six B dimensions, and six C dimensions: 17 named
dimensions. It also notes C7/C8 noise dimensions are excluded. Do not encode a
runtime count or final taxonomy from this material until the source mapping is
reconciled.

## MVP Mapping

| Current provisional category | Historical candidate dimensions                   |
| ---------------------------- | ------------------------------------------------- |
| `hand`                       | B1 hand structure                                 |
| `eye_face`                   | B2 eye, B4 face                                   |
| `structure`                  | B3 hair, B5 body structure, B6 perspective        |
| `boundary_overlap`           | C1 boundary adhesion, C5 penetration              |
| `accessory_detail`           | C6 accessories; later C2/C3 only after validation |

The current five-category contract is intentionally smaller than the historical
candidate pool. New categories require annotated cases and reproducible
provider results before being exposed to users.

## Mandatory Decision Discipline

For every proposed issue:

1. Require a visible, localizable region. Without one, return `no_issue`.
2. Require a concrete object, location, and visible incorrect action. Do not
   emit vague claims such as "relationship unclear" or "logical problem".
3. Do not set a minimum issue count. Empty results and human review are valid
   outcomes for low-confidence or uncertain images.
4. Verify bbox side and location against the full image before emitting it.
5. Keep the language cautious: candidate issue, suggests checking, and human
   confirmation required.

## Three-Pass Workflow

Provider prompts or orchestration should preserve the intent of the historical
workflow:

1. Understand the full image and identify which candidate dimensions are
   visible.
2. Inspect applicable dimensions one by one.
3. Recheck only suspicious local regions before generating a structured issue.

This is a workflow hypothesis to evaluate, not a reason to reproduce old
scripts or adopt multi-agent complexity.

## Test Asset Rules

- Good cases must include a human annotation with expected category, normalized
  bbox, and observable reason.
- Bad cases must include clean images, non-visible dimensions, plausible but
  incorrect regions, and low-confidence cases expected to return `no_issue` or
  require human review.
- Store evidence references and concise human annotations, not provider raw
  responses, uploaded images, prompts, credentials, or unverified quotations.
- Player wording from the historical corpus is a retrieval aid, not proof. A
  claim may cite it only after the original corpus record is found and the
  image evidence is directionally consistent.

## Historical Failures To Preserve

- Never treat a plausible-looking statement as evidence.
- Never invent findings to fill a list or make a page look complete.
- Old DetectiveSAM, FLAME, and AniXplore results did not reliably distinguish
  anime images; they are not a primary route for this product.
- Visual-provider credentials and text-provider credentials can differ; test
  the intended visual endpoint explicitly.
- Maintain a single source of truth for constants, categories, and mappings.
