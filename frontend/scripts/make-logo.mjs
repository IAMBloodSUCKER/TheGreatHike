import sharp from 'sharp';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '../..');
const srcPath = path.join(root, 'docs/mascot-source.png');
const destPath = path.join(root, 'frontend/public/logo.png');

const PADDING = 18;

function sampleBackground(data, width, height) {
  const points = [
    [2, 2],
    [width - 3, 2],
    [2, height - 3],
    [width - 3, height - 3],
    [width >> 1, 2],
    [2, height >> 1],
  ];
  let r = 0;
  let g = 0;
  let b = 0;
  for (const [x, y] of points) {
    const i = (y * width + x) * 4;
    r += data[i];
    g += data[i + 1];
    b += data[i + 2];
  }
  const n = points.length;
  return { r: r / n, g: g / n, b: b / n };
}

function isMascotPixel(r, g, b) {
  // Коричневые/бежевые тона какашки
  if (r > 72 && g > 42 && b < r - 6) return true;
  // Золотой значок
  if (r > 185 && g > 145 && b < 150) return true;
  // Румянец
  if (r > 200 && g > 110 && g < 190 && b < 120) return true;
  // Розовый язык
  if (r > 170 && g > 80 && g < 150 && b > 90 && b < 170) return true;
  // Белые блики в глазах
  if (r > 210 && g > 210 && b > 210) return true;
  // Тёплые тёмные контуры (не синий фон)
  if (r > 38 && r - b > 8 && g > 28) return true;
  return false;
}

function backgroundAlpha(r, g, b, bgR, bgG, bgB) {
  if (isMascotPixel(r, g, b)) {
    return 255;
  }

  const dr = r - bgR;
  const dg = g - bgG;
  const db = b - bgB;
  const dist = Math.sqrt(dr * dr + dg * dg + db * db);

  // Фон баннера — холодный сине-серый
  const coolBg = b >= g - 4 && g >= r - 6;
  if (coolBg && dist < 52) {
    if (dist < 18) return 0;
    return Math.round(255 - ((dist - 18) / 34) * 255);
  }

  if (dist < 28) {
    if (dist < 12) return 0;
    return Math.round(((dist - 12) / 16) * 180);
  }

  return 255;
}

const { data, info } = await sharp(srcPath).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
const bg = sampleBackground(data, info.width, info.height);

for (let i = 0; i < data.length; i += 4) {
  const alpha = backgroundAlpha(data[i], data[i + 1], data[i + 2], bg.r, bg.g, bg.b);
  data[i + 3] = alpha;
}

const trimmed = await sharp(data, {
  raw: { width: info.width, height: info.height, channels: 4 },
})
  .trim({ threshold: 8 })
  .png()
  .toBuffer();

await sharp(trimmed)
  .extend({
    top: PADDING,
    bottom: PADDING,
    left: PADDING,
    right: PADDING,
    background: { r: 0, g: 0, b: 0, alpha: 0 },
  })
  .png()
  .toFile(destPath);

const meta = await sharp(destPath).metadata();
console.log(`Mascot logo ${meta.width}x${meta.height} -> ${destPath}`);
