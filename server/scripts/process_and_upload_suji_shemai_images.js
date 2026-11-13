const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const fs = require('fs');
const sharp = require('sharp');
const { randomUUID } = require('crypto');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');

const endpoint = process.env.R2_ENDPOINT || `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`;
const bucket = process.env.R2_BUCKET_NAME;
const publicUrl = (process.env.R2_PUBLIC_URL || '').replace(/\/$/, '');

const s3 = new S3Client({
  region: 'auto',
  endpoint,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
});

const TARGETS = [
  { code: 'SS-01', name: 'Fresh Suji 500g', url: 'https://eggyolk.chaldal.com/api/Picture/Raw?pictureId=97221' },
  { code: 'SS-02', name: 'Banoful Lachha Shemai 200g', url: 'https://eggyolk.chaldal.com/api/Picture/Raw?pictureId=101139' },
  { code: 'SS-03', name: 'Radhuni Shemai 200g', url: 'https://eggyolk.chaldal.com/api/Picture/Raw?pictureId=110805' },
  { code: 'SS-04', name: 'ACI Pure Suji 500g', url: 'https://eggyolk.chaldal.com/api/Picture/Raw?pictureId=177380' },
  { code: 'SS-05', name: 'Kolson Special Lachha Shemai 180g', url: 'https://eggyolk.chaldal.com/api/Picture/Raw?pictureId=113038' },
  { code: 'SS-06', name: 'Pran Chikon Shemai 200g', url: 'https://eggyolk.chaldal.com/api/Picture/Raw?pictureId=108686' },
  { code: 'SS-07', name: 'Olympic Lachha Shemai 200g', url: 'https://eggyolk.chaldal.com/api/Picture/Raw?pictureId=154920' },
  { code: 'SS-08', name: 'Banoful Vermicelli Shemai 200g', url: 'https://eggyolk.chaldal.com/api/Picture/Raw?pictureId=182946' },
  { code: 'SS-09', name: 'Kolson Cock Vermicelli Red Shemai 200g', url: 'https://eggyolk.chaldal.com/api/Picture/Raw?pictureId=141265' },
];

async function fetchBuffer(url) {
  const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' }, signal: AbortSignal.timeout(10000) });
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  const ab = await res.arrayBuffer();
  return Buffer.from(ab);
}

async function processImage(inputBuffer) {
  return await sharp(inputBuffer)
    .resize(1080, 1080, { fit: 'inside', background: '#ffffff' })
    .flatten({ background: '#ffffff' })
    .extend({
      top: 60,
      bottom: 60,
      left: 60,
      right: 60,
      background: '#ffffff',
    })
    .resize(1200, 1200, { fit: 'cover', background: '#ffffff' })
    .webp({ quality: 90 })
    .toBuffer();
}

async function uploadToR2(webpBuffer, code) {
  const uuid = randomUUID();
  const r2Key = `media/products/${uuid}.webp`;
  await s3.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: r2Key,
      Body: webpBuffer,
      ContentType: 'image/webp',
      CacheControl: 'public, max-age=31536000, immutable',
    }),
  );
  return `${publicUrl}/${r2Key}`;
}

async function main() {
  console.log(`Processing and uploading ${TARGETS.length} Suji & Shemai image assets to R2...`);
  const mapping = {};

  for (let i = 0; i < TARGETS.length; i++) {
    const item = TARGETS[i];
    console.log(`[${i + 1}/${TARGETS.length}] Processing ${item.code} (${item.name})...`);
    try {
      const rawBuf = await fetchBuffer(item.url);
      const webpBuf = await processImage(rawBuf);
      const r2Url = await uploadToR2(webpBuf, item.code);
      mapping[item.code] = r2Url;
      console.log(`   ✓ Uploaded ${item.code}: ${r2Url}`);
    } catch (e) {
      console.error(`   ✗ Failed for ${item.code}:`, e.message);
    }
  }

  const outPath = path.join(__dirname, 'suji_shemai_uploaded_images.json');
  fs.writeFileSync(outPath, JSON.stringify(mapping, null, 2), 'utf8');
  console.log(`\nAll done! Successfully uploaded ${Object.keys(mapping).length}/${TARGETS.length} images to ${outPath}`);
}

main().catch(console.error);

