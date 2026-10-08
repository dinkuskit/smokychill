export const LAUNCH_NOINDEX_ROBOTS = "noindex, nofollow";

export function launchIndexableEnabled(
  env: Record<string, unknown> = process.env,
): boolean {
  const value = env.DINKUS_LAUNCH_INDEXABLE;
  return typeof value === "string" && value === "1";
}

export function applyLaunchNoIndexHeaders(
  headers: Headers,
  env: Record<string, unknown> = process.env,
): void {
  if (!launchIndexableEnabled(env)) {
    headers.set("X-Robots-Tag", LAUNCH_NOINDEX_ROBOTS);
  }
}

export function launchRobotsTxtBody(
  env: Record<string, unknown> = process.env,
): string {
  if (launchIndexableEnabled(env)) {
    return ["User-agent: *", "Allow: /", ""].join("\n");
  }
  return ["User-agent: *", "Disallow: /", ""].join("\n");
}

export function paymentsUnavailableEnabled(
  env: Record<string, unknown> = process.env,
): boolean {
  const value = env.PAYMENTS_UNAVAILABLE;
  return value === undefined || value === "1" || value === true;
}
