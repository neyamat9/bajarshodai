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

const CUSTOM_IMAGES = [
  {
    key: 'bosta_paijam_25kg',
    file: 'C:/Users/Neyamat/.gemini/antigravity/brain/9c645c23-83b2-4cf6-bccf-1508d4f0a069/rice_bosta_paijam_25kg_1794289633656.jpg',
  },
  {
    key: 'bosta_atash_25kg',
    file: 'C:/Users/Neyamat/.gemini/antigravity/brain/9c645c23-83b2-4cf6-bccf-1508d4f0a069/rice_bosta_atash_25kg_1794289645748.jpg',
  },
  {
    key: 'bosta_atap_25kg',
    file: 'C:/Users/Neyamat/.gemini/antigravity/brain/9c645c23-83b2-4cf6-bccf-1508d4f0a069/rice_bosta_atap_25kg_1794289657769.jpg',
  },
  {
    key: 'bowl_miniket_premium',
    file: 'C:/Users/Neyamat/.gemini/antigravity/brain/9c645c23-83b2-4cf6-bccf-1508d4f0a069/rice_bowl_premium_miniket_1794289669010.jpg',
  },
  {
    key: 'bowl_chinigura_aromatic',
    file: 'C:/Users/Neyamat/.gemini/antigravity/brain/9c645c23-83b2-4cf6-bccf-1508d4f0a069/rice_bowl_chinigura_aromatic_1794289690845.jpg',
  },
  {
    key: 'bowl_basmati_aged',
    file: 'C:/Users/Neyamat/.gemini/antigravity/brain/9c645c23-83b2-4cf6-bccf-1508d4f0a069/rice_bowl_aged_basmati_1794289702527.jpg',
  },
  {
    key: 'bowl_nazirshail_adhasiddha',
    file: 'C:/Users/Neyamat/.gemini/antigravity/brain/9c645c23-83b2-4cf6-bccf-1508d4f0a069/rice_bowl_nazirshail_adhasiddha_1794289713605.jpg',
  },
  {
    key: 'bowl_atash_siddha',
    file: 'C:/Users/Neyamat/.gemini/antigravity/brain/9c645c23-83b2-4cf6-bccf-1508d4f0a069/rice_bowl_atash_siddha_1794289726847.jpg',
  },
];

async function main() {
  console.log('Converting custom images to WebP and uploading to Cloudflare R2...');
  const mapping = {};

  for (const item of CUSTOM_IMAGES) {
    console.log(`Processing ${item.key}...`);
    const webpBuffer = await sharp(item.file)
      .resize(1200, 1200, { fit: 'inside', background: '#ffffff' })
      .flatten({ background: '#ffffff' })
      .webp({ quality: 90 })
      .toBuffer();

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

    const r2Url = `${publicUrl}/${r2Key}`;
    mapping[item.key] = { r2Url, uuid };
    console.log(`   ✓ Uploaded: ${r2Url}`);
  }

  const outPath = path.join(__dirname, 'custom_rice_images.json');
  fs.writeFileSync(outPath, JSON.stringify(mapping, null, 2), 'utf8');
  console.log('Saved custom images mapping to:', outPath);
}

main().catch(console.error);
