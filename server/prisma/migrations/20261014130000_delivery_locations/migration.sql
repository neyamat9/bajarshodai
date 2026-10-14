
-- CreateEnum
CREATE TYPE "LocationSource" AS ENUM ('GPS', 'PIN', 'SEARCH', 'LINK');

-- CreateEnum
CREATE TYPE "LocationRequestStatus" AS ENUM ('PENDING', 'SHARED', 'EXPIRED');

-- AlterTable
ALTER TABLE "Address" ADD COLUMN     "accuracyM" DOUBLE PRECISION,
ADD COLUMN     "landmark" TEXT,
ADD COLUMN     "locationCapturedAt" TIMESTAMP(3),
ADD COLUMN     "locationSource" "LocationSource",
ADD COLUMN     "placeName" TEXT,
ADD COLUMN     "placeNameBn" TEXT;

-- AlterTable
ALTER TABLE "Order" DROP COLUMN "shippingZone",
ADD COLUMN     "deliveryDate" DATE,
ADD COLUMN     "deliveryDistanceKm" DECIMAL(6,2),
ADD COLUMN     "deliveryDurationSec" INTEGER,
ADD COLUMN     "deliveryFee" DECIMAL(10,2),
ADD COLUMN     "deliveryFeeOverride" DECIMAL(10,2),
ADD COLUMN     "deliveryFeeOverrideReason" TEXT,
ADD COLUMN     "deliveryLandmark" TEXT,
ADD COLUMN     "deliveryLat" DOUBLE PRECISION,
ADD COLUMN     "deliveryLng" DOUBLE PRECISION,
ADD COLUMN     "deliveryPlaceName" TEXT,
ADD COLUMN     "deliverySlot" TEXT,
ADD COLUMN     "distanceEstimated" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "CustomerLocation" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "deviceToken" TEXT,
    "phone" TEXT,
    "lat" DOUBLE PRECISION NOT NULL,
    "lng" DOUBLE PRECISION NOT NULL,
    "accuracyM" DOUBLE PRECISION,
    "placeName" TEXT,
    "placeNameBn" TEXT,
    "source" "LocationSource" NOT NULL DEFAULT 'GPS',
    "consentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "capturedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CustomerLocation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LocationRequest" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "phone" TEXT,
    "name" TEXT,
    "orderId" TEXT,
    "status" "LocationRequestStatus" NOT NULL DEFAULT 'PENDING',
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "lat" DOUBLE PRECISION,
    "lng" DOUBLE PRECISION,
    "accuracyM" DOUBLE PRECISION,
    "placeName" TEXT,
    "placeNameBn" TEXT,
    "distanceKm" DECIMAL(6,2),
    "deliveryFee" DECIMAL(10,2),
    "sharedAt" TIMESTAMP(3),
    "createdByStaffId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LocationRequest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CustomerLocation_userId_capturedAt_idx" ON "CustomerLocation"("userId", "capturedAt");

-- CreateIndex
CREATE INDEX "CustomerLocation_deviceToken_capturedAt_idx" ON "CustomerLocation"("deviceToken", "capturedAt");

-- CreateIndex
CREATE INDEX "CustomerLocation_phone_idx" ON "CustomerLocation"("phone");

-- CreateIndex
CREATE UNIQUE INDEX "LocationRequest_token_key" ON "LocationRequest"("token");

-- CreateIndex
CREATE INDEX "LocationRequest_status_idx" ON "LocationRequest"("status");

-- CreateIndex
CREATE INDEX "LocationRequest_phone_idx" ON "LocationRequest"("phone");

-- CreateIndex
CREATE INDEX "LocationRequest_orderId_idx" ON "LocationRequest"("orderId");

-- AddForeignKey
ALTER TABLE "CustomerLocation" ADD CONSTRAINT "CustomerLocation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LocationRequest" ADD CONSTRAINT "LocationRequest_createdByStaffId_fkey" FOREIGN KEY ("createdByStaffId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

