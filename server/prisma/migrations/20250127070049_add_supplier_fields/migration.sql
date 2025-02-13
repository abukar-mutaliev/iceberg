/*
  Warnings:

  - A unique constraint covering the columns `[inn]` on the table `Supplier` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[ogrn]` on the table `Supplier` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE "Product" DROP CONSTRAINT "Product_supplierId_fkey";

-- AlterTable
ALTER TABLE "Product" ALTER COLUMN "supplierId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Supplier" ADD COLUMN     "bankAccount" TEXT,
ADD COLUMN     "bik" TEXT,
ADD COLUMN     "inn" TEXT,
ADD COLUMN     "ogrn" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Supplier_inn_key" ON "Supplier"("inn");

-- CreateIndex
CREATE UNIQUE INDEX "Supplier_ogrn_key" ON "Supplier"("ogrn");

-- CreateIndex
CREATE INDEX "Supplier_inn_idx" ON "Supplier"("inn");

-- CreateIndex
CREATE INDEX "Supplier_ogrn_idx" ON "Supplier"("ogrn");

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier"("id") ON DELETE SET NULL ON UPDATE CASCADE;
