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

// Complete list of unique spice image sources to process and upload
const SPICE_IMAGE_TARGETS = [
  // AI Generated Local Assets
  { key: 'shukna_morich_open_bosta', local: path.join(ART_DIR, 'spices_bosta_shukna_morich_open_1794298643088.jpg') },
  { key: 'alu_bokhara_open_bowl', local: path.join(ART_DIR, 'spices_bowl_alu_bokhara_png_1794298646304.jpg') },
  { key: 'golmorich_black_open_bowl', local: path.join(ART_DIR, 'spices_bowl_golmorich_black_1794298675690.jpg') },
  { key: 'coriander_powder_open_bowl', local: path.join(ART_DIR, 'coriander_powder_wooden_bowl_1794300455984.jpg') },

  // Open Spices & Bowls
  { key: 'turmeric_powder_open_bowl', url: 'https://upload.wikimedia.org/wikipedia/commons/a/a5/Grounded_turmeric.jpg' },
  { key: 'chili_powder_open_bowl', url: 'https://upload.wikimedia.org/wikipedia/commons/4/47/Redchilipepperpowder.JPG' },
  { key: 'cumin_seeds_open_bowl', url: 'https://eggyolk.chaldal.com/api/Picture/Raw?pictureId=183697' },
  { key: 'green_cardamom_25g_open_bowl', url: 'https://eggyolk.chaldal.com/api/Picture/Raw?pictureId=183665' },
  { key: 'green_cardamom_50g_open_bowl', url: 'https://eggyolk.chaldal.com/api/Picture/Raw?pictureId=184770' },
  { key: 'green_cardamom_100g_open_bowl', url: 'https://eggyolk.chaldal.com/api/Picture/Raw?pictureId=183664' },
  { key: 'black_cardamom_50g_open_bowl', url: 'https://eggyolk.chaldal.com/api/Picture/Raw?pictureId=50292' },
  { key: 'cloves_50g_open_bowl', url: 'https://eggyolk.chaldal.com/api/Picture/Raw?pictureId=184759' },
  { key: 'cinnamon_100g_open', url: 'https://eggyolk.chaldal.com/api/Picture/Raw?pictureId=48355' },
  { key: 'bay_leaves_100g_open', url: 'https://eggyolk.chaldal.com/api/Picture/Raw?pictureId=48347' },
  { key: 'white_pepper_50g_open_bowl', url: 'https://eggyolk.chaldal.com/api/Picture/Raw?pictureId=184757' },
  { key: 'coriander_seeds_100g_open_bowl', url: 'https://eggyolk.chaldal.com/api/Picture/Raw?pictureId=187914' },
  { key: 'panch_phoron_100g_open_bowl', url: 'https://eggyolk.chaldal.com/api/Picture/Raw?pictureId=97722' },
  { key: 'kalojira_100g_open_bowl', url: 'https://eggyolk.chaldal.com/api/Picture/Raw?pictureId=67826' },
  { key: 'fennel_100g_open_bowl', url: 'https://eggyolk.chaldal.com/api/Picture/Raw?pictureId=48365' },
  { key: 'fenugreek_100g_open_bowl', url: 'https://eggyolk.chaldal.com/api/Picture/Raw?pictureId=48366' },
  { key: 'mustard_yellow_100g_open_bowl', url: 'https://eggyolk.chaldal.com/api/Picture/Raw?pictureId=130992' },
  { key: 'mustard_red_100g_open_bowl', url: 'https://eggyolk.chaldal.com/api/Picture/Raw?pictureId=115243' },
  { key: 'mace_50g_open_bowl', url: 'https://eggyolk.chaldal.com/api/Picture/Raw?pictureId=89344' },
  { key: 'mace_100g_open_bowl', url: 'https://eggyolk.chaldal.com/api/Picture/Raw?pictureId=48378' },
  { key: 'nutmeg_5pcs_open', url: 'https://eggyolk.chaldal.com/api/Picture/Raw?pictureId=103098' },
  { key: 'poppy_50g_open_bowl', url: 'https://eggyolk.chaldal.com/api/Picture/Raw?pictureId=187931' },
  { key: 'tokma_100g_open_bowl', url: 'https://eggyolk.chaldal.com/api/Picture/Raw?pictureId=48426' },
  { key: 'chia_100g_open_bowl', url: 'https://eggyolk.chaldal.com/api/Picture/Raw?pictureId=78545' },
  { key: 'ekangi_100g_open_bowl', url: 'https://eggyolk.chaldal.com/api/Picture/Raw?pictureId=128020' },
  { key: 'arrowroot_100g_open_bowl', url: 'https://eggyolk.chaldal.com/api/Picture/Raw?pictureId=175875' },
  { key: 'ajwain_100g_open_bowl', url: 'https://eggyolk.chaldal.com/api/Picture/Raw?pictureId=48342' },
  { key: 'radhuni_seeds_100g_open_bowl', url: 'https://eggyolk.chaldal.com/api/Picture/Raw?pictureId=80140' },
  { key: 'kabab_chini_50g_open_bowl', url: 'https://eggyolk.chaldal.com/api/Picture/Raw?pictureId=94509' },
  { key: 'star_anise_50g_open_bowl', url: 'https://eggyolk.chaldal.com/api/Picture/Raw?pictureId=94222' },
  { key: 'shahi_jeera_50g_open_bowl', url: 'https://eggyolk.chaldal.com/api/Picture/Raw?pictureId=94412' },
  { key: 'supari_250g_open_bowl', url: 'https://eggyolk.chaldal.com/api/Picture/Raw?pictureId=46972' },
  { key: 'walnut_100g_open_bowl', url: 'https://eggyolk.chaldal.com/api/Picture/Raw?pictureId=184610' },

  // Radhuni Standard Packets
  { key: 'radhuni_turmeric_50g', url: 'https://eggyolk.chaldal.com/api/Picture/Raw?pictureId=132555' },
  { key: 'radhuni_turmeric_100g', url: 'https://eggyolk.chaldal.com/api/Picture/Raw?pictureId=132554' },
  { key: 'radhuni_turmeric_200g', url: 'https://eggyolk.chaldal.com/api/Picture/Raw?pictureId=132553' },
  { key: 'radhuni_turmeric_500g', url: 'https://eggyolk.chaldal.com/api/Picture/Raw?pictureId=132552' },
  { key: 'radhuni_chili_50g', url: 'https://eggyolk.chaldal.com/api/Picture/Raw?pictureId=132508' },
  { key: 'radhuni_chili_100g', url: 'https://eggyolk.chaldal.com/api/Picture/Raw?pictureId=132509' },
  { key: 'radhuni_chili_200g', url: 'https://eggyolk.chaldal.com/api/Picture/Raw?pictureId=132510' },
  { key: 'radhuni_chili_500g', url: 'https://eggyolk.chaldal.com/api/Picture/Raw?pictureId=132511' },
  { key: 'radhuni_coriander_50g', url: 'https://eggyolk.chaldal.com/api/Picture/Raw?pictureId=132517' },
  { key: 'radhuni_coriander_100g', url: 'https://eggyolk.chaldal.com/api/Picture/Raw?pictureId=132516' },
  { key: 'radhuni_coriander_200g', url: 'https://eggyolk.chaldal.com/api/Picture/Raw?pictureId=132897' },
  { key: 'radhuni_coriander_500g', url: 'https://eggyolk.chaldal.com/api/Picture/Raw?pictureId=132514' },
  { key: 'radhuni_cumin_50g', url: 'https://eggyolk.chaldal.com/api/Picture/Raw?pictureId=132522' },
  { key: 'radhuni_cumin_100g', url: 'https://eggyolk.chaldal.com/api/Picture/Raw?pictureId=132521' },
  { key: 'radhuni_cumin_200g', url: 'https://eggyolk.chaldal.com/api/Picture/Raw?pictureId=132896' },
  { key: 'radhuni_cumin_500g', url: 'https://eggyolk.chaldal.com/api/Picture/Raw?pictureId=132519' },
  { key: 'radhuni_garam_masala_15g', url: 'https://eggyolk.chaldal.com/api/Picture/Raw?pictureId=132528' },
  { key: 'radhuni_garam_masala_40g', url: 'https://eggyolk.chaldal.com/api/Picture/Raw?pictureId=132527' },
  { key: 'radhuni_panch_phoron_50g', url: 'https://eggyolk.chaldal.com/api/Picture/Raw?pictureId=132545' },
  { key: 'radhuni_chili_flakes_50g', url: 'https://eggyolk.chaldal.com/api/Picture/Raw?pictureId=132513' },
  { key: 'radhuni_turmeric_jar_200g', url: 'https://eggyolk.chaldal.com/api/Picture/Raw?pictureId=132556' },
  { key: 'radhuni_chili_jar_200g', url: 'https://eggyolk.chaldal.com/api/Picture/Raw?pictureId=132512' },

  // Pran
  { key: 'pran_meat_masala_100g', url: 'https://eggyolk.chaldal.com/api/Picture/Raw?pictureId=123001' },
  { key: 'pran_turmeric_jar_200g', url: 'https://eggyolk.chaldal.com/api/Picture/Raw?pictureId=132337' },
  { key: 'pran_chili_jar_200g', url: 'https://eggyolk.chaldal.com/api/Picture/Raw?pictureId=111321' },
  { key: 'pran_cumin_jar_200g', url: 'https://eggyolk.chaldal.com/api/Picture/Raw?pictureId=113291' },

  // Shan & Ahmed
  { key: 'shan_biryani_masala_50g', url: 'https://eggyolk.chaldal.com/api/Picture/Raw?pictureId=168600' },
  { key: 'ahmed_biryani_masala_40g', url: 'https://eggyolk.chaldal.com/api/Picture/Raw?pictureId=87868' },
  { key: 'ahmed_roast_masala_35g', url: 'https://eggyolk.chaldal.com/api/Picture/Raw?pictureId=108171' },

  // Golden Grain
  { key: 'golden_grain_cumin_100g', url: 'https://eggyolk.chaldal.com/api/Picture/Raw?pictureId=187910' },
  { key: 'golden_grain_poppy_50g', url: 'https://eggyolk.chaldal.com/api/Picture/Raw?pictureId=187931' },
  { key: 'golden_grain_dry_chili_100g', url: 'https://eggyolk.chaldal.com/api/Picture/Raw?pictureId=187911' },
  { key: 'golden_grain_black_pepper_100g', url: 'https://eggyolk.chaldal.com/api/Picture/Raw?pictureId=187921' },
  { key: 'golden_grain_kalojira_100g', url: 'https://eggyolk.chaldal.com/api/Picture/Raw?pictureId=187928' },
  { key: 'golden_grain_coriander_100g', url: 'https://eggyolk.chaldal.com/api/Picture/Raw?pictureId=187914' },
  { key: 'golden_grain_cardamom_50g', url: 'https://eggyolk.chaldal.com/api/Picture/Raw?pictureId=187930' },
  { key: 'golden_grain_bay_leaf_100g', url: 'https://eggyolk.chaldal.com/api/Picture/Raw?pictureId=187913' },
  { key: 'golden_grain_red_mustard_100g', url: 'https://eggyolk.chaldal.com/api/Picture/Raw?pictureId=187925' },
  { key: 'golden_grain_cloves_50g', url: 'https://eggyolk.chaldal.com/api/Picture/Raw?pictureId=187898' },

  // Fresh & ACI Pure
  { key: 'fresh_cumin_100g', url: 'https://eggyolk.chaldal.com/api/Picture/Raw?pictureId=132521' },
  { key: 'fresh_turmeric_200g', url: 'https://eggyolk.chaldal.com/api/Picture/Raw?pictureId=132553' },
  { key: 'fresh_chili_200g', url: 'https://eggyolk.chaldal.com/api/Picture/Raw?pictureId=132510' },
  { key: 'aci_pure_cumin_100g', url: 'https://eggyolk.chaldal.com/api/Picture/Raw?pictureId=132521' },

  // Specialty
  { key: 'bangla_cut_meat_masala_75g', url: 'https://eggyolk.chaldal.com/api/Picture/Raw?pictureId=125896' },
  { key: 'farmers_gold_kebab_masala_100g', url: 'https://eggyolk.chaldal.com/api/Picture/Raw?pictureId=128395' },
  { key: 'farmers_gold_kalojira_powder_100g', url: 'https://eggyolk.chaldal.com/api/Picture/Raw?pictureId=131655' },
  { key: 'paprika_bottle_15g', url: 'https://eggyolk.chaldal.com/api/Picture/Raw?pictureId=177913' },
  { key: 'globe_thyme_bottle_10g', url: 'https://eggyolk.chaldal.com/api/Picture/Raw?pictureId=48425' },
  { key: 'ramisa_tokma_100g', url: 'https://eggyolk.chaldal.com/api/Picture/Raw?pictureId=185387' },
  { key: 'rongdhonu_arjun_powder_100g', url: 'https://eggyolk.chaldal.com/api/Picture/Raw?pictureId=149207' },
  { key: 'my_organic_bd_black_pepper_100g', url: 'https://eggyolk.chaldal.com/api/Picture/Raw?pictureId=187921' },
  { key: 'imperial_eats_red_chili_jar_200g', url: 'https://eggyolk.chaldal.com/api/Picture/Raw?pictureId=111321' },
  { key: 'imperial_eats_healthy_gut_mix_250g', url: 'https://eggyolk.chaldal.com/api/Picture/Raw?pictureId=78545' },
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

async function uploadToR2(webpBuffer, key) {
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
  console.log(`Processing and uploading ${SPICE_IMAGE_TARGETS.length} spice image assets to R2...`);
  const mapping = {};

  for (let i = 0; i < SPICE_IMAGE_TARGETS.length; i++) {
    const item = SPICE_IMAGE_TARGETS[i];
    console.log(`[${i + 1}/${SPICE_IMAGE_TARGETS.length}] Processing ${item.key}...`);
    try {
      let rawBuf;
      if (item.local) {
        rawBuf = fs.readFileSync(item.local);
      } else {
        rawBuf = await fetchBuffer(item.url);
      }

      const webpBuf = await processImage(rawBuf);
      const r2Url = await uploadToR2(webpBuf, item.key);
      mapping[item.key] = r2Url;
      console.log(`   ✓ Uploaded: ${r2Url}`);
    } catch (e) {
      console.error(`   ✗ Failed for ${item.key}:`, e.message);
    }
  }

  const outPath = path.join(__dirname, 'spices_uploaded_images.json');
  fs.writeFileSync(outPath, JSON.stringify(mapping, null, 2), 'utf8');
  console.log(`\nAll done! Successfully uploaded ${Object.keys(mapping).length} images to ${outPath}`);
}

main().catch(console.error);

