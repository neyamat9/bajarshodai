-- AlterTable
ALTER TABLE "Order" ADD COLUMN "deliveryFeePending" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "isAbroadOrder" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "senderCountry" TEXT,
ADD COLUMN "senderContactMethod" TEXT,
ADD COLUMN "senderContactNumber" TEXT,
ADD COLUMN "locationToken" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Order_locationToken_key" ON "Order"("locationToken");

