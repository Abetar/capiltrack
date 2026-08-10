import { addDays, format, parseISO } from "date-fns";

import {
  getAvailableSlots,
  type AvailableSlot,
} from "./getAvailableSlots";

type GetNextAvailableSlotsInput = {
  clinicId: string;
  fromDate: string;

  appointmentMinutes?: number;

  maxDaysToSearch?: number;
  maxSlots?: number;

  now?: Date;
};

export type NextAvailableSlotsResult = {
  date: string;
  slots: AvailableSlot[];
} | null;

function isValidDateString(value: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

export async function getNextAvailableSlots({
  clinicId,
  fromDate,
  appointmentMinutes,
  maxDaysToSearch = 30,
  maxSlots = 3,
  now = new Date(),
}: GetNextAvailableSlotsInput): Promise<NextAvailableSlotsResult> {
  if (!clinicId.trim()) {
    throw new Error("clinicId is required");
  }

  if (!isValidDateString(fromDate)) {
    throw new Error("fromDate must use YYYY-MM-DD format");
  }

  if (!Number.isInteger(maxDaysToSearch) || maxDaysToSearch <= 0) {
    throw new Error("maxDaysToSearch must be a positive integer");
  }

  if (!Number.isInteger(maxSlots) || maxSlots <= 0) {
    throw new Error("maxSlots must be a positive integer");
  }

  const startDate = parseISO(fromDate);

  if (Number.isNaN(startDate.getTime())) {
    throw new Error("fromDate is invalid");
  }

  for (let offset = 0; offset < maxDaysToSearch; offset++) {
    const candidateDate = format(
      addDays(startDate, offset),
      "yyyy-MM-dd",
    );

    const slots = await getAvailableSlots({
      clinicId,
      date: candidateDate,
      appointmentMinutes,
      now,
    });

    if (slots.length > 0) {
      return {
        date: candidateDate,
        slots: slots.slice(0, maxSlots),
      };
    }
  }

  return null;
}