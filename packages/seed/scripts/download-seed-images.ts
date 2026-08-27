// One-off maintenance tool, NOT part of the regular seed flow — downloads
// the real sneaker photos seed.ts uses from Wikimedia Commons, downsizes
// them to a reasonable product-thumbnail size, and writes them into
// seed-images/ so seed.ts can read them from disk instead of hitting the
// network on every run. Re-run this only if the curated image list below
// (or PRODUCTS in seed.ts) changes.
//
//   npm run seed:images
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const COMMONS = 'https://upload.wikimedia.org/wikipedia/commons';
const OUT_DIR = path.join(import.meta.dirname, 'seed-images');

const IMAGES: { url: string; filename: string }[] = [
  { url: `${COMMONS}/7/7e/Nike_air_Force_1_white_on_white.jpg`, filename: 'nike-air-force-1.jpg' },
  { url: `${COMMONS}/a/ae/Air_max_90.JPG`, filename: 'nike-air-max-90.jpg' },
  {
    url: `${COMMONS}/3/34/Nike_Dunk_Low_Retro_%22Varsity_Green%22.jpg`,
    filename: 'nike-dunk-low-retro.jpg',
  },
  {
    url: `${COMMONS}/b/b6/Nike_React_Infinity_Run_Flyknit_2.png`,
    filename: 'nike-react-infinity-run.jpg',
  },
  {
    url: `${COMMONS}/5/56/Air_Jordan_1_Retro_High_OG_CO._Japan_silver.jpg`,
    filename: 'air-jordan-1.jpg',
  },
  {
    url: `${COMMONS}/c/c5/Nike_Air_Jordan_IV%2C_%28White_Cement_Colorway%29_%28cropped%29.jpg`,
    filename: 'air-jordan-4.jpg',
  },
  { url: `${COMMONS}/c/ce/Air_Jordan_XI_%28cropped%29.jpg`, filename: 'air-jordan-11.jpg' },
  {
    url: `${COMMONS}/5/5a/Adidas_Ultra_Boost_4_running_shoes.jpeg`,
    filename: 'adidas-ultraboost.jpg',
  },
  {
    url: `${COMMONS}/6/6a/Adidas_Stan_Smith_%28made_in_France%29.jpg`,
    filename: 'adidas-stan-smith.jpg',
  },
  { url: `${COMMONS}/f/fa/Adidas_Samba_OG.jpg`, filename: 'adidas-samba-og.jpg' },
  { url: `${COMMONS}/1/19/Adidas_Gazelle.jpg`, filename: 'adidas-gazelle.jpg' },
  { url: `${COMMONS}/7/72/Puma_suede_red.jpg`, filename: 'puma-suede-classic.jpg' },
  { url: `${COMMONS}/6/66/Puma_Clyde.jpg`, filename: 'puma-clyde.jpg' },
];

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// Wikimedia's bot policy throttles requests with no identifying User-Agent
// more aggressively than ones that provide one
const FETCH_USER_AGENT = 'ShopSeedScript/1.0 (local dev seed; https://github.com/noel-vega/shop)';

// Wikimedia Commons rate-limits bursts of requests (429) — back off and
// retry rather than failing the whole batch over a transient throttle
async function fetchWithRetry(url: string, attempts = 5): Promise<Response> {
  for (let attempt = 1; attempt <= attempts; attempt++) {
    const response = await fetch(url, { headers: { 'User-Agent': FETCH_USER_AGENT } });
    if (response.ok) return response;
    if (response.status === 429 && attempt < attempts) {
      const retryAfter = Number(response.headers.get('retry-after'));
      await sleep((Number.isFinite(retryAfter) && retryAfter > 0 ? retryAfter : attempt * 10) * 1000);
      continue;
    }
    throw new Error(`Failed to fetch ${url}: ${response.status}`);
  }
  throw new Error(`Failed to fetch ${url} after ${attempts} attempts`);
}

async function main() {
  await mkdir(OUT_DIR, { recursive: true });

  for (const { url, filename } of IMAGES) {
    const response = await fetchWithRetry(url);
    const bytes = Buffer.from(await response.arrayBuffer());

    const resized = await sharp(bytes)
      .resize(800, 800, { fit: 'inside', withoutEnlargement: true })
      .jpeg({ quality: 82 })
      .toBuffer();

    await writeFile(path.join(OUT_DIR, filename), resized);
    console.log(`${filename}: ${bytes.length} bytes -> ${resized.length} bytes`);
  }

  console.log(`Done. ${IMAGES.length} image(s) written to ${OUT_DIR}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
