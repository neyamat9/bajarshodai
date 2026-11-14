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
  {
    code: 'OTHER-01',
    name: 'BBQ Charcoal Bag 1 kg',
    filePath: 'C:/Users/Neyamat/.gemini/antigravity/brain/9c645c23-83b2-4cf6-bccf-1508d4f0a069/bbq_hardwood_charcoal_product_1794638879892.jpg',
  },
  {
    code: 'OTHER-02',
    name: 'Booter Besan 500g',
    filePath: 'C:/Users/Neyamat/.gemini/antigravity/brain/9c645c23-83b2-4cf6-bccf-1508d4f0a069/booter_besan_1794638878182.jpg',
  },
  {
    code: 'OTHER-03',
    name: 'Sagudana 200g',
    filePath: 'C:/Users/Neyamat/.gemini/antigravity/brain/9c645c23-83b2-4cf6-bccf-1508d4f0a069/sago_pearls_sabudana_1794638878708.jpg',
  },
  {
    code: 'OTHER-04',
    name: "Foster Clark's Corn Flour 400g",
    filePath: 'C:/Users/Neyamat/.gemini/antigravity/brain/9c645c23-83b2-4cf6-bccf-1508d4f0a069/foster_clarks_corn_flour_1794638881385.jpg',
  },
  {
    code: 'OTHER-05',
    name: 'Deshelled Tamarind 200g',
    filePath: 'C:/Users/Neyamat/.gemini/antigravity/brain/9c645c23-83b2-4cf6-bccf-1508d4f0a069/deshelled_tamarind_pulp_1794638919942.jpg',
  },
  {
    code: 'OTHER-06',
    name: 'Pumpkin Seeds 100g',
    filePath: 'C:/Users/Neyamat/.gemini/antigravity/brain/9c645c23-83b2-4cf6-bccf-1508d4f0a069/pumpkin_seeds_1794638917868.jpg',
  },
  {
    code: 'OTHER-07',
    name: 'Whole Nutmeg 5 pcs',
    filePath: 'C:/Users/Neyamat/.gemini/antigravity/brain/9c645c23-83b2-4cf6-bccf-1508d4f0a069/whole_nutmeg_jaiphol_5seeds_1794638937718.jpg',
  },
];

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
  console.log(`Processing and uploading ${TARGETS.length} Other Groceries product images to R2...`);
  const mapping = {};

  for (let i = 0; i < TARGETS.length; i++) {
    const item = TARGETS[i];
    console.log(`[${i + 1}/${TARGETS.length}] Processing ${item.code} (${item.name})...`);
    try {
      if (!fs.existsSync(item.filePath)) {
        throw new Error(`File does not exist: ${item.filePath}`);
      }
      const rawBuf = fs.readFileSync(item.filePath);
      const webpBuf = await processImage(rawBuf);
      const r2Url = await uploadToR2(webpBuf, item.code);
      mapping[item.code] = {
        name: item.name,
        url: r2Url,
        sizeBytes: webpBuf.length,
      };
      console.log(`   ✓ Uploaded ${item.code}: ${r2Url} (${Math.round(webpBuf.length / 1024)} KB)`);
    } catch (e) {
      console.error(`   ✗ Failed for ${item.code}:`, e.message);
    }
  }

  const outPath = path.join(__dirname, 'other_groceries_uploaded_images.json');
  fs.writeFileSync(outPath, JSON.stringify(mapping, null, 2), 'utf8');
  console.log(`\nAll done! Successfully uploaded ${Object.keys(mapping).length}/${TARGETS.length} images to ${outPath}`);
}

main().catch(console.error);
