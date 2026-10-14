-- AlterTable
ALTER TABLE "User" ALTER COLUMN "email" DROP NOT NULL,
ALTER COLUMN "phone" SET NOT NULL;

-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "language" TEXT NOT NULL DEFAULT 'bn';

