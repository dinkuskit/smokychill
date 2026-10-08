import { describe, expect, it } from "vitest";

import {
  applyLaunchNoIndexHeaders,
  launchIndexableEnabled,
  launchRobotsTxtBody,
  paymentsUnavailableEnabled,
} from "../../src/features/security/launch-indexing.js";

describe("launch indexing gate", () => {
  it("defaults to noindex while DINKUS_LAUNCH_INDEXABLE is not 1", () => {
    expect(launchIndexableEnabled({ DINKUS_LAUNCH_INDEXABLE: "0" })).toBe(false);
    expect(launchIndexableEnabled({})).toBe(false);
    const headers = new Headers();
    applyLaunchNoIndexHeaders(headers, { DINKUS_LAUNCH_INDEXABLE: "0" });
    expect(headers.get("X-Robots-Tag")).toBe("noindex, nofollow");
    expect(launchRobotsTxtBody({ DINKUS_LAUNCH_INDEXABLE: "0" })).toContain("Disallow: /");
  });

  it("allows crawl only when DINKUS_LAUNCH_INDEXABLE is explicitly 1", () => {
    expect(launchIndexableEnabled({ DINKUS_LAUNCH_INDEXABLE: "1" })).toBe(true);
    const headers = new Headers();
    applyLaunchNoIndexHeaders(headers, { DINKUS_LAUNCH_INDEXABLE: "1" });
    expect(headers.get("X-Robots-Tag")).toBeNull();
    expect(launchRobotsTxtBody({ DINKUS_LAUNCH_INDEXABLE: "1" })).toContain("Allow: /");
  });

  it("keeps robots.txt disallow aligned with the committed launch var default", () => {
    expect(launchRobotsTxtBody({ DINKUS_LAUNCH_INDEXABLE: "0" })).toBe(
      "User-agent: *\nDisallow: /\n",
    );
  });
});

describe("payments unavailable gate", () => {
  it("treats missing or 1 as unavailable", () => {
    expect(paymentsUnavailableEnabled({})).toBe(true);
    expect(paymentsUnavailableEnabled({ PAYMENTS_UNAVAILABLE: "1" })).toBe(true);
    expect(paymentsUnavailableEnabled({ PAYMENTS_UNAVAILABLE: "0" })).toBe(false);
  });
});
