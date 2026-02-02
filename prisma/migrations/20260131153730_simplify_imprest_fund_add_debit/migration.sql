/*
  Warnings:

  - You are about to drop the column `jenisPajak` on the `ImprestFund` table. All the data in the column will be lost.
  - You are about to drop the column `jenisPengadaan` on the `ImprestFund` table. All the data in the column will be lost.
  - You are about to drop the column `nilaiKwitansi` on the `ImprestFund` table. All the data in the column will be lost.
  - You are about to drop the column `nilaiPPN` on the `ImprestFund` table. All the data in the column will be lost.
  - You are about to drop the column `nilaiTanpaPPN` on the `ImprestFund` table. All the data in the column will be lost.
  - You are about to drop the column `nilaiTransfer` on the `ImprestFund` table. All the data in the column will be lost.
  - You are about to drop the column `noHpFinance` on the `ImprestFund` table. All the data in the column will be lost.
  - You are about to drop the column `noTiketMydx` on the `ImprestFund` table. All the data in the column will be lost.
  - You are about to drop the column `picFinance` on the `ImprestFund` table. All the data in the column will be lost.
  - You are about to drop the column `tanggalKwitansi` on the `ImprestFund` table. All the data in the column will be lost.
  - You are about to drop the column `tglSerahFinance` on the `ImprestFund` table. All the data in the column will be lost.
  - You are about to drop the column `tglTransferVendor` on the `ImprestFund` table. All the data in the column will be lost.
  - You are about to drop the column `vendorId` on the `ImprestFund` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "ImprestFund" DROP CONSTRAINT "ImprestFund_vendorId_fkey";

-- AlterTable
ALTER TABLE "ImprestFund" DROP COLUMN "jenisPajak",
DROP COLUMN "jenisPengadaan",
DROP COLUMN "nilaiKwitansi",
DROP COLUMN "nilaiPPN",
DROP COLUMN "nilaiTanpaPPN",
DROP COLUMN "nilaiTransfer",
DROP COLUMN "noHpFinance",
DROP COLUMN "noTiketMydx",
DROP COLUMN "picFinance",
DROP COLUMN "tanggalKwitansi",
DROP COLUMN "tglSerahFinance",
DROP COLUMN "tglTransferVendor",
DROP COLUMN "vendorId",
ADD COLUMN     "debit" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "imprestFundCardId" TEXT;

-- AddForeignKey
ALTER TABLE "ImprestFund" ADD CONSTRAINT "ImprestFund_imprestFundCardId_fkey" FOREIGN KEY ("imprestFundCardId") REFERENCES "ImprestFundCard"("id") ON DELETE SET NULL ON UPDATE CASCADE;
