import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import basicSsl from "@vitejs/plugin-basic-ssl";
import { apiDevMiddlewarePlugin } from "./api/_dev/apiMiddleware.js";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, ".", "");
  const repo = env.GITHUB_REPOSITORY?.split("/").pop() || "burgerya-pedidos";
  const envBase = env.VITE_BASE;
  const ghBase = `/${repo}/`;
  const base = envBase || (env.GITHUB_ACTIONS ? ghBase : "/");

  return {
    // Cache de dependencias propia para el modo https: dos servidores con
    // distinta config que comparten node_modules/.vite se invalidan entre si
    // ("504 Outdated Optimize Dep").
    ...(mode === "lan-https" ? { cacheDir: "node_modules/.vite-lan" } : {}),
    // `npm run dev:lan` (mode lan-https): https con certificado autofirmado
    // para probar desde un celular en la misma red. Sin https los navegadores
    // bloquean la geolocalizacion y crypto.randomUUID en IPs de red local.
    plugins: [
      react(),
      apiDevMiddlewarePlugin(env),
      ...(mode === "lan-https" ? [basicSsl()] : []),
    ],
    base,
  };
});
