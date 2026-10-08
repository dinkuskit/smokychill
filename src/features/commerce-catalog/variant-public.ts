import { PluginStorageRepository } from "emdash";
import { getDb } from "emdash/runtime";
import {
  COMMERCE_PLUGIN_ID,
  CATALOG_COLLECTION,
  CATALOG_PRICES_COLLECTION,
  CATALOG_MANUAL_AVAILABILITY_COLLECTION,
  CATALOG_BACKORDER_POLICIES_COLLECTION,
  STORE_INVENTORY_CONFIGURATIONS_COLLECTION,
  STOREFRONT_AVAILABILITY_SETTINGS_COLLECTION,
  resolveCatalogItemPrice,
  resolveCatalogVariantMember,
  resolveStorefrontAvailability,
  variantSelections,
  type CatalogStorageRecord,
  type CatalogPriceRecord,
  type CatalogManualAvailabilityRecord,
  type CatalogBackorderPolicyRecord,
  type StoreInventoryConfigurationRecord,
  type StorefrontAvailabilitySettingsRecord,
} from "@dinkuskit/commerce";
import { COMMERCE_REGISTRY_RUNTIME_ID } from "../guest-cart/checkout-protocol.js";
import type { InstalledCatalogContext } from "./installed.js";

export interface PublicStrengthMember {
  catalogItemId: string;
  sku: string;
  selections: readonly { optionId: string; optionLabel: string; valueId: string; valueLabel: string }[];
  price: { currency: "USD"; minor: string };
  availability: { status: string; sellable: boolean; listable: boolean };
  fulfillment: "physical" | "digital";
}

export interface PublicVariantProduct {
  productId: string;
  options: readonly { optionId: string; label: string; values: readonly { valueId: string; label: string }[] }[];
  members: readonly PublicStrengthMember[];
}

function object(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function parseMember(member: unknown): PublicStrengthMember | null {
  if (!object(member) || typeof member.catalogItemId !== "string" ||
      (member.fulfillment !== "physical" && member.fulfillment !== "digital") ||
      !Array.isArray(member.selections) || !object(member.price) ||
      member.price.currency !== "USD" || typeof member.price.minor !== "string" ||
      !object(member.availability) || typeof member.availability.status !== "string" ||
      typeof member.availability.sellable !== "boolean" ||
      typeof member.availability.listable !== "boolean") return null;
  const selections = member.selections.flatMap((selection) => {
    if (!object(selection) || typeof selection.optionId !== "string" || typeof selection.valueId !== "string" ||
        typeof selection.optionLabel !== "string" || typeof selection.valueLabel !== "string") return [];
    return [{ optionId: selection.optionId, optionLabel: selection.optionLabel, valueId: selection.valueId, valueLabel: selection.valueLabel }];
  });
  return {
    catalogItemId: member.catalogItemId,
    sku: typeof member.sku === "string" ? member.sku : "",
    selections,
    price: { currency: "USD", minor: member.price.minor },
    availability: {
      status: member.availability.status,
      sellable: member.availability.sellable,
      listable: member.availability.listable,
    },
    fulfillment: member.fulfillment,
  };
}

/**
 * Native-development proof reads Commerce storage through the same resolvers
 * the sandboxed public projection uses. Native createPlugin at this pin does
 * not register HTTP `catalog/public` (that route lives only on plugin.ts).
 */
async function readNativeVariantProduct(productName: string): Promise<PublicVariantProduct | null> {
  const db = await getDb();
  const manualAvailability = new PluginStorageRepository<CatalogManualAvailabilityRecord>(
    db, COMMERCE_PLUGIN_ID, CATALOG_MANUAL_AVAILABILITY_COLLECTION, [],
  );
  const storage = {
    catalog: new PluginStorageRepository<CatalogStorageRecord>(db, COMMERCE_PLUGIN_ID, CATALOG_COLLECTION, []),
    prices: new PluginStorageRepository<CatalogPriceRecord>(db, COMMERCE_PLUGIN_ID, CATALOG_PRICES_COLLECTION, []),
    availability: manualAvailability,
    manualAvailability,
    backorderPolicies: new PluginStorageRepository<CatalogBackorderPolicyRecord>(
      db, COMMERCE_PLUGIN_ID, CATALOG_BACKORDER_POLICIES_COLLECTION, [],
    ),
    configurations: new PluginStorageRepository<StoreInventoryConfigurationRecord>(
      db, COMMERCE_PLUGIN_ID, STORE_INVENTORY_CONFIGURATIONS_COLLECTION, [],
    ),
    settings: new PluginStorageRepository<StorefrontAvailabilitySettingsRecord>(
      db, COMMERCE_PLUGIN_ID, STOREFRONT_AVAILABILITY_SETTINGS_COLLECTION, [],
    ),
  };
  const parent = await storage.catalog.get("herbal-ice-4oz");
  if (!parent || parent.recordKind !== "catalog-item" || parent.name !== productName || !parent.variantProduct) {
    return null;
  }
  const product = parent.variantProduct;
  const members: PublicStrengthMember[] = [];
  for (const member of product.members) {
    const resolved = await resolveCatalogVariantMember(storage.catalog, member.catalogItemId);
    if (!resolved?.member || !resolved.item || resolved.product?.productId !== product.productId) continue;
    const memberPrice = await resolveCatalogItemPrice(storage.prices, member.catalogItemId);
    if (!memberPrice.listable || !memberPrice.customerPays) continue;
    const memberAvailability = await resolveStorefrontAvailability(storage, {
      catalogItemId: member.catalogItemId,
    });
    if (!memberAvailability.listable) continue;
    members.push({
      catalogItemId: member.catalogItemId,
      sku: resolved.item.sku,
      selections: variantSelections(product, member),
      price: memberPrice.customerPays,
      availability: {
        status: memberAvailability.status,
        sellable: memberAvailability.sellable,
        listable: memberAvailability.listable,
      },
      fulfillment: member.fulfillment,
    });
  }
  if (!members.length) return null;
  return {
    productId: product.productId,
    options: product.options,
    members,
  };
}

/**
 * Shipping uses the installed Registry plugin id. Native-development uses
 * Commerce storage resolvers because native createPlugin does not mount the
 * sandboxed public catalog routes.
 */
export async function readPublicVariantProduct(
  context: InstalledCatalogContext,
  productName: string,
): Promise<PublicVariantProduct | null> {
  if (process.env.DINKUS_CATALOG_PROFILE === "native-development") {
    return readNativeVariantProduct(productName);
  }

  const route = "catalog/public";
  const pluginId = COMMERCE_REGISTRY_RUNTIME_ID;
  const metadata = context.runtime?.getPluginRouteMeta(pluginId, route);
  if (!context.runtime || metadata?.public !== true || !metadata.methods?.includes("GET")) return null;
  const result = await context.runtime.handlePublicPluginApiRoute(
    pluginId,
    "GET",
    route,
    new Request(new URL(`/_emdash/api/plugins/${pluginId}/${route}`, context.request.url), { method: "GET" }),
  );
  if (!result.success || !object(result.data) || !Array.isArray(result.data.products)) return null;
  const product = result.data.products.find((candidate) =>
    object(candidate) && candidate.name === productName && object(candidate.variants),
  );
  if (!object(product) || !object(product.variants) || typeof product.variants.productId !== "string" ||
      !Array.isArray(product.variants.options) || !Array.isArray(product.variants.members)) return null;
  const members = product.variants.members.flatMap((member): PublicStrengthMember[] => {
    const parsed = parseMember(member);
    return parsed ? [parsed] : [];
  });
  return {
    productId: product.variants.productId,
    options: product.variants.options.filter(object).flatMap((option) => {
      if (typeof option.optionId !== "string" || typeof option.label !== "string" || !Array.isArray(option.values)) return [];
      return [{ optionId: option.optionId, label: option.label, values: option.values.filter(object).flatMap((value) =>
        typeof value.valueId === "string" && typeof value.label === "string" ? [{ valueId: value.valueId, label: value.label }] : [],
      ) }];
    }),
    members,
  };
}
