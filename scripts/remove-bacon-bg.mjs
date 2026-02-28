import { Jimp } from "jimp";

const inputPath = "public/burgers/bacon.jpg";
const outputPath = "public/burgers/bacon-cutout.png";

const image = await Jimp.read(inputPath);
const { width, height, data } = image.bitmap;
const pixelCount = width * height;

const bgMask = new Uint8Array(pixelCount);
const queue = new Int32Array(pixelCount);
let queueStart = 0;
let queueEnd = 0;

const woodStartY = Math.floor(height * 0.915);

function getIdx(x, y) {
  return y * width + x;
}

function readPixel(i) {
  const px = i * 4;
  const r = data[px];
  const g = data[px + 1];
  const b = data[px + 2];
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const saturation = max - min;
  const luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  return { r, g, b, saturation, luminance };
}

function isBackgroundCandidate(i, y) {
  const { r, g, b, saturation, luminance } = readPixel(i);
  const darkStudioBg = luminance < 86 && saturation < 94;
  if (darkStudioBg) return true;

  if (y >= woodStartY) {
    const woodLike = r > 66 && g > 35 && b < 82 && r > g;
    if (woodLike) return true;
  }

  return false;
}

function tryPush(x, y) {
  if (x < 0 || x >= width || y < 0 || y >= height) return;
  const idx = getIdx(x, y);
  if (bgMask[idx] !== 0) return;
  if (!isBackgroundCandidate(idx, y)) return;
  bgMask[idx] = 1;
  queue[queueEnd++] = idx;
}

for (let x = 0; x < width; x += 1) {
  tryPush(x, 0);
  tryPush(x, height - 1);
}
for (let y = 1; y < height - 1; y += 1) {
  tryPush(0, y);
  tryPush(width - 1, y);
}

while (queueStart < queueEnd) {
  const idx = queue[queueStart++];
  const y = Math.floor(idx / width);
  const x = idx - y * width;
  tryPush(x + 1, y);
  tryPush(x - 1, y);
  tryPush(x, y + 1);
  tryPush(x, y - 1);
}

const alpha = new Uint8Array(pixelCount);
for (let i = 0; i < pixelCount; i += 1) {
  alpha[i] = bgMask[i] ? 0 : 255;
}

for (let y = 1; y < height - 1; y += 1) {
  for (let x = 1; x < width - 1; x += 1) {
    const idx = getIdx(x, y);
    if (alpha[idx] === 0) continue;
    const isEdge =
      bgMask[getIdx(x + 1, y)] ||
      bgMask[getIdx(x - 1, y)] ||
      bgMask[getIdx(x, y + 1)] ||
      bgMask[getIdx(x, y - 1)];
    if (isEdge) alpha[idx] = 178;
  }
}

for (let i = 0; i < pixelCount; i += 1) {
  data[i * 4 + 3] = alpha[i];
}

await image.write(outputPath);
console.log(`Generated cutout image: ${outputPath}`);
