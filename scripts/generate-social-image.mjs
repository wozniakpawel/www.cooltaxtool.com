import { chromium } from '@playwright/test';
import { readFile, writeFile } from 'node:fs/promises';

// Render the editable vector with the site's bundled fonts; no network required.
// Run: node scripts/generate-social-image.mjs
const root = new URL('../', import.meta.url);
const publicDir = new URL('public/', root);
const svg = await readFile(new URL('og-image.svg', publicDir), 'utf8');
const fonts = [
  ['Space Grotesk', 'space-grotesk', 500],
  ['Space Grotesk', 'space-grotesk', 700],
  ['IBM Plex Sans', 'ibm-plex-sans', 400],
  ['IBM Plex Sans', 'ibm-plex-sans', 500],
  ['IBM Plex Sans', 'ibm-plex-sans', 600],
];
const fontCss = await Promise.all(
  fonts.map(async ([family, packageName, weight]) => {
    const data = await readFile(
      new URL(
        `node_modules/@fontsource/${packageName}/files/${packageName}-latin-${weight}-normal.woff2`,
        root,
      ),
    );
    return `@font-face{font-family:'${family}';font-weight:${weight};src:url(data:font/woff2;base64,${data.toString('base64')}) format('woff2')}`;
  }),
);
const browser = await chromium.launch();
try {
  const page = await browser.newPage({
    viewport: { width: 1200, height: 630 },
    deviceScaleFactor: 1,
  });
  await page.setContent(
    `<style>${fontCss.join('\n')}html,body{margin:0}svg{display:block}</style>${svg}`,
  );
  await page.evaluate(() => document.fonts.ready);
  const image = await page.screenshot();
  // Keep the original URL current, and use a new URL in metadata for this design.
  await writeFile(new URL('og-image.png', publicDir), image);
  await writeFile(new URL('og-image-v2.png', publicDir), image);
} finally {
  await browser.close();
}
