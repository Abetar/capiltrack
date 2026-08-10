import { addDays, format, parseISO } from "date-fns";

const WEEKDAYS: Record<string, number> = {
  domingo: 0,
  lunes: 1,
  martes: 2,
  miércoles: 3,
  miercoles: 3,
  jueves: 4,
  viernes: 5,
  sábado: 6,
  sabado: 6,
};

type ResolveRelativeDateInput = {
  message: string;
  currentDate: string;
};

export function resolveRelativeDate({
  message,
  currentDate,
}: ResolveRelativeDateInput): string | null {
  const normalizedMessage = message
    .trim()
    .toLocaleLowerCase("es-MX")
    .replace(/[¡!¿?,.]/g, " ")
    .replace(/\s+/g, " ");

  const baseDate = parseISO(currentDate);

  if (Number.isNaN(baseDate.getTime())) {
    throw new Error("currentDate must use YYYY-MM-DD format");
  }

  if (/\bhoy\b/.test(normalizedMessage)) {
    return format(baseDate, "yyyy-MM-dd");
  }

  if (/\bmañana\b/.test(normalizedMessage)) {
    return format(
      addDays(baseDate, 1),
      "yyyy-MM-dd",
    );
  }

  for (const [weekdayName, targetDay] of Object.entries(
    WEEKDAYS,
  )) {
    const pattern = new RegExp(`\\b${weekdayName}\\b`, "i");

    if (!pattern.test(normalizedMessage)) {
      continue;
    }

    const currentDay = baseDate.getDay();

    let daysUntilTarget =
      (targetDay - currentDay + 7) % 7;

    // "el viernes" significa el próximo viernes.
    // Si hoy ya es viernes, usamos el viernes siguiente.
    if (daysUntilTarget === 0) {
      daysUntilTarget = 7;
    }

    return format(
      addDays(baseDate, daysUntilTarget),
      "yyyy-MM-dd",
    );
  }

  return null;
}