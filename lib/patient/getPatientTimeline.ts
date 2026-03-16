import { prisma } from "@/lib/db/prisma";

export type TimelineConsultation = {
  id: string;
  patientId: string;
  date: Date;
  norwoodLevel: number | null;
  notes: string | null;
  photos: {
    id: string;
    url: string;
    zone: string | null;
    notes: string | null;
    createdAt: Date;
  }[];
  metrics: {
    id: string;
    zone: string | null;
    density: number | null;
    thickness: number | null;
    notes: string | null;
    createdAt: Date;
  }[];
};

export type TimelineTreatment = {
  id: string;
  patientId: string;
  medication: string;
  dosage: string | null;
  frequency: string | null;
  startDate: Date | null;
  endDate: Date | null;
  notes: string | null;
  createdAt: Date;
};

export type TimelineTransplant = {
  id: string;
  patientId: string;
  date: Date;
  technique: string | null;
  method: string | null;
  grafts: number | null;
  donorArea: string | null;
  recipientArea: string | null;
  notes: string | null;
  createdAt: Date;
};

export type TimelineEvent =
  | {
      type: "consultation";
      id: string;
      date: Date;
      consultation: TimelineConsultation;
    }
  | {
      type: "treatment";
      id: string;
      date: Date;
      treatment: TimelineTreatment;
    }
  | {
      type: "transplant";
      id: string;
      date: Date;
      transplant: TimelineTransplant;
    };

export async function getPatientTimeline(
  patientId: string,
  clinicId: string
): Promise<TimelineEvent[]> {
  const [consultations, treatments, transplants] = await Promise.all([
    prisma.consultation.findMany({
      where: {
        patientId,
        clinicId,
      },
      select: {
        id: true,
        patientId: true,
        date: true,
        norwoodLevel: true,
        notes: true,
        photos: {
          select: {
            id: true,
            url: true,
            zone: true,
            notes: true,
            createdAt: true,
          },
          orderBy: {
            createdAt: "desc",
          },
        },
        metrics: {
          select: {
            id: true,
            zone: true,
            density: true,
            thickness: true,
            notes: true,
            createdAt: true,
          },
          orderBy: {
            createdAt: "desc",
          },
        },
      },
      orderBy: {
        date: "desc",
      },
    }),

    prisma.treatment.findMany({
      where: {
        patientId,
        clinicId,
      },
      select: {
        id: true,
        patientId: true,
        medication: true,
        dosage: true,
        frequency: true,
        startDate: true,
        endDate: true,
        notes: true,
        createdAt: true,
      },
      orderBy: [
        {
          startDate: "desc",
        },
        {
          createdAt: "desc",
        },
      ],
    }),

    prisma.transplantProcedure.findMany({
      where: {
        patientId,
        clinicId,
      },
      select: {
        id: true,
        patientId: true,
        date: true,
        technique: true,
        method: true,
        grafts: true,
        donorArea: true,
        recipientArea: true,
        notes: true,
        createdAt: true,
      },
      orderBy: {
        date: "desc",
      },
    }),
  ]);

  const events: TimelineEvent[] = [
    ...consultations.map((consultation) => ({
      type: "consultation" as const,
      id: consultation.id,
      date: consultation.date,
      consultation,
    })),

    ...treatments.map((treatment) => ({
      type: "treatment" as const,
      id: treatment.id,
      date: treatment.startDate ?? treatment.createdAt,
      treatment,
    })),

    ...transplants.map((transplant) => ({
      type: "transplant" as const,
      id: transplant.id,
      date: transplant.date,
      transplant,
    })),
  ];

  events.sort((a, b) => b.date.getTime() - a.date.getTime());

  return events;
}