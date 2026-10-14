-- Categories become one tree of any depth (sub-categories move into "Category"),
-- quantities and stock become decimals (0.5 kg), order items remember the unit text.

-- DropForeignKey
ALTER TABLE "Product" DROP CONSTRAINT "Product_subCategoryId_fkey";

-- DropIndex
DROP INDEX "Category_name_key";

-- Sub-categories become child categories (same ids, so products can point at them)
INSERT INTO "Category" ("id", "name", "nameBn", "descriptionBn", "slug", "image", "icon", "description", "isHomepage", "status", "displayOrder", "parentCategoryId", "createdAt", "updatedAt")
SELECT s."id", s."name", s."nameBn", s."descriptionBn",
       CASE WHEN EXISTS (SELECT 1 FROM "Category" c WHERE c."slug" = s."slug") THEN s."slug" || '-' || substr(s."id", 1, 6) ELSE s."slug" END,
       s."image", s."icon", s."description", s."isHomepage", s."status"::text::"CategoryStatus", s."displayOrder", s."parentCategoryId", s."createdAt", s."updatedAt"
FROM "SubCategory" s;

-- Products now sit in the deepest category they belong to
UPDATE "Product" SET "categoryId" = "subCategoryId" WHERE "subCategoryId" IS NOT NULL;
UPDATE "Product" p SET "categoryName" = c."name" FROM "Category" c WHERE c."id" = p."categoryId";

-- DropIndex
DROP INDEX "Product_subCategoryId_idx";

-- AlterTable
ALTER TABLE "Product" DROP COLUMN "subCategoryId",
DROP COLUMN "subCategoryName",
ALTER COLUMN "stock" SET DEFAULT 0,
ALTER COLUMN "stock" SET DATA TYPE DECIMAL(10,3);

-- AlterTable
ALTER TABLE "ProductVariant" ALTER COLUMN "stock" SET DEFAULT 0,
ALTER COLUMN "stock" SET DATA TYPE DECIMAL(10,3);

-- AlterTable
ALTER TABLE "StockLog" ALTER COLUMN "change" SET DATA TYPE DECIMAL(10,3),
ALTER COLUMN "quantityBefore" SET DATA TYPE DECIMAL(10,3),
ALTER COLUMN "quantityAfter" SET DATA TYPE DECIMAL(10,3);

-- AlterTable
ALTER TABLE "CartItem" ALTER COLUMN "quantity" SET DEFAULT 1,
ALTER COLUMN "quantity" SET DATA TYPE DECIMAL(10,3);

-- AlterTable
ALTER TABLE "OrderItem" ADD COLUMN     "finalQty" DECIMAL(10,3),
ADD COLUMN     "finalTotal" DECIMAL(12,2),
ADD COLUMN     "orderedQty" DECIMAL(10,3),
ADD COLUMN     "unitLabel" TEXT,
ADD COLUMN     "unitLabelBn" TEXT,
ALTER COLUMN "quantity" SET DATA TYPE DECIMAL(10,3);

-- Old order lines keep the unit their product has now
UPDATE "OrderItem" oi SET "unitLabel" = u."shortLabel", "unitLabelBn" = u."shortLabelBn"
FROM "Product" p JOIN "Unit" u ON u."id" = p."unitId" WHERE p."id" = oi."productId";

-- AlterTable
ALTER TABLE "ReturnItem" ALTER COLUMN "quantity" SET DATA TYPE DECIMAL(10,3);

-- DropForeignKey
ALTER TABLE "SubCategory" DROP CONSTRAINT "SubCategory_parentCategoryId_fkey";

-- DropTable
DROP TABLE "SubCategory";

-- DropEnum
DROP TYPE "SubCategoryStatus";

-- CreateIndex
CREATE UNIQUE INDEX "Category_name_parentCategoryId_key" ON "Category"("name", "parentCategoryId");
