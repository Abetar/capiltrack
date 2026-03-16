/*
  Warnings:

  - Added the required column `clinicId` to the `Consultation` table without a default value. This is not possible if the table is not empty.
  - Added the required column `clinicId` to the `HairMetric` table without a default value. This is not possible if the table is not empty.
  - Added the required column `clinicId` to the `Photo` table without a default value. This is not possible if the table is not empty.
  - Added the required column `clinicId` to the `TransplantProcedure` table without a default value. This is not possible if the table is not empty.
  - Added the required column `clinicId` to the `Treatment` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Consultation" ADD COLUMN     "clinicId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "HairMetric" ADD COLUMN     "clinicId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Photo" ADD COLUMN     "clinicId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "TransplantProcedure" ADD COLUMN     "clinicId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Treatment" ADD COLUMN     "clinicId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "role" TEXT NOT NULL DEFAULT 'OWNER';

-- CreateIndex
CREATE INDEX "Consultation_clinicId_idx" ON "Consultation"("clinicId");

-- CreateIndex
CREATE INDEX "HairMetric_clinicId_idx" ON "HairMetric"("clinicId");

-- CreateIndex
CREATE INDEX "Patient_clinicId_idx" ON "Patient"("clinicId");

-- CreateIndex
CREATE INDEX "Photo_clinicId_idx" ON "Photo"("clinicId");

-- CreateIndex
CREATE INDEX "TransplantProcedure_clinicId_idx" ON "TransplantProcedure"("clinicId");

-- CreateIndex
CREATE INDEX "Treatment_clinicId_idx" ON "Treatment"("clinicId");

-- CreateIndex
CREATE INDEX "User_clinicId_idx" ON "User"("clinicId");
