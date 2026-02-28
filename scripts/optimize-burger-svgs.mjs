import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const BURGER_SVGS = [
  "american",
  "bacon",
  "bbqueen",
  "cheese",
  "lautiboom",
  "smoklahoma",
  "titanica",
];

const SRC_DIR = path.join("public", "burgers");
const TARGET_WIDTH = 1800; // downscale only if larger

function pickLargestDataUri(svgText) {
  const matches = [...svgText.matchAll(/data:image\/png;base64,([A-Za-z0-9+/=]+)/g)];
  if (!matches.length) return null;
  return matches.reduce((best, cur) => (cur[1].length > best[1].length ? cur : best));
}

async function recompressEmbeddedPng(svgPath) {
  const svgText = await fs.readFile(svgPath, "utf8");
  const match = pickLargestDataUri(svgText);
  if (!match) {
    console.warn(`No embedded PNG found in ${svgPath}`);
    return false;
  }

  const [full, base64] = match;
  const originalBuffer = Buffer.from(base64, "base64");

  const image = sharp(originalBuffer);
  const meta = await image.metadata();

  const resized = meta.width && meta.width > TARGET_WIDTH
    ? image.resize({ width: TARGET_WIDTH })
    : image;

  const recompressed = await resized.png({ compressionLevel: 9, adaptiveFiltering: true }).toBuffer();

  const newSvg = svgText.replace(full, `data:image/png;base64,${recompressed.toString("base64")}`);
  await fs.writeFile(svgPath, newSvg);
  console.log(
    `${path.basename(svgPath)}: ${(originalBuffer.length / 1e6).toFixed(2)}MB ? ${(recompressed.length / 1e6).toFixed(2)}MB (${meta.width || "?"}${meta.width && meta.width > TARGET_WIDTH ? "?" + TARGET_WIDTH : ""} px)`
  );
  return true;
}

async function main() {
  for (const name of BURGER_SVGS) {
    const svgPath = path.join(SRC_DIR, `${name}.svg`);
    await recompressEmbeddedPng(svgPath);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
