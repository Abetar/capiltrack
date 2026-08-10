import type { AiInterpretedInput } from "./types";

type ValidateInterpretedTimeInput = {
  message: string;
  interpretation: AiInterpretedInput;
};

function normalizeMessage(value: string) {
  return value
    .trim()
    .toLocaleLowerCase("es-MX")
    .replace(/[¡!¿?,.]/g, " ")
    .replace(/\s+/g, " ");
}

function hasExplicitDayPeriod(message: string) {
  return (
    /\b(?:am|a m|pm|p m)\b/.test(message) ||
    /\bmañana\b/.test(message) ||
    /\btarde\b/.test(message) ||
    /\bnoche\b/.test(message) ||
    /\bmediodía\b/.test(message) ||
    /\bmediodia\b/.test(message)
  );
}

function hasBareTwelveHourTime(message: string) {
  return /\ba las\s+(?:[1-9]|1[0-2])(?:[:.][0-5]\d)?\b/.test(
    message,
  );
}

export function validateInterpretedTime({
  message,
  interpretation,
}: ValidateInterpretedTimeInput): AiInterpretedInput {
  const normalizedMessage = normalizeMessage(message);

  const ambiguousBareTime =
    interpretation.timePreference === "EXACT" &&
    hasBareTwelveHourTime(normalizedMessage) &&
    !hasExplicitDayPeriod(normalizedMessage);

  if (!ambiguousBareTime) {
    return interpretation;
  }

  return {
    ...interpretation,

    resolvedStartTime: null,

    isAmbiguous: true,

    ambiguityReason:
      interpretation.ambiguityReason ??
      "La hora indicada no especifica si corresponde a la mañana o a la tarde.",
  };
}