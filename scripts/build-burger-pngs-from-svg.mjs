import fs from "node:fs";
import path from "node:path";
import { Jimp } from "jimp";

const BURGER_NAMES = [
  "bacon",
  "cheese",
  "american",
  "lautiboom",
  "bbqueen",
  "smoklahoma",
  "titanica",
];
const TARGET_WIDTH = 1600;
const TARGET_HEIGHT = 1280;
const TARGET_FILL_RATIO = 0.86;

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function isBackgroundPixel(data, pixelOffset) {
  const r = data[pixelOffset];
  const g = data[pixelOffset + 1];
  const b = data[pixelOffset + 2];

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const saturation = max - min;
  const luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b;

  const darkBackground = luminance <= 44 && saturation <= 38;
  const lightBackground = luminance >= 212 && saturation <= 62;
  return darkBackground || lightBackground;
}

function removeBorderConnectedBackground(image) {
  const { width, height, data } = image.bitmap;
  const pixelCount = width * height;
  const backgroundMask = new Uint8Array(pixelCount);
  const queue = new Int32Array(pixelCount);
  let queueStart = 0;
  let queueEnd = 0;

  function index(x, y) {
    return y * width + x;
  }

  function pushIfBackground(x, y) {
    if (x < 0 || x >= width || y < 0 || y >= height) return;
    const i = index(x, y);
    if (backgroundMask[i] !== 0) return;
    if (!isBackgroundPixel(data, i * 4)) return;
    backgroundMask[i] = 1;
    queue[queueEnd++] = i;
  }

  for (let x = 0; x < width; x += 1) {
    pushIfBackground(x, 0);
    pushIfBackground(x, height - 1);
  }
  for (let y = 1; y < height - 1; y += 1) {
    pushIfBackground(0, y);
    pushIfBackground(width - 1, y);
  }

  while (queueStart < queueEnd) {
    const i = queue[queueStart++];
    const y = Math.floor(i / width);
    const x = i - y * width;
    pushIfBackground(x + 1, y);
    pushIfBackground(x - 1, y);
    pushIfBackground(x, y + 1);
    pushIfBackground(x, y - 1);
  }

  const alpha = new Uint8Array(pixelCount);

  for (let i = 0; i < pixelCount; i += 1) {
    if (backgroundMask[i]) {
      alpha[i] = 0;
      continue;
    }

    const pixelOffset = i * 4;
    const r = data[pixelOffset];
    const g = data[pixelOffset + 1];
    const b = data[pixelOffset + 2];

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const saturation = max - min;
    const luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b;

    alpha[i] = 255;

    const y = Math.floor(i / width);
    const x = i - y * width;
    const touchesBackground =
      (x > 0 && backgroundMask[index(x - 1, y)] !== 0) ||
      (x + 1 < width && backgroundMask[index(x + 1, y)] !== 0) ||
      (y > 0 && backgroundMask[index(x, y - 1)] !== 0) ||
      (y + 1 < height && backgroundMask[index(x, y + 1)] !== 0);

    if (touchesBackground) {
      const nearDark = luminance < 80 && saturation < 60;
      const nearLight = luminance > 170 && saturation < 90;
      if (nearDark || nearLight) {
        const darkSoftness = clamp((80 - luminance) / 80, 0, 1);
        const lightSoftness = clamp((luminance - 170) / 85, 0, 1);
        const softness = nearDark ? darkSoftness : lightSoftness;
        alpha[i] = Math.round(255 * (1 - softness * 0.7));
      }
    }

    if (alpha[i] < 255) {
      const factor = alpha[i] / 255;
      data[pixelOffset] = Math.round(r * factor);
      data[pixelOffset + 1] = Math.round(g * factor);
      data[pixelOffset + 2] = Math.round(b * factor);
    }
  }

  for (let i = 0; i < pixelCount; i += 1) {
    data[i * 4 + 3] = alpha[i];
  }
}

function getLargestEmbeddedPngBuffer(svgText) {
  const matches = [...svgText.matchAll(/data:image\/png;base64,([A-Za-z0-9+/=]+)/g)];
  if (matches.length === 0) {
    return null;
  }

  let bestBase64 = matches[0][1];
  for (const match of matches) {
    if (match[1].length > bestBase64.length) {
      bestBase64 = match[1];
    }
  }
  return Buffer.from(bestBase64, "base64");
}

function getOpaqueBounds(image, alphaThreshold = 10) {
  const { width, height, data } = image.bitmap;
  let minX = width;
  let minY = height;
  let maxX = -1;
  let maxY = -1;

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const alpha = data[(y * width + x) * 4 + 3];
      if (alpha <= alphaThreshold) continue;
      if (x < minX) minX = x;
      if (y < minY) minY = y;
      if (x > maxX) maxX = x;
      if (y > maxY) maxY = y;
    }
  }

  if (maxX < minX || maxY < minY) {
    return null;
  }

  return {
    x: minX,
    y: minY,
    w: maxX - minX + 1,
    h: maxY - minY + 1,
  };
}

function normalizeBurgerScale(image) {
  const bounds = getOpaqueBounds(image);
  if (!bounds) return image;

  const trimmed = image.clone().crop(bounds);

  const fitWidth = Math.round(TARGET_WIDTH * TARGET_FILL_RATIO);
  const fitHeight = Math.round(TARGET_HEIGHT * TARGET_FILL_RATIO);

  const scale = Math.min(fitWidth / trimmed.bitmap.width, fitHeight / trimmed.bitmap.height);
  const normalizedWidth = Math.max(1, Math.round(trimmed.bitmap.width * scale));
  const normalizedHeight = Math.max(1, Math.round(trimmed.bitmap.height * scale));

  const resized = trimmed.resize({ w: normalizedWidth, h: normalizedHeight });
  const canvas = new Jimp({
    width: TARGET_WIDTH,
    height: TARGET_HEIGHT,
    color: 0x00000000,
  });

  const offsetX = Math.floor((TARGET_WIDTH - normalizedWidth) / 2);
  const offsetY = Math.floor((TARGET_HEIGHT - normalizedHeight) / 2);
  canvas.composite(resized, offsetX, offsetY);

  return canvas;
}

async function buildPng(name) {
  const svgPath = path.join("public", "burgers", `${name}.svg`);
  const pngPath = path.join("public", "burgers", `${name}.png`);

  if (!fs.existsSync(svgPath)) {
    console.warn(`Skipping ${name}: missing ${svgPath}`);
    return;
  }

  const svgText = fs.readFileSync(svgPath, "utf8");
  const buffer = getLargestEmbeddedPngBuffer(svgText);
  if (!buffer) {
    console.warn(`Skipping ${name}: no embedded PNG in ${svgPath}`);
    return;
  }

  const image = await Jimp.read(buffer);
  removeBorderConnectedBackground(image);
  const normalized = normalizeBurgerScale(image);
  await normalized.write(pngPath);
  console.log(`Generated ${pngPath}`);
}

for (const name of BURGER_NAMES) {
  // eslint-disable-next-line no-await-in-loop
  await buildPng(name);
}
