-- CreateEnum
CREATE TYPE "InvoiceStatus" AS ENUM ('DRAFT', 'SENT', 'VIEWED', 'PAID', 'OVERDUE');

-- CreateEnum
CREATE TYPE "EstimateStatus" AS ENUM ('DRAFT', 'SENT', 'ACCEPTED', 'REJECTED', 'EXPIRED');

-- CreateTable
CREATE TABLE "workspaces" (
    "id" SERIAL NOT NULL,
    "clerkId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "companyName" TEXT,
    "companyAddress" TEXT,
    "companyPhone" TEXT,
    "companyEmail" TEXT,
    "companyTaxId" TEXT,
    "companyLogo" TEXT,
    "invoiceNumberPrefix" TEXT DEFAULT 'INV-',
    "defaultCurrency" TEXT DEFAULT 'USD',
    "defaultPaymentTerms" TEXT,
    "defaultTaxRate" DECIMAL(65,30),
    "invoiceFooterText" TEXT,
    "invoiceColor" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "workspaces_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "clients" (
    "id" SERIAL NOT NULL,
    "workspaceId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "nit" TEXT NOT NULL,
    "businessName" TEXT NOT NULL,
    "sequence" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "clients_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "invoices" (
    "id" SERIAL NOT NULL,
    "workspaceId" INTEGER NOT NULL,
    "clientId" INTEGER NOT NULL,
    "invoiceNumber" TEXT NOT NULL,
    "status" "InvoiceStatus" NOT NULL DEFAULT 'DRAFT',
    "issueDate" TIMESTAMP(3) NOT NULL,
    "dueDate" TIMESTAMP(3) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "subtotal" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "totalTax" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "discount" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "discountType" TEXT,
    "total" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "notes" TEXT,
    "terms" TEXT,
    "paymentLink" TEXT,
    "paymentProvider" TEXT,
    "sentAt" TIMESTAMP(3),
    "viewedAt" TIMESTAMP(3),
    "paidAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "invoices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "invoice_items" (
    "id" SERIAL NOT NULL,
    "invoiceId" INTEGER NOT NULL,
    "description" TEXT NOT NULL,
    "quantity" DECIMAL(65,30) NOT NULL DEFAULT 1,
    "unitPrice" DECIMAL(65,30) NOT NULL,
    "tax" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "total" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "invoice_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payments" (
    "id" SERIAL NOT NULL,
    "workspaceId" INTEGER NOT NULL,
    "invoiceId" INTEGER NOT NULL,
    "amount" DECIMAL(65,30) NOT NULL,
    "provider" TEXT NOT NULL,
    "transactionId" TEXT NOT NULL,
    "paidAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "estimates" (
    "id" SERIAL NOT NULL,
    "workspaceId" INTEGER NOT NULL,
    "clientId" INTEGER NOT NULL,
    "estimateNumber" TEXT NOT NULL,
    "status" "EstimateStatus" NOT NULL DEFAULT 'DRAFT',
    "issueDate" TIMESTAMP(3) NOT NULL,
    "expirationDate" TIMESTAMP(3),
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "subtotal" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "totalTax" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "discount" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "discountType" TEXT,
    "total" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "notes" TEXT,
    "terms" TEXT,
    "sentAt" TIMESTAMP(3),
    "acceptedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "estimates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "estimate_items" (
    "id" SERIAL NOT NULL,
    "estimateId" INTEGER NOT NULL,
    "description" TEXT NOT NULL,
    "quantity" DECIMAL(65,30) NOT NULL DEFAULT 1,
    "unitPrice" DECIMAL(65,30) NOT NULL,
    "tax" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "total" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "estimate_items_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "workspaces_clerkId_key" ON "workspaces"("clerkId");

-- CreateIndex
CREATE INDEX "workspaces_clerkId_idx" ON "workspaces"("clerkId");

-- CreateIndex
CREATE INDEX "clients_workspaceId_idx" ON "clients"("workspaceId");

-- CreateIndex
CREATE UNIQUE INDEX "clients_workspaceId_sequence_key" ON "clients"("workspaceId", "sequence");

-- CreateIndex
CREATE INDEX "invoices_workspaceId_idx" ON "invoices"("workspaceId");

-- CreateIndex
CREATE INDEX "invoices_clientId_idx" ON "invoices"("clientId");

-- CreateIndex
CREATE INDEX "invoices_status_idx" ON "invoices"("status");

-- CreateIndex
CREATE INDEX "invoices_createdAt_idx" ON "invoices"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "invoices_workspaceId_invoiceNumber_key" ON "invoices"("workspaceId", "invoiceNumber");

-- CreateIndex
CREATE INDEX "invoice_items_invoiceId_idx" ON "invoice_items"("invoiceId");

-- CreateIndex
CREATE UNIQUE INDEX "payments_transactionId_key" ON "payments"("transactionId");

-- CreateIndex
CREATE INDEX "payments_workspaceId_idx" ON "payments"("workspaceId");

-- CreateIndex
CREATE INDEX "payments_invoiceId_idx" ON "payments"("invoiceId");

-- CreateIndex
CREATE INDEX "payments_transactionId_idx" ON "payments"("transactionId");

-- CreateIndex
CREATE INDEX "estimates_workspaceId_idx" ON "estimates"("workspaceId");

-- CreateIndex
CREATE INDEX "estimates_clientId_idx" ON "estimates"("clientId");

-- CreateIndex
CREATE INDEX "estimates_status_idx" ON "estimates"("status");

-- CreateIndex
CREATE INDEX "estimates_createdAt_idx" ON "estimates"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "estimates_workspaceId_estimateNumber_key" ON "estimates"("workspaceId", "estimateNumber");

-- CreateIndex
CREATE INDEX "estimate_items_estimateId_idx" ON "estimate_items"("estimateId");

-- AddForeignKey
ALTER TABLE "clients" ADD CONSTRAINT "clients_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoice_items" ADD CONSTRAINT "invoice_items_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "invoices"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "invoices"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "estimates" ADD CONSTRAINT "estimates_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "estimates" ADD CONSTRAINT "estimates_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "estimate_items" ADD CONSTRAINT "estimate_items_estimateId_fkey" FOREIGN KEY ("estimateId") REFERENCES "estimates"("id") ON DELETE CASCADE ON UPDATE CASCADE;
