# smokychill 🧊 — the ice balm, on its own site

smokychill is the storefront for smokychill.com, a single-product shop for Herbal Ice, a cooling menthol and camphor balm in a 4 oz jar. It's an [EmDash](https://github.com/emdash-cms/emdash) site on Cloudflare Workers, built from the [DinkusKit store template](https://github.com/dinkuskit/template-store), and it takes checkout from the DinkusKit Commerce and Payments plugins.

This repository holds the site's structure: the theme, routes, schema, seed, and verification. Product copy, pages, and menus live in the EmDash CMS once the site is running, and editors manage them in `/_emdash/admin`.

## Status

This repo has just been bootstrapped. The scaffold (theme, seed, product page, checkout wiring, and verification) arrives in the first pull request. Checkout stays disabled until DinkusKit Commerce and Payments are merged and a server-owned payments binding is configured.

## Get the code

```sh
git clone https://origin.cursor.com/smoky/smokychill.git
cd smokychill
```

Once the scaffold lands, local development, tests, and deploy steps live in the Development section and in `AGENTS.md`.

## How the site is put together

- **Content:** the CMS owns content. The seed creates pages and the nav menu only if they're missing, so it never overwrites edits made in the admin.
- **URLs:** the homepage lives at `/`, and the product lives at `/products/herbal-ice` with a permanent Commerce item ID and Product structured data.
- **Checkout:** Commerce prices every order on the server and decides when it's paid. Payments opens a hosted checkout, and an order is marked paid only after a lookup with the payment provider, never from a webhook alone.
- **Verification:** `FEATURE_MAP.md` lists every page and feature, and `bin/verify-site` crawls every link. A deploy isn't done until verification passes against production.

## Rules for changes

- Work on a branch and open a pull request. Ryan (`saariuslystoned`) approves every merge, deploy, DNS change, and live payment.
- Never put secrets or private business details in the repo.
- Product copy makes no health or medical claims.

## Development

This section fills in with the scaffold: install, local dev server, tests, and `bin/verify-site`.

## License

Not yet chosen. All rights reserved until one is added.
