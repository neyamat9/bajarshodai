const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const { Pool } = require('pg');

let url = process.env.DATABASE_URL.replace(/&channel_binding=[^&]*/, '').replace(/\?channel_binding=[^&]*&?/, '?');
const pool = new Pool({ connectionString: url });

const CATEGORY_ID = '0e411582-f204-433b-acf7-dcf62d74955c';

async function main() {
  console.log('--- Verifying Dal & Pulses Subcategory & Products ---');

  const cat = await pool.query(`
    SELECT id, name, "nameBn", slug, "parentCategoryId", "displayOrder"
    FROM "Category"
    WHERE id = $1
  `, [CATEGORY_ID]);
  console.log('Category Info:', cat.rows[0]);

  const stats = await pool.query(`
    SELECT 
      COUNT(*) as total,
      COUNT(*) FILTER (WHERE "trackStock" = false) as untracked_stock,
      COUNT(*) FILTER (WHERE stock = 0) as zero_stock,
      COUNT(*) FILTER (WHERE "buyingPrice" > 0) as valid_buying_price
    FROM "Product"
    WHERE "categoryId" = $1
  `, [CATEGORY_ID]);
  console.log('Products Stats:', stats.rows[0]);

  const images = await pool.query(`
    SELECT COUNT(DISTINCT pi."productId") as total_images
    FROM "ProductImage" pi
    JOIN "Product" p ON pi."productId" = p.id
    WHERE p."categoryId" = $1 AND pi."isMain" = true
  `, [CATEGORY_ID]);
  console.log('Total Linked Product Images:', images.rows[0]);

  const products = await pool.query(`
    SELECT 
      p."productCode",
      p.name,
      p."nameBn",
      p.slug,
      p."packSize",
      p."regularPrice",
      p."sellingPrice",
      p."discountPrice",
      p."trackStock",
      p.stock,
      u.name as unit,
      pi.url as image_url
    FROM "Product" p
    LEFT JOIN "Unit" u ON p."unitId" = u.id
    LEFT JOIN "ProductImage" pi ON p.id = pi."productId" AND pi."isMain" = true
    WHERE p."categoryId" = $1
    ORDER BY p."productCode" ASC
  `, [CATEGORY_ID]);

  console.log(`\nAll ${products.rows.length} Dal & Pulses Products:`);
  products.rows.forEach(p => console.log(p));

  // In-stock test
  const inStockCheck = await pool.query(`
    SELECT COUNT(*) as in_stock_count
    FROM "Product"
    WHERE "categoryId" = $1
      AND status = 'ACTIVE'
      AND ("trackStock" = false OR stock > 0)
  `, [CATEGORY_ID]);
  console.log('\nIn-Stock Filter Count (Should be 25):', inStockCheck.rows[0].in_stock_count);
}

main().catch(console.error).finally(() => pool.end());

