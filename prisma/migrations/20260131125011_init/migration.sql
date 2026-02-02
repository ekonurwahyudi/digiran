-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'user',
    "avatar" TEXT DEFAULT '/avatar.png',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GlAccount" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "keterangan" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GlAccount_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Regional" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Regional_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Vendor" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "alamat" TEXT,
    "pic" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Vendor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Budget" (
    "id" TEXT NOT NULL,
    "glAccountId" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "rkap" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "releasePercent" DOUBLE PRECISION NOT NULL DEFAULT 100,
    "totalAmount" DOUBLE PRECISION NOT NULL,
    "q1Amount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "q2Amount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "q3Amount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "q4Amount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Budget_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RegionalAllocation" (
    "id" TEXT NOT NULL,
    "budgetId" TEXT NOT NULL,
    "regionalCode" TEXT NOT NULL,
    "quarter" INTEGER NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "percentage" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RegionalAllocation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Transaction" (
    "id" TEXT NOT NULL,
    "glAccountId" TEXT NOT NULL,
    "quarter" INTEGER NOT NULL,
    "regionalCode" TEXT NOT NULL,
    "kegiatan" TEXT NOT NULL,
    "regionalPengguna" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "tanggalKwitansi" TIMESTAMP(3),
    "nilaiKwitansi" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "jenisPajak" TEXT,
    "nilaiTanpaPPN" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "nilaiPPN" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "keterangan" TEXT,
    "jenisPengadaan" TEXT,
    "vendorId" TEXT,
    "tanggalEntry" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "noTiketMydx" TEXT,
    "tglSerahFinance" TIMESTAMP(3),
    "picFinance" TEXT,
    "noHpFinance" TEXT,
    "tglTransferVendor" TIMESTAMP(3),
    "nilaiTransfer" DOUBLE PRECISION,
    "taskPengajuan" BOOLEAN NOT NULL DEFAULT true,
    "taskTransferVendor" BOOLEAN NOT NULL DEFAULT false,
    "taskTerimaBerkas" BOOLEAN NOT NULL DEFAULT false,
    "taskUploadMydx" BOOLEAN NOT NULL DEFAULT false,
    "taskSerahFinance" BOOLEAN NOT NULL DEFAULT false,
    "taskVendorDibayar" BOOLEAN NOT NULL DEFAULT false,
    "status" TEXT NOT NULL DEFAULT 'Open',
    "imprestFundId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Transaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PicAnggaran" (
    "id" TEXT NOT NULL,
    "unit" TEXT NOT NULL,
    "namaPemegangImprest" TEXT NOT NULL,
    "nikPemegangImprest" TEXT NOT NULL,
    "namaPenanggungJawab" TEXT NOT NULL,
    "nikPenanggungJawab" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PicAnggaran_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MonthlyAllocation" (
    "id" TEXT NOT NULL,
    "glAccountId" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "janAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "febAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "marAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "aprAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "mayAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "junAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "julAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "augAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "sepAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "octAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "novAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "decAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MonthlyAllocation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TransactionFile" (
    "id" TEXT NOT NULL,
    "transactionId" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "originalName" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "mimeType" TEXT NOT NULL,
    "filePath" TEXT NOT NULL,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TransactionFile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ImprestFund" (
    "id" TEXT NOT NULL,
    "kelompokKegiatan" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "totalAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "tanggalKwitansi" TIMESTAMP(3),
    "nilaiKwitansi" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "jenisPajak" TEXT,
    "nilaiTanpaPPN" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "nilaiPPN" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "keterangan" TEXT,
    "jenisPengadaan" TEXT DEFAULT 'Imprest Fund',
    "vendorId" TEXT,
    "noTiketMydx" TEXT,
    "tglSerahFinance" TIMESTAMP(3),
    "picFinance" TEXT,
    "noHpFinance" TEXT,
    "tglTransferVendor" TIMESTAMP(3),
    "nilaiTransfer" DOUBLE PRECISION,
    "taskPengajuan" BOOLEAN NOT NULL DEFAULT true,
    "taskTransferVendor" BOOLEAN NOT NULL DEFAULT false,
    "taskTerimaBerkas" BOOLEAN NOT NULL DEFAULT false,
    "taskUploadMydx" BOOLEAN NOT NULL DEFAULT false,
    "taskSerahFinance" BOOLEAN NOT NULL DEFAULT false,
    "taskVendorDibayar" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ImprestFund_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ImprestItem" (
    "id" TEXT NOT NULL,
    "imprestFundId" TEXT NOT NULL,
    "tanggal" TIMESTAMP(3) NOT NULL,
    "uraian" TEXT NOT NULL,
    "glAccountId" TEXT NOT NULL,
    "jumlah" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ImprestItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "GlAccount_code_key" ON "GlAccount"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Regional_code_key" ON "Regional"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Budget_glAccountId_year_key" ON "Budget"("glAccountId", "year");

-- CreateIndex
CREATE UNIQUE INDEX "RegionalAllocation_budgetId_regionalCode_quarter_key" ON "RegionalAllocation"("budgetId", "regionalCode", "quarter");

-- CreateIndex
CREATE UNIQUE INDEX "PicAnggaran_unit_year_key" ON "PicAnggaran"("unit", "year");

-- CreateIndex
CREATE UNIQUE INDEX "MonthlyAllocation_glAccountId_year_key" ON "MonthlyAllocation"("glAccountId", "year");

-- AddForeignKey
ALTER TABLE "Budget" ADD CONSTRAINT "Budget_glAccountId_fkey" FOREIGN KEY ("glAccountId") REFERENCES "GlAccount"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RegionalAllocation" ADD CONSTRAINT "RegionalAllocation_budgetId_fkey" FOREIGN KEY ("budgetId") REFERENCES "Budget"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_glAccountId_fkey" FOREIGN KEY ("glAccountId") REFERENCES "GlAccount"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "Vendor"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_imprestFundId_fkey" FOREIGN KEY ("imprestFundId") REFERENCES "ImprestFund"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MonthlyAllocation" ADD CONSTRAINT "MonthlyAllocation_glAccountId_fkey" FOREIGN KEY ("glAccountId") REFERENCES "GlAccount"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TransactionFile" ADD CONSTRAINT "TransactionFile_transactionId_fkey" FOREIGN KEY ("transactionId") REFERENCES "Transaction"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ImprestFund" ADD CONSTRAINT "ImprestFund_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "Vendor"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ImprestItem" ADD CONSTRAINT "ImprestItem_imprestFundId_fkey" FOREIGN KEY ("imprestFundId") REFERENCES "ImprestFund"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ImprestItem" ADD CONSTRAINT "ImprestItem_glAccountId_fkey" FOREIGN KEY ("glAccountId") REFERENCES "GlAccount"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
