# Vision API Spike Results

## Scope

- Date: 2026-09-08
- Provider path: EvoLink Gemini native API, using the configured multimodal
  endpoint and `gemini-3.8-flash`.
- Input: one user-authorized local PNG. The image is a stylized 3D game
  screenshot, not an in-scope anime-character evaluation sample.
- Data handling: the image was sent once to the provider. This record contains
  no image, prompt, credential, or raw provider response.

## Observed Result

The provider returned parseable JSON and two candidate issues using the
`boundary_overlap` and `accessory_detail` categories. The result failed the
local output-contract validation: at least one required field or normalized
bbox constraint was invalid. The raw response was deliberately discarded.

## Status

| Capability                               | Status                        | Evidence                                                               |
| ---------------------------------------- | ----------------------------- | ---------------------------------------------------------------------- |
| Provider connectivity                    | Verified usable               | A real one-image request completed successfully.                       |
| JSON response mode                       | Verified usable               | The response parsed as JSON.                                           |
| Candidate category emission              | Demo usable, not yet reliable | Two allowed categories were returned from one non-target-domain image. |
| Production-ready structured issue output | Not verified                  | The local contract rejected the response.                              |
| Normalized bbox reliability              | Not verified                  | A valid normalized bbox result was not established.                    |
| Anime character defect detection         | Not verified                  | The single input was out of the intended MVP image domain.             |

## Follow-up Anime Image Attempt

A later user-authorized anime-character JPG was tested with the historical A/B/C
dimension vocabulary. The full structured request did not return a usable
result. A simplified retry requesting only `dim_id`, normalized bbox, and
confidence also failed with a client-side JSON parsing error. Raw responses
were discarded, so it cannot be determined whether the invalid JSON came from
the provider envelope or generated candidate text.

This establishes that the provider can describe an image in a simple request,
but its structured-output behavior is not yet verified as reliable enough for
the analysis API. Do not add a production integration until the response shape
is captured safely in a non-production diagnostic flow and can pass the local
contract repeatedly.

A subsequent retry supplied the provider-native `responseSchema` for the
minimal dimension, bbox, and confidence shape. It failed before a usable
response was parsed with a client-side request `TypeError`. This did not prove
whether the cause was endpoint compatibility, a provider-side schema rule, or
transient transport behavior. It does prove that schema enforcement has not
yet made the structured path usable.

## Single-Dimension Stability Probe

The non-production probe sends one user-authorized image with a plain-text
instruction and accepts only one historical A/B/C dimension ID or `NONE`.
It does not request JSON, bbox, confidence, explanations, or a fixed issue
count.

| Call | Sanitized result | Dimension ID  |
| ---- | ---------------- | ------------- |
| 1    | `invalid_output` | Not available |

The acceptance rule requires three consecutive, identical accepted values.
The first call was invalid, so this provider is currently **not stable** for
single-dimension classification. The remaining calls were intentionally not
made, and no bbox work should proceed from this result.

## Description Stability Probe

The same user-authorized anime image was submitted three times with the same
plain-text instruction requesting only a concise visible-content description.
No output format, category, bbox, or JSON was requested.

| Call | Sanitized result                            |
| ---- | ------------------------------------------- |
| 1    | Non-empty text received (154 characters)    |
| 2    | Non-empty text received (159 characters)    |
| 3    | Request failed with client-side `TypeError` |

The acceptance rule required three consecutive non-empty descriptions. It was
not met. EvoLink's basic image-description path is therefore demo-usable but
currently unstable; it cannot support a production analysis dependency.

## GPT Responses Health Check

EvoLink's OpenAI-compatible Responses endpoint was called without an image
using `gpt-5.6-luna`, low reasoning effort, and `store: false`. It returned a
completed response with non-empty text. This verifies only the text route,
model access, and no-server-storage setting. The supplied GPT documentation
requires a publicly downloadable image URL for visual input, so it does not
establish GPT visual capability.

## Next Test

Use one user-authorized anime-character PNG or JPEG with a human annotation.
Keep the same strict parser and record only sanitized field-level validation
outcomes. Do not treat this result as validation of an AI-origin detector,
copyright assessor, or automatic image-fixing feature.
