export function normalizePhoneNumber(value: string) {
  const trimmedValue = value.trim();

  if (!trimmedValue) {
    return "";
  }

  let digitsOnly = trimmedValue.replace(/\D/g, "");

  if (!digitsOnly) {
    return "";
  }

  /*
   * Meta puede entregar números móviles mexicanos
   * usando el formato histórico +521XXXXXXXXXX.
   *
   * Para llamadas a la Cloud API debemos utilizar
   * el formato E.164 actual: +52XXXXXXXXXX.
   */
  if (
    digitsOnly.startsWith("521") &&
    digitsOnly.length === 13
  ) {
    digitsOnly = `52${digitsOnly.slice(3)}`;
  }

  return `+${digitsOnly}`;
}