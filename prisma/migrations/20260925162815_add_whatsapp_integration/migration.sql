-- CreateTable
CREATE TABLE "WhatsAppIntegration" (
    "id" TEXT NOT NULL,
    "clinicId" TEXT NOT NULL,
    "provider" TEXT NOT NULL DEFAULT 'META',
    "phoneNumberId" TEXT NOT NULL,
    "businessAccountId" TEXT,
    "displayPhoneNumber" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WhatsAppIntegration_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "WhatsAppIntegration_clinicId_key" ON "WhatsAppIntegration"("clinicId");

-- CreateIndex
CREATE UNIQUE INDEX "WhatsAppIntegration_phoneNumberId_key" ON "WhatsAppIntegration"("phoneNumberId");

-- CreateIndex
CREATE INDEX "WhatsAppIntegration_phoneNumberId_idx" ON "WhatsAppIntegration"("phoneNumberId");

-- CreateIndex
CREATE INDEX "WhatsAppIntegration_businessAccountId_idx" ON "WhatsAppIntegration"("businessAccountId");

-- AddForeignKey
ALTER TABLE "WhatsAppIntegration" ADD CONSTRAINT "WhatsAppIntegration_clinicId_fkey" FOREIGN KEY ("clinicId") REFERENCES "Clinic"("id") ON DELETE CASCADE ON UPDATE CASCADE;
