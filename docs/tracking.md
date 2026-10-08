# Measurement configuration

Tracking is wired as an ID-gated site component. No real IDs or secrets are
committed. When an owner is ready, provide these environment variables through
the approved hosting/CI configuration:

| Variable | Service | Behavior |
| --- | --- | --- |
| `PUBLIC_GA4_MEASUREMENT_ID` | Google Analytics 4 | Loads `gtag.js` and sends page views with IP anonymization |
| `PUBLIC_META_PIXEL_ID` | Meta Pixel | Loads the browser pixel and sends `PageView` |
| `PUBLIC_X_PIXEL_ID` | X Pixel | Initializes the X pixel queue |

The component reads Cloudflare runtime env first and build-time `PUBLIC_*`
values second. Empty values render no tracking scripts. This keeps local
verification and previews credential-free and prevents placeholder IDs from
creating traffic in an owner's account.

No conversion, purchase, checkout, or advertising event is emitted yet:
checkout remains `PAYMENTS_UNAVAILABLE`, and a browser event must never be
treated as payment or order authority.
