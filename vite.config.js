import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, ".", "");
  const repo = env.GITHUB_REPOSITORY?.split("/").pop() || "burgerya-pedidos";
  const envBase = env.VITE_BASE;
  const ghBase = `/${repo}/`;
  const base = envBase || (env.GITHUB_ACTIONS ? ghBase : "/");

  return {
    plugins: [react()],
    base,
  };
});
