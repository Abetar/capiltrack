-- CreateTable
CREATE TABLE "ClinicalQuestionnaire" (
    "id" TEXT NOT NULL,
    "clinicId" TEXT NOT NULL,
    "title" TEXT NOT NULL DEFAULT 'Expediente clínico inicial',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ClinicalQuestionnaire_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClinicalQuestion" (
    "id" TEXT NOT NULL,
    "questionnaireId" TEXT NOT NULL,
    "questionText" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "isRequired" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ClinicalQuestion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PatientClinicalAnswer" (
    "id" TEXT NOT NULL,
    "clinicId" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "questionId" TEXT,
    "questionTextSnapshot" TEXT NOT NULL,
    "answerText" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PatientClinicalAnswer_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ClinicalQuestionnaire_clinicId_idx" ON "ClinicalQuestionnaire"("clinicId");

-- CreateIndex
CREATE INDEX "ClinicalQuestion_questionnaireId_idx" ON "ClinicalQuestion"("questionnaireId");

-- CreateIndex
CREATE INDEX "PatientClinicalAnswer_clinicId_idx" ON "PatientClinicalAnswer"("clinicId");

-- CreateIndex
CREATE INDEX "PatientClinicalAnswer_patientId_idx" ON "PatientClinicalAnswer"("patientId");

-- CreateIndex
CREATE INDEX "PatientClinicalAnswer_questionId_idx" ON "PatientClinicalAnswer"("questionId");

-- CreateIndex
CREATE UNIQUE INDEX "PatientClinicalAnswer_patientId_questionId_key" ON "PatientClinicalAnswer"("patientId", "questionId");

-- AddForeignKey
ALTER TABLE "ClinicalQuestionnaire" ADD CONSTRAINT "ClinicalQuestionnaire_clinicId_fkey" FOREIGN KEY ("clinicId") REFERENCES "Clinic"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClinicalQuestion" ADD CONSTRAINT "ClinicalQuestion_questionnaireId_fkey" FOREIGN KEY ("questionnaireId") REFERENCES "ClinicalQuestionnaire"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PatientClinicalAnswer" ADD CONSTRAINT "PatientClinicalAnswer_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PatientClinicalAnswer" ADD CONSTRAINT "PatientClinicalAnswer_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "ClinicalQuestion"("id") ON DELETE SET NULL ON UPDATE CASCADE;
