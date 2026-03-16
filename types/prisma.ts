import { Prisma } from "@prisma/client";

/*
|--------------------------------------------------------------------------
| PATIENT
|--------------------------------------------------------------------------
*/

export type PatientFull = Prisma.PatientGetPayload<{
  include: {
    consultations: true;
    treatments: true;
  };
}>;

/*
|--------------------------------------------------------------------------
| CONSULTATION
|--------------------------------------------------------------------------
*/

export type ConsultationFull = Prisma.ConsultationGetPayload<{
  include: {
    patient: true;
    photos: true;
    metrics: true;
  };
}>;

/*
|--------------------------------------------------------------------------
| PHOTO
|--------------------------------------------------------------------------
*/

export type PhotoWithConsultation = Prisma.PhotoGetPayload<{
  include: {
    consultation: true;
  };
}>;

/*
|--------------------------------------------------------------------------
| PROCEDURE SIMPLE
|--------------------------------------------------------------------------
*/

export type Procedure = Prisma.TransplantProcedureGetPayload<{}>;

/*
|--------------------------------------------------------------------------
| PROCEDURE WITH RELATIONS
|--------------------------------------------------------------------------
*/

export type ProcedureFull = Prisma.TransplantProcedureGetPayload<{
  include: {
    patient: true;
  };
}>;