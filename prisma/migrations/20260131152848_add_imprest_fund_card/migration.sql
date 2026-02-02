-- CreateTable
CREATE TABLE "ImprestFundCard" (
    "id" TEXT NOT NULL,
    "nomorKartu" TEXT NOT NULL,
    "user" TEXT NOT NULL,
    "saldo" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "pic" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ImprestFundCard_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ImprestFundCard_nomorKartu_key" ON "ImprestFundCard"("nomorKartu");
