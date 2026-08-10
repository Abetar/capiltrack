-- CreateEnum
CREATE TYPE "AppointmentEventType" AS ENUM ('CREATED', 'CONFIRMED', 'RESCHEDULED', 'CANCELLED', 'COMPLETED', 'NO_SHOW', 'REMINDER_SENT', 'CONFIRMATION_REQUEST_SENT', 'PATIENT_CONFIRMED', 'PATIENT_REQUESTED_DOCTOR');

-- CreateEnum
CREATE TYPE "AppointmentEventSource" AS ENUM ('MANUAL', 'WHATSAPP_AI', 'SYSTEM', 'PATIENT');

-- CreateTable
CREATE TABLE "AppointmentEvent" (
    "id" TEXT NOT NULL,
    "clinicId" TEXT NOT NULL,
    "appointmentId" TEXT NOT NULL,
    "actorUserId" TEXT,
    "type" "AppointmentEventType" NOT NULL,
    "source" "AppointmentEventSource" NOT NULL,
    "message" TEXT NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AppointmentEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AppointmentEvent_clinicId_idx" ON "AppointmentEvent"("clinicId");

-- CreateIndex
CREATE INDEX "AppointmentEvent_appointmentId_idx" ON "AppointmentEvent"("appointmentId");

-- CreateIndex
CREATE INDEX "AppointmentEvent_actorUserId_idx" ON "AppointmentEvent"("actorUserId");

-- CreateIndex
CREATE INDEX "AppointmentEvent_type_idx" ON "AppointmentEvent"("type");

-- CreateIndex
CREATE INDEX "AppointmentEvent_source_idx" ON "AppointmentEvent"("source");

-- CreateIndex
CREATE INDEX "AppointmentEvent_createdAt_idx" ON "AppointmentEvent"("createdAt");

-- CreateIndex
CREATE INDEX "AppointmentEvent_clinicId_createdAt_idx" ON "AppointmentEvent"("clinicId", "createdAt");

-- CreateIndex
CREATE INDEX "AppointmentEvent_appointmentId_createdAt_idx" ON "AppointmentEvent"("appointmentId", "createdAt");

-- AddForeignKey
ALTER TABLE "AppointmentEvent" ADD CONSTRAINT "AppointmentEvent_clinicId_fkey" FOREIGN KEY ("clinicId") REFERENCES "Clinic"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AppointmentEvent" ADD CONSTRAINT "AppointmentEvent_appointmentId_fkey" FOREIGN KEY ("appointmentId") REFERENCES "Appointment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AppointmentEvent" ADD CONSTRAINT "AppointmentEvent_actorUserId_fkey" FOREIGN KEY ("actorUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
