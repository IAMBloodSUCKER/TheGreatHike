import sharp from 'sharp';
import path from 'path';
import { fileURLToPath } from 'url';
import { mkdir } from 'fs/promises';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '../..');
const assets = path.join(
  process.env.USERPROFILE,
  '.cursor/projects/i-projects-TheGreatHike/assets',
);

const SOURCES = {
  landing: 'c__Users_Maksim_AppData_Roaming_Cursor_User_workspaceStorage_8b7de6d792a2f7ccee25ca2395664f3b_images_image-4e658495-a32e-4943-a540-eba199cbe4cc.png',
  dashboard: 'c__Users_Maksim_AppData_Roaming_Cursor_User_workspaceStorage_8b7de6d792a2f7ccee25ca2395664f3b_images_image-6ab7fd4f-f489-411b-89e7-08ce724b7f04.png',
  visit: 'c__Users_Maksim_AppData_Roaming_Cursor_User_workspaceStorage_8b7de6d792a2f7ccee25ca2395664f3b_images_image-2c6b308c-1bfb-45cb-8d3d-1c6dcc578e52.png',
  recent: 'c__Users_Maksim_AppData_Roaming_Cursor_User_workspaceStorage_8b7de6d792a2f7ccee25ca2395664f3b_images_image-9fd3ac36-1195-4f85-bc05-831bedad81ea.png',
  auth: 'c__Users_Maksim_AppData_Roaming_Cursor_User_workspaceStorage_8b7de6d792a2f7ccee25ca2395664f3b_images_image-6f8972a4-7d28-4825-9630-79c0e8db20a5.png',
};

const outDir = path.join(root, 'docs/screenshots');
await mkdir(outDir, { recursive: true });

function src(name) {
  return path.join(assets, SOURCES[name]);
}

async function resize(name, width, crop) {
  let img = sharp(src(name));
  if (crop) {
    const meta = await img.metadata();
    const { left = 0, top = 0, width: w, height: h } = crop(meta);
    img = img.extract({ left, top, width: w, height: h });
  }
  const buf = await img.resize({ width, withoutEnlargement: false }).png({ compressionLevel: 9 }).toBuffer();
  const out = path.join(outDir, `${name}.png`);
  await sharp(buf).toFile(out);
  return sharp(buf).metadata();
}

const landingMeta = await resize('landing', 960, (m) => ({
  left: 0,
  top: 0,
  width: m.width,
  height: Math.min(m.height, Math.round(m.width * 0.72)),
}));

const dashboardMeta = await resize('dashboard', 960, (m) => ({
  left: 0,
  top: 0,
  width: m.width,
  height: Math.min(m.height, Math.round(m.width * 0.62)),
}));

await resize('visit', 440);
await resize('recent', 440);
await resize('auth', 400);

async function loadPng(name) {
  return sharp(path.join(outDir, `${name}.png`)).png().toBuffer();
}

async function fitHeight(buf, height) {
  const meta = await sharp(buf).metadata();
  const scale = height / meta.height;
  const width = Math.round(meta.width * scale);
  return sharp(buf).resize({ width, height }).png().toBuffer();
}

const row2H = 520;
const visitBuf = await fitHeight(await loadPng('visit'), row2H);
const dashBuf = await fitHeight(await loadPng('dashboard'), row2H);
const visitW = (await sharp(visitBuf).metadata()).width;
const dashW = (await sharp(dashBuf).metadata()).width;
const gap = 20;
const row2W = visitW + gap + dashW;

const row2 = await sharp({
  create: { width: row2W, height: row2H, channels: 4, background: { r: 15, g: 20, b: 28, alpha: 255 } },
})
  .composite([
    { input: visitBuf, left: 0, top: 0 },
    { input: dashBuf, left: visitW + gap, top: 0 },
  ])
  .png()
  .toBuffer();

const row3H = 340;
const authBuf = await fitHeight(await loadPng('auth'), row3H);
const recentBuf = await fitHeight(await loadPng('recent'), row3H);
const authW = (await sharp(authBuf).metadata()).width;
const row3W = authW + gap + (await sharp(recentBuf).metadata()).width;

const row3 = await sharp({
  create: { width: row3W, height: row3H, channels: 4, background: { r: 15, g: 20, b: 28, alpha: 255 } },
})
  .composite([
    { input: authBuf, left: 0, top: 0 },
    { input: recentBuf, left: authW + gap, top: 0 },
  ])
  .png()
  .toBuffer();

const landingBuf = await loadPng('landing');
const landingH = (await sharp(landingBuf).metadata()).height;
const collageW = Math.max(row2W, row3W, 960);
const padX = Math.max(0, Math.floor((collageW - row2W) / 2));
const padX3 = Math.max(0, Math.floor((collageW - row3W) / 2));
const padLanding = Math.max(0, Math.floor((collageW - 960) / 2));
const rowGap = 16;
const collageH = landingH + rowGap + row2H + rowGap + row3H;

await sharp({
  create: { width: collageW, height: collageH, channels: 4, background: { r: 15, g: 20, b: 28, alpha: 255 } },
})
  .composite([
    { input: landingBuf, left: padLanding, top: 0 },
    { input: row2, left: padX, top: landingH + rowGap },
    { input: row3, left: padX3, top: landingH + rowGap + row2H + rowGap },
  ])
  .png({ compressionLevel: 9 })
  .toFile(path.join(root, 'docs/readme-features.png'));

console.log('OK', path.join(root, 'docs/readme-features.png'));
