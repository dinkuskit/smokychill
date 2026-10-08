import { defineMiddleware } from "astro:middleware";
import {
  applySecurityHeaders,
  decodedForms,
  evaluatePublicBoundary,
  isExactGuestCheckoutPath,
  slashlessRedirectPath,
} from "./features/security/public-boundary.js";
import {
  applyLaunchNoIndexHeaders,
  launchIndexableEnabled,
  paymentsUnavailableEnabled,
} from "./features/security/launch-indexing.js";
import { resolveGuestCheckoutAdmission } from "./features/guest-cart/checkout-admission.js";

const NATIVE_GUEST_CHECKOUT_POST_PATH =
  /^\/_emdash\/api\/plugins\/dinkus-commerce\/checkout\/guest\/(prepare|start|status)$/;
const SITEMAP_PATH = /^\/sitemap(?:-[a-z0-9-]+)?\.xml$/;

function envRecord(): Record<string, unknown> {
  return {
    ...process.env,
    ...(import.meta.env as Record<string, unknown>),
  };
}

function launchSitemapBlockedResponse(): Response {
  // While the stand-up is noindex, do not advertise crawl targets.
  const response = new Response("Not Found", {
    status: 404,
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
  applyLaunchNoIndexHeaders(response.headers, envRecord());
  applySecurityHeaders(response.headers);
  return response;
}

function applyLaunchIndexing(response: Response): Response {
  applyLaunchNoIndexHeaders(response.headers, envRecord());
  return response;
}

function checkoutUnavailableResponse(): Response {
  const response = new Response(
    JSON.stringify({ error: "Checkout is not available yet.", code: "PAYMENTS_UNAVAILABLE" }),
    {
      status: 503,
      headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
    },
  );
  applyLaunchNoIndexHeaders(response.headers, envRecord());
  applySecurityHeaders(response.headers);
  return response;
}

function guestCheckoutBlocked(context: {
  locals: { emdash?: Parameters<typeof resolveGuestCheckoutAdmission>[0]["runtime"] };
}): boolean {
  if (paymentsUnavailableEnabled(envRecord())) return true;
  return !resolveGuestCheckoutAdmission({
    runtime: context.locals.emdash,
    // Core has not supplied the same-namespace catalog/config authority.
    catalog: null,
  });
}

export const onRequest = defineMiddleware(async (context, next) => {
  let pathForms: string[];
  try {
    pathForms = decodedForms(context.url.pathname);
  } catch {
    const response = Response.json({ error: "Invalid path." }, { status: 403 });
    applyLaunchNoIndexHeaders(response.headers, envRecord());
    applySecurityHeaders(response.headers);
    return response;
  }
  const slashlessPath = slashlessRedirectPath(context.url.pathname);
  if (slashlessPath && (context.request.method === "GET" || context.request.method === "HEAD")) {
    const redirectUrl = new URL(context.request.url);
    redirectUrl.pathname = slashlessPath;
    const response = new Response(null, {
      status: 302,
      headers: {
        Location: redirectUrl.href,
        "Cache-Control": "no-store",
      },
    });
    applyLaunchNoIndexHeaders(response.headers, envRecord());
    applySecurityHeaders(response.headers);
    return response;
  }
  if (
    !launchIndexableEnabled(envRecord()) &&
    pathForms.some((path) => SITEMAP_PATH.test(path)) &&
    (context.request.method === "GET" || context.request.method === "HEAD")
  ) {
    return launchSitemapBlockedResponse();
  }

  const isCloudflare =
    process.env.DINKUS_HOSTING_PROFILE === "cloudflare" ||
    process.env.ASTRO_ADAPTER === "cloudflare" ||
    Boolean((context.locals as { runtime?: unknown }).runtime);

  const isProofMode =
    process.env.DINKUS_STOREFRONT_PROFILE === "proof" ||
    process.env.DINKUS_PROOF_MODE === "1";

  if (isCloudflare && !isProofMode) {
    const { request, url } = context;
    const check = evaluatePublicBoundary(
      request.method,
      url.pathname,
      url.search,
      url.href,
    );
    if (!check.allowed) {
      const response = new Response(
        JSON.stringify({ error: check.reason ?? "Forbidden" }),
        {
          status: check.status,
          headers: { "Content-Type": "application/json" },
        },
      );
      applyLaunchNoIndexHeaders(response.headers, envRecord());
      applySecurityHeaders(response.headers);
      return response;
    }

    if (isExactGuestCheckoutPath(url.pathname) && guestCheckoutBlocked(context)) {
      return checkoutUnavailableResponse();
    }

    const response = await next();
    applyLaunchIndexing(response);
    applySecurityHeaders(response.headers);
    return response;
  }

  if (isExactGuestCheckoutPath(context.url.pathname) && guestCheckoutBlocked(context)) {
    return checkoutUnavailableResponse();
  }

  if (pathForms.some((path) => NATIVE_GUEST_CHECKOUT_POST_PATH.test(path))) {
    const response = new Response(
      JSON.stringify({ error: "Native or source-alias checkout is not a supported install." }),
      {
        status: 405,
        headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
      },
    );
    applyLaunchNoIndexHeaders(response.headers, envRecord());
    applySecurityHeaders(response.headers);
    return response;
  }

  const response = await next();
  applyLaunchIndexing(response);
  return response;
});
