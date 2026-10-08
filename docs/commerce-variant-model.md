# Herbal Ice Commerce variant model

Smoky Chill pins DinkusKit Commerce to
`eafd3e83120c70120ccbe0a8684770b2739a4edf`, which includes the locked
product-variant model and variant checkout implementation after `631d3b9`.

Herbal Ice is one Commerce product with one option, `Strength`. Its three
members are seeded/bootstrap facts with physical fulfillment:

| Strength | Member SKU |
| --- | --- |
| 1,000 mg | `SPC-HI4-1000` |
| 5,000 mg | `SPC-HI4-5000` |
| 10,000 mg | `SPC-HI4-10000` |

The product page asks Commerce for the grouped `catalog/public` projection and
uses projected member IDs/selections when that projection is available. CMS
seed data supplies editable labels and formula/COA status while Commerce is
unconfigured locally.

Known Commerce gap: the current public projection filters out variant members
that have no customer price/listable price, and its member projection does not
carry the editable SKU. Since all three prices are currently TBD, the page
cleanly falls back to the CMS/bootstrap strength rows and never invents a
price, GTIN, or Offer. Once prices and Commerce members are configured, the
grouped projection becomes the runtime selector source. This site does not
patch Commerce.
