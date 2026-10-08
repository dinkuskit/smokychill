# smokychill 🧊 — Herbal Ice, on its own site

smokychill is the storefront for smokychill.com, a single-product shop for Herbal Ice: a menthol and camphor cooling balm with CBD isolate in a 4 oz jar. It is an [EmDash](https://github.com/emdash-cms/emdash) site on Cloudflare Workers, copied from the [DinkusKit store template](https://github.com/dinkuskit/template-store).

This repository owns structure, the arctic theme, route contracts, schema, draft seed, temporary product imagery, and verification. The CMS owns content once live; editors manage it in `/_emdash/admin`.

## Status

Scaffold branch approved by Ryan (`saariuslystoned`). Product copy is draft-only; price, UPC, COA, shipping policy, and brand line remain open questions.

## Get the code

```sh
git clone https://origin.cursor.com/smoky/smokychill.git
cd smokychill
pnpm install
```

## Development

```sh
pnpm dev
pnpm typecheck
pnpm test
bin/verify-site http://localhost:4321
```

## How the site is put together

- **Content:** the seed creates the `primary` menu and draft product/policy records only if missing. EmDash edits are never overwritten.
- **URLs:** the homepage is `/`; the canonical product is `/products/herbal-ice`; its permanent item ID is `herbal-ice-4oz`.
- **Variants:** Commerce owns one Herbal Ice product with a Strength option and 1,000/5,000/10,000 mg physical members. Their SKUs are `SPC-HI4-1000`, `SPC-HI4-5000`, and `SPC-HI4-10000`; see [`docs/commerce-variant-model.md`](docs/commerce-variant-model.md).
- **Checkout:** disabled with `PAYMENTS_UNAVAILABLE` until a server-owned Payments binding exists. Browser prices and webhooks are never payment authority.
- **Indexing:** `DINKUS_LAUNCH_INDEXABLE=0` keeps preview/public scaffolds noindex until launch approval.
- **Verification:** `FEATURE_MAP.md` lists every page and feature, and `bin/verify-site` crawls every internal link, rejecting 404s and encoded slashes.
- **Measurement:** optional GA4, Meta Pixel, and X Pixel integrations are ID-gated; see [`docs/tracking.md`](docs/tracking.md). No IDs or secrets are committed.

## Product and compliance guardrails

- Current images are temporary Smoky Mountain CBD-branded stubs pending a Smoky Chill photoshoot.
- Copy is sensory and factual only. No health, medical, disease, or pain-outcome claims.
- No “THC-free” or “0 THC” claim until a matching COA exists.
- Formula costs, suppliers, and private business details do not belong in this repository.

## Remaining launch blockers

UPC/GTIN, product photos/rebrand photoshoot, pending batch COAs,
higher-strength formulation testing, returns policy, OTC drug-facts /
menthol-camphor labeling counsel, and Payments/Commerce readiness remain
blockers. Shipping Policy is seeded from the Ryan-approved interim text; verify
the `SMCLLC` sender name before launch.

LegitScript preparation and blocked claims are documented in
[`docs/legitscript-prep.md`](docs/legitscript-prep.md).

## License

Not yet chosen. All rights reserved until one is added.
