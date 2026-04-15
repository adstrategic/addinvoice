-- DropIndex
DROP INDEX "workspaces_defaultPaymentMethodId_key";

-- CreateIndex
CREATE INDEX "workspaces_defaultPaymentMethodId_idx" ON "workspaces"("defaultPaymentMethodId");
