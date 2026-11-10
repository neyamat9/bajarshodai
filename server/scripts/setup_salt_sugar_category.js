const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const { Pool } = require('pg');

let url = process.env.DATABASE_URL.replace(/&channel_binding=[^&]*/, '').replace(/\?channel_binding=[^&]*&?/, '?');
const pool = new Pool({ connectionString: url });

const PARENT_COOKING_ID = 'f54d730c-5ae4-49a4-a587-f07bbc24aa17';

async function main() {
  console.log('--- Setting up Salt & Sugar Subcategory under Cooking ---');

  // Check if cooking-salt-and-sugar already exists or if we reparent the existing one
  const existing = await pool.query(`
    SELECT id, slug, "parentCategoryId" 
    FROM "Category" 
    WHERE slug = 'cooking-salt-and-sugar' 
       OR slug = 'spices-and-cooking-essentials-salt-and-sugar'
  `);

  let targetId;
  if (existing.rows.length > 0) {
    targetId = existing.rows[0].id;
    console.log(`Updating existing category ID: ${targetId}`);
    await pool.query(`
      UPDATE "Category"
      SET name = 'Salt & Sugar',
          "nameBn" = 'লবণ ও চিনি',
          slug = 'cooking-salt-and-sugar',
          "parentCategoryId" = $1,
          "displayOrder" = 3,
          status = 'ACTIVE',
          "updatedAt" = NOW()
      WHERE id = $2
    `, [PARENT_COOKING_ID, targetId]);
  } else {
    console.log('Creating new Salt & Sugar subcategory under Cooking');
    const inserted = await pool.query(`
      INSERT INTO "Category" (id, name, "nameBn", slug, "parentCategoryId", "displayOrder", status, "createdAt", "updatedAt")
      VALUES (gen_random_uuid(), 'Salt & Sugar', 'লবণ ও চিনি', 'cooking-salt-and-sugar', $1, 3, 'ACTIVE', NOW(), NOW())
      RETURNING id
    `, [PARENT_COOKING_ID]);
    targetId = inserted.rows[0].id;
  }

  // Adjust display orders under Cooking:
  // 1: Rice
  // 2: Spices
  // 3: Salt & Sugar
  // 4: Pulses & Dal
  // 5: Cooking Oil
  // 6: Flour & Semolina
  await pool.query(`UPDATE "Category" SET "displayOrder" = 1 WHERE slug = 'cooking-rice'`);
  await pool.query(`UPDATE "Category" SET "displayOrder" = 2 WHERE slug = 'cooking-spices'`);
  await pool.query(`UPDATE "Category" SET "displayOrder" = 3 WHERE slug = 'cooking-salt-and-sugar'`);
  await pool.query(`UPDATE "Category" SET "displayOrder" = 4 WHERE slug = 'cooking-pulses'`);
  await pool.query(`UPDATE "Category" SET "displayOrder" = 5 WHERE slug = 'cooking-oil'`);
  await pool.query(`UPDATE "Category" SET "displayOrder" = 6 WHERE slug = 'cooking-flour-and-semolina'`);

  const list = await pool.query(`
    SELECT id, name, "nameBn", slug, "displayOrder"
    FROM "Category"
    WHERE "parentCategoryId" = $1
    ORDER BY "displayOrder" ASC
  `, [PARENT_COOKING_ID]);

  console.log('\nUpdated Cooking Subcategories:');
  console.log(list.rows);

  await pool.end();
}

main().catch(console.error);
