import { fromZonedTime, formatInTimeZone } from "date-fns-tz";

const MONTHS = [
  "enero",
  "febrero",
  "marzo",
  "abril",
  "mayo",
  "junio",
  "julio",
  "agosto",
  "septiembre",
  "octubre",
  "noviembre",
  "diciembre",
];

const WEEKDAYS = [
  "domingo",
  "lunes",
  "martes",
  "miércoles",
  "jueves",
  "viernes",
  "sábado",
];

function formatTime(value: string) {
  const [hoursText, minutes] = value.split(":");
  const hours = Number(hoursText);

  if (!Number.isInteger(hours)) {
    return value;
  }

  const period = hours >= 12 ? "p. m." : "a. m.";
  const normalizedHours = hours % 12 || 12;

  return `${normalizedHours}:${minutes} ${period}`;
}

export function formatAppointmentDateTime({
  date,
  time,
  timezone,
}: {
  date: string;
  time: string;
  timezone: string;
}) {
  const zonedDate = fromZonedTime(
    `${date}T12:00:00`,
    timezone,
  );

  const weekdayIndex = Number(
    formatInTimeZone(zonedDate, timezone, "i"),
  ) % 7;

  const day = Number(
    formatInTimeZone(zonedDate, timezone, "d"),
  );

  const monthIndex =
    Number(
      formatInTimeZone(zonedDate, timezone, "M"),
    ) - 1;

  return `${WEEKDAYS[weekdayIndex]} ${day} de ${MONTHS[monthIndex]} a las ${formatTime(
    time,
  )}`;
}