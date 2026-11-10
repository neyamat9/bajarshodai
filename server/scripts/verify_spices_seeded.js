const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const { Pool } = require('pg');

let url = process.env.DATABASE_URL.replace(/&channel_binding=[^&]*/, '').replace(/\?channel_binding=[^&]*&?/, '?');
const pool = new Pool({ connectionString: url });

async function verify() {
  console.log('--- Verifying Spices Subcategory & Products ---');

  // 1. Check Subcategory
  const catRes = await pool.query(`
    SELECT id, name, "nameBn", slug, "parentCategoryId", "displayOrder"
    FROM "Category"
    WHERE slug = 'cooking-spices'
  `);
  console.log('Category Info:', catRes.rows[0]);

  // 2. Count Spices Products
  const countRes = await pool.query(`
    SELECT count(*) as total,
           count(CASE WHEN "trackStock" = false THEN 1 END) as untracked_stock,
           count(CASE WHEN stock = 0 THEN 1 END) as zero_stock,
           count(CASE WHEN "buyingPrice" > 0 THEN 1 END) as valid_buying_price
    FROM "Product"
    WHERE "categoryId" = 'c6fc9554-388d-4a41-9de2-591a76bb8e84'
  `);
  console.log('Products Stats:', countRes.rows[0]);

  // 3. Check Image Links
  const imgRes = await pool.query(`
    SELECT count(pi.id) as total_images
    FROM "ProductImage" pi
    JOIN "Product" p ON p.id = pi."productId"
    WHERE p."categoryId" = 'c6fc9554-388d-4a41-9de2-591a76bb8e84'
  `);
  console.log('Total Linked Product Images:', imgRes.rows[0]);

  // 4. Sample Products with Prices and Image URLs
  const sampleRes = await pool.query(`
    SELECT p.name, p."nameBn", p.slug, p."packSize", p."regularPrice", p."sellingPrice", p."discountPrice",
           p."trackStock", p.stock, u.code as unit, pi.url as image_url
    FROM "Product" p
    JOIN "Unit" u ON u.id = p."unitId"
    LEFT JOIN "ProductImage" pi ON pi."productId" = p.id AND pi."isMain" = true
    WHERE p."categoryId" = 'c6fc9554-388d-4a41-9de2-591a76bb8e84'
    ORDER BY p."productCode" ASC
    LIMIT 5
  `);
  console.log('\nSample Products:');
  sampleRes.rows.forEach(r => console.log(r));

  // 5. In-Stock Filter Simulation
  // Product filter check: { OR: [{ trackStock: false }, { stock: { gt: 0 } }] }
  const inStockCheck = await pool.query(`
    SELECT count(*) as in_stock_count
    FROM "Product"
    WHERE "categoryId" = 'c6fc9554-388d-4a41-9de2-591a76bb8e84'
      AND ("trackStock" = false OR stock > 0)
  `);
  console.log('\nIn-Stock Filter Count (Should be 93):', inStockCheck.rows[0].in_stock_count);

  await pool.end();
}

verify().catch(console.error);
