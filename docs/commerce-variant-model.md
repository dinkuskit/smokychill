# Herbal Ice Commerce variant model

Smoky Chill pins DinkusKit Commerce to
`eafd3e83120c70120ccbe0a8684770b2739a4edf`, which includes the locked
product-variant model and variant checkout implementation after `631d3b9`.

Herbal Ice is one Commerce product with one option, `Strength`. Its three
members are seeded/bootstrap facts with physical fulfillment:

| Strength | Member SKU |
| --- | --- |
| 1,000 mg | `SPC-HI4-1000` | `$20.00` / `2000` cents |
| 5,000 mg | `SPC-HI4-5000` | `$60.00` / `6000` cents |
| 10,000 mg | `SPC-HI4-10000` | `$100.00` / `10000` cents |

The product page asks Commerce for the grouped `catalog/public` projection and
uses projected member IDs, selections, prices, and availability when that
projection is available. The bootstrap writes prices through Commerce's
server-side price path; the browser never supplies or calculates them. CMS
seed data supplies editable labels, SKUs, and formula/COA status.

Native `createPlugin` at pin `eafd3e83120c70120ccbe0a8684770b2739a4edf` does
not register HTTP `catalog/public`; that public GET route lives only on the
sandboxed `plugin.ts` entry. Local native-development therefore reads the same
variant/price/availability resolvers through EmDash plugin storage. Shipping
uses the installed Registry runtime id `r_gshdrqaldna3r7sn`. Member SKUs come
from Commerce catalog items when available. This site does not patch Commerce.
Checkout remains disabled until a server-owned Payments binding exists.
