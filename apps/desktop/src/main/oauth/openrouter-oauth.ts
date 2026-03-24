import { createServer, type Server, type IncomingMessage, type ServerResponse } from "node:http";
import { randomBytes, createHash } from "node:crypto";
import { shell } from "electron";

const OPENROUTER_AUTH_URL = "https://openrouter.ai/auth";
const OPENROUTER_KEYS_URL = "https://openrouter.ai/api/v1/auth/keys";
const CALLBACK_PORT = 19283;
const CALLBACK_PATH = "/oauth/callback";

interface OAuthResult {
  ok: true;
  apiKey: string;
}

interface OAuthError {
  ok: false;
  error: string;
}

function generateCodeVerifier(): string {
  return randomBytes(32).toString("base64url");
}

function generateCodeChallenge(verifier: string): string {
  return createHash("sha256").update(verifier).digest("base64url");
}

export async function startOpenRouterOAuth(): Promise<OAuthResult | OAuthError> {
  const codeVerifier = generateCodeVerifier();
  const codeChallenge = generateCodeChallenge(codeVerifier);
  const callbackUrl = `http://localhost:${CALLBACK_PORT}${CALLBACK_PATH}`;

  return new Promise((resolve) => {
    let server: Server | null = null;
    let resolved = false;

    const cleanup = () => {
      if (server !== null) {
        server.close();
        server = null;
      }
    };

    const finish = (result: OAuthResult | OAuthError) => {
      if (resolved) return;
      resolved = true;
      cleanup();
      resolve(result);
    };

    const timeout = setTimeout(() => {
      finish({ ok: false, error: "Tiempo agotado. Cerrá la ventana del navegador e intentá de nuevo." });
    }, 300_000);

    server = createServer(async (req: IncomingMessage, res: ServerResponse) => {
      const url = new URL(req.url ?? "/", `http://localhost:${CALLBACK_PORT}`);

      if (url.pathname !== CALLBACK_PATH) {
        res.writeHead(404);
        res.end();
        return;
      }

      const code = url.searchParams.get("code");

      if (code === null || code === "") {
        const html = buildHtmlResponse(false, "No se recibió el código de autorización.");
        res.writeHead(400, { "Content-Type": "text/html; charset=utf-8" });
        res.end(html);
        clearTimeout(timeout);
        finish({ ok: false, error: "No se recibió código de autorización" });
        return;
      }

      try {
        const response = await fetch(OPENROUTER_KEYS_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            code,
            code_verifier: codeVerifier,
            code_challenge_method: "S256",
          }),
        });

        if (!response.ok) {
          const body = await response.text();
          const html = buildHtmlResponse(false, "Error al obtener la clave.");
          res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
          res.end(html);
          clearTimeout(timeout);
          finish({ ok: false, error: `OpenRouter respondió ${response.status}: ${body}` });
          return;
        }

        const data = (await response.json()) as { key: string };
        const html = buildHtmlResponse(true, "Podés cerrar esta pestaña y volver a Sócrates.");
        res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
        res.end(html);
        clearTimeout(timeout);
        finish({ ok: true, apiKey: data.key });
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Error desconocido";
        const html = buildHtmlResponse(false, msg);
        res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
        res.end(html);
        clearTimeout(timeout);
        finish({ ok: false, error: msg });
      }
    });

    server.listen(CALLBACK_PORT, "127.0.0.1", () => {
      const authUrl =
        `${OPENROUTER_AUTH_URL}?callback_url=${encodeURIComponent(callbackUrl)}` +
        `&code_challenge=${codeChallenge}&code_challenge_method=S256`;

      void shell.openExternal(authUrl);
    });

    server.on("error", (err: Error) => {
      clearTimeout(timeout);
      finish({ ok: false, error: `No se pudo iniciar servidor local: ${err.message}` });
    });
  });
}

function buildHtmlResponse(success: boolean, message: string): string {
  const color = success ? "#22c55e" : "#ef4444";
  const title = success ? "Conexión exitosa" : "Hubo un problema";
  return `<!DOCTYPE html>
<html lang="es">
<head><meta charset="utf-8"><title>Sócrates</title>
<style>
  body{font-family:system-ui,sans-serif;display:flex;justify-content:center;align-items:center;min-height:100vh;margin:0;background:#0a0a0a;color:#fafafa}
  .card{text-align:center;padding:3rem;border-radius:1rem;border:1px solid #27272a;max-width:400px}
  h1{font-size:1.5rem;color:${color};margin-bottom:.5rem}
  p{color:#a1a1aa;font-size:.95rem}
</style></head>
<body><div class="card"><h1>${title}</h1><p>${message}</p></div></body></html>`;
}
