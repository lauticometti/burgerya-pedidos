import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({ command }) => {
  const repo =
    process.env.GITHUB_REPOSITORY?.split("/").pop() || "burgerya-pedidos";
  const envBase = process.env.VITE_BASE;
  const ghBase = `/${repo}/`;
  const base =
    envBase || (process.env.GITHUB_ACTIONS ? ghBase : command === "build" ? "/" : "/");

  return {
    plugins: [react()],
    base,
  };
});
