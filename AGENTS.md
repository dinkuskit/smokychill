# Agent Contract

This public repository owns the Smoky Chill merchant storefront for Herbal Ice
on smokychill.com. It derives from the DinkusKit EmDash store template; it is
not the generic starter. Preserve its arctic brand, product identity, and
merchant-specific launch gates.
Assume every committed byte is immediately public.

## Running GrillTrack

Run `./scripts/agent-skills` first; it installs the pinned SaariusSkills
skills into ignored `.cursor/skills/`. Use
`./scripts/grilltrack --project . validate` or `show` for ledger reads.
The CLI-only ledger rule remains in force. SmokySkills is enabled only after
maintainer access and an immutable commit pin are supplied.

## Organization direction and research

The [organization vision](https://github.com/dinkuskit/.github/blob/36aab690a7ef66dc119aab70e258ea979c54841a/VISION.md) and
[planning boundaries](https://github.com/dinkuskit/.github/blob/36aab690a7ef66dc119aab70e258ea979c54841a/ROADMAP.md) describe the shared direction: independently
useful connected tools for one accountable business operator, optional first-party
or merchant-selected assistants, and adoption in useful stages. They do not
replace this repository's current runtime contracts or establish new capability,
release, deployment, or action authority.

For a material product, architecture, implementation, or verification question,
use the pinned `emdash-commerce` skill and its
[selective REA guidance](https://github.com/saariuslystoned/SaariusSkills/blob/23f2bb1208b3baa7aedaa87faec00395f9bdd061/skills/emdash-commerce/SKILL.md). Research the actual question; routine fixes do
not require a new research cycle. Keep research findings, accepted designs, and
active work distinct, and reuse the owning issue or decision record. Public
outputs must be original and public-safe.

## Source priority

1. This file.
2. The linked organization vision and planning boundaries for shared direction.
3. `README.md` for the Herbal Ice merchant-store scope and launch blockers.
4. `design.md` for this repository's visual contract.
5. `FEATURE_MAP.md` for feature ownership and verification.
6. `.grilltrack/ledger.json`, changed only through the GrillTrack CLI.
7. Current source, tests, and committed proof for implemented behavior.

## Product boundary

- This merchant storefront uses Commerce with Inventory off. Inherited
  managed-stock demonstrations remain a separate development/proof profile,
  not Herbal Ice inventory or permission to change its design. This store does
  not own those packages' domain rules.
- Preserve the arctic theme, Herbal Ice product/variant identities, draft-only
  copy and temporary-image status. Keep checkout unavailable and indexing off
  until the existing launch gates are satisfied and separately approved.
  README.md and DEPLOY.md name those gates; this alignment does not clear them.
- Fresh shipping products use Commerce authoritative prices and manual
  availability. Stock management is Coming soon and unavailable in the paired
  Commerce release. Preserve existing managed data and fail-closed behavior;
  never auto-convert it or invent a fallback ledger.
- This store inherits TemplateStore's exact Commerce pairing requirements.
  Require the owner's immutable artifact identity and digest before claiming
  a paired clean install; source aliases prove only development integration.
- All DinkusKit plugins must be registry-enabled. Shipping template defaults
  consume actual registry-installed Commerce through supported public surfaces;
  native registration or direct storage access is not equivalent without proof
  of matching plugin identity, storage and route authority.
- The authorized guest-cart extension consumes Commerce authority. Browser
  identity/quantity persistence is untrusted intent/cache, never a price, stock,
  checkout or order backend. Guest checkout and return states depend on the
  exact supported Commerce public mount/artifact.
- EmDash owns human-authored composition and merchandising content. Commerce
  owns catalog identity, managed-stock state, and unmanaged manual availability.
  Inventory owns stock identity, quantities, locations, mutations, and receipts.
- Pre-release Dinkus dependencies stay pinned to exact commits. Source-entry
  aliases are temporary dogfood mechanics, not release compatibility claims.
- The local proof adapter supplies disposable storage mechanics only. It is not
  a production stock ledger, Cloudflare adapter, or fallback inventory system.
- SmokyClub is reference-only. Do not import brand content, production
  configuration, credentials, databases, private rationale, or unrelated
  history.

## Layout

- `src/features/` owns co-located storefront features.
- `seed/` owns draft Herbal Ice and policy bootstrap content. Once initialized,
  the CMS owns editorial content; do not overwrite it by reseeding.
- `tests/` owns deterministic and browser acceptance.
- `bin/verify-web` is the canonical verification entry.
- `skills/managed-product-verification/` documents the project-local verifier.
- `.grilltrack/proof/` owns curated track text proof. Routine screenshot media
  stays ignored under `runs/` until separately selected for immutable
  release-asset hosting.
- Generated databases, uploads, browser output, and temporary package material
  stay ignored under `.artifacts/`, `test-results/`, and `runs/`.

## Required checks

Establish a fast baseline and iterate with `bin/verify-web quick` plus targeted
Playwright specs (`pnpm exec playwright test <spec> --project=chromium-desktop`).
Run `pnpm verify` before closeout. Browser proof must exercise desktop Chromium
and a mobile viewport. The explicit development integration profile observes the managed `8 -> 5 -> 8` Inventory sequence,
and observe unmanaged manual availability cycle through in-stock, out-of-stock,
and available-on-backorder without showing a quantity. The default shipping
profile must prove the installed Commerce public catalog path without a native
plugin mount, Inventory configuration/network, or proof adapter bootstrap.
Without a paired installed artifact the catalog fail-closes and invents no
products. Native Products admin-to-storefront remains the explicit
`native-development` proof profile. Source-pilot checks
do not establish released artifact, registry, checkout, or Cloudflare readiness.

## Gates

Publishing packages, deployment, production mutation, secrets or permissions
changes, pull-request creation, and merges require separate authorization.
