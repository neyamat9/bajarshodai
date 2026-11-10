const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const https = require('https');
const http = require('http');
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

const BRAND_ITEMS = [
  {
    key: 'chashi_chinigura_1kg',
    name: 'Chashi Aromatic Chinigura Rice 1kg',
    url: 'https://d2t8nl1y0ie1km.cloudfront.net/images/thumbs/65fa94ea115075f231ec5762_Chashi-Chinigura-Rice-1kg_1.webp',
  },
  {
    key: 'chashi_chinigura_2kg',
    name: 'Chashi Aromatic Chinigura Rice 2kg',
    url: 'https://d2t8nl1y0ie1km.cloudfront.net/images/65fa94ea115075f231ec5796_Chashi-Chinigura-Rice-2kg_1.webp',
  },
  {
    key: 'chashi_chinigura_5kg',
    name: 'Chashi Aromatic Chinigura Rice 5kg',
    url: 'https://d2t8nl1y0ie1km.cloudfront.net/images/thumbs/65fa94eb115075f231ec57c1_Chashi-Chinigura-Rice-5kg_1.webp',
  },
  {
    key: 'aci_pure_nazirshail_5kg',
    name: 'ACI Pure Nazirshail Rice 5kg',
    url: 'https://d2t8nl1y0ie1km.cloudfront.net/images/thumbs/65fa94f4115075f231ec5f21_ACI-Pure-Premium-Najirshail-Rice-5Kg_1.webp',
  },
  {
    key: 'aci_pure_miniket_5kg',
    name: 'ACI Pure Premium Miniket Rice 5kg',
    url: 'https://d2t8nl1y0ie1km.cloudfront.net/images/thumbs/65fa94e6115075f231ec54d5_ACI-Pure-Premium-Miniket-Rice-5kg_1.webp',
  },
  {
    key: 'aci_pure_miniket_10kg',
    name: 'ACI Pure Miniket Rice Premium 10kg',
    url: 'https://d2t8nl1y0ie1km.cloudfront.net/images/thumbs/65fa94f5115075f231ec5fe4_ACI-Pure-Miniket-Rice-10kg-Poly_1.webp',
  },
  {
    key: 'aci_aroma_basmati_1kg',
    name: 'ACI Aroma Premium Basmati Rice 1kg',
    url: 'https://d2t8nl1y0ie1km.cloudfront.net/images/thumbs/666014006c1b8d7d189908ce_ACI-Aroma-Pure-Basmati-Rice-1kg_1.webp',
  },
  {
    key: 'aci_aroma_chinigura_2kg',
    name: 'ACI Aroma Chinigura Rice 2kg',
    url: 'https://d2t8nl1y0ie1km.cloudfront.net/images/thumbs/680e38dd26241b2e2fa3b85a_ACI-Aroma-Chinigura-Rice-2kg_1.webp',
  },
  {
    key: 'pran_chinigura_1kg',
    name: 'PRAN Chinigura Aromatic Rice 1kg',
    url: 'https://d2t8nl1y0ie1km.cloudfront.net/images/thumbs/65fa94d5115075f231ec4f69_Pran-Chinigura-Rice-1Kg_1.webp',
  },
  {
    key: 'pran_chinigura_2kg',
    name: 'PRAN Chinigura Aromatic Rice 2kg',
    url: 'https://d2t8nl1y0ie1km.cloudfront.net/images/thumbs/65fa94d5115075f231ec4f6d_Pran-Chinigura-Rice-2Kg_1.webp',
  },
  {
    key: 'pran_metro_basmati_1kg',
    name: 'PRAN Metro Basmati Rice 1kg',
    url: 'https://www.pranfoods.net/storage/products/3a4dac46-ea2e-401d-b846-ae6c511e0461.png',
  },
  {
    key: 'fresh_chinigura_1kg',
    name: 'Fresh Chinigura Rice 1kg',
    url: 'https://d2t8nl1y0ie1km.cloudfront.net/images/thumbs/680e38e626241b2e2fa3b90f_Fresh-Chinigura-Rice-1kg_1.webp',
  },
  {
    key: 'rupchanda_chinigura_1kg',
    name: 'Rupchanda Chinigura Premium Aromatic Rice 1kg',
    url: 'https://d2t8nl1y0ie1km.cloudfront.net/images/thumbs/65fa94e8115075f231ec55c0_Rupchanda-Chinigura-Rice-1kg_1.webp',
  },
  {
    key: 'rupchanda_jirashail_5kg',
    name: 'Rupchanda Jirashail Rice 5kg',
    url: 'https://d2t8nl1y0ie1km.cloudfront.net/images/thumbs/65fa94f7115075f231ec6129_Rupchanda-Miniket-Rice-5kg_1.webp',
  },
  {
    key: 'aarong_natural_chinigura_5kg',
    name: 'Aarong Natural Chinigura Rice 5kg',
    url: 'https://m2ce.sindabad.com/pub/media/catalog/product/a/a/aarong-natural-chinigura-rice-5-kg.jpg',
  },
  {
    key: 'fortune_biryani_basmati_1kg',
    name: 'Fortune Biryani Special Basmati Rice 1kg',
    url: 'https://d2t8nl1y0ie1km.cloudfront.net/images/thumbs/65fa94f0115075f231ec5b7d_Fortune-Basmati-Biryani-Rice-1kg_1.webp',
  },
  {
    key: 'mehran_basmati_kernel_1kg',
    name: 'Mehran Basmati Kernel Rice 1kg',
    url: 'https://d2t8nl1y0ie1km.cloudfront.net/images/thumbs/65fa94e8115075f231ec5650_Mehran-Bashmati-Rice-1kg_1.webp',
  },
  {
    key: 'royal_umbrella_hom_mali_5kg',
    name: 'Royal Umbrella Pure Thai Hom Mali Rice 5kg',
    url: 'https://img.drz.lazcdn.com/static/bd/p/403b71f984ae40512563a0aa83ec9e14.jpg_720x720q80.jpg',
  },
  {
    key: 'royal_umbrella_sticky_rice_1kg',
    name: 'Royal Umbrella Thai Glutinous Sticky Rice 1kg',
    url: 'https://img.drz.lazcdn.com/static/bd/p/d7e238837f019549498d9e7cf77d22f6.jpg_960x960q80.jpg_.webp',
  },
];

function downloadBuffer(url) {
  return new Promise((resolve, reject) => {
    const getter = url.startsWith('https') ? https : http;
    getter.get(url, { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' } }, res => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return downloadBuffer(res.headers.location).then(resolve).catch(reject);
      }
      if (res.statusCode !== 200) {
        return reject(new Error(`Failed to download ${url}: HTTP ${res.statusCode}`));
      }
      const chunks = [];
      res.on('data', c => chunks.push(c));
      res.on('end', () => resolve(Buffer.concat(chunks)));
    }).on('error', reject);
  });
}

async function processAndUpload(buffer, filename) {
  // Pad with white background into 1200x1200 square
  const webpBuffer = await sharp(buffer)
    .resize({
      width: 1000,
      height: 1000,
      fit: 'inside',
      background: { r: 255, g: 255, b: 255, alpha: 1 },
    })
    .flatten({ background: '#ffffff' })
    .extend({
      top: 100,
      bottom: 100,
      left: 100,
      right: 100,
      background: '#ffffff',
    })
    .resize(1200, 1200, { fit: 'cover', background: '#ffffff' })
    .webp({ quality: 90 })
    .toBuffer();

  const r2Key = `media/products/${filename}.webp`;
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
  console.log(`Starting download, processing, and R2 upload for ${BRAND_ITEMS.length} brand rice products...`);
  const results = {};

  for (let i = 0; i < BRAND_ITEMS.length; i++) {
    const item = BRAND_ITEMS[i];
    console.log(`[${i + 1}/${BRAND_ITEMS.length}] Processing ${item.name}...`);
    try {
      const buf = await downloadBuffer(item.url);
      const uuid = randomUUID();
      const r2Url = await processAndUpload(buf, uuid);
      results[item.key] = {
        name: item.name,
        r2Url,
        uuid,
      };
      console.log(`   ✓ Uploaded to: ${r2Url}`);
    } catch (err) {
      console.error(`   ✗ Error for ${item.name}:`, err.message);
    }
  }

  const outPath = path.join(__dirname, 'brand_rice_images.json');
  fs.writeFileSync(outPath, JSON.stringify(results, null, 2), 'utf8');
  console.log(`\nSuccessfully processed and saved mapping to ${outPath}`);
}

main().catch(console.error);
