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
pnpm build
```

## 2. Create D1 and R2

```sh
pnpm exec wrangler d1 create smokychill
pnpm exec wrangler r2 bucket create smokychill-media
```

Copy the D1 UUID from `wrangler d1 create`. The committed `wrangler.jsonc`
**omits** that id on purpose (seed/deploy policy). Materialize it only in an
ignored overlay, for example:

```sh
mkdir -p .artifacts
node -e '
const { readFileSync, writeFileSync } = require("fs");
const id = process.env.SMOKYCHILL_D1_DATABASE_ID;
if (!id) throw new Error("Set SMOKYCHILL_D1_DATABASE_ID to the UUID from wrangler d1 create");
const raw = readFileSync("wrangler.jsonc","utf8")
  .replace(/\/\*[\s\S]*?\*\//g,"")
  .replace(/^\s*\/\/.*$/gm,"");
const cfg = JSON.parse(raw);
cfg.d1_databases[0].database_id = id;
writeFileSync(".artifacts/wrangler.deploy.jsonc", JSON.stringify(cfg, null, 2) + "\n");
'
```

Use that overlay for migrate/seed/deploy:

```sh
export WRANGLER_CONFIG=.artifacts/wrangler.deploy.jsonc
```

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
- Any Commerce/Payments secret names **only after** checkout is intentionally
  enabled later — **do not set payment keys for this stand-up**

Bindings (not secrets): `DB` (D1 `smokychill`), `MEDIA` (R2 `smokychill-media`),
`ASSETS`, `RATE_LIMITER`.

## 6. Deploy

`wrangler.jsonc` already has `workers_dev: false`, `preview_urls: false`, and
custom-domain routes for `smokychill.com` / `www.smokychill.com`.

```sh
pnpm exec wrangler deploy --config "$WRANGLER_CONFIG"
```

Attach the custom domains in the Cloudflare dashboard if the first deploy
prompts for DNS/zone confirmation.

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

1. Real D1 UUID in the ignored deploy overlay (not committed).
2. Cloudflare account auth (`wrangler login` / API token) — this agent has none.
3. DNS / custom-domain acceptance for `smokychill.com` and `www.smokychill.com`.
4. First EmDash admin user created in `/_emdash/admin` after deploy.
5. Do **not** enable checkout or indexing without a new owner approval.
