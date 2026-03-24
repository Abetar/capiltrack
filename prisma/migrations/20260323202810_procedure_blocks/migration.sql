-- DropForeignKey
ALTER TABLE "HairMetric" DROP CONSTRAINT "HairMetric_consultationId_fkey";

-- DropForeignKey
ALTER TABLE "Photo" DROP CONSTRAINT "Photo_consultationId_fkey";

-- AlterTable
ALTER TABLE "TransplantProcedure" ADD COLUMN     "anesthesiaMl" DOUBLE PRECISION,
ADD COLUMN     "anesthesiaType" TEXT,
ADD COLUMN     "extractionEnd" TIMESTAMP(3),
ADD COLUMN     "extractionStart" TIMESTAMP(3),
ADD COLUMN     "implantationEnd" TIMESTAMP(3),
ADD COLUMN     "implantationStart" TIMESTAMP(3),
ADD COLUMN     "medicalTeam" TEXT,
ADD COLUMN     "nurses" TEXT,
ADD COLUMN     "observations" TEXT;

-- CreateTable
CREATE TABLE "ProcedureBlock" (
    "id" TEXT NOT NULL,
    "procedureId" TEXT NOT NULL,
    "blockNumber" INTEGER NOT NULL,
    "rowIndex" INTEGER NOT NULL,
    "enf1" TEXT,
    "enf2" TEXT,
    "uf" INTEGER,
    "follicles" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProcedureBlock_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ProcedureBlock_procedureId_idx" ON "ProcedureBlock"("procedureId");

-- AddForeignKey
ALTER TABLE "HairMetric" ADD CONSTRAINT "HairMetric_consultationId_fkey" FOREIGN KEY ("consultationId") REFERENCES "Consultation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Photo" ADD CONSTRAINT "Photo_consultationId_fkey" FOREIGN KEY ("consultationId") REFERENCES "Consultation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProcedureBlock" ADD CONSTRAINT "ProcedureBlock_procedureId_fkey" FOREIGN KEY ("procedureId") REFERENCES "TransplantProcedure"("id") ON DELETE CASCADE ON UPDATE CASCADE;
