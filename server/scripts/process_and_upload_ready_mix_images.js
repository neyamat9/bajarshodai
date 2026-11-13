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
  { code: 'MIX-01', url: 'https://eggyolk.chaldal.com/api/Picture/Raw?pictureId=110485' },
  { code: 'MIX-02', url: 'https://eggyolk.chaldal.com/api/Picture/Raw?pictureId=113113' },
  { code: 'MIX-03', url: 'https://eggyolk.chaldal.com/api/Picture/Raw?pictureId=133613' },
  { code: 'MIX-04', url: 'https://eggyolk.chaldal.com/api/Picture/Raw?pictureId=132529' },
  { code: 'MIX-05', url: 'https://eggyolk.chaldal.com/api/Picture/Raw?pictureId=122976' },
  { code: 'MIX-06', url: 'https://eggyolk.chaldal.com/api/Picture/Raw?pictureId=110797' },
  { code: 'MIX-07', url: 'https://eggyolk.chaldal.com/api/Picture/Raw?pictureId=122637' },
  { code: 'MIX-08', url: 'https://eggyolk.chaldal.com/api/Picture/Raw?pictureId=138436' },
  { code: 'MIX-09', url: 'https://eggyolk.chaldal.com/api/Picture/Raw?pictureId=133628' },
  { code: 'MIX-10', url: 'https://eggyolk.chaldal.com/api/Picture/Raw?pictureId=132524' },
  { code: 'MIX-11', url: 'https://eggyolk.chaldal.com/api/Picture/Raw?pictureId=109980' },
  { code: 'MIX-12', url: 'https://eggyolk.chaldal.com/api/Picture/Raw?pictureId=100991' },
  { code: 'MIX-13', url: 'https://eggyolk.chaldal.com/api/Picture/Raw?pictureId=132448' },
  { code: 'MIX-14', url: 'https://eggyolk.chaldal.com/api/Picture/Raw?pictureId=180889' },
  { code: 'MIX-15', url: 'https://eggyolk.chaldal.com/api/Picture/Raw?pictureId=110486' },
  { code: 'MIX-16', url: 'https://eggyolk.chaldal.com/api/Picture/Raw?pictureId=108144' },
  { code: 'MIX-17', url: 'https://eggyolk.chaldal.com/api/Picture/Raw?pictureId=177466' },
  { code: 'MIX-18', url: 'https://eggyolk.chaldal.com/api/Picture/Raw?pictureId=96331' },
  { code: 'MIX-19', url: 'https://eggyolk.chaldal.com/api/Picture/Raw?pictureId=110495' },
  { code: 'MIX-20', url: 'https://eggyolk.chaldal.com/api/Picture/Raw?pictureId=149026' },
  { code: 'MIX-21', url: 'https://eggyolk.chaldal.com/api/Picture/Raw?pictureId=59374' },
  { code: 'MIX-22', url: 'https://eggyolk.chaldal.com/api/Picture/Raw?pictureId=133601' },
  { code: 'MIX-23', url: 'https://eggyolk.chaldal.com/api/Picture/Raw?pictureId=110807' },
  { code: 'MIX-24', url: 'https://eggyolk.chaldal.com/api/Picture/Raw?pictureId=113118' },
  { code: 'MIX-25', url: 'https://eggyolk.chaldal.com/api/Picture/Raw?pictureId=109973' },
  { code: 'MIX-26', url: 'https://eggyolk.chaldal.com/api/Picture/Raw?pictureId=110469' },
  { code: 'MIX-27', url: 'https://eggyolk.chaldal.com/api/Picture/Raw?pictureId=48317' },
  { code: 'MIX-28', url: 'https://eggyolk.chaldal.com/api/Picture/Raw?pictureId=109997' },
  { code: 'MIX-29', url: 'https://eggyolk.chaldal.com/api/Picture/Raw?pictureId=123001' },
  { code: 'MIX-30', url: 'https://eggyolk.chaldal.com/api/Picture/Raw?pictureId=178321' },
  { code: 'MIX-31', url: 'https://eggyolk.chaldal.com/api/Picture/Raw?pictureId=138437' },
  { code: 'MIX-32', url: 'https://eggyolk.chaldal.com/api/Picture/Raw?pictureId=154706' },
  { code: 'MIX-33', url: 'https://eggyolk.chaldal.com/api/Picture/Raw?pictureId=133625' },
  { code: 'MIX-34', url: 'https://eggyolk.chaldal.com/api/Picture/Raw?pictureId=109975' },
  { code: 'MIX-35', url: 'https://eggyolk.chaldal.com/api/Picture/Raw?pictureId=96335' },
  { code: 'MIX-36', url: 'https://eggyolk.chaldal.com/api/Picture/Raw?pictureId=94968' },
  { code: 'MIX-37', url: 'https://eggyolk.chaldal.com/api/Picture/Raw?pictureId=110489' },
  { code: 'MIX-38', url: 'https://eggyolk.chaldal.com/api/Picture/Raw?pictureId=133623' },
  { code: 'MIX-39', url: 'https://eggyolk.chaldal.com/api/Picture/Raw?pictureId=108014' },
  { code: 'MIX-40', url: 'https://eggyolk.chaldal.com/api/Picture/Raw?pictureId=132526' },
  { code: 'MIX-41', url: 'https://eggyolk.chaldal.com/api/Picture/Raw?pictureId=186430' },
  { code: 'MIX-42', url: 'https://eggyolk.chaldal.com/api/Picture/Raw?pictureId=48330' },
  { code: 'MIX-43', url: 'https://eggyolk.chaldal.com/api/Picture/Raw?pictureId=110479' },
  { code: 'MIX-44', url: 'https://eggyolk.chaldal.com/api/Picture/Raw?pictureId=95818' },
  { code: 'MIX-45', url: 'https://eggyolk.chaldal.com/api/Picture/Raw?pictureId=175132' },
  { code: 'MIX-46', url: 'https://eggyolk.chaldal.com/api/Picture/Raw?pictureId=127108' },
  { code: 'MIX-47', url: 'https://eggyolk.chaldal.com/api/Picture/Raw?pictureId=133619' },
  { code: 'MIX-48', url: 'https://eggyolk.chaldal.com/api/Picture/Raw?pictureId=131312' },
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
  console.log(`Processing and uploading ${TARGETS.length} Ready Mix image assets to R2...`);
  const mapping = {};

  for (let i = 0; i < TARGETS.length; i++) {
    const item = TARGETS[i];
    console.log(`[${i + 1}/${TARGETS.length}] Processing ${item.code}...`);
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

  const outPath = path.join(__dirname, 'ready_mix_uploaded_images.json');
  fs.writeFileSync(outPath, JSON.stringify(mapping, null, 2), 'utf8');
  console.log(`\nAll done! Successfully uploaded ${Object.keys(mapping).length}/${TARGETS.length} images to ${outPath}`);
}

main().catch(console.error);

