import type { InstalledCatalogContext } from "./installed.js";

export interface PublicStrengthMember {
  catalogItemId: string;
  selections: readonly { optionId: string; optionLabel: string; valueId: string; valueLabel: string }[];
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

/**
 * Reads Commerce's grouped public projection. It intentionally returns null
 * when the installed projection is unavailable or when all unpriced members
 * are filtered by Commerce; the CMS seed remains the editable bootstrap until
 * prices are supplied.
 */
export async function readPublicVariantProduct(
  context: InstalledCatalogContext,
  productName: string,
): Promise<PublicVariantProduct | null> {
  const route = "catalog/public";
  const pluginId = "dinkus-commerce";
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
    if (!object(member) || typeof member.catalogItemId !== "string" ||
        (member.fulfillment !== "physical" && member.fulfillment !== "digital") ||
        !Array.isArray(member.selections)) return [];
    const selections = member.selections.flatMap((selection) => {
      if (!object(selection) || typeof selection.optionId !== "string" || typeof selection.valueId !== "string" ||
          typeof selection.optionLabel !== "string" || typeof selection.valueLabel !== "string") return [];
      return [{ optionId: selection.optionId, optionLabel: selection.optionLabel, valueId: selection.valueId, valueLabel: selection.valueLabel }];
    });
    return [{ catalogItemId: member.catalogItemId, selections, fulfillment: member.fulfillment }];
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
