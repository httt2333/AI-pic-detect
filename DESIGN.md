# AI-PIC-DETECT Design Direction

## Landing page

The public landing page uses a premium editorial, image-first direction for
anime-image creators. Its visual hierarchy is built around one strong promise,
an annotated review image, and a linear product story: Find, Understand, Fix.

- Canvas: warm off-white with near-black type and restrained violet accents.
- Layout: asymmetric desktop compositions, generous negative space, and a
  linear mobile fallback. Avoid generic SaaS card grids.
- Imagery: the product sample remains the dominant proof. Annotations use thin
  violet lines and compact numbered markers rather than alarm-style boxes.
- Type: large, tightly tracked display headlines; quiet, readable supporting
  copy; short uppercase English labels are used sparingly.
- Motion: limited to entrance and story-state transitions and must respect
  reduced-motion preferences.
- Copy: the landing hook may discuss hard-to-notice AI traces, while supporting
  copy must preserve the product boundary: the tool identifies candidate areas
  for human review and never decides whether an image is AI-generated.

The upload CTA must continue to enter the existing guest upload flow. Landing
previews are illustrative and read-only; they may consume the centralized mock
contract but must not create a second analysis implementation.
