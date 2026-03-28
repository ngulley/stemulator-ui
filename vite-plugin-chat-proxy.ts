/**
 * Vite dev-server plugin: AI chat proxy
 *
 * Intercepts  POST /stemulator/v1/chat/completions
 * and first attempts to forward the request to the Spring Boot backend.
 * If the backend is unavailable, falls back to calling OpenAI directly
 * using the server-only env var OPENAI_API_KEY.
 *
 * This means the frontend works with EITHER:
 *   1. The stemulator-api backend running on :8080 (no local API key needed)
 *   2. An OPENAI_API_KEY in .env (no backend needed)
 *   3. Both (backend is preferred)
 */

import type { Plugin } from "vite";
import type { IncomingMessage, ServerResponse } from "http";
import { config as loadEnv } from "dotenv";

const PROXY_PATH = "/stemulator/v1/chat/completions";
const BACKEND_URL = "http://localhost:8080/stemulator/v1/chat/completions";
const OPENAI_URL = "https://api.openai.com/v1/chat/completions";
const MODEL = "gpt-4o-mini";

export default function chatProxy(): Plugin {
  // Load .env on startup so non-VITE_ vars are available;
  // override: true ensures updated values are picked up on restarts.
  loadEnv({ override: true });

  return {
    name: "stemulator-chat-proxy",
    configureServer(server) {
      // Register BEFORE the built-in proxy so we catch the route first
      server.middlewares.use(
        PROXY_PATH,
        async (req: IncomingMessage, res: ServerResponse) => {
          if (req.method !== "POST") {
            res.statusCode = 405;
            res.end(JSON.stringify({ error: "Method not allowed" }));
            return;
          }

          // Read the incoming request body
          const chunks: Buffer[] = [];
          for await (const chunk of req) {
            chunks.push(chunk as Buffer);
          }
          const bodyStr = Buffer.concat(chunks).toString();

          let body: Record<string, unknown>;
          try {
            body = JSON.parse(bodyStr);
          } catch {
            res.statusCode = 400;
            res.setHeader("Content-Type", "application/json");
            res.end(JSON.stringify({ error: "Invalid JSON in request body" }));
            return;
          }

          // ── Path 1: Try the Spring Boot backend first ──
          try {
            const backendRes = await fetch(BACKEND_URL, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: bodyStr,
              signal: AbortSignal.timeout(5000), // 5s timeout
            });

            if (backendRes.ok) {
              const data = await backendRes.json();
              res.statusCode = 200;
              res.setHeader("Content-Type", "application/json");
              res.end(JSON.stringify(data));
              return;
            }
            // Non-OK response — fall through to OpenAI fallback
            console.warn(
              `[chat-proxy] Backend returned ${backendRes.status}, falling back to OpenAI`,
            );
          } catch (backendErr: unknown) {
            const msg =
              backendErr instanceof Error
                ? backendErr.message
                : "Unknown error";
            console.warn(
              `[chat-proxy] Backend unavailable (${msg}), falling back to OpenAI`,
            );
          }

          // ── Path 2: Fall back to direct OpenAI ──
          loadEnv({ override: true });
          const apiKey = process.env.OPENAI_API_KEY;
          if (!apiKey) {
            res.statusCode = 503;
            res.setHeader("Content-Type", "application/json");
            res.end(
              JSON.stringify({
                error:
                  "AI Coach is unavailable. Neither the stemulator-api backend (localhost:8080) " +
                  "nor a local OPENAI_API_KEY is configured. Start the backend or add " +
                  "OPENAI_API_KEY to your .env file.",
              }),
            );
            return;
          }

          try {
            const openaiRes = await fetch(OPENAI_URL, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${apiKey}`,
              },
              body: JSON.stringify({
                model: MODEL,
                messages: body.messages,
                temperature: body.temperature ?? 0.7,
                max_tokens: body.max_tokens ?? 1024,
              }),
              signal: AbortSignal.timeout(30_000), // 30s — matches frontend timeout
            });

            const data = await openaiRes.json();
            res.statusCode = openaiRes.status;
            res.setHeader("Content-Type", "application/json");
            res.end(JSON.stringify(data));
          } catch (err: unknown) {
            const message =
              err instanceof Error ? err.message : "Unknown error";
            res.statusCode = 502;
            res.setHeader("Content-Type", "application/json");
            res.end(
              JSON.stringify({ error: `Failed to reach OpenAI: ${message}` }),
            );
          }
        },
      );
    },
  };
}
