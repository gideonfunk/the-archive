/** Cloudflare Worker entry point for The Archive. */
import handler from "vinext/server/app-router-entry";

interface Env {
  ASSETS: Fetcher;
  DB: D1Database;
  R2: R2Bucket;
}

interface ExecutionContext {
  waitUntil(promise: Promise<unknown>): void;
  passThroughOnException(): void;
}

const worker = {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const response = await handler.fetch(request, env, ctx);
    const secured = new Response(response.body, response);
    secured.headers.set("X-Content-Type-Options", "nosniff");
    secured.headers.set("X-Frame-Options", "DENY");
    secured.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
    secured.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
    return secured;
  },
};

export default worker;
