import astroHandler from "@astrojs/cloudflare/entrypoints/server";
import {
  createScheduledHandler as createEmDashScheduledHandler,
  PluginBridge,
} from "@emdash-cms/cloudflare/worker";
import {
  applySecurityHeaders,
  evaluatePublicBoundary,
  isExactGuestCheckoutPath,
  slashlessRedirectPath,
} from "./features/security/public-boundary.js";
import {
  applyLaunchNoIndexHeaders,
  launchIndexableEnabled,
  paymentsUnavailableEnabled,
} from "./features/security/launch-indexing.js";

const SITEMAP_PATH = /^\/sitemap(?:-[a-z0-9-]+)?\.xml$/;
import type { ScheduledWakeReconciliationOptions } from "./features/test-checkout-host/index.js";
import { runScheduledWakeReconciliation } from "./features/test-checkout-host/scheduler-driver.js";

export { PluginBridge };

export interface RateLimiterBinding {
  limit(options: { key: string }): Promise<{ success: boolean }>;
}

export interface WorkerEnv {
  RATE_LIMITER?: RateLimiterBinding;
  DB?: unknown;
  MEDIA?: unknown;
  ASSETS?: { fetch(request: Request): Promise<Response> };
  [key: string]: unknown;
}

export interface WorkerExecutionContext {
  waitUntil(promise: Promise<unknown>): void;
  passThroughOnException(): void;
}

/** ScheduledController shape verified against Workers types 5.20261003.1. */
export interface ScheduledController {
  readonly scheduledTime: number;
  readonly cron: string;
  noRetry(): void;
}

export function createScheduledHandler(
  options?: Parameters<typeof createEmDashScheduledHandler>[0] & {
    wakeReconciliation?: ScheduledWakeReconciliationOptions;
  },
) {
  const emdashScheduled = createEmDashScheduledHandler(options);
  const generalCron = options?.generalCron?.trim();
  return (
    controller: ScheduledController,
    env: WorkerEnv,
    ctx: WorkerExecutionContext,
  ) => {
    emdashScheduled(controller, env, ctx);
    if (generalCron !== undefined && controller.cron !== generalCron) return;
    if (options?.wakeReconciliation?.execution && options?.wakeReconciliation?.associations) {
      ctx.waitUntil(
        runScheduledWakeReconciliation(options.wakeReconciliation).catch(() => {
          console.error("[scheduled] wake reconciliation failed");
        }),
      );
    }
  };
}

function createErrorResponse(
  status: number,
  message: string,
  extraHeaders: Record<string, string> = {},
  env: WorkerEnv = {},
  body: Record<string, unknown> = { error: message },
): Response {
  const headers = new Headers({
    "Content-Type": "application/json",
    ...extraHeaders,
  });
  applyLaunchNoIndexHeaders(headers, env);
  applySecurityHeaders(headers, env);
  return new Response(JSON.stringify(body), {
    status,
    headers,
  });
}

export default {
  async fetch(
    request: Request,
    env: WorkerEnv,
    ctx: WorkerExecutionContext,
  ): Promise<Response> {
    // 1. Enforce fail-closed rate limiter binding presence
    if (!env?.RATE_LIMITER || typeof env.RATE_LIMITER.limit !== "function") {
      return createErrorResponse(503, "Rate limiter service unavailable.", {}, env);
    }

    // 2. Enforce trusted Cloudflare connecting IP only (untrusted X-Forwarded-For is rejected)
    const clientIp = request.headers.get("cf-connecting-ip");
    if (!clientIp || clientIp.trim() === "") {
      return createErrorResponse(503, "Client IP identification unavailable.", {}, env);
    }

    // 3. Enforce rate limiting with dedicated scoped key
    const rateLimitKey = `demo:public:${clientIp.trim()}`;
    try {
      const rateLimitResult = await env.RATE_LIMITER.limit({ key: rateLimitKey });
      if (!rateLimitResult || typeof rateLimitResult.success !== "boolean") {
        return createErrorResponse(503, "Rate limiter malformed response.", {}, env);
      }
      if (!rateLimitResult.success) {
        return createErrorResponse(
          429,
          "Too many requests. Please try again later.",
          { "Retry-After": "60" },
          env,
        );
      }
    } catch {
      return createErrorResponse(503, "Rate limiter failure.", {}, env);
    }

    // 4. Strict route and method boundary evaluation
    const url = new URL(request.url);
    const slashlessPath = slashlessRedirectPath(url.pathname);
    if (slashlessPath && (request.method === "GET" || request.method === "HEAD")) {
      const redirectUrl = new URL(request.url);
      redirectUrl.pathname = slashlessPath;
      const response = new Response(null, {
        status: 302,
        headers: {
          Location: redirectUrl.href,
          "Cache-Control": "no-store",
        },
      });
      applyLaunchNoIndexHeaders(response.headers, env);
      applySecurityHeaders(response.headers, env);
      return response;
    }
    const check = evaluatePublicBoundary(
      request.method,
      url.pathname,
      url.search,
      request.url,
    );
    if (!check.allowed) {
      return createErrorResponse(check.status, check.reason ?? "Forbidden", {}, env);
    }

    if (
      !launchIndexableEnabled(env) &&
      SITEMAP_PATH.test(url.pathname) &&
      (request.method === "GET" || request.method === "HEAD")
    ) {
      return createErrorResponse(404, "Not Found", { "Cache-Control": "no-store" }, env);
    }

    if (
      isExactGuestCheckoutPath(url.pathname) &&
      paymentsUnavailableEnabled(env) &&
      (request.method === "POST" || request.method === "PUT" || request.method === "PATCH")
    ) {
      return createErrorResponse(
        503,
        "Checkout is not available yet.",
        { "Cache-Control": "no-store" },
        env,
        { error: "Checkout is not available yet.", code: "PAYMENTS_UNAVAILABLE" },
      );
    }

    // 5. Delegate to Astro Cloudflare server handler
    const response = await (astroHandler as { fetch(req: Request, env: unknown, ctx: unknown): Promise<Response> }).fetch(
      request,
      env,
      ctx,
    );

    // 6. Enforce security response headers and launch noindex
    const mutableResponse = new Response(response.body, response);
    applyLaunchNoIndexHeaders(mutableResponse.headers, env);
    applySecurityHeaders(mutableResponse.headers, env);
    return mutableResponse;
  },
  scheduled: createScheduledHandler(),
};
