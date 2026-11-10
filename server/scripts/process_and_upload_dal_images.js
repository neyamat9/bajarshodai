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
    key: 'masoor_dal_deshi_bowl',
    name: 'Deshi Masoor Dal in Wooden Bowl',
    local: path.join(ART_DIR, 'masoor_dal_deshi_bowl_1794308741815.jpg'),
  },
  {
    key: 'masoor_dal_imported_bowl',
    name: 'Imported Masoor Dal in Wooden Bowl',
    local: path.join(ART_DIR, 'masoor_dal_imported_bowl_1794308760373.jpg'),
  },
  {
    key: 'khesari_dal_bowl',
    name: 'Khesari Dal in Wooden Bowl',
    local: path.join(ART_DIR, 'khesari_dal_bowl_1794308782934.jpg'),
  },
  {
    key: 'motor_dal_bowl',
    name: 'Motor Dal in Wooden Bowl',
    local: path.join(ART_DIR, 'motor_dal_bowl_1794308801588.jpg'),
  },
  {
    key: 'moong_dal_bowl',
    name: 'Moong Dal in Wooden Bowl',
    local: path.join(ART_DIR, 'moong_dal_bowl_1794308770880.jpg'),
  },
  {
    key: 'boot_dal_bowl',
    name: 'Boot Dal / Chana Dal in Wooden Bowl',
    local: path.join(ART_DIR, 'boot_dal_bowl_1794308788035.jpg'),
  },
  {
    key: 'dabli_boot_bowl',
    name: 'Dabli Boot in Wooden Bowl',
    local: path.join(ART_DIR, 'dabli_boot_bowl_1794308768102.jpg'),
  },
  {
    key: 'peeled_chola_boot_bowl',
    name: 'Peeled Chola Boot in Wooden Bowl',
    local: path.join(ART_DIR, 'peeled_chola_boot_bowl_1794308789214.jpg'),
  },
  {
    key: 'maskalai_dal_bowl',
    name: 'Maskalai Dal Peeled in Wooden Bowl',
    local: path.join(ART_DIR, 'maskalai_dal_bowl_1794308807242.jpg'),
  },
  {
    key: 'pran_masoor_dal_deshi_packet',
    name: 'Pran Masoor Dal Deshi Packet',
    local: path.join(ART_DIR, 'pran_masoor_dal_deshi_packet_jpg_1794308789091.jpg'),
  },
  {
    key: 'pran_moong_dal_packet',
    name: 'Pran Moong Dal Packet',
    local: path.join(ART_DIR, 'pran_moong_dal_packet_1794308782458.jpg'),
  },
  {
    key: 'fresh_masoor_dal_packet',
    name: 'Fresh Premium Masoor Dal Packet',
    local: path.join(ART_DIR, 'fresh_masoor_dal_packet_1794308802688.jpg'),
  },
  {
    key: 'teer_masoor_dal_packet',
    name: 'Teer Masoor Dal 1kg Packet',
    url: 'https://eggyolk.chaldal.com/api/Picture/Raw?pictureId=101041',
  },
  {
    key: 'aarong_natural_masoor_dal_packet',
    name: 'Aarong Natural Masoor Dal 1kg Packet',
    url: 'https://eggyolk.chaldal.com/api/Picture/Raw?pictureId=122769',
  },
  {
    key: 'golden_grain_moong_dal_packet',
    name: 'Golden Grain Premium Moong Dal 500g Packet',
    url: 'https://eggyolk.chaldal.com/api/Picture/Raw?pictureId=186705',
  },
  {
    key: 'kangaroo_masoor_dal_packet',
    name: 'Kangaroo Masoor Dal 1kg Packet',
    url: 'https://eggyolk.chaldal.com/api/Picture/Raw?pictureId=182386',
  },
  {
    key: 'kabuli_boot_bowl',
    name: 'Kabuli Boot White Chickpeas Bowl',
    url: 'https://eggyolk.chaldal.com/api/Picture/Raw?pictureId=183019',
  },
  {
    key: 'chola_boot_bowl',
    name: 'Chola Boot Brown Chickpeas Bowl',
    url: 'https://upload.wikimedia.org/wikipedia/commons/6/67/Black_Channa.jpg',
  },
  {
    key: 'mixed_dal_bowl',
    name: 'Mixed Dal Panchmel Blend Bowl',
    url: 'https://upload.wikimedia.org/wikipedia/commons/e/e2/A_mix_of_split_lentils%2C_masoor_dal_India.jpg',
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
  console.log(`Processing and uploading ${TARGETS.length} Dal & Pulses images to R2...`);
  const mapping = {};

  for (let i = 0; i < TARGETS.length; i++) {
    const item = TARGETS[i];
    console.log(`[${i + 1}/${TARGETS.length}] Processing ${item.name}...`);

    let inputBuf;
    if (item.local) {
      if (!fs.existsSync(item.local)) {
        throw new Error(`Local file not found: ${item.local}`);
      }
      inputBuf = fs.readFileSync(item.local);
    } else if (item.url) {
      inputBuf = await fetchBuffer(item.url);
    }

    const webpBuf = await processImage(inputBuf);
    const cdnUrl = await uploadToR2(webpBuf);
    console.log(` -> Uploaded: ${cdnUrl}`);
    mapping[item.key] = cdnUrl;
  }

  const outPath = path.join(__dirname, 'dal_uploaded_images.json');
  fs.writeFileSync(outPath, JSON.stringify(mapping, null, 2), 'utf8');
  console.log(`\nSuccessfully processed and uploaded all ${TARGETS.length} images!`);
  console.log(`Mapping saved to: ${outPath}`);
}

main().catch(err => {
  console.error('Processing failed:', err);
  process.exit(1);
});
