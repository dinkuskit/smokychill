import type { APIRoute } from "astro";
import { launchRobotsTxtBody } from "../features/security/launch-indexing.js";

export const prerender = false;

export const GET: APIRoute = () => {
  const body = launchRobotsTxtBody({
    ...process.env,
    ...(import.meta.env as Record<string, unknown>),
  });
  return new Response(body, {
    status: 200,
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
};
