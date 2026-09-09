# AI-PIC-DETECT Project Context

AI-PIC-DETECT is a single-image, pre-publication review tool for anime and
anime-character image creators. Its value is: identify a local area worth
human review, explain why, prioritize it, and offer an actionable human
editing suggestion.

It is not an AI-authenticity detector, a copyright decision service, an author
identification service, or an automatic image editor.

P0 is limited to one PNG/JPEG/WebP upload, validation, analysis states,
normalized bbox issue markers, a finite issue taxonomy, priority, reason,
suggestion, low-confidence filtering, next-item review navigation, and a local
ignore action.

An unauthenticated creator can complete one image analysis directly. Login is
not an analysis prerequisite. If an account system is added later, its value is
to support history, repeat reviews, and usage allowances rather than to block
the initial core workflow.

The approved first commercial layer is guest access with one free review,
followed by one-time CNY review-credit packs of 10, 50, and 200 checks. The
50-pack is recommended. Price fields remain configurable placeholders until
the actual model/API cost is measured; subscriptions are not planned. The
template account, credit balance, purchase-record, and review-history surfaces
may be exposed as a safe frontend shell, but server-side entitlement,
consumption, persistence, and a verified payment provider must be implemented
before any purchase is enabled.
