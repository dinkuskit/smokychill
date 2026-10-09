# Deploy smokychill.com (Cloudflare Workers)

Owner-approved stand-up for a **NOINDEX** site with **checkout disabled**.
Do not set `DINKUS_LAUNCH_INDEXABLE=1`, do not clear `PAYMENTS_UNAVAILABLE`, and
do not add payment provider keys.

## Prerequisites

- Fresh Cloudflare account with Workers Paid (rate limits + scheduled tasks)
- Node `>=22.16 <23`, `pnpm@11.9.0`
- Domain `smokychill.com` (and `www`) in the same Cloudflare account
- This repo on `main` after the launch merge

## 1. Install and build

```sh
git clone https://origin.cursor.com/smoky/smokychill.git
cd smokychill
pnpm install --frozen-lockfile
# Cloudflare Workers build (Node adapter is the default without this env)
DINKUS_HOSTING_PROFILE=cloudflare pnpm build
```

`DINKUS_HOSTING_PROFILE=cloudflare` selects `@astrojs/cloudflare`, D1/R2
bindings, and the Worker `scheduled` export. A plain `pnpm build` produces the
local Node adapter and is not a deployable Worker.

## 2. Create D1, R2, and SESSION KV

```sh
pnpm exec wrangler d1 create smokychill
pnpm exec wrangler r2 bucket create smokychill-media
# Astro Cloudflare sessions binding (required by the cloudflare adapter build)
pnpm exec wrangler kv namespace create smokychill-session
```

Copy the D1 UUID from `wrangler d1 create` and the KV id from
`wrangler kv namespace create`. The committed `wrangler.jsonc` **omits** those
ids on purpose (seed/deploy policy). Materialize them only in an ignored
overlay.

### Deploy overlay (Astro `dist/server` entry)

Wrangler must deploy the **Astro-built** Worker entry under `dist/server/`, not
`src/worker.ts`. Source `main` fails to resolve Astro/EmDash virtual modules.
Put the deploy config **next to** the built entry so `no_bundle` can upload the
`chunks/` module graph:

```sh
mkdir -p .artifacts dist/server
# After DINKUS_HOSTING_PROFILE=cloudflare pnpm build:
node -e '
const { readFileSync, writeFileSync } = require("fs");
const id = process.env.SMOKYCHILL_D1_DATABASE_ID;
const kvId = process.env.SMOKYCHILL_SESSION_KV_ID;
const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
if (!id) throw new Error("Set SMOKYCHILL_D1_DATABASE_ID to the UUID from wrangler d1 create");
if (!kvId) throw new Error("Set SMOKYCHILL_SESSION_KV_ID to the id from wrangler kv namespace create smokychill-session");
if (!accountId) throw new Error("Set CLOUDFLARE_ACCOUNT_ID");
const raw = readFileSync("wrangler.jsonc","utf8")
  .replace(/\/\*[\s\S]*?\*\//g,"")
  .replace(/^\s*\/\/.*$/gm,"");
const base = JSON.parse(raw);
const cfg = {
  name: base.name,
  main: "entry.mjs",
  compatibility_date: base.compatibility_date,
  compatibility_flags: base.compatibility_flags,
  workers_dev: false,
  preview_urls: false,
  account_id: accountId,
  no_bundle: true,
  rules: [{ type: "ESModule", globs: ["**/*.js", "**/*.mjs"] }],
  routes: base.routes,
  vars: base.vars,
  assets: {
    binding: "ASSETS",
    directory: "../client",
    run_worker_first: true,
  },
  d1_databases: [{
    binding: "DB",
    database_name: "smokychill",
    database_id: id,
  }],
  r2_buckets: [{ binding: "MEDIA", bucket_name: "smokychill-media" }],
  kv_namespaces: [{ binding: "SESSION", id: kvId }],
  images: { binding: "IMAGES" },
  ratelimits: base.ratelimits,
  observability: base.observability,
};
writeFileSync("dist/server/wrangler.deploy.jsonc", JSON.stringify(cfg, null, 2) + "\n");
writeFileSync(".artifacts/wrangler.deploy.jsonc", JSON.stringify(cfg, null, 2) + "\n");
'
```

Use the **colocated** overlay for deploy (paths resolve from `dist/server/`):

```sh
export WRANGLER_CONFIG=dist/server/wrangler.deploy.jsonc
```

Do not commit either overlay. Reuse existing D1 / R2 / KV if they already exist.

## 3. Apply EmDash migrations + CMS seed (product page content)

Local Workers persist path (first-time index bootstrap, then seed):

```sh
# One-time Commerce SKU unique-index init against local D1 persist
node scripts/scheduled-index-harness.mjs --persist .wrangler/state/v3

# Bundle + apply CMS seed + Herbal Ice Commerce catalog (menus, pages, product)
pnpm seed:bundle
pnpm seed:demo
```

For the **remote** account D1 after resources exist, follow
`docs/deployment/demo-reset-plan.md`: write ignored
`.artifacts/wrangler.remote.jsonc` + `.artifacts/remote-operator-target.json`,
run the scheduled harness against that remote binding, then:

```sh
pnpm seed:bundle
node --import ./scripts/cloudflare-workers-hook.mjs \
  .artifacts/seed/seed-synthetic-demo.mjs --remote --confirm "<operator-fingerprint>"
```

The seed creates the EmDash `primary` / `footer` menus and draft product/policy
records **only if missing**. EmDash admin edits are never overwritten.

## 4. Worker vars (names only — already in `wrangler.jsonc`)

| Name | Required value for this stand-up |
| --- | --- |
| `DINKUS_STOREFRONT_PROFILE` | `shipping` |
| `PAYMENTS_UNAVAILABLE` | `1` |
| `DINKUS_LAUNCH_INDEXABLE` | `0` |

Optional public measurement IDs (site component; omit until ready):

- `PUBLIC_GA4_MEASUREMENT_ID`
- `PUBLIC_META_PIXEL_ID`
- `PUBLIC_X_PIXEL_ID`

## 5. Secrets (names only — set via Wrangler; never commit values)

EmDash admin / session secrets are created at first admin setup on the deployed
Worker. Set any Cloudflare secrets the EmDash Cloudflare adapter documents for
your account with:

```sh
pnpm exec wrangler secret put <SECRET_NAME> --config "$WRANGLER_CONFIG"
```

Typical names to confirm against current EmDash Cloudflare docs at deploy time
(values never belong in git):

- `EMDASH_AUTH_SECRET` (or the current EmDash session-signing secret name)
- `EMDASH_ENCRYPTION_KEY` (prefix `emdash_enc_v1_`; generate with `emdash secrets generate`)
- Any Commerce/Payments secret names **only after** checkout is intentionally
  enabled later — **do not set payment keys for this stand-up**

Bindings (not secrets): `DB` (D1 `smokychill`), `MEDIA` (R2 `smokychill-media`),
`SESSION` (KV `smokychill-session`), `IMAGES`, `ASSETS`, `RATE_LIMITER`.

## 6. Deploy

`wrangler.jsonc` already has `workers_dev: false`, `preview_urls: false`, and
custom-domain routes for `smokychill.com` / `www.smokychill.com`.

```sh
# Requires a prior DINKUS_HOSTING_PROFILE=cloudflare pnpm build
pnpm exec wrangler deploy --config "$WRANGLER_CONFIG"
```

`$WRANGLER_CONFIG` must be the colocated `dist/server/wrangler.deploy.jsonc`
overlay (`main: "entry.mjs"`, `no_bundle: true`). Deploying with
`main: ./src/worker.ts` fails on unresolved `virtual:emdash/*` /
`virtual:astro-*` modules.

Attach the custom domains in the Cloudflare dashboard if the first deploy
prompts for DNS/zone confirmation. If wrangler refuses because a DNS record
already exists on the hostname, report the record (type and target) rather
than deleting it.

## 7. Verify production (expect noindex)

```sh
bin/verify-site https://smokychill.com --demo-host
```

`--demo-host` is required while the site is intentionally noindex. Confirm:

- HTML responses include `<meta name="robots" content="noindex, nofollow">`
- Responses include `X-Robots-Tag: noindex, nofollow`
- `/robots.txt` contains `Disallow: /`
- Cart checkout control stays disabled; checkout POSTs return `503` with
  `PAYMENTS_UNAVAILABLE`

## Blockers the deployer must supply

1. Real D1 UUID and SESSION KV id in the ignored deploy overlay (not committed).
2. Cloudflare account auth (`wrangler login` / API token) — this agent has none.
3. DNS / custom-domain acceptance for `smokychill.com` and `www.smokychill.com`.
4. First EmDash admin user created in `/_emdash/admin` after deploy.
5. Do **not** enable checkout or indexing without a new owner approval.
