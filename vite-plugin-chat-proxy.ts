/**
 * Vite dev-server plugin: OpenAI chat proxy
 *
 * Intercepts  POST /stemulator/v1/chat/completions
 * and forwards the request to the OpenAI Chat Completions API.
 *
 * The API key is read from the server-only env var OPENAI_API_KEY
 * (no VITE_ prefix → never shipped to the browser bundle).
 */

import type { Plugin } from "vite";
import type { IncomingMessage, ServerResponse } from "http";
import { config as loadEnv } from "dotenv";

const PROXY_PATH = "/stemulator/v1/chat/completions";
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

          // Re-read .env on every request so key rotations take effect
          // without a server restart
          loadEnv({ override: true });
          const apiKey = process.env.OPENAI_API_KEY;
          if (!apiKey) {
            res.statusCode = 503;
            res.setHeader("Content-Type", "application/json");
            res.end(
              JSON.stringify({
                error:
                  "OPENAI_API_KEY is not set. Add it to your .env file (without the VITE_ prefix).",
              }),
            );
            return;
          }

          // Read the incoming request body
          const chunks: Buffer[] = [];
          for await (const chunk of req) {
            chunks.push(chunk as Buffer);
          }
          const body = JSON.parse(Buffer.concat(chunks).toString());

          // Forward to OpenAI
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
