-- AlterTable
ALTER TABLE "Photo" ADD COLUMN     "excludeFromTimeline" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "timelineLabel" TEXT,
ADD COLUMN     "timelineOrder" INTEGER;

-- CreateIndex
CREATE INDEX "Photo_patientId_idx" ON "Photo"("patientId");

-- CreateIndex
CREATE INDEX "Photo_consultationId_idx" ON "Photo"("consultationId");

-- CreateIndex
CREATE INDEX "Photo_zone_idx" ON "Photo"("zone");
