# Smoky Chill storefront design contract

Canonical path: `design.md`. This is the Herbal Ice merchant store derived from
DinkusKit's template, not a neutral template demonstration. The inherited
starter design is historical; it does not override this store's identity.

## Product intent and source priority

Preserve the arctic Smoky Chill presentation for Herbal Ice on smokychill.com.
Read [README.md](README.md) for merchant scope and unresolved launch blockers,
[FEATURE_MAP.md](FEATURE_MAP.md) for route and feature ownership, and the
current source and proof for implemented behavior. The organization vision
linked from [AGENTS.md](AGENTS.md) supplies product direction without changing
this merchant's brand, design, package identities, or launch authority.

The storefront presents one 4 oz Herbal Ice product with the existing Strength
option and 1,000/5,000/10,000 mg members. Preserve `/products/herbal-ice`,
`herbal-ice-4oz`, the existing SKUs, and Commerce's variant/price authority as
specified in [the variant model](docs/commerce-variant-model.md). A source or
seed price is not a newly approved commercial price.

## Visual and content boundaries

- Preserve the existing arctic theme, icy CHILL wordmark, Herbal Ice imagery,
  shared header/footer, and responsive merchant pages. Do not replace them
  with the starter's warm-neutral tees, hoodies, or hats.
- Keep semantic headings, keyboard access, visible focus, readable contrast,
  truthful status text, and mobile layouts without horizontal overflow.
- The current product imagery is temporary and requires the existing photoshoot
  and rebrand work before launch. Do not present it as final brand approval.
- EmDash owns editorial pages, menus, and merchandising after bootstrap.
  Seed content is draft setup material; preserve initialized CMS edits.
- Product copy stays sensory and factual. No health, medical, disease, or
  pain-outcome claims; no THC-free/zero-THC claim without the matching COA.
- Preserve the current policy pages and approved interim shipping text.
  Returns, labeling review, product identifiers, final photos, COAs, and the
  other README launch blockers stay open until their owners resolve them.

## Commerce and inherited integration boundaries

Commerce owns product/variant identity, authoritative price and availability.
Browser cart state is untrusted identity/quantity intent, never a price, stock,
checkout, or order backend. Return URLs do not confirm payment. This store's
checkout remains fail-closed with `PAYMENTS_UNAVAILABLE` until its existing
server-owned payment and proof requirements are met. Keep indexing off under
`DINKUS_LAUNCH_INDEXABLE=0` pending separate launch approval.

Inventory stays off for the merchant profile. Inherited managed-stock and
unmanaged-availability demonstrations are explicit development proof, not
Herbal Ice stock records. Preserve their failure behavior and tests without
exposing proof controls as shopper features. Source aliases and synthetic
proof do not establish a released Registry pair or Cloudflare readiness.

## Verification and launch

Use the required checks in [AGENTS.md](AGENTS.md) and the project verifier for
source changes. A visual change needs desktop and mobile browser evidence;
a documentation correction does not prove a newly tested storefront.
[DEPLOY.md](DEPLOY.md) retains the stand-up procedure and separate launch gates.
This contract authorizes no deployment, content publication, indexing change,
new payment authority, or launch.
