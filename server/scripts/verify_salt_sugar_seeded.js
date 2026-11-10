const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const { Pool } = require('pg');

let url = process.env.DATABASE_URL.replace(/&channel_binding=[^&]*/, '').replace(/\?channel_binding=[^&]*&?/, '?');
const pool = new Pool({ connectionString: url });

async function verify() {
  console.log('--- Verifying Salt & Sugar Subcategory & Products ---');

  // 1. Check Subcategory
  const catRes = await pool.query(`
    SELECT id, name, "nameBn", slug, "parentCategoryId", "displayOrder"
    FROM "Category"
    WHERE slug = 'cooking-salt-and-sugar'
  `);
  console.log('Category Info:', catRes.rows[0]);

  // 2. Count Products
  const countRes = await pool.query(`
    SELECT count(*) as total,
           count(CASE WHEN "trackStock" = false THEN 1 END) as untracked_stock,
           count(CASE WHEN stock = 0 THEN 1 END) as zero_stock,
           count(CASE WHEN "buyingPrice" > 0 THEN 1 END) as valid_buying_price
    FROM "Product"
    WHERE "categoryId" = '8e97b5a6-c456-481e-82d8-6c45f31d96cb'
  `);
  console.log('Products Stats:', countRes.rows[0]);

  // 3. Check Image Links
  const imgRes = await pool.query(`
    SELECT count(pi.id) as total_images
    FROM "ProductImage" pi
    JOIN "Product" p ON p.id = pi."productId"
    WHERE p."categoryId" = '8e97b5a6-c456-481e-82d8-6c45f31d96cb'
  `);
  console.log('Total Linked Product Images:', imgRes.rows[0]);

  // 4. All Products with Prices and Image URLs
  const allRes = await pool.query(`
    SELECT p."productCode", p.name, p."nameBn", p.slug, p."packSize", p."regularPrice", p."sellingPrice", p."discountPrice",
           p."trackStock", p.stock, u.code as unit, pi.url as image_url
    FROM "Product" p
    JOIN "Unit" u ON u.id = p."unitId"
    LEFT JOIN "ProductImage" pi ON pi."productId" = p.id AND pi."isMain" = true
    WHERE p."categoryId" = '8e97b5a6-c456-481e-82d8-6c45f31d96cb'
    ORDER BY p."productCode" ASC
  `);
  console.log('\nAll Salt & Sugar Products:');
  allRes.rows.forEach(r => console.log(r));

  // 5. In-Stock Filter Check
  const inStockCheck = await pool.query(`
    SELECT count(*) as in_stock_count
    FROM "Product"
    WHERE "categoryId" = '8e97b5a6-c456-481e-82d8-6c45f31d96cb'
      AND ("trackStock" = false OR stock > 0)
  `);
  console.log('\nIn-Stock Filter Count (Should be 8):', inStockCheck.rows[0].in_stock_count);

  await pool.end();
}

verify().catch(console.error);

