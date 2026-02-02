-- Add indexes for better query performance

-- ImprestFund indexes
CREATE INDEX IF NOT EXISTS "ImprestFund_status_idx" ON "ImprestFund"("status");
CREATE INDEX IF NOT EXISTS "ImprestFund_imprestFundCardId_idx" ON "ImprestFund"("imprestFundCardId");
CREATE INDEX IF NOT EXISTS "ImprestFund_createdAt_idx" ON "ImprestFund"("createdAt" DESC);

-- Transaction indexes
CREATE INDEX IF NOT EXISTS "Transaction_status_idx" ON "Transaction"("status");
CREATE INDEX IF NOT EXISTS "Transaction_imprestFundId_idx" ON "Transaction"("imprestFundId");
CREATE INDEX IF NOT EXISTS "Transaction_glAccountId_idx" ON "Transaction"("glAccountId");
CREATE INDEX IF NOT EXISTS "Transaction_regionalCode_idx" ON "Transaction"("regionalCode");

-- GlAccount indexes
CREATE INDEX IF NOT EXISTS "GlAccount_isActive_idx" ON "GlAccount"("isActive");
CREATE INDEX IF NOT EXISTS "GlAccount_code_idx" ON "GlAccount"("code");
