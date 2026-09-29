import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

// Vercel convierte en funcion serverless TODO archivo .js dentro de api/,
// salvo los que esten en una carpeta (o tengan un nombre) que empiece con "_"
// o ".". Un test dentro de api/location/ se publicaba como endpoint (y daba
// 500). Los tests y helpers viven en api/_tests y api/_lib; este guardrail
// falla si aparece cualquier otro archivo publicable.
const apiDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function publishableFiles(dir, rel = "") {
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name.startsWith("_") || entry.name.startsWith(".")) continue;
    const relPath = rel ? `${rel}/${entry.name}` : entry.name;
    if (entry.isDirectory()) out.push(...publishableFiles(path.join(dir, entry.name), relPath));
    else if (/\.(c|m)?[jt]s$/.test(entry.name)) out.push(relPath);
  }
  return out;
}

describe("funciones publicables en api/", () => {
  it("son exactamente los 3 endpoints de ubicacion (ningun test ni helper queda publicado)", () => {
    expect(publishableFiles(apiDir).sort()).toEqual([
      "location/autocomplete.js",
      "location/retrieve.js",
      "location/reverse.js",
    ]);
  });
});
