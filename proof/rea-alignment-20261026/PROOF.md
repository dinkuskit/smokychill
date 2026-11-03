# Documentation and agent-entrypoint alignment proof

Date: 2026-10-26. Repository: `dinkuskit/smokychill`. Branch:
`codex/rea-alignment-20261026`. Implementation commit: `57388a19e04113c2903c8a43b4bea278e3b4021f`. Freshly fetched base: `175b1e7a467cf262f1ca6f4443a5bbef0f404b90`.

This source-only alignment follows the public [organization vision](https://github.com/dinkuskit/.github/blob/36aab690a7ef66dc119aab70e258ea979c54841a/VISION.md),
[planning boundaries](https://github.com/dinkuskit/.github/blob/36aab690a7ef66dc119aab70e258ea979c54841a/ROADMAP.md), and
[canonical research guidance](https://github.com/saariuslystoned/SaariusSkills/blob/23f2bb1208b3baa7aedaa87faec00395f9bdd061/skills/emdash-commerce/SKILL.md). It implements no new product architecture.

## Acceptance and evidence

| Requirement | Evidence and limit |
| --- | --- |
| Merchant identity | AGENTS, design, and the feature-map introduction now identify the Herbal Ice store; README and its launch blockers outrank inherited generic-template language. |
| Preserved implementation | No `src/`, `seed/`, `package.json`, lockfile, or Wrangler configuration changes. Arctic design, product/variant identities, payment refusal and indexing gates stay as implemented. |
| Authority | The design contract retains existing CMS content ownership, domain authorities, temporary-image status, accessibility and separate launch approval. It does not assert a fresh production or visual proof. |
| Selective research bootstrap | [bootstrap.json](bootstrap.json) records each installed skill's immutable source and file count. Full installed trees match `git ls-tree` blob hashes; canonical Markdown references resolve. Cached reinstallation is byte-identical and preserves an unrelated sentinel. Existing bundle pins are unchanged. Only `emdash-commerce` uses the newer pin. |
| Public-safe changes | Local Markdown links resolve; changed text introduces no private workspace or research references. Published baseline links resolve at their pinned public revisions. |

## Checks

- `bash -n scripts/agent-skills`: passed.
- Isolated bootstrap with temporary cache and skill destination: passed; no user-level installation.
- `git diff --check`: passed.
- `pnpm verify` on Node `22.23.2`: Astro check passed (0 errors); 24 Vitest files / 168 tests passed; 17 workflow tests passed. The command then failed at the unchanged feature audit before the build/browser/crawler stages.
- Baseline reproduction: `node scripts/check-features.mjs` in a clean archive of `175b1e7a467cf262f1ca6f4443a5bbef0f404b90` fails with the same `Commerce source preparation must retain its exact repository and commit` result. The audit expects `5ade2bd0e4480b8ec9220c7872d7445e35547a3e`; the unchanged manifest pins `eafd3e83120c70120ccbe0a8684770b2739a4edf`. Neither file is changed here. This existing mismatch is not repaired by a documentation alignment.
- `node scripts/check-worktree-text.mjs`: passed. No browser or full-suite pass is claimed.

## Scope and gates

No hosted CMS publication, deployment, release, merge, account/permission change, or
live store action was performed. Local fixtures and source verification do not
establish current hosted availability, a released package pair, or production
readiness. Review evidence must be bound to the PR's exact head; future source
changes require fresh relevant checks.
