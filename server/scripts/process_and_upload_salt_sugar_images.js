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

const ART_DIR = 'C:/Users/Neyamat/.gemini/antigravity/brain/9c645c23-83b2-4cf6-bccf-1508d4f0a069';

const TARGETS = [
  {
    key: 'aci_pure_salt_1kg',
    name: 'ACI Pure Salt 1kg',
    url: 'https://eggyolk.chaldal.com/api/Picture/Raw?pictureId=47100',
  },
  {
    key: 'aci_pure_salt_500g',
    name: 'ACI Pure Salt 500g',
    url: 'https://eggyolk.chaldal.com/api/Picture/Raw?pictureId=57736',
  },
  {
    key: 'fresh_super_premium_salt_1kg',
    name: 'Fresh Super Premium (Vacuum) Salt 1kg',
    url: 'https://eggyolk.chaldal.com/api/Picture/Raw?pictureId=128654',
  },
  {
    key: 'fresh_refined_sugar_1kg',
    name: 'Fresh Refined Sugar 1kg',
    url: 'https://eggyolk.chaldal.com/api/Picture/Raw?pictureId=113128',
  },
  {
    key: 'teer_refined_sugar_1kg',
    name: 'Teer Sugar 1kg',
    url: 'https://eggyolk.chaldal.com/api/Picture/Raw?pictureId=101003',
  },
  {
    key: 'sugar_plastic_bosta_open',
    name: 'Sugar in Open Plastic Bosta',
    local: path.join(ART_DIR, 'sugar_sack_product_1794304136313.jpg'),
  },
];

async function fetchBuffer(url) {
  const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
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

async function uploadToR2(webpBuffer) {
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
  console.log(`Processing and uploading ${TARGETS.length} salt & sugar images to R2...`);
  const mapping = {};

  for (let i = 0; i < TARGETS.length; i++) {
    const item = TARGETS[i];
    console.log(`[${i + 1}/${TARGETS.length}] Processing ${item.name}...`);
    try {
      let rawBuf;
      if (item.local) {
        rawBuf = fs.readFileSync(item.local);
      } else {
        rawBuf = await fetchBuffer(item.url);
      }

      const webpBuf = await processImage(rawBuf);
      const r2Url = await uploadToR2(webpBuf);
      mapping[item.key] = r2Url;
      console.log(`   ✓ Uploaded: ${r2Url}`);
    } catch (e) {
      console.error(`   ✗ Failed for ${item.key}:`, e.message);
    }
  }

  const outPath = path.join(__dirname, 'salt_sugar_uploaded_images.json');
  fs.writeFileSync(outPath, JSON.stringify(mapping, null, 2), 'utf8');
  console.log(`\nSuccessfully processed and saved mapping to ${outPath}`);
}

main().catch(console.error);

