// Middleware de Vite (solo dev) que enruta /api/* a los mismos archivos que
// corren como Vercel Serverless Functions en produccion, sin necesitar la
// Vercel CLI. Replica lo minimo que Vercel hace automaticamente:
// - matchea /api/<ruta> -> api/<ruta>.js (default export (req, res) => {})
// - parsea el body JSON de POST/PUT/PATCH en req.body
// - agrega los helpers res.status(code).json(obj) que usan los handlers
//
// Las env vars no-VITE_* (la API key de Google, el secreto de firma, etc.)
// tambien se copian a process.env aca, porque Vite solo expone las VITE_*
// a import.meta.env — los handlers de /api leen process.env directamente,
// igual que en Vercel.

import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";

const apiDir = path.resolve(fileURLToPath(new URL(".", import.meta.url)), "..");

export function apiDevMiddlewarePlugin(env) {
  return {
    name: "burgerya-api-dev-middleware",
    apply: "serve",
    configureServer(server) {
      for (const [key, value] of Object.entries(env)) {
        if (process.env[key] === undefined) process.env[key] = value;
      }

      server.middlewares.use(async (req, res, next) => {
        if (!req.url || !req.url.startsWith("/api/")) {
          next();
          return;
        }

        const urlPath = req.url.split("?")[0];
        const relativePath = urlPath.replace(/^\/api\//, "");
        if (relativePath.includes("..")) {
          res.statusCode = 400;
          res.end("Bad request");
          return;
        }

        const filePath = path.join(apiDir, `${relativePath}.js`);
        // Igual que Vercel: lo que esta en carpetas/archivos con "_" o "."
        // (helpers, tests) nunca es un endpoint.
        const isPrivate = relativePath.split("/").some((seg) => seg.startsWith("_") || seg.startsWith("."));
        if (isPrivate || !fs.existsSync(filePath)) {
          next();
          return;
        }

        try {
          if (["POST", "PUT", "PATCH"].includes(req.method)) {
            const chunks = [];
            for await (const chunk of req) chunks.push(chunk);
            const raw = Buffer.concat(chunks).toString("utf8");
            req.body = raw ? JSON.parse(raw) : {};
          }

          res.status = (code) => {
            res.statusCode = code;
            return res;
          };
          res.json = (body) => {
            res.setHeader("Content-Type", "application/json");
            res.end(JSON.stringify(body));
          };

          const mod = await server.ssrLoadModule(filePath);
          await mod.default(req, res);
        } catch (err) {
          console.error(`[api-dev] error manejando ${req.url}:`, err);
          if (!res.headersSent) {
            res.statusCode = 500;
            res.setHeader("Content-Type", "application/json");
          }
          res.end(JSON.stringify({ error: "internal_error" }));
        }
      });
    },
  };
}
