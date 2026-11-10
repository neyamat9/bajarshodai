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

const OPEN_BOSTA_IMAGES = [
  {
    key: 'bosta_paijam_25kg',
    file: 'C:/Users/Neyamat/.gemini/antigravity/brain/9c645c23-83b2-4cf6-bccf-1508d4f0a069/rice_bosta_open_paijam_25kg_1794291790231.jpg',
  },
  {
    key: 'bosta_atash_25kg',
    file: 'C:/Users/Neyamat/.gemini/antigravity/brain/9c645c23-83b2-4cf6-bccf-1508d4f0a069/rice_bosta_open_atash_25kg_1794291810343.jpg',
  },
  {
    key: 'bosta_atap_25kg',
    file: 'C:/Users/Neyamat/.gemini/antigravity/brain/9c645c23-83b2-4cf6-bccf-1508d4f0a069/rice_bosta_open_atap_25kg_1794291833160.jpg',
  },
];

async function main() {
  console.log('Uploading 3 OPEN BOSTA images to R2...');
  const customPath = path.join(__dirname, 'custom_rice_images.json');
  const customMapping = JSON.parse(fs.readFileSync(customPath, 'utf8'));

  for (const item of OPEN_BOSTA_IMAGES) {
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
    customMapping[item.key] = { r2Url, uuid };
    console.log(`   ✓ Uploaded open bosta: ${r2Url}`);
  }

  fs.writeFileSync(customPath, JSON.stringify(customMapping, null, 2), 'utf8');
  console.log('Updated custom_rice_images.json with open bosta images!');
}

main().catch(console.error);
