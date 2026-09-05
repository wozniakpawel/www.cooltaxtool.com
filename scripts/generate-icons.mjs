import { chromium } from '@playwright/test';
import { readFile, writeFile } from 'node:fs/promises';

// Keep browser, bookmark and home-screen icons derived from the same vector.
const publicDir = new URL('../public/', import.meta.url);
const svg = await readFile(new URL('favicon.svg', publicDir), 'utf8');
const browser = await chromium.launch();
try {
  const page = await browser.newPage({ deviceScaleFactor: 1 });
  const images = new Map();
  for (const size of [16, 24, 32, 48, 64, 128, 180, 192, 512]) {
    await page.setViewportSize({ width: size, height: size });
    await page.setContent(
      `<style>html,body{margin:0}svg{display:block;width:100%;height:100%}</style>${svg}`,
    );
    images.set(size, await page.screenshot({ omitBackground: true }));
  }
  for (const size of [128, 192, 512]) {
    await writeFile(new URL(`logo${size}.png`, publicDir), images.get(size));
  }
  await writeFile(new URL('apple-touch-icon.png', publicDir), images.get(180));

  // ICO directory followed by PNG images at native browser icon sizes.
  const sizes = [16, 24, 32, 48, 64];
  const directory = Buffer.alloc(6 + sizes.length * 16);
  directory.writeUInt16LE(1, 2);
  directory.writeUInt16LE(sizes.length, 4);
  let offset = directory.length;
  sizes.forEach((size, i) => {
    const entry = 6 + i * 16;
    const png = images.get(size);
    directory[entry] = directory[entry + 1] = size;
    directory.writeUInt16LE(1, entry + 4);
    directory.writeUInt16LE(32, entry + 6);
    directory.writeUInt32LE(png.length, entry + 8);
    directory.writeUInt32LE(offset, entry + 12);
    offset += png.length;
  });
  await writeFile(
    new URL('favicon.ico', publicDir),
    Buffer.concat([directory, ...sizes.map((size) => images.get(size))]),
  );
} finally {
  await browser.close();
}
