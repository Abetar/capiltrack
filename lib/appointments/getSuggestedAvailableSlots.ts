import { getAvailableSlots, type AvailableSlot } from "./getAvailableSlots";
import { getNextAvailableSlots } from "./getNextAvailableSlots";

type GetSuggestedAvailableSlotsInput = {
  clinicId: string;
  requestedDate: string;

  appointmentMinutes?: number;

  requestedStartTime?: string | null;
  afterTime?: string | null;
  beforeTime?: string | null;

  maxSlots?: number;
  maxDaysToSearch?: number;

  now?: Date;
};

export type SuggestedAvailableSlotsResult = {
  requestedDate: string;

  resolvedDate: string;

  exactMatch: boolean;
  usedFallbackDate: boolean;

  slots: AvailableSlot[];
} | null;

function isValidTime(value: string) {
  return /^([01]\d|2[0-3]):[0-5]\d$/.test(value);
}

function timeToMinutes(value: string) {
  const [hours, minutes] = value.split(":").map(Number);

  return hours * 60 + minutes;
}

function filterSlots({
  slots,
  requestedStartTime,
  afterTime,
  beforeTime,
}: {
  slots: AvailableSlot[];
  requestedStartTime?: string | null;
  afterTime?: string | null;
  beforeTime?: string | null;
}) {
  if (requestedStartTime) {
    return slots.filter(
      (slot) => slot.localStartTime === requestedStartTime,
    );
  }

  return slots.filter((slot) => {
    const slotMinutes = timeToMinutes(slot.localStartTime);

    if (
      afterTime &&
      slotMinutes <= timeToMinutes(afterTime)
    ) {
      return false;
    }

    if (
      beforeTime &&
      slotMinutes >= timeToMinutes(beforeTime)
    ) {
      return false;
    }

    return true;
  });
}

export async function getSuggestedAvailableSlots({
  clinicId,
  requestedDate,
  appointmentMinutes,
  requestedStartTime = null,
  afterTime = null,
  beforeTime = null,
  maxSlots = 3,
  maxDaysToSearch = 30,
  now = new Date(),
}: GetSuggestedAvailableSlotsInput): Promise<SuggestedAvailableSlotsResult> {
  if (!clinicId.trim()) {
    throw new Error("clinicId is required");
  }

  if (requestedStartTime && !isValidTime(requestedStartTime)) {
    throw new Error(
      "requestedStartTime must use HH:mm format",
    );
  }

  if (afterTime && !isValidTime(afterTime)) {
    throw new Error("afterTime must use HH:mm format");
  }

  if (beforeTime && !isValidTime(beforeTime)) {
    throw new Error("beforeTime must use HH:mm format");
  }

  const requestedDateSlots = await getAvailableSlots({
    clinicId,
    date: requestedDate,
    appointmentMinutes,
    now,
  });

  const matchingRequestedDateSlots = filterSlots({
    slots: requestedDateSlots,
    requestedStartTime,
    afterTime,
    beforeTime,
  });

  if (matchingRequestedDateSlots.length > 0) {
    return {
      requestedDate,
      resolvedDate: requestedDate,
      exactMatch: Boolean(requestedStartTime),
      usedFallbackDate: false,
      slots: matchingRequestedDateSlots.slice(0, maxSlots),
    };
  }

  /*
   * Si la fecha pedida sí tiene otros horarios disponibles,
   * primero los ofrecemos antes de saltar a otro día.
   */
  if (requestedDateSlots.length > 0) {
    const alternativeSlots = requestedStartTime
      ? requestedDateSlots.filter(
          (slot) =>
            timeToMinutes(slot.localStartTime) >
            timeToMinutes(requestedStartTime),
        )
      : requestedDateSlots;

    if (alternativeSlots.length > 0) {
      return {
        requestedDate,
        resolvedDate: requestedDate,
        exactMatch: false,
        usedFallbackDate: false,
        slots: alternativeSlots.slice(0, maxSlots),
      };
    }
  }

  /*
   * No queda nada útil en la fecha solicitada.
   * Buscamos la siguiente fecha con disponibilidad real.
   */
  const nextAvailability = await getNextAvailableSlots({
    clinicId,
    fromDate: requestedDate,
    appointmentMinutes,
    maxDaysToSearch,
    maxSlots,
    now,
  });

  if (!nextAvailability) {
    return null;
  }

  /*
   * getNextAvailableSlots incluye requestedDate.
   * Si acabamos aquí y devolvió el mismo día,
   * usamos esos slots disponibles como fallback.
   */
  return {
    requestedDate,
    resolvedDate: nextAvailability.date,
    exactMatch: false,
    usedFallbackDate:
      nextAvailability.date !== requestedDate,
    slots: nextAvailability.slots.slice(0, maxSlots),
  };
}